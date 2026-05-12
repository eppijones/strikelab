import SwiftUI

struct HoleMapView: View {
    var holeNumber: Int
    var pinYards: Int
    var windMph: Int
    var windDirectionDeg: Double

    @State private var scrollOffset: Double = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("HOLE \(holeNumber) · MAP")
                    .font(SLW.mono(9))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
                Spacer()
                Text("\(windMph) MPH")
                    .font(SLW.mono(9))
                    .foregroundColor(SLW.warn)
            }

            ZStack {
                FairwayShape(scroll: scrollOffset)
                    .fill(SLW.surface)
                FairwayShape(scroll: scrollOffset)
                    .stroke(SLW.line, lineWidth: 1)
                Circle()
                    .fill(SLW.accent)
                    .frame(width: 6, height: 6)
                    .offset(x: 0, y: -60 + scrollOffset)
                Circle()
                    .stroke(SLW.warn, lineWidth: 1)
                    .frame(width: 12, height: 12)
                    .offset(x: 0, y: 50)
            }
            .frame(maxWidth: .infinity, minHeight: 110)
            .focusable(true)
            .digitalCrownRotation(
                $scrollOffset,
                from: -40,
                through: 40,
                by: 1,
                sensitivity: .medium,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )

            HStack(alignment: .firstTextBaseline) {
                Text("\(pinYards)")
                    .font(SLW.num(22))
                    .foregroundColor(SLW.ink)
                Text("YDS PIN")
                    .font(SLW.mono(8))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
                Spacer()
                Image(systemName: "wind")
                    .foregroundColor(SLW.ink3)
                Text("\(Int(windDirectionDeg))°")
                    .font(SLW.mono(9))
                    .foregroundColor(SLW.ink3)
            }
        }
        .padding(8)
        .background(SLW.bg)
    }
}

private struct FairwayShape: Shape {
    var scroll: Double
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let cx = rect.midX
        p.move(to: CGPoint(x: cx - 18, y: rect.maxY))
        p.addLine(to: CGPoint(x: cx + 18, y: rect.maxY))
        p.addLine(to: CGPoint(x: cx + 6, y: rect.midY + scroll))
        p.addLine(to: CGPoint(x: cx + 4, y: rect.minY))
        p.addLine(to: CGPoint(x: cx - 4, y: rect.minY))
        p.addLine(to: CGPoint(x: cx - 6, y: rect.midY + scroll))
        p.closeSubpath()
        return p
    }
}
