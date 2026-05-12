import type { PracticeSession, SwingMotionData } from './types'

function median(xs: number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Same lever table as `SwingLeverRatio` in iOS `SwingAnalytics.swift`. */
export function leverRatioForClubRaw(club: string): number {
  const c = club.toLowerCase()
  if (c.includes('putter')) return 1.0
  if (c.includes('wood') || c === 'driver') return c.includes('driver') ? 3.2 : 3.0
  if (c.includes('hybrid')) return 2.9
  if (c.includes('iron') || c.match(/\d\s*iron/i) || c.match(/^\d+i$/)) return 2.7
  if (c.includes('°') || ['pw', 'gw', 'sw', 'lw'].some((x) => c === x)) return 2.4
  if (c.includes('wedge') || c === 'pw') return 2.4
  return 2.7
}

export function tempoFromMotion(motion: SwingMotionData): {
  ratio: number | null
  backswingSeconds: number
  downswingSeconds: number
} {
  const p = motion.phases
  const dt = motion.sampleInterval
  const bw = Math.max(0, (p.topIdx - p.backswingStartIdx) * dt)
  const dw = Math.max(0, (p.impactIdx - p.topIdx) * dt)
  const unreliable = p.unreliable === true
  if (unreliable) {
    return { ratio: null, backswingSeconds: bw, downswingSeconds: dw }
  }
  const ratio = bw > 0 && dw > 0.001 ? bw / dw : null
  return { ratio, backswingSeconds: bw, downswingSeconds: dw }
}

/** Peak |userAcceleration| in g over samples between top and impact (rough proxy). */
export function peakAccelTopToImpact(motion: SwingMotionData): number | null {
  const samples = (motion as { samples?: { tMs: number; ax: number; ay: number; az: number }[] }).samples
  if (!samples?.length) return null
  const p = motion.phases
  const from = Math.max(0, p.topIdx)
  const to = Math.min(samples.length - 1, p.impactIdx)
  let peak = 0
  for (let i = from; i <= to; i++) {
    const s = samples[i]
    const mag = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az)
    if (mag > peak) peak = mag
  }
  return peak
}

export function handSpeedMpsEstimate(motion: SwingMotionData, armLengthM = 0.7): number | null {
  const samples = (motion as { samples?: { tMs: number; gx: number; gy: number; gz: number }[] }).samples
  if (!samples?.length) return null
  const p = motion.phases
  const from = Math.max(0, p.topIdx)
  const to = Math.min(samples.length - 1, p.impactIdx)
  let peak = 0
  for (let i = from; i <= to; i++) {
    const s = samples[i]
    const mag = Math.sqrt(s.gx * s.gx + s.gy * s.gy + s.gz * s.gz)
    if (mag > peak) peak = mag
  }
  return peak * armLengthM
}

export function clubSpeedMph(motion: SwingMotionData, club: string, armLengthM = 0.7): number | null {
  const hand = handSpeedMpsEstimate(motion, armLengthM)
  if (hand == null) return null
  const lever = leverRatioForClubRaw(club)
  const mph = hand * 2.237 * lever
  return mph
}

export interface SessionVerification {
  shotCount: number
  uniqueIds: number
  duplicateIds: string[]
  withMotion: number
  withoutMotion: number
  withSamples: number
  withHeartRate: number
  withReliableTempo: number
  timeOrderIssues: number
  gapsSeconds: number[]
  medianGapSeconds: number | null
  maxGapSeconds: number | null
  sessionDurationMinutes: number | null
}

export function verifySession(session: PracticeSession): SessionVerification {
  const shots = [...session.shots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  const ids = shots.map((s) => s.id)
  const unique = new Set(ids)
  const idCounts = new Map<string, number>()
  for (const id of ids) {
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
  }
  const duplicateIds = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id)

  let withMotion = 0
  let withSamples = 0
  let withHeartRate = 0
  let withReliableTempo = 0
  for (const sh of shots) {
    if (sh.motion) {
      withMotion++
      if (sh.motion.samples?.length) withSamples++
      const t = tempoFromMotion(sh.motion)
      if (t.ratio != null) withReliableTempo++
    }
    if (sh.heartRate?.heartRate != null) withHeartRate++
  }

  let timeOrderIssues = 0
  const gaps: number[] = []
  for (let i = 1; i < shots.length; i++) {
    const prev = new Date(shots[i - 1].timestamp).getTime()
    const cur = new Date(shots[i].timestamp).getTime()
    if (cur < prev) timeOrderIssues++
    const g = (cur - prev) / 1000
    if (g >= 0 && g < 3600) gaps.push(g)
  }
  const sortedGaps = [...gaps].sort((a, b) => a - b)
  const medianGapSeconds = median(sortedGaps)
  const maxGapSeconds = sortedGaps.length ? sortedGaps[sortedGaps.length - 1] : null

  const start = new Date(session.startTime).getTime()
  const end = session.endTime
    ? new Date(session.endTime).getTime()
    : shots.length
      ? new Date(shots[shots.length - 1].timestamp).getTime()
      : start
  const sessionDurationMinutes =
    Number.isFinite(end - start) ? Math.round((end - start) / 60000) : null

  return {
    shotCount: shots.length,
    uniqueIds: unique.size,
    duplicateIds: [...new Set(duplicateIds)],
    withMotion,
    withoutMotion: shots.length - withMotion,
    withSamples,
    withHeartRate,
    withReliableTempo,
    timeOrderIssues,
    gapsSeconds: gaps,
    medianGapSeconds,
    maxGapSeconds,
    sessionDurationMinutes,
  }
}

export function shotsWithTempoSeries(session: PracticeSession): { index: number; ratio: number }[] {
  const out: { index: number; ratio: number }[] = []
  session.shots.forEach((shot, i) => {
    if (!shot.motion) return
    const t = tempoFromMotion(shot.motion)
    if (t.ratio != null) out.push({ index: i + 1, ratio: t.ratio })
  })
  return out
}

export function medianTempo(session: PracticeSession): number | null {
  const xs = shotsWithTempoSeries(session).map((p) => p.ratio)
  if (!xs.length) return null
  xs.sort((a, b) => a - b)
  const mid = Math.floor(xs.length / 2)
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2
}

export function clubHistogram(session: PracticeSession): { club: string; count: number }[] {
  const m = new Map<string, number>()
  for (const s of session.shots) {
    m.set(s.club, (m.get(s.club) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([club, count]) => ({ club, count }))
    .sort((a, b) => b.count - a.count)
}
