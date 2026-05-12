//
//  TeePreferencesView.swift
//  StrikeLabCaddie
//
//  Booking preferences — time bands, weather caps, course types, and
//  privacy / handicap visibility toggles.
//

import SwiftUI

struct TeePreferencesView: View {
    @State private var prefs: TeeBookingPreferences?
    @State private var error: String?
    @State private var saveNotice: String?
    @State private var usingLocalDraft = false
    @State private var saving = false

    private let timeBands: [(String, String)] = [
        ("early", "06–08"),
        ("morning", "08–11"),
        ("midday", "11–14"),
        ("afternoon", "14–18"),
        ("golden", "18–20"),
        ("twilight", "20–22"),
    ]
    private let courseTypes = [
        "parkland", "links", "championship",
        "lakeside", "farmland", "mountain", "fjord"
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                if usingLocalDraft {
                    offlineBanner
                    if let error {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundColor(Theme.ink2)
                    }
                }
                if let saveNotice {
                    Text(saveNotice)
                        .font(.system(size: 12))
                        .foregroundColor(saveNotice.contains("saved") ? Theme.accent : Theme.warn)
                }
                if var p = prefs {
                    bandSection(prefs: Binding(get: { p }, set: { prefs = $0; p = $0 }))
                    weatherSection(prefs: Binding(get: { p }, set: { prefs = $0; p = $0 }))
                    courseTypeSection(prefs: Binding(get: { p }, set: { prefs = $0; p = $0 }))
                    toggleSection(prefs: Binding(get: { p }, set: { prefs = $0; p = $0 }))
                    saveButton
                } else {
                    ProgressView().tint(Theme.accent)
                }
            }
            .padding(18)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Preferences")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var offlineBanner: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "icloud.slash")
                .foregroundColor(Theme.warn)
            Text("Showing on-device defaults. They are not saved to StrikeLab until the Tee service is reachable.")
                .font(.system(size: 12))
                .foregroundColor(Theme.ink3)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.warn.opacity(0.12))
        .overlay(Rectangle().stroke(Theme.warn.opacity(0.45), lineWidth: 1))
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            TeeMicroLabel(text: "TEE · PREFERENCES")
            Text("Tune what \"Best Now\" means for you.")
                .font(.system(size: 26, weight: .medium))
                .foregroundColor(Theme.ink)
                .kerning(-0.5)
            Text("Nothing leaves your account.")
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(Theme.ink3)
        }
    }

    @ViewBuilder
    private func bandSection(prefs: Binding<TeeBookingPreferences>) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            TeeMicroLabel(text: "TIME BANDS")
            FlowChips(items: timeBands.map { $0.1 }) { idx in
                let id = timeBands[idx].0
                let cur = prefs.wrappedValue.timeBands ?? []
                if cur.contains(id) {
                    prefs.wrappedValue.timeBands = cur.filter { $0 != id }
                } else {
                    prefs.wrappedValue.timeBands = cur + [id]
                }
            } isOn: { idx in
                (prefs.wrappedValue.timeBands ?? []).contains(timeBands[idx].0)
            }
        }
    }

    @ViewBuilder
    private func weatherSection(prefs: Binding<TeeBookingPreferences>) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            TeeMicroLabel(text: "WEATHER CAPS")
            HStack(spacing: 10) {
                NumberField(label: "MAX WIND m/s",
                            value: Binding(
                                get: { prefs.wrappedValue.maxWindMs.map { String(Int($0)) } ?? "" },
                                set: { prefs.wrappedValue.maxWindMs = Double($0) }))
                NumberField(label: "MAX RAIN %",
                            value: Binding(
                                get: { prefs.wrappedValue.maxRainPct.map { String(Int($0 * 100)) } ?? "" },
                                set: { prefs.wrappedValue.maxRainPct = (Double($0) ?? 0) / 100.0 }))
                NumberField(label: "MIN TEMP °C",
                            value: Binding(
                                get: { prefs.wrappedValue.minTempC.map { String(Int($0)) } ?? "" },
                                set: { prefs.wrappedValue.minTempC = Double($0) }))
            }
        }
    }

    @ViewBuilder
    private func courseTypeSection(prefs: Binding<TeeBookingPreferences>) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            TeeMicroLabel(text: "COURSE TYPES")
            FlowChips(items: courseTypes.map { $0.uppercased() }) { idx in
                let id = courseTypes[idx]
                let cur = prefs.wrappedValue.courseTypes ?? []
                if cur.contains(id) {
                    prefs.wrappedValue.courseTypes = cur.filter { $0 != id }
                } else {
                    prefs.wrappedValue.courseTypes = cur + [id]
                }
            } isOn: { idx in
                (prefs.wrappedValue.courseTypes ?? []).contains(courseTypes[idx])
            }
        }
    }

    @ViewBuilder
    private func toggleSection(prefs: Binding<TeeBookingPreferences>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            TeeMicroLabel(text: "GROUP & PRIVACY")
            Toggle("Solo only — block strangers", isOn: prefs.soloOnly)
            Toggle("Walking only", isOn: prefs.walkingOnly)
            Toggle("Show me as available to be paired", isOn: prefs.showToPairs)
            Toggle("Show my handicap to other players", isOn: prefs.handicapVisible)
        }
        .toggleStyle(SwitchToggleStyle(tint: Theme.accent))
        .foregroundColor(Theme.ink)
    }

    private var saveButton: some View {
        Button {
            Task { await save() }
        } label: {
            Text(saving ? "…" : "SAVE PREFERENCES")
                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                .tracking(1.6)
                .foregroundColor(Theme.accentInk)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Theme.accent)
        }
        .disabled(saving)
    }

    private func load() async {
        error = nil
        saveNotice = nil
        do {
            self.prefs = try await TeeAPIClient.shared.preferences()
            self.usingLocalDraft = false
        } catch {
            self.prefs = TeeBookingPreferences.localDraftDefaults()
            self.usingLocalDraft = true
            self.error = TeeUserFacingError.message(for: error)
        }
    }

    private func save() async {
        guard let p = prefs else { return }
        saving = true
        saveNotice = nil
        defer { saving = false }
        do {
            let payload = TeeBookingPreferencesUpdate(
                timeBands: p.timeBands,
                maxWindMs: p.maxWindMs,
                maxRainPct: p.maxRainPct,
                minTempC: p.minTempC,
                courseTypes: p.courseTypes,
                soloOnly: p.soloOnly,
                noGroupsBehindMin: p.noGroupsBehindMin,
                walkingOnly: p.walkingOnly,
                favoriteCourseId: p.favoriteCourseId,
                defaultPlayerIds: p.defaultPlayerIds,
                showToPairs: p.showToPairs,
                handicapVisible: p.handicapVisible
            )
            self.prefs = try await TeeAPIClient.shared.updatePreferences(payload)
            self.usingLocalDraft = false
            self.saveNotice = "Preferences saved."
        } catch {
            self.saveNotice = TeeUserFacingError.message(for: error)
        }
    }
}

