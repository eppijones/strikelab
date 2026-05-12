//
//  SwingAnalytics.swift
//  StrikeLabCaddie
//
//  Pure-Swift derivations on top of the captured `SwingMotionData` +
//  `HeartRateData` payloads. Every function is deterministic — same
//  input bytes produce byte-identical output — so the Phase-2 acceptance
//  ("same swing replayed gives byte-identical numbers") holds.
//
//  This module is the maths that needs to be right. The on-watch
//  segmentation is a heuristic; the SwingCard reads the canonical
//  metrics out of here.
//

import Foundation
import simd

// MARK: - Tunable constants

/// Per-club lever ratio: clubhead speed ≈ hand speed × `leverRatio`.
/// Starter constants — refined per-player in Phase 4 calibration.
enum SwingLeverRatio {
    static func ratio(for club: Club) -> Double {
        switch club.group {
        case .driver: return 3.20
        case .wood:   return 3.00
        case .hybrid: return 2.90
        case .iron:   return 2.70
        case .wedge:  return 2.40
        case .putt:   return 1.00
        }
    }
}

/// Default arm length when the player hasn't entered theirs (m).
private let defaultArmLengthMeters: Double = 0.70

// MARK: - Derived metrics

struct SwingTempo: Equatable {
    /// Ratio of backswing time to downswing time. Pros sit at ~3.0.
    /// `nil` when the segmentation didn't find both phases cleanly.
    let ratio: Double?
    let backswingSeconds: Double
    let downswingSeconds: Double
}

struct SwingSpeeds: Equatable {
    /// Peak hand speed at impact (m/s).
    let handSpeedMps: Double
    /// Same value in mph.
    let handSpeedMph: Double
    /// Estimated clubhead speed (mph) using the per-club lever ratio.
    let clubSpeedMph: Double
    /// Lever ratio used for the club estimate.
    let leverRatio: Double
}

struct SwingSmoothness: Equatable {
    /// RMS of the third derivative (jerk) of |userAcceleration| during
    /// the downswing window. Lower = smoother. Tour pros sit ≤ 50 g/s²
    /// for a driver swing; amateurs are typically 80-200.
    let jerkRMS: Double
}

struct SwingPlane: Equatable {
    /// Principal eigenvector of the rotation-rate covariance during the
    /// downswing — the axis of the swing plane in the watch frame.
    /// Unit-length, sign normalized so x ≥ 0.
    let axis: SIMD3<Double>
}

struct PressureIndex: Equatable {
    /// 0.0 (calm) … 1.0 (theoretical max). Computed against the player's
    /// resting HR baseline and a max HR estimate.
    let value: Double
    /// HR @ impact (BPM). Echoed for convenience.
    let bpmAtImpact: Double
    /// Resting HR baseline used.
    let restingBpm: Double
    /// Max HR ceiling used.
    let maxBpm: Double
}

// MARK: - Plane delta vs reference

/// Angle (in degrees) between two unit vectors.
func angleDegrees(between a: SIMD3<Double>, and b: SIMD3<Double>) -> Double {
    let dot = min(1.0, max(-1.0, simd_dot(a, b)))
    return acos(dot) * 180.0 / .pi
}

// MARK: - Core analytics

enum SwingAnalytics {

    // MARK: Tempo

    static func tempo(_ motion: SwingMotionData) -> SwingTempo {
        let p = motion.phases
        let dt = motion.sampleInterval
        let bw = max(0.0, Double(p.topIdx - p.backswingStartIdx)) * dt
        let dw = max(0.0, Double(p.impactIdx - p.topIdx)) * dt
        if p.unreliable {
            return SwingTempo(ratio: nil, backswingSeconds: bw, downswingSeconds: dw)
        }
        let ratio: Double? = (bw > 0 && dw > 0.001) ? bw / dw : nil
        return SwingTempo(
            ratio: ratio,
            backswingSeconds: bw,
            downswingSeconds: dw
        )
    }

    // MARK: Speeds

    /// Hand + club speed estimates. Arm length defaults to 0.70 m if
    /// `armLengthMeters` is nil (set once per player in Profile).
    static func speeds(
        _ motion: SwingMotionData,
        club: Club,
        armLengthMeters: Double? = nil
    ) -> SwingSpeeds {
        let arm = armLengthMeters ?? defaultArmLengthMeters
        let mps = motion.peakRotationRate * arm
        let mph = mps * 2.23694
        let lever = SwingLeverRatio.ratio(for: club)
        let clubMph = mph * lever
        return SwingSpeeds(
            handSpeedMps: mps,
            handSpeedMph: mph,
            clubSpeedMph: clubMph,
            leverRatio: lever
        )
    }

    // MARK: Smoothness / jerk

