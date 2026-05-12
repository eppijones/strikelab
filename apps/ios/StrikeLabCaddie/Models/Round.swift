//
//  Round.swift
//  StrikeLabCaddie
//
//  Round and hole score models
//

import Foundation

/// Represents a complete round of golf
/// Which holes the player intends to play. Defaults to the full 18 but
/// many casual rounds (especially weekday evenings on a 9-hole course
/// like Groruddalen) are just one nine. Drives every hole filter
/// across the app.
enum PlayFormat: String, Codable, CaseIterable {
    case full18 = "full18"
    case front9 = "front9"
    case back9 = "back9"

    var displayName: String {
        switch self {
        case .full18: return "Full 18"
        case .front9: return "Front 9"
        case .back9:  return "Back 9"
        }
    }

    var shortLabel: String {
        switch self {
        case .full18: return "18"
        case .front9: return "F9"
        case .back9:  return "B9"
        }
    }

    /// Inclusive hole-number range that the player intends to play.
    var holeRange: ClosedRange<Int> {
        switch self {
        case .full18: return 1...18
        case .front9: return 1...9
        case .back9:  return 10...18
        }
    }

    var totalHoles: Int { holeRange.count }
}

struct Round: Codable, Identifiable, Equatable {
    let id: UUID
    var date: Date                  // When the round was started
    var completedAt: Date?          // When the round was marked complete
    var course: Course
    var selectedTee: Tee?
    var player: Player
    var holes: [RoundHole]          // 18 holes with scores
    var shots: [Shot]               // All tracked shots
    var plannedShots: [PlannedShot] // Planned strategy shots
    var isComplete: Bool
    var currentHoleNumber: Int      // 1-18, tracks which hole player is on
    /// Optional in storage so older saved rounds (before PlayFormat
    /// existed) decode without a custom init. Read via `playFormat`.
    var playFormatRaw: PlayFormat?

    /// Effective play format — defaults to Full 18 when not set.
    var playFormat: PlayFormat {
        get { playFormatRaw ?? .full18 }
        set { playFormatRaw = newValue }
    }

    /// Holes that fall inside the chosen play format. All scoring stats
    /// should reduce over this collection, not the raw 18-hole array.
    var playedHoles: [RoundHole] {
        let range = playFormat.holeRange
        return holes.filter { range.contains($0.holeNumber) }
    }
    
    // MARK: - Computed Properties
    
    /// Course handicap based on selected tee and player handicap
    var courseHandicap: Int? {
        guard let tee = selectedTee,
              let slope = tee.slope,
              let rating = tee.courseRating,
              let par = tee.par else {
            return nil
        }
        return HandicapCalculator.courseHandicap(
            handicapIndex: player.handicapIndex,
            slope: slope,
            courseRating: rating,
            par: par
        )
    }
    
    /// Total gross strokes (only across the chosen play format)
    var grossTotal: Int {
        playedHoles.compactMap { $0.grossStrokes }.reduce(0, +)
    }

    /// Total net strokes (only across the chosen play format)
    var netTotal: Int {
        playedHoles.compactMap { $0.netStrokes }.reduce(0, +)
    }
    
    /// Front 9 gross
    var front9Gross: Int {
        holes.prefix(9).compactMap { $0.grossStrokes }.reduce(0, +)
    }
    
    /// Back 9 gross
    var back9Gross: Int {
        holes.suffix(9).compactMap { $0.grossStrokes }.reduce(0, +)
    }
    
    /// Front 9 net
    var front9Net: Int {
        holes.prefix(9).compactMap { $0.netStrokes }.reduce(0, +)
    }
    
    /// Back 9 net
    var back9Net: Int {
        holes.suffix(9).compactMap { $0.netStrokes }.reduce(0, +)
    }
    
    /// Number of holes completed inside the chosen play format
    var holesCompleted: Int {
        playedHoles.filter { ($0.grossStrokes ?? 0) > 0 }.count
    }

    /// Over/under par for gross score
    var grossOverUnder: Int {
        let completedPar = playedHoles.filter { ($0.grossStrokes ?? 0) > 0 }.reduce(0) { $0 + $1.par }
        return grossTotal - completedPar
    }
    
    /// Formatted over/under string
    var formattedOverUnder: String {
        if grossOverUnder == 0 {
            return "E"
        } else if grossOverUnder > 0 {
            return "+\(grossOverUnder)"
        } else {
            return "\(grossOverUnder)"
        }
    }
    
    /// Total putts across the chosen play format
    var totalPutts: Int {
        playedHoles.compactMap { $0.putts }.reduce(0, +)
    }

    /// Round elapsed time from start to completion (or now, if still in
    /// progress). Returns nil if the round has just started.
    var elapsed: TimeInterval {
        let end = completedAt ?? Date()
        return max(0, end.timeIntervalSince(date))
    }

    /// Average minutes per played hole — useful pace-of-play metric.
    var paceMinutesPerHole: Double? {
        guard holesCompleted > 0 else { return nil }
        return elapsed / Double(holesCompleted) / 60.0
    }

