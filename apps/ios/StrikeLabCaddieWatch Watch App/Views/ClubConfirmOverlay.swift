//
//  ClubConfirmOverlay.swift
//  StrikeLabCaddieWatch Watch App
//
//  Quick club selection overlay with smart club suggestions
//

import SwiftUI

struct ClubConfirmOverlay: View {
    let isAutoDetected: Bool
    let onClubSelected: (ClubWatch) -> Void
    let onUndo: () -> Void
    let onDismiss: () -> Void
    var suggestedClub: ClubWatch?       // Smart suggestion based on distance
    var distanceToPin: Int?             // Canonical yards if known
    var units: WatchUnitsSystem = .yards
    var showsUndo: Bool = true

    @State private var selectedGroup: ClubGroupWatch?
    @State private var showAllClubs = false

    // Watch tokens — mirror iOS theme.
    private var ink: Color { SLW.ink }
    private var ink2: Color { SLW.ink2 }
    private var ink3: Color { SLW.ink3 }
    private var accent: Color { SLW.accent }
    private var warn: Color { SLW.warn }
    private var bad: Color { SLW.bad }
    
    init(isAutoDetected: Bool,
         onClubSelected: @escaping (ClubWatch) -> Void,
         onUndo: @escaping () -> Void,
         onDismiss: @escaping () -> Void,
         suggestedClub: ClubWatch? = nil,
         distanceToPin: Int? = nil,
         units: WatchUnitsSystem = .yards,
         showsUndo: Bool = true) {
        self.isAutoDetected = isAutoDetected
        self.onClubSelected = onClubSelected
        self.onUndo = onUndo
        self.onDismiss = onDismiss
        self.suggestedClub = suggestedClub
        self.distanceToPin = distanceToPin
        self.units = units
        self.showsUndo = showsUndo
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                if isAutoDetected {
                    HStack(spacing: 4) {
                        Image(systemName: "waveform")
                            .font(.system(size: 10))
                        Text("SWING DETECTED")
                            .font(SLW.mono(10, weight: .semibold))
                            .tracking(1.4)
                    }
                    .foregroundColor(accent)
                    .padding(.bottom, 2)
                }
                
                // Smart suggestion (if available)
                if let suggested = suggestedClub {
                    smartSuggestionView(club: suggested)
                }
                
                if let group = selectedGroup {
                    // Show specific clubs in selected group
                    clubListView(group: group)
                } else {
                    // Show quick select (common clubs) or group selector
                    if showAllClubs {
                        groupSelectorView
                    } else {
                        quickSelectView
                    }
                }
                
                if showsUndo {
                    Button {
                        onUndo()
                        onDismiss()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.uturn.backward")
                                .font(.system(size: 11))
                            Text("UNDO LAST")
                                .font(SLW.mono(10, weight: .semibold))
                                .tracking(1.4)
                        }
                        .foregroundColor(bad)
                        .padding(.vertical, 6)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
        }
    }
    
    // MARK: - Smart Suggestion View
    
    private func smartSuggestionView(club: ClubWatch) -> some View {
        VStack(spacing: 4) {
            if let distance = distanceToPin {
                HStack(spacing: 4) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 9))
                    Text("\(units.formatNumber(yards: Double(distance))) \(units.caps)")
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.2)
                }
                .foregroundColor(warn)
            }

            Button {
                onClubSelected(club)
            } label: {
                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 10))
                        Text("SUGGESTED")
                            .font(SLW.mono(9, weight: .semibold))
                            .tracking(1.4)
                    }
                    .foregroundColor(SLW.accentInk.opacity(0.65))

                    Text(club.shortName)
                        .font(SLW.num(22))
                        .foregroundColor(SLW.accentInk)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(accent)
            }
            .buttonStyle(.plain)

            Text("or choose below")
                .font(SLW.mono(9))
                .foregroundColor(ink3)
                .padding(.top, 2)
        }
        .padding(.bottom, 4)
    }
    
    // MARK: - Quick Select View (Common Clubs)
    
    private var quickSelectView: some View {
        VStack(spacing: 6) {
            if suggestedClub == nil {
                Text("SELECT CLUB")
                    .font(SLW.mono(11, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(ink2)
            }

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 4) {
                ForEach(ClubWatch.commonClubs) { club in
                    quickClubButton(club)
                }
            }

            Button {
                showAllClubs = true
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 11))
                    Text("More Clubs")
                        .font(SLW.mono(10))
                        .tracking(1.0)
                }
                .foregroundColor(ink3)
                .padding(.vertical, 6)
            }
            .buttonStyle(.plain)
        }
    }

    private func quickClubButton(_ club: ClubWatch) -> some View {
        Button {
            onClubSelected(club)
        } label: {
            Text(club.shortName)
                .font(SLW.num(13))
                .foregroundColor(clubInk(club.group))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(clubColor(club.group))
                .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Group Selector View
    
    private var groupSelectorView: some View {
        VStack(spacing: 6) {
            HStack {
                Button {
                    showAllClubs = false
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12))
                        .foregroundColor(ink3)
                }
                .buttonStyle(.plain)

                Spacer()

                Text("CLUB TYPE")
                    .font(SLW.mono(11, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(ink2)

                Spacer()
            }

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 4) {
                ForEach(ClubGroupWatch.allCases) { group in
                    groupButton(group)
                }
            }
        }
    }

    private func groupButton(_ group: ClubGroupWatch) -> some View {
        Button {
            if group == .driver || group == .putt {
                if group == .driver {
                    onClubSelected(.driver)
                } else {
                    onClubSelected(.putter)
                }
            } else {
                selectedGroup = group
            }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: group.iconName)
                    .font(.system(size: 14, weight: .semibold))

                Text(group.shortLabel)
                    .font(SLW.mono(10, weight: .semibold))
                    .tracking(1.0)
            }
            .foregroundColor(clubInk(group))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(clubColor(group))
            .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Club List View (Specific clubs in group)

    private func clubListView(group: ClubGroupWatch) -> some View {
        VStack(spacing: 6) {
            HStack {
                Button {
                    selectedGroup = nil
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12))
                        .foregroundColor(ink3)
                }
                .buttonStyle(.plain)

                Spacer()

                Text(group.rawValue.uppercased())
                    .font(SLW.mono(11, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(ink2)

                Spacer()
            }

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 4) {
                ForEach(group.clubs) { club in
                    specificClubButton(club)
                }
            }
        }
    }

    private func specificClubButton(_ club: ClubWatch) -> some View {
        Button {
            onClubSelected(club)
        } label: {
            Text(club.shortName)
                .font(SLW.num(14))
                .foregroundColor(clubInk(club.group))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(clubColor(club.group))
                .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private func clubColor(_ group: ClubGroupWatch) -> Color {
        switch group {
        case .driver: return SLW.accent
        case .wood:   return SLW.warn
        case .hybrid: return SLW.warn.opacity(0.6)
        case .iron:   return SLW.surface2
        case .wedge:  return SLW.accent.opacity(0.65)
        case .putt:   return SLW.surface
        }
    }

    private func clubInk(_ group: ClubGroupWatch) -> Color {
        switch group {
        case .driver, .wedge, .wood, .hybrid: return SLW.accentInk
        case .iron, .putt: return SLW.ink
        }
    }
}

#Preview {
    ClubConfirmOverlay(
        isAutoDetected: true,
        onClubSelected: { _ in },
        onUndo: {},
        onDismiss: {},
        suggestedClub: .iron7,
        distanceToPin: 145
    )
}
