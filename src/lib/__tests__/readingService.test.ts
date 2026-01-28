import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  resetReading,
  isReadingLoaded,
  isReadingLoading,
  getReadingError,
  getPassageById,
  getAllPassages,
  getPassagesByLevel,
  getPassagesByCategory,
  getCategories,
  getPassageCount,
  filterPassages,
  getManifest,
  getReadingData,
  getPassageProgress,
  markPassageRead,
  getReadingStats,
  clearReadingProgress,
} from '../readingService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('readingService', () => {
  beforeEach(() => {
    // Reset module state before each test
    resetReading();
    localStorageMock.clear();
  });

  describe('initial state', () => {
    test('isReadingLoaded returns false initially', () => {
      expect(isReadingLoaded()).toBe(false);
    });

    test('isReadingLoading returns false initially', () => {
      expect(isReadingLoading()).toBe(false);
    });

    test('getReadingError returns null initially', () => {
      expect(getReadingError()).toBe(null);
    });

    test('getAllPassages returns empty array when not loaded', () => {
      expect(getAllPassages()).toEqual([]);
    });

    test('getPassageById returns null when not loaded', () => {
      expect(getPassageById('b1')).toBe(null);
    });

    test('getPassagesByLevel returns empty array when not loaded', () => {
      expect(getPassagesByLevel('beginner')).toEqual([]);
    });

    test('getPassagesByCategory returns empty array when not loaded', () => {
      expect(getPassagesByCategory('Faith & Belief')).toEqual([]);
    });

    test('getCategories returns empty array when not loaded', () => {
      expect(getCategories()).toEqual([]);
    });

    test('getPassageCount returns 0 when not loaded', () => {
      expect(getPassageCount()).toBe(0);
    });

    test('getManifest returns null when not loaded', () => {
      expect(getManifest()).toBe(null);
    });
  });

  describe('filterPassages', () => {
    test('returns empty array when not loaded', () => {
      expect(filterPassages({ level: 'beginner' })).toEqual([]);
    });

    test('returns empty array with empty filters when not loaded', () => {
      expect(filterPassages({})).toEqual([]);
    });
  });

  describe('reading progress (localStorage)', () => {
    test('getReadingData returns empty data initially', () => {
      const data = getReadingData();
      expect(data.version).toBe(1);
      expect(data.passageProgress).toEqual({});
      expect(data.stats.totalTimesRead).toBe(0);
      expect(data.stats.lastReadDate).toBe(null);
    });

    test('getPassageProgress returns null for unread passage', () => {
      expect(getPassageProgress('b1')).toBe(null);
    });

    test('markPassageRead creates progress entry', () => {
      const progress = markPassageRead('b1');

      expect(progress.passageId).toBe('b1');
      expect(progress.completed).toBe(true);
      expect(progress.timesRead).toBe(1);
      expect(progress.firstReadDate).toBeTypeOf('number');
      expect(progress.lastReadDate).toBeTypeOf('number');
    });

    test('markPassageRead increments timesRead on subsequent calls', () => {
      markPassageRead('b1');
      markPassageRead('b1');
      const progress = markPassageRead('b1');

      expect(progress.timesRead).toBe(3);
    });

    test('markPassageRead preserves firstReadDate on subsequent calls', () => {
      const first = markPassageRead('b1');
      const firstReadDate = first.firstReadDate;

      // Wait a tiny bit to ensure different timestamp
      const second = markPassageRead('b1');

      expect(second.firstReadDate).toBe(firstReadDate);
      expect(second.lastReadDate).toBeGreaterThanOrEqual(firstReadDate!);
    });

    test('markPassageRead updates stats', () => {
      markPassageRead('b1');
      markPassageRead('b2');

      const data = getReadingData();
      expect(data.stats.totalTimesRead).toBe(2);
      expect(data.stats.lastReadDate).toBeTypeOf('number');
    });

    test('getReadingStats returns correct counts', () => {
      // Initially empty
      let stats = getReadingStats();
      expect(stats.passagesRead).toBe(0);
      expect(stats.totalEncounters).toBe(0);

      // After reading some passages
      markPassageRead('b1');
      markPassageRead('b2');
      markPassageRead('b1'); // Re-read b1

      stats = getReadingStats();
      expect(stats.passagesRead).toBe(2); // 2 unique passages
      expect(stats.totalEncounters).toBe(3); // 3 total reads
    });

    test('clearReadingProgress removes all progress', () => {
      markPassageRead('b1');
      markPassageRead('b2');

      clearReadingProgress();

      const data = getReadingData();
      expect(data.passageProgress).toEqual({});
    });

    test('getPassageProgress returns stored progress', () => {
      markPassageRead('b1');

      const progress = getPassageProgress('b1');
      expect(progress).not.toBe(null);
      expect(progress?.completed).toBe(true);
      expect(progress?.timesRead).toBe(1);
    });
  });

  describe('localStorage error handling', () => {
    test('getReadingData handles invalid JSON gracefully', () => {
      localStorageMock.setItem('madina-reading-progress', 'not valid json');

      const data = getReadingData();
      expect(data.version).toBe(1);
      expect(data.passageProgress).toEqual({});
    });

    test('markPassageRead handles localStorage full gracefully', () => {
      // Mock console.warn to verify it's called
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Override setItem to throw
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      // Should not throw
      expect(() => markPassageRead('b1')).not.toThrow();

      // Restore
      localStorageMock.setItem = originalSetItem;
      warnSpy.mockRestore();
    });
  });
});
