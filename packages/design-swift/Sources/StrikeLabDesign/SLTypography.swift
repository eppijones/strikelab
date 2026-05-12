import SwiftUI

/// StrikeLab typography tokens.
/// Geist is preferred but not a system font on watchOS; falls back to SF Pro.
public enum SLTypography {
    public static func sans(size: CGFloat, weight: Font.Weight = .medium) -> Font {
        if let _ = UIFont(name: "Geist", size: size) {
            return .custom("Geist", size: size).weight(weight)
        }
        return .system(size: size, weight: weight, design: .default)
    }

    public static func mono(size: CGFloat, weight: Font.Weight = .medium) -> Font {
        if let _ = UIFont(name: "Geist Mono", size: size) {
            return .custom("Geist Mono", size: size).weight(weight)
        }
        return .system(size: size, weight: weight, design: .monospaced)
    }

    public static func serif(size: CGFloat) -> Font {
        if let _ = UIFont(name: "Instrument Serif", size: size) {
            return .custom("Instrument Serif", size: size).italic()
        }
        return .system(size: size, weight: .regular, design: .serif).italic()
    }

    public static func display(size: CGFloat) -> Font { sans(size: size, weight: .medium) }
    public static func head(size: CGFloat = 24) -> Font { sans(size: size, weight: .medium) }
    public static func body(size: CGFloat = 15) -> Font { sans(size: size, weight: .regular) }
    public static func micro(size: CGFloat = 10) -> Font { mono(size: size, weight: .medium) }
}

#if canImport(UIKit)
import UIKit
#endif
