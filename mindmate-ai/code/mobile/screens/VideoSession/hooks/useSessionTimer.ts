/**
 * useSessionTimer Hook for MindMate AI Video Session
 * Manages session duration, warnings, and time limits
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Timer configuration
export interface TimerConfig {
  maxDuration: number; // Maximum session duration in minutes
  warningThreshold: number; // Show warning when this many minutes remain
  autoEnd: boolean; // Automatically end session when max duration reached
}

// Timer state
export interface TimerState {
  elapsedSeconds: number;
  remainingSeconds: number;
  formattedTime: string;
  formattedRemaining: string;
  isWarning: boolean;
  isCritical: boolean;
  progress: number; // 0-1
}

// Default configuration
const DEFAULT_CONFIG: TimerConfig = {
  maxDuration: 50, // 50 minutes (standard therapy session)
  warningThreshold: 5, // 5 minutes warning
  autoEnd: false,
};

/**
 * Format seconds to MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to HH:MM:SS for longer sessions
 */
export const formatTimeLong = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * useSessionTimer hook
 */
export const useSessionTimer = (
  config: Partial<TimerConfig> = {}
): {
  state: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  isRunning: boolean;
  isPaused: boolean;
} => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const maxDurationSeconds = mergedConfig.maxDuration * 60;
  const warningThresholdSeconds = mergedConfig.warningThreshold * 60;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate derived state
  const remainingSeconds = Math.max(0, maxDurationSeconds - elapsedSeconds);
  const isWarning = remainingSeconds <= warningThresholdSeconds && remainingSeconds > 60;
  const isCritical = remainingSeconds <= 60 && remainingSeconds > 0;
  const progress = Math.min(1, elapsedSeconds / maxDurationSeconds);

  const formattedTime = formatTimeLong(elapsedSeconds);
  const formattedRemaining = formatTime(remainingSeconds);

  const state: TimerState = {
    elapsedSeconds,
    remainingSeconds,
    formattedTime,
    formattedRemaining,
    isWarning,
    isCritical,
    progress,
  };

  // Start the timer
  const start = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsPaused(false);
    
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        
        // Check if max duration reached
        if (next >= maxDurationSeconds) {
          if (mergedConfig.autoEnd) {
            // Timer will stop but session should be ended by caller
          }
        }
        
        return next;
      });
    }, 1000);
  }, [isRunning, maxDurationSeconds, mergedConfig.autoEnd]);

  // Pause the timer
  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    
    setIsPaused(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning, isPaused]);

  // Resume the timer
  const resume = useCallback(() => {
    if (!isPaused) return;
    
    setIsPaused(false);
    
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [isPaused]);

  // Reset the timer
  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    start,
    pause,
    resume,
    reset,
    isRunning,
    isPaused,
  };
};

export default useSessionTimer;
