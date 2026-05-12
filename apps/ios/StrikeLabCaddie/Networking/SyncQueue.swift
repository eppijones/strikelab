import Foundation
import Combine
import Network

/// Lightweight background sync queue for the StrikeLabCaddie iOS app.
/// Pending payloads (round shots, completed rounds) are persisted to disk
/// and flushed when the network is reachable.
///
/// Each envelope carries its own `retryCount` and `nextAttempt` so a
/// single bad payload doesn't stall the entire queue, and so we never
/// hammer the server in a tight loop after a 500. After 6 failures the
/// envelope is marked `failed` and surfaced via `failedCount`; the user
/// can trigger a manual retry from the UI banner.
@MainActor
final class SyncQueue: ObservableObject {
    static let shared = SyncQueue()

    @Published private(set) var pendingCount: Int = 0
    @Published private(set) var failedCount: Int = 0
    @Published private(set) var lastSync: Date? = nil
    @Published private(set) var isOnline: Bool = false

    private let monitor = NWPathMonitor()
    private let queueDir: URL

    /// Max retries before an envelope is parked in the failed bucket.
    private let maxRetries = 6

    private init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        queueDir = docs.appendingPathComponent("strikelab-sync", isDirectory: true)
        try? FileManager.default.createDirectory(at: queueDir, withIntermediateDirectories: true)
        refreshCounts()
        startMonitor()
    }

    // MARK: - Public API

    func enqueueRound(_ round: Round) {
        write(payload: SyncEnvelope(kind: .round, json: encode(round)))
    }

    func enqueueRoundShots(roundId: UUID, shots: [Shot]) {
        write(payload: SyncEnvelope(kind: .roundShots(roundId: roundId), json: encode(shots)))
    }

    /// Drain ready (non-failed, past their `nextAttempt`) envelopes. Each
    /// envelope is tried independently — a failure on one does NOT stop
    /// the rest. Failures bump `retryCount` and push `nextAttempt` out
    /// by an exponential window.
    func flush() async {
        let now = Date()
        let envelopes = readAll().filter { !$0.failed && $0.nextAttempt <= now }
        for env in envelopes {
            do {
                switch env.kind {
                case .round:
                    let _: EmptyResponse = try await APIClient.shared.request(
                        "/rounds",
                        method: .post,
                        body: AnyJSON(env.json)
                    )
                case .roundShots(let roundId):
                    let _: EmptyResponse = try await APIClient.shared.request(
                        "/rounds/\(roundId.uuidString)/shots/bulk",
                        method: .post,
                        body: AnyJSON(env.json)
                    )
                }
                remove(envelope: env)
            } catch {
                bumpRetry(envelope: env)
            }
        }
        lastSync = Date()
        refreshCounts()
    }

    /// Manually retry every envelope in the failed bucket. Resets their
    /// retryCount + nextAttempt so they'll be picked up by the next flush.
    func retryFailed() async {
        let now = Date()
        for env in readAll() where env.failed {
            var updated = env
            updated.failed = false
            updated.retryCount = 0
            updated.nextAttempt = now
            rewrite(envelope: updated)
        }
        refreshCounts()
        await flush()
    }

    // MARK: - Persistence

    private func encode<T: Encodable>(_ value: T) -> Data {
        let enc = JSONEncoder()
        enc.dateEncodingStrategy = .iso8601
        enc.keyEncodingStrategy = .convertToSnakeCase
        return (try? enc.encode(value)) ?? Data()
    }

    private func write(payload: SyncEnvelope) {
        rewrite(envelope: payload)
        refreshCounts()
    }

    private func rewrite(envelope: SyncEnvelope) {
        let url = envelope.fileURL
            ?? queueDir.appendingPathComponent(envelope.id.uuidString + ".json")
        let envelopeData: [String: Any] = [
            "id": envelope.id.uuidString,
            "kind": envelope.kind.label,
            "round_id": (envelope.kind.roundId?.uuidString as Any?) ?? NSNull(),
            "json_b64": envelope.json.base64EncodedString(),
            "retry_count": envelope.retryCount,
            "next_attempt": envelope.nextAttempt.timeIntervalSince1970,
            "failed": envelope.failed,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: envelopeData) {
            try? data.write(to: url)
        }
    }

    private func readAll() -> [SyncEnvelope] {
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: queueDir, includingPropertiesForKeys: nil
        ) else { return [] }
        return files.compactMap { url -> SyncEnvelope? in
            guard
                let data = try? Data(contentsOf: url),
                let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let id = (dict["id"] as? String).flatMap(UUID.init),
                let kindLabel = dict["kind"] as? String,
                let jsonB64 = dict["json_b64"] as? String,
                let json = Data(base64Encoded: jsonB64)
            else { return nil }
            let roundId = (dict["round_id"] as? String).flatMap(UUID.init)
            let kind: SyncEnvelope.Kind = kindLabel == "round_shots" && roundId != nil
                ? .roundShots(roundId: roundId!)
                : .round
            let retryCount = (dict["retry_count"] as? Int) ?? 0
            let nextAttempt = (dict["next_attempt"] as? TimeInterval)
                .map { Date(timeIntervalSince1970: $0) } ?? Date(timeIntervalSince1970: 0)
            let failed = (dict["failed"] as? Bool) ?? false
            return SyncEnvelope(
                id: id,
                kind: kind,
                json: json,
                fileURL: url,
                retryCount: retryCount,
                nextAttempt: nextAttempt,
                failed: failed
            )
        }
    }

    private func remove(envelope: SyncEnvelope) {
        if let url = envelope.fileURL {
            try? FileManager.default.removeItem(at: url)
        }
    }

    private func bumpRetry(envelope: SyncEnvelope) {
        var updated = envelope
        updated.retryCount += 1
        if updated.retryCount >= maxRetries {
            updated.failed = true
            updated.nextAttempt = Date.distantFuture
        } else {
            // Exponential backoff: 60s, 120s, 240s, 480s, 960s (then fail).
            let seconds = min(3600, 60 * Int(pow(2.0, Double(updated.retryCount - 1))))
            updated.nextAttempt = Date().addingTimeInterval(TimeInterval(seconds))
        }
        rewrite(envelope: updated)
    }

    private func refreshCounts() {
        let all = readAll()
        pendingCount = all.filter { !$0.failed }.count
        failedCount = all.filter { $0.failed }.count
    }

    // MARK: - Network monitor

    private func startMonitor() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOnline = path.status == .satisfied
                if path.status == .satisfied {
                    await self?.flush()
                }
            }
        }
        monitor.start(queue: DispatchQueue.global(qos: .utility))
    }
}

