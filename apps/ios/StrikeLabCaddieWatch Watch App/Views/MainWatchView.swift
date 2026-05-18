//
//  MainWatchView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Hole-centric Crown-driven scoring. The watch is no longer a shot logger
//  — it's a fast scorecard. A segmented STROKES / PUTTS toggle picks the
//  active field; the Crown drives whichever is active with 1:1 detent
//  precision; a single hero tile fills the screen so the user always sees
//  exactly what they're editing. Auto-detected swings still bump strokes
//  in the background.
//

import SwiftUI
import WatchKit
import CoreLocation

struct MainWatchView: View {
    @EnvironmentObject var workoutManager: WorkoutManager
    @EnvironmentObject var motionManager: MotionManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManagerWatch
    @EnvironmentObject var locationManager: WatchLocationManager
    @EnvironmentObject var swingConfirmer: SwingConfirmer
    @EnvironmentObject var hrManager: HighFrequencyHRManager
    @ObservedObject private var watchSettings = WatchSettings.shared

    @State private var showMore = false
    @State private var showGuestScores = false
    @State private var showClubOverlay = false
    @State private var showSensorPreflight = false
    @State private var pendingStartAction: StartAction?
    @State private var pendingAutoShot = false
    @State private var clubOverlayLogsShot = false
    @State private var activeShotClub: ClubWatch?
    @State private var selectedHole: Int = 1
    @State private var activeField: HoleField = .strokes
    @State private var temporaryDistanceUnits: WatchUnitsSystem?
    @State private var elapsedTimerNow = Date()
    @FocusState private var crownFocus: Bool

    /// Push state for the two full-screen sub-views. Setting these to true
    /// pushes onto the NavigationStack, which gives us the system's standard
    /// circular back chevron (top-left, accent-tinted, big tap target) for
    /// free. Setting to false pops back to the start screen WITHOUT ending
    /// the session — the underlying state lives in `connectivityManager`.
    @State private var showingRange = false
    @State private var showingRound = false

    /// Crown-bound double for whichever field is active. `.low` sensitivity
    /// gives one detent per integer step which is what golfers want.
    @State private var crownValue: Double = 4

    /// Crown safety: the Crown only mutates strokes/putts when ARMED.
    /// The user explicitly arms by tapping the hero tile. Auto-disarms
    /// 8s after the last Crown rotation (or immediately on hole / field
    /// change). This stops accidental wrist contact on the Crown from
    /// silently changing the score during a round.
    @State private var crownArmed = false
    @State private var armTimer: Timer?
    @State private var puttsReturnTimer: Timer?

    /// 1Hz timer that ticks the SwingConfirmer so it can expire stale
    /// candidates and clear the "just confirmed" flash.
    @State private var confirmerTickTimer: Timer?
    @State private var elapsedTickTimer: Timer?

    /// Confirm-before-end gate so a fat-finger on the More sheet's
    /// destructive button doesn't silently kill the round.
    @State private var showEndRoundAlert = false

    enum HoleField: Hashable { case strokes, putts }
    private enum StartAction { case nearbyRound(WatchCourseEntry), genericRound, range }

    var body: some View {
        NavigationStack {
            startView
                .navigationDestination(isPresented: $showingRange) {
                    RangeSessionView()
                }
                .navigationDestination(isPresented: $showingRound) {
                    activeRoundView
                }
                .navigationTitle("")
                .navigationBarTitleDisplayMode(.inline)
                .sheet(isPresented: $showMore) {
                    moreSheet
                }
                .sheet(isPresented: $showGuestScores) {
                    guestScoresSheet
                }
                .sheet(isPresented: $showClubOverlay) {
                    ClubConfirmOverlay(
                        isAutoDetected: pendingAutoShot,
                        onClubSelected: { club in
                            if clubOverlayLogsShot {
                                logShot(club: club)
                            } else {
                                activeShotClub = club
                                Haptics.play(.success)
                            }
                            showClubOverlay = false
                            pendingAutoShot = false
                            clubOverlayLogsShot = false
                        },
                        onUndo: { connectivityManager.sendUndoRequest() },
                        onDismiss: {
                            showClubOverlay = false
                            pendingAutoShot = false
                            clubOverlayLogsShot = false
                        },
                        suggestedClub: suggestedClub(for: connectivityManager.currentHole),
                        distanceToPin: connectivityManager.caddieDistanceYards > 0
                            ? connectivityManager.caddieDistanceYards
                            : nil,
                        units: connectivityManager.unitsSystem,
                        showsUndo: clubOverlayLogsShot
                    )
                }
                .alert("End Round?", isPresented: $showEndRoundAlert) {
                    Button("End", role: .destructive) {
                        requestEndRoundFromWatch()
                    }
                    Button("Cancel", role: .cancel) { }
                } message: {
                    Text("Saves and completes the round on iPhone, then stops watch sensors.")
                }
                .alert("Watch Sensors Used During Play", isPresented: $showSensorPreflight) {
                    Button("Continue") { runPendingStartAction() }
                    Button("Cancel", role: .cancel) { pendingStartAction = nil }
                } message: {
                    Text("StrikeLab starts a golf workout, reads heart rate, uses motion to detect swings, and uses location during rounds for course context. Microphone capture stays off unless you enable Mic-confirmed impact in Profile.")
                }
                .onAppear {
                    setupMotionDetection()
                    selectedHole = max(1, connectivityManager.currentHoleNumber)
                    syncCrown()
                    // CRITICAL: do NOT auto-push round/range on appear.
                    // The view re-appears whenever a pushed view pops, so
                    // any auto-push here would re-push the round/range
                    // immediately after the user pressed back. The user
                    // must always make an explicit choice from the home
                    // screen (the START / RESUME buttons handle that).
                }
                // We only react to sessions ENDING. When isRoundActive or
                // rangeSession transitions to nil/false, pop the pushed
                // view so the user lands back on home cleanly.
                .onChange(of: connectivityManager.rangeSession == nil) { _, didEnd in
                    if didEnd { showingRange = false }
                }
                .onChange(of: connectivityManager.isRoundActive) { _, isActive in
                    if isActive {
                        selectedHole = max(1, connectivityManager.currentHoleNumber)
                        showingRange = false
                        showingRound = true
                        ensureRoundSensorsRunning()
                        startElapsedTick()
                    } else {
                        showingRound = false
                    }
                }
                .onChange(of: connectivityManager.currentHoleNumber) { _, newHole in
                    selectedHole = newHole
                    activeShotClub = nil
                    temporaryDistanceUnits = nil
                    syncCrown()
                    disarmCrown()
                }
                .onChange(of: connectivityManager.isRoundActive) { _, isActive in
                    if isActive {
                        ensureRoundSensorsRunning()
                        startElapsedTick()
                    }
                }
                .onChange(of: selectedHole) { oldHole, newHole in
                    if oldHole != newHole, connectivityManager.playFormat.range.contains(newHole) {
                        connectivityManager.sendHoleChange(to: newHole)
                        activeShotClub = nil
                        temporaryDistanceUnits = nil
                        Haptics.play(.click)
                        syncCrown()
                        disarmCrown()
                    }
                }
                .onChange(of: activeField) { _, _ in
                    if activeField == .strokes {
                        puttsReturnTimer?.invalidate()
                        puttsReturnTimer = nil
                    } else {
                        scheduleReturnToStrokes()
                    }
                    syncCrown()
                    disarmCrown()
                }
                .onChange(of: connectivityManager.currentHole) { _, _ in
                    syncCrown()
                }
                .onDisappear {
                    disarmCrown()
                    puttsReturnTimer?.invalidate()
                    puttsReturnTimer = nil
                    stopElapsedTick()
                }
                .onReceive(NotificationCenter.default.publisher(for: WKExtension.applicationWillResignActiveNotification)) { _ in
                    disarmCrown()
                }
        }
    }

