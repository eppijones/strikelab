//
//  WatchSwingAnalytics.swift
//  StrikeLabCaddieWatch Watch App
//
//  On-watch derivations used by the post-swing HUD and the consistency
//  bar. Same lever-ratio table as iOS `SwingAnalytics` so the numbers
//  shown on the wrist match the Swing Card on the phone.
//

import Foundation
import Combine
import simd

enum WatchClubLeverRatio {
    /// Heuristic groupings keyed off the watch-side `ClubWatch.shortName`
    /// prefix. Mirrors `SwingAnalytics.SwingLeverRatio` on iOS.
    static func ratio(for club: ClubWatch) -> Double {
        switch club.group {
        case .driver: return 3.20
        case .wood:   return 3.00
        case .hybrid: return 2.90
        case .iron:   return 2.70
        case .wedge:  return 2.40
        case .putt:   return 1.00
        }
    }
}

/// Per-club typical clubhead-speed band (mph). Mirrors
/// `SwingGrade.clubBand(for:)` on iOS so the HUD's green zone matches
/// the Swing Card's green zone for the same club.
enum WatchClubBand {
    static func band(for club: ClubWatch) -> (lo: Double, hi: Double) {
        switch club.group {
        case .driver: return (90, 115)
        case .wood:   return (80, 105)
        case .hybrid: return (75, 95)
        case .iron:
            switch club {
            case .iron3, .iron4: return (75, 90)
            case .iron5, .iron6: return (70, 85)
            case .iron7:         return (65, 82)
            case .iron8:         return (62, 78)
            case .iron9:         return (58, 74)
            default:             return (60, 80)
            }
        case .wedge:  return (50, 70)
        case .putt:   return (5, 25)
        }
    }
}

enum WatchSwingAnalytics {

    /// Estimated clubhead and hand speed (mph).
    static func speeds(
        for motion: SwingMotionDataWatch,
        club: ClubWatch,
        armLengthMeters: Double = 0.70
    ) -> (handMph: Double, clubMph: Double) {
        let mps = motion.peakRotationRate * armLengthMeters
        let mph = mps * 2.23694
        let lever = WatchClubLeverRatio.ratio(for: club)
        return (handMph: mph, clubMph: mph * lever)
    }

    /// Tempo ratio: backswing time / downswing time. Pros sit at ~3.0.
    static func tempoRatio(for motion: SwingMotionDataWatch) -> Double? {
        let p = motion.phases
        let dt = motion.sampleInterval
        let bw = max(0.0, Double(p.topIdx - p.backswingStartIdx)) * dt
        let dw = max(0.0, Double(p.impactIdx - p.topIdx)) * dt
        if p.unreliable { return nil }
        guard bw > 0, dw > 0.001 else { return nil }
        return bw / dw
    }

    /// Principal eigenvector of the rotation-rate covariance during the
    /// downswing window, computed via 24 iterations of the power method.
    /// Sign-normalised so x ≥ 0 for byte-stable comparisons.
    static func planeAxis(for motion: SwingMotionDataWatch) -> SIMD3<Double> {
        let p = motion.phases
        guard p.impactIdx > p.topIdx + 1,
              motion.samples.count > p.impactIdx else {
            return SIMD3<Double>(1, 0, 0)
        }
        let slice = motion.samples[p.topIdx...p.impactIdx]
        let n = Double(slice.count)
        guard n > 1 else { return SIMD3<Double>(1, 0, 0) }
        var mean = SIMD3<Double>(0, 0, 0)
        for s in slice { mean += SIMD3(s.gx, s.gy, s.gz) }
        mean /= n
        var c00 = 0.0, c01 = 0.0, c02 = 0.0, c11 = 0.0, c12 = 0.0, c22 = 0.0
        for s in slice {
            let v = SIMD3(s.gx, s.gy, s.gz) - mean
            c00 += v.x * v.x; c01 += v.x * v.y; c02 += v.x * v.z
            c11 += v.y * v.y; c12 += v.y * v.z; c22 += v.z * v.z
        }
        c00 /= n; c01 /= n; c02 /= n; c11 /= n; c12 /= n; c22 /= n
        let cov = simd_double3x3(rows: [
            SIMD3<Double>(c00, c01, c02),
            SIMD3<Double>(c01, c11, c12),
            SIMD3<Double>(c02, c12, c22)
        ])
        var v = simd_normalize(SIMD3<Double>(1, 1, 1))
        for _ in 0..<24 {
            let next = cov * v
            let m = simd_length(next)
            if m < 1e-12 { break }
            v = next / m
        }
        if v.x < 0 { v = -v }
        return v
    }

    /// Angle (degrees) between two unit vectors. Returns nil when either
    /// is too short to be a meaningful direction.
    static func angleDegrees(between a: SIMD3<Double>, and b: SIMD3<Double>) -> Double? {
        let la = simd_length(a)
        let lb = simd_length(b)
        guard la > 1e-6, lb > 1e-6 else { return nil }
        let dot = simd_dot(a, b) / (la * lb)
        let clamped = min(1.0, max(-1.0, dot))
        return acos(clamped) * 180.0 / .pi
    }
}

// MARK: - Reference baseline tracker

/// Rolling baseline of "good" reference swings, scoped to one club. Used
/// by the post-swing HUD (plane delta vs reference) and the consistency
/// bar (in-window streak counter). Stored in-memory only — full history
/// lives on the phone.
@MainActor
final class WatchReferenceBaseline: ObservableObject {

    /// Most recent ~20 swings the player marked as "good" (or that the
    /// auto-confidence threshold accepted).
    @Published private(set) var entries: [Entry] = []
    private let maxEntries = 20

    struct Entry: Equatable {
        let club: ClubWatch
        let clubMph: Double
        let tempoRatio: Double?
        let planeAxis: SIMD3<Double>
    }

    func append(_ entry: Entry) {
        entries.append(entry)
        if entries.count > maxEntries {
            entries.removeFirst(entries.count - maxEntries)
        }
    }

    /// Median values for the given club, or nil if we have <3 samples.
    func median(for club: ClubWatch) -> Entry? {
        let same = entries.filter { $0.club == club }
        guard same.count >= 3 else { return nil }
        let mphSorted = same.map(\.clubMph).sorted()
        let medianMph = mphSorted[mphSorted.count / 2]
        let ratios = same.compactMap(\.tempoRatio).sorted()
        let medianRatio = ratios.isEmpty ? nil : ratios[ratios.count / 2]
        var sumPlane = SIMD3<Double>(0, 0, 0)
        for s in same { sumPlane += s.planeAxis }
        let planeMag = simd_length(sumPlane)
        let planeMedian = planeMag > 1e-6 ? sumPlane / planeMag : SIMD3<Double>(1, 0, 0)
        return Entry(
            club: club,
            clubMph: medianMph,
            tempoRatio: medianRatio,
            planeAxis: planeMedian
        )
    }

    /// Whether `entry` is within the in-window envelope (±5 mph,
    /// ±0.20 tempo ratio) of the median for the same club. Used by
    /// the consistency bar.
    func isOnBaseline(_ entry: Entry) -> Bool {
        guard let med = median(for: entry.club) else { return false }
        let mphOK = abs(entry.clubMph - med.clubMph) <= 5.0
        let tempoOK: Bool
        if let a = entry.tempoRatio, let b = med.tempoRatio {
            tempoOK = abs(a - b) <= 0.20
        } else {
            tempoOK = true
        }
        return mphOK && tempoOK
    }
}
