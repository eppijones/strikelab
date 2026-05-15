//
//  Shot.swift
//  StrikeLabCaddie
//
//  Shot tracking models
//

import Foundation
import CoreLocation

/// Club categories for grouping and display
enum ClubGroup: String, Codable, CaseIterable, Identifiable {
    case driver = "Driver"
    case wood = "Wood"
    case hybrid = "Hybrid"
    case iron = "Iron"
    case wedge = "Wedge"
    case putt = "Putt"
    
    var id: String { rawValue }
    
    /// SF Symbol for the club group
    var iconName: String {
        switch self {
        case .driver: return "arrow.up.right"
        case .wood: return "arrow.up.forward"
        case .hybrid: return "arrow.up.forward.circle"
        case .iron: return "arrow.right"
        case .wedge: return "arrow.up"
        case .putt: return "circle.dotted"
        }
    }
    
    /// Short label for compact display
    var shortLabel: String {
        switch self {
        case .driver: return "D"
        case .wood: return "W"
        case .hybrid: return "H"
        case .iron: return "I"
        case .wedge: return "W"
        case .putt: return "P"
        }
    }
    
    /// Color for the club group on maps
    var color: String {
        switch self {
        case .driver: return "neuralCyan"
        case .wood: return "champagne"
        case .hybrid: return "champagne"
        case .iron: return "nordicForest"
        case .wedge: return "nordicSage"
        case .putt: return "neutral"
        }
    }
    
    /// Clubs in this group
    var clubs: [Club] {
        Club.allCases.filter { $0.group == self }
    }
}

// MARK: - Specific Club

/// Individual golf clubs for detailed tracking
enum Club: String, Codable, CaseIterable, Identifiable {
    // Driver
    case driver = "Driver"
    
    // Woods
    case wood3 = "3 Wood"
    case wood5 = "5 Wood"
    case wood7 = "7 Wood"
    
    // Hybrids
    case hybrid2 = "2 Hybrid"
    case hybrid3 = "3 Hybrid"
    case hybrid4 = "4 Hybrid"
    case hybrid5 = "5 Hybrid"
    case hybrid6 = "6 Hybrid"
    
    // Irons
    case iron3 = "3 Iron"
    case iron4 = "4 Iron"
    case iron5 = "5 Iron"
    case iron6 = "6 Iron"
    case iron7 = "7 Iron"
    case iron8 = "8 Iron"
    case iron9 = "9 Iron"
    
    // Wedges
    case pitchingWedge = "PW"
    case gapWedge = "GW"
    case sandWedge = "SW"
    case lobWedge = "LW"
    case wedge50 = "50°"
    case wedge52 = "52°"
    case wedge54 = "54°"
    case wedge56 = "56°"
    case wedge58 = "58°"
    case wedge60 = "60°"
    case wedge64 = "64°"
    
    // Putter
    case putter = "Putter"
    
    var id: String { rawValue }
    
    /// The club group this club belongs to
    var group: ClubGroup {
        switch self {
        case .driver:
            return .driver
        case .wood3, .wood5, .wood7:
            return .wood
        case .hybrid2, .hybrid3, .hybrid4, .hybrid5, .hybrid6:
            return .hybrid
        case .iron3, .iron4, .iron5, .iron6, .iron7, .iron8, .iron9:
            return .iron
        case .pitchingWedge, .gapWedge, .sandWedge, .lobWedge,
             .wedge50, .wedge52, .wedge54, .wedge56, .wedge58, .wedge60, .wedge64:
            return .wedge
        case .putter:
            return .putt
        }
    }
    
