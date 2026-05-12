//
//  StrokesGainedCalculator.swift
//  StrikeLabCaddie
//
//  Strokes Gained analytics based on PGA Tour benchmarks
//

import Foundation

/// Strokes Gained categories
enum StrokesGainedCategory: String, CaseIterable {
    case offTheTee = "Off the Tee"
    case approach = "Approach"
    case aroundTheGreen = "Around Green"
    case putting = "Putting"
    case total = "Total"
    
    var icon: String {
        switch self {
        case .offTheTee: return "arrow.up.right"
        case .approach: return "target"
        case .aroundTheGreen: return "flag"
        case .putting: return "circle.dotted"
        case .total: return "chart.bar.fill"
        }
    }
    
    var description: String {
        switch self {
        case .offTheTee: return "Tee shots on par 4s and 5s"
        case .approach: return "Approach shots to the green"
        case .aroundTheGreen: return "Chips, pitches, bunker shots"
        case .putting: return "Putts on the green"
        case .total: return "Overall strokes gained"
        }
    }
}

/// Strokes Gained result for a category
struct StrokesGainedResult: Identifiable {
    let id = UUID()
    let category: StrokesGainedCategory
    let value: Double               // Positive = gaining strokes, Negative = losing
    let shotCount: Int              // Number of shots in this category
    let benchmark: BenchmarkLevel   // Comparison benchmark
    
    /// Formatted value string
    var formattedValue: String {
        if value >= 0 {
            return String(format: "+%.2f", value)
        } else {
            return String(format: "%.2f", value)
        }
    }
    
    /// Per-shot average
    var perShotAverage: Double {
        guard shotCount > 0 else { return 0 }
        return value / Double(shotCount)
    }
    
    /// Rating based on strokes gained
    var rating: String {
        switch value {
        case 1...: return "Excellent"
        case 0..<1: return "Good"
        case -1..<0: return "Average"
        case -2..<(-1): return "Below Average"
        default: return "Needs Work"
        }
    }
    
    /// Whether this is a strength or weakness
    var isStrength: Bool {
        value > 0.5
    }
    
    var isWeakness: Bool {
        value < -0.5
    }
}

/// Benchmark level for comparison
enum BenchmarkLevel: String, CaseIterable {
    case pga = "PGA Tour"
    case scratch = "Scratch"
    case bogey = "Bogey Golfer"
    
    /// Expected strokes from each distance (fairway lie)
    func expectedStrokes(fromDistance yards: Double, lie: ShotLie) -> Double {
        // Adjust for lie
        var adjustedYards = yards
        switch lie {
        case .fairway: break
        case .rough: adjustedYards *= 1.1
        case .bunker: adjustedYards *= 1.2
        case .green: return expectedPutts(fromDistance: yards)
        }
        
        // Return expected strokes based on benchmark level
        switch self {
        case .pga:
            return pgaExpectedStrokes(from: adjustedYards)
        case .scratch:
            return scratchExpectedStrokes(from: adjustedYards)
        case .bogey:
            return bogeyExpectedStrokes(from: adjustedYards)
        }
    }
    
    /// Expected putts from distance (feet)
    func expectedPutts(fromDistance feet: Double) -> Double {
        switch self {
        case .pga:
            return pgaExpectedPutts(from: feet)
        case .scratch:
            return scratchExpectedPutts(from: feet)
        case .bogey:
            return bogeyExpectedPutts(from: feet)
        }
    }
    
    // MARK: - PGA Tour Benchmarks (based on Mark Broadie's research)
    
    private func pgaExpectedStrokes(from yards: Double) -> Double {
        switch yards {
        case 0..<50: return 2.40
        case 50..<75: return 2.60
        case 75..<100: return 2.75
        case 100..<125: return 2.85
        case 125..<150: return 2.92
        case 150..<175: return 2.99
        case 175..<200: return 3.08
        case 200..<225: return 3.18
        case 225..<250: return 3.32
        case 250..<275: return 3.45
        case 275..<300: return 3.65
        case 300..<350: return 3.90
        case 350..<400: return 4.15
        case 400..<450: return 4.40
        default: return 4.70
        }
    }
    
    private func pgaExpectedPutts(from feet: Double) -> Double {
        switch feet {
        case 0..<2: return 1.00
        case 2..<3: return 1.01
        case 3..<4: return 1.05
        case 4..<5: return 1.12
        case 5..<6: return 1.18
        case 6..<8: return 1.28
        case 8..<10: return 1.40
        case 10..<15: return 1.55
        case 15..<20: return 1.72
        case 20..<25: return 1.83
        case 25..<30: return 1.92
        case 30..<40: return 2.02
        case 40..<50: return 2.15
        case 50..<60: return 2.25
        default: return 2.40
        }
    }
    
