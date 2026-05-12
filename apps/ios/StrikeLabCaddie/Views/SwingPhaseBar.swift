//
//  SwingPhaseBar.swift
//  StrikeLabCaddie
//
//  "When did you start, when were you at the top, when did you hit it,
//  when did you finish?" — answered as a single horizontal bar.
//
//  Two stacked tracks:
//    1. YOUR SWING — your actual phase boundaries from the segmenter.
//    2. IDEAL     — the same swing scaled so backswing is exactly 3×
//                   downswing (the canonical 3:1 tempo).
//
//  Aligning them visually is the fastest possible way to see "yes I
//  got to the top on time" or "no, I rushed the transition by 0.2 s".
//

import SwiftUI

struct SwingPhaseBar: View {
    let motion: SwingMotionData

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("PHASES · 0 \u{2192} \(String(format: "%.2fs", totalSeconds))")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(deltaText)
                    .font(Theme.labelFont(11))
                    .foregroundColor(deltaTint)
            }

            track(label: "YOU",
                  phases: actualBoundaries,
                  total: totalSeconds,
                  isIdeal: false)

            track(label: "IDEAL",
                  phases: idealBoundaries,
                  total: totalSeconds,
                  isIdeal: true)

            phaseChips

            legend
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    /// Three small chips showing how close each YOU segment matched its
    /// IDEAL counterpart. Tap-target sized so a glance answers "which
    /// phase was off?".
    private var phaseChips: some View {
        let actual = actualBoundaries
        let ideal = idealBoundaries
        let backDelta = (actual.top - actual.backStart) - (ideal.top - ideal.backStart)
        let downDelta = (actual.impact - actual.top) - (ideal.impact - ideal.top)
        let folwDelta = (actual.finish - actual.impact) - (ideal.finish - ideal.impact)
        return HStack(spacing: 6) {
            phaseChip("BACKSWING", delta: backDelta, tightTol: 0.10)
            phaseChip("DOWNSWING", delta: downDelta, tightTol: 0.05)
            phaseChip("FOLLOW",    delta: folwDelta, tightTol: 0.10)
        }
    }

    private func phaseChip(_ label: String, delta: Double, tightTol: Double) -> some View {
        let tint: Color
        if abs(delta) <= tightTol { tint = Theme.accent }
        else if abs(delta) <= tightTol * 2.5 { tint = Theme.warn }
        else { tint = Theme.bad }

        let arrow = delta > 0 ? "+" : (delta < 0 ? "" : "")
        let txt = abs(delta) < 0.005
            ? "on time"
            : String(format: "%@%.2fs", arrow, delta)

        return VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
            Text(txt)
                .font(Theme.statFont(13))
                .foregroundColor(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(8)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(tint.opacity(0.5), lineWidth: 1))
    }

    /// Tint a YOU segment by how close its duration is to the IDEAL.
    private func segmentTint(actualDur: Double, idealDur: Double, tightTol: Double) -> Color {
        let delta = abs(actualDur - idealDur)
        if delta <= tightTol { return Theme.accent }
        if delta <= tightTol * 2.5 { return Theme.warn }
        return Theme.bad
    }

    // MARK: - Geometry

    private var totalSeconds: Double {
        let n = max(1, motion.samples.count - 1)
        return Double(n) * motion.sampleInterval
    }

    /// Boundary times (seconds from 0 = capture start) for the four
    /// phases of the player's actual swing.
    private var actualBoundaries: PhaseBoundaries {
        let p = motion.phases
        let dt = motion.sampleInterval
        return PhaseBoundaries(
            backStart: Double(p.backswingStartIdx) * dt,
            top:       Double(p.topIdx) * dt,
            impact:    Double(p.impactIdx) * dt,
            finish:    Double(p.finishIdx) * dt
        )
    }

    /// Same-length swing but with a perfect 3:1 backswing-to-downswing
    /// ratio. Anchored on the player's `backStart` and `finish` so the
    /// two tracks compare like-for-like.
    private var idealBoundaries: PhaseBoundaries {
        let actual = actualBoundaries
        let totalActive = actual.finish - actual.backStart
        // Split: 75% of active is backswing, 25% downswing+follow. Of
        // that 25%, the impact lands at the top of the downswing arc;
        // we put it 80% through the active downswing window.
        let backLen = totalActive * 0.60   // back-start → top
        let downLen = totalActive * 0.20   // top → impact (3:1)
        // Remaining 20% is the follow-through to finish.
        return PhaseBoundaries(
            backStart: actual.backStart,
            top:       actual.backStart + backLen,
            impact:    actual.backStart + backLen + downLen,
            finish:    actual.finish
        )
    }

    // MARK: - Verdict text

    private var deltaText: String {
        let actual = actualBoundaries
        let ideal = idealBoundaries
        let topDelta = actual.top - ideal.top
        let impactDelta = actual.impact - ideal.impact
        // Whichever absolute delta is biggest drives the verdict.
        if abs(topDelta) >= abs(impactDelta) {
            if abs(topDelta) < 0.05 { return "On rhythm" }
            return topDelta > 0
                ? String(format: "Top %.2fs late", topDelta)
                : String(format: "Top %.2fs early", -topDelta)
        } else {
            if abs(impactDelta) < 0.05 { return "On rhythm" }
            return impactDelta > 0
                ? String(format: "Impact %.2fs late", impactDelta)
                : String(format: "Impact %.2fs early", -impactDelta)
        }
    }

    private var deltaTint: Color {
        let actual = actualBoundaries
        let ideal = idealBoundaries
        let worst = max(abs(actual.top - ideal.top),
                        abs(actual.impact - ideal.impact))
        if worst < 0.05 { return Theme.accent }
        if worst < 0.15 { return Theme.warn }
        return Theme.bad
    }

    // MARK: - Track

    private func track(label: String,
                       phases: PhaseBoundaries,
                       total: Double,
                       isIdeal: Bool) -> some View {
        // Per-segment tints. IDEAL stays in the original phase identity
        // colours (faded). YOU segments are coloured by how close their
        // duration matched the ideal — instant traffic-light verdict.
        let actual = actualBoundaries
        let ideal  = idealBoundaries
        let backTint: Color
        let downTint: Color
        let folwTint: Color
        if isIdeal {
            backTint = Theme.warn.opacity(0.50)
            downTint = Theme.bad.opacity(0.50)
            folwTint = Theme.accent.opacity(0.40)
        } else {
            backTint = segmentTint(
                actualDur: actual.top - actual.backStart,
                idealDur: ideal.top - ideal.backStart,
                tightTol: 0.10
            )
            downTint = segmentTint(
                actualDur: actual.impact - actual.top,
                idealDur: ideal.impact - ideal.top,
                tightTol: 0.05
            )
            folwTint = segmentTint(
                actualDur: actual.finish - actual.impact,
                idealDur: ideal.finish - ideal.impact,
                tightTol: 0.10
            )
        }

        return GeometryReader { geo in
            let w = geo.size.width
            let xStart = CGFloat(phases.backStart / total) * w
            let xTop   = CGFloat(phases.top       / total) * w
            let xImp   = CGFloat(phases.impact    / total) * w
            let xFin   = CGFloat(phases.finish    / total) * w

            ZStack(alignment: .leading) {
                // Inactive track (before backStart and after finish).
                Rectangle()
                    .fill(Theme.bg2)
                    .frame(height: 14)
                    .offset(y: 7)

                // Backswing segment.
                Rectangle()
                    .fill(backTint.opacity(isIdeal ? 1.0 : 0.85))
                    .frame(width: max(0, xTop - xStart), height: 14)
                    .offset(x: xStart, y: 7)

                // Downswing segment (top → impact).
                Rectangle()
                    .fill(downTint.opacity(isIdeal ? 1.0 : 0.85))
                    .frame(width: max(0, xImp - xTop), height: 14)
                    .offset(x: xTop, y: 7)

                // Follow-through.
                Rectangle()
                    .fill(folwTint.opacity(isIdeal ? 1.0 : 0.70))
                    .frame(width: max(0, xFin - xImp), height: 14)
                    .offset(x: xImp, y: 7)

                // Boundary ticks.
                ForEach([xStart, xTop, xImp, xFin], id: \.self) { x in
                    Path { p in
                        p.move(to: CGPoint(x: x, y: 4))
                        p.addLine(to: CGPoint(x: x, y: 24))
                    }
                    .stroke(isIdeal ? Theme.ink3 : Theme.ink, lineWidth: 1)
                }

                // Labels for "you" track only — keeps the IDEAL one
                // visually quieter so the eye compares boundaries.
                if !isIdeal {
                    tickLabel(at: xStart, in: w, text: "BACK")
                    tickLabel(at: xTop,   in: w, text: "TOP")
                    tickLabel(at: xImp,   in: w, text: "IMPACT")
                }
            }
            .overlay(alignment: .topLeading) {
                Text(label)
                    .font(Theme.labelFont(9))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
                    .offset(x: -2, y: -10)
            }
        }
        .frame(height: 32)
        .padding(.top, 12)
    }

    private func tickLabel(at x: CGFloat, in width: CGFloat, text: String) -> some View {
        Text(text)
            .font(Theme.labelFont(8))
            .tracking(1.0)
            .foregroundColor(Theme.ink2)
            .padding(.horizontal, 3)
            .background(Theme.surface)
            .offset(x: max(0, min(width - 36, x - 18)), y: 26)
    }

    private var legend: some View {
        HStack(spacing: 14) {
            legendChip(color: Theme.warn, text: "BACKSWING")
            legendChip(color: Theme.bad,  text: "DOWNSWING")
            legendChip(color: Theme.accent, text: "FOLLOW")
        }
    }

    private func legendChip(color: Color, text: String) -> some View {
        HStack(spacing: 4) {
            Rectangle().fill(color).frame(width: 8, height: 8)
            Text(text)
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
        }
    }
}

private struct PhaseBoundaries {
    let backStart: Double  // s
    let top: Double
    let impact: Double
    let finish: Double
}
