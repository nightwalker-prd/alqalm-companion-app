/**
 * ReadingTimer - Timer component for tracking reading speed
 *
 * Displays an interactive timer that users can start when they begin reading
 * a passage. Calculates and displays WPM (words per minute) in real-time.
 *
 * Features:
 * - Start/stop/pause timer controls
 * - Real-time WPM calculation
 * - Session results display
 * - Historical average WPM for the passage
 * - Integrates with study time tracking (fluency strand)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PassageLevel } from '../../types/reading';
import type { ReadingTimeSession } from '../../types/readingTime';
import { FLUENCY_LEVEL_LABELS, FLUENCY_THRESHOLDS } from '../../types/readingTime';
import { useReadingTimer } from '../../hooks/useReadingTimer';
import { classifyFluencyLevel } from '../../lib/readingTimeService';
import { startStudySession, endStudySession } from '../../lib/studyTimeService';
import { Button } from '../ui/Button';

interface ReadingTimerProps {
  /** Passage ID */
  passageId: string;
  /** Passage difficulty level */
  passageLevel: PassageLevel;
  /** Number of words in the passage */
  wordCount: number;
  /** Callback when a timed reading session completes */
  onSessionComplete?: (session: ReadingTimeSession) => void;
}

/**
 * Get color class based on WPM fluency level
 */
function getWpmColorClass(wpm: number): string {
  if (wpm >= FLUENCY_THRESHOLDS.fluent.min) return 'text-[var(--color-success)]';
  if (wpm >= FLUENCY_THRESHOLDS.advanced.min) return 'text-[var(--color-primary)]';
  if (wpm >= FLUENCY_THRESHOLDS.intermediate.min) return 'text-[var(--color-gold-dark)]';
  if (wpm >= FLUENCY_THRESHOLDS.developing.min) return 'text-[var(--color-ink)]';
  return 'text-[var(--color-ink-muted)]';
}

