//
//  WatchCaddieView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Ghost Caddie view with real-time club recommendation and stress indicator
//

import SwiftUI
import WatchKit

struct WatchCaddieView: View {
    @ObservedObject var connectivityManager: WatchConnectivityManagerWatch
    @ObservedObject var workoutManager: WorkoutManager
    
    @State private var showBreathingExercise = false
    @State private var stressAlertThreshold: Double = 100
    
    // Theme colors
    let nordicForest = Color(red: 30/255, green: 58/255, blue: 43/255)
    let nordicSage = Color(red: 142/255, green: 184/255, blue: 151/255)
    let neuralCyan = Color(red: 0/255, green: 212/255, blue: 255/255)
    let champagne = Color(red: 212/255, green: 197/255, blue: 168/255)
    let overPar = Color(red: 200/255, green: 100/255, blue: 100/255)
    let warning = Color(red: 230/255, green: 180/255, blue: 80/255)
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Ghost Caddie header
                headerView
                
                // GPS Distance display
                if let distance = connectivityManager.gpsDistanceToPin {
                    distanceCard(distance: distance)
                }
                
                // Club recommendation
                if let suggestedClub = connectivityManager.suggestedClub {
                    clubRecommendationCard(club: suggestedClub)
                }
                
                // Heart rate / stress indicator
                if workoutManager.isWorkoutActive {
                    heartRateCard
                }
                
                // Wind info (if available)
                if let windSpeed = connectivityManager.windSpeed {
                    windCard(speed: windSpeed, direction: connectivityManager.windDirection)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
        }
        .sheet(isPresented: $showBreathingExercise) {
            BreathingExerciseView()
        }
    }
    
    // MARK: - Header View
    
    private var headerView: some View {
        HStack(spacing: 8) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 16))
                .foregroundColor(neuralCyan)
            
            Text("Ghost Caddie")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(nordicForest)
            
            Spacer()
            
            if connectivityManager.isPhoneReachable {
                Image(systemName: "iphone")
                    .font(.system(size: 10))
                    .foregroundColor(nordicSage)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
    }
    
    // MARK: - Distance Card
    
    private func distanceCard(distance: Int) -> some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: "flag.fill")
                    .font(.system(size: 12))
                    .foregroundColor(nordicSage)
                
                Text("TO PIN")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(nordicForest.opacity(0.6))
            }
            
            Text("\(distance)")
                .font(.system(size: 36, weight: .bold, design: .monospaced))
                .foregroundColor(nordicForest)
            
            Text("yards")
                .font(.system(size: 11))
                .foregroundColor(nordicForest.opacity(0.5))
            
            // Front/back distances
            if let front = connectivityManager.gpsDistanceToFront,
               let back = connectivityManager.gpsDistanceToBack {
                HStack(spacing: 16) {
                    VStack(spacing: 1) {
                        Text("\(front)")
                            .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        Text("front")
                            .font(.system(size: 8))
                            .foregroundColor(nordicForest.opacity(0.5))
                    }
                    
                    VStack(spacing: 1) {
                        Text("\(back)")
                            .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        Text("back")
                            .font(.system(size: 8))
                            .foregroundColor(nordicForest.opacity(0.5))
                    }
                }
                .foregroundColor(nordicForest.opacity(0.7))
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.8))
        )
    }
    
    // MARK: - Club Recommendation Card
    
    private func clubRecommendationCard(club: String) -> some View {
        VStack(spacing: 6) {
            HStack(spacing: 4) {
                Image(systemName: "wand.and.stars")
                    .font(.system(size: 10))
                    .foregroundColor(neuralCyan)
                
                Text("RECOMMENDED")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(nordicForest.opacity(0.6))
            }
            
            Text(club)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(neuralCyan)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(neuralCyan.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(neuralCyan.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    // MARK: - Heart Rate Card
    
    private var heartRateCard: some View {
        let hr = workoutManager.heartRate
        let isElevated = hr > stressAlertThreshold
        
        return VStack(spacing: 6) {
            HStack {
                Image(systemName: "heart.fill")
                    .font(.system(size: 14))
                    .foregroundColor(isElevated ? overPar : nordicSage)
                    .symbolEffect(.pulse, options: .repeating, isActive: isElevated)
                
                Text("\(Int(hr))")
                    .font(.system(size: 20, weight: .bold, design: .monospaced))
                    .foregroundColor(isElevated ? overPar : nordicForest)
                
                Text("BPM")
                    .font(.system(size: 10))
                    .foregroundColor(nordicForest.opacity(0.5))
                
                Spacer()
                
                // Stress level indicator
                stressIndicator(hr: hr)
            }
            
            // Stress warning and breathing button
            if isElevated {
                Button {
                    showBreathingExercise = true
                    WKInterfaceDevice.current().play(.notification)
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "wind")
                            .font(.system(size: 10))
                        Text("Take a breath")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(overPar.opacity(0.8))
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isElevated ? overPar.opacity(0.1) : Color.white.opacity(0.6))
        )
    }
    
    private func stressIndicator(hr: Double) -> some View {
        let level = calculateStressLevel(hr: hr)
        
        return VStack(spacing: 2) {
            // Stress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(nordicForest.opacity(0.1))
                    
                    RoundedRectangle(cornerRadius: 3)
                        .fill(stressColor(level: level))
                        .frame(width: geometry.size.width * level)
                }
            }
            .frame(width: 40, height: 6)
            
            Text(stressLabel(level: level))
                .font(.system(size: 8))
                .foregroundColor(nordicForest.opacity(0.5))
        }
    }
    
    private func calculateStressLevel(hr: Double) -> Double {
        let baseline: Double = 70
        let maxStress: Double = 120
        let level = (hr - baseline) / (maxStress - baseline)
        return min(max(level, 0), 1.0)
    }
    
    private func stressColor(level: Double) -> Color {
        if level < 0.3 { return nordicSage }
        if level < 0.6 { return warning }
        return overPar
    }
    
    private func stressLabel(level: Double) -> String {
        if level < 0.3 { return "calm" }
        if level < 0.6 { return "alert" }
        return "high"
    }
    
    // MARK: - Wind Card
    
    private func windCard(speed: Int, direction: String?) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "wind")
                .font(.system(size: 14))
                .foregroundColor(champagne)
            
            VStack(alignment: .leading, spacing: 1) {
                Text("\(speed) mph")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(nordicForest)
                
                if let dir = direction {
                    Text(dir)
                        .font(.system(size: 10))
                        .foregroundColor(nordicForest.opacity(0.6))
                }
            }
            
            Spacer()
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(champagne.opacity(0.15))
        )
    }
}

