//
//  StrikeLabCaddieWatchApp.swift
//  StrikeLabCaddieWatch Watch App
//
//  StrikeLab Nordic Caddie - watchOS App Entry
//

import SwiftUI

@main
struct StrikeLabCaddieWatch_Watch_AppApp: App {
    @StateObject private var workoutManager = WorkoutManager()
    @StateObject private var motionManager = MotionManager()
    @StateObject private var connectivityManager = WatchConnectivityManagerWatch()
    
    var body: some Scene {
        WindowGroup {
            MainWatchView()
                .environmentObject(workoutManager)
                .environmentObject(motionManager)
                .environmentObject(connectivityManager)
        }
    }
}
