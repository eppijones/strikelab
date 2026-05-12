//
//  ExportManager.swift
//  StrikeLabCaddie
//
//  Export rounds and data as JSON or CSV
//

import Foundation
import SwiftUI

/// Manages exporting golf round data in various formats
@MainActor
class ExportManager {
    
    private let fileManager = FileManager.default
    
    private var tempDirectory: URL {
        fileManager.temporaryDirectory
    }
    
    // MARK: - JSON Export
    
    /// Export a single round as JSON file
    func exportRoundAsJSON(_ round: Round) -> URL? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        
        do {
            let data = try encoder.encode(round)
            let filename = "round_\(round.course.name.replacingOccurrences(of: " ", with: "_"))_\(formatDate(round.date)).json"
            let fileURL = tempDirectory.appendingPathComponent(filename)
            try data.write(to: fileURL)
            return fileURL
        } catch {
            print("Failed to export round as JSON: \(error)")
            return nil
        }
    }
    
    /// Export one driving-range / practice session for StrikeLab web import.
    /// Uses ISO-8601 dates so the browser can parse reliably.
    func exportPracticeSessionForStrikeLab(_ session: PracticeSession) -> URL? {
        let envelope = StrikeLabRangeExport(session: session)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        do {
            let data = try encoder.encode(envelope)
            let idPrefix = session.id.uuidString.prefix(8)
            let filename = "strikelab_range_\(idPrefix)_\(formatDate(session.startTime)).json"
            let fileURL = tempDirectory.appendingPathComponent(filename)
            try data.write(to: fileURL, options: [.atomic])
            return fileURL
        } catch {
            print("Failed to export practice session JSON: \(error)")
            return nil
        }
    }

    /// Export all rounds as a JSON backup file
    func exportAllRoundsAsJSON(_ rounds: [Round]) -> URL? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        
        let backup = RoundsBackup(
            exportDate: Date(),
            roundCount: rounds.count,
            rounds: rounds
        )
        
        do {
            let data = try encoder.encode(backup)
            let filename = "nordic_caddie_backup_\(formatDate(Date())).json"
            let fileURL = tempDirectory.appendingPathComponent(filename)
            try data.write(to: fileURL)
            return fileURL
        } catch {
            print("Failed to export rounds backup: \(error)")
            return nil
        }
    }
    
    // MARK: - CSV Export
    
    /// Export rounds summary as CSV
    func exportRoundsAsCSV(_ rounds: [Round]) -> URL? {
        var csv = "Date,Course,Tee,Gross,Net,To Par,Holes Completed,Total Putts\n"
        
        for round in rounds.sorted(by: { $0.date > $1.date }) {
            let date = formatDate(round.date)
            let course = escapeCSV(round.course.name)
            let tee = escapeCSV(round.selectedTee?.name ?? "N/A")
            let gross = round.grossTotal
            let net = round.netTotal
            let toPar = round.formattedOverUnder
            let holes = round.holesCompleted
            let putts = round.totalPutts
            
            csv += "\(date),\(course),\(tee),\(gross),\(net),\(toPar),\(holes),\(putts)\n"
        }
        
        do {
            let filename = "rounds_export_\(formatDate(Date())).csv"
            let fileURL = tempDirectory.appendingPathComponent(filename)
            try csv.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            print("Failed to export CSV: \(error)")
            return nil
        }
    }
    
    /// Export detailed round data as CSV (hole-by-hole)
    func exportRoundDetailedCSV(_ round: Round) -> URL? {
        var csv = "Hole,Par,HI,Strokes Received,Gross,Net,Putts,Fairway,GIR\n"
        
        for hole in round.holes {
            let fairway = hole.fairwayHit.map { $0 ? "Hit" : "Miss" } ?? ""
            let gir = hole.greenInRegulation.map { $0 ? "Yes" : "No" } ?? ""
            
            csv += "\(hole.holeNumber),"
            csv += "\(hole.par),"
            csv += "\(hole.handicapIndex),"
            csv += "\(hole.strokesReceived),"
            csv += "\(hole.grossStrokes ?? 0),"
            csv += "\(hole.netStrokes ?? 0),"
            csv += "\(hole.putts ?? 0),"
            csv += "\(fairway),"
            csv += "\(gir)\n"
        }
        
        // Add summary row
        csv += "\nTOTAL,\(round.course.totalPar),,,"
        csv += "\(round.grossTotal),\(round.netTotal),\(round.totalPutts),,\n"
        
        do {
            let filename = "round_\(escapeFilename(round.course.name))_\(formatDate(round.date))_detailed.csv"
            let fileURL = tempDirectory.appendingPathComponent(filename)
            try csv.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            print("Failed to export detailed CSV: \(error)")
            return nil
        }
    }
    
    // MARK: - Helpers
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func escapeCSV(_ string: String) -> String {
        if string.contains(",") || string.contains("\"") || string.contains("\n") {
            return "\"\(string.replacingOccurrences(of: "\"", with: "\"\""))\""
        }
        return string
    }
    
    private func escapeFilename(_ string: String) -> String {
        string.replacingOccurrences(of: " ", with: "_")
            .replacingOccurrences(of: "/", with: "-")
            .replacingOccurrences(of: ":", with: "-")
    }
}

