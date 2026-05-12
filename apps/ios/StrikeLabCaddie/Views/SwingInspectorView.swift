//
//  SwingInspectorView.swift
//  StrikeLabCaddie
//
//  Lists the last 50 enhanced shots from the watch with raw sparklines,
//  export-as-JSON, and opens the Swing Card (same “one window, one number”
//  language as StrikelabDesign/swing-watch — the interactive HTML/JSX mock
//  lives in that folder on the repo; the product UI is SwiftUI here).
//

import SwiftUI

struct SwingInspectorView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager

    var body: some View {
        Group {
            if persistenceManager.recentEnhancedShots.isEmpty {
                emptyState
            } else {
                List {
                    Section {
                        Text("Most recent first. Tap a row for raw sensor data, or Open Swing Card for the tempo hero + range bar (like swing-watch). Range list: Practice → live session → Full stats.")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink3)
                    }
                    Section {
                        ForEach(persistenceManager.recentEnhancedShots) { event in
                            NavigationLink(value: event.id) {
                                row(for: event)
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .navigationDestination(for: UUID.self) { id in
                    if let event = persistenceManager.enhancedShot(byId: id) {
                        SwingDetailView(event: event)
                    } else {
                        Text("Swing not in the recent buffer. Open the same swing from Practice → range swing list.")
                            .foregroundColor(Theme.ink3)
                    }
                }
            }
        }
        .navigationTitle("Swing insights")
        .navigationBarTitleDisplayMode(.inline)
        .nordicBackground()
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "scope")
                .font(.system(size: 56))
                .foregroundColor(Theme.ink3)
            Text("No swings captured yet")
                .font(Theme.titleFont(20))
                .foregroundColor(Theme.ink)
            Text("Start a range session on the watch and hit a few balls. Enhanced swings appear here within ~2 s.")
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg)
    }

    private func row(for event: EnhancedShotEvent) -> some View {
        let m = event.motionData
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(event.club?.shortName ?? "?")
                    .font(Theme.statFont(15))
                    .foregroundColor(Theme.ink)
                    .frame(width: 36, alignment: .leading)
                Text(event.timestamp.formatted(date: .omitted, time: .standard))
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink2)
                Spacer()
                if let m {
                    Text("peak \(String(format: "%.1f", m.peakAcceleration))g")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.accent)
                }
            }
            HStack(spacing: 12) {
                if let m {
                    Sparkline(values: m.accelerationProfile)
                        .frame(width: 90, height: 18)
                    Sparkline(values: m.gyroProfile)
                        .frame(width: 90, height: 18)
                    Text("\(m.samples.count) samp · tempo \(String(format: "%.2f", m.swingTempo))s")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
                Spacer()
                if let hr = event.heartRateData?.heartRate, hr > 0 {
                    Text("\(Int(hr)) bpm")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.warn)
                }
            }
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Detail

private struct SwingDetailView: View {
    let event: EnhancedShotEvent

