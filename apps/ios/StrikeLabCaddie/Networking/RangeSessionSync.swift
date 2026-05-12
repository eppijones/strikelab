//
//  RangeSessionSync.swift
//  StrikeLabCaddie
//
//  Pushes completed driving-range sessions to StrikeLab API (`PUT /range-sessions/sync`)
//  when `APIClient` is configured with a bearer token (same auth as Tee + rounds).
//

import Foundation

struct RangeSessionSyncResponse: Decodable {
    let id: UUID
    let shotCount: Int
    let startTime: Date?
    let updatedAt: Date
    let created: Bool
}

struct RangeSessionAudioUploadResponse: Decodable {
    let sessionId: UUID
    let shotId: UUID
    let url: String
    let contentType: String
    let byteCount: Int
}

enum RangeSessionSync {
    static let lastMessageKey = "strikelab.rangeSync.lastMessage.v1"
    static let lastSuccessEpochKey = "strikelab.rangeSync.lastSuccessEpoch.v1"

    /// Human-readable line for Settings (nil if never attempted).
    static func lastSyncStatusLine() -> String? {
        let d = UserDefaults.standard
        guard let msg = d.string(forKey: lastMessageKey), !msg.isEmpty else { return nil }
        let t = d.double(forKey: lastSuccessEpochKey)
        if t > 0 {
            let ago = Date(timeIntervalSince1970: t)
            let rel = RelativeDateTimeFormatter().localizedString(for: ago, relativeTo: Date())
            return "\(msg) · last OK \(rel)"
        }
        return msg
    }

    private static func recordSuccess(_ message: String) {
        let d = UserDefaults.standard
        d.set(message, forKey: lastMessageKey)
        d.set(Date().timeIntervalSince1970, forKey: lastSuccessEpochKey)
    }

    private static func recordFailure(_ message: String) {
        UserDefaults.standard.set(message, forKey: lastMessageKey)
    }

    /// Fire-and-forget upload after `addPracticeSession` saves to disk.
    @MainActor
    static func scheduleUpload(session: PracticeSession, persistence: PersistenceManager) {
        Task {
            await upload(session: session, persistence: persistence)
        }
    }

    /// After late motion merge, wait for bursty `enhancedShot` deliveries then upsert once.
    @MainActor
    static func scheduleDebouncedUpload(sessionId: UUID, persistence: PersistenceManager) {
        debounceTasks[sessionId]?.cancel()
        debounceTasks[sessionId] = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            guard !Task.isCancelled else { return }
            guard let session = persistence.practiceSession(byId: sessionId) else {
                debounceTasks[sessionId] = nil
                return
            }
            await upload(session: session, persistence: persistence)
            debounceTasks[sessionId] = nil
        }
    }

    private static var debounceTasks: [UUID: Task<Void, Never>] = [:]

    @MainActor
    private static func upload(session: PracticeSession, persistence: PersistenceManager) async {
        guard !AppSettingsManager.shared.localModeEnabled else {
            recordFailure("Local mode on — range session saved on iPhone.")
            return
        }
        let envelope = StrikeLabRangeExport(session: session)
        do {
            let resp: RangeSessionSyncResponse = try await APIClient.shared.request(
                "/range-sessions/sync",
                method: .put,
                body: envelope,
                responseType: RangeSessionSyncResponse.self
            )
            let audioCount = await uploadAudioClips(for: session, persistence: persistence)
            let msg = "Synced \(resp.shotCount) shots to StrikeLab."
            recordSuccess(msg)
            print("Range session synced to StrikeLab (\(resp.shotCount) shots, \(audioCount) audio clips, created=\(resp.created))")
        } catch {
            recordFailure(error.localizedDescription)
            print("Range session cloud sync skipped: \(error.localizedDescription)")
        }
    }

    @MainActor
    private static func uploadAudioClips(for session: PracticeSession, persistence: PersistenceManager) async -> Int {
        var uploaded = 0
        for shot in session.shots {
            guard let url = persistence.swingAudioURL(for: shot.id) else { continue }
            do {
                let _: RangeSessionAudioUploadResponse = try await APIClient.shared.uploadFile(
                    "/range-sessions/\(session.id.uuidString)/shots/\(shot.id.uuidString)/audio",
                    fileURL: url,
                    mimeType: "audio/x-caf",
                    responseType: RangeSessionAudioUploadResponse.self
                )
                uploaded += 1
            } catch {
                print("Range audio sync skipped for shot \(shot.id): \(error.localizedDescription)")
            }
        }
        return uploaded
    }
}
