//
//  SwingCardView.swift
//  StrikeLabCaddie
//
//  Phase 2 — the visible payoff. Bottom-sheet card opened from any
//  logged swing (range log row, round timeline). Four sections:
//    • Speed dial    — clubhead + hand mph, vs your 30-day baseline
//    • Tempo trace   — accel-magnitude strip with phase markers
//    • Plane axis    — top-down + side-on plane vector vs reference
//    • HR strip      — 60s window with HR @ impact circled, pressure idx
//
//  Renders deterministically from a `SwingMotionData` + `HeartRateData`
//  via `SwingAnalytics.summary(...)`. Same input → byte-identical output.
//

import SwiftUI
import Charts
import simd

struct SwingCardView: View {

    let event: EnhancedShotEvent
    /// Other recent enhanced shots, used to compute "vs your 30-day avg"
    /// deltas for the speed dial. Pass `[]` to skip the delta.
    var recentBaseline: [EnhancedShotEvent] = []
    /// Player's arm length (m). Defaults to 0.70 m if not set.
    var armLengthMeters: Double? = nil
    /// Player's age — used for HR-max in pressure index.
    var playerAgeYears: Int = 35
    /// Player's resting HR baseline.
    var restingBpm: Double = 60
    /// Per-club calibration models (Phase 4). Pass to enable the
    /// "Estimated carry: 154 yds (±6)" line under the speed dial.
    var clubModels: [String: ClubModel] = [:]

    @EnvironmentObject var persistenceManager: PersistenceManager

    @Environment(\.dismiss) private var dismiss

    @State private var showDetails = false
    @State private var showDeepDetails = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    // Impact clip is primary sensory feedback — keep it above the fold.
                    SwingAudioPlayerCard(swingId: event.id)
                        .id(event.id)

                    if let motion = event.motionData,
                       let club = event.club {
                        let summary = SwingAnalytics.summary(
                            for: motion,
                            club: club,
                            hr: event.heartRateData,
                            armLengthMeters: armLengthMeters,
                            restingBpm: restingBpm,
                            playerAgeYears: playerAgeYears
                        )
                        let window = persistenceManager.player.personalWindows[club.rawValue]
                            ?? PersonalWindow.fallback(for: club)
                        let grade = SwingGrade.compute(
                            summary: summary,
                            referencePlane: referenceAxis(for: club),
                            personalWindow: window
                        )
                        let recentTempos: [Double] = recentBaseline.compactMap { evt in
                            guard evt.club == club, let m = evt.motionData else { return nil }
                            return SwingAnalytics.tempo(m).ratio
                        }

                        swingHero(summary: summary, window: window, recentTempos: recentTempos)
                        SwingSignatureView(summary: summary, window: window)
                        SwingTrendStrip(
                            current: event,
                            baseline: recentBaseline,
                            armLengthMeters: armLengthMeters ?? 0.70,
                            referenceSwing: persistenceManager.referenceSwing(for: club),
                            personalWindow: window
                        )

                        DisclosureGroup(isExpanded: $showDeepDetails) {
                            VStack(spacing: 14) {
                                SwingGradeCard(grade: grade)
                                pinReferenceRow(club: club)
                                SwingTipCard(grade: grade)
                                SwingTempoGauge(tempo: summary.tempo)
                                SwingPhaseBar(motion: motion)
                                SwingSpeedGauge(
                                    summary: summary,
                                    baseline: baselineSpeeds(for: club),
                                    clubModel: clubModels[club.rawValue]
                                )
                                SwingSmoothnessGauge(smoothness: summary.smoothness)
                                planeView(motion: motion, summary: summary)
                                if let pressure = summary.pressure {
                                    SwingPressureGauge(pressure: pressure)
                                }
                                if event.heartRateData?.snapshot?.samples.isEmpty == false {
                                    hrStrip(summary: summary, hr: event.heartRateData)
                                }

                                DisclosureGroup(isExpanded: $showDetails) {
                                    tempoTrace(motion: motion, summary: summary)
                                        .padding(.top, 6)
                                } label: {
                                    Text(showDetails ? "HIDE RAW ACCEL TRACE" : "SHOW RAW ACCEL TRACE")
                                        .font(Theme.labelFont(10))
                                        .tracking(1.4)
                                        .foregroundColor(Theme.ink3)
                                }
                                .padding(14)
                                .background(Theme.surface)
                                .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                            }
                            .padding(.top, 6)
                        } label: {
                            Text(showDeepDetails ? "HIDE SWING DETAILS" : "SHOW SWING DETAILS · 11 metrics")
                                .font(Theme.labelFont(10))
                                .tracking(1.2)
                                .foregroundColor(Theme.ink3)
                        }
                        .padding(14)
                        .background(Theme.surface)
                        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                    } else {
                        metricsUnavailable
                    }

