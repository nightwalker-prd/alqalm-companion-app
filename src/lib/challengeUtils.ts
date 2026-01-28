/**
 * Challenge mode utilities for mastery-level exercises.
 * Challenges are triggered when all itemIds in an exercise have strength >= 80.
 */

import type { ChallengeConfig, Exercise, WordToMeaningExercise, MeaningToWordExercise } from '../types/exercise';
import { CHALLENGE_TIMER_SECONDS, CHALLENGE_THRESHOLD } from './mastery';

/**
 * Default config for non-challenge exercises.
 */
const DEFAULT_CONFIG: ChallengeConfig = {
  isChallenge: false,
  timerSeconds: 0,
  requireTashkeel: false,
  hideEnglishHint: false,
  reversedDirection: false,
};

/**
 * Challenge config for mastery-level exercises.
 */
const CHALLENGE_CONFIG: ChallengeConfig = {
  isChallenge: true,
  timerSeconds: CHALLENGE_TIMER_SECONDS,
  requireTashkeel: true,
  hideEnglishHint: true,
  reversedDirection: false,
};

/**
 * Get the challenge configuration for an exercise based on word strengths.
 * Returns challenge config if ALL itemIds have strength >= 80.
 * 
 * @param exercise - The exercise to check
 * @param getWordStrength - Function to look up word strength by itemId
 * @returns ChallengeConfig with appropriate settings
 */
export function getChallengeConfig(
  exercise: Exercise,
  getWordStrength: (itemId: string) => number
): ChallengeConfig {
  const { itemIds } = exercise;
  
  // No items means no challenge
  if (itemIds.length === 0) {
    return DEFAULT_CONFIG;
  }
  
  // Check if ALL items qualify for challenge
  const allQualify = itemIds.every(
    (itemId) => getWordStrength(itemId) >= CHALLENGE_THRESHOLD
  );
  
  if (!allQualify) {
    return DEFAULT_CONFIG;
  }
  
  // Determine if we should reverse direction (for meaning exercises)
  // Randomly reverse ~50% of the time for variety
  const canReverse = exercise.type === 'word-to-meaning' || exercise.type === 'meaning-to-word';
  const shouldReverse = canReverse && Math.random() < 0.5;
  
  return {
    ...CHALLENGE_CONFIG,
    reversedDirection: shouldReverse,
  };
}

/**
 * Reverse a word-to-meaning exercise to meaning-to-word (or vice versa).
 * This increases challenge difficulty by requiring recall in the opposite direction.
 * 
 * @param exercise - The exercise to reverse
 * @returns A new exercise with swapped prompt/answer and type
 */
export function reverseExercise(
  exercise: WordToMeaningExercise | MeaningToWordExercise
): WordToMeaningExercise | MeaningToWordExercise {
  if (exercise.type === 'word-to-meaning') {
    // Convert to meaning-to-word: English prompt -> Arabic answer
    return {
      ...exercise,
      type: 'meaning-to-word',
      prompt: exercise.answer,  // English meaning becomes prompt
      answer: exercise.prompt,  // Arabic word becomes answer
    } as MeaningToWordExercise;
  }
  
  // Convert to word-to-meaning: Arabic prompt -> English answer
  return {
    ...exercise,
    type: 'word-to-meaning',
    prompt: exercise.answer,  // Arabic word becomes prompt
    answer: exercise.prompt,  // English meaning becomes answer
  } as WordToMeaningExercise;
}

/**
 * Apply challenge configuration to an exercise.
 * If reversedDirection is true and exercise can be reversed, returns reversed exercise.
 * 
 * @param exercise - The original exercise
 * @param config - The challenge configuration
 * @returns The exercise, possibly reversed
 */
export function applyChallenge(
  exercise: Exercise,
  config: ChallengeConfig
): Exercise {
  if (!config.reversedDirection) {
    return exercise;
  }
  
  // Only reverse word-to-meaning and meaning-to-word exercises
  if (exercise.type === 'word-to-meaning' || exercise.type === 'meaning-to-word') {
    return reverseExercise(exercise);
  }
  
  return exercise;
}
