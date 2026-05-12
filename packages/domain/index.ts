/**
 * StrikeLab shared domain types.
 * These mirror SQLAlchemy + Pydantic models in apps/api and Swift models in apps/ios.
 */

export type Club =
  | 'DRV' | '3W' | '5W' | '7W'
  | '2H' | '3H' | '4H' | '5H'
  | '2i' | '3i' | '4i' | '5i' | '6i' | '7i' | '8i' | '9i'
  | 'PW' | 'GW' | 'SW' | 'LW' | '50' | '52' | '54' | '56' | '58' | '60'
  | 'PUT';

export type Source = 'TRACKMAN' | 'FORESIGHT' | 'TOPGOLF' | 'GSPRO' | 'UNEEKOR' | 'RAPSODO' | 'SKYTRAK' | 'CSV' | 'CADDIE';

export type SessionType = 'range' | 'sim' | 'course';

export interface Shot {
  id: string;
  sessionId: string;
  shotNumber: number;
  club: Club;
  carryYards?: number;
  totalYards?: number;
  ballSpeed?: number;
  smashFactor?: number;
  spinRpm?: number;
  launchAngle?: number;
  faceAngle?: number;
  facePath?: number;
  attackAngle?: number;
  isMishit: boolean;
}

export interface Session {
  id: string;
  userId: string;
  source: Source;
  sessionType: SessionType;
  name: string;
  notes?: string;
  sessionDate: string;
  computedStats?: Record<string, number>;
}

export interface Round {
  id: string;
  userId: string;
  courseId?: string;
  courseName: string;
  date: string;
  selectedTee?: string;
  isComplete: boolean;
  currentHoleNumber: number;
  totalGross: number;
  totalNet: number;
  holes: RoundHole[];
}

export interface RoundHole {
  holeNumber: number;
  par: number;
  handicapIndex: number;
  strokesReceived: number;
  grossStrokes: number;
  netStrokes: number;
  putts: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  notes?: string;
}

export interface RoundShot extends Shot {
  roundId: string;
  holeNumber: number;
  startLocation?: { lat: number; lon: number };
  endLocation?: { lat: number; lon: number };
  distanceYards?: number;
  lieType?: 'tee' | 'fairway' | 'rough' | 'sand' | 'green' | 'fringe' | 'recovery';
  outcome?: 'pure' | 'good' | 'okay' | 'mishit' | 'bad';
  missDirection?: 'left' | 'right' | 'long' | 'short' | 'fat' | 'thin';
}

export interface ClubDNA {
  club: Club;
  averageCarry: number;
  carrySigma: number;
  dispersionLeft: number;
  dispersionRight: number;
  totalShots: number;
  lastUpdated: string;
}

export interface PlayerShotDNA {
  userId: string;
  lastUpdated: string;
  totalShots: number;
  consistencyScore: number;
  clubProfiles: Record<string, ClubDNA>;
  commonMistakes: string[];
}

export interface CoachReport {
  id: string;
  userId: string;
  sessionId?: string;
  diagnosis: string;
  interpretation: string;
  prescription: string;
  validation: string;
  nextBestMove: string;
  reportType: 'session' | 'multi_session' | 'periodic';
  language: 'en' | 'no';
  createdAt: string;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  focusArea: string;
  weeks: number;
  currentWeek: number;
  structure: TrainingBlock[];
  active: boolean;
  startDate: string;
}

export interface TrainingBlock {
  week: number;
  title: string;
  description: string;
  drillIds: string[];
  validationMetrics: { metric: string; target: number }[];
}

export interface TeeTime {
  id: string;
  userId: string;
  courseId?: string;
  courseName: string;
  teeTime: string;
  players: number;
  notes?: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  bookingProvider?: 'golfbox' | 'chronogolf' | 'manual';
  bookingReference?: string;
}
