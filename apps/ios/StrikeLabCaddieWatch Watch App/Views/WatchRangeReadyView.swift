//
//  WatchRangeReadyView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Range "ready" hero — session count, last tempo, personal window bar.
//

import SwiftUI

struct WatchRangeReadyView: View {
    let totalSwings: Int
    let activeClubShort: String
    let activeCount: Int
    let lastTempo: Double?
    let window: WatchPersonalWindow?
    let recentTempos: [Double]
    /// Opens club bag when the player taps the big club label (scroll no longer lands on bag).
    var onClubTap: (() -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 6) {
                SLWAnimatedMark(size: 14)
                Text("READY · \(activeClubShort.uppercased())")
                    .font(SLW.mono(8, weight: .semibold))
                    .tracking(1.3)
                    .foregroundColor(SLW.ink2)
                Spacer()
                Text("\(totalSwings) today")
                    .font(SLW.mono(8))
                    .foregroundColor(SLW.ink3)
            }

            Text(activeClubShort.uppercased())
                .font(SLW.num(40))
                .foregroundColor(SLW.ink)
                .contentShape(Rectangle())
                .onTapGesture { onClubTap?() }

            if let r = lastTempo {
                HStack {
                    Text("LAST TEMPO")
                    Spacer()
                    Text(String(format: "%.2f", r))
                }
                .font(SLW.mono(8))
                .foregroundColor(SLW.ink3)
                let wLo = window?.tempoWindowLo ?? 2.7
                let wHi = window?.tempoWindowHi ?? 3.3
                let cLo = window?.tempoCareerLo ?? 2.0
                let cHi = window?.tempoCareerHi ?? 4.2
                WatchTempoRangeBar(
                    value: r,
                    windowLo: wLo,
                    windowHi: wHi,
                    careerLo: cLo,
                    careerHi: cHi,
                    recent: recentTempos
                )
                .frame(height: 28)
            } else {
                Text("\(activeCount) swings")
                    .font(SLW.mono(9))
                    .foregroundColor(SLW.accent)
            }

            Text("CAPTURE")
                .font(SLW.mono(10, weight: .semibold))
                .tracking(1.4)
                .foregroundColor(SLW.accentInk)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(SLW.ink)
                )
        }
        .padding(.horizontal, 2)
    }
}

/// Compact SVG-style tempo range bar for watch.
struct WatchTempoRangeBar: View {
    let value: Double
    let windowLo: Double
    let windowHi: Double
    let careerLo: Double
    let careerHi: Double
    var recent: [Double] = []

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let lo = min(careerLo, windowLo, value)
            let hi = max(careerHi, windowHi, value)
            let span = max(1e-6, hi - lo)
            let x: (Double) -> CGFloat = { v in CGFloat((v - lo) / span) * w }
            let yMid = h * 0.55
            let inWin = value >= windowLo && value <= windowHi
            ZStack {
                Path { p in
                    p.move(to: CGPoint(x: x(careerLo), y: yMid))
                    p.addLine(to: CGPoint(x: x(careerHi), y: yMid))
                }
                .stroke(SLW.line, lineWidth: 1)
                Path { p in
                    p.move(to: CGPoint(x: x(windowLo), y: yMid))
                    p.addLine(to: CGPoint(x: x(windowHi), y: yMid))
                }
                .stroke(SLW.accent, lineWidth: 3)
                ForEach(Array(recent.enumerated()), id: \.offset) { _, v in
                    Circle()
                        .fill(SLW.ink3.opacity(0.5))
                        .frame(width: 2, height: 2)
                        .position(x: x(v), y: yMid)
                }
                Circle()
                    .fill(inWin ? SLW.accent : SLW.ink)
                    .frame(width: 5, height: 5)
                    .position(x: x(value), y: yMid)
            }
        }
    }
}

private func min(_ a: Double, _ b: Double, _ c: Double) -> Double {
    Swift.min(a, Swift.min(b, c))
}
private func max(_ a: Double, _ b: Double, _ c: Double) -> Double {
    Swift.max(a, Swift.max(b, c))
}
