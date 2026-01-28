/**
 * Speed Reading Types
 *
 * Based on Paul Nation's fluency development strand:
 * - Timed reading with words-per-minute tracking
 * - Comprehension verification
 * - Gradual speed increase challenges
 * - Personal best records
 */

import type { PassageLevel } from './reading';

/**
 * A speed reading session configuration
 */
export interface SpeedReadingSession {
  /** Session ID */
  id: string;
  /** Passage being read */
  passageId: string;
  /** Passage title */
  passageTitle: string;
  /** Arabic text */
  text: string;
  /** Word count */
  wordCount: number;
  /** Passage level */
  level: PassageLevel;
  /** Session start time */
  startTime: number | null;
  /** Session end time */
  endTime: number | null;
  /** Target WPM (for challenges) */
  targetWPM?: number;
  /** Whether session is active */
  isActive: boolean;
  /** Whether comprehension check is complete */
  comprehensionComplete: boolean;
}

/**
 * Comprehension question for speed reading
 */
export interface ComprehensionQuestion {
  /** Question ID */
  id: string;
  /** Question text */
  question: string;
  /** Question in Arabic (optional) */
  questionAr?: string;
  /** Answer options */
  options: string[];
  /** Correct answer index */
  correctIndex: number;
}

/**
 * Speed reading result
 */
export interface SpeedReadingResult {
  /** Session ID */
  sessionId: string;
  /** Passage ID */
  passageId: string;
  /** Words per minute achieved */
  wpm: number;
  /** Reading time in milliseconds */
  readingTimeMs: number;
  /** Word count */
  wordCount: number;
  /** Comprehension score (0-100) */
  comprehensionScore: number;
  /** Questions correct out of total */
  questionsCorrect: number;
  /** Total questions */
  totalQuestions: number;
  /** Whether this was a personal best */
  isPersonalBest: boolean;
  /** Whether target WPM was met (for challenges) */
  targetMet?: boolean;
  /** Timestamp */
  timestamp: number;
}

/**
 * Speed reading statistics
 */
export interface SpeedReadingStats {
  /** Total sessions completed */
  totalSessions: number;
  /** Average WPM across all sessions */
  averageWPM: number;
  /** Best WPM achieved */
  bestWPM: number;
  /** Average comprehension score */
  averageComprehension: number;
  /** Sessions by level */
  byLevel: {
    beginner: { sessions: number; avgWPM: number; bestWPM: number };
    intermediate: { sessions: number; avgWPM: number; bestWPM: number };
    advanced: { sessions: number; avgWPM: number; bestWPM: number };
  };
  /** Recent results (last 10) */
  recentResults: SpeedReadingResult[];
  /** Personal bests by passage */
  personalBests: Record<string, number>;
}

/**
 * Speed reading configuration
 */
export interface SpeedReadingConfig {
  /** Default target WPM */
  defaultTargetWPM: number;
  /** Show WPM during reading */
  showLiveWPM: boolean;
  /** Auto-start timer when reading begins */
  autoStartTimer: boolean;
  /** Number of comprehension questions */
  comprehensionQuestions: number;
  /** Minimum comprehension score to count as successful */
  minComprehensionScore: number;
}

/**
 * Default speed reading configuration
 */
export const DEFAULT_SPEED_READING_CONFIG: SpeedReadingConfig = {
  defaultTargetWPM: 60,
  showLiveWPM: true,
  autoStartTimer: true,
  comprehensionQuestions: 3,
  minComprehensionScore: 70,
};

/**
 * WPM benchmark levels for Arabic
 * (Arabic reading is typically slower than English due to script complexity)
 */
export const WPM_BENCHMARKS = {
  beginner: { slow: 30, average: 50, fast: 70 },
  intermediate: { slow: 50, average: 80, fast: 110 },
  advanced: { slow: 70, average: 100, fast: 140 },
} as const;
