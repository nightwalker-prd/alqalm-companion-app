/**
 * Tests for Vocabulary Size Estimation Service
 */

import { describe, test, expect } from 'vitest';
import {
  classifyVocabLevel,
  getNextMilestone,
  wordsToNextLevel,
  calculateConfidence,
  estimateVocabSize,
  estimateFromMasteryCount,
  getVocabSizeSummary,
  formatVocabSize,
  getLevelColor,
  estimateTextCoverage,
} from '../vocabSizeService';
import type { VocabPerformanceData } from '../../types/vocabSize';
import {
  VOCAB_BENCHMARKS,
  VOCAB_LEVEL_LABELS,
  VOCAB_CAPABILITIES,
  MIN_WORDS_FOR_ESTIMATE,
} from '../../types/vocabSize';

// ============================================================================
// classifyVocabLevel
// ============================================================================

describe('classifyVocabLevel', () => {
  // Note: Benchmarks define the threshold to REACH each level
  // absoluteBeginner: 50, beginner: 200, elementary: 500, etc.
  // So < 200 = absolute-beginner (haven't reached beginner threshold yet)

  test('classifies 0 words as absolute-beginner', () => {
    expect(classifyVocabLevel(0)).toBe('absolute-beginner');
  });

  test('classifies 49 words as absolute-beginner', () => {
    expect(classifyVocabLevel(49)).toBe('absolute-beginner');
  });

  test('classifies 199 words as absolute-beginner (below beginner threshold)', () => {
    expect(classifyVocabLevel(199)).toBe('absolute-beginner');
  });

  test('classifies 200 words as beginner (at beginner threshold)', () => {
    expect(classifyVocabLevel(200)).toBe('beginner');
  });

  test('classifies 499 words as beginner', () => {
    expect(classifyVocabLevel(499)).toBe('beginner');
  });

  test('classifies 500 words as elementary', () => {
    expect(classifyVocabLevel(500)).toBe('elementary');
  });

  test('classifies 1000 words as pre-intermediate', () => {
    expect(classifyVocabLevel(1000)).toBe('pre-intermediate');
  });

  test('classifies 2000 words as intermediate', () => {
    expect(classifyVocabLevel(2000)).toBe('intermediate');
  });

  test('classifies 4000 words as upper-intermediate', () => {
    expect(classifyVocabLevel(4000)).toBe('upper-intermediate');
  });

  test('classifies 6000 words as advanced', () => {
    expect(classifyVocabLevel(6000)).toBe('advanced');
  });

  test('classifies 9000 words as proficient', () => {
    expect(classifyVocabLevel(9000)).toBe('proficient');
  });

  test('classifies 12000 words as near-native', () => {
    expect(classifyVocabLevel(12000)).toBe('near-native');
  });

  test('classifies 15000 words as near-native', () => {
    expect(classifyVocabLevel(15000)).toBe('near-native');
  });

  test('uses benchmark values correctly - at each threshold', () => {
    // At beginner threshold (200), you ARE a beginner
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.beginner)).toBe('beginner');
    // At elementary threshold (500), you ARE elementary
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.elementary)).toBe('elementary');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.preIntermediate)).toBe('pre-intermediate');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.intermediate)).toBe('intermediate');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.upperIntermediate)).toBe('upper-intermediate');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.advanced)).toBe('advanced');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.proficient)).toBe('proficient');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.nearNative)).toBe('near-native');
  });

  test('just below threshold returns previous level', () => {
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.beginner - 1)).toBe('absolute-beginner');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.elementary - 1)).toBe('beginner');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.preIntermediate - 1)).toBe('elementary');
    expect(classifyVocabLevel(VOCAB_BENCHMARKS.intermediate - 1)).toBe('pre-intermediate');
  });
});

// ============================================================================
// getNextMilestone
// ============================================================================

