//
//  ShotDNAModelsWatch.swift
//  StrikeLabCaddieWatch Watch App
//
//  Watch-side Shot DNA models (mirrors iOS models for cross-platform transfer)
//

import Foundation

// MARK: - Swing Motion Data (Watch)

/// Captured swing motion data from Apple Watch accelerometer
struct SwingMotionDataWatch: Codable, Equatable {
    /// Peak acceleration during swing (G-force)
    let peakAcceleration: Double
    
    /// Time from backswing start to impact (seconds)
    let swingTempo: Double
    
    /// Downsampled acceleration magnitude profile (20 points)
    let accelerationProfile: [Double]
    
    /// Downsampled rotation rate profile (20 points)
    let gyroProfile: [Double]
    
    /// Timestamp when motion was captured
    let capturedAt: Date
    
    init(
        peakAcceleration: Double,
        swingTempo: Double,
        accelerationProfile: [Double],
        gyroProfile: [Double],
        capturedAt: Date = Date()
    ) {
        self.peakAcceleration = peakAcceleration
        self.swingTempo = swingTempo
        self.accelerationProfile = accelerationProfile
        self.gyroProfile = gyroProfile
        self.capturedAt = capturedAt
    }
}

// MARK: - Heart Rate Data (Watch)

/// Heart rate information captured at shot time
struct HeartRateDataWatch: Codable, Equatable {
    /// Heart rate at moment of shot (BPM)
    var heartRate: Double
    
    /// Heart rate variability in previous 30 seconds (SDNN in ms)
    var hrv: Double?
    
    init(heartRate: Double, hrv: Double? = nil) {
        self.heartRate = heartRate
        self.hrv = hrv
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
