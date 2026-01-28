/**
 * Study Time Tracking Types
 *
 * Based on Paul Nation's Four Strands framework for balanced language learning.
 * Each strand should receive roughly equal time (25% each) for optimal learning.
 *
 * The Four Strands:
 * 1. Meaning-focused Input - Learning through reading and listening
 * 2. Meaning-focused Output - Learning through speaking and writing
 * 3. Language-focused Learning - Deliberate study of vocabulary, grammar, pronunciation
 * 4. Fluency Development - Getting fast and smooth with known material
 */

/**
 * The four learning strands from Paul Nation's research
 */
export type LearningStrand =
  | 'meaning-input' // Reading, listening comprehension
  | 'meaning-output' // Translation to Arabic, writing, speaking
  | 'language-focused' // Vocabulary drills, grammar exercises, error correction
  | 'fluency'; // Speed rounds, timed practice with mastered material

/**
 * Activity types that map to strands
 */
export type ActivityType =
  // Meaning-focused Input activities
  | 'reading'
  | 'listening'
  | 'reading-listening' // Combined reading while listening
  // Meaning-focused Output activities
  | 'translate-to-arabic'
  | 'meaning-to-word'
  | 'construct-sentence'
  | 'free-recall'
  | 'transcription'
  // Language-focused Learning activities
  | 'fill-blank'
  | 'word-to-meaning'
  | 'grammar-apply'
  | 'error-correction'
  | 'multi-cloze'
  | 'semantic-field'
  | 'sentence-unscramble'
  | 'collocation'
  | 'root-family'
  | 'pre-test'
  // Fluency Development activities
  | 'fluency-speed-round'
  | 'timed-reading'
  | 'challenge-mode';

/**
 * Mapping from activity types to their corresponding strand
 */
export const ACTIVITY_TO_STRAND: Record<ActivityType, LearningStrand> = {
  // Meaning-focused Input
  reading: 'meaning-input',
  listening: 'meaning-input',
  'reading-listening': 'meaning-input',
  // Meaning-focused Output
  'translate-to-arabic': 'meaning-output',
  'meaning-to-word': 'meaning-output',
  'construct-sentence': 'meaning-output',
  'free-recall': 'meaning-output',
  transcription: 'meaning-output',
  // Language-focused Learning
  'fill-blank': 'language-focused',
  'word-to-meaning': 'language-focused',
  'grammar-apply': 'language-focused',
  'error-correction': 'language-focused',
  'multi-cloze': 'language-focused',
  'semantic-field': 'language-focused',
  'sentence-unscramble': 'language-focused',
  collocation: 'language-focused',
  'root-family': 'language-focused',
  'pre-test': 'language-focused',
  // Fluency Development
  'fluency-speed-round': 'fluency',
  'timed-reading': 'fluency',
  'challenge-mode': 'fluency',
};

/**
 * A single study session record
 */
export interface StudySession {
  /** Unique session ID */
  id: string;
  /** The learning strand for this session */
  strand: LearningStrand;
  /** Specific activity type */
  activityType: ActivityType;
  /** Session start timestamp (ms since epoch) */
  startTime: number;
  /** Session end timestamp (null if still active) */
  endTime: number | null;
  /** Duration in milliseconds (calculated when ended) */
  durationMs: number | null;
}

/**
 * Totals by strand in milliseconds
 */
export interface StrandTotals {
  'meaning-input': number;
  'meaning-output': number;
  'language-focused': number;
  fluency: number;
}

/**
 * Balance percentages by strand (should sum to 100)
 */
export interface StrandBalance {
  'meaning-input': number;
  'meaning-output': number;
  'language-focused': number;
  fluency: number;
}

/**
 * Recommendation for which strand to practice next
 */
export interface StrandRecommendation {
  /** The recommended strand to practice */
  strand: LearningStrand;
  /** Current percentage of time spent on this strand */
  currentPercent: number;
  /** Target percentage (25% for balanced learning) */
  targetPercent: number;
  /** Human-readable suggestion */
  suggestion: string;
}

/**
 * Stored study time data
 */
export interface StudyTimeData {
  /** Data version for migrations */
  version: 1;
  /** All recorded sessions (capped for storage efficiency) */
  sessions: StudySession[];
  /** Running totals by strand (ms) */
  totals: StrandTotals;
  /** Currently active session ID, if any */
  activeSessionId: string | null;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Summary statistics for display
 */
export interface StudyTimeSummary {
  /** Total study time across all strands (ms) */
  totalTimeMs: number;
  /** Time by strand (ms) */
  byStrand: StrandTotals;
  /** Percentage by strand */
  balance: StrandBalance;
  /** Number of sessions today */
  sessionsToday: number;
  /** Study time today (ms) */
  todayTimeMs: number;
  /** Study time this week (ms) */
  weekTimeMs: number;
  /** Recommendation for next activity */
  recommendation: StrandRecommendation | null;
}

/**
 * Display labels for strands
 */
export const STRAND_LABELS: Record<LearningStrand, string> = {
  'meaning-input': 'Input',
  'meaning-output': 'Output',
  'language-focused': 'Language Study',
  fluency: 'Fluency',
};

/**
 * Full display names for strands
 */
export const STRAND_FULL_NAMES: Record<LearningStrand, string> = {
  'meaning-input': 'Meaning-Focused Input',
  'meaning-output': 'Meaning-Focused Output',
  'language-focused': 'Language-Focused Learning',
  fluency: 'Fluency Development',
};

/**
 * Descriptions for each strand
 */
export const STRAND_DESCRIPTIONS: Record<LearningStrand, string> = {
  'meaning-input': 'Learning through reading and listening',
  'meaning-output': 'Learning through speaking and writing',
  'language-focused': 'Deliberate study of vocabulary and grammar',
  fluency: 'Getting fast and automatic with known material',
};

/**
 * Colors for each strand (CSS variable names)
 */
export const STRAND_COLORS: Record<LearningStrand, string> = {
  'meaning-input': 'var(--color-gold)',
  'meaning-output': 'var(--color-error)',
  'language-focused': 'var(--color-success)',
  fluency: 'var(--color-primary)',
};

/**
 * Target percentage for each strand (balanced = 25% each)
 */
export const TARGET_STRAND_PERCENT = 25;

/**
 * Maximum sessions to store (older sessions are removed)
 */
export const MAX_STORED_SESSIONS = 500;

/**
 * Minimum session duration to count (in ms) - filter out very short sessions
 */
export const MIN_SESSION_DURATION_MS = 5000; // 5 seconds
