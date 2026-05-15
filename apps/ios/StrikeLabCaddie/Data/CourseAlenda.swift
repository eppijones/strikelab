//
//  CourseAlenda.swift
//  StrikeLabCaddie
//
//  Seed courses shipped with the app. Four real courses:
//
//    1. Groruddalen Golfklubb — sloped par-3 course in Oslo. Real scorecard
//       (Yellow + Red tees, hole-by-hole metres, HCP index, slope tables).
//    2. Grini Golfklubb — 9-hole Bærum/Oslo course played twice, with official
//       scorecard data and on-course GPS layouts.
//    3. Alenda Golf — local Alicante course with WHS slope/rating data.
//    4. PGA Catalunya · Stadium — championship course with full GPS hole
//       layouts so the GPS, Smart Caddie and watch flow can be demoed without
//       leaving the office.
//

import Foundation

/// Pre-loaded course data. Marked `internal` so the rest of the app and the
/// demo seed (`DemoData.swift`) can both read these structs.
enum CourseData {

    // MARK: - Groruddalen Golfklubb — Oslo, Norway (par 54, sloped par-3 course)
    //
    // 9-hole sloped par-3 course played twice for 18. Real scorecard data
    // lifted directly from grorudgk.no/bane/scorekort + slopetabeller —
    // yardages are stored in metres on the source scorecard; we convert to
    // yards (the rest of the app's distance language) when synthesising the
    // GPS layout.

    static let groruddalen: Course = {
        // Hole metres + stroke index from the official scorecard.
        // Front 9 and back 9 are the same routing played twice.
        let metersYellowFront = [141, 142, 173, 169, 148, 143, 179, 230, 100]
        let metersRedFront    = [124, 133, 165, 169, 148, 143, 179, 213, 100]
        let hcpFront          = [11,  9,   3,   7,   13,  15,  1,   5,   17]

        var pars: [Int] = []
        var his: [Int] = []
        var metersYellow: [Int] = []
        var metersRed: [Int] = []
        for loop in 0..<2 {
            for i in 0..<9 {
                pars.append(3)
                his.append(hcpFront[i] + loop) // Back 9 HI = front + 1, alternating with even
                metersYellow.append(metersYellowFront[i])
                metersRed.append(metersRedFront[i])
            }
        }
        // Override HI exactly per scorecard for the back 9
        let backNineHI = [12, 10, 4, 8, 14, 16, 2, 6, 18]
        for i in 0..<9 { his[9 + i] = backNineHI[i] }

        let holes = (0..<18).map { i in
            HoleInfo(number: i + 1, par: pars[i], handicapIndex: his[i])
        }

        // Yards-equivalent for layout synthesis (1 m ≈ 1.0936 yd).
        let yardages = metersYellow.map { Int(round(Double($0) * 1.0936133)) }

        let tees = [
            Tee(name: "Yellow (Men)",    slope: 101, courseRating: 57.8, par: 54),
            Tee(name: "Red (Ladies)",    slope: 104, courseRating: 59.2, par: 54)
        ]

        return Course(
            name: "Groruddalen Golfklubb",
            location: "Stovner · Oslo, Norway",
            holes: holes,
            tees: tees,
            holeLayouts: makeGroruddalenLayouts(yardages: yardages),
            apiCourseId: nil,
            latitude: 59.9686927,
            longitude: 10.9169836,
            isCustom: false
        )
    }()

    // MARK: - Grini Golfklubb — Eiksmarka, Norway (9-hole par 35, played twice)
    //
    // Official scorecard data from grinigolfklubb.no/banen/scorekort. The
    // routing is 9 holes; holes 10-18 repeat 1-9 with the even handicap indexes.

