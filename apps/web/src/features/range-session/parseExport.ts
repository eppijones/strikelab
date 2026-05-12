import type {
  HeartRateData,
  PracticeSession,
  PracticeShot,
  StrikeLabRangeExport,
  SwingMotionData,
  SwingPhaseMarkers,
  SwingSample,
} from './types'

export interface ParseResult {
  ok: true
  export: StrikeLabRangeExport
  session: PracticeSession
}

export interface ParseError {
  ok: false
  message: string
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function normalizePhases(raw: Record<string, unknown>): SwingPhaseMarkers {
  return {
    backswingStartIdx: Number(raw.backswingStartIdx ?? raw.backswing_start_idx ?? 0),
    topIdx: Number(raw.topIdx ?? raw.top_idx ?? 0),
    impactIdx: Number(raw.impactIdx ?? raw.impact_idx ?? 0),
    finishIdx: Number(raw.finishIdx ?? raw.finish_idx ?? 0),
    unreliable: Boolean(raw.unreliable ?? false),
  }
}

function finiteNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : undefined
}

function normalizeSample(raw: Record<string, unknown>): SwingSample | null {
  const tMs = finiteNumber(raw.tMs ?? raw.t_ms)
  const ax = finiteNumber(raw.ax)
  const ay = finiteNumber(raw.ay)
  const az = finiteNumber(raw.az)
  const gx = finiteNumber(raw.gx)
  const gy = finiteNumber(raw.gy)
  const gz = finiteNumber(raw.gz)
  if (
    tMs == null ||
    ax == null ||
    ay == null ||
    az == null ||
    gx == null ||
    gy == null ||
    gz == null
  ) {
    return null
  }
  return {
    tMs,
    ax,
    ay,
    az,
    gx,
    gy,
    gz,
    qw: finiteNumber(raw.qw),
    qx: finiteNumber(raw.qx),
    qy: finiteNumber(raw.qy),
    qz: finiteNumber(raw.qz),
  }
}

function normalizeNumberArray(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const xs = raw.map(finiteNumber).filter((x): x is number => x != null)
  return xs.length ? xs : undefined
}

function normalizeMotion(m: Record<string, unknown>): SwingMotionData {
  const phasesRaw = (m.phases as Record<string, unknown>) || {}
  const samples = Array.isArray(m.samples)
    ? m.samples.filter((x): x is Record<string, unknown> => isRecord(x)).map(normalizeSample).filter((x): x is SwingSample => x != null)
    : undefined
  return {
    sampleInterval: Number(m.sampleInterval ?? m.sample_interval ?? 0.01),
    phases: normalizePhases(phasesRaw),
    peakAcceleration: finiteNumber(m.peakAcceleration ?? m.peak_acceleration),
    peakRotationRate: finiteNumber(m.peakRotationRate ?? m.peak_rotation_rate),
    swingTempo: finiteNumber(m.swingTempo ?? m.swing_tempo),
    impactConfirmed: (m.impactConfirmed ?? m.impact_confirmed) as boolean | undefined,
    capturedAt: (m.capturedAt ?? m.captured_at) as string | undefined,
    samples,
    accelerationProfile: normalizeNumberArray(m.accelerationProfile ?? m.acceleration_profile),
    gyroProfile: normalizeNumberArray(m.gyroProfile ?? m.gyro_profile),
  }
}

function normalizeHeartRate(raw: unknown): HeartRateData | null | undefined {
  if (!isRecord(raw)) return raw == null ? raw : undefined
  return {
    heartRate: finiteNumber(raw.heartRate ?? raw.heart_rate),
    hrv: finiteNumber(raw.hrv) ?? null,
    preMedian: finiteNumber(raw.preMedian ?? raw.pre_median) ?? null,
    postMedian: finiteNumber(raw.postMedian ?? raw.post_median) ?? null,
    snapshot: raw.snapshot,
  }
}

function normalizeAudio(raw: unknown): PracticeShot['audio'] {
  if (!isRecord(raw)) return raw == null ? raw : undefined
  const url = raw.url
  if (typeof url !== 'string' || !url) return undefined
  return {
    url,
    contentType: (raw.contentType ?? raw.content_type) as string | null | undefined,
    byteCount: finiteNumber(raw.byteCount ?? raw.byte_count) ?? null,
  }
}

