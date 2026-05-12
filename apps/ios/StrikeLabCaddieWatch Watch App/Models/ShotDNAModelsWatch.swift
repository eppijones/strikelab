//
//  ShotDNAModelsWatch.swift
//  StrikeLabCaddieWatch Watch App
//
//  Watch-side Shot DNA models (mirrors iOS models for cross-platform transfer)
//
//  Wire format for everything sent watch -> phone for a single swing.
//  The richer types (SwingSample, SwingPhaseMarkers, SwingMotionDataWatch
//  with full samples, HRSnapshotWatch) are produced by MotionManager +
//  HighFrequencyHRManager; the ImpactAudioManager can promote the impact
//  timestamp to "measured". Per-shot blob is ~13 kB raw JSON; well below
//  WCSession's 65 kB sendMessage cap and trivial for transferUserInfo.
//

import Foundation

// MARK: - Swing Sample (single tick from CMDeviceMotion)

/// A single 100 Hz frame from `CMDeviceMotion` — gravity-corrected
/// acceleration in g, rotation rate in rad/s, attitude as a unit quaternion.
struct SwingSample: Codable, Equatable {
    /// Time (ms) since the start of the capture window. The window starts
    /// at `impactIdx - 75 samples` so negative values are pre-impact.
    let tMs: Double
    let ax: Double
    let ay: Double
    let az: Double
    let gx: Double
    let gy: Double
    let gz: Double
    let qw: Double
    let qx: Double
    let qy: Double
    let qz: Double

    /// |userAcceleration| in g.
    var aMag: Double { (ax * ax + ay * ay + az * az).squareRoot() }
    /// |rotationRate| in rad/s.
    var gMag: Double { (gx * gx + gy * gy + gz * gz).squareRoot() }
}

// MARK: - Phase markers

/// Indices into `SwingMotionDataWatch.samples` for the four canonical
/// swing phases. All four are valid [0, samples.count) by construction.
struct SwingPhaseMarkers: Codable, Equatable {
    /// Quiet sample just before takeaway begins.
    let backswingStartIdx: Int
    /// Top of the backswing — the transition where direction reverses.
    let topIdx: Int
    /// Impact sample — argmax of |userAcceleration|, optionally promoted
    /// by mic-confirmed click.
    let impactIdx: Int
    /// Finish — quiet sample after follow-through has settled.
    let finishIdx: Int
    /// True when segmentation heuristics produced a degenerate timeline.
    let unreliable: Bool

    init(
        backswingStartIdx: Int,
        topIdx: Int,
        impactIdx: Int,
        finishIdx: Int,
        unreliable: Bool = false
    ) {
        self.backswingStartIdx = backswingStartIdx
        self.topIdx = topIdx
        self.impactIdx = impactIdx
        self.finishIdx = finishIdx
        self.unreliable = unreliable
    }

    enum CodingKeys: String, CodingKey {
        case backswingStartIdx, topIdx, impactIdx, finishIdx, unreliable
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        backswingStartIdx = try c.decode(Int.self, forKey: .backswingStartIdx)
        topIdx = try c.decode(Int.self, forKey: .topIdx)
        impactIdx = try c.decode(Int.self, forKey: .impactIdx)
        finishIdx = try c.decode(Int.self, forKey: .finishIdx)
        unreliable = try c.decodeIfPresent(Bool.self, forKey: .unreliable) ?? false
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(backswingStartIdx, forKey: .backswingStartIdx)
        try c.encode(topIdx, forKey: .topIdx)
        try c.encode(impactIdx, forKey: .impactIdx)
        try c.encode(finishIdx, forKey: .finishIdx)
        try c.encode(unreliable, forKey: .unreliable)
    }
}

// MARK: - Swing Motion Data (wire format)

/// Captured swing motion data from Apple Watch — sent watch -> phone.
struct SwingMotionDataWatch: Codable, Equatable {
    /// Peak |userAcceleration| across the capture window (g).
    let peakAcceleration: Double

    /// Peak |rotationRate| across the capture window (rad/s). Used for
    /// hand-speed estimates on the phone (multiplied by player arm length).
    let peakRotationRate: Double

