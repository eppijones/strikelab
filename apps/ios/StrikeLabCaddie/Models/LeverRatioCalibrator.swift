//
//  LeverRatioCalibrator.swift
//  StrikeLabCaddie
//
//  Cross-checks the default lever ratio against GPS carry on full swings.
//  Read-only diagnostic for Profile → My Bag (v1).
//

import Foundation

enum LeverRatioCalibrator {

    struct ClubReport: Identifiable, Equatable {
        var id: String { clubKey }
        let clubKey: String
        /// Median implied ratio carry / handMph from on-course samples.
        let impliedRatio: Double
        /// MAD-based spread (rough ±).
        let sigma: Double
        let sampleCount: Int
        /// Built-in `SwingLeverRatio` constant for comparison.
        let catalogRatio: Double
    }

    /// Build per-club reports from any shots that have both motion + carry.
    static func reports(from shots: [Shot]) -> [ClubReport] {
        var buckets: [String: [Double]] = [:]
        for shot in shots {
            guard let yards = shot.distanceYards, yards > 40,
                  let motion = shot.motion,
                  !motion.phases.unreliable else { continue }
            let hand = SwingAnalytics.speeds(motion, club: shot.club).handSpeedMph
            guard hand > 20 else { continue }
            let implied = yards / hand
            guard implied > 1.5, implied < 5.5 else { continue }
            buckets[shot.club.rawValue, default: []].append(implied)
        }

        return buckets.compactMap { key, values -> ClubReport? in
            guard let club = Club(rawValue: key), values.count >= 3 else { return nil }
            let sorted = values.sorted()
            let med = median(sorted)
            let dev = sorted.map { abs($0 - med) }.sorted()
            let mad = median(dev)
            let sigma = max(0.02, 1.4826 * mad)
            let cat = SwingLeverRatio.ratio(for: club)
            return ClubReport(
                clubKey: key,
                impliedRatio: med,
                sigma: sigma,
                sampleCount: values.count,
                catalogRatio: cat
            )
        }
        .sorted { $0.sampleCount > $1.sampleCount }
    }

    private static func median(_ sorted: [Double]) -> Double {
        let n = sorted.count
        guard n > 0 else { return 0 }
        if n.isMultiple(of: 2) {
            return (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        }
        return sorted[n / 2]
    }
}
