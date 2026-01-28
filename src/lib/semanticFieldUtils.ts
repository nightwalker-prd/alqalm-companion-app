/**
 * Semantic Field Utilities
 * 
 * Functions for:
 * - Generating semantic field exercises from vocabulary
 * - Checking categorization answers
 * - Providing feedback on word placement
 * 
 * Based on research showing that organizing vocabulary by semantic
 * relationships strengthens memory networks and aids retrieval.
 */

import type { SemanticFieldExercise, SemanticWord, SemanticCategory } from '../types/exercise';
import { fisherYatesShuffle } from './interleave';

// ============================================================================
// Constants
// ============================================================================

/** Minimum words per category */
export const MIN_WORDS_PER_CATEGORY = 2;

/** Maximum words per category */
export const MAX_WORDS_PER_CATEGORY = 4;

/** Common semantic categories with Arabic names */
export const SEMANTIC_CATEGORIES: Record<string, { en: string; ar: string }> = {
  // Places
  places: { en: 'Places', ar: 'أماكن' },
  home: { en: 'Home', ar: 'البيت' },
  school: { en: 'School', ar: 'المدرسة' },
  mosque: { en: 'Mosque', ar: 'المسجد' },
  
  // People
  people: { en: 'People', ar: 'الناس' },
  family: { en: 'Family', ar: 'العائلة' },
  professions: { en: 'Professions', ar: 'المهن' },
  
  // Objects
  objects: { en: 'Objects', ar: 'أشياء' },
  furniture: { en: 'Furniture', ar: 'أثاث' },
  clothing: { en: 'Clothing', ar: 'ملابس' },
  food: { en: 'Food', ar: 'طعام' },
  
  // Abstract
  time: { en: 'Time', ar: 'الوقت' },
  colors: { en: 'Colors', ar: 'الألوان' },
  numbers: { en: 'Numbers', ar: 'الأعداد' },
  directions: { en: 'Directions', ar: 'الاتجاهات' },
  
  // Grammar
  nouns: { en: 'Nouns', ar: 'أسماء' },
  verbs: { en: 'Verbs', ar: 'أفعال' },
  adjectives: { en: 'Adjectives', ar: 'صفات' },
  particles: { en: 'Particles', ar: 'حروف' },
  
  // Gender
  masculine: { en: 'Masculine', ar: 'مذكر' },
  feminine: { en: 'Feminine', ar: 'مؤنث' },
};

// ============================================================================
// Generation Functions
// ============================================================================

/**
 * Create a semantic category object
 */
export function createCategory(id: string, nameEn?: string, nameAr?: string): SemanticCategory {
  const predefined = SEMANTIC_CATEGORIES[id];
  return {
    id,
    nameEn: nameEn || predefined?.en || id,
    nameAr: nameAr || predefined?.ar || id,
  };
}

/**
 * Generate a semantic field exercise from vocabulary items
 */
export function generateSemanticFieldExercise(
  words: SemanticWord[],
  categories: SemanticCategory[],
  lessonId: string,
  itemIds: string[] = [],
  instruction?: string
): SemanticFieldExercise | null {
  // Need at least 2 categories
  if (categories.length < 2) {
    return null;
  }
  
  // Need at least MIN_WORDS_PER_CATEGORY per category
  const wordsByCategory = new Map<string, SemanticWord[]>();
  categories.forEach(cat => wordsByCategory.set(cat.id, []));
  
  words.forEach(word => {
    const catWords = wordsByCategory.get(word.category);
    if (catWords) {
      catWords.push(word);
    }
  });
  
  // Check each category has minimum words
  for (const [, catWords] of wordsByCategory) {
    if (catWords.length < MIN_WORDS_PER_CATEGORY) {
      return null;
    }
  }
  
  // Limit words per category
  const limitedWords: SemanticWord[] = [];
  for (const [, catWords] of wordsByCategory) {
    const shuffled = fisherYatesShuffle(catWords);
    limitedWords.push(...shuffled.slice(0, MAX_WORDS_PER_CATEGORY));
  }
  
  // Shuffle all words for display
  const shuffledWords = fisherYatesShuffle(limitedWords);
  
  return {
    id: `sf-${lessonId}-${Date.now()}`,
    type: 'semantic-field',
    categories,
    words: shuffledWords,
    instruction: instruction || 'Drag each word to the correct category',
    itemIds,
  };
}

/**
 * Generate a semantic field exercise for gender categorization
 * Common exercise type for Arabic learners
 */
export function generateGenderExercise(
  words: Array<{ arabic: string; english: string; isFeminine: boolean }>,
  lessonId: string,
  itemIds: string[] = []
): SemanticFieldExercise | null {
  const categories: SemanticCategory[] = [
    createCategory('masculine'),
    createCategory('feminine'),
  ];
  
  const semanticWords: SemanticWord[] = words.map(w => ({
    arabic: w.arabic,
    english: w.english,
    category: w.isFeminine ? 'feminine' : 'masculine',
  }));
  
  return generateSemanticFieldExercise(
    semanticWords,
    categories,
    lessonId,
    itemIds,
    'Sort words by gender (مذكر / مؤنث)'
  );
}

