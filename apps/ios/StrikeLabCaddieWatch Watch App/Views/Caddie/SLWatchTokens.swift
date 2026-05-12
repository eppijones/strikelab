import SwiftUI

/// Watch-side reflection of the StrikeLab design tokens. The full Theme on
/// iOS already mirrors these; this file lives in the watch target so the new
/// caddie screens compile without depending on the iOS package.
enum SLW {
    static let bg = Color(red: 0x0A / 255, green: 0x0B / 255, blue: 0x0A / 255)
    static let bg2 = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x12 / 255)
    static let surface = Color(red: 0x15 / 255, green: 0x18 / 255, blue: 0x16 / 255)
    static let surface2 = Color(red: 0x1C / 255, green: 0x1F / 255, blue: 0x1D / 255)
    static let line = Color(red: 0x2D / 255, green: 0x32 / 255, blue: 0x2F / 255)
    static let ink = Color(red: 0xED / 255, green: 0xE8 / 255, blue: 0xDE / 255)
    static let ink2 = Color(red: 0xB9 / 255, green: 0xB6 / 255, blue: 0xAC / 255)
    static let ink3 = Color(red: 0x76 / 255, green: 0x74 / 255, blue: 0x6B / 255)
    static let accent = Color(red: 0.812, green: 0.945, blue: 0.376)
    static let accentInk = Color(red: 0x0A / 255, green: 0x0B / 255, blue: 0x0A / 255)
    static let warn = Color(red: 0.945, green: 0.624, blue: 0.282)
    static let bad = Color(red: 0.886, green: 0.349, blue: 0.227)

    static func mono(_ size: CGFloat = 11, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
    static func display(_ size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }
    static func num(_ size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
}

/// Watch panel — flat, hairline border, optional micro title.
struct SLWPanel<Content: View>: View {
    var title: String?
    var content: () -> Content

    init(_ title: String? = nil, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let title {
                Text(title.uppercased())
                    .font(SLW.mono(8))
                    .tracking(1.6)
                    .foregroundColor(SLW.ink3)
            }
            content()
        }
        .padding(8)
        .background(SLW.surface2)
        .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
    }
}
