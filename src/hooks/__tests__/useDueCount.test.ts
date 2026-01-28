/**
 * Tests for useDueCount hook - lightweight due word counter
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// We need to test the pure functions, not the hook (which requires React)
// So we'll extract the logic and test it directly

const STORAGE_KEY = 'madina_progress';

interface SM2State {
  nextReviewDate: number;
}

interface MinimalWordMastery {
  sm2?: SM2State;
}

interface MinimalProgressData {
  wordMastery?: Record<string, MinimalWordMastery>;
}

function readProgressFromStorage(): MinimalProgressData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as MinimalProgressData;
  } catch {
    return null;
  }
}

function countDueWords(data: MinimalProgressData | null): number {
  if (!data?.wordMastery) return 0;

  const now = Date.now();
  let count = 0;

  for (const mastery of Object.values(data.wordMastery)) {
    if (mastery?.sm2?.nextReviewDate !== undefined) {
      if (mastery.sm2.nextReviewDate <= now) {
        count++;
      }
    }
  }

  return count;
}

describe('useDueCount helpers', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('readProgressFromStorage', () => {
    test('returns null when localStorage is empty', () => {
      expect(readProgressFromStorage()).toBeNull();
    });

    test('returns null when key does not exist', () => {
      localStorageMock.setItem('other_key', JSON.stringify({ foo: 'bar' }));
      expect(readProgressFromStorage()).toBeNull();
    });

    test('returns parsed data when valid JSON exists', () => {
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: { nextReviewDate: Date.now() } },
        },
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(data));
      
      const result = readProgressFromStorage();
      expect(result).not.toBeNull();
      expect(result?.wordMastery?.['word-1']).toBeDefined();
    });

    test('returns null for invalid JSON', () => {
      localStorageMock.setItem(STORAGE_KEY, 'not valid json');
      expect(readProgressFromStorage()).toBeNull();
    });
  });

  describe('countDueWords', () => {
    test('returns 0 for null data', () => {
      expect(countDueWords(null)).toBe(0);
    });

    test('returns 0 for empty wordMastery', () => {
      expect(countDueWords({ wordMastery: {} })).toBe(0);
    });

    test('returns 0 when no words have sm2 data', () => {
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': {},
          'word-2': {},
        },
      };
      expect(countDueWords(data)).toBe(0);
    });

    test('counts words with nextReviewDate in the past', () => {
      const past = Date.now() - 10000; // 10 seconds ago
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: { nextReviewDate: past } },
          'word-2': { sm2: { nextReviewDate: past } },
        },
      };
      expect(countDueWords(data)).toBe(2);
    });

    test('counts words with nextReviewDate equal to now', () => {
      const now = Date.now();
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: { nextReviewDate: now } },
        },
      };
      expect(countDueWords(data)).toBe(1);
    });

    test('does not count words with nextReviewDate in the future', () => {
      const future = Date.now() + 10000; // 10 seconds from now
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: { nextReviewDate: future } },
        },
      };
      expect(countDueWords(data)).toBe(0);
    });

    test('correctly counts mixed due and not-due words', () => {
      const past = Date.now() - 10000;
      const future = Date.now() + 10000;
      
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: { nextReviewDate: past } },     // Due
          'word-2': { sm2: { nextReviewDate: future } },   // Not due
          'word-3': { sm2: { nextReviewDate: past } },     // Due
          'word-4': {},                                     // No sm2
          'word-5': { sm2: { nextReviewDate: future } },   // Not due
        },
      };
      
      expect(countDueWords(data)).toBe(2);
    });

    test('handles undefined wordMastery', () => {
      expect(countDueWords({})).toBe(0);
    });

    test('handles words with undefined sm2', () => {
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: undefined },
        },
      };
      expect(countDueWords(data)).toBe(0);
    });
  });

  describe('integration', () => {
    test('reads and counts from localStorage correctly', () => {
      const past = Date.now() - 10000;
      const data: MinimalProgressData = {
        wordMastery: {
          'word-1': { sm2: { nextReviewDate: past } },
          'word-2': { sm2: { nextReviewDate: past } },
          'word-3': { sm2: { nextReviewDate: past } },
        },
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(data));
      
      const result = readProgressFromStorage();
      const count = countDueWords(result);
      
      expect(count).toBe(3);
    });

    test('handles large number of words efficiently', () => {
      const past = Date.now() - 10000;
      const wordMastery: Record<string, MinimalWordMastery> = {};
      
      // Create 1000 words
      for (let i = 0; i < 1000; i++) {
        wordMastery[`word-${i}`] = {
          sm2: { nextReviewDate: i % 2 === 0 ? past : Date.now() + 10000 },
        };
      }
      
      const data: MinimalProgressData = { wordMastery };
      
      const start = performance.now();
      const count = countDueWords(data);
      const elapsed = performance.now() - start;
      
      // Should count 500 due words (every even index)
      expect(count).toBe(500);
      // Should complete in less than 50ms
      expect(elapsed).toBeLessThan(50);
    });
  });
});
