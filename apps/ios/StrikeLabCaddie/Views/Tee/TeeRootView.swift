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
        case group(holdId: UUID, courseId: UUID?)
        case pay(holdId: UUID, courseId: UUID?)
        case pass(bookingId: UUID)
        case preferences
    }

    func push(_ route: Route) { path.append(route) }
    func popToRoot() { path = NavigationPath() }
}

struct TeeRootView: View {
    @StateObject private var nav = TeeNavigation()

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
                    case let .group(holdId, courseId):
                        TeeGroupView(holdId: holdId, courseId: courseId)
                    case let .pay(holdId, courseId):
                        TeePayView(holdId: holdId, courseId: courseId)
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
    }
}

#Preview {
    TeeRootView()
}
