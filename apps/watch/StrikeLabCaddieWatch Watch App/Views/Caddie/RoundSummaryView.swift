import SwiftUI

struct RoundSummaryView: View {
    var courseName: String
    var holesPlayed: Int
    var totalGross: Int
    var totalPar: Int
    var girPercent: Int
    var firPercent: Int
    var puttsAvg: Double
    var onNextHole: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("ROUND")
                .font(SLW.mono(9))
                .tracking(1.6)
                .foregroundColor(SLW.ink3)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                let diff = totalGross - totalPar
                Text("\(diff > 0 ? "+" : "")\(diff)")
                    .font(SLW.num(36))
                    .foregroundColor(diff < 0 ? SLW.accent : (diff > 0 ? SLW.warn : SLW.ink))
                Text("vs PAR")
                    .font(SLW.mono(9))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
            }

            Text(courseName)
                .font(SLW.display(13))
                .foregroundColor(SLW.ink)

            // 9-hole ribbon (compact)
            HStack(spacing: 2) {
                ForEach(1...min(9, holesPlayed), id: \.self) { _ in
                    Rectangle().fill(SLW.accent).frame(width: 10, height: 4)
                }
                ForEach(min(9, holesPlayed)..<9, id: \.self) { _ in
                    Rectangle().fill(SLW.bg2).frame(width: 10, height: 4)
                }
            }

            HStack(spacing: 6) {
                StatCell(label: "GIR", value: "\(girPercent)%")
                StatCell(label: "FIR", value: "\(firPercent)%")
                StatCell(label: "PUTT", value: String(format: "%.1f", puttsAvg))
            }

            Button(action: onNextHole) {
                Text("HOLE \(holesPlayed + 1) \u{2192}")
                    .font(SLW.mono(10, weight: .semibold))
                    .tracking(1.8)
                    .foregroundColor(SLW.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 28)
            }
            .background(SLW.accent)
            .buttonStyle(.plain)
        }
        .padding(8)
        .background(SLW.bg)
    }

    private struct StatCell: View {
        var label: String
        var value: String
        var body: some View {
            VStack(spacing: 1) {
                Text(label)
                    .font(SLW.mono(7))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
                Text(value)
                    .font(SLW.num(12))
                    .foregroundColor(SLW.ink2)
            }
            .frame(maxWidth: .infinity)
            .padding(4)
            .background(SLW.surface)
            .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
    }
}
