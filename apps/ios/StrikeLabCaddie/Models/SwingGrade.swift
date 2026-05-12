//
//  SwingGrade.swift
//  StrikeLabCaddie
//
//  Computes a 0-100 swing grade out of the four signals we already
//  derive (tempo ratio, plane consistency, smoothness, speed-vs-band)
//  plus a one-line plain-English verdict the player can read in <1s.
//
//  This is the headline at the top of the SwingCard. The detailed
//  metric sections beneath remain for power users; the grade is for
//  the "did I do that right?" moment.
//

import Foundation
import SwiftUI
import simd

struct SwingGrade: Equatable {

    /// 0-100 composite score.
    let value: Int

    /// Discrete tier — drives the colour and the big label.
    let tier: Tier

    /// Single sentence — what to take away from this swing.
    let headline: String

    /// Per-dimension breakdown. Each dimension contributes up to
    /// `Dimension.maxPoints` to the composite. UI shows the chip row
    /// underneath the big number.
    let dimensions: [Dimension]

    enum Tier: String, Equatable {
        case elite = "ELITE"
        case great = "GREAT"
        case solid = "SOLID"
        case work  = "WORK"

        var color: Color {
            switch self {
            case .elite, .great: return Theme.accent
            case .solid:         return Theme.warn
            case .work:          return Theme.bad
            }
        }

        static func of(score: Int) -> Tier {
            switch score {
            case 88...:  return .elite
            case 72..<88: return .great
            case 55..<72: return .solid
            default:      return .work
            }
        }
    }

    struct Dimension: Equatable, Identifiable {
        let id: String
        let label: String
        let score: Int      // 0…maxPoints
        let maxPoints: Int
        let value: String   // human-readable e.g. "3.1 : 1"
        let target: String  // human-readable e.g. "target 3 : 1"
        let tint: Color

        var pct: Double {
            guard maxPoints > 0 else { return 0 }
            return Double(score) / Double(maxPoints)
        }
    }
}

// MARK: - Compute

extension SwingGrade {

