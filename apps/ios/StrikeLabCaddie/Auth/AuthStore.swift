import Foundation
import Combine
import ClerkKit

/// Authoritative auth state for the iOS app. Persists access + refresh
/// tokens to the Keychain and hands them to `APIClient` on launch.
///
/// Uses Clerk session tokens stored in Keychain and sent to the production
/// StrikeLab API.
@MainActor
final class AuthStore: ObservableObject {
    static let shared = AuthStore()
    static var isClerkConfigured = false

    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var email: String? = nil
    @Published var errorMessage: String? = nil
    @Published var isSigningIn: Bool = false

    private var refreshObserver: NSObjectProtocol?

    init() {
        hydrateFromKeychain()
        APIClient.shared.onSessionExpired = { [weak self] in
            Task { @MainActor in await self?.signOut() }
        }
        refreshObserver = NotificationCenter.default.addObserver(
            forName: .strikeLabTokensRefreshed,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let info = note.userInfo,
                  let access = info["access_token"] as? String else { return }
            let refresh = info["refresh_token"] as? String
            KeychainStore.set(access, for: "access_token")
            if let refresh, !refresh.isEmpty {
                KeychainStore.set(refresh, for: "refresh_token")
            }
            Task { @MainActor in self?.hydrateFromKeychain() }
        }
    }

    deinit {
        if let refreshObserver {
            NotificationCenter.default.removeObserver(refreshObserver)
        }
    }

    private func hydrateFromKeychain() {
        let access = KeychainStore.get("access_token")
        let refresh = KeychainStore.get("refresh_token")
        email = KeychainStore.get("user_email")
        if let access, !access.isEmpty {
            APIClient.shared.updateTokens(accessToken: access, refreshToken: refresh)
            isAuthenticated = true
        } else {
            isAuthenticated = false
        }
    }

    func hydrateFromClerkIfAvailable() async {
        guard Self.isClerkConfigured else {
            hydrateFromKeychain()
            return
        }
        do {
            guard let token = try await Clerk.shared.auth.getToken() else { return }
            KeychainStore.set(token, for: "access_token")
            KeychainStore.set(nil, for: "refresh_token")
            APIClient.shared.updateTokens(accessToken: token, refreshToken: nil)
            let user: AuthenticatedUser = try await APIClient.shared.get("/auth/me")
            email = KeychainStore.get("user_email")
            if email == nil {
                KeychainStore.set(user.email, for: "user_email")
                email = user.email
            }
            isAuthenticated = true
        } catch {
            clearStoredSession()
        }
    }

    func signIn(email: String, password: String) async {
        guard Self.isClerkConfigured else {
            errorMessage = "Sign-in is unavailable in this build."
            return
        }
        isSigningIn = true
        errorMessage = nil
        defer { isSigningIn = false }
        do {
            _ = try await Clerk.shared.auth.signInWithPassword(identifier: email, password: password)
            guard let token = try await Clerk.shared.auth.getToken() else {
                throw SLAPIError.unauthorized
            }
            KeychainStore.set(token, for: "access_token")
            KeychainStore.set(nil, for: "refresh_token")
            KeychainStore.set(email, for: "user_email")
            APIClient.shared.updateTokens(accessToken: token, refreshToken: nil)
            let user: AuthenticatedUser = try await APIClient.shared.get("/auth/me")
            KeychainStore.set(user.email, for: "user_email")
            self.email = user.email
            self.isAuthenticated = true
        } catch SLAPIError.unauthorized {
            clearStoredSession()
            errorMessage = "Invalid email or password."
        } catch SLAPIError.server(_, let detail) {
            clearStoredSession()
            errorMessage = friendlyAuthErrorMessage(detail, fallback: "Sign-in failed. Try again.")
        } catch {
            clearStoredSession()
            errorMessage = friendlyAuthErrorMessage(error.localizedDescription, fallback: "Couldn't reach StrikeLab. Check your connection and try again.")
        }
    }

    func signInWithGoogle() async {
        await completeSocialSignIn {
            try await Clerk.shared.auth.signInWithOAuth(provider: .google)
        }
    }

