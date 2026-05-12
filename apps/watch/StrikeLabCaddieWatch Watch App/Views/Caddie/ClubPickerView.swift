import SwiftUI

struct ClubPickerView: View {
    var clubs: [ClubChoice]
    var suggested: String
    var onConfirm: (ClubChoice) -> Void

    @State private var selectionIndex: Int = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("CLUB")
                .font(SLW.mono(9))
                .tracking(1.6)
                .foregroundColor(SLW.ink3)

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 4) {
                        ForEach(Array(clubs.enumerated()), id: \.element.id) { idx, club in
                            ClubRow(
                                club: club,
                                isSelected: idx == selectionIndex,
                                isSuggested: club.label == suggested
                            )
                            .id(club.id)
                            .onTapGesture { selectionIndex = idx }
                        }
                    }
                }
                .focusable(true)
                .digitalCrownRotation(
                    Binding(get: {
                        Double(selectionIndex)
                    }, set: { newValue in
                        let clamped = max(0, min(clubs.count - 1, Int(newValue.rounded())))
                        if clamped != selectionIndex {
                            selectionIndex = clamped
                            proxy.scrollTo(clubs[clamped].id, anchor: .center)
                        }
                    }),
                    from: 0,
                    through: Double(max(clubs.count - 1, 0)),
                    by: 1,
                    sensitivity: .medium,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )
            }

            Button(action: { onConfirm(clubs[selectionIndex]) }) {
                Text("CONFIRM \(clubs[selectionIndex].label.uppercased())")
                    .font(SLW.mono(10, weight: .semibold))
                    .tracking(1.8)
                    .foregroundColor(SLW.accentInk)
                    .frame(maxWidth: .infinity, minHeight: 30)
            }
            .background(SLW.accent)
            .buttonStyle(.plain)
        }
        .padding(8)
        .background(SLW.bg)
    }
}

struct ClubChoice: Identifiable, Hashable {
    var id: String { label }
    let label: String
    let carryYards: Int
    let deltaToTarget: Int
}

private struct ClubRow: View {
    var club: ClubChoice
    var isSelected: Bool
    var isSuggested: Bool

    var body: some View {
        HStack {
            Text(club.label.uppercased())
                .font(SLW.mono(11, weight: isSuggested ? .semibold : .regular))
                .foregroundColor(isSuggested ? SLW.accent : SLW.ink2)
                .frame(width: 32, alignment: .leading)
            Text("\(club.carryYards)")
                .font(SLW.num(13))
                .foregroundColor(SLW.ink)
            Spacer()
            Text(club.deltaToTarget == 0 ? "·" : "\(club.deltaToTarget > 0 ? "+" : "")\(club.deltaToTarget)")
                .font(SLW.mono(10))
                .foregroundColor(club.deltaToTarget < 0 ? SLW.warn : SLW.ink3)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(isSelected ? SLW.surface2 : SLW.surface.opacity(0.4))
        .overlay(Rectangle().stroke(isSelected ? SLW.accent : SLW.line, lineWidth: 1))
    }
}
