//
//  CourseSearchView.swift
//  StrikeLabCaddie
//
//  Search and import courses from Golf Course API
//

import SwiftUI

struct CourseSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var persistenceManager: PersistenceManager
    @StateObject private var apiManager: GolfCourseAPIManager
    
    init() {
        // Initialize with nil, will set persistence manager in onAppear
        _apiManager = StateObject(wrappedValue: GolfCourseAPIManager())
    }
    
    @State private var searchText = ""
    @State private var importingCourseId: Int?
    @State private var showImportSuccess = false
    @State private var importedCourseName = ""
    @State private var importError: String?
    
    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            searchBar
            
            // Offline banner
            if apiManager.isOfflineMode {
                offlineBanner
            }
            
            // Content
            ScrollView {
                VStack(spacing: 16) {
                    if searchText.isEmpty {
                        // Show recent searches and imported courses
                        if !apiManager.recentSearches.isEmpty {
                            recentSearchesSection
                        }

                        coursesOnPhoneSection

                        importedCoursesSection
                    } else if apiManager.isSearching {
                        loadingView
                    } else if let error = apiManager.searchError {
                        errorView(error)
                    } else if apiManager.searchResults.isEmpty && searchText.count >= 2 {
                        noResultsView
                    } else {
                        searchResultsSection
                    }
                    
                    Spacer(minLength: 40)
                }
                .padding()
            }
        }
        .nordicBackground()
        .navigationTitle("Find Course")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(Theme.nordicForest.opacity(0.7))
            }
        }
        .alert("Course Imported", isPresented: $showImportSuccess) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("\(importedCourseName) has been added to your courses.")
        }
        .alert("Import Error", isPresented: .init(
            get: { importError != nil },
            set: { if !$0 { importError = nil } }
        )) {
            Button("OK") { importError = nil }
        } message: {
            Text(importError ?? "Unknown error")
        }
        .onAppear {
            apiManager.persistenceManager = persistenceManager
        }
    }
    
    // MARK: - Offline Banner
    
    private var offlineBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 13))

            Text("OFFLINE · Only cached courses are available")
                .font(Theme.labelFont(11))
                .tracking(1.0)

            Spacer()
        }
        .foregroundColor(Theme.bad)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Theme.bad.opacity(0.12))
        .overlay(Rectangle().stroke(Theme.bad.opacity(0.5), lineWidth: 1))
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(Theme.ink3)

            TextField("Search courses worldwide…", text: $searchText)
                .textFieldStyle(.plain)
                .autocorrectionDisabled()
                .foregroundColor(Theme.ink)
                .tint(Theme.accent)
                .onChange(of: searchText) { _, newValue in
                    apiManager.search(query: newValue)
                }

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                    apiManager.searchResults = []
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(Theme.ink3)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        .padding()
    }
    
    // MARK: - Recent Searches
    
    private var recentSearchesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Recent Searches", trailing: "Clear")
                .onTapGesture {
                    apiManager.clearRecentSearches()
                }

            FlowLayout(spacing: 8) {
                ForEach(apiManager.recentSearches, id: \.self) { query in
                    Button {
                        searchText = query
                        apiManager.search(query: query)
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.system(size: 11))
                            Text(query)
                                .font(Theme.labelFont(12))
                                .tracking(1.0)
                        }
                        .foregroundColor(Theme.ink2)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Theme.surface2)
                        .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
    
    // MARK: - Bundled / on-device courses (not from Golf Course API import)

    private var coursesOnPhoneSection: some View {
        let onPhone = persistenceManager.courses.filter { !$0.isFromAPI }
        return VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Courses on this phone")

            if onPhone.isEmpty {
                Text("No courses yet. Pull to refresh the app or start from Round setup.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            } else {
                Text("These are ready for rounds without importing from search. Use search to add 40 000+ worldwide courses.")
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)

                ForEach(onPhone) { course in
                    onPhoneCourseRow(course)
                }
            }
        }
    }

    private func onPhoneCourseRow(_ course: Course) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "mappin.and.ellipse")
                .font(.system(size: 16))
                .foregroundColor(Theme.accent)
                .frame(width: 40, height: 40)
                .background(Theme.surface2)
                .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

            VStack(alignment: .leading, spacing: 4) {
                Text(course.name)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.ink)
                Text(course.location)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }
            Spacer()
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }

    // MARK: - Imported Courses
    
    private var importedCoursesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "Imported Courses")

            let importedCourses = persistenceManager.courses.filter { $0.isFromAPI }

            if importedCourses.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "globe.europe.africa.fill")
                        .font(.system(size: 32, weight: .light))
                        .foregroundColor(Theme.ink3)

                    Text("Search for any of 40 000+ courses")
                        .font(Theme.bodyFont(14))
                        .foregroundColor(Theme.ink2)

                    Text("Try \"PGA Catalunya\", \"Pebble Beach\" or your home club. We'll cache the scorecard for offline play.")
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.ink3)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 28)
                .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 12)
            } else {
                ForEach(importedCourses) { course in
                    importedCourseRow(course)
                }
            }
        }
    }
    
    private func importedCourseRow(_ course: Course) -> some View {
        let isCached = course.apiCourseId.map { persistenceManager.isCourseDetailsCached(id: $0) } ?? false

        return HStack(spacing: 12) {
            ZStack {
                Rectangle()
                    .fill(Theme.surface3)
                    .frame(width: 40, height: 40)
                    .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))

                Image(systemName: "flag.fill")
                    .font(.system(size: 16))
                    .foregroundColor(Theme.accent)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(course.name)
                        .font(Theme.bodyFont(14))
                        .foregroundColor(Theme.ink)

                    if isCached {
                        HStack(spacing: 2) {
                            Image(systemName: "arrow.down.circle.fill")
                                .font(.system(size: 10))
                            Text("OFFLINE")
                                .font(Theme.labelFont(9))
                                .tracking(1.2)
                        }
                        .foregroundColor(Theme.accent)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Theme.accent.opacity(0.12))
                        .overlay(Rectangle().stroke(Theme.accent.opacity(0.5), lineWidth: 1))
                    }
                }

                Text(course.location)
                    .font(Theme.labelFont(11))
                    .foregroundColor(Theme.ink3)
            }

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(Theme.accent)
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
    
    // MARK: - Search Results
    
    private var searchResultsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("\(apiManager.searchResults.count) RESULTS")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            ForEach(apiManager.searchResults) { result in
                searchResultRow(result)
            }
        }
    }
    
    private func searchResultRow(_ result: APISearchResult) -> some View {
        let isAlreadyImported = persistenceManager.courses.contains { $0.apiCourseId == result.id }
        let isImporting = importingCourseId == result.id
        
        return HStack(spacing: 12) {
            // Course icon
            ZStack {
                Circle()
                    .fill(isAlreadyImported ? Theme.nordicSage.opacity(0.2) : Theme.nordicForest.opacity(0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: "flag.fill")
                    .font(.system(size: 18))
                    .foregroundColor(isAlreadyImported ? Theme.nordicSage : Theme.nordicForest)
            }
            
            // Course info
            VStack(alignment: .leading, spacing: 4) {
                Text(result.displayName)
                    .font(Theme.bodyFont(14))
                    .foregroundColor(Theme.nordicForest)
                    .lineLimit(2)
                
                Text(result.locationString)
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicForest.opacity(0.5))
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Import button
            if isAlreadyImported {
                Text("Imported")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.nordicSage)
            } else if isImporting {
                ProgressView()
                    .scaleEffect(0.8)
            } else {
                Button {
                    importCourse(result)
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 14))
                        Text("Import")
                            .font(Theme.labelFont(13))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Theme.neuralCyan)
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .glassCard(cornerRadius: Theme.smallCornerRadius, padding: 0)
    }
    
    // MARK: - States
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Searching courses...")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    private func errorView(_ error: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 32))
                .foregroundColor(Theme.overPar)
            
            Text("Search Error")
                .font(Theme.titleFont(16))
                .foregroundColor(Theme.nordicForest)
            
            Text(error)
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .multilineTextAlignment(.center)
            
            Button("Try Again") {
                apiManager.search(query: searchText)
            }
            .font(Theme.labelFont(14))
            .foregroundColor(Theme.neuralCyan)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    private var noResultsView: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 32))
                .foregroundColor(Theme.nordicForest.opacity(0.3))
            
            Text("No Courses Found")
                .font(Theme.titleFont(16))
                .foregroundColor(Theme.nordicForest)
            
            Text("Try a different search term or check the spelling")
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    // MARK: - Import
    
    private func importCourse(_ result: APISearchResult) {
        importingCourseId = result.id
        
        Task {
            do {
                let details = try await apiManager.getCourseDetails(id: result.id)
                let course = apiManager.convertToCourse(details)
                
                await MainActor.run {
                    persistenceManager.addCourse(course)
                    importedCourseName = course.name
                    importingCourseId = nil
                    showImportSuccess = true
                }
            } catch {
                await MainActor.run {
                    importingCourseId = nil
                    importError = error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Flow Layout for Tags

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var x: CGFloat = 0
        var rowHeight: CGFloat = 0
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            
            if x + size.width > width {
                x = 0
                height += rowHeight + spacing
                rowHeight = 0
            }
            
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        
        height += rowHeight
        return CGSize(width: width, height: height)
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            
            subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

#Preview {
    NavigationStack {
        CourseSearchView()
            .environmentObject(PersistenceManager())
    }
}