// MARK: - Helpers

private struct SyncEnvelope {
    enum Kind {
        case round
        case roundShots(roundId: UUID)

        var label: String {
            switch self {
            case .round: return "round"
            case .roundShots: return "round_shots"
            }
        }
        var roundId: UUID? {
            if case .roundShots(let id) = self { return id }
            return nil
        }
    }

    var id: UUID = UUID()
    var kind: Kind
    var json: Data
    var fileURL: URL? = nil
    var retryCount: Int = 0
    /// Earliest time at which the next flush should attempt this envelope.
    /// Fresh envelopes default to `Date(timeIntervalSince1970: 0)` (the
    /// past) so they're picked up on the next flush.
    var nextAttempt: Date = Date(timeIntervalSince1970: 0)
    var failed: Bool = false
}

/// Generic Encodable wrapper for raw JSON Data so we can re-post a previously
/// serialized payload without re-decoding it.
private struct AnyJSON: Encodable {
    let data: Data
    init(_ data: Data) { self.data = data }
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        let any = try JSONSerialization.jsonObject(with: data)
        try container.encode(AnyEncodable(any))
    }
}

private struct AnyEncodable: Encodable {
    let value: Any
    init(_ value: Any) { self.value = value }
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyEncodable($0) })
        case let arr as [Any]:
            try container.encode(arr.map { AnyEncodable($0) })
        case let str as String: try container.encode(str)
        case let int as Int: try container.encode(int)
        case let dbl as Double: try container.encode(dbl)
        case let bool as Bool: try container.encode(bool)
        case is NSNull: try container.encodeNil()
        default: try container.encodeNil()
        }
    }
}
