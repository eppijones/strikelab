//
//  DispersionChartView.swift
//  StrikeLabCaddie
//
//  Visual scatter plot showing shot dispersion patterns
//

import SwiftUI
import Charts

/// Represents a single point in the dispersion chart
struct DispersionPoint: Identifiable {
    let id = UUID()
    let carryYards: Double          // Y-axis: distance
    let lateralYards: Double        // X-axis: left (-) / right (+)
    let club: Club
    let timestamp: Date
}

/// Dispersion chart showing where shots land
struct DispersionChartView: View {
    let club: Club
    let shots: [Shot]
    let averageDistance: Double
    @EnvironmentObject var unitsManager: UnitsManager
    
    private var dispersionPoints: [DispersionPoint] {
        calculateDispersionPoints()
    }
    
    private var chartStats: DispersionStats {
        calculateStats()
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Text("\(club.rawValue) Dispersion")
                    .font(Theme.titleFont(18))
                    .foregroundColor(Theme.nordicForest)
                
                Spacer()
                
                Text("\(shots.count) shots")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
            
            // Chart
            if dispersionPoints.count >= 2 {
                dispersionChart
            } else {
                insufficientDataView
            }
            
            // Stats summary
            if dispersionPoints.count >= 2 {
                statsRow
            }
            
            // Miss tendency
            if let tendency = chartStats.missTendency {
                missTendencyView(tendency)
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    // MARK: - Chart
    
    private var dispersionChart: some View {
        Chart {
            // Plot each shot point
            ForEach(dispersionPoints) { point in
                PointMark(
                    x: .value("Lateral", point.lateralYards),
                    y: .value("Distance", point.carryYards)
                )
                .foregroundStyle(pointColor(point))
                .symbolSize(60)
            }
            
            // Average marker (crosshair)
            RuleMark(x: .value("Center", chartStats.averageLateral))
                .foregroundStyle(Theme.neuralCyan.opacity(0.5))
                .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
            
            RuleMark(y: .value("Avg Distance", chartStats.averageCarry))
                .foregroundStyle(Theme.neuralCyan.opacity(0.5))
                .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
            
            // Average point
            PointMark(
                x: .value("Avg Lateral", chartStats.averageLateral),
                y: .value("Avg Distance", chartStats.averageCarry)
            )
            .foregroundStyle(Theme.neuralCyan)
            .symbolSize(100)
            .symbol(.diamond)
        }
        .chartXAxisLabel("Left / Right (\(unitsManager.system.displayName.lowercased()))")
        .chartYAxisLabel("Distance (\(unitsManager.system.displayName.lowercased()))")
        .chartXScale(domain: -chartStats.lateralRange...chartStats.lateralRange)
        .chartYScale(domain: chartStats.minCarry...chartStats.maxCarry)
        .frame(height: 250)
    }
    
    private func pointColor(_ point: DispersionPoint) -> Color {
        // Color based on distance from average
        let distanceFromAvg = abs(point.carryYards - chartStats.averageCarry)
        let lateralDeviation = abs(point.lateralYards)
        
        if distanceFromAvg < 10 && lateralDeviation < 10 {
            return Theme.nordicSage  // Good shot
        } else if distanceFromAvg < 20 && lateralDeviation < 20 {
            return Theme.champagne   // Acceptable
        } else {
            return Theme.overPar     // Miss
        }
    }
    
    // MARK: - Stats Row
    
    private var statsRow: some View {
        let unit = unitsManager.unitLabel
        return HStack(spacing: 0) {
            statColumn(
                label: "AVG CARRY",
                value: unitsManager.format(yards: chartStats.averageCarry, includesUnit: false),
                unit: unit
            )

            Divider()
                .frame(height: 40)

            statColumn(
                label: "SPREAD",
                value: unitsManager.format(yards: chartStats.lateralSpread, includesUnit: false),
                unit: "\(unit) L/R"
            )

            Divider()
                .frame(height: 40)

            statColumn(
                label: "DISTANCE VAR",
                value: unitsManager.format(yards: chartStats.carryVariance, includesUnit: false),
                unit: unit
            )
        }
    }
    
    private func statColumn(label: String, value: String, unit: String) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
            
            Text(value)
                .font(Theme.statFont(18))
                .foregroundColor(Theme.nordicForest)
            
            Text(unit)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
    }
    
    // MARK: - Miss Tendency
    
    private func missTendencyView(_ tendency: MissTendency) -> some View {
        HStack(spacing: 8) {
            Image(systemName: tendency.icon)
                .font(.system(size: 14))
                .foregroundColor(tendency.color)
            
            Text("Typical miss: \(tendency.description)")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.7))
            
            Spacer()
        }
        .padding(.top, 4)
    }
    
    // MARK: - Insufficient Data
    
    private var insufficientDataView: some View {
        VStack(spacing: 8) {
            Image(systemName: "chart.dots.scatter")
                .font(.system(size: 32))
                .foregroundColor(Theme.nordicForest.opacity(0.3))
            
            Text("Need more shots")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            Text("Track at least 2 shots with this club to see dispersion")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
                .multilineTextAlignment(.center)
        }
        .frame(height: 150)
    }
    
    // MARK: - Calculations
    
    private func calculateDispersionPoints() -> [DispersionPoint] {
        // Filter shots with valid distance data
        let validShots = shots.filter { $0.distanceYards != nil && $0.distanceYards! > 0 }
        
        guard validShots.count >= 2 else { return [] }
        
        // For now, simulate lateral dispersion based on distance variance
        // In a real implementation, this would use GPS coordinates to calculate actual lateral deviation
        var points: [DispersionPoint] = []
        
        for shot in validShots {
            guard let distance = shot.distanceYards else { continue }
            
            // Estimate lateral deviation (in production, use actual GPS data)
            // Using a simple model: variance increases with distance from average
            let deviation = distance - averageDistance
            let lateralEstimate = (deviation * 0.3) + Double.random(in: -8...8)
            
            points.append(DispersionPoint(
                carryYards: distance,
                lateralYards: lateralEstimate,
                club: club,
                timestamp: shot.timestamp
            ))
        }
        
        return points
    }
    
    private func calculateStats() -> DispersionStats {
        guard !dispersionPoints.isEmpty else {
            return DispersionStats(
                averageCarry: averageDistance,
                averageLateral: 0,
                carryVariance: 0,
                lateralSpread: 0,
                minCarry: averageDistance - 30,
                maxCarry: averageDistance + 30,
                lateralRange: 30,
                missTendency: nil
            )
        }
        
        let carries = dispersionPoints.map { $0.carryYards }
        let laterals = dispersionPoints.map { $0.lateralYards }
        
        let avgCarry = carries.reduce(0, +) / Double(carries.count)
        let avgLateral = laterals.reduce(0, +) / Double(laterals.count)
        
        // Calculate variance
        let carryVariance = sqrt(carries.map { pow($0 - avgCarry, 2) }.reduce(0, +) / Double(carries.count))
        let lateralVariance = sqrt(laterals.map { pow($0 - avgLateral, 2) }.reduce(0, +) / Double(laterals.count))
        
        // Determine miss tendency
        let tendency: MissTendency?
        if abs(avgLateral) > 5 {
            tendency = avgLateral < 0 ? .left : .right
        } else if carryVariance > 15 {
            tendency = .inconsistentDistance
        } else {
            tendency = nil
        }
        
        // Chart bounds
        let minCarry = max(0, (carries.min() ?? avgCarry) - 20)
        let maxCarry = (carries.max() ?? avgCarry) + 20
        let lateralRange = max(30, max(abs(laterals.min() ?? 0), abs(laterals.max() ?? 0)) + 10)
        
        return DispersionStats(
            averageCarry: avgCarry,
            averageLateral: avgLateral,
            carryVariance: carryVariance,
            lateralSpread: lateralVariance * 2,  // 2-sigma spread
            minCarry: minCarry,
            maxCarry: maxCarry,
            lateralRange: lateralRange,
            missTendency: tendency
        )
    }
}

