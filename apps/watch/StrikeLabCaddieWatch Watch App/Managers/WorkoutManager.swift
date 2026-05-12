//
//  WorkoutManager.swift
//  StrikeLabCaddieWatch Watch App
//
//  HealthKit workout session manager
//

import Foundation
import HealthKit
import Combine

@MainActor
class WorkoutManager: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var isWorkoutActive = false
    @Published var isPaused = false
    @Published var elapsedTime: TimeInterval = 0
    @Published var activeCalories: Double = 0
    @Published var heartRate: Double = 0
    @Published var authorizationStatus: HKAuthorizationStatus = .notDetermined
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    
    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var startDate: Date?
    private var timer: Timer?
    
    // MARK: - Initialization
    
    override init() {
        super.init()
        requestAuthorization()
    }
    
    // MARK: - Authorization
    
    private func requestAuthorization() {
        // Define the types we want to read and write
        let typesToShare: Set<HKSampleType> = [
            HKObjectType.workoutType()
        ]
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.workoutType()
        ]
        
        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { [weak self] success, error in
            Task { @MainActor in
                if let error = error {
                    self?.errorMessage = "HealthKit authorization failed: \(error.localizedDescription)"
                }
                
                // Check authorization status
                let workoutType = HKObjectType.workoutType()
                self?.authorizationStatus = self?.healthStore.authorizationStatus(for: workoutType) ?? .notDetermined
            }
        }
    }
    
    // MARK: - Workout Control
    
    func startWorkout() {
        // Create workout configuration
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .golf
        configuration.locationType = .outdoor
        
        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            builder = session?.associatedWorkoutBuilder()
            
            session?.delegate = self
            builder?.delegate = self
            
            // Set data source
            builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            
            // Start session and builder
            let start = Date()
            session?.startActivity(with: start)
            builder?.beginCollection(withStart: start) { [weak self] success, error in
                Task { @MainActor in
                    if success {
                        self?.startDate = start
                        self?.isWorkoutActive = true
                        self?.startTimer()
                    } else if let error = error {
                        self?.errorMessage = "Failed to start workout: \(error.localizedDescription)"
                    }
                }
            }
        } catch {
            errorMessage = "Failed to create workout session: \(error.localizedDescription)"
        }
    }
    
    func pauseWorkout() {
        session?.pause()
        isPaused = true
        stopTimer()
    }
    
    func resumeWorkout() {
        session?.resume()
        isPaused = false
        startTimer()
    }
    
    func endWorkout() {
        session?.end()
        stopTimer()
    }
    
    // MARK: - Timer
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, let start = self.startDate else { return }
                self.elapsedTime = Date().timeIntervalSince(start)
            }
        }
    }
    
    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
    
    // MARK: - Formatting
    
    var formattedElapsedTime: String {
        let hours = Int(elapsedTime) / 3600
        let minutes = (Int(elapsedTime) % 3600) / 60
        let seconds = Int(elapsedTime) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
    
    var formattedCalories: String {
        return String(format: "%.0f", activeCalories)
    }
    
    var formattedHeartRate: String {
        if heartRate > 0 {
            return String(format: "%.0f", heartRate)
        }
        return "--"
    }
}

// MARK: - HKWorkoutSessionDelegate

extension WorkoutManager: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        Task { @MainActor in
            switch toState {
            case .running:
                isWorkoutActive = true
                isPaused = false
            case .paused:
                isPaused = true
            case .ended:
                isWorkoutActive = false
                isPaused = false
                saveWorkout()
            default:
                break
            }
        }
    }
    
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        Task { @MainActor in
            errorMessage = "Workout failed: \(error.localizedDescription)"
        }
    }
    
    private func saveWorkout() {
        builder?.endCollection(withEnd: Date()) { [weak self] success, error in
            guard success else {
                Task { @MainActor in
                    self?.errorMessage = "Failed to end collection: \(error?.localizedDescription ?? "Unknown")"
                }
                return
            }
            
            self?.builder?.finishWorkout { workout, error in
                Task { @MainActor in
                    if let error = error {
                        self?.errorMessage = "Failed to save workout: \(error.localizedDescription)"
                    }
                    // Reset state
                    self?.elapsedTime = 0
                    self?.activeCalories = 0
                    self?.heartRate = 0
                    self?.startDate = nil
                }
            }
        }
    }
}

// MARK: - HKLiveWorkoutBuilderDelegate

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        Task { @MainActor in
            for type in collectedTypes {
                guard let quantityType = type as? HKQuantityType else { continue }
                
                let statistics = workoutBuilder.statistics(for: quantityType)
                
                switch quantityType {
                case HKQuantityType.quantityType(forIdentifier: .heartRate):
                    let heartRateUnit = HKUnit.count().unitDivided(by: .minute())
                    heartRate = statistics?.mostRecentQuantity()?.doubleValue(for: heartRateUnit) ?? 0
                    
                case HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned):
                    let calorieUnit = HKUnit.kilocalorie()
                    activeCalories = statistics?.sumQuantity()?.doubleValue(for: calorieUnit) ?? 0
                    
                default:
                    break
                }
            }
        }
    }
    
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {
        // Handle workout events if needed
    }
}
