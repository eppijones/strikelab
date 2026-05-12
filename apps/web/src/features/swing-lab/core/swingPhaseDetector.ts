import { SWING_PHASES, type SwingPhase, type PhaseKeypoints } from '../types';

export { SWING_PHASES };
export type { SwingPhase };

/**
 * V1: Manual phase detection — user marks phases by scrubbing video.
 * V2 (future): Auto-detect from keypoint movement patterns.
 */
export function detectPhaseFromKeypoints(
  _keypointSequence: PhaseKeypoints[]
): SwingPhase {
  // V2 placeholder: analyze movement patterns to detect phase
  // For now, return 'address' as default
  return 'address';
}

/**
 * Get the next phase in sequence (for guided workflow).
 */
export function getNextPhase(
  current: SwingPhase
): SwingPhase | null {
  const idx = SWING_PHASES.indexOf(current);
  if (idx < SWING_PHASES.length - 1) {
    return SWING_PHASES[idx + 1];
  }
  return null;
}

/**
 * Get the previous phase in sequence.
 */
export function getPreviousPhase(
  current: SwingPhase
): SwingPhase | null {
  const idx = SWING_PHASES.indexOf(current);
  if (idx > 0) {
    return SWING_PHASES[idx - 1];
  }
  return null;
}
