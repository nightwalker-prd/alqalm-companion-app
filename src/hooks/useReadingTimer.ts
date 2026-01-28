/**
 * useReadingTimer - Hook for managing reading timer state
 *
 * Provides a React-friendly interface to the readingTimeService.
 * Handles automatic timer updates and cleanup.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PassageLevel } from '../types/reading';
import type { ReadingTimeSession } from '../types/readingTime';
import {
  startReadingSession,
  stopReadingSession,
  pauseReadingSession,
  resumeReadingSession,
  cancelReadingSession,
  getActiveSession,
  getElapsedReadingTime,
  calculateWPM,
  getPassageAverageWPM,
  getPassageReadingHistory,
} from '../lib/readingTimeService';

/**
 * Timer state for UI display
 */
export interface ReadingTimerState {
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer is paused */
  isPaused: boolean;
  /** Elapsed time in milliseconds (excluding paused time) */
  elapsedMs: number;
  /** Current WPM (calculated in real-time) */
  currentWpm: number;
  /** Formatted time display (MM:SS) */
  formattedTime: string;
  /** Session ID (if active) */
  sessionId: string | null;
}

/**
 * Return value from useReadingTimer hook
 */
export interface UseReadingTimerReturn {
  /** Current timer state */
  state: ReadingTimerState;
  /** Start the timer for a passage */
  start: () => void;
  /** Stop the timer and record the session */
  stop: (completed: boolean) => ReadingTimeSession | null;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Cancel the timer without recording */
  cancel: () => void;
  /** Toggle between paused and running */
  toggle: () => void;
  /** Historical average WPM for this passage */
  averageWpm: number | null;
  /** Number of times this passage has been timed */
  timesRead: number;
}

/**
 * Format milliseconds to MM:SS string
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Hook for managing reading timer
 *
 * @param passageId - ID of the passage being read
 * @param passageLevel - Difficulty level of the passage
 * @param wordCount - Number of words in the passage
 */
export function useReadingTimer(
  passageId: string,
  passageLevel: PassageLevel,
  wordCount: number
): UseReadingTimerReturn {
  // Timer state
  const [state, setState] = useState<ReadingTimerState>(() => {
    // Check if there's an existing active session for this passage
    const active = getActiveSession();
    if (active && active.passageId === passageId) {
      const elapsed = getElapsedReadingTime();
      return {
        isRunning: !active.isPaused,
        isPaused: active.isPaused,
        elapsedMs: elapsed,
        currentWpm: calculateWPM(wordCount, elapsed),
        formattedTime: formatTime(elapsed),
        sessionId: active.id,
      };
    }
    return {
      isRunning: false,
      isPaused: false,
      elapsedMs: 0,
      currentWpm: 0,
      formattedTime: '00:00',
      sessionId: null,
    };
  });

  // Historical stats
  const [averageWpm, setAverageWpm] = useState<number | null>(() =>
    getPassageAverageWPM(passageId)
  );
  const [timesRead, setTimesRead] = useState<number>(() =>
    getPassageReadingHistory(passageId).length
  );

  // Refs to avoid stale closures in interval callback
  const wordCountRef = useRef(wordCount);
  
  // Update ref when wordCount changes (in effect, not during render)
  useEffect(() => {
    wordCountRef.current = wordCount;
  }, [wordCount]);

  // Timer interval ref
  const intervalRef = useRef<number | null>(null);

  // Update timer display every 100ms when running
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = window.setInterval(() => {
        const elapsed = getElapsedReadingTime();
        setState((prev) => ({
          ...prev,
          elapsedMs: elapsed,
          currentWpm: calculateWPM(wordCountRef.current, elapsed),
          formattedTime: formatTime(elapsed),
        }));
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.isPaused]);

  // Start timer
  const start = useCallback(() => {
    const sessionId = startReadingSession(passageId, passageLevel, wordCount);
    if (sessionId) {
      setState({
        isRunning: true,
        isPaused: false,
        elapsedMs: 0,
        currentWpm: 0,
        formattedTime: '00:00',
        sessionId,
      });
    }
  }, [passageId, passageLevel, wordCount]);

  // Stop timer and record session
  const stop = useCallback(
    (completed: boolean): ReadingTimeSession | null => {
      const result = stopReadingSession(completed);
      setState({
        isRunning: false,
        isPaused: false,
        elapsedMs: 0,
        currentWpm: 0,
        formattedTime: '00:00',
        sessionId: null,
      });

      // Update historical stats
      if (result) {
        setAverageWpm(getPassageAverageWPM(passageId));
        setTimesRead((prev) => prev + 1);
      }

      return result;
    },
    [passageId]
  );

  // Pause timer
  const pause = useCallback(() => {
    if (pauseReadingSession()) {
      setState((prev) => ({
        ...prev,
        isPaused: true,
      }));
    }
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    if (resumeReadingSession()) {
      setState((prev) => ({
        ...prev,
        isPaused: false,
      }));
    }
  }, []);

  // Cancel timer
  const cancel = useCallback(() => {
    cancelReadingSession();
    setState({
      isRunning: false,
      isPaused: false,
      elapsedMs: 0,
      currentWpm: 0,
      formattedTime: '00:00',
      sessionId: null,
    });
  }, []);

  // Toggle pause/resume
  const toggle = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isPaused, state.isRunning, resume, pause, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    start,
    stop,
    pause,
    resume,
    cancel,
    toggle,
    averageWpm,
    timesRead,
  };
}

export default useReadingTimer;
