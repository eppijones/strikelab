//
//  HoleLayout.swift
//  StrikeLabCaddie
//
//  GPS layout data for hole features (green, hazards, layups)
//

import Foundation
import CoreLocation

// MARK: - Hole Layout

/// GPS layout data for a single hole
struct HoleLayout: Codable, Identifiable, Equatable {
    let id: UUID
    let holeNumber: Int
    
    // Green positions
    var greenFront: Coordinate?
    var greenCenter: Coordinate?
    var greenBack: Coordinate?
    
    // Tee box position (for hole overview)
    var teeBox: Coordinate?
    
    // Hazards on the hole
    var hazards: [Hazard]
    
    // Layup/target positions
    var layupTargets: [LayupTarget]
    
    init(
        id: UUID = UUID(),
        holeNumber: Int,
        greenFront: Coordinate? = nil,
        greenCenter: Coordinate? = nil,
        greenBack: Coordinate? = nil,
        teeBox: Coordinate? = nil,
        hazards: [Hazard] = [],
        layupTargets: [LayupTarget] = []
    ) {
        self.id = id
        self.holeNumber = holeNumber
        self.greenFront = greenFront
        self.greenCenter = greenCenter
        self.greenBack = greenBack
        self.teeBox = teeBox
        self.hazards = hazards
        self.layupTargets = layupTargets
    }
    
    /// Check if hole has GPS data
    var hasGPSData: Bool {
        greenCenter != nil || !hazards.isEmpty
    }
    
    /// Get green depth in yards (back - front)
    var greenDepth: Double? {
        guard let front = greenFront, let back = greenBack else { return nil }
        return front.distance(to: back) * 1.09361  // Convert meters to yards
    }
}

// MARK: - Hazard

/// Type of hazard
enum HazardType: String, Codable, CaseIterable {
    case water = "Water"
    case bunker = "Bunker"
    case outOfBounds = "OB"
    case lateral = "Lateral"
    case trees = "Trees"
    
    var icon: String {
        switch self {
        case .water: return "drop.fill"
        case .bunker: return "circle.fill"
        case .outOfBounds: return "exclamationmark.triangle.fill"
        case .lateral: return "line.diagonal"
        case .trees: return "tree.fill"
        }
    }
    
    var color: String {
        switch self {
        case .water: return "blue"
        case .bunker: return "yellow"
        case .outOfBounds: return "white"
        case .lateral: return "red"
        case .trees: return "green"
        }
    }
}

/// A hazard on the course
struct Hazard: Codable, Identifiable, Equatable {
    let id: UUID
    var type: HazardType
    var coordinate: Coordinate
    var name: String?
    var carryDistance: Double?  // Distance to carry to clear (yards)
    
    init(
        id: UUID = UUID(),
        type: HazardType,
        coordinate: Coordinate,
        name: String? = nil,
        carryDistance: Double? = nil
    ) {
        self.id = id
        self.type = type
        self.coordinate = coordinate
        self.name = name
        self.carryDistance = carryDistance
    }
    
    /// Display name
    var displayName: String {
        name ?? type.rawValue
    }
}

// MARK: - Layup Target

/// A strategic layup or target position
struct LayupTarget: Codable, Identifiable, Equatable {
    let id: UUID
    var coordinate: Coordinate
    var name: String
    var description: String?
    
    init(
        id: UUID = UUID(),
        coordinate: Coordinate,
        name: String,
        description: String? = nil
    ) {
        self.id = id
        self.coordinate = coordinate
        self.name = name
        self.description = description
    }
}

// MARK: - Distance Calculator

/// Helper for calculating distances to course features
struct HoleDistanceCalculator {
    let currentLocation: Coordinate
    let holeLayout: HoleLayout
    
    /// Distance to front of green (yards)
    var distanceToFront: Double? {
        guard let front = holeLayout.greenFront else { return nil }
        return currentLocation.distance(to: front) * 1.09361
    }
    
    /// Distance to center of green (yards)
    var distanceToCenter: Double? {
        guard let center = holeLayout.greenCenter else { return nil }
        return currentLocation.distance(to: center) * 1.09361
    }
    
    /// Distance to back of green (yards)
    var distanceToBack: Double? {
        guard let back = holeLayout.greenBack else { return nil }
        return currentLocation.distance(to: back) * 1.09361
    }
    
    /// Distances to all hazards, sorted by distance
    var hazardDistances: [(hazard: Hazard, distance: Double)] {
        holeLayout.hazards.map { hazard in
            let distance = currentLocation.distance(to: hazard.coordinate) * 1.09361
            return (hazard, distance)
        }.sorted { $0.distance < $1.distance }
    }
    
    /// Nearest hazard
    var nearestHazard: (hazard: Hazard, distance: Double)? {
        hazardDistances.first
    }
    
    /// Hazards within range (that could affect the shot)
    func hazardsInRange(maxDistance: Double = 300) -> [(hazard: Hazard, distance: Double)] {
        hazardDistances.filter { $0.distance <= maxDistance }
    }
    
    /// Distance to layup targets
    var layupDistances: [(target: LayupTarget, distance: Double)] {
        holeLayout.layupTargets.map { target in
            let distance = currentLocation.distance(to: target.coordinate) * 1.09361
            return (target, distance)
        }.sorted { $0.distance < $1.distance }
    }
    
    /// Bearing to green center (degrees)
    var bearingToGreen: Double? {
        guard let center = holeLayout.greenCenter else { return nil }
        return calculateBearing(from: currentLocation, to: center)
    }
    
    /// Calculate bearing between two coordinates
    private func calculateBearing(from start: Coordinate, to end: Coordinate) -> Double {
        let lat1 = start.latitude * .pi / 180
        let lat2 = end.latitude * .pi / 180
        let dLon = (end.longitude - start.longitude) * .pi / 180
        
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        
        var bearing = atan2(y, x) * 180 / .pi
        if bearing < 0 {
            bearing += 360
        }
        return bearing
    }
}

// MARK: - GPS Display Data

/// Formatted GPS distances for display
struct HoleGPSData {
    let front: Int?
    let center: Int?
    let back: Int?
    let nearestHazard: (name: String, type: HazardType, distance: Int)?
    let bearingToGreen: Double?
    
    init(from calculator: HoleDistanceCalculator) {
        self.front = calculator.distanceToFront.map { Int($0) }
        self.center = calculator.distanceToCenter.map { Int($0) }
        self.back = calculator.distanceToBack.map { Int($0) }
        
        if let nearest = calculator.nearestHazard {
            self.nearestHazard = (nearest.hazard.displayName, nearest.hazard.type, Int(nearest.distance))
        } else {
            self.nearestHazard = nil
        }
        
        self.bearingToGreen = calculator.bearingToGreen
    }
    
    /// Check if any GPS data is available
    var hasData: Bool {
        center != nil
    }
    
    /// Formatted front-center-back string
    var formattedDistances: String {
        let f = front.map { "\($0)" } ?? "–"
        let c = center.map { "\($0)" } ?? "–"
        let b = back.map { "\($0)" } ?? "–"
        return "F: \(f)  C: \(c)  B: \(b)"
    }
}
