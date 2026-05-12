//
//  PlanModeView.swift
//  StrikeLabCaddie
//
//  Course strategy planning - draw shots on hole maps
//

import SwiftUI
import MapKit

// MARK: - Alenda Hole Data

/// Distance data for each Alenda hole from different tees
struct AlendaHoleData {
    let holeNumber: Int
    let par: Int
    let handicap: Int
    let whiteTeeDistance: Int  // meters
    let yellowTeeDistance: Int // meters
    let redTeeDistance: Int    // meters
    
    /// Get distance based on tee color
    func distance(for teeName: String) -> Int {
        switch teeName.lowercased() {
        case "white": return whiteTeeDistance
        case "yellow": return yellowTeeDistance
        case "red": return redTeeDistance
        default: return yellowTeeDistance
        }
    }
}

/// Alenda Golf hole data (distances in meters)
let alendaHoles: [AlendaHoleData] = [
    AlendaHoleData(holeNumber: 1, par: 5, handicap: 4, whiteTeeDistance: 500, yellowTeeDistance: 485, redTeeDistance: 399),
    AlendaHoleData(holeNumber: 2, par: 4, handicap: 10, whiteTeeDistance: 340, yellowTeeDistance: 325, redTeeDistance: 280),
    AlendaHoleData(holeNumber: 3, par: 3, handicap: 16, whiteTeeDistance: 165, yellowTeeDistance: 150, redTeeDistance: 120),
    AlendaHoleData(holeNumber: 4, par: 4, handicap: 2, whiteTeeDistance: 390, yellowTeeDistance: 375, redTeeDistance: 320),
    AlendaHoleData(holeNumber: 5, par: 4, handicap: 8, whiteTeeDistance: 355, yellowTeeDistance: 340, redTeeDistance: 295),
    AlendaHoleData(holeNumber: 6, par: 3, handicap: 14, whiteTeeDistance: 175, yellowTeeDistance: 160, redTeeDistance: 130),
    AlendaHoleData(holeNumber: 7, par: 5, handicap: 6, whiteTeeDistance: 475, yellowTeeDistance: 460, redTeeDistance: 385),
    AlendaHoleData(holeNumber: 8, par: 4, handicap: 12, whiteTeeDistance: 320, yellowTeeDistance: 305, redTeeDistance: 265),
    AlendaHoleData(holeNumber: 9, par: 4, handicap: 18, whiteTeeDistance: 310, yellowTeeDistance: 295, redTeeDistance: 255),
    AlendaHoleData(holeNumber: 10, par: 4, handicap: 3, whiteTeeDistance: 385, yellowTeeDistance: 370, redTeeDistance: 315),
    AlendaHoleData(holeNumber: 11, par: 4, handicap: 9, whiteTeeDistance: 350, yellowTeeDistance: 335, redTeeDistance: 290),
    AlendaHoleData(holeNumber: 12, par: 5, handicap: 7, whiteTeeDistance: 490, yellowTeeDistance: 475, redTeeDistance: 395),
    AlendaHoleData(holeNumber: 13, par: 3, handicap: 15, whiteTeeDistance: 155, yellowTeeDistance: 140, redTeeDistance: 115),
    AlendaHoleData(holeNumber: 14, par: 4, handicap: 1, whiteTeeDistance: 405, yellowTeeDistance: 390, redTeeDistance: 335),
    AlendaHoleData(holeNumber: 15, par: 4, handicap: 11, whiteTeeDistance: 335, yellowTeeDistance: 320, redTeeDistance: 275),
    AlendaHoleData(holeNumber: 16, par: 3, handicap: 17, whiteTeeDistance: 145, yellowTeeDistance: 130, redTeeDistance: 105),
    AlendaHoleData(holeNumber: 17, par: 5, handicap: 5, whiteTeeDistance: 485, yellowTeeDistance: 470, redTeeDistance: 390),
    AlendaHoleData(holeNumber: 18, par: 4, handicap: 13, whiteTeeDistance: 330, yellowTeeDistance: 315, redTeeDistance: 270)
]

struct PlanModeView: View {
    @Binding var round: Round
    @EnvironmentObject var persistenceManager: PersistenceManager
    
