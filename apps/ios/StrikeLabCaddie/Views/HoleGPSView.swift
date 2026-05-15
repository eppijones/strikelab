//
//  HoleGPSView.swift
//  StrikeLabCaddie
//
//  Real-time GPS distances to green and hazards
//

import SwiftUI
import CoreLocation

/// Main GPS view for a hole during play
struct HoleGPSView: View {
    let holeNumber: Int
    let par: Int
    let holeLayout: HoleLayout?
    var shots: [Shot] = []
    @ObservedObject var locationManager: LocationManager
    @ObservedObject var weatherManager: WeatherManager
    @EnvironmentObject var unitsManager: UnitsManager

    @State private var gpsData: HoleGPSData?
    @State private var showExpandedMap = false
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            holeHeader

            HoleOverlayView(
                holeNumber: holeNumber,
                par: par,
                currentLocation: locationManager.currentLocation,
                shots: shots,
                holeLayout: holeLayout,
                isPreview: true
            )
            .environmentObject(unitsManager)
            .frame(height: 190)
            .clipped()
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
            .contentShape(Rectangle())
            .onTapGesture {
                showExpandedMap = true
            }
            
            if let layout = holeLayout, let location = locationManager.currentLocation {
                let calculator = HoleDistanceCalculator(
                    currentLocation: Coordinate(from: location.coordinate),
                    holeLayout: layout
                )
                
                // Main distances
                greenDistancesCard(calculator)
                
                // Hazards
                if !calculator.hazardsInRange().isEmpty {
                    hazardsCard(calculator)
                }
                
                // Layup targets
                if !layout.layupTargets.isEmpty {
                    layupTargetsCard(calculator)
                }
                
                // Weather-adjusted suggestion
                if weatherManager.currentConditions != nil,
                   let centerDist = calculator.distanceToCenter {
                    weatherAdjustedCard(
                        distance: centerDist,
                        bearing: calculator.bearingToGreen ?? 0
                    )
                }
            } else {
                noGPSDataView
            }
        }
        .padding()
        .nordicBackground()
        .fullScreenCover(isPresented: $showExpandedMap) {
            NavigationStack {
                HoleOverlayView(
                    holeNumber: holeNumber,
                    par: par,
                    currentLocation: locationManager.currentLocation,
                    shots: shots,
                    holeLayout: holeLayout
                )
                .environmentObject(unitsManager)
                .ignoresSafeArea(edges: .bottom)
                .navigationTitle("Hole \(holeNumber) Map")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { showExpandedMap = false }
                            .foregroundColor(Theme.accent)
                    }
                }
            }
        }
    }
    
    // MARK: - Header
    
    private var holeHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("HOLE \(holeNumber)")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("Par \(par)")
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.nordicForest)
            }
            
            Spacer()
            
            // GPS status indicator
            HStack(spacing: 4) {
                Circle()
                    .fill(locationManager.isTracking ? Theme.nordicSage : Theme.neutral)
                    .frame(width: 8, height: 8)
                
                Text(locationManager.isTracking ? "GPS Active" : "GPS Off")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
        }
    }
    
    // MARK: - Green Distances
    
    private func greenDistancesCard(_ calculator: HoleDistanceCalculator) -> some View {
        VStack(spacing: 12) {
            // Main distance (to center)
            if let center = calculator.distanceToCenter {
                VStack(spacing: 4) {
                    Text("TO PIN")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                    
                    Text(unitsManager.format(yards: center, includesUnit: false))
                        .font(.system(size: 56, weight: .bold, design: .monospaced))
                        .foregroundColor(Theme.nordicForest)

                    Text(unitsManager.system.displayName.lowercased())
                        .font(Theme.labelFont(14))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                }
            }
            
            // Front/Center/Back row
            HStack(spacing: 0) {
                distanceColumn(
                    label: "FRONT",
                    yards: calculator.distanceToFront,
                    color: Theme.nordicSage
                )

                Divider()
                    .frame(height: 50)
                    .background(Theme.nordicForest.opacity(0.1))

                distanceColumn(
                    label: "CENTER",
                    yards: calculator.distanceToCenter,
                    color: Theme.nordicForest
                )

                Divider()
                    .frame(height: 50)
                    .background(Theme.nordicForest.opacity(0.1))

                distanceColumn(
                    label: "BACK",
                    yards: calculator.distanceToBack,
                    color: Theme.overPar
                )
            }

            // Green depth
            if let depth = holeLayout?.greenDepth {
                Text("Green depth: \(unitsManager.format(yards: depth))")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }

    private func distanceColumn(label: String, yards: Double?, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.nordicForest.opacity(0.5))

            Text(yards.map { unitsManager.format(yards: $0, includesUnit: false) } ?? "–")
                .font(Theme.statFont(24))
                .foregroundColor(color)

            Text(unitsManager.unitLabel)
                .font(Theme.labelFont(10))
                .foregroundColor(color.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }
    
    // MARK: - Hazards Card
    
    private func hazardsCard(_ calculator: HoleDistanceCalculator) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("HAZARDS")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
            
            ForEach(calculator.hazardsInRange(maxDistance: 250), id: \.hazard.id) { item in
                hazardRow(item.hazard, yards: item.distance)
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    private func hazardRow(_ hazard: Hazard, yards: Double) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(hazardColor(hazard.type).opacity(0.2))
                    .frame(width: 36, height: 36)

                Image(systemName: hazard.type.icon)
                    .font(.system(size: 14))
                    .foregroundColor(hazardColor(hazard.type))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(hazard.displayName)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.nordicForest)

                if let carry = hazard.carryDistance {
                    Text("Carry: \(unitsManager.format(yards: carry))")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 0) {
                Text(unitsManager.format(yards: yards, includesUnit: false))
                    .font(Theme.statFont(20))
                    .foregroundColor(yards < 50 ? .red : Theme.nordicForest)
                Text(unitsManager.unitLabel)
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
            }
        }
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
    
    // MARK: - Layup Targets
    
    private func layupTargetsCard(_ calculator: HoleDistanceCalculator) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "target")
                    .foregroundColor(Theme.neuralCyan)
                Text("LAYUP TARGETS")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
            
            ForEach(calculator.layupDistances, id: \.target.id) { item in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.target.name)
                            .font(Theme.bodyFont(14))
                            .foregroundColor(Theme.nordicForest)
                        
                        if let desc = item.target.description {
                            Text(desc)
                                .font(Theme.labelFont(11))
                                .foregroundColor(Theme.nordicForest.opacity(0.5))
                        }
                    }
                    
                    Spacer()
                    
                    Text(unitsManager.format(yards: item.distance))
                        .font(Theme.statFont(16))
                        .foregroundColor(Theme.neuralCyan)
                }
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    // MARK: - Weather Adjusted Card
    
    private func weatherAdjustedCard(distance: Double, bearing: Double) -> some View {
        let adjustment = weatherManager.calculateAdjustment(
            targetBearing: bearing,
            baseDistance: distance
        )
        
        return VStack(spacing: 8) {
            HStack {
                Image(systemName: "wind")
                    .foregroundColor(Theme.neuralCyan)
                Text("PLAYING DISTANCE")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Spacer()
            }
            
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(unitsManager.format(yards: adjustment.adjustedDistance(from: distance), includesUnit: false))
                    .font(Theme.statFont(32))
                    .foregroundColor(Theme.neuralCyan)

                Text(unitsManager.unitLabel)
                    .font(Theme.labelFont(14))
                    .foregroundColor(Theme.neuralCyan.opacity(0.7))
            }
            
            Text(adjustment.description)
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    // MARK: - No GPS Data
    
    private var noGPSDataView: some View {
        VStack(spacing: 12) {
            Image(systemName: "location.slash")
                .font(.system(size: 40))
                .foregroundColor(Theme.nordicForest.opacity(0.3))
            
            Text("No GPS Data")
                .font(Theme.titleFont(18))
                .foregroundColor(Theme.nordicForest)
            
            Text("GPS course data is not available for this hole")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 16)
    }
}

