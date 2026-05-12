//
//  StablefordCalculator.swift
//  StrikeLabCaddie
//
//  Standard Stableford points (R&A / EGA) — the dominant scoring format
//  for handicap play in Norway and most of Europe. Points are awarded
//  against the **net** score on each hole:
//
//    Net double bogey (par + 2 + strokes received)  → 0 pts  ("PU")
//    Net bogey                                       → 1 pt
//    Net par                                         → 2 pts
//    Net birdie                                      → 3 pts
//    Net eagle                                       → 4 pts
//    Net albatross or better                         → 5+ pts
//
//  A 36-point round is "playing to handicap". Anything higher is a buffer
//  / handicap-improving round.
//

import Foundation

enum StablefordCalculator {
    /// Stableford points for a single hole. Returns nil when no gross
    /// score has been recorded yet so the UI can render "–".
    static func points(for hole: RoundHole) -> Int? {
        guard let gross = hole.grossStrokes, gross > 0 else { return nil }
        let net = gross - hole.strokesReceived
        let netToPar = net - hole.par
        // 2 pts for net par, 1 less per stroke over, 1 more per stroke under.
        // Floor at 0 — a "blow-up" hole earns no points.
        return max(0, 2 - netToPar)
    }

    /// Total Stableford points for the round so far.
    static func total(for round: Round) -> Int {
        round.holes.reduce(0) { $0 + (points(for: $1) ?? 0) }
    }

    /// Difference vs "playing to handicap" (36 pts target on an 18-hole
    /// round; scaled if the round is shorter).
    static func differential(for round: Round) -> Int {
        let target = 2 * round.holesCompleted   // 2 pts/hole = handicap pace
        return total(for: round) - target
    }

    /// Formatted "+3" / "-2" / "E" string.
    static func formattedDifferential(for round: Round) -> String {
        let diff = differential(for: round)
        if diff == 0 { return "E" }
        return diff > 0 ? "+\(diff)" : "\(diff)"
    }
}
