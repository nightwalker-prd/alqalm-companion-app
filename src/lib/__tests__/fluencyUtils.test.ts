import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  checkFluencyAnswer,
  calculateFluencyResult,
  updateFluencyStats,
  isWordMastered,
  generateFluencySession,
  canStartFluencySession,
  getMasteredWordCount,
  DEFAULT_FLUENCY_DURATION_MS,
  MIN_WORDS_FOR_FLUENCY,
  INITIAL_FLUENCY_STATS,
  type FluencyItem,
  type FluencyAnswerResult,
  type FluencyStats,
} from '../fluencyUtils';
import type { WordMastery } from '../../types/progress';
import type { WordData } from '../vocabularyAsync';

// Mock the progressService
vi.mock('../progressService', () => ({
  getProgress: vi.fn(),
}));

// Mock the vocabulary module
vi.mock('../vocabularyAsync', () => ({
  getAllWords: vi.fn(),
}));

import { getProgress } from '../progressService';
import { getAllWords } from '../vocabularyAsync';

const mockGetProgress = getProgress as ReturnType<typeof vi.fn>;
const mockGetAllWords = getAllWords as ReturnType<typeof vi.fn>;

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

// Helper to create mock mastery data
function mockMastery(strength: number, fire?: { repNum: number; memory: number }): WordMastery {
  return {
    strength,
    lastPracticed: new Date().toISOString(),
    timesCorrect: 10,
    timesIncorrect: 2,
    challengesPassed: 0,
    lastChallengeDate: null,
    fire: fire ? {
      repNum: fire.repNum,
      memory: fire.memory,
      lastRepDate: Date.now(),
      learningSpeed: 1.0,
    } : undefined,
  };
}