    /// Build a grade from a `SwingSummary` and the optional reference
    /// plane axis (median over recent swings of the same club).
    /// When `personalWindow` is set it wins over fixed tour priors.
    static func compute(
        summary: SwingSummary,
        referencePlane: SIMD3<Double>? = nil,
        personalWindow: PersonalWindow? = nil
    ) -> SwingGrade {

        if summary.segmentationUnreliable {
            let ink = Theme.ink3
            let dash = "—"
            return SwingGrade(
                value: 0,
                tier: .work,
                headline: "Couldn't read this swing — try again.",
                dimensions: [
                    Dimension(id: "tempo", label: "TEMPO", score: 0, maxPoints: 30,
                              value: dash, target: "unreadable", tint: ink),
                    Dimension(id: "plane", label: "PLANE", score: 0, maxPoints: 25,
                              value: dash, target: "unreadable", tint: ink),
                    Dimension(id: "smooth", label: "SMOOTHNESS", score: 0, maxPoints: 20,
                              value: dash, target: "unreadable", tint: ink),
                    Dimension(id: "speed", label: "SPEED", score: 0, maxPoints: 25,
                              value: dash, target: "unreadable", tint: ink)
                ]
            )
        }

        let pw = personalWindow
        let refAxis: SIMD3<Double>? = pw.map { $0.referenceAxis } ?? referencePlane

        // Tempo (max 30 pts)
        let tempoTarget = 3.0
        let tempoTol = 0.4
        var tempoScore = 0
        var tempoValueStr = "—"
        var tempoTint = Theme.ink3
        if let r = summary.tempo.ratio {
            tempoValueStr = String(format: "%.1f : 1", r)
            if let pw {
                if pw.tempoContains(r) {
                    tempoScore = 30
                    tempoTint = Theme.accent
                } else {
                    let span = max(0.08, pw.tempoWindowHi - pw.tempoWindowLo)
                    let dist = r < pw.tempoWindowLo ? (pw.tempoWindowLo - r) : (r - pw.tempoWindowHi)
                    let raw = max(0, 1 - dist / max(span, 1e-6))
                    tempoScore = Int((raw * 30).rounded())
                    tempoTint = dist <= span * 0.5 ? Theme.warn : Theme.bad
                }
            } else {
                let dist = abs(r - tempoTarget)
                let raw = max(0, 1 - dist / (tempoTol * 2))
                tempoScore = Int((raw * 30).rounded())
                if dist <= tempoTol { tempoTint = Theme.accent }
                else if dist <= tempoTol * 2 { tempoTint = Theme.warn }
                else { tempoTint = Theme.bad }
            }
        }

        // Plane (max 25 pts)
        var planeScore = 0
        var planeValueStr = "—"
        var planeTint = Theme.ink2
        if let ref = refAxis {
            let delta = angleDegrees(
                between: simd_normalize(summary.plane.axis),
                and: simd_normalize(ref)
            )
            planeValueStr = String(format: "%.1f° off", delta)
            if let pw {
                if pw.planeDeltaContains(delta) {
                    planeScore = 25
                    planeTint = Theme.accent
                } else {
                    let span = max(1.0, pw.planeDeltaWindowHi - pw.planeDeltaWindowLo)
                    let dist = delta < pw.planeDeltaWindowLo
                        ? (pw.planeDeltaWindowLo - delta)
                        : (delta - pw.planeDeltaWindowHi)
                    let raw = max(0, 1 - max(0, dist) / span)
                    planeScore = Int((raw * 25).rounded())
                    planeTint = dist <= span * 0.5 ? Theme.warn : Theme.bad
                }
            } else {
                let raw = max(0, 1 - max(0, delta - 4) / 16)
                planeScore = Int((raw * 25).rounded())
                if delta <= 5 { planeTint = Theme.accent }
                else if delta <= 12 { planeTint = Theme.warn }
                else { planeTint = Theme.bad }
            }
        } else {
            planeScore = 12
            planeValueStr = "no reference yet"
            planeTint = Theme.ink2
        }

        // Smoothness (max 20 pts)
        let jerkScore: Int = {
            let j = summary.smoothness.jerkRMS
            let raw = max(0, 1 - max(0, j - 50) / 200)
            return Int((raw * 20).rounded())
        }()
        let jerkValueStr = String(format: "jerk %.0f", summary.smoothness.jerkRMS)
        let jerkTint: Color = {
            let j = summary.smoothness.jerkRMS
            if j <= 100 { return Theme.accent }
            if j <= 180 { return Theme.warn }
            return Theme.bad
        }()

        // Speed (max 25 pts) — personal window scores **hand** mph; display
        // still shows estimated clubhead mph for continuity.
        let clubMph = summary.speeds.clubSpeedMph
        let handMph = summary.speeds.handSpeedMph
        let band = clubBand(for: summary.club)
        var speedScore = 0
        let speedValueStr = String(format: "%d mph", Int(clubMph.rounded()))
        var speedTint: Color
        if let pw {
            if pw.handContains(handMph) {
                speedScore = 25
                speedTint = Theme.accent
            } else {
                let dist = handMph < pw.handWindowLo
                    ? (pw.handWindowLo - handMph)
                    : (handMph - pw.handWindowHi)
                let span = max(1.0, pw.handWindowHi - pw.handWindowLo)
                let raw = max(0, 1 - dist / max(1, span))
                speedScore = Int((raw * 25).rounded())
                speedTint = dist <= span * 0.5 ? Theme.warn : Theme.bad
            }
        } else if clubMph >= band.lo && clubMph <= band.hi {
            speedScore = 25
            speedTint = Theme.accent
        } else {
            let dist = clubMph < band.lo ? (band.lo - clubMph) : (clubMph - band.hi)
            let span = (band.hi - band.lo)
            let raw = max(0, 1 - dist / max(1, span))
            speedScore = Int((raw * 25).rounded())
            speedTint = dist <= span * 0.5 ? Theme.warn : Theme.bad
        }

        let total = min(100, tempoScore + planeScore + jerkScore + speedScore)
        let tier = Tier.of(score: total)
        let headline = composeHeadline(
            tempoTint: tempoTint,
            planeTint: planeTint,
            jerkTint: jerkTint,
            speedTint: speedTint,
            summary: summary
        )

        let tempoTargetLabel: String = {
            if let pw {
                return String(format: "window %.2f–%.2f : 1", pw.tempoWindowLo, pw.tempoWindowHi)
            }
            return "target 3 : 1"
        }()
        let speedTargetLabel: String = {
            if let pw {
                return String(format: "hand %d–%d mph",
                               Int(pw.handWindowLo.rounded()),
                               Int(pw.handWindowHi.rounded()))
            }
            return String(format: "band %d–%d mph",
                          Int(band.lo.rounded()),
                          Int(band.hi.rounded()))
        }()

        return SwingGrade(
            value: total,
            tier: tier,
            headline: headline,
            dimensions: [
                Dimension(id: "tempo",  label: "TEMPO",
                          score: tempoScore, maxPoints: 30,
                          value: tempoValueStr, target: tempoTargetLabel,
                          tint: tempoTint),
                Dimension(id: "plane",  label: "PLANE",
                          score: planeScore, maxPoints: 25,
                          value: planeValueStr, target: "vs your median",
                          tint: planeTint),
                Dimension(id: "smooth", label: "SMOOTHNESS",
                          score: jerkScore, maxPoints: 20,
                          value: jerkValueStr, target: "lower = smoother",
                          tint: jerkTint),
                Dimension(id: "speed",  label: "SPEED",
                          score: speedScore, maxPoints: 25,
                          value: speedValueStr,
                          target: speedTargetLabel,
                          tint: speedTint)
            ]
        )
    }

