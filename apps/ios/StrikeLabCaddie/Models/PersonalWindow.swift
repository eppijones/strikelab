//
//  PersonalWindow.swift
//  StrikeLabCaddie
//
//  Per-player, per-club "personal window" for swing metrics — median ±
//  spread from the last N good swings (grade ≥ 70 or pinned reference),
//  with deterministic fallbacks when sampleCount < 8.
//

import Foundation
import simd

// MARK: - Window model

/// Pre-computed bands for range-bar UI, grading, and watch drift detection.
struct PersonalWindow: Codable, Equatable, Sendable {
    /// `Club.rawValue`
    let clubKey: String

    /// Swings used after the good-swing filter (capped at 200).
    let sampleCount: Int

    let updatedAt: Date

    // MARK: Tempo ratio (backswing / downswing)

    let tempoWindowLo: Double
    let tempoWindowHi: Double
    let tempoCareerLo: Double
    let tempoCareerHi: Double

    // MARK: Backswing duration (s)

    let backswingWindowLo: Double
    let backswingWindowHi: Double
    let backswingCareerLo: Double
    let backswingCareerHi: Double

    // MARK: Hand speed (mph)

    let handWindowLo: Double
    let handWindowHi: Double
    let handCareerLo: Double
    let handCareerHi: Double

    // MARK: Plane — reference axis + delta band (degrees to that axis)

    let planeAxisX: Double
    let planeAxisY: Double
    let planeAxisZ: Double

    /// Typical angle between swing plane axis and `referenceAxis` (°).
    let planeDeltaMedianDeg: Double

    let planeDeltaWindowLo: Double
    let planeDeltaWindowHi: Double
    let planeDeltaCareerLo: Double
    let planeDeltaCareerHi: Double

    // MARK: HR reserve fraction (0…1)

    let hrWindowLo: Double
    let hrWindowHi: Double
    let hrCareerLo: Double
    let hrCareerHi: Double

    var referenceAxis: SIMD3<Double> {
        let v = SIMD3(planeAxisX, planeAxisY, planeAxisZ)
        let len = simd_length(v)
        guard len > 1e-6 else { return SIMD3(1, 0, 0) }
        var u = v / len
        if u.x < 0 { u = -u }
        return u
    }

    /// True when `value` lies inside the personal tempo window.
    func tempoContains(_ ratio: Double) -> Bool {
        ratio >= tempoWindowLo && ratio <= tempoWindowHi
    }

    func handContains(_ mph: Double) -> Bool {
        mph >= handWindowLo && mph <= handWindowHi
    }

    func planeDeltaContains(_ deltaDeg: Double) -> Bool {
        deltaDeg >= planeDeltaWindowLo && deltaDeg <= planeDeltaWindowHi
    }

    func hrContains(_ frac: Double?) -> Bool {
        guard let frac else { return false }
        return frac >= hrWindowLo && frac <= hrWindowHi
    }

    // MARK: Fallback (fixed tour-adjacent priors)

    /// Static prior windows when we don't yet have ≥8 good samples.
    static func fallback(for club: Club) -> PersonalWindow {
        let key = club.rawValue
        let band = SwingGrade.clubBand(for: club)
        let lever = SwingLeverRatio.ratio(for: club)
        let handLo = band.lo / lever
        let handHi = band.hi / lever
        let pad = max(4.0, (handHi - handLo) * 0.35)
        return PersonalWindow(
            clubKey: key,
            sampleCount: 0,
            updatedAt: Date(),
            tempoWindowLo: 2.7,
            tempoWindowHi: 3.3,
            tempoCareerLo: 2.0,
            tempoCareerHi: 4.2,
            backswingWindowLo: 0.55,
            backswingWindowHi: 1.05,
            backswingCareerLo: 0.25,
            backswingCareerHi: 1.60,
            handWindowLo: handLo,
            handWindowHi: handHi,
            handCareerLo: max(10, handLo - pad),
            handCareerHi: handHi + pad,
            planeAxisX: 1,
            planeAxisY: 0,
            planeAxisZ: 0,
            planeDeltaMedianDeg: 6,
            planeDeltaWindowLo: 0,
            planeDeltaWindowHi: 12,
            planeDeltaCareerLo: 0,
            planeDeltaCareerHi: 28,
            hrWindowLo: 0.12,
            hrWindowHi: 0.62,
            hrCareerLo: 0,
            hrCareerHi: 1
        )
    }
}

// MARK: - Engine

enum PersonalWindowEngine {

    private static let maxSwings = 200
    private static let minPersonalSamples = 8
    private static let gradeFloor = 70
    /// Half-width multiplier on std-dev for the green window.
    private static let kStd: Double = 1.25