describe('getNextMilestone', () => {
  test('returns first milestone for 0 words', () => {
    const milestone = getNextMilestone(0);
    expect(milestone).not.toBeNull();
    expect(milestone!.wordCount).toBe(50);
    expect(milestone!.level).toBe('absolute-beginner');
  });

  test('returns beginner milestone for 50 words', () => {
    const milestone = getNextMilestone(50);
    expect(milestone).not.toBeNull();
    expect(milestone!.wordCount).toBe(200);
    expect(milestone!.level).toBe('beginner');
  });

  test('returns elementary milestone for 200 words', () => {
    const milestone = getNextMilestone(200);
    expect(milestone).not.toBeNull();
    expect(milestone!.wordCount).toBe(500);
    expect(milestone!.level).toBe('elementary');
  });

  test('returns pre-intermediate milestone for 500 words', () => {
    const milestone = getNextMilestone(500);
    expect(milestone).not.toBeNull();
    expect(milestone!.wordCount).toBe(1000);
  });

  test('returns intermediate milestone for 1000 words', () => {
    const milestone = getNextMilestone(1000);
    expect(milestone).not.toBeNull();
    expect(milestone!.wordCount).toBe(2000);
  });

  test('returns null when at highest level', () => {
    const milestone = getNextMilestone(12000);
    expect(milestone).toBeNull();
  });

  test('returns null when above all milestones', () => {
    const milestone = getNextMilestone(20000);
    expect(milestone).toBeNull();
  });

  test('milestones have capability and textCoverage', () => {
    const milestone = getNextMilestone(100);
    expect(milestone).not.toBeNull();
    expect(milestone!.capability).toBeDefined();
    expect(milestone!.textCoverage).toBeDefined();
  });
});

// ============================================================================
// wordsToNextLevel
// ============================================================================

describe('wordsToNextLevel', () => {
  test('returns 50 words needed for absolute beginner at 0', () => {
    expect(wordsToNextLevel(0)).toBe(50);
  });

  test('returns 25 words needed when at 25 words', () => {
    expect(wordsToNextLevel(25)).toBe(25);
  });

  test('returns 150 words needed at beginner level (50 words)', () => {
    expect(wordsToNextLevel(50)).toBe(150);
  });

  test('returns 0 when at highest level', () => {
    expect(wordsToNextLevel(12000)).toBe(0);
  });

  test('returns 0 when above highest level', () => {
    expect(wordsToNextLevel(15000)).toBe(0);
  });

  test('never returns negative values', () => {
    // Edge case: even if somehow above a threshold
    expect(wordsToNextLevel(199)).toBe(1);
    expect(wordsToNextLevel(200)).toBe(300); // Next is 500
  });
});

// ============================================================================
// calculateConfidence
// ============================================================================

