//
//  MotionManager.swift
//  StrikeLabCaddieWatch Watch App
//
//  Auto swing detection AND full motion capture using CMDeviceMotion at
//  100 Hz (gravity-corrected accel + gyro + attitude quaternion). Stores
//  every sample in a 2 s rolling ring buffer so that when the dual-channel
//  signature fires we can snapshot ±0.75 s around the impact peak and emit
//  a SwingCapture with the raw data + phase segmentation.
//
//  Detection signature (Apple Watch on lead wrist, full swing):
//    • peak userAcceleration ≥ 3.5 g
//    • peak rotationRate    ≥ 14 rad/s
//    • decay: last ~80 ms ≤ 70 % of peak accel
//    • cooldown: 1.5 s between detections (range tempo ~5-10 s)
//
//  Phase segmentation (backswing start, top, impact, finish) runs on the
//  captured window using accel-magnitude quiet detection and a transition-
//  point heuristic. Output indices are valid into `motion.samples`.
//
//  Battery: 100 Hz CMDeviceMotion is essentially free during an active
//  HKWorkoutSession (the session keeps the chip awake regardless). When
//  `setLowPower(true)` is called we drop to 50 Hz for cross-cutting battery
//  saver mode (<20% battery during a 4-hour round).
//

import Foundation
import CoreMotion
import Combine
import WatchKit

final class MotionManager: ObservableObject {

    // MARK: - Published state (main-thread only)

    @Published var isDetectionEnabled = false
    @Published var lastSwingConfidence: Double = 0
    @Published var lastSwingAt: Date?
    @Published var errorMessage: String?

    // MARK: - Callbacks

    /// Fired on the main thread every time a swing is captured with a
    /// fully segmented window. The connectivity layer turns this into an
    /// `EnhancedShotEventWatch` and ships it to the phone.
    var onSwingCaptured: ((SwingCapture) -> Void)?

    /// Optional impact-time hint from `ImpactAudioManager`. When set and
    /// within 100 ms of the gyro-derived impact, the segmenter snaps the
    /// impact index to the closest sample to this hint and flips
    /// `impactConfirmed = true`.
    var impactHintProvider: (() -> Date?)?

    // MARK: - Internals

    private let motion = CMMotionManager()
    private let motionQueue = OperationQueue()
    private let processingQueue = DispatchQueue(
        label: "com.strikelab.motion.processing",
        qos: .userInitiated
    )

    /// Internal raw sample. Wall-clock timestamp + raw axes + quaternion.
    private struct RawSample {
        let t: Date
        let ax: Double, ay: Double, az: Double
        let gx: Double, gy: Double, gz: Double
        let qw: Double, qx: Double, qy: Double, qz: Double

        var aMag: Double { (ax * ax + ay * ay + az * az).squareRoot() }
        var gMag: Double { (gx * gx + gy * gy + gz * gz).squareRoot() }
    }

    /// 2 s rolling buffer at 100 Hz = 200 samples (or 100 at 50 Hz).
    private var window: [RawSample] = []
    private var maxWindow: Int { Int(2.0 * sampleHz) }

    /// Sampling rate. Swapped at runtime by `setLowPower(_:)`.
    private(set) var sampleHz: Double = 100.0
    private var sampleInterval: TimeInterval { 1.0 / sampleHz }

    /// Lockout after a detection so a single swing doesn't fire twice.
    private var cooldownUntil: Date?
    private let cooldown: TimeInterval = 1.5

    /// Pending capture state: detection has fired but we wait for
    /// post-impact tail to arrive before snapshotting.
    private struct PendingCapture {
        let detectedAt: Date
        let confidence: Double
    }
    private var pending: PendingCapture?
    private let postCaptureDelay: TimeInterval = 0.55

    /// Detection thresholds.
    private let accelThreshold: Double = 3.5    // g
    private let gyroThreshold: Double = 14.0    // rad/s
    private let decayRatio: Double = 0.70       // tail ≤ peak * decayRatio

    // MARK: - Lifecycle

    func startDetection() {
        guard motion.isDeviceMotionAvailable else {
            DispatchQueue.main.async { [weak self] in
                self?.errorMessage = "Device motion not available"
            }
            return
        }
        guard !motion.isDeviceMotionActive else {
            DispatchQueue.main.async { [weak self] in
                self?.isDetectionEnabled = true
            }
            return
        }

        motion.deviceMotionUpdateInterval = sampleInterval
        let queue = processingQueue
        motion.startDeviceMotionUpdates(to: motionQueue) { [weak self] data, error in
            guard let self else { return }
            if let data {
                let s = RawSample(
                    t: Date(),
                    ax: data.userAcceleration.x,
                    ay: data.userAcceleration.y,
                    az: data.userAcceleration.z,
                    gx: data.rotationRate.x,
                    gy: data.rotationRate.y,
                    gz: data.rotationRate.z,
                    qw: data.attitude.quaternion.w,
                    qx: data.attitude.quaternion.x,
                    qy: data.attitude.quaternion.y,
                    qz: data.attitude.quaternion.z
                )
                queue.async { [weak self] in
                    self?.process(s)
                }
            } else if let error {
                DispatchQueue.main.async { [weak self] in
                    self?.errorMessage = error.localizedDescription
                }
            }
        }

        DispatchQueue.main.async { [weak self] in
            self?.isDetectionEnabled = true
        }
    }

