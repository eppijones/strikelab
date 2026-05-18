//
//  TeeCountdownView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Complication-style countdown card for the next StrikeLab Tee booking.
//  The phone pushes the next-up booking via WCSession application context;
//  this view reads it from `WatchConnectivityManagerWatch` and renders a
//  big TIME / READY-IN tile with course name + weather glyph. Tapping the
//  view asks the iPhone to open the Pass.
//

import SwiftUI

/// Slim DTO mirrored from the phone via application context. Kept minimal
/// (10 fields) so it fits in a single `application context` payload.
struct WatchTeeBooking: Codable, Hashable {
    let bookingId: String
    let courseName: String
    let teeTime: Date
    let checkInCode: String?
    let forecastTempC: Double?
    let forecastWindMs: Double?
    let forecastState: String?
    let driveMin: Int?

    static let dictKey = "next_tee_booking"
}

struct TeeCountdownView: View {
    @EnvironmentObject var connectivity: WatchConnectivityManagerWatch
    @State private var now = Date()
    @State private var timer: Timer?

    var body: some View {
        Group {
            if let booking = connectivity.nextTeeBooking {
                tile(for: booking)
            } else {
                empty
            }
        }
        .onAppear {
            timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
                Task { @MainActor in self.now = Date() }
            }
        }
        .onDisappear { timer?.invalidate(); timer = nil }
    }

    @ViewBuilder
    private func tile(for booking: WatchTeeBooking) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Circle().fill(Color.green).frame(width: 5, height: 5)
                Text("READY IN")
                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundColor(.gray)
                Spacer()
                if let state = booking.forecastState {
                    Text(state.uppercased())
                        .font(.system(size: 9, weight: .semibold, design: .monospaced))
                        .foregroundColor(weatherColor(state))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
            }
            Text(formatCountdown(seconds: max(0, Int(booking.teeTime.timeIntervalSince(now)))))
                .font(.system(size: 28, weight: .medium, design: .monospaced))
                .foregroundColor(.green)
            Text(booking.courseName)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.75)
            HStack(spacing: 6) {
                Text(format(booking.teeTime))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.white.opacity(0.85))
                if let t = booking.forecastTempC {
                    Text("\(Int(t.rounded()))°")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.white.opacity(0.7))
                }
                if let w = booking.forecastWindMs {
                    Text("\(Int(w.rounded())) m/s")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            if let code = booking.checkInCode {
                Text(code)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .tracking(2)
                    .foregroundColor(.green.opacity(0.9))
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.black.opacity(0.6))
        .cornerRadius(2)
        .overlay(
            RoundedRectangle(cornerRadius: 2)
                .stroke(Color.green.opacity(0.4), lineWidth: 1)
        )
        .onTapGesture {
            connectivity.requestOpenPass(bookingId: booking.bookingId)
        }
    }

    private var empty: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("NO BOOKING")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .tracking(1.4)
                .foregroundColor(.gray)
            Text("Open Tee on iPhone to book a round.")
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.7))
        }
        .padding(10)
    }

    private func format(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: d)
    }

    private func formatCountdown(seconds: Int) -> String {
        let h = seconds / 3600
        let m = (seconds % 3600) / 60
        let s = seconds % 60
        if h > 0 { return "\(h)t \(m)m" }
        if m > 0 { return "\(m)m \(s)s" }
        return "\(s)s"
    }

    private func weatherColor(_ state: String) -> Color {
        switch state.lowercased() {
        case "rain": return .red
        case "showers": return .orange
        default: return .green
        }
    }
}