    static let grini: Course = {
        let parsFront = [4, 3, 4, 4, 4, 4, 5, 4, 3]
        let hcpFront = [11, 17, 3, 1, 9, 13, 5, 7, 15]
        let hcpBack = [12, 18, 4, 2, 10, 14, 6, 8, 16]
        let meters52Front = [273, 106, 339, 359, 287, 274, 475, 336, 143]
        let meters45Front = [259, 89, 274, 326, 236, 235, 410, 292, 120]
        let meters31Front = [178, 62, 205, 178, 170, 201, 307, 136, 105]
        let meters23Front = [139, 41, 154, 144, 142, 125, 216, 136, 49]

        let pars = parsFront + parsFront
        let his = hcpFront + hcpBack
        let meters52 = meters52Front + meters52Front

        let holes = (0..<18).map { i in
            HoleInfo(number: i + 1, par: pars[i], handicapIndex: his[i])
        }

        let tees = [
            Tee(name: "Tee 52 Men · \(meters52.reduce(0, +))m", slope: 131, courseRating: 68.1, par: 70),
            Tee(name: "Tee 52 Women · \(meters52.reduce(0, +))m", slope: 136, courseRating: 73.0, par: 70),
            Tee(name: "Tee 45 Men · \((meters45Front + meters45Front).reduce(0, +))m", slope: 124, courseRating: 64.4, par: 70),
            Tee(name: "Tee 45 Women · \((meters45Front + meters45Front).reduce(0, +))m", slope: 126, courseRating: 68.6, par: 70),
            Tee(name: "Tee 31 Men · \((meters31Front + meters31Front).reduce(0, +))m", slope: 112, courseRating: 60.1, par: 70),
            Tee(name: "Tee 31 Women · \((meters31Front + meters31Front).reduce(0, +))m", slope: 112, courseRating: 60.3, par: 70),
            Tee(name: "Tee 23 Men · \((meters23Front + meters23Front).reduce(0, +))m", slope: 102, courseRating: 53.6, par: 70),
            Tee(name: "Tee 23 Women · \((meters23Front + meters23Front).reduce(0, +))m", slope: 98, courseRating: 55.3, par: 70)
        ]

        return Course(
            name: "Grini Golfklubb",
            location: "Eiksmarka · Bærum, Norway",
            holes: holes,
            tees: tees,
            holeLayouts: makeGriniLayouts(yardages: meters52.map { Int(round(Double($0) * 1.0936133)) }),
            apiCourseId: nil,
            latitude: 59.950568,
            longitude: 10.625226,
            isCustom: false
        )
    }()

    // MARK: - Alenda Golf — Alicante, Spain (par 71, ~6 200 m)

    static let alenda: Course = {
        // Real par + handicap-index data from the official Alenda scorecard
        // (par 72, slope/CR per the WHS rating sheet).
        let pars = [4, 4, 4, 5, 3, 4, 4, 3, 5,   4, 5, 3, 4, 4, 5, 3, 4, 4]
        let his  = [11, 1, 5, 9, 17, 3, 13, 15, 7,
                    14, 8, 18, 4, 12, 6, 16, 10, 2]

        let holes = (0..<18).map { i in
            HoleInfo(number: i + 1, par: pars[i], handicapIndex: his[i])
        }

        let tees = [
            Tee(name: "White (Men)",  slope: 129, courseRating: 71.6, par: 72),
            Tee(name: "Yellow (Men)", slope: 124, courseRating: 69.4, par: 72),
            Tee(name: "Blue (Ladies)", slope: 125, courseRating: 72.7, par: 72),
            Tee(name: "Red (Ladies)",  slope: 122, courseRating: 70.5, par: 72)
        ]

        return Course(
            name: "Alenda Golf",
            location: "Monforte del Cid · Alicante, Spain",
            holes: holes,
            tees: tees,
            holeLayouts: nil,
            apiCourseId: nil,
            latitude: 38.4081,
            longitude: -0.7347,
            isCustom: false
        )
    }()

