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
    @State private var showExtendRoundAlert = false
    @State private var quickEntryGuest: GuestScoreTarget?
    @State private var showAddGuest = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Score summary header
                scoreSummaryCard

                if round.hasGroupPlayers {
                    groupSummaryCard
                }

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

                if round.hasGroupPlayers {
                    groupScorecardSection
                }

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
        .alert("Extend to 18 holes?", isPresented: $showExtendRoundAlert) {
            Button("Play back 9") {
                round.extendFrontNineToFull18()
                persistenceManager.saveCurrentRound()
                connectivityManager.sendCurrentHole(round.currentHoleNumber)
                connectivityManager.sendRoundConfig(round)
                RoundLiveSync.syncNow(round: round, persistence: persistenceManager)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your front 9 stays intact and the scorecard becomes a full 18-hole round for export.")
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
        .sheet(item: $quickEntryGuest) { target in
            ScorePadSheet(
                par: target.score.par,
                strokesReceived: target.score.strokesReceived,
                initialScore: target.score.grossStrokes
            ) { newValue in
                applyGuestScore(newValue, target: target)
            }
        }
        .sheet(isPresented: $showAddGuest) {
            NavigationStack {
                GroupPlayerEditorView(round: $round)
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

    private func applyGuestScore(_ value: Int?, target: GuestScoreTarget) {
        round.updateGroupScore(
            playerId: target.playerId,
            holeNumber: target.score.holeNumber,
            grossStrokes: value
        )
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

    private var groupSummaryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Group", trailing: "\(round.groupPlayers.count + 1) players")
            HStack(spacing: 8) {
                groupMiniCard(name: round.player.name, gross: round.grossTotal, net: round.netTotal, isPrimary: true)
                ForEach(round.groupPlayers) { guest in
                    groupMiniCard(
                        name: guest.displayName,
                        gross: guest.grossTotal(format: round.playFormat),
                        net: guest.netTotal(format: round.playFormat),
                        isPrimary: false
                    )
                }
            }
        }
    }

    private func groupMiniCard(name: String, gross: Int, net: Int, isPrimary: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(name.uppercased())
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(isPrimary ? Theme.accent : Theme.ink3)
                .lineLimit(1)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(gross)")
                    .font(Theme.statFont(22))
                    .foregroundColor(Theme.ink)
                Text("NET \(net)")
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.accent)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(isPrimary ? Theme.accent.opacity(0.55) : Theme.line, lineWidth: 1))
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

    private var groupScorecardSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "Guest Scores", trailing: "tap score")
            ForEach(round.groupPlayers) { guest in
                guestScoreCard(guest: guest)
            }
            Button {
                showAddGuest = true
            } label: {
                HStack {
                    Image(systemName: "person.badge.plus")
                    Text("Manage Guests")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .secondaryButton()
            }
        }
    }

    private func guestScoreCard(guest: GroupPlayer) -> some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(guest.displayName.uppercased())
                        .font(Theme.labelFont(12))
                        .tracking(1.4)
                        .foregroundColor(Theme.ink)
                    Text("HCP \(guest.formattedHandicap) · CH \(guest.courseHandicap(fallbackTee: round.selectedTee, format: round.playFormat).map(String.init) ?? "--")")
                        .font(Theme.labelFont(9))
                        .tracking(1.0)
                        .foregroundColor(Theme.ink3)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(guest.grossTotal(format: round.playFormat))")
                        .font(Theme.statFont(20))
                        .foregroundColor(Theme.ink)
                    Text("NET \(guest.netTotal(format: round.playFormat))")
                        .font(Theme.labelFont(9))
                        .foregroundColor(Theme.accent)
                }
            }
            .padding(12)
            .background(Theme.surface3)

            guestColumnHeaders
            ForEach(guest.playedHoles(format: round.playFormat)) { score in
                guestHoleRow(guest: guest, score: score)
            }
        }
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }

    private var guestColumnHeaders: some View {
        HStack(spacing: 0) {
            Text("Hole").frame(width: 45, alignment: .leading)
            Text("Par").frame(width: 35)
            Text("HI").frame(width: 30)
            Text("+").frame(width: 25)
            Spacer()
            Text("Gross").frame(width: 58)
            Text("Net").frame(width: 45)
        }
        .font(Theme.labelFont(10))
        .foregroundColor(Theme.ink3)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.surface2)
    }

    private func guestHoleRow(guest: GroupPlayer, score: GroupPlayerHoleScore) -> some View {
        Button {
            quickEntryGuest = GuestScoreTarget(playerId: guest.id, score: score)
        } label: {
            HStack(spacing: 0) {
                Text("\(score.holeNumber)")
                    .font(Theme.statFont(13))
                    .frame(width: 45, alignment: .leading)
                Text("\(score.par)")
                    .font(Theme.labelFont(12))
                    .frame(width: 35)
                Text("\(score.handicapIndex)")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
                    .frame(width: 30)
                Text(score.strokesReceived > 0 ? "\(score.strokesReceived)" : "-")
                    .font(Theme.labelFont(10))
                    .foregroundColor(score.strokesReceived > 0 ? Theme.warn : Theme.ink3)
                    .frame(width: 25)
                Spacer()
                Text(score.grossStrokes.map(String.init) ?? "-")
                    .font(Theme.statFont(14))
                    .foregroundColor(.scoreColor(strokes: score.grossStrokes, par: score.par))
                    .frame(width: 58)
                Text(score.netStrokes.map(String.init) ?? "-")
                    .font(Theme.statFont(12))
                    .foregroundColor(score.netStrokes == nil ? Theme.ink3 : Theme.accent)
                    .frame(width: 45)
            }
            .foregroundColor(Theme.ink)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(score.holeNumber == round.currentHoleNumber ? Theme.accent.opacity(0.08) : Theme.surface)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Theme.line).frame(height: 1)
            }
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Action Buttons
    
    @ViewBuilder
    private var actionButtons: some View {
        VStack(spacing: 12) {
            if !isReadOnly && round.playFormat == .front9 {
                Button {
                    showExtendRoundAlert = true
                } label: {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Extend to 18 Holes")
                    }
                    .secondaryButton()
                }
            }

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

            Button {
                showAddGuest = true
            } label: {
                HStack {
                    Image(systemName: "person.2")
                    Text(round.hasGroupPlayers ? "Manage Group" : "Add Group Scores")
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

private struct GuestScoreTarget: Identifiable {
    let playerId: UUID
    let score: GroupPlayerHoleScore

    var id: String {
        "\(playerId.uuidString)-\(score.holeNumber)"
    }
}

private struct GroupPlayerEditorView: View {
    @Binding var round: Round
    @Environment(\.dismiss) private var dismiss
    @State private var draftGuests: [DraftGuest] = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionLabel(text: "Group Players", trailing: "\(draftGuests.count + 1)/4 players")

                VStack(alignment: .leading, spacing: 10) {
                    Text("Your watch keeps tracking your strokes, shots, GPS and biometric data. Guests only get scorecard rows and handicap strokes.")
                        .font(Theme.bodyFont(12))
                        .foregroundColor(Theme.ink3)

                    ForEach($draftGuests) { $guest in
                        draftGuestRow(guest: $guest)
                    }

                    if draftGuests.count < 3 {
                        Button {
                            draftGuests.append(DraftGuest(name: "Guest \(draftGuests.count + 1)"))
                        } label: {
                            HStack {
                                Image(systemName: "person.badge.plus")
                                Text("Add Guest")
                                Spacer()
                            }
                            .secondaryButton()
                        }
                    }
                }
                .glassCard()
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Group")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") { dismiss() }
                    .foregroundColor(Theme.ink2)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("Save") {
                    save()
                    dismiss()
                }
                .foregroundColor(Theme.accent)
            }
        }
        .onAppear {
            draftGuests = round.groupPlayers.map(DraftGuest.init)
        }
    }

    private func draftGuestRow(guest: Binding<DraftGuest>) -> some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                TextField("Guest name", text: guest.name)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink)
                    .textInputAutocapitalization(.words)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(Theme.surface3)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                Button {
                    draftGuests.removeAll { $0.id == guest.wrappedValue.id }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Theme.ink3)
                        .frame(width: 32, height: 32)
                        .background(Theme.surface3)
                        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 10) {
                TextField("HCP index", text: guest.handicapText)
                    .keyboardType(.decimalPad)
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.ink)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(Theme.surface3)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                Text(guest.wrappedValue.strokePreview(fallbackTee: round.selectedTee))
                    .font(Theme.labelFont(10))
                    .tracking(1.1)
                    .foregroundColor(Theme.warn)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
        .padding(12)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func save() {
        let existingByDraftId = Dictionary(uniqueKeysWithValues: zip(round.groupPlayers.map(\.id), round.groupPlayers))
        round.groupPlayers = draftGuests.compactMap { draft in
            let name = draft.name.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !name.isEmpty else { return nil }
            if var existing = existingByDraftId[draft.sourceId ?? UUID()] {
                existing.name = name
                existing.handicapIndex = draft.handicapIndex
                existing.tee = existing.tee ?? round.selectedTee
                existing.recalculateStrokeAllocation(course: round.course, format: round.playFormat)
                return existing
            }
            var guest = GroupPlayer(
                name: name,
                handicapIndex: draft.handicapIndex,
                tee: round.selectedTee,
                holes: round.course.holes.map {
                    GroupPlayerHoleScore(holeNumber: $0.number, par: $0.par, handicapIndex: $0.handicapIndex)
                }
            )
            guest.recalculateStrokeAllocation(course: round.course, format: round.playFormat)
            return guest
        }
    }
}

