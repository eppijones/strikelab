//
//  ScorecardView.swift
//  StrikeLabCaddie
//
//  18-hole scorecard view
//

import SwiftUI

struct ScorecardView: View {
    @Binding var round: Round
    var isReadOnly: Bool = false
    
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    
    @State private var selectedHole: RoundHole?
    @State private var showHoleDetail = false
    @State private var showEndRoundAlert = false
    @State private var showShareSheet = false
    @State private var showFullScorecard = false
    @State private var scorecardImage: UIImage?
    @State private var quickEntryHole: RoundHole?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Score summary header
                scoreSummaryCard

                // Per-format sections — show only the nines being played.
                let format = round.playFormat
                if format == .full18 || format == .front9 {
                    nineHolesSection(title: "FRONT 9", holes: Array(round.holes.prefix(9)), startHole: 1)
                    subtotalRow(holes: Array(round.holes.prefix(9)), label: "OUT")
                }

                if format == .full18 || format == .back9 {
                    nineHolesSection(title: "BACK 9", holes: Array(round.holes.suffix(9)), startHole: 10)
                    subtotalRow(holes: Array(round.holes.suffix(9)), label: "IN")
                }

                // Total
                totalRow

                // Action buttons
                actionButtons

                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle(round.course.name)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedHole) { hole in
            NavigationStack {
                HoleDetailView(
                    roundHole: Binding(
                        get: {
                            round.holes.first { $0.id == hole.id } ?? hole
                        },
                        set: { updated in
                            if let index = round.holes.firstIndex(where: { $0.id == updated.id }) {
                                round.holes[index] = updated
                            }
                        }
                    ),
                    round: $round
                )
            }
            .presentationDetents([.medium, .large])
        }
        .alert("End Round?", isPresented: $showEndRoundAlert) {
            Button("Save & Complete", role: .destructive) {
                persistenceManager.completeCurrentRound()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will save your round and end the session.")
        }
        .toolbar {
            if isReadOnly {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(Theme.neuralCyan)
                }
            }
            
            // Share button (shown for completed rounds or read-only view)
            if isReadOnly || round.isComplete || round.holesCompleted > 0 {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        shareScorecard()
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(Theme.nordicForest)
                    }
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let image = scorecardImage {
                ShareSheet(items: [image])
            }
        }
        .sheet(isPresented: $showFullScorecard) {
            NavigationStack {
                FullScorecardView(round: round)
            }
        }
        .sheet(item: $quickEntryHole) { hole in
            ScorePadSheet(
                par: hole.par,
                strokesReceived: hole.strokesReceived,
                initialScore: hole.grossStrokes
            ) { newValue in
                applyScore(newValue, to: hole)
            }
        }
    }

    /// Single source of truth for committing a score from the quick-entry
    /// sheet. Resolves the hole binding by id and recalculates net.
    private func applyScore(_ value: Int?, to hole: RoundHole) {
        guard let idx = round.holes.firstIndex(where: { $0.id == hole.id }) else { return }
        round.holes[idx].grossStrokes = value
        round.holes[idx].recalculateNet()
        persistenceManager.saveCurrentRound()
    }
    
    // MARK: - Share Functionality
    
    private func shareScorecard() {
        scorecardImage = ScorecardImageRenderer.renderImage(for: round)
        if scorecardImage != nil {
            showShareSheet = true
        }
    }
    
    // MARK: - Score Summary Card
    
    private var scoreSummaryCard: some View {
        HStack(spacing: 0) {
            scoreTile(label: "Gross", value: "\(round.grossTotal)", tint: Theme.ink)
            verticalDivider
            scoreTile(label: "To Par", value: round.formattedOverUnder, tint: scoreColor)
            verticalDivider
            scoreTile(label: "Net", value: "\(round.netTotal)", tint: Theme.accent)

            if let ch = round.courseHandicap {
                verticalDivider
                scoreTile(label: "CH", value: "\(ch)", tint: Theme.warn)
            }
        }
        .padding(.vertical, 16)
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }

    private func scoreTile(label: String, value: String, tint: Color) -> some View {
        VStack(spacing: 4) {
            Text(label.uppercased())
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)

            Text(value)
                .font(Theme.statFont(32))
                .foregroundColor(tint)
        }
        .frame(maxWidth: .infinity)
    }

    private var verticalDivider: some View {
        Rectangle()
            .fill(Theme.line)
            .frame(width: 1, height: 50)
    }

    private var scoreColor: Color {
        if round.grossOverUnder < 0 {
            return Theme.accent
        } else if round.grossOverUnder > 0 {
            return Theme.bad
        }
        return Theme.ink
    }
    
    // MARK: - Nine Holes Section
    
    private func nineHolesSection(title: String, holes: [RoundHole], startHole: Int) -> some View {
        VStack(spacing: 8) {
            // Section header
            HStack {
                Text(title)
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                Spacer()
            }
            
            // Column headers
            HStack(spacing: 0) {
                Text("#")
                    .frame(width: 32, alignment: .leading)
                Text("Par")
                    .frame(width: 28)
                Text("HI")
                    .frame(width: 24)
                Text("+")
                    .frame(width: 20)
                Spacer()
                Text("Score")
                    .frame(width: 90)
                Text("Net")
                    .frame(width: 36)
                Spacer()
                    .frame(width: 30)
            }
            .font(Theme.labelFont(11))
            .foregroundColor(Theme.nordicForest.opacity(0.5))
            .padding(.horizontal, 12)
            
            // Hole rows
            ForEach(holes) { hole in
                Button {
                    selectedHole = hole
                    // Update current hole when tapped (only if not read-only)
                    if !isReadOnly {
                        round.currentHoleNumber = hole.holeNumber
                        connectivityManager.sendCurrentHole(hole.holeNumber)
                    }
                } label: {
                    holeRow(hole: hole)
                }
            }
        }
    }
    
    private func holeRow(hole: RoundHole) -> some View {
        let isCurrent = !isReadOnly && hole.holeNumber == round.currentHoleNumber
        return HStack(spacing: 0) {
            Text("\(hole.holeNumber)")
                .font(Theme.statFont(14))
                .frame(width: 32, alignment: .leading)

            Text("\(hole.par)")
                .font(Theme.labelFont(13))
                .frame(width: 28)

            Text("\(hole.handicapIndex)")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
                .frame(width: 24)

            Text(hole.strokesReceived > 0 ? "\(hole.strokesReceived)" : "·")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.warn)
                .frame(width: 20)

            Spacer()

            if !isReadOnly {
                HStack(spacing: 6) {
                    Button {
                        decrementScore(for: hole)
                    } label: {
                        Image(systemName: "minus.circle")
                            .font(.system(size: 22))
                            .foregroundColor(Theme.ink3.opacity(
                                (hole.grossStrokes ?? 0) > 0 ? 1.0 : 0.3
                            ))
                    }
                    .buttonStyle(.plain)
                    .disabled((hole.grossStrokes ?? 0) <= 0)

                    // Tap the number to open a fast number-pad sheet
                    // (P / 1–9 / clear). Long-press still clears back
                    // to nil for power users.
                    let displayValue = hole.grossStrokes
                    Button {
                        quickEntryHole = hole
                    } label: {
                        Group {
                            if let v = displayValue, v > 0 {
                                Text("\(v)")
                                    .font(Theme.statFont(18))
                                    .foregroundColor(.scoreColor(strokes: v, par: hole.par))
                            } else {
                                Text("–")
                                    .font(Theme.statFont(18))
                                    .foregroundColor(Theme.ink3)
                            }
                        }
                        .frame(width: 36, height: 36)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .onLongPressGesture(minimumDuration: 0.4) {
                        clearScore(for: hole)
                    }

                    Button {
                        incrementScore(for: hole)
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 22))
                            .foregroundColor(Theme.accent)
                    }
                    .buttonStyle(.plain)
                }
            } else {
                if let gross = hole.grossStrokes {
                    Text("\(gross)")
                        .font(Theme.statFont(16))
                        .foregroundColor(.scoreColor(strokes: gross, par: hole.par))
                        .frame(width: 50)
                } else {
                    Text("–")
                        .font(Theme.statFont(16))
                        .foregroundColor(Theme.ink3)
                        .frame(width: 50)
                }
            }

            if let net = hole.netStrokes {
                Text("\(net)")
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.accent)
                    .frame(width: 36)
            } else {
                Text("–")
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.ink3)
                    .frame(width: 36)
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(Theme.ink3)
                .padding(.leading, 6)
        }
        .foregroundColor(Theme.ink)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            Rectangle()
                .fill(isCurrent ? Theme.accent.opacity(0.1) : Theme.surface)
        )
        .overlay(
            Rectangle()
                .stroke(isCurrent ? Theme.accent.opacity(0.7) : Theme.line, lineWidth: 1)
        )
    }
    
    // MARK: - Score Increment/Decrement

    /// "+": when the hole is cleared (nil or 0), the first tap takes you
    /// to 1 stroke. From there each tap adds one. We deliberately don't
    /// jump to par on first tap any more — the user said the watch was
    /// jumping ahead of them on-course.
    private func incrementScore(for hole: RoundHole) {
        guard let index = round.holes.firstIndex(where: { $0.id == hole.id }) else { return }
        let current = round.holes[index].grossStrokes ?? 0
        round.holes[index].grossStrokes = current + 1
        round.holes[index].recalculateNet()
        persistenceManager.saveCurrentRound()
    }

    /// "−": never goes below 0. At 0 the score stays cleared (stored as
    /// 0, which the row renders as "–"). Long-press on the number clears
    /// back to nil if you want to start fresh.
    private func decrementScore(for hole: RoundHole) {
        guard let index = round.holes.firstIndex(where: { $0.id == hole.id }) else { return }
        let current = round.holes[index].grossStrokes ?? 0
        if current > 0 {
            round.holes[index].grossStrokes = current - 1
            round.holes[index].recalculateNet()
            persistenceManager.saveCurrentRound()
        }
    }

    /// Long-press: wipe the hole back to "not entered" so it falls out of
    /// total / to-par calculations entirely.
    private func clearScore(for hole: RoundHole) {
        guard let index = round.holes.firstIndex(where: { $0.id == hole.id }) else { return }
        round.holes[index].grossStrokes = nil
        round.holes[index].putts = nil
        round.holes[index].recalculateNet()
        persistenceManager.saveCurrentRound()
    }
    
    // MARK: - Subtotal Row
    
    private func subtotalRow(holes: [RoundHole], label: String) -> some View {
        let grossSum = holes.compactMap { $0.grossStrokes }.reduce(0, +)
        let netSum = holes.compactMap { $0.netStrokes }.reduce(0, +)
        let parSum = holes.reduce(0) { $0 + $1.par }
        let completed = holes.filter { $0.grossStrokes != nil }.count
        
        return HStack(spacing: 0) {
            Text(label)
                .font(Theme.labelFont(13))
                .tracking(1.4)
                .foregroundColor(Theme.ink2)
                .frame(width: 40, alignment: .leading)

            Text("\(parSum)")
                .font(Theme.labelFont(13))
                .frame(width: 35)

            Spacer()
                .frame(width: 55)

            Text(completed > 0 ? "\(grossSum)" : "–")
                .font(Theme.statFont(16))
                .frame(width: 50)

            Text(completed > 0 ? "\(netSum)" : "–")
                .font(Theme.statFont(14))
                .foregroundColor(Theme.accent)
                .frame(width: 45)

            Spacer()
        }
        .foregroundColor(Theme.ink)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }
    
    // MARK: - Total Row
    
    private var totalRow: some View {
        HStack(spacing: 0) {
            Text("TOTAL")
                .font(Theme.labelFont(13))
                .tracking(1.4)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
                .frame(width: 56, alignment: .leading)

            Text("\(round.playedHoles.reduce(0) { $0 + $1.par })")
                .font(Theme.labelFont(13))
                .frame(width: 35)

            Spacer()
                .frame(width: 55)

            Text("\(round.grossTotal)")
                .font(Theme.statFont(20))
                .frame(width: 50)

            Text("\(round.netTotal)")
                .font(Theme.statFont(16))
                .foregroundColor(Theme.accent)
                .frame(width: 45)

            Spacer()
        }
        .foregroundColor(Theme.ink)
        .padding(.horizontal, 12)
        .padding(.vertical, 14)
        .background(Theme.accent.opacity(0.08))
        .overlay(Rectangle().stroke(Theme.accent.opacity(0.5), lineWidth: 1))
    }
    
    // MARK: - Action Buttons
    
    @ViewBuilder
    private var actionButtons: some View {
        VStack(spacing: 12) {
            // View full scorecard button
            Button {
                showFullScorecard = true
            } label: {
                HStack {
                    Image(systemName: "tablecells")
                    Text("View Full Scorecard")
                }
                .secondaryButton()
            }
            
            // Shot tracking link
            NavigationLink {
                ShotListView(round: $round)
            } label: {
                HStack {
                    Image(systemName: "scope")
                    Text("View Shots (\(round.shots.count))")
                }
                .secondaryButton()
            }
            
            // Plan Mode link (only when not read-only)
            if !isReadOnly {
                NavigationLink {
                    PlanModeView(round: $round)
                } label: {
                    HStack {
                        Image(systemName: "pencil.and.outline")
                        Text("Plan Strategy")
                        if round.plannedShots.count > 0 {
                            Text("(\(round.plannedShots.count))")
                                .foregroundColor(Theme.nordicSage)
                        }
                    }
                    .secondaryButton()
                }
            }
            
            // Share scorecard button
            Button {
                shareScorecard()
            } label: {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share Scorecard")
                }
                .secondaryButton()
            }
            
            // End round button (only shown when not read-only)
            if !isReadOnly {
                Button {
                    showEndRoundAlert = true
                } label: {
                    HStack {
                        Image(systemName: "flag.checkered")
                        Text("End Round")
                    }
                    .primaryButton()
                }
            }
        }
        .padding(.top, 20)
    }
}

#Preview {
    NavigationStack {
        ScorecardView(round: .constant(
            Round(
                course: CourseData.sampleCourse,
                selectedTee: CourseData.sampleCourse.tees.first,
                player: Player.defaultPlayer
            )
        ))
        .environmentObject(PersistenceManager())
        .environmentObject(WatchConnectivityManager())
    }
}
