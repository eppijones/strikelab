//
//  Course.swift
//  StrikeLabCaddie
//
//  Golf course, hole, and tee models
//

import Foundation

/// Represents a golf course with its holes and available tees
struct Course: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var location: String
    var holes: [HoleInfo]  // Always 18 holes
    var tees: [Tee]
    var holeLayouts: [HoleLayout]?   // Optional GPS layouts (one per hole)

    // API Integration fields
    var apiCourseId: Int?       // ID from Golf Course API (nil for custom courses)
    var latitude: Double?       // Course location for map centering
    var longitude: Double?      // Course location for map centering
    var isCustom: Bool          // true for user-created, false for API-imported
    
    /// Total par for the course (sum of all hole pars)
    var totalPar: Int {
        holes.reduce(0) { $0 + $1.par }
    }
    
    /// Front 9 par
    var front9Par: Int {
        holes.prefix(9).reduce(0) { $0 + $1.par }
    }
    
    /// Back 9 par
    var back9Par: Int {
        holes.suffix(9).reduce(0) { $0 + $1.par }
    }
    
    /// Check if course has complete hole data
    var hasCompleteHoleData: Bool {
        holes.count == 18 && holes.allSatisfy { $0.par >= 3 && $0.par <= 5 }
    }
    
    /// Check if course is from API
    var isFromAPI: Bool {
        apiCourseId != nil
    }
    
    /// Check if course has GPS coordinates
    var hasCoordinates: Bool {
        latitude != nil && longitude != nil
    }

    /// Whether at least one hole has a GPS layout (green/hazards/layups).
    var hasGPSData: Bool {
        guard let layouts = holeLayouts else { return false }
        return layouts.contains { $0.hasGPSData }
    }

    /// Look up a hole layout by hole number.
    func layout(forHole holeNumber: Int) -> HoleLayout? {
        holeLayouts?.first { $0.holeNumber == holeNumber }
    }

    init(
        id: UUID = UUID(),
        name: String,
        location: String,
        holes: [HoleInfo],
        tees: [Tee],
        holeLayouts: [HoleLayout]? = nil,
        apiCourseId: Int? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        isCustom: Bool = true
    ) {
        self.id = id
        self.name = name
        self.location = location
        self.holes = holes
        self.tees = tees
        self.holeLayouts = holeLayouts
        self.apiCourseId = apiCourseId
        self.latitude = latitude
        self.longitude = longitude
        self.isCustom = isCustom
    }
}

// MARK: - Hole Information

/// Information about a single hole on the course
struct HoleInfo: Codable, Identifiable, Equatable {
    let id: UUID
    var number: Int        // 1-18
    var par: Int           // 3, 4, or 5
    var handicapIndex: Int // 1-18 (difficulty ranking, 1 = hardest)
    
    /// Hole description for display
    var description: String {
        "Hole \(number) • Par \(par)"
    }
    
    init(id: UUID = UUID(), number: Int, par: Int, handicapIndex: Int) {
        self.id = id
        self.number = number
        self.par = par
        self.handicapIndex = handicapIndex
    }
}

// MARK: - Tee Information

/// Represents a tee box with its rating information
struct Tee: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String           // "White", "Yellow", "Red", etc.
    var slope: Double?         // Slope rating (55-155, standard is 113)
    var courseRating: Double?  // Course rating (typically around par)
    var par: Int?              // Par from this tee (usually same as course par)
    
    /// Check if tee has complete rating data for handicap calculation
    var hasCompleteData: Bool {
        slope != nil && courseRating != nil && par != nil
    }
    
    /// Status text for display
    var statusText: String {
        if hasCompleteData {
            return "Slope \(Int(slope!)) • CR \(String(format: "%.1f", courseRating!))"
        } else {
            return "Needs tee data"
        }
    }
    
    init(id: UUID = UUID(), name: String, slope: Double? = nil, courseRating: Double? = nil, par: Int? = nil) {
        self.id = id
        self.name = name
        self.slope = slope
        self.courseRating = courseRating
        self.par = par
    }
}

// MARK: - Course Extensions

extension Course {
    /// Get hole by number (1-indexed)
    func hole(number: Int) -> HoleInfo? {
        holes.first { $0.number == number }
    }
    
    /// Update hole information
    mutating func updateHole(_ hole: HoleInfo) {
        if let index = holes.firstIndex(where: { $0.number == hole.number }) {
            holes[index] = hole
        }
    }
    
    /// Update tee information
    mutating func updateTee(_ tee: Tee) {
        if let index = tees.firstIndex(where: { $0.id == tee.id }) {
            tees[index] = tee
        }
    }
}
