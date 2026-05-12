//
//  TeeComponents.swift
//  StrikeLabCaddie
//
//  Shared building blocks for the Tee surface — micro labels, signal-lime
//  pills, slot dot indicators, and the editorial dark hero landscape.
//

import SwiftUI

// MARK: - Micro label

struct TeeMicroLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium, design: .monospaced))
            .tracking(1.8)
            .foregroundColor(Theme.ink3)
            .textCase(.uppercase)
    }
}

// MARK: - Signal-lime pill

struct TeePill: View {
    enum Tone { case neutral, accent, warn, bad, fjord }
    let text: String
    var tone: Tone = .neutral
    var body: some View {
        let (fg, bg, border) = colors(tone)
        Text(text)
            .font(.system(size: 9, weight: .semibold, design: .monospaced))
            .tracking(1.6)
            .foregroundColor(fg)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(bg)
            .overlay(Rectangle().stroke(border, lineWidth: 1))
            .textCase(.uppercase)
    }
    private func colors(_ tone: Tone) -> (Color, Color, Color) {
        switch tone {
        case .neutral: return (Theme.ink2, .clear, Theme.lineStrong)
        case .accent:  return (Theme.accent, .clear, Theme.accent)
        case .warn:    return (Theme.warn, .clear, Theme.warn)
        case .bad:     return (Theme.bad, .clear, Theme.bad)
        case .fjord:   return (Theme.ink2, .clear, Theme.ink3)
        }
    }
}

// MARK: - Slot dots

struct TeeSlotDots: View {
    let taken: Int
    let total: Int
    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<total, id: \.self) { i in
                Circle()
                    .fill(i < taken ? Color.primary.opacity(0.85) : Color.clear)
                    .overlay(
                        Circle()
                            .stroke(Color.primary.opacity(0.5), lineWidth: 0.6)
                            .opacity(i < taken ? 0 : 1)
                    )
                    .frame(width: 5, height: 5)
            }
        }
    }
}

// MARK: - Conditions row

struct TeeConditionsRow: View {
    let conditions: TeeCourseConditions?
    var hour: Int = 14

    private var sample: TeeHourlyCondition? {
        guard let hourly = conditions?.hourly, !hourly.isEmpty else { return nil }
        return hourly.first(where: { $0.h == hour }) ?? hourly[hourly.count / 2]
    }

    var body: some View {
        HStack(spacing: 16) {
            item("TEMP", sample.map { "\(Int($0.t.rounded()))°" } ?? "—")
            item(
                "WIND",
                sample.map { s in
                    "\(Int(s.w.rounded())) m/s\(s.dir.map { " \($0)" } ?? "")"
                } ?? "—"
            )
            item(
                "STIMP",
                conditions?.greenSpeed.map { String(format: "%.1f", $0) } ?? "—"
            )
            item(
                "MOWED",
                conditions?.mowedHrsAgo.map { "\($0)h ago" } ?? "—"
            )
        }
    }

    private func item(_ label: String, _ value: String) -> some View {
        HStack(spacing: 6) {
            TeeMicroLabel(text: label)
            Text(value)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundColor(Theme.ink)
        }
    }
}

// MARK: - Hero landscape (SwiftUI Canvas)

enum TeeHeroKind: String, CaseIterable {
    case parkland, links, championship, lakeside, farmland, mountain, fjord

    init(rawCourseType: String?) {
        if let raw = rawCourseType, let v = TeeHeroKind(rawValue: raw) {
            self = v
        } else {
            self = .parkland
        }
    }
}

struct TeeHeroLandscape: View {
    let kind: TeeHeroKind
    var height: CGFloat = 220

