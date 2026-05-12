import SwiftUI

/// StrikeLab Panel — flat, hairline border, optional header with id + title.
public struct SLPanel<Content: View>: View {
    public var id: String?
    public var title: String?
    public var trailing: AnyView?
    public var padded: Bool
    public var content: () -> Content

    public init(
        id: String? = nil,
        title: String? = nil,
        trailing: AnyView? = nil,
        padded: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.id = id
        self.title = title
        self.trailing = trailing
        self.padded = padded
        self.content = content
    }

    public var body: some View {
        VStack(spacing: 0) {
            if id != nil || title != nil || trailing != nil {
                HStack {
                    if let id {
                        Text(id)
                            .font(SLTypography.mono(size: 10))
                            .foregroundStyle(SLColors.ink4)
                    }
                    if let title {
                        Text(title.uppercased())
                            .font(SLTypography.micro())
                            .tracking(1.8)
                            .foregroundStyle(SLColors.ink2)
                    }
                    Spacer()
                    if let trailing { trailing }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .overlay(Rectangle().frame(height: 1).foregroundStyle(SLColors.lineStrong), alignment: .bottom)
            }
            content()
                .padding(padded ? 14 : 0)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(SLColors.surfaceSolid)
        .overlay(
            Rectangle()
                .stroke(SLColors.lineStrong, lineWidth: 1)
        )
    }
}

/// Tag chip — tiny ALL CAPS bordered chip used for fault flags / club labels.
public struct SLTag: View {
    public enum Tone { case neutral, accent, warn, bad }
    public var label: String
    public var tone: Tone

    public init(_ label: String, tone: Tone = .neutral) {
        self.label = label
        self.tone = tone
    }

    public var body: some View {
        Text(label.uppercased())
            .font(SLTypography.mono(size: 9))
            .tracking(1.6)
            .foregroundStyle(color)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .overlay(Rectangle().stroke(color, lineWidth: 1))
    }

    private var color: Color {
        switch tone {
        case .neutral: return SLColors.ink2
        case .accent: return SLColors.accent
        case .warn: return SLColors.warn
        case .bad: return SLColors.bad
        }
    }
}

/// Stat — micro label + big mono number + optional delta.
public struct SLStat: View {
    public enum Size { case sm, md, lg }
    public enum DeltaTone { case good, warn, bad, neutral }

    public var label: String
    public var value: String
    public var unit: String?
    public var delta: String?
    public var deltaTone: DeltaTone
    public var size: Size

    public init(label: String, value: String, unit: String? = nil, delta: String? = nil, deltaTone: DeltaTone = .good, size: Size = .md) {
        self.label = label
        self.value = value
        self.unit = unit
        self.delta = delta
        self.deltaTone = deltaTone
        self.size = size
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased())
                .font(SLTypography.micro())
                .tracking(1.8)
                .foregroundStyle(SLColors.ink3)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(value)
                    .font(SLTypography.mono(size: bigSize, weight: .medium))
                    .foregroundStyle(SLColors.ink)
                if let unit {
                    Text(unit.uppercased())
                        .font(SLTypography.micro())
                        .tracking(1.8)
                        .foregroundStyle(SLColors.ink3)
                }
            }
            if let delta {
                Text(delta)
                    .font(SLTypography.mono(size: 11))
                    .foregroundStyle(deltaColor)
            }
        }
    }

    private var bigSize: CGFloat {
        switch size { case .sm: return 28; case .md: return 40; case .lg: return 56 }
    }
    private var deltaColor: Color {
        switch deltaTone { case .good: return SLColors.accent; case .warn: return SLColors.warn; case .bad: return SLColors.bad; case .neutral: return SLColors.ink3 }
    }
}
