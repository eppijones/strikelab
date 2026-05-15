//
//  SwingConfirmer.swift
//  StrikeLabCaddieWatch Watch App
//
//  Converts raw motion-detected swing pulses into CONFIRMED strokes using
//  walk-away confirmation (Arccos / Shot Scope style), plus course fixes:
//
//    1. MotionManager detects a swing → recordCandidate(...)
//    2. While fixes stay within `coalesceRadius`, newer swings replace the
//       candidate (practice swings collapse to the last rehearsal).
//    3. A fix ≥ `confirmRadius` from the candidate location confirms a stroke.
//    4. On / near the green (≤25 m to pin) or explicit PUTTS field with a
//       sane distance read, the stroke confirms immediately — putts rarely
//       walk 10 m to satisfy (3).
//    5. Two swings on the same hole within ~2.5 s confirm the first then
//       start the second (OB + reload, tap-in miss + tap-in).
//    6. Starting a new candidate when GPS shows the player moved to a new
//       lie (> coalesceRadius) confirms the previous pending swing first so
//       we never drop a real stroke just because a new swing arrived.
//    7. Small wander (1 m … confirmRadius) after ~35 s without a full walk
//       still confirms (whiff + re-address).
//    8. Long idle without displacement expires the candidate as practice.
//

import Foundation
import CoreLocation
import Combine

@MainActor
final class SwingConfirmer: ObservableObject {

    // MARK: - Types

    struct Candidate: Equatable {
        let id: UUID
        let detectedAt: Date
        let location: CLLocation?
        let hole: Int
        let confidence: Double
        let capture: SwingCapture?
    }

    enum Status: Equatable {
        case idle
        case pending(Candidate)
        case justConfirmed(Date)
    }

    // MARK: - Outputs

    @Published private(set) var status: Status = .idle

    /// Fired when a swing is committed to the scorecard. `countsAsPutt`
    /// bumps both gross and putts on the watch (see `incrementStrokes`).
    var onShotConfirmed: ((Int, Candidate, Bool) -> Void)?

    var onCandidateDropped: ((Candidate, DropReason) -> Void)?

    enum DropReason { case replaced, expired, manualOverride }

    // MARK: - Tunables

    private let coalesceRadius: CLLocationDistance = 8
    private let confirmRadius: CLLocationDistance = 10
    private let expireAfter: TimeInterval = 180
    private let confirmFlashDuration: TimeInterval = 1.2

    /// Two swings inside this window on the same hole confirm the first
    /// before starting the second (reload / tap-in sequences).
    private let rapidFollowUpSeconds: TimeInterval = 2.5

    /// Near pin (meters) — immediate stroke confirmation without walk.
    private let immediateStrokePinMeters: CLLocationDistance = 25

    /// When this close to pin, auto strokes also increment putts.
    private let puttBandPinMeters: CLLocationDistance = 18

    /// With PUTTS field active, trust auto-putts out to this radius (m).
    private let puttsFieldMaxPinMeters: CLLocationDistance = 45

    // MARK: - State

    private(set) var pending: Candidate?

    /// Anchor for whiff-style displacement (first anchored fix for candidate).
    private var displacementAnchor: CLLocation?
    private var maxDisplacementFromAnchor: CLLocationDistance = 0

    // MARK: - Public API

