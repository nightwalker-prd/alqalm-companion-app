/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * This algorithm optimizes review intervals based on how well the learner
 * remembers each item.
 *
 * Quality ratings:
 * - 0: Complete blackout, no recall
 * - 1: Incorrect response, but remembered upon seeing answer
 * - 2: Incorrect response, but answer seemed easy to recall
 * - 3: Correct response with serious difficulty
 * - 4: Correct response after hesitation
 * - 5: Perfect response with no hesitation
 *
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

/**
 * Quality rating for SM-2 algorithm (0-5 scale)
 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2 state for a single item
 */
export interface SM2State {
  /** Easiness factor - determines how quickly intervals grow (minimum 1.3, default 2.5) */
  easeFactor: number;
  /** Current interval in days until next review */
  interval: number;
  /** Number of consecutive correct responses (quality >= 3) */
  repetitions: number;
  /** Timestamp of when the item is next due for review */
  nextReviewDate: number;
}

/**
 * Default SM-2 state for a new item
 */
export const DEFAULT_SM2_STATE: SM2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReviewDate: Date.now(),
};

/**
 * Minimum ease factor to prevent intervals from shrinking too much
 */
const MIN_EASE_FACTOR = 1.3;

/**
 * Calculate the new SM-2 state after a review
 *
 * @param current - Current SM-2 state
 * @param quality - Quality of the response (0-5)
 * @returns New SM-2 state with updated values
 */
export function calculateSM2(current: SM2State, quality: SM2Quality): SM2State {
  // Calculate new ease factor
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  let newEaseFactor = current.easeFactor + easeDelta;

  // Ensure ease factor doesn't go below minimum
  if (newEaseFactor < MIN_EASE_FACTOR) {
    newEaseFactor = MIN_EASE_FACTOR;
  }

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed response - reset repetitions and interval
    newRepetitions = 0;
    newInterval = 1; // Review again tomorrow
  } else {
    // Successful response
    newRepetitions = current.repetitions + 1;

    if (current.repetitions === 0) {
      // First successful review
      newInterval = 1;
    } else if (current.repetitions === 1) {
      // Second successful review
      newInterval = 6;
    } else {
      // Subsequent reviews: multiply previous interval by ease factor
      newInterval = Math.round(current.interval * newEaseFactor);
    }
  }

  // Calculate next review date
  const now = Date.now();
  const nextReviewDate = now + newInterval * 24 * 60 * 60 * 1000;

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

/**
 * Check if an item is due for review
 *
 * @param state - SM-2 state of the item
 * @returns true if the item is due (nextReviewDate <= now)
 */
export function isDue(state: SM2State): boolean {
  return state.nextReviewDate <= Date.now();
}

/**
 * Check if an item is overdue for review
 *
 * @param state - SM-2 state of the item
 * @returns Number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(state: SM2State): number {
  const now = Date.now();
  if (state.nextReviewDate >= now) {
    return 0;
  }
  const msOverdue = now - state.nextReviewDate;
  return Math.floor(msOverdue / (24 * 60 * 60 * 1000));
}

/**
 * Get days until next review
 *
 * @param state - SM-2 state of the item
 * @returns Number of days until review (negative if overdue)
 */
export function getDaysUntilReview(state: SM2State): number {
  const now = Date.now();
  const msUntil = state.nextReviewDate - now;
  return Math.ceil(msUntil / (24 * 60 * 60 * 1000));
}

/**
 * Convert a simple correct/incorrect result to SM-2 quality
 *
 * This provides a simplified interface for exercises that don't
 * capture detailed quality ratings.
 *
 * @param isCorrect - Whether the answer was correct
 * @param wasHard - Optional: if correct, whether it was difficult
 * @returns SM-2 quality rating
 */
export function simpleToQuality(isCorrect: boolean, wasHard: boolean = false): SM2Quality {
  if (!isCorrect) {
    return 1; // Incorrect but will see the answer
  }
  return wasHard ? 3 : 4; // Correct with difficulty or normal correct
}

/**
 * Convert flashcard self-assessment to SM-2 quality
 *
 * @param rating - User's self-assessment: 'again' | 'hard' | 'good' | 'easy'
 * @returns SM-2 quality rating
 */
export function flashcardToQuality(
  rating: 'again' | 'hard' | 'good' | 'easy'
): SM2Quality {
  switch (rating) {
    case 'again':
      return 1;
    case 'hard':
      return 3;
    case 'good':
      return 4;
    case 'easy':
      return 5;
  }
}

/**
 * Estimate the retention rate based on days since last review
 *
 * Uses the forgetting curve formula: R = e^(-t/S)
 * where t is time and S is stability (approximated from ease factor)
 *
 * @param state - SM-2 state
 * @returns Estimated retention rate (0-1)
 */
export function estimateRetention(state: SM2State): number {
  const daysSinceReview = -getDaysUntilReview(state);
  if (daysSinceReview <= 0) {
    return 1; // Not yet due, assume full retention
  }

  // Stability approximation: higher ease = more stable memory
  const stability = state.interval * (state.easeFactor / 2.5);

  // Forgetting curve
  const retention = Math.exp(-daysSinceReview / stability);
  return Math.max(0, Math.min(1, retention));
}

/**
 * Sort items by review priority
 *
 * Priority is based on:
 * 1. Overdue items first (sorted by how overdue)
 * 2. Then by estimated retention (lower retention = higher priority)
 *
 * @param items - Array of items with SM-2 state
 * @returns Sorted array (most urgent first)
 */
export function sortByReviewPriority<T extends { sm2: SM2State }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const aOverdue = getDaysOverdue(a.sm2);
    const bOverdue = getDaysOverdue(b.sm2);

    // Both overdue: sort by most overdue
    if (aOverdue > 0 && bOverdue > 0) {
      return bOverdue - aOverdue;
    }

    // Only one overdue: overdue item first
    if (aOverdue > 0) return -1;
    if (bOverdue > 0) return 1;

    // Neither overdue: sort by retention (lower = higher priority)
    const aRetention = estimateRetention(a.sm2);
    const bRetention = estimateRetention(b.sm2);
    return aRetention - bRetention;
  });
}