                    sensorAccuracyFootnote
                }
                .padding(16)
            }
            .nordicBackground()
            .navigationTitle(event.club?.shortName ?? "Swing")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .foregroundColor(Theme.ink2)
                    }
                }
            }
        }
    }

    // MARK: - Hero (one number + range bar)

    private func swingHero(summary: SwingSummary, window: PersonalWindow, recentTempos: [Double]) -> some View {
        let ratio = summary.tempo.ratio
        let ratioStr = ratio.map { String(format: "%.2f", $0) } ?? "—"
        let inWin = ratio.map { window.tempoContains($0) } ?? false
        let drift = driftLine(summary: summary, window: window)
        let rtail = Array(recentTempos.suffix(5))

        return VStack(alignment: .leading, spacing: 10) {
            Text("TEMPO")
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)

            Text(ratioStr)
                .font(Theme.statFont(44))
                .foregroundColor(inWin ? Theme.accent : Theme.ink)

            if !drift.isEmpty {
                Text(drift)
                    .font(Theme.bodyFont(14))
                    .italic()
                    .foregroundColor(Theme.ink2)
            }

            if let r = ratio {
                SwingRangeBar(
                    value: r,
                    windowLo: window.tempoWindowLo,
                    windowHi: window.tempoWindowHi,
                    careerLo: window.tempoCareerLo,
                    careerHi: window.tempoCareerHi,
                    recent: rtail
                )
            } else {
                Text("Couldn't read tempo for this swing.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func driftLine(summary: SwingSummary, window: PersonalWindow) -> String {
        if summary.segmentationUnreliable {
            return "Couldn't read this swing — try again."
        }
        guard let r = summary.tempo.ratio else { return "" }
        if window.tempoContains(r) { return "" }
        let mid = (window.tempoWindowLo + window.tempoWindowHi) / 2
        let delta = r - mid
        if delta > 0.08 {
            return String(format: "Tempo trending quick by %.2f.", abs(delta))
        }
        if delta < -0.08 {
            return String(format: "Tempo trending slow by %.2f.", abs(delta))
        }
        return "Tempo sits outside your usual window."
    }

    // MARK: - Pin reference row

    private func pinReferenceRow(club: Club) -> some View {
        let isPinned = persistenceManager.pinnedReferences[club.rawValue] == event.id
        let pinnedAnother = persistenceManager.pinnedReferences[club.rawValue] != nil && !isPinned

        return Button {
            if isPinned {
                persistenceManager.clearReference(for: club)
            } else {
                persistenceManager.pinReference(club: club, swingId: event.id)
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: isPinned ? "pin.fill" : "pin")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(isPinned ? Theme.accent : Theme.ink2)
                VStack(alignment: .leading, spacing: 1) {
                    Text(isPinned
                         ? "PINNED · the trend strip below tracks against this swing"
                         : (pinnedAnother
                            ? "PIN AS REFERENCE · replaces the current pinned \(club.shortName)"
                            : "PIN AS REFERENCE · the trend strip will line up against this swing"))
                        .font(Theme.labelFont(10))
                        .tracking(1.0)
                        .foregroundColor(isPinned ? Theme.accent : Theme.ink3)
                }
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(isPinned ? Theme.accent.opacity(0.10) : Theme.surface)
            .overlay(Rectangle().stroke(isPinned ? Theme.accent.opacity(0.6) : Theme.lineStrong, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Unavailable

    /// Shown when there is no decodeable motion+club pair (audio may still be above).
    private var metricsUnavailable: some View {
        VStack(spacing: 10) {
            Image(systemName: "wave.3.right.circle")
                .font(.system(size: 40))
                .foregroundColor(Theme.ink3)
            Text(
                event.club == nil
                ? "Club or motion data was not stored for this swing."
                : "Motion data was not stored for this swing. If it was logged from the watch, open it from the range list after the session syncs."
            )
                .font(Theme.labelFont(11))
                .foregroundColor(Theme.ink3)
                .multilineTextAlignment(.center)
        }
        .padding(24)
    }

    private var sensorAccuracyFootnote: some View {
        Text(
            "Motion uses the watch IMU at ~100 Hz; phases and speeds are modelled from wrist motion, not radar. GPS tags location. Use these curves for consistency and trends — not as a substitute for a launch monitor."
        )
        .font(Theme.labelFont(10))
        .foregroundColor(Theme.ink3)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.bg2)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    // MARK: - Baseline lookup (shared by SwingSpeedGauge wiring)

    private func baselineSpeeds(for club: Club) -> (club: Double, hand: Double)? {
        let prior = recentBaseline.filter { evt in
            guard let c = evt.club, c == club else { return false }
            return evt.id != event.id
        }
        guard prior.count >= 3 else { return nil }
        var clubSum = 0.0, handSum = 0.0, n = 0
        for p in prior {
            guard let m = p.motionData, let c = p.club else { continue }
            let s = SwingAnalytics.speeds(m, club: c, armLengthMeters: armLengthMeters)
            clubSum += s.clubSpeedMph
            handSum += s.handSpeedMph
            n += 1
        }
        guard n > 0 else { return nil }
        return (club: clubSum / Double(n), hand: handSum / Double(n))
    }

    // MARK: - Tempo trace

    private struct TempoPoint: Identifiable {
        let id = UUID()
        let t: Double
        let value: Double
    }

    private func tempoTrace(motion: SwingMotionData, summary: SwingSummary) -> some View {
        let points = motion.samples.map { TempoPoint(t: $0.tMs, value: $0.aMag) }
        let p = motion.phases
        let topT = motion.samples[safe: p.topIdx]?.tMs ?? 0
        let impactT = motion.samples[safe: p.impactIdx]?.tMs ?? 0
        let backT = motion.samples[safe: p.backswingStartIdx]?.tMs ?? 0
        let finishT = motion.samples[safe: p.finishIdx]?.tMs ?? 0

        let ratio = summary.tempo.ratio
        let ratioStr: String = ratio.map { String(format: "%.1f : 1", $0) } ?? "—"
        let ratioColor: Color = {
            guard let r = ratio else { return Theme.ink3 }
            if r >= 2.7 && r <= 3.3 { return Theme.accent }
            return Theme.warn
        }()

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                sectionLabel("TEMPO")
                Spacer()
                Text(ratioStr)
                    .font(Theme.statFont(15))
                    .foregroundColor(ratioColor)
                Text("(target 3 : 1)")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
            }

            Chart {
                ForEach(points) { pt in
                    LineMark(
                        x: .value("t", pt.t),
                        y: .value("|a|", pt.value)
                    )
                    .foregroundStyle(Theme.accent)
                    .interpolationMethod(.linear)
                }
                RuleMark(x: .value("back", backT))
                    .foregroundStyle(Theme.ink3.opacity(0.6))
                    .annotation(position: .top, alignment: .leading) {
                        phaseTag("BACK", color: Theme.ink3)
                    }
                RuleMark(x: .value("top", topT))
                    .foregroundStyle(Theme.warn.opacity(0.7))
                    .annotation(position: .top, alignment: .leading) {
                        phaseTag("TOP", color: Theme.warn)
                    }
                RuleMark(x: .value("impact", impactT))
                    .foregroundStyle(Theme.bad.opacity(0.8))
                    .annotation(position: .top, alignment: .leading) {
                        phaseTag("IMPACT", color: Theme.bad)
                    }
                RuleMark(x: .value("finish", finishT))
                    .foregroundStyle(Theme.ink3.opacity(0.6))
            }
            .frame(height: 130)
            .chartXAxis {
                AxisMarks(position: .bottom)
            }
            .chartYAxis {
                AxisMarks(position: .leading)
            }

            HStack(spacing: 10) {
                metric("BACKSWING", value: String(format: "%.2fs", summary.tempo.backswingSeconds))
                metric("DOWNSWING", value: String(format: "%.2fs", summary.tempo.downswingSeconds))
                metric("PEAK G", value: String(format: "%.1f", motion.peakAcceleration))
                metric("JERK", value: String(format: "%.0f", summary.smoothness.jerkRMS))
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func phaseTag(_ s: String, color: Color) -> some View {
        Text(s)
            .font(Theme.labelFont(8))
            .tracking(1.2)
            .foregroundColor(color)
            .padding(.horizontal, 4)
            .padding(.vertical, 1)
            .background(Theme.bg)
    }

    // MARK: - Plane axis

    private func planeView(motion: SwingMotionData, summary: SwingSummary) -> some View {
        let axis = summary.plane.axis
        let reference = referenceAxis(for: summary.club) ?? axis
        let delta = angleDegrees(between: simd_normalize(axis), and: simd_normalize(reference))
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                sectionLabel("PLANE")
                Spacer()
                Text(String(format: "Δ %.1f°", delta))
                    .font(Theme.statFont(13))
                    .foregroundColor(delta < 5 ? Theme.accent : (delta < 15 ? Theme.warn : Theme.bad))
            }
            HStack(spacing: 12) {
                planeProjection(
                    title: "TOP-DOWN",
                    axis: SIMD2<Double>(axis.x, axis.y),
                    reference: SIMD2<Double>(reference.x, reference.y)
                )
                planeProjection(
                    title: "SIDE-ON",
                    axis: SIMD2<Double>(axis.y, axis.z),
                    reference: SIMD2<Double>(reference.y, reference.z)
                )
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func planeProjection(title: String, axis: SIMD2<Double>, reference: SIMD2<Double>) -> some View {
        // Tolerance cone — angle (degrees) on either side of the reference
        // vector that we consider a "good" plane. Matches the SwingGrade
        // green-tier threshold (≤5° = full credit).
        let toleranceDeg: Double = 5
        let warnDeg: Double = 12
        return VStack(spacing: 4) {
            Text(title)
                .font(Theme.labelFont(9))
                .tracking(1.2)
                .foregroundColor(Theme.ink3)
            GeometryReader { geo in
                let cx = geo.size.width / 2
                let cy = geo.size.height / 2
                let r = min(geo.size.width, geo.size.height) * 0.42

                ZStack {
                    Circle()
                        .stroke(Theme.line, lineWidth: 1)
                        .frame(width: r * 2, height: r * 2)
                        .position(x: cx, y: cy)
                    Path { p in
                        p.move(to: CGPoint(x: cx - r, y: cy))
                        p.addLine(to: CGPoint(x: cx + r, y: cy))
                        p.move(to: CGPoint(x: cx, y: cy - r))
                        p.addLine(to: CGPoint(x: cx, y: cy + r))
                    }.stroke(Theme.line, lineWidth: 0.5)

                    // Tolerance cones — green ≤5° around reference, then
                    // amber ring out to ±12°. Drawn behind the arrows so
                    // the arrows visually sit "on top" of their zone.
                    if simd_length(reference) > 1e-6 {
                        toleranceCone(center: CGPoint(x: cx, y: cy),
                                      reference: reference,
                                      radius: r,
                                      halfAngleDeg: warnDeg,
                                      color: Theme.warn.opacity(0.18))
                        toleranceCone(center: CGPoint(x: cx, y: cy),
                                      reference: reference,
                                      radius: r,
                                      halfAngleDeg: toleranceDeg,
                                      color: Theme.accent.opacity(0.30))
                    }

                    // Reference arrow (dim).
                    arrow(
                        center: CGPoint(x: cx, y: cy),
                        vec: reference,
                        length: r,
                        color: Theme.ink3
                    )
                    // Player arrow — coloured by zone (green if inside
                    // tolerance, amber if inside warn ring, red if out).
                    arrow(
                        center: CGPoint(x: cx, y: cy),
                        vec: axis,
                        length: r,
                        color: planeArrowTint(
                            axis: axis,
                            reference: reference,
                            tolerance: toleranceDeg,
                            warn: warnDeg
                        )
                    )
                }
            }
            .frame(height: 110)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    /// Filled wedge of `±halfAngleDeg` around `reference` in 2D. Used to
    /// render the green/amber tolerance cones behind the player's arrow.
    private func toleranceCone(
        center: CGPoint,
        reference: SIMD2<Double>,
        radius: CGFloat,
        halfAngleDeg: Double,
        color: Color
    ) -> some View {
        let mag = simd_length(reference)
        let unit = mag > 1e-6 ? reference / mag : SIMD2<Double>(1, 0)
        // Reference direction in screen space (y inverted).
        let baseAngle = atan2(-unit.y, unit.x)
        let half = halfAngleDeg * .pi / 180
        let start = baseAngle - half
        let end = baseAngle + half

        return Path { p in
            p.move(to: center)
            p.addArc(
                center: center,
                radius: radius,
                startAngle: .radians(start),
                endAngle: .radians(end),
                clockwise: false
            )
            p.closeSubpath()
        }
        .fill(color)
    }

    /// Pick the player-arrow tint based on which tolerance zone the
    /// player's plane axis falls in.
    private func planeArrowTint(
        axis: SIMD2<Double>,
        reference: SIMD2<Double>,
        tolerance: Double,
        warn: Double
    ) -> Color {
        let am = simd_length(axis)
        let rm = simd_length(reference)
        guard am > 1e-6, rm > 1e-6 else { return Theme.accent }
        let dot = simd_dot(axis / am, reference / rm)
        let clamped = min(1.0, max(-1.0, dot))
        let deg = acos(clamped) * 180 / .pi
        if deg <= tolerance { return Theme.accent }
        if deg <= warn      { return Theme.warn }
        return Theme.bad
    }

    private func arrow(center: CGPoint, vec: SIMD2<Double>, length: CGFloat, color: Color) -> some View {
        let mag = simd_length(vec)
        let unit = mag > 1e-6 ? vec / mag : SIMD2<Double>(0, 0)
        let end = CGPoint(
            x: center.x + CGFloat(unit.x) * length,
            y: center.y - CGFloat(unit.y) * length  // y inverted in screen coords
        )
        return Path { p in
            p.move(to: center)
            p.addLine(to: end)
            // Arrowhead
            let dx = end.x - center.x
            let dy = end.y - center.y
            let len = sqrt(dx * dx + dy * dy)
            guard len > 4 else { return }
            let ux = dx / len, uy = dy / len
            let perpX = -uy * 4, perpY = ux * 4
            let baseX = end.x - ux * 6, baseY = end.y - uy * 6
            p.move(to: end)
            p.addLine(to: CGPoint(x: baseX + perpX, y: baseY + perpY))
            p.move(to: end)
            p.addLine(to: CGPoint(x: baseX - perpX, y: baseY - perpY))
        }
        .stroke(color, lineWidth: 2)
    }

    /// Reference plane axis for a club. Phase 2 uses the median plane
    /// across other recent swings with the same club; Phase 4+ replaces
    /// this with the player's DNA signature.
    private func referenceAxis(for club: Club) -> SIMD3<Double>? {
        let priors = recentBaseline.filter { evt in
            guard let c = evt.club, c == club else { return false }
            return evt.id != event.id
        }
        guard priors.count >= 3 else { return nil }
        var sum = SIMD3<Double>(0, 0, 0)
        var n = 0
        for p in priors {
            guard let m = p.motionData else { continue }
            let plane = SwingAnalytics.plane(m).axis
            sum += plane
            n += 1
        }
        guard n > 0 else { return nil }
        let mean = sum / Double(n)
        let mag = simd_length(mean)
        return mag > 1e-6 ? mean / mag : nil
    }

    // MARK: - HR strip

    private struct HRPoint: Identifiable {
        let id = UUID()
        let t: Double
        let bpm: Double
    }

    private func hrStrip(summary: SwingSummary, hr: HeartRateData?) -> some View {
        let snapshot = hr?.snapshot
        let samples = snapshot?.samples ?? []
        let points = samples.map { HRPoint(t: $0.tMs / 1000.0, bpm: $0.bpm) }
        let bpmAtImpact = hr?.heartRate ?? 0

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                sectionLabel("HEART · ±30s window")
                Spacer()
                if bpmAtImpact > 0 {
                    Text("\(Int(bpmAtImpact))")
                        .font(Theme.statFont(15))
                        .foregroundColor(Theme.bad)
                    Text("BPM @ impact")
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
            }

            if points.isEmpty {
                Text("No HR samples in the ±30 s window.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            } else {
                Chart {
                    ForEach(points) { pt in
                        LineMark(
                            x: .value("s", pt.t),
                            y: .value("bpm", pt.bpm)
                        )
                        .foregroundStyle(Theme.bad)
                        .interpolationMethod(.monotone)
                    }
                    RuleMark(x: .value("impact", 0))
                        .foregroundStyle(Theme.ink3.opacity(0.7))
                    PointMark(
                        x: .value("impact", 0),
                        y: .value("bpm", bpmAtImpact)
                    )
                    .symbolSize(80)
                    .foregroundStyle(Theme.bad)
                }
                .frame(height: 110)
            }

            HStack(spacing: 10) {
                metric("@ IMPACT", value: bpmAtImpact > 0 ? "\(Int(bpmAtImpact))" : "—")
                metric("PRE", value: hr?.preMedian.map { "\(Int($0))" } ?? "—")
                metric("POST", value: hr?.postMedian.map { "\(Int($0))" } ?? "—")
                metric("HRV", value: hr?.hrv.map { String(format: "%.0f ms", $0) } ?? "—")
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    // MARK: - Helpers

    private func sectionLabel(_ s: String) -> some View {
        Text(s)
            .font(Theme.labelFont(10))
            .tracking(1.4)
            .foregroundColor(Theme.ink3)
    }

    private func metric(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.2)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(13))
                .foregroundColor(Theme.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Safe array access

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
