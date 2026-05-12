import SwiftUI

/// Six-screen StrikeLab Caddie flow ported from `StrikelabDesign/caddie-watch.jsx`.
/// Page-style TabView; the Digital Crown is reserved for in-screen scrub
/// (club picker, intent feel, fairway map).
struct CaddieFlowView: View {
    @State private var page: Int = 0

    // Demo state — wire to WatchConnectivityManagerWatch in production
    @State private var holeNumber: Int = 9
    @State private var par: Int = 4
    @State private var pinYards: Int = 148
    @State private var frontYards: Int = 138
    @State private var backYards: Int = 162
    @State private var suggestedClub: String = "9i"

    private let clubChoices: [ClubChoice] = [
        ClubChoice(label: "PW", carryYards: 125, deltaToTarget: -23),
        ClubChoice(label: "9i", carryYards: 148, deltaToTarget: 0),
        ClubChoice(label: "8i", carryYards: 158, deltaToTarget: 10),
        ClubChoice(label: "7i", carryYards: 168, deltaToTarget: 20),
        ClubChoice(label: "6i", carryYards: 178, deltaToTarget: 30),
    ]

    var body: some View {
        TabView(selection: $page) {
            HoleOverviewView(
                holeNumber: holeNumber,
                par: par,
                pinYards: pinYards,
                frontYards: frontYards,
                backYards: backYards,
                suggestedClub: suggestedClub,
                coachLine: "Smooth swing — back of green is safe.",
                onLogShot: { page = 1 }
            )
            .tag(0)

            ClubPickerView(
                clubs: clubChoices,
                suggested: suggestedClub,
                onConfirm: { choice in
                    suggestedClub = choice.label
                    page = 2
                }
            )
            .tag(1)

            PreShotIntentView(
                commitPhrase: "Center of the green. Trust the number.",
                onCommit: { _ in page = 3 },
                onVoice: { /* SpeechRecognizer hook */ }
            )
            .tag(2)

            LiveShotView(
                carryYards: 146,
                ballSpeedMph: 122,
                smashFactor: 1.39,
                heartRate: 96,
                onEdit: {},
                onNext: { page = 4 }
            )
            .tag(3)

            HoleMapView(
                holeNumber: holeNumber,
                pinYards: pinYards,
                windMph: 8,
                windDirectionDeg: 215
            )
            .tag(4)

            RoundSummaryView(
                courseName: "Alenda GC",
                holesPlayed: holeNumber,
                totalGross: 38,
                totalPar: 36,
                girPercent: 67,
                firPercent: 71,
                puttsAvg: 1.7,
                onNextHole: {
                    holeNumber += 1
                    page = 0
                }
            )
            .tag(5)
        }
        .tabViewStyle(.page)
        .background(SLW.bg)
    }
}

#Preview {
    CaddieFlowView()
}
