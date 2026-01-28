/**
 * Daily Challenge Service
 * 
 * Generates a quick 5-minute mixed practice session:
 * - Due words from SRS
 * - Weakness-targeted exercises
 * - Random exercises from current lesson
 */

import { getFIReDueWords } from './progressService';
import { analyzeWeaknesses } from './weaknessAnalysis';
import { fisherYatesShuffle } from './interleave';

// Storage keys
const DAILY_CHALLENGE_KEY = 'madina_daily_challenge';
const DAILY_SESSION_KEY = 'madina_daily_session';

export interface DailyChallengeState {
  lastCompleted: string | null; // ISO date string
  streak: number;
  totalCompleted: number;
}

export interface DailyChallengeConfig {
  dueWordCount: number;
  weaknessCount: number;
  randomCount: number;
}

/**
 * Load daily challenge state from localStorage
 */
export function loadDailyChallengeState(): DailyChallengeState {
  try {
    const stored = localStorage.getItem(DAILY_CHALLENGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors
  }
  return {
    lastCompleted: null,
    streak: 0,
    totalCompleted: 0,
  };
}

/**
 * Save daily challenge state to localStorage
 */
export function saveDailyChallengeState(state: DailyChallengeState): void {
  localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(state));
}

/**
 * Check if today's challenge is already completed
 */
export function isTodayCompleted(): boolean {
  const state = loadDailyChallengeState();
  if (!state.lastCompleted) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return state.lastCompleted === today;
}

/**
 * Check if the user completed yesterday (for streak calculation)
 */
function completedYesterday(): boolean {
  const state = loadDailyChallengeState();
  if (!state.lastCompleted) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return state.lastCompleted === yesterdayStr;
}

/**
 * Mark today's challenge as completed
 */
export function completeDailyChallenge(): DailyChallengeState {
  const state = loadDailyChallengeState();
  const today = new Date().toISOString().split('T')[0];
  
  // Already completed today
  if (state.lastCompleted === today) {
    return state;
  }
  
  // Calculate new streak
  let newStreak = 1;
  if (completedYesterday()) {
    newStreak = state.streak + 1;
  }
  
  const newState: DailyChallengeState = {
    lastCompleted: today,
    streak: newStreak,
    totalCompleted: state.totalCompleted + 1,
  };
  
  saveDailyChallengeState(newState);
  return newState;
}

/**
 * Get word IDs for due words (from SRS)
 */
export function getDueWordIds(count: number): string[] {
  const dueWords = getFIReDueWords();
  return fisherYatesShuffle(dueWords).slice(0, count);
}

/**
 * Get word IDs for weakness-targeted practice
 */
export function getWeaknessWordIds(count: number): string[] {
  const report = analyzeWeaknesses();
  
  if (!report.hasEnoughData || report.topWeaknesses.length === 0) {
    return [];
  }
  
  // Collect word IDs from top weaknesses
  const wordIds: string[] = [];
  for (const weakness of report.topWeaknesses) {
    wordIds.push(...weakness.affectedWordIds);
  }
  
  // Deduplicate and shuffle
  const unique = [...new Set(wordIds)];
  return fisherYatesShuffle(unique).slice(0, count);
}

// ============================================================================
// Session Persistence (save/resume interrupted sessions)
// ============================================================================

export interface SavedSession {
  date: string; // ISO date - only valid for today
  questionWordIds: string[];
  currentIndex: number;
  answers: Array<{
    wordId: string;
    isCorrect: boolean;
  }>;
}

/**
 * Save current session progress
 */
export function saveSessionProgress(session: SavedSession): void {
  localStorage.setItem(DAILY_SESSION_KEY, JSON.stringify(session));
}

/**
 * Load saved session (only if from today)
 */
export function loadSavedSession(): SavedSession | null {
  try {
    const stored = localStorage.getItem(DAILY_SESSION_KEY);
    if (!stored) return null;
    
    const session: SavedSession = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    
    // Only return if from today
    if (session.date === today) {
      return session;
    }
    
    // Clear stale session
    clearSavedSession();
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear saved session
 */
export function clearSavedSession(): void {
  localStorage.removeItem(DAILY_SESSION_KEY);
}

/**
 * Check if there's a resumable session
 */
export function hasResumableSession(): boolean {
  const session = loadSavedSession();
  return session !== null && session.currentIndex < session.questionWordIds.length;
}

// ============================================================================
// Challenge Info
// ============================================================================

/**
 * Get the daily challenge configuration
 */
export function getDailyChallengeInfo(): {
  isCompleted: boolean;
  streak: number;
  totalCompleted: number;
  dueWords: number;
  hasWeaknesses: boolean;
} {
  const state = loadDailyChallengeState();
  const dueWords = getFIReDueWords();
  const report = analyzeWeaknesses();
  
  return {
    isCompleted: isTodayCompleted(),
    streak: state.streak,
    totalCompleted: state.totalCompleted,
    dueWords: dueWords.length,
    hasWeaknesses: report.hasEnoughData && report.topWeaknesses.length > 0,
  };
}