    /// Tempo: seconds from `backswingStartIdx` to `impactIdx`.
    let swingTempo: Double

    /// Sample interval used for the capture (typically 0.01 s = 100 Hz).
    let sampleInterval: Double

    /// Full per-sample data — ~150 samples = ~13 kB JSON.
    let samples: [SwingSample]

    /// Phase markers in `samples` index space.
    let phases: SwingPhaseMarkers

    /// True when the impact timestamp was confirmed by the microphone
    /// click detector (vs. gyro/accel-derived only).
    let impactConfirmed: Bool

    /// Timestamp the swing was captured (impact moment in wall-clock).
    let capturedAt: Date

    /// Down-sampled accel magnitude (20 pts) — back-compat / preview.
    let accelerationProfile: [Double]

    /// Down-sampled rotation rate magnitude (20 pts) — back-compat / preview.
    let gyroProfile: [Double]

    init(
        peakAcceleration: Double,
        peakRotationRate: Double,
        swingTempo: Double,
        sampleInterval: Double,
        samples: [SwingSample],
        phases: SwingPhaseMarkers,
        impactConfirmed: Bool,
        capturedAt: Date,
        accelerationProfile: [Double],
        gyroProfile: [Double]
    ) {
        self.peakAcceleration = peakAcceleration
        self.peakRotationRate = peakRotationRate
        self.swingTempo = swingTempo
        self.sampleInterval = sampleInterval
        self.samples = samples
        self.phases = phases
        self.impactConfirmed = impactConfirmed
        self.capturedAt = capturedAt
        self.accelerationProfile = accelerationProfile
        self.gyroProfile = gyroProfile
    }
}

// MARK: - On-watch capture wrapper

/// Internal-only wrapper used by `MotionManager` to deliver a fully
/// segmented swing to the rest of the watch app. Not sent over the wire
/// directly — the connectivity manager unpacks `motion` into a
/// `SwingMotionDataWatch` field on `EnhancedShotEventWatch`.
struct SwingCapture: Equatable {
    let id: UUID
    let detectedAt: Date
    let detectionConfidence: Double
    let motion: SwingMotionDataWatch
}

// MARK: - Heart Rate Snapshot (Watch)

/// Per-sample HR tick from `CMHighFrequencyHeartRate` (10 Hz on Series 9+)
/// or `HKAnchoredObjectQuery` (~1 Hz fallback). `tMs` is relative to the
/// snapshot anchor (the swing's impact timestamp), so negative = before.
struct HRSampleWatch: Codable, Equatable {
    let tMs: Double
    let bpm: Double
}

/// 60-second window of HR + RR data taken around the moment of a swing.
struct HRSnapshotWatch: Codable, Equatable {
    /// Window of HR samples (≈ -30 s through +30 s of impact).
    let samples: [HRSampleWatch]
    /// Recent RR intervals (ms) — used for SDNN/HRV.
    let rrIntervals: [Double]
    /// Whether `samples` were sourced from the high-frequency API.
    let isHighFrequency: Bool
}

// MARK: - Heart Rate Data (Watch — wire format)

/// Heart rate information captured at shot time.
struct HeartRateDataWatch: Codable, Equatable {
    /// HR at the moment of impact (BPM). 0 if no sample was available.
    var heartRate: Double

    /// HRV (SDNN, ms) computed over the 60 s pre-impact window when
    /// enough RR intervals were available.
    var hrv: Double?

    /// Median HR over the 30 s before impact (BPM).
    var preMedian: Double?

    /// Median HR over the 30 s after impact (BPM).
    var postMedian: Double?

    /// Full snapshot for the Swing Card on the phone (optional — the
    /// connectivity layer can drop this to keep the payload small if the
    /// session is offline).
    var snapshot: HRSnapshotWatch?

    init(
        heartRate: Double,
        hrv: Double? = nil,
        preMedian: Double? = nil,
        postMedian: Double? = nil,
        snapshot: HRSnapshotWatch? = nil
    ) {
        self.heartRate = heartRate
        self.hrv = hrv
        self.preMedian = preMedian
        self.postMedian = postMedian
        self.snapshot = snapshot
    }
}

