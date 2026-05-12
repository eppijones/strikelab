//
//  PracticeSessionSummaryView.swift
//  StrikeLabCaddie
//
//  Session-level tempo + club speed trends from captured motion. Green
//  rule marks the session average (where you clustered today); amber
//  marks your personal-window target midpoint from Profile.
//

import SwiftUI
import Charts

struct PracticeSessionSummaryView: View {
    let session: PracticeSession
    /// When nil, `PersonalWindow.fallback` is used for the reference club.
    var personalWindow: PersonalWindow?
    var armLengthMeters: Double? = nil

    @State private var strikeLabExportURL: URL?
    @State private var showStrikeLabExportShare = false
    private let exportManager = ExportManager()

    private var referenceClub: Club {
        session.focusClub ?? session.shots.last?.club ?? .iron7
    }

    private var window: PersonalWindow {
        personalWindow ?? PersonalWindow.fallback(for: referenceClub)
    }

    private struct TempoPoint: Identifiable {
        let id = UUID()
        let shot: Int
        let ratio: Double
    }

    private struct SpeedPoint: Identifiable {
        let id = UUID()
        let shot: Int
        let clubMph: Double
    }

    private var tempoPoints: [TempoPoint] {
        session.shots.enumerated().compactMap { idx, shot in
            guard let m = shot.motion else { return nil }
            let t = SwingAnalytics.tempo(m)
            guard let r = t.ratio else { return nil }
            return TempoPoint(shot: idx + 1, ratio: r)
        }
    }

    private var speedPoints: [SpeedPoint] {
        session.shots.enumerated().compactMap { idx, shot in
            guard let m = shot.motion else { return nil }
            let mph = SwingAnalytics.speeds(m, club: shot.club, armLengthMeters: armLengthMeters).clubSpeedMph
            return SpeedPoint(shot: idx + 1, clubMph: mph)
        }
    }

    private var avgTempo: Double? {
        let xs = tempoPoints.map(\.ratio)
        guard !xs.isEmpty else { return nil }
        return xs.reduce(0, +) / Double(xs.count)
    }

    private var avgClubMph: Double? {
        let xs = speedPoints.map(\.clubMph)
        guard !xs.isEmpty else { return nil }
        return xs.reduce(0, +) / Double(xs.count)
    }

    private var targetTempoMid: Double {
        (window.tempoWindowLo + window.tempoWindowHi) / 2
    }

    /// Personal hand-window midpoint mapped to estimated club speed for the reference club.
    private var targetClubMphMid: Double {
        let midHand = (window.handWindowLo + window.handWindowHi) / 2
        let lever = SwingLeverRatio.ratio(for: referenceClub)
        return midHand * lever
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                if tempoPoints.count >= 2, let avg = avgTempo {
                    chartCard(title: "Tempo (backswing / downswing)") {
                        Chart {
                            ForEach(tempoPoints) { p in
                                LineMark(
                                    x: .value("Shot", p.shot),
                                    y: .value("Ratio", p.ratio)
                                )
                                .foregroundStyle(Theme.accent)
                                PointMark(
                                    x: .value("Shot", p.shot),
                                    y: .value("Ratio", p.ratio)
                                )
                                .foregroundStyle(Theme.ink)
                            }
                            RuleMark(y: .value("Session avg", avg))
                                .foregroundStyle(Theme.accent.opacity(0.85))
                                .lineStyle(StrokeStyle(lineWidth: 2, dash: [4, 3]))
                            RuleMark(y: .value("Target mid", targetTempoMid))
                                .foregroundStyle(Theme.warn.opacity(0.9))
                                .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [2, 4]))
                        }
                        .chartYScale(domain: tempoYDomain)
                        .frame(height: 200)
                        legendLine(color: Theme.accent, label: "Session average")
                        legendLine(color: Theme.warn, label: "Your target band (mid)")
                    }
                } else {
                    emptyCard("Need at least two swings with motion and reliable tempo to chart a trend.")
                }

                if speedPoints.count >= 2, let avgMph = avgClubMph {
                    chartCard(title: "Club speed (mph)") {
                        Chart {
                            ForEach(speedPoints) { p in
                                LineMark(
                                    x: .value("Shot", p.shot),
                                    y: .value("mph", p.clubMph)
                                )
                                .foregroundStyle(Theme.accent)
                                PointMark(
                                    x: .value("Shot", p.shot),
                                    y: .value("mph", p.clubMph)
                                )
                                .foregroundStyle(Theme.ink)
                            }
                            RuleMark(y: .value("Session avg", avgMph))
                                .foregroundStyle(Theme.accent.opacity(0.85))
                                .lineStyle(StrokeStyle(lineWidth: 2, dash: [4, 3]))
                            RuleMark(y: .value("Target mid", targetClubMphMid))
                                .foregroundStyle(Theme.warn.opacity(0.9))
                                .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [2, 4]))
                        }
                        .frame(height: 200)
                        Text(
                            "Session avg \(Int(avgMph.rounded())) mph (\(Self.kmh(avgMph)) km/h) · Target mid \(Int(targetClubMphMid.rounded())) mph (\(Self.kmh(targetClubMphMid)) km/h)"
                        )
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                        legendLine(color: Theme.accent, label: "Session average")
                        legendLine(color: Theme.warn, label: "Typical band midpoint (from your window)")
                    }
                }

                sensorNote
            }
            .padding(16)
        }
        .nordicBackground()
        .navigationTitle("Session summary")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    if let url = exportManager.exportPracticeSessionForStrikeLab(session) {
                        strikeLabExportURL = url
                        showStrikeLabExportShare = true
                    }
                } label: {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Theme.accent)
                }
                .accessibilityLabel("Export session JSON for StrikeLab web")
            }
        }
        .sheet(isPresented: $showStrikeLabExportShare) {
            if let url = strikeLabExportURL {
                ShareSheet(items: [url])
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("CONSISTENCY")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.accent)
            Text("\(session.totalShots) swings · \(session.formattedDuration)")
                .font(Theme.titleFont(18))
                .foregroundColor(Theme.ink)
            Text("Green dashed = where you averaged this session. Amber dashed = midpoint of your personal target band (Profile).")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
        }
    }

    private var tempoYDomain: ClosedRange<Double> {
        let vals = tempoPoints.map(\.ratio) + [targetTempoMid]
        guard let lo = vals.min(), let hi = vals.max(), lo < hi else {
            return 2.0...4.0
        }
        let pad = max(0.08, (hi - lo) * 0.15)
        return (lo - pad)...(hi + pad)
    }

    private func chartCard<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            content()
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func legendLine(color: Color, label: String) -> some View {
        HStack(spacing: 8) {
            Rectangle()
                .fill(color)
                .frame(width: 18, height: 3)
            Text(label)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
    }

    private func emptyCard(_ text: String) -> some View {
        Text(text)
            .font(Theme.bodyFont(14))
            .foregroundColor(Theme.ink3)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.surface)
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var sensorNote: some View {
        Text("GPS fixes wrist location; motion fusion estimates tempo, plane, and speed. No consumer sensor is launch-monitor accurate — use this view for trends and consistency, not absolute carry.")
            .font(Theme.labelFont(10))
            .foregroundColor(Theme.ink3)
            .padding(12)
            .background(Theme.bg2)
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private static func kmh(_ mph: Double) -> Int {
        Int((mph * 1.60934).rounded())
    }
}
