//
//  ShotListView.swift
//  StrikeLabCaddie
//
//  Shot history list with distances
//

import SwiftUI

struct ShotListView: View {
    @Binding var round: Round
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var unitsManager: UnitsManager

    @State private var addShotRoute: AddShotRoute?
    @State private var showMap = false
    @State private var swingCardShot: Shot?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Summary header
                shotSummaryCard
                
                // Action buttons
                actionButtons
                
                // Shot list by hole
                shotListSection
                
                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Shots")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showMap = true
                } label: {
                    Image(systemName: "map")
                        .foregroundColor(Theme.nordicForest)
                }
            }
        }
        .fullScreenCover(item: $addShotRoute) { _ in
            AddShotView(round: $round)
        }
        .navigationDestination(isPresented: $showMap) {
            ShotMapView(round: $round)
        }
        .sheet(item: $swingCardShot) { shot in
            if let event = persistenceManager.enhancedShot(byId: shot.id) {
                SwingCardView(
                    event: event,
                    recentBaseline: persistenceManager.recentEnhancedShots,
                    armLengthMeters: persistenceManager.player.armLengthMeters,
                    playerAgeYears: persistenceManager.player.ageYears,
                    clubModels: persistenceManager.player.clubModels
                )
                .environmentObject(persistenceManager)
            } else {
                Text("Could not load swing data for this shot.")
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink3)
                    .padding(24)
            }
        }
    }
    
    // MARK: - Summary Card
    
    private var shotSummaryCard: some View {
        HStack(spacing: 0) {
            // Total shots
            VStack(spacing: 4) {
                Text("SHOTS")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(round.shots.count)")
                    .font(Theme.statFont(28))
                    .foregroundColor(Theme.nordicForest)
            }
            .frame(maxWidth: .infinity)
            
            Divider()
                .frame(height: 40)
            
            // Tracked with distance
            VStack(spacing: 4) {
                Text("TRACKED")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(shotsWithDistance)")
                    .font(Theme.statFont(28))
                    .foregroundColor(Theme.neuralCyan)
            }
            .frame(maxWidth: .infinity)
            
            Divider()
                .frame(height: 40)
            
            // Average distance
            VStack(spacing: 4) {
                Text("AVG DIST")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                if let avg = averageDistance {
                    Text(unitsManager.format(yards: avg))
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.nordicForest)
                } else {
                    Text("–")
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.neutral)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.vertical, 16)
        .glassCard()
    }
    
    private var shotsWithDistance: Int {
        round.shots.filter { $0.distanceYards != nil }.count
    }
    
    private var averageDistance: Double? {
        let distances = round.shots.compactMap { $0.distanceYards }
        guard !distances.isEmpty else { return nil }
        return distances.reduce(0, +) / Double(distances.count)
    }
    
    // MARK: - Action Buttons
    
    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button {
                addShotRoute = AddShotRoute()
            } label: {
                HStack {
                    Image(systemName: "plus.circle")
                    Text("Add Shot")
                }
                .font(Theme.labelFont(14))
                .foregroundColor(Theme.nordicForest)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .compactGlassCard()
            
            Button {
                undoLastShot()
            } label: {
                HStack {
                    Image(systemName: "arrow.uturn.backward")
                    Text("Undo Last")
                }
                .font(Theme.labelFont(14))
                .foregroundColor(round.shots.isEmpty ? Theme.neutral : Theme.overPar)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .compactGlassCard()
            .disabled(round.shots.isEmpty)
        }
    }
    
    // MARK: - Shot List Section
    
    private var shotListSection: some View {
        VStack(spacing: 16) {
            // Group shots by hole
            ForEach(1...18, id: \.self) { holeNumber in
                let holeShots = round.shots(forHole: holeNumber)
                if !holeShots.isEmpty {
                    holeShotGroup(holeNumber: holeNumber, shots: holeShots)
                }
            }
            
            // Unassigned shots
            let unassigned = round.shots.filter { $0.holeNumber == nil }
            if !unassigned.isEmpty {
                holeShotGroup(holeNumber: nil, shots: unassigned)
            }
            
            if round.shots.isEmpty {
                emptyState
            }
        }
    }
    
    private func holeShotGroup(holeNumber: Int?, shots: [Shot]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            Text(holeNumber != nil ? "HOLE \(holeNumber!)" : "UNASSIGNED")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            // Shots with swipe-to-delete
            ForEach(shots) { shot in
                shotRow(shot: shot)
                    .contextMenu {
                        Button(role: .destructive) {
                            deleteShot(shot)
                        } label: {
                            Label("Delete Shot", systemImage: "trash")
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            deleteShot(shot)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
            }
        }
    }
    
    private func deleteShot(_ shot: Shot) {
        round.shots.removeAll { $0.id == shot.id }
        persistenceManager.saveCurrentRound()
    }
    
    private func shotRow(shot: Shot) -> some View {
        let hasSwingData = shot.motion != nil
            || shot.heartRate != nil
            || persistenceManager.swingAudioURL(for: shot.id) != nil

        return HStack(spacing: 12) {
            // Club icon
            ZStack {
                Circle()
                    .fill(clubColor(for: shot.clubGroup).opacity(0.2))
                    .frame(width: 36, height: 36)
                
                Image(systemName: shot.clubGroup.iconName)
                    .font(.system(size: 14))
                    .foregroundColor(clubColor(for: shot.clubGroup))
            }
            
            // Club and distance
            VStack(alignment: .leading, spacing: 2) {
                Text(shot.club.shortName)
                    .font(Theme.statFont(16))
                    .foregroundColor(Theme.nordicForest)
                
                if let yards = shot.distanceYards {
                    Text(unitsManager.format(yards: yards))
                        .font(Theme.statFont(13))
                        .foregroundColor(Theme.neuralCyan)
                } else {
                    Text("Distance pending…")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.neutral)
                }
            }
            
            Spacer()
            
            // Time + swing-data affordance
            VStack(alignment: .trailing, spacing: 2) {
                Text(shot.timeString)
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))

                if hasSwingData {
                    Image(systemName: shot.motion != nil ? "waveform.path.ecg" : "waveform")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(Theme.neuralCyan)
                }

                if !shot.isManual {
                    HStack(spacing: 2) {
                        Image(systemName: "applewatch")
                            .font(.system(size: 10))
                        Text("Auto")
                            .font(Theme.labelFont(10))
                    }
                    .foregroundColor(Theme.neuralCyan.opacity(0.7))
                }
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
        .contentShape(Rectangle())
        .onTapGesture {
            guard hasSwingData else { return }
            swingCardShot = shot
        }
    }
    
    private func clubColor(for group: ClubGroup) -> Color {
        switch group {
        case .driver: return Theme.neuralCyan
        case .wood, .hybrid: return Theme.champagne
        case .iron: return Theme.nordicForest
        case .wedge: return Theme.nordicSage
        case .putt: return Theme.neutral
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "scope")
                .font(.system(size: 48))
                .foregroundColor(Theme.nordicForest.opacity(0.3))
            
            Text("No Shots Recorded")
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.nordicForest)
            
            Text("Tap 'Add Shot' or log shots from your Apple Watch")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    // MARK: - Actions
    
    private func undoLastShot() {
        _ = round.undoLastShot()
    }
}

