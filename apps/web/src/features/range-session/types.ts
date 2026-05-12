/** Mirrors `SwingPhaseMarkers` + `SwingMotionData` from iOS. */

export interface SwingPhaseMarkers {
  backswingStartIdx: number
  topIdx: number
  impactIdx: number
  finishIdx: number
  unreliable?: boolean
}

export interface SwingMotionData {
  sampleInterval: number
  phases: SwingPhaseMarkers
  peakAcceleration?: number
  peakRotationRate?: number
  swingTempo?: number
  impactConfirmed?: boolean
  capturedAt?: string
  samples?: SwingSample[]
  accelerationProfile?: number[]
  gyroProfile?: number[]
}

export interface SwingSample {
  tMs: number
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
  qw?: number
  qx?: number
  qy?: number
  qz?: number
}

export interface HeartRateData {
  heartRate?: number
  hrv?: number | null
  preMedian?: number | null
  postMedian?: number | null
  snapshot?: unknown
}

export interface PracticeShot {
  id: string
  timestamp: string
  club: string
  estimatedDistance?: number | null
  quality?: string
  missType?: string | null
  notes?: string | null
  motion?: SwingMotionData | null
  heartRate?: HeartRateData | null
  confidence?: number | null
  audio?: {
    url: string
    contentType?: string | null
    byteCount?: number | null
  } | null
}

export interface PracticeSession {
  id: string
  startTime: string
  endTime?: string | null
  shots: PracticeShot[]
  focusClub?: string | null
  notes?: string | null
  location?: string | null
}

export interface StrikeLabRangeExport {
  schemaVersion: number
  exportedAt: string
  app: string
  session: PracticeSession
}
