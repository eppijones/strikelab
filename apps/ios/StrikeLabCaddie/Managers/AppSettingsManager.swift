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

    /// Mic-confirmed impact (needs mic permission). Defaults ON so impact
    /// audio and timing are captured without an extra toggle hunt.
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

    /// Anonymous swing-data sharing for server-side calibration
    /// learning. Defaults OFF (GDPR-clean).
    @Published var anonymousDataSharing: Bool {
        didSet { defaults.set(anonymousDataSharing, forKey: Self.shareKey) }
    }

    /// StrikeLab API base URL for range sync + Tee. Normal users use the
    /// bundled production URL; this is kept for developer-only local testing.
    @Published var strikeLabApiBaseURL: String {
        didSet { defaults.set(strikeLabApiBaseURL, forKey: Self.apiBaseKey) }
    }

    /// Legacy dev-only bearer token. Clerk login/Keychain tokens take precedence.
    @Published var strikeLabAccessToken: String {
        didSet { defaults.set(strikeLabAccessToken, forKey: Self.apiTokenKey) }
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
    private static let shareKey      = "strikelab.share.anonymous.v1"
    fileprivate static let apiBaseKey = "strikelab.api.baseURL.v1"
    fileprivate static let apiTokenKey = "strikelab.api.accessToken.v1"
    fileprivate static let localModeKey = "strikelab.localMode.enabled.v1"

    private init() {
        watchHapticsEnabled  = Self.read(defaults: .standard, key: Self.hapticsKey,    fallback: true)
        fullMotionCapture    = Self.read(defaults: .standard, key: Self.fullMotionKey, fallback: true)
        micImpactConfirm     = Self.read(defaults: .standard, key: Self.micImpactKey,  fallback: true)
        showRangeResultHUD   = Self.read(defaults: .standard, key: Self.rangeHudKey,    fallback: false)
        coachingHaptics      = Self.read(defaults: .standard, key: Self.coachingKey,   fallback: true)
        pressureWarnings     = Self.read(defaults: .standard, key: Self.pressureKey,   fallback: true)
        anonymousDataSharing = Self.read(defaults: .standard, key: Self.shareKey,      fallback: false)
        strikeLabApiBaseURL = defaults.string(forKey: Self.apiBaseKey) ?? ""
        strikeLabAccessToken = defaults.string(forKey: Self.apiTokenKey) ?? ""
        localModeEnabled = Self.read(defaults: .standard, key: Self.localModeKey, fallback: false)
    }

    private static func read(defaults: UserDefaults, key: String, fallback: Bool) -> Bool {
        if defaults.object(forKey: key) == nil { return fallback }
        return defaults.bool(forKey: key)
    }
}
