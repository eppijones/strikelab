import Foundation
import Combine
import ClerkKit

/// Authoritative auth state for the iOS app. Persists access + refresh
/// tokens to the Keychain and hands them to `APIClient` on launch.
///
/// Coexists with the legacy "paste a token in Profile" path
/// (`AppSettingsManager.strikeLabAccessToken`): if a Keychain access token
/// is present it wins; otherwise the legacy paste-token flow remains
/// available, so existing dev workflows aren't broken.
@MainActor
final class AuthStore: ObservableObject {
    static let shared = AuthStore()

    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var email: String? = nil
    @Published var errorMessage: String? = nil
    @Published var isSigningIn: Bool = false

    private var refreshObserver: NSObjectProtocol?

    init() {
        hydrateFromKeychain()
        APIClient.shared.onSessionExpired = { [weak self] in
            Task { @MainActor in self?.signOut() }
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
        do {
            guard let token = try await Clerk.shared.auth.getToken() else { return }
            KeychainStore.set(token, for: "access_token")
            KeychainStore.set(nil, for: "refresh_token")
            APIClient.shared.updateTokens(accessToken: token, refreshToken: nil)
            email = KeychainStore.get("user_email")
            isAuthenticated = true
        } catch {
            hydrateFromKeychain()
        }
    }

    func signIn(email: String, password: String) async {
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
            self.email = email
            self.isAuthenticated = true
        } catch SLAPIError.unauthorized {
            errorMessage = "Invalid email or password."
        } catch SLAPIError.server(_, let detail) {
            errorMessage = detail ?? "Sign-in failed. Try again."
        } catch {
            errorMessage = "Couldn't reach the StrikeLab API. Check your base URL in Profile → StrikeLab."
        }
    }

    func register(email: String, password: String, displayName: String) async {
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
                self.isAuthenticated = true
            }
            KeychainStore.set(email, for: "user_email")
            self.email = email
        } catch SLAPIError.server(_, let detail) {
            errorMessage = detail ?? "Couldn't create account."
        } catch {
            errorMessage = "Couldn't reach the StrikeLab API."
        }
    }

    func signOut() {
        Task { try? await Clerk.shared.auth.signOut() }
        KeychainStore.clearAll()
        APIClient.shared.updateTokens(accessToken: nil, refreshToken: nil)
        email = nil
        isAuthenticated = false
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
