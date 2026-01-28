/**
 * React hook for async frequency data access.
 *
 * Provides a React-friendly interface to the frequency service with:
 * - Automatic loading trigger
 * - Loading/error state tracking
 * - Re-render on state changes
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import type { WordFrequencyInfo, FrequencyBand } from '../lib/frequencyService';
import {
  loadFrequencyData,
  isFrequencyLoaded,
  isFrequencyLoading,
  getFrequencyError,
  getWordFrequency,
  getWordsFrequency,
  getCorpusSize,
  getFrequencyBand,
  getFrequencyBandLabel,
  getFrequencyBandColor,
  getFrequencyStats,
  sortByFrequency,
  subscribeFrequency,
} from '../lib/frequencyService';

/**
 * Return type for useFrequency hook
 */
export interface UseFrequencyReturn {
  /** Whether frequency data is loaded and ready */
  isLoaded: boolean;
  /** Whether frequency data is currently loading */
  isLoading: boolean;
  /** Loading error if any */
  error: Error | null;

  /** Get frequency info for a word */
  getWordFrequency: (arabic: string) => WordFrequencyInfo;
  /** Get frequency info for multiple words */
  getWordsFrequency: (words: string[]) => Map<string, WordFrequencyInfo>;
  /** Get corpus size */
  getCorpusSize: () => number;
  /** Get frequency band for a rank */
  getFrequencyBand: (rank: number | null) => FrequencyBand;
  /** Get band label */
  getFrequencyBandLabel: (band: FrequencyBand) => string;
  /** Get band color */
  getFrequencyBandColor: (band: FrequencyBand) => string;
  /** Get frequency stats for a word list */
  getFrequencyStats: typeof getFrequencyStats;
  /** Sort words by frequency */
  sortByFrequency: (words: string[]) => string[];

  /** Manually trigger load */
  load: () => Promise<void>;
}

/**
 * Snapshot state type
 */
interface FrequencySnapshot {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Cached snapshot - must be referentially stable for useSyncExternalStore
let cachedSnapshot: FrequencySnapshot = {
  isLoaded: false,
  isLoading: false,
  error: null,
};

/**
 * Get current frequency state snapshot.
 */
function getSnapshot(): FrequencySnapshot {
  const isLoaded = isFrequencyLoaded();
  const isLoading = isFrequencyLoading();
  const error = getFrequencyError();

  // Only create new object if state changed
  if (
    cachedSnapshot.isLoaded !== isLoaded ||
    cachedSnapshot.isLoading !== isLoading ||
    cachedSnapshot.error !== error
  ) {
    cachedSnapshot = { isLoaded, isLoading, error };
  }

  return cachedSnapshot;
}

/**
 * React hook for accessing frequency data.
 *
 * Automatically triggers loading on mount.
 * Re-renders when loading state changes.
 *
 * @example
 * ```tsx
 * const { isLoaded, getWordFrequency } = useFrequency();
 *
 * if (!isLoaded) return <LoadingSpinner />;
 *
 * const freq = getWordFrequency("كتب");
 * ```
 */
export function useFrequency(): UseFrequencyReturn {
  // Track state with useSyncExternalStore for concurrent-safe updates
  const state = useSyncExternalStore(subscribeFrequency, getSnapshot, getSnapshot);

  // Trigger load on mount
  useEffect(() => {
    if (!state.isLoaded && !state.isLoading) {
      loadFrequencyData().catch(() => {
        // Error is captured in state, no need to handle here
      });
    }
  }, [state.isLoaded, state.isLoading]);

  // Memoized load function
  const load = useCallback(async () => {
    await loadFrequencyData();
  }, []);

  return {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,

    getWordFrequency,
    getWordsFrequency,
    getCorpusSize,
    getFrequencyBand,
    getFrequencyBandLabel,
    getFrequencyBandColor,
    getFrequencyStats,
    sortByFrequency,

    load,
  };
}

/**
 * Hook that preloads frequency data in the background.
 * Use this in App.tsx to start loading frequency data early.
 */
export function useFrequencyPreload(): void {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFrequencyData().catch(() => {
        // Errors will be handled by components using useFrequency
      });
    }, 400); // Delay to prioritize critical rendering

    return () => clearTimeout(timeoutId);
  }, []);
}

export default useFrequency;
