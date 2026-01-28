/**
 * Speed Reading Service
 *
 * Implements Paul Nation's fluency development through timed reading:
 * - WPM calculation and tracking
 * - Comprehension verification
 * - Personal best records
 * - Progress statistics
 */

import type {
  SpeedReadingResult,
  SpeedReadingStats,
  SpeedReadingConfig,
} from '../types/speedReading';
import {
  DEFAULT_SPEED_READING_CONFIG,
  WPM_BENCHMARKS,
} from '../types/speedReading';
import type { PassageLevel, ReadingPassage } from '../types/reading';

// Storage keys
const SPEED_READING_STATS_KEY = 'madina_speed_reading_stats';
const SPEED_READING_CONFIG_KEY = 'madina_speed_reading_config';

/**
 * Initialize default stats
 */
function createDefaultStats(): SpeedReadingStats {
  return {
    totalSessions: 0,
    averageWPM: 0,
    bestWPM: 0,
    averageComprehension: 0,
    byLevel: {
      beginner: { sessions: 0, avgWPM: 0, bestWPM: 0 },
      intermediate: { sessions: 0, avgWPM: 0, bestWPM: 0 },
      advanced: { sessions: 0, avgWPM: 0, bestWPM: 0 },
    },
    recentResults: [],
    personalBests: {},
  };
}

/**
 * Get speed reading stats from localStorage
 */
export function getSpeedReadingStats(): SpeedReadingStats {
  if (typeof window === 'undefined') return createDefaultStats();
  const stored = localStorage.getItem(SPEED_READING_STATS_KEY);
  if (!stored) return createDefaultStats();
  try {
    return { ...createDefaultStats(), ...JSON.parse(stored) };
  } catch {
    return createDefaultStats();
  }
}

/**
 * Save speed reading stats to localStorage
 */
function saveSpeedReadingStats(stats: SpeedReadingStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SPEED_READING_STATS_KEY, JSON.stringify(stats));
}

/**
 * Get speed reading config from localStorage
 */
export function getSpeedReadingConfig(): SpeedReadingConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SPEED_READING_CONFIG };
  }
  const stored = localStorage.getItem(SPEED_READING_CONFIG_KEY);
  if (!stored) return { ...DEFAULT_SPEED_READING_CONFIG };
  try {
    return { ...DEFAULT_SPEED_READING_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_SPEED_READING_CONFIG };
  }
}

/**
 * Save speed reading config
 */
export function saveSpeedReadingConfig(config: Partial<SpeedReadingConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getSpeedReadingConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(SPEED_READING_CONFIG_KEY, JSON.stringify(updated));
}

/**
 * Calculate words per minute
 */
export function calculateWPM(wordCount: number, readingTimeMs: number): number {
  if (readingTimeMs <= 0) return 0;
  const minutes = readingTimeMs / 60000;
  return Math.round(wordCount / minutes);
}

/**
 * Get WPM rating for a level
 */
export function getWPMRating(
  wpm: number,
  level: PassageLevel
): 'slow' | 'average' | 'fast' | 'excellent' {
  const benchmarks = WPM_BENCHMARKS[level];

  if (wpm >= benchmarks.fast * 1.2) return 'excellent';
  if (wpm >= benchmarks.fast) return 'fast';
  if (wpm >= benchmarks.average) return 'average';
  return 'slow';
}

/**
 * Record a speed reading result
 */
export function recordSpeedReadingResult(
  result: Omit<SpeedReadingResult, 'isPersonalBest' | 'timestamp'>
): SpeedReadingResult {
  const stats = getSpeedReadingStats();

  // Check if personal best
  const previousBest = stats.personalBests[result.passageId] || 0;
  const isPersonalBest = result.wpm > previousBest;

  const fullResult: SpeedReadingResult = {
    ...result,
    isPersonalBest,
    timestamp: Date.now(),
  };

  // Update personal best if needed
  if (isPersonalBest) {
    stats.personalBests[result.passageId] = result.wpm;
  }

  // Update overall stats
  stats.totalSessions += 1;
  stats.averageWPM = Math.round(
    (stats.averageWPM * (stats.totalSessions - 1) + result.wpm) /
      stats.totalSessions
  );
  stats.averageComprehension = Math.round(
    (stats.averageComprehension * (stats.totalSessions - 1) +
      result.comprehensionScore) /
      stats.totalSessions
  );

  if (result.wpm > stats.bestWPM) {
    stats.bestWPM = result.wpm;
  }

  // Update level-specific stats (need to extract level from passage)
  // This is simplified - in real implementation, we'd store level with result

  // Add to recent results (keep last 10)
  stats.recentResults = [fullResult, ...stats.recentResults.slice(0, 9)];

  saveSpeedReadingStats(stats);
  return fullResult;
}

