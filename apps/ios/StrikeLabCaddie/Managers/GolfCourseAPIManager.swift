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
    let courseId: UUID?
    let publicCourse: PublicCourse?
    let club_name: String
    let course_name: String
    let location: APILocation?

    var isProviderBacked: Bool {
        if let publicCourse {
            return publicCourse.golfcourseapiId != nil
        }
        return id > 0
    }

    var importKey: String {
        if isProviderBacked { return "provider:\(id)" }
        return "course:\(courseId?.uuidString ?? displayName)"
    }
    
    var displayName: String {
        if club_name == course_name {
            return club_name
        }
        return "\(club_name) - \(course_name)"
    }
    
    var locationString: String {
        if let address = location?.address, !address.isEmpty {
            return address
        }
        let parts = [
            location?.city,
            location?.state,
            location?.country
        ]
        .compactMap { value -> String? in
            guard let value, !value.isEmpty else { return nil }
            return value
        }
        return parts.isEmpty ? "Location unknown" : parts.joined(separator: ", ")
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
    let sourceCourseId: UUID?
    let club_name: String
    let course_name: String
    let location: APILocation?
    let tees: APITees?
}

private struct StrikeLabProviderSearchResponse: Codable {
    let provider: String
    let query: String
    let count: Int
    let courses: [PublicCourse]
    let note: String?
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
    private let api = TeeAPIClient.shared
    
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
                _ = try await api.golfCourseAPIStatus()
                isOfflineMode = false
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
        async let catalog = try? api.publicCoursesSearch(query: query, countryCode: "NO")
        async let provider = try api.golfCourseAPISearch(query: query)

        let catalogResults = (await catalog ?? []).map { APISearchResult(publicCourse: $0) }
        let providerResults = try await provider.courses.map { APISearchResult(publicCourse: $0) }
        return Self.mergeSearchResults(catalogResults + providerResults)
    }

    private static func mergeSearchResults(_ results: [APISearchResult]) -> [APISearchResult] {
        var merged: [APISearchResult] = []
        var seen = Set<String>()
        for result in results {
            let key = result.publicCourse?.golfcourseapiId.map { "provider:\($0)" }
                ?? result.courseId.map { "course:\($0.uuidString)" }
                ?? result.displayName.lowercased()
            guard !seen.contains(key) else { continue }
            seen.insert(key)
            merged.append(result)
        }
        return merged
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
        
        do {
            let publicCourse = try await api.golfCourseAPIImport(providerId: id)
            let decoded = APICourseDetails(publicCourse: publicCourse)
            sessionCache[id] = decoded
            persistenceManager?.cacheCourseDetails(decoded)
            return decoded
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

    func getCourseDetails(for result: APISearchResult) async throws -> APICourseDetails {
        if let publicCourse = result.publicCourse, !result.isProviderBacked {
            return APICourseDetails(publicCourse: publicCourse)
        }
        if result.isProviderBacked, result.id > 0 {
            return try await getCourseDetails(id: result.id)
        }
        if let publicCourse = result.publicCourse {
            return APICourseDetails(publicCourse: publicCourse)
        }
        throw APIError.notFound
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
            id: details.sourceCourseId ?? UUID(),
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

private extension APISearchResult {
    init(publicCourse: PublicCourse) {
        self.id = publicCourse.apiImportId
        self.courseId = publicCourse.id
        self.publicCourse = publicCourse
        self.club_name = publicCourse.name
        self.course_name = publicCourse.name
        self.location = APILocation(
            address: nil,
            city: publicCourse.city,
            state: publicCourse.region,
            country: publicCourse.country,
            latitude: publicCourse.latitude,
            longitude: publicCourse.longitude
        )
    }
}

private extension APICourseDetails {
    init(publicCourse: PublicCourse) {
        let holes = publicCourse.holes?.map {
            APIHole(par: $0.par, yardage: $0.yards, handicap: $0.handicap)
        }
        let tee = APITeeBox(
            tee_name: "Club",
            course_rating: publicCourse.courseRating,
            slope_rating: publicCourse.slopeRating,
            bogey_rating: nil,
            total_yards: nil,
            total_meters: publicCourse.totalMeters,
            number_of_holes: publicCourse.holesCount,
            par_total: publicCourse.par,
            front_course_rating: nil,
            front_slope_rating: nil,
            back_course_rating: nil,
            back_slope_rating: nil,
            holes: holes
        )
        self.id = publicCourse.apiImportId
        self.sourceCourseId = publicCourse.id
        self.club_name = publicCourse.name
        self.course_name = publicCourse.name
        self.location = APILocation(
            address: nil,
            city: publicCourse.city,
            state: publicCourse.region,
            country: publicCourse.country,
            latitude: publicCourse.latitude,
            longitude: publicCourse.longitude
        )
        self.tees = APITees(male: [tee], female: nil)
    }
}

private extension PublicCourse {
    var apiImportId: Int {
        if let providerId = Int(golfcourseapiId ?? "") {
            return providerId
        }

        let scalars = id.uuidString.unicodeScalars
        let hash = scalars.reduce(5381) { (($0 << 5) &+ $0) &+ Int($1.value) }
        return max(1, abs(hash % Int(Int32.max)))
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
