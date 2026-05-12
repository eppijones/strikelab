//
//  CalibrationFlowView.swift
//  StrikeLabCaddie
//
//  Phase 4 — per-club calibration flow. Player picks a club, hits 5
//  shots on the range, enters the carry from a launch monitor / known
//  yardage marker / GPS pin after each. We pair each carry with the
//  matching enhanced-shot's hand speed and fit a ridge linear regression.
//  The resulting `ClubModel` is stored on `Player.clubModels` and
//  pushed to the watch via WCSession application context so the post-
//  swing HUD can show estimated carry directly on the wrist.
//

import SwiftUI

struct CalibrationFlowView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    @Environment(\.dismiss) private var dismiss

    @State private var selectedClub: Club = .iron7
    @State private var rows: [Row] = (0..<5).map { _ in Row() }
    @State private var fittedModel: ClubModel?
    @State private var status: String = ""

    /// Per-row state. handMph fills automatically when an enhanced shot
    /// arrives on this club; carryYards is entered by the player.
    private struct Row: Identifiable {
        let id = UUID()
        var handMph: Double?
        var carryYards: String = ""
        var matchedEventId: UUID?
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                clubPicker
                rowsList
                fitSection
                if let model = fittedModel {
                    resultCard(model)
                }
                Spacer(minLength: 40)
            }
            .padding(16)
        }
        .nordicBackground()
        .navigationTitle("Calibrate")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { dismiss() }
                    .foregroundColor(Theme.accent)
            }
        }
        .onAppear { matchPendingShots() }
        .onChange(of: persistenceManager.recentEnhancedShots) { _, _ in
            matchPendingShots()
        }
        .onChange(of: selectedClub) { _, _ in
            // Reset rows when changing club.
            rows = (0..<5).map { _ in Row() }
            fittedModel = nil
            status = ""
            matchPendingShots()
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("CALIBRATE")
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.accent)
            Text("Hit 5 shots, enter the carry after each")
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.ink)
            Text("Captures pair automatically with the watch. Use a launch monitor, yardage marker, or GPS pin for the carry.")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
        }
    }

    // MARK: - Club picker

    private var clubPicker: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("CLUB")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Picker("Club", selection: $selectedClub) {
                ForEach(Club.commonClubs.filter { $0 != .putter }) { c in
                    Text(c.shortName).tag(c)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    // MARK: - Rows

    private var rowsList: some View {
        VStack(spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.element.id) { index, row in
                rowView(index: index, row: row)
                if index < rows.count - 1 {
                    Rectangle().fill(Theme.line).frame(height: 1)
                }
            }
        }
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func rowView(index: Int, row: Row) -> some View {
        HStack(spacing: 10) {
            Text("#\(index + 1)")
                .font(Theme.labelFont(11))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
                .frame(width: 28, alignment: .leading)

            VStack(alignment: .leading, spacing: 2) {
                if let h = row.handMph {
                    Text("\(Int(h.rounded())) mph hand")
                        .font(Theme.statFont(13))
                        .foregroundColor(Theme.accent)
                } else {
                    Text("Waiting for swing…")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }
            }

            Spacer()

            // Carry input — 3-digit max keeps it punchy on iPhone.
            TextField("yds", text: Binding(
                get: { rows[index].carryYards },
                set: { rows[index].carryYards = $0 }
            ))
            .keyboardType(.numberPad)
            .multilineTextAlignment(.trailing)
            .font(Theme.statFont(15))
            .foregroundColor(Theme.ink)
            .frame(width: 68, height: 30)
            .padding(.horizontal, 6)
            .background(Theme.surface2)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }

    // MARK: - Fit

    private var fitSection: some View {
        let samples = collectSamples()
        return VStack(spacing: 8) {
            Button {
                fit()
            } label: {
                Text(samples.count >= 3 ? "FIT MODEL · \(samples.count) shots" : "Need ≥3 shots")
                    .font(Theme.labelFont(11))
                    .tracking(1.4)
                    .foregroundColor(samples.count >= 3 ? Theme.accentInk : Theme.ink3)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(samples.count >= 3 ? Theme.accent : Theme.surface2)
                    .overlay(Rectangle().stroke(samples.count >= 3 ? Theme.accent : Theme.line, lineWidth: 1))
            }
            .disabled(samples.count < 3)
            .buttonStyle(.plain)
            if !status.isEmpty {
                Text(status)
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
            }
        }
    }

    private func collectSamples() -> [ClubCalibration.Sample] {
        var out: [ClubCalibration.Sample] = []
        for row in rows {
            guard let h = row.handMph,
                  let c = Double(row.carryYards.trimmingCharacters(in: .whitespaces))
            else { continue }
            out.append(ClubCalibration.Sample(handMph: h, carryYards: c))
        }
        return out
    }

    private func fit() {
        let samples = collectSamples()
        guard let model = ClubCalibration.fit(samples) else {
            status = "Couldn't fit — please double-check your carries."
            return
        }
        var player = persistenceManager.player
        player.clubModels[selectedClub.rawValue] = model
        persistenceManager.player = player
        fittedModel = model
        status = "Saved. Push to watch …"
        // Push to watch via app context so the HUD can show estimated carry.
        connectivityManager.sendClubModels(player.clubModels)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            status = "Saved. The Swing Card and watch HUD now show estimated carry for this club."
        }
    }

    // MARK: - Result

    private func resultCard(_ model: ClubModel) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("FITTED")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.accent)
            Text("\(selectedClub.shortName) · est. carry = \(formatNumber(model.alpha))·hand + \(formatNumber(model.gamma))")
                .font(Theme.statFont(13))
                .foregroundColor(Theme.ink)
            Text(String(format: "± %.1f yds (residual std-dev)", model.sigma))
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
            Text("Median hand speed used: \(Int(model.medianHandMph.rounded())) mph")
                .font(Theme.labelFont(10))
                .foregroundColor(Theme.ink3)
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func formatNumber(_ d: Double) -> String {
        String(format: "%.2f", d)
    }

    // MARK: - Auto-pair shots

    /// Walk the recent enhanced shots and fill empty rows in order.
    private func matchPendingShots() {
        let arm = persistenceManager.player.armLengthMeters
        let candidates = persistenceManager.recentEnhancedShots
            .filter { $0.club == selectedClub }
            .sorted(by: { $0.timestamp < $1.timestamp })
        for ev in candidates {
            // Skip events already matched to a row.
            if rows.contains(where: { $0.matchedEventId == ev.id }) { continue }
            // Find the next empty row.
            guard let idx = rows.firstIndex(where: { $0.handMph == nil }) else { return }
            guard let m = ev.motionData else { continue }
            let speeds = SwingAnalytics.speeds(m, club: selectedClub, armLengthMeters: arm)
            rows[idx].handMph = speeds.handSpeedMph
            rows[idx].matchedEventId = ev.id
        }
    }
}
