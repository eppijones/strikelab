//
//  ScorePadSheet.swift
//  StrikeLabCaddie
//
//  Big-button number pad for one-tap score entry from the scorecard.
//  Beats hammering +/- when you shot 8 on a par 3. Includes a "P" chip
//  for "set to par" (the most common hit), 1–9 buttons for direct entry,
//  and a clear button to wipe the hole.
//

import SwiftUI

struct ScorePadSheet: View {
    let par: Int
    let strokesReceived: Int
    let initialScore: Int?
    let onCommit: (Int?) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var localScore: Int?

    init(par: Int, strokesReceived: Int, initialScore: Int?, onCommit: @escaping (Int?) -> Void) {
        self.par = par
        self.strokesReceived = strokesReceived
        self.initialScore = initialScore
        self.onCommit = onCommit
        self._localScore = State(initialValue: initialScore)
    }

    var body: some View {
        VStack(spacing: 14) {
            header
            grid
            quickRow
            footerActions
        }
        .padding(20)
        .nordicBackground()
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 4) {
            Text("PAR \(par) · HCP +\(strokesReceived)")
                .font(Theme.labelFont(11))
                .tracking(1.6)
                .foregroundColor(Theme.ink3)

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(displayValue)
                    .font(Theme.statFont(64))
                    .foregroundColor(scoreTint)

                if let s = localScore, s > 0 {
                    Text(scoreName(strokes: s))
                        .font(Theme.labelFont(13))
                        .tracking(1.2)
                        .foregroundColor(Theme.ink2)
                }
            }
        }
    }

    private var displayValue: String {
        guard let s = localScore, s > 0 else { return "–" }
        return "\(s)"
    }

    private var scoreTint: Color {
        guard let s = localScore, s > 0 else { return Theme.ink3 }
        let diff = s - par
        if diff < 0 { return Theme.accent }
        if diff == 0 { return Theme.ink }
        return Theme.bad
    }

    private func scoreName(strokes: Int) -> String {
        let diff = strokes - par
        switch diff {
        case ..<(-3): return "Albatross"
        case -2:      return "Eagle"
        case -1:      return "Birdie"
        case 0:       return "Par"
        case 1:       return "Bogey"
        case 2:       return "Double"
        case 3:       return "Triple"
        default:      return "+\(diff)"
        }
    }

    // MARK: - Quick row (Par + ±1 + clear)

    private var quickRow: some View {
        HStack(spacing: 8) {
            quickChip(label: "PAR", value: par, tint: Theme.ink)
            if par > 1 {
                quickChip(label: "BIRDIE", value: par - 1, tint: Theme.accent)
            }
            quickChip(label: "BOGEY", value: par + 1, tint: Theme.warn)
            quickChip(label: "DBL", value: par + 2, tint: Theme.warn.opacity(0.75))
        }
    }

    private func quickChip(label: String, value: Int, tint: Color) -> some View {
        Button {
            commit(value)
        } label: {
            VStack(spacing: 2) {
                Text(label)
                    .font(Theme.labelFont(9))
                    .tracking(1.4)
                    .foregroundColor(tint)
                Text("\(value)")
                    .font(Theme.statFont(18))
                    .foregroundColor(tint)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Theme.surface2)
            .overlay(Rectangle().stroke(tint.opacity(0.4), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    // MARK: - 1–9 keypad

    private var grid: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 5)
        return LazyVGrid(columns: columns, spacing: 10) {
            ForEach(1...10, id: \.self) { value in
                Button {
                    commit(value)
                } label: {
                    Text("\(value)")
                        .font(Theme.statFont(28))
                        .foregroundColor(textTint(for: value))
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .background(bgTint(for: value))
                        .overlay(Rectangle().stroke(borderTint(for: value), lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func textTint(for value: Int) -> Color {
        if value == localScore { return Theme.accentInk }
        let diff = value - par
        if diff < 0 { return Theme.accent }
        if diff == 0 { return Theme.ink }
        return Theme.ink2
    }

    private func bgTint(for value: Int) -> Color {
        if value == localScore { return Theme.accent }
        return Theme.surface
    }

    private func borderTint(for value: Int) -> Color {
        if value == localScore { return Theme.accent }
        if value == par { return Theme.line }
        return Theme.line
    }

    // MARK: - Footer actions

    private var footerActions: some View {
        HStack(spacing: 10) {
            Button {
                commit(nil)
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "trash")
                    Text("CLEAR")
                        .tracking(1.4)
                }
                .secondaryButton()
            }

            Button {
                onCommit(localScore)
                dismiss()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark")
                    Text("DONE")
                        .tracking(1.4)
                }
                .primaryButton()
            }
        }
    }

    private func commit(_ value: Int?) {
        localScore = value
        onCommit(value)
    }
}

#Preview {
    ScorePadSheet(par: 3, strokesReceived: 1, initialScore: 4) { _ in }
}
