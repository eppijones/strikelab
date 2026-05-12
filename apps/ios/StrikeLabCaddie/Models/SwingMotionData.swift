//
//  SwingMotionData.swift
//  StrikeLabCaddie
//
//  iOS-side mirror of the watch wire format. The Codable shape EXACTLY
//  matches `apps/ios/StrikeLabCaddieWatch Watch App/Models/ShotDNAModelsWatch.swift`
//  so JSON produced on the watch decodes here without translation.
//
//  These are read by the Swing Card on the phone, the SwingInspectorView,
//  and (eventually) the API client that ships swings to the backend.
//

import Foundation

// MARK: - Swing samples + phases

/// Single 100 Hz frame from `CMDeviceMotion`.
struct SwingSample: Codable, Equatable {
    /// Time (ms) since the start of the capture window. Negative = pre-impact.
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

struct SwingPhaseMarkers: Codable, Equatable {
    let backswingStartIdx: Int
    let topIdx: Int
    let impactIdx: Int
    let finishIdx: Int
    /// When true, segmentation failed sanity checks — tempo ratio must
    /// not be shown; UI shows "—" instead of a bogus number.
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

/// Captured swing motion data from the watch.
struct SwingMotionData: Codable, Equatable {
    let peakAcceleration: Double
    let peakRotationRate: Double
    let swingTempo: Double
    let sampleInterval: Double
    let samples: [SwingSample]
    let phases: SwingPhaseMarkers
    let impactConfirmed: Bool
    let capturedAt: Date
    let accelerationProfile: [Double]
    let gyroProfile: [Double]
}

// MARK: - Heart rate snapshot

struct HRSample: Codable, Equatable {
    let tMs: Double
    let bpm: Double
}

struct HRSnapshot: Codable, Equatable {
    let samples: [HRSample]
    let rrIntervals: [Double]
    let isHighFrequency: Bool
}

struct HeartRateData: Codable, Equatable {
    var heartRate: Double
    var hrv: Double?
    var preMedian: Double?
    var postMedian: Double?
    var snapshot: HRSnapshot?
}

// MARK: - Enhanced shot event (watch -> phone wire format)

/// Enhanced shot event with full biomechanic + biometric capture.
struct EnhancedShotEvent: Codable, Identifiable, Equatable {
    let id: UUID
    var timestamp: Date
    var clubRawValue: String
    var confidence: Double?
    var isManual: Bool

    var motionData: SwingMotionData?
    var heartRateData: HeartRateData?
    var outcomeRawValue: String?
    var missDirectionRawValue: String?

    var club: Club? { Club(rawValue: clubRawValue) }
}
