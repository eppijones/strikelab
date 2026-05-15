//
//  HoleDetailView.swift
//  StrikeLabCaddie
//
//  Single hole score entry view
//

import SwiftUI
import CoreLocation

struct HoleDetailView: View {
    @Binding var roundHole: RoundHole
    @Binding var round: Round
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var unitsManager: UnitsManager
    @EnvironmentObject var weatherManager: WeatherManager
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager

    @State private var lastCaddieYards: Double?
    @State private var lastCaddieHole: Int?
    @State private var lastWindFingerprint: String?

    /// When true the view auto-saves every change to the binding (used by
    /// the on-course `LiveHolePager`). When false (the modal sheet
    /// behaviour) edits stay local until the user taps Save.
    var commitsLive: Bool = false

    @State private var grossStrokes: Int
    @State private var putts: Int
    @State private var notes: String
    @State private var fairwayHit: Bool?
    @State private var greenInRegulation: Bool?
    @State private var showClubPicker = false
    @State private var lastLoggedClub: Club?

    init(roundHole: Binding<RoundHole>, round: Binding<Round>, commitsLive: Bool = false) {
        self._roundHole = roundHole
        self._round = round
        self.commitsLive = commitsLive

        // Initialize state from binding
        let hole = roundHole.wrappedValue
        self._grossStrokes = State(initialValue: hole.grossStrokes ?? hole.par)
        self._putts = State(initialValue: hole.putts ?? 1)
        self._notes = State(initialValue: hole.notes ?? "")
        self._fairwayHit = State(initialValue: hole.fairwayHit)
        self._greenInRegulation = State(initialValue: hole.greenInRegulation)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                holeHeader

                if let layout = round.course.layout(forHole: roundHole.holeNumber) {
                    caddiePanel(layout: layout)
                }

                grossStrokesSection
                puttsSection
                scoreInfoSection
                accuracySection
                notesSection

                if !shotsForHole.isEmpty {
                    shotsSection
                }

                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Hole \(roundHole.holeNumber)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !commitsLive {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        saveAndDismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(Theme.ink)
                }

                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(Theme.ink2)
                }
            }
        }
        .onChange(of: grossStrokes) { _, _ in if commitsLive { commitChanges() } }
        .onChange(of: putts) { _, _ in if commitsLive { commitChanges() } }
        .onChange(of: notes) { _, _ in if commitsLive { commitChanges() } }
        .onChange(of: fairwayHit) { _, _ in if commitsLive { commitChanges() } }
        .onChange(of: greenInRegulation) { _, _ in if commitsLive { commitChanges() } }
        .onChange(of: roundHole.holeNumber) { _, _ in
            // When the pager swipes to a different hole the binding swaps
            // out under us — re-hydrate local state from the new hole.
            let hole = roundHole
            grossStrokes = hole.grossStrokes ?? hole.par
            putts = hole.putts ?? 1
            notes = hole.notes ?? ""
            fairwayHit = hole.fairwayHit
            greenInRegulation = hole.greenInRegulation
            pushCaddieToWatchIfNeeded(force: true)
        }
        .onChange(of: locationManager.currentLocation?.coordinate.latitude) { _, _ in
            pushCaddieToWatchIfNeeded(force: false)
        }
        .onChange(of: weatherManager.currentConditions?.windSpeed) { _, _ in
            pushCaddieToWatchIfNeeded(force: false)
        }
        .confirmationDialog("Track club", isPresented: $showClubPicker, titleVisibility: .visible) {
            ForEach(Club.commonClubs) { club in
                Button(club.rawValue) {
                    logShot(with: club)
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Log the club you are hitting on hole \(roundHole.holeNumber).")
        }
        .onAppear {
            pushCaddieToWatchIfNeeded(force: true)
        }
    }

    /// Recomputes Smart Caddie and mirrors to the watch when GPS moves
    /// ≥5 yds, the hole changes, or wind updates.
    private func pushCaddieToWatchIfNeeded(force: Bool) {
        guard let layout = round.course.layout(forHole: roundHole.holeNumber) else { return }
        let yards = yardsToPin(layout: layout)
        let hole = roundHole.holeNumber
        let windFp = weatherFingerprint()

        if !force,
           let ly = lastCaddieYards,
           let lh = lastCaddieHole,
           lh == hole,
           abs(yards - ly) < 5,
           windFp == lastWindFingerprint {
            return
        }

        lastCaddieYards = yards
        lastCaddieHole = hole
        lastWindFingerprint = windFp

        let rec = SmartCaddie.recommendClub(input: CaddieInput(
            distanceToTarget: yards,
            player: round.player,
            weather: weatherManager.currentConditions,
            lie: .tee
        ))
        let phrase = rec.watchCommitPhrase(distanceYards: Int(yards.rounded()))
        let warn = rec.warnings.first
        let calculator = locationManager.currentLocation.map {
            HoleDistanceCalculator(
                currentLocation: Coordinate(from: $0.coordinate),
                holeLayout: layout
            )
        }
        let front = calculator?.distanceToFront.map { Int($0.rounded()) }
        let back = calculator?.distanceToBack.map { Int($0.rounded()) }
        let hazardNote = calculator?.nearestHazard.map {
            "\($0.hazard.displayName) \(Int($0.distance.rounded())) \(unitsManager.unitLabel)"
        }
        let windMph = weatherManager.currentConditions.map { $0.windSpeed * 2.23694 }
        let source = layout.hasGPSData ? "OpenStreetMap + StrikeLab" : "StrikeLab course cache"
        let confidence = layout.hasGPSData
            ? min(0.95, 0.7 + Double(layout.hazards.count) * 0.03)
            : 0.45
        connectivityManager.sendCaddieAdvice(
            holeNumber: hole,
            distanceYards: Int(yards.rounded()),
            club: rec.club,
            commitPhrase: phrase,
            warning: warn,
            frontYards: front,
            backYards: back,
            playsLikeYards: Int(rec.adjustedDistance.rounded()),
            hazardNote: hazardNote,
            source: source,
            confidence: confidence,
            windMph: windMph
        )
    }

    private func weatherFingerprint() -> String {
        guard let w = weatherManager.currentConditions else { return "" }
        return "\(w.windSpeed)-\(w.windDirection)"
    }

    /// Yards to green center — live GPS when available, else tee-to-center.
    private func yardsToPin(layout: HoleLayout) -> Double {
        if let loc = locationManager.currentLocation {
            let calc = HoleDistanceCalculator(
                currentLocation: Coordinate(from: loc.coordinate),
                holeLayout: layout
            )
            if let y = calc.distanceToCenter { return y }
        }
        let tee = layout.teeBox
        let center = layout.greenCenter
        if let tb = tee, let gc = center {
            return tb.distance(to: gc) * 1.09361
        }
        return 0
    }

    private func commitChanges() {
        roundHole.grossStrokes = grossStrokes
        roundHole.putts = putts
        roundHole.notes = notes.isEmpty ? nil : notes
        roundHole.fairwayHit = fairwayHit
        roundHole.greenInRegulation = greenInRegulation
        roundHole.recalculateNet()
    }
    
    // MARK: - Hole Header
    
    private var holeHeader: some View {
        HStack(spacing: 20) {
            // Hole number
            VStack(spacing: 2) {
                Text("HOLE")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(roundHole.holeNumber)")
                    .font(Theme.statFont(36))
                    .foregroundColor(Theme.nordicForest)
            }
            
            Divider()
                .frame(height: 50)
            
            // Par
            VStack(spacing: 2) {
                Text("PAR")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(roundHole.par)")
                    .font(Theme.statFont(36))
                    .foregroundColor(Theme.nordicForest)
            }
            
            Divider()
                .frame(height: 50)
            
            // Handicap Index
            VStack(spacing: 2) {
                Text("H.I.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(roundHole.handicapIndex)")
                    .font(Theme.statFont(28))
                    .foregroundColor(Theme.nordicForest.opacity(0.7))
            }
            
            if roundHole.strokesReceived > 0 {
                Divider()
                    .frame(height: 50)
                
                // Strokes received
                VStack(spacing: 2) {
                    Text("STROKES")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.champagne)
                    
                    Text("+\(roundHole.strokesReceived)")
                        .font(Theme.statFont(28))
                        .foregroundColor(Theme.champagne)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .glassCard()
    }
    
    // MARK: - Strokes Section
    
    private var grossStrokesSection: some View {
        VStack(spacing: 12) {
            Text("STROKES")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack {
                Button {
                    if grossStrokes > 1 {
                        grossStrokes -= 1
                    }
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(Theme.nordicForest.opacity(grossStrokes > 1 ? 1 : 0.3))
                }
                .buttonStyle(.plain)
                .disabled(grossStrokes <= 1)
                
                Spacer()
                
                VStack(spacing: 4) {
                    Text("\(grossStrokes)")
                        .font(Theme.statFont(56))
                        .foregroundColor(.scoreColor(strokes: grossStrokes, par: roundHole.par))
                    
                    if let scoreName = scoreName {
                        Text(scoreName)
                            .font(Theme.labelFont(14))
                            .foregroundColor(.scoreColor(strokes: grossStrokes, par: roundHole.par).opacity(0.8))
                    }
                }
                
                Spacer()
                
                Button {
                    grossStrokes += 1
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(Theme.nordicForest)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal)
            .glassCard()
        }
    }
    
    private var scoreName: String? {
        let diff = grossStrokes - roundHole.par
        switch diff {
        case ...(-3): return "Albatross!"
        case -2: return "Eagle!"
        case -1: return "Birdie"
        case 0: return "Par"
        case 1: return "Bogey"
        case 2: return "Double Bogey"
        case 3: return "Triple Bogey"
        default: return "+\(diff)"
        }
    }
    
    // MARK: - Putts Section
    
    private var puttsSection: some View {
        VStack(spacing: 12) {
            Text("PUTTS")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack {
                Button {
                    if putts > 0 {
                        putts -= 1
                    }
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(Theme.nordicForest.opacity(putts > 0 ? 1 : 0.3))
                }
                .buttonStyle(.plain)
                .disabled(putts <= 0)
                
                Spacer()
                
                Text("\(putts)")
                    .font(Theme.statFont(36))
                    .foregroundColor(Theme.nordicForest)
                
                Spacer()
                
                Button {
                    putts += 1
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(Theme.nordicForest)
                }
                .buttonStyle(.plain)
            }
            .padding()
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 12)
        }
    }
    
    // MARK: - Score Info Section
    
    private var scoreInfoSection: some View {
        HStack(spacing: 20) {
            VStack(spacing: 4) {
                Text("NET")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(grossStrokes - roundHole.strokesReceived)")
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.nordicSage)
            }
            
            if roundHole.strokesReceived > 0 {
                VStack(spacing: 4) {
                    Text("STROKE(S)")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.champagne)
                    
                    Text("-\(roundHole.strokesReceived)")
                        .font(Theme.statFont(24))
                        .foregroundColor(Theme.champagne)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .compactGlassCard()
    }
    
    // MARK: - Accuracy Section
    
    private var accuracySection: some View {
        VStack(spacing: 12) {
            Text("ACCURACY")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 12) {
                // Fairway (only for par 4 and 5)
                if roundHole.par > 3 {
                    VStack(spacing: 8) {
                        Text("FAIRWAY")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.nordicForest.opacity(0.6))
                        
                        HStack(spacing: 8) {
                            accuracyButton(
                                isSelected: fairwayHit == true,
                                label: "Hit",
                                icon: "checkmark.circle.fill",
                                color: Theme.nordicSage
                            ) {
                                fairwayHit = fairwayHit == true ? nil : true
                            }
                            
                            accuracyButton(
                                isSelected: fairwayHit == false,
                                label: "Miss",
                                icon: "xmark.circle.fill",
                                color: Theme.overPar
                            ) {
                                fairwayHit = fairwayHit == false ? nil : false
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                
                // GIR
                VStack(spacing: 8) {
                    Text("GIR")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                    
                    HStack(spacing: 8) {
                        accuracyButton(
                            isSelected: greenInRegulation == true,
                            label: "Yes",
                            icon: "checkmark.circle.fill",
                            color: Theme.nordicSage
                        ) {
                            greenInRegulation = greenInRegulation == true ? nil : true
                        }
                        
                        accuracyButton(
                            isSelected: greenInRegulation == false,
                            label: "No",
                            icon: "xmark.circle.fill",
                            color: Theme.overPar
                        ) {
                            greenInRegulation = greenInRegulation == false ? nil : false
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
        }
    }
    
    private func accuracyButton(isSelected: Bool, label: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: isSelected ? icon : "circle")
                    .font(.system(size: 24))
                    .foregroundColor(isSelected ? color : Theme.nordicForest.opacity(0.3))
                
                Text(label)
                    .font(Theme.labelFont(12))
                    .foregroundColor(isSelected ? color : Theme.nordicForest.opacity(0.5))
            }
            .frame(width: 50)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? color.opacity(0.1) : Color.clear)
            )
        }
    }
    
    // MARK: - Notes Section
    
    private var notesSection: some View {
        VStack(spacing: 8) {
            SectionLabel(text: "Notes")

            TextField("Add notes…", text: $notes, axis: .vertical)
                .font(Theme.bodyFont(15))
                .foregroundColor(Theme.ink)
                .tint(Theme.accent)
                .lineLimit(3...6)
                .padding()
                .background(Theme.surface)
                .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        }
    }

    // MARK: - Caddie Panel

    /// Smart Caddie panel: yardages from teebox to green + recommended club
    /// based on the player's bag distances. Uses the synthetic GPS layouts on
    /// the demo course so this surface "just works" without a real GPS fix.
    @ViewBuilder
    private func caddiePanel(layout: HoleLayout) -> some View {
        // Internally everything stays in yards; we let the UnitsManager
        // format for display when we hand off numbers to Text views.
        let teebox = layout.teeBox
        let center = layout.greenCenter
        let front = layout.greenFront
        let back = layout.greenBack

        let yardsCenter = yardsToPin(layout: layout)
        let yardsFront = teebox.flatMap { tb in front.map { gc in tb.distance(to: gc) * 1.09361 } } ?? 0
        let yardsBack = teebox.flatMap { tb in back.map { gc in tb.distance(to: gc) * 1.09361 } } ?? 0

        let recommendation = SmartCaddie.recommendClub(input: CaddieInput(
            distanceToTarget: yardsCenter,
            player: round.player,
            lie: .tee
        ))

        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Text("CADDIE")
                    .font(Theme.labelFont(11))
                    .tracking(2.0)
                    .foregroundColor(Theme.accent)
                Spacer()
                if let weather = weatherManager.currentConditions {
                    HStack(spacing: 4) {
                        Image(systemName: "wind")
                            .font(.system(size: 10))
                            .foregroundColor(Theme.ink2)
                        Text(weather.formattedWind)
                            .font(Theme.labelFont(10))
                            .tracking(1.0)
                            .foregroundColor(Theme.ink2)
                    }
                }
                if !layout.hazards.isEmpty {
                    Text("\(layout.hazards.count) HAZARD\(layout.hazards.count == 1 ? "" : "S")")
                        .font(Theme.labelFont(10))
                        .tracking(1.4)
                        .foregroundColor(Theme.warn)
                }
            }

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(unitsManager.format(yards: yardsCenter, includesUnit: false))
                    .font(Theme.statFont(56))
                    .foregroundColor(Theme.ink)
                Text("\(unitsManager.unitCapsLabel) · TO PIN")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
            }

            HStack(spacing: 8) {
                yardageTile(label: "F", yards: yardsFront)
                yardageTile(label: "C", yards: yardsCenter, accent: true)
                yardageTile(label: "B", yards: yardsBack)
            }

            // Nearest hazard hint — pulled from the layout's hazard list,
            // in the user's preferred unit.
            if let firstHazard = layout.hazards.first, let teebox = layout.teeBox {
                let hazardYards = teebox.distance(to: firstHazard.coordinate) * 1.09361
                HStack(spacing: 6) {
                    Image(systemName: firstHazard.type.icon)
                        .font(.system(size: 11))
                        .foregroundColor(Theme.warn)
                    Text(firstHazard.displayName.uppercased())
                        .font(Theme.labelFont(10))
                        .tracking(1.2)
                        .foregroundColor(Theme.ink3)
                    Spacer()
                    Text(unitsManager.format(yards: hazardYards))
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink2)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Theme.surface2)
                .overlay(Rectangle().stroke(Theme.warn.opacity(0.4), lineWidth: 1))
            }

            HStack(spacing: 8) {
                Text(recommendation.club.shortName.uppercased())
                    .font(Theme.statFont(20))
                    .foregroundColor(Theme.accentInk)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Theme.accent)

                VStack(alignment: .leading, spacing: 2) {
                    Text("RECOMMENDED · \(recommendation.confidencePercent)% confidence")
                        .font(Theme.labelFont(10))
                        .tracking(1.4)
                        .foregroundColor(Theme.ink3)
                    Text(localisedReason(for: recommendation))
                        .font(Theme.bodyFont(13))
                        .foregroundColor(Theme.ink2)
                }
                Spacer()
            }

            Button {
                showClubPicker = true
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: lastLoggedClub?.iconName ?? "figure.golf")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Theme.accent)
                        .frame(width: 28, height: 28)
                        .background(Theme.accent.opacity(0.14))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(lastLoggedClub == nil ? "TRACK CLUB" : "LAST CLUB · \(lastLoggedClub!.shortName.uppercased())")
                            .font(Theme.labelFont(10))
                            .tracking(1.4)
                            .foregroundColor(Theme.ink3)
                        Text(lastLoggedClub == nil ? "Tap before the shot to log what you hit" : "Tap to log the next shot")
                            .font(Theme.bodyFont(13))
                            .foregroundColor(Theme.ink2)
                    }

                    Spacer()

                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(Theme.ink3)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Theme.surface2)
                .overlay(Rectangle().stroke(Theme.accent.opacity(0.35), lineWidth: 1))
            }
            .buttonStyle(.plain)

            if !recommendation.warnings.isEmpty {
                ForEach(recommendation.warnings, id: \.self) { warning in
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(Theme.warn)
                            .font(.system(size: 11))
                        Text(localisedWarning(warning))
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink2)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard()
    }

    private func yardageTile(label: String, yards: Double, accent: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(accent ? Theme.accent : Theme.ink3)
            Text(unitsManager.format(yards: yards))
                .font(Theme.statFont(18))
                .foregroundColor(accent ? Theme.ink : Theme.ink2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(accent ? Theme.accent.opacity(0.5) : Theme.line, lineWidth: 1))
    }

    /// SmartCaddie reasons + warnings are produced as English strings with
    /// "y" / "yds" hard-coded. Rewrite those substrings to the user's
    /// preferred unit + value before display.
    private func localisedReason(for rec: ClubRecommendation) -> String {
        rewriteYards(in: rec.reason)
    }

    private func localisedWarning(_ raw: String) -> String {
        rewriteYards(in: raw)
    }

    private func rewriteYards(in source: String) -> String {
        guard unitsManager.system == .meters else { return source }
        // Match integers immediately followed by 'y' or 'yds' (case-insensitive)
        // and replace with the metres equivalent + "m".
        let pattern = #"(\d+)\s*(yds|y)\b"#
        let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
        guard let regex else { return source }

        let nsSource = source as NSString
        let range = NSRange(location: 0, length: nsSource.length)
        var rewritten = source

        // Walk matches in reverse so ranges stay valid.
        let matches = regex.matches(in: source, options: [], range: range).reversed()
        for match in matches {
            guard match.numberOfRanges >= 2 else { continue }
            let numberRange = match.range(at: 1)
            guard let yardsValue = Double(nsSource.substring(with: numberRange)) else { continue }
            let metres = Int(UnitsManager.metres(fromYards: yardsValue).rounded())
            rewritten = (rewritten as NSString).replacingCharacters(in: match.range, with: "\(metres)m")
        }
        return rewritten
    }
    
    // MARK: - Shots Section
    
    private var shotsForHole: [Shot] {
        round.shots(forHole: roundHole.holeNumber)
    }
    
    private var shotsSection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("SHOTS ON THIS HOLE")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Spacer()
                
                Text("\(shotsForHole.count)")
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.nordicForest)
            }
            
            ForEach(shotsForHole) { shot in
                HStack {
                    Image(systemName: shot.clubGroup.iconName)
                        .foregroundColor(Theme.neuralCyan)
                    
                    Text(shot.club.shortName)
                        .font(Theme.statFont(14))
                        .foregroundColor(Theme.nordicForest)
                    
                    Spacer()
                    
                    if let yards = shot.distanceYards {
                        Text(unitsManager.format(yards: yards))
                            .font(Theme.statFont(14))
                            .foregroundColor(Theme.nordicForest)
                    }
                    
                    Text(shot.timeString)
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.5))
                    
                    // Delete button
                    Button {
                        deleteShot(shot)
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 14))
                            .foregroundColor(Theme.overPar.opacity(0.6))
                    }
                    .buttonStyle(.plain)
                    .padding(.leading, 8)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .compactGlassCard()
                .contextMenu {
                    Button(role: .destructive) {
                        deleteShot(shot)
                    } label: {
                        Label("Delete Shot", systemImage: "trash")
                    }
                }
            }
        }
    }
    
    private func deleteShot(_ shot: Shot) {
        round.shots.removeAll { $0.id == shot.id }
    }

    private func logShot(with club: Club) {
        let start = locationManager.currentLocation.map { Coordinate(from: $0.coordinate) }
        let shot = Shot(
            club: club,
            startLocation: start,
            holeNumber: roundHole.holeNumber,
            isManual: true
        )
        round.addShot(shot)
        lastLoggedClub = club
    }
    
    // MARK: - Actions
    
    private func saveAndDismiss() {
        roundHole.grossStrokes = grossStrokes
        roundHole.putts = putts
        roundHole.notes = notes.isEmpty ? nil : notes
        roundHole.fairwayHit = fairwayHit
        roundHole.greenInRegulation = greenInRegulation
        roundHole.recalculateNet()
        dismiss()
    }
}

#Preview {
    NavigationStack {
        HoleDetailView(
            roundHole: .constant(RoundHole(
                holeNumber: 5,
                par: 4,
                handicapIndex: 3,
                strokesReceived: 1
            )),
            round: .constant(Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            ))
        )
        .environmentObject(UnitsManager.shared)
        .environmentObject(WeatherManager())
        .environmentObject(LocationManager())
        .environmentObject(WatchConnectivityManager())
    }
}
