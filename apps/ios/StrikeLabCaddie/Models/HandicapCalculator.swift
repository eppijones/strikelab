//
//  HandicapCalculator.swift
//  StrikeLabCaddie
//
//  World Handicap System calculations
//

import Foundation

/// Utility for handicap calculations following WHS rules
struct HandicapCalculator {
    
    // MARK: - Course Handicap Calculation
    
    /// Calculate Course Handicap using the WHS formula
    /// Formula: Course Handicap = Handicap Index × (Slope Rating / 113) + (Course Rating - Par)
    ///
    /// - Parameters:
    ///   - handicapIndex: Player's Handicap Index (can be negative for plus handicaps)
    ///   - slope: Slope Rating of the tee (55-155, standard is 113)
    ///   - courseRating: Course Rating from the selected tee
    ///   - par: Par for the course from the selected tee
    /// - Returns: Course Handicap rounded to nearest integer
    static func courseHandicap(
        handicapIndex: Double,
        slope: Double,
        courseRating: Double,
        par: Int
    ) -> Int {
        // WHS Formula: CH = HI × (SR / 113) + (CR - Par)
        let ch = handicapIndex * (slope / 113.0) + (courseRating - Double(par))
        return Int(ch.rounded())
    }
    
    // MARK: - Playing Handicap Calculation
    
    /// Calculate Playing Handicap (for match play or specific competition formats)
    /// Formula: Playing Handicap = Course Handicap × Handicap Allowance
    ///
    /// - Parameters:
    ///   - courseHandicap: The course handicap
    ///   - allowance: Handicap allowance percentage (default 100% for stroke play)
    /// - Returns: Playing Handicap rounded to nearest integer
    static func playingHandicap(
        courseHandicap: Int,
        allowance: Double = 1.0
    ) -> Int {
        return Int((Double(courseHandicap) * allowance).rounded())
    }
    
    // MARK: - Stroke Allocation
    
    /// Allocate handicap strokes to holes based on hole handicap index
    /// 
    /// The hole handicap index (stroke index) ranks holes 1-18 by difficulty,
    /// where 1 is the hardest hole to make par on.
    ///
    /// Allocation rules:
    /// - Course Handicap 1-N: One stroke on the hardest N holes
    /// - Higher handicaps: Continue looping through the stroke index order
    ///   until all strokes are allocated.
    /// - Negative (plus) handicap: Give strokes back on easiest holes
    ///
    /// - Parameters:
    ///   - courseHandicap: The player's course handicap
    ///   - holes: Array of HoleInfo with handicap indices
    /// - Returns: Array of strokes received per hole (index matches hole order)
    static func allocateStrokes(
        courseHandicap: Int,
        holes: [HoleInfo]
    ) -> [Int] {
        guard !holes.isEmpty else { return [] }

        var allocation = Array(repeating: 0, count: holes.count)
        
        // Handle positive handicaps (receiving strokes)
        if courseHandicap > 0 {
            // Sort holes by handicap index (1 = hardest, gets strokes first)
            let sortedIndices = holes.enumerated()
                .sorted { $0.element.handicapIndex < $1.element.handicapIndex }
                .map { $0.offset }
            
            // Allocate strokes - each pass through the played holes gives one stroke per hole.
            let maxStrokes = holes.count * 3
            for i in 0..<min(courseHandicap, maxStrokes) {
                let holeIndex = sortedIndices[i % holes.count]
                allocation[holeIndex] += 1
            }
        }
        // Handle plus handicaps (giving strokes back)
        else if courseHandicap < 0 {
            // Sort holes by handicap index descending (18 = easiest, gives back first)
            let sortedIndices = holes.enumerated()
                .sorted { $0.element.handicapIndex > $1.element.handicapIndex }
                .map { $0.offset }
            
            // Remove strokes from easiest holes
            let strokesToGive = abs(courseHandicap)
            for i in 0..<min(strokesToGive, holes.count) {
                let holeIndex = sortedIndices[i]
                allocation[holeIndex] -= 1
            }
        }
        
        return allocation
    }
    
    // MARK: - Score Differential
    
    /// Calculate Score Differential for handicap index calculation
    /// Formula: (113 / Slope) × (Adjusted Gross Score - Course Rating - PCC)
    ///
    /// - Parameters:
    ///   - adjustedGrossScore: Score after applying max hole scores
    ///   - courseRating: Course Rating
    ///   - slope: Slope Rating
    ///   - pcc: Playing Conditions Calculation adjustment (default 0)
    /// - Returns: Score Differential rounded to one decimal
    static func scoreDifferential(
        adjustedGrossScore: Int,
        courseRating: Double,
        slope: Double,
        pcc: Double = 0
    ) -> Double {
        let diff = (113.0 / slope) * (Double(adjustedGrossScore) - courseRating - pcc)
        return (diff * 10).rounded() / 10 // Round to one decimal
    }
    
    // MARK: - Net Double Bogey
    
    /// Calculate Net Double Bogey (maximum score for handicap purposes)
    /// Formula: Par + 2 + Strokes Received
    ///
    /// - Parameters:
    ///   - par: Par for the hole
    ///   - strokesReceived: Number of handicap strokes on this hole
    /// - Returns: Maximum score to record for handicap calculation
    static func netDoubleBogey(par: Int, strokesReceived: Int) -> Int {
        return par + 2 + strokesReceived
    }
}

// MARK: - Validation

extension HandicapCalculator {
    /// Validate slope rating is within normal range
    static func isValidSlope(_ slope: Double) -> Bool {
        slope >= 55 && slope <= 155
    }
    
    /// Validate course rating is reasonable
    static func isValidCourseRating(_ rating: Double) -> Bool {
        rating >= 60 && rating <= 80
    }
    
    /// Validate handicap index is within WHS limits
    static func isValidHandicapIndex(_ index: Double) -> Bool {
        index >= -10 && index <= 54
    }
}
