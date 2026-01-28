export interface LessonStrengthInput {
  avgVocabStrength: number;
  avgGrammarStrength: number;
  exerciseAccuracy: number;
}

// Regular exercise scoring
const STRENGTH_INCREASE = 10;
const STRENGTH_DECREASE = 20;
const STRENGTH_MAX = 100;
const STRENGTH_MIN = 0;
const DECAY_GRACE_DAYS = 3;
const DECAY_RATE_PER_DAY = 5;

// Challenge exercise scoring
export const CHALLENGE_STRENGTH_INCREASE = 15;
export const CHALLENGE_STRENGTH_DECREASE = 30;
export const CHALLENGE_DECAY_GRACE_DAYS = 5;  // Proven mastery decays slower
export const CHALLENGE_TIMER_SECONDS = 30;
export const CHALLENGE_THRESHOLD = 80;  // Strength required to trigger challenge

/**
 * Calculate new strength after an exercise attempt.
 * Correct: +10 (capped at 100)
 * Incorrect: -20 (minimum 0)
 */
export function calculateStrengthChange(
  currentStrength: number,
  isCorrect: boolean
): number {
  if (isCorrect) {
    return Math.min(currentStrength + STRENGTH_INCREASE, STRENGTH_MAX);
  }
  return Math.max(currentStrength - STRENGTH_DECREASE, STRENGTH_MIN);
}

/**
 * Calculate new strength after a CHALLENGE exercise attempt.
 * Correct: +15 (capped at 100)
 * Incorrect: -30 (minimum 0)
 */
export function calculateChallengeStrengthChange(
  currentStrength: number,
  isCorrect: boolean
): number {
  if (isCorrect) {
    return Math.min(currentStrength + CHALLENGE_STRENGTH_INCREASE, STRENGTH_MAX);
  }
  return Math.max(currentStrength - CHALLENGE_STRENGTH_DECREASE, STRENGTH_MIN);
}

/**
 * Check if a word's strength qualifies for challenge mode.
 */
export function shouldTriggerChallenge(strength: number): boolean {
  return strength >= CHALLENGE_THRESHOLD;
}

/**
 * Calculate strength decay based on days since last practice.
 * No decay for first 3 days, then 5% per day after that.
 */
export function calculateDecay(
  strength: number,
  daysSinceLastPractice: number,
  hasProvenMastery: boolean = false
): number {
  const graceDays = hasProvenMastery ? CHALLENGE_DECAY_GRACE_DAYS : DECAY_GRACE_DAYS;
  
  if (daysSinceLastPractice <= graceDays) {
    return strength;
  }

  const daysOfDecay = daysSinceLastPractice - graceDays;
  const decayAmount = daysOfDecay * DECAY_RATE_PER_DAY;

  return Math.max(strength - decayAmount, STRENGTH_MIN);
}

/**
 * Calculate overall lesson strength as weighted average.
 * Weights: 50% vocabulary, 30% grammar, 20% exercise accuracy
 */
export function calculateLessonStrength(input: LessonStrengthInput): number {
  const { avgVocabStrength, avgGrammarStrength, exerciseAccuracy } = input;

  const weighted =
    avgVocabStrength * 0.5 +
    avgGrammarStrength * 0.3 +
    exerciseAccuracy * 0.2;

  return Math.round(weighted);
}
