//
//  WatchConnectivityManagerWatch.swift
//  StrikeLabCaddieWatch Watch App
//
//  Watch Connectivity manager for watchOS
//

import Foundation
import WatchConnectivity
import Combine
import Compression

private struct WatchHolePinPayload: Codable {
    let holeNumber: Int
    let latitude: Double
    let longitude: Double
}

@MainActor
class WatchConnectivityManagerWatch: NSObject, ObservableObject {

    // MARK: - Published Properties

    @Published var isPhoneReachable = false
    @Published var currentHoleNumber: Int = 1
    @Published var isRoundActive = false
    @Published var courseName: String?
    @Published var connectionError: String?
    @Published var roundStartedAt: Date?
    @Published var roundElapsedSeconds: TimeInterval?
    @Published var roundElapsedSyncedAt: Date?

    /// Next upcoming StrikeLab Tee booking — pushed from the iPhone via
    /// WCSession application context whenever the user books a round.
    /// The watch shows a countdown card on the start screen.
    @Published var nextTeeBooking: WatchTeeBooking?

    /// User's preferred distance unit. Mirrors the iOS UnitsManager;
    /// pushed from the phone via WCSession application context.
    @Published var unitsSystem: WatchUnitsSystem = .yards {
        didSet {
            UserDefaults.standard.set(unitsSystem.rawValue, forKey: Self.unitsKey)
        }
    }

    /// Per-club calibration models pushed from the iPhone (Phase 4).
    /// The PostSwingHUD reads these to show estimated carry on the wrist.
    @Published var clubModels: [String: WatchClubModel] = [:]

    /// Personal swing windows keyed by club raw value (from iPhone).
    @Published var personalWindows: [String: WatchPersonalWindow] = [:]

    /// Pin coordinates per hole (green center) for local yardage fallback.
    @Published var holePins: [Int: (latitude: Double, longitude: Double)] = [:]

    /// Last Smart Caddie snapshot from the phone.
    @Published var caddieHole: Int = 1
    @Published var caddieDistanceYards: Int = 0
    @Published var caddieClubRaw: String = ""
    @Published var caddieCommit: String = ""
    @Published var caddieWarning: String = ""
    @Published var caddieUpdatedAt: Date?

    /// Optional GPS distances + weather pushed by the phone alongside
    /// the core caddie advice. `nil` when the phone hasn't computed
    /// them yet — UI should render "—" or a sensible fallback.
    @Published var caddieFrontYards: Int? = nil
    @Published var caddieBackYards: Int? = nil
    @Published var caddiePlaysLikeYards: Int? = nil
    @Published var caddieHazardNote: String = ""
    @Published var caddieSource: String = ""
    @Published var caddieConfidence: Double? = nil
    @Published var caddieWindMph: Double? = nil
    @Published var caddieWindDirectionDeg: Double? = nil

    /// API config mirrored from the phone via application context. Not
    /// used directly by the watch today — kept so a future direct-API
    /// path (or a diagnostic UI) can hit the same backend the phone is on.
    @Published var apiBaseURL: String = ""
    @Published private(set) var apiAccessToken: String? = nil

    /// Per-hole authoritative state mirrored from the phone. Indexed by
    /// hole number minus one. Resets every time a new round starts.
    @Published var holes: [WatchHoleState] = WatchHoleState.defaultEighteen()

    /// Guest scorecards mirrored from the phone. These are gross/net score
    /// rows only; no watch shots, HR or motion attach to guests.
    @Published var groupPlayers: [WatchGroupPlayer] = []

    /// Play format (Full 18 / Front 9 / Back 9) — pushed from the phone.
    @Published var playFormat: WatchPlayFormat = .full18

    /// Active range session (when the player is at a driving range and
    /// is using auto-detect to count swings per club). The session lives
    /// here as long as the user hasn't ended it; the watch start screen
    /// shows a RESUME banner whenever this is non-nil but the live view
    /// has been popped off the navigation stack.
    ///
    /// CRITICAL: every assignment writes to UserDefaults so a watch app
    /// crash, kill, or out-of-range walk does NOT lose the swing log.
    /// Restored on init. The companion `pendingDelivery` store handles
    /// post-end retries until the iPhone ACKs receipt.
    @Published var rangeSession: WatchRangeSession? {
        didSet { persistRangeSession() }
    }

    /// Range sessions that the user has already ENDED on the watch but
    /// for which we haven't yet received an ACK from the iPhone. We
    /// retry sending these on every reachability change so a session
    /// is never lost just because the phone was offline at end-time.
    private var pendingEndedSessions: [WatchRangeSession] = [] {
        didSet { persistPendingEndedSessions() }
    }

    /// Holes that fall inside the chosen play format.
    var playedHoles: [WatchHoleState] {
        let range = playFormat.range
        return holes.filter { range.contains($0.holeNumber) }
    }

    /// Recent shots logged this session (for local display)
    @Published var recentShots: [ShotEventWatch] = []

    /// Tiny course directory pushed from the phone (name + GPS) so the
    /// watch can offer one-tap round start when the player is on-site.
    @Published var coursesDirectory: [WatchCourseEntry] = []

    // MARK: - Private Properties

    private var session: WCSession?
    private var pendingRoundCapturesById: [UUID: SwingCapture] = [:]
    private static let unitsKey = "strikelab.units.system.v1"
    private static let activeRangeKey = "strikelab.range.activeSession.v1"
    private static let pendingEndedKey = "strikelab.range.pendingEnded.v1"
    private static let pendingShotsKey = "strikelab.shots.pending.v1"
    private static let pendingEnhancedShotsKey = "strikelab.enhancedShots.pending.v1"

    /// Shot events that couldn't be queued via WatchConnectivity at the
    /// time they were produced (typically because `session` wasn't
    /// activated yet on cold start). Persisted across launches so a
    /// crash mid-round doesn't lose individual swings.
    private var pendingShotEvents: [Data] = [] {
        didSet { persistPendingShots() }
    }

    /// Full IMU/HR payloads waiting for an explicit iPhone ACK. These are
    /// larger than plain shot rows and are the data we cannot afford to drop
    /// during a range session.
    private var pendingEnhancedShots: [PendingEnhancedShotPayload] = [] {
        didSet { persistPendingEnhancedShots() }
    }

    /// The unique id of the round we last saw from the phone. Used to wipe
    /// local state whenever the phone reports a brand-new round.
    private var lastRoundId: String?

    // MARK: - Hole-state helpers

    /// Snapshot of the hole the player is currently on.
    var currentHole: WatchHoleState {
        let idx = max(0, min(holes.count - 1, currentHoleNumber - 1))
        return holes[idx]
    }

    /// Total gross strokes recorded so far across the chosen play format.
    var grossTotal: Int {
        playedHoles.compactMap { $0.grossStrokes }.reduce(0, +)
    }

