//
//  WatchConnectivityManagerWatch.swift
//  StrikeLabCaddieWatch Watch App
//
//  Watch Connectivity manager for watchOS
//

import Foundation
import WatchConnectivity
import Combine

@MainActor
class WatchConnectivityManagerWatch: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var isPhoneReachable = false
    @Published var currentHoleNumber: Int = 1
    @Published var isRoundActive = false
    @Published var courseName: String?
    @Published var connectionError: String?
    
    /// Recent shots logged this session (for local display)
    @Published var recentShots: [ShotEventWatch] = []
    
    // MARK: - Private Properties
    
    private var session: WCSession?
    
    // MARK: - Initialization
    
    override init() {
        super.init()
        setupSession()
    }
    
    private func setupSession() {
        guard WCSession.isSupported() else {
            connectionError = "Watch Connectivity not supported"
            return
        }
        
        session = WCSession.default
        session?.delegate = self
        session?.activate()
    }
    
    // MARK: - Send Shot Event
    
    func sendShotEvent(_ event: ShotEventWatch) {
        // Add to local history
        recentShots.insert(event, at: 0)
        if recentShots.count > 20 {
            recentShots.removeLast()
        }
        
        // Encode event
        guard let data = try? JSONEncoder().encode(event) else {
            connectionError = "Failed to encode shot event"
            return
        }
        
        let message: [String: Any] = ["shotEvent": data]
        
        // Try immediate send if reachable
        if let session = session, session.isReachable {
            session.sendMessage(message, replyHandler: nil) { [weak self] error in
                Task { @MainActor in
                    // Fall back to transfer if send fails
                    self?.transferShotEvent(data)
                }
            }
        } else {
            // Use transfer for reliable delivery
            transferShotEvent(data)
        }
    }
    
    private func transferShotEvent(_ data: Data) {
        session?.transferUserInfo(["shotEvent": data])
    }
    
    // MARK: - Send Undo Request
    
    func sendUndoRequest() {
        guard let session = session else { return }
        
        // Remove from local history
        if !recentShots.isEmpty {
            recentShots.removeFirst()
        }
        
        let message: [String: Any] = ["undoShot": true]
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Undo send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }
    
    // MARK: - Send Hole Change
    
    /// Send hole change to iPhone when user swipes on watch
    func sendHoleChange(to holeNumber: Int) {
        guard let session = session else { return }
        
        // Update local state
        currentHoleNumber = holeNumber
        
        let message: [String: Any] = ["changeHole": holeNumber]
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Hole change send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }
    
    // MARK: - Send Score Update
    
    /// Send score update to iPhone
    func sendScoreUpdate(holeNumber: Int, grossStrokes: Int, putts: Int?) {
        guard let session = session else { return }
        
        var message: [String: Any] = [
            "scoreUpdate": true,
            "holeNumber": holeNumber,
            "grossStrokes": grossStrokes
        ]
        
        if let putts = putts {
            message["putts"] = putts
        }
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("Score update send failed: \(error)")
            }
        } else {
            session.transferUserInfo(message)
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManagerWatch: WCSessionDelegate {
    
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        Task { @MainActor in
            if let error = error {
                connectionError = "Activation failed: \(error.localizedDescription)"
            } else {
                isPhoneReachable = session.isReachable
            }
        }
    }
    
    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor in
            isPhoneReachable = session.isReachable
        }
    }
    
    // MARK: - Receive Messages
    
    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        Task { @MainActor in
            handleMessage(message)
        }
    }
    
    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        Task { @MainActor in
            handleMessage(message)
            replyHandler(["received": true])
        }
    }
    
    // MARK: - Message Handling
    
    private func handleMessage(_ message: [String: Any]) {
        // Handle current hole update
        if let hole = message["currentHole"] as? Int {
            currentHoleNumber = hole
        }
        
        // Handle round status
        if let active = message["roundActive"] as? Bool {
            isRoundActive = active
            if !active {
                recentShots.removeAll()
            }
        }
        
        // Handle course name
        if let name = message["courseName"] as? String {
            courseName = name
        }
        
        // Handle sync request
        if message["requestSync"] as? Bool == true {
            // Resend any pending shots (if implementing offline queue)
        }
    }
}

// MARK: - Shot Event (Watch-side model)

/// Watch-side shot event model
struct ShotEventWatch: Codable, Identifiable, Equatable {
    let id: UUID
    var timestamp: Date
    var club: ClubWatch
    var confidence: Double?
    var isManual: Bool
    
    /// Club group for backward compatibility
    var clubGroup: ClubGroupWatch {
        club.group
    }
    
