/**
 * Vocabulary Size Estimation Types
 *
 * Based on Paul Nation's research on vocabulary size requirements:
 * - 120 word families: Basic tourist survival
 * - 2,000 word families: Basic conversation
 * - 3,000 word families: General listening
 * - 5,000 word families: Basic reading
 * - 6,000-7,000 word families: Movies/TV understanding
 * - 8,000-9,000 word families: Reading novels
 * - 10,000+ word families: Native-like reading
 *
 * Note: These are for English; Arabic may differ due to root-based morphology.
 * Arabic learners benefit from knowing roots, as ~3-letter roots generate
 * many derived words.
 */

/**
 * Proficiency level based on vocabulary size
 */
export type VocabProficiencyLevel =
  | 'absolute-beginner' // < 50 words
  | 'beginner' // 50-200 words
  | 'elementary' // 200-500 words
  | 'pre-intermediate' // 500-1000 words
  | 'intermediate' // 1000-2000 words
  | 'upper-intermediate' // 2000-4000 words
  | 'advanced' // 4000-6000 words
  | 'proficient' // 6000-9000 words
  | 'near-native'; // 9000+ words

/**
 * Benchmark thresholds for vocabulary size (word count)
 */
export interface VocabBenchmarks {
  absoluteBeginner: number;
  beginner: number;
  elementary: number;
  preIntermediate: number;
  intermediate: number;
  upperIntermediate: number;
  advanced: number;
  proficient: number;
  nearNative: number;
}

/**
 * What a vocabulary size enables
 */
export interface VocabMilestone {
  /** Vocabulary size threshold */
  wordCount: number;
  /** Level name */
  level: VocabProficiencyLevel;
  /** What this enables */
  capability: string;
  /** Coverage of typical texts */
  textCoverage: string;
}

/**
 * Performance data for estimation
 */
export interface VocabPerformanceData {
  /** Total words tested */
  wordsTested: number;
  /** Words correctly identified/produced */
  wordsKnown: number;
  /** Words from high-frequency band (1-2000) tested */
  highFreqTested: number;
  /** Words from high-frequency band known */
  highFreqKnown: number;
  /** Words from mid-frequency band (2001-6000) tested */
  midFreqTested: number;
  /** Words from mid-frequency band known */
  midFreqKnown: number;
  /** Words from low-frequency band (6001+) tested */
  lowFreqTested: number;
  /** Words from low-frequency band known */
  lowFreqKnown: number;
  /** Unique roots encountered */
  rootsEncountered: number;
  /** Roots where at least one word is known */
  rootsKnown: number;
}

/**
 * Vocabulary size estimation result
 */
export interface VocabSizeEstimate {
  /** Estimated total vocabulary size */
  estimatedSize: number;
  /** Confidence level of estimate (0-1) */
  confidence: number;
  /** Proficiency level */
  level: VocabProficiencyLevel;
  /** Range (min-max) */
  range: {
    min: number;
    max: number;
  };
  /** Next milestone to reach */
  nextMilestone: VocabMilestone | null;
  /** Words needed to reach next milestone */
  wordsToNextMilestone: number;
  /** Performance breakdown by frequency band */
  byFrequencyBand: {
    highFreq: { tested: number; known: number; percent: number };
    midFreq: { tested: number; known: number; percent: number };
    lowFreq: { tested: number; known: number; percent: number };
  };
  /** Root knowledge stats */
  rootStats: {
    encountered: number;
    known: number;
    percent: number;
  };
}

/**
 * Summary for UI display
 */
