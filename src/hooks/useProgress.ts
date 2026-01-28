import { useState, useCallback, useMemo } from 'react';
import type {
  BookProgress,
  OverallStats,
  MasteryLevel,
  LessonProgress,
} from '../types/progress';
import {
  recordExerciseWithSM2 as recordResult,
  recordChallengeResult as recordChallenge,
  recordExerciseWithDirection as recordWithDirection,
  getBookProgress,
  getOverallStats,
  getLessonMasteryLevel,
  getLessonMasteryPercent,
  getWordMasteryLevel,
  getWordEffectiveStrength,
  hasProvenMastery,
  resetProgress,
  getProgress,
  getWordDirectionalStrength,
  getWordDifficultyLevel,
} from '../lib/progressService';
import { isManifestLoaded } from '../lib/contentStatsCore';
import {
  aggregateConfidenceRecords,
  calculateCalibrationStats,
  getCalibrationTrend,
  type CalibrationStats,
} from '../lib/calibration';
import type { ExerciseType } from '../types/exercise';
import type { DirectionalStrengthData, DifficultyLevel } from '../types/progress';

interface UseProgressReturn {
  // Overall stats (null if manifest not loaded)
  stats: OverallStats | null;

  // Book-level progress
  getBookStats: (bookNumber: number) => BookProgress | null;

  // Lesson-level queries
  getLessonMastery: (lessonId: string) => MasteryLevel;
  getLessonPercent: (lessonId: string) => number;
  getLessonDetails: (lessonId: string) => LessonProgress | null;

  // Word-level queries
  getWordLevel: (wordId: string) => MasteryLevel;
  getWordStrength: (wordId: string) => number;
  hasWordProvenMastery: (wordId: string) => boolean;

  // Progressive difficulty queries (Phase 1.2)
  getWordDirectionalStrength: (wordId: string) => DirectionalStrengthData;
  getWordDifficulty: (wordId: string, direction: 'recognition' | 'production') => DifficultyLevel;

  // Calibration (metacognition)
  getCalibrationStats: () => CalibrationStats;
  getCalibrationTrend: () => 'improving' | 'stable' | 'declining' | 'insufficient-data';

  // Actions
  recordExercise: (
    exerciseId: string,
    lessonId: string,
    itemIds: string[],
    isCorrect: boolean
  ) => void;
  recordChallengeExercise: (
    exerciseId: string,
    lessonId: string,
    itemIds: string[],
    isCorrect: boolean
  ) => void;
  /** Record exercise with directional strength tracking (Phase 1.2) */
  recordExerciseWithDirection: (
    exerciseId: string,
    lessonId: string,
    itemIds: string[],
    isCorrect: boolean,
    exerciseType: ExerciseType
  ) => void;
  resetAllProgress: () => void;

  // Force refresh
  refresh: () => void;
}

/**
 * React hook for accessing and managing user progress.
 * Wraps the progressService functions and provides reactivity.
 * 
 * Note: stats and getBookStats return null if manifest is not loaded yet.
 * Use useManifest hook to ensure manifest is loaded before accessing these.
 */
