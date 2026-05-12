//
//  SwingTrendStrip.swift
//  StrikeLabCaddie
//
//  Last swings for this club — ink trail + lime highlight when the swing
//  grade sits in a solid band. Italic drift sentence from tempo change.
//

import SwiftUI

struct SwingTrendStrip: View {
    let current: EnhancedShotEvent
    let baseline: [EnhancedShotEvent]
    var armLengthMeters: Double = 0.70
    var referenceSwing: EnhancedShotEvent? = nil
    /// Personal window for the club — drives grading consistency.
    var personalWindow: PersonalWindow

    var body: some View {
        let entries = computeEntries()
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("DRIFT · last swings")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
            }

            if let drift = tempoDriftSentence(from: entries) {
                Text(drift)
                    .font(Theme.bodyFont(13).italic())
                    .foregroundColor(Theme.ink2)
            }

            if entries.count < 2 {
                Text("Hit a few more swings with this club to see a trend.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                    .padding(.vertical, 12)
            } else {
                strip(entries: entries)
                meanLine(entries: entries)
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func strip(entries: [Entry]) -> some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let stepX = entries.count <= 1 ? 0 : w / CGFloat(entries.count - 1)
            let refScore = referenceScore()

            ZStack(alignment: .topLeading) {
                let yBandLo = h * (1 - 72.0 / 100.0)
                Path { p in
                    p.move(to: CGPoint(x: 0, y: yBandLo))
                    p.addLine(to: CGPoint(x: w, y: yBandLo))
                }
                .stroke(Theme.accent.opacity(0.25), style: StrokeStyle(lineWidth: 6, lineCap: .round))

                if let r = refScore {
                    let y = h * (1 - CGFloat(r) / 100.0)
                    Path { p in
                        p.move(to: CGPoint(x: 0, y: y))
                        p.addLine(to: CGPoint(x: w, y: y))
                    }
                    .stroke(Theme.ink3.opacity(0.6), style: StrokeStyle(lineWidth: 1, dash: [5, 3]))
                }

                Path { p in
                    for (i, e) in entries.enumerated() {
                        let x = CGFloat(i) * stepX
                        let y = h * (1 - CGFloat(e.score) / 100.0)
                        if i == 0 { p.move(to: CGPoint(x: x, y: y)) }
                        else { p.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(Theme.ink3, lineWidth: 1)

                ForEach(Array(entries.enumerated()), id: \.element.id) { i, e in
                    let x = CGFloat(i) * stepX
                    let y = h * (1 - CGFloat(e.score) / 100.0)
                    let isCurrent = e.id == current.id
                    Circle()
                        .fill(e.inBand ? Theme.accent : Theme.ink2.opacity(0.55))
                        .frame(width: isCurrent ? 10 : 6, height: isCurrent ? 10 : 6)
                        .overlay(
                            Circle()
                                .stroke(isCurrent ? Theme.ink : Color.clear, lineWidth: 2)
                        )
                        .position(x: x, y: y)
                }
            }
        }
        .frame(height: 60)
    }

    private func meanLine(entries: [Entry]) -> some View {
        let scores = entries.map(\.score)
        let mean = scores.reduce(0, +) / scores.count
        return HStack {
            Text("session avg")
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
            Spacer()
            Text("\(mean)/100 over \(entries.count) swings")
                .font(Theme.statFont(13))
                .foregroundColor(Theme.ink)
        }
    }

    private struct Entry: Identifiable {
        let id: UUID
        let score: Int
        let inBand: Bool
        let tempoRatio: Double?
    }

    private func computeEntries() -> [Entry] {
        let club = current.club
        let cutoff = current.timestamp.addingTimeInterval(-4 * 60 * 60)
        let pool = baseline.filter { ev in
            guard let c = ev.club else { return false }
            return c == club && ev.timestamp >= cutoff
        } + [current]

        var seen: Set<UUID> = []
        var unique: [EnhancedShotEvent] = []
        for ev in pool where !seen.contains(ev.id) {
            seen.insert(ev.id)
            unique.append(ev)
        }
        unique.sort(by: { $0.timestamp < $1.timestamp })
        let recent = Array(unique.suffix(8))

        return recent.compactMap { ev -> Entry? in
            guard let m = ev.motionData, let c = ev.club else { return nil }
            let summary = SwingAnalytics.summary(
                for: m, club: c, hr: ev.heartRateData,
                armLengthMeters: armLengthMeters
            )
            let grade = SwingGrade.compute(
                summary: summary,
                referencePlane: personalWindow.referenceAxis,
                personalWindow: personalWindow
            )
            let ratio = summary.tempo.ratio
            let inBand = grade.value >= 72
            return Entry(id: ev.id, score: grade.value, inBand: inBand, tempoRatio: ratio)
        }
    }

    private func referenceScore() -> Int? {
        guard let ref = referenceSwing,
              let m = ref.motionData,
              let c = ref.club else { return nil }
        let summary = SwingAnalytics.summary(
            for: m, club: c, hr: ref.heartRateData,
            armLengthMeters: armLengthMeters
        )
        return SwingGrade.compute(
            summary: summary,
            referencePlane: personalWindow.referenceAxis,
            personalWindow: personalWindow
        ).value
    }

    private func tempoDriftSentence(from entries: [Entry]) -> String? {
        let ratios = entries.compactMap(\.tempoRatio)
        guard ratios.count >= 4 else { return nil }
        let mid = ratios.count / 2
        let a = ratios.prefix(mid).reduce(0, +) / Double(max(1, mid))
        let b = ratios.suffix(ratios.count - mid).reduce(0, +) / Double(max(1, ratios.count - mid))
        let d = b - a
        guard abs(d) >= 0.08 else { return nil }
        if d > 0 {
            return String(format: "Tempo trending quick by %.2f.", d)
        }
        return String(format: "Tempo trending slow by %.2f.", abs(d))
    }
}