export function ReadingTimer({
  passageId,
  passageLevel,
  wordCount,
  onSessionComplete,
}: ReadingTimerProps) {
  const {
    state,
    start: startTimer,
    stop: stopTimer,
    pause,
    resume,
    cancel: cancelTimer,
    averageWpm,
    timesRead,
  } = useReadingTimer(passageId, passageLevel, wordCount);

  // Show results after completing a timed session
  const [lastSession, setLastSession] = useState<ReadingTimeSession | null>(null);

  // Track study session ID for proper cleanup
  const studySessionIdRef = useRef<string | null>(null);

  // Start both reading timer and study session
  const start = useCallback(() => {
    // Start study session for fluency strand (timed-reading activity)
    studySessionIdRef.current = startStudySession('timed-reading');
    startTimer();
  }, [startTimer]);

  // Stop both timers and record results
  const stop = useCallback(
    (completed: boolean): ReadingTimeSession | null => {
      // End study session
      if (studySessionIdRef.current) {
        endStudySession();
        studySessionIdRef.current = null;
      }
      return stopTimer(completed);
    },
    [stopTimer]
  );

  // Cancel both timers without recording
  const cancel = useCallback(() => {
    // End study session (still records time even when cancelled)
    if (studySessionIdRef.current) {
      endStudySession();
      studySessionIdRef.current = null;
    }
    cancelTimer();
  }, [cancelTimer]);

  // Cleanup on unmount - end study session if still active
  useEffect(() => {
    return () => {
      if (studySessionIdRef.current) {
        endStudySession();
        studySessionIdRef.current = null;
      }
    };
  }, []);

  // Handle stop button - complete reading
  const handleComplete = useCallback(() => {
    const session = stop(true);
    if (session) {
      setLastSession(session);
      onSessionComplete?.(session);
    }
  }, [stop, onSessionComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancel();
    setLastSession(null);
  }, [cancel]);

  // Dismiss results
  const dismissResults = useCallback(() => {
    setLastSession(null);
  }, []);

  // Start new session (after viewing results)
  const handleStartNew = useCallback(() => {
    setLastSession(null);
    start();
  }, [start]);

  // Show session results
  if (lastSession) {
    const fluencyLevel = classifyFluencyLevel(lastSession.wpm);
    const fluencyLabel = FLUENCY_LEVEL_LABELS[fluencyLevel];

    return (
      <div
        className="
          bg-[var(--color-sand-50)]
          border border-[var(--color-sand-200)]
          rounded-[var(--radius-lg)]
          p-4
          text-center
          animate-fade-in
        "
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-[var(--color-success)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-[var(--color-ink)]">
            Timed Reading Complete!
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-[var(--color-ink-muted)]">Time</div>
            <div className="text-2xl font-mono font-bold text-[var(--color-ink)]">
              {formatDuration(lastSession.durationMs)}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--color-ink-muted)]">Speed</div>
            <div className={`text-2xl font-bold ${getWpmColorClass(lastSession.wpm)}`}>
              {lastSession.wpm} <span className="text-sm font-normal">WPM</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-[var(--color-ink)] mb-4">
          {fluencyLabel}
          {averageWpm && lastSession.wpm > averageWpm && (
            <span className="text-[var(--color-success)] ml-2">
              (+{Math.round(lastSession.wpm - averageWpm)} from average)
            </span>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <Button variant="secondary" size="sm" onClick={dismissResults}>
            Dismiss
          </Button>
          <Button variant="primary" size="sm" onClick={handleStartNew}>
            Read Again
          </Button>
        </div>
      </div>
    );
  }

  // Timer not started
  if (!state.isRunning && !state.isPaused) {
    return (
      <div
        className="
          bg-[var(--color-sand-50)]
          border border-[var(--color-sand-200)]
          rounded-[var(--radius-lg)]
          p-4
        "
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-[var(--color-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-[var(--color-ink)]">
                Timed Reading
              </span>
            </div>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              Track your reading speed to measure fluency
            </p>
            {timesRead > 0 && averageWpm && (
              <p className="text-sm text-[var(--color-ink)] mt-1">
                Your average: <span className={getWpmColorClass(averageWpm)}>{averageWpm} WPM</span>
                {' '}({timesRead} {timesRead === 1 ? 'reading' : 'readings'})
              </p>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={start}
            leftIcon={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            Start Timer
          </Button>
        </div>
      </div>
    );
  }

  // Timer running or paused
  return (
    <div
      className={`
        border rounded-[var(--radius-lg)] p-4
        ${state.isPaused
          ? 'bg-[var(--color-gold-light)] border-[var(--color-gold)]'
          : 'bg-[var(--color-primary-light)] border-[var(--color-primary)]'
        }
      `}
    >
      <div className="flex items-center justify-between">
        {/* Timer display */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div
              className={`
                text-3xl font-mono font-bold
                ${state.isPaused ? 'text-[var(--color-gold-dark)]' : 'text-[var(--color-primary)]'}
              `}
            >
              {state.formattedTime}
            </div>
            <div className="text-xs text-[var(--color-ink-muted)]">
              {state.isPaused ? 'Paused' : 'Reading...'}
            </div>
          </div>

          {/* Live WPM */}
          {state.elapsedMs >= 5000 && (
            <div className="text-center border-l border-[var(--color-sand-300)] pl-4">
              <div className={`text-xl font-bold ${getWpmColorClass(state.currentWpm)}`}>
                {Math.round(state.currentWpm)}
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">WPM</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {/* Pause/Resume button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={state.isPaused ? resume : pause}
            aria-label={state.isPaused ? 'Resume' : 'Pause'}
          >
            {state.isPaused ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Button>

          {/* Cancel button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            aria-label="Cancel"
          >
            <svg className="w-5 h-5 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </Button>

          {/* Complete button */}
          <Button
            variant="success"
            size="sm"
            onClick={handleComplete}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default ReadingTimer;