export function useProgress(): UseProgressReturn {
  // Use a version counter to trigger re-renders when progress changes
  const [version, setVersion] = useState(0);

  // Force a refresh of all derived data
  const refresh = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  // Get overall stats (re-computed when version changes)
  // Returns null if manifest not loaded to avoid errors
  const stats = useMemo(() => {
    // This dependency ensures recalculation on refresh
    void version;
    if (!isManifestLoaded()) return null;
    return getOverallStats();
  }, [version]);

  // Book progress getter
  const getBookStats = useCallback(
    (bookNumber: number): BookProgress | null => {
      void version;
      if (!isManifestLoaded()) return null;
      return getBookProgress(bookNumber);
    },
    [version]
  );

  // Lesson mastery level getter
  const getLessonMastery = useCallback(
    (lessonId: string): MasteryLevel => {
      void version;
      return getLessonMasteryLevel(lessonId);
    },
    [version]
  );

  // Lesson percent getter
  const getLessonPercent = useCallback(
    (lessonId: string): number => {
      void version;
      return getLessonMasteryPercent(lessonId);
    },
    [version]
  );

  // Lesson details getter
  const getLessonDetails = useCallback(
    (lessonId: string): LessonProgress | null => {
      void version;
      const progress = getProgress();
      return progress.lessonProgress[lessonId] || null;
    },
    [version]
  );

  // Word mastery level getter
  const getWordLevel = useCallback(
    (wordId: string): MasteryLevel => {
      void version;
      return getWordMasteryLevel(wordId);
    },
    [version]
  );

  // Word strength getter
  const getWordStrength = useCallback(
    (wordId: string): number => {
      void version;
      return getWordEffectiveStrength(wordId);
    },
    [version]
  );

  // Check if word has proven mastery (passed challenge)
  const hasWordProvenMastery = useCallback(
    (wordId: string): boolean => {
      void version;
      return hasProvenMastery(wordId);
    },
    [version]
  );

  // Get calibration statistics for confidence ratings
  const getCalibrationStatsHook = useCallback(
    (): CalibrationStats => {
      void version;
      const progress = getProgress();
      const records = aggregateConfidenceRecords(progress.wordMastery);
      return calculateCalibrationStats(records);
    },
    [version]
  );

  // Get calibration trend (improving/stable/declining)
  const getCalibrationTrendHook = useCallback(
    (): 'improving' | 'stable' | 'declining' | 'insufficient-data' => {
      void version;
      const progress = getProgress();
      const records = aggregateConfidenceRecords(progress.wordMastery);
      return getCalibrationTrend(records);
    },
    [version]
  );

  // Record an exercise result and trigger refresh
  const recordExercise = useCallback(
    (
      exerciseId: string,
      lessonId: string,
      itemIds: string[],
      isCorrect: boolean
    ) => {
      recordResult(exerciseId, lessonId, itemIds, isCorrect);
      refresh();
    },
    [refresh]
  );

  // Record a CHALLENGE exercise result and trigger refresh
  const recordChallengeExercise = useCallback(
    (
      exerciseId: string,
      lessonId: string,
      itemIds: string[],
      isCorrect: boolean
    ) => {
      recordChallenge(exerciseId, lessonId, itemIds, isCorrect);
      refresh();
    },
    [refresh]
  );

  // Record exercise with directional strength tracking (Phase 1.2)
  const recordExerciseWithDirectionHook = useCallback(
    (
      exerciseId: string,
      lessonId: string,
      itemIds: string[],
      isCorrect: boolean,
      exerciseType: ExerciseType
    ) => {
      recordWithDirection(exerciseId, lessonId, itemIds, isCorrect, exerciseType);
      refresh();
    },
    [refresh]
  );

  // Get directional strength for a word (Phase 1.2)
  const getWordDirectionalStrengthHook = useCallback(
    (wordId: string): DirectionalStrengthData => {
      void version;
      return getWordDirectionalStrength(wordId);
    },
    [version]
  );

  // Get difficulty level for a word in a direction (Phase 1.2)
  const getWordDifficultyHook = useCallback(
    (wordId: string, direction: 'recognition' | 'production'): DifficultyLevel => {
      void version;
      return getWordDifficultyLevel(wordId, direction);
    },
    [version]
  );

  // Reset all progress and trigger refresh
  const resetAllProgress = useCallback(() => {
    resetProgress();
    refresh();
  }, [refresh]);

  return {
    stats,
    getBookStats,
    getLessonMastery,
    getLessonPercent,
    getLessonDetails,
    getWordLevel,
    getWordStrength,
    hasWordProvenMastery,
    getWordDirectionalStrength: getWordDirectionalStrengthHook,
    getWordDifficulty: getWordDifficultyHook,
    getCalibrationStats: getCalibrationStatsHook,
    getCalibrationTrend: getCalibrationTrendHook,
    recordExercise,
    recordChallengeExercise,
    recordExerciseWithDirection: recordExerciseWithDirectionHook,
    resetAllProgress,
    refresh,
  };
}

export default useProgress;