    var body: some View {
        Canvas { ctx, size in
            let w = size.width
            let h = size.height
            // Sky gradient
            ctx.fill(
                Path(CGRect(origin: .zero, size: size)),
                with: .linearGradient(
                    Gradient(colors: [Theme.bg2, Theme.bg]),
                    startPoint: CGPoint(x: 0, y: 0),
                    endPoint: CGPoint(x: 0, y: h)
                )
            )
            // Far hills
            var farHills = Path()
            farHills.move(to: CGPoint(x: 0, y: h * 0.68))
            farHills.addCurve(
                to: CGPoint(x: w, y: h * 0.65),
                control1: CGPoint(x: w * 0.3, y: h * 0.6),
                control2: CGPoint(x: w * 0.7, y: h * 0.7)
            )
            farHills.addLine(to: CGPoint(x: w, y: h))
            farHills.addLine(to: CGPoint(x: 0, y: h))
            farHills.closeSubpath()
            ctx.fill(farHills, with: .color(Theme.ink4.opacity(0.6)))

            // Mid hills
            var midHills = Path()
            midHills.move(to: CGPoint(x: 0, y: h * 0.78))
            midHills.addCurve(
                to: CGPoint(x: w, y: h * 0.78),
                control1: CGPoint(x: w * 0.3, y: h * 0.72),
                control2: CGPoint(x: w * 0.7, y: h * 0.84)
            )
            midHills.addLine(to: CGPoint(x: w, y: h))
            midHills.addLine(to: CGPoint(x: 0, y: h))
            midHills.closeSubpath()
            ctx.fill(midHills, with: .color(Theme.ink3.opacity(0.7)))

            // Optional water for lakeside / fjord
            if kind == .lakeside || kind == .fjord {
                let waterRect = CGRect(x: 0, y: h * 0.7, width: w, height: h * 0.3)
                ctx.fill(
                    Path(waterRect),
                    with: .linearGradient(
                        Gradient(colors: [Theme.ink3.opacity(0.6), Theme.ink4.opacity(0.6)]),
                        startPoint: CGPoint(x: 0, y: waterRect.minY),
                        endPoint: CGPoint(x: 0, y: waterRect.maxY)
                    )
                )
            }

            // Fairway
            var fairway = Path()
            fairway.move(to: CGPoint(x: 0, y: h * 0.93))
            fairway.addCurve(
                to: CGPoint(x: w, y: h * 0.93),
                control1: CGPoint(x: w * 0.3, y: h * 0.9),
                control2: CGPoint(x: w * 0.7, y: h * 0.96)
            )
            fairway.addLine(to: CGPoint(x: w, y: h))
            fairway.addLine(to: CGPoint(x: 0, y: h))
            fairway.closeSubpath()
            ctx.fill(fairway, with: .color(Theme.ink3.opacity(0.45)))

            // Trees (simple ovals) — fewer for links/farmland
            let treeCount: Int
            switch kind {
            case .links, .farmland, .fjord: treeCount = 0
            case .parkland, .championship, .mountain: treeCount = 4
            case .lakeside: treeCount = 3
            }
            let treeXs: [Double] = [0.1, 0.22, 0.78, 0.92]
            for i in 0..<treeCount {
                let cx = w * treeXs[i % treeXs.count]
                let cy = h * 0.66
                ctx.fill(
                    Path(ellipseIn: CGRect(x: cx - 12, y: cy - 14, width: 24, height: 28)),
                    with: .color(Theme.ink.opacity(0.5))
                )
            }

            // Flag — single signal-lime accent
            let fx = w * 0.65
            let fy = h * 0.85
            var pole = Path()
            pole.move(to: CGPoint(x: fx, y: fy))
            pole.addLine(to: CGPoint(x: fx, y: fy - 22))
            ctx.stroke(pole, with: .color(Theme.ink), lineWidth: 1)
            var flag = Path()
            flag.move(to: CGPoint(x: fx, y: fy - 22))
            flag.addLine(to: CGPoint(x: fx + 9, y: fy - 19))
            flag.addLine(to: CGPoint(x: fx, y: fy - 15))
            flag.closeSubpath()
            ctx.fill(flag, with: .color(Theme.accent))
        }
        .frame(height: height)
    }
}
