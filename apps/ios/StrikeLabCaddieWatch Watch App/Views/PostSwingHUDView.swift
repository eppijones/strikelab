//
//  PostSwingHUDView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Post-swing overlay: page 1 = one tempo number + personal window bar;
//  page 2 = the legacy mini-gauges. Signal Lime only in-window; ink
//  otherwise (no red on the hero page).
//

import SwiftUI
import WatchKit

struct PostSwingHUDView: View {
    let summary: WatchSwingSummary
    /// Personal window for the active club (from phone). nil → fixed 2.7–3.3.
    var personalWindow: WatchPersonalWindow?
    var onMarkGood: () -> Void = {}
    var onDismiss: () -> Void = {}

    @State private var visible = false

    var body: some View {
        TabView {
            heroPage
            detailPage
        }
        .tabViewStyle(.page)
        .padding(6)
        .background(SLW.bg2)
        .overlay(Rectangle().stroke(SLW.accent.opacity(0.6), lineWidth: 1))
        .opacity(visible ? 1 : 0)
        .scaleEffect(visible ? 1 : 0.95)
        .animation(.easeOut(duration: 0.18), value: visible)
        .onAppear {
            visible = true
            playSpeedHaptic()
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                visible = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                    onDismiss()
                }
            }
        }
    }

    private var heroPage: some View {
        let r = summary.tempoRatio
        let ratioStr = r.map { String(format: "%.2f", $0) } ?? "—"
        let w = personalWindow
        let lo = w?.tempoWindowLo ?? 2.7
        let hi = w?.tempoWindowHi ?? 3.3
        let cLo = w?.tempoCareerLo ?? 2.0
        let cHi = w?.tempoCareerHi ?? 4.2
        let inWin = r.map { $0 >= lo && $0 <= hi } ?? false
        let drift = driftLine(r: r, lo: lo, hi: hi)

        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("RESULT")
                    .font(SLW.mono(8, weight: .semibold))
                    .foregroundColor(SLW.accent)
                Spacer()
                Text(summary.club.uppercased())
                    .font(SLW.mono(8))
                    .foregroundColor(SLW.ink3)
            }
            Text(ratioStr)
                .font(SLW.num(40))
                .foregroundColor(inWin ? SLW.accent : SLW.ink)
            if !drift.isEmpty {
                Text(drift)
                    .font(.system(size: 11, design: .serif))
                    .italic()
                    .foregroundColor(SLW.ink2)
            }
            if let r {
                WatchTempoRangeBar(
                    value: r,
                    windowLo: lo,
                    windowHi: hi,
                    careerLo: cLo,
                    careerHi: cHi,
                    recent: []
                )
                .frame(height: 26)
            }
            Button {
                onMarkGood()
            } label: {
                Text("MARK GOOD")
                    .font(SLW.mono(9, weight: .semibold))
                    .foregroundColor(SLW.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 26)
                    .background(SLW.accent)
            }
            .buttonStyle(.plain)
            .handGestureShortcut(.primaryAction)
        }
    }

    private func driftLine(r: Double?, lo: Double, hi: Double) -> String {
        guard let r else { return "Couldn't read this swing — try again." }
        if r >= lo && r <= hi { return "" }
        let mid = (lo + hi) / 2
        let d = r - mid
        if d > 0.08 { return String(format: "Tempo quick by %.2f.", abs(d)) }
        if d < -0.08 { return String(format: "Tempo slow by %.2f.", abs(d)) }
        return "Outside your window."
    }

    private var detailPage: some View {
        VStack(spacing: 4) {
            speedDial
            HStack(spacing: 4) {
                tempoGauge
                planeGauge
                hrChip
            }
        }
    }

    private var speedDial: some View {
        let mph = summary.clubMph
        let band = summary.clubBand ?? (lo: 60, hi: 100)
        let pad = max(8, (band.hi - band.lo) * 0.6)
        let scaleLo = max(0, band.lo - pad)
        let scaleHi = band.hi + pad
        let inBand = mph >= band.lo && mph <= band.hi
        let tint: Color = inBand ? SLW.accent : SLW.ink

        let kmh = Int((mph * 1.60934).rounded())
        return VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .firstTextBaseline) {
                Text("\(Int(mph.rounded()))")
                    .font(SLW.num(32))
                    .foregroundColor(tint)
                Text("MPH")
                    .font(SLW.mono(8))
                    .foregroundColor(SLW.ink3)
                Spacer()
                if let carry = summary.estCarryYards {
                    Text("\(Int(carry.rounded())) y")
                        .font(SLW.num(16))
                        .foregroundColor(SLW.accent)
                }
            }
            Text("\(kmh) km/h")
                .font(SLW.mono(8))
                .foregroundColor(SLW.ink3)
            miniBand(scaleLo: scaleLo, scaleHi: scaleHi,
                     bandLo: band.lo, bandHi: band.hi,
                     value: mph, height: 6)
        }
    }

    private var tempoGauge: some View {
        let r = summary.tempoRatio
        let lo = personalWindow?.tempoWindowLo ?? 2.7
        let hi = personalWindow?.tempoWindowHi ?? 3.3
        let onTempo = r.map { $0 >= lo && $0 <= hi } ?? false
        let tint: Color = {
            guard r != nil else { return SLW.ink3 }
            return onTempo ? SLW.accent : SLW.ink
        }()
        return VStack(alignment: .leading, spacing: 2) {
            Text("TEMPO")
                .font(SLW.mono(7))
                .foregroundColor(SLW.ink3)
            Text(r.map { String(format: "%.1f", $0) } ?? "—")
                .font(SLW.num(15))
                .foregroundColor(tint)
            miniBand(scaleLo: 0, scaleHi: 5, bandLo: lo, bandHi: hi,
                     value: r ?? 0, height: 4)
        }
        .padding(4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }

    private var planeGauge: some View {
        let d = summary.planeDeltaDeg
        let tint: Color = {
            guard let v = d else { return SLW.ink3 }
            if abs(v) <= 5 { return SLW.accent }
            return SLW.ink
        }()
        return VStack(alignment: .leading, spacing: 2) {
            Text("PLANE")
                .font(SLW.mono(7))
                .foregroundColor(SLW.ink3)
            Text(d.map { String(format: "%+.0f°", $0) } ?? "—")
                .font(SLW.num(15))
                .foregroundColor(tint)
            miniBand(scaleLo: -20, scaleHi: 20, bandLo: -5, bandHi: 5,
                     value: d ?? 0, height: 4)
        }
        .padding(4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }

    private var hrChip: some View {
        let bpm = summary.bpmAtImpact
        let frac = summary.hrFraction ?? 0
        let tint: Color = frac < 0.45 ? SLW.accent : SLW.ink
        return VStack(alignment: .leading, spacing: 2) {
            Text("HR")
                .font(SLW.mono(7))
                .foregroundColor(SLW.ink3)
            Text(bpm > 0 ? "\(Int(bpm))" : "—")
                .font(SLW.num(15))
                .foregroundColor(tint)
            miniBand(scaleLo: 0, scaleHi: 1, bandLo: 0, bandHi: 0.45,
                     value: frac, height: 4)
        }
        .padding(4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }

    private func miniBand(
        scaleLo: Double, scaleHi: Double,
        bandLo: Double, bandHi: Double,
        value: Double, height: CGFloat
    ) -> some View {
        GeometryReader { geo in
            let w = geo.size.width
            let span = max(0.0001, scaleHi - scaleLo)
            let bandX = w * CGFloat(max(0, bandLo - scaleLo) / span)
            let bandW = w * CGFloat(max(0, min(scaleHi, bandHi) - max(scaleLo, bandLo)) / span)
            let valueClamped = max(scaleLo, min(scaleHi, value))
            let valueX = w * CGFloat(valueClamped - scaleLo) / span
            ZStack(alignment: .leading) {
                Rectangle().fill(SLW.bg2).frame(height: height)
                Rectangle()
                    .fill(SLW.accent.opacity(0.40))
                    .frame(width: bandW, height: height)
                    .offset(x: bandX)
                Rectangle()
                    .fill(SLW.ink)
                    .frame(width: 2, height: height + 4)
                    .offset(x: valueX, y: -2)
            }
        }
        .frame(height: height + 4)
    }

    private func playSpeedHaptic() {
        // One light tap when the HUD appears — enough to notice capture,
        // not a multi-burst “commentary” on club speed.
        Haptics.coaching(.click)
    }
}

/// Lightweight summary used by the HUD. Computed on the watch right
/// after capture using the same lever-ratio table as iOS analytics so
/// the numbers shown on the wrist match the Swing Card on the phone.
struct WatchSwingSummary: Equatable {
    let club: String
    let clubMph: Double
    let handMph: Double
    let tempoRatio: Double?
    let planeDeltaDeg: Double?
    let bpmAtImpact: Double
    let estCarryYards: Double?
    let estCarrySigma: Double?
    let clubBand: (lo: Double, hi: Double)?
    let hrFraction: Double?

    static func == (lhs: WatchSwingSummary, rhs: WatchSwingSummary) -> Bool {
        lhs.club == rhs.club &&
        lhs.clubMph == rhs.clubMph &&
        lhs.handMph == rhs.handMph &&
        lhs.tempoRatio == rhs.tempoRatio &&
        lhs.planeDeltaDeg == rhs.planeDeltaDeg &&
        lhs.bpmAtImpact == rhs.bpmAtImpact &&
        lhs.estCarryYards == rhs.estCarryYards &&
        lhs.estCarrySigma == rhs.estCarrySigma &&
        lhs.clubBand?.lo == rhs.clubBand?.lo &&
        lhs.clubBand?.hi == rhs.clubBand?.hi &&
        lhs.hrFraction == rhs.hrFraction
    }
}

#Preview {
    PostSwingHUDView(
        summary: WatchSwingSummary(
            club: "7i",
            clubMph: 78,
            handMph: 28,
            tempoRatio: 3.1,
            planeDeltaDeg: 2.4,
            bpmAtImpact: 112,
            estCarryYards: 154,
            estCarrySigma: 6,
            clubBand: (lo: 65, hi: 82),
            hrFraction: 0.35
        ),
        personalWindow: nil
    )
}
