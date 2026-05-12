//
//  Player.swift
//  StrikeLabCaddie
//
//  Player profile model
//

import Foundation

/// Statistics for a specific club
struct ClubStats: Codable, Equatable {
    var averageDistance: Double    // in yards
    var shotCount: Int
    var totalDistance: Double      // for recalculating average
    
    init(averageDistance: Double = 0, shotCount: Int = 0, totalDistance: Double = 0) {
        self.averageDistance = averageDistance
        self.shotCount = shotCount
        self.totalDistance = totalDistance
    }
    
    /// Update stats with a new shot distance
    mutating func addShot(distance: Double) {
        shotCount += 1
        totalDistance += distance
        averageDistance = totalDistance / Double(shotCount)
    }
}

/// Per-club calibrated regression. Maps a player's measured hand speed
/// (mph) to expected carry (yards). Phase 4 fits this from a 5-shot
/// calibration session and from on-course GPS-validated shots; the
/// Swing Card surfaces "Estimated carry 154 yds (±6)" based on `sigma`.
struct ClubModel: Codable, Equatable {
    /// Slope: extra yards per mph of hand speed.
    var alpha: Double
    /// Intercept (yards).
    var gamma: Double
    /// Residual standard deviation (yards). Used as the ± uncertainty
    /// band shown on the Swing Card and as the gating signal for which
    /// shots are tight enough to use as auto-calibration points.
    var sigma: Double
    /// How many shots were used to fit this model. <5 → flagged as
    /// "still learning" in the UI.
    var sampleCount: Int
    /// Median hand speed (mph) seen during calibration. Used by the
    /// caddie when comparing today's swings to the player's baseline.
    var medianHandMph: Double

    /// Predicted carry (yards) for a given hand speed (mph).
    func predictCarry(handMph: Double) -> Double {
        alpha * handMph + gamma
    }
}

/// Persona drives the StrikeLab UX surface area. Mirrors the
/// `users.persona` column on the backend so the iPhone caddie can
/// match the home / coach / shell tone of voice. Defaults to
/// `.improver` so existing player JSON decodes cleanly.
enum PlayerPersona: String, Codable, Equatable, CaseIterable {
    case beginner
    case improver
    case performance
}

