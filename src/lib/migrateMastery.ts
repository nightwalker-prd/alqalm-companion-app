/**
 * Migration utilities for converting legacy strength-based mastery to SM-2.
 *
 * This module handles the one-time migration of existing user progress
 * from the simple 0-100 strength system to the SM-2 spaced repetition system.
 */

import type { SM2State } from './spacedRepetition';

/**
 * Legacy WordMastery structure (pre-SM-2)
 */
interface LegacyWordMastery {
  strength: number;
  lastPracticed: string;
  timesCorrect: number;
  timesIncorrect: number;
  challengesPassed?: number;
  lastChallengeDate?: string | null;
}

/**
 * Encounter tracking for Nation's 10-12 encounter principle
 */
export interface EncounterData {
  /** Total number of times this item has been encountered */
  total: number;
  /** Breakdown by encounter type */
  byType: {
    exercise: number;
    flashcard: number;
    reading: number;
    listening: number;
  };
  /** History of recent encounters (capped for storage efficiency) */
  history: Array<{
    date: number;
    type: 'exercise' | 'flashcard' | 'reading' | 'listening';
  }>;
}

/**
 * Default encounter data for new items
 */
export const DEFAULT_ENCOUNTER_DATA: EncounterData = {
  total: 0,
  byType: {
    exercise: 0,
    flashcard: 0,
    reading: 0,
    listening: 0,
  },
  history: [],
};

/**
 * Maximum history entries to keep per item (for storage efficiency)
 */
const MAX_HISTORY_ENTRIES = 20;

/**
 * Target encounters for vocabulary acquisition (Nation's research)
 */
export const TARGET_ENCOUNTERS = 12;

/**
 * Migrate a legacy strength value to SM-2 state.
 *
 * Mapping strategy:
 * - 0-19 (new): interval=0, repetitions=0, easeFactor=2.5
 * - 20-39 (learning): interval=1, repetitions=1, easeFactor=2.3
 * - 40-59 (familiar): interval=3, repetitions=2, easeFactor=2.5
 * - 60-79 (comfortable): interval=7, repetitions=3, easeFactor=2.6
 * - 80-100 (mastered): interval=14, repetitions=4, easeFactor=2.7
 *
 * @param strength - Legacy strength value (0-100)
 * @param lastPracticed - ISO date string of last practice
 * @returns SM-2 state
 */
export function migrateStrengthToSM2(
  strength: number,
  lastPracticed: string
): SM2State {
  const lastPracticedTime = new Date(lastPracticed).getTime();
  const now = Date.now();

  // Default to now if lastPracticed is invalid
  const baseTime = isNaN(lastPracticedTime) ? now : lastPracticedTime;

  if (strength < 20) {
    // New word - needs immediate review
    return {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: now,
    };
  }

  if (strength < 40) {
    // Learning - review tomorrow
    return {
      easeFactor: 2.3,
      interval: 1,
      repetitions: 1,
      nextReviewDate: baseTime + 1 * 24 * 60 * 60 * 1000,
    };
  }

  if (strength < 60) {
    // Familiar - review in 3 days
    return {
      easeFactor: 2.5,
      interval: 3,
      repetitions: 2,
      nextReviewDate: baseTime + 3 * 24 * 60 * 60 * 1000,
    };
  }

  if (strength < 80) {
    // Comfortable - review in a week
    return {
      easeFactor: 2.6,
      interval: 7,
      repetitions: 3,
      nextReviewDate: baseTime + 7 * 24 * 60 * 60 * 1000,
    };
  }

  // Mastered - review in 2 weeks
  return {
    easeFactor: 2.7,
    interval: 14,
    repetitions: 4,
    nextReviewDate: baseTime + 14 * 24 * 60 * 60 * 1000,
  };
}

/**
 * Estimate initial encounter count from legacy mastery data.
 *
 * Uses timesCorrect + timesIncorrect as a proxy for exercise encounters.
 *
 * @param mastery - Legacy mastery data
 * @returns Estimated encounter data
 */
export function estimateEncountersFromLegacy(
  mastery: LegacyWordMastery
): EncounterData {
  const exerciseCount = mastery.timesCorrect + mastery.timesIncorrect;

  return {
    total: exerciseCount,
    byType: {
      exercise: exerciseCount,
      flashcard: 0,
      reading: 0,
      listening: 0,
    },
    history: [], // Can't reconstruct history from legacy data
  };
}

/**
 * Add an encounter to the tracking data
 *
 * @param current - Current encounter data
 * @param type - Type of encounter
 * @returns Updated encounter data
 */
export function addEncounter(
  current: EncounterData,
  type: 'exercise' | 'flashcard' | 'reading' | 'listening'
): EncounterData {
  const newHistory = [
    { date: Date.now(), type },
    ...current.history,
  ].slice(0, MAX_HISTORY_ENTRIES);

  return {
    total: current.total + 1,
    byType: {
      ...current.byType,
      [type]: current.byType[type] + 1,
    },
    history: newHistory,
  };
}

/**
 * Check if an item has reached the target encounter count
 *
 * @param encounters - Encounter data
 * @returns true if target reached
 */
export function hasReachedTargetEncounters(encounters: EncounterData): boolean {
  return encounters.total >= TARGET_ENCOUNTERS;
}

/**
 * Get progress toward target encounters as a percentage
 *
 * @param encounters - Encounter data
 * @returns Percentage (0-100, capped at 100)
 */
export function getEncounterProgress(encounters: EncounterData): number {
  return Math.min(100, Math.round((encounters.total / TARGET_ENCOUNTERS) * 100));
}

/**
 * Full migration of legacy WordMastery to new format
 *
 * @param legacy - Legacy mastery data
 * @returns Object containing sm2 state and encounter data
 */
export function migrateLegacyMastery(legacy: LegacyWordMastery): {
  sm2: SM2State;
  encounters: EncounterData;
} {
  return {
    sm2: migrateStrengthToSM2(legacy.strength, legacy.lastPracticed),
    encounters: estimateEncountersFromLegacy(legacy),
  };
}

/**
 * Check if mastery data needs migration (lacks SM-2 fields)
 *
 * @param mastery - Mastery data to check
 * @returns true if migration is needed
 */
export function needsMigration(mastery: unknown): boolean {
  if (!mastery || typeof mastery !== 'object') {
    return false;
  }

  const m = mastery as Record<string, unknown>;

  // Has legacy fields but no SM-2 fields
  return (
    typeof m.strength === 'number' &&
    typeof m.lastPracticed === 'string' &&
    m.sm2 === undefined
  );
}
