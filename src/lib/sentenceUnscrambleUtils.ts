/**
 * Utility functions for sentence unscramble exercises.
 * 
 * These exercises present a sentence with words shuffled, including some
 * distractor words that don't belong. Users must arrange the correct words
 * in the right order while ignoring distractors.
 */

import type { SentenceUnscrambleExercise, UnscrambleWord } from '../types/exercise';
import { normalizeArabic } from './arabic';
import { fisherYatesShuffle } from './interleave';

/**
 * Common Arabic words that can be used as distractors.
 * These are high-frequency words that could plausibly appear in many sentences.
 */
export const COMMON_DISTRACTOR_POOL = [
  { arabic: 'هُوَ', english: 'he' },
  { arabic: 'هِيَ', english: 'she' },
  { arabic: 'أَنْتَ', english: 'you (m)' },
  { arabic: 'أَنْتِ', english: 'you (f)' },
  { arabic: 'أَنَا', english: 'I' },
  { arabic: 'نَحْنُ', english: 'we' },
  { arabic: 'هُمْ', english: 'they (m)' },
  { arabic: 'هُنَّ', english: 'they (f)' },
  { arabic: 'هَذَا', english: 'this (m)' },
  { arabic: 'هَذِهِ', english: 'this (f)' },
  { arabic: 'ذَلِكَ', english: 'that (m)' },
  { arabic: 'تِلْكَ', english: 'that (f)' },
  { arabic: 'الَّذِي', english: 'who/which (m)' },
  { arabic: 'الَّتِي', english: 'who/which (f)' },
  { arabic: 'فِي', english: 'in' },
  { arabic: 'مِنْ', english: 'from' },
  { arabic: 'إِلَى', english: 'to' },
  { arabic: 'عَلَى', english: 'on' },
  { arabic: 'مَعَ', english: 'with' },
  { arabic: 'عِنْدَ', english: 'at/with' },
  { arabic: 'بَعْدَ', english: 'after' },
  { arabic: 'قَبْلَ', english: 'before' },
  { arabic: 'كَبِيرٌ', english: 'big' },
  { arabic: 'صَغِيرٌ', english: 'small' },
  { arabic: 'جَدِيدٌ', english: 'new' },
  { arabic: 'قَدِيمٌ', english: 'old' },
  { arabic: 'جَمِيلٌ', english: 'beautiful' },
  { arabic: 'طَوِيلٌ', english: 'long/tall' },
  { arabic: 'قَصِيرٌ', english: 'short' },
  { arabic: 'وَ', english: 'and' },
  { arabic: 'أَوْ', english: 'or' },
  { arabic: 'ثُمَّ', english: 'then' },
  { arabic: 'لَكِنْ', english: 'but' },
  { arabic: 'لِأَنَّ', english: 'because' },
  { arabic: 'كَانَ', english: 'was' },
  { arabic: 'يَكُونُ', english: 'is/will be' },
  { arabic: 'ذَهَبَ', english: 'went' },
  { arabic: 'جَاءَ', english: 'came' },
  { arabic: 'أَخَذَ', english: 'took' },
  { arabic: 'كَتَبَ', english: 'wrote' },
];

/**
 * Split an Arabic sentence into words.
 * Handles multiple spaces and trims whitespace.
 */
