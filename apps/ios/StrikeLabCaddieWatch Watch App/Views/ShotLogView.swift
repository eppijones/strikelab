//
//  ShotLogView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Recent shots list
//

import SwiftUI

struct ShotLogView: View {
    @EnvironmentObject var connectivityManager: WatchConnectivityManagerWatch
    @Environment(\.dismiss) private var dismiss
    
    // Theme colors
    let nordicForest = Color(red: 30/255, green: 58/255, blue: 43/255)
    let neuralCyan = Color(red: 0/255, green: 212/255, blue: 255/255)
    
    var body: some View {
        NavigationStack {
            List {
                if connectivityManager.recentShots.isEmpty {
                    emptyState
                } else {
                    ForEach(connectivityManager.recentShots) { shot in
                        shotRow(shot)
                    }
                }
            }
            .listStyle(.carousel)
            .navigationTitle("Recent Shots")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "scope")
                .font(.system(size: 24))
                .foregroundColor(.secondary)
            
            Text("No shots logged")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .listRowBackground(Color.clear)
    }
    
    private func shotRow(_ shot: ShotEventWatch) -> some View {
        HStack {
            // Club icon
            ZStack {
                Circle()
                    .fill(clubColor(shot.club.group).opacity(0.2))
                    .frame(width: 28, height: 28)
                
                Image(systemName: shot.club.group.iconName)
                    .font(.system(size: 12))
                    .foregroundColor(clubColor(shot.club.group))
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(shot.club.shortName)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(nordicForest)
                
                Text(timeString(shot.timestamp))
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Auto-detect indicator
            if !shot.isManual {
                Image(systemName: "waveform")
                    .font(.system(size: 10))
                    .foregroundColor(neuralCyan)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func clubColor(_ group: ClubGroupWatch) -> Color {
        switch group {
        case .driver: return neuralCyan
        case .wood, .hybrid: return Color(red: 212/255, green: 197/255, blue: 168/255)
        case .iron: return nordicForest
        case .wedge: return Color(red: 142/255, green: 184/255, blue: 151/255)
        case .putt: return .gray
        }
    }
    
    private func timeString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

#Preview {
    ShotLogView()
        .environmentObject(WatchConnectivityManagerWatch())
}
