import AuthenticationServices
import SwiftUI

/// Minimal sign-in / sign-up screen for the iOS Caddie. Posts to
/// `/auth/login` or `/auth/register` and stores the resulting tokens in
/// `AuthStore` (Keychain-backed).
struct LoginView: View {
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var settingsManager: AppSettingsManager

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var acceptedLegal = false
    @AppStorage("rememberSignInAccount") private var rememberSignInAccount = true
    @AppStorage("rememberedSignInEmail") private var rememberedSignInEmail = ""

    enum Mode { case signIn, signUp }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            VStack(spacing: 20) {
                Spacer()

                VStack(spacing: 6) {
                    Text("STRIKELAB")
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                        .tracking(2)
                        .foregroundColor(Theme.ink3)
                    Text(mode == .signIn ? "Sign in" : "Create account")
                        .font(Theme.titleFont(28))
                        .foregroundColor(Theme.ink)
                }

                VStack(spacing: 12) {
                    socialButton(.google, title: "CONTINUE WITH GOOGLE") {
                        Task { await auth.signInWithGoogle() }
                    }
                    socialButton(.apple, title: "CONTINUE WITH APPLE") {
                        Task { await auth.signInWithApple() }
                    }

                    Text(mode == .signIn ? "OR SIGN IN WITH EMAIL" : "OR CREATE WITH EMAIL")
                        .font(Theme.labelFont(10))
                        .tracking(1.5)
                        .foregroundColor(Theme.ink3)
                        .padding(.top, 4)

                    if mode == .signUp {
                        field("Name", text: $displayName)
                    }
                    field("Email", text: $email, keyboard: .emailAddress, autocap: .never)
                    secureField("Password", text: $password)

                    Toggle(isOn: $rememberSignInAccount) {
                        Text("Remember this account on this device.")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink2)
                    }
                    .toggleStyle(SwitchToggleStyle(tint: Theme.accent))
                }
                .padding(.horizontal, 24)

                if let err = auth.errorMessage {
                    Text(err)
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.bad)
                        .padding(.horizontal, 24)
                }

                if mode == .signUp {
                    Toggle(isOn: $acceptedLegal) {
                        Text("I agree to the Terms and Privacy Policy.")
                            .font(Theme.labelFont(11))
                            .foregroundColor(Theme.ink2)
                    }
                    .toggleStyle(SwitchToggleStyle(tint: Theme.accent))
                    .padding(.horizontal, 24)

                    HStack(spacing: 14) {
                        Link("Terms", destination: ReleasePolicy.termsURL)
                        Link("Privacy", destination: ReleasePolicy.privacyURL)
                    }
                    .font(Theme.labelFont(10))
                    .tracking(1)
                    .foregroundColor(Theme.accent)
                }

                Button(action: submit) {
                    HStack {
                        if auth.isSigningIn {
                            ProgressView()
                                .controlSize(.small)
                                .tint(Theme.bg)
                        } else {
                            Text(mode == .signIn ? "SIGN IN" : "CREATE ACCOUNT")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .tracking(2)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Theme.accent)
                    .foregroundColor(Theme.bg)
                }
                .disabled(auth.isSigningIn || !canSubmit)
                .padding(.horizontal, 24)

                Button(action: { mode = (mode == .signIn ? .signUp : .signIn); auth.errorMessage = nil }) {
                    Text(mode == .signIn ? "Need an account? Sign up" : "Already have an account? Sign in")
                        .font(Theme.labelFont(11))
                        .tracking(1)
                        .foregroundColor(Theme.ink2)
                }

                Spacer()
            }
        }
        .onAppear {
            if rememberSignInAccount && email.isEmpty {
                email = rememberedSignInEmail
            }
        }
    }

    private var canSubmit: Bool {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedEmail.isEmpty, password.count >= 4 else { return false }
        if mode == .signUp && displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return false
        }
        if mode == .signUp && !acceptedLegal {
            return false
        }
        return true
    }

    private func submit() {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        updateRememberedEmail(trimmedEmail)
        Task {
            switch mode {
            case .signIn:
                await auth.signIn(email: trimmedEmail, password: password)
            case .signUp:
                await auth.register(
                    email: trimmedEmail,
                    password: password,
                    displayName: displayName.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            }
        }
    }

    private func updateRememberedEmail(_ trimmedEmail: String) {
        if rememberSignInAccount {
            rememberedSignInEmail = trimmedEmail
        } else {
            rememberedSignInEmail = ""
        }
    }

    @ViewBuilder
    private func field(
        _ placeholder: String,
        text: Binding<String>,
        keyboard: UIKeyboardType = .default,
        autocap: TextInputAutocapitalization = .sentences
    ) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard)
            .textInputAutocapitalization(autocap)
            .autocorrectionDisabled()
            .padding(.horizontal, 14)
            .frame(height: 44)
            .background(Theme.surfaceSolid)
            .foregroundColor(Theme.ink)
            .overlay(
                RoundedRectangle(cornerRadius: 0)
                    .stroke(Theme.lineStrong, lineWidth: 1)
            )
    }

    private func secureField(_ placeholder: String, text: Binding<String>) -> some View {
        SecureField(placeholder, text: text)
            .padding(.horizontal, 14)
            .frame(height: 44)
            .background(Theme.surfaceSolid)
            .foregroundColor(Theme.ink)
            .overlay(
                RoundedRectangle(cornerRadius: 0)
                    .stroke(Theme.lineStrong, lineWidth: 1)
            )
    }

    private enum SocialProvider {
        case google
        case apple
    }

    private func socialButton(_ provider: SocialProvider, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                socialMark(provider)
                Text(title)
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .tracking(1.5)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 46)
            .background(Theme.surfaceSolid)
            .foregroundColor(Theme.ink)
            .overlay(
                RoundedRectangle(cornerRadius: 0)
                    .stroke(Theme.lineStrong, lineWidth: 1)
            )
        }
        .disabled(auth.isSigningIn)
    }

    @ViewBuilder
    private func socialMark(_ provider: SocialProvider) -> some View {
        switch provider {
        case .google:
            Image("GoogleG")
                .resizable()
                .scaledToFit()
                .frame(width: 20, height: 20)
        case .apple:
            Image(systemName: "apple.logo")
                .font(.system(size: 20, weight: .semibold))
                .frame(width: 24)
        }
    }
}
