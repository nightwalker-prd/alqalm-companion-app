/**
 * Vocabulary Size Estimation Service
 *
 * Estimates a learner's vocabulary size based on their performance data.
 * Uses frequency-band sampling to extrapolate total vocabulary.
 *
 * Method:
 * 1. Calculate known percentage in each frequency band
 * 2. Apply diminishing returns as frequency increases
 * 3. Extrapolate to estimate total vocabulary
 * 4. Adjust for root knowledge (Arabic-specific boost)
 */

import type {
  VocabProficiencyLevel,
  VocabPerformanceData,
  VocabSizeEstimate,
  VocabMilestone,
  VocabSizeSummary,
} from '../types/vocabSize';

import {
  VOCAB_BENCHMARKS,
  VOCAB_MILESTONES,
  VOCAB_LEVEL_LABELS,
  VOCAB_CAPABILITIES,
  MIN_WORDS_FOR_ESTIMATE,
  MIN_CONFIDENCE_THRESHOLD,
} from '../types/vocabSize';

// ============================================================================
// Frequency Band Constants
// ============================================================================

/**
 * Size of each frequency band (for extrapolation)
 */
const FREQUENCY_BAND_SIZES = {
  high: 2000, // Words 1-2000
  mid: 4000, // Words 2001-6000
  low: 6000, // Words 6001-12000 (conservative estimate)
};

/**
 * Weight factor for root knowledge bonus
 * Arabic speakers knowing a root typically know 2-5 derived words
 */
const ROOT_MULTIPLIER = 2.5;

// ============================================================================
// Level Classification
// ============================================================================

/**
 * Determine proficiency level from vocabulary size
 */
export function classifyVocabLevel(vocabSize: number): VocabProficiencyLevel {
  if (vocabSize >= VOCAB_BENCHMARKS.nearNative) return 'near-native';
  if (vocabSize >= VOCAB_BENCHMARKS.proficient) return 'proficient';
  if (vocabSize >= VOCAB_BENCHMARKS.advanced) return 'advanced';
  if (vocabSize >= VOCAB_BENCHMARKS.upperIntermediate) return 'upper-intermediate';
  if (vocabSize >= VOCAB_BENCHMARKS.intermediate) return 'intermediate';
  if (vocabSize >= VOCAB_BENCHMARKS.preIntermediate) return 'pre-intermediate';
  if (vocabSize >= VOCAB_BENCHMARKS.elementary) return 'elementary';
  if (vocabSize >= VOCAB_BENCHMARKS.beginner) return 'beginner';
  return 'absolute-beginner';
}

/**
 * Get the next milestone for a given vocabulary size
 */
export function getNextMilestone(vocabSize: number): VocabMilestone | null {
  for (const milestone of VOCAB_MILESTONES) {
    if (vocabSize < milestone.wordCount) {
      return milestone;
    }
  }
  return null; // Already at highest level
}

/**
 * Calculate words needed to reach next milestone
 */
export function wordsToNextLevel(vocabSize: number): number {
  const next = getNextMilestone(vocabSize);
  if (!next) return 0;
  return Math.max(0, next.wordCount - vocabSize);
}

// ============================================================================
// Estimation Core
// ============================================================================

/**
 * Calculate percentage with safety for zero division
 */
function safePercent(known: number, tested: number): number {
  if (tested === 0) return 0;
  return (known / tested) * 100;
}

/**
 * Calculate confidence based on sample size
 * More words tested = higher confidence
 */
export function calculateConfidence(wordsTested: number): number {
  if (wordsTested < MIN_WORDS_FOR_ESTIMATE) {
    return wordsTested / MIN_WORDS_FOR_ESTIMATE * MIN_CONFIDENCE_THRESHOLD;
  }
  
  // Confidence increases with sample size, caps at ~0.95
  // Using logarithmic scale for diminishing returns
  const normalized = Math.min(wordsTested / 100, 5);
  return Math.min(0.95, 0.5 + (normalized * 0.09));
}