    // MARK: - PGA Catalunya · Stadium — Caldes de Malavella, Spain
    //
    // Used as the StrikeLab "demo" / showcase course because (a) it is one of
    // the most widely published championship courses in Europe and (b) we have
    // par/HI/yardage/GPS approximations sufficient for the on-course flow.

    static let pgaCatalunyaStadium: Course = {
        // Pars and stroke index — Stadium course, championship tees (par 72).
        let pars = [4, 4, 5, 3, 4, 4, 5, 3, 4,   4, 4, 3, 5, 4, 4, 5, 3, 4]
        let his  = [11, 5, 7, 17, 1, 9, 3, 15, 13,
                    8, 14, 18, 6, 4, 2, 10, 16, 12]

        let yardagesWhite = [
            408, 365, 535, 196, 437, 420, 580, 184, 415,
            395, 414, 165, 535, 458, 442, 528, 178, 442
        ]

        let holes = (0..<18).map { i in
            HoleInfo(number: i + 1, par: pars[i], handicapIndex: his[i])
        }

        let tees = [
            Tee(name: "Black (Pro)",   slope: 142, courseRating: 75.4, par: 72),
            Tee(name: "White (Comp)",  slope: 138, courseRating: 73.6, par: 72),
            Tee(name: "Yellow (Men)",  slope: 132, courseRating: 71.8, par: 72),
            Tee(name: "Blue (Ladies)", slope: 134, courseRating: 75.0, par: 72),
            Tee(name: "Red (Ladies)",  slope: 128, courseRating: 72.4, par: 72)
        ]

        return Course(
            name: "PGA Catalunya · Stadium",
            location: "Caldes de Malavella · Girona, Spain",
            holes: holes,
            tees: tees,
            holeLayouts: makeStadiumLayouts(yardages: yardagesWhite),
            apiCourseId: nil,
            latitude: 41.8628,
            longitude: 2.7619,
            isCustom: false
        )
    }()

    /// Generic driving-range "course" for Round Setup when you only care
    /// about logging swings, not which facility you stood on. No fixed GPS
    /// coordinates so it does not pollute the watch nearby-course detector;
    /// start range practice from the watch as usual.
    static let drivingRange: Course = {
        let pars = Array(repeating: 3, count: 18)
        let holes = (0..<18).map { i in
            HoleInfo(number: i + 1, par: pars[i], handicapIndex: i + 1)
        }
        let tees = [
            Tee(name: "Range", slope: nil, courseRating: nil, par: nil)
        ]
        return Course(
            name: "Driving range",
            location: "Practice · any venue",
            holes: holes,
            tees: tees,
            holeLayouts: nil,
            apiCourseId: nil,
            latitude: nil,
            longitude: nil,
            isCustom: false
        )
    }()

    static let allCourses: [Course] = [drivingRange, groruddalen, grini, pgaCatalunyaStadium, alenda]

    /// A sample course with synthetic data — kept for SwiftUI previews and
    /// unit tests so we do not have to mutate the real seed data.
    static let sampleCourse: Course = {
        let pars = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4]
        let his  = [7, 3, 15, 1, 11, 17, 5, 9, 13, 8, 2, 14, 16, 4, 10, 18, 6, 12]
        let holes = (0..<18).map { i in
            HoleInfo(number: i + 1, par: pars[i], handicapIndex: his[i])
        }
        let tees = [
            Tee(name: "White", slope: 128, courseRating: 72.4, par: 72),
            Tee(name: "Yellow", slope: 124, courseRating: 70.8, par: 72),
            Tee(name: "Red", slope: 118, courseRating: 68.2, par: 72)
        ]
        return Course(
            name: "Sample Golf Club",
            location: "Test Location",
            holes: holes,
            tees: tees,
            apiCourseId: nil,
            isCustom: false
        )
    }()
}

// MARK: - Course Loading

extension CourseData {
    static func course(named name: String) -> Course? {
        allCourses.first { $0.name == name }
    }

