import SwiftUI

/// Watch-side reflection of the StrikeLab design tokens. The full Theme on
/// iOS already mirrors these; this file lives in the watch target so the new
/// caddie screens compile without depending on the iOS package.
enum SLW {
    static let bg = Color(red: 0xF3 / 255, green: 0xEC / 255, blue: 0xDE / 255)
    static let bg2 = Color(red: 0xEA / 255, green: 0xE0 / 255, blue: 0xCF / 255)
    static let surface = Color(red: 0xFA / 255, green: 0xF5 / 255, blue: 0xE9 / 255)
    static let surface2 = Color(red: 0xE6 / 255, green: 0xDB / 255, blue: 0xC7 / 255)
    static let line = Color(red: 0xC9 / 255, green: 0xBA / 255, blue: 0xA2 / 255)
    static let ink = Color(red: 0x16 / 255, green: 0x18 / 255, blue: 0x14 / 255)
    static let ink2 = Color(red: 0x5F / 255, green: 0x56 / 255, blue: 0x48 / 255)
    static let ink3 = Color(red: 0x8B / 255, green: 0x7D / 255, blue: 0x68 / 255)
    static let accent = Color(red: 0x95 / 255, green: 0x68 / 255, blue: 0x2F / 255)
    static let accentInk = Color(red: 0xFF / 255, green: 0xF8 / 255, blue: 0xEA / 255)
    static let warn = Color(red: 0xC3 / 255, green: 0x86 / 255, blue: 0x34 / 255)
    static let bad = Color(red: 0xB5 / 255, green: 0x42 / 255, blue: 0x2E / 255)

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
