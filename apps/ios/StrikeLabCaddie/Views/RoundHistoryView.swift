//
//  RoundHistoryView.swift
//  StrikeLabCaddie
//
//  View all past rounds with option to view details
//

import SwiftUI

struct RoundHistoryView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @State private var selectedRound: Round?
    @State private var showDeleteAlert = false
    @State private var roundToDelete: Round?
    @State private var showExport = false
    @State private var isCompareMode = false
    @State private var selectedForComparison: Set<UUID> = []
    @State private var showComparison = false
    
    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Compare mode banner
                    if isCompareMode {
                        compareModeHeader
                    }
                    
                    if persistenceManager.savedRounds.isEmpty {
                        emptyStateView
                    } else {
                        // Summary stats
                        if !isCompareMode {
                            summaryCard
                        }
                        
                        // Rounds grouped by month
                        ForEach(groupedRounds, id: \.key) { month, rounds in
                            monthSection(month: month, rounds: rounds)
                        }
                    }
                    
                    Spacer(minLength: isCompareMode ? 100 : 40)
                }
                .padding()
            }
            
            // Compare button at bottom
            if isCompareMode && selectedForComparison.count == 2 {
                VStack {
                    Spacer()
                    compareButton
                }
            }
        }
        .nordicBackground()
        .navigationTitle("Round History")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedRound) { round in
            NavigationStack {
                ScorecardView(round: bindingForSavedRound(round), isReadOnly: false)
                    .environmentObject(persistenceManager)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Done") {
                                selectedRound = nil
                            }
                            .foregroundColor(Theme.accent)
                        }
                    }
            }
        }
        .alert("Delete Round?", isPresented: $showDeleteAlert) {
            Button("Delete", role: .destructive) {
                if let round = roundToDelete {
                    deleteRound(round)
                }
            }
            Button("Cancel", role: .cancel) {
                roundToDelete = nil
            }
        } message: {
            Text("This round will be permanently deleted.")
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                if persistenceManager.savedRounds.count >= 2 {
                    Button {
                        withAnimation {
                            isCompareMode.toggle()
                            if !isCompareMode {
                                selectedForComparison.removeAll()
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: isCompareMode ? "xmark" : "arrow.left.arrow.right")
                            Text(isCompareMode ? "Cancel" : "Compare")
                        }
                        .font(Theme.labelFont(14))
                        .foregroundColor(isCompareMode ? Theme.overPar : Theme.neuralCyan)
                    }
                }
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                if !persistenceManager.savedRounds.isEmpty {
                    Button {
                        showExport = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(Theme.nordicForest)
                    }
                }
            }
        }
        .sheet(isPresented: $showExport) {
            NavigationStack {
                ExportOptionsView(rounds: persistenceManager.savedRounds)
            }
        }
    }
    
    // MARK: - Compare Mode
    
    private var compareModeHeader: some View {
        HStack {
            Image(systemName: "arrow.left.arrow.right")
                .foregroundColor(Theme.neuralCyan)
            
            Text("Select 2 rounds to compare")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest)
            
            Spacer()
            
            Text("\(selectedForComparison.count)/2")
                .font(Theme.statFont(16))
                .foregroundColor(selectedForComparison.count == 2 ? Theme.nordicSage : Theme.nordicForest)
        }
        .padding()
        .background(Theme.neuralCyan.opacity(0.1))
        .cornerRadius(12)
    }
    
    private var compareButton: some View {
        Button {
            showComparison = true
        } label: {
            HStack {
                Image(systemName: "arrow.left.arrow.right.circle.fill")
                Text("Compare Rounds")
            }
            .font(Theme.bodyFont(16))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Theme.neuralCyan)
            .cornerRadius(12)
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Theme.nordicPaper.opacity(0), Theme.nordicPaper],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .sheet(isPresented: $showComparison) {
            if let rounds = getSelectedRoundsForComparison() {
                NavigationStack {
                    RoundComparisonView(round1: rounds.0, round2: rounds.1)
                        .toolbar {
                            ToolbarItem(placement: .topBarTrailing) {
                                Button("Done") {
                                    showComparison = false
                                    isCompareMode = false
                                    selectedForComparison.removeAll()
                                }
                            }
                        }
                }
            }
        }
    }
    
    private func getSelectedRoundsForComparison() -> (Round, Round)? {
        let selectedRounds = persistenceManager.savedRounds.filter { selectedForComparison.contains($0.id) }
        guard selectedRounds.count == 2 else { return nil }
        // Sort by date (earlier first)
        let sorted = selectedRounds.sorted { $0.date < $1.date }
        return (sorted[0], sorted[1])
    }
    
    // MARK: - Empty State
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "flag.fill")
                .font(.system(size: 48))
                .foregroundColor(Theme.nordicForest.opacity(0.3))
            
            Text("No Rounds Yet")
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.nordicForest)
            
            Text("Complete a round to see it here")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - Summary Card
    
    private var summaryCard: some View {
        HStack(spacing: 0) {
            // Total rounds
            VStack(spacing: 4) {
                Text("ROUNDS")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text("\(persistenceManager.savedRounds.count)")
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.nordicForest)
            }
            .frame(maxWidth: .infinity)
            
            Divider()
                .frame(height: 40)
            
            // Average score
            VStack(spacing: 4) {
                Text("AVG")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text(averageScore)
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.nordicForest)
            }
            .frame(maxWidth: .infinity)
            
            Divider()
                .frame(height: 40)
            
            // Best round
            VStack(spacing: 4) {
                Text("BEST")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                Text(bestScore)
                    .font(Theme.statFont(24))
                    .foregroundColor(Theme.nordicSage)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.vertical, 16)
        .glassCard()
    }
    
    private var averageScore: String {
        let completedRounds = persistenceManager.savedRounds.filter { $0.holesCompleted == 18 }
        guard !completedRounds.isEmpty else { return "–" }
        let total = completedRounds.reduce(0) { $0 + $1.grossTotal }
        let avg = Double(total) / Double(completedRounds.count)
        return String(format: "%.1f", avg)
    }
    
    private var bestScore: String {
        let completedRounds = persistenceManager.savedRounds.filter { $0.holesCompleted == 18 }
        guard let best = completedRounds.min(by: { $0.grossTotal < $1.grossTotal }) else { return "–" }
        return "\(best.grossTotal)"
    }
    
    // MARK: - Grouped Rounds
    
    private var groupedRounds: [(key: String, value: [Round])] {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        
        let grouped = Dictionary(grouping: persistenceManager.savedRounds.sorted(by: { $0.date > $1.date })) { round in
            formatter.string(from: round.date)
        }
        
        return grouped.sorted { pair1, pair2 in
            // Sort by most recent first
            let date1 = persistenceManager.savedRounds.first { formatter.string(from: $0.date) == pair1.key }?.date ?? Date.distantPast
            let date2 = persistenceManager.savedRounds.first { formatter.string(from: $0.date) == pair2.key }?.date ?? Date.distantPast
            return date1 > date2
        }
    }
    
    private func monthSection(month: String, rounds: [Round]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(month.uppercased())
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .padding(.leading, 4)
            
            ForEach(rounds) { round in
                roundRow(round: round)
            }
        }
    }
    
    // MARK: - Round Row
    
    private func roundRow(round: Round) -> some View {
        let isSelected = selectedForComparison.contains(round.id)
        
        return Button {
            if isCompareMode {
                toggleSelection(round)
            } else {
                selectedRound = round
            }
        } label: {
            HStack {
                // Selection indicator in compare mode
                if isCompareMode {
                    ZStack {
                        Circle()
                            .stroke(isSelected ? Theme.neuralCyan : Theme.nordicForest.opacity(0.3), lineWidth: 2)
                            .frame(width: 24, height: 24)
                        
                        if isSelected {
                            Circle()
                                .fill(Theme.neuralCyan)
                                .frame(width: 16, height: 16)
                        }
                    }
                    .padding(.trailing, 8)
                }
                
                // Course info
                VStack(alignment: .leading, spacing: 4) {
                    Text(round.course.name)
                        .font(Theme.labelFont(16))
                        .foregroundColor(Theme.nordicForest)
                    
                    HStack(spacing: 8) {
                        Text(round.date, style: .date)
                        
                        if let tee = round.selectedTee {
                            Text("•")
                            Text(tee.name)
                        }
                        
                        Text("•")
                        Text("\(round.holesCompleted) holes")
                    }
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
                }
                
                Spacer()
                
                // Scores
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(round.grossTotal)")
                        .font(Theme.statFont(22))
                        .foregroundColor(Theme.nordicForest)
                    
                    Text(round.formattedOverUnder)
                        .font(Theme.statFont(14))
                        .foregroundColor(round.grossOverUnder <= 0 ? Theme.nordicSage : Theme.overPar)
                }
                
                if !isCompareMode {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                        .foregroundColor(Theme.nordicForest.opacity(0.3))
                        .padding(.leading, 8)
                }
            }
            .padding()
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.smallCornerRadius)
                    .stroke(isSelected ? Theme.neuralCyan : Color.clear, lineWidth: 2)
            )
            .padding(.horizontal, 4)
        }
        .contextMenu {
            if !isCompareMode {
                Button(role: .destructive) {
                    roundToDelete = round
                    showDeleteAlert = true
                } label: {
                    Label("Delete Round", systemImage: "trash")
                }
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            if !isCompareMode {
                Button(role: .destructive) {
                    roundToDelete = round
                    showDeleteAlert = true
                } label: {
                    Label("Delete", systemImage: "trash")
                }
            }
        }
    }
    
    private func toggleSelection(_ round: Round) {
        if selectedForComparison.contains(round.id) {
            selectedForComparison.remove(round.id)
        } else if selectedForComparison.count < 2 {
            selectedForComparison.insert(round.id)
        }
    }
    
    // MARK: - Actions
    
    /// A binding that writes mutations back into `savedRounds` so editing a
    /// completed round persists correctly. Resolves the round by id every
    /// read so we never get stuck on a stale snapshot.
    private func bindingForSavedRound(_ round: Round) -> Binding<Round> {
        Binding<Round>(
            get: {
                persistenceManager.savedRounds.first(where: { $0.id == round.id }) ?? round
            },
            set: { updated in
                if let idx = persistenceManager.savedRounds.firstIndex(where: { $0.id == updated.id }) {
                    persistenceManager.savedRounds[idx] = updated
                    persistenceManager.saveSavedRoundsPublic()
                }
            }
        )
    }

    private func deleteRound(_ round: Round) {
        withAnimation {
            persistenceManager.deleteSavedRound(round)
        }
        roundToDelete = nil
    }
}

#Preview {
    NavigationStack {
        RoundHistoryView()
            .environmentObject(PersistenceManager())
    }
}
