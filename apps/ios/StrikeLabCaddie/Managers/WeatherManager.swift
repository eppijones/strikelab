//
//  WeatherManager.swift
//  StrikeLabCaddie
//
//  Weather data manager using Open-Meteo API (free, no API key required)
//

import Foundation
import CoreLocation
import Combine

/// Current weather conditions for golf
struct WeatherConditions: Codable, Equatable {
    let temperature: Double         // Celsius
    let temperatureFahrenheit: Double
    let windSpeed: Double           // km/h
    let windSpeedMph: Double        // mph
    let windDirection: Double       // degrees (0-360, 0=N, 90=E, 180=S, 270=W)
    let humidity: Int               // percentage
    let precipitation: Double       // mm
    let cloudCover: Int             // percentage
    let timestamp: Date
    
    /// Wind direction as compass direction
    var windDirectionCompass: String {
        let directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                          "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        let index = Int((windDirection + 11.25) / 22.5) % 16
        return directions[index]
    }
    
    /// Wind description for display
    var windDescription: String {
        let speedMph = windSpeedMph
        switch speedMph {
        case 0..<5: return "Calm"
        case 5..<10: return "Light"
        case 10..<20: return "Moderate"
        case 20..<30: return "Strong"
        default: return "Very Strong"
        }
    }
    
    /// Whether conditions are suitable for golf
    var isPlayable: Bool {
        windSpeedMph < 30 && precipitation < 2
    }
    
    /// Temperature in preferred format
    func formattedTemperature(useFahrenheit: Bool = true) -> String {
        if useFahrenheit {
            return String(format: "%.0f°F", temperatureFahrenheit)
        } else {
            return String(format: "%.0f°C", temperature)
        }
    }
    
    /// Wind formatted for display
    var formattedWind: String {
        "\(Int(windSpeedMph)) mph \(windDirectionCompass)"
    }
}

/// Weather adjustment factors for club selection
struct WeatherAdjustment: Equatable {
    let windAdjustment: Double      // yards to add/subtract
    let temperatureAdjustment: Double  // yards to add/subtract
    let altitudeAdjustment: Double  // yards to add/subtract
    
    var totalAdjustment: Double {
        windAdjustment + temperatureAdjustment + altitudeAdjustment
    }
    
    /// Apply adjustment to a base distance
    func adjustedDistance(from baseDistance: Double) -> Double {
        baseDistance + totalAdjustment
    }
    
    /// Description of adjustments for display
    var description: String {
        var parts: [String] = []
        
        if abs(windAdjustment) >= 1 {
            let sign = windAdjustment >= 0 ? "+" : ""
            parts.append("Wind: \(sign)\(Int(windAdjustment))y")
        }
        if abs(temperatureAdjustment) >= 1 {
            let sign = temperatureAdjustment >= 0 ? "+" : ""
            parts.append("Temp: \(sign)\(Int(temperatureAdjustment))y")
        }
        if abs(altitudeAdjustment) >= 1 {
            let sign = altitudeAdjustment >= 0 ? "+" : ""
            parts.append("Alt: \(sign)\(Int(altitudeAdjustment))y")
        }
        
        return parts.isEmpty ? "No adjustment" : parts.joined(separator: ", ")
    }
}

/// Manager for fetching and caching weather data
@MainActor
class WeatherManager: ObservableObject {
    @Published var currentConditions: WeatherConditions?
    @Published var isLoading = false
    @Published var lastError: String?
    @Published var currentAltitude: Double = 0  // meters
    
    private var lastFetchLocation: CLLocation?
    private var lastFetchTime: Date?
    private let cacheValidityMinutes: Double = 15  // Refresh every 15 minutes
    
    // MARK: - Fetch Weather
    
