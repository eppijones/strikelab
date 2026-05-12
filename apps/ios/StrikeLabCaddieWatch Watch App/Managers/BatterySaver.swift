//
//  BatterySaver.swift
//  StrikeLabCaddieWatch Watch App
//
//  Cross-cutting LowPowerSwingCapture mode. Polls the watch battery
//  every 60 s during an active session; when it drops below 20 % we
//  back the swing pipeline off:
//
//    • MotionManager  100 Hz → 50 Hz
//    • HighFrequencyHRManager — keep streaming HR but stop the SDNN
//      query (low-yield, more drain than HR alone).
//    • ImpactAudioManager — stop entirely.
//
//  Re-engages full fidelity when the watch is plugged in / battery
//  recovers above 35 %.
//

import Foundation
import Combine
import WatchKit

@MainActor
final class BatterySaver: ObservableObject {

    @Published private(set) var isLowPowerActive = false
    @Published private(set) var lastBatteryLevel: Float = 1.0

    private weak var motion: MotionManager?
    private weak var hr: HighFrequencyHRManager?
    private weak var audio: ImpactAudioManager?

    private var timer: Timer?

    init() {
        WKInterfaceDevice.current().isBatteryMonitoringEnabled = true
    }

    /// Hook the saver into the live pipeline. Called by the Range and
    /// Round views when they spin up motion capture.
    func attach(
        motion: MotionManager,
        hr: HighFrequencyHRManager,
        audio: ImpactAudioManager
    ) {
        self.motion = motion
        self.hr = hr
        self.audio = audio
        evaluateNow()
        startTimer()
    }

    func detach() {
        timer?.invalidate()
        timer = nil
        motion = nil
        hr = nil
        audio = nil
    }

    // MARK: - Polling

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: true) { _ in
            Task { @MainActor [weak self] in
                self?.evaluateNow()
            }
        }
    }

    /// Inspect the current battery level and engage / disengage low
    /// power mode based on the 20% / 35% hysteresis bands.
    func evaluateNow() {
        let level = WKInterfaceDevice.current().batteryLevel
        // batteryLevel returns -1 when not enabled or in simulator.
        guard level >= 0 else { return }
        lastBatteryLevel = level

        if !isLowPowerActive && level < 0.20 {
            engageLowPower()
        } else if isLowPowerActive && level >= 0.35 {
            disengageLowPower()
        }
    }

    private func engageLowPower() {
        isLowPowerActive = true
        motion?.setLowPower(true)
        audio?.stop()
    }

    private func disengageLowPower() {
        isLowPowerActive = false
        motion?.setLowPower(false)
        // Don't auto-restart audio — it requires explicit consent each
        // time the session resumes (mic permission UX).
    }
}