    init(club: ClubWatch, confidence: Double? = nil, isManual: Bool = true) {
        self.id = UUID()
        self.timestamp = Date()
        self.club = club
        self.confidence = confidence
        self.isManual = isManual
    }
}

/// Watch-side club group enum (mirrors iOS version)
enum ClubGroupWatch: String, Codable, CaseIterable, Identifiable {
    case driver = "Driver"
    case wood = "Wood"
    case hybrid = "Hybrid"
    case iron = "Iron"
    case wedge = "Wedge"
    case putt = "Putt"
    
    var id: String { rawValue }
    
    var iconName: String {
        switch self {
        case .driver: return "arrow.up.right"
        case .wood: return "arrow.up.forward"
        case .hybrid: return "arrow.up.forward.circle"
        case .iron: return "arrow.right"
        case .wedge: return "arrow.up"
        case .putt: return "circle.dotted"
        }
    }
    
    var shortLabel: String {
        switch self {
        case .driver: return "D"
        case .wood: return "W"
        case .hybrid: return "H"
        case .iron: return "I"
        case .wedge: return "WG"
        case .putt: return "P"
        }
    }
    
    /// Get clubs in this group
    var clubs: [ClubWatch] {
        ClubWatch.allCases.filter { $0.group == self }
    }
}

// MARK: - Specific Club (Watch-side)

/// Individual golf clubs for detailed tracking (mirrors iOS Club enum)
enum ClubWatch: String, Codable, CaseIterable, Identifiable {
    // Driver
    case driver = "Driver"
    
    // Woods
    case wood3 = "3 Wood"
    case wood5 = "5 Wood"
    case wood7 = "7 Wood"
    
    // Hybrids
    case hybrid2 = "2 Hybrid"
    case hybrid3 = "3 Hybrid"
    case hybrid4 = "4 Hybrid"
    case hybrid5 = "5 Hybrid"
    case hybrid6 = "6 Hybrid"
    
    // Irons
    case iron3 = "3 Iron"
    case iron4 = "4 Iron"
    case iron5 = "5 Iron"
    case iron6 = "6 Iron"
    case iron7 = "7 Iron"
    case iron8 = "8 Iron"
    case iron9 = "9 Iron"
    
    // Wedges
    case pitchingWedge = "PW"
    case gapWedge = "GW"
    case sandWedge = "SW"
    case lobWedge = "LW"
    case wedge50 = "50°"
    case wedge52 = "52°"
    case wedge54 = "54°"
    case wedge56 = "56°"
    case wedge58 = "58°"
    case wedge60 = "60°"
    case wedge64 = "64°"
    
    // Putter
    case putter = "Putter"
    
    var id: String { rawValue }
    
    /// The club group this club belongs to
    var group: ClubGroupWatch {
        switch self {
        case .driver:
            return .driver
        case .wood3, .wood5, .wood7:
            return .wood
        case .hybrid2, .hybrid3, .hybrid4, .hybrid5, .hybrid6:
            return .hybrid
        case .iron3, .iron4, .iron5, .iron6, .iron7, .iron8, .iron9:
            return .iron
        case .pitchingWedge, .gapWedge, .sandWedge, .lobWedge,
             .wedge50, .wedge52, .wedge54, .wedge56, .wedge58, .wedge60, .wedge64:
            return .wedge
        case .putter:
            return .putt
        }
    }
    
    /// Short display name for compact UI
    var shortName: String {
        switch self {
        case .driver: return "D"
        case .wood3: return "3W"
        case .wood5: return "5W"
        case .wood7: return "7W"
        case .hybrid2: return "2H"
        case .hybrid3: return "3H"
        case .hybrid4: return "4H"
        case .hybrid5: return "5H"
        case .hybrid6: return "6H"
        case .iron3: return "3i"
        case .iron4: return "4i"
        case .iron5: return "5i"
        case .iron6: return "6i"
        case .iron7: return "7i"
        case .iron8: return "8i"
        case .iron9: return "9i"
        case .pitchingWedge: return "PW"
        case .gapWedge: return "GW"
        case .sandWedge: return "SW"
        case .lobWedge: return "LW"
        case .wedge50: return "50°"
        case .wedge52: return "52°"
        case .wedge54: return "54°"
        case .wedge56: return "56°"
        case .wedge58: return "58°"
        case .wedge60: return "60°"
        case .wedge64: return "64°"
        case .putter: return "P"
        }
    }
    
    /// Common clubs for quick selection (typical bag)
    static var commonClubs: [ClubWatch] {
        [
            .driver,
            .wood3, .wood5,
            .hybrid4, .hybrid5,
            .iron5, .iron6, .iron7, .iron8, .iron9,
            .pitchingWedge, .sandWedge, .lobWedge,
            .putter
        ]
    }
}
