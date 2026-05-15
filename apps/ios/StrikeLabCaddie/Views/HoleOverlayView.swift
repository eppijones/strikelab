//
//  HoleOverlayView.swift
//  StrikeLabCaddie
//
//  Hole map with distance arcs and yardage markers
//

import SwiftUI
import MapKit

/// Interactive hole map with distance arcs from current position
struct HoleOverlayView: View {
    let holeNumber: Int
    let par: Int
    let currentLocation: CLLocation?
    let shots: [Shot]
    let holeLayout: HoleLayout?
    var isPreview: Bool = false
    @EnvironmentObject var unitsManager: UnitsManager

    @State private var position: MapCameraPosition = .automatic
    @State private var region: MKCoordinateRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 0, longitude: 0),
        span: MKCoordinateSpan(latitudeDelta: 0.003, longitudeDelta: 0.003)
    )
    @State private var selectedDistance: Int?
    
    // Distance arc intervals in the user's display unit.
    private let distanceIntervals = [50, 100, 150, 200, 250]
    
    var body: some View {
        ZStack {
            mapView
            .ignoresSafeArea()
            
            // Distance arcs overlay
            if currentLocation != nil {
                distanceArcsOverlay
            }
            
            if isPreview {
                previewChrome
            } else {
                // Info panel
                VStack {
                    holeInfoPanel

                    Spacer()

                    // Distance selector
                    distanceSelector
                }
                .padding()
            }
        }
        .onAppear {
            updateRegion()
        }
        .onChange(of: currentLocation) { _, _ in
            updateRegion()
        }
    }
    
    private var mapView: some View {
        Map(position: $position) {
            ForEach(mapAnnotations) { annotation in
                Annotation("", coordinate: annotation.coordinate) {
                    annotationView(for: annotation)
                }
            }
        }
        .mapStyle(.imagery(elevation: .realistic))
    }

    private var previewChrome: some View {
        VStack {
            HStack {
                Label("Tap for satellite map", systemImage: "map")
                    .font(Theme.labelFont(10))
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.58))
                    .cornerRadius(10)
                Spacer()
            }
            Spacer()
            if let yards = distanceToGreenYards {
                HStack {
                    Spacer()
                    Text("\(unitsManager.format(yards: yards, includesUnit: false)) \(unitsManager.unitLabel)")
                        .font(Theme.statFont(18))
                        .foregroundColor(Theme.accent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.62))
                        .cornerRadius(10)
                }
            }
        }
        .padding(10)
        .allowsHitTesting(false)
    }

    // MARK: - Hole Info Panel

    private var holeInfoPanel: some View {
        HStack(spacing: 16) {
            // Hole number
            VStack(spacing: 2) {
                Text("HOLE")
                    .font(Theme.labelFont(10))
                    .foregroundColor(.white.opacity(0.7))
                
                Text("\(holeNumber)")
                    .font(Theme.statFont(28))
                    .foregroundColor(.white)
            }
            
            Divider()
                .frame(height: 40)
                .background(Color.white.opacity(0.3))
            
            // Par
            VStack(spacing: 2) {
                Text("PAR")
                    .font(Theme.labelFont(10))
                    .foregroundColor(.white.opacity(0.7))
                
                Text("\(par)")
                    .font(Theme.statFont(28))
                    .foregroundColor(.white)
            }
            
            Divider()
                .frame(height: 40)
                .background(Color.white.opacity(0.3))
            
            // Distance to green
            if let yards = distanceToGreenYards {
                VStack(spacing: 2) {
                    Text("TO PIN")
                        .font(Theme.labelFont(10))
                        .foregroundColor(.white.opacity(0.7))

                    Text(unitsManager.format(yards: yards, includesUnit: false))
                        .font(Theme.statFont(28))
                        .foregroundColor(Theme.neuralCyan)

                    Text(unitsManager.unitLabel)
                        .font(Theme.labelFont(10))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            
            Spacer()
            
            // Shots count
            VStack(spacing: 2) {
                Text("SHOTS")
                    .font(Theme.labelFont(10))
                    .foregroundColor(.white.opacity(0.7))
                
                Text("\(holeShots.count)")
                    .font(Theme.statFont(24))
                    .foregroundColor(.white)
            }
        }
        .padding()
        .background(.ultraThinMaterial.opacity(0.9))
        .cornerRadius(12)
    }
    
    // MARK: - Distance Arcs Overlay
    
    private var distanceArcsOverlay: some View {
        GeometryReader { geometry in
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            
            ZStack {
                // Draw distance arcs
                ForEach(distanceIntervals, id: \.self) { distance in
                    let radius = calculateRadius(displayDistance: distance, in: geometry.size)
                    
                    // Arc
                    Circle()
                        .stroke(
                            selectedDistance == distance ? Theme.neuralCyan : Color.white.opacity(0.4),
                            lineWidth: selectedDistance == distance ? 2 : 1
                        )
                        .frame(width: radius * 2, height: radius * 2)
                        .position(center)
                    
                    // Distance label
                    Text(distanceLabel(distance))
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(selectedDistance == distance ? Theme.neuralCyan : .white)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(Color.black.opacity(0.5))
                        .cornerRadius(4)
                        .position(x: center.x, y: center.y - radius - 10)
                }
                
                // Current position marker
                ZStack {
                    Circle()
                        .fill(Theme.neuralCyan)
                        .frame(width: 16, height: 16)
                    
                    Circle()
                        .stroke(Color.white, lineWidth: 2)
                        .frame(width: 16, height: 16)
                    
                    Circle()
                        .fill(Theme.neuralCyan.opacity(0.3))
                        .frame(width: 32, height: 32)
                }
                .position(center)
            }
        }
        .allowsHitTesting(false)
    }
    
    // MARK: - Distance Selector
    
    private var distanceSelector: some View {
        HStack(spacing: 8) {
            ForEach(distanceIntervals, id: \.self) { distance in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedDistance = selectedDistance == distance ? nil : distance
                    }
                } label: {
                    Text(distanceLabel(distance))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(selectedDistance == distance ? .white : .white.opacity(0.8))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            selectedDistance == distance ?
                            Theme.neuralCyan : Color.black.opacity(0.5)
                        )
                        .cornerRadius(8)
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial.opacity(0.8))
        .cornerRadius(12)
    }
    
    // MARK: - Map Annotations
    
    private var mapAnnotations: [HoleMapAnnotation] {
        var annotations: [HoleMapAnnotation] = []
        
        // Current position
        if let location = currentLocation {
            annotations.append(HoleMapAnnotation(
                id: "current",
                coordinate: location.coordinate,
                type: .currentPosition
            ))
        }
        
        // Green positions
        if let layout = holeLayout {
            if let center = layout.greenCenter {
                annotations.append(HoleMapAnnotation(
                    id: "green",
                    coordinate: center.clCoordinate,
                    type: .green
                ))
            }
            
            // Hazards
            for hazard in layout.hazards {
                annotations.append(HoleMapAnnotation(
                    id: hazard.id.uuidString,
                    coordinate: hazard.coordinate.clCoordinate,
                    type: .hazard(hazard.type)
                ))
            }
        }
        
        // Shots on this hole
        for shot in holeShots {
            if let start = shot.startLocation {
                annotations.append(HoleMapAnnotation(
                    id: "shot-start-\(shot.id)",
                    coordinate: start.clCoordinate,
                    type: .shotStart(shot.club)
                ))
            }
            if let end = shot.endLocation {
                annotations.append(HoleMapAnnotation(
                    id: "shot-end-\(shot.id)",
                    coordinate: end.clCoordinate,
                    type: .shotEnd
                ))
            }
        }
        
        return annotations
    }
    
    @ViewBuilder
    private func annotationView(for annotation: HoleMapAnnotation) -> some View {
        switch annotation.type {
        case .currentPosition:
            ZStack {
                Circle()
                    .fill(Theme.neuralCyan)
                    .frame(width: 14, height: 14)
                Circle()
                    .stroke(Color.white, lineWidth: 2)
                    .frame(width: 14, height: 14)
            }
            
        case .green:
            ZStack {
                Circle()
                    .fill(Theme.nordicSage)
                    .frame(width: 20, height: 20)
                Image(systemName: "flag.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.white)
            }
            
        case .hazard(let type):
            ZStack {
                Circle()
                    .fill(hazardColor(type))
                    .frame(width: 16, height: 16)
                Image(systemName: type.icon)
                    .font(.system(size: 8))
                    .foregroundColor(.white)
            }
            
        case .shotStart(let club):
            ZStack {
                Circle()
                    .fill(clubGroupColor(club.group))
                    .frame(width: 12, height: 12)
                Circle()
                    .stroke(Color.white, lineWidth: 1)
                    .frame(width: 12, height: 12)
            }
            
        case .shotEnd:
            Circle()
                .fill(Color.white)
                .frame(width: 8, height: 8)
        }
    }
    
    // MARK: - Helpers
    
    private var holeShots: [Shot] {
        shots.filter { $0.holeNumber == holeNumber }
    }
    
    private var distanceToGreenYards: Double? {
        guard let current = currentLocation,
              let greenCenter = holeLayout?.greenCenter else { return nil }

        let currentCoord = Coordinate(from: current.coordinate)
        let meters = currentCoord.distance(to: greenCenter)
        return meters * 1.09361  // Canonical yards
    }
    
    private func updateRegion() {
        if let location = currentLocation {
            updateCamera(from: location.coordinate)
            region = MKCoordinateRegion(
                center: location.coordinate,
                span: isPreview
                    ? MKCoordinateSpan(latitudeDelta: 0.0025, longitudeDelta: 0.0025)
                    : MKCoordinateSpan(latitudeDelta: 0.004, longitudeDelta: 0.004)
            )
        } else if let center = holeLayout?.greenCenter?.clCoordinate ?? holeLayout?.greenFront?.clCoordinate {
            position = .camera(MapCamera(
                centerCoordinate: center,
                distance: isPreview ? 320 : 520,
                heading: 0,
                pitch: 0
            ))
            region = MKCoordinateRegion(
                center: center,
                span: MKCoordinateSpan(latitudeDelta: 0.0035, longitudeDelta: 0.0035)
            )
        }
    }
    
    private func updateCamera(from current: CLLocationCoordinate2D) {
        let green = holeLayout?.greenCenter?.clCoordinate ?? holeLayout?.greenFront?.clCoordinate
        guard let green else {
            position = .camera(MapCamera(
                centerCoordinate: current,
                distance: isPreview ? 320 : 520,
                heading: 0,
                pitch: 0
            ))
            return
        }
        let center = midpoint(current, green)
        let distance = CLLocation(latitude: current.latitude, longitude: current.longitude)
            .distance(from: CLLocation(latitude: green.latitude, longitude: green.longitude))
        position = .camera(MapCamera(
            centerCoordinate: center,
            distance: max(isPreview ? 280 : 420, distance * (isPreview ? 2.0 : 2.4)),
            heading: bearing(from: current, to: green),
            pitch: 0
        ))
    }

    private func calculateRadius(displayDistance: Int, in size: CGSize) -> CGFloat {
        // Estimate pixels per display unit based on map span
        // This is approximate; in production, use proper coordinate conversion
        let metersPerDegree: Double = 111320  // at equator
        let mapWidthMeters = region.span.longitudeDelta * metersPerDegree
        let pixelsPerMeter = size.width / mapWidthMeters
        return CGFloat(metersForDisplayDistance(displayDistance) * pixelsPerMeter)
    }

    private func metersForDisplayDistance(_ value: Int) -> Double {
        switch unitsManager.system {
        case .yards: return Double(value) * 0.9144
        case .meters: return Double(value)
        }
    }

    private func distanceLabel(_ value: Int) -> String {
        "\(value) \(unitsManager.unitLabel)"
    }

    private func midpoint(_ a: CLLocationCoordinate2D, _ b: CLLocationCoordinate2D) -> CLLocationCoordinate2D {
        CLLocationCoordinate2D(
            latitude: (a.latitude + b.latitude) / 2,
            longitude: (a.longitude + b.longitude) / 2
        )
    }

    private func bearing(from start: CLLocationCoordinate2D, to end: CLLocationCoordinate2D) -> CLLocationDirection {
        let lat1 = start.latitude * .pi / 180
        let lat2 = end.latitude * .pi / 180
        let dLon = (end.longitude - start.longitude) * .pi / 180
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        return (atan2(y, x) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360)
    }
    
    private func hazardColor(_ type: HazardType) -> Color {
        switch type {
        case .water: return .blue
        case .bunker: return .yellow
        case .outOfBounds: return .red
        case .lateral: return .red
        case .trees: return .green
        }
    }
    
    private func clubGroupColor(_ group: ClubGroup) -> Color {
        switch group {
        case .driver: return Theme.neuralCyan
        case .wood, .hybrid: return Theme.champagne
        case .iron: return Theme.nordicForest
        case .wedge: return Theme.nordicSage
        case .putt: return Theme.neutral
        }
    }
}

// MARK: - Annotation Model

struct HoleMapAnnotation: Identifiable {
    let id: String
    let coordinate: CLLocationCoordinate2D
    let type: AnnotationType
    
    enum AnnotationType {
        case currentPosition
        case green
        case hazard(HazardType)
        case shotStart(Club)
        case shotEnd
    }
}

// MARK: - Compact Distance View (for scorecard)

struct CompactDistanceView: View {
    let currentLocation: CLLocation?
    let greenCenter: Coordinate?
    @EnvironmentObject var unitsManager: UnitsManager

    private var distanceYards: Double? {
        guard let current = currentLocation,
              let green = greenCenter else { return nil }

        let currentCoord = Coordinate(from: current.coordinate)
        let meters = currentCoord.distance(to: green)
        return meters * 1.09361
    }

    var body: some View {
        if let yards = distanceYards {
            HStack(spacing: 4) {
                Image(systemName: "flag.fill")
                    .font(.system(size: 10))
                    .foregroundColor(Theme.nordicSage)

                Text(unitsManager.format(yards: yards, includesUnit: false))
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicForest)

                Text(unitsManager.unitLabel)
                    .font(.system(size: 10))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Theme.nordicPaper.opacity(0.9))
            .cornerRadius(6)
        }
    }
}

#Preview {
    HoleOverlayView(
        holeNumber: 7,
        par: 4,
        currentLocation: CLLocation(latitude: 38.4085, longitude: -0.7340),
        shots: [],
        holeLayout: nil
    )
}
