//
//  WeatherDisplayView.swift
//  StrikeLabCaddie
//
//  Compact weather display component
//

import SwiftUI

/// Compact weather display for use in round views
struct WeatherDisplayView: View {
    @ObservedObject var weatherManager: WeatherManager
    
    var body: some View {
        if let weather = weatherManager.currentConditions {
            HStack(spacing: 12) {
                // Temperature
                HStack(spacing: 4) {
                    Image(systemName: temperatureIcon(weather.temperatureFahrenheit))
                        .font(.system(size: 12))
                        .foregroundColor(temperatureColor(weather.temperatureFahrenheit))
                    
                    Text(weather.formattedTemperature())
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest)
                }
                
                // Wind
                HStack(spacing: 4) {
                    // Wind direction arrow
                    Image(systemName: "location.north.fill")
                        .font(.system(size: 11))
                        .rotationEffect(.degrees(weather.windDirection))
                        .foregroundColor(windColor(weather.windSpeedMph))
                    
                    Text(weather.formattedWind)
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest)
                }
                
                // Conditions indicator
                if !weather.isPlayable {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 11))
                        .foregroundColor(.orange)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Theme.nordicPaper.opacity(0.8))
            .cornerRadius(8)
        } else if weatherManager.isLoading {
            HStack(spacing: 6) {
                ProgressView()
                    .scaleEffect(0.7)
                Text("Loading weather...")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
        }
    }
    
    private func temperatureIcon(_ temp: Double) -> String {
        switch temp {
        case ..<50: return "thermometer.snowflake"
        case 50..<70: return "thermometer.low"
        case 70..<85: return "thermometer.medium"
        default: return "thermometer.high"
        }
    }
    
    private func temperatureColor(_ temp: Double) -> Color {
        switch temp {
        case ..<50: return .blue
        case 50..<70: return Theme.nordicForest
        case 70..<85: return Theme.nordicSage
        default: return .orange
        }
    }
    
    private func windColor(_ speed: Double) -> Color {
        switch speed {
        case ..<10: return Theme.nordicSage
        case 10..<20: return Theme.nordicForest
        case 20..<30: return .orange
        default: return .red
        }
    }
}

/// Full weather card for detailed view
struct WeatherCardView: View {
    let weather: WeatherConditions
    let adjustment: WeatherAdjustment?
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Text("CONDITIONS")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Spacer()
                
                Text(weather.timestamp, style: .time)
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
            }
            
            // Main stats
            HStack(spacing: 16) {
                // Temperature
                VStack(spacing: 4) {
                    Image(systemName: "thermometer.medium")
                        .font(.system(size: 20))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text(weather.formattedTemperature())
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text("Temperature")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                
                // Wind
                VStack(spacing: 4) {
                    ZStack {
                        Image(systemName: "wind")
                            .font(.system(size: 20))
                            .foregroundColor(windColor(weather.windSpeedMph))
                    }
                    
                    Text("\(Int(weather.windSpeedMph)) mph")
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text(weather.windDirectionCompass)
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                
                // Humidity
                VStack(spacing: 4) {
                    Image(systemName: "humidity.fill")
                        .font(.system(size: 20))
                        .foregroundColor(Theme.neuralCyan)
                    
                    Text("\(weather.humidity)%")
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text("Humidity")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
            }
            
            // Distance adjustment info
            if let adj = adjustment, abs(adj.totalAdjustment) >= 1 {
                Divider()
                    .background(Theme.nordicForest.opacity(0.1))
                
                VStack(spacing: 4) {
                    Text("DISTANCE ADJUSTMENT")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                    
                    Text(adj.description)
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest)
                    
                    HStack(spacing: 4) {
                        Text("Total:")
                            .font(Theme.labelFont(12))
                            .foregroundColor(Theme.nordicForest.opacity(0.6))
                        
                        Text(adj.totalAdjustment >= 0 ? "+\(Int(adj.totalAdjustment))y" : "\(Int(adj.totalAdjustment))y")
                            .font(Theme.statFont(14))
                            .foregroundColor(adj.totalAdjustment >= 0 ? Theme.overPar : Theme.nordicSage)
                    }
                }
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    private func windColor(_ speed: Double) -> Color {
        switch speed {
        case ..<10: return Theme.nordicSage
        case 10..<20: return Theme.nordicForest
        case 20..<30: return .orange
        default: return .red
        }
    }
}

/// Wind direction indicator for watch
struct WindIndicatorView: View {
    let windSpeed: Double       // mph
    let windDirection: Double   // degrees
    let targetBearing: Double?  // degrees to target (optional)
    
    var body: some View {
        HStack(spacing: 4) {
            // Wind arrow
            Image(systemName: "location.north.fill")
                .font(.system(size: 12))
                .rotationEffect(.degrees(windDirection))
                .foregroundColor(windColor)
            
            // Speed
            Text("\(Int(windSpeed))")
                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                .foregroundColor(windColor)
            
            // Effect indicator (if target bearing provided)
            if let target = targetBearing {
                effectIndicator(target)
            }
        }
    }
    
    private var windColor: Color {
        switch windSpeed {
        case ..<10: return .green
        case 10..<20: return .orange
        default: return .red
        }
    }
    
    private func effectIndicator(_ targetBearing: Double) -> some View {
        // Calculate if headwind or tailwind
        let angle = (windDirection - targetBearing) * .pi / 180
        let headwind = cos(angle)  // Positive = headwind
        
        let icon: String
        let color: Color
        
        if abs(headwind) < 0.3 {
            // Crosswind
            icon = "arrow.left.arrow.right"
            color = .orange
        } else if headwind > 0 {
            // Headwind
            icon = "arrow.down"
            color = .red
        } else {
            // Tailwind
            icon = "arrow.up"
            color = .green
        }
        
        return Image(systemName: icon)
            .font(.system(size: 10))
            .foregroundColor(color)
    }
}

#Preview {
    VStack(spacing: 20) {
        WeatherCardView(
            weather: WeatherConditions(
                temperature: 22,
                temperatureFahrenheit: 72,
                windSpeed: 16,
                windSpeedMph: 10,
                windDirection: 45,
                humidity: 65,
                precipitation: 0,
                cloudCover: 20,
                timestamp: Date()
            ),
            adjustment: WeatherAdjustment(
                windAdjustment: -5,
                temperatureAdjustment: 2,
                altitudeAdjustment: 4
            )
        )
        
        WindIndicatorView(windSpeed: 15, windDirection: 180, targetBearing: 90)
    }
    .padding()
    .nordicBackground()
}
