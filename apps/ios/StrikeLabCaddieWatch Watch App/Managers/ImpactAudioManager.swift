//
//  ImpactAudioManager.swift
//  StrikeLabCaddieWatch Watch App
//
//  Two jobs:
//
//   1. CLICK DETECTOR — listen for the sharp ~2-4 kHz click of a golf
//      impact and stamp the moment with ±10 ms accuracy. Motion
//      manager polls `latestImpactAt` via its `impactHintProvider`
//      closure and snaps the gyro-derived impact index to the
//      mic-confirmed timestamp when within 100 ms. Result is the
//      `impactConfirmed` flag on the wire payload.
//
//   2. SWING RECORDER — keep a 3 s rolling ring buffer of raw audio
//      so that when a swing fires we can render the ±1.5 s window
//      around impact to a CAF file and ship it to the phone via
//      `WCSession.transferFile`. The phone plays it back in the
//      Swing Inspector / Swing Card so the player can HEAR the
//      impact alongside the gauges.
//
//  Off by default. Requires `NSMicrophoneUsageDescription` and is gated by
//  `WatchSettings.micImpactConfirm` (synced from the iPhone or Coach screen).
//

import Foundation
import AVFoundation
import Accelerate
import Combine
import WatchKit

@MainActor
final class ImpactAudioManager: ObservableObject {

    // MARK: - Published state

    @Published private(set) var isListening = false
    @Published private(set) var lastImpactAt: Date?
    @Published private(set) var lastImpactPeak: Float = 0
    @Published private(set) var errorMessage: String?

    /// Fired whenever the recorder has written a new ±1.5 s clip to
    /// disk. The payload is the file URL — caller copies / transfers
    /// then deletes. Wired by `RangeSessionView` to send the file via
    /// the connectivity manager.
    var onClipReady: ((URL) -> Void)?

    // MARK: - Internals

    private let engine = AVAudioEngine()
    private let session = AVAudioSession.sharedInstance()
    private let processingQueue = DispatchQueue(
        label: "com.strikelab.audio.processing",
        qos: .userInitiated
    )

    /// Detection threshold (peak amplitude in linear units, 0…1).
    private let peakThreshold: Float = 0.30

    /// Lockout between detections so the impact's decay tail doesn't
    /// fire twice.
    private var cooldownUntil: Date?
    private let cooldown: TimeInterval = 0.50

    /// Min spectral energy share in the 2-4 kHz band for a click to
    /// be accepted as a club impact (vs. e.g. a clap).
    private let minHighFreqShare: Float = 0.25

    /// FFT size (~16 ms at 16 kHz). Setup is built per-call inside
    /// `highFrequencyShare` since the call site lives on a non-main
    /// queue.
    private let fftSize: Int = 256

    // MARK: - Audio ring buffer (for swing recording)

    /// Mono float32 ring buffer holding the most recent ~3 s of audio.
    /// Sample rate captured during `start()` and is the device's
    /// natural input rate (typically 16 kHz on watch).
    private var ringSamples: [Float] = []
    private var ringSampleRate: Double = 16000
    private var ringWriteIdx: Int = 0
    private var ringFilled: Bool = false
    private var ringCapacity: Int = 0

    /// Pending swing-clip writes — when an impact is detected we wait
    /// `postClipDelay` for the post-impact tail to fill up before
    /// snapshotting and writing the file.
    private struct PendingClip {
        let id: UUID
        let impactAt: Date
    }
    private var pendingClips: [PendingClip] = []
    private let postClipDelay: TimeInterval = 1.5

    // MARK: - Lifecycle

    init() {}

