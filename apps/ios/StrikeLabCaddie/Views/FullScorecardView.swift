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
                        .foregroundColor(Theme.nordicForest)
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
            // Header
            scorecardHeader
            
            // Score summary
            scoreSummaryRow
            
            // Front 9
            VStack(spacing: 0) {
                sectionHeader("FRONT 9")
                columnHeaders
                ForEach(0..<9, id: \.self) { index in
                    holeRow(hole: round.holes[index], isEven: index % 2 == 0)
                }
                subtotalRow(holes: Array(round.holes.prefix(9)), label: "OUT")
            }
            .background(Color.white.opacity(0.5))
            .cornerRadius(12)
            
            // Back 9
            VStack(spacing: 0) {
                sectionHeader("BACK 9")
                columnHeaders
                ForEach(9..<18, id: \.self) { index in
                    holeRow(hole: round.holes[index], isEven: (index - 9) % 2 == 0)
                }
                subtotalRow(holes: Array(round.holes.suffix(9)), label: "IN")
            }
            .background(Color.white.opacity(0.5))
            .cornerRadius(12)
            
            // Total
            totalRow
            
            Spacer(minLength: 40)
        }
        .padding()
        .frame(minWidth: geometry.size.width)
    }
    
    // MARK: - Landscape Scorecard (Traditional Golf Card Layout)
    
    private func landscapeScorecard(geometry: GeometryProxy) -> some View {
        VStack(spacing: 16) {
            // Header
            scorecardHeader
            
            // Traditional landscape scorecard table
            VStack(spacing: 0) {
                // Hole numbers row
                landscapeHoleRow()
                
                // Par row
                landscapeParRow()
                
                // HI row
                landscapeHIRow()
                
                // Strokes received row
                landscapeStrokesRow()
                
                // Gross score row
                landscapeGrossRow()
                
                // Net score row
                landscapeNetRow()
            }
            .background(Color.white.opacity(0.6))
            .cornerRadius(12)
            .padding(.horizontal)
            
            // Score summary
            scoreSummaryRow
            
            Spacer(minLength: 20)
        }
        .padding()
        .frame(minWidth: max(geometry.size.width, 900))
    }
    
    // MARK: - Landscape Row Components
    
    private func landscapeHoleRow() -> some View {
        HStack(spacing: 0) {
            Text("HOLE")
                .landscapeLabelCell()
            
            ForEach(1...9, id: \.self) { hole in
                Text("\(hole)")
                    .landscapeCell(highlight: false)
            }
            
            Text("OUT")
                .landscapeTotalCell()
            
            ForEach(10...18, id: \.self) { hole in
                Text("\(hole)")
                    .landscapeCell(highlight: false)
            }
            
            Text("IN")
                .landscapeTotalCell()
            
            Text("TOT")
                .landscapeTotalCell(isFinal: true)
        }
        .font(.system(size: 11, weight: .bold))
        .foregroundColor(Theme.nordicForest)
        .background(Theme.champagne.opacity(0.3))
    }
    
    private func landscapeParRow() -> some View {
        let front9Par = round.holes.prefix(9).reduce(0) { $0 + $1.par }
        let back9Par = round.holes.suffix(9).reduce(0) { $0 + $1.par }
        
        return HStack(spacing: 0) {
            Text("PAR")
                .landscapeLabelCell()
            
            ForEach(0..<9, id: \.self) { index in
                Text("\(round.holes[index].par)")
                    .landscapeCell(highlight: index % 2 == 0)
            }
            
            Text("\(front9Par)")
                .landscapeTotalCell()
            
            ForEach(9..<18, id: \.self) { index in
                Text("\(round.holes[index].par)")
                    .landscapeCell(highlight: (index - 9) % 2 == 0)
            }
            
            Text("\(back9Par)")
                .landscapeTotalCell()
            
            Text("\(round.course.totalPar)")
                .landscapeTotalCell(isFinal: true)
        }
        .font(.system(size: 11))
        .foregroundColor(Theme.nordicForest)
    }
    
    private func landscapeHIRow() -> some View {
        HStack(spacing: 0) {
            Text("HI")
                .landscapeLabelCell()
            
            ForEach(0..<9, id: \.self) { index in
                Text("\(round.holes[index].handicapIndex)")
                    .landscapeCell(highlight: index % 2 == 0)
            }
            
            Text("")
                .landscapeTotalCell()
            
            ForEach(9..<18, id: \.self) { index in
                Text("\(round.holes[index].handicapIndex)")
                    .landscapeCell(highlight: (index - 9) % 2 == 0)
            }
            
            Text("")
                .landscapeTotalCell()
            
            Text("")
                .landscapeTotalCell(isFinal: true)
        }
        .font(.system(size: 10))
        .foregroundColor(Theme.nordicForest.opacity(0.5))
    }
    
    private func landscapeStrokesRow() -> some View {
        let front9Strokes = round.holes.prefix(9).reduce(0) { $0 + $1.strokesReceived }
        let back9Strokes = round.holes.suffix(9).reduce(0) { $0 + $1.strokesReceived }
        
        return HStack(spacing: 0) {
            Text("+")
                .landscapeLabelCell()
            
            ForEach(0..<9, id: \.self) { index in
                Text(round.holes[index].strokesReceived > 0 ? "\(round.holes[index].strokesReceived)" : "-")
                    .landscapeCell(highlight: index % 2 == 0)
            }
            
            Text("\(front9Strokes)")
                .landscapeTotalCell()
            
            ForEach(9..<18, id: \.self) { index in
                Text(round.holes[index].strokesReceived > 0 ? "\(round.holes[index].strokesReceived)" : "-")
                    .landscapeCell(highlight: (index - 9) % 2 == 0)
            }
            
            Text("\(back9Strokes)")
                .landscapeTotalCell()
            
            Text("\(round.courseHandicap ?? 0)")
                .landscapeTotalCell(isFinal: true)
        }
        .font(.system(size: 10))
        .foregroundColor(Theme.champagne)
    }
    
    private func landscapeGrossRow() -> some View {
        let front9Gross = round.holes.prefix(9).compactMap { $0.grossStrokes }.reduce(0, +)
        let back9Gross = round.holes.suffix(9).compactMap { $0.grossStrokes }.reduce(0, +)
        
        return HStack(spacing: 0) {
            Text("GROSS")
                .landscapeLabelCell()
            
            ForEach(0..<9, id: \.self) { index in
                let hole = round.holes[index]
                if let gross = hole.grossStrokes {
                    Text("\(gross)")
                        .landscapeScoreCell(strokes: gross, par: hole.par, highlight: index % 2 == 0)
                } else {
                    Text("-")
                        .landscapeCell(highlight: index % 2 == 0)
                }
            }
            
            Text("\(front9Gross)")
                .landscapeTotalCell()
            
            ForEach(9..<18, id: \.self) { index in
                let hole = round.holes[index]
                if let gross = hole.grossStrokes {
                    Text("\(gross)")
                        .landscapeScoreCell(strokes: gross, par: hole.par, highlight: (index - 9) % 2 == 0)
                } else {
                    Text("-")
                        .landscapeCell(highlight: (index - 9) % 2 == 0)
                }
            }
            
            Text("\(back9Gross)")
                .landscapeTotalCell()
            
            Text("\(round.grossTotal)")
                .font(.system(size: 14, weight: .bold))
                .landscapeTotalCell(isFinal: true)
        }
        .font(.system(size: 12, weight: .semibold))
        .foregroundColor(Theme.nordicForest)
    }
    
    private func landscapeNetRow() -> some View {
        let front9Net = round.holes.prefix(9).compactMap { $0.netStrokes }.reduce(0, +)
        let back9Net = round.holes.suffix(9).compactMap { $0.netStrokes }.reduce(0, +)
        
        return HStack(spacing: 0) {
            Text("NET")
                .landscapeLabelCell()
            
            ForEach(0..<9, id: \.self) { index in
                let hole = round.holes[index]
                if let net = hole.netStrokes {
                    Text("\(net)")
                        .landscapeCell(highlight: index % 2 == 0)
                } else {
                    Text("-")
                        .landscapeCell(highlight: index % 2 == 0)
                }
            }
            
            Text("\(front9Net)")
                .landscapeTotalCell()
            
            ForEach(9..<18, id: \.self) { index in
                let hole = round.holes[index]
                if let net = hole.netStrokes {
                    Text("\(net)")
                        .landscapeCell(highlight: (index - 9) % 2 == 0)
                } else {
                    Text("-")
                        .landscapeCell(highlight: (index - 9) % 2 == 0)
                }
            }
            
            Text("\(back9Net)")
                .landscapeTotalCell()
            
            Text("\(round.netTotal)")
                .font(.system(size: 13, weight: .semibold))
                .landscapeTotalCell(isFinal: true)
        }
        .font(.system(size: 11))
        .foregroundColor(Theme.nordicSage)
        .background(Theme.nordicSage.opacity(0.1))
    }
    
    // MARK: - Shared Components
    
    private var scorecardHeader: some View {
        VStack(spacing: 8) {
            Text(round.course.name)
                .font(.system(size: 22, weight: .bold))
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
                
                Label {
                    Text(round.player.name)
                } icon: {
                    Image(systemName: "person.fill")
                }
            }
            .font(.system(size: 13))
            .foregroundColor(Theme.nordicForest.opacity(0.7))
            
            if let ch = round.courseHandicap {
                Text("Course Handicap: \(ch)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Theme.champagne)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }
    
    private var scoreSummaryRow: some View {
        HStack(spacing: 0) {
            VStack(spacing: 4) {
                Text("GROSS")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text("\(round.grossTotal)")
                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicForest)
            }
            .frame(maxWidth: .infinity)
            
            Divider().frame(height: 50)
            
            VStack(spacing: 4) {
                Text("TO PAR")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text(round.formattedOverUnder)
                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                    .foregroundColor(overUnderColor)
            }
            .frame(maxWidth: .infinity)
            
            Divider().frame(height: 50)
            
            VStack(spacing: 4) {
                Text("NET")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Text("\(round.netTotal)")
                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                    .foregroundColor(Theme.nordicSage)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.6))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private var overUnderColor: Color {
        if round.grossOverUnder < 0 {
            return Theme.nordicSage
        } else if round.grossOverUnder > 0 {
            return Theme.overPar
        }
        return Theme.nordicForest
    }
    
    // MARK: - Portrait Components
    
    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.champagne.opacity(0.2))
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
        .font(.system(size: 10, weight: .medium))
        .foregroundColor(Theme.nordicForest.opacity(0.5))
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }
    
    private func holeRow(hole: RoundHole, isEven: Bool) -> some View {
        HStack(spacing: 0) {
            Text("\(hole.holeNumber)")
                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                .frame(width: 45, alignment: .leading)
            
            Text("\(hole.par)")
                .font(.system(size: 12))
                .frame(width: 35)
            
            Text("\(hole.handicapIndex)")
                .font(.system(size: 10))
                .foregroundColor(Theme.nordicForest.opacity(0.5))
                .frame(width: 30)
            
            Text(hole.strokesReceived > 0 ? "\(hole.strokesReceived)" : "-")
                .font(.system(size: 10))
                .foregroundColor(Theme.champagne)
                .frame(width: 25)
            
            if let gross = hole.grossStrokes {
                Text("\(gross)")
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundColor(scoreColor(strokes: gross, par: hole.par))
                    .frame(width: 50)
            } else {
                Text("-")
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(Theme.neutral)
                    .frame(width: 50)
            }
            
            if let net = hole.netStrokes {
                Text("\(net)")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(Theme.nordicSage)
                    .frame(width: 45)
            } else {
                Text("-")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(Theme.neutral)
                    .frame(width: 45)
            }
            
            Spacer()
        }
        .foregroundColor(Theme.nordicForest)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(isEven ? Color.white.opacity(0.3) : Color.clear)
    }
    
    private func subtotalRow(holes: [RoundHole], label: String) -> some View {
        let grossSum = holes.compactMap { $0.grossStrokes }.reduce(0, +)
        let netSum = holes.compactMap { $0.netStrokes }.reduce(0, +)
        let parSum = holes.reduce(0) { $0 + $1.par }
        
        return HStack(spacing: 0) {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .frame(width: 45, alignment: .leading)
            
            Text("\(parSum)")
                .font(.system(size: 12))
                .frame(width: 35)
            
            Spacer()
                .frame(width: 55)
            
            Text("\(grossSum)")
                .font(.system(size: 14, weight: .semibold, design: .monospaced))
                .frame(width: 50)
            
            Text("\(netSum)")
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(Theme.nordicSage)
                .frame(width: 45)
            
            Spacer()
        }
        .foregroundColor(Theme.nordicForest)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.champagne.opacity(0.3))
    }
    
    private var totalRow: some View {
        HStack(spacing: 0) {
            Text("TOTAL")
                .font(.system(size: 14, weight: .bold))
                .frame(width: 45, alignment: .leading)
            
            Text("\(round.course.totalPar)")
                .font(.system(size: 14, weight: .semibold))
                .frame(width: 35)
            
            Spacer()
                .frame(width: 55)
            
            Text("\(round.grossTotal)")
                .font(.system(size: 18, weight: .bold, design: .monospaced))
                .frame(width: 50)
            
            Text("\(round.netTotal)")
                .font(.system(size: 14, weight: .semibold, design: .monospaced))
                .foregroundColor(Theme.nordicSage)
                .frame(width: 45)
            
            Spacer()
        }
        .foregroundColor(Theme.nordicForest)
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .background(Theme.nordicForest.opacity(0.1))
        .cornerRadius(12)
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

// MARK: - Landscape Cell Modifiers

extension Text {
    func landscapeLabelCell() -> some View {
        self
            .frame(width: 50, alignment: .leading)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(Theme.nordicForest.opacity(0.05))
    }
    
    func landscapeCell(highlight: Bool) -> some View {
        self
            .frame(width: 40)
            .padding(.vertical, 6)
            .background(highlight ? Color.white.opacity(0.3) : Color.clear)
    }
    
    func landscapeScoreCell(strokes: Int, par: Int, highlight: Bool) -> some View {
        let diff = strokes - par
        let color: Color = diff < 0 ? Theme.nordicSage : (diff > 0 ? Theme.overPar : Theme.nordicForest)
        
        return self
            .foregroundColor(color)
            .frame(width: 40)
            .padding(.vertical, 6)
            .background(highlight ? Color.white.opacity(0.3) : Color.clear)
    }
    
    func landscapeTotalCell(isFinal: Bool = false) -> some View {
        self
            .frame(width: isFinal ? 45 : 40)
            .padding(.vertical, 6)
            .background(isFinal ? Theme.nordicForest.opacity(0.1) : Theme.champagne.opacity(0.15))
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
