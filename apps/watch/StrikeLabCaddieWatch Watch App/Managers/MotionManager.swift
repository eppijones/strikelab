//
//  MotionManager.swift
//  StrikeLabCaddieWatch Watch App
//
//  Motion-based swing detection
//

import Foundation
import CoreMotion
import Combine
import WatchKit

class MotionManager: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var isDetectionEnabled = false
    @Published var swingDetected = false
    @Published var lastSwingConfidence: Double = 0
    @Published var errorMessage: String?
    
    /// Callback when swing is detected
    var onSwingDetected: ((Double) -> Void)?
    
    // MARK: - Private Properties
    
    private let motionManager = CMMotionManager()
    private let motionQueue = OperationQueue()
    private var accelerationBuffer: [CMAcceleration] = []
    private let processingQueue = DispatchQueue(label: "com.strikelab.motion.processing")
    
    // Detection parameters
    private let accelerationThreshold: Double = 3.0  // G-force threshold
    private let bufferSize = 50  // ~0.5 seconds at 100Hz
    private let cooldownPeriod: TimeInterval = 2.0  // Seconds between detections
    private var lastDetectionTime: Date?
    
    // MARK: - Detection Control
    
    func startDetection() {
        guard motionManager.isAccelerometerAvailable else {
            DispatchQueue.main.async {
                self.errorMessage = "Accelerometer not available"
            }
            return
        }
        
        // Configure update interval (100Hz)
        motionManager.accelerometerUpdateInterval = 0.01
        
        motionManager.startAccelerometerUpdates(to: motionQueue) { [weak self] data, error in
            guard let self = self else { return }
            
            if let acceleration = data?.acceleration {
                self.processingQueue.async {
                    self.processAcceleration(acceleration)
                }
            } else if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
        
        DispatchQueue.main.async {
            self.isDetectionEnabled = true
        }
    }
    
    func stopDetection() {
        motionManager.stopAccelerometerUpdates()
        processingQueue.async { [weak self] in
            self?.accelerationBuffer.removeAll()
        }
        DispatchQueue.main.async {
            self.isDetectionEnabled = false
        }
    }
    
    // MARK: - Swing Detection Algorithm
    
    private func processAcceleration(_ acceleration: CMAcceleration) {
        // Add to buffer
        accelerationBuffer.append(acceleration)
        if accelerationBuffer.count > bufferSize {
            accelerationBuffer.removeFirst()
        }
        
        // Check cooldown
        if let lastTime = lastDetectionTime,
           Date().timeIntervalSince(lastTime) < cooldownPeriod {
            return
        }
        
        // Calculate magnitude
        let magnitude = sqrt(
            acceleration.x * acceleration.x +
            acceleration.y * acceleration.y +
            acceleration.z * acceleration.z
        )
        
        // Detect swing
        if magnitude > accelerationThreshold {
            // Verify it's a swing pattern (high peak followed by decline)
            if verifySwingPattern() {
                let confidence = min(magnitude / accelerationThreshold, 1.0)
                triggerSwingDetection(confidence: confidence)
            }
        }
    }
    
    private func verifySwingPattern() -> Bool {
        // Simple verification: check for characteristic swing motion
        // A golf swing has a peak acceleration followed by deceleration
        guard accelerationBuffer.count >= 20 else { return false }
        
        let recentData = accelerationBuffer.suffix(20)
        let magnitudes = recentData.map { sqrt($0.x * $0.x + $0.y * $0.y + $0.z * $0.z) }
        
        // Find peak in recent data
        guard let maxMag = magnitudes.max(), maxMag > accelerationThreshold else {
            return false
        }
        
        // Check for decline after peak (swing follow-through)
        if let peakIndex = magnitudes.firstIndex(of: maxMag) {
            let afterPeak = magnitudes.suffix(from: peakIndex)
            if afterPeak.count >= 3 {
                // Simple check: later values should be lower
                let lastThree = Array(afterPeak.suffix(3))
                return lastThree.allSatisfy { $0 < maxMag * 0.8 }
            }
        }
        
        return false
    }
    
    private func triggerSwingDetection(confidence: Double) {
        let now = Date()
        lastDetectionTime = now
        
        DispatchQueue.main.async { [weak self] in
            self?.lastSwingConfidence = confidence
            self?.swingDetected = true
            
            // Notify via callback
            self?.onSwingDetected?(confidence)
            
            // Haptic feedback
            WKInterfaceDevice.current().play(.notification)
            
            // Reset swing detected flag after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self?.swingDetected = false
            }
        }
    }
    
    // MARK: - Manual Reset
    
    func resetDetection() {
        processingQueue.async { [weak self] in
            self?.accelerationBuffer.removeAll()
            self?.lastDetectionTime = nil
        }
        DispatchQueue.main.async {
            self.swingDetected = false
        }
    }
}
