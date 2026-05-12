//
//  SwingGradeCard.swift
//  StrikeLabCaddie
//
//  Headline of the SwingCard. Big number, tier badge, plain-English
//  verdict, then a row of dimension chips (tempo · plane · smoothness ·
//  speed) each with a coloured pip to summarise that axis.
//

import SwiftUI

struct SwingGradeCard: View {
    let grade: SwingGrade

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("\(grade.value)")
                    .font(Theme.statFont(72))
                    .foregroundColor(grade.tier.color)
                Text("/100")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                Spacer()
                Text(grade.tier.rawValue)
                    .font(Theme.labelFont(11))
                    .tracking(1.8)
                    .foregroundColor(grade.tier.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .overlay(Rectangle().stroke(grade.tier.color, lineWidth: 1))
            }

            Text(grade.headline)
                .font(Theme.titleFont(17))
                .foregroundColor(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)

            // Per-dimension pips.
            VStack(spacing: 0) {
                ForEach(Array(grade.dimensions.enumerated()), id: \.element.id) { idx, dim in
                    dimensionRow(dim)
                    if idx < grade.dimensions.count - 1 {
                        Rectangle().fill(Theme.line).frame(height: 1)
                    }
                }
            }
            .background(Theme.surface2)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func dimensionRow(_ dim: SwingGrade.Dimension) -> some View {
        HStack(spacing: 10) {
            // Pip — fills based on the dimension's normalised score.
            ZStack {
                Circle().fill(Theme.surface).frame(width: 10, height: 10)
                Circle().fill(dim.tint).frame(width: 6, height: 6)
            }
            .frame(width: 14)

            VStack(alignment: .leading, spacing: 1) {
                Text(dim.label)
                    .font(Theme.labelFont(10))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
                Text(dim.value)
                    .font(Theme.statFont(13))
                    .foregroundColor(Theme.ink)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 1) {
                Text("\(dim.score)/\(dim.maxPoints)")
                    .font(Theme.statFont(13))
                    .foregroundColor(dim.tint)
                Text(dim.target)
                    .font(Theme.labelFont(9))
                    .foregroundColor(Theme.ink3)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }
}
