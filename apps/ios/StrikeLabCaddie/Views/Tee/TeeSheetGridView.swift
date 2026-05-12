//
//  TeeSheetGridView.swift
//  StrikeLabCaddie
//
//  GolfBox-killer day grid for iPhone — hour columns × 8-min rows, every
//  slot of the day on one screen with player dots, price, and peak/golden
//  tinting. Pinch and horizontal scroll to navigate.
//

import SwiftUI

struct TeeSheetGridView: View {
    @EnvironmentObject var nav: TeeNavigation
    let courseId: UUID
    let date: Date

    @State private var sheet: TeeSheet?
    @State private var selectedSlotId: UUID?
    @State private var players: Int = 2
    @State private var emptyOnly: Bool = false
    @State private var filter: SheetFilter = .all
    @State private var holdInFlight = false

    enum SheetFilter: String, CaseIterable, Hashable {
        case all = "ALL", empty = "EMPTY", morning = "MORNING", golden = "GOLDEN"
    }

    private let hours = Array(6..<20)
    private let minuteBuckets = [0, 8, 16, 24, 32, 40, 48]

    var body: some View {
        VStack(spacing: 0) {
            filterBar
            Divider().background(Theme.lineStrong)
            ScrollView([.horizontal, .vertical]) {
                grid
                    .padding(8)
            }
            if let slot = currentSlot {
                bottomBar(slot: slot)
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Day grid")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    nav.push(.window(courseId: courseId, date: date))
                } label: {
                    Text("WINDOW")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                }
                .tint(Theme.ink2)
            }
        }
        .task { await load() }
    }

    // MARK: helpers

    private var currentSlot: TeeSheetSlot? {
        guard let id = selectedSlotId else { return nil }
        return sheet?.slots.first(where: { $0.id == id })
    }

    private func slotMatrix() -> [String: TeeSheetSlot] {
        var m: [String: TeeSheetSlot] = [:]
        guard let slots = sheet?.slots else { return m }
        let cal = Calendar.current
        for s in slots {
            let h = cal.component(.hour, from: s.teeTime)
            let mn = cal.component(.minute, from: s.teeTime)
            m["\(h)-\(mn)"] = s
        }
        return m
    }

    private func passes(_ s: TeeSheetSlot) -> Bool {
        if s.isBlocked { return false }
        if emptyOnly && s.playersTaken > 0 { return false }
        let h = Calendar.current.component(.hour, from: s.teeTime)
        switch filter {
        case .all: return true
        case .empty: return s.playersTaken == 0
        case .morning: return (6..<11).contains(h)
        case .golden: return h >= 18
        }
    }

    private func conditionTint(_ hour: Int) -> Double {
        guard let h = sheet?.conditions?.hourly?.first(where: { $0.h == hour }) else { return 0 }
        return h.sun * (1 - h.rain)
    }

    // MARK: views

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                segmented(
                    label: "PLAYERS",
                    options: [1, 2, 3, 4],
                    selected: players,
                    label2: { "\($0)" }
                ) { players = $0 }
                segmented(
                    label: "VIEW",
                    options: SheetFilter.allCases,
                    selected: filter,
                    label2: { $0.rawValue }
                ) { filter = $0 }
                Toggle(isOn: $emptyOnly) {
                    Text("EMPTY ONLY")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.ink2)
                }
                .toggleStyle(.button)
                .tint(Theme.accent)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
        }
    }

    private func segmented<Option: Hashable>(
        label: String,
        options: [Option],
        selected: Option,
        label2: @escaping (Option) -> String,
        onPick: @escaping (Option) -> Void
    ) -> some View {
        HStack(spacing: 6) {
            TeeMicroLabel(text: label)
            HStack(spacing: 0) {
                ForEach(options, id: \.self) { opt in
                    Button {
                        onPick(opt)
                    } label: {
                        Text(label2(opt))
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .tracking(1.4)
                            .foregroundColor(opt == selected ? Theme.accentInk : Theme.ink2)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(opt == selected ? Theme.accent : Color.clear)
                    }
                    .buttonStyle(.plain)
                }
            }
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
        }
    }

    private var grid: some View {
        let matrix = slotMatrix()
        let cellWidth: CGFloat = 64
        let labelWidth: CGFloat = 44
        return VStack(alignment: .leading, spacing: 0) {
            // Header row: hours
            HStack(spacing: 0) {
                Text("")
                    .frame(width: labelWidth)
                ForEach(hours, id: \.self) { h in
                    Text(String(format: "%02d", h))
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.ink3)
                        .frame(width: cellWidth, alignment: .center)
                }
            }
            .padding(.bottom, 6)
            .background(Theme.bg)

            ForEach(minuteBuckets, id: \.self) { minute in
                HStack(spacing: 0) {
                    Text(String(format: ":%02d", minute))
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                        .frame(width: labelWidth, alignment: .trailing)
                        .padding(.trailing, 6)
                    ForEach(hours, id: \.self) { h in
                        let key = "\(h)-\(minute)"
                        let slot = matrix[key]
                        cell(slot: slot, hour: h)
                            .frame(width: cellWidth)
                    }
                }
                .padding(.vertical, 2)
            }
        }
    }

    @ViewBuilder
    private func cell(slot: TeeSheetSlot?, hour: Int) -> some View {
        if let s = slot {
            let valid = passes(s)
            let avail = s.playersTotal - s.playersTaken
            let isFull = avail <= 0 || s.isBlocked
            Button {
                if !isFull && valid { selectedSlotId = s.id }
            } label: {
                HStack(spacing: 4) {
                    TeeSlotDots(taken: s.playersTaken, total: s.playersTotal)
                    Spacer(minLength: 2)
                    if let p = s.priceAmount {
                        Text("\(Int(p.rounded()))")
                            .font(.system(size: 9, weight: .medium, design: .monospaced))
                            .opacity(0.85)
                    }
                }
                .padding(.horizontal, 4)
                .frame(maxWidth: .infinity, minHeight: 22)
                .background(
                    selectedSlotId == s.id
                        ? Theme.accent
                        : Theme.bg2
                )
                .foregroundColor(
                    selectedSlotId == s.id
                        ? Theme.accentInk
                        : isFull
                            ? Theme.ink4
                            : (s.golden ? Theme.ink : Theme.ink2)
                )
                .overlay(
                    Rectangle()
                        .stroke(
                            selectedSlotId == s.id
                                ? Theme.accent
                                : isFull
                                    ? Theme.lineStrong.opacity(0.5)
                                    : (s.golden ? Theme.accent.opacity(0.4) : Theme.lineStrong),
                            lineWidth: 1
                        )
                )
                .opacity(valid ? 1 : 0.25)
            }
            .buttonStyle(.plain)
            .disabled(isFull || !valid)
        } else {
            Rectangle()
                .stroke(Theme.lineStrong.opacity(0.3), lineWidth: 1)
                .frame(height: 22)
        }
    }

    private func bottomBar(slot: TeeSheetSlot) -> some View {
        let total = (slot.priceAmount ?? 0) * Double(players)
        return VStack(spacing: 8) {
            Divider().background(Theme.lineStrong)
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    TeeMicroLabel(text: "SELECTED")
                    Text(hhmm(slot.teeTime))
                        .font(.system(size: 28, weight: .medium, design: .monospaced))
                        .foregroundColor(Theme.ink)
                    Text("\(players) × \(Int((slot.priceAmount ?? 0).rounded())) kr = \(Int(total.rounded())) kr")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                }
                Spacer()
                Button {
                    Task { await holdAndContinue(slot: slot) }
                } label: {
                    Text(holdInFlight ? "…" : "NEXT →")
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.accentInk)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 14)
                        .background(Theme.accent)
                }
                .disabled(holdInFlight)
            }
            .padding(14)
        }
        .background(Theme.surfaceSolid)
    }

    private func holdAndContinue(slot: TeeSheetSlot) async {
        guard let sheet else { return }
        holdInFlight = true
        defer { holdInFlight = false }
        do {
            let payload = TeeHoldRequest(
                slotId: slot.id,
                courseId: sheet.courseId,
                courseName: sheet.courseName,
                teeTime: slot.teeTime,
                players: players,
                playerPayload: nil,
                provider: "internal",
                providerRef: slot.providerRef,
                priceAmount: slot.priceAmount,
                currency: slot.currency
            )
            let resp = try await TeeAPIClient.shared.hold(payload)
            nav.push(.group(holdId: resp.id, courseId: sheet.courseId))
        } catch {
            print("hold error: \(error)")
        }
    }

    private func load() async {
        do {
            self.sheet = try await TeeAPIClient.shared.teeSheet(courseId: courseId, date: date)
        } catch {
            print("sheet load error: \(error)")
        }
    }

    private func hhmm(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }
}
