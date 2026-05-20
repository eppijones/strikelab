import Foundation
import Combine

/// WebSocket client for the StrikeLab realtime fanout (`/ws/rounds`).
///
/// Used to keep the iOS app in sync when *another* device (typically the
/// web app) modifies a round. The phone itself is usually the author of
/// writes, but a friend-bag scenario or a multi-device user will benefit
/// from instant updates without polling.
///
/// Auth: passes the current access token in the URL query string so we
/// don't need a separate auth message. Reconnects with exponential
/// backoff (1s → 30s cap). Posts `NSNotification` events for screens to
/// subscribe to instead of bolting on a Combine subject — keeps coupling
/// loose for now.
@MainActor
final class RealtimeClient: NSObject, ObservableObject {
    static let shared = RealtimeClient()

    @Published private(set) var isConnected: Bool = false

    private var task: URLSessionWebSocketTask?
    private var session: URLSession?
    private var reconnectAttempts: Int = 0
    private var reconnectTimer: Task<Void, Never>?
    private var closedByUs: Bool = false

    private var currentToken: String?
    private var currentBaseURL: URL?

    override init() {
        super.init()
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config, delegate: nil, delegateQueue: .main)
    }

    /// Connect (or reconnect) with the latest access token and base URL.
    /// Safe to call multiple times — re-uses the same URLSessionWebSocketTask
    /// if config is unchanged, otherwise tears down and reopens.
    func connect(baseURL: URL, accessToken: String?) {
        guard let token = accessToken, !token.isEmpty else {
            disconnect()
            return
        }
        if currentToken == token, currentBaseURL == baseURL, task != nil {
            return
        }
        currentToken = token
        currentBaseURL = baseURL
        openSocket()
    }

    func disconnect() {
        closedByUs = true
        reconnectTimer?.cancel()
        reconnectTimer = nil
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        isConnected = false
        currentToken = nil
    }

    private func openSocket() {
        guard let baseURL = currentBaseURL, let token = currentToken,
              let session else { return }
        closedByUs = false
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        guard var components else { return }
        components.scheme = (baseURL.scheme == "https") ? "wss" : "ws"
        components.path = components.path + "/ws/rounds"
        components.queryItems = [URLQueryItem(name: "token", value: token)]
        guard let url = components.url else { return }

        task?.cancel(with: .goingAway, reason: nil)
        let ws = session.webSocketTask(with: url)
        task = ws
        ws.resume()
        receiveNext()
    }

    private func receiveNext() {
        task?.receive { [weak self] result in
            let client = self
            Task { @MainActor [client, result] in
                guard let client else { return }
                switch result {
                case .failure:
                    client.handleClose()
                case .success(let message):
                    if !client.isConnected { client.isConnected = true }
                    client.reconnectAttempts = 0
                    client.handle(message: message)
                    client.receiveNext()
                }
            }
        }
    }

    private func handle(message: URLSessionWebSocketTask.Message) {
        let data: Data
        switch message {
        case .string(let s):
            data = Data(s.utf8)
        case .data(let d):
            data = d
        @unknown default:
            return
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }
        switch type {
        case "round.created", "round.updated", "round.deleted",
             "round.shot.added", "round.shots.added":
            NotificationCenter.default.post(
                name: .strikeLabRealtimeRoundEvent,
                object: nil,
                userInfo: json
            )
        default:
            break
        }
    }

    private func handleClose() {
        isConnected = false
        task = nil
        guard !closedByUs else { return }
        let attempt = reconnectAttempts + 1
        reconnectAttempts = attempt
        let delayMs = min(30_000, 1_000 * Int(pow(2.0, Double(attempt - 1))))
        reconnectTimer?.cancel()
        reconnectTimer = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delayMs) * 1_000_000)
            await MainActor.run {
                self?.openSocket()
            }
        }
    }
}

extension Notification.Name {
    /// userInfo carries the raw event dict: `{type, round_id, ...}`.
    static let strikeLabRealtimeRoundEvent = Notification.Name("strikeLabRealtimeRoundEvent")
}
