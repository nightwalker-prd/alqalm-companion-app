/**
 * Reading Time & WPM Tracking Types
 *
 * Implements fluency measurement for Paul Nation's Strand 4: Fluency Development.
 * Tracks reading speed (words per minute) to measure reading fluency over time.
 *
 * Research notes:
 * - Arabic WPM typically lower than English due to script complexity
 * - Beginner Arabic readers: 30-60 WPM
 * - Intermediate readers: 60-100 WPM
 * - Advanced/native-like: 100-200+ WPM
 * - Silent reading is typically faster than oral reading
 */

import type { PassageLevel } from './reading';

/**
 * A single reading time session for a passage
 */
export interface ReadingTimeSession {
  /** Unique session ID */
  id: string;
  /** Passage ID that was read */
  passageId: string;
  /** Passage level at time of reading */
  passageLevel: PassageLevel;
  /** Number of words in the passage */
  wordCount: number;
  /** Session start timestamp (ms) */
  startTime: number;
  /** Session end timestamp (ms) */
  endTime: number;
  /** Total reading duration in milliseconds */
  durationMs: number;
  /** Calculated words per minute */
  wpm: number;
  /** Whether the user completed the full passage */
  completed: boolean;
}

/**
 * WPM statistics for a time period
 */
export interface WPMStats {
  /** Average WPM across all sessions */
  averageWpm: number;
  /** Fastest reading session WPM */
  fastestWpm: number;
  /** Slowest reading session WPM */
  slowestWpm: number;
  /** Total sessions counted */
  sessionCount: number;
  /** Total words read */
  totalWordsRead: number;
  /** Total time spent reading (ms) */
  totalTimeMs: number;
}

/**
 * WPM breakdown by passage level
 */
export interface WPMByLevel {
  beginner: WPMStats | null;
  intermediate: WPMStats | null;
  advanced: WPMStats | null;
}

/**
 * Reading fluency progress over time
 */
export interface FluencyProgress {
  /** WPM trend direction */
  trend: 'improving' | 'stable' | 'declining';
  /** Percentage change in WPM over the period */
  changePercent: number;
  /** Average WPM in first half of period */
  startPeriodWpm: number;
  /** Average WPM in second half of period */
  endPeriodWpm: number;
}

/**
 * Fluency level classification based on WPM
 */
export type FluencyLevel = 'beginner' | 'developing' | 'intermediate' | 'advanced' | 'fluent';

/**
 * Fluency level thresholds (WPM ranges for Arabic text)
 */
export interface FluencyThreshold {
  min: number;
  max: number;
}

export type FluencyThresholds = Record<FluencyLevel, FluencyThreshold>;

/**
 * Stored reading time data
 */
export interface ReadingTimeData {
  /** Data version for migrations */
  version: number;
  /** All recorded reading sessions */
  sessions: ReadingTimeSession[];
  /** Currently active reading session (if any) */
  activeSession: ActiveReadingSession | null;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Active (in-progress) reading session
 */
export interface ActiveReadingSession {
  /** Session ID */
  id: string;
  /** Passage being read */
  passageId: string;
  /** Passage level */
  passageLevel: PassageLevel;
  /** Word count of passage */
  wordCount: number;
  /** When reading started */
  startTime: number;
  /** Time accumulated while paused (ms) */
  pausedDurationMs: number;
  /** Whether currently paused */
  isPaused: boolean;
  /** When pause started (if paused) */
  pauseStartTime: number | null;
}

/**
 * Reading time summary for UI display
 */
export interface ReadingTimeSummary {
  /** Overall WPM stats (all time) */
  allTime: WPMStats | null;
  /** This week's WPM stats */
  thisWeek: WPMStats | null;
  /** Today's WPM stats */
  today: WPMStats | null;
  /** Stats broken down by level */
  byLevel: WPMByLevel;
  /** Fluency progress trend */
  progress: FluencyProgress | null;
  /** Current fluency level classification */
  fluencyLevel: FluencyLevel;
  /** Total reading sessions */
  totalSessions: number;
  /** Reading streak (consecutive days) */
  readingStreak: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Current data version
 */
export const READING_TIME_VERSION = 1;

/**
 * Maximum sessions to store (oldest are pruned)
 */
export const MAX_READING_SESSIONS = 500;

/**
 * Minimum valid session duration (5 seconds)
 * Sessions shorter than this are discarded as invalid
 */
export const MIN_SESSION_DURATION_MS = 5000;

/**
 * Maximum valid session duration (2 hours)
 * Sessions longer than this are capped to avoid skewed data from forgotten timers
 */
export const MAX_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * WPM thresholds for fluency levels (Arabic text)
 */
export const FLUENCY_THRESHOLDS: FluencyThresholds = {
  beginner: { min: 0, max: 30 },
  developing: { min: 30, max: 60 },
  intermediate: { min: 60, max: 100 },
  advanced: { min: 100, max: 150 },
  fluent: { min: 150, max: Infinity },
};

/**
 * Fluency level display labels
 */
export const FLUENCY_LEVEL_LABELS: Record<FluencyLevel, string> = {
  beginner: 'Beginner Reader',
  developing: 'Developing Reader',
  intermediate: 'Intermediate Reader',
  advanced: 'Advanced Reader',
  fluent: 'Fluent Reader',
};

/**
 * Minimum percentage change to consider a trend
 */
export const TREND_THRESHOLD_PERCENT = 5;

/**
 * Minimum sessions needed to calculate trends
 */
export const MIN_SESSIONS_FOR_TREND = 6;
