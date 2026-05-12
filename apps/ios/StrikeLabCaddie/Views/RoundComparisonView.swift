//
//  RoundComparisonView.swift
//  StrikeLabCaddie
//
//  Side-by-side round comparison view
//

import SwiftUI
import Charts

struct RoundComparisonView: View {
    let round1: Round
    let round2: Round
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with round info
                headerSection
                
                // Score comparison
                scoreComparisonSection
                
                // Stats comparison
                statsComparisonSection
                
                // Hole-by-hole chart
                holeByHoleChart
                
                // Hole-by-hole detail
                holeDetailSection
                
                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Compare Rounds")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        HStack(spacing: 16) {
            // Round 1
            VStack(spacing: 4) {
                Text(round1.course.name)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.nordicForest)
                    .lineLimit(1)
                
                Text(dateString(round1.date))
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Circle()
                    .fill(Theme.neuralCyan)
                    .frame(width: 12, height: 12)
            }
            .frame(maxWidth: .infinity)
            
            // VS
            Text("vs")
                .font(Theme.labelFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
            
            // Round 2
            VStack(spacing: 4) {
                Text(round2.course.name)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.nordicForest)
                    .lineLimit(1)
                
                Text(dateString(round2.date))
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Circle()
                    .fill(Theme.nordicSage)
                    .frame(width: 12, height: 12)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    // MARK: - Score Comparison
    
    private var scoreComparisonSection: some View {
        VStack(spacing: 12) {
            Text("SCORE")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 0) {
                // Round 1 score
                VStack(spacing: 4) {
                    Text("\(round1.grossTotal)")
                        .font(Theme.statFont(40))
                        .foregroundColor(Theme.neuralCyan)
                    
                    Text(round1.formattedOverUnder)
                        .font(Theme.labelFont(14))
                        .foregroundColor(scoreColor(round1.grossOverUnder))
                }
                .frame(maxWidth: .infinity)
                
                // Difference
                VStack(spacing: 4) {
                    let diff = round1.grossTotal - round2.grossTotal
                    
                    Image(systemName: diff < 0 ? "arrow.down" : (diff > 0 ? "arrow.up" : "equal"))
                        .font(.system(size: 20))
                        .foregroundColor(diff < 0 ? Theme.nordicSage : (diff > 0 ? Theme.overPar : Theme.neutral))
                    
                    Text(diff == 0 ? "Same" : "\(abs(diff)) strokes")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                }
                .frame(width: 80)
                
                // Round 2 score
                VStack(spacing: 4) {
                    Text("\(round2.grossTotal)")
                        .font(Theme.statFont(40))
                        .foregroundColor(Theme.nordicSage)
                    
                    Text(round2.formattedOverUnder)
                        .font(Theme.labelFont(14))
                        .foregroundColor(scoreColor(round2.grossOverUnder))
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
            .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
        }
    }
    
    // MARK: - Stats Comparison
    
    private var statsComparisonSection: some View {
        VStack(spacing: 12) {
            Text("STATISTICS")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 8) {
                // Putts
                statComparisonRow(
                    label: "Total Putts",
                    value1: round1.totalPutts,
                    value2: round2.totalPutts,
                    lowerIsBetter: true
                )
                
                Divider()
                
                // GIR
                statComparisonRow(
                    label: "Greens in Reg",
                    value1: girCount(round1),
                    value2: girCount(round2),
                    lowerIsBetter: false
                )
                
                Divider()
                
                // Fairways
                statComparisonRow(
                    label: "Fairways Hit",
                    value1: fairwayCount(round1),
                    value2: fairwayCount(round2),
                    lowerIsBetter: false
                )
                
                Divider()
                
                // Front 9
                statComparisonRow(
                    label: "Front 9",
                    value1: round1.front9Gross,
                    value2: round2.front9Gross,
                    lowerIsBetter: true
                )
                
                Divider()
                
                // Back 9
                statComparisonRow(
                    label: "Back 9",
                    value1: round1.back9Gross,
                    value2: round2.back9Gross,
                    lowerIsBetter: true
                )
            }
            .padding()
            .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
        }
    }
    
    private func statComparisonRow(label: String, value1: Int, value2: Int, lowerIsBetter: Bool) -> some View {
        HStack {
            // Value 1
            Text("\(value1)")
                .font(Theme.statFont(18))
                .foregroundColor(betterColor(value1, value2, lowerIsBetter: lowerIsBetter, isFirst: true))
                .frame(width: 50)
            
            Spacer()
            
            // Label
            Text(label)
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest)
            
            Spacer()
            
            // Value 2
            Text("\(value2)")
                .font(Theme.statFont(18))
                .foregroundColor(betterColor(value1, value2, lowerIsBetter: lowerIsBetter, isFirst: false))
                .frame(width: 50)
        }
    }
    
    // MARK: - Hole-by-Hole Chart
    
    private var holeByHoleChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("HOLE-BY-HOLE")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            Chart {
                ForEach(1...18, id: \.self) { hole in
                    if let score1 = round1.holes.first(where: { $0.holeNumber == hole })?.grossStrokes,
                       let score2 = round2.holes.first(where: { $0.holeNumber == hole })?.grossStrokes {
                        
                        // Round 1 line
                        LineMark(
                            x: .value("Hole", hole),
                            y: .value("Score", score1),
                            series: .value("Round", "Round 1")
                        )
                        .foregroundStyle(Theme.neuralCyan)
                        
                        PointMark(
                            x: .value("Hole", hole),
                            y: .value("Score", score1)
                        )
                        .foregroundStyle(Theme.neuralCyan)
                        
                        // Round 2 line
                        LineMark(
                            x: .value("Hole", hole),
                            y: .value("Score", score2),
                            series: .value("Round", "Round 2")
                        )
                        .foregroundStyle(Theme.nordicSage)
                        
                        PointMark(
                            x: .value("Hole", hole),
                            y: .value("Score", score2)
                        )
                        .foregroundStyle(Theme.nordicSage)
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 3)) { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let hole = value.as(Int.self) {
                            Text("\(hole)")
                                .font(.system(size: 10))
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
            .frame(height: 200)
            .padding()
            .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
        }
    }
    
    // MARK: - Hole Detail Section
    
    private var holeDetailSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("HOLE COMPARISON")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            // Headers
            HStack {
                Text("Hole")
                    .font(Theme.labelFont(10))
                    .frame(width: 40)
                Text("Par")
                    .font(Theme.labelFont(10))
                    .frame(width: 30)
                Spacer()
                Circle()
                    .fill(Theme.neuralCyan)
                    .frame(width: 8, height: 8)
                Text("R1")
                    .font(Theme.labelFont(10))
                    .frame(width: 30)
                Circle()
                    .fill(Theme.nordicSage)
                    .frame(width: 8, height: 8)
                Text("R2")
                    .font(Theme.labelFont(10))
                    .frame(width: 30)
                Text("Diff")
                    .font(Theme.labelFont(10))
                    .frame(width: 40)
            }
            .foregroundColor(Theme.nordicForest.opacity(0.5))
            .padding(.horizontal)
            
            ForEach(1...18, id: \.self) { hole in
                holeComparisonRow(hole: hole)
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    private func holeComparisonRow(hole: Int) -> some View {
        let hole1 = round1.holes.first(where: { $0.holeNumber == hole })
        let hole2 = round2.holes.first(where: { $0.holeNumber == hole })
        let score1 = hole1?.grossStrokes ?? 0
        let score2 = hole2?.grossStrokes ?? 0
        let par = hole1?.par ?? hole2?.par ?? 4
        let diff = score1 - score2
        
        return HStack {
            Text("\(hole)")
                .font(Theme.statFont(14))
                .foregroundColor(Theme.nordicForest)
                .frame(width: 40)
            
            Text("\(par)")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
                .frame(width: 30)
            
            Spacer()
            
            // Round 1 score
            Text(score1 > 0 ? "\(score1)" : "-")
                .font(Theme.statFont(14))
                .foregroundColor(holeScoreColor(score1, par: par))
                .frame(width: 40)
            
            // Round 2 score
            Text(score2 > 0 ? "\(score2)" : "-")
                .font(Theme.statFont(14))
                .foregroundColor(holeScoreColor(score2, par: par))
                .frame(width: 40)
            
            // Difference
            if score1 > 0 && score2 > 0 {
                Text(diff == 0 ? "=" : (diff > 0 ? "+\(diff)" : "\(diff)"))
                    .font(Theme.labelFont(12))
                    .foregroundColor(diff < 0 ? Theme.nordicSage : (diff > 0 ? Theme.overPar : Theme.neutral))
                    .frame(width: 40)
            } else {
                Text("-")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.neutral)
                    .frame(width: 40)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
        .background(hole % 2 == 0 ? Color.clear : Theme.nordicForest.opacity(0.03))
    }
    
    // MARK: - Helpers
    
    private func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    private func scoreColor(_ score: Int) -> Color {
        if score < 0 { return Theme.nordicSage }
        if score > 0 { return Theme.overPar }
        return Theme.nordicForest
    }
    
    private func holeScoreColor(_ score: Int, par: Int) -> Color {
        let diff = score - par
        if diff <= -2 { return Theme.neuralCyan }
        if diff == -1 { return Theme.nordicSage }
        if diff == 0 { return Theme.nordicForest }
        if diff == 1 { return Theme.champagne }
        return Theme.overPar
    }
    
    private func betterColor(_ v1: Int, _ v2: Int, lowerIsBetter: Bool, isFirst: Bool) -> Color {
        if v1 == v2 { return Theme.nordicForest }
        
        let firstIsBetter = lowerIsBetter ? (v1 < v2) : (v1 > v2)
        
        if isFirst {
            return firstIsBetter ? Theme.nordicSage : Theme.overPar
        } else {
            return firstIsBetter ? Theme.overPar : Theme.nordicSage
        }
    }
    
    private func girCount(_ round: Round) -> Int {
        round.holes.filter { $0.greenInRegulation == true }.count
    }
    
    private func fairwayCount(_ round: Round) -> Int {
        round.holes.filter { $0.fairwayHit == true }.count
    }
}

#Preview {
    NavigationStack {
        RoundComparisonView(
            round1: Round(
                course: CourseData.sampleCourse,
                selectedTee: nil,
                player: Player.defaultPlayer
            ),
            round2: Round(
                course: CourseData.sampleCourse,
                selectedTee: nil,
                player: Player.defaultPlayer
            )
        )
    }
}