private struct AddShotRoute: Identifiable {
    let id = UUID()
}

// MARK: - Add Shot

struct AddShotView: View {
    @Binding var round: Round
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedClub: Club = .iron7
    @State private var selectedGroup: ClubGroup?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let group = selectedGroup {
                        // Show clubs in selected group
                        clubListSection(group: group)
                    } else {
                        // Show common clubs and group selector
                        quickSelectSection
                    }
                }
                .padding()
            }
            .nordicBackground()
            .navigationTitle("Add Shot v2")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if selectedGroup != nil {
                        Button {
                            selectedGroup = nil
                        } label: {
                            Image(systemName: "chevron.left")
                                .foregroundColor(Theme.nordicForest)
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(Theme.nordicForest.opacity(0.7))
                }
            }
        }
    }
    
    // MARK: - Quick Select Section
    
    private var quickSelectSection: some View {
        VStack(spacing: 16) {
            Text("Common Clubs")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // Common clubs grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 10) {
                ForEach(Club.commonClubs) { club in
                    clubButton(club)
                }
            }
            
            Divider()
                .padding(.vertical, 8)
            
            Text("All Clubs")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // Club group selector
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 10) {
                ForEach(ClubGroup.allCases) { group in
                    groupButton(group)
                }
            }
        }
    }
    
    private func clubButton(_ club: Club) -> some View {
        Button {
            addShot(club: club)
        } label: {
            Text(club.shortName)
                .font(.system(size: 18, weight: .bold, design: .monospaced))
                .foregroundColor(Theme.ink)
                .shadow(color: .black.opacity(0.9), radius: 1, x: 0, y: 1)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(clubColor(for: club.group))
                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                .cornerRadius(Theme.smallCornerRadius)
        }
    }
    
    private func groupButton(_ group: ClubGroup) -> some View {
        Button {
            if group == .driver {
                addShot(club: .driver)
            } else if group == .putt {
                addShot(club: .putter)
            } else {
                selectedGroup = group
            }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: group.iconName)
                    .font(.system(size: 18))
                Text(group.shortLabel)
                    .font(Theme.labelFont(12))
            }
            .foregroundColor(Theme.nordicForest)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.5))
            .cornerRadius(Theme.smallCornerRadius)
        }
    }
    
    // MARK: - Club List Section
    
    private func clubListSection(group: ClubGroup) -> some View {
        VStack(spacing: 16) {
            Text(group.rawValue)
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.nordicForest)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(group.clubs) { club in
                    Button {
                        addShot(club: club)
                    } label: {
                        Text(club.shortName)
                            .font(.system(size: 20, weight: .bold, design: .monospaced))
                            .foregroundColor(Theme.ink)
                            .shadow(color: .black.opacity(0.9), radius: 1, x: 0, y: 1)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(clubColor(for: group))
                            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                            .cornerRadius(Theme.smallCornerRadius)
                    }
                }
            }
        }
    }
    
    // MARK: - Helpers
    
    private func clubColor(for group: ClubGroup) -> Color {
        switch group {
        case .driver: return Theme.accent.opacity(0.82)
        case .wood, .hybrid: return Theme.warn.opacity(0.82)
        case .iron: return Theme.surface3
        case .wedge: return Theme.accent.opacity(0.82)
        case .putt: return Theme.ink4
        }
    }
    
    private func addShot(club: Club) {
        let shot = Shot(
            club: club,
            holeNumber: round.currentHoleNumber,
            isManual: true
        )
        round.addShot(shot)
        dismiss()
    }
}

#Preview {
    NavigationStack {
        ShotListView(round: .constant(
            Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            )
        ))
        .environmentObject(LocationManager())
        .environmentObject(PersistenceManager())
    }
}
