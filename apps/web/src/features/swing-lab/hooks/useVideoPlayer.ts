import { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_FPS = 30;

export interface VideoPlayerState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekToFrame: (frame: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  setPlaybackRate: (rate: number) => void;
  setVideoSrc: (src: string) => void;
}

export function useVideoPlayer(): VideoPlayerState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [fps] = useState(DEFAULT_FPS);
  const rafId = useRef<number | null>(null);

  const currentFrame = Math.round(currentTime * fps);
  const totalFrames = Math.round(duration * fps);

  // Use requestAnimationFrame for smooth time tracking during playback
  const startTracking = useCallback(() => {
    const tick = () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        setCurrentTime(video.currentTime);
        rafId.current = requestAnimationFrame(tick);
      }
    };
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const stopTracking = useCallback(() => {
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentTime(video.currentTime);
    };
    const onPlay = () => {
      setIsPlaying(true);
      startTracking();
    };
    const onPause = () => {
      setIsPlaying(false);
      stopTracking();
      // Get exact time on pause
      setCurrentTime(video.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      stopTracking();
    };
    const onSeeked = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('seeked', onSeeked);

    return () => {
      stopTracking();
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [startTracking, stopTracking]);

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }, []);

  const seekToFrame = useCallback(
    (frame: number) => {
      const video = videoRef.current;
      if (!video) return;
      const time = frame / fps;
      video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
    },
    [fps]
  );

  const stepForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) video.pause();
    // Snap to next frame boundary
    const nextFrame = Math.round(video.currentTime * fps) + 1;
    video.currentTime = Math.min(video.duration, nextFrame / fps);
  }, [fps]);

  const stepBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) video.pause();
    // Snap to previous frame boundary
    const prevFrame = Math.max(0, Math.round(video.currentTime * fps) - 1);
    video.currentTime = prevFrame / fps;
  }, [fps]);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
    }
    setPlaybackRateState(rate);
  }, []);

  const setVideoSrc = useCallback((src: string) => {
    const video = videoRef.current;
    if (video) {
      video.src = src;
      video.load();
    }
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    currentFrame,
    totalFrames,
    fps,
    play,
    pause,
    togglePlay,
    seek,
    seekToFrame,
    stepForward,
    stepBackward,
    setPlaybackRate,
    setVideoSrc,
  };
}