    /// Default course for new rounds — the user's home course.
    static var defaultCourse: Course {
        groruddalen
    }
}

// MARK: - PGA Catalunya layout synthesis
//
// We don't ship the full vector course map, but we *do* synthesise plausible
// per-hole tee box, green and hazard coordinates around the real club
// centroid (41.8628° N, 2.7619° E). Every hole gets:
//
//   • teeBox + greenFront/center/back, spaced by yardage along a bearing
//   • 1–3 hazards (water on signature holes, bunkers elsewhere)
//   • A layup target on every par-5
//
// This is enough to drive the GPS view, the Smart Caddie and the watch's
// hole map without lying about distances.

private func makeStadiumLayouts(yardages: [Int]) -> [HoleLayout] {
    let centroidLat = 41.8628
    let centroidLon = 2.7619

    // Plausible per-hole offsets (yards, in the layout grid). Just spreads the
    // holes across the property; not a survey-grade routing.
    let holeOffsetsYards: [(dx: Double, dy: Double, bearing: Double)] = [
        (-280,  220,   72),  // 1
        (-180,  340,   18),  // 2
        ( -40,  460,   28),  // 3 — par 5 with water short of green
        ( 160,  500,   95),  // 4 — par 3
        ( 320,  420,  140),  // 5
        ( 380,  240,  175),  // 6
        ( 320,   60,  205),  // 7
        ( 160,  -80,  225),  // 8 — par 3 over water
        ( -40, -120,  255),  // 9
        (-200, -100,  295),  // 10
        (-340,    0,  335),  // 11
        (-380,  160,    8),  // 12 — par 3
        (-300,  320,   42),  // 13 — par 5 (signature, water right)
        (-160,  420,   62),  // 14
        (   0,  480,   90),  // 15
        ( 200,  420,  120),  // 16 — par 5
        ( 320,  260,  160),  // 17 — par 3 (island green)
        ( 280,   80,  200)   // 18
    ]

    return (0..<18).map { i in
        let holeNumber = i + 1
        let (dx, dy, bearing) = holeOffsetsYards[i]
        let teeBox = offset(centroidLat, centroidLon, eastYards: dx, northYards: dy)
        let yardage = Double(yardages[i])

        // Green = teeBox advanced along bearing by yardage.
        let greenCenter = advance(teeBox, bearingDegrees: bearing, yards: yardage)
        let greenFront  = advance(teeBox, bearingDegrees: bearing, yards: yardage - 12)
        let greenBack   = advance(teeBox, bearingDegrees: bearing, yards: yardage + 12)

        var hazards: [Hazard] = []

        // Signature water holes
        if [3, 8, 13, 17].contains(holeNumber) {
            let waterDist = max(yardage * 0.62, 110)
            hazards.append(Hazard(
                type: .water,
                coordinate: advance(teeBox, bearingDegrees: bearing, yards: waterDist),
                name: "Water carry",
                carryDistance: waterDist + 8
            ))
        }

        // Fairway bunkers around landing area
        if yardage >= 380 {
            let bunkerDist = yardage * 0.55
            hazards.append(Hazard(
                type: .bunker,
                coordinate: advance(teeBox, bearingDegrees: bearing + 6, yards: bunkerDist),
                name: "Right fairway bunker",
                carryDistance: bunkerDist + 5
            ))
        }

        // Greenside bunkers
        hazards.append(Hazard(
            type: .bunker,
            coordinate: advance(greenCenter, bearingDegrees: bearing - 90, yards: 8),
            name: "Greenside bunker"
        ))

        // Layups for par 5s
        var layups: [LayupTarget] = []
        let parIsFive = [3, 13, 16].contains(holeNumber)
        if parIsFive {
            layups.append(LayupTarget(
                coordinate: advance(teeBox, bearingDegrees: bearing, yards: yardage - 110),
                name: "Layup · 100y in",
                description: "Lay back to wedge yardage."
            ))
        }

        return HoleLayout(
            holeNumber: holeNumber,
            greenFront: greenFront,
            greenCenter: greenCenter,
            greenBack: greenBack,
            teeBox: teeBox,
            hazards: hazards,
            layupTargets: layups
        )
    }
}

