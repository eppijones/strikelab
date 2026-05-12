//
//  PracticeSession.swift
//  StrikeLabCaddie
//
//  Practice/range session tracking model
//

import Foundation

/// Quality rating for a practice shot
enum ShotQuality: String, Codable, CaseIterable {
    case pure = "Pure"
    case good = "Good"
    case okay = "Okay"
    case miss = "Miss"
    
    var icon: String {
        switch self {
        case .pure: return "star.fill"
        case .good: return "checkmark.circle.fill"
        case .okay: return "minus.circle.fill"
        case .miss: return "xmark.circle.fill"
        }
    }
    
    var color: String {
        switch self {
        case .pure: return "neuralCyan"
        case .good: return "nordicSage"
        case .okay: return "champagne"
        case .miss: return "overPar"
        }
    }
    
    var points: Int {
        switch self {
        case .pure: return 4
        case .good: return 3
        case .okay: return 2
        case .miss: return 1
        }
    }
}

/// Type of miss for a shot
enum MissType: String, Codable, CaseIterable {
    case slice = "Slice"
    case hook = "Hook"
    case push = "Push"
    case pull = "Pull"
    case thin = "Thin"
    case fat = "Fat"
    case top = "Top"
    case shank = "Shank"
    
    var icon: String {
        switch self {
        case .slice: return "arrow.turn.up.right"
        case .hook: return "arrow.turn.up.left"
        case .push: return "arrow.right"
        case .pull: return "arrow.left"
        case .thin: return "arrow.up"
        case .fat: return "arrow.down"
        case .top: return "arrow.up.to.line"
        case .shank: return "arrow.uturn.right"
        }
    }
}

/// A single practice shot
struct PracticeShot: Codable, Identifiable, Equatable {
    let id: UUID
    let timestamp: Date
    var club: Club
    var estimatedDistance: Double?  // User-entered distance in yards
    var quality: ShotQuality
    var missType: MissType?
    var notes: String?

    /// Captured 100 Hz motion window (Phase 1+). Optional so older
    /// JSON shots (pre-Phase-1) decode fine.
    var motion: SwingMotionData?

    /// Heart-rate snapshot around the impact moment (Phase 1+).
    var heartRate: HeartRateData?

    /// Detection confidence preserved from the watch.
    var confidence: Double?

    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        club: Club,
        estimatedDistance: Double? = nil,
        quality: ShotQuality = .good,
        missType: MissType? = nil,
        notes: String? = nil,
        motion: SwingMotionData? = nil,
        heartRate: HeartRateData? = nil,
        confidence: Double? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.club = club
        self.estimatedDistance = estimatedDistance
        self.quality = quality
        self.missType = missType
        self.notes = notes
        self.motion = motion
        self.heartRate = heartRate
        self.confidence = confidence
    }
}

/// Topgolf bay-data hook. Populated when we import a TG session via the
/// Topgolf web export later. Optional so existing saved sessions decode
/// fine without it.
struct TopgolfBayData: Codable, Equatable {
    var bay: String?
    var venue: String?
    var totalShots: Int?
    var avgBallSpeedMph: Double?
    var longestYards: Double?
    var sourceURL: String?      // Topgolf share link for traceability
    var importedAt: Date?
}

/// A practice session (driving range, putting green, etc.)
struct PracticeSession: Codable, Identifiable, Equatable {
    let id: UUID
    let startTime: Date
    var endTime: Date?
    var shots: [PracticeShot]
    var focusClub: Club?
    var notes: String?
    var location: String?
    /// Topgolf data — set when the user imports a Topgolf share link
    /// for a session that overlaps with this one.
    var topgolf: TopgolfBayData?
    
    init(
        id: UUID = UUID(),
        startTime: Date = Date(),
        endTime: Date? = nil,
        shots: [PracticeShot] = [],
        focusClub: Club? = nil,
        notes: String? = nil,
        location: String? = nil
    ) {
        self.id = id
        self.startTime = startTime
        self.endTime = endTime
        self.shots = shots
        self.focusClub = focusClub
        self.notes = notes
        self.location = location
    }
    
    // MARK: - Computed Properties
    
    /// Session duration
    var duration: TimeInterval {
        (endTime ?? Date()).timeIntervalSince(startTime)
    }
    