// MARK: - Supporting Types

struct RoundsBackup: Codable {
    let exportDate: Date
    let roundCount: Int
    let rounds: [Round]
    var appVersion: String = "1.0.0"
}

// MARK: - Export Options View

struct ExportOptionsView: View {
    @Environment(\.dismiss) private var dismiss
    let rounds: [Round]
    
    @State private var exportURL: URL?
    @State private var showShareSheet = false
    @State private var isExporting = false
    
    private let exportManager = ExportManager()
    
    var body: some View {
        List {
            Section {
                Button {
                    exportJSONBackup()
                } label: {
                    HStack {
                        Image(systemName: "doc.badge.arrow.up")
                            .foregroundColor(Theme.neuralCyan)
                            .frame(width: 30)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Full Backup (JSON)")
                                .foregroundColor(Theme.nordicForest)
                            Text("All \(rounds.count) rounds with complete data")
                                .font(Theme.labelFont(12))
                                .foregroundColor(Theme.nordicForest.opacity(0.6))
                        }
                    }
                }
                
                Button {
                    exportCSVSummary()
                } label: {
                    HStack {
                        Image(systemName: "tablecells")
                            .foregroundColor(Theme.nordicSage)
                            .frame(width: 30)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Summary (CSV)")
                                .foregroundColor(Theme.nordicForest)
                            Text("Round scores in spreadsheet format")
                                .font(Theme.labelFont(12))
                                .foregroundColor(Theme.nordicForest.opacity(0.6))
                        }
                    }
                }
            } header: {
                Text("Export All Rounds")
            }
            
            Section {
                Text("Select a round to export its detailed hole-by-hole data.")
                    .font(Theme.labelFont(13))
                    .foregroundColor(Theme.nordicForest.opacity(0.6))
                
                ForEach(rounds.prefix(10)) { round in
                    Button {
                        exportRoundDetail(round)
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(round.course.name)
                                    .foregroundColor(Theme.nordicForest)
                                Text(round.date, style: .date)
                                    .font(Theme.labelFont(12))
                                    .foregroundColor(Theme.nordicForest.opacity(0.5))
                            }
                            
                            Spacer()
                            
                            Text("\(round.grossTotal)")
                                .font(Theme.statFont(16))
                                .foregroundColor(Theme.nordicForest)
                        }
                    }
                }
            } header: {
                Text("Export Single Round (Detailed)")
            }
        }
        .navigationTitle("Export Data")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") {
                    dismiss()
                }
                .foregroundColor(Theme.nordicForest)
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
        .overlay {
            if isExporting {
                ProgressView("Exporting...")
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Export Actions
    
    private func exportJSONBackup() {
        isExporting = true
        Task {
            if let url = exportManager.exportAllRoundsAsJSON(rounds) {
                exportURL = url
                showShareSheet = true
            }
            isExporting = false
        }
    }
    
    private func exportCSVSummary() {
        isExporting = true
        Task {
            if let url = exportManager.exportRoundsAsCSV(rounds) {
                exportURL = url
                showShareSheet = true
            }
            isExporting = false
        }
    }
    
    private func exportRoundDetail(_ round: Round) {
        isExporting = true
        Task {
            if let url = exportManager.exportRoundDetailedCSV(round) {
                exportURL = url
                showShareSheet = true
            }
            isExporting = false
        }
    }
}

#Preview {
    NavigationStack {
        ExportOptionsView(rounds: [])
    }
}
