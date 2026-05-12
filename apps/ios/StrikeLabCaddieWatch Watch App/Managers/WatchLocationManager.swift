//
//  WatchLocationManager.swift
//  StrikeLabCaddieWatch Watch App
//
//  Two modes:
//   1. `startBriefly()` — single-burst GPS used by the start screen to
//      match the player's current fix against seeded courses for the
//      one-tap "start at <course>" CTA.
//   2. `startContinuous()` / `stopContinuous()` — continuous fix stream
//      used during a round so the SwingConfirmer can confirm a candidate
//      swing as a real shot only after the player walks away from the
//      ball spot. Tuned for 5–10m practical accuracy + low-ish battery.
//

import Foundation
import CoreLocation
import Combine

@MainActor
final class WatchLocationManager: NSObject, ObservableObject {

    /// Most recent fix — used for "where am I?" snapshots (course match,
    /// swing candidate location, etc.).
    @Published var lastLocation: CLLocation?

    /// Recent path during continuous mode. Capped to ~120 fixes so we
    /// stay bounded across a 4-hour round (~10 minutes of context at
    /// 5m / fix). Only populated while `isContinuous == true`.
    @Published var path: [CLLocation] = []

    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isContinuous: Bool = false

    /// Fired every time we receive a fresh fix while in continuous mode.
    /// The SwingConfirmer subscribes to this so it can decide whether
    /// the player has displaced enough from the last candidate's spot
    /// to confirm a shot.
    var onLocationUpdate: ((CLLocation) -> Void)?

    private let manager = CLLocationManager()
    private static let pathCap = 120

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 50
        authorizationStatus = manager.authorizationStatus
    }

    // MARK: - Brief burst (start-screen course match)

    /// Idempotent — call this from the start screen on appear. Asks for
    /// "when in use" auth (we don't need background) and starts a single
    /// burst of GPS just long enough to match the player to a course.
    func startBriefly() {
        switch authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            return
        default:
            break
        }
        // Lower fidelity is fine — we're matching against a 500m course
        // radius, not driving a turn-by-turn UI.
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 50
        manager.startUpdatingLocation()
    }

    func stop() {
        manager.stopUpdatingLocation()
        isContinuous = false
    }

    // MARK: - Continuous (in-round shot confirmation)

    /// Switch into round mode: tighter accuracy + more frequent fixes
    /// so the SwingConfirmer can detect when the player has walked
    /// ~10m from a candidate-swing location.
    func startContinuous() {
        switch authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            return
        default:
            break
        }
        manager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
        manager.distanceFilter = 5            // one fix per ~5m of motion
        manager.activityType = .fitness
        path.removeAll()
        isContinuous = true
        manager.startUpdatingLocation()
    }

    /// Drop back to the cheap brief-burst settings, keeping the manager
    /// alive so the start screen can still ask for fixes if it wants to.
    func stopContinuous() {
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 50
        manager.stopUpdatingLocation()
        isContinuous = false
        path.removeAll()
    }
}

extension WatchLocationManager: CLLocationManagerDelegate {
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            authorizationStatus = status
            if status == .authorizedWhenInUse || status == .authorizedAlways {
                manager.startUpdatingLocation()
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let last = locations.last else { return }
        Task { @MainActor in
            lastLocation = last
            if isContinuous {
                path.append(last)
                if path.count > Self.pathCap {
                    path.removeFirst(path.count - Self.pathCap)
                }
                onLocationUpdate?(last)
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Soft-fail — the start screen will just show "Pick course on iPhone"
        // and the SwingConfirmer will fall back to motion-only detection.
    }
}