    /// Formatted duration string
    var formattedDuration: String {
        let minutes = Int(duration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours)h \(mins)m"
        }
    }
    
    /// Total shots in session
    var totalShots: Int {
        shots.count
    }
    
    /// Average quality score (1-4)
    var averageQuality: Double {
        guard !shots.isEmpty else { return 0 }
        let total = shots.reduce(0) { $0 + $1.quality.points }
        return Double(total) / Double(shots.count)
    }
    
    /// Quality percentage (percentage of pure + good shots)
    var qualityPercentage: Double {
        guard !shots.isEmpty else { return 0 }
        let goodShots = shots.filter { $0.quality == .pure || $0.quality == .good }.count
        return Double(goodShots) / Double(shots.count) * 100
    }
    
    /// Quality distribution
    var qualityDistribution: [ShotQuality: Int] {
        var dist: [ShotQuality: Int] = [:]
        for quality in ShotQuality.allCases {
            dist[quality] = shots.filter { $0.quality == quality }.count
        }
        return dist
    }
    
    /// Most common miss type
    var mostCommonMiss: MissType? {
        let misses = shots.compactMap { $0.missType }
        guard !misses.isEmpty else { return nil }
        
        var counts: [MissType: Int] = [:]
        for miss in misses {
            counts[miss, default: 0] += 1
        }
        
        return counts.max(by: { $0.value < $1.value })?.key
    }
    
    /// Shots grouped by club
    var shotsByClub: [Club: [PracticeShot]] {
        Dictionary(grouping: shots, by: { $0.club })
    }
    
    /// Club with most shots
    var mostPracticedClub: Club? {
        shotsByClub.max(by: { $0.value.count < $1.value.count })?.key
    }
    
    /// Whether session is active (not ended)
    var isActive: Bool {
        endTime == nil
    }
    
    /// Date string for display
    var dateString: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: startTime)
    }
    
    // MARK: - Methods
    
    /// Add a shot to the session
    mutating func addShot(_ shot: PracticeShot) {
        shots.append(shot)
    }
    
    /// Remove last shot
    mutating func removeLastShot() -> PracticeShot? {
        shots.popLast()
    }
    
    /// End the session
    mutating func end() {
        endTime = Date()
    }
}

struct CaptureCompleteness: Equatable {
    let total: Int
    let withMotion: Int
    let withHeartRate: Int
    let withAudio: Int

    var motionPercent: Int {
        guard total > 0 else { return 0 }
        return Int((Double(withMotion) / Double(total) * 100).rounded())
    }

    var summary: String {
        "\(withMotion)/\(total) motion · \(withHeartRate) HR · \(withAudio) audio"
    }
}

// MARK: - Practice Statistics

/// Aggregate statistics from practice sessions
struct PracticeStatistics {
    let sessions: [PracticeSession]
    
    /// Total sessions
    var totalSessions: Int {
        sessions.count
    }
    
    /// Total practice time
    var totalTime: TimeInterval {
        sessions.reduce(0) { $0 + $1.duration }
    }
    
    /// Formatted total time
    var formattedTotalTime: String {
        let hours = Int(totalTime / 3600)
        let minutes = Int((totalTime.truncatingRemainder(dividingBy: 3600)) / 60)
        return "\(hours)h \(minutes)m"
    }
    
    /// Total shots across all sessions
    var totalShots: Int {
        sessions.reduce(0) { $0 + $1.totalShots }
    }
    
    /// Average session duration
    var averageSessionDuration: TimeInterval {
        guard !sessions.isEmpty else { return 0 }
        return totalTime / Double(sessions.count)
    }
    
    /// Overall quality percentage
    var overallQualityPercentage: Double {
        let allShots = sessions.flatMap { $0.shots }
        guard !allShots.isEmpty else { return 0 }
        let goodShots = allShots.filter { $0.quality == .pure || $0.quality == .good }.count
        return Double(goodShots) / Double(allShots.count) * 100
    }
    
    /// Most practiced club overall
    var mostPracticedClub: Club? {
        let allShots = sessions.flatMap { $0.shots }
        var counts: [Club: Int] = [:]
        for shot in allShots {
            counts[shot.club, default: 0] += 1
        }
        return counts.max(by: { $0.value < $1.value })?.key
    }
    
    /// Recent sessions (last 7 days)
    var recentSessions: [PracticeSession] {
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return sessions.filter { $0.startTime >= weekAgo }
    }
}