// MARK: - Supporting Types

struct DispersionStats {
    let averageCarry: Double
    let averageLateral: Double
    let carryVariance: Double
    let lateralSpread: Double
    let minCarry: Double
    let maxCarry: Double
    let lateralRange: Double
    let missTendency: MissTendency?
}

enum MissTendency {
    case left
    case right
    case short
    case long
    case inconsistentDistance
    
    var icon: String {
        switch self {
        case .left: return "arrow.left"
        case .right: return "arrow.right"
        case .short: return "arrow.down"
        case .long: return "arrow.up"
        case .inconsistentDistance: return "arrow.up.arrow.down"
        }
    }
    
    var description: String {
        switch self {
        case .left: return "Left"
        case .right: return "Right"
        case .short: return "Short"
        case .long: return "Long"
        case .inconsistentDistance: return "Inconsistent distance"
        }
    }
    
    var color: Color {
        switch self {
        case .left, .right: return .orange
        case .short, .long: return Theme.overPar
        case .inconsistentDistance: return Theme.champagne
        }
    }
}

// MARK: - Compact Dispersion View (for club cards)

struct CompactDispersionView: View {
    let points: [DispersionPoint]
    let size: CGFloat = 60
    
    var body: some View {
        if points.count >= 2 {
            Canvas { context, canvasSize in
                let centerX = canvasSize.width / 2
                let centerY = canvasSize.height / 2
                
                // Draw crosshair
                context.stroke(
                    Path { path in
                        path.move(to: CGPoint(x: centerX, y: 0))
                        path.addLine(to: CGPoint(x: centerX, y: canvasSize.height))
                    },
                    with: .color(Theme.nordicForest.opacity(0.2)),
                    lineWidth: 1
                )
                context.stroke(
                    Path { path in
                        path.move(to: CGPoint(x: 0, y: centerY))
                        path.addLine(to: CGPoint(x: canvasSize.width, y: centerY))
                    },
                    with: .color(Theme.nordicForest.opacity(0.2)),
                    lineWidth: 1
                )
                
                // Normalize and draw points
                let maxLateral = max(abs(points.map { $0.lateralYards }.min() ?? 20),
                                     abs(points.map { $0.lateralYards }.max() ?? 20))
                let avgCarry = points.map { $0.carryYards }.reduce(0, +) / Double(points.count)
                let carryRange = max(30, (points.map { $0.carryYards }.max() ?? avgCarry) - (points.map { $0.carryYards }.min() ?? avgCarry))
                
                for point in points {
                    let x = centerX + CGFloat(point.lateralYards / maxLateral) * (canvasSize.width / 2 - 4)
                    let y = centerY - CGFloat((point.carryYards - avgCarry) / carryRange) * (canvasSize.height / 2 - 4)
                    
                    context.fill(
                        Circle().path(in: CGRect(x: x - 3, y: y - 3, width: 6, height: 6)),
                        with: .color(Theme.nordicSage)
                    )
                }
            }
            .frame(width: size, height: size)
            .background(Theme.nordicPaper.opacity(0.5))
            .cornerRadius(8)
        } else {
            RoundedRectangle(cornerRadius: 8)
                .fill(Theme.nordicForest.opacity(0.05))
                .frame(width: size, height: size)
                .overlay(
                    Image(systemName: "chart.dots.scatter")
                        .font(.system(size: 16))
                        .foregroundColor(Theme.nordicForest.opacity(0.2))
                )
        }
    }
}

#Preview {
    VStack {
        DispersionChartView(
            club: .iron7,
            shots: [],
            averageDistance: 150
        )
    }
    .padding()
    .nordicBackground()
}
