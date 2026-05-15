//
//  UnitsManager.swift
//  StrikeLabCaddie
//
//  Global preference for the distance unit (yards vs metres).
//
//  Internal storage is canonical YARDS. Display is formatted via this
//  manager. Toggling never mutates stored data — every screen recomputes
//  on the @Published `system` change.
//

import Foundation
import Combine

/// Distance measurement system used everywhere user-facing distances appear.
enum MeasurementSystem: String, Codable, CaseIterable, Identifiable {
    case yards
    case meters

    var id: String { rawValue }

    /// Long label for settings UI.
    var displayName: String {
        switch self {
        case .yards: return "Yards"
        case .meters: return "Metres"
        }
    }

    /// Short label paired with numbers in compact UI ("245 yds", "224 m").
    var shortLabel: String {
        switch self {
        case .yards: return "yds"
        case .meters: return "m"
        }
    }

    /// All-caps short label for mono microcopy ("245 YDS · TO PIN").
    var capsLabel: String {
        switch self {
        case .yards: return "YDS"
        case .meters: return "M"
        }
    }
}

/// Single source of truth for the user's preferred distance unit.
///
/// Defaults to METRES outside the US/UK on first launch (Norway →
/// metres), can be toggled at any time from Profile, persists in
/// `UserDefaults`, and broadcasts changes via `@Published`.
@MainActor
final class UnitsManager: ObservableObject {

    static let shared = UnitsManager()

    @Published var system: MeasurementSystem {
        didSet {
            guard oldValue != system else { return }
            UserDefaults.standard.set(system.rawValue, forKey: Self.defaultsKey)
        }
    }

    private static let defaultsKey = "strikelab.units.system.v1"

    private init() {
        if let raw = UserDefaults.standard.string(forKey: Self.defaultsKey),
           let stored = MeasurementSystem(rawValue: raw) {
            self.system = stored
        } else {
            // Best-effort locale default. Yards stays the default for US, GB,
            // CA, AU; everywhere else (Norway included) we default to metres.
            let yardLocales: Set<String> = ["US", "GB", "CA", "AU"]
            let region = Locale.current.region?.identifier ?? ""
            self.system = yardLocales.contains(region) ? .yards : .meters
        }
    }

    // MARK: - Conversion

    /// Convert internal yards to metres (1 yd = 0.9144 m).
    static func metres(fromYards yards: Double) -> Double {
        yards * 0.9144
    }

    /// Convert metres to yards (1 m = 1.0936133 yd).
    static func yards(fromMetres metres: Double) -> Double {
        metres * 1.0936133
    }

    /// Convert a yards value to whichever unit the user currently prefers.
    func displayValue(yards: Double) -> Double {
        switch system {
        case .yards: return yards
        case .meters: return Self.metres(fromYards: yards)
        }
    }

    /// Convert a user-entered value in the current display unit back to
    /// canonical yards for storage and calculations.
    func yards(fromDisplayValue value: Double) -> Double {
        switch system {
        case .yards: return value
        case .meters: return Self.yards(fromMetres: value)
        }
    }

    // MARK: - Formatting

    /// "245 yds" / "224 m" — full short label, lowercase.
    func format(yards: Double, includesUnit: Bool = true) -> String {
        let display = Int(displayValue(yards: yards).rounded())
        guard includesUnit else { return "\(display)" }
        return "\(display) \(system.shortLabel)"
    }

    /// "245 YDS" / "224 M" — for tracking-letterspaced microcopy.
    func formatCaps(yards: Double, includesUnit: Bool = true) -> String {
        let display = Int(displayValue(yards: yards).rounded())
        guard includesUnit else { return "\(display)" }
        return "\(display) \(system.capsLabel)"
    }

    /// "F · 132 yds   B · 158 yds" style for compact F/C/B rows.
    func format(yards: Double, decimals: Int) -> String {
        let display = displayValue(yards: yards)
        let formatted = String(format: "%.\(decimals)f", display)
        return "\(formatted) \(system.shortLabel)"
    }

    /// Just the short label (used as a suffix beside an externally-rendered
    /// number, e.g. when the number font and unit font differ).
    var unitLabel: String { system.shortLabel }
    var unitCapsLabel: String { system.capsLabel }
}
