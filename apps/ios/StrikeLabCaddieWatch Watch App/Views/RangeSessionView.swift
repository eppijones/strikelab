//
//  RangeSessionView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Range-session UI for hitting balls at the bag.
//   • HERO page  — active club + tally, +1 manual, undo, end, auto-detect
//   • BAG page   — pick the active club + see per-club tally
//   • RECENT page — last 10 swings, swipe to delete a practice swing
//
//  Auto-detect uses MotionManager (CMDeviceMotion + dual-channel signature)
//  and ALWAYS routes haptics through the Haptics helper so users who turn
//  off vibrations don't get buzzed.
//

import SwiftUI
import WatchKit

struct RangeSessionView: View {
    @EnvironmentObject var connectivityManager: WatchConnectivityManagerWatch
    @EnvironmentObject var motionManager: MotionManager
    @EnvironmentObject var workoutManager: WorkoutManager
    @EnvironmentObject var hrManager: HighFrequencyHRManager
    @EnvironmentObject var impactAudio: ImpactAudioManager
    @EnvironmentObject var pressureMonitor: PressureMonitor
    @EnvironmentObject var referenceBaseline: WatchReferenceBaseline
    @EnvironmentObject var batterySaver: BatterySaver
    @ObservedObject private var settings = WatchSettings.shared
    @Environment(\.dismiss) private var dismiss

    @State private var activeTab: Tab = .hero
    @State private var detectFlash = false

    /// Live HUD state — replaced 800 ms after every detected swing.
    @State private var hudSummary: WatchSwingSummary?
    @State private var lastCapturedClub: ClubWatch?

    /// Streak counter for the consistency bar (consecutive in-baseline
    /// swings). Reset whenever a swing falls outside the envelope.
    @State private var consistencyStreak: Int = 0
    /// Highest streak seen this session.
    @State private var consistencyBest: Int = 0

    /// Crown-bound tempo target (seconds, backswingStart → impact).
    @State private var tempoSeconds: Double = 1.0

    /// Metronome on/off and timer.
    @State private var metronomeOn = false
    @State private var metronomeTimer: Timer?

    /// Confirm-before-end gate so a fat-finger on the bottom END
    /// button doesn't silently kill the range session and drop the
    /// swing log.
    @State private var showEndSessionAlert = false

    @State private var lastSwingTempo: Double?
    @State private var recentTempoRatios: [Double] = []
    @State private var showBagSheet = false

    /// Vertical pages: hero → coach → recent. Club bag opens only from the
    /// Bag button so scrolling never lands you in club selection by accident.
    enum Tab: Hashable { case hero, coach, recent }

