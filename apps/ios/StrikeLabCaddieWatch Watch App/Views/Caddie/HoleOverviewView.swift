import SwiftUI

/// Hole Overview — pin distance hero, F/B yardages, coach ribbon, Log Shot CTA.
struct HoleOverviewView: View {
    var holeNumber: Int
    var par: Int
    /// Canonical yard-distances. Display unit is decided at render time
    /// from the user's preference in `WatchConnectivityManagerWatch`.
    var pinYards: Int
    var frontYards: Int
    var backYards: Int
    var suggestedClub: String
    var coachLine: String
    var onLogShot: () -> Void
    var units: WatchUnitsSystem = .yards

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("HOLE \(holeNumber)")
                    .font(SLW.mono(9))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
                Spacer()
                Text("PAR \(par)")
                    .font(SLW.mono(9))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
            }

            // Pin distance hero
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(units.formatNumber(yards: Double(pinYards)))
                    .font(SLW.num(48))
                    .foregroundColor(SLW.ink)
                Text(units.caps)
                    .font(SLW.mono(9))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
            }

            // Front / back
            HStack(spacing: 8) {
                Yardage(label: "F", yards: frontYards, units: units)
                Yardage(label: "B", yards: backYards, units: units)
            }

            // Coach ribbon
            HStack(spacing: 6) {
                Text(suggestedClub.uppercased())
                    .font(SLW.mono(10, weight: .semibold))
                    .foregroundColor(SLW.accent)
                Text(coachLine)
                    .font(SLW.display(10))
                    .foregroundColor(SLW.ink2)
                    .lineLimit(2)
            }
            .padding(6)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(SLW.surface)
            .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))

            Spacer(minLength: 4)

            Button(action: onLogShot) {
                Text("+ LOG SHOT")
                    .font(SLW.mono(11, weight: .semibold))
                    .tracking(1.8)
                    .foregroundColor(SLW.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 32)
            }
            .background(SLW.accent)
            .buttonStyle(.plain)
        }
        .padding(8)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(SLW.bg)
    }

    private struct Yardage: View {
        var label: String
        var yards: Int
        var units: WatchUnitsSystem
        var body: some View {
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(SLW.mono(8))
                    .foregroundColor(SLW.ink3)
                Text(units.formatNumber(yards: Double(yards)))
                    .font(SLW.num(14))
                    .foregroundColor(SLW.ink2)
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .background(SLW.surface)
            .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
    }
}
