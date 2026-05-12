//
//  SwingTempoGauge.swift
//  StrikeLabCaddie
//
//  The tempo headline. Horizontal gauge showing the player's tempo
//  ratio against the target band (2.7-3.3 = pro-tour territory).
//  Below it: a phase-timing band per phase (backswing / downswing)
//  with a green target zone and a red marker for the player's actual.
//
//  Design rule: a player should be able to look at this for one second
//  and know whether they're rushing, perfect, or stalling.
//

import SwiftUI

struct SwingTempoGauge: View {
    let tempo: SwingTempo

    /// Target tempo ratio (backswing / downswing).
    private let targetRatio: Double = 3.0
    private let targetBand: ClosedRange<Double> = 2.7...3.3
    private let scale: ClosedRange<Double> = 0...5

    /// Target absolute durations (seconds) per phase. A 1.0 s total
    /// swing at 3:1 = 0.75 s back / 0.25 s down. We give some latitude
    /// either side; this is the green zone.
    private let backTarget: ClosedRange<Double> = 0.60...0.90
    private let downTarget: ClosedRange<Double> = 0.20...0.30

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            ratioGauge
            phaseBlocks
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("TEMPO · target 3 : 1")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Spacer()
            if let r = tempo.ratio {
                Text(String(format: "%.1f : 1", r))
                    .font(Theme.statFont(15))
                    .foregroundColor(ratioTint(r))
                verdictChip(for: r)
            }
        }
    }

    private func verdictChip(for r: Double) -> some View {
        let txt: String
        let tint: Color
        if targetBand.contains(r) {
            txt = "ON TEMPO"
            tint = Theme.accent
        } else if r < targetBand.lowerBound {
            txt = "RUSHED"
            tint = r < 1.8 ? Theme.bad : Theme.warn
        } else {
            txt = "STALLED"
            tint = r > 4.5 ? Theme.bad : Theme.warn
        }
        return Text(txt)
            .font(Theme.labelFont(9))
            .tracking(1.4)
            .foregroundColor(tint)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .overlay(Rectangle().stroke(tint, lineWidth: 1))
    }

    // MARK: - Ratio gauge

    private var ratioGauge: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let scaleSpan = scale.upperBound - scale.lowerBound
            let bandX = w * (targetBand.lowerBound - scale.lowerBound) / scaleSpan
            let bandW = w * (targetBand.upperBound - targetBand.lowerBound) / scaleSpan
            let targetX = w * (targetRatio - scale.lowerBound) / scaleSpan
            let actualX: CGFloat? = {
                guard let r = tempo.ratio else { return nil }
                let clamped = max(scale.lowerBound, min(scale.upperBound, r))
                return w * (clamped - scale.lowerBound) / scaleSpan
            }()

            ZStack(alignment: .leading) {
                // Track baseline.
                Rectangle()
                    .fill(Theme.bg2)
                    .frame(height: 14)
                    .offset(y: 7)

                // Green target band.
                Rectangle()
                    .fill(Theme.accent.opacity(0.35))
                    .frame(width: bandW, height: 14)
                    .overlay(Rectangle().stroke(Theme.accent.opacity(0.8), lineWidth: 1))
                    .offset(x: bandX, y: 7)

                // Centre tick at 3:1.
                Rectangle()
                    .fill(Theme.accent)
                    .frame(width: 1, height: 22)
                    .offset(x: targetX, y: 4)

                // Numeric ticks every 1 unit.
                ForEach(Array(stride(from: scale.lowerBound, through: scale.upperBound, by: 1)), id: \.self) { v in
                    let x = w * (v - scale.lowerBound) / scaleSpan
                    Path { p in
                        p.move(to: CGPoint(x: x, y: 22))
                        p.addLine(to: CGPoint(x: x, y: 28))
                    }
                    .stroke(Theme.ink3, lineWidth: 0.6)
                }

                // Player's actual ratio — RED marker so it's immediately
                // identifiable even when sitting inside the green band.
                if let x = actualX {
                    Path { p in
                        p.move(to: CGPoint(x: x, y: 0))
                        p.addLine(to: CGPoint(x: x, y: 28))
                    }
                    .stroke(Theme.bad, lineWidth: 2.4)
                    Circle()
                        .fill(Theme.bad)
                        .frame(width: 8, height: 8)
                        .offset(x: x - 4, y: -4)
                }
            }
            .frame(height: 28)
            .overlay(alignment: .topLeading) {
                Text("0")
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.ink3)
                    .offset(y: 32)
            }
            .overlay(alignment: .topTrailing) {
                Text("5")
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.ink3)
                    .offset(y: 32)
            }
            .overlay(alignment: .top) {
                Text("3 (pro)")
                    .font(Theme.labelFont(9))
                    .tracking(1.0)
                    .foregroundColor(Theme.accent)
                    .offset(x: targetX - w / 2, y: 32)
            }
        }
        .frame(height: 50)
    }

    // MARK: - Per-phase blocks (target zone + your value)

    private var phaseBlocks: some View {
        HStack(spacing: 10) {
            phaseBlock(
                title: "BACKSWING",
                actual: tempo.backswingSeconds,
                target: backTarget
            )
            phaseBlock(
                title: "DOWNSWING",
                actual: tempo.downswingSeconds,
                target: downTarget
            )
        }
    }

    private func phaseBlock(title: String,
                            actual: Double,
                            target: ClosedRange<Double>) -> some View {
        let inBand = target.contains(actual)
        let tint: Color = {
            if inBand { return Theme.accent }
            let mid = (target.lowerBound + target.upperBound) / 2
            let span = (target.upperBound - target.lowerBound)
            let dist = abs(actual - mid)
            return dist <= span ? Theme.warn : Theme.bad
        }()

        // Visual scale for the mini bar — 0 to 1.0 s captures every
        // realistic phase duration; clamped if extreme.
        let scaleMax: Double = 1.0
        let actualClamped = max(0, min(scaleMax, actual))
        let bandLoX = target.lowerBound / scaleMax
        let bandHiX = target.upperBound / scaleMax
        let actualX = actualClamped / scaleMax

        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(Theme.labelFont(9))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(String(format: "%.2fs", actual))
                    .font(Theme.statFont(13))
                    .foregroundColor(tint)
            }

            GeometryReader { geo in
                let w = geo.size.width
                ZStack(alignment: .leading) {
                    // Track.
                    Rectangle()
                        .fill(Theme.bg2)
                        .frame(height: 8)
                        .offset(y: 4)

                    // Green target band.
                    Rectangle()
                        .fill(Theme.accent.opacity(0.30))
                        .overlay(Rectangle().stroke(Theme.accent.opacity(0.6), lineWidth: 1))
                        .frame(width: w * (bandHiX - bandLoX), height: 8)
                        .offset(x: w * bandLoX, y: 4)

                    // Red actual marker.
                    Path { p in
                        let x = w * actualX
                        p.move(to: CGPoint(x: x, y: 0))
                        p.addLine(to: CGPoint(x: x, y: 16))
                    }
                    .stroke(Theme.bad, lineWidth: 2)
                }
            }
            .frame(height: 16)

            Text(String(format: "target %.2f-%.2fs", target.lowerBound, target.upperBound))
                .font(Theme.labelFont(9))
                .foregroundColor(Theme.ink3)
        }
        .padding(8)
        .frame(maxWidth: .infinity)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    // MARK: - Helpers

    private func ratioTint(_ r: Double) -> Color {
        if targetBand.contains(r) { return Theme.accent }
        let span = targetBand.upperBound - targetBand.lowerBound
        let dist = r < targetBand.lowerBound
            ? targetBand.lowerBound - r
            : r - targetBand.upperBound
        return dist <= span ? Theme.warn : Theme.bad
    }
}