    /// Short display name for compact UI
    var shortName: String {
        switch self {
        case .driver: return "D"
        case .wood3: return "3W"
        case .wood5: return "5W"
        case .wood7: return "7W"
        case .hybrid2: return "2H"
        case .hybrid3: return "3H"
        case .hybrid4: return "4H"
        case .hybrid5: return "5H"
        case .hybrid6: return "6H"
        case .iron3: return "3i"
        case .iron4: return "4i"
        case .iron5: return "5i"
        case .iron6: return "6i"
        case .iron7: return "7i"
        case .iron8: return "8i"
        case .iron9: return "9i"
        case .pitchingWedge: return "PW"
        case .gapWedge: return "GW"
        case .sandWedge: return "SW"
        case .lobWedge: return "LW"
        case .wedge50: return "50°"
        case .wedge52: return "52°"
        case .wedge54: return "54°"
        case .wedge56: return "56°"
        case .wedge58: return "58°"
        case .wedge60: return "60°"
        case .wedge64: return "64°"
        case .putter: return "P"
        }
    }
    
    /// Icon name (uses group icon)
    var iconName: String {
        group.iconName
    }
    
    /// Color (uses group color)
    var color: String {
        group.color
    }
    
    /// Common clubs for quick selection — matches the player's bag
    /// (D, 5W, 5–9 irons, PW, 52°, 56°, 60° wedges + putter).
    static var commonClubs: [Club] {
        [
            .driver,
            .wood5,
            .iron5, .iron6, .iron7, .iron8, .iron9,
            .pitchingWedge, .wedge52, .wedge56, .wedge60,
            .putter
        ]
    }

    /// Bag clubs only (no putter) — used by the range session UI where
    /// the putter doesn't belong.
    static var rangeClubs: [Club] {
        commonClubs.filter { $0 != .putter }
    }
}

// MARK: - Coordinate

/// Simple coordinate for storage (CLLocationCoordinate2D is not Codable)
struct Coordinate: Codable, Equatable {
    var latitude: Double
    var longitude: Double
    
    /// Convert to CoreLocation coordinate
    var clCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    /// Create from CoreLocation coordinate
    init(from coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }
    
    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
    
    /// Calculate distance to another coordinate in meters
    func distance(to other: Coordinate) -> Double {
        let loc1 = CLLocation(latitude: latitude, longitude: longitude)
        let loc2 = CLLocation(latitude: other.latitude, longitude: other.longitude)
        return loc1.distance(from: loc2)
    }
}

// MARK: - Shot

/// A tracked golf shot with location data
struct Shot: Codable, Identifiable, Equatable {
    let id: UUID
    var timestamp: Date
    var club: Club              // Specific club used
    var startLocation: Coordinate?
    var endLocation: Coordinate?
    var distanceMeters: Double?
    var distanceYards: Double?
    var holeNumber: Int?
    var confidence: Double?    // For auto-detection (0.0-1.0)
    var isManual: Bool

    /// Captured 100 Hz motion window (Phase 1+). Optional so older
    /// JSON shots (pre-Phase-1) decode fine.
    var motion: SwingMotionData?

    /// Heart-rate snapshot around the impact moment (Phase 1+).
    var heartRate: HeartRateData?
    
    /// Club group for backward compatibility and grouping
    var clubGroup: ClubGroup {
        club.group
    }
    
    /// Formatted distance string
    var formattedDistance: String? {
        guard let meters = distanceMeters, let yards = distanceYards else {
            return nil
        }
        return "\(Int(yards)) yds (\(Int(meters)) m)"
    }
    
    /// Short distance for compact display
    var shortDistance: String? {
        guard let yards = distanceYards else { return nil }
        return "\(Int(yards)) yds"
    }
    