export interface VocabSizeSummary {
  /** Estimated vocabulary size */
  estimatedSize: number;
  /** Level label for display */
  levelLabel: string;
  /** What this enables */
  capability: string;
  /** Progress to next level (0-100) */
  progressToNext: number;
  /** Next level name */
  nextLevelLabel: string;
  /** Words to next level */
  wordsToNext: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Vocabulary size thresholds for each level (Arabic-adjusted)
 */
export const VOCAB_BENCHMARKS: VocabBenchmarks = {
  absoluteBeginner: 50,
  beginner: 200,
  elementary: 500,
  preIntermediate: 1000,
  intermediate: 2000,
  upperIntermediate: 4000,
  advanced: 6000,
  proficient: 9000,
  nearNative: 12000,
};

/**
 * Level labels for display
 */
export const VOCAB_LEVEL_LABELS: Record<VocabProficiencyLevel, string> = {
  'absolute-beginner': 'Absolute Beginner',
  beginner: 'Beginner',
  elementary: 'Elementary',
  'pre-intermediate': 'Pre-Intermediate',
  intermediate: 'Intermediate',
  'upper-intermediate': 'Upper Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
  'near-native': 'Near-Native',
};

/**
 * Capabilities unlocked at each level
 */
export const VOCAB_CAPABILITIES: Record<VocabProficiencyLevel, string> = {
  'absolute-beginner': 'Basic greetings and common phrases',
  beginner: 'Simple survival situations and basic questions',
  elementary: 'Everyday conversations on familiar topics',
  'pre-intermediate': 'Describe experiences and explain simple concepts',
  intermediate: 'General reading and casual conversation',
  'upper-intermediate': 'Follow news, movies, and complex discussions',
  advanced: 'Read literature and engage in academic discourse',
  proficient: 'Understand nuanced language and cultural references',
  'near-native': 'Full fluency with rare words and idioms',
};

/**
 * Text coverage at each vocabulary level (approximate)
 */
export const VOCAB_TEXT_COVERAGE: Record<VocabProficiencyLevel, string> = {
  'absolute-beginner': '~50% of basic texts',
  beginner: '~70% of basic texts',
  elementary: '~80% of everyday texts',
  'pre-intermediate': '~85% of everyday texts',
  intermediate: '~90% of general texts',
  'upper-intermediate': '~95% of general texts',
  advanced: '~97% of academic texts',
  proficient: '~98% of all texts',
  'near-native': '~99%+ of all texts',
};

/**
 * All milestones in order
 */
export const VOCAB_MILESTONES: VocabMilestone[] = [
  {
    wordCount: VOCAB_BENCHMARKS.absoluteBeginner,
    level: 'absolute-beginner',
    capability: VOCAB_CAPABILITIES['absolute-beginner'],
    textCoverage: VOCAB_TEXT_COVERAGE['absolute-beginner'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.beginner,
    level: 'beginner',
    capability: VOCAB_CAPABILITIES['beginner'],
    textCoverage: VOCAB_TEXT_COVERAGE['beginner'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.elementary,
    level: 'elementary',
    capability: VOCAB_CAPABILITIES['elementary'],
    textCoverage: VOCAB_TEXT_COVERAGE['elementary'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.preIntermediate,
    level: 'pre-intermediate',
    capability: VOCAB_CAPABILITIES['pre-intermediate'],
    textCoverage: VOCAB_TEXT_COVERAGE['pre-intermediate'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.intermediate,
    level: 'intermediate',
    capability: VOCAB_CAPABILITIES['intermediate'],
    textCoverage: VOCAB_TEXT_COVERAGE['intermediate'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.upperIntermediate,
    level: 'upper-intermediate',
    capability: VOCAB_CAPABILITIES['upper-intermediate'],
    textCoverage: VOCAB_TEXT_COVERAGE['upper-intermediate'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.advanced,
    level: 'advanced',
    capability: VOCAB_CAPABILITIES['advanced'],
    textCoverage: VOCAB_TEXT_COVERAGE['advanced'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.proficient,
    level: 'proficient',
    capability: VOCAB_CAPABILITIES['proficient'],
    textCoverage: VOCAB_TEXT_COVERAGE['proficient'],
  },
  {
    wordCount: VOCAB_BENCHMARKS.nearNative,
    level: 'near-native',
    capability: VOCAB_CAPABILITIES['near-native'],
    textCoverage: VOCAB_TEXT_COVERAGE['near-native'],
  },
];

/**
 * Minimum words tested for reliable estimation
 */
export const MIN_WORDS_FOR_ESTIMATE = 20;

/**
 * Minimum confidence threshold for display
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.3;
