//
//  GolfCourseAPIManager.swift
//  StrikeLabCaddie
//
//  Golf Course API integration for worldwide course database
//

import Foundation
import Combine

// MARK: - API Response Models

/// Search result from Golf Course API
struct APISearchResult: Codable, Identifiable {
    let id: Int
    let club_name: String
    let course_name: String
    let location: APILocation?
    
    var displayName: String {
        if club_name == course_name {
            return club_name
        }
        return "\(club_name) - \(course_name)"
    }
    
    var locationString: String {
        location?.address ?? "Location unknown"
    }
}

/// Location data from API
struct APILocation: Codable {
    let address: String?
    let city: String?
    let state: String?
    let country: String?
    let latitude: Double?
    let longitude: Double?
}

/// Full course details from API
struct APICourseDetails: Codable {
    let id: Int
    let club_name: String
    let course_name: String
    let location: APILocation?
    let tees: APITees?
}

/// Tee data organized by gender
struct APITees: Codable {
    let male: [APITeeBox]?
    let female: [APITeeBox]?
    
    var allTees: [APITeeBox] {
        var result: [APITeeBox] = []
        if let male = male { result.append(contentsOf: male) }
        if let female = female {
            // Add female tees with suffix to distinguish
            result.append(contentsOf: female.map { tee in
                var modified = tee
                modified.tee_name = "\(tee.tee_name) (Ladies)"
                return modified
            })
        }
        return result
    }
}

/// Individual tee box with ratings
struct APITeeBox: Codable {
    var tee_name: String
    let course_rating: Double?
    let slope_rating: Double?
    let bogey_rating: Double?
    let total_yards: Int?
    let total_meters: Int?
    let number_of_holes: Int?
    let par_total: Int?
    let front_course_rating: Double?
    let front_slope_rating: Double?
    let back_course_rating: Double?
    let back_slope_rating: Double?
    let holes: [APIHole]?
}

/// Hole data from API
struct APIHole: Codable {
    let par: Int?
    let yardage: Int?
    let handicap: Int?
}

/// Search response wrapper
struct APISearchResponse: Codable {
    let courses: [APISearchResult]
}

// MARK: - API Manager

/// Manager for Golf Course API interactions
@MainActor
class GolfCourseAPIManager: ObservableObject {
    
    // API Configuration
    private let apiKey = "WDMUPN5IAT2HO72N5GDQVYS4GY"
    private let baseURL = "https://api.golfcourseapi.com/v1"
    
    // Published state
    @Published var searchResults: [APISearchResult] = []
    @Published var isSearching = false
    @Published var isLoadingDetails = false
    @Published var searchError: String?
    @Published var recentSearches: [String] = []
    @Published var isOfflineMode = false
    @Published var lastFetchedFromCache = false
    
    // In-memory cache for session
    private var sessionCache: [Int: APICourseDetails] = [:]
    
    // Reference to persistence manager for disk cache
    weak var persistenceManager: PersistenceManager?
    
    // Debounce publisher
    private var searchCancellable: AnyCancellable?
    private let searchSubject = PassthroughSubject<String, Never>()
    
    init(persistenceManager: PersistenceManager? = nil) {
        self.persistenceManager = persistenceManager
        setupSearchDebounce()
        loadRecentSearches()
        checkNetworkStatus()
    }
    
    /// Check if network is available
    private func checkNetworkStatus() {
        // Simple check - in production use NWPathMonitor
        Task {
            do {
                let url = URL(string: "https://api.golfcourseapi.com/v1/search?search_query=test")!
                var request = URLRequest(url: url)
                request.setValue("Key \(apiKey)", forHTTPHeaderField: "Authorization")
                request.timeoutInterval = 5
                
                let (_, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    isOfflineMode = false
                }
            } catch {
                isOfflineMode = true
            }
        }
    }
    
    // MARK: - Search
    
