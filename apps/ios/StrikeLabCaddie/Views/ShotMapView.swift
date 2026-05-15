//
//  ShotMapView.swift
//  StrikeLabCaddie
//
//  MapKit view showing shot tracks
//

import SwiftUI
import MapKit

struct ShotMapView: View {
    @Binding var round: Round
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var unitsManager: UnitsManager
    
    @State private var position: MapCameraPosition = .automatic
    @State private var selectedShot: Shot?
    @State private var showShotDetail = false
    @State private var showDistanceArcs = true
    @State private var selectedDistanceArc: Int?
    
    // Distance arc intervals
    private let distanceIntervals = [50, 100, 150, 200]
    
    var body: some View {
        ZStack {
            // Map
            Map(position: $position) {
                // Shot polylines
                ForEach(shotsWithLocations) { shot in
                    if let start = shot.startLocation, let end = shot.endLocation {
                        MapPolyline(coordinates: [start.clCoordinate, end.clCoordinate])
                            .stroke(clubColor(for: shot.clubGroup), lineWidth: 3)
                    }
                }
                
                // Ball lie markers
                ForEach(locationManager.clusters) { cluster in
                    Annotation("", coordinate: cluster.centroid) {
                        Circle()
                            .fill(Theme.neuralCyan.opacity(0.5))
                            .frame(width: 12, height: 12)
                            .overlay(
                                Circle()
                                    .stroke(Theme.neuralCyan, lineWidth: 2)
                            )
                    }
                }
                
                // Shot start/end markers
                ForEach(shotsWithLocations) { shot in
                    if let start = shot.startLocation {
                        Annotation("", coordinate: start.clCoordinate) {
                            shotMarker(shot: shot, isStart: true)
                        }
                    }
                    
                    if let end = shot.endLocation {
                        Annotation("", coordinate: end.clCoordinate) {
                            shotMarker(shot: shot, isStart: false)
                        }
                    }
                }
                
                // Current location
                if let current = locationManager.currentLocation {
                    Annotation("You", coordinate: current.coordinate) {
                        ZStack {
                            Circle()
                                .fill(Theme.neuralCyan.opacity(0.3))
                                .frame(width: 24, height: 24)
                            
                            Circle()
                                .fill(Theme.neuralCyan)
                                .frame(width: 12, height: 12)
                        }
                    }
                }
            }
            .mapStyle(.imagery(elevation: .realistic))
            
            // Distance arcs overlay
            if showDistanceArcs, let current = locationManager.currentLocation {
                distanceArcsOverlay(center: current.coordinate)
            }
            
            // HUD Overlay
            VStack {
                // Top stats bar
                statsHUD
                
                Spacer()
                
                // Distance arc selector
                if showDistanceArcs {
                    distanceArcSelector
                }
                
                // Bottom shot selector
                if !shotsWithLocations.isEmpty {
                    shotSelector
                }
            }
            .padding()
        }
        .navigationTitle("Shot Map")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            centerOnShots()
        }
    }
    
    // MARK: - Shots with Locations
    
    private var shotsWithLocations: [Shot] {
        round.shots.filter { $0.startLocation != nil && $0.endLocation != nil }
    }
    
    // MARK: - Shot Marker
    
    private func shotMarker(shot: Shot, isStart: Bool) -> some View {
        Button {
            selectedShot = shot
            showShotDetail = true
        } label: {
            ZStack {
                Circle()
                    .fill(clubColor(for: shot.clubGroup).opacity(0.8))
                    .frame(width: 20, height: 20)
                
                if isStart {
                    Image(systemName: shot.clubGroup.iconName)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                } else {
                    Circle()
                        .fill(.white)
                        .frame(width: 6, height: 6)
                }
            }
        }
    }
    
    // MARK: - Stats HUD
    
    private var statsHUD: some View {
        HStack(spacing: 16) {
            // Total shots on map
            HStack(spacing: 4) {
                Image(systemName: "scope")
                    .font(.system(size: 12))
                Text("\(shotsWithLocations.count)")
                    .font(Theme.statFont(14))
            }
            .foregroundColor(.white)
            .glassHUD()
            
            Spacer()
            
            // Tracking status
            HStack(spacing: 4) {
                Circle()
                    .fill(locationManager.isTracking ? Theme.nordicSage : Theme.overPar)
                    .frame(width: 8, height: 8)
                
                Text(locationManager.isTracking ? "Tracking" : "Stopped")
                    .font(Theme.labelFont(12))
            }
            .foregroundColor(.white)
            .glassHUD()
        }
    }
    
    // MARK: - Shot Selector
    
    private var shotSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(shotsWithLocations) { shot in
                    Button {
                        selectedShot = shot
                        centerOnShot(shot)
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: shot.clubGroup.iconName)
                                .font(.system(size: 12))
                            
                            if let yards = shot.distanceYards {
                                Text(unitsManager.format(yards: yards))
                                    .font(Theme.statFont(12))
                            }
                        }
                        .foregroundColor(selectedShot?.id == shot.id ? .white : Theme.nordicForest)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(selectedShot?.id == shot.id ? 
                                      clubColor(for: shot.clubGroup) : Color.white.opacity(0.8))
                        )
                    }
                }
            }
            .padding(.horizontal, 4)
        }
        .glassCard(cornerRadius: 20, padding: 8)
    }
    
    // MARK: - Distance Arcs
    
    private func distanceArcsOverlay(center: CLLocationCoordinate2D) -> some View {
        GeometryReader { geometry in
            let screenCenter = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            
            ZStack {
                ForEach(distanceIntervals, id: \.self) { distance in
                    let isSelected = selectedDistanceArc == distance
                    
                    // Draw arc circle
                    Circle()
                        .stroke(
                            isSelected ? Theme.neuralCyan : Color.white.opacity(0.5),
                            style: StrokeStyle(
                                lineWidth: isSelected ? 3 : 1.5,
                                dash: isSelected ? [] : [8, 4]
                            )
                        )
                        .frame(
                            width: CGFloat(distance) * 1.5,  // Approximate scale
                            height: CGFloat(distance) * 1.5
                        )
                        .position(screenCenter)
                    
                    // Distance label
                    Text(distanceLabel(distance))
                        .font(.system(size: isSelected ? 12 : 10, weight: .bold))
                        .foregroundColor(isSelected ? Theme.neuralCyan : .white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.black.opacity(0.6))
                        .cornerRadius(4)
                        .position(
                            x: screenCenter.x,
                            y: screenCenter.y - CGFloat(distance) * 0.75 - 12
                        )
                }
            }
        }
        .allowsHitTesting(false)
    }
    
    private var distanceArcSelector: some View {
        HStack(spacing: 8) {
            // Toggle button
            Button {
                withAnimation {
                    showDistanceArcs.toggle()
                }
            } label: {
                Image(systemName: showDistanceArcs ? "circle.dashed.inset.filled" : "circle.dashed")
                    .font(.system(size: 16))
                    .foregroundColor(showDistanceArcs ? Theme.neuralCyan : .white.opacity(0.6))
            }
            .glassHUD()
            
            // Distance buttons
            ForEach(distanceIntervals, id: \.self) { distance in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedDistanceArc = selectedDistanceArc == distance ? nil : distance
                    }
                } label: {
                    Text("\(distance)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(selectedDistanceArc == distance ? Theme.neuralCyan : .white.opacity(0.8))
                        .frame(width: 36, height: 28)
                        .background(
                            selectedDistanceArc == distance ?
                            Color.white.opacity(0.2) : Color.clear
                        )
                        .cornerRadius(6)
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial.opacity(0.8))
        .cornerRadius(12)
    }
    
    // MARK: - Helpers
    
    private func clubColor(for club: ClubGroup) -> Color {
        switch club {
        case .driver: return Theme.neuralCyan
        case .wood, .hybrid: return Theme.champagne
        case .iron: return Theme.nordicForest
        case .wedge: return Theme.nordicSage
        case .putt: return Theme.neutral
        }
    }

    private func distanceLabel(_ value: Int) -> String {
        "\(value) \(unitsManager.unitLabel)"
    }
    
    private func centerOnShots() {
        guard !shotsWithLocations.isEmpty else {
            // Center on current location if no shots
            if let current = locationManager.currentLocation {
                position = .region(MKCoordinateRegion(
                    center: current.coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
                ))
            }
            return
        }
        
        // Calculate bounding region for all shots
        var minLat = 90.0, maxLat = -90.0
        var minLon = 180.0, maxLon = -180.0
        
        for shot in shotsWithLocations {
            if let start = shot.startLocation {
                minLat = min(minLat, start.latitude)
                maxLat = max(maxLat, start.latitude)
                minLon = min(minLon, start.longitude)
                maxLon = max(maxLon, start.longitude)
            }
            if let end = shot.endLocation {
                minLat = min(minLat, end.latitude)
                maxLat = max(maxLat, end.latitude)
                minLon = min(minLon, end.longitude)
                maxLon = max(maxLon, end.longitude)
            }
        }
        
        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )
        
        let span = MKCoordinateSpan(
            latitudeDelta: (maxLat - minLat) * 1.5 + 0.002,
            longitudeDelta: (maxLon - minLon) * 1.5 + 0.002
        )
        
        position = .region(MKCoordinateRegion(center: center, span: span))
    }
    
    private func centerOnShot(_ shot: Shot) {
        guard let start = shot.startLocation, let end = shot.endLocation else { return }
        
        let center = CLLocationCoordinate2D(
            latitude: (start.latitude + end.latitude) / 2,
            longitude: (start.longitude + end.longitude) / 2
        )
        
        // Span based on shot distance
        let latDiff = abs(start.latitude - end.latitude)
        let lonDiff = abs(start.longitude - end.longitude)
        
        let span = MKCoordinateSpan(
            latitudeDelta: max(latDiff * 2, 0.002),
            longitudeDelta: max(lonDiff * 2, 0.002)
        )
        
        withAnimation(.easeInOut(duration: 0.5)) {
            position = .region(MKCoordinateRegion(center: center, span: span))
        }
    }
}

#Preview {
    NavigationStack {
        ShotMapView(round: .constant(
            Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            )
        ))
        .environmentObject(LocationManager())
    }
}
