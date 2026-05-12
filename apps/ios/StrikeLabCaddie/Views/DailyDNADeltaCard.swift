//
//  DailyDNADeltaCard.swift
//  StrikeLabCaddie
//
//  Phase 5 — surfaces a one-line diagnosis comparing today's swings
//  against the player's rolling 30-day baseline. Intended for the HQ
//  dashboard ("Today your tempo's 8% faster than your 30-day baseline.
//  You're rushing.") but reusable on any iOS surface.
//

import SwiftUI

struct DailyDNADeltaCard: View {
    let recent: [EnhancedShotEvent]
    var armLengthMeters: Double = 0.70

    var body: some View {
        let analysis = compute()
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("DNA · TODAY")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.accent)
                Spacer()
                if let n = analysis.todayCount {
                    Text("\(n) swings today")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
            }
            Text(analysis.headline)
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.ink)
            if !analysis.metricLines.isEmpty {
                VStack(spacing: 0) {
                    ForEach(analysis.metricLines.indices, id: \.self) { i in
                        let line = analysis.metricLines[i]
                        HStack {
                            Text(line.label)
                                .font(Theme.labelFont(10))
                                .tracking(1.0)
                                .foregroundColor(Theme.ink3)
                            Spacer()
                            Text(line.text)
                                .font(Theme.statFont(13))
                                .foregroundColor(line.tint)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        if i < analysis.metricLines.count - 1 {
                            Rectangle().fill(Theme.line).frame(height: 1)
                        }
                    }
                }
                .background(Theme.surface2)
                .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    // MARK: - Compute

    private struct Analysis {
        var headline: String
        var metricLines: [MetricLine]
        var todayCount: Int?
    }

    private struct MetricLine {
        let label: String
        let text: String
        let tint: Color
    }

    private func compute() -> Analysis {
        let cal = Calendar.current
        let now = Date()
        let dayStart = cal.startOfDay(for: now)
        let baselineCutoff = cal.date(byAdding: .day, value: -30, to: dayStart) ?? dayStart

        let today = recent.filter { $0.timestamp >= dayStart }
        let baseline = recent.filter {
            $0.timestamp >= baselineCutoff && $0.timestamp < dayStart
        }
        guard today.count >= 3, baseline.count >= 5 else {
            return Analysis(
                headline: "Need a few more swings to compare against your 30-day baseline.",
                metricLines: [],
                todayCount: today.isEmpty ? nil : today.count
            )
        }

        func tempos(_ events: [EnhancedShotEvent]) -> [Double] {
            events.compactMap { $0.motionData }.compactMap { SwingAnalytics.tempo($0).ratio }
        }
        func handSpeeds(_ events: [EnhancedShotEvent]) -> [Double] {
            events.compactMap { ev -> Double? in
                guard let m = ev.motionData, let c = ev.club else { return nil }
                return SwingAnalytics.speeds(m, club: c, armLengthMeters: armLengthMeters)
                    .handSpeedMph
            }
        }
        func mean(_ xs: [Double]) -> Double {
            xs.isEmpty ? 0 : xs.reduce(0, +) / Double(xs.count)
        }
        let bT = mean(tempos(baseline))
        let tT = mean(tempos(today))
        let bH = mean(handSpeeds(baseline))
        let tH = mean(handSpeeds(today))

        let tempoDeltaPct = bT == 0 ? 0 : (tT - bT) / bT * 100
        let handDeltaPct = bH == 0 ? 0 : (tH - bH) / bH * 100

        let headline: String = {
            if abs(tempoDeltaPct) >= 5 {
                if tempoDeltaPct < 0 {
                    return String(format: "Today your tempo's %.0f%% faster than your 30-day baseline. You're rushing.", abs(tempoDeltaPct))
                } else {
                    return String(format: "Today your tempo's %.0f%% slower than your 30-day baseline. Patient backswing.", abs(tempoDeltaPct))
                }
            }
            if abs(handDeltaPct) >= 4 {
                if handDeltaPct > 0 {
                    return String(format: "Hand speed is %.0f%% above your 30-day baseline today. Keep it.", abs(handDeltaPct))
                } else {
                    return String(format: "Hand speed is %.0f%% below your 30-day baseline today. Tired arms?", abs(handDeltaPct))
                }
            }
            return "Today's swing matches your 30-day baseline. Steady."
        }()

        let metricLines: [MetricLine] = [
            MetricLine(
                label: "Tempo ratio",
                text: String(format: "%.1f → %.1f (%@%.0f%%)",
                             bT, tT, tempoDeltaPct >= 0 ? "+" : "", tempoDeltaPct),
                tint: abs(tempoDeltaPct) < 5 ? Theme.ink2 :
                      (tempoDeltaPct < 0 ? Theme.bad : Theme.warn)
            ),
            MetricLine(
                label: "Hand speed (mph)",
                text: String(format: "%.0f → %.0f (%@%.0f%%)",
                             bH, tH, handDeltaPct >= 0 ? "+" : "", handDeltaPct),
                tint: abs(handDeltaPct) < 4 ? Theme.ink2 :
                      (handDeltaPct < 0 ? Theme.bad : Theme.accent)
            )
        ]

        return Analysis(
            headline: headline,
            metricLines: metricLines,
            todayCount: today.count
        )
    }
}