    var body: some View {
        ZStack {
            TabView(selection: $activeTab) {
                heroPage.tag(Tab.hero)
                coachPage.tag(Tab.coach)
                recentPage.tag(Tab.recent)
            }
            .tabViewStyle(.verticalPage)

            if let summary = hudSummary {
                let clubKey = connectivityManager.rangeSession?.activeClub.rawValue ?? ""
                PostSwingHUDView(
                    summary: summary,
                    personalWindow: connectivityManager.personalWindows[clubKey],
                    onMarkGood: { promoteLastSwingToReference() },
                    onDismiss: { hudSummary = nil }
                )
                .padding(.horizontal, 6)
                .transition(.opacity)
            }

        }
        .containerBackground(SLW.bg, for: .navigation)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { setupMotion() }
        .onDisappear { stopMetronome() }
        .alert("End Range Session?", isPresented: $showEndSessionAlert) {
            Button("End", role: .destructive) { endSession() }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Stops auto-detect and saves the session to your iPhone.")
        }
        .sheet(isPresented: $showBagSheet) {
            NavigationStack {
                bagClubSelection
                    .navigationTitle("Bag")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Done") { showBagSheet = false }
                        }
                    }
            }
            .containerBackground(SLW.bg, for: .navigation)
        }
    }

    // MARK: - Hero page (active club + tally)

    private var heroPage: some View {
        let total = connectivityManager.rangeTotalSwings
        let activeCount = connectivityManager.rangeActiveClubCount
        let activeClub = connectivityManager.rangeSession?.activeClub
        let win = activeClub.flatMap { connectivityManager.personalWindows[$0.rawValue] }

        return VStack(spacing: 6) {
            WatchRangeReadyView(
                totalSwings: total,
                activeClubShort: activeClub?.shortName ?? "—",
                activeCount: activeCount,
                lastTempo: lastSwingTempo,
                window: win,
                recentTempos: recentTempoRatios,
                onClubTap: { showBagSheet = true }
            )
            .frame(maxWidth: .infinity)
            .padding(.vertical, 2)
            .background(detectFlash ? SLW.accent.opacity(0.12) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .animation(.easeOut(duration: 0.25), value: detectFlash)

            Button {
                connectivityManager.logRangeSwing(isAuto: false)
                Haptics.play(.success)
            } label: {
                Text("+1 SWING")
                    .font(SLW.mono(11, weight: .semibold))
                    .tracking(1.4)
                    .foregroundColor(SLW.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 32)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(SLW.ink)
                    )
            }
            .buttonStyle(.plain)

            HStack(spacing: 6) {
                bottomAction(icon: "arrow.uturn.backward", label: "Undo", tint: SLW.ink2) {
                    connectivityManager.undoRangeSwing()
                    Haptics.play(.click)
                }
                bottomAction(icon: "list.bullet", label: "Bag", tint: SLW.ink2) {
                    showBagSheet = true
                }
                bottomAction(
                    icon: motionManager.isDetectionEnabled ? "waveform.circle.fill" : "waveform.circle",
                    label: motionManager.isDetectionEnabled ? "Auto" : "Off",
                    tint: motionManager.isDetectionEnabled ? SLW.accent : SLW.ink3
                ) {
                    toggleAutoDetect()
                }
                bottomAction(icon: "flag.checkered", label: "End", tint: SLW.bad) {
                    showEndSessionAlert = true
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 2)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .slwStatusWash()
    }

    // MARK: - Bag page

    private var bagClubSelection: some View {
        ScrollView {
            VStack(spacing: 4) {
                HStack {
                    Text("BAG")
                        .font(SLW.mono(9, weight: .semibold))
                        .tracking(1.6)
                        .foregroundColor(SLW.ink3)
                    Spacer()
                    Text("Tap club · Done")
                        .font(SLW.mono(9))
                        .foregroundColor(SLW.ink3)
                }
                .padding(.bottom, 2)

                ForEach(ClubWatch.rangeClubs) { club in
                    bagRow(club: club)
                }
            }
            .padding(.horizontal, 6)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func bagRow(club: ClubWatch) -> some View {
        let count = connectivityManager.rangeSession?.counts[club.rawValue] ?? 0
        let isActive = connectivityManager.rangeSession?.activeClub == club

        return Button {
            connectivityManager.setRangeClub(club)
            showBagSheet = false
            activeTab = .hero
            Haptics.play(.click)
        } label: {
            HStack(spacing: 8) {
                Text(club.shortName)
                    .font(SLW.num(16))
                    .foregroundColor(isActive ? SLW.accentInk : SLW.ink)
                    .frame(width: 36, alignment: .leading)
                Spacer()
                if count > 0 {
                    Text("\(count)")
                        .font(SLW.num(14))
                        .foregroundColor(isActive ? SLW.accentInk.opacity(0.85) : SLW.accent)
                }
                if isActive {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(SLW.accentInk)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(isActive ? SLW.ink : SLW.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isActive ? SLW.ink.opacity(0.9) : SLW.line, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Recent page (delete practice swings)

    private var recentPage: some View {
        let swings = (connectivityManager.rangeSession?.swings ?? [])
            .reversed()
            .prefix(12)

        return ScrollView {
            VStack(spacing: 4) {
                HStack {
                    Text("RECENT")
                        .font(SLW.mono(9, weight: .semibold))
                        .tracking(1.6)
                        .foregroundColor(SLW.ink3)
                    Spacer()
                    Text("Tap × to delete")
                        .font(SLW.mono(9))
                        .foregroundColor(SLW.ink3)
                }
                .padding(.bottom, 2)

                if swings.isEmpty {
                    Text("No swings yet — start hitting!")
                        .font(SLW.mono(10))
                        .foregroundColor(SLW.ink3)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                } else {
                    ForEach(Array(swings)) { entry in
                        recentRow(entry)
                    }
                }
            }
            .padding(.horizontal, 6)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Coach page (tempo metronome + consistency bar)

    private var coachPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("COACH")
                        .font(SLW.mono(9, weight: .semibold))
                        .tracking(1.6)
                        .foregroundColor(SLW.accent)
                    Spacer()
                    Text(metronomeOn ? "TICKING" : "OFF")
                        .font(SLW.mono(9))
                        .foregroundColor(metronomeOn ? SLW.accent : SLW.ink3)
                }
                .padding(.horizontal, 4)

                Text("Tempo ladder: two quiet ticks per swing cycle (top + impact), then a long gap — same pacing staff use for pre-shot rehearsal, not a metronome sprint.")
                    .font(SLW.mono(8))
                    .foregroundColor(SLW.ink3)
                    .fixedSize(horizontal: false, vertical: true)

                Toggle(isOn: Binding(
                    get: { settings.showRangeResultHUD },
                    set: { newValue in
                        settings.showRangeResultHUD = newValue
                        connectivityManager.echoWatchToggledSettingsToPhone()
                    }
                )) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Full result after each swing")
                            .font(SLW.mono(9, weight: .semibold))
                            .foregroundColor(SLW.ink)
                        Text("Off = silent capture; everything still saves to iPhone.")
                            .font(SLW.mono(8))
                            .foregroundColor(SLW.ink3)
                    }
                }
                .tint(SLW.accent)

                tempoMetronomeBlock
                consistencyBlock
                pressureBlock
            }
            .padding(.horizontal, 6)
            .padding(.top, 2)
            .padding(.bottom, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var tempoMetronomeBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("TEMPO")
                    .font(SLW.mono(9))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink3)
                Spacer()
                Text(String(format: "%.1fs", tempoSeconds))
                    .font(SLW.num(15))
                    .foregroundColor(SLW.accent)
            }
            // Crown-driven slider for the swing duration.
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(SLW.bg2).frame(height: 6)
                    Rectangle()
                        .fill(SLW.accent)
                        .frame(width: geo.size.width * CGFloat((tempoSeconds - 0.4) / 1.6),
                               height: 6)
                }
            }
            .frame(height: 6)
            .focusable(true)
            .digitalCrownRotation(
                $tempoSeconds,
                from: 0.4, through: 2.0, by: 0.05,
                sensitivity: .medium,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )

            HStack(spacing: 6) {
                Button {
                    metronomeOn ? stopMetronome() : startMetronome()
                } label: {
                    Text(metronomeOn ? "STOP" : "START")
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.6)
                        .foregroundColor(metronomeOn ? SLW.bad : SLW.accentInk)
                        .frame(maxWidth: .infinity, minHeight: 28)
                        .background(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(metronomeOn ? SLW.surface2 : SLW.ink)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(metronomeOn ? SLW.bad : SLW.ink, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(SLW.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(SLW.line, lineWidth: 1)
        )
    }

    private var consistencyBlock: some View {
        let target = 5
        let pct = min(1.0, Double(consistencyStreak) / Double(target))
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("CONSISTENCY")
                    .font(SLW.mono(9))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink3)
                Spacer()
                Text("\(consistencyStreak) · best \(consistencyBest)")
                    .font(SLW.num(13))
                    .foregroundColor(SLW.accent)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(SLW.bg2).frame(height: 6)
                    Rectangle()
                        .fill(consistencyStreak >= target ? SLW.accent : SLW.warn)
                        .frame(width: geo.size.width * CGFloat(pct), height: 6)
                }
            }
            .frame(height: 6)
            Text("In ±5 mph and ±0.2 tempo of your reference")
                .font(SLW.mono(8))
                .foregroundColor(SLW.ink3)
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(SLW.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(SLW.line, lineWidth: 1)
        )
    }

    private var pressureBlock: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("PRESSURE")
                    .font(SLW.mono(9))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink3)
                Spacer()
                if pressureMonitor.isWarning {
                    Text("BREATHE")
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.4)
                        .foregroundColor(SLW.bad)
                } else {
                    Text("calm")
                        .font(SLW.mono(9))
                        .foregroundColor(SLW.ink3)
                }
            }
            Text("One gentle breath cue when HR is high and tempo is rushed — not every swing.")
                .font(SLW.mono(8))
                .foregroundColor(SLW.ink3)
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(SLW.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(SLW.line, lineWidth: 1)
        )
    }

    // MARK: - Metronome plumbing

    private func startMetronome() {
        guard !metronomeOn else { return }
        metronomeOn = true
        scheduleNextCycle()
    }

    private func stopMetronome() {
        metronomeTimer?.invalidate()
        metronomeTimer = nil
        metronomeOn = false
    }

    /// Top-of-backswing tick + impact tick only (no address tap), then a
    /// long quiet gap for waggles, rehearsal swings, or walking off the mat.
    private func scheduleNextCycle() {
        guard metronomeOn else { return }
        let device = WKInterfaceDevice.current()
        let back = max(0.18, tempoSeconds * 0.45)
        let down = max(0.18, tempoSeconds * 0.55)
        DispatchQueue.main.asyncAfter(deadline: .now() + back) {
            if WatchSettings.shared.coachingHaptics { device.play(.click) }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + back + down) {
            if WatchSettings.shared.coachingHaptics { device.play(.directionUp) }
        }
        let restBetweenCycles = 7.0
        let cycle = tempoSeconds + restBetweenCycles
        metronomeTimer = Timer.scheduledTimer(withTimeInterval: cycle, repeats: false) { _ in
            scheduleNextCycle()
        }
    }

    private func recentRow(_ entry: WatchSwingLogEntry) -> some View {
        HStack(spacing: 6) {
            Text(ClubWatch(rawValue: entry.club)?.shortName ?? "—")
                .font(SLW.num(14))
                .foregroundColor(SLW.ink)
                .frame(width: 32, alignment: .leading)

            VStack(alignment: .leading, spacing: 1) {
                Text(relativeTime(entry.timestamp))
                    .font(SLW.mono(9))
                    .foregroundColor(SLW.ink2)
                Text(entry.isAuto ? "AUTO" : "MANUAL")
                    .font(SLW.mono(8))
                    .tracking(1.0)
                    .foregroundColor(entry.isAuto ? SLW.accent : SLW.ink3)
            }

            Spacer()

            Button {
                connectivityManager.removeRangeSwing(id: entry.id)
                Haptics.play(.click)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(SLW.bad)
                    .frame(width: 30, height: 30)
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(SLW.surface2)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(SLW.line, lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(SLW.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(SLW.line, lineWidth: 1)
        )
    }

    private func relativeTime(_ ts: Date) -> String {
        let s = max(0, Int(Date().timeIntervalSince(ts)))
        if s < 60 { return "\(s)s ago" }
        let m = s / 60
        if m < 60 { return "\(m)m ago" }
        let h = m / 60
        return "\(h)h ago"
    }

    private func bottomAction(icon: String, label: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                Text(label)
                    .font(SLW.mono(8))
                    .tracking(1.0)
            }
            .foregroundColor(tint)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Lifecycle

    private func setupMotion() {
        // Capture motion AND a 60s HR window AROUND the impact. The
        // connectivity layer turns this into an EnhancedShotEventWatch
        // and ships it to the phone alongside the lightweight count.
        motionManager.onSwingCaptured = { capture in
            let snapshot = hrManager.snapshot(around: capture.detectedAt)
            connectivityManager.logRangeSwing(
                isAuto: true,
                confidence: capture.detectionConfidence,
                capture: capture,
                hrSnapshot: snapshot
            )
            Haptics.swingRecognized()
            // Visual flash on the hero so the user sees the count tick.
            detectFlash = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                detectFlash = false
            }
            // Real-time coaching hooks (Phase 3).
            applyCoaching(capture: capture)
            // Ask the audio recorder to render a ±1.5 s CAF around
            // impact for this swing id (only when mic capture is on).
            if settings.micImpactConfirm {
                impactAudio.recordClip(
                    swingId: capture.id,
                    impactAt: capture.detectedAt
                )
            }
        }

        // Whenever a swing-audio CAF is ready, ship it to the phone.
        impactAudio.onClipReady = { url in
            // The filename ends in "swing-<UUID>.caf" — extract the id.
            let name = url.deletingPathExtension().lastPathComponent
            if let uuidStr = name.split(separator: "-", maxSplits: 1).last
                .map(String.init),
               let uuid = UUID(uuidString: uuidStr) {
                connectivityManager.sendSwingAudioClip(url: url, swingId: uuid)
            }
        }

        // Hand the audio impact-time hint to the segmenter so a
        // mic-confirmed click can promote the impact timestamp.
        motionManager.impactHintProvider = { [weak impactAudio] in
            impactAudio?.lastImpactAt
        }

        // Push the player's resting HR into the pressure monitor so
        // the elevated-HR threshold is computed against real baseline.
        pressureMonitor.restingBPM = hrManager.restingBPM
        pressureMonitor.hrReserve = max(60.0, 220.0 - 35.0 - hrManager.restingBPM)

        if !motionManager.isDetectionEnabled {
            motionManager.startDetection()
        }
        if !hrManager.isStreaming {
            hrManager.start()
        }
        impactAudio.start(enabled: settings.micImpactConfirm)
        // Cross-cutting battery saver — drops sample rates and stops mic
        // capture when watch battery is below 20%.
        batterySaver.attach(motion: motionManager, hr: hrManager, audio: impactAudio)
    }

    /// Phase 3 coaching pipeline: derive HUD numbers, update baseline,
    /// drive the consistency bar, and ask the PressureMonitor to fire
    /// the box-breathing haptic when the player is rushing under
    /// elevated HR.
    private func applyCoaching(capture: SwingCapture) {
        guard let club = connectivityManager.rangeSession?.activeClub else { return }
        let speeds = WatchSwingAnalytics.speeds(for: capture.motion, club: club)
        let tempo = WatchSwingAnalytics.tempoRatio(for: capture.motion)
        let plane = WatchSwingAnalytics.planeAxis(for: capture.motion)
        let bpm = hrManager.bpm(at: capture.detectedAt)

        // Plane delta vs the player's per-club median (if known).
        let planeDelta: Double? = {
            guard let med = referenceBaseline.median(for: club) else { return nil }
            return WatchSwingAnalytics.angleDegrees(between: plane, and: med.planeAxis)
        }()

        let entry = WatchReferenceBaseline.Entry(
            club: club,
            clubMph: speeds.clubMph,
            tempoRatio: tempo,
            planeAxis: plane
        )

        // Auto-promote high-confidence swings into the reference set so
        // the player has *something* to compare against from swing one.
        if capture.detectionConfidence >= 0.85 {
            referenceBaseline.append(entry)
        }

        // Consistency bar: streak grows on in-window swings, resets otherwise.
        if referenceBaseline.isOnBaseline(entry) {
            consistencyStreak += 1
            consistencyBest = max(consistencyBest, consistencyStreak)
        } else {
            consistencyStreak = 0
        }

        // Pressure check (rushed tempo + elevated HR → calm-down).
        if let r = tempo {
            let warn = pressureMonitor.ingest(tempoRatio: r, hrAtImpact: bpm)
            if warn { firePressureWarning() }
            lastSwingTempo = r
            recentTempoRatios.append(r)
            if recentTempoRatios.count > 8 {
                recentTempoRatios.removeFirst(recentTempoRatios.count - 8)
            }
        }

        lastCapturedClub = club
        // Estimated carry from the per-club calibration model, when one
        // has been pushed from the phone.
        let model = connectivityManager.clubModels[club.rawValue]
        let estCarry = model?.predictCarry(handMph: speeds.handMph)
        let estSigma = model?.sigma
        let band = WatchClubBand.band(for: club)
        let resting = max(40.0, hrManager.restingBPM)
        let maxBpm = max(120.0, 220.0 - 35.0)
        let hrFrac: Double? = bpm > 0
            ? max(0, min(1, (bpm - resting) / max(1, maxBpm - resting)))
            : nil

        let summary = WatchSwingSummary(
            club: club.shortName,
            clubMph: speeds.clubMph,
            handMph: speeds.handMph,
            tempoRatio: tempo,
            planeDeltaDeg: planeDelta,
            bpmAtImpact: bpm,
            estCarryYards: estCarry,
            estCarrySigma: estSigma,
            clubBand: band,
            hrFraction: hrFrac
        )
        // Optional HUD — default off so range sessions stay quiet on wrist.
        if WatchSettings.shared.showRangeResultHUD {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.80) {
                hudSummary = summary
            }
        }
    }

    /// Box-breathing haptic — slow rhythmic notification pattern that
    /// nudges the player to slow their breath before the next setup.
    private func firePressureWarning() {
        guard !pressureMonitor.isWarning else { return }
        pressureMonitor.beginWarning()
        // 4 in / 4 hold / 4 out, three cycles. Each unit = 0.5 s here
        // to keep the whole sequence under 18 s and not interrupt play.
        let cycles = 1
        let unit = 0.75
        var t: TimeInterval = 0
        for _ in 0..<cycles {
            DispatchQueue.main.asyncAfter(deadline: .now() + t) {
                Haptics.pressureWarning(.start)
            }
            t += unit * 4   // breath in
            DispatchQueue.main.asyncAfter(deadline: .now() + t) {
                Haptics.pressureWarning(.click)
            }
            t += unit * 4   // hold
            DispatchQueue.main.asyncAfter(deadline: .now() + t) {
                Haptics.pressureWarning(.stop)
            }
            t += unit * 4   // breath out
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + t) {
            pressureMonitor.endWarning()
        }
    }

    /// Promote the most recent swing into the reference baseline. Used
    /// by the post-swing HUD's "MARK GOOD" button (and the Series 9+
    /// Double Tap shortcut wired on the same button).
    private func promoteLastSwingToReference() {
        guard let club = lastCapturedClub,
              let summary = hudSummary
        else { return }
        // We already constructed an Entry inside applyCoaching but we
        // didn't necessarily append it (auto-promotion threshold). Build
        // one from the HUD summary as a backup so MARK GOOD always lands.
        let entry = WatchReferenceBaseline.Entry(
            club: club,
            clubMph: summary.clubMph,
            tempoRatio: summary.tempoRatio,
            planeAxis: SIMD3<Double>(1, 0, 0)
        )
        referenceBaseline.append(entry)
        Haptics.coaching(.success)
    }

    private func toggleAutoDetect() {
        if motionManager.isDetectionEnabled {
            motionManager.stopDetection()
            Haptics.play(.click)
        } else {
            motionManager.startDetection()
            Haptics.play(.start)
        }
    }

    private func endSession() {
        connectivityManager.endRangeSession()
        motionManager.stopDetection()
        hrManager.stop()
        impactAudio.stop()
        batterySaver.detach()
        workoutManager.endWorkout()
        Haptics.play(.stop)
        dismiss()
    }
}

#Preview {
    RangeSessionView()
        .environmentObject(WatchConnectivityManagerWatch())
        .environmentObject(MotionManager())
        .environmentObject(WorkoutManager())
        .environmentObject(HighFrequencyHRManager())
        .environmentObject(ImpactAudioManager())
        .environmentObject(PressureMonitor())
        .environmentObject(WatchReferenceBaseline())
        .environmentObject(BatterySaver())
}