    static func smoothness(_ motion: SwingMotionData) -> SwingSmoothness {
        let p = motion.phases
        guard p.impactIdx > p.topIdx + 2,
              motion.samples.count > p.impactIdx else {
            return SwingSmoothness(jerkRMS: 0)
        }
        let dt = motion.sampleInterval
        let aMags = motion.samples[p.topIdx...p.impactIdx].map(\.aMag)
        // Third derivative via finite differences. Need at least 4 points.
        guard aMags.count >= 4 else { return SwingSmoothness(jerkRMS: 0) }
        var jerks: [Double] = []
        jerks.reserveCapacity(aMags.count - 3)
        for i in 0..<(aMags.count - 3) {
            // f'''(t) ≈ (f[i+3] − 3 f[i+2] + 3 f[i+1] − f[i]) / dt³
            let d3 = (aMags[i + 3] - 3 * aMags[i + 2] + 3 * aMags[i + 1] - aMags[i])
            jerks.append(d3 / (dt * dt * dt))
        }
        let mean2 = jerks.reduce(0) { $0 + $1 * $1 } / Double(jerks.count)
        return SwingSmoothness(jerkRMS: mean2.squareRoot())
    }

    // MARK: Plane axis

    /// Principal eigenvector of the 3x3 covariance of rotationRate during
    /// the downswing. Computed via 32 iterations of the power method —
    /// converges fast and is deterministic with fixed-seed init.
    static func plane(_ motion: SwingMotionData) -> SwingPlane {
        let p = motion.phases
        guard p.impactIdx > p.topIdx + 1,
              motion.samples.count > p.impactIdx else {
            return SwingPlane(axis: SIMD3<Double>(1, 0, 0))
        }
        let slice = motion.samples[p.topIdx...p.impactIdx]
        let n = Double(slice.count)
        guard n > 1 else { return SwingPlane(axis: SIMD3<Double>(1, 0, 0)) }

        // Mean.
        var mean = SIMD3<Double>(0, 0, 0)
        for s in slice { mean += SIMD3(s.gx, s.gy, s.gz) }
        mean /= n

        // Covariance (3x3) — symmetric, store as 6 floats.
        var c00 = 0.0, c01 = 0.0, c02 = 0.0, c11 = 0.0, c12 = 0.0, c22 = 0.0
        for s in slice {
            let v = SIMD3(s.gx, s.gy, s.gz) - mean
            c00 += v.x * v.x
            c01 += v.x * v.y
            c02 += v.x * v.z
            c11 += v.y * v.y
            c12 += v.y * v.z
            c22 += v.z * v.z
        }
        c00 /= n; c01 /= n; c02 /= n; c11 /= n; c12 /= n; c22 /= n

        let cov = simd_double3x3(rows: [
            SIMD3<Double>(c00, c01, c02),
            SIMD3<Double>(c01, c11, c12),
            SIMD3<Double>(c02, c12, c22)
        ])

        // Power iteration for the dominant eigenvector. Deterministic
        // start: (1, 1, 1) normalized.
        var v = simd_normalize(SIMD3<Double>(1, 1, 1))
        for _ in 0..<32 {
            let next = cov * v
            let m = simd_length(next)
            if m < 1e-12 { break }
            v = next / m
        }
        // Sign-normalise so reproducibility is byte-identical regardless
        // of which sign-equivalent eigenvector the iteration converges to.
        if v.x < 0 { v = -v }
        return SwingPlane(axis: v)
    }

    // MARK: Pressure

    /// Pressure index. `playerAgeYears` lets us pick a HR-max ceiling
    /// (220 − age, the standard Tanaka-adjacent approximation).
    static func pressure(
        _ hr: HeartRateData?,
        restingBpm: Double = 60,
        playerAgeYears: Int = 35
    ) -> PressureIndex? {
        guard let hr, hr.heartRate > 0 else { return nil }
        let maxBpm = max(120.0, 220.0 - Double(playerAgeYears))
        let reserve = max(1.0, maxBpm - restingBpm)
        let frac = (hr.heartRate - restingBpm) / reserve
        let clamped = max(0, min(1, frac))
        return PressureIndex(
            value: clamped,
            bpmAtImpact: hr.heartRate,
            restingBpm: restingBpm,
            maxBpm: maxBpm
        )
    }

    // MARK: One-shot summary

    /// Convenience wrapper that computes every derivation. Used by the
    /// Swing Card so each section can read straight from one struct.
    static func summary(
        for motion: SwingMotionData,
        club: Club,
        hr: HeartRateData?,
        armLengthMeters: Double? = nil,
        restingBpm: Double = 60,
        playerAgeYears: Int = 35
    ) -> SwingSummary {
        SwingSummary(
            tempo: tempo(motion),
            speeds: speeds(motion, club: club, armLengthMeters: armLengthMeters),
            smoothness: smoothness(motion),
            plane: plane(motion),
            pressure: pressure(hr, restingBpm: restingBpm, playerAgeYears: playerAgeYears),
            club: club,
            capturedAt: motion.capturedAt,
            segmentationUnreliable: motion.phases.unreliable
        )
    }
}

struct SwingSummary: Equatable {
    let tempo: SwingTempo
    let speeds: SwingSpeeds
    let smoothness: SwingSmoothness
    let plane: SwingPlane
    let pressure: PressureIndex?
    let club: Club
    let capturedAt: Date
    /// Mirrors `SwingMotionData.phases.unreliable` for UI + grading.
    let segmentationUnreliable: Bool
}