/**
 * Generate a semantic field exercise for word types
 */
export function generateWordTypeExercise(
  words: Array<{ arabic: string; english: string; type: 'noun' | 'verb' | 'adjective' | 'particle' }>,
  lessonId: string,
  itemIds: string[] = []
): SemanticFieldExercise | null {
  // Get unique types from words
  const types = new Set(words.map(w => w.type));
  
  const categoryMap: Record<string, string> = {
    noun: 'nouns',
    verb: 'verbs',
    adjective: 'adjectives',
    particle: 'particles',
  };
  
  const categories: SemanticCategory[] = Array.from(types).map(t => 
    createCategory(categoryMap[t])
  );
  
  const semanticWords: SemanticWord[] = words.map(w => ({
    arabic: w.arabic,
    english: w.english,
    category: categoryMap[w.type],
  }));
  
  return generateSemanticFieldExercise(
    semanticWords,
    categories,
    lessonId,
    itemIds,
    'Sort words by type'
  );
}

// ============================================================================
// Answer Checking
// ============================================================================

/**
 * User's categorization of words
 */
export interface UserCategorization {
  /** Map of word arabic text to category id */
  placements: Map<string, string>;
}

/**
 * Result for a single word placement
 */
export interface WordPlacementResult {
  arabic: string;
  english: string;
  userCategory: string | null;
  correctCategory: string;
  isCorrect: boolean;
}

/**
 * Full result of checking a semantic field answer
 */
export interface SemanticFieldResult {
  /** Whether all words are correctly categorized */
  isCorrect: boolean;
  /** Number of correct placements */
  correctCount: number;
  /** Total number of words */
  totalWords: number;
  /** Results for each word */
  wordResults: WordPlacementResult[];
  /** Accuracy percentage */
  accuracy: number;
  /** Feedback message */
  feedback: string;
  /** Words grouped by correct category (for showing solution) */
  correctGrouping: Map<string, SemanticWord[]>;
}

/**
 * Check the user's word categorizations
 */
export function checkSemanticField(
  userPlacements: Map<string, string>,
  exercise: SemanticFieldExercise
): SemanticFieldResult {
  const wordResults: WordPlacementResult[] = exercise.words.map(word => {
    const userCategory = userPlacements.get(word.arabic) || null;
    const isCorrect = userCategory === word.category;
    
    return {
      arabic: word.arabic,
      english: word.english,
      userCategory,
      correctCategory: word.category,
      isCorrect,
    };
  });
  
  const correctCount = wordResults.filter(r => r.isCorrect).length;
  const totalWords = exercise.words.length;
  const isCorrect = correctCount === totalWords;
  const accuracy = Math.round((correctCount / totalWords) * 100);
  
  // Build correct grouping
  const correctGrouping = new Map<string, SemanticWord[]>();
  exercise.categories.forEach(cat => correctGrouping.set(cat.id, []));
  exercise.words.forEach(word => {
    const catWords = correctGrouping.get(word.category);
    if (catWords) {
      catWords.push(word);
    }
  });
  
  let feedback: string;
  if (isCorrect) {
    feedback = 'Perfect! All words correctly categorized.';
  } else if (correctCount === 0) {
    feedback = 'Keep trying! Review the word meanings.';
  } else if (accuracy >= 80) {
    feedback = `Almost perfect! ${correctCount} of ${totalWords} correct.`;
  } else if (accuracy >= 50) {
    feedback = `Good progress! ${correctCount} of ${totalWords} correct.`;
  } else {
    feedback = `${correctCount} of ${totalWords} correct. Keep practicing!`;
  }
  
  return {
    isCorrect,
    correctCount,
    totalWords,
    wordResults,
    accuracy,
    feedback,
    correctGrouping,
  };
}

/**
 * Check if a single word is in the correct category
 */
export function checkWordPlacement(
  arabic: string,
  categoryId: string,
  exercise: SemanticFieldExercise
): boolean {
  const word = exercise.words.find(w => w.arabic === arabic);
  if (!word) return false;
  return word.category === categoryId;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get category name by id
 */
export function getCategoryName(categoryId: string, language: 'en' | 'ar' = 'en'): string {
  const cat = SEMANTIC_CATEGORIES[categoryId];
  if (!cat) return categoryId;
  return language === 'ar' ? cat.ar : cat.en;
}

/**
 * Get all words in a specific category from an exercise
 */
export function getWordsInCategory(
  exercise: SemanticFieldExercise,
  categoryId: string
): SemanticWord[] {
  return exercise.words.filter(w => w.category === categoryId);
}

/**
 * Calculate how many words are placed vs unplaced
 */
export function getPlacementProgress(
  userPlacements: Map<string, string>,
  exercise: SemanticFieldExercise
): { placed: number; total: number; percentage: number } {
  const placed = exercise.words.filter(w => userPlacements.has(w.arabic)).length;
  const total = exercise.words.length;
  return {
    placed,
    total,
    percentage: Math.round((placed / total) * 100),
  };
}
