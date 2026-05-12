//
//  SmartCaddie.swift
//  StrikeLabCaddie
//
//  AI-powered club recommendation engine
//

import Foundation

/// A detailed club recommendation with reasoning
struct ClubRecommendation: Equatable {
    let club: Club
    let confidence: Double          // 0.0 - 1.0
    let reason: String              // Human-readable explanation
    let adjustedDistance: Double    // Distance accounting for conditions
    let alternates: [Club]          // Alternative club options
    let warnings: [String]          // Any warnings (wind, hazard, etc.)
    
    /// Confidence as display percentage
    var confidencePercent: Int {
        Int(confidence * 100)
    }
    
    /// Whether this is a high-confidence recommendation
    var isHighConfidence: Bool {
        confidence >= 0.8
    }
    
    /// Short reason for watch display
    var shortReason: String {
        if reason.count <= 25 {
            return reason
        }
        return String(reason.prefix(22)) + "..."
    }
}

/// Live biometric context for the on-course caddie. Phase 5 — when
/// supplied, the recommendation can warn the player to slow down, club
/// up, or take a breath because the player is outside their normal
/// envelope. Optional everywhere; if omitted, recommendations behave
/// exactly as they did before.
struct BiometricContext: Equatable {
    /// Most recent BPM reading from the watch.
    let currentBpm: Double
    /// Player's resting baseline (BPM).
    let restingBpm: Double
    /// Heart-rate-reserve ceiling (BPM). Default = 220 - age.
    let maxBpm: Double
    /// Tempo ratios from the player's last few swings on the round.
    let recentTempoRatios: [Double]
    /// Player's calm-baseline tempo ratio (from DNA).
    let baselineTempoRatio: Double?

    /// 0.0 (resting) … 1.0 (max). Drives the "elevated" branch.
    var hrFraction: Double {
        let reserve = max(1.0, maxBpm - restingBpm)
        return max(0, min(1, (currentBpm - restingBpm) / reserve))
    }

    /// True when the last 3 swings ran >10% faster than baseline AND
    /// HR is in the top 15% of reserve.
    var isUnderPressure: Bool {
        guard let baseline = baselineTempoRatio else { return false }
        let last3 = Array(recentTempoRatios.suffix(3))
        guard last3.count == 3 else { return false }
        let avg = last3.reduce(0, +) / Double(last3.count)
        return avg < baseline * 0.90 && hrFraction >= 0.85
    }
}

/// Input conditions for club recommendation
struct CaddieInput {
    let distanceToTarget: Double    // Yards
    let player: Player
    let weather: WeatherConditions?
    let targetBearing: Double?      // Degrees to target
    let lie: LieType?               // Ball lie (fairway, rough, etc.)
    let elevation: Double?          // Altitude in meters
    let isLayup: Bool               // Is this a layup shot?
    let hazardAhead: (distance: Double, type: HazardType)?
    /// Phase 5 — optional biometric snapshot. When present, the
    /// recommendation may add a "Take a breath" warning and bump the
    /// suggested club up half a bag.
    let biometric: BiometricContext?

    init(
        distanceToTarget: Double,
        player: Player,
        weather: WeatherConditions? = nil,
        targetBearing: Double? = nil,
        lie: LieType? = nil,
        elevation: Double? = nil,
        isLayup: Bool = false,
        hazardAhead: (distance: Double, type: HazardType)? = nil,
        biometric: BiometricContext? = nil
    ) {
        self.distanceToTarget = distanceToTarget
        self.player = player
        self.weather = weather
        self.targetBearing = targetBearing
        self.lie = lie
        self.elevation = elevation
        self.isLayup = isLayup
        self.hazardAhead = hazardAhead
        self.biometric = biometric
    }
}

/// Type of ball lie
enum LieType: String, Codable, CaseIterable {
    case tee = "Tee"
    case fairway = "Fairway"
    case firstCut = "First Cut"
    case rough = "Rough"
    case deepRough = "Deep Rough"
    case bunker = "Bunker"
    case hardpan = "Hardpan"
    
    /// Distance penalty factor (1.0 = no penalty)
    var distanceFactor: Double {
        switch self {
        case .tee, .fairway: return 1.0
        case .firstCut: return 0.95
        case .rough: return 0.85
        case .deepRough: return 0.70
        case .bunker: return 0.80
        case .hardpan: return 0.90
        }
    }
    