    /// Plain-English single-sentence verdict picking on the worst
    /// dimension first, then a positive note if everything held.
    private static func composeHeadline(
        tempoTint: Color,
        planeTint: Color,
        jerkTint: Color,
        speedTint: Color,
        summary: SwingSummary
    ) -> String {
        // Worst-first.
        if tempoTint == Theme.bad, let r = summary.tempo.ratio {
            if r < 3.0 {
                return String(format: "Rushed transition — tempo %.1f : 1 (target 3 : 1).", r)
            }
            return String(format: "Slow downswing — tempo %.1f : 1 (target 3 : 1).", r)
        }
        if planeTint == Theme.bad {
            return "Off your usual swing plane — check setup."
        }
        if jerkTint == Theme.bad {
            return "Jerky transition — try a slower takeaway."
        }
        if speedTint == Theme.bad {
            let s = Int(summary.speeds.clubSpeedMph.rounded())
            return "Speed (\(s) mph) outside this club's normal band."
        }
        // Mostly amber? Pick the worst amber for guidance.
        if tempoTint == Theme.warn, let r = summary.tempo.ratio {
            return String(format: "Tempo a touch off (%.1f : 1, target 3 : 1).", r)
        }
        if planeTint == Theme.warn {
            return "Plane drifted slightly — keep working it."
        }
        if jerkTint == Theme.warn {
            return "Transition could be smoother."
        }
        if speedTint == Theme.warn {
            return "Speed near your club's band — push a touch more."
        }
        return "Smooth, on plane, and on tempo. Repeat that one."
    }

    /// Per-club typical clubhead-speed band (mph). Conservative
    /// defaults until Phase 4 calibration overrides them. Public so
    /// `SwingSpeedGauge` and the grade share the same source of truth.
    static func clubBand(for club: Club) -> (lo: Double, hi: Double) {
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
