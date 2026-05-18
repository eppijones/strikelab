//
//  TeeDiscoverView.swift
//  StrikeLabCaddie
//
//  Editorial Discover home for StrikeLab Tee on iPhone.
//

import SwiftUI

struct TeeDiscoverView: View {
    @EnvironmentObject var nav: TeeNavigation
    @State private var discover: TeeDiscoverResponse?
    @State private var passes: [TeePassResponse] = []
    @State private var error: String?
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                header
                if isLoading {
                    ProgressView()
                        .tint(Theme.accent)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 40)
                }
                if let error {
                    teeOfflineCard(message: error)
                } else if !isLoading, discover == nil, passes.isEmpty, error == nil {
                    teeOfflineCard(
                        message: "When the booking service is online, tee times and \"Best now\" windows appear here."
                    )
                }

                if !passes.isEmpty {
                    section(title: "SCHEDULED FOR YOU") {
                        VStack(spacing: 12) {
                            ForEach(passes.prefix(2)) { pass in
                                Button {
                                    nav.push(.pass(bookingId: pass.bookingId))
                                } label: {
                                    TeePassPreviewCard(pass: pass)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                if let d = discover {
                    if !d.todayWindow.isEmpty {
                        section(title: "TODAY'S WINDOW") {
                            VStack(spacing: 12) {
                                ForEach(d.todayWindow.prefix(4)) { slot in
                                    TeeRecommendedCard(slot: slot)
                                        .onTapGesture {
                                            nav.push(.courseHero(
                                                courseId: slot.courseId,
                                                date: slot.teeTime
                                            ))
                                        }
                                }
                            }
                        }
                    }
                    if !d.bestNow.isEmpty {
                        section(title: "BEST NOW") {
                            VStack(spacing: 12) {
                                ForEach(d.bestNow.prefix(4)) { slot in
                                    TeeRecommendedCard(slot: slot)
                                        .onTapGesture {
                                            nav.push(.courseHero(
                                                courseId: slot.courseId,
                                                date: slot.teeTime
                                            ))
                                        }
                                }
                            }
                        }
                    }
                    if !d.tonight.isEmpty {
                        section(title: "TONIGHT") {
                            VStack(spacing: 12) {
                                ForEach(d.tonight.prefix(3)) { slot in
                                    TeeRecommendedCard(slot: slot)
                                        .onTapGesture {
                                            nav.push(.courseHero(
                                                courseId: slot.courseId,
                                                date: slot.teeTime
                                            ))
                                        }
                                }
                            }
                        }
                    }
                    if !d.weekend.isEmpty {
                        section(title: "WEEKEND") {
                            VStack(spacing: 12) {
                                ForEach(d.weekend.prefix(3)) { slot in
                                    TeeRecommendedCard(slot: slot)
                                        .onTapGesture {
                                            nav.push(.courseHero(
                                                courseId: slot.courseId,
                                                date: slot.teeTime
                                            ))
                                        }
                                }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 32)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Tee")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { nav.push(.preferences) } label: {
                    Image(systemName: "slider.horizontal.3")
                }
                .tint(Theme.ink2)
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    @ViewBuilder
    private func section<Content: View>(
        title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            TeeMicroLabel(text: title)
            content()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            SLHeroHeader(
                eyebrow: "Play · Tee",
                title: "Where to play.",
                subtitle: "Spill mer. Bestill mindre. Internal availability and simulated checkout for this beta.",
                beta: true
            )
            Text(ReleasePolicy.teeBetaDisclosure)
                .font(Theme.labelFont(10))
                .tracking(1.2)
                .foregroundColor(Theme.warn)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.warn.opacity(0.08))
                .overlay(Rectangle().stroke(Theme.warn.opacity(0.5), lineWidth: 1))
        }
        .padding(.top, 8)
    }

    private func load() async {
        isLoading = true
        error = nil
        discover = nil
        passes = []
        do {
            async let d = TeeAPIClient.shared.discover()
            async let p = TeeAPIClient.shared.upcomingPasses()
            self.discover = try await d
            self.passes = try await p
        } catch {
            self.error = TeeUserFacingError.message(for: error)
        }
        isLoading = false
    }

    private func teeOfflineCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 22))
                .foregroundColor(Theme.warn)
            Text(message)
                .font(.system(size: 14))
                .foregroundColor(Theme.ink2)
                .fixedSize(horizontal: false, vertical: true)
            Text("Your courses and rounds on the Round tab work offline.")
                .font(.system(size: 12))
                .foregroundColor(Theme.ink3)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.bg2)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
}

// MARK: - Recommended card

struct TeeRecommendedCard: View {
    let slot: TeeRecommendedSlot

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                TeeHeroLandscape(
                    kind: TeeHeroKind(rawCourseType: slot.courseType),
                    height: 120
                )
                HStack {
                    if let label = slot.windowLabel?.replacingOccurrences(of: "-", with: " ") {
                        TeePill(text: label, tone: label.contains("golden") ? .accent : .neutral)
                    } else {
                        TeePill(text: hhmm(slot.teeTime), tone: .neutral)
                    }
                    Spacer()
                    if let drive = slot.driveMin {
                        TeePill(text: "\(drive) MIN", tone: .fjord)
                    }
                }
                .padding(8)
            }
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline) {
                    Text(slot.courseName)
                        .font(.system(size: 17, weight: .medium))
                        .foregroundColor(Theme.ink)
                    Spacer()
                    Text(hhmm(slot.teeTime))
                        .font(.system(size: 16, weight: .medium, design: .monospaced))
                        .foregroundColor(Theme.ink)
                }
                TeeMicroLabel(
                    text: [slot.courseCity, slot.courseRegion]
                        .compactMap { $0 }
                        .joined(separator: " · ")
                        .uppercased()
                )

                HStack(spacing: 12) {
                    if let t = slot.tempC {
                        Text("\(Int(t.rounded()))°")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(Theme.ink2)
                    }
                    if let w = slot.windMs {
                        Text("\(Int(w.rounded())) m/s")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(Theme.ink2)
                    }
                    if let r = slot.rainPct, r > 0.2 {
                        Text("RAIN \(Int((r * 100).rounded()))%")
                            .font(.system(size: 11, weight: .semibold, design: .monospaced))
                            .foregroundColor(Theme.warn)
                    }
                    Spacer()
                    Text("\(slot.available) OPEN")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                }

                if !slot.why.isEmpty {
                    Text(slot.why.joined(separator: " · ").uppercased())
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                        .lineLimit(1)
                }

                Divider().background(Theme.lineStrong)

                HStack {
                    Text("FROM")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                    Spacer()
                    if let p = slot.priceAmount {
                        Text("\(Int(p.rounded())) kr")
                            .font(.system(size: 13, weight: .medium, design: .monospaced))
                            .foregroundColor(Theme.ink)
                    } else {
                        Text("—")
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(Theme.ink3)
                    }
                }
            }
            .padding(14)
        }
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func hhmm(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }
}

// MARK: - Pass preview card

struct TeePassPreviewCard: View {
    let pass: TeePassResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            TeeHeroLandscape(kind: TeeHeroKind(rawCourseType: pass.courseType), height: 70)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    TeeMicroLabel(text: "READY IN")
                    Spacer()
                    Text(formatCountdown(pass.countdownSeconds))
                        .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        .foregroundColor(Theme.accent)
                }
                Text(pass.courseName)
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(Theme.ink)
                Text(hhmm(pass.teeTime))
                    .font(.system(size: 28, weight: .medium, design: .monospaced))
                    .foregroundColor(Theme.ink)
                if let code = pass.checkInCode {
                    Text(code)
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                        .tracking(2)
                        .foregroundColor(Theme.ink2)
                }
            }
            .padding(14)
        }
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func hhmm(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }

    private func formatCountdown(_ s: Int) -> String {
        guard s > 0 else { return "—" }
        let h = s / 3600
        let m = (s % 3600) / 60
        return h > 0 ? "\(h)t \(m)m" : "\(m)m"
    }
}
