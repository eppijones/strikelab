//
//  WatchSettings.swift
//  StrikeLabCaddieWatch Watch App
//
//  Tiny settings store on the watch. Per-toggle UserDefaults keys; the
//  iPhone pushes equivalent values via WCSession application context so
//  changes made in the iOS Settings screen propagate immediately. The
//  Haptics helper, MotionManager, ImpactAudioManager and PressureMonitor
//  all read these flags before doing anything user-visible.
//

import Foundation
import Combine
import WatchKit

@MainActor
final class WatchSettings: ObservableObject {

    static let shared = WatchSettings()

    /// Haptic feedback on/off — defaults ON.
    @Published var hapticsEnabled: Bool {
        didSet { defaults.set(hapticsEnabled, forKey: Self.hapticsKey) }
    }

    /// Capture full swing motion (samples + quaternions) — defaults ON.
    /// When OFF the watch still detects swings but ships only the
    /// lightweight summary (counts, timestamp, club).
    @Published var fullMotionCapture: Bool {
        didSet { defaults.set(fullMotionCapture, forKey: Self.fullMotionKey) }
    }

    /// Mic-confirmed impact — defaults OFF; user opts in from iOS Profile or
    /// watch range settings before any microphone capture starts.
    @Published var micImpactConfirm: Bool {
        didSet { defaults.set(micImpactConfirm, forKey: Self.micImpactKey) }
    }

    /// Full-screen tempo result after each range swing — defaults OFF so
    /// sessions stay quiet; data still syncs to iPhone for review.
    @Published var showRangeResultHUD: Bool {
        didSet { defaults.set(showRangeResultHUD, forKey: Self.rangeHudKey) }
    }

    /// Real-time coaching haptics (post-swing HUD pulse, tempo metronome,
    /// pressure breathing pattern) — defaults ON.
    @Published var coachingHaptics: Bool {
        didSet { defaults.set(coachingHaptics, forKey: Self.coachingKey) }
    }

    /// Pressure warnings (calm-down haptic when HR + tempo deteriorate) —
    /// defaults ON.
    @Published var pressureWarnings: Bool {
        didSet { defaults.set(pressureWarnings, forKey: Self.pressureKey) }
    }

    /// Show live heart rate on the round scoring screen — defaults ON.
    @Published var showHeartRateOnWatch: Bool {
        didSet { defaults.set(showHeartRateOnWatch, forKey: Self.showHeartRateKey) }
    }

    /// Anonymous swing-data sharing for server-side calibration learning —
    /// defaults OFF (GDPR-clean).
    @Published var anonymousDataSharing: Bool {
        didSet { defaults.set(anonymousDataSharing, forKey: Self.shareKey) }
    }

    private let defaults = UserDefaults.standard

    // Keys.
    private static let hapticsKey      = "strikelab.haptics.enabled.v1"
    private static let fullMotionKey   = "strikelab.motion.fullCapture.v1"
    private static let micImpactKey    = "strikelab.audio.micImpact.v1"
    private static let rangeHudKey     = "strikelab.range.resultHUD.v1"
    private static let coachingKey     = "strikelab.coaching.haptics.v1"
    private static let pressureKey     = "strikelab.pressure.warnings.v1"
    private static let showHeartRateKey = "strikelab.watch.showHeartRate.v1"
    private static let shareKey        = "strikelab.share.anonymous.v1"

    private init() {
        hapticsEnabled       = Self.read(defaults: .standard, key: Self.hapticsKey,    fallback: true)
        fullMotionCapture    = Self.read(defaults: .standard, key: Self.fullMotionKey, fallback: true)
        micImpactConfirm     = Self.read(defaults: .standard, key: Self.micImpactKey,  fallback: false)
        showRangeResultHUD   = Self.read(defaults: .standard, key: Self.rangeHudKey,    fallback: false)
        coachingHaptics      = Self.read(defaults: .standard, key: Self.coachingKey,   fallback: true)
        pressureWarnings     = Self.read(defaults: .standard, key: Self.pressureKey,   fallback: true)
        showHeartRateOnWatch = Self.read(defaults: .standard, key: Self.showHeartRateKey, fallback: true)
        anonymousDataSharing = Self.read(defaults: .standard, key: Self.shareKey,      fallback: false)
    }

    private static func read(defaults: UserDefaults, key: String, fallback: Bool) -> Bool {
        if defaults.object(forKey: key) == nil { return fallback }
        return defaults.bool(forKey: key)
    }

    /// Apply a value pushed from the iPhone (via WCSession context).
    func applyHapticsEnabled(_ enabled: Bool) {
        if hapticsEnabled != enabled { hapticsEnabled = enabled }
    }

    func applyFullMotionCapture(_ enabled: Bool) {
        if fullMotionCapture != enabled { fullMotionCapture = enabled }
    }

    func applyMicImpactConfirm(_ enabled: Bool) {
        if micImpactConfirm != enabled { micImpactConfirm = enabled }
    }

    func applyShowRangeResultHUD(_ enabled: Bool) {
        if showRangeResultHUD != enabled { showRangeResultHUD = enabled }
    }

    func applyCoachingHaptics(_ enabled: Bool) {
        if coachingHaptics != enabled { coachingHaptics = enabled }
    }

    func applyPressureWarnings(_ enabled: Bool) {
        if pressureWarnings != enabled { pressureWarnings = enabled }
    }

    func applyShowHeartRateOnWatch(_ enabled: Bool) {
        if showHeartRateOnWatch != enabled { showHeartRateOnWatch = enabled }
    }

    func applyAnonymousDataSharing(_ enabled: Bool) {
        if anonymousDataSharing != enabled { anonymousDataSharing = enabled }
    }
}

// MARK: - Haptics router

/// Single entry point for all watch haptics. Honours the user's
/// haptics-enabled preference. ALWAYS use this instead of
/// `WKInterfaceDevice.current().play(...)` directly.
enum Haptics {

    static func play(_ kind: WKHapticType) {
        guard WatchSettings.shared.hapticsEnabled else { return }
        WKInterfaceDevice.current().play(kind)
    }

    /// Two-stage flourish for celebratory moments (eagle, hole-in-one).
    static func celebrate() {
        guard WatchSettings.shared.hapticsEnabled else { return }
        let device = WKInterfaceDevice.current()
        device.play(.success)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            device.play(.notification)
        }
    }

    /// Distinct "swing recognized" pulse — strong enough to feel through
    /// a glove but short so it doesn't intrude on the next swing.
    static func swingRecognized() {
        guard WatchSettings.shared.hapticsEnabled else { return }
        WKInterfaceDevice.current().play(.notification)
    }

    /// Coaching-only haptic — gated by both the global haptics toggle
    /// and the coaching-haptics toggle. Used by the post-swing HUD pulse,
    /// the tempo metronome and the pressure breathing pattern.
    static func coaching(_ kind: WKHapticType) {
        guard WatchSettings.shared.hapticsEnabled,
              WatchSettings.shared.coachingHaptics
        else { return }
        WKInterfaceDevice.current().play(kind)
    }

    /// Pressure-warning specific (subject to its own toggle too).
    static func pressureWarning(_ kind: WKHapticType) {
        guard WatchSettings.shared.hapticsEnabled,
              WatchSettings.shared.coachingHaptics,
              WatchSettings.shared.pressureWarnings
        else { return }
        WKInterfaceDevice.current().play(kind)
    }
}
