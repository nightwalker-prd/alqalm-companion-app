import { useState, useCallback, useMemo } from 'react';
import type { SM2Data, EncounterData } from '../types/progress';
import { TARGET_ENCOUNTERS } from '../types/progress';
import type { FIReState } from '../types/fire';
import type { SM2Quality } from '../lib/spacedRepetition';
import { getDaysOverdue as computeDaysOverdue } from '../lib/spacedRepetition';
import {
  getDueWords,
  getDueWordCount,
  getReviewStats,
  getWordSM2State,
  getWordEncounters,
  recordSM2Review,
  getProgress,
  // FIRe functions
  getFIReDueWords,
  getFIReDueWordCount,
  getFIReReviewStats,
  getWordFIReState,
  recordFIReReview,
  getWordFIReDaysOverdue,
} from '../lib/progressService';
import { getDecayedMemory } from '../lib/fire';

/**
 * Review queue item with full data
 */
export interface ReviewItem {
  wordId: string;
  sm2: SM2Data;
  encounters: EncounterData;
  daysOverdue: number;
  encounterProgress: number; // 0-100
  // FIRe fields
  fire?: FIReState;
  memory?: number; // Current memory level (0-1)
}

/**
 * Review session statistics
 */
export interface ReviewSessionStats {
  dueToday: number;
  overdueCount: number;
  reviewedToday: number;
  upcomingWeek: number;
}

/**
 * Return type for useReviewQueue hook
 */
interface UseReviewQueueReturn {
  // Queue management
  dueWords: string[];
  dueCount: number;
  reviewItems: ReviewItem[];

  // Statistics
  stats: ReviewSessionStats;

  // Word-level queries
  getWordSM2: (wordId: string) => SM2Data;
  getWordEncounterData: (wordId: string) => EncounterData;
  getEncounterProgress: (wordId: string) => number;
  getWordFIRe: (wordId: string) => FIReState;
  getWordMemory: (wordId: string) => number;

  // Actions
  reviewWord: (
    wordId: string,
    quality: SM2Quality,
    encounterType?: 'exercise' | 'flashcard' | 'reading' | 'listening'
  ) => void;
  reviewWordFIRe: (
    wordId: string,
    isCorrect: boolean,
    encounterType?: 'exercise' | 'flashcard' | 'reading' | 'listening'
  ) => void;

  // Force refresh
  refresh: () => void;

  // Mode toggle
  useFIRe: boolean;
  setUseFIRe: (useFIRe: boolean) => void;
}

/**
 * Build review items from progress data.
 * This is a pure function that doesn't call impure functions directly.
 */
function buildReviewItems(
  dueWordIds: string[],
  progressData: ReturnType<typeof getProgress>,
  useFIRe: boolean
): ReviewItem[] {
  return dueWordIds.map(wordId => {
    const mastery = progressData.wordMastery[wordId];
    const sm2 = mastery?.sm2 || getWordSM2State(wordId);
    const encounters = mastery?.encounters || getWordEncounters(wordId);
    const fire = mastery?.fire || getWordFIReState(wordId);

    // Calculate days overdue based on mode
    const daysOverdue = useFIRe
      ? getWordFIReDaysOverdue(wordId)
      : computeDaysOverdue(sm2);

    // Calculate encounter progress
    const encounterProgress = Math.min(
      100,
      Math.round((encounters.total / TARGET_ENCOUNTERS) * 100)
    );

    // Calculate memory level for FIRe
    const memory = fire ? getDecayedMemory(fire) : 0;

    return {
      wordId,
      sm2,
      encounters,
      daysOverdue,
      encounterProgress,
      fire,
      memory,
    };
  });
}

/**
 * React hook for managing the spaced repetition review queue.
 * Provides access to due words, review statistics, and review actions.
 * Supports both SM-2 and FIRe algorithms.
 */
export function useReviewQueue(): UseReviewQueueReturn {
  // Version counter for reactivity
  const [version, setVersion] = useState(0);
  
  // Toggle between SM-2 and FIRe mode
  const [useFIRe, setUseFIRe] = useState(true); // Default to FIRe

  // Force refresh
  const refresh = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  // Get due words (re-computed on version change)
  const dueWords = useMemo(() => {
    void version;
    return useFIRe ? getFIReDueWords() : getDueWords();
  }, [version, useFIRe]);

  // Get due count
  const dueCount = useMemo(() => {
    void version;
    return useFIRe ? getFIReDueWordCount() : getDueWordCount();
  }, [version, useFIRe]);

  // Get review statistics
  const stats = useMemo(() => {
    void version;
    return useFIRe ? getFIReReviewStats() : getReviewStats();
  }, [version, useFIRe]);

  // Build review items with full data
  const reviewItems = useMemo((): ReviewItem[] => {
    void version;
    const data = getProgress();
    return buildReviewItems(dueWords, data, useFIRe);
  }, [version, dueWords, useFIRe]);

  // Get SM-2 state for a word
  const getWordSM2 = useCallback(
    (wordId: string): SM2Data => {
      void version;
      return getWordSM2State(wordId);
    },
    [version]
  );

  // Get FIRe state for a word
  const getWordFIRe = useCallback(
    (wordId: string): FIReState => {
      void version;
      return getWordFIReState(wordId);
    },
    [version]
  );

  // Get memory level for a word
  const getWordMemory = useCallback(
    (wordId: string): number => {
      void version;
      const fire = getWordFIReState(wordId);
      return getDecayedMemory(fire);
    },
    [version]
  );

  // Get encounter data for a word
  const getWordEncounterData = useCallback(
    (wordId: string): EncounterData => {
      void version;
      return getWordEncounters(wordId);
    },
    [version]
  );

  // Get encounter progress percentage for a word
  const getEncounterProgress = useCallback(
    (wordId: string): number => {
      void version;
      const encounters = getWordEncounters(wordId);
      return Math.min(100, Math.round((encounters.total / TARGET_ENCOUNTERS) * 100));
    },
    [version]
  );

  // Review a word with SM-2 quality rating
  const reviewWord = useCallback(
    (
      wordId: string,
      quality: SM2Quality,
      encounterType: 'exercise' | 'flashcard' | 'reading' | 'listening' = 'flashcard'
    ) => {
      recordSM2Review(wordId, quality, encounterType);
      refresh();
    },
    [refresh]
  );

  // Review a word with FIRe (pass/fail)
  const reviewWordFIRe = useCallback(
    (
      wordId: string,
      isCorrect: boolean,
      encounterType: 'exercise' | 'flashcard' | 'reading' | 'listening' = 'flashcard'
    ) => {
      recordFIReReview(wordId, isCorrect, isCorrect ? 1 : 0, encounterType);
      refresh();
    },
    [refresh]
  );

  return {
    dueWords,
    dueCount,
    reviewItems,
    stats,
    getWordSM2,
    getWordFIRe,
    getWordMemory,
    getWordEncounterData,
    getEncounterProgress,
    reviewWord,
    reviewWordFIRe,
    refresh,
    useFIRe,
    setUseFIRe,
  };
}

export default useReviewQueue;
