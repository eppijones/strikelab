//
//  PressureFlowView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Watch-side surface for Phase 5 pressure mode. The phone is the
//  authority for the goal + diagnosis; the watch shows the active
//  shot clock and the session counter, and forwards every detected
//  swing through the same connectivity path as a range swing. Future
//  iterations push attempt/clock state back to the watch via a new
//  WCSession message; for v1 we display a status card the user can
//  glance at between attempts.
//

import Combine
import SwiftUI
import WatchKit

struct PressureFlowView: View {
    @EnvironmentObject var connectivityManager: WatchConnectivityManagerWatch
    @State private var clockSeconds: Int = 45
    @State private var isPaused = false
    @State private var clockRunning = true

    private let tick = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text("PRESSURE")
                    .font(SLW.mono(9, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(SLW.bad)
                Spacer()
                Text("LIVE FROM PHONE")
                    .font(SLW.mono(8))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink3)
            }

            VStack(spacing: 2) {
                Text("\(clockSeconds)")
                    .font(SLW.num(48))
                    .foregroundColor(clockSeconds <= 5 ? SLW.bad : SLW.ink)
                Text(isPaused ? "PAUSED" : "SHOT CLOCK")
                    .font(SLW.mono(9))
                    .tracking(1.4)
                    .foregroundColor(SLW.ink3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(SLW.surface)
            .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))

            HStack(spacing: 6) {
                Button {
                    isPaused.toggle()
                } label: {
                    Text(isPaused ? "RESUME" : "PAUSE")
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.4)
                        .foregroundColor(SLW.accentInk)
                        .frame(maxWidth: .infinity, minHeight: 28)
                        .background(SLW.surface2)
                }
                .buttonStyle(.plain)
                .overlay(Rectangle().stroke(SLW.line, lineWidth: 1))

                Button {
                    resetClock()
                } label: {
                    Text("RESET")
                        .font(SLW.mono(10, weight: .semibold))
                        .tracking(1.4)
                        .foregroundColor(SLW.accentInk)
                        .frame(maxWidth: .infinity, minHeight: 28)
                        .background(SLW.accent)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .containerBackground(SLW.bg, for: .navigation)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            clockRunning = true
            isPaused = false
            clockSeconds = 45
        }
        .onDisappear { clockRunning = false }
        .onReceive(tick) { _ in
            guard clockRunning else { return }
            guard !isPaused else { return }
            if clockSeconds <= 0 {
                return
            }
            clockSeconds -= 1
            if clockSeconds == 0 {
                Haptics.coaching(.failure)
                clockRunning = false
            } else if clockSeconds == 10 || clockSeconds == 5 {
                Haptics.coaching(.click)
            }
        }
    }

    private func resetClock() {
        clockRunning = true
        isPaused = false
        clockSeconds = 45
    }
}