    // MARK: - Start screen

    private var startView: some View {
        ScrollView {
            VStack(spacing: 8) {
                HStack {
                    Text("STRIKELAB")
                        .font(SLW.mono(9, weight: .semibold))
                        .tracking(2.0)
                        .foregroundColor(SLW.accent)
                    Spacer()
                    Text("CADDIE")
                        .font(SLW.mono(9, weight: .semibold))
                        .tracking(2.0)
                        .foregroundColor(SLW.ink3)
                }

                // Tee booking countdown — only shown when an upcoming
                // StrikeLab Tee booking has been pushed from the iPhone.
                if connectivityManager.nextTeeBooking != nil {
                    TeeCountdownView()
                        .padding(.bottom, 4)
                }

                // Resume banners — shown when a session is alive but the
                // user has popped out via the system back chevron. Tapping
                // pushes the live view back onto the NavigationStack.
                if connectivityManager.rangeSession != nil && !showingRange {
                    resumeBanner(
                        title: "RESUME RANGE",
                        detail: "\(connectivityManager.rangeTotalSwings) swings",
                        icon: "scope"
                    ) {
                        showingRange = true
                        Haptics.play(.click)
                    }
                }
                if connectivityManager.isRoundActive && !showingRound {
                    resumeBanner(
                        title: "RESUME ROUND",
                        detail: "Hole \(connectivityManager.currentHoleNumber) · \(connectivityManager.formattedToPar)",
                        icon: "flag.fill"
                    ) {
                        showingRound = true
                        Haptics.play(.click)
                    }
                }

                // Primary: GPS-detected start, or generic Round CTA.
                if let nearby = nearbyCourse {
                    Button {
                        beginStartAction(.nearbyRound(nearby))
                    } label: {
                        VStack(spacing: 2) {
                            Text("START AT")
                                .font(SLW.mono(8, weight: .semibold))
                                .tracking(1.4)
                                .foregroundColor(SLW.accentInk.opacity(0.6))
                            Text(nearby.name.uppercased())
                                .font(SLW.mono(11, weight: .semibold))
                                .tracking(1.0)
                                .foregroundColor(SLW.accentInk)
                                .lineLimit(2)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .background(SLW.accent)
                    }
                    .buttonStyle(.plain)
                } else {
                    Button {
                        beginStartAction(.genericRound)
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "flag.fill")
                            Text("START ROUND").tracking(1.4)
                        }
                        .font(SLW.mono(11, weight: .semibold))
                        .foregroundColor(SLW.accentInk)
                        .frame(maxWidth: .infinity, minHeight: 36)
                        .background(SLW.accent)
                    }
                    .buttonStyle(.plain)
                }

                // Secondary: Range / driving range session.
                Button {
                    beginStartAction(.range)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "scope")
                        Text("RANGE").tracking(1.4)
                    }
                    .font(SLW.mono(11, weight: .semibold))
                    .foregroundColor(SLW.ink)
                    .frame(maxWidth: .infinity, minHeight: 32)
                    .background(SLW.surface2)
                    .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
                }
                .buttonStyle(.plain)

                HStack(spacing: 6) {
                    Circle()
                        .fill(connectivityManager.isPhoneReachable ? SLW.accent : SLW.bad.opacity(0.7))
                        .frame(width: 6, height: 6)

                    Text(startHint)
                        .font(SLW.mono(9))
                        .foregroundColor(SLW.ink3)
                        .lineLimit(2)
                        .minimumScaleFactor(0.75)
                }

