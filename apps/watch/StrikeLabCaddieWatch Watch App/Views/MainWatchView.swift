//
//  MainWatchView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Main watch interface with swipe navigation between holes
//

import SwiftUI
import WatchKit

struct MainWatchView: View {
    @EnvironmentObject var workoutManager: WorkoutManager
    @EnvironmentObject var motionManager: MotionManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManagerWatch

    @State private var showClubOverlay = false
    @State private var showShotLog = false
    @State private var showMap = false
    @State private var pendingAutoShot = false
    @State private var selectedHole: Int = 1

    // Watch tokens — mirror the iOS theme.
    private var bg: Color { SLW.bg }
    private var ink: Color { SLW.ink }
    private var ink2: Color { SLW.ink2 }
    private var ink3: Color { SLW.ink3 }
    private var accent: Color { SLW.accent }
    private var warn: Color { SLW.warn }
    private var bad: Color { SLW.bad }

    var body: some View {
        NavigationStack {
            ZStack {
                bg.ignoresSafeArea()

                if workoutManager.isWorkoutActive {
                    activeWorkoutView
                } else {
                    startView
                }
            }
            .navigationTitle("Caddie")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showClubOverlay) {
                ClubConfirmOverlay(
                    isAutoDetected: pendingAutoShot,
                    onClubSelected: { club in
                        logShot(club: club)
                        showClubOverlay = false
                        pendingAutoShot = false
                    },
                    onUndo: {
                        undoLastShot()
                    },
                    onDismiss: {
                        showClubOverlay = false
                        pendingAutoShot = false
                    }
                )
            }
            .sheet(isPresented: $showShotLog) {
                ShotLogView()
            }
            .sheet(isPresented: $showMap) {
                WatchMapView(holeNumber: selectedHole)
            }
            .onAppear {
                setupMotionDetection()
                selectedHole = connectivityManager.currentHoleNumber
            }
            .onChange(of: connectivityManager.currentHoleNumber) { _, newHole in
                // Sync from phone
                selectedHole = newHole
            }
            .onChange(of: selectedHole) { oldHole, newHole in
                // Send hole change to phone when user swipes
                if oldHole != newHole {
                    connectivityManager.sendHoleChange(to: newHole)
                    WKInterfaceDevice.current().play(.click)
                }
            }
        }
    }
    
    // MARK: - Start View
    
    private var startView: some View {
        VStack(spacing: 14) {
            Text("STRIKELAB")
                .font(SLW.mono(9, weight: .semibold))
                .tracking(2.0)
                .foregroundColor(accent)

            Text("Caddie")
                .font(SLW.display(20))
                .foregroundColor(ink)

            Button {
                startWorkout()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "play.fill")
                    Text("START ROUND")
                        .tracking(1.4)
                }
                .font(SLW.mono(11, weight: .semibold))
                .foregroundColor(SLW.accentInk)
                .frame(maxWidth: .infinity, minHeight: 36)
                .background(accent)
            }
            .buttonStyle(.plain)

            HStack(spacing: 6) {
                Circle()
                    .fill(connectivityManager.isPhoneReachable ? accent : bad.opacity(0.7))
                    .frame(width: 6, height: 6)

                Text(connectivityManager.isPhoneReachable ? "iPhone connected" : "No connection")
                    .font(SLW.mono(9))
                    .foregroundColor(ink3)
            }
        }
        .padding()
    }
    
    // MARK: - Active Workout View with Swipe Navigation
    
    private var activeWorkoutView: some View {
        TabView(selection: $selectedHole) {
            ForEach(1...18, id: \.self) { holeNumber in
                holeView(for: holeNumber)
                    .tag(holeNumber)
            }
        }
        .tabViewStyle(.verticalPage)
    }
    
    // MARK: - Individual Hole View
    
    private func holeView(for holeNumber: Int) -> some View {
        VStack(spacing: 6) {
            HStack {
                Button {
                    if selectedHole > 1 { selectedHole -= 1 }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(holeNumber > 1 ? ink2 : ink3.opacity(0.4))
                }
                .buttonStyle(.plain)
                .disabled(holeNumber <= 1)

                Spacer()

                VStack(spacing: 0) {
                    Text("HOLE")
                        .font(SLW.mono(8, weight: .semibold))
                        .tracking(1.6)
                        .foregroundColor(ink3)

                    Text("\(holeNumber)")
                        .font(SLW.num(28))
                        .foregroundColor(ink)
                }

                Spacer()

                Button {
                    if selectedHole < 18 { selectedHole += 1 }
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(holeNumber < 18 ? ink2 : ink3.opacity(0.4))
                }
                .buttonStyle(.plain)
                .disabled(holeNumber >= 18)
            }
            .padding(.horizontal, 8)

            HStack(spacing: 14) {
                statTile(icon: "clock", value: workoutManager.formattedElapsedTime, tint: ink2)
                statTile(icon: "scope", value: "\(shotsThisHole)", tint: accent)
                statTile(icon: "heart.fill", value: workoutManager.formattedHeartRate, tint: bad)
            }

            Button {
                showClubOverlay = true
                pendingAutoShot = false
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                    Text("LOG SHOT")
                        .tracking(1.4)
                }
                .font(SLW.mono(12, weight: .semibold))
                .foregroundColor(SLW.accentInk)
                .frame(maxWidth: .infinity, minHeight: 32)
                .background(accent)
            }
            .buttonStyle(.plain)

            HStack(spacing: 14) {
                bottomAction(icon: "list.bullet", label: "Shots", tint: ink2) {
                    showShotLog = true
                }
                bottomAction(icon: "map", label: "Map", tint: ink2) {
                    showMap = true
                }
                bottomAction(
                    icon: motionManager.isDetectionEnabled ? "waveform.circle.fill" : "waveform.circle",
                    label: "Auto",
                    tint: motionManager.isDetectionEnabled ? accent : ink3
                ) {
                    toggleAutoDetect()
                }
                bottomAction(icon: "flag.checkered", label: "End", tint: bad) {
                    endWorkout()
                }
            }
        }
        .padding(.horizontal, 6)
    }

    private func statTile(icon: String, value: String, tint: Color) -> some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(tint)
            Text(value)
                .font(SLW.num(11))
                .foregroundColor(ink)
        }
    }

    private func bottomAction(icon: String, label: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                Text(label)
                    .font(SLW.mono(8))
                    .tracking(1.0)
            }
            .foregroundColor(tint)
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Computed Properties
    
    private var shotsThisHole: Int {
        // Count shots from current hole
        return connectivityManager.recentShots.count
    }
    
    // MARK: - Actions
    
    private func startWorkout() {
        workoutManager.startWorkout()
        motionManager.startDetection()
    }
    
    private func endWorkout() {
        workoutManager.endWorkout()
        motionManager.stopDetection()
    }
    
    private func toggleAutoDetect() {
        if motionManager.isDetectionEnabled {
            motionManager.stopDetection()
        } else {
            motionManager.startDetection()
        }
    }
    
    private func setupMotionDetection() {
        motionManager.onSwingDetected = { confidence in
            // Show club selection when swing detected
            pendingAutoShot = true
            showClubOverlay = true
        }
    }
    
    private func logShot(club: ClubWatch) {
        let event = ShotEventWatch(
            club: club,
            confidence: pendingAutoShot ? motionManager.lastSwingConfidence : nil,
            isManual: !pendingAutoShot
        )
        connectivityManager.sendShotEvent(event)
        
        // Haptic feedback
        WKInterfaceDevice.current().play(.success)
    }
    
    private func undoLastShot() {
        connectivityManager.sendUndoRequest()
        WKInterfaceDevice.current().play(.click)
    }
}

#Preview {
    MainWatchView()
        .environmentObject(WorkoutManager())
        .environmentObject(MotionManager())
        .environmentObject(WatchConnectivityManagerWatch())
}
