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
    @State private var selectedPublicPackage: PublicCoursePackage?
    @State private var isLoadingPublicPackage = false
    @State private var groupGuests: [SetupGuest] = []
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 14) {
                    // Header
                    headerSection
                    
                    // Active round banner (if exists)
                    if persistenceManager.currentRound != nil {
                        activeRoundBanner
                    }
                    
                    // Course selection
                    courseSection(scrollProxy: proxy)
                    
                    // Tee selection
                    if let course = selectedCourse {
                        teeSection(course: course, scrollProxy: proxy)
                            .id("teeSection")
                    }

                    // Play format — Full 18 / Front 9 / Back 9
                    if selectedCourse != nil {
                        formatSection
                            .id("formatSection")
                    }

                    // Conditions card — fetches when a course is selected
                    if selectedCourse != nil {
                        conditionsCard
                    }

                    // Handicap info
                    if selectedTee != nil {
                        handicapSection
                    }

                    if selectedCourse != nil {
                        groupSection
                    }
                    
                    // Start button
                    if selectedCourse != nil {
                        startRoundButton
                    }
                    
                    // Extra space so the floating tab bar does not cover tee rows / start button.
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
                .padding(.bottom, 28)
            }
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
                selectedCourse = visibleCourses.first
            }
            fetchWeatherIfNeeded()
            fetchPublicPackageIfNeeded()
        }
        .onChange(of: selectedCourse) { _, _ in
            fetchWeatherIfNeeded()
            fetchPublicPackageIfNeeded()
            groupGuests = groupGuests.map { guest in
                var updated = guest
                updated.tee = selectedTee
                return updated
            }
        }
        .onChange(of: selectedTee) { _, newTee in
            groupGuests = groupGuests.map { guest in
                var updated = guest
                updated.tee = newTee
                return updated
            }
        }
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            StrikeLabLogoLockup(subtitle: "Caddie", title: "STRIKELAB")

            Text("Get dialed in.")
                .font(Theme.titleFont(28))
                .foregroundColor(Theme.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 4)
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
    
    private func courseSection(scrollProxy: ScrollViewProxy) -> some View {
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
                .contentShape(Rectangle())
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

            let defaultCourses = visibleCourses.filter { !$0.isFromAPI && !$0.isCustom }
            let importedCourses = visibleCourses.filter { $0.isFromAPI }
            let customCourses = visibleCourses.filter { $0.isCustom && !$0.isFromAPI }

            if !defaultCourses.isEmpty {
                ForEach(defaultCourses) { course in
                    courseRow(course, badge: course.hasGPSData ? "location.fill" : nil, scrollProxy: scrollProxy)
                }
            }

            if !importedCourses.isEmpty {
                Text("IMPORTED")
                    .font(Theme.labelFont(10))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                    .padding(.top, 4)

                ForEach(importedCourses) { course in
                    courseRow(course, badge: "globe", scrollProxy: scrollProxy)
                }
            }

            if !customCourses.isEmpty {
                Text("CUSTOM")
                    .font(Theme.labelFont(10))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                    .padding(.top, 4)

                ForEach(customCourses) { course in
                    courseRow(course, badge: "pencil", scrollProxy: scrollProxy)
                }
            }
        }
    }

    private var visibleCourses: [Course] {
        persistenceManager.courses.filter { !persistenceManager.isHiddenFromRoundSetup($0) }
    }

    private func removeFavorite(_ course: Course) {
        persistenceManager.hideCourseFromRoundSetup(course)
        if selectedCourse?.id == course.id {
            selectedCourse = visibleCourses.first { $0.id != course.id }
            selectedTee = nil
        }
    }

    private func selectCourse(_ course: Course, scrollProxy: ScrollViewProxy) {
        selectedCourse = course
        selectedTee = nil
        DispatchQueue.main.async {
            withAnimation(.easeInOut(duration: 0.25)) {
                scrollProxy.scrollTo("teeSection", anchor: .top)
            }
        }
    }

    private func courseRow(_ course: Course, badge: String?, scrollProxy: ScrollViewProxy) -> some View {
        let isSelected = selectedCourse?.id == course.id
        return HStack(spacing: 12) {
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
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture {
                selectCourse(course, scrollProxy: scrollProxy)
            }

            Button {
                removeFavorite(course)
            } label: {
                Image(systemName: "star.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Theme.accent)
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Remove \(course.name) from My Courses")
        }
        .frame(maxWidth: .infinity)
        .background(
            Rectangle()
                .fill(isSelected ? Theme.accent.opacity(0.08) : Theme.surface)
        )
        .overlay(
            Rectangle()
                .stroke(isSelected ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1)
        )
        .contentShape(Rectangle())
    }
    
    // MARK: - Tee Section
    
    private func teeSection(course: Course, scrollProxy: ScrollViewProxy) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Tee")

            ForEach(course.tees) { tee in
                let isSelected = selectedTee?.id == tee.id
                Button {
                    selectedTee = tee
                    DispatchQueue.main.async {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            scrollProxy.scrollTo("formatSection", anchor: .top)
                        }
                    }
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
                    .contentShape(Rectangle())
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
            SectionLabel(
                text: "Conditions",
                trailing: selectedPublicPackage?.conditions?.source.uppercased() ?? "OPEN DATA"
            )

            if let publicConditions = selectedPublicPackage?.conditions {
                publicConditionsBody(publicConditions)
            } else if isLoadingPublicPackage || weatherManager.isLoading {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text("Loading open conditions…")
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

    private func publicConditionsBody(_ c: TeeCourseConditions) -> some View {
        let sample = c.hourly?.first(where: { $0.h == 14 }) ?? c.hourly?.first
        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Circle()
                    .fill((c.windMs ?? sample?.w ?? 0) < 10 && (c.rainPct ?? 0) < 0.3 ? Theme.accent : Theme.warn)
                    .frame(width: 8, height: 8)
                Text("OPEN GOLF CONDITIONS")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.accent)
                Spacer()
                Text(c.source.uppercased())
                    .font(Theme.labelFont(10))
                    .tracking(1.2)
                    .foregroundColor(Theme.ink3)
            }

            HStack(spacing: 12) {
                conditionsTile(
                    icon: "thermometer",
                    label: "TEMP",
                    value: "\(Int((sample?.t ?? c.tempC ?? 0).rounded()))°C"
                )
                conditionsTile(
                    icon: "wind",
                    label: "WIND",
                    value: "\(Int((sample?.w ?? c.windMs ?? 0).rounded())) m/s",
                    sub: sample?.dir
                )
                conditionsTile(
                    icon: "drop.fill",
                    label: "RAIN",
                    value: "\(Int(((c.rainPct ?? sample?.rain ?? 0) * 100).rounded()))%"
                )
            }

            HStack(spacing: 12) {
                conditionsTile(icon: "sunrise.fill", label: "SUNRISE", value: c.sunrise ?? "—")
                conditionsTile(icon: "sun.max.fill", label: "GOLDEN", value: c.goldenStart ?? "—")
                conditionsTile(icon: "sunset.fill", label: "SUNSET", value: c.sunset ?? "—")
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
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

    private func fetchPublicPackageIfNeeded() {
        guard let course = selectedCourse else {
            selectedPublicPackage = nil
            return
        }
        if let cached = persistenceManager.publicCoursePackage(for: course.id) {
            selectedPublicPackage = cached
            return
        }

        isLoadingPublicPackage = true
        Task {
            do {
                let package = try await TeeAPIClient.shared.publicCoursePackage(courseId: course.id)
                persistenceManager.cachePublicCoursePackage(package)
                if selectedCourse?.id == course.id {
                    selectedPublicPackage = package
                    selectedCourse = persistenceManager.courses.first { $0.id == course.id } ?? course
                }
            } catch {
                if selectedCourse?.id == course.id {
                    selectedPublicPackage = nil
                }
            }
            if selectedCourse?.id == course.id {
                isLoadingPublicPackage = false
            }
        }
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

    private var groupSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Group Scorecard", trailing: "\(groupGuests.count + 1)/4 players")

            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 12) {
                    Circle()
                        .fill(Theme.accent)
                        .frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(persistenceManager.player.name)
                            .font(Theme.labelFont(13))
                            .tracking(1.0)
                            .foregroundColor(Theme.ink)
                        Text("PRIMARY · WATCH SHOTS + BIOMETRICS")
                            .font(Theme.labelFont(9))
                            .tracking(1.1)
                            .foregroundColor(Theme.ink3)
                    }
                    Spacer()
                    Text(persistenceManager.player.formattedHandicap)
                        .font(Theme.statFont(14))
                        .foregroundColor(Theme.accent)
                }
                .padding(12)
                .background(Theme.surface2)
                .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                ForEach($groupGuests) { $guest in
                    setupGuestRow(guest: $guest)
                }

                if groupGuests.count < 3 {
                    Button {
                        groupGuests.append(SetupGuest(name: "Guest \(groupGuests.count + 1)", tee: selectedTee))
                    } label: {
                        HStack {
                            Image(systemName: "person.badge.plus")
                            Text("Add Guest")
                            Spacer()
                            Text("score only")
                        }
                        .font(Theme.labelFont(11))
                        .tracking(1.4)
                        .foregroundColor(Theme.accent)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 12)
                        .overlay(Rectangle().stroke(Theme.accent.opacity(0.45), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
            .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 12)
        }
    }

    private func setupGuestRow(guest: Binding<SetupGuest>) -> some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                TextField("Guest name", text: guest.name)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink)
                    .textInputAutocapitalization(.words)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(Theme.surface3)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                Button {
                    groupGuests.removeAll { $0.id == guest.wrappedValue.id }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Theme.ink3)
                        .frame(width: 32, height: 32)
                        .background(Theme.surface3)
                        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 10) {
                TextField("HCP index", text: guest.handicapText)
                    .keyboardType(.decimalPad)
                    .font(Theme.statFont(14))
                    .foregroundColor(Theme.ink)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(Theme.surface3)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                Text(guest.wrappedValue.strokePreview(fallbackTee: selectedTee))
                    .font(Theme.labelFont(10))
                    .tracking(1.1)
                    .foregroundColor(Theme.warn)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
        .padding(12)
        .background(Theme.surface2)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
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
        guard let selectedTee else {
            return 0
        }
        let tee = selectedTee.adjustedForPlayFormat(selectedFormat)
        guard
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
            playFormat: selectedFormat,
            groupPlayers: buildGroupPlayers(for: course)
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

    private func buildGroupPlayers(for course: Course) -> [GroupPlayer] {
        groupGuests.compactMap { guest in
            let name = guest.name.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !name.isEmpty else { return nil }
            var player = GroupPlayer(
                name: name,
                handicapIndex: guest.handicapIndex,
                tee: guest.tee ?? selectedTee,
                holes: course.holes.map {
                    GroupPlayerHoleScore(holeNumber: $0.number, par: $0.par, handicapIndex: $0.handicapIndex)
                }
            )
            player.recalculateStrokeAllocation(course: course, format: selectedFormat)
            return player
        }
    }
}

private struct SetupGuest: Identifiable, Equatable {
    let id = UUID()
    var name: String
    var handicapText: String = ""
    var tee: Tee?

    var handicapIndex: Double? {
        let normalized = handicapText.replacingOccurrences(of: ",", with: ".")
        if normalized.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return nil }
        return Double(normalized)
    }

    func strokePreview(fallbackTee: Tee?) -> String {
        guard let handicapIndex else { return "Gross only" }
        guard let tee = tee ?? fallbackTee,
              let slope = tee.slope,
              let rating = tee.courseRating,
              let par = tee.par else {
            return "HCP set · no tee rating"
        }
        let ch = HandicapCalculator.courseHandicap(
            handicapIndex: handicapIndex,
            slope: slope,
            courseRating: rating,
            par: par
        )
        return "CH \(ch) · strokes allocated"
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