// MARK: - Self-test (DEBUG only)

#if DEBUG

/// Tiny synthetic-fixture self-test. Builds a swing with known peaks and
/// phase indices and asserts the analytics output. Run from
/// `SwingInspectorView` so we have a one-tap regression check.
enum SwingAnalyticsSelfTest {

    struct Result {
        let name: String
        let pass: Bool
        let detail: String
    }

    static func run() -> [Result] {
        var out: [Result] = []
        let motion = makeFixtureMotion()

        let tempo = SwingAnalytics.tempo(motion)
        // Backswing 30 samples * 0.01 = 0.30 s; downswing 10 * 0.01 = 0.10 s
        // Ratio = 3.0
        out.append(Result(
            name: "Tempo ratio ≈ 3.0",
            pass: abs((tempo.ratio ?? 0) - 3.0) < 0.001,
            detail: String(format: "got %.4f", tempo.ratio ?? -1)
        ))

        let speeds = SwingAnalytics.speeds(motion, club: .iron7, armLengthMeters: 0.70)
        // peakRotationRate = 30 rad/s × 0.70 m = 21 m/s ≈ 47.0 mph
        // 7-iron lever 2.7 → ~127 mph clubhead (test value)
        out.append(Result(
            name: "Hand speed ≈ 47 mph",
            pass: abs(speeds.handSpeedMph - 46.97) < 0.05,
            detail: String(format: "got %.2f", speeds.handSpeedMph)
        ))
        out.append(Result(
            name: "Club speed ≈ 126.8 mph",
            pass: abs(speeds.clubSpeedMph - 126.83) < 0.5,
            detail: String(format: "got %.2f", speeds.clubSpeedMph)
        ))

        let plane = SwingAnalytics.plane(motion)
        // Synthetic samples vary primarily along x → axis dominantly x.
        out.append(Result(
            name: "Plane axis dominant in x",
            pass: plane.axis.x > 0.95,
            detail: String(format: "got (%.3f, %.3f, %.3f)",
                           plane.axis.x, plane.axis.y, plane.axis.z)
        ))

        let pressure = SwingAnalytics.pressure(
            HeartRateData(heartRate: 130, hrv: nil, preMedian: 110, postMedian: 132, snapshot: nil),
            restingBpm: 60,
            playerAgeYears: 35
        )
        // (130-60) / (185-60) = 70/125 = 0.56
        out.append(Result(
            name: "Pressure ≈ 0.56",
            pass: abs((pressure?.value ?? 0) - 0.56) < 0.005,
            detail: String(format: "got %.3f", pressure?.value ?? -1)
        ))

        return out
    }

    /// Synthetic 0.50 s swing at 100 Hz with canonical phases:
    ///   • backswingStartIdx = 0
    ///   • topIdx = 30           (0.30 s backswing)
    ///   • impactIdx = 40         (0.10 s downswing → tempo ratio 3:1)
    ///   • finishIdx = 50
    /// Rotation rate ramps to 30 rad/s at impact (→ 47 mph hand speed
    /// with 0.70 m arms). Variation is purely along the x axis so the
    /// principal eigenvector of the downswing covariance is (1, 0, 0).
    private static func makeFixtureMotion() -> SwingMotionData {
        let dt = 0.01
        let n = 51
        var samples: [SwingSample] = []
        samples.reserveCapacity(n)
        for i in 0..<n {
            let t = Double(i) * dt * 1000.0
            // gx ramps 0…30 across the swing, varying only along x.
            let gx: Double = (i <= 40) ? Double(i) * 0.75 : max(0, 30 - Double(i - 40) * 3.0)
            // ax peaks at impact only.
            let ax: Double = (i == 40) ? 5.0 : Double(min(i, 40)) * 0.05
            samples.append(SwingSample(
                tMs: t,
                ax: ax, ay: 0, az: 0,
                gx: gx, gy: 0, gz: 0,
                qw: 1, qx: 0, qy: 0, qz: 0
            ))
        }
        let phases = SwingPhaseMarkers(
            backswingStartIdx: 0,
            topIdx: 30,
            impactIdx: 40,
            finishIdx: 50,
            unreliable: false
        )
        let peakA = samples.lazy.map(\.aMag).max() ?? 0
        let peakG = samples.lazy.map(\.gMag).max() ?? 0
        let tempoSeconds = Double(phases.impactIdx - phases.backswingStartIdx) * dt
        return SwingMotionData(
            peakAcceleration: peakA,
            peakRotationRate: peakG,
            swingTempo: tempoSeconds,
            sampleInterval: dt,
            samples: samples,
            phases: phases,
            impactConfirmed: false,
            capturedAt: Date(timeIntervalSinceReferenceDate: 0),
            accelerationProfile: samples.map(\.aMag),
            gyroProfile: samples.map(\.gMag)
        )
    }
}

#endif