    /// Begin listening. No-op (and does not request the mic) when the
    /// settings toggle is off.
    func start(enabled: Bool) {
        guard enabled else { return }
        guard !isListening else { return }

        do {
            try session.setCategory(.playAndRecord,
                                    mode: .measurement,
                                    options: [.duckOthers])
            try session.setActive(true)
        } catch {
            errorMessage = "Audio session: \(error.localizedDescription)"
            return
        }

        let input = engine.inputNode
        let format = input.inputFormat(forBus: 0)
        let bufferSize: AVAudioFrameCount = 1024

        // Allocate the 3 s ring buffer for the requested sample rate.
        ringSampleRate = format.sampleRate
        ringCapacity = max(1, Int(format.sampleRate * 3.0))
        ringSamples = Array(repeating: 0, count: ringCapacity)
        ringWriteIdx = 0
        ringFilled = false

        input.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, _ in
            self?.processingQueue.async { [weak self] in
                self?.handle(buffer: buffer, sampleRate: format.sampleRate)
            }
        }

        do {
            try engine.start()
            isListening = true
        } catch {
            input.removeTap(onBus: 0)
            errorMessage = "Audio engine: \(error.localizedDescription)"
        }
    }

    func stop() {
        guard isListening else { return }
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
        isListening = false
        pendingClips.removeAll()
    }

    /// Schedule a swing-clip write. Call this when MotionManager fires
    /// `onSwingCaptured` so we can correlate the audio to the same
    /// swing id used in `EnhancedShotEvent`.
    func recordClip(swingId: UUID, impactAt: Date) {
        guard isListening else { return }
        pendingClips.append(PendingClip(id: swingId, impactAt: impactAt))
        // Schedule the write `postClipDelay` after impact so the buffer
        // has the post-impact tail.
        let delay = max(0, postClipDelay - max(0, Date().timeIntervalSince(impactAt)))
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.flushPendingClip(id: swingId)
        }
    }

    // MARK: - Processing (runs on processingQueue)

    nonisolated private func handle(buffer: AVAudioPCMBuffer, sampleRate: Double) {
        guard let channelData = buffer.floatChannelData else { return }
        let frames = Int(buffer.frameLength)
        guard frames > 0 else { return }

        let ptr = channelData[0]
        let samples = Array(UnsafeBufferPointer(start: ptr, count: frames))

        // 1. Append into the ring buffer (for clip rendering).
        Task { @MainActor [weak self] in
            self?.appendToRing(samples)
        }

        // 2. Click detection on this buffer.
        var peak: Float = 0
        var peakIdx = 0
        for i in 0..<frames {
            let v = abs(ptr[i])
            if v > peak {
                peak = v
                peakIdx = i
            }
        }
        guard peak >= peakThreshold else { return }

        let now = Date()
        let bufferStartTime = now.addingTimeInterval(-Double(frames) / sampleRate)
        let impactTime = bufferStartTime.addingTimeInterval(Double(peakIdx) / sampleRate)

        let halfFFT = fftSize / 2
        let lo = max(0, peakIdx - halfFFT)
        let hi = min(frames, lo + fftSize)
        var window = Array(repeating: Float(0), count: fftSize)
        let copy = hi - lo
        for i in 0..<copy {
            window[i] = ptr[lo + i]
        }
        let highShare = highFrequencyShare(samples: window, sampleRate: Float(sampleRate))

        let detectedPeak = peak
        Task { @MainActor [weak self] in
            guard let self else { return }
            if let until = self.cooldownUntil, now < until { return }
            guard highShare >= self.minHighFreqShare else { return }
            self.cooldownUntil = now.addingTimeInterval(self.cooldown)
            self.lastImpactAt = impactTime
            self.lastImpactPeak = detectedPeak
        }
    }

    /// Copy samples into the ring. Called on main.
    private func appendToRing(_ samples: [Float]) {
        guard ringCapacity > 0 else { return }
        for sample in samples {
            ringSamples[ringWriteIdx] = sample
            ringWriteIdx = (ringWriteIdx + 1) % ringCapacity
            if ringWriteIdx == 0 { ringFilled = true }
        }
    }

    // MARK: - Spectral check

    nonisolated private func highFrequencyShare(samples: [Float], sampleRate: Float) -> Float {
        let n = fftSize
        var rIn = samples
        var iIn = Array(repeating: Float(0), count: n)
        var rOut = Array(repeating: Float(0), count: n)
        var iOut = Array(repeating: Float(0), count: n)

        var window = Array(repeating: Float(0), count: n)
        vDSP_hann_window(&window, vDSP_Length(n), Int32(vDSP_HANN_NORM))
        vDSP_vmul(rIn, 1, window, 1, &rIn, 1, vDSP_Length(n))

        guard let setup = vDSP_DFT_zop_CreateSetup(nil, vDSP_Length(n), .FORWARD) else {
            return 0
        }
        defer { vDSP_DFT_DestroySetup(setup) }

        rIn.withUnsafeMutableBufferPointer { rb in
            iIn.withUnsafeMutableBufferPointer { ib in
                rOut.withUnsafeMutableBufferPointer { ro in
                    iOut.withUnsafeMutableBufferPointer { io in
                        vDSP_DFT_Execute(setup,
                                         rb.baseAddress!, ib.baseAddress!,
                                         ro.baseAddress!, io.baseAddress!)
                    }
                }
            }
        }

        var mags = Array(repeating: Float(0), count: n / 2)
        for k in 0..<(n / 2) {
            mags[k] = rOut[k] * rOut[k] + iOut[k] * iOut[k]
        }
        var totalEnergy: Float = 0
        vDSP_sve(mags, 1, &totalEnergy, vDSP_Length(n / 2))
        guard totalEnergy > 0 else { return 0 }

        let binHz = sampleRate / Float(n)
        let kLo = max(0, Int((2000 / binHz).rounded()))
        let kHi = min(n / 2 - 1, Int((4000 / binHz).rounded()))
        guard kHi > kLo else { return 0 }

        var bandEnergy: Float = 0
        for k in kLo...kHi {
            bandEnergy += mags[k]
        }
        return bandEnergy / totalEnergy
    }

    // MARK: - Clip write

    /// Snapshot the ring around the swing's impact and write it to a
    /// CAF file in the watch app's tmp directory. Fires `onClipReady`
    /// with the file URL when done.
    private func flushPendingClip(id: UUID) {
        guard let idx = pendingClips.firstIndex(where: { $0.id == id }) else { return }
        let pending = pendingClips.remove(at: idx)
        guard ringCapacity > 0 else { return }

        // Pull a contiguous ±1.5 s slice ending at "now" (we waited
        // postClipDelay so this captures both pre- and post-impact).
        let totalCount = min(ringCapacity, Int(3.0 * ringSampleRate))
        var slice = Array(repeating: Float(0), count: totalCount)
        let writeIdx = ringWriteIdx
        for i in 0..<totalCount {
            // Read from oldest sample forward.
            let idx = (writeIdx + ringCapacity - totalCount + i) % ringCapacity
            slice[i] = ringSamples[idx]
        }

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("swing-\(pending.id.uuidString).caf")

        do {
            try writePCM(samples: slice, sampleRate: ringSampleRate, to: url)
            onClipReady?(url)
        } catch {
            errorMessage = "Audio write failed: \(error.localizedDescription)"
        }
    }

    /// Write a mono float32 PCM array to a CAF file using AVAudioFile.
    private func writePCM(samples: [Float], sampleRate: Double, to url: URL) throws {
        guard let format = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: sampleRate,
            channels: 1,
            interleaved: false
        ) else { throw NSError(domain: "ImpactAudio", code: -1) }

        // Remove any existing file at the URL.
        try? FileManager.default.removeItem(at: url)

        let file = try AVAudioFile(
            forWriting: url,
            settings: format.settings,
            commonFormat: .pcmFormatFloat32,
            interleaved: false
        )
        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(samples.count)
        ), let chPtr = buffer.floatChannelData?[0] else {
            throw NSError(domain: "ImpactAudio", code: -2)
        }
        for i in 0..<samples.count {
            chPtr[i] = samples[i]
        }
        buffer.frameLength = AVAudioFrameCount(samples.count)
        try file.write(from: buffer)
    }
}
