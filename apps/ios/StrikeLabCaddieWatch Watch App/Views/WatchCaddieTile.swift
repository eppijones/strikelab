//
//  WatchCaddieTile.swift
//  StrikeLabCaddieWatch Watch App
//
//  On-course glance: yards to pin, recommended club, commit phrase.
//

import SwiftUI
import WatchKit
import CoreLocation

struct WatchCaddieTile: View {
    @EnvironmentObject var connectivity: WatchConnectivityManagerWatch
    @EnvironmentObject var locationManager: WatchLocationManager

    var onTapOpenPicker: () -> Void
    var onDoubleTapCommit: () -> Void

    var body: some View {
        let yards = resolvedYards()
        let age = ageString()
        let playsLike = connectivity.caddiePlaysLikeYards
        let wind = connectivity.caddieWindMph
        let confidence = connectivity.caddieConfidence

        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text("TO PIN")
                    .font(SLW.mono(8, weight: .semibold))
                    .tracking(1.2)
                    .foregroundColor(SLW.ink3)
                Spacer()
                if let age {
                    Text(age)
                        .font(SLW.mono(7))
                        .foregroundColor(SLW.ink3)
                }
            }
            Text(connectivity.unitsSystem.format(yards: Double(yards)))
                .font(SLW.num(26))
                .foregroundColor(SLW.ink)

            HStack(spacing: 6) {
                if let playsLike, playsLike != yards {
                    chip("PLAYS \(connectivity.unitsSystem.format(yards: Double(playsLike)))")
                }
                if let wind {
                    chip("WIND \(Int(wind.rounded()))")
                }
                if let confidence {
                    chip("\(Int((confidence * 100).rounded()))%")
                }
            }

            Text("REC · \(connectivity.caddieClubRaw.uppercased())")
                .font(SLW.mono(9, weight: .semibold))
                .tracking(1.0)
                .foregroundColor(SLW.accent)

            Text(connectivity.caddieCommit)
                .font(.system(size: 11, weight: .regular, design: .serif))
                .italic()
                .foregroundColor(SLW.ink2)
                .lineLimit(2)
                .minimumScaleFactor(0.8)

            if !connectivity.caddieHazardNote.isEmpty {
                Text(connectivity.caddieHazardNote)
                    .font(SLW.mono(8))
                    .foregroundColor(SLW.warn)
                    .lineLimit(1)
            } else if !connectivity.caddieSource.isEmpty {
                Text(connectivity.caddieSource.uppercased())
                    .font(SLW.mono(7))
                    .foregroundColor(SLW.ink3)
                    .lineLimit(1)
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(SLW.surface)
        .overlay(Rectangle().stroke(SLW.accent.opacity(0.35), lineWidth: 1))
        .contentShape(Rectangle())
        .onTapGesture { onTapOpenPicker() }
        .highPriorityGesture(
            TapGesture(count: 2).onEnded { _ in onDoubleTapCommit() }
        )
    }

    private func resolvedYards() -> Int {
        if let loc = locationManager.lastLocation,
           let pin = connectivity.holePins[connectivity.caddieHole] {
            let pinLoc = CLLocation(latitude: pin.latitude, longitude: pin.longitude)
            let y = max(0, loc.distance(from: pinLoc) * 1.09361)
            return Int(y.rounded())
        }
        return connectivity.caddieDistanceYards
    }

    private func ageString() -> String? {
        guard let t = connectivity.caddieUpdatedAt else { return nil }
        let s = Int(Date().timeIntervalSince(t))
        if s < 2 { return nil }
        return "\(s)s ago"
    }

    private func chip(_ text: String) -> some View {
        Text(text)
            .font(SLW.mono(7, weight: .semibold))
            .foregroundColor(SLW.accent)
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
            .background(SLW.accent.opacity(0.12))
    }
}