    @State private var selectedHole: Int = 1
    @State private var showClubPicker = false
    @State private var showShotEditor = false
    @State private var pendingPosition: Coordinate?
    @State private var selectedClub: Club = .driver
    @State private var editingShot: PlannedShot?
    @State private var selectedShotIndex: Int? = nil
    @State private var draggedPosition: CGPoint? = nil
    
    /// Current hole data from Alenda
    private var currentHoleData: AlendaHoleData {
        alendaHoles.first { $0.holeNumber == selectedHole } ?? alendaHoles[0]
    }
    
    /// Total hole distance based on selected tee
    private var totalHoleDistance: Int {
        let teeName = round.selectedTee?.name ?? "Yellow"
        return currentHoleData.distance(for: teeName)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with hole selector
            holeSelector
            
            // Hole info bar
            holeInfoBar
            
            // Main planning area with Alenda image
            ZStack {
                // Alenda hole image
                alendaHoleImage
                
                // Planned shots overlay
                plannedShotsOverlay
            }
            .frame(maxHeight: .infinity)
            
            // Shot list (editable)
            if !round.plannedShots(forHole: selectedHole).isEmpty {
                shotListSection
            }
            
            // Bottom controls
            controlsBar
        }
        .nordicBackground()
        .navigationTitle("Plan Mode")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showClubPicker) {
            clubPickerSheet
        }
        .sheet(isPresented: $showShotEditor) {
            shotEditorSheet
        }
    }
    
    // MARK: - Hole Selector
    
    private var holeSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(1...18, id: \.self) { hole in
                    Button {
                        selectedHole = hole
                        selectedShotIndex = nil
                    } label: {
                        VStack(spacing: 2) {
                            Text("\(hole)")
                                .font(Theme.statFont(16))
                            
                            let plannedCount = round.plannedShots(forHole: hole).count
                            if plannedCount > 0 {
                                Circle()
                                    .fill(Theme.nordicSage)
                                    .frame(width: 6, height: 6)
                            }
                        }
                        .foregroundColor(selectedHole == hole ? .white : Theme.nordicForest)
                        .frame(width: 40, height: 50)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(selectedHole == hole ? Theme.nordicForest : Color.white.opacity(0.5))
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Theme.nordicPaper.opacity(0.8))
    }
    
    // MARK: - Hole Info Bar
    
    private var holeInfoBar: some View {
        HStack(spacing: 16) {
            // Hole info
            HStack(spacing: 8) {
                Text("Hole \(selectedHole)")
                    .font(Theme.statFont(16))
                    .foregroundColor(Theme.nordicForest)
                
                Text("Par \(currentHoleData.par)")
                    .font(Theme.labelFont(14))
                    .foregroundColor(Theme.nordicForest.opacity(0.7))
            }
            
            Spacer()
            
            // Distance from tee
            HStack(spacing: 4) {
                Circle()
                    .fill(teeColor)
                    .frame(width: 10, height: 10)
                
                Text("\(totalHoleDistance)m")
                    .font(Theme.statFont(16))
                    .foregroundColor(Theme.nordicForest)
            }
            
            // Handicap
            Text("HCP \(currentHoleData.handicap)")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.6))
    }
    
    private var teeColor: Color {
        switch round.selectedTee?.name.lowercased() ?? "yellow" {
        case "white": return .white.opacity(0.8)
        case "yellow": return .yellow
        case "red": return .red
        case "blue": return .blue
        default: return .yellow
        }
    }
    
    // MARK: - Alenda Hole Image
    
    private var alendaHoleImage: some View {
        GeometryReader { geometry in
            ZStack {
                // Load Alenda hole image
                if let image = loadAlendaHoleImage(for: selectedHole) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    // Fallback to generic fairway
                    genericFairwayView(in: geometry)
                }
                
                // Tap instruction
                if round.plannedShots(forHole: selectedHole).isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "hand.tap")
                            .font(.system(size: 32))
                            .foregroundColor(.white.opacity(0.8))
                        
                        Text("Tap to place shots")
                            .font(Theme.labelFont(14))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding()
                    .background(Color.black.opacity(0.4))
                    .cornerRadius(12)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { location in
                handleTap(at: location, in: geometry.size)
            }
        }
    }
    
    private func loadAlendaHoleImage(for hole: Int) -> UIImage? {
        let imageName = String(format: "alenda_hole_%02d", hole)
        
        // Try UIImage(named:) first - works for images in bundle
        if let image = UIImage(named: imageName) {
            return image
        }
        
        // Try to load from bundle root
        if let path = Bundle.main.path(forResource: imageName, ofType: "png"),
           let image = UIImage(contentsOfFile: path) {
            return image
        }
        
        // Try with GolfCourses/Alenda subdirectory
        if let path = Bundle.main.path(forResource: imageName, ofType: "png", inDirectory: "GolfCourses/Alenda"),
           let image = UIImage(contentsOfFile: path) {
            return image
        }
        
        // Try Alenda subdirectory only
        if let path = Bundle.main.path(forResource: imageName, ofType: "png", inDirectory: "Alenda"),
           let image = UIImage(contentsOfFile: path) {
            return image
        }
        
        return nil
    }
    
    private func genericFairwayView(in geometry: GeometryProxy) -> some View {
        ZStack {
            // Background rough
            Rectangle()
                .fill(Color(red: 0.3, green: 0.5, blue: 0.3).opacity(0.3))
            
            // Fairway
            FairwayShape(holeNumber: selectedHole)
                .fill(Theme.nordicSage.opacity(0.5))
                .padding(.horizontal, 40)
            
            // Green
            Ellipse()
                .fill(Theme.nordicSage.opacity(0.7))
                .frame(width: 80, height: 60)
                .position(x: geometry.size.width / 2, y: 60)
            
            // Flag
            VStack(spacing: 0) {
                Triangle()
                    .fill(Color.red)
                    .frame(width: 15, height: 12)
                    .offset(x: 7)
                Rectangle()
                    .fill(Color.white)
                    .frame(width: 2, height: 20)
            }
            .position(x: geometry.size.width / 2, y: 55)
            
            // Tee box
            RoundedRectangle(cornerRadius: 3)
                .fill(teeColor)
                .frame(width: 30, height: 15)
                .position(x: geometry.size.width / 2, y: geometry.size.height - 40)
        }
    }
    
    // MARK: - Planned Shots Overlay
    
    private var plannedShotsOverlay: some View {
        GeometryReader { geometry in
            let holePlannedShots = round.plannedShots(forHole: selectedHole)
            
            // Draw lines between shots
            Path { path in
                guard !holePlannedShots.isEmpty else { return }
                
                // Start from tee (bottom center)
                let startPoint = CGPoint(x: geometry.size.width / 2, y: geometry.size.height - 40)
                path.move(to: startPoint)
                
                for shot in holePlannedShots {
                    let point = positionToPoint(shot.targetPosition, in: geometry.size)
                    path.addLine(to: point)
                }
            }
            .stroke(Theme.neuralCyan, style: StrokeStyle(lineWidth: 3, dash: [8, 4]))
            
            // Draw shot markers
            ForEach(Array(holePlannedShots.enumerated()), id: \.element.id) { index, shot in
                let point = positionToPoint(shot.targetPosition, in: geometry.size)
                let isSelected = selectedShotIndex == index
                
                shotMarker(shot: shot, isSelected: isSelected)
                    .position(point)
                    .onTapGesture {
                        selectedShotIndex = index
                        editingShot = shot
                        showShotEditor = true
                    }
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                draggedPosition = value.location
                            }
                            .onEnded { value in
                                moveShot(shot, to: value.location, in: geometry.size)
                                draggedPosition = nil
                            }
                    )
            }
        }
    }
    
    private func shotMarker(shot: PlannedShot, isSelected: Bool) -> some View {
        ZStack {
            // Selection ring
            if isSelected {
                Circle()
                    .stroke(Theme.neuralCyan, lineWidth: 3)
                    .frame(width: 48, height: 48)
            }
            
            Circle()
                .fill(clubColor(for: shot.club.group))
                .frame(width: 40, height: 40)
                .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
            
            Text(shot.club.shortName)
                .font(Theme.statFont(12))
                .foregroundColor(.white)
            
            // Shot number badge
            Text("\(shot.order)")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 18, height: 18)
                .background(Theme.nordicForest)
                .clipShape(Circle())
                .offset(x: 16, y: -16)
        }
    }
    
    // MARK: - Shot List Section
    
    private var shotListSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(Array(round.plannedShots(forHole: selectedHole).enumerated()), id: \.element.id) { index, shot in
                    shotListItem(shot: shot, index: index)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color.white.opacity(0.9))
    }
    
    private func shotListItem(shot: PlannedShot, index: Int) -> some View {
        let distanceFromTee = calculateDistanceFromTee(to: shot)
        let remainingDistance = totalHoleDistance - distanceFromTee
        let isSelected = selectedShotIndex == index
        
        return Button {
            selectedShotIndex = index
            editingShot = shot
            showShotEditor = true
        } label: {
            VStack(spacing: 4) {
                // Shot number
                Text("Shot \(shot.order)")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                // Club
                Text(shot.club.shortName)
                    .font(Theme.statFont(16))
                    .foregroundColor(isSelected ? .white : Theme.nordicForest)
                
                // Distance info
                VStack(spacing: 2) {
                    Text("\(distanceFromTee)m")
                        .font(Theme.labelFont(11))
                        .foregroundColor(isSelected ? .white.opacity(0.8) : Theme.nordicSage)
                    
                    Text("→ \(remainingDistance)m")
                        .font(Theme.labelFont(10))
                        .foregroundColor(isSelected ? .white.opacity(0.7) : Theme.nordicForest.opacity(0.5))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(isSelected ? clubColor(for: shot.club.group) : Color.white)
                    .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
            )
        }
        .buttonStyle(.plain)
    }
    
    /// Calculate approximate distance from tee to shot position
    private func calculateDistanceFromTee(to shot: PlannedShot) -> Int {
        // Position is normalized (0-1), Y=1 is tee, Y=0 is green
        let progress = 1.0 - shot.targetPosition.latitude
        return Int(Double(totalHoleDistance) * progress)
    }
    
    // MARK: - Controls Bar
    
    private var controlsBar: some View {
        HStack(spacing: 16) {
            // Clear all shots for this hole
            Button {
                clearHoleShots()
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "trash")
                    Text("Clear")
                }
                .font(Theme.labelFont(14))
                .foregroundColor(Theme.overPar)
            }
            .buttonStyle(.plain)
            .disabled(round.plannedShots(forHole: selectedHole).isEmpty)
            
            Spacer()
            
            // Shot count for this hole
            let count = round.plannedShots(forHole: selectedHole).count
            HStack(spacing: 4) {
                Image(systemName: "flag")
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text("\(count) planned")
                    .font(Theme.labelFont(14))
                    .foregroundColor(Theme.nordicForest)
            }
            
            Spacer()
            
            // Undo last shot
            Button {
                undoLastShot()
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.uturn.backward")
                    Text("Undo")
                }
                .font(Theme.labelFont(14))
                .foregroundColor(Theme.nordicForest)
            }
            .buttonStyle(.plain)
            .disabled(round.plannedShots(forHole: selectedHole).isEmpty)
        }
        .padding()
        .background(Color.white.opacity(0.8))
    }
    
    // MARK: - Club Picker Sheet
    
    private var clubPickerSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Text("Select Club")
                        .font(Theme.titleFont(20))
                        .foregroundColor(Theme.nordicForest)
                    
                    // Suggested club based on distance
                    if let suggestedClub = suggestClub() {
                        HStack {
                            Text("Suggested:")
                                .font(Theme.labelFont(14))
                                .foregroundColor(Theme.nordicForest.opacity(0.6))
                            
                            Text(suggestedClub.shortName)
                                .font(Theme.statFont(16))
                                .foregroundColor(Theme.neuralCyan)
                        }
                        .padding(.bottom, 8)
                    }
                    
                    // Common clubs grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        ForEach(Club.commonClubs) { club in
                            Button {
                                selectClub(club)
                            } label: {
                                Text(club.shortName)
                                    .font(Theme.statFont(18))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                                    .background(clubColor(for: club.group))
                                    .cornerRadius(Theme.smallCornerRadius)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding()
            }
            .nordicBackground()
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") {
                        showClubPicker = false
                        pendingPosition = nil
                        editingShot = nil
                    }
                    .foregroundColor(Theme.nordicForest.opacity(0.7))
                }
            }
        }
        .presentationDetents([.medium])
    }
    
    // MARK: - Shot Editor Sheet
    
    private var shotEditorSheet: some View {
        NavigationStack {
            if let shot = editingShot {
                let distanceFromTee = calculateDistanceFromTee(to: shot)
                let remainingDistance = totalHoleDistance - distanceFromTee
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Shot info header
                        VStack(spacing: 8) {
                            Text("Shot \(shot.order)")
                                .font(Theme.titleFont(24))
                                .foregroundColor(Theme.nordicForest)
                            
                            HStack(spacing: 20) {
                                VStack {
                                    Text("From Tee")
                                        .font(Theme.labelFont(11))
                                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                                    Text("\(distanceFromTee)m")
                                        .font(Theme.statFont(20))
                                        .foregroundColor(Theme.nordicSage)
                                }
                                
                                VStack {
                                    Text("To Hole")
                                        .font(Theme.labelFont(11))
                                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                                    Text("\(remainingDistance)m")
                                        .font(Theme.statFont(20))
                                        .foregroundColor(Theme.neuralCyan)
                                }
                            }
                        }
                        .padding()
                        .glassCard()
                        
                        // Recommended club
                        if let recommended = recommendClub(for: remainingDistance) {
                            HStack {
                                Image(systemName: "lightbulb.fill")
                                    .foregroundColor(Theme.champagne)
                                Text("Recommended: \(recommended.shortName)")
                                    .font(Theme.statFont(16))
                                    .foregroundColor(Theme.nordicForest)
                            }
                            .padding()
                            .background(Theme.champagne.opacity(0.2))
                            .cornerRadius(10)
                        }
                        
                        Divider()
                        
                        // Club selection
                        Text("Change Club")
                            .font(Theme.labelFont(14))
                            .foregroundColor(Theme.nordicForest.opacity(0.6))
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            ForEach(Club.commonClubs) { club in
                                Button {
                                    updateShotClub(shot, to: club)
                                } label: {
                                    Text(club.shortName)
                                        .font(Theme.statFont(16))
                                        .foregroundColor(shot.club == club ? .white : Theme.nordicForest)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(
                                            RoundedRectangle(cornerRadius: 10)
                                                .fill(shot.club == club ? clubColor(for: club.group) : Color.white.opacity(0.5))
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        
                        Spacer(minLength: 20)
                        
                        // Delete button
                        Button(role: .destructive) {
                            deletePlannedShot(shot)
                            showShotEditor = false
                        } label: {
                            HStack {
                                Image(systemName: "trash")
                                Text("Delete Shot")
                            }
                            .foregroundColor(Theme.overPar)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Theme.overPar.opacity(0.1))
                            .cornerRadius(10)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding()
                }
                .nordicBackground()
            }
        }
        .presentationDetents([.large])
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") {
                    showShotEditor = false
                    editingShot = nil
                    selectedShotIndex = nil
                }
                .foregroundColor(Theme.nordicForest)
            }
        }
    }
    
    // MARK: - Club Recommendation
    
    /// Suggest club based on remaining distance
    private func suggestClub() -> Club? {
        guard let position = pendingPosition else { return nil }
        let distanceFromTee = Int(Double(totalHoleDistance) * (1.0 - position.latitude))
        let remaining = totalHoleDistance - distanceFromTee
        return recommendClub(for: remaining)
    }
    
    /// Recommend club based on distance (in meters)
    private func recommendClub(for distance: Int) -> Club? {
        // Average distances for each club (in meters)
        let clubDistances: [(Club, ClosedRange<Int>)] = [
            (.putter, 0...5),
            (.wedge60, 6...45),
            (.wedge56, 46...65),
            (.wedge52, 66...85),
            (.pitchingWedge, 86...110),
            (.iron9, 111...125),
            (.iron8, 126...140),
            (.iron7, 141...155),
            (.iron6, 156...170),
            (.iron5, 171...185),
            (.wood5, 186...200),
            (.wood3, 201...220),
            (.driver, 221...300)
        ]
        
        for (club, range) in clubDistances {
            if range.contains(distance) {
                return club
            }
        }
        
        return distance > 300 ? .driver : .putter
    }
    
    // MARK: - Helpers
    
    private func handleTap(at location: CGPoint, in size: CGSize) {
        let position = pointToPosition(location, in: size)
        pendingPosition = position
        editingShot = nil
        showClubPicker = true
    }
    
    private func selectClub(_ club: Club) {
        if let position = pendingPosition {
            let order = round.plannedShots(forHole: selectedHole).count + 1
            let newShot = PlannedShot(
                holeNumber: selectedHole,
                order: order,
                club: club,
                targetPosition: position
            )
            round.addPlannedShot(newShot)
        }
        
        showClubPicker = false
        pendingPosition = nil
        persistenceManager.saveCurrentRound()
    }
    
    private func updateShotClub(_ shot: PlannedShot, to club: Club) {
        var updated = shot
        updated.club = club
        round.updatePlannedShot(updated)
        editingShot = updated
        persistenceManager.saveCurrentRound()
    }
    
    private func moveShot(_ shot: PlannedShot, to location: CGPoint, in size: CGSize) {
        var updated = shot
        updated.targetPosition = pointToPosition(location, in: size)
        round.updatePlannedShot(updated)
        persistenceManager.saveCurrentRound()
    }
    
    private func deletePlannedShot(_ shot: PlannedShot) {
        round.removePlannedShot(shot)
        reorderShots()
        selectedShotIndex = nil
        editingShot = nil
        persistenceManager.saveCurrentRound()
    }
    
    private func clearHoleShots() {
        round.clearPlannedShots(forHole: selectedHole)
        selectedShotIndex = nil
        persistenceManager.saveCurrentRound()
    }
    
    private func undoLastShot() {
        let shots = round.plannedShots(forHole: selectedHole)
        if let lastShot = shots.last {
            round.removePlannedShot(lastShot)
            selectedShotIndex = nil
            persistenceManager.saveCurrentRound()
        }
    }
    
    private func reorderShots() {
        let shots = round.plannedShots(forHole: selectedHole)
        for (index, shot) in shots.enumerated() {
            var updated = shot
            updated.order = index + 1
            round.updatePlannedShot(updated)
        }
    }
    
    // Convert CGPoint to Coordinate (for storage)
    private func pointToPosition(_ point: CGPoint, in size: CGSize) -> Coordinate {
        let normalizedX = point.x / size.width
        let normalizedY = point.y / size.height
        return Coordinate(latitude: normalizedY, longitude: normalizedX)
    }
    
    // Convert Coordinate back to CGPoint (for display)
    private func positionToPoint(_ position: Coordinate, in size: CGSize) -> CGPoint {
        CGPoint(
            x: position.longitude * size.width,
            y: position.latitude * size.height
        )
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
}

