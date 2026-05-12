import SwiftUI

struct LiveShotView: View {
    var carryYards: Int
    var ballSpeedMph: Double?
    var smashFactor: Double?
    var heartRate: Int?
    var onEdit: () -> Void
    var onNext: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("LIVE")
                .font(SLW.mono(9))
                .tracking(1.6)
                .foregroundColor(SLW.accent)

            // Carry headline
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(carryYards)")
                    .font(SLW.num(46))
                    .foregroundColor(SLW.ink)
                Text("YDS CARRY")
                    .font(SLW.mono(9))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
            }

            // Mini dispersion
            DispersionGlyph()
                .frame(height: 36)

            // Stats grid
            HStack(spacing: 6) {
                MiniStat(label: "BALL", value: ballSpeedMph.map { String(format: "%.0f", $0) } ?? "—")
                MiniStat(label: "SMASH", value: smashFactor.map { String(format: "%.2f", $0) } ?? "—")
                MiniStat(label: "HR", value: heartRate.map { String($0) } ?? "—")
            }

            HStack(spacing: 6) {
                Button(action: onEdit) {
                    Text("EDIT")
                        .font(SLW.mono(10))
                        .tracking(1.8)
                        .foregroundColor(SLW.ink2)
                        .frame(maxWidth: .infinity, minHeight: 28)
                }
                .background(SLW.surface2)
                .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
                .buttonStyle(.plain)

                Button(action: onNext) {
                    Text("NEXT")
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.8)
                        .foregroundColor(SLW.accentInk)
                        .frame(maxWidth: .infinity, minHeight: 28)
                }
                .background(SLW.accent)
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .background(SLW.bg)
    }

    private struct MiniStat: View {
        var label: String
        var value: String
        var body: some View {
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(SLW.mono(7))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink3)
                Text(value)
                    .font(SLW.num(12))
                    .foregroundColor(SLW.ink2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(4)
            .background(SLW.surface)
            .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
    }

    private struct DispersionGlyph: View {
        var body: some View {
            GeometryReader { geo in
                let cx = geo.size.width / 2
                let cy = geo.size.height
                Path { p in
                    p.move(to: CGPoint(x: cx, y: cy))
                    p.addLine(to: CGPoint(x: cx - 8, y: 4))
                    p.move(to: CGPoint(x: cx, y: cy))
                    p.addLine(to: CGPoint(x: cx + 8, y: 4))
                    p.move(to: CGPoint(x: cx, y: cy))
                    p.addLine(to: CGPoint(x: cx, y: 4))
                }
                .stroke(SLW.ink3, style: StrokeStyle(lineWidth: 1, dash: [2, 2]))

                Circle().fill(SLW.accent).frame(width: 4, height: 4).position(x: cx, y: 8)
            }
        }
    }
}
