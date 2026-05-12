//
//  RoundSetupView.swift
//  StrikeLabCaddie
//
//  Round setup and configuration view
//

import SwiftUI
import CoreLocation

struct RoundSetupView: View {
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    @EnvironmentObject var weatherManager: WeatherManager

    @State private var selectedCourse: Course?
    @State private var selectedTee: Tee?
    @State private var selectedFormat: PlayFormat = .full18
    @State private var showCourseSetup = false
    @State private var showingActiveRound = false
    @State private var showAddCourse = false
    @State private var showCourseSearch = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                headerSection
                    .padding(.top, 4)
                
                // Active round banner (if exists)
                if persistenceManager.currentRound != nil {
                    activeRoundBanner
                }
                
                // Course selection
                courseSection
                
                // Tee selection
                if let course = selectedCourse {
                    teeSection(course: course)
                }

                // Play format — Full 18 / Front 9 / Back 9
                if selectedCourse != nil {
                    formatSection
                }

                // Conditions card — fetches when a course is selected
                if selectedCourse != nil {
                    conditionsCard
                }

                // Handicap info
                if selectedTee != nil {
                    handicapSection
                }
                
                // Start button
                if selectedCourse != nil {
                    startRoundButton
                }
                
                // Extra space so the floating tab bar does not cover tee rows / start button.
                Spacer(minLength: 100)
            }
            .padding()
            .padding(.bottom, 28)
        }
        .nordicBackground()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if selectedCourse != nil {
                    Button {
                        showCourseSetup = true
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundColor(Theme.ink2)
                    }
                }
            }
        }
        .sheet(isPresented: $showCourseSetup) {
            if let course = selectedCourse {
                NavigationStack {
                    CourseSetupView(course: Binding(
                        get: { course },
                        set: { updated in
                            persistenceManager.updateCourse(updated)
                            selectedCourse = updated
                            // Refresh tee selection
                            if let tee = selectedTee,
                               let updatedTee = updated.tees.first(where: { $0.id == tee.id }) {
                                selectedTee = updatedTee
                            }
                        }
                    ))
                }
            }
        }
        .sheet(isPresented: $showAddCourse) {
            NavigationStack {
                AddCourseView()
            }
        }
        .sheet(isPresented: $showCourseSearch) {
            NavigationStack {
                CourseSearchView()
            }
        }
        .onAppear {
            if selectedCourse == nil {
                selectedCourse = persistenceManager.courses.first
            }
            fetchWeatherIfNeeded()
        }
        .onChange(of: selectedCourse) { _, _ in
            fetchWeatherIfNeeded()
        }
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("STRIKELABCADDIE")
                .font(Theme.labelFont(11))
                .tracking(2.0)
                .foregroundColor(Theme.accent)

            Text("Get dialed in.")
                .font(Theme.titleFont(28))
                .foregroundColor(Theme.ink)

            Text("Pick a course, lock the tee, and the watch syncs automatically.")
                .font(Theme.bodyFont(13))
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 10)
    }
    
    // MARK: - Active Round Banner
    
    private var activeRoundBanner: some View {
        Button {
            showingActiveRound = true
        } label: {
            HStack(spacing: 12) {
                Circle()
                    .fill(Theme.accent)
                    .frame(width: 8, height: 8)

                VStack(alignment: .leading, spacing: 4) {
                    Text("ROUND IN PROGRESS")
                        .font(Theme.labelFont(11))
                        .tracking(1.6)
                        .foregroundColor(Theme.accent)

                    if let round = persistenceManager.currentRound {
                        Text("\(round.course.name) · Hole \(round.currentHoleNumber)")
                            .font(Theme.bodyFont(14))
                            .foregroundColor(Theme.ink)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(Theme.ink2)
            }
            .padding()
            .background(Theme.accent.opacity(0.08))
            .overlay(Rectangle().stroke(Theme.accent.opacity(0.5), lineWidth: 1))
        }
        .navigationDestination(isPresented: $showingActiveRound) {
            if persistenceManager.currentRound != nil {
                LiveHolePager(round: Binding(
                    get: { persistenceManager.currentRound ?? Round(course: CourseData.defaultCourse, player: persistenceManager.player) },
                    set: { persistenceManager.currentRound = $0 }
                ))
            }
        }
    }
    
    // MARK: - Course Section
    
    private var courseSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Button {
                showCourseSearch = true
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14))
                    Text("SEARCH 40,000+ COURSES")
                        .font(Theme.labelFont(11))
                        .tracking(1.8)
                    Spacer()
                    Image(systemName: "globe")
                        .font(.system(size: 13))
                }
                .foregroundColor(Theme.accentInk)
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(Theme.accent)
            }
            .buttonStyle(.plain)

            HStack {
                Text("MY COURSES")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                Spacer()
                Button {
                    showAddCourse = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "plus.circle")
                        Text("CUSTOM")
                            .tracking(1.4)
                    }
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.accent)
                }
            }

            let defaultCourses = persistenceManager.courses.filter { !$0.isFromAPI && !$0.isCustom }
            let importedCourses = persistenceManager.courses.filter { $0.isFromAPI }
            let customCourses = persistenceManager.courses.filter { $0.isCustom && !$0.isFromAPI }

            if !defaultCourses.isEmpty {
                ForEach(defaultCourses) { course in
                    courseRow(course, badge: course.hasGPSData ? "location.fill" : nil)
                }
            }

            if !importedCourses.isEmpty {
                Text("IMPORTED")
                    .font(Theme.labelFont(10))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                    .padding(.top, 4)

                ForEach(importedCourses) { course in
                    courseRow(course, badge: "globe")
                }
            }

            if !customCourses.isEmpty {
                Text("CUSTOM")
                    .font(Theme.labelFont(10))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                    .padding(.top, 4)

                ForEach(customCourses) { course in
                    courseRow(course, badge: "pencil")
                }
            }
        }
    }

    private func courseRow(_ course: Course, badge: String?) -> some View {
        let isSelected = selectedCourse?.id == course.id
        return Button {
            selectedCourse = course
            selectedTee = nil
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(course.name)
                            .font(Theme.bodyFont(15))
                            .foregroundColor(Theme.ink)

                        if let badge = badge {
                            Image(systemName: badge)
                                .font(.system(size: 10))
                                .foregroundColor(Theme.accent)
                        }
                    }

                    HStack(spacing: 8) {
                        Text(course.location)
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink3)

                        if course.hasCompleteHoleData {
                            Text("· PAR \(course.totalPar)")
                                .font(Theme.labelFont(11))
                                .foregroundColor(Theme.ink3)
                        }
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Theme.accent)
                }
            }
            .padding()
        }
        .buttonStyle(.plain)
        .background(
            Rectangle()
                .fill(isSelected ? Theme.accent.opacity(0.08) : Theme.surface)
        )
        .overlay(
            Rectangle()
                .stroke(isSelected ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1)
        )
    }
    
    // MARK: - Tee Section
    
    private func teeSection(course: Course) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Tee")

            ForEach(course.tees) { tee in
                let isSelected = selectedTee?.id == tee.id
                Button {
                    selectedTee = tee
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(tee.name)
                                .font(Theme.bodyFont(15))
                                .foregroundColor(Theme.ink)

                            Text(tee.statusText)
                                .font(Theme.labelFont(11))
                                .tracking(1.0)
                                .foregroundColor(tee.hasCompleteData ? Theme.ink3 : Theme.bad)
                        }

                        Spacer()

                        if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(Theme.accent)
                        }
                    }
                    .padding()
                }
                .buttonStyle(.plain)
                .background(
                    Rectangle()
                        .fill(isSelected ? Theme.accent.opacity(0.08) : Theme.surface)
                )
                .overlay(
                    Rectangle()
                        .stroke(isSelected ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1)
                )
            }

            if !course.tees.contains(where: { $0.hasCompleteData }) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle")
                        .foregroundColor(Theme.warn)

                    Text("Tap the gear icon to enter tee data for handicap calculation.")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink2)
                }
                .padding(.top, 4)
            }
        }
    }
    
    // MARK: - Handicap Section
    
    // MARK: - Format

    private var formatSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Play Format")

            HStack(spacing: 0) {
                ForEach(PlayFormat.allCases, id: \.self) { format in
                    let isSelected = selectedFormat == format
                    Button {
                        selectedFormat = format
                    } label: {
                        VStack(spacing: 2) {
                            Text(format.shortLabel)
                                .font(Theme.statFont(20))
                                .foregroundColor(isSelected ? Theme.accentInk : Theme.ink)
                            Text(format.displayName.uppercased())
                                .font(Theme.labelFont(10))
                                .tracking(1.4)
                                .foregroundColor(isSelected ? Theme.accentInk.opacity(0.7) : Theme.ink3)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(isSelected ? Theme.accent : Theme.surface)
                        .overlay(Rectangle().stroke(isSelected ? Theme.accent : Theme.line, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Conditions

    private var conditionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "Conditions")

            if weatherManager.isLoading {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text("Loading weather…")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                }
                .padding()
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
            } else if let conditions = weatherManager.currentConditions {
                conditionsBody(conditions)
            } else {
                Text("Conditions unavailable")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
                    .padding()
                    .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
            }
        }
    }

    private func conditionsBody(_ c: WeatherConditions) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Verdict line — "Good for golf" / "Tough conditions" based
            // on wind + precip thresholds in WeatherManager.
            HStack(spacing: 6) {
                Circle()
                    .fill(c.isPlayable ? Theme.accent : Theme.warn)
                    .frame(width: 8, height: 8)
                Text(c.isPlayable ? "GOOD FOR GOLF" : "TOUGH CONDITIONS")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(c.isPlayable ? Theme.accent : Theme.warn)
                Spacer()
                Text(c.windDescription.uppercased())
                    .font(Theme.labelFont(10))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
            }

            HStack(spacing: 12) {
                conditionsTile(
                    icon: "thermometer",
                    label: "TEMP",
                    value: c.formattedTemperature(useFahrenheit: false)
                )
                conditionsTile(
                    icon: "wind",
                    label: "WIND",
                    value: "\(Int(c.windSpeed)) km/h",
                    sub: c.windDirectionCompass
                )
                conditionsTile(
                    icon: "drop.fill",
                    label: "RAIN",
                    value: String(format: "%.1f mm", c.precipitation)
                )
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }

    private func conditionsTile(icon: String, label: String, value: String, sub: String? = nil) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(Theme.ink2)
            Text(value)
                .font(Theme.statFont(15))
                .foregroundColor(Theme.ink)
            Text(sub ?? label)
                .font(Theme.labelFont(9))
                .tracking(1.0)
                .foregroundColor(Theme.ink3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }

    private func fetchWeatherIfNeeded() {
        guard let course = selectedCourse,
              let lat = course.latitude,
              let lon = course.longitude else { return }
        let location = CLLocation(latitude: lat, longitude: lon)
        Task { await weatherManager.fetchWeather(for: location) }
    }

    private var handicapSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Handicap")

            HStack(spacing: 20) {
                handicapTile(label: "Index", value: persistenceManager.player.formattedHandicap, tint: Theme.ink)

                hcDivider

                handicapTile(
                    label: "Course HC",
                    value: hasCompleteHandicap ? "\(calculateCourseHandicap())" : "--",
                    tint: Theme.ink
                )

                hcDivider

                handicapTile(
                    label: "Strokes",
                    value: hasCompleteHandicap ? "\(calculateCourseHandicap())" : "--",
                    tint: Theme.accent
                )
            }
            .frame(maxWidth: .infinity)
            .glassCard()
        }
    }

    private var hasCompleteHandicap: Bool {
        selectedTee?.hasCompleteData == true
    }

    private var hcDivider: some View {
        Rectangle().fill(Theme.line).frame(width: 1, height: 38)
    }

    private func handicapTile(label: String, value: String, tint: Color) -> some View {
        VStack(spacing: 4) {
            Text(label.uppercased())
                .font(Theme.labelFont(10))
                .tracking(1.4)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(24))
                .foregroundColor(tint)
        }
        .frame(maxWidth: .infinity)
    }
    
    // MARK: - Start Button
    
    private var startRoundButton: some View {
        Button {
            startRound()
        } label: {
            HStack {
                Image(systemName: "flag.fill")
                Text("Start Round")
            }
            .primaryButton()
        }
        .padding(.top, 20)
    }
    
    // MARK: - Helpers
    
    private func calculateCourseHandicap() -> Int {
        guard let tee = selectedTee,
              let slope = tee.slope,
              let rating = tee.courseRating,
              let par = tee.par else {
            return 0
        }
        return HandicapCalculator.courseHandicap(
            handicapIndex: persistenceManager.player.handicapIndex,
            slope: slope,
            courseRating: rating,
            par: par
        )
    }
    
    private func startRound() {
        guard let course = selectedCourse else { return }

        persistenceManager.startNewRound(
            course: course,
            tee: selectedTee,
            playFormat: selectedFormat
        )

        // Start location tracking
        locationManager.clearHistory()
        locationManager.startTracking()

        // Notify watch
        connectivityManager.sendRoundStatus(isActive: true, courseName: course.name)
        connectivityManager.sendCurrentHole(selectedFormat.holeRange.lowerBound)
        if let round = persistenceManager.currentRound {
            connectivityManager.sendRoundConfig(round)
            RoundLiveSync.syncNow(round: round, persistence: persistenceManager)
        }

        showingActiveRound = true
    }
}

#Preview {
    NavigationStack {
        RoundSetupView()
            .environmentObject(PersistenceManager())
            .environmentObject(LocationManager())
            .environmentObject(WatchConnectivityManager())
    }
}
