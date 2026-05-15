//
//  StatisticsView.swift
//  StrikeLabCaddie
//
//  Statistics dashboard for golf performance
//

import SwiftUI
import Charts

struct StatisticsView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var unitsManager: UnitsManager
    
    private var stats: RoundStatistics {
        RoundStatistics(rounds: persistenceManager.savedRounds)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if persistenceManager.savedRounds.isEmpty {
                    emptyStateView
                } else {
                    // Overview cards
                    overviewSection

                    // Strokes gained — the single most useful pro metric.
                    strokesGainedSection

                    // Score distribution
                    if stats.scoreDistribution.total > 0 {
                        scoreDistributionSection
                    }
                    
                    // Par averages
                    parAveragesSection
                    
                    // GIR & Fairways
                    accuracySection
                    
                    // Putting
                    puttingSection
                    
                    // Club distances
                    if !stats.clubDistanceStats.isEmpty {
                        clubDistanceSection
                    }
                    
                    // Recent trend
                    if stats.recentScores.count >= 2 {
                        trendSection
                    }
                }
                
                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Statistics")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Strokes Gained

    private var strokesGainedSection: some View {
        let calc = StrokesGainedCalculator(rounds: persistenceManager.savedRounds, benchmark: .bogey)
        let categories: [StrokesGainedResult] = [
            calc.offTheTee,
            calc.approach,
            calc.aroundTheGreen,
            calc.putting
        ]
        let total = calc.total
        let extent = max(
            categories.map { abs($0.value) }.max() ?? 1,
            abs(total.value),
            1
        )

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                SectionLabel(text: "Strokes Gained", trailing: "vs bogey golfer")
            }

            // Total at the top — large and signed.
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(total.formattedValue)
                    .font(Theme.statFont(32))
                    .foregroundColor(sgColor(total.value))
                Text("TOTAL")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text("\(total.shotCount) shots")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            // Per-category bars (centred on zero, lime to the right, bad to the left)
            ForEach(categories) { result in
                sgRow(result: result, extent: extent)
            }
        }
        .padding(12)
        .glassCard(padding: 0)
    }

    private func sgRow(result: StrokesGainedResult, extent: Double) -> some View {
        let frac = abs(result.value) / extent
        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: result.category.icon)
                    .font(.system(size: 11))
                    .foregroundColor(sgColor(result.value))
                Text(result.category.rawValue.uppercased())
                    .font(Theme.labelFont(11))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(result.formattedValue)
                    .font(Theme.statFont(15))
                    .foregroundColor(sgColor(result.value))
            }
            // Centred bar — left of midline = losing, right = gaining.
            GeometryReader { geo in
                let half = geo.size.width / 2
                let barW = half * CGFloat(frac)
                ZStack(alignment: .leading) {
                    // Track
                    Rectangle().fill(Theme.surface3).frame(height: 6)
                    // Centre tick
                    Rectangle()
                        .fill(Theme.ink3.opacity(0.4))
                        .frame(width: 1, height: 10)
                        .offset(x: half - 0.5)
                    // Filled portion
                    if result.value >= 0 {
                        Rectangle()
                            .fill(Theme.accent)
                            .frame(width: barW, height: 6)
                            .offset(x: half)
                    } else {
                        Rectangle()
                            .fill(Theme.bad)
                            .frame(width: barW, height: 6)
                            .offset(x: half - barW)
                    }
                }
            }
            .frame(height: 10)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func sgColor(_ value: Double) -> Color {
        if value > 0.05 { return Theme.accent }
        if value < -0.05 { return Theme.bad }
        return Theme.ink2
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.bar.fill")
                .font(.system(size: 48))
                .foregroundColor(Theme.nordicForest.opacity(0.3))
            
            Text("No Statistics Yet")
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.nordicForest)
            
            Text("Complete rounds to see your performance stats")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - Overview Section
    
    private var overviewSection: some View {
        VStack(spacing: 12) {
            HStack {
                Text("OVERVIEW")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Spacer()
            }
            
            HStack(spacing: 12) {
                // Rounds played
                statCard(
                    title: "Rounds",
                    value: "\(stats.roundCount)",
                    subtitle: "\(stats.completedRoundCount) complete"
                )
                
                // Average score
                statCard(
                    title: "Avg Score",
                    value: stats.averageGrossScore.map { String(format: "%.1f", $0) } ?? "–",
                    subtitle: "gross"
                )
                
                // Best round
                statCard(
                    title: "Best",
                    value: stats.bestGrossScore.map { "\($0)" } ?? "–",
                    subtitle: "gross",
                    valueColor: Theme.nordicSage
                )
            }
        }
    }
    
    private func statCard(title: String, value: String, subtitle: String, valueColor: Color = Theme.nordicForest) -> some View {
        VStack(spacing: 4) {
            Text(title.uppercased())
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
            
            Text(value)
                .font(Theme.statFont(24))
                .foregroundColor(valueColor)
            
            Text(subtitle)
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 8)
    }
    
    // MARK: - Score Distribution
    
    private var scoreDistributionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("SCORE DISTRIBUTION")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            let dist = stats.scoreDistribution
            
            VStack(spacing: 8) {
                distributionRow(label: "Eagle+", count: dist.eagleOrBetter, total: dist.total, color: Theme.neuralCyan)
                distributionRow(label: "Birdie", count: dist.birdies, total: dist.total, color: Theme.nordicSage)
                distributionRow(label: "Par", count: dist.pars, total: dist.total, color: Theme.nordicForest)
                distributionRow(label: "Bogey", count: dist.bogeys, total: dist.total, color: Theme.champagne)
                distributionRow(label: "Double", count: dist.doubleBogeys, total: dist.total, color: Theme.overPar.opacity(0.7))
                distributionRow(label: "Triple+", count: dist.tripleOrWorse, total: dist.total, color: Theme.overPar)
            }
            .padding()
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
        }
    }
    
    private func distributionRow(label: String, count: Int, total: Int, color: Color) -> some View {
        let percentage = total > 0 ? Double(count) / Double(total) : 0
        
        return HStack(spacing: 12) {
            Text(label)
                .font(Theme.labelFont(14))
                .foregroundColor(Theme.nordicForest)
                .frame(width: 60, alignment: .leading)
            
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Theme.nordicForest.opacity(0.1))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: max(0, geo.size.width * percentage))
                }
            }
            .frame(height: 20)
            
            Text("\(count)")
                .font(Theme.statFont(14))
                .foregroundColor(Theme.nordicForest)
                .frame(width: 40, alignment: .trailing)
        }
    }
    
    // MARK: - Par Averages
    
    private var parAveragesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PAR AVERAGES")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            HStack(spacing: 12) {
                parAverageCard(par: 3, average: stats.averagePar3Score)
                parAverageCard(par: 4, average: stats.averagePar4Score)
                parAverageCard(par: 5, average: stats.averagePar5Score)
            }
        }
    }
    
    private func parAverageCard(par: Int, average: Double?) -> some View {
        let diff = average.map { $0 - Double(par) }
        let color: Color = {
            guard let d = diff else { return Theme.neutral }
            if d < 0 { return Theme.nordicSage }
            if d == 0 { return Theme.nordicForest }
            return Theme.overPar
        }()
        
        return VStack(spacing: 4) {
            Text("PAR \(par)")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
            
            Text(average.map { String(format: "%.2f", $0) } ?? "–")
                .font(Theme.statFont(20))
                .foregroundColor(color)
            
            if let d = diff {
                Text(d >= 0 ? "+\(String(format: "%.2f", d))" : String(format: "%.2f", d))
                    .font(Theme.labelFont(11))
                    .foregroundColor(color.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 8)
    }
    
    // MARK: - Accuracy Section
    
    private var accuracySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ACCURACY")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            HStack(spacing: 12) {
                // GIR
                VStack(spacing: 8) {
                    Text("GIR")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                    
                    if let gir = stats.girPercentage {
                        Text(String(format: "%.0f%%", gir))
                            .font(Theme.statFont(28))
                            .foregroundColor(gir >= 50 ? Theme.nordicSage : Theme.nordicForest)
                    } else {
                        Text("–")
                            .font(Theme.statFont(28))
                            .foregroundColor(Theme.neutral)
                    }
                    
                    Text("\(stats.girCount)/\(stats.holesWithGIRData) greens")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 8)
                
                // Fairways
                VStack(spacing: 8) {
                    Text("FAIRWAYS")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                    
                    if let fwy = stats.fairwayPercentage {
                        Text(String(format: "%.0f%%", fwy))
                            .font(Theme.statFont(28))
                            .foregroundColor(fwy >= 50 ? Theme.nordicSage : Theme.nordicForest)
                    } else {
                        Text("–")
                            .font(Theme.statFont(28))
                            .foregroundColor(Theme.neutral)
                    }
                    
                    Text("\(stats.fairwaysHit)/\(stats.holesWithFairwayData) hit")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 8)
            }
            
            if stats.holesWithGIRData == 0 && stats.holesWithFairwayData == 0 {
                Text("Track GIR and fairways in hole details to see accuracy stats")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 4)
            }
        }
    }
    
    // MARK: - Putting Section
    
    private var puttingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PUTTING")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            HStack(spacing: 12) {
                VStack(spacing: 4) {
                    Text("AVG/ROUND")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                    
                    Text(stats.averagePuttsPerRound.map { String(format: "%.1f", $0) } ?? "–")
                        .font(Theme.statFont(24))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text("putts")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.4))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 8)
                
                VStack(spacing: 4) {
                    Text("AVG/HOLE")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                    
                    Text(stats.averagePuttsPerHole.map { String(format: "%.2f", $0) } ?? "–")
                        .font(Theme.statFont(24))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text("putts")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.nordicForest.opacity(0.4))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 8)
            }
        }
    }
    
    // MARK: - Club Distance Section
    
    private var clubDistanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("CLUB DISTANCES")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            ForEach(stats.clubDistanceStats) { stat in
                clubDistanceRow(stat)
            }
            
            if stats.shotsWithDistance.isEmpty {
                Text("Track shots to see your club distances")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 4)
            }
        }
    }
    
    private func clubDistanceRow(_ stat: ClubDistanceStat) -> some View {
        HStack(spacing: 12) {
            // Club icon and name
            ZStack {
                Circle()
                    .fill(clubColor(for: stat.club.group).opacity(0.2))
                    .frame(width: 36, height: 36)
                
                Image(systemName: stat.club.group.iconName)
                    .font(.system(size: 14))
                    .foregroundColor(clubColor(for: stat.club.group))
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(stat.club.shortName)
                    .font(Theme.statFont(16))
                    .foregroundColor(Theme.nordicForest)
                
                Text("\(stat.shotCount) shots")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
            }
            
            Spacer()
            
            // Distances
            VStack(alignment: .trailing, spacing: 2) {
                Text(unitsManager.format(yards: stat.averageDistance))
                    .font(Theme.statFont(18))
                    .foregroundColor(Theme.nordicForest)
                
                Text("max \(unitsManager.format(yards: stat.longestDistance))")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.neuralCyan)
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
    
    private func clubColor(for group: ClubGroup) -> Color {
        switch group {
        case .driver: return Theme.neuralCyan
        case .wood, .hybrid: return Theme.champagne
        case .iron: return Theme.nordicForest
        case .wedge: return Theme.nordicSage
        case .putt: return Theme.neutral
        }
    }
    
    // MARK: - Trend Section
    
    private var trendSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("RECENT TREND")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Spacer()
                
                HStack(spacing: 4) {
                    Image(systemName: stats.scoreTrend.icon)
                        .font(.system(size: 12))
                    Text(stats.scoreTrend.label)
                        .font(Theme.labelFont(12))
                }
                .foregroundColor(stats.scoreTrend == .improving ? Theme.nordicSage : 
                                stats.scoreTrend == .declining ? Theme.overPar : Theme.neutral)
            }
            
            // Simple score trend chart
            if !stats.recentScores.isEmpty {
                Chart {
                    ForEach(Array(stats.recentScores.reversed().enumerated()), id: \.offset) { index, score in
                        LineMark(
                            x: .value("Round", index + 1),
                            y: .value("Score", score)
                        )
                        .foregroundStyle(Theme.nordicForest)
                        
                        PointMark(
                            x: .value("Round", index + 1),
                            y: .value("Score", score)
                        )
                        .foregroundStyle(Theme.neuralCyan)
                    }
                }
                .chartYScale(domain: (stats.recentScores.min() ?? 70) - 5 ... (stats.recentScores.max() ?? 100) + 5)
                .chartXAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel()
                    }
                }
                .frame(height: 150)
                .padding()
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
            }
        }
    }
}

#Preview {
    NavigationStack {
        StatisticsView()
            .environmentObject(PersistenceManager())
    }
}