// MARK: - Groruddalen layout synthesis
//
// 9-hole sloped par-3 routing centred on Karen Platous vei 33 (59.9687 N,
// 10.9169 E). Holes 1–9 are the actual routing; 10–18 mirror it (the round
// is two laps of the same nine).
//
// Bearings are eyeballed from satellite imagery — good enough for the
// "yards to pin" hero, hazards and watch hole map until we have a survey.
private func makeGroruddalenLayouts(yardages: [Int]) -> [HoleLayout] {
    let centroidLat = 59.9686927
    let centroidLon = 10.9169836

    // Per-hole offsets from the practice green (yards) + bearing along which
    // the hole plays (compass degrees, 0° = north).
    let holeRouting: [(dx: Double, dy: Double, bearing: Double, hazard: HazardType?)] = [
        ( -40,   60,  20, nil),     // 1 — gentle uphill 141m
        ( -10,  140,  60, .trees),  // 2 — 142m, treelined
        (  90,  160, 110, nil),     // 3 — 173m signature, HI 3
        ( 200,   90, 165, .trees),  // 4 — 169m downhill
        ( 220,  -50, 200, nil),     // 5 — 148m
        ( 130, -120, 245, .bunker), // 6 — 143m, greenside bunker
        (  10, -150, 280, .water),  // 7 — 179m HI 1, water short
        (-110, -100, 320, nil),     // 8 — 230m, course's longest
        (-140,    0,   5, nil)      // 9 — 100m drop shot back to clubhouse
    ]

    return (0..<18).map { i in
        let routingIndex = i % 9
        let route = holeRouting[routingIndex]
        let teeBox = offset(centroidLat, centroidLon, eastYards: route.dx, northYards: route.dy)
        let yardage = Double(yardages[i])

        let greenCenter = advance(teeBox, bearingDegrees: route.bearing, yards: yardage)
        let greenFront  = advance(teeBox, bearingDegrees: route.bearing, yards: yardage - 8)
        let greenBack   = advance(teeBox, bearingDegrees: route.bearing, yards: yardage + 8)

        var hazards: [Hazard] = []

        if let hazardType = route.hazard {
            let carry = max(yardage * 0.6, 80)
            let displayName: String = {
                switch hazardType {
                case .water: return "Carry the pond"
                case .bunker: return "Greenside bunker"
                case .trees: return "Tree line right"
                case .outOfBounds: return "OB right"
                case .lateral: return "Lateral hazard"
                }
            }()
            hazards.append(Hazard(
                type: hazardType,
                coordinate: advance(teeBox, bearingDegrees: route.bearing + 8, yards: carry),
                name: displayName,
                carryDistance: carry + 5
            ))
        }

        // Every par 3 has a greenside bunker for visual scale on the watch map.
        hazards.append(Hazard(
            type: .bunker,
            coordinate: advance(greenCenter, bearingDegrees: route.bearing - 90, yards: 6),
            name: "Greenside bunker"
        ))

        return HoleLayout(
            holeNumber: i + 1,
            greenFront: greenFront,
            greenCenter: greenCenter,
            greenBack: greenBack,
            teeBox: teeBox,
            hazards: hazards,
            layupTargets: []
        )
    }
}