// MARK: - Compact GPS Display (for toolbar/overlay)

/// Compact GPS display for use in scorecard view
struct CompactGPSDisplay: View {
    let gpsData: HoleGPSData?
    
    var body: some View {
        if let data = gpsData, data.hasData {
            HStack(spacing: 8) {
                // Main distance
                if let center = data.center {
                    HStack(spacing: 2) {
                        Image(systemName: "flag.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Theme.nordicSage)
                        
                        Text("\(center)")
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                            .foregroundColor(Theme.nordicForest)
                    }
                }
                
                // Front/Back
                if let front = data.front, let back = data.back {
                    Text("F:\(front) B:\(back)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                }
                
                // Hazard warning
                if let hazard = data.nearestHazard, hazard.distance < 200 {
                    HStack(spacing: 2) {
                        Image(systemName: hazard.type.icon)
                            .font(.system(size: 9))
                        Text("\(hazard.distance)")
                            .font(.system(size: 10, weight: .medium))
                    }
                    .foregroundColor(hazard.distance < 50 ? .red : .orange)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Theme.nordicPaper.opacity(0.9))
            .cornerRadius(8)
        }
    }
}

#Preview {
    NavigationStack {
        HoleGPSView(
            holeNumber: 7,
            par: 4,
            holeLayout: HoleLayout(
                holeNumber: 7,
                greenFront: Coordinate(latitude: 38.4100, longitude: -0.5100),
                greenCenter: Coordinate(latitude: 38.4102, longitude: -0.5100),
                greenBack: Coordinate(latitude: 38.4104, longitude: -0.5100),
                hazards: [
                    Hazard(type: .water, coordinate: Coordinate(latitude: 38.4090, longitude: -0.5098), name: "Water left"),
                    Hazard(type: .bunker, coordinate: Coordinate(latitude: 38.4099, longitude: -0.5102), name: "Greenside bunker")
                ]
            ),
            locationManager: LocationManager(),
            weatherManager: WeatherManager()
        )
    }
}
