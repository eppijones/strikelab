import Foundation

/// Centralizes App Store submission behavior so debug-only workflows never leak
/// into the Release binary.
enum ReleasePolicy {
    #if DEBUG
    static let allowsDeveloperControls = false
    static let allowsDemoReset = true
    static let allowsLocalMode = false
    #else
    static let allowsDeveloperControls = false
    static let allowsDemoReset = false
    static let allowsLocalMode = false
    #endif

    static let privacyURL = URL(string: "https://strikelab.golf/privacy")!
    static let termsURL = URL(string: "https://strikelab.golf/terms")!
    static let supportURL = URL(string: "https://strikelab.golf/support")!
    static let supportEmail = "hello@strikelab.golf"
}
