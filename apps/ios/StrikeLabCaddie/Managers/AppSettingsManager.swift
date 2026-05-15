//
//  AppSettingsManager.swift
//  StrikeLabCaddie
//
//  iPhone-side preferences. The toggles here mirror the watch's
//  `WatchSettings`; whenever any value flips, the App entry pushes the
//  full bundle to the watch via WCSession application context so both
//  surfaces always agree.
//

import Foundation
import Combine

@MainActor
final class AppSettingsManager: ObservableObject {

    static let shared = AppSettingsManager()

    /// Whether the Apple Watch is allowed to play haptics. Defaults ON.
    @Published var watchHapticsEnabled: Bool {
        didSet { defaults.set(watchHapticsEnabled, forKey: Self.hapticsKey) }
    }

    /// Capture full swing motion (samples + quaternions). Defaults ON.
    @Published var fullMotionCapture: Bool {
        didSet { defaults.set(fullMotionCapture, forKey: Self.fullMotionKey) }
    }

    /// Mic-confirmed impact (needs mic permission). Defaults OFF for App Store
    /// review safety; the user explicitly opts in from Profile.
    @Published var micImpactConfirm: Bool {
        didSet { defaults.set(micImpactConfirm, forKey: Self.micImpactKey) }
    }

    /// Full post-swing HUD on the watch during range (verbose). Defaults OFF;
    /// all swings still sync to iPhone for review.
    @Published var showRangeResultHUD: Bool {
        didSet { defaults.set(showRangeResultHUD, forKey: Self.rangeHudKey) }
    }

    /// Real-time coaching haptics (post-swing HUD pulse, tempo
    /// metronome, pressure breathing). Defaults ON.
    @Published var coachingHaptics: Bool {
        didSet { defaults.set(coachingHaptics, forKey: Self.coachingKey) }
    }

    /// Pressure warnings (calm-down haptic). Defaults ON.
    @Published var pressureWarnings: Bool {
        didSet { defaults.set(pressureWarnings, forKey: Self.pressureKey) }
    }

    /// Show live heart rate on the Apple Watch round screen. Defaults ON
    /// for players who want pressure awareness, but can be hidden entirely.
    @Published var showHeartRateOnWatch: Bool {
        didSet { defaults.set(showHeartRateOnWatch, forKey: Self.showHeartRateKey) }
    }

    /// Anonymous swing-data sharing for server-side calibration
    /// learning. Defaults OFF (GDPR-clean).
    @Published var anonymousDataSharing: Bool {
        didSet { defaults.set(anonymousDataSharing, forKey: Self.shareKey) }
    }

    /// Lets the on-course app run fully local when the development API is not reachable.
    @Published var localModeEnabled: Bool {
        didSet { defaults.set(localModeEnabled, forKey: Self.localModeKey) }
    }

    private let defaults = UserDefaults.standard

    private static let hapticsKey    = "strikelab.watchHaptics.enabled.v1"
    private static let fullMotionKey = "strikelab.motion.fullCapture.v1"
    private static let micImpactKey  = "strikelab.audio.micImpact.v1"
    private static let rangeHudKey   = "strikelab.range.resultHUD.v1"
    private static let coachingKey   = "strikelab.coaching.haptics.v1"
    private static let pressureKey   = "strikelab.pressure.warnings.v1"
    private static let showHeartRateKey = "strikelab.watch.showHeartRate.v1"
    private static let shareKey      = "strikelab.share.anonymous.v1"
    private static let legacyApiBaseKey = "strikelab.api.baseURL.v1"
    private static let legacyApiTokenKey = "strikelab.api.accessToken.v1"
    fileprivate static let localModeKey = "strikelab.localMode.enabled.v1"

    private init() {
        Self.clearLegacyDeveloperOverrides(defaults: defaults)
        watchHapticsEnabled  = Self.read(defaults: .standard, key: Self.hapticsKey,    fallback: true)
        fullMotionCapture    = Self.read(defaults: .standard, key: Self.fullMotionKey, fallback: true)
        micImpactConfirm     = Self.read(defaults: .standard, key: Self.micImpactKey,  fallback: false)
        showRangeResultHUD   = Self.read(defaults: .standard, key: Self.rangeHudKey,    fallback: false)
        coachingHaptics      = Self.read(defaults: .standard, key: Self.coachingKey,   fallback: true)
        pressureWarnings     = Self.read(defaults: .standard, key: Self.pressureKey,   fallback: true)
        showHeartRateOnWatch = Self.read(defaults: .standard, key: Self.showHeartRateKey, fallback: true)
        anonymousDataSharing = Self.read(defaults: .standard, key: Self.shareKey,      fallback: false)
        if ReleasePolicy.allowsLocalMode {
            localModeEnabled = Self.read(defaults: .standard, key: Self.localModeKey, fallback: false)
        } else {
            localModeEnabled = false
            defaults.set(false, forKey: Self.localModeKey)
        }
    }

    private static func clearLegacyDeveloperOverrides(defaults: UserDefaults) {
        defaults.removeObject(forKey: legacyApiBaseKey)
        defaults.removeObject(forKey: legacyApiTokenKey)
    }

    private static func read(defaults: UserDefaults, key: String, fallback: Bool) -> Bool {
        if defaults.object(forKey: key) == nil { return fallback }
        return defaults.bool(forKey: key)
    }
}
