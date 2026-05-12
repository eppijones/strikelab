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
