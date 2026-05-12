//
//  StrikeLabCaddieWatchApp.swift
//  StrikeLabCaddieWatch Watch App
//
//  StrikeLabCaddie - watchOS App Entry
//

import SwiftUI

@main
struct StrikeLabCaddieWatch_Watch_AppApp: App {
    @StateObject private var workoutManager = WorkoutManager()
    @StateObject private var motionManager = MotionManager()
    @StateObject private var connectivityManager = WatchConnectivityManagerWatch()
    @StateObject private var locationManager = WatchLocationManager()
    @StateObject private var swingConfirmer = SwingConfirmer()
    @StateObject private var hrManager = HighFrequencyHRManager()
    @StateObject private var impactAudio = ImpactAudioManager()
    @StateObject private var pressureMonitor = PressureMonitor()
    @StateObject private var referenceBaseline = WatchReferenceBaseline()
    @StateObject private var batterySaver = BatterySaver()

    var body: some Scene {
        WindowGroup {
            MainWatchView()
                .environmentObject(workoutManager)
                .environmentObject(motionManager)
                .environmentObject(connectivityManager)
                .environmentObject(locationManager)
                .environmentObject(swingConfirmer)
                .environmentObject(hrManager)
                .environmentObject(impactAudio)
                .environmentObject(pressureMonitor)
                .environmentObject(referenceBaseline)
                .environmentObject(batterySaver)
        }
    }
}