/**
 * Estimate vocabulary in a frequency band based on sample
 */
function estimateBandVocab(
  known: number,
  tested: number,
  bandSize: number
): number {
  if (tested === 0) return 0;
  const knownRatio = known / tested;
  return Math.round(knownRatio * bandSize);
}

/**
 * Apply root knowledge bonus for Arabic
 * Knowing roots helps recognize derived words
 */
function applyRootBonus(
  baseEstimate: number,
  rootsEncountered: number,
  rootsKnown: number
): number {
  if (rootsEncountered === 0) return baseEstimate;
  
  const rootKnowledgeRatio = rootsKnown / rootsEncountered;
  // Bonus is scaled by how many roots are known
  const bonus = rootsKnown * ROOT_MULTIPLIER * rootKnowledgeRatio;
  
  return Math.round(baseEstimate + bonus);
}

/**
 * Estimate vocabulary size from performance data
 */
export function estimateVocabSize(data: VocabPerformanceData): VocabSizeEstimate {
  // Calculate band-level statistics
  const highFreqPercent = safePercent(data.highFreqKnown, data.highFreqTested);
  const midFreqPercent = safePercent(data.midFreqKnown, data.midFreqTested);
  const lowFreqPercent = safePercent(data.lowFreqKnown, data.lowFreqTested);
  
  // Estimate vocabulary in each band
  const highFreqEstimate = estimateBandVocab(
    data.highFreqKnown,
    data.highFreqTested,
    FREQUENCY_BAND_SIZES.high
  );
  const midFreqEstimate = estimateBandVocab(
    data.midFreqKnown,
    data.midFreqTested,
    FREQUENCY_BAND_SIZES.mid
  );
  const lowFreqEstimate = estimateBandVocab(
    data.lowFreqKnown,
    data.lowFreqTested,
    FREQUENCY_BAND_SIZES.low
  );
  
  // Base estimate is sum of band estimates
  let baseEstimate = highFreqEstimate + midFreqEstimate + lowFreqEstimate;
  
  // If we only have overall data (no band breakdown), use simple extrapolation
  if (data.highFreqTested === 0 && data.midFreqTested === 0 && data.lowFreqTested === 0) {
    // Simple ratio-based estimate assuming uniform sampling
    const knownRatio = data.wordsTested > 0 ? data.wordsKnown / data.wordsTested : 0;
    // Assume course covers ~500 words from a potential 6000+ vocabulary
    baseEstimate = Math.round(knownRatio * 6000);
  }
  
  // Apply root knowledge bonus
  const adjustedEstimate = applyRootBonus(
    baseEstimate,
    data.rootsEncountered,
    data.rootsKnown
  );
  
  // Calculate confidence
  const confidence = calculateConfidence(data.wordsTested);
  
  // Calculate range based on confidence
  const margin = adjustedEstimate * (1 - confidence);
  const range = {
    min: Math.max(0, Math.round(adjustedEstimate - margin)),
    max: Math.round(adjustedEstimate + margin),
  };
  
  // Determine level and next milestone
  const level = classifyVocabLevel(adjustedEstimate);
  const nextMilestone = getNextMilestone(adjustedEstimate);
  
  return {
    estimatedSize: adjustedEstimate,
    confidence,
    level,
    range,
    nextMilestone,
    wordsToNextMilestone: wordsToNextLevel(adjustedEstimate),
    byFrequencyBand: {
      highFreq: {
        tested: data.highFreqTested,
        known: data.highFreqKnown,
        percent: highFreqPercent,
      },
      midFreq: {
        tested: data.midFreqTested,
        known: data.midFreqKnown,
        percent: midFreqPercent,
      },
      lowFreq: {
        tested: data.lowFreqTested,
        known: data.lowFreqKnown,
        percent: lowFreqPercent,
      },
    },
    rootStats: {
      encountered: data.rootsEncountered,
      known: data.rootsKnown,
      percent: safePercent(data.rootsKnown, data.rootsEncountered),
    },
  };
}

