//
//  SwingAudioPlayerCard.swift
//  StrikeLabCaddie
//
//  Plays back the ±1.5 s mic clip captured around impact, when one
//  was shipped from the watch (mic capture is opt-in). Also visualises
//  a coarse waveform so the player can SEE the click moment line up
//  with where the gauges said impact happened.
//
//  Wraps `AVAudioPlayer` directly — clips are short and infrequent so
//  no need for AVAudioEngine machinery here.
//

import SwiftUI
import AVFoundation

struct SwingAudioPlayerCard: View {
    let swingId: UUID

    @EnvironmentObject var persistenceManager: PersistenceManager
    @State private var player: AVAudioPlayer?
    @State private var isPlaying = false
    @State private var progress: Double = 0
    @State private var ticker: Timer?
    @State private var waveform: [Float] = []

    var body: some View {
        let url = persistenceManager.swingAudioURL(for: swingId)
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("AUDIO · ±1.5s impact clip")
                    .font(Theme.labelFont(10))
                    .tracking(1.4)
                    .foregroundColor(Theme.ink3)
                Spacer()
                if let p = player {
                    Text(String(format: "%.1fs", p.duration))
                        .font(Theme.labelFont(10))
                        .foregroundColor(Theme.ink3)
                }
            }

            if url == nil {
                emptyState
            } else {
                waveformStrip
                playRow
            }
        }
        .padding(14)
        .background(Theme.surface)
        .overlay(Rectangle().stroke(Theme.lineStrong, lineWidth: 1))
        .onAppear { setup() }
        .onDisappear { teardown() }
        .onChange(of: swingId) { _, _ in
            teardown()
            setup()
        }
    }

    private var emptyState: some View {
        Text("No audio for this swing. Enable mic-confirmed impact in Settings to record next time.")
            .font(Theme.labelFont(11))
            .foregroundColor(Theme.ink3)
            .padding(.vertical, 8)
    }

    // MARK: - Waveform

    private var waveformStrip: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let n = waveform.count
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Theme.bg2)
                    .frame(height: h)
                if n > 1 {
                    Path { p in
                        let cx = h / 2
                        let stepX = w / CGFloat(n)
                        for i in 0..<n {
                            let amp = CGFloat(min(1, abs(waveform[i]))) * (h / 2 - 2)
                            let x = CGFloat(i) * stepX
                            p.move(to: CGPoint(x: x, y: cx - amp))
                            p.addLine(to: CGPoint(x: x, y: cx + amp))
                        }
                    }
                    .stroke(Theme.accent, lineWidth: 1)
                }
                // Centre line.
                Rectangle()
                    .fill(Theme.line)
                    .frame(height: 0.5)
                    .offset(y: h / 2 - 0.25)
                // Playback cursor.
                if isPlaying || progress > 0 {
                    Path { p in
                        let x = w * CGFloat(progress)
                        p.move(to: CGPoint(x: x, y: 0))
                        p.addLine(to: CGPoint(x: x, y: h))
                    }
                    .stroke(Theme.ink2, lineWidth: 1.5)
                }
            }
        }
        .frame(height: 56)
    }

    // MARK: - Play row

    private var playRow: some View {
        HStack(spacing: 10) {
            Button { togglePlay() } label: {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(Theme.accent)
            }
            .buttonStyle(.plain)
            VStack(alignment: .leading, spacing: 2) {
                Text(isPlaying ? "Playing" : "Tap to listen")
                    .font(Theme.statFont(13))
                    .foregroundColor(Theme.ink)
                Text("Click should land near the centre of the clip.")
                    .font(Theme.labelFont(10))
                    .foregroundColor(Theme.ink3)
            }
            Spacer()
        }
    }

    // MARK: - Lifecycle

    private func setup() {
        guard let url = persistenceManager.swingAudioURL(for: swingId) else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback)
            try AVAudioSession.sharedInstance().setActive(true)
            let p = try AVAudioPlayer(contentsOf: url)
            p.prepareToPlay()
            player = p
            waveform = Self.loadWaveform(url: url, bins: 240)
        } catch {
            // Player init failed — leave player nil; the empty state
            // will render.
        }
    }

    private func teardown() {
        ticker?.invalidate()
        ticker = nil
        player?.stop()
        player = nil
    }

    private func togglePlay() {
        guard let p = player else { return }
        if p.isPlaying {
            p.pause()
            isPlaying = false
            ticker?.invalidate()
            ticker = nil
            return
        }
        if p.currentTime >= p.duration - 0.05 {
            p.currentTime = 0
            progress = 0
        }
        p.play()
        isPlaying = true
        ticker = Timer.scheduledTimer(withTimeInterval: 1 / 30, repeats: true) { _ in
            DispatchQueue.main.async {
                guard let p = player else { return }
                progress = p.duration > 0 ? p.currentTime / p.duration : 0
                if !p.isPlaying {
                    isPlaying = false
                    ticker?.invalidate()
                    ticker = nil
                }
            }
        }
    }

    // MARK: - Waveform extraction

    /// Read a short PCM-float file into `bins` averaged abs-magnitude
    /// samples for display. Plenty fast for a 3 s clip; keeps the UI
    /// dependency-free.
    private static func loadWaveform(url: URL, bins: Int) -> [Float] {
        guard let file = try? AVAudioFile(forReading: url) else { return [] }
        let frameCount = AVAudioFrameCount(file.length)
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat,
                                            frameCapacity: frameCount) else { return [] }
        do { try file.read(into: buffer) } catch { return [] }
        guard let chPtr = buffer.floatChannelData?[0] else { return [] }
        let n = Int(buffer.frameLength)
        if n <= bins {
            return (0..<n).map { chPtr[$0] }
        }
        let step = max(1, n / bins)
        var out: [Float] = []
        out.reserveCapacity(bins)
        for b in 0..<bins {
            let start = b * step
            let end = min(n, start + step)
            var sum: Float = 0
            for i in start..<end {
                sum += abs(chPtr[i])
            }
            let mean = sum / Float(max(1, end - start))
            out.append(mean)
        }
        // Normalise to [0, 1].
        let maxV = max(1e-6, out.max() ?? 1)
        return out.map { $0 / maxV }
    }
}
