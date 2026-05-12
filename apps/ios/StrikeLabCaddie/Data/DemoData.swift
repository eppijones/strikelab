//
//  DemoData.swift
//  StrikeLabCaddie
//
//  Generates a believable saved round + a couple of practice sessions so that
//  the app boots into a *populated* state. Used for first-launch and for the
//  "Reset demo" action in the Profile view.
//
//  This is the canonical "did the whole flow work?" check: if you can step
//  through Round → Scorecard → Shot list → Practice → Profile and every
//  surface shows real, sensible data, the wiring is correct end-to-end.
//

import Foundation

enum DemoData {

    /// Build a fully-played round on the demo course (PGA Catalunya · Stadium)
    /// using a 13.4 handicap player. Scores are deliberately modest — a
    /// believable mid-handicap day, not a fairy tale.
    static func sampleRound(player: Player) -> Round {
        let course = CourseData.pgaCatalunyaStadium
        let tee = course.tees.first(where: { $0.name.contains("Yellow") }) ?? course.tees.first

        var round = Round(
            date: Calendar.current.date(byAdding: .day, value: -3, to: Date()) ?? Date(),
            course: course,
            selectedTee: tee,
            player: player
        )

        // Score each hole — deliberately a bogey-ish round for realism.
        // hole 1 4 / 4   par
        // hole 2 4 / 5   bogey
        // hole 3 5 / 6   bogey on a tough par 5
        // hole 4 3 / 4   bogey par 3
        // hole 5 4 / 5   bogey
        // hole 6 4 / 4   par
        // hole 7 4 / 5   bogey (HCP 3 hole)
        // hole 8 3 / 3   par on the postcard par 3
        // hole 9 4 / 5   bogey (back-9 turn)
        // hole 10 4 / 4  par
        // hole 11 4 / 5  bogey
        // hole 12 3 / 3  par
        // hole 13 5 / 6  bogey (water)
        // hole 14 4 / 4  par
        // hole 15 4 / 5  bogey
        // hole 16 5 / 6  bogey par 5
        // hole 17 3 / 4  bogey par 3
        // hole 18 4 / 5  bogey
        let strokes = [4, 5, 6, 4, 5, 4, 5, 3, 5,
                       4, 5, 3, 6, 4, 5, 6, 4, 5]
        let putts =   [2, 2, 2, 2, 2, 1, 2, 2, 2,
                       2, 2, 1, 2, 2, 2, 2, 2, 2]

        for i in 0..<18 {
            round.updateHoleScore(
                holeNumber: i + 1,
                grossStrokes: strokes[i],
                putts: putts[i]
            )
            // Touch fairway/GIR for stat richness.
            if let idx = round.holes.firstIndex(where: { $0.holeNumber == i + 1 }) {
                let par = round.holes[idx].par
                round.holes[idx].fairwayHit = (par != 3) ? (i % 3 != 0) : nil
                round.holes[idx].greenInRegulation = (strokes[i] - putts[i]) <= (par - 2)
            }
        }

        round.shots = sampleShots(course: course, round: round)
        round.isComplete = true
        round.currentHoleNumber = 18

        return round
    }

    /// Generate a believable shot stream for the demo round — driver/approach
    /// pairs on most holes, plus a couple of putts. Shots are timestamp-ordered
    /// across ~4 hours.
    private static func sampleShots(course: Course, round: Round) -> [Shot] {
        let start = round.date
        var shots: [Shot] = []
        var t = start

        // Stretch the round across ~4h.
        let secPerShot: TimeInterval = 60 * 4

        for hole in round.holes {
            let layout = course.layout(forHole: hole.holeNumber)
            let strokeCount = hole.grossStrokes ?? hole.par
            let putts = hole.putts ?? 2
            let strokesBeforeGreen = max(strokeCount - putts, 1)

            for stroke in 1...strokeCount {
                let club = pickClub(holePar: hole.par, stroke: stroke, total: strokeCount)
                let isPutt = stroke > strokesBeforeGreen
                let coordinate = layout.flatMap { l -> Coordinate? in
                    if isPutt { return l.greenCenter }
                    if stroke == 1 { return l.teeBox }
                    return l.greenFront
                }
                shots.append(Shot(
                    timestamp: t,
                    club: club,
                    startLocation: coordinate,
                    endLocation: nil,
                    holeNumber: hole.holeNumber,
                    confidence: stroke == 1 ? 0.92 : nil,
                    isManual: stroke != 1
                ))
                t = t.addingTimeInterval(secPerShot)
            }
        }

        return shots
    }

