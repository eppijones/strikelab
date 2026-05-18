//
//  GlassCard.swift
//  StrikeLabCaddie
//
//  Performance-instrument card primitives. Flat surfaces with a hairline
//  border, tuned for the dark StrikeLab design tokens.
//

import SwiftUI

/// Standard card — solid surface with a hairline rule, matches the iPad/web
/// `<Panel>` treatment from the design system.
struct GlassCard: ViewModifier {
    var cornerRadius: CGFloat = Theme.cornerRadius
    var padding: CGFloat = Theme.padding

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Theme.lineStrong, lineWidth: 1)
            )
    }
}

/// Compact panel — same language, smaller padding/corners. Used for inline
/// list rows and stat tiles where vertical rhythm matters.
struct CompactGlassCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(Theme.smallPadding)
            .background(
                RoundedRectangle(cornerRadius: Theme.smallCornerRadius, style: .continuous)
                    .fill(Theme.surface2)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.smallCornerRadius, style: .continuous)
                    .stroke(Theme.line, lineWidth: 1)
            )
    }
}

/// Translucent HUD pill for map overlays — frosted dark with hairline edge.
struct GlassHUD: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
                    .background(
                        Capsule()
                            .fill(Theme.bg.opacity(0.55))
                    )
            )
            .overlay(
                Capsule()
                    .stroke(Theme.lineStrong, lineWidth: 1)
            )
    }
}

// MARK: - View Extensions

extension View {
    /// Apply the standard StrikeLab panel style.
    func glassCard(cornerRadius: CGFloat = Theme.cornerRadius, padding: CGFloat = Theme.padding) -> some View {
        modifier(GlassCard(cornerRadius: cornerRadius, padding: padding))
    }

    /// Compact panel for tight rows.
    func compactGlassCard() -> some View {
        modifier(CompactGlassCard())
    }

    /// Frosted HUD pill.
    func glassHUD() -> some View {
        modifier(GlassHUD())
    }

    /// Tap target panel — surface tint that flips when selected.
    func selectionPanel(isSelected: Bool, accent: Color = Theme.accent) -> some View {
        self
            .background(
                RoundedRectangle(cornerRadius: Theme.smallCornerRadius, style: .continuous)
                    .fill(isSelected ? accent.opacity(0.18) : Theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.smallCornerRadius, style: .continuous)
                    .stroke(isSelected ? accent : Theme.line, lineWidth: 1)
            )
    }

    /// Booking-style flat panel with a square hairline edge.
    func slPanel(padding: CGFloat = Theme.padding) -> some View {
        self
            .padding(padding)
            .background(Theme.surfaceSolid)
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Theme.bg.ignoresSafeArea()

        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Panel")
                    .font(Theme.titleFont(20))
                    .foregroundColor(Theme.ink)

                Text("Hairline border, flat surface")
                    .font(Theme.bodyFont())
                    .foregroundColor(Theme.ink2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassCard()

            HStack {
                Text("72")
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.ink)
                Text("PAR")
                    .font(Theme.labelFont())
                    .foregroundColor(Theme.ink3)
            }
            .compactGlassCard()

            Text("245 yds")
                .font(Theme.statFont(14))
                .foregroundColor(Theme.ink)
                .glassHUD()
        }
        .padding()
    }
}
