//
//  SwingSpeedGauge.swift
//  StrikeLabCaddie
//
//  Replaces the bare numeric speed dial with a target-band gauge:
//  the green zone is your typical clubhead-speed range for this club
//  (from `SwingGrade.clubBand`, refined per-player by Phase 4
//  calibration), the red marker is the swing being inspected.
//
//  Two stacked rows: clubhead and hand. Both are calibrated to the
//  same scale so the two markers visually compare. Below them, the
//  delta-vs-30-day-baseline chip if we have ≥3 prior shots.
//

import SwiftUI

struct SwingSpeedGauge: View {
    let summary: SwingSummary
    /// Optional baseline to render the "vs your 30-day avg" delta.
    var baseline: (club: Double, hand: Double)? = nil
    /// Optional Phase 4 calibration model — when present we show the
    /// estimated carry beneath the gauge.
    var clubModel: ClubModel? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header

            // Clubhead row — bigger, headline metric.
            metricGauge(
                label: "CLUBHEAD",
                value: summary.speeds.clubSpeedMph,
                band: SwingGrade.clubBand(for: summary.club),
                bigFont: true,
                deltaBaseline: baseline?.club
            )

            // Hand row — derived. Same band scale; the band itself is
            // the per-club ratio applied in reverse.
            let lever = max(0.001, summary.speeds.leverRatio)
            let clubBand = SwingGrade.clubBand(for: summary.club)
            metricGauge(
                label: "HAND",
                value: summary.speeds.handSpeedMph,
                band: (lo: clubBand.lo / lever, hi: clubBand.hi / lever),
                bigFont: false,
                deltaBaseline: baseline?.hand
            )

            if let m = clubModel {
                let carry = m.predictCarry(handMph: summary.speeds.handSpeedMph)
                HStack(spacing: 6) {
                    Image(systemName: "scope")
                        .font(.system(size: 10))
                        .foregroundColor(Theme.accent)
                    Text("Estimated carry")
                        .font(Theme.labelFont(10))
                        .tracking(1.0)
                        .foregroundColor(Theme.ink3)
                    Spacer()
                    Text("\(Int(carry.rounded())) yds")
                        .font(Theme.statFont(15))
                        .foregroundColor(Theme.ink)
                    Text(String(format: "± %.0f", m.sigma))
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("SPEED · est.")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Spacer()
            verdictChip(
                value: summary.speeds.clubSpeedMph,
                band: SwingGrade.clubBand(for: summary.club)
            )
        }
    }

    private func verdictChip(value: Double, band: (lo: Double, hi: Double)) -> some View {
        let txt: String
        let tint: Color
        if value >= band.lo && value <= band.hi {
            txt = "ON BAND"
            tint = Theme.accent
        } else if value < band.lo {
            txt = "BELOW"
            tint = Theme.warn
        } else {
            txt = "ABOVE"
            // Above the band can be a good thing for amateurs (more
            // distance), but it's a flag that the swing was unusually
            // hard. Render warm but not red.
            tint = Theme.warn
        }
        return Text(txt)
            .font(Theme.labelFont(9))
            .tracking(1.4)
            .foregroundColor(tint)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .overlay(Rectangle().stroke(tint, lineWidth: 1))
    }

    // MARK: - Per-metric row

    private func metricGauge(
        label: String,
        value: Double,
        band: (lo: Double, hi: Double),
        bigFont: Bool,
        deltaBaseline: Double?
    ) -> some View {
        // Scale ends — give a quarter-band of headroom on each side so
        // the marker has room to sit even when above/below the band.
        let pad = max(8, (band.hi - band.lo) * 0.6)
        let scaleLo = max(0, band.lo - pad)
        let scaleHi = band.hi + pad
        let span = max(1, scaleHi - scaleLo)
        let valueClamped = max(scaleLo, min(scaleHi, value))

        let inBand = value >= band.lo && value <= band.hi
        let tint: Color = inBand ? Theme.accent : Theme.warn

        return VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(label)
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text("\(Int(value.rounded()))")
                    .font(bigFont ? Theme.statFont(36) : Theme.statFont(22))
                    .foregroundColor(tint)
                Text("MPH")
                    .font(Theme.labelFont(10))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
            }
            Text("\(Self.kmh(fromMph: value)) km/h")
                .font(Theme.labelFont(9))
                .foregroundColor(Theme.ink3)
                .frame(maxWidth: .infinity, alignment: .trailing)

            GeometryReader { geo in
                let w = geo.size.width
                let bandX = w * (band.lo - scaleLo) / span
                let bandW = w * (band.hi - band.lo) / span
                let valueX = w * (valueClamped - scaleLo) / span

                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Theme.bg2)
                        .frame(height: 10)
                        .offset(y: 3)

                    // Green target band.
                    Rectangle()
                        .fill(Theme.accent.opacity(0.30))
                        .overlay(Rectangle().stroke(Theme.accent.opacity(0.7), lineWidth: 1))
                        .frame(width: bandW, height: 10)
                        .offset(x: bandX, y: 3)

                    // Tick at band centre.
                    Rectangle()
                        .fill(Theme.accent)
                        .frame(width: 1, height: 16)
                        .offset(x: bandX + bandW / 2, y: 0)

                    // Red actual marker.
                    Path { p in
                        p.move(to: CGPoint(x: valueX, y: 0))
                        p.addLine(to: CGPoint(x: valueX, y: 16))
                    }
                    .stroke(Theme.bad, lineWidth: 2.4)
                    Circle()
                        .fill(Theme.bad)
                        .frame(width: 7, height: 7)
                        .offset(x: valueX - 3.5, y: -3)
                }
            }
            .frame(height: 16)

            HStack {
                Text(String(format: "band %d–%d mph", Int(band.lo.rounded()), Int(band.hi.rounded())))
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.ink3)
                Spacer()
                if let baseline = deltaBaseline {
                    let delta = value - baseline
                    let positive = delta >= 0
                    Text(String(format: "%@%.1f vs 30d", positive ? "+" : "", delta))
                        .font(Theme.labelFont(9))
                        .foregroundColor(positive ? Theme.accent : Theme.bad)
                }
            }
        }
    }

    private static func kmh(fromMph mph: Double) -> Int {
        Int((mph * 1.60934).rounded())
    }
}