/// Represents a golfer with their handicap information and club statistics
struct Player: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var handicapIndex: Double  // World Handicap System index (e.g., 11.5)
    var clubDistances: [String: ClubStats]  // Club rawValue -> stats

    /// Per-club regression models from Phase 4 calibration. Keyed by
    /// `Club.rawValue` for parity with `clubDistances`. Optional so old
    /// player JSON decodes cleanly.
    var clubModels: [String: ClubModel] = [:]

    /// Per-club personal swing windows (median ± spread). Keyed by
    /// `Club.rawValue`. Optional so older player JSON decodes cleanly.
    var personalWindows: [String: PersonalWindow] = [:]

    /// Lead-arm length (m). Used by SwingAnalytics to convert peak
    /// rotation rate into hand speed. Defaults to 0.70 m.
    var armLengthMeters: Double = 0.70

    /// Player age — used for HR-max in the pressure index.
    var ageYears: Int = 35

    /// Persona — beginner / improver / performance. Mirrors the web
    /// account's `persona` so this caddie speaks the right voice.
    var persona: PlayerPersona = .improver

    /// Backend course UUID for the player's primary course. Drives
    /// "Open Alenda GC" shortcuts and tee-time suggestions. Stored as
    /// String so older player JSON without this key still decodes.
    var homeClubId: String? = nil

    /// Default player for initial setup
    static let defaultPlayer = Player(
        id: UUID(),
        name: "Espen Horne",
        handicapIndex: 11.5,
        clubDistances: Player.defaultClubDistances
    )

    /// Create a new player
    init(id: UUID = UUID(),
         name: String,
         handicapIndex: Double,
         clubDistances: [String: ClubStats] = [:],
         clubModels: [String: ClubModel] = [:],
         personalWindows: [String: PersonalWindow] = [:],
         armLengthMeters: Double = 0.70,
         ageYears: Int = 35,
         persona: PlayerPersona = .improver,
         homeClubId: String? = nil) {
        self.id = id
        self.name = name
        self.handicapIndex = handicapIndex
        self.clubDistances = clubDistances.isEmpty ? Player.defaultClubDistances : clubDistances
        self.clubModels = clubModels
        self.personalWindows = personalWindows
        self.armLengthMeters = armLengthMeters
        self.ageYears = ageYears
        self.persona = persona
        self.homeClubId = homeClubId
    }

    // MARK: - Codable

    private enum CodingKeys: String, CodingKey {
        case id, name, handicapIndex, clubDistances, clubModels, personalWindows
        case armLengthMeters, ageYears, persona, homeClubId
    }

    /// Custom decoder so older player JSON (no persona / homeClubId)
    /// still loads — both keys fall back to sensible defaults.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(UUID.self, forKey: .id)
        self.name = try c.decode(String.self, forKey: .name)
        self.handicapIndex = try c.decode(Double.self, forKey: .handicapIndex)
        self.clubDistances = try c.decodeIfPresent([String: ClubStats].self, forKey: .clubDistances)
            ?? Player.defaultClubDistances
        self.clubModels = try c.decodeIfPresent([String: ClubModel].self, forKey: .clubModels) ?? [:]
        self.personalWindows = try c.decodeIfPresent([String: PersonalWindow].self, forKey: .personalWindows) ?? [:]
        self.armLengthMeters = try c.decodeIfPresent(Double.self, forKey: .armLengthMeters) ?? 0.70
        self.ageYears = try c.decodeIfPresent(Int.self, forKey: .ageYears) ?? 35
        self.persona = try c.decodeIfPresent(PlayerPersona.self, forKey: .persona) ?? .improver
        self.homeClubId = try c.decodeIfPresent(String.self, forKey: .homeClubId)
    }
    
    /// Default club distances (typical amateur golfer)
    static var defaultClubDistances: [String: ClubStats] {
        [
            "Driver": ClubStats(averageDistance: 220, shotCount: 0, totalDistance: 0),
            "3 Wood": ClubStats(averageDistance: 200, shotCount: 0, totalDistance: 0),
            "5 Wood": ClubStats(averageDistance: 185, shotCount: 0, totalDistance: 0),
            "7 Wood": ClubStats(averageDistance: 175, shotCount: 0, totalDistance: 0),
            "2 Hybrid": ClubStats(averageDistance: 195, shotCount: 0, totalDistance: 0),
            "3 Hybrid": ClubStats(averageDistance: 185, shotCount: 0, totalDistance: 0),
            "4 Hybrid": ClubStats(averageDistance: 175, shotCount: 0, totalDistance: 0),
            "5 Hybrid": ClubStats(averageDistance: 165, shotCount: 0, totalDistance: 0),
            "6 Hybrid": ClubStats(averageDistance: 155, shotCount: 0, totalDistance: 0),
            "3 Iron": ClubStats(averageDistance: 180, shotCount: 0, totalDistance: 0),
            "4 Iron": ClubStats(averageDistance: 170, shotCount: 0, totalDistance: 0),
            "5 Iron": ClubStats(averageDistance: 160, shotCount: 0, totalDistance: 0),
            "6 Iron": ClubStats(averageDistance: 150, shotCount: 0, totalDistance: 0),
            "7 Iron": ClubStats(averageDistance: 140, shotCount: 0, totalDistance: 0),
            "8 Iron": ClubStats(averageDistance: 130, shotCount: 0, totalDistance: 0),
            "9 Iron": ClubStats(averageDistance: 120, shotCount: 0, totalDistance: 0),
            "PW": ClubStats(averageDistance: 110, shotCount: 0, totalDistance: 0),
            "GW": ClubStats(averageDistance: 100, shotCount: 0, totalDistance: 0),
            "SW": ClubStats(averageDistance: 90, shotCount: 0, totalDistance: 0),
            "LW": ClubStats(averageDistance: 70, shotCount: 0, totalDistance: 0),
            "50°": ClubStats(averageDistance: 105, shotCount: 0, totalDistance: 0),
            "52°": ClubStats(averageDistance: 100, shotCount: 0, totalDistance: 0),
            "54°": ClubStats(averageDistance: 95, shotCount: 0, totalDistance: 0),
            "56°": ClubStats(averageDistance: 85, shotCount: 0, totalDistance: 0),
            "58°": ClubStats(averageDistance: 75, shotCount: 0, totalDistance: 0),
            "60°": ClubStats(averageDistance: 65, shotCount: 0, totalDistance: 0),
            "64°": ClubStats(averageDistance: 50, shotCount: 0, totalDistance: 0),
            "Putter": ClubStats(averageDistance: 0, shotCount: 0, totalDistance: 0)
        ]
    }
    
    /// Get average distance for a club
    func averageDistance(for clubName: String) -> Double? {
        clubDistances[clubName]?.averageDistance
    }
    
    /// Suggest the best club for a given distance
    func suggestedClub(forDistance distance: Double) -> String? {
        // Don't suggest for very short distances (putting range)
        guard distance > 30 else { return "Putter" }
        
        // Find the club with the closest average distance
        var bestClub: String?
        var smallestDifference = Double.infinity
        
        for (clubName, stats) in clubDistances {
            // Skip putter for distance shots
            if clubName == "Putter" { continue }
            
            let difference = abs(stats.averageDistance - distance)
            if difference < smallestDifference {
                smallestDifference = difference
                bestClub = clubName
            }
        }
        
        return bestClub
    }
    
    /// Suggest the best club accounting for weather conditions
    func suggestedClub(forDistance distance: Double, withAdjustment adjustment: Double) -> ClubSuggestion? {
        // Don't suggest for very short distances (putting range)
        guard distance > 30 else {
            return ClubSuggestion(club: "Putter", confidence: 1.0, reason: "Putting distance", alternatives: [])
        }
        
        // Calculate adjusted distance (what distance club should we hit?)
        // If headwind (+adjustment), we need to hit MORE club (one that goes farther)
        // If tailwind (-adjustment), we need to hit LESS club
        let effectiveDistance = distance - adjustment  // Distance club needs to cover
        
        // Find clubs and their fit
        var candidates: [(club: String, distance: Double, difference: Double)] = []
        
        for (clubName, stats) in clubDistances {
            if clubName == "Putter" { continue }
            let difference = abs(stats.averageDistance - effectiveDistance)
            candidates.append((clubName, stats.averageDistance, difference))
        }
        
        // Sort by how close they are to target
        candidates.sort { $0.difference < $1.difference }
        
        guard let best = candidates.first else { return nil }
        
        // Calculate confidence based on how close the match is
        let confidence: Double = {
            if best.difference < 5 { return 1.0 }
            if best.difference < 10 { return 0.9 }
            if best.difference < 15 { return 0.7 }
            return 0.5
        }()
        
        // Build reason string
        let reason: String = {
            if abs(adjustment) < 1 {
                return "You average \(Int(best.distance))y with this club"
            } else if adjustment > 0 {
                return "Adjusted +\(Int(adjustment))y for conditions"
            } else {
                return "Adjusted \(Int(adjustment))y for conditions"
            }
        }()
        
        // Get alternatives (next 2 closest clubs)
        let alternatives = Array(candidates.dropFirst().prefix(2).map { $0.club })
        
        return ClubSuggestion(
            club: best.club,
            confidence: confidence,
            reason: reason,
            alternatives: alternatives
        )
    }
    
    /// Get all clubs sorted by distance (for gap analysis)
    var clubsByDistance: [(club: String, distance: Double)] {
        clubDistances
            .filter { $0.key != "Putter" && $0.value.averageDistance > 0 }
            .map { ($0.key, $0.value.averageDistance) }
            .sorted { $0.1 > $1.1 }
    }
    
    /// Find distance gaps in the bag
    var distanceGaps: [(from: String, to: String, gap: Double)] {
        let sorted = clubsByDistance
        var gaps: [(from: String, to: String, gap: Double)] = []
        
        for i in 0..<(sorted.count - 1) {
            let gap = sorted[i].distance - sorted[i + 1].distance
            if gap > 20 {  // Significant gap
                gaps.append((sorted[i].club, sorted[i + 1].club, gap))
            }
        }
        
        return gaps
    }
}

