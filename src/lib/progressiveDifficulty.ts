/**
 * Progressive Difficulty System
 * 
 * Based on learning science research:
 * - Recognition is easier than recall (Nation's vocabulary research)
 * - Production is harder than comprehension
 * - Learners should progress from easier → harder as they gain strength
 * 
 * Difficulty levels:
 * 1. RECOGNITION - Multiple choice / word bank (easiest)
 * 2. CUED_RECALL - Fill in blank with hint, partial cues
 * 3. FREE_RECALL - Type answer with no hints (hardest)
 * 
 * Words progress through levels based on their strength at each level.
 */

import type { ExerciseType } from '../types/exercise';
import type { 
  DifficultyLevel, 
  DirectionalStrengthData 
} from '../types/progress';

// Re-export types for convenience
export type { DifficultyLevel, DirectionalStrengthData };

// Use DirectionalStrengthData as DirectionalStrength for internal consistency
export type DirectionalStrength = DirectionalStrengthData;

/**
 * Result of determining which exercise type to use.
 */
export interface ExerciseTypeSelection {
  /** The recommended exercise type */
  exerciseType: ExerciseType;
  /** The difficulty level this corresponds to */
  difficultyLevel: DifficultyLevel;
  /** Whether this is a recognition or production exercise */
  direction: 'recognition' | 'production';
  /** Whether to show hints/options */
  showHints: boolean;
  /** Optional word bank for recognition exercises */
  useWordBank: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Thresholds for progressing between difficulty levels.
 */
export const DIFFICULTY_THRESHOLDS = {
  /** Strength needed to progress from recognition → cued recall */
  RECOGNITION_TO_CUED: 40,
  /** Strength needed to progress from cued recall → free recall */
  CUED_TO_FREE: 70,
  /** If strength drops below this, regress to previous level */
  REGRESSION_BUFFER: 10,
} as const;

/**
 * Strength changes for each difficulty level.
 * Harder levels give more credit for correct, less penalty for wrong.
 */
export const STRENGTH_CHANGES = {
  recognition: {
    correct: 5,   // Easier → less credit
    incorrect: -10,
  },
  cued_recall: {
    correct: 10,  // Medium credit
    incorrect: -15,
  },
  free_recall: {
    correct: 15,  // Harder → more credit
    incorrect: -10,  // Less penalty (it's hard!)
  },
} as const;

/**
 * Mapping of exercise types to their direction (recognition vs production).
 */
export const EXERCISE_DIRECTION_MAP: Record<ExerciseType, 'recognition' | 'production'> = {
  'word-to-meaning': 'recognition',    // See Arabic → choose English meaning
  'meaning-to-word': 'production',     // See English → produce Arabic
  'fill-blank': 'production',          // Produce Arabic to fill blank
  'translate-to-arabic': 'production', // Produce Arabic from English
  'construct-sentence': 'production',  // Produce sentence structure
  'grammar-apply': 'production',       // Apply grammar rules (production)
  'error-correction': 'recognition',   // Identify and fix errors (recognition-focused)
  'multi-cloze': 'production',         // Fill multiple blanks (production)
  'semantic-field': 'recognition',     // Categorize words (recognition)
  'sentence-unscramble': 'production', // Arrange words into correct order (production)
};

/**
 * Default directional strength for new words.
 */
export const DEFAULT_DIRECTIONAL_STRENGTH: DirectionalStrength = {
  recognitionStrength: 0,
  productionStrength: 0,
  recognitionLevel: 'recognition',
  productionLevel: 'recognition',
  lastRecognitionPractice: null,
  lastProductionPractice: null,
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get the difficulty level based on strength.
 * 
 * @param strength Current strength (0-100)
 * @returns The appropriate difficulty level
 */
export function getDifficultyLevel(strength: number): DifficultyLevel {
  if (strength >= DIFFICULTY_THRESHOLDS.CUED_TO_FREE) {
    return 'free_recall';
  }
  if (strength >= DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED) {
    return 'cued_recall';
  }
  return 'recognition';
}

/**
 * Check if a word should regress to a lower difficulty level.
 * Uses a buffer to prevent oscillating between levels.
 * 
 * @param currentLevel Current difficulty level
 * @param strength Current strength (0-100)
 * @returns The level after checking for regression
 */
export function checkRegression(
  currentLevel: DifficultyLevel,
  strength: number
): DifficultyLevel {
  const buffer = DIFFICULTY_THRESHOLDS.REGRESSION_BUFFER;
  
  if (currentLevel === 'free_recall') {
    // Regress if strength drops significantly below threshold
    if (strength < DIFFICULTY_THRESHOLDS.CUED_TO_FREE - buffer) {
      return 'cued_recall';
    }
  }
  
  if (currentLevel === 'cued_recall') {
    // Regress if strength drops significantly below threshold
    if (strength < DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED - buffer) {
      return 'recognition';
    }
  }
  
  return currentLevel;
}

/**
 * Calculate the new strength after an answer.
 * Strength change varies based on difficulty level.
 * 
 * @param currentStrength Current strength (0-100)
 * @param isCorrect Whether the answer was correct
 * @param level The difficulty level of the exercise
 * @returns New strength (clamped to 0-100)
 */
export function calculateDirectionalStrength(
  currentStrength: number,
  isCorrect: boolean,
  level: DifficultyLevel
): number {
  const changes = STRENGTH_CHANGES[level];
  const delta = isCorrect ? changes.correct : changes.incorrect;
  const newStrength = currentStrength + delta;
  
  return Math.max(0, Math.min(100, newStrength));
}

/**
 * Get the direction (recognition vs production) for an exercise type.
 * 
 * @param exerciseType The exercise type
 * @returns 'recognition' or 'production'
 */
export function getExerciseDirection(exerciseType: ExerciseType): 'recognition' | 'production' {
  return EXERCISE_DIRECTION_MAP[exerciseType];
}

/**
 * Determine whether to prioritize recognition or production practice.
 * 
 * Priority logic:
 * 1. If recognition is weak (< 40), focus on recognition first
 * 2. If production is significantly weaker than recognition, focus on production
 * 3. Otherwise, alternate or choose based on last practiced
 * 
 * @param directionalStrength The word's directional strength data
 * @returns 'recognition' or 'production'
 */
export function getPriorityDirection(
  directionalStrength: DirectionalStrength
): 'recognition' | 'production' {
  const { recognitionStrength, productionStrength } = directionalStrength;
  
  // Recognition is foundation - if weak, focus there first
  if (recognitionStrength < DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED) {
    return 'recognition';
  }
  
  // If production is significantly weaker, prioritize it
  const productionGap = recognitionStrength - productionStrength;
  if (productionGap > 20) {
    return 'production';
  }
  
  // If both are reasonably balanced, prefer production (it's harder and more valuable)
  // But if production is already strong, do recognition to maintain it
  if (productionStrength >= DIFFICULTY_THRESHOLDS.CUED_TO_FREE) {
    return 'recognition';
  }
  
  return 'production';
}

/**
 * Select the appropriate exercise type for a word based on its strength.
 * 
 * @param exerciseTypes Available exercise types for this word
 * @param directionalStrength The word's directional strength data
 * @param preferredDirection Optional: force a specific direction
 * @returns Exercise type selection with metadata
 */
export function selectExerciseType(
  exerciseTypes: ExerciseType[],
  directionalStrength: DirectionalStrength,
  preferredDirection?: 'recognition' | 'production'
): ExerciseTypeSelection | null {
  if (exerciseTypes.length === 0) {
    return null;
  }
  
  // Determine which direction to focus on
  const targetDirection = preferredDirection ?? getPriorityDirection(directionalStrength);
  
  // Get strength and level for target direction
  const strength = targetDirection === 'recognition'
    ? directionalStrength.recognitionStrength
    : directionalStrength.productionStrength;
    
  const currentLevel = targetDirection === 'recognition'
    ? directionalStrength.recognitionLevel
    : directionalStrength.productionLevel;
  
  // Check if level should change
  const newLevel = getDifficultyLevel(strength);
  const adjustedLevel = checkRegression(currentLevel, strength);
  const finalLevel = newLevel !== currentLevel ? newLevel : adjustedLevel;
  
  // Filter exercise types by direction
  const matchingTypes = exerciseTypes.filter(
    type => EXERCISE_DIRECTION_MAP[type] === targetDirection
  );
  
  // If no matching types, fall back to any available type
  const availableTypes = matchingTypes.length > 0 ? matchingTypes : exerciseTypes;
  
  // Select the first available type (could be randomized with Fisher-Yates later)
  const selectedType = availableTypes[0];
  
  // Determine hints/word bank based on difficulty level
  const showHints = finalLevel === 'recognition' || finalLevel === 'cued_recall';
  const useWordBank = finalLevel === 'recognition';
  
  return {
    exerciseType: selectedType,
    difficultyLevel: finalLevel,
    direction: EXERCISE_DIRECTION_MAP[selectedType],
    showHints,
    useWordBank,
  };
}

/**
 * Update directional strength after an exercise.
 * 
 * @param current Current directional strength
 * @param direction Which direction was practiced
 * @param isCorrect Whether the answer was correct
 * @param level The difficulty level of the exercise
 * @returns Updated directional strength
 */
export function updateDirectionalStrength(
  current: DirectionalStrength,
  direction: 'recognition' | 'production',
  isCorrect: boolean,
  level: DifficultyLevel
): DirectionalStrength {
  const now = new Date().toISOString();
  
  if (direction === 'recognition') {
    const newStrength = calculateDirectionalStrength(
      current.recognitionStrength,
      isCorrect,
      level
    );
    const newLevel = getDifficultyLevel(newStrength);
    const adjustedLevel = checkRegression(current.recognitionLevel, newStrength);
    
    return {
      ...current,
      recognitionStrength: newStrength,
      recognitionLevel: newLevel !== current.recognitionLevel ? newLevel : adjustedLevel,
      lastRecognitionPractice: now,
    };
  } else {
    const newStrength = calculateDirectionalStrength(
      current.productionStrength,
      isCorrect,
      level
    );
    const newLevel = getDifficultyLevel(newStrength);
    const adjustedLevel = checkRegression(current.productionLevel, newStrength);
    
    return {
      ...current,
      productionStrength: newStrength,
      productionLevel: newLevel !== current.productionLevel ? newLevel : adjustedLevel,
      lastProductionPractice: now,
    };
  }
}

/**
 * Get a combined strength value for legacy compatibility.
 * Weights production more heavily as it's the harder skill.
 * 
 * @param directionalStrength The directional strength data
 * @returns Combined strength (0-100)
 */
export function getCombinedStrength(directionalStrength: DirectionalStrength): number {
  const { recognitionStrength, productionStrength } = directionalStrength;
  
  // Weight: 30% recognition, 70% production
  // Production is more valuable and harder
  return Math.round(recognitionStrength * 0.3 + productionStrength * 0.7);
}

/**
 * Check if a word needs recognition practice (due for review or weak).
 * 
 * @param directionalStrength The directional strength data
 * @param daysSinceRecognition Days since last recognition practice
 * @returns Whether recognition practice is needed
 */
export function needsRecognitionPractice(
  directionalStrength: DirectionalStrength,
  daysSinceRecognition: number
): boolean {
  const { recognitionStrength, recognitionLevel } = directionalStrength;
  
  // Weak recognition always needs practice
  if (recognitionStrength < DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED) {
    return true;
  }
  
  // Due for review based on level
  const reviewIntervals = {
    recognition: 1,   // Review every day at lowest level
    cued_recall: 3,   // Every 3 days at medium level
    free_recall: 7,   // Every week at highest level
  };
  
  return daysSinceRecognition >= reviewIntervals[recognitionLevel];
}

/**
 * Check if a word needs production practice (due for review or weak).
 * 
 * @param directionalStrength The directional strength data
 * @param daysSinceProduction Days since last production practice
 * @returns Whether production practice is needed
 */
export function needsProductionPractice(
  directionalStrength: DirectionalStrength,
  daysSinceProduction: number
): boolean {
  const { productionStrength, productionLevel, recognitionStrength } = directionalStrength;
  
  // Can't do production if recognition is too weak
  if (recognitionStrength < DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED) {
    return false;
  }
  
  // Weak production always needs practice
  if (productionStrength < DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED) {
    return true;
  }
  
  // Due for review based on level
  const reviewIntervals = {
    recognition: 1,   // Review every day at lowest level
    cued_recall: 2,   // Every 2 days at medium level
    free_recall: 5,   // Every 5 days at highest level
  };
  
  return daysSinceProduction >= reviewIntervals[productionLevel];
}

/**
 * Get human-readable description of difficulty level.
 * 
 * @param level The difficulty level
 * @returns User-friendly description
 */
export function getDifficultyDescription(level: DifficultyLevel): string {
  switch (level) {
    case 'recognition':
      return 'Choose from options';
    case 'cued_recall':
      return 'Fill in with hints';
    case 'free_recall':
      return 'Type from memory';
  }
}

/**
 * Get difficulty level display info for UI.
 * 
 * @param level The difficulty level
 * @returns Display info with label and color
 */
export function getDifficultyDisplay(level: DifficultyLevel): {
  label: string;
  color: string;
  icon: string;
} {
  switch (level) {
    case 'recognition':
      return { label: 'Easy', color: 'text-green-600', icon: '1' };
    case 'cued_recall':
      return { label: 'Medium', color: 'text-yellow-600', icon: '2' };
    case 'free_recall':
      return { label: 'Hard', color: 'text-red-600', icon: '3' };
  }
}