private struct DraftGuest: Identifiable, Equatable {
    let id: UUID
    var sourceId: UUID?
    var name: String
    var handicapText: String

    init(id: UUID = UUID(), sourceId: UUID? = nil, name: String, handicapText: String = "") {
        self.id = id
        self.sourceId = sourceId
        self.name = name
        self.handicapText = handicapText
    }

    init(player: GroupPlayer) {
        self.id = player.id
        self.sourceId = player.id
        self.name = player.name
        if let handicapIndex = player.handicapIndex {
            self.handicapText = String(format: "%.1f", handicapIndex)
        } else {
            self.handicapText = ""
        }
    }

    var handicapIndex: Double? {
        let normalized = handicapText.replacingOccurrences(of: ",", with: ".")
        if normalized.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return nil }
        return Double(normalized)
    }

    func strokePreview(fallbackTee: Tee?) -> String {
        guard let handicapIndex else { return "Gross only" }
        guard let tee = fallbackTee,
              let slope = tee.slope,
              let rating = tee.courseRating,
              let par = tee.par else {
            return "HCP set · no tee rating"
        }
        let ch = HandicapCalculator.courseHandicap(
            handicapIndex: handicapIndex,
            slope: slope,
            courseRating: rating,
            par: par
        )
        return "CH \(ch)"
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