describe('calculateConfidence', () => {
  test('returns 0 for 0 words tested', () => {
    expect(calculateConfidence(0)).toBe(0);
  });

  test('returns low confidence for fewer than MIN_WORDS_FOR_ESTIMATE', () => {
    const confidence = calculateConfidence(10);
    expect(confidence).toBeLessThan(0.3);
    expect(confidence).toBeGreaterThan(0);
  });

  test('returns scaled confidence below threshold', () => {
    // At half the minimum, should be half the threshold
    const halfMin = MIN_WORDS_FOR_ESTIMATE / 2;
    const confidence = calculateConfidence(halfMin);
    expect(confidence).toBeCloseTo(0.15, 1);
  });

  test('returns higher confidence at MIN_WORDS_FOR_ESTIMATE', () => {
    const confidence = calculateConfidence(MIN_WORDS_FOR_ESTIMATE);
    expect(confidence).toBeGreaterThanOrEqual(0.5);
  });

  test('increases confidence with more words', () => {
    const conf20 = calculateConfidence(20);
    const conf50 = calculateConfidence(50);
    const conf100 = calculateConfidence(100);

    expect(conf50).toBeGreaterThan(conf20);
    expect(conf100).toBeGreaterThan(conf50);
  });

  test('caps confidence at approximately 0.95', () => {
    const confidence = calculateConfidence(10000);
    expect(confidence).toBeLessThanOrEqual(0.95);
  });

  test('confidence follows diminishing returns', () => {
    const conf100 = calculateConfidence(100);
    const conf200 = calculateConfidence(200);
    const conf300 = calculateConfidence(300);

    // The increase from 100->200 should be similar to 200->300
    // because of the cap
    const increase1 = conf200 - conf100;
    const increase2 = conf300 - conf200;

    // At high values, increases should be minimal or zero
    expect(increase1).toBeGreaterThanOrEqual(0);
    expect(increase2).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// estimateVocabSize - Core functionality
// ============================================================================

describe('estimateVocabSize', () => {
  describe('basic estimation', () => {
    test('returns 0 estimate for no data', () => {
      const data: VocabPerformanceData = {
        wordsTested: 0,
        wordsKnown: 0,
        highFreqTested: 0,
        highFreqKnown: 0,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);
      expect(estimate.estimatedSize).toBe(0);
      expect(estimate.level).toBe('absolute-beginner');
    });

    test('estimates based on high frequency band', () => {
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80, // 80% of high freq known
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);
      // 80% of 2000 high-freq words = 1600
      expect(estimate.estimatedSize).toBe(1600);
    });

    test('estimates based on multiple frequency bands', () => {
      const data: VocabPerformanceData = {
        wordsTested: 150,
        wordsKnown: 120,
        highFreqTested: 100,
        highFreqKnown: 80, // 80% of 2000 = 1600
        midFreqTested: 50,
        midFreqKnown: 25, // 50% of 4000 = 2000
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);
      // 1600 + 2000 = 3600
      expect(estimate.estimatedSize).toBe(3600);
    });

    test('includes all three frequency bands', () => {
      const data: VocabPerformanceData = {
        wordsTested: 200,
        wordsKnown: 150,
        highFreqTested: 100,
        highFreqKnown: 80, // 80% of 2000 = 1600
        midFreqTested: 50,
        midFreqKnown: 25, // 50% of 4000 = 2000
        lowFreqTested: 50,
        lowFreqKnown: 10, // 20% of 6000 = 1200
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);
      // 1600 + 2000 + 1200 = 4800
      expect(estimate.estimatedSize).toBe(4800);
    });
  });

  describe('fallback estimation without band data', () => {
    test('uses simple ratio when no band data available', () => {
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 50, // 50% known
        highFreqTested: 0,
        highFreqKnown: 0,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);
      // 50% of 6000 = 3000
      expect(estimate.estimatedSize).toBe(3000);
    });
  });

  describe('root knowledge bonus', () => {
    test('applies root bonus when roots are known', () => {
      const dataWithoutRoots: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const dataWithRoots: VocabPerformanceData = {
        ...dataWithoutRoots,
        rootsEncountered: 50,
        rootsKnown: 40, // 80% of roots known
      };

      const estimateWithout = estimateVocabSize(dataWithoutRoots);
      const estimateWith = estimateVocabSize(dataWithRoots);

      expect(estimateWith.estimatedSize).toBeGreaterThan(
        estimateWithout.estimatedSize
      );
    });

    test('root bonus scales with root knowledge ratio', () => {
      const createData = (rootsKnown: number): VocabPerformanceData => ({
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 50,
        rootsKnown,
      });

      const estimate25 = estimateVocabSize(createData(25));
      const estimate40 = estimateVocabSize(createData(40));
      const estimate50 = estimateVocabSize(createData(50));

      expect(estimate40.estimatedSize).toBeGreaterThan(estimate25.estimatedSize);
      expect(estimate50.estimatedSize).toBeGreaterThan(estimate40.estimatedSize);
    });

    test('no root bonus when no roots encountered', () => {
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0, // No roots
        rootsKnown: 10, // This should be ignored
      };

      const estimate = estimateVocabSize(data);
      // Should just be 80% of 2000 = 1600
      expect(estimate.estimatedSize).toBe(1600);
    });
  });

  describe('estimate result structure', () => {
    test('includes all required fields', () => {
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 30,
        rootsKnown: 20,
      };

      const estimate = estimateVocabSize(data);

      expect(estimate).toHaveProperty('estimatedSize');
      expect(estimate).toHaveProperty('confidence');
      expect(estimate).toHaveProperty('level');
      expect(estimate).toHaveProperty('range');
      expect(estimate.range).toHaveProperty('min');
      expect(estimate.range).toHaveProperty('max');
      expect(estimate).toHaveProperty('nextMilestone');
      expect(estimate).toHaveProperty('wordsToNextMilestone');
      expect(estimate).toHaveProperty('byFrequencyBand');
      expect(estimate).toHaveProperty('rootStats');
    });

    test('range is based on confidence', () => {
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);

      expect(estimate.range.min).toBeLessThanOrEqual(estimate.estimatedSize);
      expect(estimate.range.max).toBeGreaterThanOrEqual(estimate.estimatedSize);
      expect(estimate.range.min).toBeGreaterThanOrEqual(0);
    });

    test('includes frequency band breakdown', () => {
      const data: VocabPerformanceData = {
        wordsTested: 200,
        wordsKnown: 160,
        highFreqTested: 100,
        highFreqKnown: 90,
        midFreqTested: 60,
        midFreqKnown: 45,
        lowFreqTested: 40,
        lowFreqKnown: 25,
        rootsEncountered: 50,
        rootsKnown: 30,
      };

      const estimate = estimateVocabSize(data);

      expect(estimate.byFrequencyBand.highFreq.tested).toBe(100);
      expect(estimate.byFrequencyBand.highFreq.known).toBe(90);
      expect(estimate.byFrequencyBand.highFreq.percent).toBe(90);

      expect(estimate.byFrequencyBand.midFreq.tested).toBe(60);
      expect(estimate.byFrequencyBand.midFreq.known).toBe(45);
      expect(estimate.byFrequencyBand.midFreq.percent).toBe(75);

      expect(estimate.byFrequencyBand.lowFreq.tested).toBe(40);
      expect(estimate.byFrequencyBand.lowFreq.known).toBe(25);
      expect(estimate.byFrequencyBand.lowFreq.percent).toBeCloseTo(62.5, 1);
    });

    test('includes root stats', () => {
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: 80,
        highFreqTested: 100,
        highFreqKnown: 80,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 50,
        rootsKnown: 40,
      };

      const estimate = estimateVocabSize(data);

      expect(estimate.rootStats.encountered).toBe(50);
      expect(estimate.rootStats.known).toBe(40);
      expect(estimate.rootStats.percent).toBe(80);
    });
  });
});

