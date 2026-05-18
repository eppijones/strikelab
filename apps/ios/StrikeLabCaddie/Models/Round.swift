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

extension Tee {
    func adjustedForPlayFormat(_ format: PlayFormat) -> Tee {
        guard format.totalHoles == 9,
              let courseRating,
              let par else {
            return self
        }
        var adjusted = self
        adjusted.courseRating = courseRating / 2.0
        adjusted.par = max(1, Int((Double(par) / 2.0).rounded()))
        return adjusted
    }
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
    var groupPlayers: [GroupPlayer] // Optional guest scorecards; no shot/biometric data.
    var pinOverridesByHole: [Int: Coordinate] // Round-day pin locations, keyed by hole number.
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

    var hasGroupPlayers: Bool {
        !groupPlayers.isEmpty
    }
    
    // MARK: - Computed Properties
    
    /// Course handicap based on selected tee and player handicap
    var courseHandicap: Int? {
        guard let selectedTee else {
            return nil
        }
        let tee = selectedTee.adjustedForPlayFormat(playFormat)
        guard let slope = tee.slope,
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
        self.groupPlayers = []
        self.pinOverridesByHole = [:]
        
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

    private enum CodingKeys: String, CodingKey {
        case id, date, completedAt, course, selectedTee, player, holes, shots, plannedShots
        case isComplete, currentHoleNumber, playFormatRaw, groupPlayers, pinOverridesByHole
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(UUID.self, forKey: .id)
        date = try c.decode(Date.self, forKey: .date)
        completedAt = try c.decodeIfPresent(Date.self, forKey: .completedAt)
        course = try c.decode(Course.self, forKey: .course)
        selectedTee = try c.decodeIfPresent(Tee.self, forKey: .selectedTee)
        player = try c.decode(Player.self, forKey: .player)
        holes = try c.decode([RoundHole].self, forKey: .holes)
        shots = try c.decodeIfPresent([Shot].self, forKey: .shots) ?? []
        plannedShots = try c.decodeIfPresent([PlannedShot].self, forKey: .plannedShots) ?? []
        isComplete = try c.decodeIfPresent(Bool.self, forKey: .isComplete) ?? false
        currentHoleNumber = try c.decodeIfPresent(Int.self, forKey: .currentHoleNumber) ?? 1
        playFormatRaw = try c.decodeIfPresent(PlayFormat.self, forKey: .playFormatRaw)
        groupPlayers = try c.decodeIfPresent([GroupPlayer].self, forKey: .groupPlayers) ?? []
        pinOverridesByHole = try c.decodeIfPresent([Int: Coordinate].self, forKey: .pinOverridesByHole) ?? [:]
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
        
        let playedHoleNumbers = Set(playedHoles.map(\.holeNumber))
        let playedCourseHoles = course.holes.filter { playedHoleNumbers.contains($0.number) }
        let allocation = HandicapCalculator.allocateStrokes(courseHandicap: ch, holes: playedCourseHoles)
        let allocationByHoleNumber = Dictionary(
            uniqueKeysWithValues: zip(playedCourseHoles.map(\.number), allocation)
        )

        for i in holes.indices {
            holes[i].strokesReceived = allocationByHoleNumber[holes[i].holeNumber] ?? 0
            holes[i].recalculateNet()
        }

        for i in groupPlayers.indices {
            groupPlayers[i].recalculateStrokeAllocation(course: course, format: playFormat)
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

    func pinCoordinate(for holeNumber: Int) -> Coordinate? {
        if let override = pinOverridesByHole[holeNumber] {
            return override
        }
        return course.layout(forHole: holeNumber)?.greenCenter
            ?? course.layout(forHole: holeNumber)?.greenFront
    }

    mutating func setPinOverride(_ coordinate: Coordinate, for holeNumber: Int) {
        pinOverridesByHole[holeNumber] = coordinate
    }

    mutating func clearPinOverride(for holeNumber: Int) {
        pinOverridesByHole.removeValue(forKey: holeNumber)
    }

    mutating func extendFrontNineToFull18() {
        guard playFormat == .front9 else { return }
        playFormat = .full18
        if currentHoleNumber < 10 {
            currentHoleNumber = 10
        }
        recalculateStrokeAllocation()
    }

    mutating func addGroupPlayer(name: String, handicapIndex: Double?, tee: Tee? = nil) {
        guard groupPlayers.count < 3 else { return }
        var guest = GroupPlayer(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ? "Guest \(groupPlayers.count + 1)"
                : name.trimmingCharacters(in: .whitespacesAndNewlines),
            handicapIndex: handicapIndex,
            tee: tee ?? selectedTee,
            holes: course.holes.map {
                GroupPlayerHoleScore(holeNumber: $0.number, par: $0.par, handicapIndex: $0.handicapIndex)
            }
        )
        guest.recalculateStrokeAllocation(course: course, format: playFormat)
        groupPlayers.append(guest)
    }

    mutating func updateGroupPlayer(_ player: GroupPlayer) {
        guard let index = groupPlayers.firstIndex(where: { $0.id == player.id }) else { return }
        var updated = player
        updated.recalculateStrokeAllocation(course: course, format: playFormat)
        groupPlayers[index] = updated
    }

    mutating func removeGroupPlayer(id: UUID) {
        groupPlayers.removeAll { $0.id == id }
    }

    mutating func updateGroupScore(playerId: UUID, holeNumber: Int, grossStrokes: Int?) {
        guard let playerIndex = groupPlayers.firstIndex(where: { $0.id == playerId }),
              let holeIndex = groupPlayers[playerIndex].holes.firstIndex(where: { $0.holeNumber == holeNumber }) else { return }
        groupPlayers[playerIndex].holes[holeIndex].grossStrokes = grossStrokes
        groupPlayers[playerIndex].holes[holeIndex].recalculateNet()
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

// MARK: - Group Scorecards

struct GroupPlayer: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var handicapIndex: Double?
    var manualCourseHandicap: Int?
    var tee: Tee?
    var holes: [GroupPlayerHoleScore]

    init(
        id: UUID = UUID(),
        name: String,
        handicapIndex: Double? = nil,
        manualCourseHandicap: Int? = nil,
        tee: Tee? = nil,
        holes: [GroupPlayerHoleScore]
    ) {
        self.id = id
        self.name = name
        self.handicapIndex = handicapIndex
        self.manualCourseHandicap = manualCourseHandicap
        self.tee = tee
        self.holes = holes
    }

    var displayName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Guest" : name
    }

    var formattedHandicap: String {
        guard let handicapIndex else { return "--" }
        if handicapIndex < 0 {
            return String(format: "+%.1f", abs(handicapIndex))
        }
        return String(format: "%.1f", handicapIndex)
    }

    func courseHandicap(fallbackTee: Tee?) -> Int? {
        if let manualCourseHandicap { return manualCourseHandicap }
        guard let handicapIndex,
              let tee = tee ?? fallbackTee,
              let slope = tee.slope,
              let rating = tee.courseRating,
              let par = tee.par else {
            return nil
        }
        return HandicapCalculator.courseHandicap(
            handicapIndex: handicapIndex,
            slope: slope,
            courseRating: rating,
            par: par
        )
    }

    func courseHandicap(fallbackTee: Tee?, format: PlayFormat) -> Int? {
        if let manualCourseHandicap { return manualCourseHandicap }
        return courseHandicap(fallbackTee: (tee ?? fallbackTee)?.adjustedForPlayFormat(format))
    }

    func playedHoles(format: PlayFormat) -> [GroupPlayerHoleScore] {
        let range = format.holeRange
        return holes.filter { range.contains($0.holeNumber) }
    }

    func grossTotal(format: PlayFormat) -> Int {
        playedHoles(format: format).compactMap { $0.grossStrokes }.reduce(0, +)
    }

    func netTotal(format: PlayFormat) -> Int {
        playedHoles(format: format).compactMap { $0.netStrokes }.reduce(0, +)
    }

    func holesCompleted(format: PlayFormat) -> Int {
        playedHoles(format: format).filter { ($0.grossStrokes ?? 0) > 0 }.count
    }

    mutating func recalculateStrokeAllocation(course: Course, format: PlayFormat = .full18) {
        let courseHandicap = courseHandicap(fallbackTee: nil, format: format) ?? 0
        let playedHoleNumbers = Set(playedHoles(format: format).map(\.holeNumber))
        let playedCourseHoles = course.holes.filter { playedHoleNumbers.contains($0.number) }
        let allocation = HandicapCalculator.allocateStrokes(
            courseHandicap: courseHandicap,
            holes: playedCourseHoles
        )
        let allocationByHoleNumber = Dictionary(
            uniqueKeysWithValues: zip(playedCourseHoles.map(\.number), allocation)
        )
        for i in holes.indices {
            holes[i].strokesReceived = allocationByHoleNumber[holes[i].holeNumber] ?? 0
            holes[i].recalculateNet()
        }
    }
}

struct GroupPlayerHoleScore: Codable, Identifiable, Equatable {
    let id: UUID
    var holeNumber: Int
    var par: Int
    var handicapIndex: Int
    var strokesReceived: Int
    var grossStrokes: Int?
    var netStrokes: Int?

    init(
        id: UUID = UUID(),
        holeNumber: Int,
        par: Int,
        handicapIndex: Int,
        strokesReceived: Int = 0,
        grossStrokes: Int? = nil
    ) {
        self.id = id
        self.holeNumber = holeNumber
        self.par = par
        self.handicapIndex = handicapIndex
        self.strokesReceived = strokesReceived
        self.grossStrokes = grossStrokes
        self.netStrokes = nil
        recalculateNet()
    }

    mutating func recalculateNet() {
        if let grossStrokes {
            netStrokes = grossStrokes - strokesReceived
        } else {
            netStrokes = nil
        }
    }
}