    /// Course par across the played holes scored so far.
    var parToCurrent: Int {
        playedHoles.filter { ($0.grossStrokes ?? 0) > 0 }.reduce(0) { $0 + $1.par }
    }

    /// "+3" / "E" / "-2"
    var formattedToPar: String {
        let diff = grossTotal - parToCurrent
        if diff == 0 { return "E" }
        return diff > 0 ? "+\(diff)" : "\(diff)"
    }

    /// Update a hole's stroke count locally and push to the phone.
    func setStrokes(holeNumber: Int, strokes: Int) {
        guard let idx = indexOf(holeNumber: holeNumber) else { return }
        holes[idx].grossStrokes = strokes
        sendScoreUpdate(holeNumber: holeNumber,
                        grossStrokes: strokes,
                        putts: holes[idx].putts)
    }

    /// Update a hole's putts and push.
    func setPutts(holeNumber: Int, putts: Int) {
        guard let idx = indexOf(holeNumber: holeNumber) else { return }
        holes[idx].putts = putts
        if let strokes = holes[idx].grossStrokes {
            sendScoreUpdate(holeNumber: holeNumber, grossStrokes: strokes, putts: putts)
        }
    }

    /// Increment by 1 — used by motion auto-detect. Initialises at par if
    /// the hole hasn't been touched yet. When `alsoIncrementPutt` is true,
    /// putts rise with gross (auto-detected strokes on / near the green).
    func incrementStrokes(holeNumber: Int, alsoIncrementPutt: Bool = false) {
        guard let idx = indexOf(holeNumber: holeNumber) else { return }
        let h = holes[idx]
        let next = (h.grossStrokes ?? h.par) + 1
        holes[idx].grossStrokes = next
        if alsoIncrementPutt {
            holes[idx].putts = min(8, (h.putts ?? 0) + 1)
        }
        sendScoreUpdate(
            holeNumber: holeNumber,
            grossStrokes: next,
            putts: holes[idx].putts
        )
    }

    private func indexOf(holeNumber: Int) -> Int? {
        guard holeNumber >= 1, holeNumber <= holes.count else { return nil }
        return holeNumber - 1
    }

    // MARK: - Range session

    /// Start a brand-new range session locally and notify the phone.
    func startRangeSession(initialClub: ClubWatch) {
        rangeSession = WatchRangeSession(
            id: UUID(),
            startedAt: Date(),
            activeClub: initialClub,
            swings: []
        )
        sendRangeSessionState()
    }

    /// Switch the active club for the range session.
    func setRangeClub(_ club: ClubWatch) {
        guard rangeSession != nil else { return }
        rangeSession?.activeClub = club
        sendRangeSessionState()
    }

    /// Record one swing for the active club. Called both by motion
    /// auto-detect and by the manual "+1" button. The per-swing log
    /// (with id + timestamp) is the source of truth; counts are derived.
    ///
    /// When the auto-detector supplies a `capture` AND the optional
    /// `hrSnapshot`, we ALSO build a rich `EnhancedShotEventWatch`
    /// payload and ship it to the phone in addition to the lightweight
    /// session-state push. The lightweight push keeps the phone's live
    /// range card responsive; the enhanced payload is what the Swing
    /// Card on the phone reads.
    func logRangeSwing(
        isAuto: Bool,
        confidence: Double? = nil,
        capture: SwingCapture? = nil,
        hrSnapshot: HRSnapshotWatch? = nil
    ) {
        guard var session = rangeSession else { return }
        let timestamp = capture?.detectedAt ?? Date()
        let entry = WatchSwingLogEntry(
            id: capture?.id ?? UUID(),
            timestamp: timestamp,
            club: session.activeClub.rawValue,
            isAuto: isAuto,
            confidence: confidence
        )
        session.swings.append(entry)
        rangeSession = session
        sendRangeSessionState()

        // Ship the rich payload when motion capture is enabled and we
        // have both a SwingCapture and (optionally) HR data.
        guard WatchSettings.shared.fullMotionCapture else { return }
        guard let capture else { return }
        let hrData: HeartRateDataWatch? = {
            guard let snapshot = hrSnapshot else { return nil }
            return Self.buildHeartRateData(from: snapshot, impactAt: timestamp)
        }()
        let enhanced = EnhancedShotEventWatch(
            id: entry.id,
            timestamp: timestamp,
            club: session.activeClub,
            confidence: confidence,
            isManual: !isAuto,
            motionData: capture.motion,
            heartRateData: hrData,
            outcome: nil,
            missDirection: nil
        )
        sendEnhancedShot(enhanced)
    }

    func cacheRoundSwingCapture(_ capture: SwingCapture) {
        pendingRoundCapturesById[capture.id] = capture
        if pendingRoundCapturesById.count > 20 {
            pendingRoundCapturesById.removeValue(forKey: pendingRoundCapturesById.keys.first!)
        }
    }

    func sendRoundEnhancedShot(
        shotId: UUID,
        club: ClubWatch,
        confidence: Double?,
        isManual: Bool,
        capture: SwingCapture?,
        hrSnapshot: HRSnapshotWatch?
    ) {
        let resolvedCapture = capture ?? pendingRoundCapturesById.removeValue(forKey: shotId)
        guard WatchSettings.shared.fullMotionCapture else { return }
        guard let resolvedCapture else { return }
        let hrData: HeartRateDataWatch? = {
            guard let snapshot = hrSnapshot else { return nil }
            return Self.buildHeartRateData(from: snapshot, impactAt: resolvedCapture.detectedAt)
        }()
        let enhanced = EnhancedShotEventWatch(
            id: shotId,
            timestamp: resolvedCapture.detectedAt,
            club: club,
            confidence: confidence,
            isManual: isManual,
            motionData: resolvedCapture.motion,
            heartRateData: hrData,
            outcome: nil,
            missDirection: nil
        )
        sendEnhancedShot(enhanced)
    }

    /// Build a `HeartRateDataWatch` from the 60s HR snapshot. Computes
    /// HR @ impact (closest sample), median pre/post (30s windows), and
    /// SDNN over the rrIntervals when available.
    static func buildHeartRateData(
        from snapshot: HRSnapshotWatch,
        impactAt: Date
    ) -> HeartRateDataWatch {
        // HR @ impact = sample closest to t = 0.
        var hrAtImpact = 0.0
        var bestDelta = Double.infinity
        for s in snapshot.samples {
            let d = abs(s.tMs)
            if d < bestDelta {
                bestDelta = d
                hrAtImpact = s.bpm
            }
        }
        let preBpm = snapshot.samples.filter { $0.tMs >= -30000 && $0.tMs < 0 }.map(\.bpm)
        let postBpm = snapshot.samples.filter { $0.tMs > 0 && $0.tMs <= 30000 }.map(\.bpm)
        let preMedian = median(preBpm)
        let postMedian = median(postBpm)

        // SDNN over the RR intervals if we have at least 8 of them.
        var hrv: Double?
        if snapshot.rrIntervals.count >= 8 {
            let mean = snapshot.rrIntervals.reduce(0, +) / Double(snapshot.rrIntervals.count)
            let variance = snapshot.rrIntervals
                .map { ($0 - mean) * ($0 - mean) }
                .reduce(0, +) / Double(snapshot.rrIntervals.count)
            hrv = variance.squareRoot()
        }

        return HeartRateDataWatch(
            heartRate: hrAtImpact,
            hrv: hrv,
            preMedian: preMedian,
            postMedian: postMedian,
            snapshot: snapshot
        )
    }