    func stopDetection() {
        motion.stopDeviceMotionUpdates()
        processingQueue.async { [weak self] in
            self?.window.removeAll()
            self?.pending = nil
        }
        DispatchQueue.main.async { [weak self] in
            self?.isDetectionEnabled = false
        }
    }

    func resetDetection() {
        processingQueue.async { [weak self] in
            self?.window.removeAll()
            self?.cooldownUntil = nil
            self?.pending = nil
        }
    }

    /// Switch between full-fidelity (100 Hz) and low-power (50 Hz)
    /// sampling. Used by the cross-cutting battery saver when watch
    /// battery drops below 20% mid-round.
    func setLowPower(_ on: Bool) {
        let target: Double = on ? 50.0 : 100.0
        guard target != sampleHz else { return }
        sampleHz = target
        if motion.isDeviceMotionActive {
            motion.deviceMotionUpdateInterval = sampleInterval
            // Trim ring to new size so old samples don't dominate.
            processingQueue.async { [weak self] in
                guard let self else { return }
                if self.window.count > self.maxWindow {
                    self.window.removeFirst(self.window.count - self.maxWindow)
                }
            }
        }
    }

    // MARK: - Detection (runs on processingQueue)

    private func process(_ s: RawSample) {
        window.append(s)
        if window.count > maxWindow {
            window.removeFirst(window.count - maxWindow)
        }

        // Pending capture? Wait for post-impact tail then snapshot.
        if let p = pending,
           s.t.timeIntervalSince(p.detectedAt) >= postCaptureDelay {
            snapshot(detectedAt: p.detectedAt, confidence: p.confidence)
            pending = nil
            return
        }

        if let until = cooldownUntil, s.t < until { return }

        // Need enough recent data to make a confident call.
        guard window.count >= Int(0.4 * sampleHz) else { return }

        // Look at the last ~0.4 s — impact + immediate follow-through.
        let recentCount = min(window.count, Int(0.4 * sampleHz))
        let recent = window.suffix(recentCount)
        let peakA = recent.lazy.map(\.aMag).max() ?? 0
        let peakG = recent.lazy.map(\.gMag).max() ?? 0

        // Both channels must light up. This is what filters out walking,
        // bag handling, gestures — they tend to be only one or the other.
        guard peakA >= accelThreshold,
              peakG >= gyroThreshold
        else { return }

        // Decay: the last ~80 ms must drop well below the peak.
        let tailCount = max(2, Int(0.08 * sampleHz))
        let tail = recent.suffix(tailCount)
        guard tail.allSatisfy({ $0.aMag < peakA * decayRatio }) else { return }

        // Confidence: blend accel + gyro normalized peaks, capped at 1.
        let aN = peakA / (accelThreshold * 2.0)
        let gN = peakG / (gyroThreshold * 1.8)
        let confidence = min(1.0, max(0.5, (aN + gN) / 2.0))

        cooldownUntil = s.t.addingTimeInterval(cooldown)
        pending = PendingCapture(detectedAt: s.t, confidence: confidence)
    }

    // MARK: - Snapshot + segmentation

