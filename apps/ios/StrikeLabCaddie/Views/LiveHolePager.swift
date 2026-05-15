//
//  LiveHolePager.swift
//  StrikeLabCaddie
//
//  On-course scoring view. Tap "Start Round" → land here, on hole 1, with
//  the full Caddie panel + score steppers ready. Swipe horizontally to
//  page between holes; every change auto-saves through to the round so
//  there's no Cancel/Save modal in the way.
//

import SwiftUI
import CoreLocation
import Combine

struct LiveHolePager: View {
    @Binding var round: Round
    @EnvironmentObject var persistenceManager: PersistenceManager
    @EnvironmentObject var connectivityManager: WatchConnectivityManager
    @EnvironmentObject var weatherManager: WeatherManager
    @EnvironmentObject var locationManager: LocationManager

    @State private var selectedHole: Int = 1
    @State private var showScorecard = false
    @State private var showEndRoundAlert = false
    @State private var showGPS = false
    @State private var summaryRound: Round?
    @State private var clockTick = Date()

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()

            TabView(selection: $selectedHole) {
                ForEach(round.playedHoles) { hole in
                    holePage(for: hole)
                        .tag(hole.holeNumber)
                }
                finishPage
                    .tag(finishPageTag)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            // Floating bottom bar with quick navigation + scorecard access
            VStack {
                Spacer()
                bottomBar
            }
        }
        .navigationTitle(round.course.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    showScorecard = true
                } label: {
                    Image(systemName: "list.number")
                }
                .foregroundColor(Theme.ink2)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showGPS = true
                } label: {
                    Image(systemName: "map")
                }
                .foregroundColor(Theme.ink2)
            }
        }
        .sheet(isPresented: $showScorecard) {
            NavigationStack {
                ScorecardView(round: $round, isReadOnly: false)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Done") { showScorecard = false }
                                .foregroundColor(Theme.accent)
                        }
                    }
            }
        }
        .sheet(isPresented: $showGPS) {
            NavigationStack {
                currentHoleGPSView
                    .navigationTitle("Hole \(currentScoringHoleNumber)")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Done") { showGPS = false }
                                .foregroundColor(Theme.accent)
                        }
                    }
            }
        }
        .alert("End round?", isPresented: $showEndRoundAlert) {
            Button("Save & complete", role: .destructive) {
                completeRoundAndShowSummary()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This saves your scorecard, shots, GPS-backed round data, and queues the export sync. You can still review it later from Round History.")
        }
        .fullScreenCover(item: $summaryRound) { snapshot in
            NavigationStack {
                RoundSummaryView(round: snapshot, onClose: {
                    summaryRound = nil
                })
                .environmentObject(persistenceManager)
            }
        }
        .onAppear {
            let range = round.playFormat.holeRange
            let hole = round.currentHoleNumber
            selectedHole = max(range.lowerBound, min(range.upperBound, hole))
            if !locationManager.isTracking {
                locationManager.startTracking()
            }

            // Best-effort weather fetch for the course centroid so the
            // Caddie panel has wind / temp data on first paint.
            if let lat = round.course.latitude, let lon = round.course.longitude {
                let here = CLLocation(latitude: lat, longitude: lon)
                Task { await weatherManager.fetchWeather(for: here) }
            }
        }
        .onChange(of: selectedHole) { _, newHole in
            guard round.playFormat.holeRange.contains(newHole) else { return }
            persistCurrentHole(newHole)
        }
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { now in
            clockTick = now
        }
    }

    @ViewBuilder
    private func holePage(for hole: RoundHole) -> some View {
        if let idx = round.holes.firstIndex(where: { $0.id == hole.id }) {
            HoleDetailView(
                roundHole: $round.holes[idx],
                round: $round,
                commitsLive: true
            )
            // Reserve space for the floating bottom bar
            .safeAreaInset(edge: .bottom) {
                Color.clear.frame(height: 56)
            }
        }
    }

    private var finishPage: some View {
        ScrollView {
            VStack(spacing: 16) {
                VStack(spacing: 6) {
                    Image(systemName: "flag.checkered")
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundColor(Theme.accent)

                    Text("Finish \(round.playFormat.displayName)")
                        .font(Theme.titleFont(24))
                        .foregroundColor(Theme.ink)

                    Text("Confirm and save this scorecard before leaving the session.")
                        .font(Theme.bodyFont(13))
                        .foregroundColor(Theme.ink3)
                        .multilineTextAlignment(.center)
                }

                finishSummaryCard

                Button {
                    showEndRoundAlert = true
                } label: {
                    HStack {
                        Text("SAVE & FINISH ROUND")
                            .font(Theme.labelFont(13))
                            .tracking(1.6)
                        Spacer()
                        Image(systemName: "checkmark.circle.fill")
                    }
                    .foregroundColor(Theme.accentInk)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 16)
                    .background(Theme.accent)
                }
                .buttonStyle(.plain)

                Button {
                    selectedHole = round.playFormat.holeRange.upperBound
                } label: {
                    Text("Back to last hole")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.ink2)
                }
                .buttonStyle(.plain)
            }
            .padding()
            .padding(.bottom, 70)
        }
    }

    private var finishSummaryCard: some View {
        HStack(spacing: 0) {
            finishStat(label: "HOLES", value: "\(round.holesCompleted)/\(round.playFormat.totalHoles)")
            Rectangle().fill(Theme.line).frame(width: 1, height: 42)
            finishStat(label: "GROSS", value: "\(round.grossTotal)")
            Rectangle().fill(Theme.line).frame(width: 1, height: 42)
            finishStat(label: "TO PAR", value: round.formattedOverUnder, tint: scoreColor)
            Rectangle().fill(Theme.line).frame(width: 1, height: 42)
            finishStat(label: "PUTTS", value: "\(round.totalPutts)")
        }
        .padding(.vertical, 14)
        .glassCard(cornerRadius: Theme.cornerRadius, padding: 0)
    }

    private func finishStat(label: String, value: String, tint: Color = Theme.ink) -> some View {
        VStack(spacing: 3) {
            Text(label)
                .font(Theme.labelFont(10))
                .tracking(1.3)
                .foregroundColor(Theme.ink3)
            Text(value)
                .font(Theme.statFont(22))
                .foregroundColor(tint)
        }
        .frame(maxWidth: .infinity)
    }

    private var currentHoleGPSView: some View {
        let holeNumber = currentScoringHoleNumber
        let hole = round.holes.first { $0.holeNumber == holeNumber }
        let layout = round.course.holeLayouts?.first { $0.holeNumber == holeNumber }
        return HoleGPSView(
            holeNumber: holeNumber,
            par: hole?.par ?? 4,
            holeLayout: layout,
            shots: round.shots(forHole: holeNumber),
            locationManager: locationManager,
            weatherManager: weatherManager
        )
    }

    private var bottomBar: some View {
        let _ = clockTick
        let range = round.playFormat.holeRange
        let canPrev = selectedHole > range.lowerBound
        let isFinish = selectedHole == finishPageTag
        let canNext = selectedHole < finishPageTag
        return HStack(spacing: 12) {
            Button {
                if isFinish {
                    selectedHole = range.upperBound
                } else if canPrev {
                    selectedHole -= 1
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor((canPrev || isFinish) ? Theme.ink : Theme.ink3.opacity(0.5))
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)

            VStack(spacing: 0) {
                Text(isFinish ? "FINISH · \(round.playFormat.shortLabel)" : "HOLE \(selectedHole) / \(range.upperBound) · \(round.playFormat.shortLabel)")
                    .font(Theme.labelFont(11))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink3)
                Text("\(round.grossTotal) · \(round.formattedOverUnder) · \(liveElapsed)")
                    .font(Theme.statFont(15))
                    .foregroundColor(Theme.ink)
            }
            .frame(maxWidth: .infinity)

            Button {
                if canNext {
                    selectedHole = selectedHole == range.upperBound ? finishPageTag : selectedHole + 1
                }
            } label: {
                Image(systemName: isFinish ? "checkmark" : "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(canNext ? Theme.accentInk : Theme.ink3.opacity(0.5))
                    .frame(width: 44, height: 44)
                    .background(canNext ? Theme.accent : Theme.surface2)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(
            Theme.bg.opacity(0.92)
                .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        )
    }

    private var finishPageTag: Int {
        round.playFormat.holeRange.upperBound + 1
    }

    private var currentScoringHoleNumber: Int {
        let range = round.playFormat.holeRange
        guard range.contains(selectedHole) else { return range.upperBound }
        return selectedHole
    }

    private var scoreColor: Color {
        if round.grossOverUnder < 0 { return Theme.accent }
        if round.grossOverUnder > 0 { return Theme.bad }
        return Theme.ink
    }

    private var liveElapsed: String {
        let total = max(0, Int((round.completedAt ?? clockTick).timeIntervalSince(round.date)))
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        let seconds = total % 60
        if hours > 0 {
            return "\(hours)h \(String(format: "%02d", minutes))m"
        }
        if minutes > 0 {
            return "\(minutes)m"
        }
        return "\(seconds)s"
    }

    private func persistCurrentHole(_ holeNumber: Int) {
        round.currentHoleNumber = holeNumber
        persistenceManager.saveCurrentRound()
        connectivityManager.sendCurrentHole(holeNumber)
    }

    private func completeRoundAndShowSummary() {
        summaryRound = persistenceManager.completeCurrentRound() ?? round
    }
}

