import SwiftUI

/// Watch-side reflection of the StrikeLab design tokens. The full Theme on
/// iOS already mirrors these; this file lives in the watch target so the new
/// caddie screens compile without depending on the iOS package.
enum SLW {
    static let bg = Color(red: 0xF3 / 255, green: 0xEC / 255, blue: 0xDE / 255)
    static let bg2 = Color(red: 0xEA / 255, green: 0xE0 / 255, blue: 0xCF / 255)
    static let surface = Color(red: 0xFA / 255, green: 0xF5 / 255, blue: 0xE9 / 255)
    static let surface2 = Color(red: 0xE6 / 255, green: 0xDB / 255, blue: 0xC7 / 255)
    static let line = Color(red: 0xC9 / 255, green: 0xBA / 255, blue: 0xA2 / 255)
    static let ink = Color(red: 0x16 / 255, green: 0x18 / 255, blue: 0x14 / 255)
    static let ink2 = Color(red: 0x5F / 255, green: 0x56 / 255, blue: 0x48 / 255)
    static let ink3 = Color(red: 0x8B / 255, green: 0x7D / 255, blue: 0x68 / 255)
    static let accent = Color(red: 0x95 / 255, green: 0x68 / 255, blue: 0x2F / 255)
    static let accentInk = Color(red: 0xFF / 255, green: 0xF8 / 255, blue: 0xEA / 255)
    static let warn = Color(red: 0xC3 / 255, green: 0x86 / 255, blue: 0x34 / 255)
    static let bad = Color(red: 0xB5 / 255, green: 0x42 / 255, blue: 0x2E / 255)

    static func mono(_ size: CGFloat = 11, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
    static func display(_ size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }
    static func num(_ size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
}

/// Watch panel — flat, hairline border, optional micro title.
struct SLWPanel<Content: View>: View {
    var title: String?
    var content: () -> Content

    init(_ title: String? = nil, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let title {
                Text(title.uppercased())
                    .font(SLW.mono(8))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
            }
            content()
        }
        .padding(8)
        .background(SLW.surface2)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }
}

struct SLWAnimatedMark: View {
    var size: CGFloat
    var animate = true

    private let loopDuration: TimeInterval = 4.4

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = animate
                ? timeline.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: loopDuration)
                : 0.72
            mark(phase: min(phase, 0.72))
        }
        .frame(width: size, height: size)
    }

    private func mark(phase: TimeInterval) -> some View {
        let scale = size / 64
        return ZStack {
            Circle()
                .fill(Color(red: 0xFB / 255, green: 0xFA / 255, blue: 0xF6 / 255))
                .frame(width: 52 * scale, height: 52 * scale)

            Circle()
                .trim(from: 0, to: ringProgress(phase))
                .stroke(
                    Color(red: 0x2D / 255, green: 0x4A / 255, blue: 0x2B / 255),
                    style: StrokeStyle(lineWidth: max(3.2 * scale, 1.2), lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .frame(width: 52 * scale, height: 52 * scale)

            ForEach(Self.orderedDimples) { dimple in
                let progress = dimpleProgress(phase, delay: dimple.delay)
                Circle()
                    .fill(Color(red: 0x0E / 255, green: 0x14 / 255, blue: 0x10 / 255).opacity(0.32))
                    .frame(width: 2.7 * scale, height: 2.7 * scale)
                    .scaleEffect(0.2 + 0.95 * progress)
                    .opacity(0.32 * progress)
                    .position(point(x: dimple.x, y: dimple.y))
            }

            Circle()
                .fill(Color(red: 0xE8 / 255, green: 0xB5 / 255, blue: 0x47 / 255))
                .frame(width: strikeDiameter(phase, scale: scale), height: strikeDiameter(phase, scale: scale))
                .opacity(strikeProgress(phase) > 0 ? 1 : 0)
                .position(point(x: 36, y: 26.5))
        }
        .frame(width: size, height: size)
    }

    private func point(x: CGFloat, y: CGFloat) -> CGPoint {
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
        let progress = strikeProgress(phase)
        guard progress > 0 else { return 0 }
        let radius = progress < 0.55
            ? 5.6 * (progress / 0.55)
            : 5.6 - (5.6 - 4.6) * ((progress - 0.55) / 0.45)
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
        let delay: TimeInterval
    }

    private static let orderedDimples: [Dimple] = {
        let spacing: CGFloat = 5.2
        let rowHeight = spacing * sqrt(3) / 2
        let strike = CGPoint(x: 36, y: 26.5)
        var dimples: [(x: CGFloat, y: CGFloat, distance: CGFloat)] = []

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

        let maxDistance = dimples.map { $0.distance }.max() ?? 1
        return dimples
            .sorted { $0.distance > $1.distance }
            .enumerated()
            .map { index, dimple in
                let ringIndex = round((maxDistance - dimple.distance) / 2.6)
                return Dimple(
                    id: index,
                    x: dimple.x,
                    y: dimple.y,
                    delay: 0.14 + TimeInterval(ringIndex) * 0.028
                )
            }
    }()
}

struct SLWStatusWash: View {
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .topTrailing) {
                RadialGradient(
                    colors: [
                        Color(red: 0x2D / 255, green: 0x4A / 255, blue: 0x2B / 255).opacity(0.42),
                        Color(red: 0x2D / 255, green: 0x4A / 255, blue: 0x2B / 255).opacity(0.18),
                        .clear
                    ],
                    center: .topTrailing,
                    startRadius: 2,
                    endRadius: min(geometry.size.width, geometry.size.height) * 0.58
                )
                .frame(width: geometry.size.width * 0.58, height: geometry.size.height * 0.34)
                .allowsHitTesting(false)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
        }
        .allowsHitTesting(false)
    }
}

extension View {
    func slwStatusWash() -> some View {
        overlay(SLWStatusWash())
    }
}
