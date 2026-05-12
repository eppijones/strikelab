//
//  LiveRangeDetailView.swift
//  StrikeLabCaddie
//
//  Tap-through detail for a live range session driven from the Apple
//  Watch. Surfaces every metric we track:
//   • Header — total swings, duration, active club
//   • Per-club table — count, share, last swing, auto/manual split
//   • Full swing log — every swing with timestamp, club, and a
//     tappable delete that round-trips back to the watch via WCSession.
//

import SwiftUI

struct LiveRangeDetailView: View {
    let session: PracticeSession

    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager

    /// Currently presented enhanced swing for the SwingCard sheet.
    @State private var presentedSwing: PresentedSwing?

    @State private var strikeLabExportURL: URL?
    @State private var showStrikeLabExportShare = false

    private let exportManager = ExportManager()

    private struct PresentedSwing: Identifiable, Equatable {
        let id: UUID
    }

    /// Same session id as the live buffer → stream edits from disk; otherwise
    /// show the passed snapshot (e.g. practice history) even if another live
    /// range is active.
    private var displayedSession: PracticeSession {
        if let live = persistenceManager.liveRangeSession, live.id == session.id {
            return live
        }
        return session
    }

    private var isViewingLiveRangeSession: Bool {
        guard let live = persistenceManager.liveRangeSession else { return false }
        return live.id == session.id
    }