/// Club suggestion with confidence and reasoning
struct ClubSuggestion: Equatable {
    let club: String
    let confidence: Double      // 0.0 - 1.0
    let reason: String
    let alternatives: [String]
    
    /// Confidence as display percentage
    var confidencePercent: Int {
        Int(confidence * 100)
    }
    
    /// Whether suggestion has high confidence
    var isHighConfidence: Bool {
        confidence >= 0.8
    }
}

// MARK: - Player mutation helpers

extension Player {
    /// Update club stats with a new shot.
    mutating func updateClubStats(clubName: String, distance: Double) {
        var stats = clubDistances[clubName] ?? ClubStats()
        stats.addShot(distance: distance)
        clubDistances[clubName] = stats
    }
}

// MARK: - Handicap Display

extension Player {
    /// Formatted handicap string (e.g., "+2.3" or "11.5")
    var formattedHandicap: String {
        if handicapIndex < 0 {
            return String(format: "+%.1f", abs(handicapIndex))
        } else {
            return String(format: "%.1f", handicapIndex)
        }
    }
    
    /// Handicap category description
    var handicapCategory: String {
        switch handicapIndex {
        case ..<0:
            return "Plus Handicap"
        case 0..<5:
            return "Scratch"
        case 5..<10:
            return "Low"
        case 10..<18:
            return "Mid"
        case 18..<28:
            return "High"
        default:
            return "Beginner"
        }
    }
}
