import Foundation

/// StrikeLab API client — JSON over HTTPS with bearer token + offline retry.
///
/// The bundled base URL points at the public production API so iPhone and
/// Watch installs work on cellular without local-network configuration.
///
/// Errors surface as `SLAPIError`. The companion `SyncQueue` retries when offline.
final class APIClient {
    static let shared = APIClient()

    private(set) var baseURL: URL
    private var accessToken: String?
    private var refreshToken: String?

    /// Called when both access + refresh have failed and the session is dead.
    /// `AuthStore` listens for this to clear keychain state and bounce to Login.
    var onSessionExpired: (() -> Void)?

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom(Self.decodeISO8601Date)
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        self.baseURL = Self.defaultBaseURL()
    }

    private static func decodeISO8601Date(from decoder: Decoder) throws -> Date {
        let container = try decoder.singleValueContainer()
        let value = try container.decode(String.self)

        if let date = iso8601WithFractionalSeconds.date(from: value) ?? iso8601.date(from: value) {
            return date
        }

        throw DecodingError.dataCorruptedError(
            in: container,
            debugDescription: "Invalid ISO8601 date: \(value)"
        )
    }

    private static let iso8601WithFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let iso8601: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    func configure(baseURL: URL, accessToken: String?, refreshToken: String? = nil) {
        self.baseURL = baseURL
        self.accessToken = accessToken
        self.refreshToken = refreshToken
    }

    /// Update tokens without touching the base URL — used by the 401 refresh path
    /// and by `AuthStore` after a successful login.
    func updateTokens(accessToken: String?, refreshToken: String?) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
    }

    // MARK: - Base URL resolution

    private static func defaultBaseURL() -> URL {
        if let plistValue = Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String {
            let trimmed = plistValue.trimmingCharacters(in: .whitespacesAndNewlines)
            // xcconfig values that weren't wired up resolve to the literal
            // "$(API_BASE_URL)" — ignore those.
            if !trimmed.isEmpty, !trimmed.hasPrefix("$("), let url = URL(string: trimmed) {
                return url
            }
        }
        return URL(string: "https://strikelab.golf/api")!
    }

    // MARK: - Generic request

    enum Method: String { case get = "GET", post = "POST", put = "PUT", patch = "PATCH", delete = "DELETE" }

    private func url(for path: String) -> URL {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            return baseURL.appending(path: path)
        }

        let split = path.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false)
        let rawPath = String(split.first ?? "")
        let query = split.count > 1 ? String(split[1]) : nil

        let basePath = components.percentEncodedPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let requestPath = rawPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        components.percentEncodedPath = "/" + [basePath, requestPath]
            .filter { !$0.isEmpty }
            .joined(separator: "/")

        if let query, !query.isEmpty {
            components.percentEncodedQuery = query
        }

        return components.url ?? baseURL.appending(path: rawPath)
    }

    func request<Body: Encodable, Response: Decodable>(
        _ path: String,
        method: Method = .get,
        body: Body? = nil,
        responseType: Response.Type = Response.self
    ) async throws -> Response {
        do {
            return try await performRequest(path, method: method, body: body, responseType: responseType)
        } catch SLAPIError.unauthorized {
            // One refresh attempt, then retry the original request.
            guard try await performTokenRefresh() else {
                onSessionExpired?()
                throw SLAPIError.unauthorized
            }
            return try await performRequest(path, method: method, body: body, responseType: responseType)
        }
    }

    private func performRequest<Body: Encodable, Response: Decodable>(
        _ path: String,
        method: Method,
        body: Body?,
        responseType: Response.Type
    ) async throws -> Response {
        let url = url(for: path)
        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let accessToken {
            req.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw SLAPIError.network }

        if http.statusCode == 401 {
            throw SLAPIError.unauthorized
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = (try? decoder.decode(ErrorResponse.self, from: data))?.detail
            throw SLAPIError.server(http.statusCode, detail)
        }
        if Response.self == EmptyResponse.self {
            return EmptyResponse() as! Response
        }
        return try decoder.decode(Response.self, from: data)
    }

    /// POST /auth/refresh with the stored refresh token. Returns false when
    /// no refresh is possible (no token, or server rejected it).
    private func performTokenRefresh() async throws -> Bool {
        guard let refreshToken else { return false }
        let url = url(for: "/auth/refresh")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try encoder.encode(RefreshRequest(refreshToken: refreshToken))

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            return false
        }
        let tokens = try decoder.decode(TokenPair.self, from: data)
        self.accessToken = tokens.accessToken
        self.refreshToken = tokens.refreshToken ?? self.refreshToken
        NotificationCenter.default.post(
            name: .strikeLabTokensRefreshed,
            object: nil,
            userInfo: [
                "access_token": tokens.accessToken,
                "refresh_token": tokens.refreshToken ?? self.refreshToken ?? ""
            ]
        )
        return true
    }

    func get<Response: Decodable>(_ path: String, responseType: Response.Type = Response.self) async throws -> Response {
        try await request(path, method: .get, body: Optional<EmptyBody>.none, responseType: responseType)
    }

    func post<Body: Encodable, Response: Decodable>(_ path: String, body: Body) async throws -> Response {
        try await request(path, method: .post, body: body)
    }

    func postVoid<Body: Encodable>(_ path: String, body: Body) async throws {
        let _: EmptyResponse = try await request(path, method: .post, body: body)
    }

    func uploadFile<Response: Decodable>(
        _ path: String,
        fileURL: URL,
        fieldName: String = "file",
        mimeType: String = "audio/x-caf",
        responseType: Response.Type = Response.self
    ) async throws -> Response {
        do {
            return try await performUpload(path, fileURL: fileURL, fieldName: fieldName, mimeType: mimeType, responseType: responseType)
        } catch SLAPIError.unauthorized {
            guard try await performTokenRefresh() else {
                onSessionExpired?()
                throw SLAPIError.unauthorized
            }
            return try await performUpload(path, fileURL: fileURL, fieldName: fieldName, mimeType: mimeType, responseType: responseType)
        }
    }

    private func performUpload<Response: Decodable>(
        _ path: String,
        fileURL: URL,
        fieldName: String,
        mimeType: String,
        responseType: Response.Type
    ) async throws -> Response {
        let url = url(for: path)

        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = Method.post.rawValue
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let accessToken {
            req.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        let filename = fileURL.lastPathComponent
        let fileData = try Data(contentsOf: fileURL)
        var body = Data()
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(filename)\"\r\n")
        body.append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n")
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw SLAPIError.network }
        if http.statusCode == 401 {
            throw SLAPIError.unauthorized
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = (try? decoder.decode(ErrorResponse.self, from: data))?.detail
            throw SLAPIError.server(http.statusCode, detail)
        }
        return try decoder.decode(Response.self, from: data)
    }
}

private extension Data {
    mutating func append(_ string: String) {
        append(Data(string.utf8))
    }
}

struct EmptyBody: Encodable {}
struct EmptyResponse: Decodable {}

struct ErrorResponse: Decodable {
    let detail: String?
}

private struct RefreshRequest: Encodable {
    let refreshToken: String
}

private struct TokenPair: Decodable {
    let accessToken: String
    let refreshToken: String?
}

extension Notification.Name {
    static let strikeLabTokensRefreshed = Notification.Name("strikeLabTokensRefreshed")
}

/// Renamed to avoid colliding with `APIError` defined in
/// `Managers/GolfCourseAPIManager.swift` (legacy public-API integration).
enum SLAPIError: Error {
    case network
    case unauthorized
    case server(Int, String?)
}