// MARK: - Shot Outcome (Watch)

/// Player-reported shot outcome quality
enum ShotOutcomeWatch: String, Codable, CaseIterable, Identifiable {
    case perfect = "Perfect"
    case good = "Good"
    case acceptable = "OK"
    case poor = "Poor"
    case disaster = "Disaster"
    
    var id: String { rawValue }
    
    /// SF Symbol for outcome
    var iconName: String {
        switch self {
        case .perfect: return "star.fill"
        case .good: return "hand.thumbsup.fill"
        case .acceptable: return "checkmark.circle"
        case .poor: return "exclamationmark.triangle"
        case .disaster: return "xmark.octagon"
        }
    }
    
    /// Quick selection options for watch UI
    static var quickOptions: [ShotOutcomeWatch] {
        [.good, .acceptable, .poor]
    }
}

// MARK: - Miss Direction (Watch)

/// Direction the ball missed from the intended target
enum MissDirectionWatch: String, Codable, CaseIterable, Identifiable {
    case straight = "Straight"
    case slightLeft = "Slight Left"
    case left = "Left"
    case slightRight = "Slight Right"
    case right = "Right"
    case short = "Short"
    case long = "Long"
    case thinned = "Thinned"
    case fatted = "Fat"
    
    var id: String { rawValue }
    
    /// Short label for compact watch UI
    var shortLabel: String {
        switch self {
        case .straight: return "✓"
        case .slightLeft: return "←"
        case .left: return "⬅︎"
        case .slightRight: return "→"
        case .right: return "➡︎"
        case .short: return "↓"
        case .long: return "↑"
        case .thinned: return "↗︎"
        case .fatted: return "↙︎"
        }
    }
    
    /// SF Symbol for miss direction
    var iconName: String {
        switch self {
        case .straight: return "checkmark.circle"
        case .slightLeft, .left: return "arrow.left"
        case .slightRight, .right: return "arrow.right"
        case .short: return "arrow.down"
        case .long: return "arrow.up"
        case .thinned: return "arrow.up.right"
        case .fatted: return "arrow.down.left"
        }
    }
    
    /// Quick options for watch UI (most common)
    static var quickOptions: [MissDirectionWatch] {
        [.straight, .left, .right, .short, .long]
    }
}

// MARK: - Enhanced Shot Event (Watch to Phone)

/// Enhanced shot event with biometric and motion data sent from watch to phone
struct EnhancedShotEventWatch: Codable, Identifiable, Equatable {
    let id: UUID
    var timestamp: Date
    var clubRawValue: String  // ClubWatch enum raw value
    var confidence: Double?
    var isManual: Bool
    
    // DNA enhancement data
    var motionData: SwingMotionDataWatch?
    var heartRateData: HeartRateDataWatch?
    var outcomeRawValue: String?      // ShotOutcomeWatch raw value
    var missDirectionRawValue: String? // MissDirectionWatch raw value
    
    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        club: ClubWatch,
        confidence: Double? = nil,
        isManual: Bool = true,
        motionData: SwingMotionDataWatch? = nil,
        heartRateData: HeartRateDataWatch? = nil,
        outcome: ShotOutcomeWatch? = nil,
        missDirection: MissDirectionWatch? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.clubRawValue = club.rawValue
        self.confidence = confidence
        self.isManual = isManual
        self.motionData = motionData
        self.heartRateData = heartRateData
        self.outcomeRawValue = outcome?.rawValue
        self.missDirectionRawValue = missDirection?.rawValue
    }
    
    /// Get the club enum value
    var club: ClubWatch? {
        ClubWatch(rawValue: clubRawValue)
    }
    
    /// Get the outcome enum value
    var outcome: ShotOutcomeWatch? {
        guard let raw = outcomeRawValue else { return nil }
        return ShotOutcomeWatch(rawValue: raw)
    }
    
    /// Get the miss direction enum value
    var missDirection: MissDirectionWatch? {
        guard let raw = missDirectionRawValue else { return nil }
        return MissDirectionWatch(rawValue: raw)
    }
}