    /// - Parameters:
    ///   - immediateStroke: Count this swing now (on green / putts mode).
    ///   - countsAsPutt: When `immediateStroke` is true, also bump putts when
    ///     we are on the green band or the user is editing putts nearby.
    func recordCandidate(
        at location: CLLocation?,
        hole: Int,
        confidence: Double,
        capture: SwingCapture? = nil,
        immediateStroke: Bool = false,
        countsAsPutt: Bool = false
    ) {
        let new = Candidate(
            id: capture?.id ?? UUID(),
            detectedAt: capture?.detectedAt ?? Date(),
            location: location,
            hole: hole,
            confidence: confidence,
            capture: capture
        )

        if immediateStroke {
            if let existing = pending {
                confirm(existing, countsAsPutt: false)
            }
            confirm(new, countsAsPutt: countsAsPutt)
            return
        }

        // Same-spot rehearsal must win over rapid follow-up (otherwise two
        // practice swings <2.5s apart would confirm the first as a stroke).
        if let existing = pending, existing.hole == hole {
            if let a = existing.location, let b = location, a.distance(from: b) <= coalesceRadius {
                onCandidateDropped?(existing, .replaced)
                pending = new
                status = .pending(new)
                seedDisplacement(for: new)
                return
            }
            if existing.location == nil && location == nil {
                onCandidateDropped?(existing, .replaced)
                pending = new
                status = .pending(new)
                seedDisplacement(for: new)
                return
            }
        }

        if let existing = pending,
           existing.hole == hole,
           new.detectedAt.timeIntervalSince(existing.detectedAt) < rapidFollowUpSeconds {
            confirm(existing, countsAsPutt: false)
            pending = new
            status = .pending(new)
            seedDisplacement(for: new)
            return
        }

        if let existing = pending {
            if let a = existing.location, let b = location, a.distance(from: b) > coalesceRadius {
                confirm(existing, countsAsPutt: false)
            } else {
                onCandidateDropped?(existing, .replaced)
            }
        }
        pending = new
        status = .pending(new)
        seedDisplacement(for: new)
    }

    func ingest(location: CLLocation) {
        guard let candidate = pending else { return }

        if candidate.location == nil {
            let filled = Candidate(
                id: candidate.id,
                detectedAt: candidate.detectedAt,
                location: location,
                hole: candidate.hole,
                confidence: candidate.confidence,
                capture: candidate.capture
            )
            pending = filled
            status = .pending(filled)
            if displacementAnchor == nil { displacementAnchor = location }
        }

        noteDisplacement(from: location)

        guard let candidateLoc = pending?.location else { return }
        let distance = candidateLoc.distance(from: location)
        if distance >= confirmRadius {
            if let c = pending { confirm(c, countsAsPutt: false) }
        }
    }

    func tick(now: Date = Date()) {
        if let candidate = pending {
            let age = now.timeIntervalSince(candidate.detectedAt)
            if age > 35 && age <= expireAfter,
               maxDisplacementFromAnchor >= 1.0,
               maxDisplacementFromAnchor < confirmRadius - 1.0 {
                confirm(candidate, countsAsPutt: false)
            } else if age > expireAfter {
                onCandidateDropped?(candidate, .expired)
                pending = nil
                status = .idle
                clearDisplacement()
            }
        }

        if case .justConfirmed(let at) = status,
           now.timeIntervalSince(at) > confirmFlashDuration {
            status = pending.map(Status.pending) ?? .idle
        }
    }

    func cancelPending(reason: DropReason = .manualOverride) {
        if let candidate = pending {
            onCandidateDropped?(candidate, reason)
        }
        pending = nil
        status = .idle
        clearDisplacement()
    }

    func reset() {
        pending = nil
        status = .idle
        clearDisplacement()
    }

    // MARK: - Internals

    private func confirm(_ candidate: Candidate, countsAsPutt: Bool) {
        pending = nil
        status = .justConfirmed(Date())
        clearDisplacement()
        onShotConfirmed?(candidate.hole, candidate, countsAsPutt)
    }

    private func seedDisplacement(for candidate: Candidate) {
        displacementAnchor = candidate.location
        maxDisplacementFromAnchor = 0
    }

    private func noteDisplacement(from fix: CLLocation) {
        guard pending != nil else { return }
        let anchor = displacementAnchor ?? pending?.location
        guard let anchor else { return }
        let d = fix.distance(from: anchor)
        maxDisplacementFromAnchor = max(maxDisplacementFromAnchor, d)
    }

    private func clearDisplacement() {
        displacementAnchor = nil
        maxDisplacementFromAnchor = 0
    }
}
