import { useState, useCallback } from 'react';

/**
 * Hook to manage fluency timer state
 */
export function useFluencyTimer(durationMs: number) {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsComplete(false);
    setElapsedMs(0);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const complete = useCallback(() => {
    setIsRunning(false);
    setIsComplete(true);
    setElapsedMs(durationMs);
  }, [durationMs]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setElapsedMs(0);
  }, []);

  const handleTick = useCallback((remainingMs: number) => {
    setElapsedMs(durationMs - remainingMs);
  }, [durationMs]);

  return {
    isRunning,
    isComplete,
    elapsedMs,
    remainingMs: durationMs - elapsedMs,
    start,
    stop,
    complete,
    reset,
    handleTick,
  };
}
