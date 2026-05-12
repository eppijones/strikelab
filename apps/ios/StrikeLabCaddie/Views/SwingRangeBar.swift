//
//  SwingRangeBar.swift
//  StrikeLabCaddie
//
//  Range bar primitive from swing-watch.jsx — career axis, personal
//  window pipes, lime fill in-window, ink marker outside.
//

import SwiftUI

struct SwingRangeBar: View {
    let value: Double
    /// Personal window (target band on axis).
    let windowLo: Double
    let windowHi: Double
    /// Career / axis min & max for mapping.
    let careerLo: Double
    let careerHi: Double
    /// Optional recent values (same units) as faint dots.
    var recent: [Double] = []
    var height: CGFloat = 34
    var showValueLabel: Bool = true

    private var axisMin: Double { min(careerLo, windowLo, value) }
    private var axisMax: Double { max(careerHi, windowHi, value) }

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let pad: CGFloat = 6
            let inner = w - pad * 2
            let span = max(1e-6, axisMax - axisMin)
            let xFor: (Double) -> CGFloat = { v in
                pad + CGFloat((v - axisMin) / span) * inner
            }
            let yMid = h * 0.62
            let inWindow = value >= windowLo && value <= windowHi
            let markerColor = inWindow ? Theme.accent : Theme.ink
            ZStack(alignment: .topLeading) {
                // Career axis
                Path { p in
                    p.move(to: CGPoint(x: xFor(careerLo), y: yMid))
                    p.addLine(to: CGPoint(x: xFor(careerHi), y: yMid))
                }
                .stroke(Theme.lineStrong, lineWidth: 1)

                // Career caps
                cap(x: xFor(careerLo), yMid: yMid, h: h)
                cap(x: xFor(careerHi), yMid: yMid, h: h)

                // Window fill
                Path { p in
                    p.move(to: CGPoint(x: xFor(windowLo), y: yMid))
                    p.addLine(to: CGPoint(x: xFor(windowHi), y: yMid))
                }
                .stroke(Theme.accent, lineWidth: 3)

                // Window pipes
                pipe(x: xFor(windowLo), yMid: yMid, h: h)
                pipe(x: xFor(windowHi), yMid: yMid, h: h)

                // Recent dots
                ForEach(Array(recent.enumerated()), id: \.offset) { _, v in
                    Circle()
                        .fill(Theme.ink3.opacity(0.45))
                        .frame(width: 3, height: 3)
                        .position(x: xFor(v), y: yMid)
                }

                // Marker
                Path { p in
                    p.move(to: CGPoint(x: xFor(value), y: 4))
                    p.addLine(to: CGPoint(x: xFor(value), y: yMid))
                }
                .stroke(markerColor, lineWidth: 1)

                Circle()
                    .fill(markerColor)
                    .frame(width: 6, height: 6)
                    .position(x: xFor(value), y: yMid)

                if showValueLabel {
                    Text(formatValue(value))
                        .font(Theme.statFont(9))
                        .foregroundColor(markerColor)
                        .position(x: xFor(value), y: 10)
                }
            }
        }
        .frame(height: height)
    }

    private func cap(x: CGFloat, yMid: CGFloat, h: CGFloat) -> some View {
        Path { p in
            p.move(to: CGPoint(x: x, y: yMid - h * 0.08))
            p.addLine(to: CGPoint(x: x, y: yMid + h * 0.08))
        }
        .stroke(Theme.ink3, lineWidth: 1)
    }

    private func pipe(x: CGFloat, yMid: CGFloat, h: CGFloat) -> some View {
        Path { p in
            p.move(to: CGPoint(x: x, y: yMid - h * 0.22))
            p.addLine(to: CGPoint(x: x, y: yMid + h * 0.22))
        }
        .stroke(Theme.accent, lineWidth: 1)
    }

    private func formatValue(_ v: Double) -> String {
        if v < 10 { return String(format: "%.2f", v) }
        return String(format: "%.0f", v)
    }
}

private func min(_ a: Double, _ b: Double, _ c: Double) -> Double {
    Swift.min(a, Swift.min(b, c))
}
private func max(_ a: Double, _ b: Double, _ c: Double) -> Double {
    Swift.max(a, Swift.max(b, c))
}
