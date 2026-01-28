/**
 * Pre-test utilities for productive failure learning.
 * 
 * Based on research from "Make It Stick" (Brown, Roediger, McDaniel):
 * - Attempting to answer questions BEFORE learning increases later retention
 * - The act of retrieval attempt, even if wrong, primes the brain for learning
 * - Pre-testing improves final test scores by 10-20%
 * 
 * How it works:
 * 1. Before starting a new lesson, users take a brief pre-test
 * 2. Questions cover vocabulary they haven't learned yet
 * 3. Users guess/attempt answers (expected to get most wrong)
 * 4. After seeing correct answers, the "productive failure" primes learning
 * 5. During the actual lesson, retention is significantly improved
 */

import type { Exercise } from '../types/exercise';
import { fisherYatesShuffle } from './interleave';

/**
 * Vocabulary item structure from lesson content
 */
export interface VocabItem {
  id: string;
  arabic: string;
  english: string;
  root?: string | null;
  lesson: string;
  partOfSpeech: string;
}

/**
 * Pre-test exercise - simplified version focused on vocabulary recognition
 */
export interface PreTestExercise {
  id: string;
  type: 'pretest-recognize' | 'pretest-produce';
  vocabId: string;
  arabic: string;
  english: string;
  /** For multiple choice: 3 distractors + correct answer */
  options?: string[];
  correctIndex?: number;
}

/**
 * Pre-test session configuration
 */
export interface PreTestConfig {
  /** Maximum number of pre-test questions */
  maxQuestions: number;
  /** Mix of recognition (multiple choice) vs. production (free recall) */
  recognitionRatio: number; // 0.0 to 1.0, where 1.0 = all recognition
}

/**
 * Pre-test result for a single item
 */
export interface PreTestItemResult {
  vocabId: string;
  wasCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  responseTimeMs?: number;
}

/**
 * Complete pre-test session result
 */
export interface PreTestResult {
  lessonId: string;
  timestamp: number;
  items: PreTestItemResult[];
  totalCorrect: number;
  totalQuestions: number;
  /** Words the user got wrong - these benefit most from the lesson */
  failedVocabIds: string[];
}

/**
 * Default pre-test configuration
 * - 5-8 questions is optimal for pre-testing without fatigue
 * - 70% recognition (easier) + 30% production (harder)
 */
export const DEFAULT_PRETEST_CONFIG: PreTestConfig = {
  maxQuestions: 6,
  recognitionRatio: 0.7,
};

/**
 * Generate pre-test exercises from lesson vocabulary.
 * 
 * @param lessonVocab Vocabulary items from the lesson
 * @param allVocab All vocabulary (for generating distractors)
 * @param config Pre-test configuration
 * @returns Array of pre-test exercises
 */
export function generatePreTestExercises(
  lessonVocab: VocabItem[],
  allVocab: VocabItem[],
  config: PreTestConfig = DEFAULT_PRETEST_CONFIG
): PreTestExercise[] {
  if (lessonVocab.length === 0) {
    return [];
  }

  // Shuffle and limit to max questions
  const shuffledVocab = fisherYatesShuffle(lessonVocab);
  const selectedVocab = shuffledVocab.slice(0, config.maxQuestions);

  // Determine how many recognition exercises (rest will be production)
  const recognitionCount = Math.round(selectedVocab.length * config.recognitionRatio);

  const exercises: PreTestExercise[] = [];

  // Generate recognition exercises (multiple choice)
  for (let i = 0; i < recognitionCount; i++) {
    const vocab = selectedVocab[i];
    const exercise = generateRecognitionExercise(vocab, allVocab, i);
    exercises.push(exercise);
  }

  // Generate production exercises (free recall)
  for (let i = recognitionCount; i < selectedVocab.length; i++) {
    const vocab = selectedVocab[i];
    const exercise = generateProductionExercise(vocab, i);
    exercises.push(exercise);
  }

  // Shuffle the final order
  return fisherYatesShuffle(exercises);
}

/**
 * Generate a recognition (multiple choice) exercise.
 * Shows Arabic word, asks for English meaning.
 */
function generateRecognitionExercise(
  vocab: VocabItem,
  allVocab: VocabItem[],
  index: number
): PreTestExercise {
  // Get distractors from other vocabulary
  const distractors = generateDistractors(vocab, allVocab, 3);
  
  // Create options array with correct answer inserted at random position
  const options = [...distractors];
  const correctIndex = Math.floor(Math.random() * 4);
  options.splice(correctIndex, 0, vocab.english);

  return {
    id: `pretest-rec-${index}`,
    type: 'pretest-recognize',
    vocabId: vocab.id,
    arabic: vocab.arabic,
    english: vocab.english,
    options,
    correctIndex,
  };
}

/**
 * Generate a production (free recall) exercise.
 * Shows English meaning, asks for Arabic word.
 */
function generateProductionExercise(
  vocab: VocabItem,
  index: number
): PreTestExercise {
  return {
    id: `pretest-prod-${index}`,
    type: 'pretest-produce',
    vocabId: vocab.id,
    arabic: vocab.arabic,
    english: vocab.english,
  };
}

