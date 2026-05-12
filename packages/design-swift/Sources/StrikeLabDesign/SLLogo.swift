import SwiftUI

/// StrikeLab reticule logo — outer ring, crosshair, off-center shot mark.
public struct SLLogo: View {
    public var size: CGFloat
    public var withWord: Bool
    public var color: Color

    public init(size: CGFloat = 24, withWord: Bool = false, color: Color = SLColors.ink) {
        self.size = size
        self.withWord = withWord
        self.color = color
    }

    public var body: some View {
        HStack(spacing: withWord ? size * 0.45 : 0) {
            ZStack {
                Circle()
                    .stroke(color, lineWidth: 1)
                Path { p in
                    let mid = size / 2
                    p.move(to: CGPoint(x: mid, y: 2))
                    p.addLine(to: CGPoint(x: mid, y: size * 0.27))
                    p.move(to: CGPoint(x: mid, y: size * 0.73))
                    p.addLine(to: CGPoint(x: mid, y: size - 2))
                    p.move(to: CGPoint(x: 2, y: mid))
                    p.addLine(to: CGPoint(x: size * 0.27, y: mid))
                    p.move(to: CGPoint(x: size * 0.73, y: mid))
                    p.addLine(to: CGPoint(x: size - 2, y: mid))
                }
                .stroke(color, lineWidth: 1)
                Circle()
                    .fill(color)
                    .frame(width: size * 0.13, height: size * 0.13)
                    .offset(x: size * 0.06, y: -size * 0.06)
            }
            .frame(width: size, height: size)

            if withWord {
                Text("STRIKELAB")
                    .font(SLTypography.sans(size: size * 0.4, weight: .semibold))
                    .tracking(size * 0.08)
                    .foregroundStyle(color)
            }
        }
    }
}
