//
//  PersistenceManager.swift
//  StrikeLabCaddie
//
//  Offline-first JSON persistence
//

import Foundation
import Combine

/// Manages persistent storage of rounds, player profile, and course data
@MainActor
class PersistenceManager: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var player: Player {
        didSet { savePlayer() }
    }
    
    @Published var currentRound: Round? {
        didSet { saveCurrentRound() }
    }
    
    @Published var savedRounds: [Round] = []
    
    @Published var courses: [Course] = [] {
        didSet { saveCourses() }
    }
    
    @Published var practiceSessions: [PracticeSession] = [] {
        didSet { savePracticeSessions() }
    }

    /// Live range session — populated while the watch is streaming
    /// swings during a driving-range workout. Persisted to disk on
    /// EVERY change so an iOS crash, kill, or background eviction
    /// can never destroy registered swings. The session moves to
    /// `practiceSessions` when the watch fires `rangeEnded` OR when
    /// the user presses SAVE NOW on the live card OR when iOS opens
    /// next time (via the recovery flow).
    @Published var liveRangeSession: PracticeSession? {
        didSet { persistLiveRangeSession() }
    }

    /// Rolling buffer of the most recent enhanced shots received from
    /// the watch (full motion + HR snapshot). Capped at 50 — used by
    /// the dev-only `SwingInspectorView` to verify Phase 1 plumbing
    /// and (later) by the Swing Card to look up rich data by id.
    @Published private(set) var recentEnhancedShots: [EnhancedShotEvent] = []
    private let maxRecentEnhancedShots = 50

    /// Append a freshly-arrived enhanced shot. Newest first; older
    /// entries dropped when the cap is exceeded.
    func recordEnhancedShot(_ event: EnhancedShotEvent) {
        recentEnhancedShots.insert(event, at: 0)
        if recentEnhancedShots.count > maxRecentEnhancedShots {
            recentEnhancedShots = Array(recentEnhancedShots.prefix(maxRecentEnhancedShots))
        }
    }

    func recentEnhancedShot(id: UUID) -> EnhancedShotEvent? {
        recentEnhancedShots.first { $0.id == id }
    }

    func applyEnhancedData(to shot: PracticeShot) -> PracticeShot {
        guard let event = recentEnhancedShot(id: shot.id) else { return shot }
        return Self.mergePracticeShot(shot, with: event)
    }

    func applyEnhancedData(to shot: Shot) -> Shot {
        guard let event = recentEnhancedShot(id: shot.id) else { return shot }
        return Self.mergeRoundShot(shot, with: event)
    }

    func applyRecentEnhancedData(to session: PracticeSession) -> PracticeSession {
        var out = session
        out.shots = out.shots.map { applyEnhancedData(to: $0) }
        return out
    }

    func captureCompleteness(for session: PracticeSession) -> CaptureCompleteness {
        CaptureCompleteness(
            total: session.shots.count,
            withMotion: session.shots.filter { $0.motion != nil }.count,
            withHeartRate: session.shots.filter { $0.heartRate != nil }.count,
            withAudio: session.shots.filter { swingAudioURL(for: $0.id) != nil }.count
        )
    }

    @discardableResult
    func mergeEnhancedShotIntoRounds(_ event: EnhancedShotEvent) -> UUID? {
        if var round = currentRound,
           let idx = round.shots.firstIndex(where: { $0.id == event.id }) {
            round.shots[idx] = Self.mergeRoundShot(round.shots[idx], with: event)
            currentRound = round
            autoCalibrateClub(from: round.shots[idx])
            return round.id
        }
        for i in savedRounds.indices {
            guard let j = savedRounds[i].shots.firstIndex(where: { $0.id == event.id }) else { continue }
            savedRounds[i].shots[j] = Self.mergeRoundShot(savedRounds[i].shots[j], with: event)
            saveSavedRounds()
            autoCalibrateClub(from: savedRounds[i].shots[j])
            return savedRounds[i].id
        }
        return nil
    }

    private static func mergePracticeShot(_ shot: PracticeShot, with event: EnhancedShotEvent) -> PracticeShot {
        var out = shot
        if let m = event.motionData { out.motion = m }
        if let hr = event.heartRateData { out.heartRate = hr }
        if let c = event.confidence { out.confidence = c }
        return out
    }

    private static func mergeRoundShot(_ shot: Shot, with event: EnhancedShotEvent) -> Shot {
        var out = shot
        if let m = event.motionData { out.motion = m }
        if let hr = event.heartRateData { out.heartRate = hr }
        if let c = event.confidence { out.confidence = c }
        return out
    }

    /// Recompute per-club `PersonalWindow` stats from the last 200 swings
    /// in practice + live range + current round, then persist on `player`.
    func refreshPersonalWindows() {
        let (pBy, rBy) = PersonalWindowEngine.collectShots(
            practiceSessions: practiceSessions,
            liveRangeSession: liveRangeSession,
            currentRound: currentRound
        )
        let merged = PersonalWindowEngine.recomputeAll(
            shotsByClub: pBy,
            roundShotsByClub: rBy,
            pinnedSwingIds: pinnedReferences,
            armLengthMeters: player.armLengthMeters,
            restingBpm: 60,
            ageYears: player.ageYears
        )
        var next = player.personalWindows
        for (k, v) in merged { next[k] = v }
        player.personalWindows = next
    }

    /// Look up an enhanced shot by id (Phase 2 swing card uses this to
    /// render rich data for a tapped range/round shot).
    ///
    /// Falls back to motion/HR stored on persisted `PracticeShot` / `Shot`
    /// rows so swings older than the 50-entry `recentEnhancedShots` buffer
    /// still open the Swing Card. Includes swings that only have an impact
    /// audio clip on disk (mic capture without motion merge yet).
    func enhancedShot(byId id: UUID) -> EnhancedShotEvent? {
        if let cached = recentEnhancedShots.first(where: { $0.id == id }) {
            return cached
        }

        func fromPracticeShot(_ shot: PracticeShot) -> EnhancedShotEvent? {
            let hasMotionOrHR = shot.motion != nil || shot.heartRate != nil
            let hasAudio = swingAudioURL(for: shot.id) != nil
            guard hasMotionOrHR || hasAudio else { return nil }
            return EnhancedShotEvent(
                id: shot.id,
                timestamp: shot.timestamp,
                clubRawValue: shot.club.rawValue,
                confidence: shot.confidence,
                isManual: false,
                motionData: shot.motion,
                heartRateData: shot.heartRate,
                outcomeRawValue: shot.quality.rawValue,
                missDirectionRawValue: shot.missType?.rawValue
            )
        }

        func fromRoundShot(_ shot: Shot) -> EnhancedShotEvent? {
            let hasMotionOrHR = shot.motion != nil || shot.heartRate != nil
            let hasAudio = swingAudioURL(for: shot.id) != nil
            guard hasMotionOrHR || hasAudio else { return nil }
            return EnhancedShotEvent(
                id: shot.id,
                timestamp: shot.timestamp,
                clubRawValue: shot.club.rawValue,
                confidence: shot.confidence,
                isManual: shot.isManual,
                motionData: shot.motion,
                heartRateData: shot.heartRate,
                outcomeRawValue: nil,
                missDirectionRawValue: nil
            )
        }

        if let live = liveRangeSession,
           let shot = live.shots.first(where: { $0.id == id }),
           let built = fromPracticeShot(shot) {
            return built
        }
        for session in practiceSessions {
            if let shot = session.shots.first(where: { $0.id == id }),
               let built = fromPracticeShot(shot) {
                return built
            }
        }
        if let round = currentRound,
           let shot = round.shots.first(where: { $0.id == id }),
           let built = fromRoundShot(shot) {
            return built
        }
        for round in savedRounds {
            if let shot = round.shots.first(where: { $0.id == id }),
               let built = fromRoundShot(shot) {
                return built
            }
        }
        return nil
    }

    /// Per-club pinned-reference swing id. The Trend Strip draws a
    /// horizontal line at this swing's grade so the player can see
    /// drift relative to a single anchor swing they marked as good.
    @Published private(set) var pinnedReferences: [String: UUID] = [:] {
        didSet { savePinnedReferences() }
    }

    func pinReference(club: Club, swingId: UUID) {
        pinnedReferences[club.rawValue] = swingId
    }

    func clearReference(for club: Club) {
        pinnedReferences.removeValue(forKey: club.rawValue)
    }

    func referenceSwing(for club: Club) -> EnhancedShotEvent? {
        guard let id = pinnedReferences[club.rawValue] else { return nil }
        return enhancedShot(byId: id)
    }

    /// Per-swing audio clip URLs (CAF, mono float32) shipped from the
    /// watch via `WCSession.transferFile`. Keyed by swing id; lives
    /// in `Documents/swing-audio/`.
    @Published private(set) var swingAudioClips: [UUID: URL] = [:]

    /// Persistent on-disk location for swing audio clips.
    var swingAudioDirectory: URL {
        let dir = documentsDirectory.appendingPathComponent("swing-audio", isDirectory: true)
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    /// Move a freshly-received CAF from `tempURL` to the permanent
    /// store and register it under `swingId`.
    func storeSwingAudio(swingId: UUID, tempURL: URL) {
        let destination = swingAudioDirectory
            .appendingPathComponent("swing-\(swingId.uuidString).caf")
        do {
            if fileManager.fileExists(atPath: destination.path) {
                try fileManager.removeItem(at: destination)
            }
            try fileManager.copyItem(at: tempURL, to: destination)
            swingAudioClips[swingId] = destination
        } catch {
            print("Failed to store swing audio: \(error)")
        }
    }

    func swingAudioURL(for swingId: UUID) -> URL? {
        if let cached = swingAudioClips[swingId] { return cached }
        let candidate = swingAudioDirectory
            .appendingPathComponent("swing-\(swingId.uuidString).caf")
        if fileManager.fileExists(atPath: candidate.path) {
            swingAudioClips[swingId] = candidate
            return candidate
        }
        return nil
    }

    /// Persist `pinnedReferences` as JSON on disk so the player's
    /// marked-good swings survive restarts. Stored alongside other
    /// docs at `Documents/pinnedReferences.json`.
    private func savePinnedReferences() {
        let url = documentsDirectory.appendingPathComponent("pinnedReferences.json")
        let payload = pinnedReferences.mapValues { $0.uuidString }
        if let data = try? JSONEncoder().encode(payload) {
            try? data.write(to: url)
        }
    }

    private func loadPinnedReferences() {
        let url = documentsDirectory.appendingPathComponent("pinnedReferences.json")
        guard let data = try? Data(contentsOf: url),
              let raw = try? JSONDecoder().decode([String: String].self, from: data)
        else { return }
        var out: [String: UUID] = [:]
        for (k, v) in raw {
            if let uuid = UUID(uuidString: v) { out[k] = uuid }
        }
        pinnedReferences = out
    }
    
    // MARK: - File URLs
    
    private let fileManager = FileManager.default
    
    private var documentsDirectory: URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    private var playerURL: URL {
        documentsDirectory.appendingPathComponent("player.json")
    }
    
    private var currentRoundURL: URL {
        documentsDirectory.appendingPathComponent("currentRound.json")
    }
    
    private var savedRoundsURL: URL {
        documentsDirectory.appendingPathComponent("savedRounds.json")
    }
    
    private var coursesURL: URL {
        documentsDirectory.appendingPathComponent("courses.json")
    }
    
    private var practiceSessionsURL: URL {
        documentsDirectory.appendingPathComponent("practiceSessions.json")
    }

    private var liveRangeSessionURL: URL {
        documentsDirectory.appendingPathComponent("liveRangeSession.json")
    }
    
    private var courseCacheURL: URL {
        documentsDirectory.appendingPathComponent("courseCache.json")
    }
    
    // MARK: - Initialization
    
    init() {
        self.player = Player.defaultPlayer
        self.currentRound = nil

        loadPlayer()
        loadCurrentRound()
        loadSavedRounds()
        loadCourses()
        loadPracticeSessions()
        loadPinnedReferences()
        recoverLiveRangeSessionIfAny()

        seedDemoIfNeeded()
        refreshPersonalWindows()
    }

    // MARK: - Live range session persistence + recovery

    /// Restore any live range session left on disk from a previous
    /// app run. Three outcomes:
    ///   • The session has an `endTime` set → the watch DID send
    ///     rangeEnded but the app died before saving. Auto-promote
    ///     into `practiceSessions` and clear the live store.
    ///   • The session has shots but no endTime AND its last shot
    ///     is older than 2 hours → the watch never sent rangeEnded
    ///     (kill, crash, or out-of-range). Promote anyway with
    ///     endTime = last shot — never lose the data.
    ///   • Otherwise → assume the session is still live and resume.
    private func recoverLiveRangeSessionIfAny() {
        guard let data = try? Data(contentsOf: liveRangeSessionURL),
              let session = try? JSONDecoder().decode(PracticeSession.self, from: data)
        else { return }

        if session.endTime != nil {
            addPracticeSession(session)
            liveRangeSession = nil
            return
        }
        let lastEvent = session.shots.map(\.timestamp).max() ?? session.startTime
        let stale = Date().timeIntervalSince(lastEvent) > 2 * 60 * 60
        if stale && !session.shots.isEmpty {
            var ended = session
            ended.endTime = lastEvent
            addPracticeSession(ended)
            liveRangeSession = nil
            return
        }
        // Session is recent — bring it back as live.
        liveRangeSession = session
    }

    private func persistLiveRangeSession() {
        let url = liveRangeSessionURL
        if let session = liveRangeSession {
            do {
                let data = try JSONEncoder().encode(session)
                try data.write(to: url, options: [.atomic])
            } catch {
                print("Failed to persist live range session: \(error)")
            }
        } else {
            try? fileManager.removeItem(at: url)
        }
    }

    /// Manual SAVE NOW from the iOS live range card. Stamps the live
    /// session's `endTime` and promotes it. Idempotent vs the watch's
    /// later rangeEnded message because `addPracticeSession` is now
    /// dedup-by-id.
    func endLiveRangeSessionManually() {
        guard var session = liveRangeSession, !session.shots.isEmpty else {
            liveRangeSession = nil
            return
        }
        session.endTime = Date()
        addPracticeSession(session)
        liveRangeSession = nil
    }

    private static let demoSeededKey = "strikelab.demoSeeded.v1"

    /// On the very first launch (or after `clearAllData()`), drop a believable
    /// saved round + practice sessions in so every screen has data. The flag
    /// lives in `UserDefaults` so a real user's data is never touched twice.
    private func seedDemoIfNeeded() {
        let defaults = UserDefaults.standard
        guard !defaults.bool(forKey: PersistenceManager.demoSeededKey) else { return }
        guard savedRounds.isEmpty, practiceSessions.isEmpty else {
            // User already has data — never overwrite.
            defaults.set(true, forKey: PersistenceManager.demoSeededKey)
            return
        }
        DemoData.seed(into: self)
        defaults.set(true, forKey: PersistenceManager.demoSeededKey)
    }

    /// Reset the persisted state to its seeded demo content. Useful for the
    /// "reset demo" button in settings + UI tests.
    func resetToDemo() {
        try? fileManager.removeItem(at: currentRoundURL)
        savedRounds = []
        practiceSessions = []
        currentRound = nil
        UserDefaults.standard.removeObject(forKey: PersistenceManager.demoSeededKey)
        seedDemoIfNeeded()
    }
    
    // MARK: - Player Persistence
    
    private func loadPlayer() {
        guard let data = try? Data(contentsOf: playerURL),
              let loaded = try? JSONDecoder().decode(Player.self, from: data) else {
            // Use default player if no saved data
            return
        }
        self.player = loaded
    }
    
    private func savePlayer() {
        do {
            let data = try JSONEncoder().encode(player)
            try data.write(to: playerURL)
        } catch {
            print("Failed to save player: \(error)")
        }
    }
    
    // MARK: - Current Round Persistence
    
    private func loadCurrentRound() {
        guard let data = try? Data(contentsOf: currentRoundURL),
              let loaded = try? JSONDecoder().decode(Round.self, from: data) else {
            return
        }
        self.currentRound = loaded
    }
    
    func saveCurrentRound() {
        do {
            if let round = currentRound {
                let data = try JSONEncoder().encode(round)
                try data.write(to: currentRoundURL)
            } else {
                // Remove file if no current round
                try? fileManager.removeItem(at: currentRoundURL)
            }
        } catch {
            print("Failed to save current round: \(error)")
        }
    }
    
    // MARK: - Saved Rounds Persistence
    
    private func loadSavedRounds() {
        guard let data = try? Data(contentsOf: savedRoundsURL),
              let loaded = try? JSONDecoder().decode([Round].self, from: data) else {
            return
        }
        self.savedRounds = loaded
    }
    
    private func saveSavedRounds() {
        do {
            let data = try JSONEncoder().encode(savedRounds)
            try data.write(to: savedRoundsURL)
        } catch {
            print("Failed to save rounds: \(error)")
        }
    }

    /// Public proxy so demo seeding can persist seeded rounds.
    func saveSavedRoundsPublic() {
        saveSavedRounds()
    }
    
    // MARK: - Course Persistence
    
    private func loadCourses() {
        guard let data = try? Data(contentsOf: coursesURL),
              let loaded = try? JSONDecoder().decode([Course].self, from: data) else {
            // Use default courses
            self.courses = CourseData.allCourses
            return
        }
        
        // Merge saved courses with defaults (in case new courses added)
        var mergedCourses = loaded
        for defaultCourse in CourseData.allCourses {
            if !mergedCourses.contains(where: { $0.name == defaultCourse.name }) {
                mergedCourses.append(defaultCourse)
            }
        }
        self.courses = mergedCourses
    }
    
    private func saveCourses() {
        do {
            let data = try JSONEncoder().encode(courses)
            try data.write(to: coursesURL)
        } catch {
            print("Failed to save courses: \(error)")
        }
    }
    
    // MARK: - Practice Sessions Persistence
    
    private func loadPracticeSessions() {
        guard let data = try? Data(contentsOf: practiceSessionsURL),
              let loaded = try? JSONDecoder().decode([PracticeSession].self, from: data) else {
            return
        }
        // Sort by date, most recent first
        self.practiceSessions = loaded.sorted { $0.startTime > $1.startTime }
    }
    
    private func savePracticeSessions() {
        do {
            let data = try JSONEncoder().encode(practiceSessions)
            try data.write(to: practiceSessionsURL)
        } catch {
            print("Failed to save practice sessions: \(error)")
        }
    }
    
    /// Add a completed practice session. Idempotent — when a session
    /// with the same id already exists we REPLACE it (the new copy is
    /// usually more complete: more shots, freshly stamped endTime).
    /// This makes the data path safe against duplicate end-of-session
    /// deliveries (sendMessage + transferUserInfo both reaching us)
    /// AND against manual SAVE NOW followed by a delayed rangeEnded.
    func addPracticeSession(_ session: PracticeSession) {
        if let idx = practiceSessions.firstIndex(where: { $0.id == session.id }) {
            let existing = practiceSessions[idx]
            let merged = Self.mergePracticeSessions(existing: existing, incoming: session)
            practiceSessions[idx] = merged
        } else {
            practiceSessions.insert(session, at: 0)
        }
        if let saved = practiceSessions.first(where: { $0.id == session.id }) {
            NotificationCenter.default.post(name: .strikeLabPracticeSessionSaved, object: saved)
        }
        refreshPersonalWindows()
    }

    /// When `enhancedShot` arrives after `rangeEnded`, motion is merged here (live session is nil).
    /// Returns the practice session id if a row was updated.
    @discardableResult
    func mergeEnhancedShotIntoStoredPracticeSessions(_ event: EnhancedShotEvent) -> UUID? {
        for i in practiceSessions.indices {
            guard let j = practiceSessions[i].shots.firstIndex(where: { $0.id == event.id }) else { continue }
            practiceSessions[i].shots[j] = Self.mergePracticeShot(practiceSessions[i].shots[j], with: event)
            return practiceSessions[i].id
        }
        return nil
    }

    func practiceSession(byId sessionId: UUID) -> PracticeSession? {
        practiceSessions.first { $0.id == sessionId }
    }

    /// Deep-merge two `PracticeShot` rows with the same id (watch club/time vs phone motion).
    private static func mergePracticeShots(existing: PracticeShot, incoming: PracticeShot) -> PracticeShot {
        PracticeShot(
            id: existing.id,
            timestamp: max(existing.timestamp, incoming.timestamp),
            club: incoming.club,
            estimatedDistance: incoming.estimatedDistance ?? existing.estimatedDistance,
            quality: incoming.quality,
            missType: incoming.missType ?? existing.missType,
            notes: incoming.notes ?? existing.notes,
            motion: incoming.motion ?? existing.motion,
            heartRate: incoming.heartRate ?? existing.heartRate,
            confidence: incoming.confidence ?? existing.confidence
        )
    }

    /// Union shots by UUID so a late `rangeEnded` without motion cannot overwrite captured IMU.
    private static func mergePracticeSessions(existing: PracticeSession, incoming: PracticeSession) -> PracticeSession {
        var byId: [UUID: PracticeShot] = [:]
        for s in existing.shots { byId[s.id] = s }
        for s in incoming.shots {
            if let prev = byId[s.id] {
                byId[s.id] = mergePracticeShots(existing: prev, incoming: s)
            } else {
                byId[s.id] = s
            }
        }
        let ordered = byId.values.sorted { $0.timestamp < $1.timestamp }
        var merged = PracticeSession(
            id: existing.id,
            startTime: min(existing.startTime, incoming.startTime),
            endTime: incoming.endTime ?? existing.endTime,
            shots: ordered,
            focusClub: incoming.focusClub ?? existing.focusClub,
            notes: incoming.notes ?? existing.notes,
            location: incoming.location ?? existing.location
        )
        merged.topgolf = incoming.topgolf ?? existing.topgolf
        return merged
    }
    
    /// Delete a practice session
    func deletePracticeSession(_ session: PracticeSession) {
        practiceSessions.removeAll { $0.id == session.id }
    }
    
    // MARK: - Course Cache (Offline Support)
    
    /// Cached course details keyed by API course ID
    private var courseCache: [Int: APICourseDetails] = [:]
    
    /// Load course cache from disk
    private func loadCourseCache() {
        guard let data = try? Data(contentsOf: courseCacheURL),
              let loaded = try? JSONDecoder().decode([Int: APICourseDetails].self, from: data) else {
            return
        }
        self.courseCache = loaded
    }
    
    /// Save course cache to disk
    private func saveCourseCache() {
        do {
            let data = try JSONEncoder().encode(courseCache)
            try data.write(to: courseCacheURL)
        } catch {
            print("Failed to save course cache: \(error)")
        }
    }
    
    /// Cache course details for offline access
    func cacheCourseDetails(_ details: APICourseDetails) {
        courseCache[details.id] = details
        saveCourseCache()
    }
    
    /// Get cached course details by API ID
    func getCachedCourseDetails(id: Int) -> APICourseDetails? {
        // Load cache if not already loaded
        if courseCache.isEmpty {
            loadCourseCache()
        }
        return courseCache[id]
    }
    
    /// Check if course is cached
    func isCourseDetailsCached(id: Int) -> Bool {
        if courseCache.isEmpty {
            loadCourseCache()
        }
        return courseCache[id] != nil
    }
    
    /// Remove course from cache
    func removeCourseFromCache(id: Int) {
        courseCache.removeValue(forKey: id)
        saveCourseCache()
    }
    
    /// Clear all cached course data
    func clearCourseCache() {
        courseCache.removeAll()
        saveCourseCache()
    }
    
    /// Get count of cached courses
    var cachedCourseCount: Int {
        if courseCache.isEmpty {
            loadCourseCache()
        }
        return courseCache.count
    }
    
    // MARK: - Round Management
    
    /// Start a new round
    func startNewRound(course: Course, tee: Tee?, playFormat: PlayFormat = .full18) {
        var round = Round(
            course: course,
            selectedTee: tee,
            player: player
        )
        round.playFormat = playFormat
        // Start at the first hole of the chosen format (Front 9 → 1, Back 9 → 10).
        round.currentHoleNumber = playFormat.holeRange.lowerBound
        currentRound = round
    }
    
    /// Complete and save the current round. Returns the exact saved
    /// snapshot so callers can show/export the same object that hit disk.
    @discardableResult
    func completeCurrentRound() -> Round? {
        guard var round = currentRound else { return nil }
        round.isComplete = true
        round.completedAt = Date()
        savedRounds.insert(round, at: 0)
        saveSavedRounds()
        SyncQueue.shared.enqueueRound(round)
        if !round.shots.isEmpty {
            SyncQueue.shared.enqueueRoundShots(roundId: round.id, shots: round.shots)
        }
        RoundLiveSync.syncNow(round: round, persistence: self)
        Task {
            await SyncQueue.shared.flush()
        }
        currentRound = nil
        return round
    }
    
    /// Discard the current round without saving
    func discardCurrentRound() {
        currentRound = nil
    }
    
    /// Delete a saved round
    func deleteSavedRound(_ round: Round) {
        savedRounds.removeAll { $0.id == round.id }
        saveSavedRounds()
    }
    
    // MARK: - Course Management
    
    /// Add a new course
    func addCourse(_ course: Course) {
        courses.append(course)
    }
    
    /// Update a course (e.g., after editing tee data)
    func updateCourse(_ course: Course) {
        if let index = courses.firstIndex(where: { $0.id == course.id }) {
            courses[index] = course
        }
        
        // Also update current round if using this course
        if currentRound?.course.id == course.id {
            currentRound?.course = course
            // Recalculate stroke allocation with updated data
            currentRound?.recalculateStrokeAllocation()
        }
    }
    
    /// Get course by ID
    func course(byID id: UUID) -> Course? {
        courses.first { $0.id == id }
    }
    
    // MARK: - Shot Management
    
    /// Add a shot to the current round
    func addShot(_ shot: Shot) {
        currentRound?.addShot(shot)
        learnFromShot(shot)
    }

    /// Refine the player's per-club distance averages from real played
    /// shots so the Smart Caddie's recommendations improve with use. Only
    /// counts shots with a measured distance, and skips short putts and
    /// suspicious near-zero values.
    private func learnFromShot(_ shot: Shot) {
        guard let yards = shot.distanceYards, yards >= 30 else { return }
        // Don't learn from putts — they aren't full-swing distances.
        if shot.club == .putter { return }
        player.updateClubStats(clubName: shot.club.rawValue, distance: yards)
        autoCalibrateClub(from: shot)
    }

    /// Phase 4 — opportunistic per-club calibration during on-course play.
    /// When a shot lands in `currentRound` AND it has both a captured
    /// `motion` block AND a GPS-measured straight-line distance ≥40 yds,
    /// pair `(handMph, distanceYards)` into the rolling sample buffer
    /// for the club and refit the regression model. The model is then
    /// pushed to the watch via WCSession so the post-swing HUD can show
    /// estimated carry on the next shot.
    func autoCalibrateClub(from shot: Shot) {
        guard let yards = shot.distanceYards, yards >= 40 else { return }
        guard let motion = shot.motion else { return }
        guard shot.club != .putter else { return }

        let speeds = SwingAnalytics.speeds(
            motion,
            club: shot.club,
            armLengthMeters: player.armLengthMeters
        )
        let key = shot.club.rawValue
        var buf = autoCalibrationSamples[key] ?? []
        buf.append(ClubCalibration.Sample(
            handMph: speeds.handSpeedMph,
            carryYards: yards
        ))
        if buf.count > 20 { buf = Array(buf.suffix(20)) }
        autoCalibrationSamples[key] = buf

        if let model = ClubCalibration.fit(buf) {
            player.clubModels[key] = model
        }
    }

    /// In-memory rolling buffer of GPS-validated calibration samples,
    /// keyed by club rawValue. Persists for the lifetime of the
    /// PersistenceManager instance only — the fitted `ClubModel` is the
    /// durable artifact (lives on `Player`).
    private var autoCalibrationSamples: [String: [ClubCalibration.Sample]] = [:]
    
    /// Add a shot from a ShotEvent (from watch)
    func addShotFromEvent(_ event: ShotEvent) {
        var shot = event.toShot()
        shot.holeNumber = currentRound?.currentHoleNumber
        currentRound?.addShot(shot)
    }
    
    /// Undo the last shot
    func undoLastShot() -> Shot? {
        currentRound?.undoLastShot()
    }
    
    /// Delete a specific shot by ID
    func deleteShot(_ shot: Shot) {
        currentRound?.shots.removeAll { $0.id == shot.id }
    }
    
    /// Delete a shot by ID
    func deleteShot(withID id: UUID) {
        currentRound?.shots.removeAll { $0.id == id }
    }
}

// MARK: - Debug Helpers

extension PersistenceManager {
    /// Clear all saved data (for testing)
    func clearAllData() {
        try? fileManager.removeItem(at: playerURL)
        try? fileManager.removeItem(at: currentRoundURL)
        try? fileManager.removeItem(at: savedRoundsURL)
        try? fileManager.removeItem(at: coursesURL)
        
        player = Player.defaultPlayer
        currentRound = nil
        savedRounds = []
        courses = CourseData.allCourses
    }
}
