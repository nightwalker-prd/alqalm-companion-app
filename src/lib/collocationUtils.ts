/**
 * Collocation Utilities
 * 
 * Functions for:
 * - Extracting collocations from existing exercises
 * - Generating collocation exercises
 * - Tracking collocation mastery
 * - Scoring collocation answers
 */

import type {
  Collocation,
  CollocationType,
  CollocationExercise,
  CollocationMastery,
} from '../types/collocation';
import { normalizeArabic, compareAnswers } from './arabic';
import { fisherYatesShuffle } from './interleave';

// ============================================================================
// Constants
// ============================================================================

/**
 * Patterns for detecting collocation types from word combinations
 */
export const COLLOCATION_PATTERNS = {
  /** Demonstrative pronouns that start collocations */
  demonstratives: ['هَذَا', 'هَذِهِ', 'ذَلِكَ', 'تِلْكَ', 'هَؤُلَاءِ', 'أُولَئِكَ'],
  
  /** Common prepositions */
  prepositions: ['فِي', 'مِنْ', 'إِلَى', 'عَلَى', 'عَنْ', 'بِ', 'لِ', 'كَ', 'مَعَ'],
  
  /** Question words */
  questionWords: ['مَا', 'مَنْ', 'أَيْنَ', 'كَيْفَ', 'لِمَاذَا', 'مَتَى', 'كَمْ', 'أَيُّ', 'هَلْ', 'أَ'],
  
  /** Common adjective patterns (descriptive words ending in common suffixes) */
  adjectiveEndings: ['ِيٌّ', 'ِيَّةٌ', 'ٌ', 'ةٌ'],
} as const;

/**
 * Minimum strength for a word before it can be used in collocation exercises
 * (both words should be somewhat familiar)
 */
export const MIN_WORD_STRENGTH_FOR_COLLOCATION = 20;

/**
 * Strength changes for collocation exercises
 * Learning collocations is harder than single words, so more credit
 */
export const COLLOCATION_STRENGTH_CHANGES = {
  correct: 12,
  incorrect: -15,
} as const;

// ============================================================================
// Collocation Detection
// ============================================================================

/**
 * Detect the type of collocation from a phrase
 * 
 * @param phrase The Arabic phrase to analyze
 * @returns The detected collocation type, or null if not a recognized pattern
 */
export function detectCollocationType(phrase: string): CollocationType | null {
  const normalized = normalizeArabic(phrase);
  const words = normalized.split(/\s+/);
  
  if (words.length < 2) {
    return null;
  }
  
  const firstWord = words[0];
  const secondWord = words[1];
  const firstWordNormalized = normalizeArabic(firstWord);
  const secondWordNormalized = normalizeArabic(secondWord);
  
  // Check for demonstrative + noun pattern
  const demonstrativesNormalized = COLLOCATION_PATTERNS.demonstratives.map(normalizeArabic);
  if (demonstrativesNormalized.some(d => firstWordNormalized === d)) {
    return 'demonstrative_noun';
  }
  
  // Special handling for من which can be both "who" (question) and "from" (preposition)
  // If followed by a demonstrative, it's likely a question "من هذا" = "who is this?"
  // If followed by a noun with ال, it's likely a preposition "من المدرسة" = "from the school"
  if (firstWordNormalized === 'من') {
    // Check if second word is a demonstrative → question
    if (demonstrativesNormalized.some(d => secondWordNormalized === d)) {
      return 'question_answer';
    }
    // Check if second word has ال (definite article) → preposition
    if (secondWordNormalized.startsWith('ال')) {
      return 'preposition_noun';
    }
    // Default to preposition for "من + noun" patterns
    return 'preposition_noun';
  }
  
  // Check for other multi-letter prepositions (exact match)
  const prepositionsNormalized = COLLOCATION_PATTERNS.prepositions.map(normalizeArabic);
  const multiLetterPreps = prepositionsNormalized.filter(p => p.length > 1 && p !== 'من');
  
  if (multiLetterPreps.some(p => firstWordNormalized === p)) {
    return 'preposition_noun';
  }
  
  // Check for question + structure pattern
  // Single-word question particles at the start (excluding من which is handled above)
  const questionsNormalized = COLLOCATION_PATTERNS.questionWords.map(normalizeArabic);
  const questionParticles = questionsNormalized.filter(q => q !== 'من');
  if (questionParticles.some(q => firstWordNormalized === q)) {
    return 'question_answer';
  }
  
  // Check for single-letter attached prepositions (ب، ل، ك)
  // These typically attach to make words like بالبيت، للرجل، كالأسد
  // Only match if the word is at least 3 chars (preposition + ال + root)
  const singleLetterPreps = ['ب', 'ل', 'ك'];
  
  // Additional check: attached prepositions usually have ال after them
  // So look for patterns like بال، لل، كال
  const hasAlAfterPrep = singleLetterPreps.some(p =>
    firstWordNormalized.startsWith(p + 'ال') || firstWordNormalized.startsWith(p + 'ل')
  );
  
  if (hasAlAfterPrep) {
    return 'preposition_noun';
  }
  
  // Default: assume noun + adjective for 2-word phrases
  if (words.length === 2) {
    return 'noun_adjective';
  }
  
  return null;
}