    private static func pickClub(holePar: Int, stroke: Int, total: Int) -> Club {
        let isPutt = stroke == total // last stroke of the hole
        let isApproach = stroke == max(total - 2, 1) // 2nd from last
        if isPutt { return .putter }
        if stroke == 1 {
            switch holePar {
            case 5: return .driver
            case 4: return .driver
            default: return .iron7
            }
        }
        if isApproach {
            switch holePar {
            case 5: return .iron8
            case 4: return .iron7
            default: return .pitchingWedge
            }
        }
        return .wedge56
    }

    /// A couple of recent practice sessions so the Practice screen and stats
    /// charts have data on first launch.
    static func samplePracticeSessions() -> [PracticeSession] {
        var sessions: [PracticeSession] = []

        // Range session 2 days ago — driver focus.
        sessions.append(makeSession(
            daysAgo: 2,
            durationMinutes: 55,
            shotPlan: [
                (.driver,        .pure,  nil),
                (.driver,        .good,  nil),
                (.driver,        .okay,  .push),
                (.driver,        .good,  nil),
                (.driver,        .miss,  .slice),
                (.driver,        .good,  nil),
                (.iron7,         .pure,  nil),
                (.iron7,         .good,  nil),
                (.iron7,         .okay,  .pull),
                (.pitchingWedge, .pure,  nil),
                (.pitchingWedge, .good,  nil),
                (.pitchingWedge, .okay,  .fat),
                (.wedge56,       .good,  nil),
                (.wedge56,       .miss,  .thin)
            ],
            focusClub: .driver,
            location: "Driving Range"
        ))

        // Short game session yesterday.
        sessions.append(makeSession(
            daysAgo: 1,
            durationMinutes: 40,
            shotPlan: [
                (.wedge56, .pure, nil),
                (.wedge56, .good, nil),
                (.wedge56, .pure, nil),
                (.wedge56, .okay, .fat),
                (.wedge60, .good, nil),
                (.wedge60, .pure, nil),
                (.wedge60, .miss, .thin),
                (.pitchingWedge, .good, nil),
                (.pitchingWedge, .good, nil),
                (.pitchingWedge, .okay, .pull),
                (.putter,  .good, nil),
                (.putter,  .pure, nil),
                (.putter,  .pure, nil)
            ],
            focusClub: .wedge56,
            location: "Short Game"
        ))

        return sessions
    }

    private static func makeSession(
        daysAgo: Int,
        durationMinutes: Int,
        shotPlan: [(Club, ShotQuality, MissType?)],
        focusClub: Club,
        location: String
    ) -> PracticeSession {
        let cal = Calendar.current
        let startTime = cal.date(byAdding: .day, value: -daysAgo, to: Date()) ?? Date()
        let endTime = startTime.addingTimeInterval(TimeInterval(durationMinutes * 60))
        let stride = TimeInterval(durationMinutes * 60) / TimeInterval(max(shotPlan.count, 1))

        var shots: [PracticeShot] = []
        for (i, plan) in shotPlan.enumerated() {
            shots.append(PracticeShot(
                timestamp: startTime.addingTimeInterval(stride * Double(i)),
                club: plan.0,
                quality: plan.1,
                missType: plan.2
            ))
        }

        return PracticeSession(
            startTime: startTime,
            endTime: endTime,
            shots: shots,
            focusClub: focusClub,
            notes: nil,
            location: location
        )
    }

    /// Apply demo data to a fresh persistence manager. Caller is expected to
    /// guard for "is this the first launch?" via `UserDefaults`.
    @MainActor
    static func seed(into persistence: PersistenceManager) {
        let player = persistence.player

        // Make sure the demo course is available.
        for course in CourseData.allCourses where !persistence.courses.contains(where: { $0.name == course.name }) {
            persistence.addCourse(course)
        }

        let round = sampleRound(player: player)
        if !persistence.savedRounds.contains(where: { $0.id == round.id }) {
            persistence.savedRounds.insert(round, at: 0)
            persistence.saveSavedRoundsPublic()
        }

        let sessions = samplePracticeSessions()
        for session in sessions where !persistence.practiceSessions.contains(where: { $0.id == session.id }) {
            persistence.practiceSessions.insert(session, at: 0)
        }
    }
}
