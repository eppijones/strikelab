//
//  FullScorecardView.swift
//  StrikeLabCaddie
//
//  Full-screen 18-hole scorecard view with portrait and landscape layouts
//

import SwiftUI

struct FullScorecardView: View {
    let round: Round
    
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var showShareSheet = false
    @State private var scorecardImage: UIImage?
    @State private var orientation = UIDevice.current.orientation
    
    var isLandscape: Bool {
        orientation.isLandscape || horizontalSizeClass == .regular
    }
    
    var body: some View {
        GeometryReader { geometry in
            ScrollView(isLandscape ? .horizontal : .vertical, showsIndicators: false) {
                if isLandscape {
                    landscapeScorecard(geometry: geometry)
                } else {
                    portraitScorecard(geometry: geometry)
                }
            }
        }
        .nordicBackground()
        .navigationTitle("Scorecard")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Done") {
                    dismiss()
                }
                .foregroundColor(Theme.neuralCyan)
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    shareScorecard()
                } label: {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundColor(Theme.ink)
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let image = scorecardImage {
                ShareSheet(items: [image])
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIDevice.orientationDidChangeNotification)) { _ in
            orientation = UIDevice.current.orientation
        }
    }
    
    // MARK: - Share
    
    private func shareScorecard() {
        if isLandscape {
            scorecardImage = ScorecardImageRenderer.renderLandscapeImage(for: round)
        } else {
            scorecardImage = ScorecardImageRenderer.renderImage(for: round)
        }
        if scorecardImage != nil {
            showShareSheet = true
        }
    }
    
    // MARK: - Portrait Scorecard
    
    private func portraitScorecard(geometry: GeometryProxy) -> some View {
        VStack(spacing: 16) {
            scorecardHeader
            scoreSummaryRow

            if round.playFormat == .full18 || round.playFormat == .front9 {
                scorecardSection(
                    title: "FRONT 9",
                    holes: Array(round.holes.prefix(9)),
                    subtotalLabel: "OUT"
                )
            }

            if round.playFormat == .full18 || round.playFormat == .back9 {
                scorecardSection(
                    title: "BACK 9",
                    holes: Array(round.holes.suffix(9)),
                    subtotalLabel: "IN"
                )
            }

            totalRow
            Spacer(minLength: 40)
        }
        .padding()
        .frame(minWidth: geometry.size.width)
    }
    
    // MARK: - Landscape Scorecard (Traditional Golf Card Layout)
    
    private func landscapeScorecard(geometry: GeometryProxy) -> some View {
        VStack(spacing: 16) {
            scorecardHeader

            VStack(spacing: 0) {
                landscapeHoleRow()
                landscapeParRow()
                landscapeHIRow()
                landscapeStrokesRow()
                landscapeGrossRow()
                landscapeNetRow()
            }
            .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
            .padding(.horizontal)

            scoreSummaryRow
            Spacer(minLength: 20)
        }
        .padding()
        .frame(minWidth: max(geometry.size.width, round.playFormat == .full18 ? 900 : 520))
    }
    
    // MARK: - Landscape Row Components
    
    private func landscapeHoleRow() -> some View {
        HStack(spacing: 0) {
            Text("HOLE")
                .landscapeLabelCell()

            landscapeSectionCells { hole in
                Text("\(hole.holeNumber)")
                    .landscapeCell(highlight: false)
            }
        }
        .font(Theme.labelFont(11))
        .tracking(1.2)
        .foregroundColor(Theme.ink)
        .background(Theme.surface3)
    }
    
    private func landscapeParRow() -> some View {
        HStack(spacing: 0) {
            Text("PAR")
                .landscapeLabelCell()

            landscapeSectionCells(
                subtotalText: { holes in "\(holes.reduce(0) { $0 + $1.par })" },
                finalText: "\(round.playedHoles.reduce(0) { $0 + $1.par })"
            ) { hole in
                Text("\(hole.par)")
                    .landscapeCell(highlight: isHighlighted(hole))
            }
        }
        .font(Theme.labelFont(11))
        .foregroundColor(Theme.ink2)
    }
    
    private func landscapeHIRow() -> some View {
        HStack(spacing: 0) {
            Text("HI")
                .landscapeLabelCell()

            landscapeSectionCells(blankTotals: true) { hole in
                Text("\(hole.handicapIndex)")
                    .landscapeCell(highlight: isHighlighted(hole))
            }
        }
        .font(Theme.labelFont(10))
        .foregroundColor(Theme.ink3)
    }
    
    private func landscapeStrokesRow() -> some View {
        HStack(spacing: 0) {
            Text("+")
                .landscapeLabelCell()

            landscapeSectionCells(
                subtotalText: { holes in "\(holes.reduce(0) { $0 + $1.strokesReceived })" },
                finalText: round.courseHandicap.map { "\($0)" }
            ) { hole in
                Text(hole.strokesReceived > 0 ? "\(hole.strokesReceived)" : "-")
                    .landscapeCell(highlight: isHighlighted(hole))
            }
        }
        .font(Theme.labelFont(10))
        .foregroundColor(Theme.warn)
    }
    
    private func landscapeGrossRow() -> some View {
        HStack(spacing: 0) {
            Text("GROSS")
                .landscapeLabelCell()

            landscapeSectionCells(
                subtotalText: { holes in "\(holes.compactMap { $0.grossStrokes }.reduce(0, +))" },
                finalText: "\(round.grossTotal)"
            ) { hole in
                if let gross = hole.grossStrokes {
                    Text("\(gross)")
                        .landscapeScoreCell(strokes: gross, par: hole.par, highlight: isHighlighted(hole))
                } else {
                    Text("-")
                        .landscapeCell(highlight: isHighlighted(hole))
                }
            }
        }
        .font(Theme.statFont(12))
        .foregroundColor(Theme.ink)
    }
    
    private func landscapeNetRow() -> some View {
        HStack(spacing: 0) {
            Text("NET")
                .landscapeLabelCell()

            landscapeSectionCells(
                subtotalText: { holes in "\(holes.compactMap { $0.netStrokes }.reduce(0, +))" },
                finalText: "\(round.netTotal)"
            ) { hole in
                if let net = hole.netStrokes {
                    Text("\(net)")
                        .landscapeCell(highlight: isHighlighted(hole))
                } else {
                    Text("-")
                        .landscapeCell(highlight: isHighlighted(hole))
                }
            }
        }
        .font(Theme.statFont(11))
        .foregroundColor(Theme.accent)
        .background(Theme.accent.opacity(0.07))
    }

    @ViewBuilder
    private func landscapeSectionCells<Cell: View>(
        subtotalText: (([RoundHole]) -> String)? = nil,
        finalText: String? = nil,
        blankTotals: Bool = false,
        @ViewBuilder cell: @escaping (RoundHole) -> Cell
    ) -> some View {
        let front = Array(round.holes.prefix(9))
        let back = Array(round.holes.suffix(9))

        if round.playFormat == .full18 || round.playFormat == .front9 {
            ForEach(front) { hole in
                cell(hole)
            }
            Text(blankTotals ? "" : (subtotalText?(front) ?? "OUT"))
                .landscapeTotalCell()
        }

        if round.playFormat == .full18 || round.playFormat == .back9 {
            ForEach(back) { hole in
                cell(hole)
            }
            Text(blankTotals ? "" : (subtotalText?(back) ?? "IN"))
                .landscapeTotalCell()
        }

        if round.playFormat == .full18 {
            Text(blankTotals ? "" : (finalText ?? "TOT"))
                .landscapeTotalCell(isFinal: true)
        }
    }

    private func isHighlighted(_ hole: RoundHole) -> Bool {
        let positionInNine = (hole.holeNumber - 1) % 9
        return positionInNine % 2 == 0
    }
    
    // MARK: - Shared Components
    
    private var scorecardHeader: some View {
        VStack(spacing: 10) {
            Text(round.course.name.uppercased())
                .font(Theme.labelFont(15))
                .tracking(2.0)
                .foregroundColor(Theme.accent)
            
            HStack(spacing: 16) {
                Label {
                    Text(round.date, style: .date)
                } icon: {
                    Image(systemName: "calendar")
                }
                
                if let tee = round.selectedTee {
                    Label {
                        Text(tee.name)
                    } icon: {
                        Image(systemName: "flag.fill")
                    }
                }
                
                Label {
                    Text(round.player.name)
                } icon: {
                    Image(systemName: "person.fill")
                }
            }
            .font(Theme.bodyFont(13))
            .foregroundColor(Theme.ink2)
            
            if let ch = round.courseHandicap {
                Text("COURSE HANDICAP: \(ch)")
                    .font(Theme.labelFont(11))
                    .tracking(1.4)
                    .foregroundColor(Theme.warn)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }
    
    private var scoreSummaryRow: some View {
        HStack(spacing: 0) {
            summaryTile(label: "Gross", value: "\(round.grossTotal)", tint: Theme.ink)
            Rectangle().fill(Theme.line).frame(width: 1, height: 50)
            summaryTile(label: "To Par", value: round.formattedOverUnder, tint: overUnderColor)
            Rectangle().fill(Theme.line).frame(width: 1, height: 50)
            summaryTile(label: "Net", value: "\(round.netTotal)", tint: Theme.accent)
        }
        .padding(.vertical, 16)
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
        .padding(.horizontal)
    }

    private func summaryTile(label: String, value: String, tint: Color) -> some View {
        VStack(spacing: 4) {
            Text(label.uppercased())
                .font(Theme.labelFont(11))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(32))
                .foregroundColor(tint)
        }
        .frame(maxWidth: .infinity)
    }
    
    private var overUnderColor: Color {
        if round.grossOverUnder < 0 {
            return Theme.accent
        } else if round.grossOverUnder > 0 {
            return Theme.bad
        }
        return Theme.ink
    }
    
    // MARK: - Portrait Components

    private func scorecardSection(title: String, holes: [RoundHole], subtotalLabel: String) -> some View {
        VStack(spacing: 0) {
            sectionHeader(title)
            columnHeaders
            ForEach(Array(holes.enumerated()), id: \.element.id) { index, hole in
                holeRow(hole: hole, isEven: index % 2 == 0)
            }
            subtotalRow(holes: holes, label: subtotalLabel)
        }
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }
    
    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(Theme.labelFont(12))
                .tracking(1.6)
                .foregroundColor(Theme.accent)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Theme.surface3)
    }
    
    private var columnHeaders: some View {
        HStack(spacing: 0) {
            Text("Hole")
                .frame(width: 45, alignment: .leading)
            Text("Par")
                .frame(width: 35)
            Text("HI")
                .frame(width: 30)
            Text("+")
                .frame(width: 25)
            Text("Gross")
                .frame(width: 50)
            Text("Net")
                .frame(width: 45)
            Spacer()
        }
        .font(Theme.labelFont(10))
        .tracking(0.8)
        .foregroundColor(Theme.ink3)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.surface2)
    }
    
    private func holeRow(hole: RoundHole, isEven: Bool) -> some View {
        HStack(spacing: 0) {
            Text("\(hole.holeNumber)")
                .font(Theme.statFont(13))
                .frame(width: 45, alignment: .leading)
            
            Text("\(hole.par)")
                .font(Theme.labelFont(12))
                .frame(width: 35)
            
            Text("\(hole.handicapIndex)")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
                .frame(width: 30)
            
            Text(hole.strokesReceived > 0 ? "\(hole.strokesReceived)" : "-")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.warn)
                .frame(width: 25)
            
            if let gross = hole.grossStrokes {
                Text("\(gross)")
                    .font(Theme.statFont(14))
                    .foregroundColor(scoreColor(strokes: gross, par: hole.par))
                    .frame(width: 50)
            } else {
                Text("-")
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.ink3)
                    .frame(width: 50)
            }
            
            if let net = hole.netStrokes {
                Text("\(net)")
                    .font(Theme.statFont(12))
                    .foregroundColor(Theme.accent)
                    .frame(width: 45)
            } else {
                Text("-")
                    .font(Theme.statFont(12))
                    .foregroundColor(Theme.ink3)
                    .frame(width: 45)
            }
            
            Spacer()
        }
        .foregroundColor(Theme.ink)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(isEven ? Theme.surface2.opacity(0.75) : Theme.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.line).frame(height: 1)
        }
    }
    
    private func subtotalRow(holes: [RoundHole], label: String) -> some View {
        let grossSum = holes.compactMap { $0.grossStrokes }.reduce(0, +)
        let netSum = holes.compactMap { $0.netStrokes }.reduce(0, +)
        let parSum = holes.reduce(0) { $0 + $1.par }
        
        return HStack(spacing: 0) {
            Text(label)
                .font(Theme.labelFont(12))
                .tracking(1.4)
                .frame(width: 45, alignment: .leading)
            
            Text("\(parSum)")
                .font(Theme.labelFont(12))
                .frame(width: 35)
            
            Spacer()
                .frame(width: 55)
            
            Text("\(grossSum)")
                .font(Theme.statFont(14))
                .frame(width: 50)
            
            Text("\(netSum)")
                .font(Theme.statFont(12))
                .foregroundColor(Theme.accent)
                .frame(width: 45)
            
            Spacer()
        }
        .foregroundColor(Theme.ink)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Theme.surface3)
    }
    
    private var totalRow: some View {
        HStack(spacing: 0) {
            Text("TOTAL")
                .font(Theme.labelFont(13))
                .tracking(1.4)
                .frame(width: 45, alignment: .leading)
            
            Text("\(round.playedHoles.reduce(0) { $0 + $1.par })")
                .font(Theme.labelFont(13))
                .frame(width: 35)
            
            Spacer()
                .frame(width: 55)
            
            Text("\(round.grossTotal)")
                .font(Theme.statFont(18))
                .frame(width: 50)
            
            Text("\(round.netTotal)")
                .font(Theme.statFont(14))
                .foregroundColor(Theme.accent)
                .frame(width: 45)
            
            Spacer()
        }
        .foregroundColor(Theme.ink)
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .background(Theme.accent.opacity(0.08))
        .overlay(Rectangle().stroke(Theme.accent.opacity(0.5), lineWidth: 1))
    }
    
    private func scoreColor(strokes: Int, par: Int) -> Color {
        let diff = strokes - par
        if diff < 0 {
            return Theme.accent
        } else if diff == 0 {
            return Theme.ink
        } else {
            return Theme.bad
        }
    }
}

// MARK: - Landscape Cell Modifiers

extension Text {
    func landscapeLabelCell() -> some View {
        self
            .frame(width: 50, alignment: .leading)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(Theme.surface3)
    }
    
    func landscapeCell(highlight: Bool) -> some View {
        self
            .frame(width: 40)
            .padding(.vertical, 6)
            .background(highlight ? Theme.surface2.opacity(0.75) : Color.clear)
    }
    
    func landscapeScoreCell(strokes: Int, par: Int, highlight: Bool) -> some View {
        let diff = strokes - par
        let color: Color = diff < 0 ? Theme.accent : (diff > 0 ? Theme.bad : Theme.ink)
        
        return self
            .foregroundColor(color)
            .frame(width: 40)
            .padding(.vertical, 6)
            .background(highlight ? Theme.surface2.opacity(0.75) : Color.clear)
    }
    
    func landscapeTotalCell(isFinal: Bool = false) -> some View {
        self
            .frame(width: isFinal ? 45 : 40)
            .padding(.vertical, 6)
            .background(isFinal ? Theme.accent.opacity(0.16) : Theme.surface3)
    }
}

#Preview {
    NavigationStack {
        FullScorecardView(
            round: Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            )
        )
    }
}