// MARK: - Custom Shapes

struct FairwayShape: Shape {
    let holeNumber: Int
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        let centerX = rect.midX
        let curveOffset: CGFloat = CGFloat((holeNumber % 4) - 2) * 30
        
        path.move(to: CGPoint(x: centerX - 40, y: rect.maxY - 30))
        
        path.addCurve(
            to: CGPoint(x: centerX - 50 + curveOffset, y: rect.midY),
            control1: CGPoint(x: centerX - 45, y: rect.maxY * 0.7),
            control2: CGPoint(x: centerX - 55 + curveOffset/2, y: rect.maxY * 0.5)
        )
        
        path.addCurve(
            to: CGPoint(x: centerX - 30, y: rect.minY + 80),
            control1: CGPoint(x: centerX - 45 + curveOffset, y: rect.maxY * 0.3),
            control2: CGPoint(x: centerX - 35, y: rect.minY + 120)
        )
        
        path.addQuadCurve(
            to: CGPoint(x: centerX + 30, y: rect.minY + 80),
            control: CGPoint(x: centerX, y: rect.minY + 60)
        )
        
        path.addCurve(
            to: CGPoint(x: centerX + 50 - curveOffset, y: rect.midY),
            control1: CGPoint(x: centerX + 35, y: rect.minY + 120),
            control2: CGPoint(x: centerX + 45 - curveOffset, y: rect.maxY * 0.3)
        )
        
        path.addCurve(
            to: CGPoint(x: centerX + 40, y: rect.maxY - 30),
            control1: CGPoint(x: centerX + 55 - curveOffset/2, y: rect.maxY * 0.5),
            control2: CGPoint(x: centerX + 45, y: rect.maxY * 0.7)
        )
        
        path.closeSubpath()
        
        return path
    }
}

struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

#Preview {
    NavigationStack {
        PlanModeView(round: .constant(
            Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            )
        ))
        .environmentObject(PersistenceManager())
    }
}
