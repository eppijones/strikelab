import Foundation

struct RoundLiveSyncResponse: Decodable {
    let id: UUID
    let version: Int
}

struct RoundShotAudioUploadResponse: Decodable {
    let roundId: UUID
    let shotId: UUID
    let url: String
}

@MainActor
enum RoundLiveSync {
    private static var tasks: [UUID: Task<Void, Never>] = [:]

    static func schedule(round: Round, persistence: PersistenceManager) {
        guard !AppSettingsManager.shared.localModeEnabled else { return }
        tasks[round.id]?.cancel()
        tasks[round.id] = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            guard !Task.isCancelled else { return }
            await sync(round: round, persistence: persistence)
            tasks[round.id] = nil
        }
    }

    static func syncNow(round: Round, persistence: PersistenceManager) {
        guard !AppSettingsManager.shared.localModeEnabled else { return }
        tasks[round.id]?.cancel()
        tasks[round.id] = Task { @MainActor in
            await sync(round: round, persistence: persistence)
            tasks[round.id] = nil
        }
    }

    private static func sync(round: Round, persistence: PersistenceManager) async {
        do {
            let _: RoundLiveSyncResponse = try await APIClient.shared.request(
                "/rounds/sync",
                method: .put,
                body: round,
                responseType: RoundLiveSyncResponse.self
            )
            await uploadAudioClips(for: round, persistence: persistence)
        } catch {
            print("Round live sync skipped: \(error.localizedDescription)")
        }
    }

    private static func uploadAudioClips(for round: Round, persistence: PersistenceManager) async {
        for shot in round.shots {
            guard let url = persistence.swingAudioURL(for: shot.id) else { continue }
            do {
                let _: RoundShotAudioUploadResponse = try await APIClient.shared.uploadFile(
                    "/rounds/\(round.id.uuidString)/shots/\(shot.id.uuidString)/audio",
                    fileURL: url,
                    mimeType: "audio/x-caf",
                    responseType: RoundShotAudioUploadResponse.self
                )
            } catch {
                print("Round audio sync skipped for shot \(shot.id): \(error.localizedDescription)")
            }
        }
    }
}