    /// Whether club selection is limited from this lie
    var limitedClubs: Bool {
        switch self {
        case .deepRough, .bunker: return true
        default: return false
        }
    }
}

/// Smart Caddie recommendation engine
class SmartCaddie {
    
    // MARK: - Main Recommendation
    
    /// Generate a club recommendation based on all factors
    static func recommendClub(input: CaddieInput) -> ClubRecommendation {
        var warnings: [String] = []
        
        // Step 1: Calculate effective distance (accounting for all factors)
        let effectiveDistance = calculateEffectiveDistance(input: input, warnings: &warnings)
        
        // Step 2: Find best club match from player's bag
        let clubMatch = findBestClub(
            for: effectiveDistance,
            player: input.player,
            lie: input.lie
        )
        
        // Step 3: Calculate confidence
        let confidence = calculateConfidence(
            clubMatch: clubMatch,
            effectiveDistance: effectiveDistance,
            input: input
        )
        
        // Step 4: Build reason string
        let reason = buildReason(
            club: clubMatch.club,
            effectiveDistance: effectiveDistance,
            originalDistance: input.distanceToTarget,
            input: input
        )
        
        // Step 5: Find alternatives
        let alternates = findAlternatives(
            primaryClub: clubMatch.club,
            effectiveDistance: effectiveDistance,
            player: input.player
        )
        
        // Step 6: Check for hazards
        if let hazard = input.hazardAhead {
            let clubDistance = input.player.averageDistance(for: clubMatch.club.rawValue) ?? 0
            if clubDistance > hazard.distance {
                warnings.append("\(hazard.type.rawValue) at \(Int(hazard.distance))y - consider layup")
            }
        }

        // Step 7 (Phase 5): biometric overlay. If the player is rushing
        // under elevated HR, bump the club up half a bag and add an
        // explicit calm-down warning to the reason chip.
        var biometricReason: String?
        var clubAfterBiometric = clubMatch.club
        if let bio = input.biometric, bio.isUnderPressure {
            // "Up half a bag": pick the next-lower-loft club from the
            // ordered alternates list when one is available.
            if let altClub = nextHigherClubBelow(current: clubMatch.club, in: alternates) {
                clubAfterBiometric = altClub
            }
            biometricReason = "Take a breath. HR's elevated and your last 3 swings ran fast — clubbed up half. "
            warnings.append("Pressure: HR \(Int(bio.currentBpm)) bpm")
        }

        let finalReason = (biometricReason ?? "") + reason

        return ClubRecommendation(
            club: clubAfterBiometric,
            confidence: confidence,
            reason: finalReason,
            adjustedDistance: effectiveDistance,
            alternates: alternates,
            warnings: warnings
        )
    }

    /// Pick a club from `alternates` that hits roughly half a bag longer
    /// than `current`. Used by the de-stressing overlay.
    private static func nextHigherClubBelow(current: Club, in alternates: [Club]) -> Club? {
        // alternates already sorted by closeness — find one that's
        // longer (lower loft) than current.
        let order: [Club] = [
            .driver, .wood3, .wood5, .wood7,
            .hybrid2, .hybrid3, .hybrid4, .hybrid5, .hybrid6,
            .iron3, .iron4, .iron5, .iron6, .iron7, .iron8, .iron9,
            .pitchingWedge, .gapWedge, .sandWedge, .lobWedge,
            .wedge50, .wedge52, .wedge54, .wedge56, .wedge58, .wedge60, .wedge64,
            .putter
        ]
        guard let idx = order.firstIndex(of: current), idx > 0 else { return nil }
        // Look for a club one slot up (less loft) that's also in the
        // player's alternates list — falls back to the immediate
        // neighbour if no alternate matches.
        let preferred = order[idx - 1]
        if alternates.contains(preferred) { return preferred }
        return preferred
    }
    
    // MARK: - Distance Calculation
    
