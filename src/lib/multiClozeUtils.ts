/**
 * Multi-Cloze Utilities
 * 
 * Functions for:
 * - Generating multi-cloze exercises from sentences
 * - Checking answers (partial and complete)
 * - Providing feedback on individual blanks
 * 
 * Based on research showing that multiple retrieval attempts in context
 * strengthen associative memory networks.
 */

import type { MultiClozeExercise, ClozeBlank } from '../types/exercise';
import { compareAnswers } from './arabic';
import { fisherYatesShuffle } from './interleave';

// ============================================================================
// Constants
// ============================================================================

/** Minimum words in a sentence to create a multi-cloze */
export const MIN_WORDS_FOR_MULTI_CLOZE = 4;

/** Maximum number of blanks to create */
export const MAX_BLANKS = 3;

/** Words to skip when selecting blanks (particles, prepositions) */
export const SKIP_WORDS = new Set([
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'و', 'ف', 'ب', 'ل', 'ك',
  'فِي', 'مِن', 'مِنْ', 'إِلَى', 'عَلَى', 'عَن', 'عَنْ', 'مَع', 'مَعَ',
  'وَ', 'فَ', 'بِ', 'لِ', 'كَ',
  // Single letters often attached
  'ال', 
]);

/** Blank marker used in prompts */
export const BLANK_MARKER = '_____';

// ============================================================================
// Generation Functions
// ============================================================================

/**
 * Check if a word is suitable for becoming a blank
 */
export function isBlankableWord(word: string): boolean {
  // Skip very short words
  if (word.length < 2) return false;
  
  // Skip common particles/prepositions
  const stripped = word.replace(/^(وَ|فَ|بِ|لِ|كَ|ال)/, '');
  if (SKIP_WORDS.has(word) || SKIP_WORDS.has(stripped)) return false;
  
  // Skip if word is too short after stripping prefixes
  if (stripped.length < 2) return false;
  
  return true;
}

/**
 * Select word positions for blanks from a sentence
 */
export function selectBlankPositions(
  words: string[],
  numBlanks: number = 2
): number[] {
  // Get indices of blankable words
  const blankableIndices: number[] = [];
  
  words.forEach((word, index) => {
    if (isBlankableWord(word)) {
      blankableIndices.push(index);
    }
  });
  
  // Need at least numBlanks blankable words
  if (blankableIndices.length < numBlanks) {
    return blankableIndices;
  }
  
  // Shuffle and take numBlanks positions
  const shuffled = fisherYatesShuffle(blankableIndices);
  const selected = shuffled.slice(0, numBlanks);
  
  // Sort by position for consistent ordering
  return selected.sort((a, b) => a - b);
}

/**
 * Create a prompt string with blanks at specified positions
 */
export function createPromptWithBlanks(
  words: string[],
  blankPositions: number[]
): string {
  const positionsSet = new Set(blankPositions);
  return words
    .map((word, index) => positionsSet.has(index) ? BLANK_MARKER : word)
    .join(' ');
}

/**
 * Generate a multi-cloze exercise from a complete sentence
 */
export function generateMultiClozeExercise(
  completeSentence: string,
  lessonId: string,
  englishHint?: string,
  itemIds: string[] = [],
  numBlanks: number = 2
): MultiClozeExercise | null {
  const words = completeSentence.split(/\s+/);
  
  // Need enough words
  if (words.length < MIN_WORDS_FOR_MULTI_CLOZE) {
    return null;
  }
  
  // Limit blanks to reasonable amount
  const actualBlanks = Math.min(numBlanks, MAX_BLANKS, Math.floor(words.length / 2));
  
  // Select positions for blanks
  const blankPositions = selectBlankPositions(words, actualBlanks);
  
  // Need at least 2 blanks for a multi-cloze
  if (blankPositions.length < 2) {
    return null;
  }
  
  // Create blanks array
  const blanks: ClozeBlank[] = blankPositions.map(position => ({
    position,
    answer: words[position],
  }));
  
  // Create prompt with blanks
  const prompt = createPromptWithBlanks(words, blankPositions);
  
  return {
    id: `mc-${lessonId}-${Date.now()}`,
    type: 'multi-cloze',
    prompt,
    promptEn: englishHint,
    blanks,
    completeSentence,
    itemIds,
  };
}

// ============================================================================
// Answer Checking
// ============================================================================

/**
 * Result for a single blank
 */