    private static func median(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        let sorted = values.sorted()
        let n = sorted.count
        if n.isMultiple(of: 2) {
            return (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0
        }
        return sorted[n / 2]
    }

    /// Ship an `EnhancedShotEventWatch` to the phone. JSON-encode and
    /// gzip-compress so the typical 13 kB payload becomes ~3-4 kB on
    /// the wire — well below `sendMessage`'s 65 kB limit. Falls back to
    /// `transferUserInfo` when the phone is unreachable.
    private func sendEnhancedShot(_ event: EnhancedShotEventWatch) {
        guard let json = try? JSONEncoder().encode(event) else {
            connectionError = "Failed to encode enhanced shot"
            return
        }
        let compressed = (try? gzip(json)) ?? json
        let queued = PendingEnhancedShotPayload(
            id: event.id,
            data: compressed,
            isCompressed: compressed.count != json.count
        )
        upsertPendingEnhancedShot(queued)
        deliverPendingEnhancedShot(queued)
    }

    private func enhancedShotMessage(_ payload: PendingEnhancedShotPayload) -> [String: Any] {
        [
            "enhancedShot": payload.data,
            "enhancedShotCompressed": payload.isCompressed,
            "enhancedShotId": payload.id.uuidString
        ]
    }

    private func deliverPendingEnhancedShot(_ payload: PendingEnhancedShotPayload) {
        guard let session, session.activationState == .activated else { return }
        let message = enhancedShotMessage(payload)
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { [weak self] _ in
                Task { @MainActor in
                    self?.session?.transferUserInfo(message)
                }
            }
        } else {
            session.transferUserInfo(message)
        }
    }

    private func flushPendingEnhancedShots() {
        for payload in pendingEnhancedShots {
            deliverPendingEnhancedShot(payload)
        }
    }

    private func upsertPendingEnhancedShot(_ payload: PendingEnhancedShotPayload) {
        pendingEnhancedShots.removeAll { $0.id == payload.id }
        pendingEnhancedShots.append(payload)
    }

    private func acknowledgeEnhancedShot(id: UUID) {
        pendingEnhancedShots.removeAll { $0.id == id }
    }

    private func persistPendingEnhancedShots() {
        let defaults = UserDefaults.standard
        guard !pendingEnhancedShots.isEmpty else {
            defaults.removeObject(forKey: Self.pendingEnhancedShotsKey)
            return
        }
        if let data = try? JSONEncoder().encode(pendingEnhancedShots) {
            defaults.set(data, forKey: Self.pendingEnhancedShotsKey)
        }
    }

    private func restorePendingEnhancedShots() {
        let defaults = UserDefaults.standard
        guard let data = defaults.data(forKey: Self.pendingEnhancedShotsKey),
              let restored = try? JSONDecoder().decode([PendingEnhancedShotPayload].self, from: data)
        else { return }
        pendingEnhancedShots = restored
    }

    /// Ship a freshly-rendered swing-audio clip (CAF / PCM float32)
    /// to the phone. Uses `transferFile` rather than `transferUserInfo`
    /// because per-message size limits don't apply, and WC will retry
    /// the transfer in the background until the phone receives it.
    /// The phone matches the file to its swing via `swingId` in
    /// metadata.
    func sendSwingAudioClip(url: URL, swingId: UUID) {
        guard let session = session else { return }
        let metadata: [String: Any] = [
            "kind": "swingAudio",
            "swingId": swingId.uuidString
        ]
        session.transferFile(url, metadata: metadata)
    }

    /// Gzip-compress using Apple's Compression framework. Returns the
    /// compressed bytes on success, throws on failure.
    private func gzip(_ data: Data) throws -> Data {
        let dstSize = max(1024, data.count)
        let dst = UnsafeMutablePointer<UInt8>.allocate(capacity: dstSize)
        defer { dst.deallocate() }
        let n = data.withUnsafeBytes { (raw: UnsafeRawBufferPointer) -> Int in
            guard let baseAddr = raw.baseAddress else { return 0 }
            let src = baseAddr.assumingMemoryBound(to: UInt8.self)
            return compression_encode_buffer(
                dst, dstSize,
                src, data.count,
                nil, COMPRESSION_ZLIB
            )
        }
        guard n > 0 else { throw CocoaError(.fileWriteUnknown) }
        return Data(bytes: dst, count: n)
    }

    /// Undo the most recent swing (regardless of which club it was hit
    /// with). Mirrors what the user actually means by "undo last".
    func undoRangeSwing() {
        guard var session = rangeSession,
              !session.swings.isEmpty
        else { return }
        session.swings.removeLast()
        rangeSession = session
        sendRangeSessionState()
    }

    /// Remove a specific swing by id — used by the watch RECENT page
    /// and by the phone's live range card chips.
    func removeRangeSwing(id: UUID) {
        guard var session = rangeSession else { return }
        let before = session.swings.count
        session.swings.removeAll { $0.id == id }
        guard session.swings.count != before else { return }
        rangeSession = session
        sendRangeSessionState()
    }

    /// End the session and push the final state to the phone for save.
    /// The session is queued into `pendingEndedSessions` so we keep
    /// retrying delivery until the iPhone ACKs — never lose a session
    /// to a flaky link.
    func endRangeSession() {
        guard let session = rangeSession else { return }
        if !pendingEndedSessions.contains(where: { $0.id == session.id }) {
            pendingEndedSessions.append(session)
        }
        sendRangeSessionEnded(session)
        rangeSession = nil
    }

    /// Re-send every pending-ended session. Called on init and on
    /// every `sessionReachabilityDidChange` so a session left in the
    /// queue from a previous app launch will be retransmitted as soon
    /// as the iPhone is back in range.
    func flushPendingEndedSessions() {
        for s in pendingEndedSessions {
            sendRangeSessionEnded(s)
        }
    }

    /// Total swings across all clubs.
    var rangeTotalSwings: Int {
        rangeSession?.swings.count ?? 0
    }

    /// Count for the active club specifically.
    var rangeActiveClubCount: Int {
        guard let session = rangeSession else { return 0 }
        let key = session.activeClub.rawValue
        return session.swings.reduce(into: 0) { acc, s in
            if s.club == key { acc += 1 }
        }
    }

