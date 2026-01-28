import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getLessonRecallPrompts,
  getRootRecallPrompts,
  getRandomRecallPrompt,
  checkRecallAttempt,
  canDoFreeRecall,
  getRecallGrade,
  getRecallFeedback,
  getRecallRateColorClass,
  type RecallPrompt,
} from '../freeRecallUtils';
import type { WordData } from '../vocabularyAsync';

// Mock the progressService
vi.mock('../progressService', () => ({
  getProgress: vi.fn(),
}));

// Mock the vocabulary module
vi.mock('../vocabularyAsync', () => ({
  getWordsByLesson: vi.fn(),
  getWordsByRoot: vi.fn(),
  getAllRoots: vi.fn(),
}));

// Mock the contentStats module
vi.mock('../contentStats', () => ({
  getAllLessonMeta: vi.fn(),
}));

import { getProgress } from '../progressService';
import { getWordsByLesson, getWordsByRoot, getAllRoots } from '../vocabularyAsync';
import { getAllLessonMeta } from '../contentStats';

const mockGetProgress = getProgress as ReturnType<typeof vi.fn>;
const mockGetWordsByLesson = getWordsByLesson as ReturnType<typeof vi.fn>;
const mockGetWordsByRoot = getWordsByRoot as ReturnType<typeof vi.fn>;
const mockGetAllRoots = getAllRoots as ReturnType<typeof vi.fn>;
const mockGetAllLessonMeta = getAllLessonMeta as ReturnType<typeof vi.fn>;

// Helper to create mock word data
function mockWord(id: string, arabic: string, english: string, root: string | null = null, lesson: string = 'b1-l01'): WordData {
  return {
    id,
    arabic,
    english,
    root,
    lesson,
    partOfSpeech: 'noun',
  };
}

