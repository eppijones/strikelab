//
//  RoundStatistics.swift
//  StrikeLabCaddie
//
//  Aggregate statistics calculator for rounds
//

import Foundation

/// Calculates aggregate statistics from saved rounds
struct RoundStatistics {
    let rounds: [Round]
    
    // MARK: - Filtered Rounds
    
    /// Only complete 18-hole rounds
    var completedRounds: [Round] {
        rounds.filter { $0.holesCompleted == 18 }
    }
    
    var roundCount: Int {
        rounds.count
    }
    
    var completedRoundCount: Int {
        completedRounds.count
    }
    
    // MARK: - Scoring Statistics
    
    /// Average gross score (18-hole rounds only)
    var averageGrossScore: Double? {
        guard !completedRounds.isEmpty else { return nil }
        let total = completedRounds.reduce(0) { $0 + $1.grossTotal }
        return Double(total) / Double(completedRounds.count)
    }
    
    /// Average net score (18-hole rounds only)
    var averageNetScore: Double? {
        guard !completedRounds.isEmpty else { return nil }
        let total = completedRounds.reduce(0) { $0 + $1.netTotal }
        return Double(total) / Double(completedRounds.count)
    }
    
    /// Best gross score
    var bestGrossScore: Int? {
        completedRounds.min(by: { $0.grossTotal < $1.grossTotal })?.grossTotal
    }
    
    /// Worst gross score
    var worstGrossScore: Int? {
        completedRounds.max(by: { $0.grossTotal < $1.grossTotal })?.grossTotal
    }
    
    /// Best net score
    var bestNetScore: Int? {
        completedRounds.min(by: { $0.netTotal < $1.netTotal })?.netTotal
    }
    
    // MARK: - Putting Statistics
    
    /// Average putts per round
    var averagePuttsPerRound: Double? {
        guard !completedRounds.isEmpty else { return nil }
        let total = completedRounds.reduce(0) { $0 + $1.totalPutts }
        return Double(total) / Double(completedRounds.count)
    }
    
    /// Average putts per hole
    var averagePuttsPerHole: Double? {
        let allHoles = rounds.flatMap { $0.holes.filter { $0.putts != nil } }
        guard !allHoles.isEmpty else { return nil }
        let total = allHoles.compactMap { $0.putts }.reduce(0, +)
        return Double(total) / Double(allHoles.count)
    }
    
    // MARK: - GIR Statistics
    
    /// Greens in Regulation percentage
    var girPercentage: Double? {
        let allHoles = rounds.flatMap { $0.holes.filter { $0.greenInRegulation != nil } }
        guard !allHoles.isEmpty else { return nil }
        let girCount = allHoles.filter { $0.greenInRegulation == true }.count
        return Double(girCount) / Double(allHoles.count) * 100
    }
    
    /// Total GIR count
    var girCount: Int {
        rounds.flatMap { $0.holes.filter { $0.greenInRegulation == true } }.count
    }
    
    /// Total holes with GIR data
    var holesWithGIRData: Int {
        rounds.flatMap { $0.holes.filter { $0.greenInRegulation != nil } }.count
    }
    
    // MARK: - Fairway Statistics
    
    /// Fairways hit percentage (excludes par 3s)
    var fairwayPercentage: Double? {
        let eligibleHoles = rounds.flatMap { $0.holes.filter { $0.par > 3 && $0.fairwayHit != nil } }
        guard !eligibleHoles.isEmpty else { return nil }
        let hitCount = eligibleHoles.filter { $0.fairwayHit == true }.count
        return Double(hitCount) / Double(eligibleHoles.count) * 100
    }
    
    /// Total fairways hit
    var fairwaysHit: Int {
        rounds.flatMap { $0.holes.filter { $0.par > 3 && $0.fairwayHit == true } }.count
    }
    
    /// Total par 4/5 holes with fairway data
    var holesWithFairwayData: Int {
        rounds.flatMap { $0.holes.filter { $0.par > 3 && $0.fairwayHit != nil } }.count
    }
    
    // MARK: - Par-based Statistics
    
    /// Average score on par 3s
    var averagePar3Score: Double? {
        let par3Holes = rounds.flatMap { $0.holes.filter { $0.par == 3 && $0.grossStrokes != nil } }
        guard !par3Holes.isEmpty else { return nil }
        let total = par3Holes.compactMap { $0.grossStrokes }.reduce(0, +)
        return Double(total) / Double(par3Holes.count)
    }
    
    /// Average score on par 4s
    var averagePar4Score: Double? {
        let par4Holes = rounds.flatMap { $0.holes.filter { $0.par == 4 && $0.grossStrokes != nil } }
        guard !par4Holes.isEmpty else { return nil }
        let total = par4Holes.compactMap { $0.grossStrokes }.reduce(0, +)
        return Double(total) / Double(par4Holes.count)
    }
    