    private func sendRangeSessionState() {
        guard let session = session, let s = rangeSession else { return }
        var payload: [String: Any] = [
            "rangeState": true,
            "sessionId": s.id.uuidString,
            "activeClub": s.activeClub.rawValue,
            "counts": s.counts,
            "startedAt": s.startedAt.timeIntervalSince1970
        ]
        if let data = try? JSONEncoder().encode(s.swings) {
            payload["swings"] = data
        }
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { _ in }
        } else {
            session.transferUserInfo(payload)
        }
    }

    private func sendRangeSessionEnded(_ s: WatchRangeSession) {
        guard let session = session else { return }
        var payload: [String: Any] = [
            "rangeEnded": true,
            "sessionId": s.id.uuidString,
            "counts": s.counts,
            "startedAt": s.startedAt.timeIntervalSince1970,
            "endedAt": Date().timeIntervalSince1970
        ]
        if let data = try? JSONEncoder().encode(s.swings) {
            payload["swings"] = data
        }
        // Always queue via transferUserInfo — guaranteed eventual
        // delivery even if the phone is asleep, locked, or in
        // background. Additionally try sendMessage when reachable
        // for instant UI updates. The iPhone dedupes by sessionId
        // (the PracticeSession.id mirrors it). A failure on the
        // sendMessage path is silent because transferUserInfo
        // already covers us.
        session.transferUserInfo(payload)
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { _ in }
        }
    }

    // MARK: - Persistence (NEVER lose a session)

    private func persistRangeSession() {
        let defaults = UserDefaults.standard
        guard let s = rangeSession else {
            defaults.removeObject(forKey: Self.activeRangeKey)
            return
        }
        // We mirror the publishable shape; activeClub/raw values are
        // strings already. Re-decode handles missing fields gracefully.
        let snapshot = ActiveRangeSnapshot(
            id: s.id,
            startedAt: s.startedAt,
            activeClubRaw: s.activeClub.rawValue,
            swings: s.swings
        )
        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: Self.activeRangeKey)
        }
    }

    private func restoreRangeSession() {
        let defaults = UserDefaults.standard
        guard let data = defaults.data(forKey: Self.activeRangeKey),
              let snapshot = try? JSONDecoder().decode(ActiveRangeSnapshot.self, from: data),
              let club = ClubWatch(rawValue: snapshot.activeClubRaw)
        else { return }
        let session = WatchRangeSession(
            id: snapshot.id,
            startedAt: snapshot.startedAt,
            activeClub: club,
            swings: snapshot.swings
        )
        rangeSession = session
    }

    private func persistPendingEndedSessions() {
        let defaults = UserDefaults.standard
        guard !pendingEndedSessions.isEmpty else {
            defaults.removeObject(forKey: Self.pendingEndedKey)
            return
        }
        let snapshots = pendingEndedSessions.map {
            ActiveRangeSnapshot(
                id: $0.id,
                startedAt: $0.startedAt,
                activeClubRaw: $0.activeClub.rawValue,
                swings: $0.swings
            )
        }
        if let data = try? JSONEncoder().encode(snapshots) {
            defaults.set(data, forKey: Self.pendingEndedKey)
        }
    }

    private func restorePendingEndedSessions() {
        let defaults = UserDefaults.standard
        guard let data = defaults.data(forKey: Self.pendingEndedKey),
              let snapshots = try? JSONDecoder().decode([ActiveRangeSnapshot].self, from: data)
        else { return }
        pendingEndedSessions = snapshots.compactMap { snap in
            guard let club = ClubWatch(rawValue: snap.activeClubRaw) else { return nil }
            return WatchRangeSession(
                id: snap.id,
                startedAt: snap.startedAt,
                activeClub: club,
                swings: snap.swings
            )
        }
    }

    /// Codable mirror used purely for the on-disk snapshot. Keeps
    /// `WatchRangeSession` itself free of Codable plumbing.
    private struct ActiveRangeSnapshot: Codable {
        let id: UUID
        let startedAt: Date
        let activeClubRaw: String
        let swings: [WatchSwingLogEntry]
    }

    // MARK: - Initialization

    override init() {
        super.init()
        // Hydrate units preference from disk before activation so the first
        // frame on launch already shows the right unit.
        if let raw = UserDefaults.standard.string(forKey: Self.unitsKey),
           let stored = WatchUnitsSystem(rawValue: raw) {
            unitsSystem = stored
        } else {
            // Locale fallback: yards for US/GB/CA/AU, metres elsewhere.
            let yardLocales: Set<String> = ["US", "GB", "CA", "AU"]
            let region = Locale.current.region?.identifier ?? ""
            unitsSystem = yardLocales.contains(region) ? .yards : .meters
        }
        // Restore any range session left from a previous app launch
        // BEFORE activating the WC session so the published value is
        // visible on the first SwiftUI frame.
        restorePendingEndedSessions()
        restorePendingShots()
        restorePendingEnhancedShots()
        restoreRangeSession()
        setupSession()
    }

    private func setupSession() {
        guard WCSession.isSupported() else {
            connectionError = "Watch Connectivity not supported"
            return
        }

        session = WCSession.default
        session?.delegate = self
        session?.activate()
    }
    
    // MARK: - Send Shot Event
    
    func sendShotEvent(_ event: ShotEventWatch) {
        // Add to local history
        recentShots.insert(event, at: 0)
        if recentShots.count > 20 {
            recentShots.removeLast()
        }
        
        // Encode event
        guard let data = try? JSONEncoder().encode(event) else {
            connectionError = "Failed to encode shot event"
            return
        }
        
        let message: [String: Any] = ["shotEvent": data]
        
        // Try immediate send if reachable
        if let session = session, session.isReachable {
            session.sendMessage(message, replyHandler: nil) { [weak self] error in
                Task { @MainActor in
                    // Fall back to transfer if send fails
                    self?.transferShotEvent(data)
                }
            }
        } else {
            // Use transfer for reliable delivery
            transferShotEvent(data)
        }
    }
    
    private func transferShotEvent(_ data: Data) {
        guard let session, session.activationState == .activated else {
            // WC not ready yet — stash and retry on activation /
            // reachability change. transferUserInfo silently swallows
            // when state != .activated, so we'd lose the shot otherwise.
            pendingShotEvents.append(data)
            return
        }
        session.transferUserInfo(["shotEvent": data])
    }

    /// Re-emit any shot events that were queued while WC was inactive.
    /// Safe to call repeatedly — entries are removed as they're handed
    /// off to `transferUserInfo`, which itself retries until delivered.
    private func flushPendingShotEvents() {
        guard let session, session.activationState == .activated else { return }
        let queued = pendingShotEvents
        pendingShotEvents.removeAll()
        for data in queued {
            session.transferUserInfo(["shotEvent": data])
        }
    }

    private func persistPendingShots() {
        let defaults = UserDefaults.standard
        guard !pendingShotEvents.isEmpty else {
            defaults.removeObject(forKey: Self.pendingShotsKey)
            return
        }
        let b64 = pendingShotEvents.map { $0.base64EncodedString() }
        defaults.set(b64, forKey: Self.pendingShotsKey)
    }

    private func restorePendingShots() {
        let defaults = UserDefaults.standard
        guard let b64 = defaults.array(forKey: Self.pendingShotsKey) as? [String] else { return }
        pendingShotEvents = b64.compactMap { Data(base64Encoded: $0) }
    }
    
    // MARK: - Send Undo Request
    
    /// Mirror range/capture toggles the user changes on the watch so the
    /// iPhone Profile and the next `sendAllSettings` push stay aligned.
    func echoWatchToggledSettingsToPhone() {
        let s = WatchSettings.shared
        let message: [String: Any] = [
            "watchPreferencesEcho": true,
            "showRangeResultHUD": s.showRangeResultHUD,
            "micImpactConfirm": s.micImpactConfirm
        ]
        guard let session = session,
              session.activationState == .activated else { return }
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { _ in
                session.transferUserInfo(message)
            }
        } else {
            session.transferUserInfo(message)
        }
    }

    func sendUndoRequest() {
        guard let session = session else { return }
        
        // Remove from local history
        if !recentShots.isEmpty {
            recentShots.removeFirst()
        }
        
        let message: [String: Any] = ["undoShot": true]
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Undo send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }
    
    // MARK: - Send Hole Change
    
    /// Send hole change to iPhone when user swipes on watch
    func sendHoleChange(to holeNumber: Int) {
        guard let session = session else { return }
        
        // Update local state
        currentHoleNumber = holeNumber
        
        let message: [String: Any] = ["changeHole": holeNumber]
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Hole change send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }
    
    // MARK: - Send Score Update
    
    /// Ask the phone to start a round for the given course id (sent from
    /// the start screen when the user taps the "Start at <course>" CTA
    /// after the watch's GPS auto-matched a seeded course).
    func requestStartRound(courseId: String) {
        guard let session = session else { return }
        let message: [String: Any] = ["startRoundForCourseId": courseId]
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { _ in }
        } else {
            session.transferUserInfo(message)
        }
    }

    /// Send score update to iPhone
    func sendScoreUpdate(holeNumber: Int, grossStrokes: Int, putts: Int?) {
        guard let session = session else { return }
        
        var message: [String: Any] = [
            "scoreUpdate": true,
            "holeNumber": holeNumber,
            "grossStrokes": grossStrokes
        ]
        
        if let putts = putts {
            message["putts"] = putts
        }
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Score update send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }

    func setGuestScore(playerId: String, holeNumber: Int, grossStrokes: Int) {
        guard let session = session else { return }
        if let playerIndex = groupPlayers.firstIndex(where: { $0.id == playerId }),
           let holeIndex = groupPlayers[playerIndex].holes.firstIndex(where: { $0.holeNumber == holeNumber }) {
            groupPlayers[playerIndex].holes[holeIndex].grossStrokes = grossStrokes
        }
        let message: [String: Any] = [
            "guestScoreUpdate": true,
            "playerId": playerId,
            "holeNumber": holeNumber,
            "grossStrokes": grossStrokes
        ]
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Guest score update send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManagerWatch: WCSessionDelegate {
    
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let initialContext = session.receivedApplicationContext
        Task { @MainActor in
            if let error = error {
                connectionError = "Activation failed: \(error.localizedDescription)"
            } else {
                isPhoneReachable = session.isReachable
                applyUnitsContext(initialContext)
                // Retry any pending-ended sessions and queued shots that
                // survived the last app run.
                flushPendingEndedSessions()
                flushPendingShotEvents()
                flushPendingEnhancedShots()
            }
        }

    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor in
            isPhoneReachable = session.isReachable
            // Phone just came back online — drain anything we owe it.
            if session.isReachable {
                flushPendingEndedSessions()
                flushPendingShotEvents()
                flushPendingEnhancedShots()
            }
        }
    }

    /// Called when the iPhone updates its application context (e.g. units
    /// preference change). Application context survives reachability gaps,
    /// so the watch picks up the latest value even after a reboot.
    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        Task { @MainActor in
            applyUnitsContext(applicationContext)
            applyNextTeeBooking(applicationContext)
        }
    }

    /// Decode the optional `next_tee_booking` blob the phone may include in
    /// its application context. Stored as base64-encoded JSON so it travels
    /// inside the same dictionary the units/settings sync uses.
    private func applyNextTeeBooking(_ ctx: [String: Any]) {
        guard let b64 = ctx[WatchTeeBooking.dictKey] as? String else {
            // An empty value (or removed key) means there is no upcoming
            // booking. Don't clobber an existing one if the phone simply
            // didn't include it (i.e. partial context update).
            return
        }
        if b64.isEmpty {
            self.nextTeeBooking = nil
            return
        }
        guard let data = Data(base64Encoded: b64) else { return }
        let dec = JSONDecoder()
        dec.dateDecodingStrategy = .iso8601
        if let booking = try? dec.decode(WatchTeeBooking.self, from: data) {
            self.nextTeeBooking = booking
        }
    }

    /// Ask the iPhone to open the StrikeLab Tee Pass for the given booking.
    /// Best-effort send — uses sendMessage when the phone is reachable.
    func requestOpenPass(bookingId: String) {
        guard WCSession.default.isReachable else { return }
        WCSession.default.sendMessage(
            ["action": "open_tee_pass", "bookingId": bookingId],
            replyHandler: nil,
            errorHandler: nil
        )
    }

    private func applyUnitsContext(_ ctx: [String: Any]) {
        if let raw = ctx["unitsSystem"] as? String,
           let parsed = WatchUnitsSystem(rawValue: raw) {
            unitsSystem = parsed
        }

        // Haptics preference — apply to the watch-side Settings store so
        // every Haptics.play(...) call respects it immediately.
        if let enabled = ctx["hapticsEnabled"] as? Bool {
            WatchSettings.shared.applyHapticsEnabled(enabled)
        }
        if let v = ctx["fullMotionCapture"] as? Bool {
            WatchSettings.shared.applyFullMotionCapture(v)
        }
        if let v = ctx["micImpactConfirm"] as? Bool {
            WatchSettings.shared.applyMicImpactConfirm(v)
        }
        if let v = ctx["showRangeResultHUD"] as? Bool {
            WatchSettings.shared.applyShowRangeResultHUD(v)
        }
        if let v = ctx["coachingHaptics"] as? Bool {
            WatchSettings.shared.applyCoachingHaptics(v)
        }
        if let v = ctx["pressureWarnings"] as? Bool {
            WatchSettings.shared.applyPressureWarnings(v)
        }
        if let v = ctx["showHeartRateOnWatch"] as? Bool {
            WatchSettings.shared.applyShowHeartRateOnWatch(v)
        }
        if let v = ctx["anonymousSharing"] as? Bool {
            WatchSettings.shared.applyAnonymousDataSharing(v)
        }

        // Courses directory — refresh whenever the phone pushes a new one.
        if let dirData = ctx["coursesDirectory"] as? Data,
           let parsed = try? JSONDecoder().decode([WatchCourseEntry].self, from: dirData) {
            coursesDirectory = parsed
        }

        // Play format — keeps the watch in sync with phone's choice.
        if let raw = ctx["playFormat"] as? String,
           let parsed = WatchPlayFormat(rawValue: raw) {
            playFormat = parsed
        } else {
            playFormat = .full18
        }

        if let guestData = ctx["groupPlayers"] as? Data,
           let parsedGuests = try? JSONDecoder().decode([WatchGroupPlayer].self, from: guestData) {
            groupPlayers = parsedGuests
        } else if !ctx.keys.contains("groupPlayers") {
            groupPlayers = []
        }

        // Per-club calibration models (Phase 4) — refresh whenever
        // the phone pushes a new one.
        if let modelsData = ctx["clubModels"] as? Data,
           let decoded = try? JSONDecoder().decode([String: WatchClubModel].self, from: modelsData) {
            clubModels = decoded
        }

        if let winData = ctx["personalWindows"] as? Data,
           let decoded = try? JSONDecoder().decode([String: WatchPersonalWindow].self, from: winData) {
            personalWindows = decoded
        }

        if let pinData = ctx["holePins"] as? Data,
           let decoded = try? JSONDecoder().decode([WatchHolePinPayload].self, from: pinData) {
            var pins: [Int: (latitude: Double, longitude: Double)] = [:]
            for p in decoded {
                pins[p.holeNumber] = (p.latitude, p.longitude)
            }
            holePins = pins
        }

        if let h = ctx["caddieHole"] as? Int {
            caddieHole = h
        }
        if let y = ctx["caddieDistanceYards"] as? Int {
            caddieDistanceYards = y
        }
        if let raw = ctx["caddieClub"] as? String {
            caddieClubRaw = raw
        }
        if let phrase = ctx["caddieCommit"] as? String {
            caddieCommit = phrase
        }
        if let w = ctx["caddieWarning"] as? String {
            caddieWarning = w
        } else {
            caddieWarning = ""
        }
        if let ts = ctx["caddieUpdatedAt"] as? TimeInterval {
            caddieUpdatedAt = Date(timeIntervalSince1970: ts)
        }

        // Optional GPS / weather context. A missing key means "no
        // update" rather than "cleared", so we preserve the existing
        // value when absent (the phone sends a fresh advice payload
        // any time it recomputes).
        if let v = ctx["caddieFrontYards"] as? Int { caddieFrontYards = v }
        if let v = ctx["caddieBackYards"] as? Int { caddieBackYards = v }
        if let v = ctx["caddiePlaysLikeYards"] as? Int { caddiePlaysLikeYards = v }
        if let v = ctx["caddieHazardNote"] as? String { caddieHazardNote = v } else { caddieHazardNote = "" }
        if let v = ctx["caddieSource"] as? String { caddieSource = v } else { caddieSource = "" }
        if let v = ctx["caddieConfidence"] as? Double { caddieConfidence = v }
        else if let v = ctx["caddieConfidence"] as? Int { caddieConfidence = Double(v) }
        if let v = ctx["caddieWindMph"] as? Double { caddieWindMph = v }
        else if let v = ctx["caddieWindMph"] as? Int { caddieWindMph = Double(v) }
        if let v = ctx["caddieWindDirectionDeg"] as? Double { caddieWindDirectionDeg = v }
        else if let v = ctx["caddieWindDirectionDeg"] as? Int { caddieWindDirectionDeg = Double(v) }

        if let url = ctx["apiBaseURL"] as? String, !url.isEmpty {
            apiBaseURL = url
        }
        if let token = ctx["apiAccessToken"] as? String, !token.isEmpty {
            apiAccessToken = token
        } else if ctx.keys.contains("apiAccessToken") {
            // Explicitly cleared by the phone (logged out).
            apiAccessToken = nil
        }

        // If the phone has cleared its current round it removes "roundId"
        // entirely from the context — wipe local state to match.
        if ctx["roundId"] == nil && lastRoundId != nil {
            holes = WatchHoleState.defaultEighteen()
            lastRoundId = nil
            isRoundActive = false
            currentHoleNumber = 1
            roundStartedAt = nil
            roundElapsedSeconds = nil
            roundElapsedSyncedAt = nil
            recentShots.removeAll()
        }

        // Round configuration arrives via application context whenever a
        // new round is started on the phone. The roundId lets us tell new
        // rounds apart and wipe stale shot/score state on the watch.
        if let roundId = ctx["roundId"] as? String,
           let configData = ctx["roundConfig"] as? Data,
           let parsed = try? JSONDecoder().decode([WatchHoleState].self, from: configData) {
            if let ts = ctx["roundStartedAt"] as? TimeInterval {
                roundStartedAt = Date(timeIntervalSince1970: ts)
            }
            if let seconds = ctx["roundElapsedSeconds"] as? TimeInterval {
                roundElapsedSeconds = seconds
                roundElapsedSyncedAt = Date()
            } else if let seconds = ctx["roundElapsedSeconds"] as? Int {
                roundElapsedSeconds = TimeInterval(seconds)
                roundElapsedSyncedAt = Date()
            }
            isRoundActive = true
            if roundId != lastRoundId {
                // New round — replace everything.
                holes = parsed
                lastRoundId = roundId
                recentShots.removeAll()
                currentHoleNumber = ctx["currentHole"] as? Int ?? playFormat.range.lowerBound
            } else {
                // Same round — phone is the source of truth. Always
                // overwrite local strokes/putts so iPhone edits propagate
                // immediately. The watch's own edits round-trip through
                // the phone so this still converges.
                for incoming in parsed {
                    if let i = indexOf(holeNumber: incoming.holeNumber) {
                        holes[i].par = incoming.par
                        holes[i].handicapIndex = incoming.handicapIndex
                        holes[i].strokesReceived = incoming.strokesReceived
                        holes[i].grossStrokes = incoming.grossStrokes
                        holes[i].putts = incoming.putts
                    }
                }
            }
        }
    }
    
    // MARK: - Receive Messages
    
    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        Task { @MainActor in
            handleMessage(message)
        }
    }
    
    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        Task { @MainActor in
            handleMessage(message)
            replyHandler(["received": true])
        }
    }
    
    // MARK: - Message Handling
    
    private func handleMessage(_ message: [String: Any]) {
        if let hole = message["currentHole"] as? Int {
            currentHoleNumber = hole
        }

        if let active = message["roundActive"] as? Bool {
            isRoundActive = active
            if !active {
                // Round ended — wipe scores so the next round starts clean.
                recentShots.removeAll()
                holes = WatchHoleState.defaultEighteen()
                lastRoundId = nil
                currentHoleNumber = 1
                roundStartedAt = nil
                roundElapsedSeconds = nil
                roundElapsedSyncedAt = nil
            }
        }

        if let name = message["courseName"] as? String {
            courseName = name
        }

        // Authoritative score update from the phone — wins over local state
        // so edits made on the phone propagate without needing a roundConfig
        // refresh.
        if message["scoreUpdate"] as? Bool == true,
           let holeNumber = message["holeNumber"] as? Int,
           let idx = indexOf(holeNumber: holeNumber) {
            if let strokes = message["grossStrokes"] as? Int {
                holes[idx].grossStrokes = strokes
            }
            if let putts = message["putts"] as? Int {
                holes[idx].putts = putts
            }
        }

        if message["requestSync"] as? Bool == true {
            // Phone asked for a full state replay — re-emit anything that
            // could plausibly have been missed:
            //   - pending-ended range sessions (retry queue)
            //   - active range session snapshot
            //   - the most recent shot events (transferUserInfo guarantees
            //     eventual delivery even if duplicate; the phone dedupes
            //     by ShotEvent.id).
            flushPendingEndedSessions()
            flushPendingEnhancedShots()
            if rangeSession != nil {
                sendRangeSessionState()
            }
            for shot in recentShots.prefix(5).reversed() {
                if let data = try? JSONEncoder().encode(shot) {
                    session?.transferUserInfo(["shotEvent": data])
                }
            }
        }

        // Phone is asking us to remove a single swing from the live
        // range session. Apply locally and broadcast new state.
        if let raw = message["removeSwingId"] as? String,
           let id = UUID(uuidString: raw) {
            removeRangeSwing(id: id)
        }

        // Phone has safely persisted a previously-ended range session.
        // Drop it from the pending-delivery queue so we stop retrying.
        if message["rangeAck"] as? Bool == true,
           let raw = message["sessionId"] as? String,
           let id = UUID(uuidString: raw) {
            pendingEndedSessions.removeAll { $0.id == id }
        }

        // Phone decoded and accepted a rich IMU/HR payload. Drop it from
        // the durable retry queue only after this explicit ACK.
        if message["enhancedShotAck"] as? Bool == true,
           let raw = message["shotId"] as? String,
           let id = UUID(uuidString: raw) {
            acknowledgeEnhancedShot(id: id)
        }
    }
}

