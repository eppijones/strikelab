//
//  ClubCalibration.swift
//  StrikeLabCaddie
//
//  Phase 4 fitter — builds a per-club `ClubModel` from a small set of
//  (hand_speed, carry) samples. v1 uses ridge-regularized linear
//  regression on hand speed only:
//
//      carry_yards ≈ α · handMph + γ
//
//  Ridge term λ = 0.5 keeps the fit well-posed with as few as 3 samples
//  (we know roughly what an iron does, so a tiny prior is harmless).
//
//  Phase 4+ extends the feature set to include smoothness and an
//  attack-angle proxy; the API surface here is forward-compatible.
//

import Foundation

enum ClubCalibration {

    struct Sample: Equatable {
        let handMph: Double
        let carryYards: Double
    }

    /// Fit a `ClubModel` from `samples`. Returns nil with <3 samples.
    static func fit(_ samples: [Sample], lambda: Double = 0.5) -> ClubModel? {
        guard samples.count >= 3 else { return nil }
        let xs = samples.map(\.handMph)
        let ys = samples.map(\.carryYards)
        let n = Double(samples.count)
        let meanX = xs.reduce(0, +) / n
        let meanY = ys.reduce(0, +) / n
        var sxx = 0.0, sxy = 0.0
        for i in 0..<samples.count {
            let dx = xs[i] - meanX
            let dy = ys[i] - meanY
            sxx += dx * dx
            sxy += dx * dy
        }
        // Ridge: alpha = sxy / (sxx + lambda)
        let alpha = sxy / max(0.0001, sxx + lambda)
        let gamma = meanY - alpha * meanX

        // Residual std-dev.
        var sse = 0.0
        for i in 0..<samples.count {
            let pred = alpha * xs[i] + gamma
            let r = ys[i] - pred
            sse += r * r
        }
        let dof = max(1.0, n - 2.0)
        let sigma = (sse / dof).squareRoot()

        let mphSorted = xs.sorted()
        let medianMph = mphSorted[mphSorted.count / 2]

        return ClubModel(
            alpha: alpha,
            gamma: gamma,
            sigma: sigma,
            sampleCount: samples.count,
            medianHandMph: medianMph
        )
    }
}