    private struct TaggedMotion {
        let id: UUID
        let timestamp: Date
        let motion: SwingMotionData
        let heartRate: HeartRateData?
    }

    /// Recompute windows for every club that appears in `shotsByClub`.
    static func recomputeAll(
        shotsByClub: [String: [PracticeShot]],
        roundShotsByClub: [String: [Shot]],
        pinnedSwingIds: [String: UUID],
        armLengthMeters: Double,
        restingBpm: Double,
        ageYears: Int
    ) -> [String: PersonalWindow] {
        var out: [String: PersonalWindow] = [:]
        var keys = Set(shotsByClub.keys)
        keys.formUnion(roundShotsByClub.keys)

        for key in keys {
            guard let club = Club(rawValue: key) else { continue }
            var pool: [TaggedMotion] = []
            for s in shotsByClub[key] ?? [] {
                if let m = s.motion {
                    pool.append(TaggedMotion(id: s.id, timestamp: s.timestamp, motion: m, heartRate: s.heartRate))
                }
            }
            for s in roundShotsByClub[key] ?? [] {
                if let m = s.motion {
                    pool.append(TaggedMotion(id: s.id, timestamp: s.timestamp, motion: m, heartRate: s.heartRate))
                }
            }
            pool.sort { $0.timestamp > $1.timestamp }
            if pool.count > maxSwings { pool = Array(pool.prefix(maxSwings)) }

            if let w = compute(
                for: club,
                pool: pool,
                pinnedId: pinnedSwingIds[key],
                armLengthMeters: armLengthMeters,
                restingBpm: restingBpm,
                ageYears: ageYears
            ) {
                out[key] = w
            } else {
                out[key] = PersonalWindow.fallback(for: club)
            }
        }
        return out
    }

    private static func compute(
        for club: Club,
        pool: [TaggedMotion],
        pinnedId: UUID?,
        armLengthMeters: Double,
        restingBpm: Double,
        ageYears: Int
    ) -> PersonalWindow? {
        guard !pool.isEmpty else { return nil }

        // Pass 1 — rough reference axis from all non-unreliable swings.
        let axesAll: [SIMD3<Double>] = pool.compactMap { tag in
            guard !tag.motion.phases.unreliable else { return nil }
            return simd_normalize(SwingAnalytics.plane(tag.motion).axis)
        }
        let roughRef: SIMD3<Double> = {
            guard !axesAll.isEmpty else { return SIMD3(1, 0, 0) }
            var s = SIMD3<Double>(0, 0, 0)
            for a in axesAll { s += a }
            let len = simd_length(s)
            guard len > 1e-6 else { return SIMD3(1, 0, 0) }
            var u = s / len
            if u.x < 0 { u = -u }
            return u
        }()

        // Summaries for grading filter
        struct Row {
            let id: UUID
            let motion: SwingMotionData
            let hr: HeartRateData?
            let summary: SwingSummary
            let grade: Int
            let shotTime: Date
        }

        var rows: [Row] = []
        for tag in pool {
            if tag.motion.phases.unreliable { continue }
            let summary = SwingAnalytics.summary(
                for: tag.motion,
                club: club,
                hr: tag.heartRate,
                armLengthMeters: armLengthMeters,
                restingBpm: restingBpm,
                playerAgeYears: ageYears
            )
            let g = SwingGrade.compute(summary: summary, referencePlane: roughRef, personalWindow: nil)
            rows.append(Row(id: tag.id, motion: tag.motion, hr: tag.heartRate, summary: summary, grade: g.value, shotTime: tag.timestamp))
        }

        guard !rows.isEmpty else { return nil }

        let good = rows.filter { row in
            if row.grade >= gradeFloor { return true }
            if let pin = pinnedId, row.id == pin { return true }
            return false
        }

        let statsRows: [Row]
        if good.count >= minPersonalSamples {
            statsRows = good
        } else if rows.count >= minPersonalSamples {
            statsRows = rows
        } else {
            return nil
        }

        // Reference axis from statsRows
        let axes: [SIMD3<Double>] = statsRows.map { simd_normalize($0.summary.plane.axis) }
        let ref = meanAxis(axes)

        let tempos: [Double] = statsRows.compactMap { $0.summary.tempo.ratio }
        let backs: [Double] = statsRows.map { $0.summary.tempo.backswingSeconds }
        let hands: [Double] = statsRows.map { $0.summary.speeds.handSpeedMph }
        let deltas: [Double] = statsRows.map {
            angleDegrees(between: simd_normalize($0.summary.plane.axis), and: ref)
        }
        let hrs: [Double] = statsRows.compactMap { $0.summary.pressure?.value }

        guard !tempos.isEmpty, !backs.isEmpty, !hands.isEmpty else { return nil }

        let (tMed, tStd) = robustCenterSpread(tempos)
        let (bMed, bStd) = robustCenterSpread(backs)
        let (hMed, hStd) = robustCenterSpread(hands)
        let (dMed, dStd) = robustCenterSpread(deltas)

        let (hrMed, hrStd): (Double, Double) = {
            guard hrs.count >= 4 else { return (0.35, 0.18) }
            return robustCenterSpread(hrs)
        }()

        func window(_ m: Double, _ s: Double, minWidth: Double) -> (lo: Double, hi: Double) {
            let half = max(minWidth * 0.5, Self.kStd * s)
            return (m - half, m + half)
        }

        let tw = window(tMed, tStd, minWidth: 0.35)
        let bw = window(bMed, bStd, minWidth: 0.12)
        let hw = window(hMed, hStd, minWidth: 6)
        let dw = window(dMed, dStd, minWidth: 4)
        let hrw = window(hrMed, hrStd, minWidth: 0.12)

        let uref = ref
        let key = club.rawValue

        return PersonalWindow(
            clubKey: key,
            sampleCount: statsRows.count,
            updatedAt: Date(),
            tempoWindowLo: max(1.5, tw.lo),
            tempoWindowHi: min(5.0, tw.hi),
            tempoCareerLo: max(1.2, (tempos.min() ?? tw.lo) - 0.25),
            tempoCareerHi: min(5.5, (tempos.max() ?? tw.hi) + 0.25),
            backswingWindowLo: max(0.2, bw.lo),
            backswingWindowHi: min(1.8, bw.hi),
            backswingCareerLo: max(0.15, (backs.min() ?? bw.lo) - 0.08),
            backswingCareerHi: min(2.0, (backs.max() ?? bw.hi) + 0.08),
            handWindowLo: max(8, hw.lo),
            handWindowHi: min(130, hw.hi),
            handCareerLo: max(5, (hands.min() ?? hw.lo) - 5),
            handCareerHi: min(140, (hands.max() ?? hw.hi) + 5),
            planeAxisX: uref.x,
            planeAxisY: uref.y,
            planeAxisZ: uref.z,
            planeDeltaMedianDeg: dMed,
            planeDeltaWindowLo: max(0, dw.lo),
            planeDeltaWindowHi: min(40, dw.hi),
            planeDeltaCareerLo: max(0, (deltas.min() ?? dw.lo) - 2),
            planeDeltaCareerHi: min(45, (deltas.max() ?? dw.hi) + 2),
            hrWindowLo: max(0, hrw.lo),
            hrWindowHi: min(1, hrw.hi),
            hrCareerLo: 0,
            hrCareerHi: 1
        )
    }