// MARK: - Watch-side Range Session

private struct PendingEnhancedShotPayload: Codable, Equatable, Identifiable {
    let id: UUID
    let data: Data
    let isCompressed: Bool
}

/// Per-swing log entry — the source of truth for a range session.
/// Carries enough metadata for the watch RECENT page and the phone
/// live card to address an individual swing (delete by id).
struct WatchSwingLogEntry: Codable, Equatable, Identifiable {
    let id: UUID
    let timestamp: Date
    let club: String        // ClubWatch.rawValue
    let isAuto: Bool
    let confidence: Double?
}

/// Live state of a driving-range session. The `swings` array is the
/// source of truth; per-club counts are derived. This lets us delete
/// a single swing without losing identity for the rest.
struct WatchRangeSession: Equatable {
    let id: UUID
    let startedAt: Date
    var activeClub: ClubWatch
    var swings: [WatchSwingLogEntry] = []

    /// Per-club tally derived from `swings`.
    var counts: [String: Int] {
        var d: [String: Int] = [:]
        for s in swings {
            d[s.club, default: 0] += 1
        }
        return d
    }
}

// MARK: - Watch-side Play Format

/// Mirror of the iOS `PlayFormat` enum so the watch can filter holes
/// to the chosen format without having to depend on the iOS source.
enum WatchPlayFormat: String, Codable {
    case full18
    case front9
    case back9

