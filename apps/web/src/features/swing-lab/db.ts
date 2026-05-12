/**
 * Re-export the Dexie repository from lib/db with a slimmed surface used by
 * the page components. `SwingSession` retains its full schema; helpers here
 * just provide ergonomic creation + thumbnail handling.
 */
export { db, SwingRepository } from './lib/db'
export type {
  SwingSession,
  SwingPhase,
  PhaseKeypoints,
  PhaseAnalysis,
  Keypoints,
  KeypointName,
  ProductMode,
  ProGolfer,
  FreeAnnotation,
} from './types'
