import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  analyzeWeaknesses,
  getWordsForWeakness,
  generateWeaknessPractice,
  hasSignificantWeaknesses,
  getWeaknessSummary,
  getErrorTypeLabel,
  getSeverityColorClass,
  getTrendIcon,
  MAX_TOP_WEAKNESSES,
  RECENT_ERROR_DAYS,
  type Weakness,
} from '../weaknessAnalysis';
import type { WordMastery, ErrorPattern, ArabicErrorType } from '../../types/progress';
import type { WordData } from '../vocabularyAsync';

// Mock the progressService
vi.mock('../progressService', () => ({
  getProgress: vi.fn(),
}));

// Mock the vocabulary module
vi.mock('../vocabularyAsync', () => ({
  getWordById: vi.fn(),
}));

import { getProgress } from '../progressService';
import { getWordById } from '../vocabularyAsync';

const mockGetProgress = getProgress as ReturnType<typeof vi.fn>;
const mockGetWordById = getWordById as ReturnType<typeof vi.fn>;

// Helper to create mock word data
function mockWord(id: string, arabic: string, english: string): WordData {
  return {
    id,
    arabic,
    english,
    root: null,
    lesson: 'b1-l01',
    partOfSpeech: 'noun',
  };
}

// Helper to create mock error pattern
function mockErrorPattern(
  type: ArabicErrorType,
  count: number,
  daysAgo: number = 0,
  examples: Array<{ expected: string; actual: string; exerciseId: string }> = []
): ErrorPattern {
  return {
    type,
    count,
    lastOccurred: Date.now() - (daysAgo * 24 * 60 * 60 * 1000),
    examples,
  };
}

// Helper to create mock mastery with error patterns
function mockMasteryWithErrors(errorPatterns: ErrorPattern[]): WordMastery {
  return {
    strength: 50,
    lastPracticed: new Date().toISOString(),
    timesCorrect: 5,
    timesIncorrect: 3,
    challengesPassed: 0,
    lastChallengeDate: null,
    errorPatterns,
  };
}