    /// Personal window for the session’s focus club (or last club used).
    private var summaryPersonalWindow: PersonalWindow? {
        let s = displayedSession
        guard let club = s.focusClub ?? s.shots.last?.club else { return nil }
        return persistenceManager.player.personalWindows[club.rawValue]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                heroHeader
                captureQualityCard
                perClubTable
                swingLog
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
        .nordicBackground()
        .navigationTitle("Range Session")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    if let url = exportManager.exportPracticeSessionForStrikeLab(displayedSession) {
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
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink {
                    PracticeSessionSummaryView(
                        session: displayedSession,
                        personalWindow: summaryPersonalWindow,
                        armLengthMeters: persistenceManager.player.armLengthMeters
                    )
                } label: {
                    Text("Summary")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.accent)
                }
            }
        }
        .sheet(isPresented: $showStrikeLabExportShare) {
            if let url = strikeLabExportURL {
                ShareSheet(items: [url])
            }
        }
        .sheet(item: $presentedSwing) { swing in
            if let event = persistenceManager.enhancedShot(byId: swing.id) {
                SwingCardView(
                    event: event,
                    recentBaseline: persistenceManager.recentEnhancedShots
                )
                .environmentObject(persistenceManager)
            } else {
                Text("Could not load this swing.")
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink3)
                    .padding(24)
            }
        }
    }

    // MARK: - Hero

    private var heroHeader: some View {
        let s = displayedSession
        let total = s.shots.count
        let counts = Dictionary(grouping: s.shots, by: { $0.club }).mapValues(\.count)
        let activeClub = s.focusClub ?? counts.max(by: { $0.value < $1.value })?.key

        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Theme.accent)
                    .frame(width: 8, height: 8)
                Text("LIVE FROM WATCH")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.accent)
                Spacer()
                Text(s.formattedDuration)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }

            HStack(alignment: .firstTextBaseline, spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(total)")
                        .font(Theme.statFont(56))
                        .foregroundColor(Theme.ink)
                    Text(total == 1 ? "swing" : "swings")
                        .font(Theme.labelFont(11))
                        .tracking(1.2)
                        .foregroundColor(Theme.ink3)
                }
                Spacer()
                if let club = activeClub {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(club.shortName)
                            .font(Theme.statFont(38))
                            .foregroundColor(Theme.accent)
                        Text("ACTIVE CLUB")
                            .font(Theme.labelFont(10))
                            .tracking(1.4)
                            .foregroundColor(Theme.ink3)
                    }
                }
            }
        }
        .padding(16)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var captureQualityCard: some View {
        let q = persistenceManager.captureCompleteness(for: displayedSession)
        let tint: Color = q.total == 0 || q.motionPercent >= 80 ? Theme.accent : Theme.bad
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("CAPTURE QUALITY")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text("\(q.motionPercent)% motion")
                    .font(Theme.statFont(14))
                    .foregroundColor(tint)
            }
            HStack(spacing: 10) {
                qualityStat(label: "MOTION", value: "\(q.withMotion)/\(q.total)", tint: tint)
                qualityStat(label: "HR", value: "\(q.withHeartRate)", tint: Theme.ink2)
                qualityStat(label: "AUDIO", value: "\(q.withAudio)", tint: Theme.ink2)
            }
            Text(q.total == 0 ? "Hit 2-3 test swings before a full session." : q.summary)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(tint.opacity(0.65), lineWidth: 1))
    }

    private func qualityStat(label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.2)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(18))
                .foregroundColor(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    // MARK: - Per-club

    private var perClubTable: some View {
        let s = displayedSession
        let counts = Dictionary(grouping: s.shots, by: { $0.club })
            .mapValues { ($0.count, $0.last?.timestamp) }
        let total = max(1, s.shots.count)
        let rows = counts
            .sorted { $0.value.0 > $1.value.0 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("PER CLUB")
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.ink3)

            if rows.isEmpty {
                Text("No swings recorded yet.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                    .padding(.vertical, 12)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.element.key) { index, entry in
                        let (club, info) = entry
                        clubRow(
                            club: club,
                            count: info.0,
                            share: Double(info.0) / Double(total),
                            lastAt: info.1
                        )
                        if index < rows.count - 1 {
                            Rectangle()
                                .fill(Theme.line)
                                .frame(height: 1)
                        }
                    }
                }
                .background(Theme.surface)
                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
            }
        }
    }

    private func clubRow(club: Club, count: Int, share: Double, lastAt: Date?) -> some View {
        HStack(spacing: 10) {
            Text(club.shortName)
                .font(Theme.statFont(20))
                .foregroundColor(Theme.ink)
                .frame(width: 56, alignment: .leading)

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline) {
                    Text("\(count)")
                        .font(Theme.statFont(18))
                        .foregroundColor(Theme.accent)
                    Text(count == 1 ? "swing" : "swings")
                        .font(Theme.labelFont(10))
                        .tracking(1.0)
                        .foregroundColor(Theme.ink3)
                    Spacer()
                    Text(percent(share))
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Theme.surface2)
                            .frame(height: 4)
                        Rectangle()
                            .fill(Theme.accent)
                            .frame(width: max(4, geo.size.width * share), height: 4)
                    }
                }
                .frame(height: 4)

                if let lastAt {
                    Text("Last swing \(relativeTime(lastAt))")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    private func percent(_ x: Double) -> String {
        "\(Int((x * 100).rounded()))%"
    }

    // MARK: - Swing log

    private var swingLog: some View {
        let s = displayedSession
        let shots = Array(s.shots.reversed())  // newest first

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("SWING LOG")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(isViewingLiveRangeSession
                     ? "\(shots.count) total · tap × to delete"
                     : "\(shots.count) total · tap a swing for details")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
            }

            if shots.isEmpty {
                Text("Swing your driver to log the first one.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                    .padding(.vertical, 12)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(shots.enumerated()), id: \.element.id) { index, shot in
                        swingRow(shot: shot, displayIndex: shots.count - index)
                        if index < shots.count - 1 {
                            Rectangle()
                                .fill(Theme.line)
                                .frame(height: 1)
                        }
                    }
                }
                .background(Theme.surface)
                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
            }
        }
    }

    private func swingRow(shot: PracticeShot, displayIndex: Int) -> some View {
        let hasMotion = shot.motion != nil
        let hasAudio = persistenceManager.swingAudioURL(for: shot.id) != nil
        let canInspect = hasMotion || hasAudio
        return HStack(spacing: 10) {
            Text("#\(displayIndex)")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
                .frame(width: 32, alignment: .leading)

            Text(shot.club.shortName)
                .font(Theme.statFont(15))
                .foregroundColor(Theme.ink)
                .frame(width: 44, alignment: .leading)

            VStack(alignment: .leading, spacing: 1) {
                Text(absoluteTime(shot.timestamp))
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink2)
                Text(relativeTime(shot.timestamp))
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.ink3)
            }

            Spacer()

            // Tap opens Swing Card when we have motion/HR on the shot or a
            // shipped mic clip on the phone (buffer may have dropped the event).
            if canInspect {
                Image(systemName: hasMotion ? "waveform.path.ecg" : "waveform")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Theme.accent)
            }

            if isViewingLiveRangeSession {
                Button {
                    connectivityManager.sendRemoveRangeSwing(id: shot.id)
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(Theme.bad)
                        .frame(width: 30, height: 30)
                        .background(Theme.surface2)
                        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .contentShape(Rectangle())
        .onTapGesture {
            guard canInspect else { return }
            presentedSwing = PresentedSwing(id: shot.id)
        }
    }

    // MARK: - Time formatting

    private func relativeTime(_ ts: Date) -> String {
        let s = max(0, Int(Date().timeIntervalSince(ts)))
        if s < 60 { return "\(s)s ago" }
        let m = s / 60
        if m < 60 { return "\(m)m ago" }
        let h = m / 60
        return "\(h)h ago"
    }

    private func absoluteTime(_ ts: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f.string(from: ts)
    }
}
