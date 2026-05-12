//
//  StrikeLabCaddieApp.swift
//  StrikeLabCaddie
//
//  StrikeLabCaddie - Golf Scorecard & Shot Tracker
//

import SwiftUI
import Combine
import ClerkKit

@main
struct StrikeLabCaddieApp: App {
    @StateObject private var persistenceManager = PersistenceManager()
    @StateObject private var locationManager = LocationManager()
    @StateObject private var connectivityManager = WatchConnectivityManager()
    @StateObject private var unitsManager = UnitsManager.shared
    @StateObject private var weatherManager = WeatherManager()
    @StateObject private var settingsManager = AppSettingsManager.shared
    @StateObject private var authStore = AuthStore.shared

    init() {
        if let key = Bundle.main.object(forInfoDictionaryKey: "ClerkPublishableKey") as? String,
           !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           !key.hasPrefix("$("),
           !key.contains("placeholder") {
            Clerk.configure(
                publishableKey: key,
                options: .init(
                    keychainConfig: .init(service: "com.strikelab.caddie.clerk", accessGroup: nil),
                    watchConnectivityEnabled: true
                )
            )
        }
    }

    /// `true` when either Keychain-backed login is active OR a manually
    /// pasted dev token has been entered in Profile → StrikeLab OR the
    /// on-course local mode is enabled.
    private var hasAuth: Bool {
        authStore.isAuthenticated
            || !settingsManager.strikeLabAccessToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || settingsManager.localModeEnabled
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if hasAuth {
                    ContentView()
                } else {
                    LoginView()
                }
            }
                .environmentObject(persistenceManager)
                .environmentObject(locationManager)
                .environmentObject(connectivityManager)
                .environmentObject(unitsManager)
                .environmentObject(weatherManager)
                .environmentObject(settingsManager)
                .environmentObject(authStore)
                .onAppear {
                    applyStrikeLabAPIConfiguration()
                    Task { await authStore.hydrateFromClerkIfAvailable() }
                    setupWatchShotHandling()
                    setupWatchScoreHandling()
                    setupStartRoundFromWatch()
                    setupRangeSessionFromWatch()
                    setupUndoNotification()
                    syncUnitsToWatch()
                    syncHapticsToWatch()
                    syncRoundToWatch()
                    syncCoursesToWatch()
                    connectivityManager.sendPersonalWindows(persistenceManager.player.personalWindows)
                }
                .onChange(of: unitsManager.system) { _, newSystem in
                    connectivityManager.sendUnitsSystem(newSystem.rawValue)
                }
                .onChange(of: settingsManager.watchHapticsEnabled) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: settingsManager.fullMotionCapture) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: settingsManager.micImpactConfirm) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: settingsManager.showRangeResultHUD) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: settingsManager.coachingHaptics) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: settingsManager.pressureWarnings) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: settingsManager.anonymousDataSharing) { _, _ in
                    pushAllSettings()
                }
                .onChange(of: persistenceManager.currentRound) { _, _ in
                    // Whenever the round changes (start, score edit, hole
                    // change, end) push the new authoritative state down
                    // to the watch so it always agrees with the phone.
                    syncRoundToWatch()
                    if let round = persistenceManager.currentRound {
                        RoundLiveSync.schedule(round: round, persistence: persistenceManager)
                    }
                }
                .onChange(of: persistenceManager.courses) { _, _ in
                    syncCoursesToWatch()
                }
                .onReceive(NotificationCenter.default.publisher(for: .strikeLabPracticeSessionSaved)) { note in
                    if let session = note.object as? PracticeSession {
                        RangeSessionSync.scheduleUpload(session: session, persistence: persistenceManager)
                    }
                }
                .onChange(of: settingsManager.strikeLabApiBaseURL) { _, _ in
                    applyStrikeLabAPIConfiguration()
                }
                .onChange(of: settingsManager.strikeLabAccessToken) { _, _ in
                    applyStrikeLabAPIConfiguration()
                }
                .onChange(of: authStore.isAuthenticated) { _, _ in
                    applyStrikeLabAPIConfiguration()
                }
        }
    }

    private func syncCoursesToWatch() {
        connectivityManager.sendCoursesDirectory(persistenceManager.courses)
    }

    /// Profile → StrikeLab web: saved URL/token override Xcode env, which
    /// overrides the bundled `APIBaseURL` Info.plist value (from xcconfig).
    /// Tokens from `AuthStore` (Keychain) take precedence over the pasted
    /// `strikeLabAccessToken` so a real login flow always wins.
    /// Physical device: use your Mac's LAN IP (e.g. http://192.168.1.10:8000), not `localhost`.
    /// Scheme env: `STRIKELAB_API_BASE` + optional `STRIKELAB_ACCESS_TOKEN` when overrides are empty.
    private func applyStrikeLabAPIConfiguration() {
        let e = ProcessInfo.processInfo.environment
        let userBase = settingsManager.strikeLabApiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let envBase = e["STRIKELAB_API_BASE"] ?? ""
        // Picking order: Profile override → env → bundled default (already
        // set by APIClient.init() from Info.plist + #if DEBUG fallback).
        let resolvedBaseStr = !userBase.isEmpty ? userBase : envBase
        let base: URL
        if !resolvedBaseStr.isEmpty, let parsed = URL(string: resolvedBaseStr) {
            base = parsed
        } else {
            base = APIClient.shared.baseURL
        }

        // If AuthStore has a Keychain token, leave it alone — only reconfigure
        // the base URL. Otherwise fall through to the legacy paste-token path.
        if authStore.isAuthenticated {
            APIClient.shared.configure(
                baseURL: base,
                accessToken: KeychainStore.get("access_token"),
                refreshToken: KeychainStore.get("refresh_token")
            )
        } else {
            let userTok = settingsManager.strikeLabAccessToken.trimmingCharacters(in: .whitespacesAndNewlines)
            let raw = userTok.isEmpty ? (e["STRIKELAB_ACCESS_TOKEN"] ?? "") : userTok
            let token = raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : raw
            APIClient.shared.configure(baseURL: base, accessToken: token)
        }
        // Mirror the resolved config to the watch so any future direct-API
        // path (or diagnostic UI) inherits the same backend.
        let mirrorToken: String? = authStore.isAuthenticated
            ? KeychainStore.get("access_token")
            : {
                let manual = settingsManager.strikeLabAccessToken.trimmingCharacters(in: .whitespacesAndNewlines)
                return manual.isEmpty ? nil : manual
            }()
        connectivityManager.sendAPIConfig(baseURL: base, accessToken: mirrorToken)
        // Keep the realtime channel pinned to the resolved config so the
        // app sees round/shot updates from other devices without polling.
        RealtimeClient.shared.connect(baseURL: base, accessToken: mirrorToken)
    }

    /// Receive range session events from the watch and keep a live
    /// `PracticeSession` in sync on the iPhone. The watch sends a list
    /// of per-swing log entries (id + timestamp + club + isAuto + conf)
    /// whenever the state changes — we mirror it 1:1 into shots so each
    /// chip on the phone addresses a real swing on the watch.
    private func setupRangeSessionFromWatch() {
        let persistence = persistenceManager

        connectivityManager.onRangeSwing = { clubRaw, _, timestamp in
            Task { @MainActor in
                // Single-swing pings are kept for backward compat. The
                // authoritative data flows through onRangeStateUpdate.
                guard let club = Club(rawValue: clubRaw) else { return }
                if persistence.liveRangeSession == nil {
                    persistence.liveRangeSession = PracticeSession(
                        startTime: timestamp,
                        location: "Driving Range"
                    )
                }
                let shot = PracticeShot(
                    timestamp: timestamp,
                    club: club,
                    quality: .good
                )
                persistence.liveRangeSession?.shots.append(shot)
            }
        }

        connectivityManager.onRangeStateUpdate = { sessionId, activeClubRaw, counts, started, swings in
            Task { @MainActor in
                // Always seed the live session with the watch's sessionId
                // so manual SAVE NOW + rangeEnded converge on one record.
                let id = UUID(uuidString: sessionId) ?? UUID()
                if persistence.liveRangeSession == nil {
                    persistence.liveRangeSession = PracticeSession(
                        id: id,
                        startTime: started,
                        location: "Driving Range"
                    )
                } else if persistence.liveRangeSession?.id != id {
                    // The watch started a NEW session while we still have
                    // an old one in memory. NEVER discard the old one
                    // silently — promote it to history first so its
                    // swings are preserved, then begin the new live
                    // session.
                    if var stale = persistence.liveRangeSession, !stale.shots.isEmpty {
                        stale.endTime = stale.shots.map(\.timestamp).max() ?? stale.startTime
                        persistence.addPracticeSession(stale)
                    }
                    persistence.liveRangeSession = PracticeSession(
                        id: id,
                        startTime: started,
                        location: "Driving Range"
                    )
                }
                guard var session = persistence.liveRangeSession else { return }

                // `mapSwings` has id/time/club only — assigning it verbatim would
                // wipe motion/HR merged from `onEnhancedShotReceived`. Merge by id.
                let incoming = mapSwings(swings, fallbackCounts: counts, started: started)
                    .map { persistence.applyEnhancedData(to: $0) }
                if session.shots.isEmpty {
                    session.shots = incoming
                } else {
                    let existingById = Dictionary(uniqueKeysWithValues: session.shots.map { ($0.id, $0) })
                    session.shots = incoming.map { inc -> PracticeShot in
                        guard let existing = existingById[inc.id] else { return inc }
                        return PracticeShot(
                            id: existing.id,
                            timestamp: inc.timestamp,
                            club: inc.club,
                            estimatedDistance: existing.estimatedDistance,
                            quality: existing.quality,
                            missType: existing.missType,
                            notes: existing.notes,
                            motion: existing.motion,
                            heartRate: existing.heartRate,
                            confidence: existing.confidence
                        )
                    }
                }
                if let active = Club(rawValue: activeClubRaw) {
                    session.focusClub = active
                }
                persistence.liveRangeSession = session
            }
        }

        connectivityManager.onRangeSessionEnded = { sessionId, counts, started, ended, swings in
            Task { @MainActor in
                let id = UUID(uuidString: sessionId) ?? UUID()
                // Prefer the in-flight live session (it may have
                // motion + HR enrichments not in the rangeEnded
                // payload). Fall back to a fresh shell with the
                // watch's id so dedupe still works.
                var session = persistence.liveRangeSession
                    ?? PracticeSession(id: id,
                                       startTime: started,
                                       location: "Driving Range")
                session.endTime = ended
                let payloadShots = mapSwings(swings, fallbackCounts: counts, started: started)
                    .map { persistence.applyEnhancedData(to: $0) }
                // Merge: keep enriched motion/HR from existing shots
                // by id, fall back to the payload otherwise. Never
                // shrink the shot list.
                if !session.shots.isEmpty {
                    let existingById = Dictionary(uniqueKeysWithValues:
                                                  session.shots.map { ($0.id, $0) })
                    let merged = payloadShots.map { incoming -> PracticeShot in
                        guard let existing = existingById[incoming.id] else { return incoming }
                        var out = existing
                        out.club = incoming.club
                        return out
                    }
                    if merged.count >= session.shots.count {
                        session.shots = merged
                    }
                } else {
                    session.shots = payloadShots
                }

                persistence.addPracticeSession(persistence.applyRecentEnhancedData(to: session))
                persistence.liveRangeSession = nil
                connectivityManager.sendPersonalWindows(persistence.player.personalWindows)
                // ACK back to the watch so it can drop the entry from
                // its pending-delivery queue.
                connectivityManager.sendRangeSessionAck(sessionId: id)
            }
        }

        // Phase 1+: audio clips arrive as a separate file transfer.
        // Move them into the persistent store keyed by swing id so the
        // SwingCard / SwingInspector can play them back.
        connectivityManager.onSwingAudioReceived = { swingId, tempURL in
            Task { @MainActor in
                persistence.storeSwingAudio(swingId: swingId, tempURL: tempURL)
            }
        }

        // Phase 1: enhanced shots arrive with full motion + HR. Stash
        // them in the rolling buffer for the SwingInspectorView and
        // merge motion/HR onto the matching live-range shot by id.
        // Phase 4: also try to merge into the active round's shot list
        // so the on-course shot store carries motion + HR for backend
        // sync and on-course auto-calibration.
        let connectivity = connectivityManager
        connectivityManager.onEnhancedShotReceived = { event in
            Task { @MainActor in
                persistence.recordEnhancedShot(event)
                if var session = persistence.liveRangeSession,
                   let idx = session.shots.firstIndex(where: { $0.id == event.id }) {
                    session.shots[idx].motion = event.motionData
                    session.shots[idx].heartRate = event.heartRateData
                    session.shots[idx].confidence = event.confidence
                    persistence.liveRangeSession = session
                }
                if persistence.mergeEnhancedShotIntoRounds(event) != nil {
                    if !persistence.player.clubModels.isEmpty {
                        connectivity.sendClubModels(persistence.player.clubModels)
                    }
                }
                if let sessionId = persistence.mergeEnhancedShotIntoStoredPracticeSessions(event) {
                    RangeSessionSync.scheduleDebouncedUpload(sessionId: sessionId, persistence: persistence)
                }
                persistence.refreshPersonalWindows()
                connectivity.sendPersonalWindows(persistence.player.personalWindows)
            }
        }
    }

    /// Map the watch's per-swing log to PracticeShots, preserving ids
    /// so the phone-side chips can address individual swings via the
    /// `removeSwingId` WCSession message. Falls back to count-based
    /// reconstruction for older watch builds that only sent counts.
    @MainActor
    private func mapSwings(
        _ swings: [RangeSwingPayload],
        fallbackCounts counts: [String: Int],
        started: Date
    ) -> [PracticeShot] {
        if !swings.isEmpty {
            return swings.compactMap { entry -> PracticeShot? in
                guard let club = Club(rawValue: entry.club) else { return nil }
                return PracticeShot(
                    id: entry.id,
                    timestamp: entry.timestamp,
                    club: club,
                    quality: .good
                )
            }
        }
        if !counts.isEmpty {
            print("StrikeLab: watch sent range counts without per-swing ids — motion cannot attach until watch app is updated.")
        }
        var rebuilt: [PracticeShot] = []
        for (clubRaw, count) in counts {
            guard let club = Club(rawValue: clubRaw), count > 0 else { continue }
            for _ in 0..<count {
                rebuilt.append(PracticeShot(timestamp: started, club: club, quality: .good))
            }
        }
        return rebuilt
    }

    /// Start a round when the watch reports it has detected a nearby
    /// course and the user tapped Start. The watch sends the matched
    /// course ID; we resolve it on the phone side and kick off
    /// `startNewRound` via the persistence manager.
    private func setupStartRoundFromWatch() {
        let persistence = persistenceManager
        let connectivity = connectivityManager
        connectivity.onStartRoundRequested = { courseId in
            Task { @MainActor in
                guard let id = UUID(uuidString: courseId),
                      let course = persistence.course(byID: id) else { return }
                let tee = course.tees.first(where: { $0.hasCompleteData })
                    ?? course.tees.first
                persistence.startNewRound(course: course, tee: tee)
                connectivity.sendRoundStatus(isActive: true, courseName: course.name)
                connectivity.sendCurrentHole(1)
                if let round = persistence.currentRound {
                    connectivity.sendRoundConfig(round)
                    RoundLiveSync.syncNow(round: round, persistence: persistence)
                }
            }
        }
    }

    /// Push the current round (or absence of one) to the watch.
    private func syncRoundToWatch() {
        if let round = persistenceManager.currentRound {
            connectivityManager.sendRoundConfig(round)
        } else {
            connectivityManager.sendRoundCleared()
        }
    }

    /// Push the current units preference to the watch on launch so both
    /// surfaces start aligned even before the user toggles anything.
    private func syncUnitsToWatch() {
        connectivityManager.sendUnitsSystem(unitsManager.system.rawValue)
    }

    /// Push the haptics preference on launch so the watch hydrates from
    /// the phone's source of truth.
    private func syncHapticsToWatch() {
        pushAllSettings()
    }

    /// Push the entire settings bundle to the watch via WCSession
    /// application context. Used on launch and on every toggle change.
    private func pushAllSettings() {
        connectivityManager.sendAllSettings(
            watchHaptics:     settingsManager.watchHapticsEnabled,
            fullMotion:       settingsManager.fullMotionCapture,
            micImpact:        settingsManager.micImpactConfirm,
            showRangeResultHUD: settingsManager.showRangeResultHUD,
            coachingHaptics:  settingsManager.coachingHaptics,
            pressureWarnings: settingsManager.pressureWarnings,
            anonymousSharing: settingsManager.anonymousDataSharing
        )
    }
    
    /// Wire up shot events from watch to persistence and location enrichment
    private func setupWatchShotHandling() {
        let persistence = persistenceManager
        let location = locationManager
        
        connectivityManager.onShotReceived = { event in
            Task { @MainActor in
                // Convert ShotEvent to Shot and add location data
                var shot = persistence.applyEnhancedData(to: event.toShot())
                shot.holeNumber = persistence.currentRound?.currentHoleNumber
                
                // Enrich with location data from clustering
                location.enrichShotWithLocation(&shot)
                
                // Add to current round
                persistence.addShot(shot)
            }
        }
    }

    /// Apply score updates the watch sends back (Crown adjustments, putt
    /// edits) onto the iPhone's authoritative round state.
    private func setupWatchScoreHandling() {
        let persistence = persistenceManager
        connectivityManager.onScoreUpdate = { holeNumber, gross, putts in
            Task { @MainActor in
                guard var round = persistence.currentRound else { return }
                guard let idx = round.holes.firstIndex(where: { $0.holeNumber == holeNumber }) else { return }
                round.holes[idx].grossStrokes = gross
                if let putts { round.holes[idx].putts = putts }
                round.holes[idx].recalculateNet()
                persistence.currentRound = round
            }
        }
        connectivityManager.onHoleChanged = { holeNumber in
            Task { @MainActor in
                guard var round = persistence.currentRound else { return }
                round.currentHoleNumber = holeNumber
                persistence.currentRound = round
            }
        }
    }
    
    /// Handle undo requests from watch
    private func setupUndoNotification() {
        let persistence = persistenceManager
        
        NotificationCenter.default.addObserver(
            forName: .undoShotRequested,
            object: nil,
            queue: .main
        ) { _ in
            Task { @MainActor in
                _ = persistence.undoLastShot()
            }
        }
    }
}

