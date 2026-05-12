//
//  TeeCourseDetailView.swift
//  StrikeLabCaddie
//
//  Course-as-place detail screen — editorial dark hero + live conditions +
//  best windows ribbon. Tap into the day grid or "the Window" view.
//

import SwiftUI

struct TeeCourseDetailView: View {
    @EnvironmentObject var nav: TeeNavigation
    let courseId: UUID
    let date: Date

    @State private var conditions: TeeCourseConditions?
    @State private var windows: [TeeBestWindow] = []
    @State private var sheet: TeeSheet?

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                ZStack(alignment: .bottomLeading) {
                    TeeHeroLandscape(
                        kind: TeeHeroKind(rawCourseType: heroKind),
                        height: 240
                    )
                    LinearGradient(
                        colors: [.clear, .clear, Theme.bg],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 240)
                    VStack(alignment: .leading, spacing: 6) {
                        TeeMicroLabel(text: locationLabel.uppercased())
                        Text(sheet?.courseName ?? "Course")
                            .font(.system(size: 32, weight: .medium))
                            .foregroundColor(Theme.ink)
                            .kerning(-1)
                    }
                    .padding(18)
                }

                VStack(alignment: .leading, spacing: 18) {
                    // Conditions panel
                    panel(title: "CONDITIONS", liveDot: true) {
                        TeeConditionsRow(conditions: conditions, hour: 14)
                    }

                    // Sun-arc strip
                    panel(title: "TODAY'S WINDOW") {
                        TeeSunArcStrip(
                            conditions: conditions,
                            highlightStart: windows.first?.startHour,
                            highlightEnd: windows.first?.endHour
                        )
                        if let c = conditions {
                            HStack {
                                Text("\(c.sunrise ?? "—") ↗ ↘ \(c.sunset ?? "—")")
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundColor(Theme.ink3)
                                Spacer()
                                if let g = c.goldenStart {
                                    Text("GOLDEN \(g)")
                                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                        .foregroundColor(Theme.accent)
                                }
                            }
                        }
                    }

                    // Best windows
                    panel(title: "TODAY'S BEST WINDOWS") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(windows) { w in
                                    TeeWindowCard(window: w)
                                }
                            }
                        }
                    }

                    // CTAs
                    HStack(spacing: 10) {
                        Button {
                            nav.push(.sheet(courseId: courseId, date: date))
                        } label: {
                            Text("OPEN DAY GRID →")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .tracking(1.6)
                                .foregroundColor(Theme.accentInk)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Theme.accent)
                        }
                        Button {
                            nav.push(.window(courseId: courseId, date: date))
                        } label: {
                            Text("OPEN WINDOW →")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .tracking(1.6)
                                .foregroundColor(Theme.ink)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Theme.surfaceSolid)
                                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                        }
                    }
                }
                .padding(18)
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var heroKind: String? {
        // Try to infer from sheet first; fall back to nil.
        sheet?.slots.first.flatMap { _ in nil }
    }

    private var locationLabel: String {
        // The sheet response only has the course name; for now just use the date.
        let f = DateFormatter()
        f.dateFormat = "EEEE, d MMM"
        return f.string(from: date)
    }

    private func load() async {
        do {
            async let cond = TeeAPIClient.shared.conditions(courseId: courseId, date: date)
            async let win = TeeAPIClient.shared.bestWindows(courseId: courseId, date: date)
            async let s = TeeAPIClient.shared.teeSheet(courseId: courseId, date: date)
            self.conditions = try await cond
            self.windows = try await win
            self.sheet = try await s
        } catch {
            print("Tee course detail load error: \(error)")
        }
    }

    @ViewBuilder
    private func panel<Content: View>(
        title: String,
        liveDot: Bool = false,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                TeeMicroLabel(text: title)
                Spacer()
                if liveDot {
                    HStack(spacing: 6) {
                        Circle().fill(Theme.accent).frame(width: 6, height: 6)
                        Text("LIVE")
                            .font(.system(size: 9, weight: .semibold, design: .monospaced))
                            .tracking(1.6)
                            .foregroundColor(Theme.accent)
                    }
                }
            }
            content()
        }
        .padding(14)
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
}

// MARK: - SunArcStrip

struct TeeSunArcStrip: View {
    let conditions: TeeCourseConditions?
    var highlightStart: Int?
    var highlightEnd: Int?

    var body: some View {
        GeometryReader { geo in
            Canvas { ctx, size in
                guard let hourly = conditions?.hourly, !hourly.isEmpty else { return }
                let startH = 5
                let endH = 21
                let baseline = size.height - 12
                let topPad: CGFloat = 8
                let xFor: (Int) -> CGFloat = { h in
                    12 + CGFloat(h - startH) / CGFloat(endH - startH) * (size.width - 24)
                }

                // Highlight band
                if let s = highlightStart, let e = highlightEnd {
                    let x1 = xFor(s)
                    let x2 = xFor(e)
                    let band = CGRect(x: x1, y: 4, width: x2 - x1, height: size.height - 16)
                    ctx.fill(Path(band), with: .color(Theme.accent.opacity(0.08)))
                    ctx.stroke(Path(band), with: .color(Theme.accent.opacity(0.5)), lineWidth: 1)
                }

                // Sun arc
                var arc = Path()
                arc.move(to: CGPoint(x: xFor(startH), y: baseline))
                for s in hourly {
                    let py = baseline - CGFloat(s.sun) * (size.height - topPad - 18)
                    arc.addLine(to: CGPoint(x: xFor(s.h), y: py))
                }
                arc.addLine(to: CGPoint(x: xFor(endH), y: baseline))
                arc.closeSubpath()
                ctx.fill(
                    arc,
                    with: .linearGradient(
                        Gradient(stops: [
                            .init(color: Theme.accent.opacity(0.5), location: 0),
                            .init(color: Theme.accent.opacity(0.05), location: 1),
                        ]),
                        startPoint: CGPoint(x: 0, y: 0),
                        endPoint: CGPoint(x: 0, y: size.height)
                    )
                )

                // Baseline
                ctx.stroke(
                    Path { p in
                        p.move(to: CGPoint(x: 12, y: baseline))
                        p.addLine(to: CGPoint(x: size.width - 12, y: baseline))
                    },
                    with: .color(Theme.lineStrong),
                    lineWidth: 1
                )
            }
        }
        .frame(height: 80)
    }
}

// MARK: - Window card

struct TeeWindowCard: View {
    let window: TeeBestWindow
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Circle()
                    .fill(window.accent == "sun" ? Theme.accent : Theme.ink2)
                    .frame(width: 6, height: 6)
                TeeMicroLabel(text: window.labelEn.uppercased())
            }
            Text(window.range)
                .font(.system(size: 18, weight: .medium, design: .monospaced))
                .foregroundColor(Theme.ink)
            Divider().background(Theme.lineStrong)
            HStack {
                Text(window.conditionsSummary)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(Theme.ink2)
                Spacer()
                Text("\(window.freeSlots) OPEN")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundColor(Theme.ink3)
            }
        }
        .padding(14)
        .frame(width: 220, alignment: .leading)
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
}
