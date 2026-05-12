//
//  HighFrequencyHRManager.swift
//  StrikeLabCaddieWatch Watch App
//
//  60 s ring buffer of heart-rate samples and the most recent SDNN HRV
//  reading. Built on `HKAnchoredObjectQuery` against `.heartRate` so we
//  receive every HR sample HealthKit publishes during an active workout
//  (typically every 1-3 s on Series 9 / Ultra 2). The class is intentionally
//  named `HighFrequencyHRManager` even though watchOS does not expose a
//  hardware-level 10 Hz HR API publicly — this is the highest-frequency
//  stream available and our consumers (Swing Card, PressureMonitor) treat
//  it as such.
//
//  Exposes `snapshot(around: Date) -> HRSnapshotWatch` so the connectivity
//  layer can attach a 60 s HR window (with median pre/post and SDNN) to
//  every captured swing.
//

import Foundation
import HealthKit
import Combine

@MainActor
final class HighFrequencyHRManager: ObservableObject {

    // MARK: - Published state

    /// Most recent BPM seen — live binding for UI.
    @Published private(set) var liveBPM: Double = 0
    @Published private(set) var isStreaming = false
    @Published private(set) var errorMessage: String?

    /// Most recent SDNN HRV reading (ms) from `.heartRateVariabilitySDNN`.
    /// HealthKit aggregates these so they arrive roughly hourly during
    /// rest, more often during workouts.
    @Published private(set) var latestSDNN: Double?

    /// Resting HR baseline used for pressure index. Pulled from the
    /// daily-resting HR stream when available; defaults to 60 BPM.
    @Published private(set) var restingBPM: Double = 60

    // MARK: - Buffers

    private var hrRing: [(t: Date, bpm: Double)] = []
    private let retention: TimeInterval = 60.0

    private var rrRing: [(t: Date, rrMs: Double)] = []

    // MARK: - Internals

    private let healthStore = HKHealthStore()
    private var hrQuery: HKAnchoredObjectQuery?
    private var rrQuery: HKAnchoredObjectQuery?
    private var restingQuery: HKAnchoredObjectQuery?

    // MARK: - Lifecycle