    @EnvironmentObject var persistenceManager: PersistenceManager
    @State private var didCopyJSON = false
    @State private var showCard = false
    #if DEBUG
    @State private var selfTestResults: [SwingAnalyticsSelfTest.Result] = []
    @State private var showSelfTest = false
    #endif

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                summaryHeader
                if let m = event.motionData {
                    motionSection(m)
                }
                if let hr = event.heartRateData {
                    hrSection(hr)
                }
                openCardButton
                #if DEBUG
                runSelfTestButton
                if showSelfTest { selfTestSection }
                #endif
                exportButton
            }
            .padding(16)
        }
        .nordicBackground()
        .navigationTitle(event.club?.shortName ?? "Swing")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showCard) {
            SwingCardView(
                event: event,
                recentBaseline: persistenceManager.recentEnhancedShots
            )
            .environmentObject(persistenceManager)
        }
    }

    private var openCardButton: some View {
        Button { showCard = true } label: {
            HStack {
                Image(systemName: "waveform.path.ecg")
                Text("Open Swing Card")
            }
            .font(Theme.labelFont(11))
            .tracking(1.0)
            .foregroundColor(Theme.accentInk)
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(Theme.accent)
        }
        .buttonStyle(.plain)
    }

    #if DEBUG
    private var runSelfTestButton: some View {
        Button {
            selfTestResults = SwingAnalyticsSelfTest.run()
            showSelfTest = true
        } label: {
            HStack {
                Image(systemName: "checkmark.shield")
                Text("Run analytics self-test")
            }
            .font(Theme.labelFont(11))
            .tracking(1.0)
            .foregroundColor(Theme.ink)
            .frame(maxWidth: .infinity, minHeight: 36)
            .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var selfTestSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("ANALYTICS SELF-TEST")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            ForEach(selfTestResults.indices, id: \.self) { i in
                let r = selfTestResults[i]
                HStack(spacing: 8) {
                    Image(systemName: r.pass ? "checkmark.circle.fill" : "xmark.octagon.fill")
                        .foregroundColor(r.pass ? Theme.accent : Theme.bad)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(r.name)
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink)
                        Text(r.detail)
                            .font(Theme.labelFont(9))
                            .foregroundColor(Theme.ink3)
                    }
                }
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }
    #endif

    private var summaryHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("CAPTURED")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(event.timestamp.formatted(date: .abbreviated, time: .standard))
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink2)
            }
            HStack(spacing: 14) {
                stat("CLUB", value: event.club?.shortName ?? "?")
                stat("CONF", value: event.confidence.map { String(format: "%.2f", $0) } ?? "—")
                stat("AUTO", value: event.isManual ? "no" : "yes")
                stat("MIC", value: event.motionData?.impactConfirmed == true ? "yes" : "no")
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func stat(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(15))
                .foregroundColor(Theme.ink)
        }
    }

    private func motionSection(_ m: SwingMotionData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MOTION")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)

            HStack(spacing: 12) {
                stat("PEAK G", value: String(format: "%.2f", m.peakAcceleration))
                stat("PEAK ω", value: String(format: "%.1f", m.peakRotationRate))
                stat("TEMPO", value: String(format: "%.2fs", m.swingTempo))
                stat("Hz", value: "\(Int(round(1.0 / max(0.001, m.sampleInterval))))")
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("|userAcceleration| (g)")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
                Sparkline(values: m.samples.map(\.aMag), markers: m.phases)
                    .frame(height: 60)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("|rotationRate| (rad/s)")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
                Sparkline(values: m.samples.map(\.gMag), markers: m.phases)
                    .frame(height: 60)
            }

            HStack(spacing: 12) {
                phaseBadge("BACK", index: m.phases.backswingStartIdx, total: m.samples.count)
                phaseBadge("TOP", index: m.phases.topIdx, total: m.samples.count)
                phaseBadge("IMPACT", index: m.phases.impactIdx, total: m.samples.count)
                phaseBadge("FINISH", index: m.phases.finishIdx, total: m.samples.count)
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func phaseBadge(_ label: String, index: Int, total: Int) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
            Text("\(index)/\(max(1, total - 1))")
                .font(Theme.statFont(13))
                .foregroundColor(Theme.accent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func hrSection(_ hr: HeartRateData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HEART RATE")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)

            HStack(spacing: 12) {
                stat("@ IMPACT", value: String(format: "%.0f bpm", hr.heartRate))
                stat("PRE", value: hr.preMedian.map { String(format: "%.0f", $0) } ?? "—")
                stat("POST", value: hr.postMedian.map { String(format: "%.0f", $0) } ?? "—")
                stat("HRV", value: hr.hrv.map { String(format: "%.0f ms", $0) } ?? "—")
            }

            if let snapshot = hr.snapshot, !snapshot.samples.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("HR over ±30s of impact")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                    Sparkline(values: snapshot.samples.map(\.bpm))
                        .frame(height: 60)
                }
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var exportButton: some View {
        Button {
            export()
        } label: {
            HStack {
                Image(systemName: didCopyJSON ? "checkmark" : "square.and.arrow.up")
                Text(didCopyJSON ? "Copied JSON to clipboard" : "Export as JSON fixture")
            }
            .font(Theme.labelFont(11))
            .tracking(1.0)
            .foregroundColor(Theme.accentInk)
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(Theme.accent)
        }
        .buttonStyle(.plain)
    }

    private func export() {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(event),
              let str = String(data: data, encoding: .utf8) else { return }
        UIPasteboard.general.string = str
        didCopyJSON = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            didCopyJSON = false
        }
    }
}

// MARK: - Sparkline

/// Tiny inline sparkline. Optional `markers` overlays vertical lines at
/// the four phase indices for visual phase verification.
struct Sparkline: View {
    let values: [Double]
    var markers: SwingPhaseMarkers?

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Baseline
                Path { p in
                    p.move(to: CGPoint(x: 0, y: geo.size.height))
                    p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                }.stroke(Theme.line, lineWidth: 0.5)

                // Trace
                if values.count >= 2,
                   let maxVal = values.max(), maxVal > 0 {
                    Path { p in
                        for (i, v) in values.enumerated() {
                            let x = CGFloat(i) / CGFloat(values.count - 1) * geo.size.width
                            let y = geo.size.height * (1.0 - CGFloat(v / maxVal))
                            if i == 0 { p.move(to: CGPoint(x: x, y: y)) }
                            else { p.addLine(to: CGPoint(x: x, y: y)) }
                        }
                    }
                    .stroke(Theme.accent, lineWidth: 1)
                }

                // Phase markers
                if let m = markers, values.count >= 2 {
                    let total = CGFloat(values.count - 1)
                    let xs: [(Int, Color)] = [
                        (m.backswingStartIdx, Theme.ink3),
                        (m.topIdx, Theme.warn),
                        (m.impactIdx, Theme.bad),
                        (m.finishIdx, Theme.ink3)
                    ]
                    ForEach(0..<xs.count, id: \.self) { i in
                        let x = CGFloat(xs[i].0) / total * geo.size.width
                        Path { p in
                            p.move(to: CGPoint(x: x, y: 0))
                            p.addLine(to: CGPoint(x: x, y: geo.size.height))
                        }.stroke(xs[i].1, lineWidth: 0.6)
                    }
                }
            }
        }
    }
}
