/**
 * Progress tracking types for the Madina Interactive app.
 * Designed for localStorage now, easily adaptable to Convex later.
 */

import type { FIReState } from './fire';

/**
 * SM-2 Spaced Repetition state for a word
 * @deprecated Use FIReState instead - kept for backward compatibility and migration
 */
export interface SM2Data {
  /** Easiness factor - determines how quickly intervals grow (minimum 1.3) */
  easeFactor: number;
  /** Current interval in days until next review */
  interval: number;
  /** Number of consecutive correct responses */
  repetitions: number;
  /** Timestamp of when the item is next due for review */
  nextReviewDate: number;
}

/**
 * Encounter tracking for Nation's 10-12 encounter principle
 */
export interface EncounterData {
  /** Total number of times this item has been encountered */
  total: number;
  /** Breakdown by encounter type */
  byType: {
    exercise: number;
    flashcard: number;
    reading: number;
    listening: number;
  };
  /** History of recent encounters (capped at 20 for storage efficiency) */
  history: Array<{
    date: number;
    type: 'exercise' | 'flashcard' | 'reading' | 'listening';
  }>;
}

/**
 * Confidence rating for metacognition tracking
 * Based on Make It Stick research - helps combat "illusion of knowing"
 */
export type ConfidenceLevel = 1 | 2 | 3;

/**
 * Confidence rating record for calibration analysis
 */
export interface ConfidenceRecord {
  rating: ConfidenceLevel;
  wasCorrect: boolean;
  timestamp: number;
}

/**
 * Generation attempt tracking
 * Based on "generation effect" research - answers produced without hints are remembered better
 */
export interface GenerationData {
  /** Times answered correctly without hints/options shown */
  generatedCorrectly: number;
  /** Times attempted generation (regardless of success) */
  totalAttempts: number;
  /** Average time to answer (ms) - for fluency tracking */
  averageResponseTime?: number;
}

/**
 * Arabic error classification for targeted feedback
 * Based on deliberate practice research - specific feedback improves learning
 */
export type ArabicErrorType =
  | 'tashkeel_missing'     // Missing diacritics entirely
  | 'tashkeel_wrong'       // Wrong diacritics used
  | 'letter_confusion'     // Common letter confusions (ع/ا, ه/ة, etc.)
  | 'word_order'           // Incorrect sentence structure
  | 'vocabulary_unknown'   // Completely wrong word
  | 'partial_match'        // Close but not exact (minor errors)
  | 'spelling_error'       // Misspelling in Arabic
  | 'typo';                // Likely keyboard slip

/**
 * Error pattern tracking for identifying weaknesses
 */
export interface ErrorPattern {
  type: ArabicErrorType;
  count: number;
  lastOccurred: number;
  /** Examples of this error type for review */
  examples: Array<{
    expected: string;
    actual: string;
    exerciseId: string;
  }>;
}

/**
 * Difficulty levels for progressive learning
 * Based on learning science research:
 * - Recognition is easier than recall
 * - Production is harder than comprehension
 */
export type DifficultyLevel = 'recognition' | 'cued_recall' | 'free_recall';

/**
 * Directional strength tracking for a word
 * Words may be strong in recognition but weak in production
 * Added in v4
 */
export interface DirectionalStrengthData {
  /** Strength for recognition (seeing Arabic → understanding) 0-100 */
  recognitionStrength: number;
  /** Strength for production (producing Arabic from meaning) 0-100 */
  productionStrength: number;
  /** Current difficulty level for recognition exercises */
  recognitionLevel: DifficultyLevel;
  /** Current difficulty level for production exercises */
  productionLevel: DifficultyLevel;
  /** Last recognition practice date (ISO string) */
  lastRecognitionPractice: string | null;
  /** Last production practice date (ISO string) */
  lastProductionPractice: string | null;
}

// Word-level mastery tracking
export interface WordMastery {
  // Legacy fields (kept for backward compatibility)
  strength: number;           // 0-100
  lastPracticed: string;      // ISO date
  timesCorrect: number;
  timesIncorrect: number;
  // Challenge tracking
  challengesPassed: number;   // Count of successful challenge completions
  lastChallengeDate: string | null;  // ISO date of last challenge pass

