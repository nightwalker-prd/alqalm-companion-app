/**
 * Fluency Speed Rounds Utilities
 * 
 * Based on Paul Nation's "Four Strands" research - fluency development is one
 * of the essential strands of language learning. Speed rounds help build
 * automaticity with already-mastered vocabulary.
 * 
 * Key principles:
 * - Use only mastered vocabulary (strength >= 80 or FIRe repNum >= 3)
 * - Fast-paced, no hints, immediate feedback
 * - Track words per minute (WPM) for progress measurement
 */

import { fisherYatesShuffle } from './interleave';
import { getProgress } from './progressService';
import { getAllWords, type WordData } from './vocabularyAsync';
import type { WordMastery } from '../types/progress';
import { MASTERY_THRESHOLDS } from '../types/progress';

/**
 * Default fluency session duration in milliseconds
 */
export const DEFAULT_FLUENCY_DURATION_MS = 60000; // 60 seconds

/**
 * Minimum mastered words needed to run a fluency session
 */
export const MIN_WORDS_FOR_FLUENCY = 10;

/**
 * A simplified exercise for fluency rounds
 */
export interface FluencyItem {
  id: string;
  type: 'word-to-meaning' | 'meaning-to-word';
  /** The prompt shown to the user */
  prompt: string;
  /** The correct answer */
  answer: string;
  /** Alternative acceptable answers */
  alternativeAnswers?: string[];
  /** The word data for reference */
  wordData: WordData;
}

/**
 * Configuration for a fluency session
 */
export interface FluencySessionConfig {
  /** Duration in milliseconds (default 60000) */
  durationMs: number;
  /** Maximum number of items to generate */
  maxItems: number;
}

/**
 * Result of a single fluency answer
 */
export interface FluencyAnswerResult {
  itemId: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

/**
 * Summary of a completed fluency session
 */
export interface FluencySessionResult {
  /** Total items attempted */
  totalAttempted: number;
  /** Number of correct answers */
  totalCorrect: number;
  /** Actual session duration in ms */
  durationMs: number;
  /** Words per minute */
  wordsPerMinute: number;
  /** Average response time in ms */
  averageResponseTimeMs: number;
  /** Whether this is a new personal best */
  isNewPersonalBest: boolean;
  /** Individual answer results */
  answers: FluencyAnswerResult[];
}

/**
 * Stored fluency statistics (for localStorage)
 */
export interface FluencyStats {
  /** Total sessions completed */
  totalSessions: number;
  /** Best words per minute score */
  bestWordsPerMinute: number;
  /** Lifetime average accuracy (0-1) */
  averageAccuracy: number;
  /** Date of last session (ISO string) */
  lastSessionDate: string | null;
  /** Total words practiced across all sessions */
  totalWordsPracticed: number;
}

/**
 * Initial fluency stats for new users
 */
export const INITIAL_FLUENCY_STATS: FluencyStats = {
  totalSessions: 0,
  bestWordsPerMinute: 0,
  averageAccuracy: 0,
  lastSessionDate: null,
  totalWordsPracticed: 0,
};

/**
 * Get all mastered word IDs from progress data
 */
export function getMasteredWordIds(): string[] {
  const data = getProgress();
  const masteredIds: string[] = [];
  
  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    if (isWordMastered(mastery)) {
      masteredIds.push(wordId);
    }
  }
  
  return masteredIds;
}

/**
 * Check if a word is considered "mastered" for fluency purposes
 */
export function isWordMastered(mastery: WordMastery): boolean {
  // Check FIRe-based mastery first
  if (mastery.fire) {
    return mastery.fire.repNum >= 3 && mastery.fire.memory >= 0.5;
  }
  // Fall back to strength-based mastery
  return mastery.strength >= MASTERY_THRESHOLDS.MASTERED;
}

/**
 * Generate a fluency session with randomized items
 */
export function generateFluencySession(
  config: Partial<FluencySessionConfig> = {}
): FluencyItem[] {
  const { durationMs = DEFAULT_FLUENCY_DURATION_MS, maxItems = 50 } = config;
  
  // Get mastered words
  const masteredIds = getMasteredWordIds();
  
  if (masteredIds.length < MIN_WORDS_FOR_FLUENCY) {
    return [];
  }
  
  // Get word data for mastered words
  const allWords = getAllWords();
  const wordMap = new Map(allWords.map(w => [w.id, w]));
  
  const masteredWords: WordData[] = [];
  for (const id of masteredIds) {
    const word = wordMap.get(id);
    if (word) {
      masteredWords.push(word);
    }
  }
  
  if (masteredWords.length < MIN_WORDS_FOR_FLUENCY) {
    return [];
  }
  
  // Shuffle words using Fisher-Yates
  const shuffled = fisherYatesShuffle(masteredWords);
  
  // Estimate items based on duration (assume ~3 seconds per item)
  const estimatedItems = Math.min(
    Math.ceil(durationMs / 3000),
    maxItems,
    shuffled.length * 2 // Each word can appear in both directions
  );
  
  // Generate items alternating between word-to-meaning and meaning-to-word
  const items: FluencyItem[] = [];
  let wordIndex = 0;
  
  while (items.length < estimatedItems && wordIndex < shuffled.length) {
    const word = shuffled[wordIndex];
    
    // Add word-to-meaning
    if (items.length < estimatedItems) {
      items.push(createFluencyItem(word, 'word-to-meaning'));
    }
    
    // Add meaning-to-word
    if (items.length < estimatedItems) {
      items.push(createFluencyItem(word, 'meaning-to-word'));
    }
    
    wordIndex++;
  }
  
  // Shuffle the final list so types are interleaved
  return fisherYatesShuffle(items);
}