    func signInWithApple() async {
        await completeSocialSignIn {
            try await Clerk.shared.auth.signInWithApple()
        }
    }

    func register(email: String, password: String, displayName: String) async {
        guard Self.isClerkConfigured else {
            errorMessage = "Account creation is unavailable in this build."
            return
        }
        isSigningIn = true
        errorMessage = nil
        defer { isSigningIn = false }
        do {
            var signUp = try await Clerk.shared.auth.signUp(
                emailAddress: email,
                password: password,
                firstName: displayName,
                legalAccepted: true
            )
            signUp = try await signUp.sendEmailCode()
            errorMessage = "Check your email for the Clerk verification code, then sign in."
            if let token = try await Clerk.shared.auth.getToken() {
                KeychainStore.set(token, for: "access_token")
                APIClient.shared.updateTokens(accessToken: token, refreshToken: nil)
                let user: AuthenticatedUser = try await APIClient.shared.get("/auth/me")
                KeychainStore.set(user.email, for: "user_email")
                self.email = user.email
                self.isAuthenticated = true
            }
            KeychainStore.set(email, for: "user_email")
            if self.email == nil {
                self.email = email
            }
        } catch SLAPIError.server(_, let detail) {
            clearStoredSession()
            errorMessage = friendlyAuthErrorMessage(detail, fallback: "Couldn't create account.")
        } catch {
            clearStoredSession()
            errorMessage = friendlyAuthErrorMessage(error.localizedDescription, fallback: "Couldn't create your account. Try Google or Apple if you already used that email.")
        }
    }

    func deleteAccount() async throws {
        let _: EmptyResponse = try await APIClient.shared.request(
            "/auth/me",
            method: .delete,
            body: Optional<EmptyBody>.none,
            responseType: EmptyResponse.self
        )
        await signOut()
    }

    func signOut() async {
        if Self.isClerkConfigured {
            try? await Clerk.shared.auth.signOut()
        }
        clearStoredSession()
    }

    private func clearStoredSession() {
        KeychainStore.clearAll()
        APIClient.shared.updateTokens(accessToken: nil, refreshToken: nil)
        email = nil
        isAuthenticated = false
    }

    private func completeSocialSignIn(_ start: () async throws -> Any) async {
        guard Self.isClerkConfigured else {
            errorMessage = "Sign-in is unavailable in this build."
            return
        }
        isSigningIn = true
        errorMessage = nil
        defer { isSigningIn = false }
        do {
            _ = try await start()
            guard let token = try await Clerk.shared.auth.getToken() else {
                throw SLAPIError.unauthorized
            }
            KeychainStore.set(token, for: "access_token")
            KeychainStore.set(nil, for: "refresh_token")
            APIClient.shared.updateTokens(accessToken: token, refreshToken: nil)
            let user: AuthenticatedUser = try await APIClient.shared.get("/auth/me")
            KeychainStore.set(user.email, for: "user_email")
            self.email = user.email
            self.isAuthenticated = true
        } catch SLAPIError.unauthorized {
            clearStoredSession()
            errorMessage = "Couldn't verify your StrikeLab session. Try again."
        } catch SLAPIError.server(_, let detail) {
            clearStoredSession()
            errorMessage = friendlyAuthErrorMessage(detail, fallback: "StrikeLab couldn't verify this account.")
        } catch {
            clearStoredSession()
            errorMessage = friendlyAuthErrorMessage(error.localizedDescription, fallback: "Couldn't complete sign-in. Check your connection and try again.")
        }
    }

    private func friendlyAuthErrorMessage(_ message: String?, fallback: String) -> String {
        let raw = message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !raw.isEmpty else { return fallback }
        let lower = raw.lowercased()

        if lower.contains("verification strategy") || lower.contains("strategy is not valid") {
            return "This email is connected with Google or Apple. Continue with that provider to sign in."
        }
        if lower.contains("already") && lower.contains("exist") {
            return "You already have an account. Sign in instead, or continue with Google or Apple."
        }
        return raw
    }
}

private struct LoginRequest: Encodable {
    let email: String
    let password: String
}

private struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let displayName: String
}

private struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}

private struct AuthenticatedUser: Decodable {
    let email: String
}
