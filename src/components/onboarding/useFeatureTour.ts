/**
 * Hook for managing feature tour state
 */

import { useCallback } from 'react';

const TOUR_STORAGE_KEY = 'madina_feature_tour_completed';

/**
 * Hook to manually trigger/check the feature tour
 */
export function useFeatureTour() {
  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }, []);

  const hasSeen = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  }, []);

  return { resetTour, hasSeen };
}
