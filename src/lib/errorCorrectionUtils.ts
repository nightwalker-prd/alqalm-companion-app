/**
 * Error Correction Utilities
 * 
 * Functions for:
 * - Generating error correction exercises from correct sentences
 * - Checking answers (both identification and correction)
 * - Providing feedback based on error type
 */

import type { ErrorCorrectionExercise, ErrorType } from '../types/exercise';
import { normalizeArabic, compareAnswers, removeTashkeel } from './arabic';
import { fisherYatesShuffle } from './interleave';

// ============================================================================
// Constants
// ============================================================================

/**
 * Common gender pairs for generating gender errors
 */
export const GENDER_PAIRS: Record<string, string> = {
  // Demonstratives
  'هَذَا': 'هَذِهِ',
  'هَذِهِ': 'هَذَا',
  'ذَلِكَ': 'تِلْكَ',
  'تِلْكَ': 'ذَلِكَ',
  // Pronouns
  'هُوَ': 'هِيَ',
  'هِيَ': 'هُوَ',
  'أَنْتَ': 'أَنْتِ',
  'أَنْتِ': 'أَنْتَ',
};

/**
 * Common definiteness pairs
 */
export const DEFINITENESS_PATTERNS = {
  addAl: (word: string) => `ال${removeTashkeel(word)}`,
  removeAl: (word: string) => word.replace(/^ال/, ''),
};

/**
 * Error type descriptions for feedback
 */
export const ERROR_TYPE_DESCRIPTIONS: Record<ErrorType, { en: string; ar: string }> = {
  gender: { 
    en: 'Gender agreement error', 
    ar: 'خطأ في التذكير والتأنيث' 
  },
  number: { 
    en: 'Number agreement error', 
    ar: 'خطأ في العدد' 
  },
  case: { 
    en: 'Case ending error', 
    ar: 'خطأ في الإعراب' 
  },
  definiteness: { 
    en: 'Definite/indefinite error', 
    ar: 'خطأ في التعريف والتنكير' 
  },
  word_order: { 
    en: 'Word order error', 
    ar: 'خطأ في ترتيب الكلمات' 
  },
  vocabulary: { 
    en: 'Wrong word used', 
    ar: 'كلمة خاطئة' 
  },
  tashkeel: { 
    en: 'Vowel marks error', 
    ar: 'خطأ في التشكيل' 
  },
  spelling: { 
    en: 'Spelling error', 
    ar: 'خطأ إملائي' 
  },
};

// ============================================================================
// Error Generation
// ============================================================================

/**
 * Generate a gender error by swapping a gendered word
 */
export function generateGenderError(sentence: string): {
  errorSentence: string;
  errorWord: string;
  correctWord: string;
} | null {
  const words = sentence.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const normalizedWord = normalizeArabic(word);
    
    // Check if this word has a gender pair
    for (const [original, swapped] of Object.entries(GENDER_PAIRS)) {
      if (normalizeArabic(original) === normalizedWord) {
        const errorWords = [...words];
        errorWords[i] = swapped;
        return {
          errorSentence: errorWords.join(' '),
          errorWord: swapped,
          correctWord: word,
        };
      }
    }
  }
  
  return null;
}

/**
 * Generate a definiteness error by adding/removing ال
 */
export function generateDefinitenessError(sentence: string): {
  errorSentence: string;
  errorWord: string;
  correctWord: string;
} | null {
  const words = sentence.split(/\s+/);
  
  // Find a word that can have definiteness changed
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const stripped = removeTashkeel(word);
    
    if (stripped.startsWith('ال') && stripped.length > 3) {
      // Remove ال
      const withoutAl = word.replace(/^ال/, '');
      const errorWords = [...words];
      errorWords[i] = withoutAl;
      return {
        errorSentence: errorWords.join(' '),
        errorWord: withoutAl,
        correctWord: word,
      };
    } else if (!stripped.startsWith('ال') && stripped.length > 2) {
      // Skip demonstratives and particles
      const skipWords = ['هذا', 'هذه', 'ذلك', 'تلك', 'من', 'في', 'الى', 'على', 'هو', 'هي'];
      if (skipWords.includes(stripped)) continue;
      
      // Add ال
      const withAl = `ال${word}`;
      const errorWords = [...words];
      errorWords[i] = withAl;
      return {
        errorSentence: errorWords.join(' '),
        errorWord: withAl,
        correctWord: word,
      };
    }
  }
  
  return null;
}

/**
 * Generate a word order error by swapping adjacent words
 */
export function generateWordOrderError(sentence: string): {
  errorSentence: string;
  errorWord: string;
  correctWord: string;
} | null {
  const words = sentence.split(/\s+/);
  
  if (words.length < 2) return null;
  
  // Swap two adjacent words (not the first one to avoid demonstrative issues)
  const swapIndex = words.length > 2 ? 1 : 0;
  const errorWords = [...words];
  [errorWords[swapIndex], errorWords[swapIndex + 1]] = 
    [errorWords[swapIndex + 1], errorWords[swapIndex]];
  
  return {
    errorSentence: errorWords.join(' '),
    errorWord: `${errorWords[swapIndex]} ${errorWords[swapIndex + 1]}`,
    correctWord: `${words[swapIndex]} ${words[swapIndex + 1]}`,
  };
}

/**
 * Generate an error correction exercise from a correct sentence
 */
