/**
 * Collocation Types for Phrase Learning
 * 
 * Based on Paul Nation's research on vocabulary acquisition:
 * - Words are best learned in meaningful combinations
 * - Collocations (word pairs that frequently occur together) improve retention
 * - Learning phrases > learning isolated words
 * 
 * Types of collocations in Arabic:
 * - Demonstrative + Noun: هَذَا كِتَابٌ (this book)
 * - Noun + Adjective: بَيْتٌ كَبِيرٌ (big house)
 * - Verb + Object: قَرَأَ الكِتَابَ (read the book)
 * - Preposition + Noun: فِي البَيْتِ (in the house)
 * - Idiomatic phrases: إِنْ شَاءَ اللهُ (God willing)
 */

/**
 * Type of collocation pattern
 */
export type CollocationType =
  | 'demonstrative_noun'  // هَذَا/ذَلِكَ + noun
  | 'noun_adjective'      // noun + adjective
  | 'verb_object'         // verb + object
  | 'preposition_noun'    // preposition + noun
  | 'possessive'          // noun + possessive pronoun
  | 'idiomatic'           // fixed expressions
  | 'question_answer';    // question word + structure

/**
 * A collocation (word combination) definition
 */
export interface Collocation {
  /** Unique identifier */
  id: string;
  
  /** Type of collocation pattern */
  type: CollocationType;
  
  /** The Arabic phrase */
  arabic: string;
  
  /** English translation */
  english: string;
  
  /** Word IDs that make up this collocation */
  wordIds: string[];
  
  /** Lesson where this collocation is introduced */
  lessonId: string;
  
  /** Optional: The grammatical pattern being demonstrated */
  pattern?: string;
  
  /** Optional: Notes about usage or meaning */
  notes?: string;
  
  /** Optional: Alternative acceptable forms */
  alternatives?: string[];
}

/**
 * Exercise types specific to collocation learning
 */
export type CollocationExerciseType =
  | 'complete_collocation'   // Given one part, complete the phrase
  | 'match_collocation'      // Match parts of collocations
  | 'translate_collocation'  // Translate the whole phrase
  | 'fill_collocation'       // Fill in the missing word in context
  | 'choose_collocation';    // Multiple choice: which word goes with X?

/**
 * A collocation exercise
 */
export interface CollocationExercise {
  id: string;
  type: CollocationExerciseType;
  collocationId: string;
  
  /** The prompt shown to the user */
  prompt: string;
  
  /** Optional English hint */
  promptEn?: string;
  
  /** The correct answer */
  answer: string;
  
  /** Word IDs being tested */
  itemIds: string[];
  
  /** For multiple choice: distractor options */
  options?: string[];
}

/**
 * Collocation mastery tracking
 * Extends word mastery to track phrase-level learning
 */
export interface CollocationMastery {
  /** Collocation ID */
  collocationId: string;
  
  /** Overall strength (0-100) */
  strength: number;
  
  /** Last practiced date */
  lastPracticed: string | null;
  
  /** Times answered correctly */
  timesCorrect: number;
  
  /** Times answered incorrectly */
  timesIncorrect: number;
  
  /** Whether the learner can produce this collocation from memory */
  canProduce: boolean;
}

/**
 * Common Arabic collocations organized by type
 * These are high-frequency patterns from Madina Arabic
 */
export interface CollocationPattern {
  type: CollocationType;
  description: string;
  descriptionAr: string;
  examples: string[];
}
