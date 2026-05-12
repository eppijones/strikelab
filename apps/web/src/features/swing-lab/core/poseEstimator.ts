import type { Keypoints, PhaseKeypoints, PoseEstimator } from '../types';

/**
 * V1: Manual pose estimation — user places keypoints by clicking on video.
 * Returns stored keypoint positions.
 */
export class ManualPoseEstimator implements PoseEstimator {
  readonly type = 'manual' as const;
  private storedKeypoints: PhaseKeypoints = {};

  setKeypoints(keypoints: PhaseKeypoints) {
    this.storedKeypoints = { ...keypoints };
  }

  async detect(_frame: HTMLVideoElement): Promise<Keypoints> {
    // In manual mode, we just return whatever the user has placed
    return this.storedKeypoints as Keypoints;
  }
}

/**
 * V2 placeholder: MediaPipe pose estimation
 * export class MediaPipePoseEstimator implements PoseEstimator {
 *   readonly type = 'mediapipe' as const;
 *   readonly confidence = 0;
 *   async detect(frame: HTMLVideoElement): Promise<Keypoints> { ... }
 * }
 */