// MARK: - Main Content View with Navigation

struct ContentView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                if persistenceManager.currentRound != nil {
                    ActiveRoundHomeView()
                } else {
                    RoundSetupView()
                }
            }
            .tabItem {
                Label("Round", systemImage: "flag.fill")
            }
            .tag(0)
            
            TeeRootView()
                .tabItem {
                    Label("Tee", systemImage: "calendar.badge.clock")
                }
                .tag(1)

            NavigationStack {
                PracticeView()
            }
            .tabItem {
                Label("Practice", systemImage: "figure.golf")
            }
            .tag(2)
            
            NavigationStack {
                if let round = persistenceManager.currentRound {
                    ScorecardView(round: Binding(
                        get: { round },
                        set: { persistenceManager.currentRound = $0 }
                    ))
                } else {
                    NoRoundView()
                }
            }
            .tabItem {
                Label("Scorecard", systemImage: "list.number")
            }
            .tag(3)
            
            NavigationStack {
                if let round = persistenceManager.currentRound {
                    ShotListView(round: Binding(
                        get: { round },
                        set: { persistenceManager.currentRound = $0 }
                    ))
                } else {
                    NoRoundView()
                }
            }
            .tabItem {
                Label("Shots", systemImage: "scope")
            }
            .tag(4)
            
            NavigationStack {
                PlayerProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(5)
        }
        .tint(Theme.accent)
        .onAppear {
            configureChromeAppearance()
        }
    }

    private func configureChromeAppearance() {
        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = UIColor(Theme.bg)
        tab.shadowColor = UIColor(Theme.lineStrong)

        let item = UITabBarItemAppearance()
        item.normal.iconColor = UIColor(Theme.ink3)
        item.normal.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.ink3),
            .font: UIFont.monospacedSystemFont(ofSize: 10, weight: .medium)
        ]
        item.selected.iconColor = UIColor(Theme.accent)
        item.selected.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.accent),
            .font: UIFont.monospacedSystemFont(ofSize: 10, weight: .semibold)
        ]
        tab.stackedLayoutAppearance = item
        tab.inlineLayoutAppearance = item
        tab.compactInlineLayoutAppearance = item

        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab

        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = UIColor(Theme.bg)
        nav.shadowColor = .clear
        nav.titleTextAttributes = [.foregroundColor: UIColor(Theme.ink)]
        nav.largeTitleTextAttributes = [
            .foregroundColor: UIColor(Theme.ink),
            .font: UIFont.systemFont(ofSize: 32, weight: .medium)
        ]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
        UINavigationBar.appearance().tintColor = UIColor(Theme.accent)
    }
}

// MARK: - Empty State View

struct NoRoundView: View {
    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "flag.slash")
                .font(.system(size: 56))
                .foregroundColor(Theme.ink3)

            Text("No active round")
                .font(Theme.titleFont(22))
                .foregroundColor(Theme.ink)

            Text("Start a new round from the Round tab.")
                .font(Theme.labelFont(11))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg)
    }
}

#Preview {
    ContentView()
        .environmentObject(PersistenceManager())
        .environmentObject(LocationManager())
        .environmentObject(WatchConnectivityManager())
}