    /// Average score on par 5s
    var averagePar5Score: Double? {
        let par5Holes = rounds.flatMap { $0.holes.filter { $0.par == 5 && $0.grossStrokes != nil } }
        guard !par5Holes.isEmpty else { return nil }
        let total = par5Holes.compactMap { $0.grossStrokes }.reduce(0, +)
        return Double(total) / Double(par5Holes.count)
    }
    
    // MARK: - Score Distribution
    
    /// Count of each score type across all rounds
    var scoreDistribution: ScoreDistribution {
        var dist = ScoreDistribution()
        
        for round in rounds {
            for hole in round.holes where hole.grossStrokes != nil {
                guard let diff = hole.scoreToPar else { continue }
                switch diff {
                case ...(-2): dist.eagleOrBetter += 1
                case -1: dist.birdies += 1
                case 0: dist.pars += 1
                case 1: dist.bogeys += 1
                case 2: dist.doubleBogeys += 1
                default: dist.tripleOrWorse += 1
                }
            }
        }
        
        return dist
    }
    
    /// Total holes played
    var totalHolesPlayed: Int {
        rounds.reduce(0) { $0 + $1.holesCompleted }
    }
    
    // MARK: - Trends
    
    /// Recent 5 rounds gross scores for trend
    var recentScores: [Int] {
        Array(completedRounds.prefix(5).map { $0.grossTotal })
    }
    
    /// Score trend direction
    var scoreTrend: Trend {
        guard recentScores.count >= 2 else { return .neutral }
        let recent = recentScores.prefix(2).reduce(0, +) / 2
        let previous = recentScores.suffix(from: min(2, recentScores.count)).prefix(2)
        guard !previous.isEmpty else { return .neutral }
        let prevAvg = previous.reduce(0, +) / previous.count
        
        if recent < prevAvg {
            return .improving
        } else if recent > prevAvg {
            return .declining
        }
        return .neutral
    }
    
    // MARK: - Club Distance Statistics
    
    /// All shots from all rounds
    var allShots: [Shot] {
        rounds.flatMap { $0.shots }
    }
    
    /// Shots with tracked distance
    var shotsWithDistance: [Shot] {
        allShots.filter { $0.distanceYards != nil }
    }
    
    /// Get average distance for a specific club
    func averageDistance(for club: Club) -> Double? {
        let clubShots = shotsWithDistance.filter { $0.club == club }
        guard !clubShots.isEmpty else { return nil }
        let totalYards = clubShots.compactMap { $0.distanceYards }.reduce(0, +)
        return totalYards / Double(clubShots.count)
    }
    
    /// Get shot count for a specific club
    func shotCount(for club: Club) -> Int {
        shotsWithDistance.filter { $0.club == club }.count
    }
    
    /// Get longest shot for a specific club
    func longestShot(for club: Club) -> Double? {
        shotsWithDistance
            .filter { $0.club == club }
            .compactMap { $0.distanceYards }
            .max()
    }
    
    /// Get club distance stats for all clubs with data
    var clubDistanceStats: [ClubDistanceStat] {
        var stats: [ClubDistanceStat] = []
        
        for club in Club.allCases {
            let count = shotCount(for: club)
            if count > 0, let avg = averageDistance(for: club), let longest = longestShot(for: club) {
                stats.append(ClubDistanceStat(
                    club: club,
                    averageDistance: avg,
                    longestDistance: longest,
                    shotCount: count
                ))
            }
        }
        
        // Sort by average distance (longest first)
        return stats.sorted { $0.averageDistance > $1.averageDistance }
    }
}

// MARK: - Supporting Types

struct ScoreDistribution {
    var eagleOrBetter: Int = 0
    var birdies: Int = 0
    var pars: Int = 0
    var bogeys: Int = 0
    var doubleBogeys: Int = 0
    var tripleOrWorse: Int = 0
    
    var total: Int {
        eagleOrBetter + birdies + pars + bogeys + doubleBogeys + tripleOrWorse
    }
}

struct ClubDistanceStat: Identifiable {
    let club: Club
    let averageDistance: Double
    let longestDistance: Double
    let shotCount: Int
    
    var id: String { club.id }
}

enum Trend {
    case improving
    case declining
    case neutral
    
    var icon: String {
        switch self {
        case .improving: return "arrow.down.right"
        case .declining: return "arrow.up.right"
        case .neutral: return "minus"
        }
    }
    
    var label: String {
        switch self {
        case .improving: return "Improving"
        case .declining: return "Needs Work"
        case .neutral: return "Steady"
        }
    }
}
