//
//  RoundSummaryView.swift
//  StrikeLabCaddie
//
//  Celebratory recap shown when the player ends a round. The "moment of
//  truth" of the product — this is where we have to make scoring feel
//  rewarding, not transactional. Big number, score-distribution heatmap,
//  GIR / fairway / putts strip, best + worst hole call-outs, share button.
//

import SwiftUI

struct RoundSummaryView: View {
    let round: Round
    var onClose: () -> Void = {}

    @EnvironmentObject var persistenceManager: PersistenceManager
    @State private var showShare = false
    @State private var shareImage: UIImage?

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                heroCard
                distributionCard
                accuracyCard
                puttingCard
                bestWorstCard
                bottomActions
                Spacer(minLength: 32)
            }
            .padding(20)
        }
        .nordicBackground()
        .navigationTitle("Round Complete")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { onClose() }
                    .foregroundColor(Theme.accent)
            }
        }
        .sheet(isPresented: $showShare) {
            if let image = shareImage {
                ShareSheet(items: [image])
            }
        }
    }

    // MARK: - Hero

    private var hero: HeroSummary {
        HeroSummary(round: round)
    }

    private var heroCard: some View {
        VStack(spacing: 6) {
            Text(round.course.name.uppercased())
                .font(Theme.labelFont(11))
                .tracking(1.8)
                .foregroundColor(Theme.ink3)

            Text(round.date, style: .date)
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("\(round.grossTotal)")
                    .font(Theme.statFont(96))
                    .foregroundColor(Theme.ink)

                VStack(alignment: .leading, spacing: 4) {
                    Text(round.formattedOverUnder)
                        .font(Theme.statFont(28))
                        .foregroundColor(scoreColor)
                    Text("vs par \(round.course.totalPar)")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }
            }

            // Net + course handicap row
            HStack(spacing: 18) {
                heroStat(label: "NET", value: "\(round.netTotal)", tint: Theme.accent)
                if let ch = round.courseHandicap {
                    heroDivider
                    heroStat(label: "CH", value: "\(ch)", tint: Theme.warn)
                }
                heroDivider
                heroStat(label: "HOLES", value: "\(round.holesCompleted)/\(round.holes.count)", tint: Theme.ink2)
                heroDivider
                heroStat(label: "TIME", value: round.formattedElapsed, tint: Theme.ink2)
            }
            .padding(.top, 6)

            // Stableford row — handicap-fairness scoring, dominant in EU/NO.
            HStack(spacing: 6) {
                Text("STABLEFORD")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Text("\(StablefordCalculator.total(for: round))")
                    .font(Theme.statFont(18))
                    .foregroundColor(Theme.warn)
                Text("PTS")
                    .font(Theme.labelFont(10))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
                Text("·")
                    .foregroundColor(Theme.ink3)
                Text(StablefordCalculator.formattedDifferential(for: round))
                    .font(Theme.labelFont(11))
                    .tracking(1.0)
                    .foregroundColor(stablefordTint)
                Text("vs handicap")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
            }
            .padding(.top, 4)

            if let pace = round.paceMinutesPerHole {
                Text("PACE · \(String(format: "%.1f", pace)) MIN / HOLE")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                    .padding(.top, 4)
            }

            if let headline = headline {
                Text(headline.uppercased())
                    .font(Theme.labelFont(11))
                    .tracking(1.8)
                    .foregroundColor(Theme.accent)
                    .padding(.top, 6)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .glassCard()
    }

    private var scoreColor: Color {
        if round.grossOverUnder < 0 { return Theme.accent }
        if round.grossOverUnder > 0 { return Theme.bad }
        return Theme.ink
    }

    /// Stableford differential colour — under-handicap (more pts than
    /// 2/hole pace) is good and earns the lime accent.
    private var stablefordTint: Color {
        let diff = StablefordCalculator.differential(for: round)
        if diff > 0 { return Theme.accent }
        if diff < 0 { return Theme.bad }
        return Theme.ink
    }

    /// Pick a celebratory headline based on what happened during the
    /// round. Goes from "achievement unlocked" tone (eagles, hole-in-ones)
    /// down to neutral ("solid round").
    private var headline: String? {
        let dist = hero.distribution
        if dist.eagleOrBetter > 0 { return "Eagle on the card" }
        if dist.birdies >= 3 { return "Birdie barrage" }
        if dist.birdies > 0 { return "First birdie of the round" }
        if round.grossOverUnder == 0 { return "Even par day" }
        if round.grossOverUnder < 0 { return "Under par" }
        if round.holesCompleted == round.holes.count { return "Round complete · keep grinding" }
        return nil
    }

    private func heroStat(label: String, value: String, tint: Color) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(18))
                .foregroundColor(tint)
        }
    }

    private var heroDivider: some View {
        Rectangle().fill(Theme.line).frame(width: 1, height: 28)
    }

    // MARK: - Score distribution

    private var distributionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Score Distribution",
                         trailing: "\(hero.distribution.total) holes")

            HStack(alignment: .bottom, spacing: 6) {
                let m = hero.distMax
                distBar("EAGLE+", count: hero.distribution.eagleOrBetter, max: m, tint: Theme.accent)
                distBar("BIRDIE", count: hero.distribution.birdies, max: m, tint: Theme.accent.opacity(0.75))
                distBar("PAR", count: hero.distribution.pars, max: m, tint: Theme.ink)
                distBar("BOGEY", count: hero.distribution.bogeys, max: m, tint: Theme.warn.opacity(0.75))
                distBar("DOUBLE", count: hero.distribution.doubleBogeys, max: m, tint: Theme.warn)
                distBar("TRIPLE+", count: hero.distribution.tripleOrWorse, max: m, tint: Theme.bad)
            }
            .frame(height: 110)
        }
        .padding(16)
        .glassCard(padding: 0)
    }

    private func distBar(_ label: String, count: Int, max maxCount: Int, tint: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(Theme.statFont(14))
                .foregroundColor(count > 0 ? Theme.ink : Theme.ink3)

            // Bar
            GeometryReader { geo in
                let h = maxCount > 0 ? CGFloat(count) / CGFloat(maxCount) * geo.size.height : 0
                Rectangle()
                    .fill(count > 0 ? tint : Theme.surface3)
                    .frame(height: Swift.max(h, 2), alignment: .bottom)
                    .frame(maxHeight: .infinity, alignment: .bottom)
            }

            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Accuracy

    private var accuracyCard: some View {
        let stats = RoundStatistics(rounds: [round])

        return VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Accuracy")

            HStack(spacing: 12) {
                accuracyTile(
                    label: "GIR",
                    value: stats.girPercentage.map { "\(Int($0.rounded()))%" } ?? "–",
                    sub: "\(stats.girCount)/\(stats.holesWithGIRData)"
                )
                accuracyTile(
                    label: "FAIRWAYS",
                    value: stats.fairwayPercentage.map { "\(Int($0.rounded()))%" } ?? "–",
                    sub: "\(stats.fairwaysHit)/\(stats.holesWithFairwayData)"
                )
                accuracyTile(
                    label: "PUTT/HOLE",
                    value: stats.averagePuttsPerHole.map { String(format: "%.1f", $0) } ?? "–",
                    sub: "\(round.totalPutts) total"
                )
            }
        }
        .padding(16)
        .glassCard(padding: 0)
    }

    private func accuracyTile(label: String, value: String, sub: String) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(22))
                .foregroundColor(Theme.ink)
            Text(sub)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    // MARK: - Putting

    private var puttingCard: some View {
        let avgPutts = round.totalPutts > 0 ?
            Double(round.totalPutts) / Double(round.holesCompleted) : 0
        let onePutts = round.holes.filter { ($0.putts ?? 99) == 1 }.count
        let threePuttsPlus = round.holes.filter { ($0.putts ?? 0) >= 3 }.count

        return VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Putting")

            HStack(spacing: 12) {
                accuracyTile(
                    label: "AVG",
                    value: String(format: "%.2f", avgPutts),
                    sub: "per hole"
                )
                accuracyTile(label: "1-PUTTS", value: "\(onePutts)", sub: "holes")
                accuracyTile(label: "3+PUTTS", value: "\(threePuttsPlus)", sub: "holes")
            }
        }
        .padding(16)
        .glassCard(padding: 0)
    }

    // MARK: - Best / worst hole

    private var bestWorstCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Highlights")

            HStack(spacing: 12) {
                holeCallout(
                    label: hero.bestHole.map { "\(scoreLabel(for: $0)) · HOLE \($0.holeNumber)" } ?? "–",
                    sub: hero.bestHole.map { "Par \($0.par) · \($0.grossStrokes ?? 0) strokes" } ?? "",
                    tint: Theme.accent,
                    icon: "trophy.fill",
                    isBest: true
                )
                holeCallout(
                    label: hero.worstHole.map { "+\($0.scoreToPar ?? 0) · HOLE \($0.holeNumber)" } ?? "–",
                    sub: hero.worstHole.map { "Par \($0.par) · \($0.grossStrokes ?? 0) strokes" } ?? "",
                    tint: Theme.bad,
                    icon: "exclamationmark.triangle.fill",
                    isBest: false
                )
            }
        }
        .padding(16)
        .glassCard(padding: 0)
    }

    private func holeCallout(label: String, sub: String, tint: Color, icon: String, isBest: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .foregroundColor(tint)
                    .font(.system(size: 11))
                Text(isBest ? "BEST" : "TOUGHEST")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
            }
            Text(label)
                .font(Theme.statFont(13))
                .foregroundColor(tint)
            Text(sub)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func scoreLabel(for hole: RoundHole) -> String {
        guard let diff = hole.scoreToPar else { return "" }
        switch diff {
        case ...(-3): return "Albatross"
        case -2: return "Eagle"
        case -1: return "Birdie"
        case 0: return "Par"
        case 1: return "Bogey"
        case 2: return "Double"
        default: return "+\(diff)"
        }
    }

    // MARK: - Bottom actions

    private var bottomActions: some View {
        VStack(spacing: 10) {
            Button {
                shareImage = ScorecardImageRenderer.renderImage(for: round)
                if shareImage != nil {
                    showShare = true
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share scorecard")
                }
                .secondaryButton()
            }

            Button {
                onClose()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark")
                    Text("Done")
                }
                .primaryButton()
            }
        }
        .padding(.top, 4)
    }
}

// MARK: - Hero summary helper

private struct HeroSummary {
    let round: Round
    let distribution: ScoreDistribution

    init(round: Round) {
        self.round = round
        self.distribution = RoundStatistics(rounds: [round]).scoreDistribution
    }

    var distMax: Int {
        max(
            distribution.eagleOrBetter,
            distribution.birdies,
            distribution.pars,
            distribution.bogeys,
            distribution.doubleBogeys,
            distribution.tripleOrWorse,
            1
        )
    }

    var bestHole: RoundHole? {
        round.holes
            .filter { $0.grossStrokes != nil }
            .min { ($0.scoreToPar ?? 99) < ($1.scoreToPar ?? 99) }
    }

    var worstHole: RoundHole? {
        round.holes
            .filter { $0.grossStrokes != nil }
            .max { ($0.scoreToPar ?? -99) < ($1.scoreToPar ?? -99) }
    }
}

#Preview {
    NavigationStack {
        RoundSummaryView(round: DemoData.sampleRound(player: Player.defaultPlayer))
            .environmentObject(PersistenceManager())
    }
}