export function generateErrorCorrectionExercise(
  correctSentence: string,
  lessonId: string,
  englishHint?: string,
  itemIds: string[] = [],
  preferredErrorType?: ErrorType
): ErrorCorrectionExercise | null {
  // Try different error types
  const errorGenerators: Array<{
    type: ErrorType;
    generator: (s: string) => ReturnType<typeof generateGenderError>;
  }> = [
    { type: 'gender', generator: generateGenderError },
    { type: 'definiteness', generator: generateDefinitenessError },
    { type: 'word_order', generator: generateWordOrderError },
  ];
  
  // Shuffle unless preferred type specified
  const orderedGenerators = preferredErrorType
    ? errorGenerators.sort((a, b) => 
        a.type === preferredErrorType ? -1 : b.type === preferredErrorType ? 1 : 0
      )
    : fisherYatesShuffle(errorGenerators);
  
  for (const { type, generator } of orderedGenerators) {
    const result = generator(correctSentence);
    if (result) {
      return {
        id: `err-${lessonId}-${Date.now()}`,
        type: 'error-correction',
        sentenceWithError: result.errorSentence,
        correctSentence,
        errorWord: result.errorWord,
        correctWord: result.correctWord,
        errorType: type,
        englishHint,
        itemIds,
        explanation: ERROR_TYPE_DESCRIPTIONS[type].en,
      };
    }
  }
  
  return null;
}

// ============================================================================
// Answer Checking
// ============================================================================

/**
 * Result of checking an error correction answer
 */
export interface ErrorCorrectionResult {
  /** Whether the overall answer is correct */
  isCorrect: boolean;
  /** Whether the error was correctly identified */
  identifiedError: boolean;
  /** Whether the correction is correct */
  correctedProperly: boolean;
  /** Specific feedback message */
  feedback: string;
  /** The error type for additional context */
  errorType: ErrorType;
}

/**
 * Check if the user correctly identified and fixed the error
 * 
 * @param userCorrectedSentence The user's corrected sentence
 * @param exercise The error correction exercise
 * @returns Detailed result with feedback
 */
export function checkErrorCorrection(
  userCorrectedSentence: string,
  exercise: ErrorCorrectionExercise
): ErrorCorrectionResult {
  const { correctSentence, errorWord, correctWord, errorType } = exercise;
  
  // Check if the full sentence matches
  const isCorrect = compareAnswers(userCorrectedSentence, correctSentence);
  
  if (isCorrect) {
    return {
      isCorrect: true,
      identifiedError: true,
      correctedProperly: true,
      feedback: 'Correct! You found and fixed the error.',
      errorType,
    };
  }
  
  // Check if they at least identified the error (changed the right word)
  const userHasErrorWord = normalizeArabic(userCorrectedSentence).includes(normalizeArabic(errorWord));
  const userHasCorrectWord = normalizeArabic(userCorrectedSentence).includes(normalizeArabic(correctWord));
  
  // They kept the error word - didn't identify the error
  if (userHasErrorWord && !userHasCorrectWord) {
    return {
      isCorrect: false,
      identifiedError: false,
      correctedProperly: false,
      feedback: `The error is in "${errorWord}". ${ERROR_TYPE_DESCRIPTIONS[errorType].en}.`,
      errorType,
    };
  }
  
  // They found the error but didn't correct it properly
  if (!userHasErrorWord && !userHasCorrectWord) {
    return {
      isCorrect: false,
      identifiedError: true,
      correctedProperly: false,
      feedback: `Good - you found the error! But the correction should be "${correctWord}".`,
      errorType,
    };
  }
  
  // They have the correct word but sentence still doesn't match (other changes)
  if (userHasCorrectWord) {
    return {
      isCorrect: false,
      identifiedError: true,
      correctedProperly: true,
      feedback: 'You fixed the error, but something else changed. Check the rest of the sentence.',
      errorType,
    };
  }
  
  // General incorrect
  return {
    isCorrect: false,
    identifiedError: false,
    correctedProperly: false,
    feedback: `The correct sentence is: ${correctSentence}`,
    errorType,
  };
}

/**
 * Check if user correctly identified just the error word (not full correction)
 * Used for simpler mode where user just clicks/highlights the error
 */
export function checkErrorIdentification(
  userIdentifiedWord: string,
  exercise: ErrorCorrectionExercise
): boolean {
  return compareAnswers(userIdentifiedWord, exercise.errorWord);
}

// ============================================================================
// Exercise Selection
// ============================================================================

/**
 * Generate error correction exercises from existing sentences
 * Takes correct sentences and creates exercises with intentional errors
 */
export function generateErrorCorrectionExercises(
  sentences: Array<{
    arabic: string;
    english?: string;
    lessonId: string;
    itemIds?: string[];
  }>,
  limit: number = 5
): ErrorCorrectionExercise[] {
  const exercises: ErrorCorrectionExercise[] = [];
  
  // Shuffle sentences
  const shuffled = fisherYatesShuffle([...sentences]);
  
  for (const sentence of shuffled) {
    if (exercises.length >= limit) break;
    
    const exercise = generateErrorCorrectionExercise(
      sentence.arabic,
      sentence.lessonId,
      sentence.english,
      sentence.itemIds
    );
    
    if (exercise) {
      exercises.push(exercise);
    }
  }
  
  return exercises;
}

/**
 * Get error type label in user's preferred language
 */
export function getErrorTypeLabel(errorType: ErrorType, language: 'en' | 'ar' = 'en'): string {
  return ERROR_TYPE_DESCRIPTIONS[errorType][language];
}