describe('fluencyUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWordMastered', () => {
    test('returns true for high strength (>= 80)', () => {
      expect(isWordMastered(mockMastery(80))).toBe(true);
      expect(isWordMastered(mockMastery(100))).toBe(true);
    });

    test('returns false for low strength (< 80)', () => {
      expect(isWordMastered(mockMastery(79))).toBe(false);
      expect(isWordMastered(mockMastery(50))).toBe(false);
      expect(isWordMastered(mockMastery(0))).toBe(false);
    });

    test('returns true for FIRe mastery (repNum >= 3, memory >= 0.5)', () => {
      expect(isWordMastered(mockMastery(0, { repNum: 3, memory: 0.5 }))).toBe(true);
      expect(isWordMastered(mockMastery(0, { repNum: 5, memory: 0.8 }))).toBe(true);
    });

    test('returns false for insufficient FIRe mastery', () => {
      expect(isWordMastered(mockMastery(0, { repNum: 2, memory: 0.5 }))).toBe(false);
      expect(isWordMastered(mockMastery(0, { repNum: 3, memory: 0.4 }))).toBe(false);
    });

    test('FIRe takes precedence over strength', () => {
      // Low strength but good FIRe = mastered
      expect(isWordMastered(mockMastery(50, { repNum: 3, memory: 0.6 }))).toBe(true);
      // High strength but bad FIRe = not mastered (FIRe checked first)
      expect(isWordMastered(mockMastery(90, { repNum: 1, memory: 0.3 }))).toBe(false);
    });
  });

  describe('checkFluencyAnswer', () => {
    const wordToMeaningItem: FluencyItem = {
      id: 'test-w2m',
      type: 'word-to-meaning',
      prompt: 'كِتَابٌ',
      answer: 'book',
      alternativeAnswers: ['a book', 'the book'],
      wordData: mockWord('w1', 'كِتَابٌ', 'book'),
    };

    const meaningToWordItem: FluencyItem = {
      id: 'test-m2w',
      type: 'meaning-to-word',
      prompt: 'book',
      answer: 'كِتَابٌ',
      wordData: mockWord('w1', 'كِتَابٌ', 'book'),
    };

    test('accepts exact match', () => {
      expect(checkFluencyAnswer(wordToMeaningItem, 'book')).toBe(true);
      expect(checkFluencyAnswer(meaningToWordItem, 'كِتَابٌ')).toBe(true);
    });

    test('is case insensitive for English', () => {
      expect(checkFluencyAnswer(wordToMeaningItem, 'Book')).toBe(true);
      expect(checkFluencyAnswer(wordToMeaningItem, 'BOOK')).toBe(true);
    });

    test('accepts alternative answers', () => {
      expect(checkFluencyAnswer(wordToMeaningItem, 'a book')).toBe(true);
      expect(checkFluencyAnswer(wordToMeaningItem, 'the book')).toBe(true);
    });

    test('trims whitespace', () => {
      expect(checkFluencyAnswer(wordToMeaningItem, '  book  ')).toBe(true);
    });

    test('rejects incorrect answers', () => {
      expect(checkFluencyAnswer(wordToMeaningItem, 'pen')).toBe(false);
      expect(checkFluencyAnswer(meaningToWordItem, 'قَلَمٌ')).toBe(false);
    });

    test('handles Arabic whitespace variations', () => {
      const itemWithSpaces: FluencyItem = {
        id: 'test-m2w-2',
        type: 'meaning-to-word',
        prompt: 'the student',
        answer: 'الطَّالِبُ',
        wordData: mockWord('w2', 'الطَّالِبُ', 'the student'),
      };
      expect(checkFluencyAnswer(itemWithSpaces, 'الطَّالِبُ')).toBe(true);
      expect(checkFluencyAnswer(itemWithSpaces, ' الطَّالِبُ ')).toBe(true);
    });
  });

  describe('calculateFluencyResult', () => {
    test('calculates correct counts', () => {
      const answers: FluencyAnswerResult[] = [
        { itemId: 'a', isCorrect: true, responseTimeMs: 1000 },
        { itemId: 'b', isCorrect: true, responseTimeMs: 1500 },
        { itemId: 'c', isCorrect: false, responseTimeMs: 2000 },
        { itemId: 'd', isCorrect: true, responseTimeMs: 1200 },
      ];

      const result = calculateFluencyResult(answers, 60000, 0);

      expect(result.totalAttempted).toBe(4);
      expect(result.totalCorrect).toBe(3);
    });

    test('calculates WPM correctly', () => {
      const answers: FluencyAnswerResult[] = [
        { itemId: 'a', isCorrect: true, responseTimeMs: 1000 },
        { itemId: 'b', isCorrect: true, responseTimeMs: 1000 },
        { itemId: 'c', isCorrect: true, responseTimeMs: 1000 },
      ];

      // 3 correct in 30 seconds = 6 WPM
      const result = calculateFluencyResult(answers, 30000, 0);
      expect(result.wordsPerMinute).toBe(6);
    });

    test('calculates average response time', () => {
      const answers: FluencyAnswerResult[] = [
        { itemId: 'a', isCorrect: true, responseTimeMs: 1000 },
        { itemId: 'b', isCorrect: true, responseTimeMs: 2000 },
        { itemId: 'c', isCorrect: true, responseTimeMs: 3000 },
      ];

      const result = calculateFluencyResult(answers, 60000, 0);
      expect(result.averageResponseTimeMs).toBe(2000);
    });

    test('detects new personal best', () => {
      const answers: FluencyAnswerResult[] = [
        { itemId: 'a', isCorrect: true, responseTimeMs: 1000 },
        { itemId: 'b', isCorrect: true, responseTimeMs: 1000 },
      ];

      // 2 correct in 60 seconds = 2 WPM, previous best was 1
      const result = calculateFluencyResult(answers, 60000, 1);
      expect(result.isNewPersonalBest).toBe(true);
    });

    test('does not flag personal best if not exceeded', () => {
      const answers: FluencyAnswerResult[] = [
        { itemId: 'a', isCorrect: true, responseTimeMs: 1000 },
      ];

      // 1 correct in 60 seconds = 1 WPM, previous best was 5
      const result = calculateFluencyResult(answers, 60000, 5);
      expect(result.isNewPersonalBest).toBe(false);
    });

    test('handles zero duration gracefully', () => {
      const answers: FluencyAnswerResult[] = [
        { itemId: 'a', isCorrect: true, responseTimeMs: 1000 },
      ];

      const result = calculateFluencyResult(answers, 0, 0);
      expect(result.wordsPerMinute).toBe(0);
    });

    test('handles empty answers', () => {
      const result = calculateFluencyResult([], 60000, 0);
      
      expect(result.totalAttempted).toBe(0);
      expect(result.totalCorrect).toBe(0);
      expect(result.averageResponseTimeMs).toBe(0);
    });
  });

  describe('updateFluencyStats', () => {
    test('increments session count', () => {
      const current: FluencyStats = { ...INITIAL_FLUENCY_STATS };
      const result = {
        totalAttempted: 10,
        totalCorrect: 8,
        durationMs: 60000,
        wordsPerMinute: 8,
        averageResponseTimeMs: 1500,
        isNewPersonalBest: true,
        answers: [],
      };

      const updated = updateFluencyStats(current, result);
      expect(updated.totalSessions).toBe(1);
    });

    test('updates best WPM when exceeded', () => {
      const current: FluencyStats = { 
        ...INITIAL_FLUENCY_STATS,
        bestWordsPerMinute: 5,
      };
      const result = {
        totalAttempted: 10,
        totalCorrect: 10,
        durationMs: 60000,
        wordsPerMinute: 10,
        averageResponseTimeMs: 1500,
        isNewPersonalBest: true,
        answers: [],
      };

      const updated = updateFluencyStats(current, result);
      expect(updated.bestWordsPerMinute).toBe(10);
    });

    test('keeps best WPM if not exceeded', () => {
      const current: FluencyStats = { 
        ...INITIAL_FLUENCY_STATS,
        bestWordsPerMinute: 15,
      };
      const result = {
        totalAttempted: 10,
        totalCorrect: 10,
        durationMs: 60000,
        wordsPerMinute: 10,
        averageResponseTimeMs: 1500,
        isNewPersonalBest: false,
        answers: [],
      };

      const updated = updateFluencyStats(current, result);
      expect(updated.bestWordsPerMinute).toBe(15);
    });

    test('updates total words practiced', () => {
      const current: FluencyStats = { 
        ...INITIAL_FLUENCY_STATS,
        totalWordsPracticed: 50,
      };
      const result = {
        totalAttempted: 20,
        totalCorrect: 18,
        durationMs: 60000,
        wordsPerMinute: 18,
        averageResponseTimeMs: 1500,
        isNewPersonalBest: false,
        answers: [],
      };

      const updated = updateFluencyStats(current, result);
      expect(updated.totalWordsPracticed).toBe(70);
    });

    test('calculates weighted average accuracy', () => {
      const current: FluencyStats = { 
        ...INITIAL_FLUENCY_STATS,
        totalWordsPracticed: 10,
        averageAccuracy: 0.8, // 8/10 correct historically
      };
      const result = {
        totalAttempted: 10,
        totalCorrect: 6, // 60% this session
        durationMs: 60000,
        wordsPerMinute: 6,
        averageResponseTimeMs: 1500,
        isNewPersonalBest: false,
        answers: [],
      };

      const updated = updateFluencyStats(current, result);
      // (8 + 6) / 20 = 0.7
      expect(updated.averageAccuracy).toBeCloseTo(0.7, 2);
    });

    test('sets last session date', () => {
      const current: FluencyStats = { ...INITIAL_FLUENCY_STATS };
      const result = {
        totalAttempted: 10,
        totalCorrect: 8,
        durationMs: 60000,
        wordsPerMinute: 8,
        averageResponseTimeMs: 1500,
        isNewPersonalBest: true,
        answers: [],
      };

      const updated = updateFluencyStats(current, result);
      expect(updated.lastSessionDate).not.toBeNull();
      expect(new Date(updated.lastSessionDate!).getTime()).toBeGreaterThan(0);
    });
  });

  describe('generateFluencySession', () => {
    test('returns empty array when insufficient mastered words', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'w1': mockMastery(80),
          'w2': mockMastery(80),
          // Only 2 words, need at least MIN_WORDS_FOR_FLUENCY
        },
      });
      mockGetAllWords.mockReturnValue([
        mockWord('w1', 'كِتَابٌ', 'book'),
        mockWord('w2', 'قَلَمٌ', 'pen'),
      ]);

      const session = generateFluencySession();
      expect(session).toEqual([]);
    });

    test('generates items when sufficient mastered words exist', () => {
      // Create enough mastered words
      const masteryData: Record<string, WordMastery> = {};
      const words: WordData[] = [];
      
      for (let i = 0; i < 15; i++) {
        const id = `w${i}`;
        masteryData[id] = mockMastery(85);
        words.push(mockWord(id, `عربي${i}`, `english${i}`));
      }

      mockGetProgress.mockReturnValue({ wordMastery: masteryData });
      mockGetAllWords.mockReturnValue(words);

      const session = generateFluencySession();
      
      expect(session.length).toBeGreaterThan(0);
      expect(session.every(item => 
        item.type === 'word-to-meaning' || item.type === 'meaning-to-word'
      )).toBe(true);
    });

    test('only uses mastered words', () => {
      const masteryData: Record<string, WordMastery> = {};
      const words: WordData[] = [];
      
      // 12 mastered, 5 not mastered
      for (let i = 0; i < 12; i++) {
        const id = `mastered${i}`;
        masteryData[id] = mockMastery(85);
        words.push(mockWord(id, `عربي${i}`, `english${i}`));
      }
      for (let i = 0; i < 5; i++) {
        const id = `notmastered${i}`;
        masteryData[id] = mockMastery(40);
        words.push(mockWord(id, `ضعيف${i}`, `weak${i}`));
      }

      mockGetProgress.mockReturnValue({ wordMastery: masteryData });
      mockGetAllWords.mockReturnValue(words);

      const session = generateFluencySession();
      
      // All items should be from mastered words
      for (const item of session) {
        expect(item.wordData.id.startsWith('mastered')).toBe(true);
      }
    });

    test('respects maxItems config', () => {
      const masteryData: Record<string, WordMastery> = {};
      const words: WordData[] = [];
      
      for (let i = 0; i < 50; i++) {
        const id = `w${i}`;
        masteryData[id] = mockMastery(85);
        words.push(mockWord(id, `عربي${i}`, `english${i}`));
      }

      mockGetProgress.mockReturnValue({ wordMastery: masteryData });
      mockGetAllWords.mockReturnValue(words);

      const session = generateFluencySession({ maxItems: 10 });
      
      expect(session.length).toBeLessThanOrEqual(10);
    });

    test('includes both word-to-meaning and meaning-to-word items', () => {
      const masteryData: Record<string, WordMastery> = {};
      const words: WordData[] = [];
      
      for (let i = 0; i < 20; i++) {
        const id = `w${i}`;
        masteryData[id] = mockMastery(85);
        words.push(mockWord(id, `عربي${i}`, `english${i}`));
      }

      mockGetProgress.mockReturnValue({ wordMastery: masteryData });
      mockGetAllWords.mockReturnValue(words);

      const session = generateFluencySession({ maxItems: 30 });
      
      const w2mCount = session.filter(i => i.type === 'word-to-meaning').length;
      const m2wCount = session.filter(i => i.type === 'meaning-to-word').length;
      
      expect(w2mCount).toBeGreaterThan(0);
      expect(m2wCount).toBeGreaterThan(0);
    });
  });

  describe('canStartFluencySession', () => {
    test('returns true when enough mastered words', () => {
      const masteryData: Record<string, WordMastery> = {};
      for (let i = 0; i < MIN_WORDS_FOR_FLUENCY; i++) {
        masteryData[`w${i}`] = mockMastery(85);
      }
      mockGetProgress.mockReturnValue({ wordMastery: masteryData });

      expect(canStartFluencySession()).toBe(true);
    });

    test('returns false when insufficient mastered words', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'w1': mockMastery(85),
          'w2': mockMastery(85),
        },
      });

      expect(canStartFluencySession()).toBe(false);
    });
  });

  describe('getMasteredWordCount', () => {
    test('counts only mastered words', () => {
      mockGetProgress.mockReturnValue({
        wordMastery: {
          'w1': mockMastery(85),
          'w2': mockMastery(85),
          'w3': mockMastery(50),
          'w4': mockMastery(90),
          'w5': mockMastery(30),
        },
      });

      expect(getMasteredWordCount()).toBe(3);
    });
  });

  describe('constants', () => {
    test('DEFAULT_FLUENCY_DURATION_MS is 60 seconds', () => {
      expect(DEFAULT_FLUENCY_DURATION_MS).toBe(60000);
    });

    test('MIN_WORDS_FOR_FLUENCY is 10', () => {
      expect(MIN_WORDS_FOR_FLUENCY).toBe(10);
    });

    test('INITIAL_FLUENCY_STATS has correct defaults', () => {
      expect(INITIAL_FLUENCY_STATS.totalSessions).toBe(0);
      expect(INITIAL_FLUENCY_STATS.bestWordsPerMinute).toBe(0);
      expect(INITIAL_FLUENCY_STATS.averageAccuracy).toBe(0);
      expect(INITIAL_FLUENCY_STATS.lastSessionDate).toBeNull();
      expect(INITIAL_FLUENCY_STATS.totalWordsPracticed).toBe(0);
    });
  });
});