/**
 * Extract collocations from existing exercises
 * Looks for multi-word answers that represent common patterns
 * 
 * @param exercises Array of exercises with prompts and answers
 * @param lessonId The lesson ID for attribution
 * @returns Array of extracted collocations
 */
export function extractCollocationsFromExercises(
  exercises: Array<{
    id: string;
    answer: string;
    itemIds: string[];
    type?: string;
  }>,
  lessonId: string
): Collocation[] {
  const collocations: Collocation[] = [];
  const seen = new Set<string>();
  
  for (const exercise of exercises) {
    const answer = exercise.answer;
    const words = answer.split(/\s+/);
    
    // Only consider multi-word answers
    if (words.length < 2 || words.length > 4) {
      continue;
    }
    
    // Skip if we've seen this phrase
    const normalized = normalizeArabic(answer);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    
    // Detect the type
    const type = detectCollocationType(answer);
    if (!type) {
      continue;
    }
    
    // Create collocation entry
    const collocation: Collocation = {
      id: `coll-${lessonId}-${collocations.length + 1}`,
      type,
      arabic: answer,
      english: '', // Would need translation lookup
      wordIds: exercise.itemIds,
      lessonId,
    };
    
    collocations.push(collocation);
  }
  
  return collocations;
}

// ============================================================================
// Exercise Generation
// ============================================================================

/**
 * Generate a "complete the collocation" exercise
 * Shows one part, learner provides the other
 * 
 * @param collocation The collocation to generate an exercise for
 * @param hideFirst If true, hide the first word; otherwise hide the second
 * @returns A collocation exercise
 */
export function generateCompleteCollocationExercise(
  collocation: Collocation,
  hideFirst: boolean = false
): CollocationExercise {
  const words = collocation.arabic.split(/\s+/);
  
  if (words.length < 2) {
    // Fallback for single-word (shouldn't happen)
    return {
      id: `ex-${collocation.id}-complete`,
      type: 'complete_collocation',
      collocationId: collocation.id,
      prompt: '___',
      promptEn: collocation.english,
      answer: collocation.arabic,
      itemIds: collocation.wordIds,
    };
  }
  
  let prompt: string;
  let answer: string;
  
  if (hideFirst) {
    // Hide the first word
    prompt = `___ ${words.slice(1).join(' ')}`;
    answer = words[0];
  } else {
    // Hide the last word(s) - more common
    prompt = `${words[0]} ___`;
    answer = words.slice(1).join(' ');
  }
  
  return {
    id: `ex-${collocation.id}-complete-${hideFirst ? 'first' : 'last'}`,
    type: 'complete_collocation',
    collocationId: collocation.id,
    prompt,
    promptEn: collocation.english,
    answer,
    itemIds: collocation.wordIds,
  };
}

/**
 * Generate a "translate the collocation" exercise
 * Given English, produce the Arabic phrase
 * 
 * @param collocation The collocation to generate an exercise for
 * @returns A collocation exercise
 */
export function generateTranslateCollocationExercise(
  collocation: Collocation
): CollocationExercise {
  return {
    id: `ex-${collocation.id}-translate`,
    type: 'translate_collocation',
    collocationId: collocation.id,
    prompt: collocation.english,
    answer: collocation.arabic,
    itemIds: collocation.wordIds,
  };
}

/**
 * Generate a "choose the collocation" exercise
 * Multiple choice: which word completes this phrase?
 * 
 * @param collocation The target collocation
 * @param distractorWords Other words to use as wrong options
 * @param hideFirst If true, hide and test the first word
 * @returns A collocation exercise with options
 */
