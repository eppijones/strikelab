//
//  TeePassView.swift
//  StrikeLabCaddie
//
//  The mobile boarding pass — big tee time + live countdown + QR + Wallet.
//

import SwiftUI
import Combine
import PassKit

struct TeePassView: View {
    @EnvironmentObject var nav: TeeNavigation
    @EnvironmentObject var watchConnectivity: WatchConnectivityManager
    let bookingId: UUID

    @State private var pass: TeePassResponse?
    @State private var error: String?
    @State private var now: Date = Date()
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let pass {
                    header(pass: pass)
                    ticket(pass: pass)
                    actions(pass: pass)
                    systemLoop(pass: pass)
                    cancelButton(pass: pass)
                } else if let error {
                    Text(error).font(.system(size: 12, design: .monospaced))
                        .foregroundColor(Theme.bad)
                } else {
                    ProgressView().tint(Theme.accent)
                }
            }
            .padding(18)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Pass")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .onReceive(timer) { _ in self.now = Date() }
    }

    private func header(pass: TeePassResponse) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Circle().fill(Theme.accent).frame(width: 6, height: 6)
                TeeMicroLabel(text: pass.status.uppercased())
            }
            Text("You're in.")
                .font(.system(size: 38, weight: .medium))
                .foregroundColor(Theme.ink)
                .kerning(-1.4)
            Text("We'll remind you 1 hour before.")
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(Theme.ink3)
        }
    }

    private func ticket(pass: TeePassResponse) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            TeeHeroLandscape(kind: TeeHeroKind(rawCourseType: pass.courseType), height: 100)
            VStack(alignment: .leading, spacing: 12) {
                TeeMicroLabel(
                    text: [pass.courseCity, pass.courseRegion]
                        .compactMap { $0 }.joined(separator: " · ")
                        .uppercased()
                )
                Text(pass.courseName)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundColor(Theme.ink)

                Divider().background(Theme.lineStrong)
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        TeeMicroLabel(text: "YOUR TEE TIME")
                        Text(format(pass.teeTime))
                            .font(.system(size: 36, weight: .medium, design: .monospaced))
                            .foregroundColor(Theme.ink)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        TeeMicroLabel(text: "READY IN")
                        Text(formatCountdown(secondsUntil(pass.teeTime)))
                            .font(.system(size: 22, weight: .medium, design: .monospaced))
                            .foregroundColor(Theme.accent)
                    }
                }
                Divider().background(Theme.lineStrong)
                HStack(spacing: 12) {
                    if let t = pass.forecastTempC {
                        Text("\(Int(t.rounded()))°")
                    }
                    if let w = pass.forecastWindMs {
                        Text("\(Int(w.rounded())) m/s \(pass.forecastWindDir ?? "")")
                    }
                    Text((pass.forecastState ?? "DRY").uppercased())
                        .foregroundColor(
                            pass.forecastState == "rain" ? Theme.bad :
                            pass.forecastState == "showers" ? Theme.warn :
                            Theme.accent
                        )
                    Spacer()
                    if let m = pass.driveMin {
                        Text("DRIVE \(m) MIN")
                            .foregroundColor(Theme.ink3)
                    }
                }
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(Theme.ink2)

                if let code = pass.checkInCode {
                    Divider().background(Theme.lineStrong)
                    HStack(spacing: 16) {
                        TeeFauxQR()
                        VStack(alignment: .leading, spacing: 4) {
                            TeeMicroLabel(text: "SHARE CODE")
                            Text(code)
                                .font(.system(size: 22, weight: .medium, design: .monospaced))
                                .tracking(2)
                                .foregroundColor(Theme.ink)
                            Text("Show at pro shop")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(Theme.ink3)
                        }
                        Spacer()
                    }
                }
            }
            .padding(14)
        }
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func actions(pass: TeePassResponse) -> some View {
        HStack(spacing: 10) {
            Button {
                addToWallet(pass: pass)
            } label: {
                Text("ADD TO WALLET")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Theme.surfaceSolid)
                    .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
            }
            Button {
                if let mins = pass.driveMin {
                    print("driving for \(mins) min")
                }
            } label: {
                Text("DRIVE \(pass.driveMin.map { "\($0) MIN" } ?? "—")")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .tracking(1.6)
                    .foregroundColor(Theme.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Theme.surfaceSolid)
                    .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
            }
        }
    }

    private func systemLoop(pass: TeePassResponse) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            TeeMicroLabel(text: "STRIKELAB")
            Text("Coach prepared a 12-min warmup based on conditions.")
                .font(.system(size: 14))
                .foregroundColor(Theme.ink2)
            HStack(spacing: 10) {
                NavigationLink(value: TeeNavigation.Route.preferences) {
                    Text("OPEN TRAINING →")
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.accentInk)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Theme.accent)
                }
                Button {
                    NotificationCenter.default.post(
                        name: .startRoundFromPass,
                        object: nil,
                        userInfo: [
                            "courseId": pass.courseId?.uuidString as Any,
                            "teeTime": pass.teeTime
                        ]
                    )
                } label: {
                    Text("START ROUND →")
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Theme.surfaceSolid)
                        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surfaceSolid)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
    }

    private func cancelButton(pass: TeePassResponse) -> some View {
        Group {
            if pass.status == "confirmed" {
                Button {
                    Task {
                        try? await TeeAPIClient.shared.cancel(bookingId: pass.bookingId)
                        await load()
                    }
                } label: {
                    Text("CANCEL BOOKING")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .tracking(1.6)
                        .foregroundColor(Theme.bad)
                }
            }
        }
    }

    private func load() async {
        do {
            let p = try await TeeAPIClient.shared.pass(bookingId: bookingId)
            self.pass = p
            // Push the latest booking to the watch so the countdown card on
            // the start screen always reflects the most recent confirmed
            // booking.
            watchConnectivity.sendNextTeeBooking(
                PhoneTeeBookingPayload(
                    bookingId: p.bookingId.uuidString,
                    courseName: p.courseName,
                    teeTime: p.teeTime,
                    checkInCode: p.checkInCode,
                    forecastTempC: p.forecastTempC,
                    forecastWindMs: p.forecastWindMs,
                    forecastState: p.forecastState,
                    driveMin: p.driveMin
                )
            )
        } catch {
            self.error = "\(error)"
        }
    }

    private func addToWallet(pass: TeePassResponse) {
        // V1 stub: a real .pkpass is generated server-side in Phase 2 once
        // we have a signed Apple Pass cert. Until then we share the QR code.
        guard let qr = pass.qrCode, let url = URL(string: qr) else { return }
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        root.present(av, animated: true)
    }

    private func format(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }

    private func secondsUntil(_ d: Date) -> Int {
        max(0, Int(d.timeIntervalSince(now)))
    }

    private func formatCountdown(_ s: Int) -> String {
        guard s > 0 else { return "—" }
        let h = s / 3600
        let m = (s % 3600) / 60
        return h > 0 ? "\(h)t \(m)m" : "\(m)m"
    }
}

