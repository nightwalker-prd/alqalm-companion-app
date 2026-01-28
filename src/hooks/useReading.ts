/**
 * React hook for async reading content access.
 *
 * Provides a React-friendly interface to the reading service with:
 * - Automatic loading trigger
 * - Loading/error state tracking
 * - Re-render on state changes
 * - Filtering support
 */

import { useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import type {
  ReadingPassage,
  ReadingFilters,
  ReadingStats,
  ReadingProgress,
  ReadingManifest,
} from '../types/reading';
import {
  loadReading,
  isReadingLoaded,
  isReadingLoading,
  getReadingError,
  getPassageById,
  getAllPassages,
  getPassagesByLevel,
  getPassagesByCategory,
  getCategories,
  getPassageCount,
  filterPassages,
  getManifest,
  getPassageProgress,
  markPassageRead,
  getReadingStats,
  subscribe,
} from '../lib/readingService';

/**
 * Return type for useReading hook
 */
export interface UseReadingReturn {
  /** Whether reading content is loaded and ready */
  isLoaded: boolean;
  /** Whether reading content is currently loading */
  isLoading: boolean;
  /** Loading error if any */
  error: Error | null;

  /** Get a passage by its ID */
  getPassage: (passageId: string) => ReadingPassage | null;
  /** Get all passages */
  getAllPassages: () => ReadingPassage[];
  /** Get passages by level */
  getPassagesByLevel: typeof getPassagesByLevel;
  /** Get passages by category */
  getPassagesByCategory: typeof getPassagesByCategory;
  /** Get all categories */
  getCategories: () => string[];
  /** Get total passage count */
  getCount: () => number;
  /** Get the reading manifest */
  getManifest: () => ReadingManifest | null;

  /** Filter passages with multiple criteria */
  filterPassages: (filters: ReadingFilters) => ReadingPassage[];

  /** Get progress for a specific passage */
  getProgress: (passageId: string) => ReadingProgress | null;
  /** Mark a passage as read */
  markRead: (passageId: string) => ReadingProgress;
  /** Get reading statistics */
  getStats: () => ReadingStats;

  /** Manually trigger reading content load */
  load: () => Promise<void>;
}

/**
 * Snapshot state type
 */
interface ReadingSnapshot {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Cached snapshot - must be referentially stable for useSyncExternalStore
let cachedSnapshot: ReadingSnapshot = {
  isLoaded: false,
  isLoading: false,
  error: null,
};

/**
 * Get current reading state snapshot.
 * Returns cached snapshot for referential stability.
 * Updates cache only when state actually changes.
 */
function getSnapshot(): ReadingSnapshot {
  const isLoaded = isReadingLoaded();
  const isLoading = isReadingLoading();
  const error = getReadingError();

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
 * React hook for accessing reading content.
 *
 * Automatically triggers reading content loading on mount.
 * Re-renders when loading state changes.
 *
 * @example
 * ```tsx
 * const { isLoaded, isLoading, error, getPassage, filterPassages } = useReading();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorState message={error.message} />;
 *
 * const passages = filterPassages({ level: 'beginner' });
 * ```
 */
export function useReading(): UseReadingReturn {
  // Track state with useSyncExternalStore for concurrent-safe updates
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Trigger load on mount
  useEffect(() => {
    if (!state.isLoaded && !state.isLoading) {
      loadReading().catch(() => {
        // Error is captured in state, no need to handle here
      });
    }
  }, [state.isLoaded, state.isLoading]);

  // Memoized load function
  const load = useCallback(async () => {
    await loadReading();
  }, []);

  return {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,

    getPassage: getPassageById,
    getAllPassages,
    getPassagesByLevel,
    getPassagesByCategory,
    getCategories,
    getCount: getPassageCount,
    getManifest,

    filterPassages,

    getProgress: getPassageProgress,
    markRead: markPassageRead,
    getStats: getReadingStats,

    load,
  };
}

/**
 * Hook for getting a single passage by ID with loading state.
 * Useful for passage detail pages.
 *
 * @example
 * ```tsx
 * function PassageDetail({ passageId }: { passageId: string }) {
 *   const { passage, isLoading, error } = usePassage(passageId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorState message={error.message} />;
 *   if (!passage) return <NotFound />;
 *
 *   return <PassageReader passage={passage} />;
 * }
 * ```
 */
export function usePassage(passageId: string): {
  passage: ReadingPassage | null;
  progress: ReadingProgress | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { isLoaded, isLoading, error, getPassage, getProgress } = useReading();

  const passage = useMemo(() => {
    if (!isLoaded) return null;
    return getPassage(passageId);
  }, [isLoaded, passageId, getPassage]);

  const progress = useMemo(() => {
    return getProgress(passageId);
  }, [passageId, getProgress]);

  return {
    passage,
    progress,
    isLoading,
    error,
  };
}

/**
 * Hook for getting filtered passages with loading state.
 * Useful for passage list pages.
 *
 * @example
 * ```tsx
 * function PassageList() {
 *   const [filters, setFilters] = useState<ReadingFilters>({ level: 'beginner' });
 *   const { passages, isLoading, stats } = usePassages(filters);
 *
 *   return (
 *     <div>
 *       <p>Showing {passages.length} of {stats.totalPassages}</p>
 *       {passages.map(p => <PassageCard key={p.id} passage={p} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePassages(filters: ReadingFilters = {}): {
  passages: ReadingPassage[];
  stats: ReadingStats;
  categories: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const {
    isLoaded,
    isLoading,
    error,
    filterPassages: filter,
    getStats,
    getCategories: getCats,
  } = useReading();

  const passages = useMemo(() => {
    if (!isLoaded) return [];
    return filter(filters);
  }, [isLoaded, filters, filter]);

  const stats = useMemo(() => {
    if (!isLoaded) {
      // Return default stats before loading
      return {
        totalPassages: 0,
        passagesRead: 0,
        totalEncounters: 0,
        byLevel: {
          beginner: { total: 0, read: 0 },
          intermediate: { total: 0, read: 0 },
          advanced: { total: 0, read: 0 },
        },
      };
    }
    return getStats();
  }, [isLoaded, getStats]);

  const categories = useMemo(() => {
    if (!isLoaded) return [];
    return getCats();
  }, [isLoaded, getCats]);

  return {
    passages,
    stats,
    categories,
    isLoading,
    error,
  };
}

/**
 * Hook that preloads reading content in the background.
 * Use this in App.tsx to start loading reading content early.
 *
 * @example
 * ```tsx
 * function App() {
 *   useReadingPreload();
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function useReadingPreload(): void {
  useEffect(() => {
    // Start loading reading content after a short delay to prioritize
    // critical rendering. This gives the main content time to render.
    const timeoutId = setTimeout(() => {
      loadReading().catch(() => {
        // Errors will be handled by components using useReading
      });
    }, 200); // Slightly longer delay than vocabulary since this is larger

    return () => clearTimeout(timeoutId);
  }, []);
}

export default useReading;
