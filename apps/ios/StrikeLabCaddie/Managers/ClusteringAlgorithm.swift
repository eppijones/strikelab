//
//  ClusteringAlgorithm.swift
//  StrikeLabCaddie
//
//  Simple stationary detection for ball lie clustering
//

import Foundation
import CoreLocation

/// Detects stationary periods (ball lies) from location stream
class ClusteringAlgorithm {
    
    // MARK: - Configuration
    
    /// Maximum distance (meters) to consider part of same cluster
    private let clusterRadiusMeters: Double = 3.0
    
    /// Minimum time (seconds) stationary to form a cluster
    private let minStationaryTime: TimeInterval = 5.0
    
    /// Maximum time gap between readings to continue cluster
    private let maxTimeGap: TimeInterval = 30.0
    
    // MARK: - State
    
    private var currentClusterLocations: [CLLocation] = []
    private var clusterStartTime: Date?
    private var lastLocation: CLLocation?
    
    // MARK: - Public Methods
    
    /// Process a new location reading
    /// Returns a completed cluster if stationary period ended
    func processLocation(_ location: CLLocation) -> LocationCluster? {
        defer { lastLocation = location }
        
        // First location - start potential cluster
        guard let last = lastLocation else {
            startNewCluster(with: location)
            return nil
        }
        
        // Check if still within cluster radius
        let distance = location.distance(from: last)
        let timeSinceLast = location.timestamp.timeIntervalSince(last.timestamp)
        
        // If too much time gap, finalize current and start new
        if timeSinceLast > maxTimeGap {
            let completed = finalizeCurrentCluster()
            startNewCluster(with: location)
            return completed
        }
        
        // If moved beyond cluster radius, finalize and start new
        if distance > clusterRadiusMeters {
            let completed = finalizeCurrentCluster()
            startNewCluster(with: location)
            return completed
        }
        
        // Still stationary - add to current cluster
        currentClusterLocations.append(location)
        return nil
    }
    
    /// Force finalize current cluster (e.g., when stopping tracking)
    func forceFinalize() -> LocationCluster? {
        let cluster = finalizeCurrentCluster()
        reset()
        return cluster
    }
    
    /// Reset the algorithm state
    func reset() {
        currentClusterLocations.removeAll()
        clusterStartTime = nil
        lastLocation = nil
    }
    
    // MARK: - Private Methods
    
    private func startNewCluster(with location: CLLocation) {
        currentClusterLocations = [location]
        clusterStartTime = location.timestamp
    }
    
    private func finalizeCurrentCluster() -> LocationCluster? {
        guard let startTime = clusterStartTime,
              currentClusterLocations.count >= 2 else {
            return nil
        }
        
        let endTime = currentClusterLocations.last?.timestamp ?? startTime
        let duration = endTime.timeIntervalSince(startTime)
        
        // Only create cluster if stationary long enough
        guard duration >= minStationaryTime else {
            return nil
        }
        
        let centroid = calculateCentroid(from: currentClusterLocations)
        
        return LocationCluster(
            centroid: centroid,
            startTime: startTime,
            endTime: endTime,
            locations: currentClusterLocations
        )
    }
    
    /// Calculate centroid (average position) of location array
    private func calculateCentroid(from locations: [CLLocation]) -> CLLocationCoordinate2D {
        guard !locations.isEmpty else {
            return CLLocationCoordinate2D(latitude: 0, longitude: 0)
        }
        
        // Weight by accuracy (better accuracy = higher weight)
        var totalWeight = 0.0
        var weightedLat = 0.0
        var weightedLon = 0.0
        
        for location in locations {
            // Inverse of accuracy as weight (smaller accuracy = better)
            let weight = 1.0 / max(location.horizontalAccuracy, 1.0)
            totalWeight += weight
            weightedLat += location.coordinate.latitude * weight
            weightedLon += location.coordinate.longitude * weight
        }
        
        return CLLocationCoordinate2D(
            latitude: weightedLat / totalWeight,
            longitude: weightedLon / totalWeight
        )
    }
}

// MARK: - Shot Distance Calculator

extension ClusteringAlgorithm {
    /// Calculate distance between two coordinates
    static func distance(from start: Coordinate, to end: Coordinate) -> (meters: Double, yards: Double) {
        let startLoc = CLLocation(latitude: start.latitude, longitude: start.longitude)
        let endLoc = CLLocation(latitude: end.latitude, longitude: end.longitude)
        let meters = startLoc.distance(from: endLoc)
        let yards = meters * 1.09361
        return (meters, yards)
    }
}
