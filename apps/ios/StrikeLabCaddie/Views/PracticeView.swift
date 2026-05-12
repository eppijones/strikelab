//
//  PracticeView.swift
//  StrikeLabCaddie
//
//  Practice session tracking view
//

import SwiftUI

struct PracticeView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager

    @State private var currentSession: PracticeSession?
    @State private var selectedClub: Club = .iron7
    @State private var selectedQuality: ShotQuality = .good
    @State private var selectedMissType: MissType?
    @State private var estimatedDistance: String = ""
    @State private var showHistory = false
    @State private var showEndSessionAlert = false
    @State private var showDiscardLiveAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                headerSection
                    .padding(.top, 4)

                // When the watch is streaming a live range session, show
                // it instead of the start prompt — the user is actively
                // hitting balls and wants the live tally.
                if let live = persistenceManager.liveRangeSession {
                    liveRangeCard(session: live)
                } else if let session = currentSession {
                    activeSessionView(session)
                } else {
                    startSessionView
                    if !persistenceManager.practiceSessions.isEmpty {
                        recentSessionsSection
                    }
                }

                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showHistory) {
            NavigationStack {
                PracticeHistoryView()
                    .environmentObject(connectivityManager)
            }
        }
        .alert("End Session?", isPresented: $showEndSessionAlert) {
            Button("Cancel", role: .cancel) { }
            Button("End", role: .destructive) {
                endSession()
            }
        } message: {
            Text("This will save your practice session with \(currentSession?.totalShots ?? 0) shots.")
        }
        .alert("Discard live session?", isPresented: $showDiscardLiveAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Discard", role: .destructive) {
                persistenceManager.liveRangeSession = nil
            }
        } message: {
            let n = persistenceManager.liveRangeSession?.shots.count ?? 0
            Text("This permanently deletes the \(n) swing\(n == 1 ? "" : "s") logged so far. The watch will keep its own copy until you end the session there too.")
        }
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text("STRIKELAB")
                    .font(Theme.labelFont(11))
                    .tracking(1.8)
                    .foregroundColor(Theme.accent)

                Text("Practice Mode")
                    .font(Theme.titleFont(28))
                    .foregroundColor(Theme.ink)
            }

            Spacer()

            NavigationLink {
                SwingInspectorView()
            } label: {
                VStack(alignment: .trailing, spacing: 2) {
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 18))
                        .foregroundColor(Theme.accent)
                    Text("SWINGS")
                        .font(Theme.labelFont(8))
                        .tracking(1.2)
                        .foregroundColor(Theme.ink3)
                }
            }
            .accessibilityLabel("Swing insights")

            if !persistenceManager.practiceSessions.isEmpty {
                Button {
                    showHistory = true
                } label: {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 20))
                        .foregroundColor(Theme.ink2)
                }
            }
        }
    }
    
    // MARK: - Start Session View
    
    // MARK: - Live range card (driven by the watch)

    private func liveRangeCard(session: PracticeSession) -> some View {
        let counts = Dictionary(grouping: session.shots, by: { $0.club })
            .mapValues { $0.count }
        let total = session.shots.count
        let topClubs = counts.sorted { $0.value > $1.value }.prefix(8)
        let activeClub = session.focusClub ?? counts.max(by: { $0.value < $1.value })?.key
        let recent = session.shots.suffix(8).reversed()

        return VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Theme.accent)
                    .frame(width: 8, height: 8)
                Text("RANGE · LIVE FROM WATCH")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.accent)
                Spacer()
                Text(session.formattedDuration)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }

            // Tappable header → opens the rich detail view with all
            // per-club stats, full swing list, and per-swing delete.
            NavigationLink {
                LiveRangeDetailView(session: session)
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "chart.bar.xaxis")
                        .font(.system(size: 11))
                        .foregroundColor(Theme.accent)
                    Text("FULL STATS · SWING LIST")
                        .font(Theme.labelFont(10))
                        .tracking(1.4)
                        .foregroundColor(Theme.accent)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(Theme.accent)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Theme.accent.opacity(0.10))
                .overlay(Rectangle().stroke(Theme.accent.opacity(0.45), lineWidth: 1))
            }
            .buttonStyle(.plain)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(activeClub?.shortName ?? "—")
                    .font(Theme.statFont(56))
                    .foregroundColor(Theme.ink)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(total)")
                        .font(Theme.statFont(28))
                        .foregroundColor(Theme.accent)
                    Text(total == 1 ? "swing" : "swings")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }
                Spacer()
            }

            if !topClubs.isEmpty {
                Text("PER CLUB")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(Array(topClubs), id: \.key) { (club, count) in
                        VStack(spacing: 2) {
                            Text(club.shortName)
                                .font(Theme.statFont(13))
                                .foregroundColor(Theme.ink)
                            Text("\(count)")
                                .font(Theme.labelFont(11))
                                .foregroundColor(Theme.accent)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(Theme.surface2)
                        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                    }
                }
            }

            if !recent.isEmpty {
                HStack {
                    Text("RECENT SWINGS")
                        .font(Theme.labelFont(10))
                        .tracking(1.4)
                        .foregroundColor(Theme.ink3)
                    Spacer()
                    Text("Tap × to delete a practice swing")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(Array(recent), id: \.id) { shot in
                            recentSwingChip(shot)
                        }
                    }
                }
            }

            // Manual SAVE NOW — works even when the watch is out of
            // range or its battery has died. The session is moved to
            // history immediately and a later rangeEnded from the
            // watch will merge in idempotently (no duplicate).
            HStack(spacing: 8) {
                Button {
                    persistenceManager.endLiveRangeSessionManually()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 12, weight: .semibold))
                        Text("SAVE NOW")
                            .font(Theme.labelFont(11))
                            .tracking(1.4)
                    }
                    .foregroundColor(Theme.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 36)
                    .background(Theme.accent)
                }
                .buttonStyle(.plain)
                .disabled(session.shots.isEmpty)

                Button {
                    showDiscardLiveAlert = true
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Theme.bad)
                        .frame(width: 44, height: 36)
                        .overlay(Rectangle().stroke(Theme.bad.opacity(0.6), lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 4)

            Text("Saves automatically when you end the session on the watch. Press SAVE NOW any time you want to commit progress without ending — your data is journaled to disk on every swing.")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .padding(16)
        .glassCard(padding: 0)
    }

    private func recentSwingChip(_ shot: PracticeShot) -> some View {
        HStack(spacing: 6) {
            VStack(alignment: .leading, spacing: 1) {
                Text(shot.club.shortName)
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.ink)
                Text(relativeTime(shot.timestamp))
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.ink3)
            }
            Button {
                connectivityManager.sendRemoveRangeSwing(id: shot.id)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(Theme.bad)
                    .frame(width: 22, height: 22)
                    .background(Theme.surface2)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func relativeTime(_ ts: Date) -> String {
        let s = max(0, Int(Date().timeIntervalSince(ts)))
        if s < 60 { return "\(s)s ago" }
        let m = s / 60
        if m < 60 { return "\(m)m ago" }
        let h = m / 60
        return "\(h)h ago"
    }

    private var startSessionView: some View {
        VStack(spacing: 18) {
            Image(systemName: "figure.golf")
                .font(.system(size: 56))
                .foregroundColor(Theme.ink3)

            Text("Ready to dial in?")
                .font(Theme.titleFont(22))
                .foregroundColor(Theme.ink)

            Text("Every shot becomes a data point. Track quality, miss tendencies and gap distances right from the bay.")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.ink2)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)

            Button {
                startSession()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "play.fill")
                    Text("Start Practice Session")
                }
                .primaryButton()
            }
            .padding(.top, 8)
        }
        .padding(.vertical, 40)
        .frame(maxWidth: .infinity)
        .glassCard()
    }
    
    // MARK: - Active Session View
    
    private func activeSessionView(_ session: PracticeSession) -> some View {
        VStack(spacing: 20) {
            // Session stats
            sessionStatsCard(session)
            
            // Club selector
            clubSelectorSection
            
            // Quality selector
            qualitySelectorSection
            
            // Miss type (if not pure/good)
            if selectedQuality == .okay || selectedQuality == .miss {
                missTypeSelectorSection
            }
            
            // Log shot button
            Button {
                logShot()
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Log Shot")
                }
                .primaryButton()
            }
            
            // Recent shots
            if !session.shots.isEmpty {
                recentShotsSection(session)
            }
            
            // End session button
            Button {
                showEndSessionAlert = true
            } label: {
                HStack {
                    Image(systemName: "flag.checkered")
                    Text("End Session")
                }
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.overPar)
            }
            .padding(.top, 20)
        }
    }
    
    // MARK: - Session Stats Card
    
    private func sessionStatsCard(_ session: PracticeSession) -> some View {
        HStack(spacing: 0) {
            statTile(
                icon: "clock",
                value: session.formattedDuration,
                label: "duration",
                tint: Theme.ink2
            )

            divider

            statTile(
                icon: "scope",
                value: "\(session.totalShots)",
                label: "shots",
                tint: Theme.accent
            )

            divider

            statTile(
                icon: "star.fill",
                value: String(format: "%.0f%%", session.qualityPercentage),
                label: "quality",
                tint: session.qualityPercentage >= 70 ? Theme.accent : Theme.warn
            )
        }
        .padding(.vertical, 16)
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }

    private var divider: some View {
        Rectangle()
            .fill(Theme.line)
            .frame(width: 1, height: 36)
    }

    private func statTile(icon: String, value: String, label: String, tint: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(tint)

            Text(value)
                .font(Theme.statFont(22))
                .foregroundColor(Theme.ink)

            Text(label.uppercased())
                .font(Theme.labelFont(9))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity)
    }
    
    // MARK: - Club Selector
    
    private var clubSelectorSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Club")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(Club.commonClubs, id: \.self) { club in
                        let isSelected = selectedClub == club
                        Button {
                            selectedClub = club
                        } label: {
                            Text(club.shortName)
                                .font(Theme.statFont(15))
                                .foregroundColor(isSelected ? Theme.accentInk : Theme.ink2)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(
                                    Rectangle()
                                        .fill(isSelected ? Theme.accent : Theme.surface2)
                                )
                                .overlay(
                                    Rectangle()
                                        .stroke(isSelected ? Theme.accent : Theme.line, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
    
    // MARK: - Quality Selector
    
    private var qualitySelectorSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Shot Quality")

            HStack(spacing: 8) {
                ForEach(ShotQuality.allCases, id: \.self) { quality in
                    let isSelected = selectedQuality == quality
                    Button {
                        selectedQuality = quality
                        if quality == .pure || quality == .good {
                            selectedMissType = nil
                        }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: quality.icon)
                                .font(.system(size: 18))

                            Text(quality.rawValue)
                                .font(Theme.labelFont(10))
                                .tracking(1.2)
                        }
                        .foregroundColor(isSelected ? qualityInk(quality) : Theme.ink2)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            Rectangle()
                                .fill(isSelected ? qualityColor(quality) : Theme.surface2)
                        )
                        .overlay(
                            Rectangle()
                                .stroke(isSelected ? qualityColor(quality) : Theme.line, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
    
    // MARK: - Miss Type Selector
    
    private var missTypeSelectorSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Miss Type")

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                ForEach(MissType.allCases, id: \.self) { miss in
                    let isSelected = selectedMissType == miss
                    Button {
                        selectedMissType = isSelected ? nil : miss
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: miss.icon)
                                .font(.system(size: 14))

                            Text(miss.rawValue)
                                .font(Theme.labelFont(10))
                                .tracking(1.0)
                        }
                        .foregroundColor(isSelected ? Theme.accentInk : Theme.ink2)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            Rectangle()
                                .fill(isSelected ? Theme.bad : Theme.surface2)
                        )
                        .overlay(
                            Rectangle()
                                .stroke(isSelected ? Theme.bad : Theme.line, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
    
    // MARK: - Recent Shots
    
    private func recentShotsSection(_ session: PracticeSession) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("RECENT SHOTS")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)

                Spacer()

                Button("Undo") {
                    undoLastShot()
                }
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.bad)
            }

            ForEach(session.shots.suffix(5).reversed()) { shot in
                HStack(spacing: 12) {
                    Text(shot.club.shortName)
                        .font(Theme.statFont(14))
                        .foregroundColor(clubColor(shot.club.group))
                        .frame(width: 36, alignment: .leading)

                    Image(systemName: shot.quality.icon)
                        .foregroundColor(qualityColor(shot.quality))

                    if let miss = shot.missType {
                        HStack(spacing: 4) {
                            Image(systemName: miss.icon)
                                .font(.system(size: 10))
                            Text(miss.rawValue)
                                .font(Theme.labelFont(11))
                        }
                        .foregroundColor(Theme.ink2)
                    }

                    Spacer()

                    Text(timeString(shot.timestamp))
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }
                .padding(.vertical, 6)
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
    
    // MARK: - Recent Sessions
    
    private var recentSessionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Recent Sessions")

            ForEach(persistenceManager.practiceSessions.prefix(3)) { session in
                HStack(spacing: 12) {
                    ZStack {
                        Rectangle()
                            .fill(Theme.surface3)
                            .frame(width: 38, height: 38)

                        Image(systemName: "figure.golf")
                            .font(.system(size: 16))
                            .foregroundColor(Theme.accent)
                    }
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(session.dateString)
                            .font(Theme.bodyFont(14))
                            .foregroundColor(Theme.ink)

                        Text("\(session.totalShots) shots · \(session.formattedDuration)")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink3)
                    }

                    Spacer()

                    Text(String(format: "%.0f%%", session.qualityPercentage))
                        .font(Theme.statFont(16))
                        .foregroundColor(session.qualityPercentage >= 70 ? Theme.accent : Theme.ink2)
                }
                .padding()
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
            }
        }
    }
    
    // MARK: - Actions
    
    private func startSession() {
        currentSession = PracticeSession()
    }
    
    private func logShot() {
        let shot = PracticeShot(
            club: selectedClub,
            quality: selectedQuality,
            missType: selectedMissType
        )
        currentSession?.addShot(shot)
        
        // Reset miss type for next shot
        if selectedQuality == .pure || selectedQuality == .good {
            selectedMissType = nil
        }
    }
    
    private func undoLastShot() {
        _ = currentSession?.removeLastShot()
    }
    
    private func endSession() {
        guard var session = currentSession else { return }
        session.end()
        persistenceManager.addPracticeSession(session)
        currentSession = nil
    }
    
    // MARK: - Helpers
    
    private func clubColor(_ group: ClubGroup) -> Color {
        switch group {
        case .driver: return Theme.accent
        case .wood, .hybrid: return Theme.warn
        case .iron: return Theme.ink
        case .wedge: return Theme.accent.opacity(0.8)
        case .putt: return Theme.ink3
        }
    }
    
    private func qualityColor(_ quality: ShotQuality) -> Color {
        switch quality {
        case .pure: return Theme.accent
        case .good: return Theme.accent.opacity(0.65)
        case .okay: return Theme.warn
        case .miss: return Theme.bad
        }
    }

    private func qualityInk(_ quality: ShotQuality) -> Color {
        switch quality {
        case .pure, .good, .okay: return Theme.accentInk
        case .miss: return Theme.ink
        }
    }
    
    private func timeString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Practice History View