describe('weaknessAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeWeaknesses', () => {
    test('returns empty report when no word mastery data exists', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {},
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses).toEqual([]);
      expect(report.totalErrors).toBe(0);
      expect(report.wordsWithErrors).toBe(0);
      expect(report.hasEnoughData).toBe(false);
    });

    test('returns empty report when words have no error patterns', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': { strength: 80, errorPatterns: [] },
          'word2': { strength: 60, errorPatterns: undefined },
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses).toEqual([]);
      expect(report.totalErrors).toBe(0);
      expect(report.wordsWithErrors).toBe(0);
      expect(report.hasEnoughData).toBe(false);
    });

    test('ignores errors below minimum threshold', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('tashkeel_missing', 2), // Below MIN_ERRORS_FOR_WEAKNESS (3)
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses).toEqual([]);
      expect(report.totalErrors).toBe(2);
      expect(report.hasEnoughData).toBe(false);
    });

    test('identifies weakness when errors meet threshold', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('tashkeel_missing', 5, 0, [
              { expected: 'كِتَاب', actual: 'كتاب', exerciseId: 'ex1' },
            ]),
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses.length).toBe(1);
      expect(report.topWeaknesses[0].type).toBe('tashkeel_missing');
      expect(report.topWeaknesses[0].count).toBe(5);
      expect(report.topWeaknesses[0].severity).toBe('moderate');
      expect(report.totalErrors).toBe(5);
      expect(report.hasEnoughData).toBe(true);
    });

    test('aggregates errors from multiple words', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('letter_confusion', 3),
          ]),
          'word2': mockMasteryWithErrors([
            mockErrorPattern('letter_confusion', 4),
          ]),
          'word3': mockMasteryWithErrors([
            mockErrorPattern('letter_confusion', 3),
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses.length).toBe(1);
      expect(report.topWeaknesses[0].type).toBe('letter_confusion');
      expect(report.topWeaknesses[0].count).toBe(10);
      expect(report.topWeaknesses[0].severity).toBe('severe');
      expect(report.topWeaknesses[0].affectedWordIds).toContain('word1');
      expect(report.topWeaknesses[0].affectedWordIds).toContain('word2');
      expect(report.topWeaknesses[0].affectedWordIds).toContain('word3');
      expect(report.wordsWithErrors).toBe(3);
    });

    test('sorts weaknesses by severity then count', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('tashkeel_missing', 12), // severe
            mockErrorPattern('letter_confusion', 6),   // moderate
            mockErrorPattern('typo', 4),               // mild
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses.length).toBe(3);
      expect(report.topWeaknesses[0].type).toBe('tashkeel_missing');
      expect(report.topWeaknesses[0].severity).toBe('severe');
      expect(report.topWeaknesses[1].type).toBe('letter_confusion');
      expect(report.topWeaknesses[1].severity).toBe('moderate');
      expect(report.topWeaknesses[2].type).toBe('typo');
      expect(report.topWeaknesses[2].severity).toBe('mild');
    });

    test('limits to MAX_TOP_WEAKNESSES', () => {
      const errorPatterns: ErrorPattern[] = [];
      const errorTypes: ArabicErrorType[] = [
        'tashkeel_missing', 'tashkeel_wrong', 'letter_confusion',
        'word_order', 'vocabulary_unknown', 'partial_match',
        'spelling_error', 'typo',
      ];
      
      // Create 8 different error types, all with enough errors
      errorTypes.forEach((type, i) => {
        errorPatterns.push(mockErrorPattern(type, 10 + i));
      });

      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors(errorPatterns),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses.length).toBe(MAX_TOP_WEAKNESSES);
    });

    test('calculates trend as worsening when most errors are recent', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('tashkeel_missing', 10, 1), // 1 day ago = recent
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses[0].trend).toBe('worsening');
    });

    test('calculates trend as improving when most errors are old', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('tashkeel_missing', 10, RECENT_ERROR_DAYS + 1), // Old
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses[0].trend).toBe('improving');
    });

    test('collects examples from error patterns', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('spelling_error', 5, 0, [
              { expected: 'مَسْجِد', actual: 'مسجد', exerciseId: 'ex1' },
              { expected: 'كِتَاب', actual: 'كتب', exerciseId: 'ex2' },
            ]),
          ]),
        },
      });

      const report = analyzeWeaknesses();

      expect(report.topWeaknesses[0].examples.length).toBe(2);
      expect(report.topWeaknesses[0].examples[0].expected).toBe('مَسْجِد');
      expect(report.topWeaknesses[0].examples[0].actual).toBe('مسجد');
    });
  });

  describe('getWordsForWeakness', () => {
    test('returns words for weakness affected word IDs', () => {
      const word1 = mockWord('word1', 'كِتَاب', 'book');
      const word2 = mockWord('word2', 'قَلَم', 'pen');
      
      mockGetWordById.mockImplementation((id: string) => {
        if (id === 'word1') return word1;
        if (id === 'word2') return word2;
        return null;
      });

      const weakness: Weakness = {
        type: 'tashkeel_missing',
        count: 5,
        recentCount: 3,
        trend: 'stable',
        severity: 'moderate',
        affectedWordIds: ['word1', 'word2'],
        examples: [],
        description: 'Test',
        advice: 'Test',
      };

      const words = getWordsForWeakness(weakness);

      expect(words.length).toBe(2);
      expect(words[0].id).toBe('word1');
      expect(words[1].id).toBe('word2');
    });

    test('skips words that no longer exist', () => {
      const word1 = mockWord('word1', 'كِتَاب', 'book');
      
      mockGetWordById.mockImplementation((id: string) => {
        if (id === 'word1') return word1;
        return null; // word2 doesn't exist
      });

      const weakness: Weakness = {
        type: 'tashkeel_missing',
        count: 5,
        recentCount: 3,
        trend: 'stable',
        severity: 'moderate',
        affectedWordIds: ['word1', 'word2', 'word3'],
        examples: [],
        description: 'Test',
        advice: 'Test',
      };

      const words = getWordsForWeakness(weakness);

      expect(words.length).toBe(1);
      expect(words[0].id).toBe('word1');
    });
  });

  describe('generateWeaknessPractice', () => {
    test('generates practice items for weakness', () => {
      const word1 = mockWord('word1', 'كِتَاب', 'book');
      const word2 = mockWord('word2', 'قَلَم', 'pen');
      
      mockGetWordById.mockImplementation((id: string) => {
        if (id === 'word1') return word1;
        if (id === 'word2') return word2;
        return null;
      });

      const weakness: Weakness = {
        type: 'tashkeel_wrong',
        count: 5,
        recentCount: 3,
        trend: 'stable',
        severity: 'moderate',
        affectedWordIds: ['word1', 'word2'],
        examples: [],
        description: 'Test',
        advice: 'Test',
      };

      const items = generateWeaknessPractice(weakness);

      expect(items.length).toBe(2);
      expect(items.every(item => item.focusType === 'tashkeel_wrong')).toBe(true);
      expect(items.every(item => item.instruction.length > 0)).toBe(true);
    });

    test('returns empty array when no words found', () => {
      mockGetWordById.mockReturnValue(null);

      const weakness: Weakness = {
        type: 'tashkeel_missing',
        count: 5,
        recentCount: 3,
        trend: 'stable',
        severity: 'moderate',
        affectedWordIds: ['nonexistent'],
        examples: [],
        description: 'Test',
        advice: 'Test',
      };

      const items = generateWeaknessPractice(weakness);

      expect(items).toEqual([]);
    });

    test('respects maxItems limit', () => {
      // Create 15 words
      const words: WordData[] = [];
      for (let i = 1; i <= 15; i++) {
        words.push(mockWord(`word${i}`, `عربي${i}`, `english${i}`));
      }
      
      mockGetWordById.mockImplementation((id: string) => {
        const num = parseInt(id.replace('word', ''));
        return words[num - 1] || null;
      });

      const weakness: Weakness = {
        type: 'vocabulary_unknown',
        count: 15,
        recentCount: 10,
        trend: 'worsening',
        severity: 'severe',
        affectedWordIds: words.map(w => w.id),
        examples: [],
        description: 'Test',
        advice: 'Test',
      };

      const items = generateWeaknessPractice(weakness, 5);

      expect(items.length).toBe(5);
    });
  });

  describe('hasSignificantWeaknesses', () => {
    test('returns false when no data', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {},
      });

      expect(hasSignificantWeaknesses()).toBe(false);
    });

    test('returns true when significant weaknesses exist', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('tashkeel_missing', 10),
          ]),
        },
      });

      expect(hasSignificantWeaknesses()).toBe(true);
    });
  });

  describe('getWeaknessSummary', () => {
    test('returns encouragement message when not enough data', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {},
      });

      const summary = getWeaknessSummary();

      expect(summary).toContain('Keep practicing');
    });

    test('returns no weaknesses message when none detected', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('typo', 2), // Below threshold
          ]),
        },
      });

      // Has data but not enough to be significant
      const summary = getWeaknessSummary();

      expect(summary).toContain('Keep practicing');
    });

    test('returns focus area for top weakness', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'word1': mockMasteryWithErrors([
            mockErrorPattern('letter_confusion', 10),
          ]),
        },
      });

      const summary = getWeaknessSummary();

      expect(summary).toContain('Focus area');
      expect(summary).toContain('letter');
    });
  });

  describe('getErrorTypeLabel', () => {
    test('returns readable label for each error type', () => {
      expect(getErrorTypeLabel('tashkeel_missing')).toBe('Missing Tashkeel');
      expect(getErrorTypeLabel('tashkeel_wrong')).toBe('Wrong Tashkeel');
      expect(getErrorTypeLabel('letter_confusion')).toBe('Letter Confusion');
      expect(getErrorTypeLabel('word_order')).toBe('Word Order');
      expect(getErrorTypeLabel('vocabulary_unknown')).toBe('Unknown Words');
      expect(getErrorTypeLabel('partial_match')).toBe('Partial Matches');
      expect(getErrorTypeLabel('spelling_error')).toBe('Spelling');
      expect(getErrorTypeLabel('typo')).toBe('Typos');
    });

    test('returns Other for unknown types', () => {
      expect(getErrorTypeLabel('unknown_type' as ArabicErrorType)).toBe('Other');
    });
  });

  describe('getSeverityColorClass', () => {
    test('returns correct color classes', () => {
      expect(getSeverityColorClass('severe')).toContain('error');
      expect(getSeverityColorClass('moderate')).toContain('gold');
      expect(getSeverityColorClass('mild')).toContain('muted');
    });
  });

  describe('getTrendIcon', () => {
    test('returns correct direction for trends', () => {
      expect(getTrendIcon('improving')).toBe('down');
      expect(getTrendIcon('worsening')).toBe('up');
      expect(getTrendIcon('stable')).toBe('flat');
    });
  });
});
