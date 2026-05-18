//
//  Theme.swift
//  StrikeLabCaddie
//
//  Re-skinned to the unified StrikeLab "performance instrument" design system.
//  Mirrors packages/design-tokens/tokens.json and packages/design-swift/SLColors.
//

import SwiftUI

/// StrikeLab — performance instrument color + typography tokens.
enum Theme {
    // MARK: - Surfaces
    static let bg = Color(red: 0x0A / 255, green: 0x0B / 255, blue: 0x0A / 255)
    static let bg2 = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x12 / 255)
    static let surface = Color(red: 0x15 / 255, green: 0x18 / 255, blue: 0x16 / 255)
    static let surfaceSolid = Color(red: 0x15 / 255, green: 0x18 / 255, blue: 0x16 / 255)
    static let surface2 = Color(red: 0x1C / 255, green: 0x1F / 255, blue: 0x1D / 255)
    static let surface3 = Color(red: 0x23 / 255, green: 0x27 / 255, blue: 0x24 / 255)
    static let line = Color(red: 0x25 / 255, green: 0x29 / 255, blue: 0x26 / 255).opacity(0.7)
    static let lineStrong = Color(red: 0x2D / 255, green: 0x32 / 255, blue: 0x2F / 255)

    // MARK: - Ink ramp
    static let ink = Color(red: 0xED / 255, green: 0xE8 / 255, blue: 0xDE / 255)
    static let ink2 = Color(red: 0xB9 / 255, green: 0xB6 / 255, blue: 0xAC / 255)
    static let ink3 = Color(red: 0x76 / 255, green: 0x74 / 255, blue: 0x6B / 255)
    static let ink4 = Color(red: 0x4A / 255, green: 0x48 / 255, blue: 0x42 / 255)

    // MARK: - Signal
    /// Signal Lime — single positive accent.
    static let accent = Color(red: 0.812, green: 0.945, blue: 0.376)
    static let accentInk = Color(red: 0x0A / 255, green: 0x0B / 255, blue: 0x0A / 255)
    static let warn = Color(red: 0.945, green: 0.624, blue: 0.282)
    static let bad = Color(red: 0.886, green: 0.349, blue: 0.227)
    static let info = Color(red: 0.49, green: 0.68, blue: 0.86)

    // MARK: - Aliases for migration (legacy callers)
    static let nordicPaper = bg
    /// Was deep forest green — now mapped to ink so foreground reads on dark.
    static let nordicForest = ink
    /// Was sage — now mapped to the single positive accent (Signal Lime).
    static let nordicSage = accent
    /// Was champagne — now mapped to the secondary warn accent.
    static let champagne = warn
    /// Was a teal/cyan accent — collapsed onto the single Signal Lime accent.
    static let neuralCyan = accent
    static let overPar = bad
    static let neutral = ink3

    // MARK: - Typography
    static func statFont(_ size: CGFloat = 17) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
    static func titleFont(_ size: CGFloat = 28) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }
    static func bodyFont(_ size: CGFloat = 15) -> Font {
        .system(size: size, weight: .regular, design: .default)
    }
    static func labelFont(_ size: CGFloat = 10) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
    static func microFont(_ size: CGFloat = 10) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
    static func displayFont(_ size: CGFloat = 34) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }

    // MARK: - Shape
    static let cornerRadius: CGFloat = 2
    static let smallCornerRadius: CGFloat = 2
    static let padding: CGFloat = 14
    static let smallPadding: CGFloat = 10

    // MARK: - Motion
    static let springAnimation = Animation.spring(response: 0.48, dampingFraction: 0.85)
    static let quickSpring = Animation.spring(response: 0.24, dampingFraction: 0.85)
}

extension Color {
    static func scoreColor(strokes: Int?, par: Int) -> Color {
        guard let strokes else { return Theme.ink3 }
        let diff = strokes - par
        if diff < 0 { return Theme.accent }
        if diff == 0 { return Theme.ink }
        return Theme.bad
    }
}

extension View {
    func nordicBackground() -> some View {
        self.background(Theme.bg.ignoresSafeArea())
    }