    private static func calculateEffectiveDistance(input: CaddieInput, warnings: inout [String]) -> Double {
        var distance = input.distanceToTarget
        
        // Wind adjustment
        if let weather = input.weather, let bearing = input.targetBearing {
            let windAngle = (weather.windDirection - bearing) * .pi / 180
            let headwindComponent = cos(windAngle)
            let windEffect = -weather.windSpeedMph * headwindComponent * 0.8 * (distance / 150)
            
            if abs(windEffect) > 5 {
                if windEffect > 0 {
                    warnings.append("Tailwind: \(Int(abs(windEffect)))y help")
                } else {
                    warnings.append("Headwind: \(Int(abs(windEffect)))y into")
                }
            }
            
            // Note: We subtract wind effect because positive windEffect means tailwind (helps ball go farther)
            // So we need LESS club (shorter distance club)
            distance -= windEffect
        }
        
        // Temperature adjustment (ball flies less in cold)
        if let weather = input.weather {
            let tempDiff = weather.temperatureFahrenheit - 70
            let tempEffect = tempDiff * 0.2 * (distance / 150)
            distance -= tempEffect
            
            if weather.temperatureFahrenheit < 55 {
                warnings.append("Cold: ball won't travel as far")
            }
        }
        
        // Altitude adjustment (ball flies farther at altitude)
        if let altitude = input.elevation, altitude > 500 {
            let altitudeFeet = altitude * 3.28084
            let altitudeEffect = distance * (altitudeFeet / 1000) * 0.02
            distance -= altitudeEffect  // Need less club at altitude
        }
        
        // Lie adjustment (ball doesn't travel as far from rough)
        if let lie = input.lie, lie.distanceFactor < 1.0 {
            let liePenalty = distance * (1 - lie.distanceFactor)
            distance += liePenalty  // Need more club from bad lies
            
            if lie.limitedClubs {
                warnings.append("\(lie.rawValue): consider shorter club for control")
            }
        }
        
        return max(distance, 30)  // Minimum 30 yards
    }
    
    // MARK: - Club Selection
    
    private static func findBestClub(
        for distance: Double,
        player: Player,
        lie: LieType?
    ) -> (club: Club, avgDistance: Double, difference: Double) {
        var candidates: [(club: Club, avgDistance: Double, difference: Double)] = []
        
        for club in Club.allCases {
            // Skip putter for non-putting shots
            if club == .putter && distance > 30 { continue }
            
            // Skip long clubs from difficult lies
            if let lie = lie, lie.limitedClubs {
                if club.group == .driver || club.group == .wood || 
                   club == .hybrid2 || club == .hybrid3 ||
                   club == .iron3 || club == .iron4 {
                    continue
                }
            }
            
            guard let avgDistance = player.averageDistance(for: club.rawValue),
                  avgDistance > 0 else { continue }
            
            let difference = abs(avgDistance - distance)
            candidates.append((club, avgDistance, difference))
        }
        
        // Sort by closest match
        candidates.sort { $0.difference < $1.difference }
        
        // Return best match (or default to 7-iron)
        return candidates.first ?? (.iron7, 140, 0)
    }
    
    // MARK: - Confidence Calculation
    
    private static func calculateConfidence(
        clubMatch: (club: Club, avgDistance: Double, difference: Double),
        effectiveDistance: Double,
        input: CaddieInput
    ) -> Double {
        var confidence = 1.0
        
        // Distance match factor (closer = higher confidence)
        let distanceRatio = clubMatch.difference / max(effectiveDistance, 1)
        if distanceRatio > 0.15 {
            confidence -= min(distanceRatio, 0.4)
        }
        
        // Shot count factor (more data = higher confidence)
        let stats = input.player.clubDistances[clubMatch.club.rawValue]
        let shotCount = stats?.shotCount ?? 0
        if shotCount < 3 {
            confidence -= 0.2
        } else if shotCount < 10 {
            confidence -= 0.1
        }
        
        // Weather uncertainty
        if let weather = input.weather {
            if weather.windSpeedMph > 20 {
                confidence -= 0.15
            } else if weather.windSpeedMph > 10 {
                confidence -= 0.05
            }
        }
        
        // Lie uncertainty
        if let lie = input.lie, lie.limitedClubs {
            confidence -= 0.1
        }
        
        return max(confidence, 0.3)  // Minimum 30% confidence
    }
    
    // MARK: - Reason Building
    
    private static func buildReason(
        club: Club,
        effectiveDistance: Double,
        originalDistance: Double,
        input: CaddieInput
    ) -> String {
        let avgDistance = input.player.averageDistance(for: club.rawValue) ?? 0
        
        if abs(effectiveDistance - originalDistance) < 2 {
            // No significant adjustment
            return "You average \(Int(avgDistance))y with \(club.shortName)"
        } else if effectiveDistance > originalDistance {
            // Need more club
            let diff = Int(effectiveDistance - originalDistance)
            return "Playing \(Int(effectiveDistance))y (+\(diff) for conditions)"
        } else {
            // Need less club
            let diff = Int(originalDistance - effectiveDistance)
            return "Playing \(Int(effectiveDistance))y (-\(diff) for conditions)"
        }
    }
    
