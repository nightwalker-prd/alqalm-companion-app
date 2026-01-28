/**
 * Lightweight hook for getting due word count.
 *
 * This hook reads directly from localStorage without importing heavy
 * dependencies like contentStats or progressService, making it suitable
 * for use in always-rendered components like BottomNav.
 *
 * For full review queue functionality, use useReviewQueue instead.
 */

import { useState, useEffect, useCallback } from 'react';

/** Storage key - must match progressService */
const STORAGE_KEY = 'madina_progress';

/** Minimal SM2 state structure for due checking */
interface SM2State {
  nextReviewDate: number;
}

/** Minimal word mastery structure */
interface MinimalWordMastery {
  sm2?: SM2State;
}

/** Minimal progress data structure */
interface MinimalProgressData {
  wordMastery?: Record<string, MinimalWordMastery>;
}

/**
 * Read progress data directly from localStorage.
 * Returns null if not found or invalid.
 */
function readProgressFromStorage(): MinimalProgressData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as MinimalProgressData;
  } catch {
    return null;
  }
}

/**
 * Count words that are due for review.
 * A word is due if its nextReviewDate <= now.
 */
function countDueWords(data: MinimalProgressData | null): number {
  if (!data?.wordMastery) return 0;

  const now = Date.now();
  let count = 0;

  for (const mastery of Object.values(data.wordMastery)) {
    if (mastery?.sm2?.nextReviewDate !== undefined) {
      if (mastery.sm2.nextReviewDate <= now) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Lightweight hook for getting due word count.
 *
 * This hook is optimized for minimal bundle impact by:
 * - Reading directly from localStorage
 * - Not importing progressService or contentStats
 * - Listening to storage events for cross-tab sync
 *
 * @returns Object with dueCount and refresh function
 */
export function useDueCount(): { dueCount: number; refresh: () => void } {
  const [dueCount, setDueCount] = useState(() => {
    return countDueWords(readProgressFromStorage());
  });

  const refresh = useCallback(() => {
    setDueCount(countDueWords(readProgressFromStorage()));
  }, []);

  useEffect(() => {
    // Listen for storage events (cross-tab sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also refresh periodically to catch same-tab updates
    // (localStorage doesn't fire events for same-tab writes)
    const intervalId = setInterval(refresh, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [refresh]);

  return { dueCount, refresh };
}

export default useDueCount;
