//
//  PressureSession.swift
//  StrikeLabCaddie
//
//  Phase 5 — pressure-mode practice. Player picks a goal, the watch
//  enforces a shot clock, and every attempt logs HR + biomech alongside
//  the player's intent. The end-of-session diagnosis compares the
//  pressure swings to the player's calm baseline ("Under pressure your
//  tempo went from 3.0 to 2.6 …").
//

import Foundation

/// Pressure session goal. v1 ships with two presets; the data model is
/// open enough for future custom goals (e.g. "8-iron 150 ± 10 yds").
enum PressureGoal: Codable, Equatable {
    /// Fixed number of shots with one specific club, target carry +/- band.
    case targetCarry(club: Club, targetYards: Double, bandYards: Double, attempts: Int)
    /// Hit `attempts` consecutive shots within `bandYards` of `targetYards`.
    case streak(club: Club, targetYards: Double, bandYards: Double, attempts: Int)

    var club: Club {
        switch self {
        case .targetCarry(let c, _, _, _): return c
        case .streak(let c, _, _, _): return c
        }
    }
    var targetYards: Double {
        switch self {
        case .targetCarry(_, let y, _, _): return y
        case .streak(_, let y, _, _): return y
        }
    }
    var bandYards: Double {
        switch self {
        case .targetCarry(_, _, let b, _): return b
        case .streak(_, _, let b, _): return b
        }
    }
    var attempts: Int {
        switch self {
        case .targetCarry(_, _, _, let n): return n
        case .streak(_, _, _, let n): return n
        }
    }
    var titleShort: String {
        let yd = Int(targetYards.rounded())
        let bd = Int(bandYards.rounded())
        let n = attempts
        switch self {
        case .targetCarry(let c, _, _, _):
            return "\(n) × \(c.shortName) @ \(yd) ± \(bd) yds"
        case .streak(let c, _, _, _):
            return "\(n) in a row · \(c.shortName) @ \(yd) ± \(bd) yds"
        }
    }
}

/// One attempt inside a pressure session. Captured live, then graded
/// after the player enters their carry (or the watch GPS computes it).
struct PressureAttempt: Codable, Identifiable, Equatable {
    let id: UUID
    let timestamp: Date
    var feel: Int             // 1-10 from PreShotIntentView
    var commitPhrase: String  // free-text intent
    var motion: SwingMotionData?
    var heartRate: HeartRateData?
    var carryYards: Double?   // nil until graded
    var withinBand: Bool      // computed when carry lands

    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        feel: Int = 7,
        commitPhrase: String = "",
        motion: SwingMotionData? = nil,
        heartRate: HeartRateData? = nil,
        carryYards: Double? = nil,
        withinBand: Bool = false
    ) {
        self.id = id
        self.timestamp = timestamp
        self.feel = feel
        self.commitPhrase = commitPhrase
        self.motion = motion
        self.heartRate = heartRate
        self.carryYards = carryYards
        self.withinBand = withinBand
    }
}

struct PressureSession: Codable, Identifiable, Equatable {
    let id: UUID
    let startedAt: Date
    var endedAt: Date?
    var goal: PressureGoal
    var attempts: [PressureAttempt]

    init(
        id: UUID = UUID(),
        startedAt: Date = Date(),
        endedAt: Date? = nil,
        goal: PressureGoal,
        attempts: [PressureAttempt] = []
    ) {
        self.id = id
        self.startedAt = startedAt
        self.endedAt = endedAt
        self.goal = goal
        self.attempts = attempts
    }

    var attemptsRemaining: Int {
        max(0, goal.attempts - attempts.count)
    }

    var hits: Int {
        attempts.filter { $0.withinBand }.count
    }
}

// MARK: - Diagnosis

/// Plain-English diagnosis of how the player performed under pressure
/// vs. their calm baseline. Generated from comparing the session's
/// swings against a baseline set of recent enhanced shots.
struct PressureDiagnosis: Equatable {
    /// Mean / sigma summary of one metric.
    struct MetricDelta: Equatable {
        let label: String
        let baselineValue: Double
        let pressureValue: Double
        let direction: Direction
        enum Direction: String { case better, worse, sameish }
        var deltaAbs: Double { pressureValue - baselineValue }
    }

    let metrics: [MetricDelta]
    let summary: String  // headline sentence
    let detail: String   // full paragraph

