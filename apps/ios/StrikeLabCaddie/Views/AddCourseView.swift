//
//  AddCourseView.swift
//  StrikeLabCaddie
//
//  Form to create a new golf course
//

import SwiftUI

struct AddCourseView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var persistenceManager: PersistenceManager
    
    @State private var courseName: String = ""
    @State private var courseLocation: String = ""
    @State private var teeName: String = "White"
    @State private var slope: String = ""
    @State private var courseRating: String = ""
    @State private var par: String = "72"
    
    // Hole data
    @State private var holePars: [Int] = Array(repeating: 4, count: 18)
    @State private var holeHandicaps: [Int] = Array(1...18)
    @State private var currentHoleIndex: Int = 0
    
    var body: some View {
        Form {
            // Course info
            Section {
                TextField("Course Name", text: $courseName)
                TextField("Location (optional)", text: $courseLocation)
            } header: {
                Text("Course Information")
            }
            
            // Tee data
            Section {
                TextField("Tee Name (e.g., White, Yellow)", text: $teeName)
                
                HStack {
                    Text("Slope")
                    Spacer()
                    TextField("113", text: $slope)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
                
                HStack {
                    Text("Course Rating")
                    Spacer()
                    TextField("72.0", text: $courseRating)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
                
                HStack {
                    Text("Par")
                    Spacer()
                    TextField("72", text: $par)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
            } header: {
                Text("Tee Data")
            } footer: {
                Text("Enter slope, rating, and par for accurate handicap calculation.")
            }
            
            // Hole configuration
            Section {
                ForEach(0..<18, id: \.self) { index in
                    HStack {
                        Text("Hole \(index + 1)")
                            .frame(width: 70, alignment: .leading)
                        
                        Spacer()
                        
                        // Par picker
                        Menu {
                            ForEach([3, 4, 5], id: \.self) { parValue in
                                Button("Par \(parValue)") {
                                    holePars[index] = parValue
                                }
                            }
                        } label: {
                            Text("Par \(holePars[index])")
                                .foregroundColor(Theme.nordicForest)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(Theme.champagne.opacity(0.3))
                                )
                        }
                        
                        // Handicap picker
                        Menu {
                            ForEach(1...18, id: \.self) { hi in
                                Button("HI \(hi)") {
                                    holeHandicaps[index] = hi
                                }
                            }
                        } label: {
                            Text("HI \(holeHandicaps[index])")
                                .foregroundColor(Theme.nordicForest)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(Theme.nordicSage.opacity(0.3))
                                )
                        }
                    }
                }
            } header: {
                Text("Hole Configuration")
            } footer: {
                Text("Set par and handicap index for each hole. HI 1 = hardest hole.")
            }
            
            // Quick setup options
            Section {
                Button("Standard Par 72 (4×Par 3, 10×Par 4, 4×Par 5)") {
                    applyStandardLayout()
                }
                .foregroundColor(Theme.neuralCyan)
                
                Button("Auto-assign Handicap Indexes") {
                    autoAssignHandicaps()
                }
                .foregroundColor(Theme.neuralCyan)
            } header: {
                Text("Quick Setup")
            }
        }
        .navigationTitle("New Course")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(Theme.nordicForest.opacity(0.7))
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                Button("Save") {
                    saveCourse()
                }
                .fontWeight(.semibold)
                .foregroundColor(Theme.nordicForest)
                .disabled(courseName.isEmpty)
            }
        }
    }
    
    // MARK: - Quick Setup
    
    private func applyStandardLayout() {
        // Standard layout: Par 3s on holes 3, 7, 12, 16
        // Par 5s on holes 2, 6, 10, 14
        // Rest are Par 4s
        let par3Holes = [3, 7, 12, 16]
        let par5Holes = [2, 6, 10, 14]
        
        for i in 0..<18 {
            let holeNum = i + 1
            if par3Holes.contains(holeNum) {
                holePars[i] = 3
            } else if par5Holes.contains(holeNum) {
                holePars[i] = 5
            } else {
                holePars[i] = 4
            }
        }
        
        par = "72"
    }
    
    private func autoAssignHandicaps() {
        // Assign handicaps 1-18 in order for now
        // In practice, this would be based on hole difficulty
        holeHandicaps = Array(1...18)
    }
    
    // MARK: - Save
    
    private func saveCourse() {
        // Create holes
        let holes = (0..<18).map { index in
            HoleInfo(
                number: index + 1,
                par: holePars[index],
                handicapIndex: holeHandicaps[index]
            )
        }
        
        // Create tee
        var tee = Tee(name: teeName.isEmpty ? "White" : teeName)
        if let slopeValue = Double(slope) {
            tee.slope = slopeValue
        }
        if let ratingValue = Double(courseRating) {
            tee.courseRating = ratingValue
        }
        if let parValue = Int(par) {
            tee.par = parValue
        }
        
        // Create course
        let course = Course(
            name: courseName,
            location: courseLocation.isEmpty ? "Custom Course" : courseLocation,
            holes: holes,
            tees: [tee]
        )
        
        // Save to persistence
        persistenceManager.addCourse(course)
        
        dismiss()
    }
}

#Preview {
    NavigationStack {
        AddCourseView()
            .environmentObject(PersistenceManager())
    }
}