    var range: ClosedRange<Int> {
        switch self {
        case .full18: return 1...18
        case .front9: return 1...9
        case .back9:  return 10...18
        }
    }

    var shortLabel: String {
        switch self {
        case .full18: return "18"
        case .front9: return "F9"
        case .back9:  return "B9"
        }
    }
}

// MARK: - Watch-side Club Model (Phase 4 calibration)

/// Mirror of the iOS `ClubModel`. Decoded from the WCSession application
/// context so the post-swing HUD can show estimated carry on the wrist.
struct WatchClubModel: Codable, Equatable {
    var alpha: Double
    var gamma: Double
    var sigma: Double
    var sampleCount: Int
    var medianHandMph: Double

    func predictCarry(handMph: Double) -> Double {
        alpha * handMph + gamma
    }
}

// MARK: - Watch-side Course Directory

/// Slim, watch-side mirror of the phone's seeded courses — just enough to
/// compute "how far am I from this course?" via CoreLocation and offer a
/// one-tap start.
struct WatchCourseEntry: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let latitude: Double
    let longitude: Double
}

// MARK: - Watch-side Hole State

/// Slim, watch-side mirror of `RoundHole`. Encoded once per round into the
/// WCSession application context so the watch always knows par + HI +
/// allocated strokes for every hole and can make UX decisions like
/// "net double bogey" without round-tripping to the phone.
struct WatchHoleState: Codable, Equatable {
    let holeNumber: Int
    var par: Int
    var handicapIndex: Int
    var strokesReceived: Int
    var grossStrokes: Int?
    var putts: Int?

