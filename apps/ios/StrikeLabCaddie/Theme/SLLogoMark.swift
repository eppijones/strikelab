//
//  SLLogoMark.swift
//  StrikeLabCaddie
//
//  Brand mark for StrikeLabCaddie. Mirrors the current StrikeLab brand guide:
//  moss ring, hex-packed dimple field, and Oslo/strike point in sun yellow.
//

import SwiftUI

/// Animated StrikeLab mark. The guide specifies a 720ms mark animation that
/// replays every 4.4s: ring draws, dimples materialise outside-in, the strike
/// lands last. `accent` is kept for source compatibility with older callers.
struct SLLogoMark: View {
    var accent: Bool = true
    var animate: Bool = true

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        StrikeLabAnimatedMark(
            animate: animate && !reduceMotion,
            ringColor: StrikeLabBrand.moss,
            strikeColor: StrikeLabBrand.sun,
            dimpleColor: StrikeLabBrand.ink.opacity(0.32),
            fillColor: StrikeLabBrand.cream
        )
        .aspectRatio(1, contentMode: .fit)
    }
}

enum StrikeLabBrand {
    static let moss = Color(red: 0x2D / 255, green: 0x4A / 255, blue: 0x2B / 255)
    static let sun = Color(red: 0xE8 / 255, green: 0xB5 / 255, blue: 0x47 / 255)
    static let ink = Color(red: 0x0E / 255, green: 0x14 / 255, blue: 0x10 / 255)
    static let cream = Color(red: 0xFB / 255, green: 0xFA / 255, blue: 0xF6 / 255)
}

struct StrikeLabAnimatedMark: View {
    var animate = true
    var ringColor: Color = StrikeLabBrand.moss
    var strikeColor: Color = StrikeLabBrand.sun
    var dimpleColor: Color = StrikeLabBrand.ink.opacity(0.32)
    var fillColor: Color = StrikeLabBrand.cream

    private let loopDuration: TimeInterval = 4.4

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = animate
                ? timeline.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: loopDuration)
                : 0.72
            mark(phase: min(phase, 0.72))
        }
    }

    private func mark(phase: TimeInterval) -> some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let scale = size / 64
            let dimples = Self.orderedDimples

            ZStack {
                Circle()
                    .fill(fillColor)
                    .frame(width: 52 * scale, height: 52 * scale)

                Circle()
                    .trim(from: 0, to: ringProgress(phase))
                    .stroke(
                        ringColor,
                        style: StrokeStyle(lineWidth: max(3.2 * scale, 1.2), lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 52 * scale, height: 52 * scale)

                ForEach(dimples) { dimple in
                    let progress = dimpleProgress(phase, delay: dimple.delay)
                    Circle()
                        .fill(dimpleColor)
                        .frame(width: 2.7 * scale, height: 2.7 * scale)
                        .scaleEffect(0.2 + 0.95 * progress)
                        .opacity(0.32 * progress)
                        .position(point(x: dimple.x, y: dimple.y, size: size))
                }

                Circle()
                    .fill(strikeColor)
                    .frame(width: strikeDiameter(phase, scale: scale), height: strikeDiameter(phase, scale: scale))
                    .opacity(strikeProgress(phase) > 0 ? 1 : 0)
                    .position(point(x: 36, y: 26.5, size: size))
            }
            .frame(width: size, height: size)
            .position(x: geo.size.width / 2, y: geo.size.height / 2)
        }
    }

    private func point(x: CGFloat, y: CGFloat, size: CGFloat) -> CGPoint {
        let scale = size / 64
        return CGPoint(x: size / 2 + (x - 32) * scale, y: size / 2 + (y - 32) * scale)
    }

    private func ringProgress(_ phase: TimeInterval) -> CGFloat {
        easedProgress(phase / 0.32)
    }

    private func dimpleProgress(_ phase: TimeInterval, delay: TimeInterval) -> CGFloat {
        easedProgress((phase - delay) / 0.38)
    }

    private func strikeProgress(_ phase: TimeInterval) -> CGFloat {
        easedProgress((phase - 0.36) / 0.36)
    }

    private func strikeDiameter(_ phase: TimeInterval, scale: CGFloat) -> CGFloat {
        let p = strikeProgress(phase)
        guard p > 0 else { return 0 }
        let radius = p < 0.55
            ? 5.6 * (p / 0.55)
            : 5.6 - (5.6 - 4.6) * ((p - 0.55) / 0.45)
        return radius * 2 * scale
    }

    private func easedProgress(_ raw: TimeInterval) -> CGFloat {
        let clamped = min(1, max(0, raw))
        return CGFloat(1 - pow(1 - clamped, 3))
    }

    private struct Dimple: Identifiable {
        let id: Int
        let x: CGFloat
        let y: CGFloat
        let distance: CGFloat
        let delay: TimeInterval
    }

    private static let orderedDimples: [Dimple] = {
        let spacing: CGFloat = 5.2
        let rowHeight = spacing * sqrt(3) / 2
        let strike = CGPoint(x: 36, y: 26.5)
        var dimples: [(CGFloat, CGFloat, CGFloat)] = []

        for row in -5...5 {
            let y = 32 + CGFloat(row) * rowHeight
            let xOffset = abs(row) % 2 == 0 ? CGFloat(0) : spacing / 2
            for col in -5...5 {
                let x = 32 + CGFloat(col) * spacing + xOffset
                let distance = hypot(x - 32, y - 32)
                let strikeDistance = hypot(x - strike.x, y - strike.y)
                if distance <= 20, strikeDistance > 6.1 {
                    dimples.append((x, y, distance))
                }
            }
        }

        let maxDistance = dimples.map { $0.2 }.max() ?? 1
        return dimples
            .sorted { $0.2 > $1.2 }
            .enumerated()
            .map { index, dimple in
                let ringIndex = round((maxDistance - dimple.2) / 2.6)
                return Dimple(
                    id: index,
                    x: dimple.0,
                    y: dimple.1,
                    distance: dimple.2,
                    delay: 0.14 + TimeInterval(ringIndex) * 0.028
                )
            }
    }()
}

// MARK: - App Icon Surface

/// A 1024×1024 SwiftUI scene that gets baked to PNG for the AppIcon set.
/// Centres the mark on the brand background with breathing room.
struct SLAppIconSurface: View {
    var body: some View {
        ZStack {
            Theme.bg
            SLLogoMark(accent: true)
                .padding(140)
        }
        .frame(width: 1024, height: 1024)
    }
}

// MARK: - Brand Lockup

/// Compact StrikeLab lockup for authenticated app surfaces.
struct StrikeLabLogoLockup: View {
    var subtitle: String?
    var title: String = "STRIKELAB"
    var markSize: CGFloat = 34

    var body: some View {
        HStack(spacing: 12) {
            SLLogoMark(accent: false)
                .frame(width: markSize, height: markSize)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(Theme.labelFont(13))
                    .tracking(3.0)
                    .foregroundColor(Theme.ink)

                if let subtitle {
                    Text(subtitle.uppercased())
                        .font(Theme.labelFont(9))
                        .tracking(1.6)
                        .foregroundColor(Theme.ink3)
                }
            }

            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(subtitle == nil ? title : "\(title), \(subtitle ?? "")")
    }
}

#Preview("Mark · accent") {
    ZStack {
        Theme.bg.ignoresSafeArea()
        SLLogoMark(accent: true)
            .frame(width: 220, height: 220)
    }
}

#Preview("App icon surface") {
    SLAppIconSurface()
        .frame(width: 240, height: 240)
}