export function generateChooseCollocationExercise(
  collocation: Collocation,
  distractorWords: string[],
  hideFirst: boolean = false
): CollocationExercise {
  const words = collocation.arabic.split(/\s+/);
  
  if (words.length < 2) {
    throw new Error('Collocation must have at least 2 words');
  }
  
  let prompt: string;
  let answer: string;
  
  if (hideFirst) {
    prompt = `___ ${words.slice(1).join(' ')}`;
    answer = words[0];
  } else {
    prompt = `${words[0]} ___`;
    answer = words.slice(1).join(' ');
  }
  
  // Create options: correct answer + distractors (shuffled)
  const allOptions = [answer, ...distractorWords.slice(0, 3)];
  const shuffledOptions = fisherYatesShuffle(allOptions);
  
  return {
    id: `ex-${collocation.id}-choose-${hideFirst ? 'first' : 'last'}`,
    type: 'choose_collocation',
    collocationId: collocation.id,
    prompt,
    promptEn: collocation.english,
    answer,
    itemIds: collocation.wordIds,
    options: shuffledOptions,
  };
}

/**
 * Generate a set of exercises for a collocation
 * Creates multiple exercise types for varied practice
 * 
 * @param collocation The collocation to practice
 * @param distractorWords Words to use as wrong options in MCQ
 * @returns Array of collocation exercises
 */
export function generateCollocationExercises(
  collocation: Collocation,
  distractorWords: string[] = []
): CollocationExercise[] {
  const exercises: CollocationExercise[] = [];
  
  // 1. Complete collocation (hide last part) - production
  exercises.push(generateCompleteCollocationExercise(collocation, false));
  
  // 2. Complete collocation (hide first part) - production
  exercises.push(generateCompleteCollocationExercise(collocation, true));
  
  // 3. Translate the collocation - production
  if (collocation.english) {
    exercises.push(generateTranslateCollocationExercise(collocation));
  }
  
  // 4. Choose collocation (MCQ) - recognition
  if (distractorWords.length >= 3) {
    exercises.push(generateChooseCollocationExercise(collocation, distractorWords, false));
  }
  
  return exercises;
}

// ============================================================================
// Answer Checking
// ============================================================================

/**
 * Check if a user's answer matches the expected collocation answer
 * Uses flexible matching that handles tashkeel variations
 * 
 * @param userAnswer The user's input
 * @param expectedAnswer The correct answer
 * @returns Object with isCorrect and optional feedback
 */
export function checkCollocationAnswer(
  userAnswer: string,
  expectedAnswer: string
): { isCorrect: boolean; feedback?: string } {
  const isMatch = compareAnswers(userAnswer, expectedAnswer);
  
  if (isMatch) {
    return { isCorrect: true };
  }
  
  // Provide specific feedback for common errors
  const userNormalized = normalizeArabic(userAnswer);
  const expectedNormalized = normalizeArabic(expectedAnswer);
  
  // Check word order (swap detection)
  const userWords = userNormalized.split(/\s+/);
  const expectedWords = expectedNormalized.split(/\s+/);
  
  if (userWords.length === expectedWords.length) {
    const userSorted = [...userWords].sort().join(' ');
    const expectedSorted = [...expectedWords].sort().join(' ');
    
    if (userSorted === expectedSorted) {
      return {
        isCorrect: false,
        feedback: 'Word order is incorrect. Try rearranging.',
      };
    }
  }
  
  // Check for partial match (got some words right)
  const matchingWords = userWords.filter(w => expectedWords.includes(w));
  if (matchingWords.length > 0 && matchingWords.length < expectedWords.length) {
    return {
      isCorrect: false,
      feedback: `You got ${matchingWords.length} of ${expectedWords.length} words correct.`,
    };
  }
  
  return { isCorrect: false };
}

// ============================================================================
// Mastery Tracking
// ============================================================================

/**
 * Default mastery state for a new collocation
 */
export const DEFAULT_COLLOCATION_MASTERY: CollocationMastery = {
  collocationId: '',
  strength: 0,
  lastPracticed: null,
  timesCorrect: 0,
  timesIncorrect: 0,
  canProduce: false,
};

/**
 * Calculate new collocation strength after an answer
 * 
 * @param currentStrength Current strength (0-100)
 * @param isCorrect Whether the answer was correct
 * @returns New strength value
 */
export function calculateCollocationStrength(
  currentStrength: number,
  isCorrect: boolean
): number {
  const delta = isCorrect
    ? COLLOCATION_STRENGTH_CHANGES.correct
    : COLLOCATION_STRENGTH_CHANGES.incorrect;
  
  return Math.max(0, Math.min(100, currentStrength + delta));
}