function normalizeShot(raw: Record<string, unknown>): PracticeShot {
  const motionRaw = raw.motion
  const motion =
    motionRaw && typeof motionRaw === 'object' && !Array.isArray(motionRaw)
      ? normalizeMotion(motionRaw as Record<string, unknown>)
      : undefined
  return {
    id: String(raw.id),
    timestamp: String(raw.timestamp),
    club: String(raw.club),
    estimatedDistance: (raw.estimatedDistance ?? raw.estimated_distance) as number | null | undefined,
    quality: raw.quality as string | undefined,
    missType: (raw.missType ?? raw.miss_type) as string | null | undefined,
    notes: raw.notes as string | null | undefined,
    motion,
    heartRate: normalizeHeartRate(raw.heartRate ?? raw.heart_rate),
    confidence: (raw.confidence as number | null | undefined) ?? null,
    audio: normalizeAudio(raw.audio),
  }
}

/** Canonical session shape for the Range Lab UI (handles snake_case from API / iOS encoder). */
export function normalizePracticeSession(raw: Record<string, unknown>): PracticeSession {
  const shotsIn = Array.isArray(raw.shots) ? raw.shots : []
  const shots = shotsIn.filter((x): x is Record<string, unknown> => isRecord(x)).map((s) => normalizeShot(s))
  const start =
    typeof raw.startTime === 'string'
      ? raw.startTime
      : typeof raw.start_time === 'string'
        ? raw.start_time
        : ''
  const end = (raw.endTime ?? raw.end_time) as string | null | undefined
  return {
    id: String(raw.id),
    startTime: start,
    endTime: end ?? null,
    shots,
    focusClub: (raw.focusClub ?? raw.focus_club) as string | null | undefined ?? null,
    notes: (raw.notes as string | null | undefined) ?? null,
    location: (raw.location as string | null | undefined) ?? null,
  }
}

function parseEnvelope(root: Record<string, unknown>): ParseResult | ParseError {
  if (!isRecord(root.session) || !Array.isArray(root.session.shots)) {
    return { ok: false, message: 'Envelope is missing session.shots array.' }
  }
  const session = normalizePracticeSession(root.session as Record<string, unknown>)
  const schemaVersion =
    typeof root.schemaVersion === 'number'
      ? root.schemaVersion
      : typeof root.schema_version === 'number'
        ? root.schema_version
        : 1
  const exportedAt =
    typeof root.exportedAt === 'string'
      ? root.exportedAt
      : typeof root.exported_at === 'string'
        ? root.exported_at
        : new Date().toISOString()
  const app = typeof root.app === 'string' ? root.app : 'unknown'
  const exp: StrikeLabRangeExport = { schemaVersion, exportedAt, app, session }
  return { ok: true, export: exp, session }
}

/** Parse already-parsed JSON (e.g. API `payload` object). */
export function parseStrikeLabRangeValue(root: unknown): ParseResult | ParseError {
  if (!isRecord(root)) {
    return { ok: false, message: 'JSON root must be an object.' }
  }
  if ('session' in root && isRecord(root.session)) {
    return parseEnvelope(root)
  }
  if (Array.isArray(root.shots) && typeof root.id === 'string') {
    const st = root.startTime ?? root.start_time
    if (typeof st !== 'string') {
      return { ok: false, message: 'Practice session missing startTime / start_time.' }
    }
    const session = normalizePracticeSession(root)
    const exp: StrikeLabRangeExport = {
      schemaVersion: 0,
      exportedAt: new Date().toISOString(),
      app: 'raw-practice-session',
      session,
    }
    return { ok: true, export: exp, session }
  }
  return {
    ok: false,
    message:
      'Unrecognized format. Export from StrikeLab Caddie or use a payload from GET /range-sessions/{id}.',
  }
}

/** Accepts StrikeLab envelope or a raw `PracticeSession` JSON from `practiceSessions.json`. */
export function parseStrikeLabRangeJson(text: string): ParseResult | ParseError {
  let root: unknown
  try {
    root = JSON.parse(text) as unknown
  } catch {
    return { ok: false, message: 'Invalid JSON.' }
  }
  return parseStrikeLabRangeValue(root)
}