struct PracticeHistoryView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    
    private var stats: PracticeStatistics {
        PracticeStatistics(sessions: persistenceManager.practiceSessions)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Summary stats
                summarySection
                
                // Sessions list
                sessionsSection
                
                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Practice History")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") {
                    dismiss()
                }
            }
        }
    }
    
    private var summarySection: some View {
        VStack(spacing: 12) {
            Text("ALL TIME")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 0) {
                VStack {
                    Text("\(stats.totalSessions)")
                        .font(Theme.statFont(24))
                    Text("sessions")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                
                Divider().frame(height: 40)
                
                VStack {
                    Text("\(stats.totalShots)")
                        .font(Theme.statFont(24))
                    Text("shots")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                
                Divider().frame(height: 40)
                
                VStack {
                    Text(stats.formattedTotalTime)
                        .font(Theme.statFont(24))
                    Text("total time")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
            .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
        }
    }
    
    private var sessionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("SESSIONS")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            ForEach(persistenceManager.practiceSessions) { session in
                NavigationLink {
                    LiveRangeDetailView(session: session)
                } label: {
                    sessionRow(session)
                }
                .buttonStyle(.plain)
            }
        }
    }
    
    private func sessionRow(_ session: PracticeSession) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(session.dateString)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.nordicForest)
                
                Spacer()
                
                Text(String(format: "%.0f%% quality", session.qualityPercentage))
                    .font(Theme.labelFont(12))
                    .foregroundColor(session.qualityPercentage >= 70 ? Theme.nordicSage : Theme.nordicForest)
            }
            
            HStack(spacing: 16) {
                Label("\(session.totalShots) shots", systemImage: "scope")
                Label(session.formattedDuration, systemImage: "clock")
                
                if let topClub = session.mostPracticedClub {
                    Label(topClub.shortName, systemImage: "star.fill")
                }
            }
            .font(Theme.labelFont(12))
            .foregroundColor(Theme.nordicForest.opacity(0.6))
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
}

#Preview {
    NavigationStack {
        PracticeView()
            .environmentObject(PersistenceManager())
    }
}