    /// Time string for display
    var timeString: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: timestamp)
    }
    
    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        club: Club,
        startLocation: Coordinate? = nil,
        endLocation: Coordinate? = nil,
        holeNumber: Int? = nil,
        confidence: Double? = nil,
        isManual: Bool = true,
        heartRate: HeartRateData? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.club = club
        self.startLocation = startLocation
        self.endLocation = endLocation
        self.holeNumber = holeNumber
        self.confidence = confidence
        self.isManual = isManual
        self.heartRate = heartRate
        self.motion = nil
        
        // Calculate distances if both locations are available
        if let start = startLocation, let end = endLocation {
            self.distanceMeters = start.distance(to: end)
            self.distanceYards = (self.distanceMeters ?? 0) * 1.09361
        } else {
            self.distanceMeters = nil
            self.distanceYards = nil
        }
    }
    
    /// Update locations and recalculate distances
    mutating func updateLocations(start: Coordinate?, end: Coordinate?) {
        self.startLocation = start
        self.endLocation = end
        
        if let start = start, let end = end {
            self.distanceMeters = start.distance(to: end)
            self.distanceYards = (self.distanceMeters ?? 0) * 1.09361
        } else {
            self.distanceMeters = nil
            self.distanceYards = nil
        }
    }
}

// MARK: - Shot Event (Watch to Phone)

/// Lightweight shot event sent from watch to phone
/// Contains only essential data; location is added on phone
struct ShotEvent: Codable, Identifiable, Equatable {
    let id: UUID
    var timestamp: Date
    var club: Club
    var confidence: Double?
    var isManual: Bool
    var holeNumber: Int?
    var heartRate: HeartRateData?
    
    /// Club group for backward compatibility
    var clubGroup: ClubGroup {
        club.group
    }
    
    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        club: Club,
        confidence: Double? = nil,
        isManual: Bool = true,
        holeNumber: Int? = nil,
        heartRate: HeartRateData? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.club = club
        self.confidence = confidence
        self.isManual = isManual
        self.holeNumber = holeNumber
        self.heartRate = heartRate
    }
    
    /// Convert to full Shot (without location data)
    func toShot() -> Shot {
        Shot(
            id: id,
            timestamp: timestamp,
            club: club,
            holeNumber: holeNumber,
            confidence: confidence,
            isManual: isManual,
            heartRate: heartRate
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case timestamp
        case club
        case confidence
        case isManual
        case holeNumber
        case heartRate
        case heartRateData
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
        club = try container.decode(Club.self, forKey: .club)
        confidence = try container.decodeIfPresent(Double.self, forKey: .confidence)
        isManual = try container.decode(Bool.self, forKey: .isManual)
        holeNumber = try container.decodeIfPresent(Int.self, forKey: .holeNumber)
        heartRate = try container.decodeIfPresent(HeartRateData.self, forKey: .heartRate)
            ?? container.decodeIfPresent(HeartRateData.self, forKey: .heartRateData)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(club, forKey: .club)
        try container.encodeIfPresent(confidence, forKey: .confidence)
        try container.encode(isManual, forKey: .isManual)
        try container.encodeIfPresent(holeNumber, forKey: .holeNumber)
        try container.encodeIfPresent(heartRate, forKey: .heartRateData)
    }
}

// MARK: - Planned Shot

/// A planned shot for course strategy
struct PlannedShot: Codable, Identifiable, Equatable {
    let id: UUID
    var holeNumber: Int
    var order: Int                     // Shot order (1st, 2nd, etc.)
    var club: Club                     // Intended club
    var targetPosition: Coordinate     // Where to aim
    var startPosition: Coordinate?     // Where this shot starts (previous landing spot)
    var expectedDistance: Double?      // Expected distance in yards
    var notes: String?                 // Strategy notes
    
    init(
        id: UUID = UUID(),
        holeNumber: Int,
        order: Int,
        club: Club,
        targetPosition: Coordinate,
        startPosition: Coordinate? = nil,
        expectedDistance: Double? = nil,
        notes: String? = nil
    ) {
        self.id = id
        self.holeNumber = holeNumber
        self.order = order
        self.club = club
        self.targetPosition = targetPosition
        self.startPosition = startPosition
        self.expectedDistance = expectedDistance
        self.notes = notes
    }
    
    /// Formatted expected distance
    var formattedDistance: String? {
        guard let distance = expectedDistance else { return nil }
        return "\(Int(distance)) yds"
    }
}
