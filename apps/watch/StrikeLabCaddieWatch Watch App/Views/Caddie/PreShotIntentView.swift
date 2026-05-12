import SwiftUI

struct PreShotIntentView: View {
    var commitPhrase: String
    @State private var feel: Double = 7
    var onCommit: (Int) -> Void
    var onVoice: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("INTENT")
                .font(SLW.mono(9))
                .tracking(1.6)
                .foregroundColor(SLW.ink3)

            Text("\u{201C}\(commitPhrase)\u{201D}")
                .italic()
                .font(.system(size: 14, weight: .regular, design: .serif))
                .foregroundColor(SLW.ink)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("FEEL")
                        .font(SLW.mono(9))
                        .tracking(1.6)
                        .foregroundColor(SLW.ink3)
                    Spacer()
                    Text("\(Int(feel))/10")
                        .font(SLW.num(13))
                        .foregroundColor(SLW.accent)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle().fill(SLW.bg2).frame(height: 6)
                        Rectangle()
                            .fill(SLW.accent)
                            .frame(width: geo.size.width * (feel / 10), height: 6)
                    }
                }
                .frame(height: 6)
            }
            .focusable(true)
            .digitalCrownRotation($feel, from: 1, through: 10, by: 1, sensitivity: .medium, isContinuous: false, isHapticFeedbackEnabled: true)

            HStack(spacing: 6) {
                Button(action: onVoice) {
                    Text("VOICE")
                        .font(SLW.mono(10, weight: .medium))
                        .tracking(1.8)
                        .foregroundColor(SLW.ink)
                        .frame(maxWidth: .infinity, minHeight: 28)
                }
                .background(SLW.surface2)
                .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
                .buttonStyle(.plain)

                Button(action: { onCommit(Int(feel)) }) {
                    Text("COMMIT")
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
}
