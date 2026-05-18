//
//  ActiveRoundHomeView.swift
//  StrikeLabCaddie
//
//  When a round is in progress, the Round tab becomes a fast on-course
//  dashboard instead of the new-round picker. Shows the running score,
//  the current hole, and gives a single big tap to resume scoring. Also
//  surfaces a 9-hole strip and quick links to scorecard / shots / map.
//

import SwiftUI
import Combine

struct ActiveRoundHomeView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager

    @State private var resumeFromHole: Int?
    @State private var showScorecard = false
    @State private var showShots = false
    @State private var showEndRoundAlert = false
    @State private var showExtendRoundAlert = false
    @State private var summaryRound: Round?
    @State private var clockTick = Date()

    var body: some View {
        Group {
            if let round = persistenceManager.currentRound {
                content(for: round)
            } else {
                EmptyView()
            }
        }
        .nordicBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showEndRoundAlert = true
                } label: {
                    Image(systemName: "flag.checkered")
                        .foregroundColor(Theme.ink2)
                }
            }
        }
        .navigationDestination(item: $resumeFromHole) { hole in
            roundPagerDestination(jumpingTo: hole)
        }
        .navigationDestination(isPresented: $showScorecard) {
            if let _ = persistenceManager.currentRound {
                ScorecardView(round: roundBinding, isReadOnly: false)
            }
        }
        .navigationDestination(isPresented: $showShots) {
            if let _ = persistenceManager.currentRound {
                ShotListView(round: roundBinding)
            }
        }
        .alert("End round?", isPresented: $showEndRoundAlert) {
            Button("Save & complete", role: .destructive) {
                summaryRound = persistenceManager.completeCurrentRound()
                connectivityManager.sendRoundCleared()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This saves your scorecard, shots, GPS-backed round data, and queues the export sync.")
        }
        .alert("Extend to 18 holes?", isPresented: $showExtendRoundAlert) {
            Button("Play back 9") {
                extendCurrentRoundTo18()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Your current 9-hole scorecard stays intact and the round continues as a full 18.")
        }
        .fullScreenCover(item: $summaryRound) { snapshot in
            NavigationStack {
                RoundSummaryView(round: snapshot, onClose: {
                    summaryRound = nil
                })
                .environmentObject(persistenceManager)
            }
        }
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { now in
            clockTick = now
        }
    }

    @ViewBuilder
    private func content(for round: Round) -> some View {
        ScrollView {
            VStack(spacing: 14) {
                StrikeLabLogoLockup(subtitle: "Live round")
                    .padding(.top, 4)
                SLHeroHeader(
                    eyebrow: "Caddie live",
                    title: "On course.",
                    subtitle: "Score, shots, motion, and Watch capture stay in sync while you play."
                )
                heroCard(round: round)
                captureHealthCard(round: round)
                resumeCard(round: round)
                extendRoundCard(round: round)
                holeStrip(round: round)
                quickLinks
                Spacer(minLength: 30)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Hero

    private func heroCard(round: Round) -> some View {
        let _ = clockTick
        return VStack(spacing: 4) {
            Text(round.course.name.uppercased())
                .font(Theme.labelFont(11))
                .tracking(1.8)
                .foregroundColor(Theme.accent)

            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Text("\(round.grossTotal)")
                    .font(Theme.statFont(72))
                    .foregroundColor(Theme.ink)

                VStack(alignment: .leading, spacing: 2) {
                    Text(round.formattedOverUnder)
                        .font(Theme.statFont(20))
                        .foregroundColor(scoreColor(for: round))
                    Text("\(round.holesCompleted)/\(round.playFormat.totalHoles) holes")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }
            }
            .padding(.vertical, 6)

            HStack(spacing: 14) {
                miniStat(label: "PUTTS", value: "\(round.totalPutts)")
                divider
                miniStat(label: "NET", value: "\(round.netTotal)", tint: Theme.accent)
                divider
                miniStat(
                    label: "STBLF",
                    value: "\(StablefordCalculator.total(for: round))",
                    tint: Theme.warn
                )
                divider
                miniStat(label: "TIME", value: liveElapsed(for: round), tint: Theme.accent)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .glassCard(padding: 0)
    }

    private func scoreColor(for round: Round) -> Color {
        if round.grossOverUnder < 0 { return Theme.accent }
        if round.grossOverUnder > 0 { return Theme.bad }
        return Theme.ink
    }

    private func miniStat(label: String, value: String, tint: Color = Theme.ink) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(16))
                .foregroundColor(tint)
        }
    }

    private var divider: some View {
        Rectangle().fill(Theme.line).frame(width: 1, height: 24)
    }

    private func captureHealthCard(round: Round) -> some View {
        let shots = round.shots.count
        let planned = round.plannedShots.count
        let hr = round.shots.filter { $0.heartRate != nil }.count
        let motion = round.shots.filter { $0.motion != nil }.count
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Capture live", systemImage: connectivityManager.isWatchReachable ? "applewatch.radiowaves.left.and.right" : "applewatch.slash")
                    .font(Theme.labelFont(12))
                    .tracking(1.2)
                    .foregroundColor(connectivityManager.isWatchReachable ? Theme.accent : Theme.warn)
                Spacer()
                Text(connectivityManager.isWatchReachable ? "WATCH CONNECTED" : "CHECK WATCH")
                    .font(Theme.labelFont(10))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
            }
            HStack(spacing: 0) {
                miniStat(label: "SHOTS", value: "\(shots)", tint: Theme.accent)
                divider
                miniStat(label: "HR", value: "\(hr)")
                divider
                miniStat(label: "MOTION", value: "\(motion)")
                divider
                miniStat(label: "PLAN", value: "\(planned)", tint: Theme.warn)
            }
            Text("Every confirmed watch swing is saved as a shot row with club, hole, GPS and biometric context when available.")
                .font(Theme.bodyFont(12))
                .foregroundColor(Theme.ink3)
        }
        .padding(16)
        .glassCard(padding: 0)
    }

    private func liveElapsed(for round: Round) -> String {
        let _ = clockTick
        let total = max(0, Int((round.completedAt ?? clockTick).timeIntervalSince(round.date)))
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        let seconds = total % 60
        if hours > 0 {
            return "\(hours)h \(String(format: "%02d", minutes))m"
        }
        if minutes > 0 {
            return "\(minutes)m"
        }
        return "\(seconds)s"
    }

    // MARK: - Resume

    private func resumeCard(round: Round) -> some View {
        let hole = round.holes.first(where: { $0.holeNumber == round.currentHoleNumber })
        let par = hole?.par ?? 4

        return Button {
            resumeFromHole = round.currentHoleNumber
        } label: {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("RESUME · HOLE \(round.currentHoleNumber)")
                        .font(Theme.labelFont(11))
                        .tracking(1.8)
                        .foregroundColor(Theme.accentInk)
                    Text("Par \(par) · score this hole")
                        .font(Theme.bodyFont(13))
                        .foregroundColor(Theme.accentInk.opacity(0.85))
                }

                Spacer()

                Image(systemName: "chevron.right.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(Theme.accentInk)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .background(Theme.accent)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func extendRoundCard(round: Round) -> some View {
        if round.playFormat == .front9 {
            Button {
                showExtendRoundAlert = true
            } label: {
                HStack(spacing: 14) {
                    Image(systemName: "plus.circle")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(Theme.accent)
                        .frame(width: 28)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Extend to 18 holes")
                            .font(Theme.labelFont(14))
                            .tracking(1.0)
                            .foregroundColor(Theme.ink)
                        Text("Keep the front 9 and continue on hole 10")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink3)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Theme.ink3)
                }
                .padding()
                .glassCard(padding: 0)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Hole strip

    private func holeStrip(round: Round) -> some View {
        let format = round.playFormat
        let label: String = {
            switch format {
            case .full18: return "Front 9 / Back 9"
            case .front9: return "Front 9"
            case .back9:  return "Back 9"
            }
        }()

        return VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: label, trailing: "tap to jump")

            // Show one or two strips depending on format.
            if format == .full18 || format == .front9 {
                holeRow(holes: Array(round.holes.prefix(9)), round: round)
            }
            if format == .full18 || format == .back9 {
                holeRow(holes: Array(round.holes.suffix(9)), round: round)
            }
        }
    }

    private func holeRow(holes: [RoundHole], round: Round) -> some View {
        HStack(spacing: 4) {
            ForEach(holes) { hole in
                Button {
                    resumeFromHole = hole.holeNumber
                } label: {
                    holePill(hole: hole, isCurrent: hole.holeNumber == round.currentHoleNumber)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func holePill(hole: RoundHole, isCurrent: Bool) -> some View {
        let strokes = hole.grossStrokes ?? 0
        let pts = StablefordCalculator.points(for: hole)
        let scoreTint: Color = {
            guard let diff = hole.scoreToPar else { return Theme.ink3 }
            if diff < 0 { return Theme.accent }
            if diff == 0 { return Theme.ink }
            return Theme.bad
        }()

        return VStack(spacing: 1) {
            Text("\(hole.holeNumber)")
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
            Text(strokes > 0 ? "\(strokes)" : "–")
                .font(Theme.statFont(13))
                .foregroundColor(scoreTint)
            // Stableford pts under the score so confident players see
            // them without leaving the hole strip.
            Text(pts.map { "\($0)pt" } ?? " ")
                .font(Theme.labelFont(8))
                .tracking(0.6)
                .foregroundColor(Theme.warn.opacity(pts == nil ? 0 : 0.8))
        }
        .frame(maxWidth: .infinity, minHeight: 44)
        .background(isCurrent ? Theme.accent.opacity(0.15) : Theme.surface2)
        .overlay(Rectangle().stroke(isCurrent ? Theme.accent : Theme.line, lineWidth: 1))
    }

    // MARK: - Quick links

    private var quickLinks: some View {
        VStack(spacing: 10) {
            SectionLabel(text: "Tools")

            Button {
                showScorecard = true
            } label: {
                quickLinkRow(icon: "list.number", title: "Full scorecard", sub: "Edit any hole")
            }
            .buttonStyle(.plain)

            Button {
                showShots = true
            } label: {
                quickLinkRow(icon: "scope", title: "Shot log", sub: "Clubs, GPS, HR and motion")
            }
            .buttonStyle(.plain)
        }
    }

    private func quickLinkRow(icon: String, title: String, sub: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(Theme.accent)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(Theme.labelFont(14))
                    .tracking(1.0)
                    .foregroundColor(Theme.ink)
                Text(sub)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Theme.ink3)
        }
        .padding()
        .glassCard(padding: 0)
    }

    // MARK: - Bindings + destinations

    private var roundBinding: Binding<Round> {
        Binding<Round>(
            get: {
                persistenceManager.currentRound
                    ?? Round(course: CourseData.defaultCourse, player: persistenceManager.player)
            },
            set: { persistenceManager.currentRound = $0 }
        )
    }

    @ViewBuilder
    private func roundPagerDestination(jumpingTo hole: Int) -> some View {
        if persistenceManager.currentRound != nil {
            LiveHolePager(round: roundBinding)
                .onAppear {
                    // Jump the round to the requested hole so the pager
                    // opens on it; LiveHolePager reads currentHoleNumber.
                    if var r = persistenceManager.currentRound {
                        r.currentHoleNumber = hole
                        persistenceManager.currentRound = r
                    }
                }
        }
    }

    private func extendCurrentRoundTo18() {
        guard var round = persistenceManager.currentRound else { return }
        round.extendFrontNineToFull18()
        persistenceManager.currentRound = round
        connectivityManager.sendCurrentHole(round.currentHoleNumber)
        connectivityManager.sendRoundConfig(round)
        RoundLiveSync.syncNow(round: round, persistence: persistenceManager)
        resumeFromHole = round.currentHoleNumber
    }
}

extension Int: @retroactive Identifiable {
    public var id: Int { self }
}

#Preview {
    NavigationStack {
        ActiveRoundHomeView()
            .environmentObject(PersistenceManager())
            .environmentObject(WatchConnectivityManager())
    }
}
