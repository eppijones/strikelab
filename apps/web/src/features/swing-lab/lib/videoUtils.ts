/**
 * Generate a thumbnail from a video blob at a specific time (default: 0.5s)
 */
export async function generateThumbnail(
  videoBlob: Blob,
  timeSeconds = 0.5,
  width = 320,
  height = 180
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.muted = true;
    video.preload = 'auto';

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video for thumbnail'));
    });
  });
}

/**
 * Detect FPS from video metadata (fallback: 30fps)
 */
export function getDefaultFPS(): number {
  return 30;
}

/**
 * Calculate frame time from FPS
 */
export function getFrameDuration(fps = 30): number {
  return 1 / fps;
}

/**
 * Format time as MM:SS.ms
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}