    // MARK: - Scratch Golfer Benchmarks
    
    private func scratchExpectedStrokes(from yards: Double) -> Double {
        // Scratch is roughly 0.3-0.5 strokes worse than PGA per shot
        return pgaExpectedStrokes(from: yards) + 0.35
    }
    
    private func scratchExpectedPutts(from feet: Double) -> Double {
        // Scratch is roughly 0.1-0.15 putts worse per putt
        return pgaExpectedPutts(from: feet) + 0.12
    }
    
    // MARK: - Bogey Golfer Benchmarks (18 handicap)
    
    private func bogeyExpectedStrokes(from yards: Double) -> Double {
        switch yards {
        case 0..<50: return 3.20
        case 50..<75: return 3.40
        case 75..<100: return 3.55
        case 100..<125: return 3.70
        case 125..<150: return 3.85
        case 150..<175: return 4.00
        case 175..<200: return 4.20
        case 200..<225: return 4.45
        case 225..<250: return 4.70
        case 250..<275: return 5.00
        case 275..<300: return 5.30
        default: return 5.60
        }
    }
    
    private func bogeyExpectedPutts(from feet: Double) -> Double {
        switch feet {
        case 0..<2: return 1.05
        case 2..<3: return 1.10
        case 3..<4: return 1.20
        case 4..<5: return 1.30
        case 5..<6: return 1.40
        case 6..<8: return 1.55
        case 8..<10: return 1.70
        case 10..<15: return 1.90
        case 15..<20: return 2.10
        case 20..<25: return 2.25
        case 25..<30: return 2.40
        case 30..<40: return 2.55
        default: return 2.75
        }
    }
}

/// Shot lie for strokes gained calculation
enum ShotLie: String, Codable, CaseIterable {
    case fairway = "Fairway"
    case rough = "Rough"
    case bunker = "Bunker"
    case green = "Green"
}

/// Calculator for Strokes Gained analytics
struct StrokesGainedCalculator {
    let rounds: [Round]
    let benchmark: BenchmarkLevel
    
    init(rounds: [Round], benchmark: BenchmarkLevel = .bogey) {
        self.rounds = rounds
        self.benchmark = benchmark
    }
    
    // MARK: - Category Calculations
    
    /// Calculate strokes gained off the tee (par 4/5 tee shots)
    var offTheTee: StrokesGainedResult {
        var totalGained: Double = 0
        var shotCount = 0
        
        for round in rounds {
            for hole in round.holes where hole.par >= 4 && hole.grossStrokes != nil {
                // Estimate tee shot performance based on fairway hit
                // If fairway hit, assume average landing position
                // If missed, assume penalty based on typical miss
                
                if let fairwayHit = hole.fairwayHit {
                    let expectedFromTee = benchmark.expectedStrokes(fromDistance: Double(hole.par == 4 ? 380 : 500), lie: .fairway)
                    let expectedAfterTee: Double
                    
                    if fairwayHit {
                        // Good drive - assume 150y approach remaining on par 4, 200y on par 5
                        expectedAfterTee = benchmark.expectedStrokes(fromDistance: Double(hole.par == 4 ? 150 : 200), lie: .fairway)
                    } else {
                        // Missed fairway - assume rough lie, similar distance
                        expectedAfterTee = benchmark.expectedStrokes(fromDistance: Double(hole.par == 4 ? 160 : 210), lie: .rough)
                    }
                    
                    let strokesGained = expectedFromTee - expectedAfterTee - 1.0
                    totalGained += strokesGained
                    shotCount += 1
                }
            }
        }
        
        return StrokesGainedResult(
            category: .offTheTee,
            value: totalGained,
            shotCount: shotCount,
            benchmark: benchmark
        )
    }
    