    /// Formatted "h:mm" elapsed time.
    var formattedElapsed: String {
        let total = Int(elapsed)
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
    
    // MARK: - Initialization
    
    init(
        id: UUID = UUID(),
        date: Date = Date(),
        course: Course,
        selectedTee: Tee? = nil,
        player: Player
    ) {
        self.id = id
        self.date = date
        self.course = course
        self.selectedTee = selectedTee
        self.player = player
        self.shots = []
        self.plannedShots = []
        self.isComplete = false
        self.currentHoleNumber = 1
        
        // Initialize holes from course data
        self.holes = course.holes.map { holeInfo in
            RoundHole(
                holeNumber: holeInfo.number,
                par: holeInfo.par,
                handicapIndex: holeInfo.handicapIndex
            )
        }
        
        // Calculate stroke allocation if tee data is available
        recalculateStrokeAllocation()
    }
    
    // MARK: - Methods
    
    /// Recalculate stroke allocation based on course handicap
    mutating func recalculateStrokeAllocation() {
        guard let ch = courseHandicap else {
            // Clear stroke allocation if no handicap data
            for i in holes.indices {
                holes[i].strokesReceived = 0
                holes[i].recalculateNet()
            }
            return
        }
        
        let allocation = HandicapCalculator.allocateStrokes(
            courseHandicap: ch,
            holes: course.holes
        )
        
        for i in holes.indices {
            holes[i].strokesReceived = allocation[i]
            holes[i].recalculateNet()
        }
    }
    
    /// Update score for a specific hole
    mutating func updateHoleScore(holeNumber: Int, grossStrokes: Int?, putts: Int? = nil, notes: String? = nil) {
        guard let index = holes.firstIndex(where: { $0.holeNumber == holeNumber }) else { return }
        holes[index].grossStrokes = grossStrokes
        holes[index].putts = putts
        if let notes = notes {
            holes[index].notes = notes
        }
        holes[index].recalculateNet()
    }
    
    /// Get hole by number
    func hole(number: Int) -> RoundHole? {
        holes.first { $0.holeNumber == number }
    }
    
    /// Add a shot to the round
    mutating func addShot(_ shot: Shot) {
        var newShot = shot
        if newShot.holeNumber == nil {
            newShot.holeNumber = currentHoleNumber
        }
        shots.append(newShot)
    }
    
    /// Remove the last shot
    mutating func undoLastShot() -> Shot? {
        guard !shots.isEmpty else { return nil }
        return shots.removeLast()
    }
    
    /// Get shots for a specific hole
    func shots(forHole holeNumber: Int) -> [Shot] {
        shots.filter { $0.holeNumber == holeNumber }
    }
    
    // MARK: - Planned Shot Management
    
    /// Get planned shots for a specific hole
    func plannedShots(forHole holeNumber: Int) -> [PlannedShot] {
        plannedShots.filter { $0.holeNumber == holeNumber }.sorted { $0.order < $1.order }
    }
    
    /// Add a planned shot
    mutating func addPlannedShot(_ shot: PlannedShot) {
        plannedShots.append(shot)
    }
    
    /// Remove a planned shot
    mutating func removePlannedShot(_ shot: PlannedShot) {
        plannedShots.removeAll { $0.id == shot.id }
    }
    
    /// Update a planned shot
    mutating func updatePlannedShot(_ shot: PlannedShot) {
        if let index = plannedShots.firstIndex(where: { $0.id == shot.id }) {
            plannedShots[index] = shot
        }
    }
    
    /// Clear all planned shots for a hole
    mutating func clearPlannedShots(forHole holeNumber: Int) {
        plannedShots.removeAll { $0.holeNumber == holeNumber }
    }
}

// MARK: - Round Hole

/// Score data for a single hole in a round
struct RoundHole: Codable, Identifiable, Equatable {
    let id: UUID
    var holeNumber: Int
    var par: Int
    var handicapIndex: Int
    var strokesReceived: Int   // 0, 1, or 2 based on course handicap
    var grossStrokes: Int?
    var netStrokes: Int?
    var putts: Int?
    var notes: String?
    var fairwayHit: Bool?       // nil for par 3s where no fairway
    var greenInRegulation: Bool? // reached green in par - 2 strokes
    
    /// Score relative to par
    var scoreToPar: Int? {
        guard let gross = grossStrokes else { return nil }
        return gross - par
    }
    
    /// Score name (Eagle, Birdie, Par, etc.)
    var scoreName: String? {
        guard let diff = scoreToPar else { return nil }
        switch diff {
        case ...(-3): return "Albatross"
        case -2: return "Eagle"
        case -1: return "Birdie"
        case 0: return "Par"
        case 1: return "Bogey"
        case 2: return "Double"
        case 3: return "Triple"
        default: return "+\(diff)"
        }
    }
    
    init(
        id: UUID = UUID(),
        holeNumber: Int,
        par: Int,
        handicapIndex: Int,
        strokesReceived: Int = 0,
        grossStrokes: Int? = nil,
        putts: Int? = nil,
        notes: String? = nil,
        fairwayHit: Bool? = nil,
        greenInRegulation: Bool? = nil
    ) {
        self.id = id
        self.holeNumber = holeNumber
        self.par = par
        self.handicapIndex = handicapIndex
        self.strokesReceived = strokesReceived
        self.grossStrokes = grossStrokes
        self.putts = putts
        self.notes = notes
        self.fairwayHit = fairwayHit
        self.greenInRegulation = greenInRegulation
        self.netStrokes = nil
        recalculateNet()
    }
    
    /// Recalculate net score from gross and strokes received
    mutating func recalculateNet() {
        if let gross = grossStrokes {
            netStrokes = gross - strokesReceived
        } else {
            netStrokes = nil
        }
    }
}