    private func snapshot(detectedAt: Date, confidence: Double) {
        guard !window.isEmpty else { return }

        // 1) Find the precise impact sample = argmax(aMag) in the last
        //    ~0.6 s of the window (so we don't grab some unrelated peak
        //    from earlier in the buffer).
        let lookbackCount = min(window.count, Int(0.6 * sampleHz))
        let lookbackStart = window.count - lookbackCount
        var impactGlobalIdx = lookbackStart
        var peakA = 0.0
        for i in 0..<lookbackCount {
            let a = window[lookbackStart + i].aMag
            if a > peakA {
                peakA = a
                impactGlobalIdx = lookbackStart + i
            }
        }

        // 2) Optional mic-confirmed impact.
        var impactConfirmed = false
        if let hint = impactHintProvider?() {
            let curT = window[impactGlobalIdx].t
            let delta = abs(hint.timeIntervalSince(curT))
            if delta <= 0.10 {
                let lo = max(0, impactGlobalIdx - 12)
                let hi = min(window.count - 1, impactGlobalIdx + 12)
                var bestIdx = impactGlobalIdx
                var bestDelta = delta
                for j in lo...hi {
                    let d = abs(hint.timeIntervalSince(window[j].t))
                    if d < bestDelta {
                        bestDelta = d
                        bestIdx = j
                    }
                }
                impactGlobalIdx = bestIdx
                impactConfirmed = true
            }
        }

        // 3) Define the capture window: impact ± 0.75 s.
        let halfSpan = Int(0.75 * sampleHz)
        let lo = max(0, impactGlobalIdx - halfSpan)
        let hi = min(window.count - 1, impactGlobalIdx + halfSpan)
        guard lo <= hi else { return }
        let slice = window[lo...hi]
        let originT = slice.first!.t

        var samples: [SwingSample] = []
        samples.reserveCapacity(slice.count)
        for s in slice {
            samples.append(SwingSample(
                tMs: s.t.timeIntervalSince(originT) * 1000.0,
                ax: s.ax, ay: s.ay, az: s.az,
                gx: s.gx, gy: s.gy, gz: s.gz,
                qw: s.qw, qx: s.qx, qy: s.qy, qz: s.qz
            ))
        }

        // 4) Phase segmentation.
        let impactIdxLocal = impactGlobalIdx - lo
        let rawPhases = Self.segmentPhases(
            samples: samples,
            impactIdx: impactIdxLocal,
            sampleHz: sampleHz
        )
        let dt = sampleInterval
        let backswingDur = Double(rawPhases.topIdx - rawPhases.backswingStartIdx) * dt
        let downswingDur = Double(rawPhases.impactIdx - rawPhases.topIdx) * dt
        let phaseUnreliable =
            rawPhases.topIdx <= rawPhases.backswingStartIdx
            || rawPhases.impactIdx <= rawPhases.topIdx
            || backswingDur < 0.20
            || backswingDur < 0.10 // degenerate takeaway-to-top
            || downswingDur > 0.50
        let phases = SwingPhaseMarkers(
            backswingStartIdx: rawPhases.backswingStartIdx,
            topIdx: rawPhases.topIdx,
            impactIdx: rawPhases.impactIdx,
            finishIdx: rawPhases.finishIdx,
            unreliable: phaseUnreliable
        )

        // 5) Peaks across the full capture.
        let peakAccel = samples.lazy.map(\.aMag).max() ?? 0
        let peakGyro = samples.lazy.map(\.gMag).max() ?? 0
        let tempo = max(0.0, Double(phases.impactIdx - phases.backswingStartIdx) / sampleHz)

        // 6) Down-sampled previews for back-compat / quick UIs.
        let accelProfile = Self.downsample(samples.map(\.aMag), to: 20)
        let gyroProfile = Self.downsample(samples.map(\.gMag), to: 20)

        let impactWallClock = window[impactGlobalIdx].t
        let motionData = SwingMotionDataWatch(
            peakAcceleration: peakAccel,
            peakRotationRate: peakGyro,
            swingTempo: tempo,
            sampleInterval: sampleInterval,
            samples: samples,
            phases: phases,
            impactConfirmed: impactConfirmed,
            capturedAt: impactWallClock,
            accelerationProfile: accelProfile,
            gyroProfile: gyroProfile
        )

        let capture = SwingCapture(
            id: UUID(),
            detectedAt: impactWallClock,
            detectionConfidence: confidence,
            motion: motionData
        )

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.lastSwingConfidence = confidence
            self.lastSwingAt = impactWallClock
            self.onSwingCaptured?(capture)
        }
    }

    // MARK: - Phase segmentation (pure / testable)

    /// Heuristic four-phase segmentation. All output indices are valid
    /// into `samples`. Tunable; see notes in code.
    static func segmentPhases(
        samples: [SwingSample],
        impactIdx rawImpactIdx: Int,
        sampleHz: Double
    ) -> SwingPhaseMarkers {
        let n = samples.count
        guard n > 0 else {
            return SwingPhaseMarkers(
                backswingStartIdx: 0,
                topIdx: 0,
                impactIdx: 0,
                finishIdx: 0,
                unreliable: true
            )
        }
        let impactIdx = max(0, min(n - 1, rawImpactIdx))

        let aMags = samples.map(\.aMag)
        let gMags = samples.map(\.gMag)

        // Backswing start: scan back from impact until both channels stay
        // quiet for 100 ms (i.e. before takeaway began).
        let quietWindow = max(2, Int(0.10 * sampleHz))
        let aQuiet = 0.30
        let gQuiet = 1.00

        var backswingStartIdx = 0
        if impactIdx >= quietWindow {
            outer: for i in stride(from: impactIdx - 1, through: 0, by: -1) {
                let lo = i
                let hi = min(n - 1, i + quietWindow - 1)
                if hi - lo + 1 < quietWindow { continue }
                var allQuiet = true
                for j in lo...hi {
                    if aMags[j] > aQuiet || gMags[j] > gQuiet {
                        allQuiet = false
                        break
                    }
                }
                if allQuiet {
                    backswingStartIdx = i + 1
                    break outer
                }
            }
        }

        // Top of backswing: the moment the wrist reverses direction.
        // The most reliable signal is the sign change of the dominant
        // gyroscope axis between `backswingStart` and `impact`.
        //
        // 1. Pick the gyro axis with the largest peak-to-peak range
        //    over the active swing window — that's the principal axis
        //    of the swing (typically vertical-ish on the lead wrist).
        // 2. Walk forward from `backswingStart` and find the LAST
        //    sign-change of that axis before `impact`. That is the
        //    transition.
        //
        // Falls back to the previous accel-magnitude local-minimum
        // heuristic when the gyro signal is too quiet to trust (e.g.
        // partial swings or the synthetic test fixture).
        var topIdx = max(backswingStartIdx, impactIdx - max(2, Int(0.20 * sampleHz)))
        if backswingStartIdx + 2 < impactIdx {
            // Step 1: find dominant axis.
            var minX = Double.infinity, maxX = -Double.infinity
            var minY = Double.infinity, maxY = -Double.infinity
            var minZ = Double.infinity, maxZ = -Double.infinity
            for j in backswingStartIdx...impactIdx {
                let s = samples[j]
                if s.gx < minX { minX = s.gx }
                if s.gx > maxX { maxX = s.gx }
                if s.gy < minY { minY = s.gy }
                if s.gy > maxY { maxY = s.gy }
                if s.gz < minZ { minZ = s.gz }
                if s.gz > maxZ { maxZ = s.gz }
            }
            let rangeX = maxX - minX
            let rangeY = maxY - minY
            let rangeZ = maxZ - minZ
            let dominantRange = max(rangeX, rangeY, rangeZ)

            // Only trust the gyro segmentation when the dominant axis
            // actually swept through ≥4 rad/s — anything less is noise.
            if dominantRange >= 4.0 {
                // Pick the value extractor for the dominant axis.
                let value: (SwingSample) -> Double
                if rangeX >= rangeY && rangeX >= rangeZ {
                    value = { $0.gx }
                } else if rangeY >= rangeZ {
                    value = { $0.gy }
                } else {
                    value = { $0.gz }
                }
                // Walk back from impact, find last sign change.
                var foundTop: Int?
                for j in stride(from: impactIdx - 1, through: backswingStartIdx, by: -1) {
                    if value(samples[j]) * value(samples[j + 1]) < 0 {
                        foundTop = j
                        break
                    }
                }
                if let t = foundTop {
                    topIdx = t
                }
            } else {
                // Fallback: local minimum of accel after first rise.
                var foundFirstRise = false
                var topMin = Double.infinity
                for j in backswingStartIdx..<impactIdx {
                    if !foundFirstRise && aMags[j] > 1.0 {
                        foundFirstRise = true
                        continue
                    }
                    if foundFirstRise && aMags[j] < topMin {
                        topMin = aMags[j]
                        topIdx = j
                    }
                }
            }
        }

        // Finish: scan forward from impact until both channels stay
        // quiet for 100 ms.
        var finishIdx = n - 1
        if impactIdx < n - quietWindow {
            for i in (impactIdx + 1)..<n {
                let hi = min(n - 1, i + quietWindow - 1)
                if hi - i + 1 < quietWindow { continue }
                var allQuiet = true
                for j in i...hi {
                    if aMags[j] > aQuiet || gMags[j] > gQuiet {
                        allQuiet = false
                        break
                    }
                }
                if allQuiet {
                    finishIdx = min(n - 1, i + quietWindow - 1)
                    break
                }
            }
        }

        return SwingPhaseMarkers(
            backswingStartIdx: max(0, min(n - 1, backswingStartIdx)),
            topIdx: max(0, min(n - 1, topIdx)),
            impactIdx: impactIdx,
            finishIdx: max(0, min(n - 1, finishIdx)),
            unreliable: false
        )
    }

    // MARK: - Helpers

    private static func downsample(_ values: [Double], to count: Int) -> [Double] {
        guard !values.isEmpty, count > 0 else { return [] }
        if values.count <= count { return values }
        var out: [Double] = []
        out.reserveCapacity(count)
        for i in 0..<count {
            let idx = (i * values.count) / count
            out.append(values[idx])
        }
        return out
    }
}