// MARK: - Breathing Exercise View

struct BreathingExerciseView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var breathPhase: BreathPhase = .inhale
    @State private var circleScale: CGFloat = 0.5
    @State private var cycleCount = 0
    
    let neuralCyan = Color(red: 0/255, green: 212/255, blue: 255/255)
    let nordicForest = Color(red: 30/255, green: 58/255, blue: 43/255)
    
    enum BreathPhase: String {
        case inhale = "Breathe In"
        case hold = "Hold"
        case exhale = "Breathe Out"
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Text(breathPhase.rawValue)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(nordicForest)
            
            // Breathing circle
            Circle()
                .fill(neuralCyan.opacity(0.3))
                .frame(width: 80, height: 80)
                .scaleEffect(circleScale)
                .animation(.easeInOut(duration: breathPhase == .inhale ? 4 : breathPhase == .exhale ? 6 : 0), value: circleScale)
            
            Text("\(3 - cycleCount) breaths left")
                .font(.system(size: 11))
                .foregroundColor(nordicForest.opacity(0.6))
            
            Button("Done") {
                dismiss()
            }
            .font(.system(size: 12))
            .foregroundColor(neuralCyan)
        }
        .padding()
        .onAppear {
            startBreathingCycle()
        }
    }
    
    private func startBreathingCycle() {
        // Inhale (4 seconds)
        breathPhase = .inhale
        circleScale = 1.0
        WKInterfaceDevice.current().play(.start)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
            // Hold (2 seconds)
            breathPhase = .hold
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                // Exhale (6 seconds)
                breathPhase = .exhale
                circleScale = 0.5
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 6) {
                    cycleCount += 1
                    if cycleCount < 3 {
                        startBreathingCycle()
                    } else {
                        WKInterfaceDevice.current().play(.success)
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    WatchCaddieView(
        connectivityManager: WatchConnectivityManagerWatch(),
        workoutManager: WorkoutManager()
    )
}
