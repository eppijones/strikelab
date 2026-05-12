//
//  SwingTipCard.swift
//  StrikeLabCaddie
//
//  Picks the single weakest dimension from the swing grade and renders
//  one actionable cue. Sits between the headline grade and the gauges
//  so the player has something to TRY before they read deeper.
//
//  This is intentionally one tip per swing — drowning the player in a
//  list of fixes is what other apps do. We pick the one that moves
//  the needle.
//

import SwiftUI

struct SwingTipCard: View {
    let grade: SwingGrade

    var body: some View {
        let tip = pickTip()
        return HStack(alignment: .top, spacing: 10) {
            ZStack {
                Rectangle()
                    .fill(tip.tint.opacity(0.18))
                    .frame(width: 32, height: 32)
                    .overlay(Rectangle().stroke(tip.tint.opacity(0.6), lineWidth: 1))
                Image(systemName: tip.icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(tip.tint)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text("COACH TIP")
                    .font(Theme.labelFont(9))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                Text(tip.headline)
                    .font(Theme.titleFont(15))
                    .foregroundColor(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(tip.cue)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
        }
        .padding(12)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(tip.tint.opacity(0.5), lineWidth: 1))
    }

    private struct Tip {
        let headline: String
        let cue: String
        let icon: String
        let tint: Color
    }

    /// Pick the lowest-scoring dimension and translate it to a cue.
    private func pickTip() -> Tip {
        // Find the dimension with the worst pct.
        let weakest = grade.dimensions.min(by: { $0.pct < $1.pct })
        guard let w = weakest else {
            return Tip(headline: "Repeat that swing.",
                       cue: "Everything held — log it as a reference.",
                       icon: "checkmark.seal.fill",
                       tint: Theme.accent)
        }

        // If everything is green, reward.
        if w.pct >= 0.85 {
            return Tip(
                headline: "On all four dimensions.",
                cue: "Mark this as a reference good swing — it raises the consistency bar's target.",
                icon: "checkmark.seal.fill",
                tint: Theme.accent
            )
        }

        switch w.id {
        case "tempo":
            return Tip(
                headline: "Slow your takeaway.",
                cue: "Count one-two-three on the way back, one on the way down. The watch's tempo metronome is dialled to your median.",
                icon: "metronome",
                tint: w.tint
            )
        case "plane":
            return Tip(
                headline: "Reset to your usual swing plane.",
                cue: "Drop the right shoulder a touch at setup, then make a half swing watching the takeaway path on the watch HUD.",
                icon: "circle.grid.cross",
                tint: w.tint
            )
        case "smooth":
            return Tip(
                headline: "Smoother transition.",
                cue: "Pause for a beat at the top before starting the downswing — use the metronome to feel the gap.",
                icon: "waveform.path",
                tint: w.tint
            )
        case "speed":
            return Tip(
                headline: "Speed off your normal band.",
                cue: "If carry felt short, commit through the ball. If it felt frantic, ease back — you'll repeat speed better at 90%.",
                icon: "speedometer",
                tint: w.tint
            )
        default:
            return Tip(
                headline: "Worth another swing.",
                cue: "Hit one more with the same intent — the trend strip will show whether it took.",
                icon: "arrow.clockwise",
                tint: Theme.warn
            )
        }
    }
}
