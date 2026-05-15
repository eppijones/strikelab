//
//  ScorecardExportView.swift
//  StrikeLabCaddie
//
//  Styled scorecard view optimized for image export (portrait and landscape)
//

import SwiftUI

/// A scorecard view designed for rendering as a shareable image (Portrait)
struct ScorecardExportView: View {
    let round: Round
    
    private let cardWidth: CGFloat = 400
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with branding
            headerSection
            
            // Player & round info
            infoSection
            
            // Scorecard table
            scorecardTable
            
            // Summary
            summarySection
            
            // Footer
            footerSection
        }
        .frame(width: cardWidth)
        .background(Theme.nordicPaper)
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        VStack(spacing: 4) {
            Text("STRIKELAB")
                .font(.system(size: 12, weight: .bold, design: .default))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .tracking(3)
            
            Text("StrikeLabCaddie")
                .font(.system(size: 24, weight: .heavy))
                .foregroundColor(Theme.nordicForest)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Theme.champagne.opacity(0.3))
    }
    
    // MARK: - Info Section
    
    private var infoSection: some View {
        VStack(spacing: 8) {
            Text(round.course.name)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(Theme.nordicForest)
            
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
            }
            .font(.system(size: 12))
            .foregroundColor(Theme.nordicForest.opacity(0.7))
            
            Text(round.player.name)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Theme.nordicForest)
            
            if let ch = round.courseHandicap {
                Text("Course Handicap: \(ch)")
                    .font(.system(size: 11))
                    .foregroundColor(Theme.champagne)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.5))
    }
    
    // MARK: - Scorecard Table
    
    private var scorecardTable: some View {
        VStack(spacing: 0) {
            tableHeaderRow

            ForEach(Array(scorecardSections.enumerated()), id: \.offset) { _, section in
                ForEach(section.holes) { hole in
                    holeRow(hole: hole)
                }
                subtotalRow(holes: section.holes, label: section.label)
            }

            totalRow
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var scorecardSections: [(label: String, holes: [RoundHole])] {
        switch round.playFormat {
        case .full18:
            return [("OUT", Array(round.holes.prefix(9))), ("IN", Array(round.holes.suffix(9)))]
        case .front9:
            return [("OUT", Array(round.holes.prefix(9)))]
        case .back9:
            return [("IN", Array(round.holes.suffix(9)))]
        }
    }
    
    private var tableHeaderRow: some View {
        HStack(spacing: 0) {
            Text("Hole")
                .frame(width: 40, alignment: .leading)
            Text("Par")
                .frame(width: 30)
            Text("HI")
                .frame(width: 25)
            Text("+")
                .frame(width: 20)
            Text("Gross")
                .frame(width: 45)
            Text("Net")
                .frame(width: 40)
            Spacer()
        }
        .font(.system(size: 9, weight: .medium))
        .foregroundColor(Theme.nordicForest.opacity(0.5))
        .padding(.vertical, 6)
        .padding(.horizontal, 8)
    }
    
    private func holeRow(hole: RoundHole) -> some View {
        HStack(spacing: 0) {
            Text("\(hole.holeNumber)")
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .frame(width: 40, alignment: .leading)
            
            Text("\(hole.par)")
                .font(.system(size: 10))
                .frame(width: 30)
            
            Text("\(hole.handicapIndex)")
                .font(.system(size: 9))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
                .frame(width: 25)
            
            Text(hole.strokesReceived > 0 ? "\(hole.strokesReceived)" : "-")
                .font(.system(size: 9))
                .foregroundColor(Theme.champagne)
                .frame(width: 20)
            
            if let gross = hole.grossStrokes {
                Text("\(gross)")
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundColor(scoreColor(strokes: gross, par: hole.par))
                    .frame(width: 45)
            } else {
                Text("–")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(Theme.neutral)
                    .frame(width: 45)
            }
            
            if let net = hole.netStrokes {
                Text("\(net)")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(Theme.nordicSage)
                    .frame(width: 40)
            } else {
                Text("–")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(Theme.neutral)
                    .frame(width: 40)
            }
            
            Spacer()
        }
        .foregroundColor(Theme.nordicForest)
        .padding(.vertical, 4)
        .padding(.horizontal, 8)
        .background(hole.holeNumber % 2 == 0 ? Color.white.opacity(0.3) : Color.clear)
    }
    
    private func subtotalRow(holes: [RoundHole], label: String) -> some View {
        let grossSum = holes.compactMap { $0.grossStrokes }.reduce(0, +)
        let netSum = holes.compactMap { $0.netStrokes }.reduce(0, +)
        let parSum = holes.reduce(0) { $0 + $1.par }
        
        return HStack(spacing: 0) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .frame(width: 40, alignment: .leading)
            
            Text("\(parSum)")
                .font(.system(size: 10))
                .frame(width: 30)
            
            Spacer()
                .frame(width: 45)
            
            Text("\(grossSum)")
                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                .frame(width: 45)
            
            Text("\(netSum)")
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(Theme.nordicSage)
                .frame(width: 40)
            
            Spacer()
        }
        .foregroundColor(Theme.nordicForest)
        .padding(.vertical, 6)
        .padding(.horizontal, 8)
        .background(Theme.champagne.opacity(0.2))
    }
    
    private var totalRow: some View {
        HStack(spacing: 0) {
            Text("TOTAL")
                .font(.system(size: 10, weight: .bold))
                .frame(width: 40, alignment: .leading)
            
            Text("\(round.playedHoles.reduce(0) { $0 + $1.par })")
                .font(.system(size: 10, weight: .semibold))
                .frame(width: 30)
            
            Spacer()
                .frame(width: 45)
            
            Text("\(round.grossTotal)")
                .font(.system(size: 14, weight: .bold, design: .monospaced))
                .frame(width: 45)
            
            Text("\(round.netTotal)")
                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                .foregroundColor(Theme.nordicSage)
                .frame(width: 40)
            
            Spacer()
        }
        .foregroundColor(Theme.nordicForest)
        .padding(.vertical, 8)
        .padding(.horizontal, 8)
        .background(Theme.nordicForest.opacity(0.1))
    }
    
    // MARK: - Summary Section
    
    private var summarySection: some View {
        HStack(spacing: 0) {
            VStack(spacing: 2) {
                Text("GROSS")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(round.grossTotal)")
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicForest)
            }
            .frame(maxWidth: .infinity)
            
            VStack(spacing: 2) {
                Text("TO PAR")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text(round.formattedOverUnder)
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundColor(overUnderColor)
            }
            .frame(maxWidth: .infinity)
            
            VStack(spacing: 2) {
                Text("NET")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(round.netTotal)")
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicSage)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.6))
    }
    
    // MARK: - Footer
    
    private var footerSection: some View {
        HStack {
            Text("strikelab.golf")
                .font(.system(size: 10))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
            
            Spacer()
            
            Text("Powered by StrikeLabCaddie")
                .font(.system(size: 10))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Theme.nordicForest.opacity(0.05))
    }
    
    // MARK: - Helpers
    
    private func scoreColor(strokes: Int, par: Int) -> Color {
        let diff = strokes - par
        if diff < 0 {
            return Theme.nordicSage
        } else if diff == 0 {
            return Theme.nordicForest
        } else {
            return Theme.overPar
        }
    }
    
    private var overUnderColor: Color {
        if round.grossOverUnder < 0 {
            return Theme.nordicSage
        } else if round.grossOverUnder > 0 {
            return Theme.overPar
        }
        return Theme.nordicForest
    }
}