/**
 * Create a single fluency item from a word
 */
function createFluencyItem(
  word: WordData,
  type: 'word-to-meaning' | 'meaning-to-word'
): FluencyItem {
  if (type === 'word-to-meaning') {
    return {
      id: `fluency-${word.id}-w2m`,
      type,
      prompt: word.arabic,
      answer: word.english.toLowerCase(),
      alternativeAnswers: generateAlternativeAnswers(word.english),
      wordData: word,
    };
  } else {
    return {
      id: `fluency-${word.id}-m2w`,
      type,
      prompt: word.english,
      answer: word.arabic,
      wordData: word,
    };
  }
}

/**
 * Generate alternative acceptable answers for English meanings
 * (handles "a/the" articles, plurals, etc.)
 */
function generateAlternativeAnswers(english: string): string[] {
  const alternatives: string[] = [];
  const lower = english.toLowerCase();
  
  // Remove leading articles
  if (lower.startsWith('a ')) {
    alternatives.push(lower.slice(2));
    alternatives.push('the ' + lower.slice(2));
  } else if (lower.startsWith('an ')) {
    alternatives.push(lower.slice(3));
    alternatives.push('the ' + lower.slice(3));
  } else if (lower.startsWith('the ')) {
    alternatives.push(lower.slice(4));
    alternatives.push('a ' + lower.slice(4));
  } else {
    alternatives.push('a ' + lower);
    alternatives.push('the ' + lower);
  }
  
  // Handle "to verb" format
  if (lower.startsWith('to ')) {
    alternatives.push(lower.slice(3));
  }
  
  return alternatives;
}

/**
 * Check if a user's answer is correct for a fluency item
 */
export function checkFluencyAnswer(item: FluencyItem, userAnswer: string): boolean {
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = item.answer.toLowerCase();
  
  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return true;
  }
  
  // Check alternative answers (for English)
  if (item.alternativeAnswers) {
    for (const alt of item.alternativeAnswers) {
      if (normalizedUser === alt.toLowerCase()) {
        return true;
      }
    }
  }
  
  // For Arabic answers, be more lenient with whitespace
  if (item.type === 'meaning-to-word') {
    const normalizedUserArabic = normalizedUser.replace(/\s+/g, '');
    const normalizedCorrectArabic = normalizedCorrect.replace(/\s+/g, '');
    if (normalizedUserArabic === normalizedCorrectArabic) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate fluency session results
 */
export function calculateFluencyResult(
  answers: FluencyAnswerResult[],
  durationMs: number,
  previousBestWpm: number
): FluencySessionResult {
  const totalAttempted = answers.length;
  const totalCorrect = answers.filter(a => a.isCorrect).length;
  
  // Calculate WPM based on correct answers
  const durationMinutes = durationMs / 60000;
  const wordsPerMinute = durationMinutes > 0 
    ? Math.round(totalCorrect / durationMinutes)
    : 0;
  
  // Calculate average response time
  const totalResponseTime = answers.reduce((sum, a) => sum + a.responseTimeMs, 0);
  const averageResponseTimeMs = totalAttempted > 0
    ? Math.round(totalResponseTime / totalAttempted)
    : 0;
  
  // Check for personal best
  const isNewPersonalBest = wordsPerMinute > previousBestWpm;
  
  return {
    totalAttempted,
    totalCorrect,
    durationMs,
    wordsPerMinute,
    averageResponseTimeMs,
    isNewPersonalBest,
    answers,
  };
}

/**
 * Update fluency stats with a new session result
 */
export function updateFluencyStats(
  currentStats: FluencyStats,
  result: FluencySessionResult
): FluencyStats {
  const newTotalSessions = currentStats.totalSessions + 1;
  const newTotalWords = currentStats.totalWordsPracticed + result.totalAttempted;
  
  // Calculate new weighted average accuracy
  const totalCorrectAllTime = 
    currentStats.averageAccuracy * currentStats.totalWordsPracticed + result.totalCorrect;
  const newAverageAccuracy = newTotalWords > 0
    ? totalCorrectAllTime / newTotalWords
    : 0;
  
  return {
    totalSessions: newTotalSessions,
    bestWordsPerMinute: Math.max(currentStats.bestWordsPerMinute, result.wordsPerMinute),
    averageAccuracy: newAverageAccuracy,
    lastSessionDate: new Date().toISOString(),
    totalWordsPracticed: newTotalWords,
  };
}

/**
 * Check if the user has enough mastered words for fluency practice
 */
export function canStartFluencySession(): boolean {
  const masteredIds = getMasteredWordIds();
  return masteredIds.length >= MIN_WORDS_FOR_FLUENCY;
}

/**
 * Get the count of mastered words available for fluency
 */
export function getMasteredWordCount(): number {
  return getMasteredWordIds().length;
}

/**
 * Storage key for fluency stats
 */
const FLUENCY_STATS_KEY = 'madina_fluency_stats';

/**
 * Load fluency stats from localStorage
 */
export function loadFluencyStats(): FluencyStats {
  try {
    const stored = localStorage.getItem(FLUENCY_STATS_KEY);
    if (stored) {
      return JSON.parse(stored) as FluencyStats;
    }
  } catch (e) {
    console.warn('Failed to load fluency stats:', e);
  }
  return { ...INITIAL_FLUENCY_STATS };
}

/**
 * Save fluency stats to localStorage
 */
export function saveFluencyStats(stats: FluencyStats): void {
  try {
    localStorage.setItem(FLUENCY_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save fluency stats:', e);
  }
}
