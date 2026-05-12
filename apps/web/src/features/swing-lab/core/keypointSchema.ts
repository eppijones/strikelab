import type { KeypointName, SwingPhase } from '../types';

export type { SwingPhase };

export const PHASE_ORDER: SwingPhase[] = [
  'address',
  'takeaway',
  'top',
  'transition',
  'impact',
  'followThrough',
];

export const PHASE_LABELS: Record<SwingPhase, string> = {
  address: 'Address',
  takeaway: 'Takeaway',
  top: 'Top',
  transition: 'Transition',
  impact: 'Impact',
  followThrough: 'Follow Through',
};

/**
 * Keypoints required for each swing phase.
 */
export const PHASE_KEYPOINT_SETS: Record<SwingPhase, KeypointName[]> = {
  address: [
    'head',
    'leadShoulder',
    'trailShoulder',
    'leadHip',
    'trailHip',
    'leadKnee',
    'trailKnee',
    'leadAnkle',
    'trailAnkle',
    'clubHead',
    'clubGrip',
    'ballPosition',
    'targetLineRef',
  ],
  takeaway: [
    'head',
    'leadShoulder',
    'trailShoulder',
    'leadHip',
    'trailHip',
    'leadWrist',
    'trailWrist',
    'clubHead',
    'clubGrip',
  ],
  top: [
    'head',
    'leadShoulder',
    'trailShoulder',
    'leadHip',
    'trailHip',
    'leadWrist',
    'trailWrist',
    'leadElbow',
    'trailElbow',
    'clubHead',
    'clubGrip',
  ],
  transition: [
    'head',
    'leadShoulder',
    'trailShoulder',
    'leadHip',
    'trailHip',
    'leadWrist',
    'trailWrist',
    'clubHead',
    'clubGrip',
  ],
  impact: [
    'head',
    'leadShoulder',
    'trailShoulder',
    'leadHip',
    'trailHip',
    'leadWrist',
    'trailWrist',
    'clubHead',
    'clubGrip',
    'ballPosition',
    'targetLineRef',
  ],
  followThrough: [
    'head',
    'leadShoulder',
    'trailShoulder',
    'leadHip',
    'trailHip',
    'leadWrist',
    'trailWrist',
  ],
};

export const SNAP_RADIUS = 0.015;
export const ANCHOR_RADIUS = 8;
export const ANCHOR_HIT_RADIUS = 14;