    /// Net double bogey under WHS handicap rules — par + 2 + strokes
    /// received on this hole. Anything past this is a "Pick-up" for
    /// handicap purposes.
    var netDoubleBogey: Int {
        par + 2 + strokesReceived
    }

    /// Visual cap for the Crown so the user can still record extreme
    /// scores. High enough for juniors and blow-up holes without making
    /// Crown entry effectively unbounded.
    var maxStrokes: Int {
        99
    }

    /// Default-18 holes used before a round arrives from the phone.
    static func defaultEighteen() -> [WatchHoleState] {
        (1...18).map { n in
            WatchHoleState(
                holeNumber: n,
                par: 4,
                handicapIndex: n,
                strokesReceived: 0,
                grossStrokes: nil,
                putts: nil
            )
        }
    }
}

struct WatchGroupPlayer: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let handicapIndex: Double?
    let courseHandicap: Int?
    var holes: [WatchGroupHoleScore]

    func score(for holeNumber: Int) -> WatchGroupHoleScore? {
        holes.first { $0.holeNumber == holeNumber }
    }
}

struct WatchGroupHoleScore: Codable, Identifiable, Equatable {
    var id: Int { holeNumber }
    let holeNumber: Int
    let par: Int
    let handicapIndex: Int
    let strokesReceived: Int
    var grossStrokes: Int?

    var netStrokes: Int? {
        grossStrokes.map { $0 - strokesReceived }
    }
}

// MARK: - Watch-side Units

/// Mirror of the iOS `MeasurementSystem` enum, kept lightweight so the watch
/// target stays free of the iOS app's source dependencies.
enum WatchUnitsSystem: String, Codable, CaseIterable {
    case yards
    case meters