// MARK: - Tiny field + chip helpers

private struct NumberField: View {
    let label: String
    @Binding var value: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            TeeMicroLabel(text: label)
            TextField("—", text: $value)
                .keyboardType(.decimalPad)
                .textFieldStyle(.plain)
                .padding(10)
                .background(Theme.bg2)
                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                .foregroundColor(Theme.ink)
                .font(.system(size: 13, design: .monospaced))
        }
    }
}

private struct FlowChips: View {
    let items: [String]
    let onTap: (Int) -> Void
    let isOn: (Int) -> Bool

    var body: some View {
        // Single-line wrap using an HStack inside a flow layout proxy.
        WrappingHStack(items.indices.map { $0 }, spacing: 8, lineSpacing: 8) { idx in
            Button {
                onTap(idx)
            } label: {
                Text(items[idx])
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .tracking(1.6)
                    .foregroundColor(isOn(idx) ? Theme.accentInk : Theme.ink2)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(isOn(idx) ? Theme.accent : Color.clear)
                    .overlay(Rectangle().stroke(isOn(idx) ? Theme.accent : Theme.lineStrong, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
    }
}

/// Lightweight wrapping HStack — falls back to a flexible Layout in iOS 16+.
private struct WrappingHStack<Data: RandomAccessCollection, Content: View>: View
where Data.Element: Hashable {
    let data: Data
    let spacing: CGFloat
    let lineSpacing: CGFloat
    let content: (Data.Element) -> Content

    init(_ data: Data, spacing: CGFloat = 8, lineSpacing: CGFloat = 8,
         @ViewBuilder content: @escaping (Data.Element) -> Content) {
        self.data = data
        self.spacing = spacing
        self.lineSpacing = lineSpacing
        self.content = content
    }

    var body: some View {
        TeeFlowLayout(spacing: spacing, lineSpacing: lineSpacing) {
            ForEach(Array(data), id: \.self) { item in
                content(item)
            }
        }
    }
}

private struct TeeFlowLayout: Layout {
    var spacing: CGFloat
    var lineSpacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var lineHeight: CGFloat = 0
        for sub in subviews {
            let s = sub.sizeThatFits(.unspecified)
            if x + s.width > maxWidth {
                x = 0
                y += lineHeight + lineSpacing
                lineHeight = 0
            }
            x += s.width + spacing
            lineHeight = max(lineHeight, s.height)
        }
        return CGSize(width: maxWidth, height: y + lineHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var x: CGFloat = bounds.minX
        var y: CGFloat = bounds.minY
        var lineHeight: CGFloat = 0
        for sub in subviews {
            let s = sub.sizeThatFits(.unspecified)
            if x + s.width > bounds.minX + maxWidth {
                x = bounds.minX
                y += lineHeight + lineSpacing
                lineHeight = 0
            }
            sub.place(at: CGPoint(x: x, y: y), anchor: .topLeading,
                      proposal: ProposedViewSize(s))
            x += s.width + spacing
            lineHeight = max(lineHeight, s.height)
        }
    }
}
