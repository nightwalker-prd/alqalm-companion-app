/**
 * React hook for content manifest access.
 *
 * Provides a React-friendly interface to the manifest loader with:
 * - Automatic loading trigger
 * - Loading/error state tracking
 * - Re-render on state changes
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  loadManifest,
  isManifestLoaded,
  isManifestLoading,
  getManifestError,
  subscribeManifest,
} from '../lib/contentStatsCore';

/**
 * Return type for useManifest hook
 */
export interface UseManifestReturn {
  /** Whether manifest is loaded and ready */
  isLoaded: boolean;
  /** Whether manifest is currently loading */
  isLoading: boolean;
  /** Loading error if any */
  error: Error | null;
  /** Manually trigger manifest load */
  load: () => Promise<void>;
}

/**
 * Snapshot state type
 */
interface ManifestSnapshot {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Cached snapshot - must be referentially stable for useSyncExternalStore
let cachedSnapshot: ManifestSnapshot = {
  isLoaded: false,
  isLoading: false,
  error: null,
};

/**
 * Get current manifest state snapshot.
 * Returns cached snapshot for referential stability.
 * Updates cache only when state actually changes.
 */
function getSnapshot(): ManifestSnapshot {
  const isLoaded = isManifestLoaded();
  const isLoading = isManifestLoading();
  const error = getManifestError();

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
 * React hook for accessing content manifest.
 *
 * Automatically triggers manifest loading on mount.
 * Re-renders when loading state changes.
 *
 * @example
 * ```tsx
 * const { isLoaded, isLoading, error } = useManifest();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorState message={error.message} />;
 *
 * // Now safe to use contentStatsCore functions
 * const stats = getTotalContentStats();
 * ```
 */
export function useManifest(): UseManifestReturn {
  // Track state with useSyncExternalStore for concurrent-safe updates
  const state = useSyncExternalStore(
    subscribeManifest,
    getSnapshot,
    getSnapshot
  );

  // Trigger load on mount
  useEffect(() => {
    if (!state.isLoaded && !state.isLoading) {
      loadManifest().catch(() => {
        // Error is captured in state, no need to handle here
      });
    }
  }, [state.isLoaded, state.isLoading]);

  // Memoized load function
  const load = useCallback(async () => {
    await loadManifest();
  }, []);

  return {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    load,
  };
}

export default useManifest;
