//
//  PressureMonitor.swift
//  StrikeLabCaddieWatch Watch App
//
//  Watches the live HR ring buffer and the rolling tempo of recent
//  swings; when both indicate the player is stressed and rushing, fires
//  a calm-down haptic before the next setup. Phase 3 lights this up;
//  Phase 1 just stubs the type so the app entry compiles cleanly.
//

import Foundation
import Combine

@MainActor
final class PressureMonitor: ObservableObject {

    /// True while a calm-down haptic sequence is currently playing.
    @Published private(set) var isWarning = false

    /// Most recent set of "swing tempo ratio" samples used by the
    /// rushed-tempo detector. Pushed in by the consumer of swings.
    private var recentTempoRatios: [Double] = []
    private let maxRecentTempos = 6

    /// Player's 30-day baseline tempo ratio (typically ~3.0). Defaults
    /// to 3.0 when no data is available yet.
    var baselineTempoRatio: Double = 3.0

    /// Player's HR reserve (max - rest). Used by `hrFraction(_:)`.
    var hrReserve: Double = 130

    /// Player's resting HR baseline.
    var restingBPM: Double = 60

    /// Push a new swing's tempo ratio after each detection. Returns
    /// `true` when the rushed-tempo + elevated-HR pattern is detected.
    @discardableResult
    func ingest(tempoRatio: Double, hrAtImpact: Double) -> Bool {
        recentTempoRatios.append(tempoRatio)
        if recentTempoRatios.count > maxRecentTempos {
            recentTempoRatios.removeFirst()
        }
        return shouldWarn(hrAtImpact: hrAtImpact)
    }

    /// Pure decision function — exposed for unit testing.
    func shouldWarn(hrAtImpact: Double) -> Bool {
        let last3 = Array(recentTempoRatios.suffix(3))
        guard last3.count == 3 else { return false }
        let avg = last3.reduce(0, +) / Double(last3.count)
        // Tempo ratio dropping = rushed transition.
        let rushed = avg < baselineTempoRatio * 0.90
        let hrFrac = hrFraction(hrAtImpact)
        let elevated = hrFrac >= 0.85
        return rushed && elevated
    }

    /// Fraction of HR reserve used. 0 = at rest, 1 = at theoretical max.
    func hrFraction(_ bpm: Double) -> Double {
        guard hrReserve > 0 else { return 0 }
        return max(0, min(1, (bpm - restingBPM) / hrReserve))
    }

    /// Lifecycle stub — Phase 3 wires the actual breathing-haptic loop
    /// in here.
    func beginWarning() {
        isWarning = true
    }

    func endWarning() {
        isWarning = false
    }
}