/**
 * Create a simple estimate from basic mastery data
 * Used when full frequency data isn't available
 */
export function estimateFromMasteryCount(
  masteredWords: number,
  totalCourseWords: number,
  knownRoots: number = 0
): VocabSizeEstimate {
  const data: VocabPerformanceData = {
    wordsTested: totalCourseWords,
    wordsKnown: masteredWords,
    highFreqTested: 0,
    highFreqKnown: 0,
    midFreqTested: 0,
    midFreqKnown: 0,
    lowFreqTested: 0,
    lowFreqKnown: 0,
    rootsEncountered: Math.ceil(totalCourseWords / 3), // Rough estimate
    rootsKnown: knownRoots || Math.ceil(masteredWords / 3),
  };
  
  return estimateVocabSize(data);
}

/**
 * Get a user-friendly summary for display
 */
export function getVocabSizeSummary(estimate: VocabSizeEstimate): VocabSizeSummary {
  const levelLabel = VOCAB_LEVEL_LABELS[estimate.level];
  const capability = VOCAB_CAPABILITIES[estimate.level];
  
  // Calculate progress to next level
  let progressToNext = 100;
  let nextLevelLabel = 'Maximum';
  let wordsToNext = 0;
  
  if (estimate.nextMilestone) {
    const currentLevelStart = getCurrentLevelStart(estimate.level);
    const nextLevelStart = estimate.nextMilestone.wordCount;
    const rangeSize = nextLevelStart - currentLevelStart;
    const progress = estimate.estimatedSize - currentLevelStart;
    
    progressToNext = Math.min(100, Math.round((progress / rangeSize) * 100));
    nextLevelLabel = VOCAB_LEVEL_LABELS[estimate.nextMilestone.level];
    wordsToNext = estimate.wordsToNextMilestone;
  }
  
  return {
    estimatedSize: estimate.estimatedSize,
    levelLabel,
    capability,
    progressToNext,
    nextLevelLabel,
    wordsToNext,
  };
}

/**
 * Get the word count threshold for the start of a level
 */
function getCurrentLevelStart(level: VocabProficiencyLevel): number {
  switch (level) {
    case 'absolute-beginner':
      return 0;
    case 'beginner':
      return VOCAB_BENCHMARKS.absoluteBeginner;
    case 'elementary':
      return VOCAB_BENCHMARKS.beginner;
    case 'pre-intermediate':
      return VOCAB_BENCHMARKS.elementary;
    case 'intermediate':
      return VOCAB_BENCHMARKS.preIntermediate;
    case 'upper-intermediate':
      return VOCAB_BENCHMARKS.intermediate;
    case 'advanced':
      return VOCAB_BENCHMARKS.upperIntermediate;
    case 'proficient':
      return VOCAB_BENCHMARKS.advanced;
    case 'near-native':
      return VOCAB_BENCHMARKS.proficient;
  }
}

/**
 * Format vocabulary size for display (with commas)
 */
export function formatVocabSize(size: number): string {
  return size.toLocaleString();
}

/**
 * Get level color for UI display
 */
export function getLevelColor(level: VocabProficiencyLevel): string {
  switch (level) {
    case 'absolute-beginner':
    case 'beginner':
      return 'var(--color-error)';
    case 'elementary':
    case 'pre-intermediate':
      return 'var(--color-gold)';
    case 'intermediate':
    case 'upper-intermediate':
      return 'var(--color-primary)';
    case 'advanced':
    case 'proficient':
    case 'near-native':
      return 'var(--color-success)';
  }
}

/**
 * Get text coverage estimate for a vocabulary size
 */
export function estimateTextCoverage(vocabSize: number): string {
  if (vocabSize >= 9000) return '~99%';
  if (vocabSize >= 6000) return '~98%';
  if (vocabSize >= 4000) return '~95%';
  if (vocabSize >= 2000) return '~90%';
  if (vocabSize >= 1000) return '~85%';
  if (vocabSize >= 500) return '~80%';
  if (vocabSize >= 200) return '~70%';
  return '<60%';
}