/**
 * Update collocation mastery after an exercise
 * 
 * @param mastery Current mastery state
 * @param isCorrect Whether the answer was correct
 * @param wasProduction Whether this was a production exercise (not MCQ)
 * @returns Updated mastery state
 */
export function updateCollocationMastery(
  mastery: CollocationMastery,
  isCorrect: boolean,
  wasProduction: boolean
): CollocationMastery {
  const newStrength = calculateCollocationStrength(mastery.strength, isCorrect);
  
  // Mark as producible if they correctly produced it (not just recognized)
  const canProduce = wasProduction && isCorrect
    ? true
    : mastery.canProduce;
  
  return {
    ...mastery,
    strength: newStrength,
    lastPracticed: new Date().toISOString(),
    timesCorrect: mastery.timesCorrect + (isCorrect ? 1 : 0),
    timesIncorrect: mastery.timesIncorrect + (isCorrect ? 0 : 1),
    canProduce,
  };
}

// ============================================================================
// Collocation Selection
// ============================================================================

/**
 * Select collocations for practice based on word mastery
 * Only includes collocations where all component words are somewhat known
 * 
 * @param collocations Available collocations
 * @param wordStrengths Map of word ID to strength
 * @param limit Maximum collocations to return
 * @returns Collocations suitable for practice
 */
export function selectCollocationsForPractice(
  collocations: Collocation[],
  wordStrengths: Record<string, number>,
  limit: number = 10
): Collocation[] {
  const suitable: Collocation[] = [];
  
  for (const collocation of collocations) {
    // Check if all words are at least somewhat known
    const allWordsKnown = collocation.wordIds.every(
      wordId => (wordStrengths[wordId] ?? 0) >= MIN_WORD_STRENGTH_FOR_COLLOCATION
    );
    
    if (allWordsKnown) {
      suitable.push(collocation);
    }
  }
  
  // Shuffle and limit
  const shuffled = fisherYatesShuffle(suitable);
  return shuffled.slice(0, limit);
}

/**
 * Get collocations that share a word with the given word ID
 * Useful for showing related phrases when learning a word
 * 
 * @param wordId The word to find collocations for
 * @param collocations Available collocations
 * @returns Collocations containing this word
 */
export function getCollocationsForWord(
  wordId: string,
  collocations: Collocation[]
): Collocation[] {
  return collocations.filter(c => c.wordIds.includes(wordId));
}

/**
 * Get collocations for a lesson
 * 
 * @param lessonId The lesson ID
 * @param collocations Available collocations
 * @returns Collocations from this lesson
 */
export function getCollocationsForLesson(
  lessonId: string,
  collocations: Collocation[]
): Collocation[] {
  return collocations.filter(c => c.lessonId === lessonId);
}

// ============================================================================
// Pattern Information
// ============================================================================

/**
 * Get human-readable description of a collocation type
 * 
 * @param type The collocation type
 * @returns Description in English
 */
export function getCollocationTypeDescription(type: CollocationType): string {
  switch (type) {
    case 'demonstrative_noun':
      return 'Demonstrative + Noun (e.g., "this book")';
    case 'noun_adjective':
      return 'Noun + Adjective (e.g., "big house")';
    case 'verb_object':
      return 'Verb + Object (e.g., "read the book")';
    case 'preposition_noun':
      return 'Preposition + Noun (e.g., "in the house")';
    case 'possessive':
      return 'Possessive (e.g., "my book")';
    case 'idiomatic':
      return 'Idiomatic Expression';
    case 'question_answer':
      return 'Question Pattern';
    default:
      return 'Word Combination';
  }
}

/**
 * Get Arabic description of a collocation type
 * 
 * @param type The collocation type
 * @returns Description in Arabic
 */
export function getCollocationTypeDescriptionArabic(type: CollocationType): string {
  switch (type) {
    case 'demonstrative_noun':
      return 'اسم الإشارة + اسم';
    case 'noun_adjective':
      return 'اسم + صفة';
    case 'verb_object':
      return 'فعل + مفعول به';
    case 'preposition_noun':
      return 'حرف جر + اسم';
    case 'possessive':
      return 'إضافة';
    case 'idiomatic':
      return 'تعبير اصطلاحي';
    case 'question_answer':
      return 'أداة استفهام';
    default:
      return 'تركيب';
  }
}
