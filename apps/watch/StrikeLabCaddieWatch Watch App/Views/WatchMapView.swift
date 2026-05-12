//
//  WatchMapView.swift
//  StrikeLabCaddieWatch Watch App
//
//  Course map view with Digital Crown zoom and pan gestures
//

import SwiftUI
import WatchKit

struct WatchMapView: View {
    let holeNumber: Int
    
    @Environment(\.dismiss) private var dismiss
    
    // Digital Crown zoom control
    @State private var zoomLevel: Double = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastDragOffset: CGSize = .zero
    @FocusState private var isFocused: Bool
    
    // Theme colors
    let nordicForest = Color(red: 30/255, green: 58/255, blue: 43/255)
    let nordicSage = Color(red: 142/255, green: 184/255, blue: 151/255)
    let neuralCyan = Color(red: 0/255, green: 212/255, blue: 255/255)
    let champagne = Color(red: 212/255, green: 197/255, blue: 168/255)
    let fairwayGreen = Color(red: 76/255, green: 140/255, blue: 80/255)
    let roughGreen = Color(red: 60/255, green: 100/255, blue: 60/255)
    let bunkerTan = Color(red: 210/255, green: 190/255, blue: 150/255)
    
    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ZStack {
                    // Background
                    roughGreen
                        .ignoresSafeArea()
                    
                    // Hole visualization
                    holeVisualization
                        .scaleEffect(zoomLevel)
                        .offset(offset)
                        .gesture(
                            DragGesture()
                                .onChanged { value in
                                    offset = CGSize(
                                        width: lastDragOffset.width + value.translation.width,
                                        height: lastDragOffset.height + value.translation.height
                                    )
                                }
                                .onEnded { _ in
                                    lastDragOffset = offset
                                }
                        )
                    
                    // Zoom indicator overlay
                    VStack {
                        Spacer()
                        HStack {
                            Image(systemName: "plus.magnifyingglass")
                                .font(.system(size: 10))
                            Text(String(format: "%.1fx", zoomLevel))
                                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        }
                        .foregroundColor(.white.opacity(0.7))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.black.opacity(0.4))
                        .cornerRadius(8)
                        .padding(.bottom, 4)
                    }
                }
                .focusable()
                .focused($isFocused)
                .digitalCrownRotation(
                    $zoomLevel,
                    from: 0.5,
                    through: 4.0,
                    by: 0.1,
                    sensitivity: .medium,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )
            }
            .navigationTitle("Hole \(holeNumber)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 12))
                    }
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        resetView()
                    } label: {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 12))
                    }
                }
            }
            .onAppear {
                isFocused = true
            }
        }
    }
    
    // MARK: - Hole Visualization
    
    private var holeVisualization: some View {
        ZStack {
            // Fairway shape (varies by hole)
            fairwayShape
                .fill(fairwayGreen)
            
            // Bunkers
            bunkers
            
            // Green
            greenShape
                .fill(nordicSage)
            
            // Tee box
            teeBox
            
            // Flag/Pin
            flagPin
            
            // Distance markers
            distanceMarkers
        }
        .frame(width: 150, height: 200)
    }
    
    private var fairwayShape: some Shape {
        // Create a fairway path based on hole number to give variety
        FairwayPath(holeNumber: holeNumber)
    }
    
    private var greenShape: some Shape {
        // Oval green at the top
        Ellipse()
    }
    
    private var bunkers: some View {
        Group {
            // Left bunker
            if holeNumber % 3 != 0 {
                Ellipse()
                    .fill(bunkerTan)
                    .frame(width: 20, height: 12)
                    .offset(x: -35, y: -60)
            }
            
            // Right bunker
            if holeNumber % 2 == 0 {
                Ellipse()
                    .fill(bunkerTan)
                    .frame(width: 18, height: 10)
                    .offset(x: 30, y: -55)
            }
            
            // Greenside bunker
            Ellipse()
                .fill(bunkerTan)
                .frame(width: 15, height: 8)
                .offset(x: holeNumber % 2 == 0 ? -25 : 25, y: -85)
        }
    }
    
    private var teeBox: some View {
        RoundedRectangle(cornerRadius: 2)
            .fill(fairwayGreen.opacity(0.8))
            .frame(width: 20, height: 10)
            .overlay(
                RoundedRectangle(cornerRadius: 2)
                    .stroke(Color.white.opacity(0.5), lineWidth: 1)
            )
            .offset(y: 85)
    }
    
    private var flagPin: some View {
        VStack(spacing: 0) {
            // Flag
            Triangle()
                .fill(Color.red)
                .frame(width: 10, height: 8)
                .offset(x: 5)
            
            // Pole
            Rectangle()
                .fill(Color.white)
                .frame(width: 1, height: 12)
        }
        .offset(y: -82)
    }
    
    private var distanceMarkers: some View {
        VStack(spacing: 0) {
            // Distance to pin (example)
            Text("150")
                .font(.system(size: 8, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
                .padding(.horizontal, 4)
                .padding(.vertical, 2)
                .background(nordicForest.opacity(0.8))
                .cornerRadius(3)
                .offset(y: 20)
            
            Text("100")
                .font(.system(size: 7, weight: .semibold, design: .monospaced))
                .foregroundColor(.white.opacity(0.8))
                .offset(y: -30)
        }
    }
    
    // MARK: - Actions
    
    private func resetView() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            zoomLevel = 1.0
            offset = .zero
            lastDragOffset = .zero
        }
        WKInterfaceDevice.current().play(.click)
    }
}

// MARK: - Custom Shapes

struct FairwayPath: Shape {
    let holeNumber: Int
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        let centerX = rect.midX
        let height = rect.height
        
        // Create varied fairway shapes based on hole number
        let curveOffset: CGFloat = CGFloat((holeNumber % 4) - 2) * 10
        
        path.move(to: CGPoint(x: centerX - 15, y: height - 20))
        
        // Left edge
        path.addCurve(
            to: CGPoint(x: centerX - 25 + curveOffset, y: height * 0.3),
            control1: CGPoint(x: centerX - 20, y: height * 0.7),
            control2: CGPoint(x: centerX - 30 + curveOffset/2, y: height * 0.5)
        )
        
        // Top (green approach)
        path.addCurve(
            to: CGPoint(x: centerX + 25 - curveOffset, y: height * 0.3),
            control1: CGPoint(x: centerX - 20, y: height * 0.25),
            control2: CGPoint(x: centerX + 20, y: height * 0.25)
        )
        
        // Right edge
        path.addCurve(
            to: CGPoint(x: centerX + 15, y: height - 20),
            control1: CGPoint(x: centerX + 30 - curveOffset/2, y: height * 0.5),
            control2: CGPoint(x: centerX + 20, y: height * 0.7)
        )
        
        path.closeSubpath()
        
        return path
    }
}

struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

#Preview {
    WatchMapView(holeNumber: 5)
}
