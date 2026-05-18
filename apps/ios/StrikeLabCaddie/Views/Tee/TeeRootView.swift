//
//  TeeRootView.swift
//  StrikeLabCaddie
//
//  Entry view for the StrikeLab Tee booking surface (iOS).
//  Wraps every screen in a NavigationStack so deep links (Pass → Discover etc.)
//  flow naturally on iPhone.
//

import SwiftUI
import Combine

@MainActor
final class TeeNavigation: ObservableObject {
    @Published var path: NavigationPath = NavigationPath()

    enum Route: Hashable {
        case courseHero(courseId: UUID, date: Date)
        case sheet(courseId: UUID, date: Date)
        case window(courseId: UUID, date: Date)
        case group(hold: TeeHoldResponse)
        case pay(hold: TeeHoldResponse, splitMode: String)
        case pass(bookingId: UUID)
        case preferences
    }

    func push(_ route: Route) { path.append(route) }
    func popToRoot() { path = NavigationPath() }
}

struct TeeRootView: View {
    @Binding var openBookingId: UUID?
    @StateObject private var nav = TeeNavigation()

    init(openBookingId: Binding<UUID?> = .constant(nil)) {
        self._openBookingId = openBookingId
    }

    var body: some View {
        NavigationStack(path: $nav.path) {
            TeeDiscoverView()
                .navigationDestination(for: TeeNavigation.Route.self) { route in
                    switch route {
                    case let .courseHero(id, date):
                        TeeCourseDetailView(courseId: id, date: date)
                    case let .sheet(id, date):
                        TeeSheetGridView(courseId: id, date: date)
                    case let .window(id, date):
                        TeeWindowView(courseId: id, date: date)
                    case let .group(hold):
                        TeeGroupView(hold: hold)
                    case let .pay(hold, splitMode):
                        TeePayView(hold: hold, splitMode: splitMode)
                    case let .pass(bookingId):
                        TeePassView(bookingId: bookingId)
                    case .preferences:
                        TeePreferencesView()
                    }
                }
        }
        .environmentObject(nav)
        .tint(Theme.accent)
        .background(Theme.bg)
        .onChange(of: openBookingId) { _, bookingId in
            guard let bookingId else { return }
            nav.popToRoot()
            nav.push(.pass(bookingId: bookingId))
            openBookingId = nil
        }
    }
}

#Preview {
    TeeRootView()
}
