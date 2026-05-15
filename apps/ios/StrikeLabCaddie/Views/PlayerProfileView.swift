//
//  PlayerProfileView.swift
//  StrikeLabCaddie
//
//  Player profile and handicap settings
//

import SwiftUI

struct PlayerProfileView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    @EnvironmentObject var unitsManager: UnitsManager
    @EnvironmentObject var settingsManager: AppSettingsManager
    @EnvironmentObject var authStore: AuthStore

    @State private var editedName: String = ""
    @State private var editedHandicap: String = ""
    @State private var showExport = false
    @State private var showDeleteAccountAlert = false
    @State private var isSigningOut = false
    @State private var isDeletingAccount = false
    @State private var accountMessage: String?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                // Profile header
                profileHeader
                    .padding(.top, 4)
                
                // Name field
                nameSection
                
                // Handicap field
                handicapSection
                
                // Handicap info
                handicapInfoCard
                
                // Career stats strip — engagement glance
                careerStatsSection

                // Phase 5 — daily DNA delta vs 30-day baseline
                DailyDNADeltaCard(
                    recent: persistenceManager.recentEnhancedShots,
                    armLengthMeters: persistenceManager.player.armLengthMeters
                )

                // Coach insights — surface 3 actionable notes from
                // the player's saved rounds.
                coachInsightsSection

                // Watch connection status
                watchStatusCard

                // Units preference
                unitsSection

                // Watch haptics preference
                watchHapticsSection

                strikeLabWebSyncSection

                // Phase 1+ — full motion / mic / coaching toggles.
                advancedCaptureSection

                // Phase 4 — per-club calibration flow.
                calibrationSection

                // Statistics link
                statisticsSection
                
                // Round history
                roundHistorySection
                
                legalAndAccountSection

                // Data export
                exportSection
                
                // App info
                appInfoSection
                
                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadPlayerData()
        }
        .sheet(isPresented: $showExport) {
            NavigationStack {
                ExportOptionsView(rounds: persistenceManager.savedRounds)
            }
        }
        .alert("Delete StrikeLab account?", isPresented: $showDeleteAccountAlert) {
            Button("Delete", role: .destructive) {
                deleteAccount()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This permanently deletes your StrikeLab account and synced performance data from our records. Local data on this device can be removed by deleting the app.")
        }
    }
    
    // MARK: - Profile Header
    
    private var profileHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Rectangle()
                    .fill(Theme.surface2)
                    .frame(width: 84, height: 84)
                    .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))

                Text(initials)
                    .font(.system(size: 28, weight: .medium, design: .monospaced))
                    .foregroundColor(Theme.accent)
            }

            Text(persistenceManager.player.name)
                .font(Theme.titleFont(28))
                .foregroundColor(Theme.ink)

            Text(persistenceManager.player.handicapCategory.uppercased())
                .font(Theme.labelFont(11))
                .tracking(2.0)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
    
    private var initials: String {
        let components = persistenceManager.player.name.split(separator: " ")
        let initials = components.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
    
    // MARK: - Name Section
    
    private var nameSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: "Name")

            TextField("Your name", text: $editedName)
                .font(Theme.bodyFont())
                .foregroundColor(Theme.ink)
                .tint(Theme.accent)
                .padding()
                .background(Theme.surface)
                .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                .onChange(of: editedName) { _, newValue in
                    if !newValue.isEmpty {
                        persistenceManager.player.name = newValue
                    }
                }
        }
    }
    
    // MARK: - Handicap Section
    
    private var handicapSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: "Handicap Index")

            HStack {
                TextField("11.5", text: $editedHandicap)
                    .keyboardType(.decimalPad)
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.ink)
                    .tint(Theme.accent)
                    .onChange(of: editedHandicap) { _, newValue in
                        if let handicap = Double(newValue),
                           HandicapCalculator.isValidHandicapIndex(handicap) {
                            persistenceManager.player.handicapIndex = handicap
                        }
                    }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("Current".uppercased())
                        .font(Theme.labelFont(10))
                        .tracking(1.4)
                        .foregroundColor(Theme.ink3)

                    Text(persistenceManager.player.formattedHandicap)
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.accent)
                }
            }
            .padding()
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
        }
    }
    
    // MARK: - Handicap Info Card
    
    private var handicapInfoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "info.circle")
                    .foregroundColor(Theme.accent)

                Text("About Handicap Index")
                    .font(Theme.labelFont(13))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink)
            }

            Text("Your Handicap Index represents your potential ability. It's used to calculate a Course Handicap for each tee you play.")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.ink2)

            Text("Valid range: +10 (plus handicap) to 54")
                .font(Theme.labelFont(11))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard()
    }
    
    // MARK: - Watch Status Card
    
    private var watchStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Apple Watch")

            HStack(spacing: 14) {
                Image(systemName: "applewatch")
                    .font(.system(size: 24, weight: .light))
                    .foregroundColor(Theme.ink2)

                VStack(alignment: .leading, spacing: 2) {
                    Text(watchStatusTitle)
                        .font(Theme.labelFont(13))
                        .tracking(1.2)
                        .foregroundColor(Theme.ink)

                    Text(watchStatusSubtitle)
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }

                Spacer()

                statusDot
            }
            .padding()
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
        }
    }

    private var watchStatusTitle: String {
        if connectivityManager.isWatchReachable { return "Live" }
        if connectivityManager.isWatchAppInstalled { return "Paired" }
        return "Not paired"
    }

    private var watchStatusSubtitle: String {
        if connectivityManager.isWatchReachable {
            return "Streaming swing + heart rate"
        } else if connectivityManager.isWatchAppInstalled {
            return "App installed · waiting for watch"
        } else {
            return "Install the Caddie watch app from your iPhone"
        }
    }

    @ViewBuilder
    private var statusDot: some View {
        if connectivityManager.isWatchReachable {
            Circle().fill(Theme.accent).frame(width: 10, height: 10)
        } else if connectivityManager.isWatchAppInstalled {
            Circle().fill(Theme.warn).frame(width: 10, height: 10)
        } else {
            Circle()
                .stroke(Theme.ink3, lineWidth: 1)
                .frame(width: 10, height: 10)
        }
    }
    
    // MARK: - Statistics Section
    
    // MARK: - Career stats strip

    private var careerStatsSection: some View {
        let saved = persistenceManager.savedRounds
        let stats = RoundStatistics(rounds: saved)
        let lowest = stats.bestGrossScore
        let totalHoles = stats.totalHolesPlayed
        let birdieStreak = longestBirdieStreak(in: saved)

        return VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Career")

            HStack(spacing: 8) {
                careerTile(label: "ROUNDS", value: "\(saved.count)", tint: Theme.ink)
                careerTile(label: "HOLES", value: "\(totalHoles)", tint: Theme.ink)
                careerTile(
                    label: "LOW",
                    value: lowest.map { "\($0)" } ?? "–",
                    tint: lowest != nil ? Theme.accent : Theme.ink3
                )
                careerTile(
                    label: "STREAK",
                    value: birdieStreak > 0 ? "\(birdieStreak)" : "–",
                    tint: birdieStreak > 0 ? Theme.warn : Theme.ink3,
                    sub: "birdies"
                )
            }
        }
    }

    private func careerTile(label: String, value: String, tint: Color, sub: String? = nil) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(Theme.labelFont(10))
                .tracking(1.2)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(20))
                .foregroundColor(tint)
            if let sub {
                Text(sub.uppercased())
                    .font(Theme.labelFont(9))
                    .tracking(1.0)
                    .foregroundColor(Theme.ink3)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    /// Longest unbroken streak of birdie-or-better holes across saved
    /// rounds (chronological, oldest → newest).
    private func longestBirdieStreak(in rounds: [Round]) -> Int {
        let chronological = rounds.sorted { $0.date < $1.date }
        var best = 0
        var current = 0
        for round in chronological {
            for hole in round.holes {
                if let diff = hole.scoreToPar, diff <= -1 {
                    current += 1
                    best = max(best, current)
                } else if hole.grossStrokes != nil {
                    current = 0
                }
            }
        }
        return best
    }

    // MARK: - Coach Insights

    private var coachInsightsSection: some View {
        let engine = CoachInsightsEngine(rounds: persistenceManager.savedRounds)
        let insights = engine.insights()

        return VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Coach Insights", trailing: "from \(persistenceManager.savedRounds.count) rounds")

            ForEach(insights) { insight in
                coachInsightRow(insight)
            }
        }
    }

    private func coachInsightRow(_ insight: CoachInsight) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Rectangle()
                    .fill(Theme.surface3)
                    .frame(width: 38, height: 38)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                Image(systemName: insight.icon)
                    .font(.system(size: 14))
                    .foregroundColor(insightTint(insight.severity))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(insight.title)
                    .font(Theme.labelFont(13))
                    .tracking(1.0)
                    .foregroundColor(Theme.ink)
                Text(insight.detail)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                    .lineLimit(2)
            }
            Spacer()

            if let club = insight.focusClub {
                Text(club.shortName)
                    .font(Theme.statFont(13))
                    .foregroundColor(Theme.accent)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Theme.accent.opacity(0.12))
                    .overlay(Rectangle().stroke(Theme.accent.opacity(0.4), lineWidth: 1))
            }
        }
        .padding()
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func insightTint(_ severity: CoachInsight.Severity) -> Color {
        switch severity {
        case .good: return Theme.accent
        case .info: return Theme.ink2
        case .warn: return Theme.warn
        }
    }

    // MARK: - Units Section

    private var unitsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Distance Units")

            HStack(spacing: 0) {
                ForEach(MeasurementSystem.allCases) { system in
                    let isSelected = unitsManager.system == system
                    Button {
                        unitsManager.system = system
                    } label: {
                        VStack(spacing: 2) {
                            Text(system.displayName.uppercased())
                                .font(Theme.labelFont(11))
                                .tracking(1.6)
                                .foregroundColor(isSelected ? Theme.accentInk : Theme.ink2)
                            Text(unitsExample(for: system))
                                .font(Theme.statFont(13))
                                .foregroundColor(isSelected ? Theme.accentInk.opacity(0.7) : Theme.ink3)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(isSelected ? Theme.accent : Theme.surface)
                        .overlay(Rectangle().stroke(isSelected ? Theme.accent : Theme.line, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }

            Text("Choose how distances appear on every screen — pin yardages, club averages, GPS markers and the watch caddie. Switching never changes saved data.")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
                .padding(.horizontal, 2)
        }
    }

    private func unitsExample(for system: MeasurementSystem) -> String {
        switch system {
        case .yards:  return "150 yds"
        case .meters: return "137 m"
        }
    }

    // MARK: - Watch Haptics Section

    private var watchHapticsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "Watch Vibrations")

            Toggle(isOn: $settingsManager.watchHapticsEnabled) {
                HStack(spacing: 10) {
                    Image(systemName: settingsManager.watchHapticsEnabled
                          ? "applewatch.radiowaves.left.and.right"
                          : "applewatch.slash")
                        .font(.system(size: 18))
                        .foregroundColor(settingsManager.watchHapticsEnabled
                                         ? Theme.accent
                                         : Theme.ink3)
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(settingsManager.watchHapticsEnabled
                             ? "Haptics ON"
                             : "Haptics OFF")
                            .font(Theme.statFont(15))
                            .foregroundColor(Theme.ink)
                        Text("Buzz on swing detect, score taps and round events")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink3)
                    }
                }
            }
            .toggleStyle(SwitchToggleStyle(tint: Theme.accent))
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Theme.surface)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

            Text("When off, the watch stays silent during a round and on the range. Useful in quiet groups or competitions where buzzing is distracting.")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
                .padding(.horizontal, 2)
        }
    }

    private var statisticsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Performance")

            NavigationLink {
                StatisticsView()
            } label: {
                ProfileLinkRow(
                    icon: "chart.bar.fill",
                    iconTint: Theme.accent,
                    title: "Statistics",
                    subtitle: "Strokes gained · gap analysis · trend charts"
                )
            }
        }
    }

    // MARK: - StrikeLab web sync

    private var strikeLabWebSyncSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "StrikeLab web sync")

            Text("When signed in, completed rounds and range sessions sync securely to strikelab.golf so you can review them on the web and keep iPhone and Apple Watch in agreement.")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
                .fixedSize(horizontal: false, vertical: true)

            if let line = RangeSessionSync.lastSyncStatusLine() {
                Text(line)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Advanced capture section (Phase 1 + 3 + cross-cutting)

    private var advancedCaptureSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: "Swing Capture")
            toggleRow(
                title: "Capture full swing motion",
                subtitle: "100 Hz accel + gyro + quaternion. Required for the Swing Card.",
                isOn: $settingsManager.fullMotionCapture
            )
            toggleRow(
                title: "Mic-confirmed impact",
                    subtitle: "Off by default. When enabled, Apple Watch listens for impact timing and stores short clips for your swing review.",
                isOn: $settingsManager.micImpactConfirm
            )
            toggleRow(
                title: "Full range result on watch",
                subtitle: "Off by default — silent capture while you hit; open the Swing Card on iPhone for detail. When on, the watch shows the post-swing HUD after each range swing.",
                isOn: $settingsManager.showRangeResultHUD
            )
            toggleRow(
                title: "Real-time coaching haptics",
                subtitle: "Post-swing HUD pulse, tempo metronome and consistency feedback.",
                isOn: $settingsManager.coachingHaptics
            )
            toggleRow(
                title: "Pressure warnings",
                subtitle: "Calm-down breathing pattern when HR is high and tempo collapses.",
                isOn: $settingsManager.pressureWarnings
            )
            toggleRow(
                title: "Show heart rate on watch",
                subtitle: "Live BPM during rounds. Turn off if pressure data feels distracting.",
                isOn: $settingsManager.showHeartRateOnWatch
            )
            toggleRow(
                title: "Anonymous data sharing",
                subtitle: "Help improve calibration. Stripped of identity before storage. Off by default.",
                isOn: $settingsManager.anonymousDataSharing
            )
            captureDiagnosticsCard
        }
    }

    private var captureDiagnosticsCard: some View {
        let live = persistenceManager.liveRangeSession
        let latest = live ?? persistenceManager.practiceSessions.first
        let q = latest.map { persistenceManager.captureCompleteness(for: $0) }
        let title = live == nil ? "Last range capture" : "Live range capture"
        let line = q?.summary ?? "No range session yet"
        let motion = q.map { "\($0.motionPercent)% motion" } ?? "waiting"
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title.uppercased())
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(motion)
                    .font(Theme.statFont(13))
                    .foregroundColor((q?.motionPercent ?? 100) >= 80 ? Theme.accent : Theme.bad)
            }
            Text(line)
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink2)
            Text("Before tomorrow's range: hit 2-3 swings and confirm motion is increasing here.")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .padding(12)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func toggleRow(title: String, subtitle: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(Theme.statFont(15))
                    .foregroundColor(Theme.ink)
                Text(subtitle)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }
        }
        .toggleStyle(SwitchToggleStyle(tint: Theme.accent))
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    // MARK: - Calibration Section (Phase 4)

    private var calibrationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(
                text: "My Bag",
                trailing: "\(persistenceManager.player.clubModels.count) clubs calibrated"
            )

            NavigationLink {
                CalibrationFlowView()
            } label: {
                ProfileLinkRow(
                    icon: "scope",
                    iconTint: Theme.accent,
                    title: "Calibrate clubs",
                    subtitle: "5 shots per club. The Swing Card and watch HUD start showing estimated carry."
                )
            }

            // Phase 5 — pressure mode (run a heated practice block).
            NavigationLink {
                PressureSessionView()
            } label: {
                ProfileLinkRow(
                    icon: "flame",
                    iconTint: Theme.bad,
                    title: "Pressure mode",
                    subtitle: "Set a goal. Watch enforces a shot clock. End-of-session diagnosis."
                )
            }

            let leverShots = persistenceManager.savedRounds.flatMap(\.shots)
                + (persistenceManager.currentRound?.shots ?? [])
            let leverReports = LeverRatioCalibrator.reports(from: leverShots)
            if !leverReports.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("LEVER RATIO CHECK (GPS)")
                        .font(Theme.labelFont(10))
                        .tracking(1.4)
                        .foregroundColor(Theme.ink3)
                    ForEach(leverReports) { rep in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(rep.clubKey.uppercased())
                                .font(Theme.statFont(13))
                                .foregroundColor(Theme.ink)
                            Text(String(format: "Your implied ratio %.2f (±%.2f) vs catalog %.2f · n=%d",
                                        rep.impliedRatio, rep.sigma, rep.catalogRatio, rep.sampleCount))
                                .font(Theme.labelFont(11))
                                .foregroundColor(Theme.ink2)
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.surface2)
                        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                    }
                }
            }
        }
    }
    
    // MARK: - Round History Section
    
    private var roundHistorySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(
                text: "Round History",
                trailing: "\(persistenceManager.savedRounds.count) rounds"
            )

            if persistenceManager.savedRounds.isEmpty {
                VStack(spacing: 6) {
                    Text("No saved rounds yet")
                        .font(Theme.bodyFont(14))
                        .foregroundColor(Theme.ink2)
                    Text("Start a round and the scorecard syncs here automatically.")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 12)
            } else {
                ForEach(persistenceManager.savedRounds.prefix(3)) { round in
                    roundRow(round: round)
                }

                NavigationLink {
                    RoundHistoryView()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "clock.arrow.circlepath")
                        Text((persistenceManager.savedRounds.count > 3 ?
                              "View all \(persistenceManager.savedRounds.count) rounds" :
                              "View round history").uppercased())
                            .tracking(1.4)
                    }
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
            }
        }
    }

    private func roundRow(round: Round) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(round.course.name)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink)

                Text(round.date, style: .date)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(round.grossTotal)")
                    .font(Theme.statFont(20))
                    .foregroundColor(Theme.ink)

                Text(round.formattedOverUnder)
                    .font(Theme.labelFont(11))
                    .foregroundColor(round.grossOverUnder <= 0 ? Theme.accent : Theme.bad)
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
    
    // MARK: - Export Section
    
    private var exportSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Data")

            Button {
                showExport = true
            } label: {
                ProfileLinkRow(
                    icon: "square.and.arrow.up",
                    iconTint: Theme.warn,
                    title: "Export Data",
                    subtitle: "Backup rounds as JSON or CSV"
                )
            }

            if ReleasePolicy.allowsDemoReset {
                Button {
                    persistenceManager.resetToDemo()
                } label: {
                    ProfileLinkRow(
                        icon: "arrow.clockwise",
                        iconTint: Theme.accent,
                        title: "Reset demo data",
                        subtitle: "Reload the PGA Catalunya sample round and practice sessions"
                    )
                }
            }
        }
    }

    private var legalAndAccountSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Account")

            Link(destination: ReleasePolicy.privacyURL) {
                ProfileLinkRow(
                    icon: "hand.raised",
                    iconTint: Theme.accent,
                    title: "Privacy Policy",
                    subtitle: "How StrikeLab handles golf, location, watch and account data"
                )
            }

            Link(destination: ReleasePolicy.termsURL) {
                ProfileLinkRow(
                    icon: "doc.text",
                    iconTint: Theme.ink2,
                    title: "Terms of Use",
                    subtitle: "Use, safety and coaching limitations"
                )
            }

            Link(destination: URL(string: "mailto:\(ReleasePolicy.supportEmail)")!) {
                ProfileLinkRow(
                    icon: "envelope",
                    iconTint: Theme.warn,
                    title: "Support",
                    subtitle: ReleasePolicy.supportEmail
                )
            }

            Button {
                signOut()
            } label: {
                ProfileLinkRow(
                    icon: "rectangle.portrait.and.arrow.right",
                    iconTint: Theme.ink2,
                    title: isSigningOut ? "Signing out..." : "Sign out",
                    subtitle: "Return to login and clear this device session"
                )
            }
            .disabled(isSigningOut || !authStore.isAuthenticated)

            Button(role: .destructive) {
                showDeleteAccountAlert = true
            } label: {
                ProfileLinkRow(
                    icon: "trash",
                    iconTint: Theme.bad,
                    title: isDeletingAccount ? "Deleting account..." : "Delete account",
                    subtitle: "Permanently remove your StrikeLab account and synced data"
                )
            }
            .disabled(isDeletingAccount || !authStore.isAuthenticated)

            if let accountMessage {
                Text(accountMessage)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.warn)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - App Info Section

    private var appInfoSection: some View {
        VStack(spacing: 6) {
            Text("STRIKELABCADDIE")
                .font(Theme.labelFont(11))
                .tracking(2.4)
                .foregroundColor(Theme.ink2)

            Text("Version 1.0.0 · Get dialed in")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 20)
    }
    
    // MARK: - Helpers
    
    private func loadPlayerData() {
        editedName = persistenceManager.player.name
        editedHandicap = String(format: "%.1f", persistenceManager.player.handicapIndex)
    }

    private func deleteAccount() {
        isDeletingAccount = true
        accountMessage = nil
        Task {
            do {
                try await authStore.deleteAccount()
                settingsManager.localModeEnabled = false
                accountMessage = nil
            } catch {
                accountMessage = "Account deletion failed. Please try again or contact \(ReleasePolicy.supportEmail)."
            }
            isDeletingAccount = false
        }
    }

    private func signOut() {
        isSigningOut = true
        accountMessage = nil
        Task {
            await authStore.signOut()
            settingsManager.localModeEnabled = false
            isSigningOut = false
        }
    }
}

// MARK: - Profile Link Row

/// Reusable row for navigation/action items on the profile.
struct ProfileLinkRow: View {
    let icon: String
    var iconTint: Color = Theme.accent
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(iconTint)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(Theme.labelFont(14))
                    .tracking(1.0)
                    .foregroundColor(Theme.ink)

                Text(subtitle)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Theme.ink3)
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
}

#Preview {
    NavigationStack {
        PlayerProfileView()
            .environmentObject(PersistenceManager())
            .environmentObject(WatchConnectivityManager())
            .environmentObject(UnitsManager.shared)
            .environmentObject(AppSettingsManager.shared)
            .environmentObject(AuthStore.shared)
    }
}