export function splitSentenceIntoWords(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Generate a unique ID for a word tile.
 */
export function generateWordId(index: number): string {
  return `word-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Select distractors that are not already in the sentence.
 * Uses normalized comparison to avoid duplicates.
 */
export function selectDistractors(
  sentence: string,
  count: number,
  pool: typeof COMMON_DISTRACTOR_POOL = COMMON_DISTRACTOR_POOL
): string[] {
  const sentenceWords = splitSentenceIntoWords(sentence);
  const normalizedSentenceWords = new Set(
    sentenceWords.map(w => normalizeArabic(w))
  );

  // Filter out words that appear in the sentence
  const availableDistractors = pool.filter(
    d => !normalizedSentenceWords.has(normalizeArabic(d.arabic))
  );

  if (availableDistractors.length === 0) {
    return [];
  }

  // Shuffle and take the requested count
  const shuffled = fisherYatesShuffle(availableDistractors);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(d => d.arabic);
}

/**
 * Generate an UnscrambleWord array from a sentence with distractors.
 * Words are shuffled and each has a unique ID.
 */
export function generateUnscrambleWords(
  sentence: string,
  distractorCount: number = 2,
  customDistractors?: string[]
): UnscrambleWord[] {
  const sentenceWords = splitSentenceIntoWords(sentence);
  
  // Select distractors
  const distractors = customDistractors ?? selectDistractors(sentence, distractorCount);

  // Create word objects
  const words: UnscrambleWord[] = [];
  
  // Add sentence words
  sentenceWords.forEach((text, index) => {
    words.push({
      text,
      id: generateWordId(index),
      isDistractor: false,
    });
  });

  // Add distractor words
  distractors.forEach((text, index) => {
    words.push({
      text,
      id: generateWordId(sentenceWords.length + index),
      isDistractor: true,
    });
  });

  // Shuffle all words together using Fisher-Yates
  return fisherYatesShuffle(words);
}

/**
 * Create a sentence unscramble exercise from a sentence.
 */
export function createSentenceUnscrambleExercise(
  id: string,
  sentence: string,
  itemIds: string[],
  options: {
    distractorCount?: number;
    englishHint?: string;
    customDistractors?: string[];
  } = {}
): SentenceUnscrambleExercise {
  const { distractorCount = 2, englishHint, customDistractors } = options;

  const words = generateUnscrambleWords(sentence, distractorCount, customDistractors);

  return {
    id,
    type: 'sentence-unscramble',
    itemIds,
    correctSentence: sentence,
    words,
    englishHint,
    distractorCount: customDistractors?.length ?? distractorCount,
  };
}

/**
 * Result of checking a sentence unscramble answer.
 */
export interface UnscrambleCheckResult {
  /** Whether the answer is completely correct */
  isCorrect: boolean;
  /** Whether the word order is correct (ignoring distractor mistakes) */
  orderCorrect: boolean;
  /** Whether all distractors were correctly excluded */
  distractorsExcluded: boolean;
  /** Number of words in correct position */
  correctPositions: number;
  /** Total number of words expected */
  totalExpected: number;
  /** IDs of incorrectly included distractors */
  includedDistractors: string[];
  /** IDs of missing correct words */
  missingWords: string[];
}

/**
 * Check if a user's word arrangement is correct.
 * 
 * @param userArrangement - Array of word IDs in the user's order
 * @param exercise - The sentence unscramble exercise
 * @returns Detailed result of the check
 */
export function checkUnscrambleAnswer(
  userArrangement: string[],
  exercise: SentenceUnscrambleExercise
): UnscrambleCheckResult {
  const wordMap = new Map(exercise.words.map(w => [w.id, w]));
  const correctWords = splitSentenceIntoWords(exercise.correctSentence);
  
  // Get user's words (filter out undefined in case of bad IDs)
  const userWords = userArrangement
    .map(id => wordMap.get(id))
    .filter((w): w is UnscrambleWord => w !== undefined);

  // Find included distractors
  const includedDistractors = userWords
    .filter(w => w.isDistractor)
    .map(w => w.id);

  // Find the correct words from the exercise
  const correctWordObjects = exercise.words.filter(w => !w.isDistractor);
  const userCorrectWords = userWords.filter(w => !w.isDistractor);

  // Check if all correct words are included
  const userCorrectWordIds = new Set(userCorrectWords.map(w => w.id));
  
  const missingWords = correctWordObjects
    .filter(w => !userCorrectWordIds.has(w.id))
    .map(w => w.id);

  // Check word order (only for non-distractor words in user's arrangement)
  const userTexts = userCorrectWords.map(w => normalizeArabic(w.text));
  const correctTexts = correctWords.map(w => normalizeArabic(w));

  // Count correct positions
  let correctPositions = 0;
  for (let i = 0; i < Math.min(userTexts.length, correctTexts.length); i++) {
    if (userTexts[i] === correctTexts[i]) {
      correctPositions++;
    }
  }

  const orderCorrect = 
    userTexts.length === correctTexts.length &&
    userTexts.every((text, i) => text === correctTexts[i]);

  const distractorsExcluded = includedDistractors.length === 0;

  return {
    isCorrect: orderCorrect && distractorsExcluded && missingWords.length === 0,
    orderCorrect,
    distractorsExcluded,
    correctPositions,
    totalExpected: correctWords.length,
    includedDistractors,
    missingWords,
  };
}

/**
 * Get the correct word arrangement (non-distractor word IDs in correct order).
 */
export function getCorrectArrangement(exercise: SentenceUnscrambleExercise): string[] {
  const correctWords = splitSentenceIntoWords(exercise.correctSentence);
  const wordsByNormalizedText = new Map<string, UnscrambleWord>();
  
  // Build a map of normalized text to word objects (non-distractors only)
  for (const word of exercise.words) {
    if (!word.isDistractor) {
      wordsByNormalizedText.set(normalizeArabic(word.text), word);
    }
  }

  // Return IDs in the correct order
  return correctWords
    .map(text => wordsByNormalizedText.get(normalizeArabic(text)))
    .filter((w): w is UnscrambleWord => w !== undefined)
    .map(w => w.id);
}

/**
 * Calculate a score for the user's arrangement (0-100).
 * Useful for partial credit or progress tracking.
 */
export function calculateUnscrambleScore(result: UnscrambleCheckResult): number {
  if (result.isCorrect) return 100;

  const positionScore = result.totalExpected > 0
    ? (result.correctPositions / result.totalExpected) * 70
    : 0;

  const distractorPenalty = result.includedDistractors.length * 10;
  const missingPenalty = result.missingWords.length * 15;

  const score = Math.max(0, positionScore - distractorPenalty - missingPenalty);
  return Math.round(score);
}

/**
 * Get a hint based on the user's current arrangement.
 */
export function getUnscrambleHint(
  userArrangement: string[],
  exercise: SentenceUnscrambleExercise
): string {
  const result = checkUnscrambleAnswer(userArrangement, exercise);
  const correctWords = splitSentenceIntoWords(exercise.correctSentence);

  if (result.includedDistractors.length > 0) {
    return 'Some words don\'t belong in this sentence. Try removing them.';
  }

  if (result.missingWords.length > 0) {
    return `You're missing ${result.missingWords.length} word(s). Include all the correct words.`;
  }

  if (!result.orderCorrect) {
    // Find the first wrong position
    const wordMap = new Map(exercise.words.map(w => [w.id, w]));
    const userWords = userArrangement
      .map(id => wordMap.get(id))
      .filter((w): w is UnscrambleWord => w !== undefined && !w.isDistractor);

    for (let i = 0; i < userWords.length; i++) {
      const userText = normalizeArabic(userWords[i].text);
      const correctText = normalizeArabic(correctWords[i] || '');
      if (userText !== correctText) {
        return `Word ${i + 1} is not in the right position.`;
      }
    }

    return 'Check the word order carefully.';
  }

  return 'Keep trying!';
}

/**
 * Determine appropriate distractor count based on difficulty.
 * Higher difficulty = more distractors.
 */
export function getDistractorCountForDifficulty(
  difficulty: 'easy' | 'medium' | 'hard',
  sentenceLength: number
): number {
  const baseCounts = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  // Add more distractors for longer sentences
  const lengthBonus = Math.floor(sentenceLength / 5);
  
  return Math.min(baseCounts[difficulty] + lengthBonus, 5);
}