    /// Begin streaming. Authorization is assumed to already be granted by
    /// `WorkoutManager` (we share the same HK auth set).
    func start() {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit unavailable"
            return
        }
        guard !isStreaming else { return }
        startHRQuery()
        startRRQuery()
        startRestingQuery()
        isStreaming = true
    }

    func stop() {
        if let q = hrQuery { healthStore.stop(q); hrQuery = nil }
        if let q = rrQuery { healthStore.stop(q); rrQuery = nil }
        if let q = restingQuery { healthStore.stop(q); restingQuery = nil }
        isStreaming = false
    }

    // MARK: - Snapshot API

    /// Snapshot of the HR window centred on `time` ± 30 s. Samples are
    /// timestamped relative to `time` (negative = before impact). The
    /// snapshot also carries any RR intervals delivered in that window
    /// so consumers can compute their own SDNN if they want.
    func snapshot(around time: Date) -> HRSnapshotWatch {
        let lo = time.addingTimeInterval(-30)
        let hi = time.addingTimeInterval(30)
        let inWindow = hrRing.filter { $0.t >= lo && $0.t <= hi }
        let samples = inWindow.map { tup in
            HRSampleWatch(
                tMs: tup.t.timeIntervalSince(time) * 1000.0,
                bpm: tup.bpm
            )
        }
        let rrInWindow = rrRing
            .filter { $0.t >= lo && $0.t <= hi }
            .map(\.rrMs)
        return HRSnapshotWatch(
            samples: samples,
            rrIntervals: rrInWindow,
            isHighFrequency: false
        )
    }

    /// HR at a specific instant — closest sample in the ring.
    func bpm(at time: Date) -> Double {
        guard !hrRing.isEmpty else { return 0 }
        var best = hrRing[0]
        var bestDelta = abs(time.timeIntervalSince(hrRing[0].t))
        for s in hrRing.dropFirst() {
            let d = abs(time.timeIntervalSince(s.t))
            if d < bestDelta {
                best = s
                bestDelta = d
            }
        }
        return best.bpm
    }

    /// Median over the previous `seconds` of HR data.
    func median(in seconds: TimeInterval, before time: Date) -> Double? {
        let lo = time.addingTimeInterval(-seconds)
        let arr = hrRing
            .filter { $0.t >= lo && $0.t <= time }
            .map(\.bpm)
            .sorted()
        guard !arr.isEmpty else { return nil }
        let mid = arr.count / 2
        if arr.count.isMultiple(of: 2) {
            return (arr[mid - 1] + arr[mid]) / 2.0
        }
        return arr[mid]
    }

    /// Median over the next `seconds` of HR data.
    func median(in seconds: TimeInterval, after time: Date) -> Double? {
        let hi = time.addingTimeInterval(seconds)
        let arr = hrRing
            .filter { $0.t >= time && $0.t <= hi }
            .map(\.bpm)
            .sorted()
        guard !arr.isEmpty else { return nil }
        let mid = arr.count / 2
        if arr.count.isMultiple(of: 2) {
            return (arr[mid - 1] + arr[mid]) / 2.0
        }
        return arr[mid]
    }

    // MARK: - HR query

    private func startHRQuery() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        let unit = HKUnit.count().unitDivided(by: .minute())

        let q = HKAnchoredObjectQuery(
            type: type,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, _, _ in
            Task { @MainActor [weak self] in
                self?.handleHR(samples: samples, unit: unit)
            }
        }
        q.updateHandler = { [weak self] _, samples, _, _, _ in
            Task { @MainActor [weak self] in
                self?.handleHR(samples: samples, unit: unit)
            }
        }
        healthStore.execute(q)
        hrQuery = q
    }

    private func handleHR(samples: [HKSample]?, unit: HKUnit) {
        guard let samples = samples as? [HKQuantitySample], !samples.isEmpty else { return }
        for s in samples {
            let bpm = s.quantity.doubleValue(for: unit)
            hrRing.append((t: s.endDate, bpm: bpm))
            liveBPM = bpm
        }
        evictOld()
    }

    // MARK: - HRV (SDNN) query

    private func startRRQuery() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            return
        }
        let unit = HKUnit.secondUnit(with: .milli)

        let q = HKAnchoredObjectQuery(
            type: type,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, _, _ in
            Task { @MainActor [weak self] in
                self?.handleSDNN(samples: samples, unit: unit)
            }
        }
        q.updateHandler = { [weak self] _, samples, _, _, _ in
            Task { @MainActor [weak self] in
                self?.handleSDNN(samples: samples, unit: unit)
            }
        }
        healthStore.execute(q)
        rrQuery = q
    }

    private func handleSDNN(samples: [HKSample]?, unit: HKUnit) {
        guard let samples = samples as? [HKQuantitySample], !samples.isEmpty else { return }
        for s in samples {
            let ms = s.quantity.doubleValue(for: unit)
            // Keep the SDNN value as a representative "RR proxy" in the
            // rrRing so snapshot() picks it up if the impact falls
            // inside the same window.
            rrRing.append((t: s.endDate, rrMs: ms))
            latestSDNN = ms
        }
        evictOld()
    }

    // MARK: - Resting HR baseline

    private func startRestingQuery() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else {
            return
        }
        let unit = HKUnit.count().unitDivided(by: .minute())

        let q = HKAnchoredObjectQuery(
            type: type,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, _, _ in
            Task { @MainActor [weak self] in
                self?.handleResting(samples: samples, unit: unit)
            }
        }
        q.updateHandler = { [weak self] _, samples, _, _, _ in
            Task { @MainActor [weak self] in
                self?.handleResting(samples: samples, unit: unit)
            }
        }
        healthStore.execute(q)
        restingQuery = q
    }

    private func handleResting(samples: [HKSample]?, unit: HKUnit) {
        guard let samples = samples as? [HKQuantitySample],
              let latest = samples.max(by: { $0.endDate < $1.endDate })
        else { return }
        restingBPM = latest.quantity.doubleValue(for: unit)
    }

    // MARK: - Eviction

    private func evictOld() {
        let now = Date()
        hrRing.removeAll { now.timeIntervalSince($0.t) > retention }
        rrRing.removeAll { now.timeIntervalSince($0.t) > retention }
    }
}