    /// Setup debounced search (waits 300ms after typing stops)
    private func setupSearchDebounce() {
        searchCancellable = searchSubject
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] query in
                Task {
                    await self?.performSearch(query: query)
                }
            }
    }
    
    /// Trigger a search (debounced)
    func search(query: String) {
        guard query.count >= 2 else {
            searchResults = []
            return
        }
        searchSubject.send(query)
    }
    
    /// Perform the actual search
    private func performSearch(query: String) async {
        guard !query.isEmpty else {
            searchResults = []
            return
        }
        
        isSearching = true
        searchError = nil
        
        do {
            let results = try await searchCourses(query: query)
            searchResults = results
            addToRecentSearches(query)
        } catch {
            searchError = error.localizedDescription
            searchResults = []
        }
        
        isSearching = false
    }
    
    /// Search for courses by name
    func searchCourses(query: String) async throws -> [APISearchResult] {
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let urlString = "\(baseURL)/search?search_query=\(encodedQuery)"
        
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("Key \(apiKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 15
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            let decoded = try JSONDecoder().decode(APISearchResponse.self, from: data)
            return decoded.courses
        case 401:
            throw APIError.unauthorized
        case 429:
            throw APIError.rateLimited
        default:
            throw APIError.serverError(httpResponse.statusCode)
        }
    }
    
    // MARK: - Course Details
    
    /// Get full course details by ID (checks cache first)
    func getCourseDetails(id: Int) async throws -> APICourseDetails {
        lastFetchedFromCache = false
        
        // Check session cache first
        if let cached = sessionCache[id] {
            lastFetchedFromCache = true
            return cached
        }
        
        // Check disk cache (offline support)
        if let cached = persistenceManager?.getCachedCourseDetails(id: id) {
            sessionCache[id] = cached
            lastFetchedFromCache = true
            return cached
        }
        
        // If offline, throw error
        if isOfflineMode {
            throw APIError.offline
        }
        
        isLoadingDetails = true
        defer { isLoadingDetails = false }
        
        let urlString = "\(baseURL)/courses/\(id)"
        
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("Key \(apiKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 15
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                let decoded = try JSONDecoder().decode(APICourseDetails.self, from: data)
                
                // Cache in session and on disk
                sessionCache[id] = decoded
                persistenceManager?.cacheCourseDetails(decoded)
                
                return decoded
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.notFound
            case 429:
                throw APIError.rateLimited
            default:
                throw APIError.serverError(httpResponse.statusCode)
            }
        } catch let error as URLError where error.code == .notConnectedToInternet || error.code == .timedOut {
            // Network error - try cache as fallback
            if let cached = persistenceManager?.getCachedCourseDetails(id: id) {
                sessionCache[id] = cached
                lastFetchedFromCache = true
                isOfflineMode = true
                return cached
            }
            throw APIError.offline
        }
    }
    
    /// Force refresh course details from API (bypass cache)
    func refreshCourseDetails(id: Int) async throws -> APICourseDetails {
        sessionCache.removeValue(forKey: id)
        persistenceManager?.removeCourseFromCache(id: id)
        return try await getCourseDetails(id: id)
    }
    
    // MARK: - Conversion to App Models
    
    /// Convert API course details to app Course model
    func convertToCourse(_ details: APICourseDetails) -> Course {
        // Convert holes (use first tee's hole data, or create defaults)
        let apiHoles = details.tees?.allTees.first?.holes ?? []
        var holes: [HoleInfo] = []
        
        for (index, apiHole) in apiHoles.prefix(18).enumerated() {
            holes.append(HoleInfo(
                number: index + 1,
                par: apiHole.par ?? 4,
                handicapIndex: apiHole.handicap ?? (index + 1)
            ))
        }
        
        // Fill remaining holes if less than 18
        while holes.count < 18 {
            holes.append(HoleInfo(
                number: holes.count + 1,
                par: 4,
                handicapIndex: holes.count + 1
            ))
        }
        
        // Convert tees
        var tees: [Tee] = []
        for apiTee in details.tees?.allTees ?? [] {
            var tee = Tee(name: apiTee.tee_name)
            tee.slope = apiTee.slope_rating
            tee.courseRating = apiTee.course_rating
            tee.par = apiTee.par_total
            tees.append(tee)
        }
        
        // Ensure at least one tee exists
        if tees.isEmpty {
            tees.append(Tee(name: "Default"))
        }
        
        // Create location string
        let locationParts = [
            details.location?.city,
            details.location?.state,
            details.location?.country
        ].compactMap { $0 }
        let locationString = locationParts.isEmpty ? "Unknown Location" : locationParts.joined(separator: ", ")
        
        return Course(
            name: details.course_name.isEmpty ? details.club_name : details.course_name,
            location: locationString,
            holes: holes,
            tees: tees,
            apiCourseId: details.id,
            latitude: details.location?.latitude,
            longitude: details.location?.longitude,
            isCustom: false
        )
    }
    
    // MARK: - Recent Searches
    
    private func loadRecentSearches() {
        if let data = UserDefaults.standard.data(forKey: "recentCourseSearches"),
           let searches = try? JSONDecoder().decode([String].self, from: data) {
            recentSearches = searches
        }
    }
    
    private func addToRecentSearches(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        
        // Remove if already exists
        recentSearches.removeAll { $0.lowercased() == trimmed.lowercased() }
        
        // Add to front
        recentSearches.insert(trimmed, at: 0)
        
        // Keep only last 10
        if recentSearches.count > 10 {
            recentSearches = Array(recentSearches.prefix(10))
        }
        
        // Save
        if let data = try? JSONEncoder().encode(recentSearches) {
            UserDefaults.standard.set(data, forKey: "recentCourseSearches")
        }
    }
    
    func clearRecentSearches() {
        recentSearches = []
        UserDefaults.standard.removeObject(forKey: "recentCourseSearches")
    }
}

// MARK: - Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case rateLimited
    case serverError(Int)
    case decodingError
    case offline
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid request URL"
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "API key is invalid or expired"
        case .notFound:
            return "Course not found"
        case .rateLimited:
            return "Too many requests. Please try again later."
        case .serverError(let code):
            return "Server error (\(code))"
        case .decodingError:
            return "Could not parse course data"
        case .offline:
            return "No internet connection"
        }
    }
}
