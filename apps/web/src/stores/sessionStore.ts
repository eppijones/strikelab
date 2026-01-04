import { create } from 'zustand'

interface Shot {
  id: string
  shotNumber: number
  club: string
  carryDistance: number
  totalDistance: number
  ballSpeed: number
  clubSpeed: number
  smashFactor: number
  launchAngle: number
  spinRate: number
  spinAxis: number
  faceAngle: number
  faceToPath: number
  attackAngle: number
  offlineDistance: number
  isMishit: boolean
  mishitType?: string
}

interface Session {
  id: string
  source: string
  sessionType: string
  name?: string
  sessionDate: string
  shotCount: number
  computedStats?: {
    strikeScore?: number
    faceControlScore?: number
    distanceControlScore?: number
    dispersionScore?: number
    avgCarry?: Record<string, number>
    clubsUsed?: string[]
  }
}

interface SessionState {
  sessions: Session[]
  currentSession: Session | null
  currentShots: Shot[]
  excludeMishits: boolean
  selectedClub: string | null
  setSessions: (sessions: Session[]) => void
  setCurrentSession: (session: Session | null) => void
  setCurrentShots: (shots: Shot[]) => void
  setExcludeMishits: (exclude: boolean) => void
  setSelectedClub: (club: string | null) => void
  toggleShotMishit: (shotId: string, isMishit: boolean, mishitType?: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  currentShots: [],
  excludeMishits: true,
  selectedClub: null,
  
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  setCurrentShots: (shots) => set({ currentShots: shots }),
  
  setExcludeMishits: (exclude) => set({ excludeMishits: exclude }),
  
  setSelectedClub: (club) => set({ selectedClub: club }),
  
  toggleShotMishit: (shotId, isMishit, mishitType) => set((state) => ({
    currentShots: state.currentShots.map((shot) =>
      shot.id === shotId ? { ...shot, isMishit, mishitType } : shot
    ),
  })),
}))