                if showsPhoneContextHint {
                    Text("Open StrikeLab on iPhone to pick a course, sync your bag, or send the next tee time.")
                        .font(SLW.mono(8))
                        .foregroundColor(SLW.ink3)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                        .minimumScaleFactor(0.75)
                        .padding(.horizontal, 4)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
        }
        .onAppear { locationManager.startBriefly() }
    }

    /// Kick off a range session — defaults the active club to 7-iron, the
    /// most-hit warm-up club. The user can switch via the bag tab.
    private func startRangeSession() {
        connectivityManager.startRangeSession(initialClub: .iron7)
        // Start a HealthKit golf workout so the session shows in Activity rings.
        workoutManager.startWorkout()
        Haptics.play(.start)
    }

    /// Find the nearest seeded course inside ~500 m of the watch's current fix.
    private var nearbyCourse: WatchCourseEntry? {
        guard let me = locationManager.lastLocation else { return nil }
        let candidates = connectivityManager.coursesDirectory.map { entry -> (WatchCourseEntry, CLLocationDistance) in
            let course = CLLocation(latitude: entry.latitude, longitude: entry.longitude)
            return (entry, me.distance(from: course))
        }
        guard let best = candidates.min(by: { $0.1 < $1.1 }) else { return nil }
        return best.1 < 500 ? best.0 : nil
    }

    private var startHint: String {
        if !connectivityManager.isPhoneReachable { return "No iPhone connection" }
        if let nearby = nearbyCourse { return "Detected · \(nearby.name)" }
        if let course = connectivityManager.courseName { return course }
        return "Pick course on iPhone"
    }

    private var showsPhoneContextHint: Bool {
        connectivityManager.nextTeeBooking == nil
            && connectivityManager.rangeSession == nil
            && !connectivityManager.isRoundActive
            && nearbyCourse == nil
            && connectivityManager.courseName == nil
    }

    private func beginStartAction(_ action: StartAction) {
        pendingStartAction = action
        guard watchSettings.hasSeenSensorPreflight else {
            showSensorPreflight = true
            return
        }
        runPendingStartAction()
    }

    private func runPendingStartAction() {
        watchSettings.hasSeenSensorPreflight = true
        guard let action = pendingStartAction else { return }
        pendingStartAction = nil

        switch action {
        case .nearbyRound(let nearby):
            connectivityManager.requestStartRound(courseId: nearby.id)
            startWorkout()
            showingRound = true
        case .genericRound:
            startWorkout()
            showingRound = true
        case .range:
            startRangeSession()
            showingRange = true
        }
    }

    /// Big "Resume <session>" pill shown on the start screen when a
    /// session is running in the background.
    private func resumeBanner(
        title: String,
        detail: String,
        icon: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(SLW.accentInk)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.4)
                        .foregroundColor(SLW.accentInk)
                    Text(detail)
                        .font(SLW.mono(9))
                        .foregroundColor(SLW.accentInk.opacity(0.75))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(SLW.accentInk)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .frame(maxWidth: .infinity)
            .background(SLW.accent)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Active round

    private var activeRoundView: some View {
        TabView(selection: $selectedHole) {
            ForEach(connectivityManager.playedHoles, id: \.holeNumber) { hole in
                holePage(for: hole)
                    .tag(hole.holeNumber)
            }
            roundFinishPage
                .tag(finishPageTag)
        }
        .tabViewStyle(.verticalPage)
        .containerBackground(SLW.bg, for: .navigation)
        .onAppear {
            ensureRoundSensorsRunning()
        }
    }

    private var finishPageTag: Int {
        connectivityManager.playFormat.range.upperBound + 1
    }

    private var roundFinishPage: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SUMMARY")
                .font(SLW.mono(9, weight: .semibold))
                .tracking(1.6)
                .foregroundColor(SLW.accent)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(connectivityManager.formattedToPar)
                    .font(SLW.num(42))
                    .foregroundColor(summaryScoreColor)
                Text("vs PAR")
                    .font(SLW.mono(9))
                    .tracking(1.5)
                    .foregroundColor(SLW.ink3)
            }

            Text((connectivityManager.courseName ?? "ROUND").uppercased())
                .font(SLW.display(12))
                .foregroundColor(SLW.ink)
                .lineLimit(1)

            HStack(spacing: 5) {
                summaryCell(label: "HOLES", value: "\(connectivityManager.playedHoles.filter { ($0.grossStrokes ?? 0) > 0 }.count)/\(connectivityManager.playFormat.range.count)")
                summaryCell(label: "GROSS", value: "\(connectivityManager.grossTotal)")
                summaryCell(label: "TIME", value: formattedRoundElapsed)
            }

            Text("Swipe up to return to the last hole, or end when the card is complete.")
                .font(SLW.mono(8))
                .foregroundColor(SLW.ink3)
                .lineLimit(2)
                .minimumScaleFactor(0.8)

            completeRoundStatusLabel

            Button {
                showEndRoundAlert = true
            } label: {
                Text(completeRoundButtonTitle)
                    .font(SLW.mono(10, weight: .semibold))
                    .tracking(1.8)
                    .foregroundColor(SLW.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 30)
            }
            .background(SLW.accent)
            .buttonStyle(.plain)
            .disabled(isCompleteRoundPending)
        }
        .padding(8)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(SLW.bg)
    }

    private var isCompleteRoundPending: Bool {
        if case .pending = connectivityManager.completeRoundStatus { return true }
        return false
    }

    private var completeRoundButtonTitle: String {
        isCompleteRoundPending ? "SAVING..." : "END ROUND"
    }

    private var completeRoundStatusLabel: some View {
        let text: String
        let tint: Color
        switch connectivityManager.completeRoundStatus {
        case .idle:
            text = connectivityManager.isPhoneReachable ? "READY TO SAVE ON IPHONE" : "IPHONE OFFLINE · WILL QUEUE"
            tint = connectivityManager.isPhoneReachable ? SLW.ink3 : SLW.warn
        case .pending:
            text = "SAVING ON IPHONE..."
            tint = SLW.warn
        case .completed(let detail):
            text = detail.uppercased()
            tint = SLW.accent
        case .failed(let detail):
            text = detail.uppercased()
            tint = SLW.bad
        }
        return Text(text)
            .font(SLW.mono(8, weight: .semibold))
            .tracking(1.1)
            .foregroundColor(tint)
            .lineLimit(2)
            .minimumScaleFactor(0.75)
    }

    private var summaryScoreColor: Color {
        let diff = connectivityManager.grossTotal - connectivityManager.parToCurrent
        if diff < 0 { return SLW.accent }
        if diff > 0 { return SLW.warn }
        return SLW.ink
    }

    private func summaryCell(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(SLW.mono(7))
                .tracking(1.2)
                .foregroundColor(SLW.ink3)
            Text(value)
                .font(SLW.num(13))
                .foregroundColor(SLW.ink2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(5)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }

    // MARK: - Hole page

    private func holePage(for hole: WatchHoleState) -> some View {
        VStack(spacing: 4) {
            holeHeader(for: hole)
            fieldToggle
            heroTile(for: hole)
                .frame(maxWidth: .infinity)
                .layoutPriority(1)
            footerRow(for: hole)
        }
        // Keep the scoring chrome pinned at the top; only the tab segment
        // should turn green when the active field changes.
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.horizontal, 6)
        .padding(.top, 2)
    }

    // MARK: - Header

    private func holeHeader(for hole: WatchHoleState) -> some View {
        // Long-press the header to mark Par instantly — the most common
        // score and the fastest single gesture for a confident player.
        HStack(alignment: .center, spacing: 4) {
            // Keep the leading edge clear for watchOS' system back chevron.
            Spacer(minLength: 58)

            HStack(spacing: 4) {
                Text("HOLE \(hole.holeNumber)")
                    .font(SLW.mono(9, weight: .semibold))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink)
                Text("·")
                    .foregroundColor(SLW.ink3)
                Text("PAR \(hole.par)")
                    .font(SLW.mono(9))
                    .foregroundColor(SLW.ink3)
                if hole.strokesReceived > 0 {
                    Text("·")
                        .foregroundColor(SLW.ink3)
                    Text("+\(hole.strokesReceived)")
                        .font(SLW.mono(9, weight: .semibold))
                        .foregroundColor(SLW.warn)
                }
                // Show format chip if not full 18 so the player remembers
                // they're on a half-round.
                if connectivityManager.playFormat != .full18 {
                    Text(connectivityManager.playFormat.shortLabel)
                        .font(SLW.mono(9, weight: .semibold))
                        .foregroundColor(SLW.accent)
                }
            }
            .lineLimit(1)
            .minimumScaleFactor(0.8)
        }
        .padding(.horizontal, 4)
        .padding(.top, 2)
        .frame(maxWidth: .infinity, alignment: .trailing)
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 0.4) {
            connectivityManager.setStrokes(holeNumber: hole.holeNumber, strokes: hole.par)
            swingConfirmer.cancelPending()
            celebrate(strokes: hole.par, par: hole.par)
            syncCrown()
        }
    }

    private func clubActionChip(for hole: WatchHoleState) -> some View {
        let club = displayClub(for: hole)
        let isManual = activeShotClub != nil

        return Button {
            clubOverlayLogsShot = false
            pendingAutoShot = false
            showClubOverlay = true
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "figure.golf")
                    .font(.system(size: 10, weight: .semibold))
                Text(club.shortName.uppercased())
                    .font(SLW.num(12))
            }
            .foregroundColor(isManual ? SLW.accent : SLW.ink2)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Strokes / Putts toggle

    private var fieldToggle: some View {
        HStack(spacing: 0) {
            toggleButton(label: "STROKES", field: .strokes)
            toggleButton(label: "PUTTS", field: .putts)
        }
        .frame(height: 32)
        .background(SLW.surface2)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        .clipped()
    }

    private func toggleButton(label: String, field: HoleField) -> some View {
        let isActive = activeField == field
        return Text(label)
            .font(SLW.mono(9, weight: .semibold))
            .tracking(1.4)
            .foregroundColor(isActive ? SLW.accentInk : SLW.ink2)
            .frame(maxWidth: .infinity, minHeight: 32, maxHeight: 32)
            .background(isActive ? SLW.accent : SLW.surface2)
            .overlay(Rectangle().stroke(isActive ? SLW.accent : Color.clear, lineWidth: 1))
            .contentShape(Rectangle())
            .onTapGesture {
                if activeField == field {
                    disarmCrown()
                    Haptics.play(.click)
                    return
                }
                // Drop Crown focus before switching so watchOS does not keep
                // the old hero expanded under the status clock.
                disarmCrown()
                activeField = field
                Haptics.play(.click)
        }
    }

    // MARK: - Hero tile (whichever field is active)

    @ViewBuilder
    private func heroTile(for hole: WatchHoleState) -> some View {
        switch activeField {
        case .strokes:
            strokesHero(for: hole)
        case .putts:
            puttsHero(for: hole)
        }
    }

    private func strokesHero(for hole: WatchHoleState) -> some View {
        let strokes = hole.grossStrokes ?? hole.par
        let canDecrement = strokes > 1
        let canIncrement = strokes < hole.maxStrokes

        return VStack(spacing: 4) {
            HStack(alignment: .center, spacing: 4) {
                stepChip(symbol: "minus", enabled: canDecrement) {
                    decrementStrokes(hole: hole)
                }

                // Central armable Crown surface — tap to arm, rotate to
                // edit. Crown rotation is gated by `crownArmed`.
                VStack(spacing: 0) {
                    Text("\(strokes)")
                        .font(SLW.num(60))
                        .foregroundColor(crownArmed
                                         ? scoreInk(strokes: strokes, par: hole.par)
                                         : scoreInk(strokes: strokes, par: hole.par).opacity(0.85))
                        .frame(maxWidth: .infinity)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Text(scoreName(strokes: strokes, par: hole.par))
                        .font(SLW.mono(11, weight: .semibold))
                        .tracking(1.2)
                        .foregroundColor(SLW.ink2)
                }
                .frame(maxWidth: .infinity, minHeight: 76)
                .contentShape(Rectangle())
                .focusable(true)
                .focused($crownFocus)
                .digitalCrownRotation(
                    $crownValue,
                    from: 1,
                    through: Double(hole.maxStrokes),
                    by: 1,
                    sensitivity: .low,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )
                .onChange(of: crownValue) { _, newValue in
                    // GATE: ignore Crown unless the user explicitly armed.
                    // This stops wrist contact / sleeve drag from changing
                    // the score on the course.
                    guard activeField == .strokes, crownArmed else { return }
                    let intValue = Int(newValue.rounded())
                    if intValue != hole.grossStrokes {
                        connectivityManager.setStrokes(
                            holeNumber: hole.holeNumber,
                            strokes: intValue
                        )
                        celebrate(strokes: intValue, par: hole.par)
                    }
                    // Active rotation extends the armed window.
                    rearmDisarmTimer()
                }
                .onTapGesture {
                    toggleCrownArmed()
                }
                // Long-press the centre to commit + advance to the next hole.
                .onLongPressGesture(minimumDuration: 0.5) {
                    commitAndAdvance(from: hole)
                }

                stepChip(symbol: "plus", enabled: canIncrement) {
                    incrementStrokes(hole: hole)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 88, maxHeight: 96)
            .padding(.vertical, 4)
            .padding(.horizontal, 4)
            .background(SLW.surface)
            .overlay(
                Rectangle().stroke(
                    crownArmed ? SLW.accent : SLW.line,
                    lineWidth: crownArmed ? 2 : 1
                )
            )
            .overlay { scoreVitalsOverlay(for: hole) }

            armedStatusLabel
        }
    }

    /// Tiny status microcopy under the hero. Three concerns combined:
    ///  1. Crown armed / disarmed (so the user knows when rotations bite)
    ///  2. Auto-detect candidate pending (so the user knows the watch
    ///     saw a swing and is waiting for them to walk away)
    ///  3. Just-confirmed flash (so the player gets a brief "+1 shot"
    ///     readout without staring at the score)
    private var armedStatusLabel: some View {
        let confirmer = swingConfirmer.status

        // The confirmer state takes visual priority during a round —
        // pending and confirmed are time-critical signals; the Crown
        // armed/disarmed state is implicit (the border colour already
        // shows it). When the confirmer is idle, fall back to the
        // tap-to-edit / crown-live messaging.
        return HStack(spacing: 4) {
            switch confirmer {
            case .pending:
                Circle()
                    .fill(SLW.warn)
                    .frame(width: 5, height: 5)
                Text("SWING PENDING · WALK TO CONFIRM")
                    .font(SLW.mono(8, weight: .semibold))
                    .tracking(1.0)
                    .foregroundColor(SLW.warn)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            case .justConfirmed:
                Image(systemName: "checkmark")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(SLW.accent)
                Text("SHOT CONFIRMED")
                    .font(SLW.mono(8, weight: .semibold))
                    .tracking(1.2)
                    .foregroundColor(SLW.accent)
            case .idle:
                Circle()
                    .fill(crownArmed ? SLW.accent : SLW.ink3)
                    .frame(width: 5, height: 5)
                Text(crownArmed ? "CROWN LIVE" : "TAP TO EDIT")
                    .font(SLW.mono(8, weight: .semibold))
                    .tracking(1.2)
                    .foregroundColor(crownArmed ? SLW.accent : SLW.ink3)
            }
        }
        .frame(maxWidth: .infinity)
        .animation(.easeInOut(duration: 0.18), value: confirmer)
    }

    /// Square chip for incrementing/decrementing strokes & putts. Crown-free
    /// fallback so the user doesn't need to arm anything to nudge a value.
    private func stepChip(symbol: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(enabled ? SLW.ink : SLW.ink3.opacity(0.5))
                .frame(width: 32, height: 32)
                .background(SLW.surface2)
                .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }

    private func incrementStrokes(hole: WatchHoleState) {
        let current = hole.grossStrokes ?? hole.par
        let next = min(hole.maxStrokes, current + 1)
        guard next != current else { return }
        connectivityManager.setStrokes(holeNumber: hole.holeNumber, strokes: next)
        // Manual increment is ground truth — cancel any in-flight
        // auto-detect candidate so the next walk-away doesn't double-count.
        swingConfirmer.cancelPending()
        celebrate(strokes: next, par: hole.par)
        syncCrown()
    }

    private func decrementStrokes(hole: WatchHoleState) {
        let current = hole.grossStrokes ?? hole.par
        let next = max(1, current - 1)
        guard next != current else { return }
        connectivityManager.setStrokes(holeNumber: hole.holeNumber, strokes: next)
        swingConfirmer.cancelPending()
        Haptics.play(.click)
        syncCrown()
    }

    /// Commits the current strokes value and pages to the next hole. If
    /// already on the last hole of the chosen format, just plays a
    /// celebratory haptic.
    private func commitAndAdvance(from hole: WatchHoleState) {
        let strokes = Int(crownValue.rounded())
        if strokes != hole.grossStrokes {
            connectivityManager.setStrokes(holeNumber: hole.holeNumber, strokes: strokes)
            celebrate(strokes: strokes, par: hole.par)
        } else {
            Haptics.play(.success)
        }
        // Committing-and-advancing is a ground-truth signal too; clear
        // any in-flight auto-detect so we don't carry it onto the next hole.
        swingConfirmer.cancelPending()
        disarmCrown()
    }

    private func puttsHero(for hole: WatchHoleState) -> some View {
        let putts = hole.putts ?? 1
        let canDecrement = putts > 0
        let canIncrement = putts < 8

        return VStack(spacing: 4) {
            HStack(alignment: .center, spacing: 4) {
                stepChip(symbol: "minus", enabled: canDecrement) {
                    decrementPutts(hole: hole)
                }

                VStack(spacing: 0) {
                    Text("\(putts)")
                        .font(SLW.num(60))
                        .foregroundColor(crownArmed ? SLW.accent : SLW.ink)
                        .opacity(crownArmed ? 1.0 : 0.88)
                        .frame(maxWidth: .infinity)
                        .lineLimit(1)
                    Text(putts == 1 ? "1 putt" : "\(putts) putts")
                        .font(SLW.mono(11, weight: .semibold))
                        .tracking(1.2)
                        .foregroundColor(SLW.ink2)
                }
                .frame(maxWidth: .infinity, minHeight: 76)
                .contentShape(Rectangle())
                .focusable(true)
                .focused($crownFocus)
                .digitalCrownRotation(
                    $crownValue,
                    from: 0,
                    through: 8,
                    by: 1,
                    sensitivity: .low,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )
                .onChange(of: crownValue) { _, newValue in
                    // Same gate as strokes — Crown only writes when armed.
                    guard activeField == .putts, crownArmed else { return }
                    let intValue = Int(newValue.rounded())
                    if intValue != hole.putts {
                        connectivityManager.setPutts(
                            holeNumber: hole.holeNumber,
                            putts: intValue
                        )
                        scheduleReturnToStrokes()
                    }
                    rearmDisarmTimer()
                }
                .onTapGesture {
                    toggleCrownArmed()
                }

                stepChip(symbol: "plus", enabled: canIncrement) {
                    incrementPutts(hole: hole)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 88, maxHeight: 96)
            .padding(.vertical, 4)
            .padding(.horizontal, 4)
            .background(SLW.surface)
            .overlay(
                Rectangle().stroke(
                    crownArmed ? SLW.accent : SLW.line,
                    lineWidth: crownArmed ? 2 : 1
                )
            )
            .overlay { scoreVitalsOverlay(for: hole) }

            armedStatusLabel
        }
    }

    private func incrementPutts(hole: WatchHoleState) {
        let current = hole.putts ?? 1
        let next = min(8, current + 1)
        guard next != current else { return }
        connectivityManager.setPutts(holeNumber: hole.holeNumber, putts: next)
        Haptics.play(.click)
        syncCrown()
        scheduleReturnToStrokes()
    }

    private func decrementPutts(hole: WatchHoleState) {
        let current = hole.putts ?? 1
        let next = max(0, current - 1)
        guard next != current else { return }
        connectivityManager.setPutts(holeNumber: hole.holeNumber, putts: next)
        Haptics.play(.click)
        syncCrown()
        scheduleReturnToStrokes()
    }

    // MARK: - Footer (totals + actions)

    private func footerRow(for hole: WatchHoleState) -> some View {
        HStack(spacing: 6) {
            footerChip(icon: "scope", value: "\(connectivityManager.grossTotal)", tint: SLW.accent)
            footerChip(icon: "flag", value: connectivityManager.formattedToPar, tint: SLW.ink2)
            clubActionChip(for: hole)

            Button {
                showMore = true
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.system(size: 16))
                    .foregroundColor(SLW.ink2)
                    .frame(maxWidth: .infinity, minHeight: 24)
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
    }

    private func scoreVitalsOverlay(for hole: WatchHoleState) -> some View {
        ZStack {
            VStack {
                HStack(alignment: .top) {
                    handicapCornerChip(for: hole)
                    Spacer()
                    if watchSettings.showHeartRateOnWatch {
                        scoreVitalChip(icon: "heart.fill", value: formattedLiveHeartRate, tint: SLW.bad)
                    } else {
                        scoreVitalChip(icon: "flag", value: connectivityManager.formattedToPar, tint: SLW.ink2)
                    }
                }
                Spacer()
                HStack(alignment: .bottom) {
                    scoreVitalChip(icon: "timer", value: formattedRoundElapsed, tint: SLW.accent)
                    Spacer()
                    scoreVitalChip(icon: "location.fill", value: distanceToPinLabel(for: hole), tint: SLW.warn)
                        .hidden()
                }
            }
            .allowsHitTesting(false)

            VStack {
                Spacer()
                HStack {
                    Text(compactGpsStatusLabel.uppercased())
                        .font(SLW.mono(7, weight: .semibold))
                        .tracking(0.9)
                        .foregroundColor(SLW.ink3)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Spacer()
                    Button {
                        toggleTemporaryDistanceUnits()
                    } label: {
                        scoreVitalChip(icon: "location.fill", value: distanceToPinLabel(for: hole), tint: SLW.warn)
                    }
                    .buttonStyle(.plain)
                    .disabled(distanceToPinMetersForScoring(hole: hole.holeNumber) == nil)
                }
            }
        }
        .padding(5)
    }

    private func scoreVitalChip(icon: String, value: String, tint: Color) -> some View {
        HStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(tint)
            Text(value)
                .font(SLW.num(9))
                .foregroundColor(SLW.ink2)
        }
        .padding(.horizontal, 5)
        .padding(.vertical, 3)
        .background(SLW.bg.opacity(0.78))
        .overlay(Rectangle().stroke(SLW.line.opacity(0.75), lineWidth: 1))
    }

    private func handicapCornerChip(for hole: WatchHoleState) -> some View {
        HStack(spacing: 0) {
            scoreVitalChip(icon: "number", value: "HCP \(hole.handicapIndex)", tint: SLW.accent)
            if hole.strokesReceived > 0 {
                Text("+\(hole.strokesReceived)")
                    .font(SLW.num(9))
                    .foregroundColor(SLW.accentInk)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 3)
                    .background(SLW.accent)
                    .overlay(Rectangle().stroke(SLW.accent.opacity(0.9), lineWidth: 1))
            }
        }
    }

    private var formattedRoundElapsed: String {
        let seconds: Int
        if let started = connectivityManager.roundStartedAt {
            seconds = max(0, Int(elapsedTimerNow.timeIntervalSince(started)))
        } else if let elapsed = connectivityManager.roundElapsedSeconds {
            let age = connectivityManager.roundElapsedSyncedAt.map { elapsedTimerNow.timeIntervalSince($0) } ?? 0
            seconds = max(0, Int(elapsed + age))
        } else if workoutManager.elapsedTime > 0 {
            seconds = max(0, Int(workoutManager.elapsedTime))
        } else {
            seconds = 0
        }
        let minutes = seconds / 60
        let hours = minutes / 60
        let remainder = minutes % 60
        if hours > 0 {
            return "\(hours)h \(String(format: "%02d", remainder))m"
        }
        return "\(minutes)m"
    }

    private var formattedLiveHeartRate: String {
        let bpm = hrManager.liveBPM > 0 ? hrManager.liveBPM : workoutManager.heartRate
        guard bpm > 0 else { return "--" }
        return String(format: "%.0f", bpm)
    }

    private func footerChip(icon: String, value: String, tint: Color) -> some View {
        HStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundColor(tint)
            Text(value)
                .font(SLW.num(12))
                .foregroundColor(SLW.ink)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
    }

    private var displayDistanceUnits: WatchUnitsSystem {
        temporaryDistanceUnits ?? connectivityManager.unitsSystem
    }

    private func toggleTemporaryDistanceUnits() {
        temporaryDistanceUnits = displayDistanceUnits.toggled
        Haptics.play(.click)
    }

    // MARK: - "More" sheet

    private var moreSheet: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("HOLE \(selectedHole)")
                    .font(SLW.mono(10, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)

                Button {
                    showMore = false
                    clubOverlayLogsShot = true
                    showClubOverlay = true
                    pendingAutoShot = false
                } label: { actionRow(icon: "scope", label: "Log shot manually") }
                .buttonStyle(.plain)

                Button {
                    showMore = false
                    let hole = connectivityManager.currentHole
                    let current = hole.grossStrokes ?? hole.par
                    if current > 1 {
                        connectivityManager.setStrokes(holeNumber: selectedHole, strokes: current - 1)
                    }
                    swingConfirmer.cancelPending()
                } label: { actionRow(icon: "arrow.uturn.backward", label: "Undo last stroke") }
                .buttonStyle(.plain)

                Button {
                    showMore = false
                    let hole = connectivityManager.currentHole
                    connectivityManager.setStrokes(
                        holeNumber: selectedHole,
                        strokes: hole.netDoubleBogey
                    )
                    swingConfirmer.cancelPending()
                } label: { actionRow(icon: "hand.raised", label: "Pick up (net double bogey)") }
                .buttonStyle(.plain)

                Button {
                    showMore = false
                    showGuestScores = true
                } label: { actionRow(icon: "person.2", label: "Guest scores") }
                .buttonStyle(.plain)
                .disabled(connectivityManager.groupPlayers.isEmpty)
                .opacity(connectivityManager.groupPlayers.isEmpty ? 0.35 : 1.0)

                Button {
                    showMore = false
                    // Defer the actual end behind a confirmation alert
                    // so accidental taps don't kill the round.
                    showEndRoundAlert = true
                } label: { actionRow(icon: "flag.checkered", label: "End round", danger: true) }
                .buttonStyle(.plain)

                Button {
                    showMore = false
                    toggleAutoDetect()
                } label: {
                    actionRow(
                        icon: motionManager.isDetectionEnabled ? "waveform.circle.fill" : "waveform.circle",
                        label: motionManager.isDetectionEnabled ? "Auto-detect ON" : "Auto-detect OFF"
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(8)
        }
        .background(SLW.bg)
    }

    private var guestScoresSheet: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("GUESTS · HOLE \(selectedHole)")
                    .font(SLW.mono(10, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)

                Text(connectivityManager.isPhoneReachable ? "SYNC LIVE" : "OFFLINE · WILL QUEUE")
                    .font(SLW.mono(8, weight: .semibold))
                    .tracking(1.1)
                    .foregroundColor(connectivityManager.isPhoneReachable ? SLW.accent : SLW.warn)

                if connectivityManager.groupPlayers.isEmpty {
                    Text("Add guests on iPhone")
                        .font(SLW.mono(11))
                        .foregroundColor(SLW.ink2)
                        .padding(10)
                } else {
                    ForEach(connectivityManager.groupPlayers) { guest in
                        guestScoreRow(guest: guest)
                    }
                }
            }
            .padding(8)
        }
        .background(SLW.bg)
    }

    private func guestScoreRow(guest: WatchGroupPlayer) -> some View {
        let score = guest.score(for: selectedHole)
        let gross = score?.grossStrokes ?? score?.par ?? connectivityManager.currentHole.par
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text(guest.name.uppercased())
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.2)
                        .foregroundColor(SLW.ink)
                    if let score {
                        Text(score.strokesReceived > 0 ? "+\(score.strokesReceived) stroke\(score.strokesReceived == 1 ? "" : "s") here" : "gross only here")
                            .font(SLW.mono(8))
                            .foregroundColor(score.strokesReceived > 0 ? SLW.warn : SLW.ink3)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("\(gross)")
                        .font(SLW.num(26))
                        .foregroundColor(SLW.accent)
                    if let net = score?.netStrokes {
                        Text("NET \(net)")
                            .font(SLW.mono(8))
                            .foregroundColor(SLW.ink3)
                    }
                }
            }

            HStack(spacing: 8) {
                Button {
                    guard gross > 0 else { return }
                    connectivityManager.setGuestScore(
                        playerId: guest.id,
                        holeNumber: selectedHole,
                        grossStrokes: max(0, gross - 1)
                    )
                } label: {
                    Image(systemName: "minus")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(SLW.ink)
                        .frame(maxWidth: .infinity, minHeight: 30)
                        .background(SLW.surface2)
                        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .disabled(gross <= 0)

                Button {
                    connectivityManager.setGuestScore(
                        playerId: guest.id,
                        holeNumber: selectedHole,
                        grossStrokes: score?.par ?? connectivityManager.currentHole.par
                    )
                } label: {
                    Text("PAR")
                        .font(SLW.mono(9, weight: .semibold))
                        .tracking(1.2)
                        .foregroundColor(SLW.ink)
                        .frame(maxWidth: .infinity, minHeight: 30)
                        .background(SLW.surface2)
                        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
                }
                .buttonStyle(.plain)

                Button {
                    connectivityManager.setGuestScore(
                        playerId: guest.id,
                        holeNumber: selectedHole,
                        grossStrokes: gross + 1
                    )
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(SLW.ink)
                        .frame(maxWidth: .infinity, minHeight: 30)
                        .background(SLW.surface2)
                        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(10)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }

    private func actionRow(icon: String, label: String, danger: Bool = false) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(danger ? SLW.bad : SLW.ink2)
            Text(label)
                .font(SLW.mono(11))
                .foregroundColor(danger ? SLW.bad : SLW.ink)
            Spacer()
        }
        .padding(8)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }

    // MARK: - Score helpers

    private func scoreName(strokes: Int, par: Int) -> String {
        if strokes == 1 { return "Ace" }
        let diff = strokes - par
        switch diff {
        case ..<(-3): return "Albatross"
        case -2:      return "Eagle"
        case -1:      return "Birdie"
        case 0:       return "Par"
        case 1:       return "Bogey"
        case 2:       return "Double"
        case 3:       return "Triple"
        default:      return diff > 0 ? "+\(diff)" : "Ace"
        }
    }

    private func scoreInk(strokes: Int, par: Int) -> Color {
        if strokes < par { return SLW.accent }
        if strokes == par { return SLW.ink }
        return SLW.bad
    }

    /// Pick a haptic that matches the score relative to par. Eagles +
    /// hole-in-ones get the success/notification combo, birdies a single
    /// success, par a click, bogeys a soft retract, doubles+ a failure.
    private func celebrate(strokes: Int, par: Int) {
        let diff = strokes - par
        switch diff {
        case ..<(-1):
            Haptics.celebrate()
        case -1:
            Haptics.play(.success)
        case 0:
            Haptics.play(.click)
        case 1:
            Haptics.play(.retry)
        default:
            Haptics.play(.failure)
        }
    }

    /// Sync the Crown's local Double to whatever the watch model says — runs
    /// on hole changes, focus changes, and incoming phone updates so the
    /// Crown never feels stale.
    private func syncCrown() {
        let hole = connectivityManager.currentHole
        switch activeField {
        case .strokes:
            crownValue = Double(hole.grossStrokes ?? hole.par)
        case .putts:
            crownValue = Double(hole.putts ?? 1)
        }
    }

    // MARK: - Crown safety (arm / disarm)

    /// Arm the Crown for ~8s of editing. The user must explicitly tap
    /// the hero tile to enter this state — this is what stops accidental
    /// wrist contact from changing the score on the course.
    private func armCrown() {
        // Reset crownValue to the live source-of-truth before unlocking
        // edits so we don't apply any stale rotations the Crown picked
        // up while it was idle.
        syncCrown()
        crownArmed = true
        crownFocus = true
        Haptics.play(.click)
        rearmDisarmTimer()
    }

    /// Disarm immediately. Idempotent — safe to call from any state
    /// transition (hole change, field change, view dismiss, etc.).
    private func disarmCrown() {
        crownArmed = false
        crownFocus = false
        armTimer?.invalidate()
        armTimer = nil
    }

    private func toggleCrownArmed() {
        if crownArmed {
            disarmCrown()
        } else {
            armCrown()
        }
    }

    /// Reset the auto-disarm countdown to 8 seconds. Called from arm
    /// and from every Crown rotation tick, so active scrolling keeps
    /// the Crown alive but idle wrists let it sleep.
    private func rearmDisarmTimer() {
        armTimer?.invalidate()
        armTimer = Timer.scheduledTimer(withTimeInterval: 8.0, repeats: false) { _ in
            Task { @MainActor in
                crownArmed = false
            }
        }
    }

    private func scheduleReturnToStrokes() {
        puttsReturnTimer?.invalidate()
        puttsReturnTimer = Timer.scheduledTimer(withTimeInterval: 8.0, repeats: false) { _ in
            Task { @MainActor in
                guard activeField == .putts else { return }
                activeField = .strokes
                syncCrown()
                disarmCrown()
            }
        }
    }

    // MARK: - Workout / motion plumbing

    private func startWorkout() {
        workoutManager.startWorkout()
        if !hrManager.isStreaming {
            hrManager.start()
        }
        motionManager.startDetection()
        // Round mode runs continuous GPS so the SwingConfirmer can
        // distinguish practice swings from real shots via displacement.
        locationManager.startContinuous()
        startConfirmerTick()
        startElapsedTick()
    }

    private func ensureRoundSensorsRunning() {
        if !workoutManager.isWorkoutActive {
            workoutManager.startWorkout()
        }
        if !motionManager.isDetectionEnabled {
            motionManager.startDetection()
        }
        if !hrManager.isStreaming {
            hrManager.start()
        }
        if locationManager.lastLocation == nil {
            locationManager.startContinuous()
        }
        startConfirmerTick()
        startElapsedTick()
    }

    private func endWorkout() {
        workoutManager.endWorkout()
        hrManager.stop()
        motionManager.stopDetection()
        locationManager.stopContinuous()
        stopConfirmerTick()
        stopElapsedTick()
        swingConfirmer.reset()
    }

    private func requestEndRoundFromWatch() {
        endWorkout()
        connectivityManager.requestCompleteRound()
    }

    private func toggleAutoDetect() {
        if motionManager.isDetectionEnabled {
            motionManager.stopDetection()
        } else {
            motionManager.startDetection()
        }
    }

    /// Wire the motion → confirmer → strokes chain. Motion alone produces
    /// CANDIDATES, never strokes. The SwingConfirmer adds the "did the
    /// player walk away from the spot?" signal before incrementing.
    private func setupMotionDetection() {
        motionManager.onSwingCaptured = { capture in
            connectivityManager.cacheRoundSwingCapture(capture)
            let pinM = distanceToPinMetersForScoring(hole: selectedHole)
            let immediate = shouldConfirmSwingImmediately(
                activeField: activeField,
                pinDistanceMeters: pinM
            )
            let asPutt = countsAutoDetectedPutt(
                activeField: activeField,
                pinDistanceMeters: pinM
            )
            swingConfirmer.recordCandidate(
                at: locationManager.lastLocation,
                hole: selectedHole,
                confidence: capture.detectionConfidence,
                capture: capture,
                immediateStroke: immediate,
                countsAsPutt: asPutt
            )
            // Soft "swing seen" tick so the player feels feedback. The
            // STRONG confirmation buzz only fires on shot-confirmed below.
            Haptics.play(.click)
        }

        swingConfirmer.onShotConfirmed = { hole, candidate, alsoPutt in
            connectivityManager.incrementStrokes(
                holeNumber: hole,
                alsoIncrementPutt: alsoPutt
            )
            let club = activeShotClub ?? suggestedClub(for: connectivityManager.currentHole)
            let hrSnapshot = hrManager.snapshot(around: candidate.detectedAt)
            let hrData = WatchConnectivityManagerWatch.buildHeartRateData(
                from: hrSnapshot,
                impactAt: candidate.detectedAt
            )
            let event = ShotEventWatch(
                id: candidate.id,
                timestamp: candidate.detectedAt,
                club: club,
                confidence: candidate.confidence,
                isManual: false,
                holeNumber: hole,
                heartRateData: hrData
            )
            connectivityManager.sendShotEvent(event)
            connectivityManager.sendRoundEnhancedShot(
                shotId: candidate.id,
                club: club,
                confidence: candidate.confidence,
                isManual: false,
                capture: candidate.capture,
                hrSnapshot: hrSnapshot
            )
            Haptics.swingRecognized()
            activeShotClub = nil
            syncCrown()
        }

        // Route every fresh GPS fix into the confirmer so it can decide
        // whether the player has displaced enough to confirm a candidate.
        locationManager.onLocationUpdate = { fix in
            swingConfirmer.ingest(location: fix)
        }
    }

    /// Haversine / CoreLocation distance to the pushed pin for `hole`, else
    /// phone caddie yards→m when the hole matches (fallback when pins missing).
    private func distanceToPinMetersForScoring(hole: Int) -> Double? {
        guard let loc = locationManager.lastLocation else { return nil }
        if let pin = connectivityManager.holePins[hole] {
            let pinLoc = CLLocation(latitude: pin.latitude, longitude: pin.longitude)
            return loc.distance(from: pinLoc)
        }
        if connectivityManager.caddieHole == hole && connectivityManager.caddieDistanceYards > 0 {
            return Double(connectivityManager.caddieDistanceYards) * 0.9144
        }
        return nil
    }

    /// On or near the green / explicit putts field → confirm without walking.
    private func shouldConfirmSwingImmediately(
        activeField: HoleField,
        pinDistanceMeters: Double?
    ) -> Bool {
        if let d = pinDistanceMeters, d <= 25 { return true }
        if activeField == .putts {
            if let d = pinDistanceMeters { return d <= 45 }
            return true
        }
        return false
    }

    /// When auto-confirming, also bump the putts counter on the hole card.
    private func countsAutoDetectedPutt(
        activeField: HoleField,
        pinDistanceMeters: Double?
    ) -> Bool {
        if let d = pinDistanceMeters, d <= 18 { return true }
        if activeField == .putts {
            if let d = pinDistanceMeters { return d <= 45 }
            return true
        }
        return false
    }

    /// 1Hz tick to drive candidate-expiry + flash-clear inside the
    /// confirmer. Cheap (one-method-call/sec) and only runs in round mode.
    private func startConfirmerTick() {
        stopConfirmerTick()
        confirmerTickTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            Task { @MainActor in
                swingConfirmer.tick()
            }
        }
    }

    private func stopConfirmerTick() {
        confirmerTickTimer?.invalidate()
        confirmerTickTimer = nil
    }

    private func startElapsedTick() {
        elapsedTimerNow = Date()
        stopElapsedTick()
        elapsedTickTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            Task { @MainActor in
                elapsedTimerNow = Date()
            }
        }
    }

    private func stopElapsedTick() {
        elapsedTickTimer?.invalidate()
        elapsedTickTimer = nil
    }

    private func logShot(club: ClubWatch) {
        let now = Date()
        let hrSnapshot = hrManager.snapshot(around: now)
        let hrData = WatchConnectivityManagerWatch.buildHeartRateData(
            from: hrSnapshot,
            impactAt: now
        )
        let event = ShotEventWatch(
            timestamp: now,
            club: club,
            confidence: pendingAutoShot ? motionManager.lastSwingConfidence : nil,
            isManual: !pendingAutoShot,
            holeNumber: selectedHole,
            heartRateData: hrData
        )
        connectivityManager.sendShotEvent(event)
        connectivityManager.sendRoundEnhancedShot(
            shotId: event.id,
            club: club,
            confidence: event.confidence,
            isManual: event.isManual,
            capture: nil,
            hrSnapshot: nil
        )
        connectivityManager.incrementStrokes(holeNumber: selectedHole)
        // Manual log is ground truth — drop any auto-detect candidate.
        swingConfirmer.cancelPending()
        activeShotClub = nil
        syncCrown()
        Haptics.play(.success)
    }

    private func displayClub(for hole: WatchHoleState) -> ClubWatch {
        activeShotClub ?? suggestedClub(for: hole)
    }

    private func suggestedClub(for hole: WatchHoleState) -> ClubWatch {
        if activeField == .putts { return .putter }
        if let distance = distanceToPinMetersForScoring(hole: hole.holeNumber), distance <= 18 {
            return .putter
        }
        if hole.holeNumber == connectivityManager.caddieHole,
           let caddieClub = ClubWatch(rawValue: connectivityManager.caddieClubRaw) {
            return caddieClub
        }
        return .iron7
    }

    private func distanceToPinLabel(for hole: WatchHoleState) -> String {
        guard let meters = distanceToPinMetersForScoring(hole: hole.holeNumber) else { return "—" }
        switch displayDistanceUnits {
        case .yards:
            return "\(Int((meters * 1.0936133).rounded()))y"
        case .meters:
            return "\(Int(meters.rounded()))m"
        }
    }

    private var compactGpsStatusLabel: String {
        if !connectivityManager.caddieGpsStatus.isEmpty {
            return connectivityManager.caddieGpsStatus
        }
        return locationManager.lastLocation == nil ? "No GPS" : "Watch GPS"
    }
}

#Preview {
    MainWatchView()
        .environmentObject(WorkoutManager())
        .environmentObject(MotionManager())
        .environmentObject(WatchConnectivityManagerWatch())
        .environmentObject(WatchLocationManager())
        .environmentObject(SwingConfirmer())
        .environmentObject(HighFrequencyHRManager())
}