/**
 * Record result with level tracking
 */
export function recordSpeedReadingResultWithLevel(
  result: Omit<SpeedReadingResult, 'isPersonalBest' | 'timestamp'>,
  level: PassageLevel
): SpeedReadingResult {
  const fullResult = recordSpeedReadingResult(result);

  // Update level-specific stats
  const stats = getSpeedReadingStats();
  const levelStats = stats.byLevel[level];

  levelStats.sessions += 1;
  levelStats.avgWPM = Math.round(
    (levelStats.avgWPM * (levelStats.sessions - 1) + result.wpm) /
      levelStats.sessions
  );
  if (result.wpm > levelStats.bestWPM) {
    levelStats.bestWPM = result.wpm;
  }

  saveSpeedReadingStats(stats);
  return fullResult;
}

/**
 * Get personal best WPM for a passage
 */
export function getPersonalBest(passageId: string): number | null {
  const stats = getSpeedReadingStats();
  return stats.personalBests[passageId] || null;
}

/**
 * Generate a suggested target WPM based on history
 */
export function getSuggestedTargetWPM(level: PassageLevel): number {
  const stats = getSpeedReadingStats();
  const levelStats = stats.byLevel[level];

  // If user has history at this level, suggest slightly above average
  if (levelStats.sessions > 0) {
    return Math.round(levelStats.avgWPM * 1.1);
  }

  // Otherwise use benchmark average
  return WPM_BENCHMARKS[level].average;
}

/**
 * Generate simple comprehension questions from passage
 * (In production, these would be pre-authored for each passage)
 */
export function generateSimpleQuestions(
  passage: ReadingPassage,
  count: number = 3
): Array<{
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}> {
  // This is a placeholder - in production, questions would be stored with passages
  // For now, return generic questions about the passage
  const questions = [];

  // Question about the title
  if (passage.title) {
    questions.push({
      id: `${passage.id}-q1`,
      question: `What is the main topic of this passage?`,
      options: [
        passage.title,
        'Something unrelated',
        'Cannot determine',
        'Multiple topics equally',
      ],
      correctIndex: 0,
    });
  }

  // Question about word count (to verify they read)
  const wordRange = passage.wordCount;
  questions.push({
    id: `${passage.id}-q2`,
    question: 'Approximately how long was the passage?',
    options: [
      wordRange < 30 ? 'Very short (under 30 words)' : wordRange < 50 ? 'Short (30-50 words)' : 'Medium length (50+ words)',
      'Extremely long (200+ words)',
      wordRange < 30 ? 'Medium length' : 'Very short',
      'I did not read it',
    ],
    correctIndex: 0,
  });

  // Question about level appropriateness
  questions.push({
    id: `${passage.id}-q3`,
    question: 'Did you understand the main idea of the passage?',
    options: [
      'Yes, I understood the main idea',
      'Partially understood',
      'Did not understand most of it',
      'Did not read carefully',
    ],
    correctIndex: 0, // Assuming comprehension
  });

  return questions.slice(0, count);
}

/**
 * Calculate comprehension score from answers
 */
export function calculateComprehensionScore(
  correctCount: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

/**
 * Get reading passages suitable for speed reading
 * (filters out very short passages)
 */
export function getSpeedReadingPassages(
  passages: ReadingPassage[],
  minWordCount: number = 20
): ReadingPassage[] {
  return passages.filter((p) => p.wordCount >= minWordCount);
}

/**
 * Format reading time for display
 */
export function formatReadingTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get performance feedback message
 */
export function getPerformanceFeedback(
  wpm: number,
  level: PassageLevel,
  comprehensionScore: number
): { message: string; type: 'success' | 'good' | 'encouragement' } {
  const rating = getWPMRating(wpm, level);
  const goodComprehension = comprehensionScore >= 70;

  if (rating === 'excellent' && goodComprehension) {
    return {
      message: 'Outstanding! Excellent speed with strong comprehension.',
      type: 'success',
    };
  }

  if ((rating === 'fast' || rating === 'excellent') && goodComprehension) {
    return {
      message: 'Great job! Fast reading while maintaining comprehension.',
      type: 'success',
    };
  }

  if (rating === 'average' && goodComprehension) {
    return {
      message: 'Good progress! Solid comprehension at a steady pace.',
      type: 'good',
    };
  }

  if (!goodComprehension) {
    return {
      message: 'Try slowing down slightly to improve comprehension.',
      type: 'encouragement',
    };
  }

  return {
    message: 'Keep practicing! Speed will improve with time.',
    type: 'encouragement',
  };
}
