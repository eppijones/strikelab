//
//  SwingSignatureView.swift
//  StrikeLabCaddie
//
//  Five stacked mini range rows (Tempo / Backswing / Hand / Plane / HR).
//

import SwiftUI
import simd

struct SwingSignatureView: View {
    let summary: SwingSummary
    let window: PersonalWindow

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            row(
                label: "TEMPO",
                value: summary.tempo.ratio,
                format: { String(format: "%.2f :1", $0) },
                windowLo: window.tempoWindowLo,
                windowHi: window.tempoWindowHi,
                careerLo: window.tempoCareerLo,
                careerHi: window.tempoCareerHi
            )
            row(
                label: "BACK",
                value: summary.segmentationUnreliable ? nil : summary.tempo.backswingSeconds,
                format: { String(format: "%.2fs", $0) },
                windowLo: window.backswingWindowLo,
                windowHi: window.backswingWindowHi,
                careerLo: window.backswingCareerLo,
                careerHi: window.backswingCareerHi
            )
            row(
                label: "HAND",
                value: summary.speeds.handSpeedMph,
                format: { String(format: "%.0f mph", $0) },
                windowLo: window.handWindowLo,
                windowHi: window.handWindowHi,
                careerLo: window.handCareerLo,
                careerHi: window.handCareerHi
            )
            row(
                label: "PLANE",
                value: planeDeltaDeg,
                format: { String(format: "%.1f°", $0) },
                windowLo: window.planeDeltaWindowLo,
                windowHi: window.planeDeltaWindowHi,
                careerLo: window.planeDeltaCareerLo,
                careerHi: window.planeDeltaCareerHi
            )
            row(
                label: "HR",
                value: summary.pressure.map { $0.value },
                format: { String(format: "%.2f", $0) },
                windowLo: window.hrWindowLo,
                windowHi: window.hrWindowHi,
                careerLo: window.hrCareerLo,
                careerHi: window.hrCareerHi
            )
        }
        .padding(12)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var planeDeltaDeg: Double? {
        let ref = window.referenceAxis
        let d = angleDegrees(
            between: simd_normalize(summary.plane.axis),
            and: simd_normalize(ref)
        )
        return summary.segmentationUnreliable ? nil : d
    }

    @ViewBuilder
    private func row(
        label: String,
        value: Double?,
        format: (Double) -> String,
        windowLo: Double,
        windowHi: Double,
        careerLo: Double,
        careerHi: Double
    ) -> some View {
        HStack(alignment: .center, spacing: 8) {
            Text(label)
                .font(Theme.labelFont(9))
                .tracking(1.2)
                .foregroundColor(Theme.ink3)
                .frame(width: 44, alignment: .leading)

            if let v = value {
                SwingRangeBar(
                    value: v,
                    windowLo: windowLo,
                    windowHi: windowHi,
                    careerLo: careerLo,
                    careerHi: careerHi,
                    recent: [],
                    height: 18,
                    showValueLabel: false
                )
                .frame(maxWidth: .infinity)

                Text(format(v))
                    .font(Theme.statFont(11))
                    .foregroundColor(windowContains(v, lo: windowLo, hi: windowHi) ? Theme.accent : Theme.ink)
                    .frame(width: 56, alignment: .trailing)
            } else {
                Text("—")
                    .font(Theme.statFont(11))
                    .foregroundColor(Theme.ink3)
                Spacer()
            }
        }
    }

    private func windowContains(_ v: Double, lo: Double, hi: Double) -> Bool {
        v >= lo && v <= hi
    }
}