    var toggled: WatchUnitsSystem {
        switch self {
        case .yards: return .meters
        case .meters: return .yards
        }
    }

    /// Convert a yards value into the user's preferred display value.
    func display(yards: Double) -> Double {
        switch self {
        case .yards:  return yards
        case .meters: return yards * 0.9144
        }
    }

    /// "245 yds" / "224 m"
    func format(yards: Double) -> String {
        "\(Int(display(yards: yards).rounded())) \(label)"
    }

    /// "245" / "224" — number only, when the unit label is rendered separately.
    func formatNumber(yards: Double) -> String {
        "\(Int(display(yards: yards).rounded()))"
    }

    /// Lowercase short label.
    var label: String {
        switch self {
        case .yards:  return "yds"
        case .meters: return "m"
        }
    }

    /// Uppercase short label for tracking-letterspaced microcopy.
    var caps: String {
        switch self {
        case .yards:  return "YDS"
        case .meters: return "M"
        }
    }
}

// MARK: - Shot Event (Watch-side model)

/// Watch-side shot event model
struct ShotEventWatch: Codable, Identifiable, Equatable {
    let id: UUID
    var timestamp: Date
    var club: ClubWatch
    var confidence: Double?
    var isManual: Bool
    var holeNumber: Int?
    var heartRateData: HeartRateDataWatch?
    
    /// Club group for backward compatibility
    var clubGroup: ClubGroupWatch {
        club.group
    }
    
    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        club: ClubWatch,
        confidence: Double? = nil,
        isManual: Bool = true,
        holeNumber: Int? = nil,
        heartRateData: HeartRateDataWatch? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.club = club
        self.confidence = confidence
        self.isManual = isManual
        self.holeNumber = holeNumber
        self.heartRateData = heartRateData
    }

    init(
        club: ClubWatch,
        confidence: Double? = nil,
        isManual: Bool = true,
        holeNumber: Int? = nil,
        heartRateData: HeartRateDataWatch? = nil
    ) {
        self.init(
            id: UUID(),
            timestamp: Date(),
            club: club,
            confidence: confidence,
            isManual: isManual,
            holeNumber: holeNumber,
            heartRateData: heartRateData
        )
    }
}

/// Watch-side club group enum (mirrors iOS version)
enum ClubGroupWatch: String, Codable, CaseIterable, Identifiable {
    case driver = "Driver"
    case wood = "Wood"
    case hybrid = "Hybrid"
    case iron = "Iron"
    case wedge = "Wedge"
    case putt = "Putt"
    
    var id: String { rawValue }
    
    var iconName: String {
        switch self {
        case .driver: return "arrow.up.right"
        case .wood: return "arrow.up.forward"
        case .hybrid: return "arrow.up.forward.circle"
        case .iron: return "arrow.right"
        case .wedge: return "arrow.up"
        case .putt: return "circle.dotted"
        }
    }
    
    var shortLabel: String {
        switch self {
        case .driver: return "D"
        case .wood: return "W"
        case .hybrid: return "H"
        case .iron: return "I"
        case .wedge: return "WG"
        case .putt: return "P"
        }
    }
    
    /// Get clubs in this group
    var clubs: [ClubWatch] {
        ClubWatch.allCases.filter { $0.group == self }
    }
}

// MARK: - Specific Club (Watch-side)

/// Individual golf clubs for detailed tracking (mirrors iOS Club enum)
enum ClubWatch: String, Codable, CaseIterable, Identifiable {
    // Driver
    case driver = "Driver"
    
    // Woods
    case wood3 = "3 Wood"
    case wood5 = "5 Wood"
    case wood7 = "7 Wood"
    
    // Hybrids
    case hybrid2 = "2 Hybrid"
    case hybrid3 = "3 Hybrid"
    case hybrid4 = "4 Hybrid"
    case hybrid5 = "5 Hybrid"
    case hybrid6 = "6 Hybrid"
    
    // Irons
    case iron3 = "3 Iron"
    case iron4 = "4 Iron"
    case iron5 = "5 Iron"
    case iron6 = "6 Iron"
    case iron7 = "7 Iron"
    case iron8 = "8 Iron"
    case iron9 = "9 Iron"
    
    // Wedges
    case pitchingWedge = "PW"
    case gapWedge = "GW"
    case sandWedge = "SW"
    case lobWedge = "LW"
    case wedge50 = "50°"
    case wedge52 = "52°"
    case wedge54 = "54°"
    case wedge56 = "56°"
    case wedge58 = "58°"
    case wedge60 = "60°"
    case wedge64 = "64°"
    
    // Putter
    case putter = "Putter"
    
    var id: String { rawValue }
    
    /// The club group this club belongs to
    var group: ClubGroupWatch {
        switch self {
        case .driver:
            return .driver
        case .wood3, .wood5, .wood7:
            return .wood
        case .hybrid2, .hybrid3, .hybrid4, .hybrid5, .hybrid6:
            return .hybrid
        case .iron3, .iron4, .iron5, .iron6, .iron7, .iron8, .iron9:
            return .iron
        case .pitchingWedge, .gapWedge, .sandWedge, .lobWedge,
             .wedge50, .wedge52, .wedge54, .wedge56, .wedge58, .wedge60, .wedge64:
            return .wedge
        case .putter:
            return .putt
        }
    }
    
    /// Short display name for compact UI
    var shortName: String {
        switch self {
        case .driver: return "D"
        case .wood3: return "3W"
        case .wood5: return "5W"
        case .wood7: return "7W"
        case .hybrid2: return "2H"
        case .hybrid3: return "3H"
        case .hybrid4: return "4H"
        case .hybrid5: return "5H"
        case .hybrid6: return "6H"
        case .iron3: return "3i"
        case .iron4: return "4i"
        case .iron5: return "5i"
        case .iron6: return "6i"
        case .iron7: return "7i"
        case .iron8: return "8i"
        case .iron9: return "9i"
        case .pitchingWedge: return "PW"
        case .gapWedge: return "GW"
        case .sandWedge: return "SW"
        case .lobWedge: return "LW"
        case .wedge50: return "50°"
        case .wedge52: return "52°"
        case .wedge54: return "54°"
        case .wedge56: return "56°"
        case .wedge58: return "58°"
        case .wedge60: return "60°"
        case .wedge64: return "64°"
        case .putter: return "P"
        }
    }
    
    /// Common clubs for quick selection — Espen's bag.
    static var commonClubs: [ClubWatch] {
        [
            .driver,
            .wood5,
            .iron5, .iron6, .iron7, .iron8, .iron9,
            .pitchingWedge, .wedge52, .wedge56, .wedge60,
            .putter
        ]
    }

    /// Range bag (drops the putter).
    static var rangeClubs: [ClubWatch] {
        commonClubs.filter { $0 != .putter }
    }
}
