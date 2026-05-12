// Bake the StrikeLabCaddie reticule + SL mark to a 1024×1024 PNG.
//
// Usage:  swift /tmp/bake_logo.swift <output.png>

import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let outputPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "/tmp/sl_appicon.png"

let size: CGFloat = 1024

struct C {
    static let bg     = CGColor(red: 0x0A / 255, green: 0x0B / 255, blue: 0x0A / 255, alpha: 1)
    static let ink    = CGColor(red: 0xED / 255, green: 0xE8 / 255, blue: 0xDE / 255, alpha: 1)
    static let ink2   = CGColor(red: 0xB9 / 255, green: 0xB6 / 255, blue: 0xAC / 255, alpha: 1)
    static let ink3   = CGColor(red: 0x76 / 255, green: 0x74 / 255, blue: 0x6B / 255, alpha: 1)
    static let accent = CGColor(red: 0.812, green: 0.945, blue: 0.376, alpha: 1)
}

let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(
    data: nil,
    width: Int(size),
    height: Int(size),
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: cs,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else { fatalError("ctx") }

// Background
ctx.setFillColor(C.bg)
ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

// Geometry — generous margin, big reticule
let cx = size / 2
let cy = size / 2
let margin: CGFloat = 110
let ringRadius = (size - margin * 2) / 2
let ringStroke: CGFloat = 38
let innerRadius = ringRadius * 0.78
let innerStroke: CGFloat = 6

// Outer accent ring
ctx.setStrokeColor(C.accent)
ctx.setLineWidth(ringStroke)
ctx.strokeEllipse(in: CGRect(x: cx - ringRadius, y: cy - ringRadius,
                              width: ringRadius * 2, height: ringRadius * 2))

// Inner concentric tick ring (subtle)
ctx.setStrokeColor(C.ink3.copy(alpha: 0.35)!)
ctx.setLineWidth(innerStroke)
ctx.strokeEllipse(in: CGRect(x: cx - innerRadius, y: cy - innerRadius,
                              width: innerRadius * 2, height: innerRadius * 2))

// Crosshair lines — leave room for the letters in the centre
let crossOuter = ringRadius * 0.94
let crossInnerGap = ringRadius * 0.45
ctx.setStrokeColor(C.ink3.copy(alpha: 0.55)!)
ctx.setLineWidth(innerStroke)
ctx.move(to:    CGPoint(x: cx, y: cy - crossOuter))
ctx.addLine(to: CGPoint(x: cx, y: cy - crossInnerGap))
ctx.move(to:    CGPoint(x: cx, y: cy + crossInnerGap))
ctx.addLine(to: CGPoint(x: cx, y: cy + crossOuter))
ctx.move(to:    CGPoint(x: cx - crossOuter, y: cy))
ctx.addLine(to: CGPoint(x: cx - crossInnerGap, y: cy))
ctx.move(to:    CGPoint(x: cx + crossInnerGap, y: cy))
ctx.addLine(to: CGPoint(x: cx + crossOuter, y: cy))
ctx.strokePath()

// Accent signal dot — a precision-instrument tell
let dotRadius: CGFloat = ringRadius * 0.06
let dotAngle: CGFloat = -.pi / 4   // upper-right (positive y in CoreGraphics is down? actually default is bottom-left origin so -π/4 is upper-right)
let dotX = cx + cos(dotAngle) * ringRadius
let dotY = cy + sin(dotAngle) * ringRadius
ctx.setFillColor(C.accent)
ctx.fillEllipse(in: CGRect(x: dotX - dotRadius, y: dotY - dotRadius,
                            width: dotRadius * 2, height: dotRadius * 2))

// SL monogram via CoreText, using only CF / CoreText (no Foundation
// NSAttributedString.Key UI shortcuts since we're a pure CG script).
func drawCenteredText(_ s: String, fontName: String, size: CGFloat, color: CGColor, at point: CGPoint) {
    let font = CTFontCreateWithName(fontName as CFString, size, nil)
    let attrs: [CFString: Any] = [
        kCTFontAttributeName: font,
        kCTForegroundColorAttributeName: color,
        kCTKernAttributeName: -size * 0.05
    ]
    let attr = CFAttributedStringCreate(
        kCFAllocatorDefault,
        s as CFString,
        attrs as CFDictionary
    )!
    let line = CTLineCreateWithAttributedString(attr)

    let bounds = CTLineGetBoundsWithOptions(line, .useGlyphPathBounds)
    let width = bounds.width
    let height = bounds.height
    let originX = point.x - width / 2 - bounds.origin.x
    let originY = point.y - height / 2 - bounds.origin.y

    ctx.textPosition = CGPoint(x: originX, y: originY)
    CTLineDraw(line, ctx)
}

// SF Pro Rounded Black for a heavy industrial mark.
drawCenteredText(
    "SL",
    fontName: "SFProRounded-Black",
    size: ringRadius * 0.85,
    color: C.ink,
    at: CGPoint(x: cx, y: cy)
)

// Export
guard let cgImage = ctx.makeImage() else { fatalError("image") }
let url = URL(fileURLWithPath: outputPath) as CFURL
guard let dest = CGImageDestinationCreateWithURL(url, UTType.png.identifier as CFString, 1, nil) else {
    fatalError("dest")
}
CGImageDestinationAddImage(dest, cgImage, nil)
CGImageDestinationFinalize(dest)
print("Wrote \(outputPath) — 1024x1024, no alpha")