describe('freeRecallUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllRoots.mockReturnValue([]);
    mockGetAllLessonMeta.mockReturnValue([
      { id: 'b1-l01', titleEnglish: 'Book 1 Lesson 01', titleArabic: 'الدرس الأول' },
    ]);
  });

  describe('getLessonRecallPrompts', () => {
    test('returns empty array when no lessons practiced', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {},
        wordMastery: {},
      });

      const prompts = getLessonRecallPrompts();
      expect(prompts).toEqual([]);
    });

    test('returns empty array when lesson has too few words', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {
          'b1-l01': { started: true },
        },
        wordMastery: {},
      });
      mockGetWordsByLesson.mockReturnValue([
        mockWord('w1', 'كتاب', 'book'),
        mockWord('w2', 'قلم', 'pen'),
        // Only 2 words, below MIN_WORDS_FOR_RECALL
      ]);

      const prompts = getLessonRecallPrompts();
      expect(prompts).toEqual([]);
    });

    test('returns prompt for practiced lesson with enough words', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {
          'b1-l01': { started: true },
        },
        wordMastery: {},
      });
      mockGetWordsByLesson.mockReturnValue([
        mockWord('w1', 'كتاب', 'book'),
        mockWord('w2', 'قلم', 'pen'),
        mockWord('w3', 'باب', 'door'),
      ]);

      const prompts = getLessonRecallPrompts();
      expect(prompts.length).toBe(1);
      expect(prompts[0].id).toBe('b1-l01');
      expect(prompts[0].label).toBe('Book 1 Lesson 01');
      expect(prompts[0].type).toBe('lesson');
      expect(prompts[0].expectedWords.length).toBe(3);
    });

    test('skips lessons not started', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {
          'b1-l01': { started: false },
        },
        wordMastery: {},
      });
      mockGetWordsByLesson.mockReturnValue([
        mockWord('w1', 'كتاب', 'book'),
        mockWord('w2', 'قلم', 'pen'),
        mockWord('w3', 'باب', 'door'),
      ]);

      const prompts = getLessonRecallPrompts();
      expect(prompts).toEqual([]);
    });
  });

  describe('getRootRecallPrompts', () => {
    test('returns empty array when no words practiced', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {},
        wordMastery: {},
      });
      mockGetAllRoots.mockReturnValue([]);

      const prompts = getRootRecallPrompts();
      expect(prompts).toEqual([]);
    });

    test('returns prompt for practiced root with enough words', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {},
        wordMastery: {
          'w1': { strength: 50 },
        },
      });
      mockGetAllRoots.mockReturnValue(['ك-ت-ب']);
      mockGetWordsByRoot.mockImplementation((root: string) => {
        if (root === 'ك-ت-ب') {
          return [
            mockWord('w1', 'كِتَاب', 'book', 'ك-ت-ب'),
            mockWord('w2', 'كَاتِب', 'writer', 'ك-ت-ب'),
            mockWord('w3', 'مَكْتَب', 'desk', 'ك-ت-ب'),
          ];
        }
        return [];
      });

      const prompts = getRootRecallPrompts();
      expect(prompts.length).toBe(1);
      expect(prompts[0].id).toBe('ك-ت-ب');
      expect(prompts[0].type).toBe('root');
      expect(prompts[0].expectedWords.length).toBe(3);
    });
  });

  describe('checkRecallAttempt', () => {
    const mockPrompt: RecallPrompt = {
      type: 'lesson',
      id: 'b1-l01',
      label: 'Book 1 Lesson 1',
      expectedWords: [
        mockWord('w1', 'كِتَاب', 'book'),
        mockWord('w2', 'قَلَم', 'pen'),
        mockWord('w3', 'بَاب', 'door'),
      ],
      description: 'Test prompt',
    };

    test('correctly identifies recalled words', () => {
      const result = checkRecallAttempt(mockPrompt, ['كتاب', 'قلم']);
      
      expect(result.recalled.length).toBe(2);
      expect(result.forgotten.length).toBe(1);
      expect(result.recallRate).toBeCloseTo(2/3);
    });

    test('handles exact matches with tashkeel', () => {
      const result = checkRecallAttempt(mockPrompt, ['كِتَاب', 'قَلَم', 'بَاب']);
      
      expect(result.recalled.length).toBe(3);
      expect(result.forgotten.length).toBe(0);
      expect(result.recallRate).toBe(1);
    });

    test('handles matches without tashkeel', () => {
      const result = checkRecallAttempt(mockPrompt, ['كتاب', 'قلم', 'باب']);
      
      expect(result.recalled.length).toBe(3);
      expect(result.recallRate).toBe(1);
    });

    test('identifies extra words not in expected list', () => {
      const result = checkRecallAttempt(mockPrompt, ['كتاب', 'سيارة']);
      
      expect(result.recalled.length).toBe(1);
      expect(result.extra).toContain('سيارة');
    });

    test('handles empty input', () => {
      const result = checkRecallAttempt(mockPrompt, []);
      
      expect(result.recalled.length).toBe(0);
      expect(result.forgotten.length).toBe(3);
      expect(result.recallRate).toBe(0);
    });

    test('handles empty expected words', () => {
      const emptyPrompt: RecallPrompt = {
        ...mockPrompt,
        expectedWords: [],
      };
      
      const result = checkRecallAttempt(emptyPrompt, ['كتاب']);
      
      expect(result.recallRate).toBe(0);
      expect(result.extra).toContain('كتاب');
    });
  });

  describe('canDoFreeRecall', () => {
    test('returns false when no prompts available', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {},
        wordMastery: {},
      });
      mockGetAllRoots.mockReturnValue([]);
      mockGetWordsByLesson.mockReturnValue([]);

      expect(canDoFreeRecall()).toBe(false);
    });

    test('returns true when prompts available', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {
          'b1-l01': { started: true },
        },
        wordMastery: {},
      });
      mockGetWordsByLesson.mockReturnValue([
        mockWord('w1', 'كتاب', 'book'),
        mockWord('w2', 'قلم', 'pen'),
        mockWord('w3', 'باب', 'door'),
      ]);
      mockGetAllRoots.mockReturnValue([]);

      expect(canDoFreeRecall()).toBe(true);
    });
  });

  describe('getRecallGrade', () => {
    test('returns A for 90%+', () => {
      expect(getRecallGrade(0.9)).toBe('A');
      expect(getRecallGrade(1.0)).toBe('A');
    });

    test('returns B for 80-89%', () => {
      expect(getRecallGrade(0.8)).toBe('B');
      expect(getRecallGrade(0.89)).toBe('B');
    });

    test('returns C for 70-79%', () => {
      expect(getRecallGrade(0.7)).toBe('C');
      expect(getRecallGrade(0.79)).toBe('C');
    });

    test('returns D for 60-69%', () => {
      expect(getRecallGrade(0.6)).toBe('D');
      expect(getRecallGrade(0.69)).toBe('D');
    });

    test('returns F for below 60%', () => {
      expect(getRecallGrade(0.5)).toBe('F');
      expect(getRecallGrade(0)).toBe('F');
    });
  });

  describe('getRecallFeedback', () => {
    test('returns appropriate feedback for each level', () => {
      expect(getRecallFeedback(0.95)).toContain('Excellent');
      expect(getRecallFeedback(0.85)).toContain('Great');
      expect(getRecallFeedback(0.75)).toContain('Good');
      expect(getRecallFeedback(0.55)).toContain('Not bad');
      expect(getRecallFeedback(0.35)).toContain('Some words');
      expect(getRecallFeedback(0.15)).toContain('challenging');
    });
  });

  describe('getRecallRateColorClass', () => {
    test('returns success color for 80%+', () => {
      expect(getRecallRateColorClass(0.8)).toContain('success');
      expect(getRecallRateColorClass(1.0)).toContain('success');
    });

    test('returns gold color for 50-79%', () => {
      expect(getRecallRateColorClass(0.5)).toContain('gold');
      expect(getRecallRateColorClass(0.79)).toContain('gold');
    });

    test('returns error color for below 50%', () => {
      expect(getRecallRateColorClass(0.49)).toContain('error');
      expect(getRecallRateColorClass(0)).toContain('error');
    });
  });

  describe('getRandomRecallPrompt', () => {
    test('returns null when no prompts available', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {},
        wordMastery: {},
      });
      mockGetAllRoots.mockReturnValue([]);
      mockGetWordsByLesson.mockReturnValue([]);

      expect(getRandomRecallPrompt()).toBeNull();
    });

    test('returns a prompt when available', () => {
      mockGetProgress.mockReturnValue({
        lessonProgress: {
          'b1-l01': { started: true },
        },
        wordMastery: {},
      });
      mockGetWordsByLesson.mockReturnValue([
        mockWord('w1', 'كتاب', 'book'),
        mockWord('w2', 'قلم', 'pen'),
        mockWord('w3', 'باب', 'door'),
      ]);
      mockGetAllRoots.mockReturnValue([]);

      const prompt = getRandomRecallPrompt();
      expect(prompt).not.toBeNull();
      expect(prompt?.type).toBe('lesson');
    });
  });
});