extension Notification.Name {
    static let startRoundFromPass = Notification.Name("StrikeLab.Tee.StartRoundFromPass")
}

// MARK: - Faux QR canvas (deterministic; visually convincing for V1)

struct TeeFauxQR: View {
    var size: CGFloat = 84
    var body: some View {
        Canvas { ctx, _ in
            let cells = 17
            let cs = size / CGFloat(cells)
            var seed: UInt64 = 1
            func rnd() -> Double {
                seed = (seed &* 9301 &+ 49297) % 233280
                return Double(seed) / 233280.0
            }
            ctx.fill(Path(CGRect(origin: .zero, size: CGSize(width: size, height: size))),
                     with: .color(Theme.bg2))
            for y in 0..<cells {
                for x in 0..<cells {
                    let inFinder =
                        (x < 7 && y < 7) ||
                        (x >= cells - 7 && y < 7) ||
                        (x < 7 && y >= cells - 7)
                    let on: Bool
                    if inFinder {
                        on = x == 0 || y == 0 || x == 6 || y == 6 ||
                             x == cells - 7 || x == cells - 1 ||
                             y == cells - 7 || y == cells - 1 ||
                             (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
                             (x >= cells - 5 && x <= cells - 3 && y >= 2 && y <= 4) ||
                             (x >= 2 && x <= 4 && y >= cells - 5 && y <= cells - 3)
                    } else {
                        on = rnd() > 0.55
                    }
                    if on {
                        let r = CGRect(x: CGFloat(x) * cs, y: CGFloat(y) * cs, width: cs, height: cs)
                        ctx.fill(Path(r), with: .color(Theme.ink))
                    }
                }
            }
        }
        .frame(width: size, height: size)
    }
}