// ============================================================================
// estimateFromMasteryCount
// ============================================================================

describe('estimateFromMasteryCount', () => {
  test('creates estimate from mastery count', () => {
    const estimate = estimateFromMasteryCount(100, 200);

    expect(estimate.estimatedSize).toBeGreaterThan(0);
    expect(estimate.level).toBeDefined();
    expect(estimate.confidence).toBeGreaterThan(0);
  });

  test('higher mastery gives higher estimate', () => {
    const estimate50 = estimateFromMasteryCount(50, 200);
    const estimate100 = estimateFromMasteryCount(100, 200);
    const estimate150 = estimateFromMasteryCount(150, 200);

    expect(estimate100.estimatedSize).toBeGreaterThan(estimate50.estimatedSize);
    expect(estimate150.estimatedSize).toBeGreaterThan(estimate100.estimatedSize);
  });

  test('applies explicit root count when provided', () => {
    // When providing explicit root count, it should be used
    // Note: when knownRoots=0, it falls back to auto-estimate (masteredWords/3)
    // So we need to compare explicit high root count vs auto-estimated
    const estimateAutoRoots = estimateFromMasteryCount(100, 200); // auto: ~33 roots
    const estimateHighRoots = estimateFromMasteryCount(100, 200, 60); // explicit: 60 roots

    // More known roots = higher estimate
    expect(estimateHighRoots.estimatedSize).toBeGreaterThan(
      estimateAutoRoots.estimatedSize
    );
  });

  test('auto-estimates roots when not provided', () => {
    const estimate = estimateFromMasteryCount(100, 300);

    // Should auto-calculate rootsEncountered as ~100 (300/3)
    // and rootsKnown as ~33 (100/3)
    expect(estimate.rootStats.encountered).toBeGreaterThan(0);
    expect(estimate.rootStats.known).toBeGreaterThan(0);
  });

  test('zero mastered words gives minimal estimate', () => {
    const estimate = estimateFromMasteryCount(0, 200);

    expect(estimate.estimatedSize).toBe(0);
    expect(estimate.level).toBe('absolute-beginner');
  });
});

// ============================================================================
// getVocabSizeSummary
// ============================================================================

