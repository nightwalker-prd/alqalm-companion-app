/**
 * Migration Utility: SM-2 to FIRe
 *
 * This module provides functions to migrate existing user progress
 * from the SM-2 spaced repetition system to the FIRe system.
 *
 * Migration preserves:
 * - Learning history (repetition count)
 * - Memory state (estimated from SM-2 interval and next review date)
 * - Learning speed (derived from SM-2 ease factor)
 */

import type { SM2Data, WordMastery } from '../types/progress';
import type { FIReState } from '../types/fire';
import { DEFAULT_FIRE_STATE } from '../types/fire';

// ============================================================================
// SM-2 to FIRe Migration
// ============================================================================

/**
 * Migrate SM-2 state to FIRe state.
 *
 * Mapping:
 * - repNum: SM-2 repetitions count
 * - memory: Estimated from days until next review vs interval
 * - learningSpeed: Derived from SM-2 ease factor (2.5 = 1.0, 1.3 = 0.52, etc.)
 * - lastRepDate: Calculated from nextReviewDate - interval
 *
 * @param sm2 - SM-2 state
 * @returns Equivalent FIRe state
 */
export function migrateSM2ToFIRe(sm2: SM2Data): FIReState {
  const now = Date.now();

  // Map repetitions directly to repNum
  const repNum = sm2.repetitions;

  // Estimate memory from days until next review
  // If review is in the future, memory is higher
  // If review is overdue, memory is lower
  const daysUntilReview = (sm2.nextReviewDate - now) / (24 * 60 * 60 * 1000);
  const interval = Math.max(1, sm2.interval);

  let memory: number;
  if (daysUntilReview >= 0) {
    // Not yet due: memory is between 0.5 (at due date) and 1.0 (just reviewed)
    memory = 0.5 + (daysUntilReview / interval) * 0.5;
  } else {
    // Overdue: memory decays below 0.5
    const daysOverdue = -daysUntilReview;
    memory = 0.5 * Math.pow(0.5, daysOverdue / interval);
  }
  memory = Math.max(0, Math.min(1, memory));

  // Map ease factor to learning speed
  // SM-2 default ease is 2.5, minimum is 1.3
  // We map: 2.5 -> 1.0, 1.3 -> 0.52, 3.0 -> 1.2
  const learningSpeed = Math.max(0.5, Math.min(2.0, sm2.easeFactor / 2.5));

  // Calculate lastRepDate from nextReviewDate - interval
  const lastRepDate = sm2.nextReviewDate - sm2.interval * 24 * 60 * 60 * 1000;

  return {
    repNum,
    memory,
    lastRepDate,
    learningSpeed,
  };
}

/**
 * Migrate legacy strength-based mastery to FIRe state.
 *
 * Used for users who have v1 progress data without SM-2.
 *
 * Mapping:
 * - Strength 0-39: repNum 0-1 (weak/learning)
 * - Strength 40-79: repNum 1-2 (familiar)
 * - Strength 80-100: repNum 2-4 (mastered)
 * - Memory: Based on strength and lastPracticed
 * - LearningSpeed: Based on correct/incorrect ratio
 *
 * @param strength - Legacy strength value (0-100)
 * @param lastPracticed - ISO date string of last practice
 * @param timesCorrect - Number of correct responses
 * @param timesIncorrect - Number of incorrect responses
 * @returns FIRe state
 */
export function migrateStrengthToFIRe(
  strength: number,
  lastPracticed: string,
  timesCorrect: number = 0,
  timesIncorrect: number = 0
): FIReState {
  const now = Date.now();
  const lastPracticedDate = new Date(lastPracticed).getTime();
  const daysSinceLastPractice = (now - lastPracticedDate) / (24 * 60 * 60 * 1000);

  // Map strength to repNum
  let repNum: number;
  if (strength < 40) {
    repNum = (strength / 40) * 1; // 0-1
  } else if (strength < 80) {
    repNum = 1 + ((strength - 40) / 40) * 1; // 1-2
  } else {
    repNum = 2 + ((strength - 80) / 20) * 2; // 2-4
  }

  // Calculate expected interval for this repNum
  let expectedInterval: number;
  if (repNum < 1) {
    expectedInterval = 1;
  } else if (repNum < 2) {
    expectedInterval = 1;
  } else if (repNum < 3) {
    expectedInterval = 6;
  } else {
    expectedInterval = Math.pow(2, repNum - 1);
  }

  // Estimate memory from days since practice
  let memory: number;
  if (daysSinceLastPractice < expectedInterval) {
    // Practiced recently: memory is high
    memory = 0.5 + (1 - daysSinceLastPractice / expectedInterval) * 0.5;
  } else {
    // Overdue: memory decays
    const overdueRatio = (daysSinceLastPractice - expectedInterval) / expectedInterval;
    memory = 0.5 * Math.pow(0.5, overdueRatio);
  }
  memory = Math.max(0, Math.min(1, memory));

  // Calculate learning speed from accuracy
  const totalAttempts = timesCorrect + timesIncorrect;
  let learningSpeed = 1.0;
  if (totalAttempts >= 5) {
    const accuracy = timesCorrect / totalAttempts;
    // High accuracy = faster learner, low accuracy = slower learner
    // 100% accuracy -> 1.3, 50% accuracy -> 0.7
    learningSpeed = 0.7 + accuracy * 0.6;
  }
  learningSpeed = Math.max(0.5, Math.min(2.0, learningSpeed));

  return {
    repNum,
    memory,
    lastRepDate: lastPracticedDate,
    learningSpeed,
  };
}

