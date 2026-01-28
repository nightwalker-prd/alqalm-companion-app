/**
 * React hook for async vocabulary access.
 *
 * Provides a React-friendly interface to the vocabulary loader with:
 * - Automatic loading trigger
 * - Loading/error state tracking
 * - Re-render on state changes
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  loadVocabulary,
  isVocabularyLoaded,
  isVocabularyLoading,
  getVocabularyError,
  getWordById,
  getAllWords,
  getWordsByLesson,
  getWordsByRoot,
  getAllRoots,
  getWordCount,
  subscribe,
  type WordData,
} from '../lib/vocabularyAsync';

/**
 * Return type for useVocabulary hook
 */
export interface UseVocabularyReturn {
  /** Whether vocabulary is loaded and ready */
  isLoaded: boolean;
  /** Whether vocabulary is currently loading */
  isLoading: boolean;
  /** Loading error if any */
  error: Error | null;

  /** Get a word by its ID */
  getWord: (wordId: string) => WordData | null;
  /** Get all words */
  getAllWords: () => WordData[];
  /** Get words for a specific lesson */
  getWordsForLesson: (lessonId: string) => WordData[];
  /** Get words sharing a root */
  getWordsForRoot: (root: string) => WordData[];
  /** Get all unique roots */
  getRoots: () => string[];
  /** Get total word count */
  getCount: () => number;

  /** Manually trigger vocabulary load */
  load: () => Promise<void>;
}

/**
 * Snapshot state type
 */
interface VocabularySnapshot {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Cached snapshot - must be referentially stable for useSyncExternalStore
let cachedSnapshot: VocabularySnapshot = {
  isLoaded: false,
  isLoading: false,
  error: null,
};

/**
 * Get current vocabulary state snapshot.
 * Returns cached snapshot for referential stability.
 * Updates cache only when state actually changes.
 */
function getSnapshot(): VocabularySnapshot {
  const isLoaded = isVocabularyLoaded();
  const isLoading = isVocabularyLoading();
  const error = getVocabularyError();

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
 * React hook for accessing vocabulary data.
 *
 * Automatically triggers vocabulary loading on mount.
 * Re-renders when loading state changes.
 *
 * @example
 * ```tsx
 * const { isLoaded, isLoading, error, getWord } = useVocabulary();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorState message={error.message} />;
 *
 * const word = getWord('word-001');
 * ```
 */
export function useVocabulary(): UseVocabularyReturn {
  // Track state with useSyncExternalStore for concurrent-safe updates
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  // Trigger load on mount
  useEffect(() => {
    if (!state.isLoaded && !state.isLoading) {
      loadVocabulary().catch(() => {
        // Error is captured in state, no need to handle here
      });
    }
  }, [state.isLoaded, state.isLoading]);

  // Memoized load function
  const load = useCallback(async () => {
    await loadVocabulary();
  }, []);

  return {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,

    getWord: getWordById,
    getAllWords,
    getWordsForLesson: getWordsByLesson,
    getWordsForRoot: getWordsByRoot,
    getRoots: getAllRoots,
    getCount: getWordCount,

    load,
  };
}

/**
 * Hook that preloads vocabulary in the background.
 * Use this in App.tsx to start loading vocabulary early.
 *
 * @example
 * ```tsx
 * function App() {
 *   useVocabularyPreload();
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function useVocabularyPreload(): void {
  useEffect(() => {
    // Start loading vocabulary after a short delay to prioritize
    // critical rendering. This gives the main content time to render.
    const timeoutId = setTimeout(() => {
      loadVocabulary().catch(() => {
        // Errors will be handled by components using useVocabulary
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);
}

export default useVocabulary;