// MARK: - Grini layout synthesis
//
// Grini is a compact 9-hole course at Griniveien 159. The official course map
// and safety notes identify a relatively open layout with road/OB pressure on
// the early holes and the long 7th playing back through the property. These
// coordinates are practical GPS targets for play today, not survey-grade pins.
private func makeGriniLayouts(yardages: [Int]) -> [HoleLayout] {
    let centroidLat = 59.950568
    let centroidLon = 10.625226

    let holeRouting: [(dx: Double, dy: Double, bearing: Double, primary: HazardType?)] = [
        ( -80,  -20,  58, .trees),       // 1 - semi-blind opener
        ( 120,   40, 105, .water),       // 2 - short par 3 with penalty-area option
        ( 210,  110,  22, .outOfBounds), // 3 - OB/field pressure
        ( 120,  300, 326, .outOfBounds), // 4 - hardest hole
        (-120,  310, 260, .bunker),      // 5
        (-250,  160, 198, .trees),       // 6
        (-180,  -90,  44, .trees),       // 7 - long par 5
        (  40,  150, 137, .bunker),      // 8
        ( 170,  -70, 248, nil)           // 9 - short finisher
    ]

    return (0..<18).map { i in
        let routingIndex = i % 9
        let route = holeRouting[routingIndex]
        let teeBox = offset(centroidLat, centroidLon, eastYards: route.dx, northYards: route.dy)
        let yardage = Double(yardages[i])

        let greenCenter = advance(teeBox, bearingDegrees: route.bearing, yards: yardage)
        let greenFront = advance(teeBox, bearingDegrees: route.bearing, yards: yardage - 10)
        let greenBack = advance(teeBox, bearingDegrees: route.bearing, yards: yardage + 10)

        var hazards: [Hazard] = []
        if let hazardType = route.primary {
            let carry = min(max(yardage * 0.55, 75), yardage - 20)
            let name: String = {
                switch hazardType {
                case .water: return "Penalty area"
                case .bunker: return "Fairway bunker"
                case .outOfBounds: return "Out of bounds"
                case .trees: return "Tree line"
                case .lateral: return "Lateral hazard"
                }
            }()
            hazards.append(Hazard(
                type: hazardType,
                coordinate: advance(teeBox, bearingDegrees: route.bearing + 8, yards: carry),
                name: name,
                carryDistance: carry + 6
            ))
        }

        hazards.append(Hazard(
            type: .bunker,
            coordinate: advance(greenCenter, bearingDegrees: route.bearing - 90, yards: 8),
            name: "Greenside bunker"
        ))

        var layups: [LayupTarget] = []
        if routingIndex == 6 {
            layups.append(LayupTarget(
                coordinate: advance(teeBox, bearingDegrees: route.bearing, yards: max(yardage - 115, 220)),
                name: "Layup · 100m in",
                description: "Long par 5: leave a full wedge into the green."
            ))
        }

        return HoleLayout(
            holeNumber: i + 1,
            greenFront: greenFront,
            greenCenter: greenCenter,
            greenBack: greenBack,
            teeBox: teeBox,
            hazards: hazards,
            layupTargets: layups
        )
    }
}

// MARK: - Geo helpers

/// Offset a (lat, lon) by east/north yards. Uses a flat-Earth approximation
/// which is plenty accurate over the few-hundred-yard scale of a golf hole.
private func offset(_ lat: Double, _ lon: Double, eastYards: Double, northYards: Double) -> Coordinate {
    let metersPerYard = 0.9144
    let dNorthMeters = northYards * metersPerYard
    let dEastMeters = eastYards * metersPerYard

    let earthRadius = 6_378_137.0 // meters
    let dLat = dNorthMeters / earthRadius
    let dLon = dEastMeters / (earthRadius * cos(lat * .pi / 180))

    return Coordinate(
        latitude: lat + dLat * 180 / .pi,
        longitude: lon + dLon * 180 / .pi
    )
}

/// Advance a coordinate by `yards` along a compass bearing (0° = north).
private func advance(_ coord: Coordinate, bearingDegrees: Double, yards: Double) -> Coordinate {
    let radians = bearingDegrees * .pi / 180
    let east = sin(radians) * yards
    let north = cos(radians) * yards
    return offset(coord.latitude, coord.longitude, eastYards: east, northYards: north)
}
