//
//  TeeGroupView.swift
//  StrikeLabCaddie
//
//  Group ritual screen — fill 4 player slots from playmates / contacts,
//  pick split mode, continue to pay.
//

import SwiftUI

struct TeeGroupView: View {
    @EnvironmentObject var nav: TeeNavigation
    let hold: TeeHoldResponse

    @State private var participants: [Participant] = []
    @State private var playmates: [TeePlaymate] = []
    @State private var splitMode: String = "together"

    struct Participant: Identifiable, Hashable {
        let id = UUID()
        var userId: UUID?
        var name: String
        var initials: String
        var handicap: Double?
        var isYou: Bool = false
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                holdPanel

                // 4 player slots
                VStack(spacing: 0) {
                    ForEach(0..<4, id: \.self) { idx in
                        slotRow(index: idx)
                        if idx < 3 {
                            Divider().background(Theme.lineStrong)
                        }
                    }
                }
                .background(Theme.surfaceSolid)
                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))

                // Recently played with
                if !playmates.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        TeeMicroLabel(text: "RECENTLY PLAYED WITH")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(playmates) { p in
                                    Button {
                                        addPlaymate(p)
                                    } label: {
                                        VStack(spacing: 6) {
                                            Text(initials(p.displayName ?? "Spiller"))
                                                .font(.system(size: 14, weight: .medium, design: .monospaced))
                                                .frame(width: 48, height: 48)
                                                .background(Theme.surface2)
                                                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                                            Text((p.displayName ?? "Spiller").components(separatedBy: " ").first ?? "")
                                                .font(.system(size: 10, design: .monospaced))
                                                .foregroundColor(Theme.ink2)
                                                .frame(maxWidth: 64)
                                                .truncationMode(.tail)
                                                .lineLimit(1)
                                        }
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }

                // Split toggle
                HStack(spacing: 6) {
                    splitButton("TOGETHER", value: "together")
                    splitButton("SPLIT", value: "split")
                }

                // Continue
                Button {
                    nav.push(.pay(hold: hold, splitMode: splitMode))
                } label: {
                    Text("CONTINUE TO PAY →")
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.accentInk)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.accent)
                }
                .padding(.top, 6)
            }
            .padding(18)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Your group")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                TeeMicroLabel(text: "2 / 3")
                BetaBadge()
            }
            Text("Who's in?")
                .font(.system(size: 32, weight: .medium))
                .foregroundColor(Theme.ink)
                .kerning(-1)
        }
    }

    private var holdPanel: some View {
        SLPanel(id: "Hold", title: hold.courseName, trailing: hold.status) {
            HStack(alignment: .firstTextBaseline) {
                SLMetric(label: "Tee time", value: hhmm(hold.teeTime), tint: Theme.accent)
                Spacer()
                SLMetric(label: "Players", value: "\(hold.players)", unit: "held")
                Spacer()
                SLMetric(
                    label: "Total",
                    value: "\(Int((hold.totalAmount ?? 0).rounded()))",
                    unit: hold.currency
                )
            }
        }
    }

    private func slotRow(index: Int) -> some View {
        let player = participants[safe: index]
        return HStack(spacing: 12) {
            Group {
                if let p = player {
                    Text(p.initials)
                        .font(.system(size: 14, weight: .medium, design: .monospaced))
                        .foregroundColor(p.isYou ? Theme.accentInk : Theme.ink)
                        .frame(width: 36, height: 36)
                        .background(p.isYou ? Theme.accent : Theme.surface2)
                } else {
                    Image(systemName: "plus")
                        .foregroundColor(Theme.ink3)
                        .frame(width: 36, height: 36)
                        .overlay(
                            Rectangle().stroke(Theme.lineStrong, style: StrokeStyle(lineWidth: 1, dash: [3]))
                        )
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                if let p = player {
                    Text(p.name)
                        .font(.system(size: 14))
                        .foregroundColor(Theme.ink)
                    Text(p.handicap.map { String(format: "HCP %.1f", $0) } ?? "HCP —")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                } else {
                    Text("Add player · \(index + 1)")
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(Theme.ink2)
                }
            }
            Spacer()
            if let p = player, !p.isYou {
                Button {
                    participants.removeAll(where: { $0.id == p.id })
                } label: {
                    Text("REMOVE")
                        .font(.system(size: 9, weight: .semibold, design: .monospaced))
                        .tracking(1.4)
                        .foregroundColor(Theme.ink3)
                }
            }
        }
        .padding(14)
    }

    private func splitButton(_ label: String, value: String) -> some View {
        Button {
            splitMode = value
        } label: {
            Text(label)
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .tracking(1.6)
                .foregroundColor(splitMode == value ? Theme.accentInk : Theme.ink2)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(splitMode == value ? Theme.accent : Color.clear)
                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func initials(_ s: String) -> String {
        s.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined().uppercased()
    }

    private func hhmm(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }

    private func addPlaymate(_ p: TeePlaymate) {
        guard participants.count < 4 else { return }
        let name = p.displayName ?? "Spiller"
        if let userId = p.friendUserId,
           participants.contains(where: { $0.userId == userId }) {
            return
        }
        participants.append(
            Participant(
                userId: p.friendUserId,
                name: name,
                initials: initials(name),
                handicap: p.handicap,
                isYou: false
            )
        )
    }

    private func load() async {
        // Always start with "you"
        if participants.isEmpty {
            participants = [
                Participant(name: "You", initials: "Y", handicap: nil, isYou: true)
            ]
        }
        do {
            self.playmates = try await TeeAPIClient.shared.playmates()
        } catch {
            print("playmates load error: \(error)")
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
