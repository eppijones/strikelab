//
//  SLLogoMark.swift
//  StrikeLabCaddie
//
//  Brand mark for StrikeLabCaddie. A precision-instrument reticule with the
//  "SL" monogram inside — communicates the "performance instrument" identity
//  in one shape. Renders crisply at any size.
//

import SwiftUI

/// The reticule + SL monogram brand mark. Use anywhere we'd previously
/// have shown a logo or splash visual. Looks correct on dark surfaces.
struct SLLogoMark: View {
    /// Scaled to fit any container. Pass `accent: true` to make the ring
    /// pick up the lime accent (used for app icon / hero) or false for
    /// monochrome ink (used in compact UI like nav titles).
    var accent: Bool = true

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let stroke: CGFloat = max(size * 0.045, 1)
            let halfStroke = stroke / 2

            ZStack {
                // Outer ring — the reticule
                Circle()
                    .strokeBorder(ringColor, lineWidth: stroke)
                    .padding(halfStroke)

                // Inner concentric tick ring
                Circle()
                    .strokeBorder(Theme.ink3.opacity(0.45), lineWidth: max(size * 0.012, 0.6))
                    .padding(size * 0.12)

                // Crosshair lines that stop short of center to leave room
                // for the monogram. Long horizontal ticks emphasise the
                // "instrument" feel.
                CrosshairShape()
                    .stroke(Theme.ink3.opacity(0.55), lineWidth: max(size * 0.012, 0.6))
                    .frame(width: size * 0.86, height: size * 0.86)

                // SL monogram — rendered as a single stylised path so it
                // reads as a mark, not text.
                MonogramShape()
                    .fill(Theme.ink)
                    .frame(width: size * 0.42, height: size * 0.42)

                // Single accent dot at the lower-right tick — a subtle
                // "signal" reference matching Signal Lime branding.
                Circle()
                    .fill(Theme.accent)
                    .frame(width: size * 0.06, height: size * 0.06)
                    .offset(x: size * 0.32, y: size * 0.32)
            }
            .frame(width: size, height: size)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1, contentMode: .fit)
    }

    private var ringColor: Color {
        accent ? Theme.accent : Theme.ink
    }
}

// MARK: - Crosshair

private struct CrosshairShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let cx = rect.midX
        let cy = rect.midY
        let outer = min(rect.width, rect.height) / 2
        let innerGap = outer * 0.32

        // Top tick
        path.move(to: CGPoint(x: cx, y: rect.minY))
        path.addLine(to: CGPoint(x: cx, y: cy - innerGap))

        // Bottom tick
        path.move(to: CGPoint(x: cx, y: cy + innerGap))
        path.addLine(to: CGPoint(x: cx, y: rect.maxY))

        // Left tick
        path.move(to: CGPoint(x: rect.minX, y: cy))
        path.addLine(to: CGPoint(x: cx - innerGap, y: cy))

        // Right tick
        path.move(to: CGPoint(x: cx + innerGap, y: cy))
        path.addLine(to: CGPoint(x: rect.maxX, y: cy))

        return path
    }
}

// MARK: - SL Monogram

/// Stacked S over L drawn as one continuous mark. Sized to fit a square
/// drawing area; the actual frame is set by the caller.
private struct MonogramShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()

        // S — top half. Draw as two arcs forming an S.
        let w = rect.width
        let h = rect.height
        let strokeWidth = h * 0.18

        // Top S — built from two flat bars and a connector for a chunkier
        // industrial feel rather than calligraphic.
        let topRect = CGRect(x: rect.minX, y: rect.minY, width: w, height: h * 0.46)
        path.addPath(sShape(in: topRect, strokeWidth: strokeWidth))

        // Bottom L — sits below.
        let bottomY = rect.minY + h * 0.5
        // Vertical stem of the L
        path.addRect(CGRect(
            x: rect.minX,
            y: bottomY,
            width: strokeWidth,
            height: h * 0.5
        ))
        // Horizontal foot of the L
        path.addRect(CGRect(
            x: rect.minX,
            y: rect.maxY - strokeWidth,
            width: w,
            height: strokeWidth
        ))

        return path
    }

    private func sShape(in rect: CGRect, strokeWidth: CGFloat) -> Path {
        var p = Path()
        // Top horizontal bar
        p.addRect(CGRect(
            x: rect.minX,
            y: rect.minY,
            width: rect.width,
            height: strokeWidth
        ))
        // Middle horizontal bar
        let midY = rect.midY - strokeWidth / 2
        p.addRect(CGRect(
            x: rect.minX,
            y: midY,
            width: rect.width,
            height: strokeWidth
        ))
        // Bottom horizontal bar
        p.addRect(CGRect(
            x: rect.minX,
            y: rect.maxY - strokeWidth,
            width: rect.width,
            height: strokeWidth
        ))
        // Left vertical (top half)
        p.addRect(CGRect(
            x: rect.minX,
            y: rect.minY,
            width: strokeWidth,
            height: (rect.height / 2)
        ))
        // Right vertical (bottom half)
        p.addRect(CGRect(
            x: rect.maxX - strokeWidth,
            y: rect.midY - strokeWidth / 2,
            width: strokeWidth,
            height: (rect.height / 2) + strokeWidth / 2
        ))
        return p
    }
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