  // SM-2 Spaced Repetition fields (deprecated in v3, kept for migration)
  sm2?: SM2Data;

  // FIRe Spaced Repetition fields (added in v3)
  fire?: FIReState;

  // Encounter tracking fields (added in v2)
  encounters?: EncounterData;

  // Metacognition tracking (Phase 1 - Make It Stick)
  confidence?: {
    history: ConfidenceRecord[];  // Last 10 ratings
    calibrationScore?: number;    // How accurate their confidence is (0-1)
  };

  // Generation tracking (Phase 1 - generation effect)
  generation?: GenerationData;

  // Error pattern tracking (Phase 2 - deliberate practice feedback)
  errorPatterns?: ErrorPattern[];

  // Directional strength tracking (Phase 1.2 - Progressive Difficulty, added in v4)
  directionalStrength?: DirectionalStrengthData;
}

// Exercise-level result tracking
export interface ExerciseRecord {
  attempts: number;
  correctAttempts: number;
  lastAttempt: string;        // ISO date
  lastCorrect: boolean;
}

// Lesson-level progress tracking
export interface LessonProgress {
  started: boolean;
  exercisesAttempted: string[];    // exercise IDs attempted
  correctExercises: string[];      // exercise IDs answered correctly
  bestAccuracy: number;            // 0-100, highest accuracy achieved
  lastPracticed: string;           // ISO date
}

// Aggregate statistics
export interface ProgressStats {
  totalExercisesAttempted: number;
  totalCorrect: number;
  
  // Answer streak (resets on wrong answer)
  currentAnswerStreak: number;
  bestAnswerStreak: number;
  
  // Practice streak (resets if miss a day)
  currentPracticeStreak: number;
  bestPracticeStreak: number;
  lastPracticeDate: string | null;  // YYYY-MM-DD local timezone
}

// Main progress data structure stored in localStorage
export interface ProgressData {
  version: 1 | 2 | 3 | 4;  // 4 = Directional strength (progressive difficulty)
  exerciseResults: Record<string, ExerciseRecord>;
  wordMastery: Record<string, WordMastery>;
  lessonProgress: Record<string, LessonProgress>;
  stats: ProgressStats;
}

// Current data version
export const CURRENT_PROGRESS_VERSION = 4;

// Target encounters for vocabulary acquisition (Paul Nation's research)
export const TARGET_ENCOUNTERS = 12;

// Mastery levels for UI display
export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered' | 'decaying';

// Thresholds for mastery calculations
export const MASTERY_THRESHOLDS = {
  LEARNED: 80,           // Word considered "learned" when strength >= 80
  LESSON_COMPLETE: 90,   // Lesson "completed" when accuracy >= 90%
  FAMILIAR: 40,          // Word is "familiar" when strength >= 40
  MASTERED: 80,          // Word is "mastered" when strength >= 80
  DECAY_DAYS: 3,         // Days before strength starts decaying
  // Challenge thresholds
  CHALLENGE_THRESHOLD: 80,      // Strength required to trigger challenge mode
  CHALLENGE_DECAY_DAYS: 5,      // Proven mastery decays slower
} as const;

// Book progress summary for UI
export interface BookProgress {
  bookNumber: number;
  lessonsCompleted: number;
  totalLessons: number;
  wordsLearned: number;
  wordsInProgress: number;
  totalWords: number;
  masteryPercent: number;
}

// Overall stats summary for UI
export interface OverallStats {
  wordsLearned: number;
  wordsInProgress: number;
  totalWords: number;
  grammarPoints: number;
  totalGrammar: number;
  lessonsCompleted: number;
  totalLessons: number;
  accuracy: number;
  currentAnswerStreak: number;
  bestAnswerStreak: number;
  currentPracticeStreak: number;
  bestPracticeStreak: number;
  lastPracticeDate: string | null;
}

// Content stats from JSON files (static)
export interface BookContentStats {
  bookNumber: number;
  lessonCount: number;
  wordCount: number;
  grammarCount: number;
  exerciseCount: number;
}

export interface TotalContentStats {
  lessonCount: number;
  wordCount: number;
  grammarCount: number;
  exerciseCount: number;
}
