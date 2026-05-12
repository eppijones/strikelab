//
//  WatchPersonalWindow.swift
//  StrikeLabCaddieWatch Watch App
//
//  JSON mirror of iOS `PersonalWindow` — must stay field-compatible for
//  `WCSession.applicationContext` decoding.
//

import Foundation
import simd

struct WatchPersonalWindow: Codable, Equatable {
    let clubKey: String
    let sampleCount: Int
    let updatedAt: Date

    let tempoWindowLo: Double
    let tempoWindowHi: Double
    let tempoCareerLo: Double
    let tempoCareerHi: Double

    let backswingWindowLo: Double
    let backswingWindowHi: Double
    let backswingCareerLo: Double
    let backswingCareerHi: Double

    let handWindowLo: Double
    let handWindowHi: Double
    let handCareerLo: Double
    let handCareerHi: Double

    let planeAxisX: Double
    let planeAxisY: Double
    let planeAxisZ: Double
    let planeDeltaMedianDeg: Double
    let planeDeltaWindowLo: Double
    let planeDeltaWindowHi: Double
    let planeDeltaCareerLo: Double
    let planeDeltaCareerHi: Double

    let hrWindowLo: Double
    let hrWindowHi: Double
    let hrCareerLo: Double
    let hrCareerHi: Double

    var referenceAxis: SIMD3<Double> {
        let v = SIMD3(planeAxisX, planeAxisY, planeAxisZ)
        let len = simd_length(v)
        guard len > 1e-6 else { return SIMD3(1, 0, 0) }
        var u = v / len
        if u.x < 0 { u = -u }
        return u
    }

    func tempoContains(_ ratio: Double) -> Bool {
        ratio >= tempoWindowLo && ratio <= tempoWindowHi
    }

    func handContains(_ mph: Double) -> Bool {
        mph >= handWindowLo && mph <= handWindowHi
    }
}