/**
 * Migrate complete WordMastery to FIRe state.
 *
 * Prefers SM-2 data if available, falls back to strength-based migration.
 *
 * @param mastery - WordMastery object (may have SM-2 or just strength)
 * @returns FIRe state
 */
export function migrateWordMasteryToFIRe(mastery: WordMastery): FIReState {
  // Prefer SM-2 data if available
  if (mastery.sm2) {
    return migrateSM2ToFIRe(mastery.sm2);
  }

  // Fall back to strength-based migration
  return migrateStrengthToFIRe(
    mastery.strength,
    mastery.lastPracticed,
    mastery.timesCorrect,
    mastery.timesIncorrect
  );
}

// ============================================================================
// Batch Migration
// ============================================================================

/**
 * Migrate all word mastery records to FIRe.
 *
 * @param wordMastery - Record of word IDs to WordMastery
 * @returns Record of word IDs to FIRe states
 */
export function migrateAllToFIRe(
  wordMastery: Record<string, WordMastery>
): Record<string, FIReState> {
  const result: Record<string, FIReState> = {};

  for (const [wordId, mastery] of Object.entries(wordMastery)) {
    result[wordId] = migrateWordMasteryToFIRe(mastery);
  }

  return result;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a FIRe state for correctness.
 *
 * @param state - FIRe state to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateFIReState(state: FIReState): string[] {
  const errors: string[] = [];

  if (typeof state.repNum !== 'number' || state.repNum < 0) {
    errors.push('repNum must be a non-negative number');
  }

  if (typeof state.memory !== 'number' || state.memory < 0 || state.memory > 1) {
    errors.push('memory must be a number between 0 and 1');
  }

  if (typeof state.lastRepDate !== 'number' || state.lastRepDate <= 0) {
    errors.push('lastRepDate must be a positive timestamp');
  }

  if (
    typeof state.learningSpeed !== 'number' ||
    state.learningSpeed < 0.5 ||
    state.learningSpeed > 2.0
  ) {
    errors.push('learningSpeed must be a number between 0.5 and 2.0');
  }

  return errors;
}

/**
 * Create a new FIRe state for a word that has never been practiced.
 *
 * @returns Fresh FIRe state
 */
export function createNewFIReState(): FIReState {
  return { ...DEFAULT_FIRE_STATE, lastRepDate: Date.now() };
}

// ============================================================================
// Reverse Migration (for debugging/comparison)
// ============================================================================

/**
 * Estimate equivalent SM-2 state from FIRe state.
 *
 * This is approximate and used mainly for debugging/comparison.
 *
 * @param fire - FIRe state
 * @returns Approximate SM-2 state
 */
export function estimateSM2FromFIRe(fire: FIReState): SM2Data {
  // Map learning speed back to ease factor
  const easeFactor = fire.learningSpeed * 2.5;

  // Calculate interval based on repNum
  let interval: number;
  if (fire.repNum < 1) {
    interval = 1;
  } else if (fire.repNum < 2) {
    interval = 1;
  } else if (fire.repNum < 3) {
    interval = 6;
  } else {
    interval = Math.round(Math.pow(2, fire.repNum - 1));
  }

  // Estimate next review date from memory and interval
  // memory 0.5 = due now, memory 1.0 = just reviewed
  const daysUntilDue = (fire.memory - 0.5) * 2 * interval;
  const nextReviewDate = Date.now() + daysUntilDue * 24 * 60 * 60 * 1000;

  return {
    easeFactor: Math.max(1.3, Math.min(3.0, easeFactor)),
    interval: Math.max(1, interval),
    repetitions: Math.floor(fire.repNum),
    nextReviewDate,
  };
}