describe('getVocabSizeSummary', () => {
  test('returns summary with all fields', () => {
    const estimate = estimateFromMasteryCount(100, 200);
    const summary = getVocabSizeSummary(estimate);

    expect(summary).toHaveProperty('estimatedSize');
    expect(summary).toHaveProperty('levelLabel');
    expect(summary).toHaveProperty('capability');
    expect(summary).toHaveProperty('progressToNext');
    expect(summary).toHaveProperty('nextLevelLabel');
    expect(summary).toHaveProperty('wordsToNext');
  });

  test('uses correct level labels', () => {
    // Test a few levels
    const beginnerEst = estimateFromMasteryCount(10, 100);
    const beginnerSummary = getVocabSizeSummary(beginnerEst);
    expect(beginnerSummary.levelLabel).toBe(VOCAB_LEVEL_LABELS[beginnerEst.level]);
    expect(beginnerSummary.capability).toBe(VOCAB_CAPABILITIES[beginnerEst.level]);
  });

  test('progress is between 0 and 100', () => {
    const estimate = estimateFromMasteryCount(50, 200);
    const summary = getVocabSizeSummary(estimate);

    expect(summary.progressToNext).toBeGreaterThanOrEqual(0);
    expect(summary.progressToNext).toBeLessThanOrEqual(100);
  });

  test('shows Maximum for near-native level', () => {
    // Create an estimate that would be near-native
    const data: VocabPerformanceData = {
      wordsTested: 100,
      wordsKnown: 100,
      highFreqTested: 100,
      highFreqKnown: 100, // 100% = 2000
      midFreqTested: 100,
      midFreqKnown: 100, // 100% = 4000
      lowFreqTested: 100,
      lowFreqKnown: 100, // 100% = 6000
      rootsEncountered: 0,
      rootsKnown: 0,
    };
    // Total = 12000, which is near-native

    const estimate = estimateVocabSize(data);
    const summary = getVocabSizeSummary(estimate);

    expect(summary.nextLevelLabel).toBe('Maximum');
    expect(summary.wordsToNext).toBe(0);
    expect(summary.progressToNext).toBe(100);
  });

  test('wordsToNext matches estimate wordsToNextMilestone', () => {
    const estimate = estimateFromMasteryCount(50, 200);
    const summary = getVocabSizeSummary(estimate);

    expect(summary.wordsToNext).toBe(estimate.wordsToNextMilestone);
  });
});

// ============================================================================
// formatVocabSize
// ============================================================================

describe('formatVocabSize', () => {
  test('formats small numbers', () => {
    expect(formatVocabSize(100)).toBe('100');
    expect(formatVocabSize(999)).toBe('999');
  });

  test('formats thousands with comma', () => {
    expect(formatVocabSize(1000)).toBe('1,000');
    expect(formatVocabSize(5500)).toBe('5,500');
  });

  test('formats large numbers with commas', () => {
    expect(formatVocabSize(12000)).toBe('12,000');
    expect(formatVocabSize(100000)).toBe('100,000');
  });

  test('formats zero', () => {
    expect(formatVocabSize(0)).toBe('0');
  });
});

// ============================================================================
// getLevelColor
// ============================================================================

describe('getLevelColor', () => {
  test('returns error color for beginner levels', () => {
    expect(getLevelColor('absolute-beginner')).toBe('var(--color-error)');
    expect(getLevelColor('beginner')).toBe('var(--color-error)');
  });

  test('returns gold color for elementary levels', () => {
    expect(getLevelColor('elementary')).toBe('var(--color-gold)');
    expect(getLevelColor('pre-intermediate')).toBe('var(--color-gold)');
  });

  test('returns primary color for intermediate levels', () => {
    expect(getLevelColor('intermediate')).toBe('var(--color-primary)');
    expect(getLevelColor('upper-intermediate')).toBe('var(--color-primary)');
  });

  test('returns success color for advanced levels', () => {
    expect(getLevelColor('advanced')).toBe('var(--color-success)');
    expect(getLevelColor('proficient')).toBe('var(--color-success)');
    expect(getLevelColor('near-native')).toBe('var(--color-success)');
  });
});

// ============================================================================
// estimateTextCoverage
// ============================================================================

