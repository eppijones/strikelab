//
//  StrikeLabRangeExport.swift
//  StrikeLabCaddie
//
//  Versioned envelope for exporting a driving-range session to StrikeLab
//  web (`localhost:5173` / production) without losing motion payloads.
//

import Foundation

/// JSON envelope decoded by `apps/web` Range Lab import.
struct StrikeLabRangeExport: Codable, Equatable {
    static let currentSchemaVersion = 1

    var schemaVersion: Int
    var exportedAt: Date
    var app: String
    var session: PracticeSession

    init(exportedAt: Date = Date(), session: PracticeSession) {
        self.schemaVersion = Self.currentSchemaVersion
        self.exportedAt = exportedAt
        self.app = "StrikeLabCaddie"
        self.session = session
    }
}
