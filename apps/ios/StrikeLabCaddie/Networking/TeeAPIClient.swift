//
//  TeeAPIClient.swift
//  StrikeLabCaddie
//
//  Thin wrapper over APIClient for the StrikeLab Tee booking surface.
//  All endpoints mirror apps/api/app/routers/booking.py.
//

import Foundation
import Combine

@MainActor
final class TeeAPIClient {
    static let shared = TeeAPIClient()
    private let api = APIClient.shared

    // MARK: - Discover

    func discover() async throws -> TeeDiscoverResponse {
        try await api.get("/booking/discover")
    }

    // MARK: - Tee sheet + windows + conditions

    func teeSheet(courseId: UUID, date: Date) async throws -> TeeSheet {
        let day = ISO8601Date.shared.day(date)
        return try await api.get("/booking/courses/\(courseId.uuidString.lowercased())/sheet?date=\(day)")
    }

    func bestWindows(courseId: UUID, date: Date) async throws -> [TeeBestWindow] {
        let day = ISO8601Date.shared.day(date)
        return try await api.get("/booking/windows/\(courseId.uuidString.lowercased())?date=\(day)")
    }

    func conditions(courseId: UUID, date: Date) async throws -> TeeCourseConditions {
        let day = ISO8601Date.shared.day(date)
        return try await api.get("/booking/courses/\(courseId.uuidString.lowercased())/conditions?date=\(day)")
    }

    // MARK: - Public Open Golf API

    func publicCourse(courseId: UUID) async throws -> PublicCourse {
        try await api.get("/public/courses/\(courseId.uuidString.lowercased())")
    }

    func publicCoursesSearch(query: String, countryCode: String? = "NO", limit: Int = 80) async throws -> [PublicCourse] {
        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryValueAllowed) ?? query
        var path = "/public/courses?q=\(encoded)&limit=\(limit)"
        if let countryCode, !countryCode.isEmpty {
            path += "&country_code=\(countryCode)"
        }
        return try await api.get(path)
    }

    func publicGeometry(courseId: UUID) async throws -> PublicCourseGeometry {
        try await api.get("/public/courses/\(courseId.uuidString.lowercased())/geometry")
    }

    func publicConditions(courseId: UUID, date: Date) async throws -> TeeCourseConditions {
        let day = ISO8601Date.shared.day(date)
        return try await api.get("/public/courses/\(courseId.uuidString.lowercased())/conditions?date=\(day)")
    }

    func publicCoursePackage(courseId: UUID, date: Date = Date()) async throws -> PublicCoursePackage {
        async let course = publicCourse(courseId: courseId)
        async let conditions = try? publicConditions(courseId: courseId, date: date)
        async let geometry = try? publicGeometry(courseId: courseId)
        return PublicCoursePackage(
            course: try await course,
            geometry: await geometry,
            conditions: await conditions,
            cachedAt: Date()
        )
    }

    func golfCourseAPIStatus() async throws -> GolfCourseAPIProviderStatus {
        try await api.get("/public/providers/golfcourseapi/status")
    }

    func golfCourseAPISearch(query: String) async throws -> GolfCourseAPIProviderSearch {
        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryValueAllowed) ?? query
        return try await api.get("/public/providers/golfcourseapi/search?q=\(encoded)")
    }

    func golfCourseAPIImport(providerId: Int) async throws -> PublicCourse {
        try await api.request(
            "/public/providers/golfcourseapi/import/\(providerId)",
            method: .post,
            body: Optional<EmptyBody>.none
        )
    }

    // MARK: - Preferences

    func preferences() async throws -> TeeBookingPreferences {
        try await api.get("/booking/preferences")
    }

    func updatePreferences(_ payload: TeeBookingPreferencesUpdate) async throws -> TeeBookingPreferences {
        try await api.request("/booking/preferences", method: .patch, body: payload)
    }

    // MARK: - Hold + Confirm

    func hold(_ payload: TeeHoldRequest) async throws -> TeeHoldResponse {
        try await api.post("/booking/hold", body: payload)
    }

    func confirm(_ payload: TeeConfirmRequest) async throws -> TeeConfirmResponse {
        try await api.post("/booking/confirm", body: payload)
    }

    // MARK: - Pass

    func pass(bookingId: UUID) async throws -> TeePassResponse {
        try await api.get("/booking/passes/\(bookingId.uuidString.lowercased())")
    }

    func upcomingPasses() async throws -> [TeePassResponse] {
        try await api.get("/booking/passes?upcoming_only=true")
    }

    func cancel(bookingId: UUID) async throws {
        let _: EmptyResponse = try await api.request(
            "/booking/cancel/\(bookingId.uuidString.lowercased())",
            method: .post,
            body: Optional<EmptyBody>.none
        )
    }

    // MARK: - Playmates

    func playmates() async throws -> [TeePlaymate] {
        try await api.get("/booking/playmates")
    }
}

private final class ISO8601Date {
    static let shared = ISO8601Date()
    private let formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        return f
    }()
    func day(_ date: Date) -> String { formatter.string(from: date) }
}

private extension CharacterSet {
    static let urlQueryValueAllowed: CharacterSet = {
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: ":#[]@!$&'()*+,;=")
        return allowed
    }()
}