    // MARK: - Alternatives
    
    private static func findAlternatives(
        primaryClub: Club,
        effectiveDistance: Double,
        player: Player
    ) -> [Club] {
        var candidates: [(club: Club, difference: Double)] = []
        
        for club in Club.allCases {
            if club == primaryClub || club == .putter { continue }
            
            guard let avgDistance = player.averageDistance(for: club.rawValue),
                  avgDistance > 0 else { continue }
            
            let difference = abs(avgDistance - effectiveDistance)
            candidates.append((club, difference))
        }
        
        // Sort by distance and return top 2
        candidates.sort { $0.difference < $1.difference }
        return Array(candidates.prefix(2).map { $0.club })
    }
    
    // MARK: - Quick Suggestion (for Watch)
    
    /// Get a simple club suggestion for the watch display
    static func quickSuggestion(
        distance: Double,
        player: Player,
        windAdjustment: Double = 0
    ) -> (club: String, confidence: Int) {
        let effectiveDistance = distance - windAdjustment
        
        var bestClub: String = "7i"
        var smallestDiff = Double.infinity
        
        for (clubName, stats) in player.clubDistances {
            if clubName == "Putter" && distance > 30 { continue }
            
            let diff = abs(stats.averageDistance - effectiveDistance)
            if diff < smallestDiff {
                smallestDiff = diff
                bestClub = clubName
            }
        }
        
        // Calculate simple confidence
        let confidence: Int
        if smallestDiff < 5 {
            confidence = 95
        } else if smallestDiff < 10 {
            confidence = 85
        } else if smallestDiff < 15 {
            confidence = 70
        } else {
            confidence = 50
        }
        
        // Return short name
        if let club = Club.allCases.first(where: { $0.rawValue == bestClub }) {
            return (club.shortName, confidence)
        }
        
        return (bestClub, confidence)
    }
}

// MARK: - Smart Caddie Extensions

extension SmartCaddie {
    
    /// Analyze a player's bag for gaps and recommendations
    static func analyzeBag(player: Player, rounds: [Round]) -> BagAnalysis {
        // Round-level stats are computed lazily by the dashboard; here we
        // only need bag gap analysis.
        _ = RoundStatistics(rounds: rounds)

        // Find distance gaps
        let sorted = player.clubsByDistance
        var gaps: [(from: String, to: String, gap: Double)] = []
        
        for i in 0..<(sorted.count - 1) {
            let gap = sorted[i].distance - sorted[i + 1].distance
            if gap > 20 {
                gaps.append((sorted[i].club, sorted[i + 1].club, gap))
            }
        }
        
        // ClubPerformance / dispersion + trend metrics live on the (deferred)
        // Shot DNA pipeline; ship a gap-only BagAnalysis until that lands.
        return BagAnalysis(
            distanceGaps: gaps,
            mostConsistentClub: nil,
            leastConsistentClub: nil,
            improvingClubs: [],
            decliningClubs: []
        )
    }
}

extension ClubRecommendation {
    /// Short commit line for the Apple Watch caddie tile.
    func watchCommitPhrase(distanceYards: Int) -> String {
        let y = max(1, distanceYards)
        let short = club.shortName
        switch club.group {
        case .driver:
            return "Smooth \(short) — let \(y) go."
        case .wood, .hybrid:
            return "Quiet wrists — \(short) into the shot."
        case .iron:
            return "Stock \(short) — trust \(y) yards."
        case .wedge:
            return "Feel the distance — soft \(short)."
        case .putt:
            return "Roll it home."
        }
    }
}

/// Analysis of a player's bag
struct BagAnalysis {
    let distanceGaps: [(from: String, to: String, gap: Double)]
    let mostConsistentClub: Club?
    let leastConsistentClub: Club?
    let improvingClubs: [Club]
    let decliningClubs: [Club]
    
    var hasSignificantGaps: Bool {
        !distanceGaps.isEmpty
    }
    
    var recommendations: [String] {
        var recs: [String] = []
        
        for gap in distanceGaps {
            recs.append("Consider adding a club between \(gap.from) and \(gap.to) (\(Int(gap.gap))y gap)")
        }
        
        if let worst = leastConsistentClub {
            recs.append("Practice with \(worst.rawValue) to improve consistency")
        }
        
        return recs
    }
}
