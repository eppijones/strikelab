//
//  CourseSetupView.swift
//  StrikeLabCaddie
//
//  Course and tee data entry view
//

import SwiftUI

struct CourseSetupView: View {
    @Binding var course: Course
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedTeeIndex: Int = 0
    @State private var editedTee: Tee?
    @State private var editedHoles: [HoleInfo] = []
    
    // Tee data fields
    @State private var slopeText: String = ""
    @State private var ratingText: String = ""
    @State private var parText: String = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Course info
                courseInfoSection
                
                // Tee selector
                teeSelector
                
                // Tee data entry
                teeDataSection
                
                // Hole data
                holeDataSection
                
                // Save button
                saveButton
                
                Spacer(minLength: 40)
            }
            .padding()
        }
        .nordicBackground()
        .navigationTitle("Course Setup")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(Theme.nordicForest.opacity(0.7))
            }
        }
        .onAppear {
            setupInitialState()
        }
        .onChange(of: selectedTeeIndex) { _, _ in
            loadSelectedTee()
        }
    }
    
    // MARK: - Course Info Section
    
    private var courseInfoSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(course.name)
                .font(Theme.titleFont(24))
                .foregroundColor(Theme.nordicForest)
            
            Text(course.location)
                .font(Theme.bodyFont(14))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    // MARK: - Tee Selector
    
    private var teeSelector: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SELECT TEE TO EDIT")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            Picker("Tee", selection: $selectedTeeIndex) {
                ForEach(course.tees.indices, id: \.self) { index in
                    Text(course.tees[index].name).tag(index)
                }
            }
            .pickerStyle(.segmented)
        }
    }
    
    // MARK: - Tee Data Section
    
    private var teeDataSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("TEE RATINGS")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            HStack(spacing: 12) {
                // Slope
                VStack(alignment: .leading, spacing: 4) {
                    Text("Slope")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                    
                    TextField("113", text: $slopeText)
                        .keyboardType(.decimalPad)
                        .font(Theme.statFont(18))
                        .foregroundColor(Theme.nordicForest)
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.white.opacity(0.6))
                        )
                }
                
                // Course Rating
                VStack(alignment: .leading, spacing: 4) {
                    Text("Rating")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                    
                    TextField("72.0", text: $ratingText)
                        .keyboardType(.decimalPad)
                        .font(Theme.statFont(18))
                        .foregroundColor(Theme.nordicForest)
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.white.opacity(0.6))
                        )
                }
                
                // Par
                VStack(alignment: .leading, spacing: 4) {
                    Text("Par")
                        .font(Theme.labelFont(12))
                        .foregroundColor(Theme.nordicForest.opacity(0.6))
                    
                    TextField("72", text: $parText)
                        .keyboardType(.numberPad)
                        .font(Theme.statFont(18))
                        .foregroundColor(Theme.nordicForest)
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.white.opacity(0.6))
                        )
                }
            }
            .glassCard()
            
            // Validation message
            if !isValidTeeData {
                Text("Enter slope (55-155), rating, and par to enable handicap calculation")
                    .font(Theme.labelFont(12))
                    .foregroundColor(Theme.overPar)
            }
        }
    }
    
    private var isValidTeeData: Bool {
        guard let slope = Double(slopeText),
              let rating = Double(ratingText),
              let par = Int(parText) else {
            return false
        }
        return HandicapCalculator.isValidSlope(slope) &&
               HandicapCalculator.isValidCourseRating(rating) &&
               par > 60 && par < 80
    }
    
    // MARK: - Hole Data Section
    
    private var holeDataSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("HOLE DATA")
                .font(Theme.labelFont(12))
                .foregroundColor(Theme.nordicForest.opacity(0.6))
            
            // Column headers
            HStack {
                Text("Hole")
                    .frame(width: 45, alignment: .leading)
                Text("Par")
                    .frame(width: 70)
                Text("H.I.")
                    .frame(width: 70)
                Spacer()
            }
            .font(Theme.labelFont(11))
            .foregroundColor(Theme.nordicForest.opacity(0.5))
            .padding(.horizontal, 12)
            
            // Hole rows
            ForEach(editedHoles.indices, id: \.self) { index in
                holeRow(index: index)
            }
        }
    }
    
    private func holeRow(index: Int) -> some View {
        HStack {
            // Hole number
            Text("\(editedHoles[index].number)")
                .font(Theme.statFont(14))
                .frame(width: 45, alignment: .leading)
            
            // Par picker
            Picker("Par", selection: $editedHoles[index].par) {
                Text("3").tag(3)
                Text("4").tag(4)
                Text("5").tag(5)
            }
            .pickerStyle(.segmented)
            .frame(width: 70)
            
            // Handicap index picker
            Picker("HI", selection: $editedHoles[index].handicapIndex) {
                ForEach(1...18, id: \.self) { hi in
                    Text("\(hi)").tag(hi)
                }
            }
            .pickerStyle(.menu)
            .frame(width: 70)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(index % 2 == 0 ? Color.white.opacity(0.3) : Color.clear)
        )
    }
    
    // MARK: - Save Button
    
    private var saveButton: some View {
        Button {
            saveChanges()
        } label: {
            Text("Save Changes")
                .primaryButton()
        }
        .padding(.top, 20)
    }
    
    // MARK: - State Management
    
    private func setupInitialState() {
        editedHoles = course.holes
        loadSelectedTee()
    }
    
    private func loadSelectedTee() {
        guard selectedTeeIndex < course.tees.count else { return }
        let tee = course.tees[selectedTeeIndex]
        editedTee = tee
        
        slopeText = tee.slope.map { String(format: "%.0f", $0) } ?? ""
        ratingText = tee.courseRating.map { String(format: "%.1f", $0) } ?? ""
        parText = tee.par.map { String($0) } ?? ""
    }
    
    private func saveChanges() {
        // Update tee
        if selectedTeeIndex < course.tees.count {
            course.tees[selectedTeeIndex].slope = Double(slopeText)
            course.tees[selectedTeeIndex].courseRating = Double(ratingText)
            course.tees[selectedTeeIndex].par = Int(parText)
        }
        
        // Update holes
        course.holes = editedHoles
        
        dismiss()
    }
}

#Preview {
    NavigationStack {
        CourseSetupView(course: .constant(CourseData.alenda))
    }
}
