//
//  SwingSmoothnessGauge.swift
//  StrikeLabCaddie
//
//  Visualises jerk RMS (third derivative of |userAcceleration| during
//  the downswing) against the same green-band-with-red-marker template
//  used by the tempo and speed gauges. Pros sit ≤50 g/s², amateurs are
//  typically 80–200, anything above 250 is a snatch.
//
//  Why surface this? Because tempo + speed alone don't catch
//  "rushed transition" — a smooth, slower swing routinely outperforms
//  a jerky faster one, and jerk RMS is the cleanest single number to
//  put a colour on that.
//

import SwiftUI

struct SwingSmoothnessGauge: View {
    let smoothness: SwingSmoothness

    /// Green band — silky transition.
    private let goodBand: ClosedRange<Double> = 0...100
    /// Warning band — workable but jerky.
    private let warnBand: ClosedRange<Double> = 100...180
    /// Visualisation upper bound. Anything above this is clamped.
    private let scaleMax: Double = 280

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("SMOOTHNESS · jerk RMS")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(String(format: "%.0f", smoothness.jerkRMS))
                    .font(Theme.statFont(15))
                    .foregroundColor(tint)
                verdictChip
            }

            GeometryReader { geo in
                let w = geo.size.width
                let valueClamped = max(0, min(scaleMax, smoothness.jerkRMS))
                let valueX = w * valueClamped / scaleMax
                let goodX = w * (goodBand.upperBound) / scaleMax
                let warnX = w * (warnBand.upperBound) / scaleMax

                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Theme.bg2)
                        .frame(height: 14)
                        .offset(y: 5)

                    // Green silky zone.
                    Rectangle()
                        .fill(Theme.accent.opacity(0.30))
                        .overlay(Rectangle().stroke(Theme.accent.opacity(0.7), lineWidth: 1))
                        .frame(width: goodX, height: 14)
                        .offset(y: 5)

                    // Amber workable zone.
                    Rectangle()
                        .fill(Theme.warn.opacity(0.20))
                        .overlay(Rectangle().stroke(Theme.warn.opacity(0.5), lineWidth: 1))
                        .frame(width: warnX - goodX, height: 14)
                        .offset(x: goodX, y: 5)

                    // Red actual marker.
                    Path { p in
                        p.move(to: CGPoint(x: valueX, y: 0))
                        p.addLine(to: CGPoint(x: valueX, y: 24))
                    }
                    .stroke(Theme.bad, lineWidth: 2.4)
                    Circle()
                        .fill(Theme.bad)
                        .frame(width: 7, height: 7)
                        .offset(x: valueX - 3.5, y: -3)
                }
            }
            .frame(height: 24)

            HStack {
                zoneLegend(color: Theme.accent, label: "0–100 silky")
                zoneLegend(color: Theme.warn,   label: "100–180 workable")
                zoneLegend(color: Theme.bad,    label: "180+ snatched")
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var tint: Color {
        let j = smoothness.jerkRMS
        if goodBand.contains(j) { return Theme.accent }
        if warnBand.contains(j) { return Theme.warn }
        return Theme.bad
    }

    private var verdictChip: some View {
        let t = tint
        let j = smoothness.jerkRMS
        let txt: String = {
            if goodBand.contains(j) { return "SILKY" }
            if warnBand.contains(j) { return "WORKABLE" }
            return "SNATCHED"
        }()
        return Text(txt)
            .font(Theme.labelFont(9))
            .tracking(1.4)
            .foregroundColor(t)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .overlay(Rectangle().stroke(t, lineWidth: 1))
    }

    private func zoneLegend(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Rectangle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(0.6)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