/**
 * Generate distractor options for multiple choice.
 * Tries to pick semantically unrelated words from other lessons.
 */
function generateDistractors(
  correctVocab: VocabItem,
  allVocab: VocabItem[],
  count: number
): string[] {
  // Filter out the correct answer and words from same lesson
  const candidates = allVocab.filter(v => 
    v.id !== correctVocab.id && 
    v.english !== correctVocab.english &&
    v.lesson !== correctVocab.lesson
  );

  // If not enough candidates, fall back to any different word
  const pool = candidates.length >= count 
    ? candidates 
    : allVocab.filter(v => v.id !== correctVocab.id && v.english !== correctVocab.english);

  // Shuffle and pick
  const shuffled = fisherYatesShuffle(pool);
  return shuffled.slice(0, count).map(v => v.english);
}

/**
 * Calculate pre-test score and identify failed items.
 */
export function calculatePreTestResult(
  lessonId: string,
  items: PreTestItemResult[]
): PreTestResult {
  const totalCorrect = items.filter(item => item.wasCorrect).length;
  const failedVocabIds = items
    .filter(item => !item.wasCorrect)
    .map(item => item.vocabId);

  return {
    lessonId,
    timestamp: Date.now(),
    items,
    totalCorrect,
    totalQuestions: items.length,
    failedVocabIds,
  };
}

/**
 * Get feedback message based on pre-test performance.
 * Note: The purpose of pre-test is NOT to score well, but to prime learning.
 */
export function getPreTestFeedback(result: PreTestResult): {
  title: string;
  message: string;
  encouragement: string;
} {
  const percentage = result.totalQuestions > 0 
    ? Math.round((result.totalCorrect / result.totalQuestions) * 100)
    : 0;

  // Pre-test is expected to have low scores - that's the point!
  if (percentage === 100) {
    return {
      title: 'Perfect!',
      message: 'You already know this material well.',
      encouragement: 'The lesson will help reinforce your knowledge.',
    };
  }

  if (percentage >= 70) {
    return {
      title: 'Good Start!',
      message: `You recognized ${result.totalCorrect} of ${result.totalQuestions} words.`,
      encouragement: 'You have some prior knowledge. The lesson will fill in the gaps.',
    };
  }

  if (percentage >= 40) {
    return {
      title: 'Nice Effort!',
      message: `You got ${result.totalCorrect} of ${result.totalQuestions} correct.`,
      encouragement: 'Don\'t worry - struggling now helps you learn better!',
    };
  }

  // Low score - this is actually ideal for pre-testing
  return {
    title: 'Great Preparation!',
    message: `This material is new to you.`,
    encouragement: 'Research shows that attempting answers before learning improves retention by 10-20%. You\'re primed to learn!',
  };
}

/**
 * Check if a pre-test exercise answer is correct.
 */
export function checkPreTestAnswer(
  exercise: PreTestExercise,
  userAnswer: string | number
): boolean {
  if (exercise.type === 'pretest-recognize') {
    // For multiple choice, compare selected index
    return userAnswer === exercise.correctIndex;
  } else {
    // For production, compare the Arabic (normalized)
    const normalized = normalizeForComparison(String(userAnswer));
    const expected = normalizeForComparison(exercise.arabic);
    return normalized === expected;
  }
}

/**
 * Normalize text for comparison (remove tashkeel, trim, lowercase).
 */
function normalizeForComparison(text: string): string {
  // Remove Arabic tashkeel
  const withoutTashkeel = text.replace(/[\u064B-\u065F\u0670]/g, '');
  // Trim and collapse whitespace
  return withoutTashkeel.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Convert lesson exercises to use for pre-testing.
 * Extracts word-to-meaning and meaning-to-word exercises.
 */
export function extractPreTestableExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter(ex => 
    ex.type === 'word-to-meaning' || 
    ex.type === 'meaning-to-word'
  );
}

/**
 * Get the number of new vocabulary items in a lesson.
 * Used to determine if pre-test is beneficial.
 */
export function countNewVocabulary(
  lessonVocabIds: string[],
  masteredVocabIds: Set<string>
): number {
  return lessonVocabIds.filter(id => !masteredVocabIds.has(id)).length;
}

/**
 * Determine if a lesson should offer a pre-test.
 * Pre-tests are most beneficial when:
 * - User hasn't taken a pre-test for this lesson
 * - Lesson has mostly new vocabulary (not review)
 */
export function shouldOfferPreTest(
  lessonId: string,
  completedPreTests: Set<string>,
  newVocabCount: number,
  totalVocabCount: number
): boolean {
  // Don't offer if already taken
  if (completedPreTests.has(lessonId)) {
    return false;
  }

  // Don't offer if mostly review material
  const newRatio = totalVocabCount > 0 ? newVocabCount / totalVocabCount : 0;
  return newRatio >= 0.5; // At least 50% new vocabulary
}
