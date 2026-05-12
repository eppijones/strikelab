import SwiftUI

/// StrikeLab color tokens.
/// Source: packages/design-tokens/tokens.json (dark theme is canonical).
public enum SLColors {
    public static let bg = Color(hex: 0x0A0B0A)
    public static let bg2 = Color(hex: 0x111312)
    public static let surface = Color(hex: 0x151816, alpha: 0.5)
    public static let surfaceSolid = Color(hex: 0x151816)
    public static let surface2 = Color(hex: 0x1C1F1D)
    public static let line = Color(hex: 0x252926, alpha: 0.5)
    public static let lineStrong = Color(hex: 0x2D322F)

    public static let ink = Color(hex: 0xEDE8DE)
    public static let ink2 = Color(hex: 0xB9B6AC)
    public static let ink3 = Color(hex: 0x76746B)
    public static let ink4 = Color(hex: 0x4A4842)

    /// Signal Lime — only positive accent. Used for AI confidence + selection.
    public static let accent = Color(red: 0.812, green: 0.945, blue: 0.376)
    public static let accentInk = Color(hex: 0x0A0B0A)
    public static let accent2 = Color(red: 0.706, green: 0.847, blue: 0.290)

    public static let warn = Color(red: 0.945, green: 0.624, blue: 0.282)
    public static let bad = Color(red: 0.886, green: 0.349, blue: 0.227)
}

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