    /// Calculate strokes gained on approach shots
    var approach: StrokesGainedResult {
        var totalGained: Double = 0
        var shotCount = 0
        
        for round in rounds {
            for hole in round.holes where hole.grossStrokes != nil {
                // Estimate approach performance based on GIR
                if let gir = hole.greenInRegulation {
                    let approachDistance = Double(hole.par == 3 ? 165 : (hole.par == 4 ? 150 : 180))
                    let expectedFromApproach = benchmark.expectedStrokes(fromDistance: approachDistance, lie: .fairway)
                    let expectedOnGreen: Double
                    
                    if gir {
                        // Hit the green - assume 25 foot putt
                        expectedOnGreen = benchmark.expectedPutts(fromDistance: 25)
                    } else {
                        // Missed green - assume chip from 15 yards
                        expectedOnGreen = benchmark.expectedStrokes(fromDistance: 15, lie: .fairway)
                    }
                    
                    let strokesGained = expectedFromApproach - expectedOnGreen - 1.0
                    totalGained += strokesGained
                    shotCount += 1
                }
            }
        }
        
        return StrokesGainedResult(
            category: .approach,
            value: totalGained,
            shotCount: shotCount,
            benchmark: benchmark
        )
    }
    
    /// Calculate strokes gained around the green
    var aroundTheGreen: StrokesGainedResult {
        var totalGained: Double = 0
        var shotCount = 0
        
        for round in rounds {
            for hole in round.holes where hole.grossStrokes != nil {
                // If GIR was missed, calculate around-green performance
                if let gir = hole.greenInRegulation, !gir, let putts = hole.putts, putts > 0 {
                    // Estimate chip performance: expected from 15y vs actual result
                    let expectedFromChip = benchmark.expectedStrokes(fromDistance: 15, lie: .fairway)
                    let actualAfterChip = benchmark.expectedPutts(fromDistance: Double(putts == 1 ? 3 : (putts == 2 ? 15 : 30)))
                    
                    let strokesGained = expectedFromChip - actualAfterChip - 1.0
                    totalGained += strokesGained
                    shotCount += 1
                }
            }
        }
        
        return StrokesGainedResult(
            category: .aroundTheGreen,
            value: totalGained,
            shotCount: shotCount,
            benchmark: benchmark
        )
    }
    
    /// Calculate strokes gained putting
    var putting: StrokesGainedResult {
        var totalGained: Double = 0
        var shotCount = 0
        
        for round in rounds {
            for hole in round.holes where hole.putts != nil && hole.putts! > 0 {
                let putts = hole.putts!
                
                // Estimate first putt distance based on GIR
                let firstPuttFeet: Double
                if hole.greenInRegulation == true {
                    firstPuttFeet = 25  // GIR typically means ~25 feet
                } else {
                    firstPuttFeet = 12  // After chip typically closer
                }
                
                let expectedPutts = benchmark.expectedPutts(fromDistance: firstPuttFeet)
                let strokesGained = expectedPutts - Double(putts)
                
                totalGained += strokesGained
                shotCount += putts
            }
        }
        
        return StrokesGainedResult(
            category: .putting,
            value: totalGained,
            shotCount: shotCount,
            benchmark: benchmark
        )
    }
    
    /// Calculate total strokes gained
    var total: StrokesGainedResult {
        let tee = offTheTee
        let app = approach
        let atg = aroundTheGreen
        let putt = putting
        
        return StrokesGainedResult(
            category: .total,
            value: tee.value + app.value + atg.value + putt.value,
            shotCount: tee.shotCount + app.shotCount + atg.shotCount + putt.shotCount,
            benchmark: benchmark
        )
    }
    
    /// Get all strokes gained results
    var allResults: [StrokesGainedResult] {
        [offTheTee, approach, aroundTheGreen, putting, total]
    }
    
    /// Get strongest category
    var strength: StrokesGainedResult? {
        [offTheTee, approach, aroundTheGreen, putting].max { $0.value < $1.value }
    }
    
    /// Get weakest category
    var weakness: StrokesGainedResult? {
        [offTheTee, approach, aroundTheGreen, putting].min { $0.value < $1.value }
    }
    
    /// Get improvement recommendations
    var recommendations: [String] {
        var recs: [String] = []
        
        if let weak = weakness, weak.value < -1.0 {
            switch weak.category {
            case .offTheTee:
                recs.append("Focus on driving accuracy - consider a more conservative tee shot strategy")
            case .approach:
                recs.append("Work on approach shots - practice distance control with irons")
            case .aroundTheGreen:
                recs.append("Improve short game - practice chips and pitches from various lies")
            case .putting:
                recs.append("Putting needs attention - practice lag putting and 5-10 foot putts")
            case .total:
                break
            }
        }
        
        if let strong = strength, strong.value > 1.0 {
            recs.append("Your \(strong.category.rawValue) is a strength - leverage this in your strategy")
        }
        
        return recs
    }
}
