//
//  CoachInsights.swift
//  StrikeLabCaddie
//
//  Pattern detection across the player's recent rounds. Produces 1–3
//  short, actionable notes that surface on the Profile screen and link
//  to the Practice mode with a relevant club focus pre-filled.
//
//  Rule-based for now (no LLM in the loop yet) so it works fully offline,
//  is fast, and deterministic. The thresholds are tuned for amateurs in
//  the 5–25 handicap range — they call out genuinely actionable patterns
//  without being negative for occasional bad days.
//

import Foundation

struct CoachInsight: Identifiable {
    let id = UUID()
    let title: String        // "Three-putts on 18%"
    let detail: String       // "Lag-putt drill — focus on distance control."
    let icon: String         // SF Symbol
    let priority: Int        // 0 = highest priority
    let focusClub: Club?     // Used to deep-link Practice with this club

    /// Severity / colour cue.
    enum Severity { case warn, info, good }
    let severity: Severity
}

struct CoachInsightsEngine {
    let rounds: [Round]

    /// Up to three insights, ordered by priority. Always returns
    /// something meaningful even with very few rounds.
    func insights() -> [CoachInsight] {
        guard !rounds.isEmpty else { return [welcomeInsight] }

        var found: [CoachInsight] = []

        if let i = threePuttInsight() { found.append(i) }
        if let i = girByParInsight() { found.append(i) }
        if let i = hardestHolesInsight() { found.append(i) }
        if let i = scrambleInsight() { found.append(i) }
        if let i = trendInsight() { found.append(i) }

        // If nothing fired we still want to give the player something
        // positive — they're playing well.
        if found.isEmpty {
            found.append(allGoodInsight)
        }

        return Array(found.sorted { $0.priority < $1.priority }.prefix(3))
    }

    // MARK: - Empty state

    private var welcomeInsight: CoachInsight {
        CoachInsight(
            title: "Play your first round",
            detail: "Coach Insights light up after you log a round. Tap Round to start.",
            icon: "sparkles",
            priority: 0,
            focusClub: nil,
            severity: .info
        )
    }

    private var allGoodInsight: CoachInsight {
        CoachInsight(
            title: "Steady game across the board",
            detail: "Nothing screaming at us. Keep the wedges sharp — short game wins rounds.",
            icon: "checkmark.seal.fill",
            priority: 5,
            focusClub: .wedge56,
            severity: .good
        )
    }

    // MARK: - Insight rules

    /// 3+ putts on too many holes → lag-putting is the issue.
    private func threePuttInsight() -> CoachInsight? {
        let holes = rounds.flatMap { $0.holes.filter { $0.putts != nil } }
        guard holes.count >= 18 else { return nil }
        let threePlus = holes.filter { ($0.putts ?? 0) >= 3 }.count
        let pct = Double(threePlus) / Double(holes.count) * 100
        guard pct >= 12 else { return nil }
        return CoachInsight(
            title: "3-putts on \(Int(pct))% of holes",
            detail: "Lag-putt drill — focus on distance control from 8–12m.",
            icon: "circle.dotted",
            priority: 0,
            focusClub: .putter,
            severity: .warn
        )
    }

    /// Approach / iron play indicator: low GIR% on par 4s especially.
    private func girByParInsight() -> CoachInsight? {
        let par4 = rounds.flatMap { $0.holes.filter { $0.par == 4 && $0.greenInRegulation != nil } }
        guard par4.count >= 9 else { return nil }
        let hits = par4.filter { $0.greenInRegulation == true }.count
        let pct = Double(hits) / Double(par4.count) * 100
        guard pct < 30 else { return nil }
        return CoachInsight(
            title: "Par-4 GIR · \(Int(pct))%",
            detail: "Approach iron precision is the highest-leverage area for you. Try the 100 → 150 yd ladder drill.",
            icon: "target",
            priority: 1,
            focusClub: .iron7,
            severity: .warn
        )
    }

    /// Course management: bogey-or-worse rate on the hardest holes
    /// (HCP index 1–6 — the toughest third of the course).
    private func hardestHolesInsight() -> CoachInsight? {
        let hardest = rounds.flatMap { round in
            round.holes.filter { (1...6).contains($0.handicapIndex) && $0.scoreToPar != nil }
        }
        guard hardest.count >= 12 else { return nil }
        let blowups = hardest.filter { ($0.scoreToPar ?? 0) >= 2 }.count
        let pct = Double(blowups) / Double(hardest.count) * 100
        guard pct >= 35 else { return nil }
        return CoachInsight(
            title: "Toughest holes are hurting you",
            detail: "On HCP 1–6 holes you're double-bogey or worse \(Int(pct))% of the time. Play a stroke conservative off the tee.",
            icon: "exclamationmark.triangle.fill",
            priority: 2,
            focusClub: .driver,
            severity: .warn
        )
    }

    /// Scrambling / up-and-down — too many doubles after a missed green
    /// suggests short-game work pays back faster than long game.
    private func scrambleInsight() -> CoachInsight? {
        let missedGIR = rounds.flatMap { round in
            round.holes.filter { $0.greenInRegulation == false && $0.scoreToPar != nil }
        }
        guard missedGIR.count >= 9 else { return nil }
        let saved = missedGIR.filter { ($0.scoreToPar ?? 0) <= 0 }.count
        let scramblePct = Double(saved) / Double(missedGIR.count) * 100
        guard scramblePct < 20 else { return nil }
        return CoachInsight(
            title: "Scrambling · \(Int(scramblePct))%",
            detail: "When you miss the green you're not getting up and down. Wedge work from 30–60m is the highest stroke-saving practice.",
            icon: "flag.fill",
            priority: 3,
            focusClub: .wedge56,
            severity: .warn
        )
    }

    /// Recent trend — if last 3 rounds are clearly improving or
    /// declining, surface it as a positive nudge / encouragement.
    private func trendInsight() -> CoachInsight? {
        let stats = RoundStatistics(rounds: rounds)
        switch stats.scoreTrend {
        case .improving:
            return CoachInsight(
                title: "Trending down · keep it",
                detail: "Your last few rounds are coming down. Lock in the routine — same warm-up, same tee shot strategy.",
                icon: "arrow.down.right",
                priority: 4,
                focusClub: nil,
                severity: .good
            )
        case .declining:
            return CoachInsight(
                title: "A few high rounds in a row",
                detail: "Strip back to the basics in your next practice — alignment and balance.",
                icon: "arrow.up.right",
                priority: 4,
                focusClub: .iron7,
                severity: .info
            )
        case .neutral:
            return nil
        }
    }
}