    /// Fetch weather for a location
    func fetchWeather(for location: CLLocation) async {
        // Check cache validity
        if let lastFetch = lastFetchTime,
           let lastLocation = lastFetchLocation,
           Date().timeIntervalSince(lastFetch) < cacheValidityMinutes * 60,
           lastLocation.distance(from: location) < 5000 {  // Within 5km
            // Use cached data
            return
        }
        
        isLoading = true
        lastError = nil
        
        do {
            let conditions = try await fetchFromOpenMeteo(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
            
            currentConditions = conditions
            currentAltitude = location.altitude
            lastFetchLocation = location
            lastFetchTime = Date()
        } catch {
            lastError = error.localizedDescription
            print("Weather fetch error: \(error)")
        }
        
        isLoading = false
    }
    
    /// Fetch from Open-Meteo API (free, no API key)
    private func fetchFromOpenMeteo(latitude: Double, longitude: Double) async throws -> WeatherConditions {
        let urlString = "https://api.open-meteo.com/v1/forecast?latitude=\(latitude)&longitude=\(longitude)&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m"
        
        guard let url = URL(string: urlString) else {
            throw WeatherError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw WeatherError.invalidResponse
        }
        
        let decoded = try JSONDecoder().decode(OpenMeteoResponse.self, from: data)
        
        return WeatherConditions(
            temperature: decoded.current.temperature_2m,
            temperatureFahrenheit: decoded.current.temperature_2m * 9/5 + 32,
            windSpeed: decoded.current.wind_speed_10m,
            windSpeedMph: decoded.current.wind_speed_10m * 0.621371,
            windDirection: decoded.current.wind_direction_10m,
            humidity: decoded.current.relative_humidity_2m,
            precipitation: decoded.current.precipitation,
            cloudCover: decoded.current.cloud_cover,
            timestamp: Date()
        )
    }
    
    // MARK: - Distance Adjustments
    
    /// Calculate weather-based distance adjustment
    func calculateAdjustment(
        targetBearing: Double,  // Direction to target in degrees
        baseDistance: Double,   // Base club distance in yards
        altitude: Double? = nil // Override altitude if known
    ) -> WeatherAdjustment {
        guard let weather = currentConditions else {
            return WeatherAdjustment(windAdjustment: 0, temperatureAdjustment: 0, altitudeAdjustment: 0)
        }
        
        // Wind adjustment
        // Calculate wind effect based on angle between wind and target direction
        let windAngle = (weather.windDirection - targetBearing) * .pi / 180
        let headwindComponent = cos(windAngle)  // Positive = headwind, Negative = tailwind
        
        // Rule of thumb: ~1 yard per mph of headwind/tailwind for a 150-yard shot
        // Scale by distance (longer shots affected more)
        let distanceFactor = baseDistance / 150.0
        let windEffect = -weather.windSpeedMph * headwindComponent * 0.8 * distanceFactor
        
        // Temperature adjustment
        // Golf ball travels ~2 yards less per 10°F below 70°F
        let tempDiffFahrenheit = weather.temperatureFahrenheit - 70
        let tempEffect = tempDiffFahrenheit * 0.2 * distanceFactor
        
        // Altitude adjustment
        // Ball travels ~2% farther per 1000 feet of elevation
        let altitudeMeters = altitude ?? currentAltitude
        let altitudeFeet = altitudeMeters * 3.28084
        let altitudeEffect = baseDistance * (altitudeFeet / 1000) * 0.02
        
        return WeatherAdjustment(
            windAdjustment: windEffect,
            temperatureAdjustment: tempEffect,
            altitudeAdjustment: altitudeEffect
        )
    }
    
    /// Get suggested playing distance accounting for all factors
    func adjustedPlayingDistance(
        baseDistance: Double,
        targetBearing: Double = 0,
        altitude: Double? = nil
    ) -> Double {
        let adjustment = calculateAdjustment(
            targetBearing: targetBearing,
            baseDistance: baseDistance,
            altitude: altitude
        )
        return adjustment.adjustedDistance(from: baseDistance)
    }
    
    // MARK: - Wind Display
    
    /// Get wind direction arrow rotation angle
    var windArrowRotation: Double {
        currentConditions?.windDirection ?? 0
    }
    
    /// Check if wind is significant (affects play)
    var isWindSignificant: Bool {
        guard let wind = currentConditions?.windSpeedMph else { return false }
        return wind >= 10
    }
}

// MARK: - Open-Meteo Response Models

private struct OpenMeteoResponse: Codable {
    let current: CurrentWeather
}

private struct CurrentWeather: Codable {
    let temperature_2m: Double
    let relative_humidity_2m: Int
    let precipitation: Double
    let cloud_cover: Int
    let wind_speed_10m: Double
    let wind_direction_10m: Double
}

// MARK: - Errors

enum WeatherError: LocalizedError {
    case invalidURL
    case invalidResponse
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid weather service URL"
        case .invalidResponse: return "Invalid response from weather service"
        case .decodingError: return "Could not parse weather data"
        }
    }
}