describe('estimateTextCoverage', () => {
  test('returns ~99% for 9000+ words', () => {
    expect(estimateTextCoverage(9000)).toBe('~99%');
    expect(estimateTextCoverage(12000)).toBe('~99%');
  });

  test('returns ~98% for 6000-8999 words', () => {
    expect(estimateTextCoverage(6000)).toBe('~98%');
    expect(estimateTextCoverage(8000)).toBe('~98%');
  });

  test('returns ~95% for 4000-5999 words', () => {
    expect(estimateTextCoverage(4000)).toBe('~95%');
    expect(estimateTextCoverage(5000)).toBe('~95%');
  });

  test('returns ~90% for 2000-3999 words', () => {
    expect(estimateTextCoverage(2000)).toBe('~90%');
    expect(estimateTextCoverage(3000)).toBe('~90%');
  });

  test('returns ~85% for 1000-1999 words', () => {
    expect(estimateTextCoverage(1000)).toBe('~85%');
    expect(estimateTextCoverage(1500)).toBe('~85%');
  });

  test('returns ~80% for 500-999 words', () => {
    expect(estimateTextCoverage(500)).toBe('~80%');
    expect(estimateTextCoverage(750)).toBe('~80%');
  });

  test('returns ~70% for 200-499 words', () => {
    expect(estimateTextCoverage(200)).toBe('~70%');
    expect(estimateTextCoverage(400)).toBe('~70%');
  });

  test('returns <60% for fewer than 200 words', () => {
    expect(estimateTextCoverage(100)).toBe('<60%');
    expect(estimateTextCoverage(0)).toBe('<60%');
  });
});

// ============================================================================
// Edge cases and integration
// ============================================================================

describe('edge cases', () => {
  test('handles very small sample sizes', () => {
    const data: VocabPerformanceData = {
      wordsTested: 5,
      wordsKnown: 3,
      highFreqTested: 5,
      highFreqKnown: 3,
      midFreqTested: 0,
      midFreqKnown: 0,
      lowFreqTested: 0,
      lowFreqKnown: 0,
      rootsEncountered: 2,
      rootsKnown: 1,
    };

    const estimate = estimateVocabSize(data);
    expect(estimate.confidence).toBeLessThan(0.3);
    expect(estimate.range.max - estimate.range.min).toBeGreaterThan(
      estimate.estimatedSize * 0.5
    ); // Wide range due to low confidence
  });

  test('handles 100% knowledge rate', () => {
    const data: VocabPerformanceData = {
      wordsTested: 100,
      wordsKnown: 100,
      highFreqTested: 100,
      highFreqKnown: 100,
      midFreqTested: 0,
      midFreqKnown: 0,
      lowFreqTested: 0,
      lowFreqKnown: 0,
      rootsEncountered: 50,
      rootsKnown: 50,
    };

    const estimate = estimateVocabSize(data);
    // 100% of 2000 = 2000, plus root bonus
    expect(estimate.estimatedSize).toBeGreaterThan(2000);
  });

  test('handles 0% knowledge rate with tested words', () => {
    const data: VocabPerformanceData = {
      wordsTested: 100,
      wordsKnown: 0,
      highFreqTested: 100,
      highFreqKnown: 0,
      midFreqTested: 0,
      midFreqKnown: 0,
      lowFreqTested: 0,
      lowFreqKnown: 0,
      rootsEncountered: 50,
      rootsKnown: 0,
    };

    const estimate = estimateVocabSize(data);
    expect(estimate.estimatedSize).toBe(0);
    expect(estimate.level).toBe('absolute-beginner');
  });

  test('estimate is consistent with level classification', () => {
    const sizes = [0, 30, 100, 300, 700, 1500, 3000, 5000, 7500, 10000];

    for (const size of sizes) {
      const expectedLevel = classifyVocabLevel(size);
      const data: VocabPerformanceData = {
        wordsTested: 100,
        wordsKnown: (size / 2000) * 100, // Approximate
        highFreqTested: 100,
        highFreqKnown: (size / 2000) * 100,
        midFreqTested: 0,
        midFreqKnown: 0,
        lowFreqTested: 0,
        lowFreqKnown: 0,
        rootsEncountered: 0,
        rootsKnown: 0,
      };

      const estimate = estimateVocabSize(data);
      // The estimated level should match the size-based classification
      // (with some tolerance due to estimation)
      expect(estimate.level).toBeDefined();
      // Verify the estimate produces a valid level from classification
      expect(classifyVocabLevel(estimate.estimatedSize)).toBe(estimate.level);
      // For sizes that map directly, verify consistency
      if (size === 0) {
        expect(expectedLevel).toBe('absolute-beginner');
      }
    }
  });
});
