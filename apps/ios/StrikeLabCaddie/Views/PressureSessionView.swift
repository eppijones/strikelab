//
//  PressureSessionView.swift
//  StrikeLabCaddie
//
//  Phase 5 — pressure-mode dashboard. Player picks a goal, runs the
//  session from the watch (which fires the shot clock, captures HR +
//  motion per attempt, prompts the FEEL crown). On the phone we show
//  the live attempts table and, when the session ends, the plain-
//  English diagnosis built by `PressureDiagnosis.build(...)`.
//

import SwiftUI

struct PressureSessionView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    @Environment(\.dismiss) private var dismiss

    @State private var selectedClub: Club = .iron7
    @State private var targetYards: Double = 150
    @State private var bandYards: Double = 10
    @State private var attempts: Int = 5
    @State private var session: PressureSession?
    @State private var diagnosis: PressureDiagnosis?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let s = session {
                    activeSection(s)
                    if let d = diagnosis {
                        diagnosisCard(d)
                    } else {
                        endButton
                    }
                } else {
                    setupSection
                }
                Spacer(minLength: 40)
            }
            .padding(16)
        }
        .nordicBackground()
        .navigationTitle("Pressure Mode")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Close") { dismiss() }
                    .foregroundColor(Theme.accent)
            }
        }
        .onChange(of: persistenceManager.recentEnhancedShots) { _, _ in
            captureAvailableSwings()
        }
    }

    // MARK: - Setup

    private var setupSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("PRESSURE")
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.accent)
            Text("Build heat. Measure if your swing holds.")
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.ink)
            Text("Pick a goal. Watch fires the shot clock and captures HR + biomech for each attempt.")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)

            VStack(alignment: .leading, spacing: 8) {
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

            stepperRow("TARGET CARRY", value: $targetYards, range: 30...300, unit: "yds", step: 5)
            stepperRow("BAND", value: $bandYards, range: 3...40, unit: "yds", step: 1)
            stepperRow("ATTEMPTS", value: Binding(
                get: { Double(attempts) },
                set: { attempts = Int($0) }
            ), range: 3...20, unit: "shots", step: 1)

            Button { startSession() } label: {
                Text("START")
                    .primaryButton()
            }
            .buttonStyle(.plain)
        }
    }

    private func stepperRow(_ label: String, value: Binding<Double>, range: ClosedRange<Double>, unit: String, step: Double) -> some View {
        HStack {
            Text(label)
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Spacer()
            Stepper(value: value, in: range, step: step) {
                Text("\(Int(value.wrappedValue.rounded())) \(unit)")
                    .font(Theme.statFont(15))
                    .foregroundColor(Theme.ink)
            }
            .labelsHidden()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func startSession() {
        let goal = PressureGoal.targetCarry(
            club: selectedClub,
            targetYards: targetYards,
            bandYards: bandYards,
            attempts: attempts
        )
        session = PressureSession(goal: goal)
        diagnosis = nil
    }

    // MARK: - Active

    private func activeSection(_ s: PressureSession) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Theme.bad)
                    .frame(width: 8, height: 8)
                Text("LIVE")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.bad)
                Spacer()
                Text("\(s.attempts.count)/\(s.goal.attempts) · \(s.hits) hit")
                    .font(Theme.statFont(13))
                    .foregroundColor(Theme.ink2)
            }
            Text(s.goal.titleShort)
                .font(Theme.titleFont(18))
                .foregroundColor(Theme.ink)

            if s.attempts.isEmpty {
                Text("Hit your first shot on the watch — the attempt will appear here within ~2 s.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                    .padding(.vertical, 12)
            } else {
                attemptsTable(s)
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func attemptsTable(_ s: PressureSession) -> some View {
        VStack(spacing: 0) {
            ForEach(Array(s.attempts.enumerated()), id: \.element.id) { idx, att in
                attemptRow(idx: idx, attempt: att, sessionId: s.id)
                if idx < s.attempts.count - 1 {
                    Rectangle().fill(Theme.line).frame(height: 1)
                }
            }
        }
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func attemptRow(idx: Int, attempt: PressureAttempt, sessionId: UUID) -> some View {
        HStack(spacing: 10) {
            Text("#\(idx + 1)")
                .font(Theme.labelFont(11))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
                .frame(width: 28, alignment: .leading)
            VStack(alignment: .leading, spacing: 2) {
                if let m = attempt.motion {
                    Text("\(Int(SwingAnalytics.speeds(m, club: selectedClub).clubSpeedMph.rounded())) mph club")
                        .font(Theme.statFont(13))
                        .foregroundColor(Theme.ink)
                }
                if let hr = attempt.heartRate?.heartRate, hr > 0 {
                    Text("\(Int(hr)) bpm @ impact")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.bad)
                }
            }
            Spacer()
            // Carry input (per-attempt grading).
            TextField("yds", text: Binding(
                get: { attempt.carryYards.map { "\(Int($0))" } ?? "" },
                set: { newVal in
                    if let v = Double(newVal) {
                        gradeAttempt(id: attempt.id, carry: v)
                    }
                }
            ))
            .keyboardType(.numberPad)
            .multilineTextAlignment(.trailing)
            .font(Theme.statFont(13))
            .foregroundColor(Theme.ink)
            .frame(width: 60, height: 28)
            .padding(.horizontal, 6)
            .background(Theme.surface)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
            if attempt.carryYards != nil {
                Image(systemName: attempt.withinBand ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(attempt.withinBand ? Theme.accent : Theme.bad)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
    }

    private var endButton: some View {
        Button { endSession() } label: {
            Text("END SESSION & SEE DIAGNOSIS")
                .secondaryButton()
        }
        .buttonStyle(.plain)
    }

    // MARK: - Capture / grade

    /// Pull any new enhanced shots for the session's club into pending
    /// attempt slots. Called whenever the recent enhanced shots store
    /// updates.
    private func captureAvailableSwings() {
        guard var s = session, s.attempts.count < s.goal.attempts else { return }
        let club = s.goal.club
        let candidates = persistenceManager.recentEnhancedShots
            .filter { $0.club == club && $0.timestamp >= s.startedAt }
            .sorted(by: { $0.timestamp < $1.timestamp })
        for ev in candidates {
            if s.attempts.contains(where: { $0.id == ev.id }) { continue }
            guard let m = ev.motionData else { continue }
            let attempt = PressureAttempt(
                id: ev.id,
                timestamp: ev.timestamp,
                feel: 7,
                commitPhrase: "",
                motion: m,
                heartRate: ev.heartRateData
            )
            s.attempts.append(attempt)
            if s.attempts.count >= s.goal.attempts { break }
        }
        session = s
    }

    private func gradeAttempt(id: UUID, carry: Double) {
        guard var s = session,
              let idx = s.attempts.firstIndex(where: { $0.id == id }) else { return }
        s.attempts[idx].carryYards = carry
        s.attempts[idx].withinBand = abs(carry - s.goal.targetYards) <= s.goal.bandYards
        session = s
    }

    private func endSession() {
        guard var s = session else { return }
        s.endedAt = Date()
        session = s
        diagnosis = PressureDiagnosis.build(
            session: s,
            baseline: persistenceManager.recentEnhancedShots,
            armLengthMeters: persistenceManager.player.armLengthMeters
        )
    }

    // MARK: - Diagnosis card

    private func diagnosisCard(_ d: PressureDiagnosis) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("DIAGNOSIS")
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.accent)

            Text(d.summary)
                .font(Theme.titleFont(18))
                .foregroundColor(Theme.ink)

            VStack(spacing: 0) {
                ForEach(Array(d.metrics.enumerated()), id: \.offset) { _, m in
                    HStack {
                        Text(m.label)
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink2)
                        Spacer()
                        Text(String(format: "%.1f → %.1f", m.baselineValue, m.pressureValue))
                            .font(Theme.statFont(13))
                            .foregroundColor(directionColor(m.direction))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    Rectangle().fill(Theme.line).frame(height: 1)
                }
            }
            .background(Theme.surface2)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

            Button { reset() } label: {
                Text("RUN ANOTHER")
                    .secondaryButton()
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func directionColor(_ d: PressureDiagnosis.MetricDelta.Direction) -> Color {
        switch d {
        case .better:  return Theme.accent
        case .worse:   return Theme.bad
        case .sameish: return Theme.ink2
        }
    }

    private func reset() {
        session = nil
        diagnosis = nil
    }
}
