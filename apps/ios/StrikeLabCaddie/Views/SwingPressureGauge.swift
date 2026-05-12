//
//  SwingPressureGauge.swift
//  StrikeLabCaddie
//
//  Visualises the pressure index as a zoned horizontal thermometer:
//    • CALM      0.00 – 0.30  (green)
//    • ELEVATED  0.30 – 0.60  (warn)
//    • PEAK      0.60 – 1.00  (bad)
//
//  Below the gauge: the player's HR @ impact, the resting baseline it
//  was computed against, and a short interpretation sentence so the
//  number is never decontextualised.
//

import SwiftUI

struct SwingPressureGauge: View {
    let pressure: PressureIndex

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("PRESSURE · HR-reserve")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(String(format: "%.2f / 1.00", pressure.value))
                    .font(Theme.statFont(15))
                    .foregroundColor(tint)
                verdictChip
            }

            GeometryReader { geo in
                let w = geo.size.width
                let valueX = w * CGFloat(max(0, min(1, pressure.value)))

                ZStack(alignment: .leading) {
                    // Three zones laid out side by side.
                    HStack(spacing: 0) {
                        Rectangle().fill(Theme.accent.opacity(0.30))
                            .overlay(Rectangle().stroke(Theme.accent.opacity(0.6), lineWidth: 1))
                            .frame(width: w * 0.30)
                        Rectangle().fill(Theme.warn.opacity(0.30))
                            .overlay(Rectangle().stroke(Theme.warn.opacity(0.6), lineWidth: 1))
                            .frame(width: w * 0.30)
                        Rectangle().fill(Theme.bad.opacity(0.30))
                            .overlay(Rectangle().stroke(Theme.bad.opacity(0.6), lineWidth: 1))
                            .frame(width: w * 0.40)
                    }
                    .frame(height: 14)
                    .offset(y: 5)

                    // Player marker.
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
                zoneLegend(color: Theme.accent, label: "CALM")
                zoneLegend(color: Theme.warn,   label: "ELEVATED")
                zoneLegend(color: Theme.bad,    label: "PEAK")
            }

            HStack {
                metric("@ IMPACT", value: "\(Int(pressure.bpmAtImpact)) bpm")
                metric("RESTING",  value: "\(Int(pressure.restingBpm)) bpm")
                metric("MAX",      value: "\(Int(pressure.maxBpm)) bpm")
            }

            Text(interpretation)
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink2)
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var tint: Color {
        switch pressure.value {
        case ..<0.30: return Theme.accent
        case ..<0.60: return Theme.warn
        default:      return Theme.bad
        }
    }

    private var verdictChip: some View {
        let t = tint
        let txt: String = {
            switch pressure.value {
            case ..<0.30: return "CALM"
            case ..<0.60: return "ELEVATED"
            default:      return "PEAK"
            }
        }()
        return Text(txt)
            .font(Theme.labelFont(9))
            .tracking(1.4)
            .foregroundColor(t)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .overlay(Rectangle().stroke(t, lineWidth: 1))
    }

    private var interpretation: String {
        switch pressure.value {
        case ..<0.30:
            return "Resting territory. Decisions should be clear."
        case ..<0.60:
            return "Elevated — watch for rushed tempo. Take one breath before setup."
        default:
            return "Peak HR for you. Consider clubbing up half — your tempo will pull short."
        }
    }

    private func metric(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.2)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(13))
                .foregroundColor(Theme.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func zoneLegend(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Rectangle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
