import SwiftUI

/// Six-screen StrikeLabCaddie flow ported from `StrikelabDesign/caddie-watch.jsx`.
/// Page-style TabView; the Digital Crown is reserved for in-screen scrub
/// (club picker, intent feel, fairway map).
///
/// Reads live caddie advice from `WatchConnectivityManagerWatch` when
/// the phone has pushed a snapshot; otherwise renders sensible demo
/// values so the screen never appears blank.
struct CaddieFlowView: View {
    @EnvironmentObject var connectivityManager: WatchConnectivityManagerWatch
    @State private var page: Int = 0

    private let clubChoices: [ClubChoice] = [
        ClubChoice(label: "PW", carryYards: 125, deltaToTarget: -23),
        ClubChoice(label: "9i", carryYards: 148, deltaToTarget: 0),
        ClubChoice(label: "8i", carryYards: 158, deltaToTarget: 10),
        ClubChoice(label: "7i", carryYards: 168, deltaToTarget: 20),
        ClubChoice(label: "6i", carryYards: 178, deltaToTarget: 30),
    ]

    private var holeNumber: Int { max(1, connectivityManager.caddieHole) }
    private var par: Int { connectivityManager.currentHole.par }
    private var pinYards: Int {
        connectivityManager.caddieDistanceYards > 0 ? connectivityManager.caddieDistanceYards : 148
    }
    private var frontYards: Int { connectivityManager.caddieFrontYards ?? max(0, pinYards - 10) }
    private var backYards: Int { connectivityManager.caddieBackYards ?? pinYards + 14 }
    private var suggestedClub: String {
        connectivityManager.caddieClubRaw.isEmpty ? "9i" : connectivityManager.caddieClubRaw
    }
    private var commitPhrase: String {
        connectivityManager.caddieCommit.isEmpty
            ? "Center of the green. Trust the number."
            : connectivityManager.caddieCommit
    }
    private var coachLine: String {
        connectivityManager.caddieWarning.isEmpty
            ? "Smooth swing — back of green is safe."
            : connectivityManager.caddieWarning
    }
    private var windMph: Int { Int((connectivityManager.caddieWindMph ?? 8).rounded()) }
    private var windDirectionDeg: Double { connectivityManager.caddieWindDirectionDeg ?? 215 }

    var body: some View {
        TabView(selection: $page) {
            HoleOverviewView(
                holeNumber: holeNumber,
                par: par,
                pinYards: pinYards,
                frontYards: frontYards,
                backYards: backYards,
                suggestedClub: suggestedClub,
                coachLine: coachLine,
                onLogShot: { page = 1 }
            )
            .tag(0)

            ClubPickerView(
                clubs: clubChoices,
                suggested: suggestedClub,
                onConfirm: { _ in page = 2 }
            )
            .tag(1)

            PreShotIntentView(
                commitPhrase: commitPhrase,
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
                windMph: windMph,
                windDirectionDeg: windDirectionDeg
            )
            .tag(4)

            RoundSummaryView(
                courseName: connectivityManager.courseName ?? "Alenda GC",
                holesPlayed: holeNumber,
                totalGross: connectivityManager.grossTotal,
                totalPar: connectivityManager.parToCurrent,
                girPercent: 67,
                firPercent: 71,
                puttsAvg: 1.7,
                onNextHole: { page = 0 }
            )
            .tag(5)
        }
        .tabViewStyle(.page)
        .background(SLW.bg)
    }
}

#Preview {
    CaddieFlowView()
        .environmentObject(WatchConnectivityManagerWatch())
}