export interface BlankResult {
  position: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

/**
 * Full result of checking a multi-cloze answer
 */
export interface MultiClozeResult {
  /** Whether all blanks are correct */
  isCorrect: boolean;
  /** Number of correct blanks */
  correctCount: number;
  /** Total number of blanks */
  totalBlanks: number;
  /** Results for each blank */
  blankResults: BlankResult[];
  /** Accuracy percentage */
  accuracy: number;
  /** Feedback message */
  feedback: string;
}

/**
 * Check answers for a multi-cloze exercise
 * 
 * @param userAnswers Array of user answers in order of blanks
 * @param exercise The multi-cloze exercise
 */
export function checkMultiCloze(
  userAnswers: string[],
  exercise: MultiClozeExercise
): MultiClozeResult {
  const blankResults: BlankResult[] = exercise.blanks.map((blank, index) => {
    const userAnswer = userAnswers[index] || '';
    const isCorrect = compareAnswers(userAnswer, blank.answer);
    
    return {
      position: blank.position,
      userAnswer,
      correctAnswer: blank.answer,
      isCorrect,
    };
  });
  
  const correctCount = blankResults.filter(r => r.isCorrect).length;
  const totalBlanks = exercise.blanks.length;
  const isCorrect = correctCount === totalBlanks;
  const accuracy = Math.round((correctCount / totalBlanks) * 100);
  
  let feedback: string;
  if (isCorrect) {
    feedback = 'Excellent! All blanks correct.';
  } else if (correctCount === 0) {
    feedback = 'Keep practicing! Review the correct answers.';
  } else if (correctCount === totalBlanks - 1) {
    feedback = `Almost! ${correctCount} of ${totalBlanks} correct.`;
  } else {
    feedback = `${correctCount} of ${totalBlanks} correct. Keep going!`;
  }
  
  return {
    isCorrect,
    correctCount,
    totalBlanks,
    blankResults,
    accuracy,
    feedback,
  };
}

/**
 * Check a single blank answer (for real-time validation)
 */
export function checkSingleBlank(
  userAnswer: string,
  blankIndex: number,
  exercise: MultiClozeExercise
): boolean {
  const blank = exercise.blanks[blankIndex];
  if (!blank) return false;
  
  return compareAnswers(userAnswer, blank.answer);
}

// ============================================================================
// Exercise Generation (Batch)
// ============================================================================

/**
 * Generate multi-cloze exercises from existing sentences
 */
export function generateMultiClozeExercises(
  sentences: Array<{
    arabic: string;
    english?: string;
    lessonId: string;
    itemIds?: string[];
  }>,
  limit: number = 5,
  blanksPerExercise: number = 2
): MultiClozeExercise[] {
  const exercises: MultiClozeExercise[] = [];
  
  // Shuffle sentences
  const shuffled = fisherYatesShuffle([...sentences]);
  
  for (const sentence of shuffled) {
    if (exercises.length >= limit) break;
    
    const exercise = generateMultiClozeExercise(
      sentence.arabic,
      sentence.lessonId,
      sentence.english,
      sentence.itemIds,
      blanksPerExercise
    );
    
    if (exercise) {
      exercises.push(exercise);
    }
  }
  
  return exercises;
}

/**
 * Reconstruct the complete sentence from user answers
 * Useful for showing the user's attempted sentence
 */
export function reconstructSentence(
  exercise: MultiClozeExercise,
  userAnswers: string[]
): string {
  const words = exercise.completeSentence.split(/\s+/);
  const blankPositionMap = new Map(
    exercise.blanks.map((blank, index) => [blank.position, index])
  );
  
  return words
    .map((word, position) => {
      const blankIndex = blankPositionMap.get(position);
      if (blankIndex !== undefined) {
        return userAnswers[blankIndex] || BLANK_MARKER;
      }
      return word;
    })
    .join(' ');
}

/**
 * Get hint for a specific blank (progressive reveal)
 */
export function getBlankHint(
  blank: ClozeBlank,
  revealLevel: number
): string {
  const answer = blank.answer;
  
  if (revealLevel <= 0) {
    return '';
  }
  
  // Level 1: Show first letter
  if (revealLevel === 1) {
    return answer.charAt(0) + '...';
  }
  
  // Level 2: Show first two letters
  if (revealLevel === 2) {
    return answer.slice(0, 2) + '...';
  }
  
  // Level 3+: Show half the word
  const halfLength = Math.ceil(answer.length / 2);
  return answer.slice(0, halfLength) + '...';
}
