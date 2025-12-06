import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4 | 8 | 16;
export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface ReplayControllerState {
  playbackState: PlaybackState;
  playbackSpeed: PlaybackSpeed;
  currentTime: number;
  duration: number;
  progress: number; // 0-1
}

export interface ReplayControllerActions {
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  seekTo: (time: number) => void;
  seekToProgress: (progress: number) => void;
}

export interface UseReplayControllerReturn extends ReplayControllerState, ReplayControllerActions {}

/**
 * Custom hook for managing session replay playback
 * Provides play/pause/resume controls, speed adjustment, and timeline scrubbing
 */
export function useReplayController(sessionDuration: number = 0): UseReplayControllerReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  const setStoreTime = useAppStore((state) => state.setCurrentTime);

  // Calculate progress (0-1)
  const progress = sessionDuration > 0 ? currentTime / sessionDuration : 0;

  // Update store time whenever current time changes
  useEffect(() => {
    setStoreTime(currentTime);
  }, [currentTime, setStoreTime]);

  // Animation loop for playback
  const animate = useCallback(
    (timestamp: number) => {
      if (lastUpdateTimeRef.current === 0) {
        lastUpdateTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      lastUpdateTimeRef.current = timestamp;

      setCurrentTime((prevTime) => {
        const newTime = prevTime + deltaTime * playbackSpeed;

        // Stop at end of session
        if (newTime >= sessionDuration) {
          setPlaybackState('stopped');
          return sessionDuration;
        }

        return newTime;
      });

      if (playbackState === 'playing') {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    },
    [playbackSpeed, sessionDuration, playbackState]
  );

  // Start/stop animation loop based on playback state
  useEffect(() => {
    if (playbackState === 'playing') {
      lastUpdateTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastUpdateTimeRef.current = 0;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState, animate]);

  const play = useCallback(() => {
    if (currentTime >= sessionDuration) {
      setCurrentTime(0);
    }
    setPlaybackState('playing');
  }, [currentTime, sessionDuration]);

  const pause = useCallback(() => {
    setPlaybackState('paused');
  }, []);

  const resume = useCallback(() => {
    if (playbackState === 'paused') {
      setPlaybackState('playing');
    }
  }, [playbackState]);

  const stop = useCallback(() => {
    setPlaybackState('stopped');
    setCurrentTime(0);
  }, []);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, sessionDuration));
      setCurrentTime(clampedTime);
    },
    [sessionDuration]
  );

  const seekToProgress = useCallback(
    (progressValue: number) => {
      const clampedProgress = Math.max(0, Math.min(progressValue, 1));
      const time = clampedProgress * sessionDuration;
      setCurrentTime(time);
    },
    [sessionDuration]
  );

  return {
    playbackState,
    playbackSpeed,
    currentTime,
    duration: sessionDuration,
    progress,
    play,
    pause,
    resume,
    stop,
    setSpeed,
    seekTo,
    seekToProgress,
  };
}