    private static func meanAxis(_ axes: [SIMD3<Double>]) -> SIMD3<Double> {
        guard !axes.isEmpty else { return SIMD3(1, 0, 0) }
        var s = SIMD3<Double>(0, 0, 0)
        for a in axes { s += a }
        let len = simd_length(s)
        guard len > 1e-6 else { return SIMD3(1, 0, 0) }
        var u = s / len
        if u.x < 0 { u = -u }
        return u
    }

    private static func robustCenterSpread(_ values: [Double]) -> (Double, Double) {
        guard !values.isEmpty else { return (0, 1) }
        let sorted = values.sorted()
        let n = sorted.count
        let median: Double = {
            if n.isMultiple(of: 2) {
                return (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            }
            return sorted[n / 2]
        }()
        let mean = sorted.reduce(0, +) / Double(n)
        let varSum = sorted.map { ($0 - mean) * ($0 - mean) }.reduce(0, +)
        let std = (varSum / Double(max(1, n - 1))).squareRoot()
        // Avoid zero width.
        let sigma = max(std, median * 0.04 + 1e-6)
        return (median, sigma)
    }

    /// Build per-club shot pools from practice sessions + live + round.
    static func collectShots(
        practiceSessions: [PracticeSession],
        liveRangeSession: PracticeSession?,
        currentRound: Round?
    ) -> (practice: [String: [PracticeShot]], round: [String: [Shot]]) {
        var pBy: [String: [PracticeShot]] = [:]
        var rBy: [String: [Shot]] = [:]

        func addP(_ shot: PracticeShot) {
            pBy[shot.club.rawValue, default: []].append(shot)
        }
        func addR(_ shot: Shot) {
            rBy[shot.club.rawValue, default: []].append(shot)
        }

        for session in practiceSessions {
            for shot in session.shots { addP(shot) }
        }
        if let live = liveRangeSession {
            for shot in live.shots { addP(shot) }
        }
        if let round = currentRound {
            for shot in round.shots { addR(shot) }
        }
        return (pBy, rBy)
    }
}
