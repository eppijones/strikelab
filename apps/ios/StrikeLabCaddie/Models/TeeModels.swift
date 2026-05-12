//
//  TeeModels.swift
//  StrikeLabCaddie
//
//  DTOs for the StrikeLab Tee booking surface. Mirrors
//  apps/api/app/schemas/booking.py 1:1.
//

import Foundation

// MARK: - Conditions

struct TeeHourlyCondition: Codable, Hashable, Identifiable {
    var id: Int { h }
    let h: Int
    let t: Double
    let w: Double
    let dir: String?
    let sun: Double
    let cloud: Double
    let rain: Double
}

struct TeeCourseConditions: Codable, Hashable {
    let courseId: UUID
    let capturedAt: Date
    let forDate: String?
    let hourly: [TeeHourlyCondition]?
    let greenSpeed: Double?
    let fairwayState: String?
    let roughState: String?
    let mowedHrsAgo: Int?
    let windMs: Double?
    let tempC: Double?
    let sunPct: Double?
    let cloudPct: Double?
    let rainPct: Double?
    let sunrise: String?
    let sunset: String?
    let goldenStart: String?
    let source: String
}

// MARK: - Tee sheet

struct TeeSlotOccupant: Codable, Hashable {
    let userId: String
    let initials: String
    let isFriend: Bool
    let handicap: Double?
}

struct TeeSheetSlot: Codable, Identifiable, Hashable {
    let id: UUID
    let teeTime: Date
    let playersTotal: Int
    let playersTaken: Int
    let available: Int
    let priceAmount: Double?
    let currency: String
    let peak: Bool
    let golden: Bool
    let twilight: Bool
    let isBlocked: Bool
    let providerRef: String?
    let occupants: [TeeSlotOccupant]
}

struct TeeSheet: Codable, Hashable {
    let id: UUID
    let courseId: UUID
    let courseName: String
    let date: String
    let opensAt: String
    let closesAt: String
    let intervalMin: Int
    let currency: String
    let provider: String
    let slots: [TeeSheetSlot]
    let conditions: TeeCourseConditions?
}

// MARK: - Best windows + recommendations

struct TeeBestWindow: Codable, Hashable, Identifiable {
    var id: String { label }
    let label: String
    let labelNo: String
    let labelEn: String
    let startHour: Int
    let endHour: Int
    let range: String
    let conditionsSummary: String
    let freeSlots: Int
    let accent: String
}

struct TeeRecommendedSlot: Codable, Identifiable, Hashable {
    var id: String { slotId.uuidString }
    let courseId: UUID
    let courseName: String
    let courseCity: String?
    let courseRegion: String?
    let courseType: String?
    let driveMin: Int?
    let driveKm: Double?
    let slotId: UUID
    let teeTime: Date
    let available: Int
    let priceAmount: Double?
    let currency: String
    let score: Double
    let why: [String]
    let windowLabel: String?
    let sunPct: Double?
    let windMs: Double?
    let tempC: Double?
    let rainPct: Double?
}

struct TeeDiscoverResponse: Codable, Hashable {
    let bucket: String
    let bestNow: [TeeRecommendedSlot]
    let todayWindow: [TeeRecommendedSlot]
    let tonight: [TeeRecommendedSlot]
    let weekend: [TeeRecommendedSlot]
    let favorites: [TeeRecommendedSlot]
    let nearby: [TeeRecommendedSlot]
}

// MARK: - Preferences

struct TeeBookingPreferences: Codable, Hashable {
    let id: UUID
    let userId: UUID
    var timeBands: [String]?
    var maxWindMs: Double?
    var maxRainPct: Double?
    var minTempC: Double?
    var courseTypes: [String]?
    var soloOnly: Bool
    var noGroupsBehindMin: Int?
    var walkingOnly: Bool
    var favoriteCourseId: UUID?
    var defaultPlayerIds: [UUID]?
    var showToPairs: Bool
    var handicapVisible: Bool

    /// Defaults used when `api.strikelab.golf` is unreachable so Preferences
    /// stays usable; changes are local until the API is available again.
    static func localDraftDefaults() -> TeeBookingPreferences {
        TeeBookingPreferences(
            id: UUID(),
            userId: UUID(),
            timeBands: ["morning", "afternoon"],
            maxWindMs: 10,
            maxRainPct: 0.3,
            minTempC: 5,
            courseTypes: ["parkland", "links"],
            soloOnly: false,
            noGroupsBehindMin: 10,
            walkingOnly: false,
            favoriteCourseId: nil,
            defaultPlayerIds: nil,
            showToPairs: false,
            handicapVisible: true
        )
    }
}

struct TeeBookingPreferencesUpdate: Codable, Hashable {
    var timeBands: [String]?
    var maxWindMs: Double?
    var maxRainPct: Double?
    var minTempC: Double?
    var courseTypes: [String]?
    var soloOnly: Bool?
    var noGroupsBehindMin: Int?
    var walkingOnly: Bool?
    var favoriteCourseId: UUID?
    var defaultPlayerIds: [UUID]?
    var showToPairs: Bool?
    var handicapVisible: Bool?
}

// MARK: - Hold + Confirm

struct TeeHoldPlayerInput: Codable, Hashable {
    var userId: UUID?
    var name: String
    var handicap: Double?
    var phone: String?
}

struct TeeHoldRequest: Codable {
    var slotId: UUID?
    var courseId: UUID?
    var courseName: String
    var teeTime: Date
    var players: Int
    var playerPayload: [TeeHoldPlayerInput]?
    var provider: String = "internal"
    var providerRef: String?
    var priceAmount: Double?
    var currency: String = "NOK"
}

struct TeeHoldResponse: Codable, Hashable {
    let id: UUID
    let userId: UUID
    let slotId: UUID?
    let courseId: UUID?
    let courseName: String
    let teeTime: Date
    let players: Int
    let provider: String
    let providerRef: String?
    let priceAmount: Double?
    let currency: String
    let totalAmount: Double?
    let paymentMethod: String?
    let status: String
    let expiresAt: Date
}

struct TeeConfirmRequest: Codable {
    let holdId: UUID
    let paymentMethod: String
    var paymentToken: String?
    var splitMode: String = "together"
    var notes: String?
}

struct TeeConfirmResponse: Codable, Hashable {
    let bookingId: UUID
    let teeTimeId: UUID?
    let courseName: String
    let teeTime: Date
    let status: String
    let checkInCode: String?
    let paymentMethod: String
    let paymentStatus: String
    let passUrl: String?
}

// MARK: - Pass

struct TeePassPlayer: Codable, Hashable, Identifiable {
    var id: String { name + initials }
    let name: String
    let initials: String
    let handicap: Double?
    let isYou: Bool
}

struct TeePassResponse: Codable, Hashable, Identifiable {
    var id: UUID { bookingId }
    let bookingId: UUID
    let courseId: UUID?
    let courseName: String
    let courseCity: String?
    let courseRegion: String?
    let courseType: String?
    let teeTime: Date
    let countdownSeconds: Int
    let players: [TeePassPlayer]
    let forecastTempC: Double?
    let forecastWindMs: Double?
    let forecastWindDir: String?
    let forecastState: String?
    let driveMin: Int?
    let checkInCode: String?
    let qrCode: String?
    let cancelFreeUntil: Date?
    let status: String
}

// MARK: - Playmates

struct TeePlaymate: Codable, Identifiable, Hashable {
    let id: UUID
    let friendUserId: UUID?
    let displayName: String?
    let handicap: Double?
    let lastPlayedAt: Date?
    let roundsTogether: Int
    let publicHandicapVisible: Bool
}
