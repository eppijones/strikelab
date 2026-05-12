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
    @State private var showingApiBaseEditor = false
    @State private var showingDeveloperOptions = false

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
                    if mode == .signUp {
                        field("Name", text: $displayName)
                    }
                    field("Email", text: $email, keyboard: .emailAddress, autocap: .never)
                    secureField("Password", text: $password)
                }
                .padding(.horizontal, 24)

                if let err = auth.errorMessage {
                    Text(err)
                        .font(Theme.labelFont(11))
                        .foregroundColor(Theme.bad)
                        .padding(.horizontal, 24)
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

                Button(action: continueOffline) {
                    VStack(spacing: 4) {
                        Text("Continue offline")
                            .font(Theme.labelFont(11))
                            .tracking(1)
                            .foregroundColor(Theme.accent)
                        Text("Use rounds, scorecard, shots, and practice without the API.")
                            .font(Theme.labelFont(9))
                            .tracking(0.6)
                            .foregroundColor(Theme.ink3)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 24)

                Spacer()

                VStack(spacing: 8) {
                    Button("Developer options") {
                        showingDeveloperOptions = true
                    }
                    .font(Theme.labelFont(10))
                    .tracking(1)
                    .foregroundColor(Theme.ink3)
                }
                .padding(.bottom, 24)
            }
        }
        .sheet(isPresented: $showingApiBaseEditor) {
            ApiBaseEditorView()
                .environmentObject(settingsManager)
        }
        .confirmationDialog("Developer options", isPresented: $showingDeveloperOptions) {
            Button("Configure API base URL") { showingApiBaseEditor = true }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Current API: \(APIClient.shared.baseURL.absoluteString)")
        }
    }

    private var canSubmit: Bool {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedEmail.isEmpty, password.count >= 4 else { return false }
        if mode == .signUp && displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return false
        }
        return true
    }

    private func submit() {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
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

    private func continueOffline() {
        auth.errorMessage = nil
        settingsManager.localModeEnabled = true
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
}

private struct ApiBaseEditorView: View {
    @EnvironmentObject var settingsManager: AppSettingsManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("API base URL")) {
                    TextField("http://192.168.1.10:8000", text: $settingsManager.strikeLabApiBaseURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Text("Leave empty to use the bundled default (\(APIClient.shared.baseURL.absoluteString)).")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("API")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