// MARK: - Landscape Export View

/// A landscape scorecard view designed for traditional golf card layout export
struct ScorecardExportLandscapeView: View {
    let round: Round
    
    private var cardWidth: CGFloat { round.playFormat == .full18 ? 900 : 560 }
    private let cardHeight: CGFloat = 500
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            landscapeHeader
            
            // Traditional landscape scorecard
            landscapeScorecardTable
            
            // Summary
            landscapeSummary
            
            // Footer
            landscapeFooter
        }
        .frame(width: cardWidth, height: cardHeight)
        .background(Theme.nordicPaper)
    }
    
    // MARK: - Header
    
    private var landscapeHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("STRIKELAB")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                    .tracking(2)
                Text("StrikeLabCaddie")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(Theme.nordicForest)
            }
            
            Spacer()
            
            VStack(alignment: .center, spacing: 2) {
                Text(round.course.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Theme.nordicForest)
                
                HStack(spacing: 12) {
                    Text(round.date, style: .date)
                    if let tee = round.selectedTee {
                        Text("•")
                        Text(tee.name)
                    }
                }
                .font(.system(size: 11))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(round.player.name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Theme.nordicForest)
                if let ch = round.courseHandicap {
                    Text("CH: \(ch)")
                        .font(.system(size: 11))
                        .foregroundColor(Theme.champagne)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Theme.champagne.opacity(0.2))
    }
    
    // MARK: - Landscape Scorecard Table
    
    private var landscapeScorecardTable: some View {
        VStack(spacing: 0) {
            landscapeRowBuilder(label: "HOLE", isHeader: true) { "\($0.holeNumber)" }
            
            landscapeRowBuilder(
                label: "PAR",
                sectionTotal: { "\($0.reduce(0) { $0 + $1.par })" },
                grandTotal: "\(round.playedHoles.reduce(0) { $0 + $1.par })"
            ) { "\($0.par)" }
            
            landscapeRowBuilder(
                label: "HI",
                isSubtle: true
            ) { "\($0.handicapIndex)" }
            
            landscapeRowBuilder(
                label: "+",
                sectionTotal: { "\($0.reduce(0) { $0 + $1.strokesReceived })" },
                grandTotal: "\(round.courseHandicap ?? 0)",
                isSubtle: true,
                subtleColor: Theme.champagne
            ) { $0.strokesReceived > 0 ? "\($0.strokesReceived)" : "-" }
            
            landscapeGrossRow
            landscapeNetRow
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }

    private var scorecardSections: [(label: String, holes: [RoundHole])] {
        switch round.playFormat {
        case .full18:
            return [("OUT", Array(round.holes.prefix(9))), ("IN", Array(round.holes.suffix(9)))]
        case .front9:
            return [("OUT", Array(round.holes.prefix(9)))]
        case .back9:
            return [("IN", Array(round.holes.suffix(9)))]
        }
    }
    
    private func landscapeRowBuilder(
        label: String,
        sectionTotal: (([RoundHole]) -> String)? = nil,
        grandTotal: String = "",
        isHeader: Bool = false,
        isSubtle: Bool = false,
        subtleColor: Color = Theme.nordicForest.opacity(0.5),
        value: @escaping (RoundHole) -> String
    ) -> some View {
        HStack(spacing: 0) {
            Text(label)
                .font(.system(size: 9, weight: isHeader ? .bold : .medium))
                .frame(width: 45, alignment: .leading)
                .foregroundColor(isSubtle ? subtleColor : Theme.nordicForest)
            
            ForEach(Array(scorecardSections.enumerated()), id: \.offset) { _, section in
                ForEach(section.holes) { hole in
                    Text(value(hole))
                        .font(.system(size: isHeader ? 10 : 9, weight: isHeader ? .bold : .regular))
                        .frame(width: 38)
                        .foregroundColor(isSubtle ? subtleColor : Theme.nordicForest)
                }

                Text(sectionTotal?(section.holes) ?? section.label)
                    .font(.system(size: 10, weight: .semibold))
                    .frame(width: 38)
                    .foregroundColor(Theme.nordicForest)
                    .background(Theme.champagne.opacity(0.15))
            }

            if round.playFormat == .full18 {
                Text(grandTotal)
                    .font(.system(size: 10, weight: .bold))
                    .frame(width: 42)
                    .foregroundColor(Theme.nordicForest)
                    .background(Theme.nordicForest.opacity(0.1))
            }
        }
        .padding(.vertical, 4)
        .background(isHeader ? Theme.champagne.opacity(0.2) : Color.clear)
    }
    
    private var landscapeGrossRow: some View {
        HStack(spacing: 0) {
            Text("GROSS")
                .font(.system(size: 9, weight: .semibold))
                .frame(width: 45, alignment: .leading)
                .foregroundColor(Theme.nordicForest)
            
            ForEach(Array(scorecardSections.enumerated()), id: \.offset) { _, section in
                ForEach(section.holes) { hole in
                    if let gross = hole.grossStrokes {
                        Text("\(gross)")
                            .font(.system(size: 11, weight: .semibold, design: .monospaced))
                            .frame(width: 38)
                            .foregroundColor(scoreColor(strokes: gross, par: hole.par))
                    } else {
                        Text("-")
                            .font(.system(size: 11))
                            .frame(width: 38)
                            .foregroundColor(Theme.neutral)
                    }
                }

                Text("\(section.holes.compactMap { $0.grossStrokes }.reduce(0, +))")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .frame(width: 38)
                    .foregroundColor(Theme.nordicForest)
                    .background(Theme.champagne.opacity(0.15))
            }

            if round.playFormat == .full18 {
                Text("\(round.grossTotal)")
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .frame(width: 42)
                    .foregroundColor(Theme.nordicForest)
                    .background(Theme.nordicForest.opacity(0.1))
            }
        }
        .padding(.vertical, 5)
    }
    
    private var landscapeNetRow: some View {
        HStack(spacing: 0) {
            Text("NET")
                .font(.system(size: 9, weight: .semibold))
                .frame(width: 45, alignment: .leading)
                .foregroundColor(Theme.nordicSage)
            
            ForEach(Array(scorecardSections.enumerated()), id: \.offset) { _, section in
                ForEach(section.holes) { hole in
                    if let net = hole.netStrokes {
                        Text("\(net)")
                            .font(.system(size: 10, design: .monospaced))
                            .frame(width: 38)
                            .foregroundColor(Theme.nordicSage)
                    } else {
                        Text("-")
                            .font(.system(size: 10))
                            .frame(width: 38)
                            .foregroundColor(Theme.neutral)
                    }
                }

                Text("\(section.holes.compactMap { $0.netStrokes }.reduce(0, +))")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .frame(width: 38)
                    .foregroundColor(Theme.nordicSage)
                    .background(Theme.champagne.opacity(0.15))
            }

            if round.playFormat == .full18 {
                Text("\(round.netTotal)")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .frame(width: 42)
                    .foregroundColor(Theme.nordicSage)
                    .background(Theme.nordicForest.opacity(0.1))
            }
        }
        .padding(.vertical, 5)
        .background(Theme.nordicSage.opacity(0.08))
    }
    
    // MARK: - Summary
    
    private var landscapeSummary: some View {
        HStack(spacing: 40) {
            VStack(spacing: 2) {
                Text("GROSS")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text("\(round.grossTotal)")
                    .font(.system(size: 36, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicForest)
            }
            
            VStack(spacing: 2) {
                Text("TO PAR")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text(round.formattedOverUnder)
                    .font(.system(size: 36, weight: .bold, design: .monospaced))
                    .foregroundColor(overUnderColor)
            }
            
            VStack(spacing: 2) {
                Text("NET")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text("\(round.netTotal)")
                    .font(.system(size: 36, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicSage)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.5))
    }
    
    // MARK: - Footer
    
    private var landscapeFooter: some View {
        HStack {
            Text("strikelab.golf")
                .font(.system(size: 10))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
            
            Spacer()
            
            Text("Powered by StrikeLabCaddie")
                .font(.system(size: 10))
                .foregroundColor(Theme.nordicForest.opacity(0.4))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
        .background(Theme.nordicForest.opacity(0.05))
    }
    
    private var overUnderColor: Color {
        if round.grossOverUnder < 0 {
            return Theme.nordicSage
        } else if round.grossOverUnder > 0 {
            return Theme.overPar
        }
        return Theme.nordicForest
    }
    
    private func scoreColor(strokes: Int, par: Int) -> Color {
        let diff = strokes - par
        if diff < 0 {
            return Theme.nordicSage
        } else if diff == 0 {
            return Theme.nordicForest
        } else {
            return Theme.overPar
        }
    }
}

// MARK: - Image Renderer

@MainActor
struct ScorecardImageRenderer {
    
    /// Render a portrait scorecard as a shareable UIImage
    static func renderImage(for round: Round) -> UIImage? {
        let view = ScorecardExportView(round: round)
        let renderer = ImageRenderer(content: view)
        renderer.scale = 3.0 // High resolution for sharing
        return renderer.uiImage
    }
    
    /// Render a landscape scorecard as a shareable UIImage
    static func renderLandscapeImage(for round: Round) -> UIImage? {
        let view = ScorecardExportLandscapeView(round: round)
        let renderer = ImageRenderer(content: view)
        renderer.scale = 3.0 // High resolution for sharing
        return renderer.uiImage
    }
    
    /// Share scorecard image via system share sheet (portrait)
    static func shareScorecard(for round: Round) -> UIImage? {
        return renderImage(for: round)
    }
    
    /// Share landscape scorecard image
    static func shareLandscapeScorecard(for round: Round) -> UIImage? {
        return renderLandscapeImage(for: round)
    }
}

// MARK: - Share Sheet

/// UIKit share sheet wrapper for SwiftUI
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: items,
            applicationActivities: nil
        )
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    ScrollView {
        ScorecardExportView(
            round: Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            )
        )
    }
    .background(Color.gray.opacity(0.3))
}
