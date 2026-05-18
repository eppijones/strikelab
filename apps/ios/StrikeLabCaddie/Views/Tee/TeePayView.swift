//
//  TeePayView.swift
//  StrikeLabCaddie
//
//  Pay screen — Vipps universal-link app switch (iOS), Apple Pay, Card.
//  Vipps is the default in NO; the orange CTA reflects that.
//

import SwiftUI
import PassKit

struct TeePayView: View {
    @EnvironmentObject var nav: TeeNavigation
    let hold: TeeHoldResponse
    let splitMode: String

    @State private var method: PayMethod = .vipps
    @State private var inFlight = false
    @State private var error: String?

    enum PayMethod: String, Hashable {
        case vipps, applePay = "apple_pay", card
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                betaDisclosure
                receiptCard
                methodPicker
                payCTA
                if let error {
                    Text(error)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(Theme.bad)
                }
            }
            .padding(18)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("One last step")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            TeeMicroLabel(text: "3 / 3")
            Text("Last step.")
                .font(.system(size: 32, weight: .medium))
                .foregroundColor(Theme.ink)
                .kerning(-1)
        }
    }

    private var betaDisclosure: some View {
        HStack(alignment: .top, spacing: 10) {
            BetaBadge()
            Text(ReleasePolicy.teeBetaDisclosure)
                .font(Theme.labelFont(10))
                .tracking(1.1)
                .foregroundColor(Theme.warn)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.warn.opacity(0.08))
        .overlay(Rectangle().stroke(Theme.warn.opacity(0.5), lineWidth: 1))
    }

    private var receiptCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            TeeMicroLabel(text: "RECEIPT")
            HStack(alignment: .firstTextBaseline) {
                Text(hold.courseName)
                    .font(.system(size: 16, weight: .medium))
                Spacer()
                Text(format(hold.teeTime))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(Theme.ink3)
            }
            Divider().background(Theme.lineStrong)
            HStack {
                Text("\(hold.players) × \(Int((hold.priceAmount ?? 0).rounded())) kr")
                    .font(.system(size: 12, design: .monospaced))
                Spacer()
                Text("\(Int((hold.totalAmount ?? ((hold.priceAmount ?? 0) * Double(hold.players))).rounded())) kr")
                    .font(.system(size: 12, design: .monospaced))
            }
            HStack {
                Text("Free cancellation up to 24h").font(.system(size: 11, design: .monospaced))
                Spacer()
                Text("✓").font(.system(size: 11, design: .monospaced))
            }
            .foregroundColor(Theme.ink3)
        }
        .padding(14)
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private var methodPicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            TeeMicroLabel(text: "PAY WITH")
            VStack(spacing: 10) {
                methodRow(.vipps, label: "Vipps", sub: "+47 ••• 12 34", glyphColor: Theme.warn, glyph: "V")
                methodRow(.applePay, label: "Apple Pay", sub: "Visa •• 4082", glyphColor: Theme.ink, glyph: "")
                methodRow(.card, label: "Card", sub: "Stripe · add card", glyphColor: Theme.ink3, glyph: "+")
            }
        }
    }

    private func methodRow(_ m: PayMethod, label: String, sub: String, glyphColor: Color, glyph: String) -> some View {
        Button { method = m } label: {
            HStack(spacing: 12) {
                Text(glyph)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Theme.bg)
                    .frame(width: 36, height: 36)
                    .background(glyphColor)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Theme.ink)
                    Text(sub)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(Theme.ink3)
                }
                Spacer()
                Circle()
                    .fill(method == m ? Theme.accent : .clear)
                    .frame(width: 18, height: 18)
                    .overlay(Circle().stroke(method == m ? Theme.accent : Theme.lineStrong, lineWidth: 1))
            }
            .padding(12)
            .background(Theme.surfaceSolid)
            .overlay(Rectangle().stroke(method == m ? Theme.accent : Theme.lineStrong, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var payCTA: some View {
        Button {
            Task { await pay() }
        } label: {
            HStack {
                if inFlight {
                    ProgressView().tint(method == .vipps ? Theme.bg : Theme.accentInk)
                } else {
                    Text(payLabel)
                        .font(.system(size: 13, weight: .semibold, design: .monospaced))
                        .tracking(1.4)
                }
            }
            .foregroundColor(method == .vipps ? Theme.bg : Theme.accentInk)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(method == .vipps ? Theme.warn : Theme.accent)
        }
        .disabled(inFlight)
    }

    private var payLabel: String {
        let total = hold.totalAmount ?? ((hold.priceAmount ?? 0) * Double(hold.players))
        switch method {
        case .vipps: return "SIMULATE VIPPS · \(Int(total.rounded())) kr →"
        case .applePay: return "SIMULATE APPLE PAY · \(Int(total.rounded())) kr →"
        case .card: return "SIMULATE CARD · \(Int(total.rounded())) kr →"
        }
    }

    private func pay() async {
        inFlight = true
        defer { inFlight = false }
        do {
            // Vipps universal-link app switch — open Vipps to authorize before
            // we hit /confirm so the user sees the canonical Vipps prompt.
            // In V1 this is best-effort: if Vipps isn't installed the system
            // prompt will offer the App Store; we still complete the booking
            // server-side via the stub initiation path.
            if method == .vipps {
                let url = URL(string: "vipps://")
                if let url, UIApplication.shared.canOpenURL(url) {
                    await MainActor.run {
                        UIApplication.shared.open(url)
                    }
                }
            }
            let payload = TeeConfirmRequest(
                holdId: hold.id,
                paymentMethod: method.rawValue,
                paymentToken: "beta_stub",
                splitMode: splitMode,
                notes: "StrikeLab Tee Beta internal/stubbed checkout"
            )
            let resp = try await TeeAPIClient.shared.confirm(payload)
            nav.push(.pass(bookingId: resp.bookingId))
        } catch {
            self.error = TeeUserFacingError.message(for: error)
        }
    }

    private func format(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE, d MMM · HH:mm"
        return f.string(from: d)
    }
}
