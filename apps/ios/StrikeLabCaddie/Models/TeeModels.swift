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
    let gust: Double?
    let humidity: Double?
    let uv: Double?
    let apparent: Double?
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

// MARK: - StrikeLab Open Golf API

struct PublicAttribution: Codable, Hashable, Identifiable {
    var id: String { sourceId }
    let sourceId: String
    let name: String
    let licenseName: String
    let licenseUrl: String?
    let attribution: String
    let sourceUrl: String?
}

struct PublicCourse: Codable, Hashable, Identifiable {
    let id: UUID
    let name: String
    let city: String?
    let region: String?
    let country: String?
    let countryCode: String?
    let courseType: String?
    let par: Int?
    let holesCount: Int?
    let slopeRating: Double?
    let courseRating: Double?
    let totalMeters: Int?
    let holes: [PublicHole]?
    let latitude: Double?
    let longitude: Double?
    let hasDrivingRange: Bool?
    let hasPracticeArea: Bool?
    let hasPuttingGreen: Bool?
    let hasPar3Course: Bool?
    let hasSimulator: Bool?
    let website: String?
    let ngfClubId: String?
    let osmId: String?
    let golfcourseapiId: String?
    let isVerified: Bool
    let geometrySummary: [String: JSONValue]?
    let dataSources: [PublicAttribution]
    let updatedAt: Date?
}

struct PublicHole: Codable, Hashable {
    let number: Int
    let par: Int?
    let handicap: Int?
    let yards: Int?
    let meters: Int?
}

struct PublicCourseGeometry: Codable, Hashable {
    let courseId: UUID
    let geometryVersion: String
    let features: PublicFeatureCollection
    let summary: [String: JSONValue]?
    let validation: [String: JSONValue]?
    let confidence: Double?
    let attribution: String?
    let source: PublicAttribution?
}

struct PublicFeatureCollection: Codable, Hashable {
    let type: String
    let features: [PublicCourseFeature]
}

struct PublicCourseFeature: Codable, Hashable, Identifiable {
    let id: String
    let kind: String
    let name: String?
    let hole: Int?
    let center: PublicCoordinate
    let tags: [String: String]?
}

struct PublicCoordinate: Codable, Hashable {
    let lat: Double
    let lon: Double
}

struct PublicCoursePackage: Codable, Hashable, Identifiable {
    var id: UUID { course.id }
    let course: PublicCourse
    let geometry: PublicCourseGeometry?
    let conditions: TeeCourseConditions?
    let cachedAt: Date
}

struct GolfCourseAPIProviderStatus: Codable, Hashable {
    let provider: String
    let configured: Bool
    let authenticated: Bool?
    let sampleQuery: String?
    let sampleCount: Int?
    let norwaySampleCount: Int?
    let rateLimitPlanHint: String
    let recommendation: String
}

struct GolfCourseAPIProviderSearch: Codable, Hashable {
    let provider: String
    let query: String
    let count: Int
    let courses: [PublicCourse]
    let note: String?
}

extension PublicCoursePackage {
    func toLocalCourse(existing: Course? = nil) -> Course {
        let localHoles: [HoleInfo]
        if let holes = course.holes, !holes.isEmpty {
            localHoles = holes.map {
                HoleInfo(
                    number: $0.number,
                    par: $0.par ?? 4,
                    handicapIndex: $0.handicap ?? $0.number
                )
            }
        } else {
            localHoles = existing?.holes ?? (1...max(course.holesCount ?? 18, 9)).map {
                HoleInfo(number: $0, par: 4, handicapIndex: $0)
            }
        }

        return Course(
            id: course.id,
            name: course.name,
            location: [course.city, course.region, course.country].compactMap { $0 }.joined(separator: ", "),
            holes: localHoles,
            tees: existing?.tees ?? [
                Tee(name: "Club", slope: course.slopeFallback, courseRating: course.ratingFallback, par: course.par)
            ],
            holeLayouts: geometry?.toHoleLayouts() ?? existing?.holeLayouts,
            apiCourseId: existing?.apiCourseId,
            latitude: course.latitude,
            longitude: course.longitude,
            isCustom: false
        )
    }
}

private extension PublicCourse {
    var slopeFallback: Double? { slopeRating }
    var ratingFallback: Double? { courseRating }
}

extension PublicCourseGeometry {
    func toHoleLayouts() -> [HoleLayout] {
        let grouped = Dictionary(grouping: features.features) { $0.hole ?? 0 }
        return grouped.compactMap { hole, items in
            guard hole > 0 else { return nil }
            var layout = HoleLayout(holeNumber: hole)
            for item in items {
                let coord = Coordinate(latitude: item.center.lat, longitude: item.center.lon)
                switch item.kind {
                case "tee":
                    layout.teeBox = layout.teeBox ?? coord
                case "green", "pin":
                    layout.greenCenter = layout.greenCenter ?? coord
                case "bunker":
                    layout.hazards.append(Hazard(type: .bunker, coordinate: coord, name: item.name))
                case "water_hazard", "lateral_water_hazard":
                    layout.hazards.append(Hazard(type: .water, coordinate: coord, name: item.name))
                default:
                    break
                }
            }
            return layout.hasGPSData || layout.teeBox != nil ? layout : nil
        }
        .sorted { $0.holeNumber < $1.holeNumber }
    }
}

enum JSONValue: Codable, Hashable {
    case string(String)
    case double(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(Double.self) { self = .double(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode([JSONValue].self) { self = .array(v) }
        else { self = .object((try? c.decode([String: JSONValue].self)) ?? [:]) }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let v): try c.encode(v)
        case .double(let v): try c.encode(v)
        case .bool(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        case .null: try c.encodeNil()
        }
    }
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

    /// Defaults used when the StrikeLab API is unreachable so Preferences
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