    /// Build a diagnosis from a finished session + a baseline of calm
    /// shots. Returns nil if there isn't enough data to compare.
    static func build(
        session: PressureSession,
        baseline: [EnhancedShotEvent],
        armLengthMeters: Double = 0.70
    ) -> PressureDiagnosis? {
        let club = session.goal.club
        let pressureSwings = session.attempts.compactMap { $0.motion }
        let baselineSwings = baseline
            .filter { $0.club == club }
            .compactMap { $0.motionData }
        guard pressureSwings.count >= 3, baselineSwings.count >= 3 else { return nil }

        func tempoOf(_ ms: [SwingMotionData]) -> [Double] {
            ms.compactMap { SwingAnalytics.tempo($0).ratio }
        }
        func handMphOf(_ ms: [SwingMotionData]) -> [Double] {
            ms.map {
                SwingAnalytics.speeds($0, club: club, armLengthMeters: armLengthMeters)
                    .handSpeedMph
            }
        }
        func hrOf(_ events: [EnhancedShotEvent]) -> [Double] {
            events.compactMap { $0.heartRateData?.heartRate }.filter { $0 > 0 }
        }
        func mean(_ xs: [Double]) -> Double {
            xs.isEmpty ? 0 : xs.reduce(0, +) / Double(xs.count)
        }
        func metric(label: String, b: Double, p: Double, lowerIsBetter: Bool, sameishPct: Double = 0.05) -> MetricDelta {
            let pct = b == 0 ? 0 : (p - b) / b
            let dir: MetricDelta.Direction
            if abs(pct) < sameishPct {
                dir = .sameish
            } else if (pct < 0) == lowerIsBetter {
                dir = .better
            } else {
                dir = .worse
            }
            return MetricDelta(label: label, baselineValue: b, pressureValue: p, direction: dir)
        }

        let bTempos = tempoOf(baselineSwings)
        let pTempos = tempoOf(pressureSwings)
        let bHands = handMphOf(baselineSwings)
        let pHands = handMphOf(pressureSwings)
        let pSessionEvents = session.attempts.compactMap { att -> EnhancedShotEvent? in
            guard let m = att.motion else { return nil }
            return EnhancedShotEvent(
                id: att.id,
                timestamp: att.timestamp,
                clubRawValue: club.rawValue,
                confidence: nil,
                isManual: false,
                motionData: m,
                heartRateData: att.heartRate,
                outcomeRawValue: nil,
                missDirectionRawValue: nil
            )
        }
        let bHRs = hrOf(baseline.filter { $0.club == club })
        let pHRs = hrOf(pSessionEvents)

        let metrics: [MetricDelta] = [
            // Tempo down = rushing the transition = bad.
            metric(label: "Tempo ratio",
                   b: mean(bTempos), p: mean(pTempos),
                   lowerIsBetter: false, sameishPct: 0.05),
            // Hand speed dropping under pressure = bailing.
            metric(label: "Hand speed (mph)",
                   b: mean(bHands), p: mean(pHands),
                   lowerIsBetter: false, sameishPct: 0.04),
            // HR up = stress (sometimes "good", but for diagnosis we
            // call it "elevated").
            metric(label: "HR @ impact (bpm)",
                   b: mean(bHRs), p: mean(pHRs),
                   lowerIsBetter: true, sameishPct: 0.03),
        ]

        // Headline: the worst-performing metric.
        let worse = metrics.first(where: { $0.direction == .worse })
        let summary: String = {
            guard let w = worse else { return "Under pressure your swing held up." }
            switch w.label {
            case "Tempo ratio":
                let drop = w.baselineValue - w.pressureValue
                return String(format: "Under pressure your tempo went from %.1f to %.1f. You're rushing the transition.",
                              w.baselineValue, w.pressureValue)
                + (drop > 0.3 ? " That's a big drop." : "")
            case "Hand speed (mph)":
                let drop = w.baselineValue - w.pressureValue
                return String(format: "Hand speed dropped %.1f mph under pressure. You're bailing.", abs(drop))
            case "HR @ impact (bpm)":
                return String(format: "HR @ impact ran %.0f bpm hotter under pressure.",
                              w.pressureValue - w.baselineValue)
            default:
                return "Pressure changed your swing — see the breakdown below."
            }
        }()

        var lines: [String] = [summary]
        for m in metrics {
            let arrow = m.direction == .worse ? "⤓" : (m.direction == .better ? "⤒" : "→")
            lines.append(String(format: "%@  %@: %.1f → %.1f (%@)",
                                arrow, m.label,
                                m.baselineValue, m.pressureValue,
                                m.direction.rawValue))
        }

        return PressureDiagnosis(
            metrics: metrics,
            summary: summary,
            detail: lines.joined(separator: "\n")
        )
    }
}