    func primaryButton() -> some View {
        self
            .font(.system(size: 11, weight: .medium, design: .monospaced))
            .tracking(1.8)
            .textCase(.uppercase)
            .foregroundColor(Theme.accentInk)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Theme.accent)
    }

    func secondaryButton() -> some View {
        self
            .font(.system(size: 11, weight: .medium, design: .monospaced))
            .tracking(1.8)
            .textCase(.uppercase)
            .foregroundColor(Theme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    func betaSecondaryButton() -> some View {
        self
            .font(.system(size: 11, weight: .semibold, design: .monospaced))
            .tracking(1.8)
            .textCase(.uppercase)
            .foregroundColor(Theme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Theme.surfaceSolid)
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
}

// MARK: - Section Label

/// Small, mono ALL CAPS section label — used at the top of every grouped block.
struct SectionLabel: View {
    let text: String
    var trailing: String? = nil

    var body: some View {
        HStack {
            Text(text.uppercased())
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.ink3)
            Spacer()
            if let trailing {
                Text(trailing.uppercased())
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
            }
        }
    }
}

// MARK: - Booking Beta Primitives

struct BetaBadge: View {
    var label: String = "Beta"
    var tone: Tone = .warn

    enum Tone {
        case warn, accent, neutral
    }

    var body: some View {
        Text(label)
            .font(Theme.labelFont(9))
            .tracking(1.8)
            .textCase(.uppercase)
            .foregroundColor(foreground)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(background)
            .overlay(Rectangle().stroke(border, lineWidth: 1))
            .accessibilityLabel("\(label) feature")
    }

    private var foreground: Color {
        switch tone {
        case .warn: return Theme.warn
        case .accent: return Theme.accent
        case .neutral: return Theme.ink2
        }
    }

    private var background: Color {
        switch tone {
        case .warn: return Theme.warn.opacity(0.08)
        case .accent: return Theme.accent.opacity(0.08)
        case .neutral: return Color.clear
        }
    }

    private var border: Color {
        switch tone {
        case .warn: return Theme.warn.opacity(0.65)
        case .accent: return Theme.accent.opacity(0.65)
        case .neutral: return Theme.lineStrong
        }
    }
}

struct SLPanel<Content: View>: View {
    var id: String?
    var title: String?
    var trailing: String?
    var padded: Bool = true
    private let content: Content

    init(
        id: String? = nil,
        title: String? = nil,
        trailing: String? = nil,
        padded: Bool = true,
        @ViewBuilder content: () -> Content
    ) {
        self.id = id
        self.title = title
        self.trailing = trailing
        self.padded = padded
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if id != nil || title != nil || trailing != nil {
                HStack(spacing: 10) {
                    if let id {
                        Text(id)
                            .font(Theme.labelFont(10))
                            .foregroundColor(Theme.ink4)
                    }
                    if let title {
                        Text(title.uppercased())
                            .font(Theme.labelFont(10))
                            .tracking(1.8)
                            .foregroundColor(Theme.ink2)
                    }
                    Spacer()
                    if let trailing {
                        Text(trailing.uppercased())
                            .font(Theme.labelFont(10))
                            .tracking(1.4)
                            .foregroundColor(Theme.ink3)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(Theme.lineStrong).frame(height: 1)
                }
            }

            content
                .padding(padded ? 14 : 0)
        }
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
}

struct SLMetric: View {
    let label: String
    let value: String
    var unit: String?
    var tint: Color = Theme.ink

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(Theme.labelFont(9))
                .tracking(1.6)
                .foregroundColor(Theme.ink3)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(Theme.statFont(24))
                    .foregroundColor(tint)
                if let unit {
                    Text(unit.uppercased())
                        .font(Theme.labelFont(9))
                        .tracking(1.2)
                        .foregroundColor(Theme.ink3)
                }
            }
        }
    }
}

struct SLHeroHeader: View {
    var eyebrow: String
    var title: String
    var subtitle: String?
    var beta: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(eyebrow.uppercased())
                    .font(Theme.labelFont(10))
                    .tracking(1.8)
                    .foregroundColor(Theme.ink3)
                if beta {
                    BetaBadge()
                }
            }
            Text(title)
                .font(Theme.displayFont(36))
                .kerning(-1.25)
                .foregroundColor(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let subtitle {
                Text(subtitle)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
