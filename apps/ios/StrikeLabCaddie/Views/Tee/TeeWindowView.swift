//
//  TeeWindowView.swift
//  StrikeLabCaddie
//
//  "The Window" — the moment-not-time picker. Vertical sun ribbon + slot
//  chips placed at their actual hour:minute Y coordinate.
//

import SwiftUI

struct TeeWindowView: View {
    @EnvironmentObject var nav: TeeNavigation
    let courseId: UUID
    let date: Date

    @State private var sheet: TeeSheet?
    @State private var windows: [TeeBestWindow] = []
    @State private var selectedSlotId: UUID?
    @State private var players = 2
    @State private var holdInFlight = false

    private let startH = 5
    private let endH = 21
    private let rowPx: CGFloat = 38

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Best windows ribbon
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(windows) { w in
                                TeeWindowCard(window: w)
                            }
                        }
                    }
                    .padding(.horizontal, 14)

                    // The window itself
                    landscape
                        .padding(14)
                        .background(Theme.surfaceSolid)
                        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                        .padding(.horizontal, 14)
                }
                .padding(.vertical, 14)
            }
            if let slot = currentSlot {
                bottomBar(slot: slot)
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("The Window")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var currentSlot: TeeSheetSlot? {
        guard let id = selectedSlotId else { return nil }
        return sheet?.slots.first(where: { $0.id == id })
    }

    private var landscape: some View {
        let totalH = CGFloat(endH - startH) * rowPx
        let ribbonW: CGFloat = 56
        let yFor: (Double) -> CGFloat = { hf in CGFloat(hf - Double(startH)) * rowPx }
        return ZStack(alignment: .topLeading) {
            // Best window band
            if let w = windows.first {
                Rectangle()
                    .fill(Theme.accent.opacity(0.08))
                    .overlay(
                        Rectangle()
                            .stroke(Theme.accent.opacity(0.5), style: StrokeStyle(lineWidth: 1, dash: [3]))
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: yFor(Double(w.endHour)) - yFor(Double(w.startHour)))
                    .offset(y: yFor(Double(w.startHour)))
            }

            HStack(alignment: .top, spacing: 0) {
                // Hour ticks
                VStack(spacing: 0) {
                    ZStack(alignment: .topTrailing) {
                        Color.clear.frame(width: 30, height: totalH)
                        ForEach(startH...endH, id: \.self) { h in
                            Text(String(format: "%02d", h))
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(h % 3 == 0 ? Theme.ink2 : Theme.ink3.opacity(0.6))
                                .offset(y: yFor(Double(h)) - 6)
                        }
                    }
                }

                // Sun ribbon + wind line
                Canvas { ctx, size in
                    guard let hourly = sheet?.conditions?.hourly, !hourly.isEmpty else { return }
                    // Sun ribbon (vertical gradient based on per-hour sun)
                    let stops = hourly.map { h in
                        Gradient.Stop(
                            color: Theme.accent.opacity(0.05 + h.sun * 0.45),
                            location: CGFloat(h.h - startH) / CGFloat(endH - startH)
                        )
                    }
                    ctx.fill(
                        Path(CGRect(origin: .zero, size: size)),
                        with: .linearGradient(
                            Gradient(stops: stops),
                            startPoint: CGPoint(x: 0, y: 0),
                            endPoint: CGPoint(x: 0, y: size.height)
                        )
                    )

                    // Wind line
                    let maxWind = 14.0
                    var wp = Path()
                    for (i, h) in hourly.enumerated() {
                        let x = 4 + min(maxWind, h.w) / maxWind * (size.width - 8)
                        let y = yFor(Double(h.h))
                        if i == 0 { wp.move(to: CGPoint(x: x, y: y)) }
                        else { wp.addLine(to: CGPoint(x: x, y: y)) }
                    }
                    ctx.stroke(wp, with: .color(Theme.ink2.opacity(0.7)), lineWidth: 1.4)
                }
                .frame(width: ribbonW, height: totalH)

                // Slot chips
                ZStack(alignment: .topLeading) {
                    Color.clear.frame(maxWidth: .infinity).frame(height: totalH)
                    ForEach(visibleSlots) { slot in
                        let cal = Calendar.current
                        let h = Double(cal.component(.hour, from: slot.teeTime))
                        let m = Double(cal.component(.minute, from: slot.teeTime))
                        let y = yFor(h + m / 60.0)
                        slotChip(slot)
                            .offset(y: y - 11)
                    }
                }
                .padding(.leading, 12)
            }
            .frame(height: totalH)
        }
    }

    private var visibleSlots: [TeeSheetSlot] {
        (sheet?.slots ?? []).filter { !$0.isBlocked }
    }

    @ViewBuilder
    private func slotChip(_ slot: TeeSheetSlot) -> some View {
        let avail = slot.playersTotal - slot.playersTaken
        let isFull = avail <= 0 || slot.isBlocked
        let isSel = selectedSlotId == slot.id
        Button {
            if !isFull { selectedSlotId = slot.id }
        } label: {
            HStack(spacing: 6) {
                Text(hhmm(slot.teeTime))
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                Spacer(minLength: 0)
                TeeSlotDots(taken: slot.playersTaken, total: slot.playersTotal)
                if let p = slot.priceAmount {
                    Text("\(Int(p.rounded()))")
                        .font(.system(size: 10, design: .monospaced))
                        .opacity(0.7)
                }
            }
            .padding(.horizontal, 8)
            .frame(maxWidth: .infinity, minHeight: 22)
            .background(
                isSel ? Theme.accent : Theme.bg2
            )
            .foregroundColor(
                isSel ? Theme.accentInk : (isFull ? Theme.ink4 : Theme.ink)
            )
            .overlay(
                Rectangle().stroke(
                    isSel
                        ? Theme.accent
                        : (slot.golden ? Theme.accent.opacity(0.4) : Theme.lineStrong),
                    lineWidth: 1
                )
            )
        }
        .buttonStyle(.plain)
        .disabled(isFull)
    }

    private func bottomBar(slot: TeeSheetSlot) -> some View {
        let total = (slot.priceAmount ?? 0) * Double(players)
        return HStack {
            VStack(alignment: .leading, spacing: 4) {
                TeeMicroLabel(text: "SELECTED")
                Text(hhmm(slot.teeTime))
                    .font(.system(size: 28, weight: .medium, design: .monospaced))
                    .foregroundColor(Theme.ink)
                Text("\(Int(total.rounded())) kr")
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
            async let s = TeeAPIClient.shared.teeSheet(courseId: courseId, date: date)
            async let w = TeeAPIClient.shared.bestWindows(courseId: courseId, date: date)
            self.sheet = try await s
            self.windows = try await w
        } catch {
            print("window load error: \(error)")
        }
    }

    private func hhmm(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }
}
