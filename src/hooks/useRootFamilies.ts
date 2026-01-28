/**
 * React hook for async root families access.
 *
 * Provides a React-friendly interface to the root families service with:
 * - Automatic loading trigger
 * - Loading/error state tracking
 * - Re-render on state changes
 * - Filtering support
 */

import { useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import type { RootFamily, Difficulty } from '../types/morphology';
import {
  loadRootFamilies,
  isRootFamiliesLoaded,
  isRootFamiliesLoading,
  getRootFamiliesError,
  getRootFamilyByRoot,
  getAllRootFamilies,
  getRootFamiliesByDifficulty,
  getRootFamiliesCount,
  filterRootFamilies,
  subscribe,
} from '../lib/rootFamiliesService';

/**
 * Return type for useRootFamilies hook
 */
export interface UseRootFamiliesReturn {
  /** Whether root families are loaded and ready */
  isLoaded: boolean;
  /** Whether root families are currently loading */
  isLoading: boolean;
  /** Loading error if any */
  error: Error | null;

  /** Get a root family by its root string */
  getFamily: (root: string) => RootFamily | null;
  /** Get all root families */
  getAllFamilies: () => RootFamily[];
  /** Get root families by difficulty */
  getFamiliesByDifficulty: (difficulty: Difficulty) => RootFamily[];
  /** Get total count */
  getCount: () => number;

  /** Filter root families with multiple criteria */
  filterFamilies: (options: {
    difficulty?: Difficulty | 'all';
    searchQuery?: string;
  }) => RootFamily[];

  /** Manually trigger load */
  load: () => Promise<void>;
}

/**
 * Snapshot state type
 */
interface RootFamiliesSnapshot {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Cached snapshot - must be referentially stable for useSyncExternalStore
let cachedSnapshot: RootFamiliesSnapshot = {
  isLoaded: false,
  isLoading: false,
  error: null,
};

/**
 * Get current root families state snapshot.
 * Returns cached snapshot for referential stability.
 * Updates cache only when state actually changes.
 */
function getSnapshot(): RootFamiliesSnapshot {
  const isLoaded = isRootFamiliesLoaded();
  const isLoading = isRootFamiliesLoading();
  const error = getRootFamiliesError();

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
 * React hook for accessing root families.
 *
 * Automatically triggers loading on mount.
 * Re-renders when loading state changes.
 *
 * @example
 * ```tsx
 * const { isLoaded, isLoading, error, getAllFamilies } = useRootFamilies();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorState message={error.message} />;
 *
 * const families = getAllFamilies();
 * ```
 */
export function useRootFamilies(): UseRootFamiliesReturn {
  // Track state with useSyncExternalStore for concurrent-safe updates
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Trigger load on mount
  useEffect(() => {
    if (!state.isLoaded && !state.isLoading) {
      loadRootFamilies().catch(() => {
        // Error is captured in state, no need to handle here
      });
    }
  }, [state.isLoaded, state.isLoading]);

  // Memoized load function
  const load = useCallback(async () => {
    await loadRootFamilies();
  }, []);

  return {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,

    getFamily: getRootFamilyByRoot,
    getAllFamilies: getAllRootFamilies,
    getFamiliesByDifficulty: getRootFamiliesByDifficulty,
    getCount: getRootFamiliesCount,

    filterFamilies: filterRootFamilies,

    load,
  };
}

/**
 * Hook for getting filtered root families with loading state.
 *
 * @example
 * ```tsx
 * const { families, isLoading } = useFilteredRootFamilies({ difficulty: 'beginner' });
 * ```
 */
export function useFilteredRootFamilies(options: {
  difficulty?: Difficulty | 'all';
  searchQuery?: string;
} = {}): {
  families: RootFamily[];
  total: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { isLoaded, isLoading, error, filterFamilies, getCount } =
    useRootFamilies();

  const families = useMemo(() => {
    if (!isLoaded) return [];
    return filterFamilies(options);
  }, [isLoaded, options, filterFamilies]);

  const total = useMemo(() => {
    if (!isLoaded) return 0;
    return getCount();
  }, [isLoaded, getCount]);

  return {
    families,
    total,
    isLoading,
    error,
  };
}

/**
 * Hook that preloads root families in the background.
 * Use this in App.tsx to start loading early.
 */
export function useRootFamiliesPreload(): void {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRootFamilies().catch(() => {
        // Errors will be handled by components using useRootFamilies
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);
}

export default useRootFamilies;
