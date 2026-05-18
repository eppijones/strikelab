//
//  LocationManager.swift
//  StrikeLabCaddie
//
//  CoreLocation manager for GPS shot tracking
//

import Foundation
import CoreLocation
import Combine

/// Manages location tracking for shot distance calculation
@MainActor
class LocationManager: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var currentLocation: CLLocation?
    @Published var isTracking = false
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var locationError: String?
    @Published var hasDeferredRoundLocation = false

    var currentLocationAge: TimeInterval? {
        currentLocation.map { Date().timeIntervalSince($0.timestamp) }
    }

    var isCurrentLocationStale: Bool {
        guard let age = currentLocationAge else { return true }
        return age > 30
    }

    var accuracyLabel: String {
        guard let location = currentLocation, location.horizontalAccuracy > 0 else {
            return "No GPS fix"
        }
        let meters = Int(location.horizontalAccuracy.rounded())
        let age = Int(max(0, Date().timeIntervalSince(location.timestamp)).rounded())
        return isCurrentLocationStale ? "GPS stale · \(age)s old" : "GPS ±\(meters)m"
    }
    
    /// All recorded locations during the round
    @Published var locationHistory: [CLLocation] = []
    
    /// Detected stationary clusters (ball lies)
    @Published var clusters: [LocationCluster] = []
    
    // MARK: - Private Properties
    
    private let locationManager = CLLocationManager()
    private let clusteringAlgorithm = ClusteringAlgorithm()
    private var cancellables = Set<AnyCancellable>()
    private var shouldStartTrackingAfterAuthorization = false
    
    // MARK: - Initialization
    
    override init() {
        super.init()
        setupLocationManager()
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 1 // Update every meter
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.activityType = .fitness
        
        // Check initial authorization
        authorizationStatus = locationManager.authorizationStatus
    }
    
    // MARK: - Public Methods
    
    /// Request location permissions
    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }
    
    /// Request always permission for background tracking
    func requestAlwaysPermission() {
        locationManager.requestAlwaysAuthorization()
    }
    
    /// Start tracking location
    func startTracking() {
        if authorizationStatus == .notDetermined {
            hasDeferredRoundLocation = false
            shouldStartTrackingAfterAuthorization = true
            requestPermission()
            return
        }

        guard authorizationStatus == .authorizedWhenInUse || 
              authorizationStatus == .authorizedAlways else {
            locationError = "Location permission required"
            return
        }
        
        locationManager.startUpdatingLocation()
        isTracking = true
        hasDeferredRoundLocation = false
        locationError = nil
    }
    
    /// Stop tracking location
    func stopTracking() {
        locationManager.stopUpdatingLocation()
        isTracking = false
    }
    
    /// Clear location history (start fresh for new round)
    func clearHistory() {
        locationHistory.removeAll()
        clusters.removeAll()
    }
    
    // MARK: - Shot Location Matching
    
    /// Find the nearest stationary cluster before a given timestamp
    /// This represents where the ball was when the shot was taken
    func findShotStartLocation(beforeTimestamp timestamp: Date) -> Coordinate? {
        let validClusters = clusters.filter { $0.endTime < timestamp }
        guard let nearest = validClusters.max(by: { $0.endTime < $1.endTime }) else {
            return nil
        }
        return Coordinate(from: nearest.centroid)
    }
    
    /// Find the nearest stationary cluster after a given timestamp
    /// This represents where the ball landed
    func findShotEndLocation(afterTimestamp timestamp: Date) -> Coordinate? {
        let validClusters = clusters.filter { $0.startTime > timestamp }
        guard let nearest = validClusters.min(by: { $0.startTime < $1.startTime }) else {
            return nil
        }
        return Coordinate(from: nearest.centroid)
    }
    
    /// Update shot with location data
    func enrichShotWithLocation(_ shot: inout Shot) {
        shot.startLocation = findShotStartLocation(beforeTimestamp: shot.timestamp)
        shot.endLocation = findShotEndLocation(afterTimestamp: shot.timestamp)
        
        // Recalculate distance if both locations available
        if let start = shot.startLocation, let end = shot.endLocation {
            shot.distanceMeters = start.distance(to: end)
            shot.distanceYards = (shot.distanceMeters ?? 0) * 1.09361
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {
    
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            for location in locations {
                // Filter out inaccurate readings
                guard location.horizontalAccuracy > 0 && location.horizontalAccuracy < 20 else {
                    continue
                }
                
                currentLocation = location
                locationHistory.append(location)
                
                // Run clustering on new location
                if let newCluster = clusteringAlgorithm.processLocation(location) {
                    clusters.append(newCluster)
                }
            }
        }
    }
    
    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            if let clError = error as? CLError {
                switch clError.code {
                case .denied:
                    locationError = "Location access denied"
                case .locationUnknown:
                    locationError = "Unable to determine location"
                default:
                    locationError = "Location error: \(clError.localizedDescription)"
                }
            } else {
                locationError = error.localizedDescription
            }
        }
    }
    
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            authorizationStatus = manager.authorizationStatus
            
            switch authorizationStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                locationError = nil
                if shouldStartTrackingAfterAuthorization {
                    shouldStartTrackingAfterAuthorization = false
                    startTracking()
                }
            case .denied, .restricted:
                shouldStartTrackingAfterAuthorization = false
                locationError = "Location access denied. Enable in Settings."
            case .notDetermined:
                break
            @unknown default:
                break
            }
        }
    }
}

// MARK: - Location Cluster

/// Represents a stationary cluster (where the ball was at rest)
struct LocationCluster: Identifiable, Equatable {
    let id = UUID()
    var centroid: CLLocationCoordinate2D
    var startTime: Date
    var endTime: Date
    var locations: [CLLocation]
    
    /// Duration the player was stationary at this location
    var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }
    
    /// Average accuracy of readings in this cluster
    var averageAccuracy: Double {
        guard !locations.isEmpty else { return 0 }
        return locations.map { $0.horizontalAccuracy }.reduce(0, +) / Double(locations.count)
    }
    
    static func == (lhs: LocationCluster, rhs: LocationCluster) -> Bool {
        lhs.id == rhs.id
    }
}
