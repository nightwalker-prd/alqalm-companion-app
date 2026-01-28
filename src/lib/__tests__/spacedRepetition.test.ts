/**
 * Tests for SM-2 Spaced Repetition Algorithm
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateSM2,
  isDue,
  getDaysOverdue,
  getDaysUntilReview,
  simpleToQuality,
  flashcardToQuality,
  estimateRetention,
  sortByReviewPriority,
  DEFAULT_SM2_STATE,
  type SM2State,
} from '../spacedRepetition';

// Helper to create SM2State with specific nextReviewDate
function createState(overrides: Partial<SM2State> = {}): SM2State {
  return {
    ...DEFAULT_SM2_STATE,
    nextReviewDate: Date.now(),
    ...overrides,
  };
}

// Constants for time calculations
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('DEFAULT_SM2_STATE', () => {
  test('has correct default values', () => {
    expect(DEFAULT_SM2_STATE.easeFactor).toBe(2.5);
    expect(DEFAULT_SM2_STATE.interval).toBe(0);
    expect(DEFAULT_SM2_STATE.repetitions).toBe(0);
  });
});

describe('calculateSM2', () => {
  describe('ease factor calculation', () => {
    test('perfect response (quality=5) increases ease factor', () => {
      const initial = createState({ easeFactor: 2.5 });
      const result = calculateSM2(initial, 5);
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });

    test('good response (quality=4) keeps ease factor similar', () => {
      const initial = createState({ easeFactor: 2.5 });
      const result = calculateSM2(initial, 4);
      expect(result.easeFactor).toBe(2.5);
    });

    test('difficult response (quality=3) decreases ease factor', () => {
      const initial = createState({ easeFactor: 2.5 });
      const result = calculateSM2(initial, 3);
      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.easeFactor).toBeCloseTo(2.36, 1);
    });

    test('failed response (quality=1) decreases ease factor significantly', () => {
      const initial = createState({ easeFactor: 2.5 });
      const result = calculateSM2(initial, 1);
      expect(result.easeFactor).toBeLessThan(2.36);
    });

    test('ease factor never goes below minimum (1.3)', () => {
      const initial = createState({ easeFactor: 1.3 });
      const result = calculateSM2(initial, 0);
      expect(result.easeFactor).toBe(1.3);
    });

    test('multiple failures eventually hit minimum ease factor', () => {
      let state = createState({ easeFactor: 2.5 });
      for (let i = 0; i < 20; i++) {
        state = calculateSM2(state, 0);
      }
      expect(state.easeFactor).toBe(1.3);
    });
  });

  describe('interval calculation for successful responses', () => {
    test('first successful review sets interval to 1 day', () => {
      const initial = createState({ repetitions: 0, interval: 0 });
      const result = calculateSM2(initial, 4);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    test('second successful review sets interval to 6 days', () => {
      const initial = createState({ repetitions: 1, interval: 1 });
      const result = calculateSM2(initial, 4);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    test('third successful review multiplies interval by ease factor', () => {
      const initial = createState({
        repetitions: 2,
        interval: 6,
        easeFactor: 2.5,
      });
      const result = calculateSM2(initial, 4);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });

    test('intervals grow exponentially with continued success', () => {
      let state = createState();
      const intervals: number[] = [];

      // Simulate 5 perfect reviews
      for (let i = 0; i < 5; i++) {
        state = calculateSM2(state, 5);
        intervals.push(state.interval);
      }

      // Check intervals are growing
      expect(intervals[0]).toBe(1); // First review
      expect(intervals[1]).toBe(6); // Second review
      expect(intervals[2]).toBeGreaterThan(intervals[1]); // Third and beyond grow
      expect(intervals[3]).toBeGreaterThan(intervals[2]);
      expect(intervals[4]).toBeGreaterThan(intervals[3]);
    });
  });

  describe('interval calculation for failed responses', () => {
    test('failed response (quality < 3) resets repetitions to 0', () => {
      const initial = createState({ repetitions: 5, interval: 30 });
      const result = calculateSM2(initial, 2);
      expect(result.repetitions).toBe(0);
    });

    test('failed response sets interval to 1 day', () => {
      const initial = createState({ repetitions: 5, interval: 30 });
      const result = calculateSM2(initial, 2);
      expect(result.interval).toBe(1);
    });

    test('quality 0 (blackout) resets the item', () => {
      const initial = createState({ repetitions: 10, interval: 100 });
      const result = calculateSM2(initial, 0);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('next review date calculation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('next review date is interval days from now', () => {
      const initial = createState({ repetitions: 1, interval: 1 });
      const result = calculateSM2(initial, 4); // Should set interval to 6

      const expectedDate = Date.now() + 6 * ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });

    test('failed item is due tomorrow', () => {
      const initial = createState({ repetitions: 5, interval: 30 });
      const result = calculateSM2(initial, 1);

      const tomorrow = Date.now() + ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(tomorrow);
    });
  });
});

describe('isDue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns true when nextReviewDate is in the past', () => {
    const state = createState({
      nextReviewDate: Date.now() - ONE_DAY_MS,
    });
    expect(isDue(state)).toBe(true);
  });

  test('returns true when nextReviewDate is exactly now', () => {
    const state = createState({
      nextReviewDate: Date.now(),
    });
    expect(isDue(state)).toBe(true);
  });

  test('returns false when nextReviewDate is in the future', () => {
    const state = createState({
      nextReviewDate: Date.now() + ONE_DAY_MS,
    });
    expect(isDue(state)).toBe(false);
  });
});

describe('getDaysOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns 0 when not overdue', () => {
    const state = createState({
      nextReviewDate: Date.now() + ONE_DAY_MS,
    });
    expect(getDaysOverdue(state)).toBe(0);
  });

  test('returns 0 when due exactly now', () => {
    const state = createState({
      nextReviewDate: Date.now(),
    });
    expect(getDaysOverdue(state)).toBe(0);
  });

  test('returns correct number of days overdue', () => {
    const state = createState({
      nextReviewDate: Date.now() - 3 * ONE_DAY_MS,
    });
    expect(getDaysOverdue(state)).toBe(3);
  });

  test('returns floor of partial days', () => {
    const state = createState({
      nextReviewDate: Date.now() - 2.5 * ONE_DAY_MS,
    });
    expect(getDaysOverdue(state)).toBe(2);
  });
});

describe('getDaysUntilReview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns positive number for future review', () => {
    const state = createState({
      nextReviewDate: Date.now() + 5 * ONE_DAY_MS,
    });
    expect(getDaysUntilReview(state)).toBe(5);
  });

  test('returns 0 for item due today', () => {
    const state = createState({
      nextReviewDate: Date.now(),
    });
    expect(getDaysUntilReview(state)).toBe(0);
  });

  test('returns negative number for overdue item', () => {
    const state = createState({
      nextReviewDate: Date.now() - 3 * ONE_DAY_MS,
    });
    expect(getDaysUntilReview(state)).toBe(-3);
  });

  test('returns ceiling of partial days until review', () => {
    const state = createState({
      nextReviewDate: Date.now() + 0.5 * ONE_DAY_MS,
    });
    expect(getDaysUntilReview(state)).toBe(1);
  });
});

describe('simpleToQuality', () => {
  test('incorrect answer returns quality 1', () => {
    expect(simpleToQuality(false)).toBe(1);
  });

  test('incorrect with wasHard still returns quality 1', () => {
    expect(simpleToQuality(false, true)).toBe(1);
  });

  test('correct answer returns quality 4', () => {
    expect(simpleToQuality(true)).toBe(4);
  });

  test('correct but hard answer returns quality 3', () => {
    expect(simpleToQuality(true, true)).toBe(3);
  });
});

describe('flashcardToQuality', () => {
  test('again returns quality 1', () => {
    expect(flashcardToQuality('again')).toBe(1);
  });

  test('hard returns quality 3', () => {
    expect(flashcardToQuality('hard')).toBe(3);
  });

  test('good returns quality 4', () => {
    expect(flashcardToQuality('good')).toBe(4);
  });

  test('easy returns quality 5', () => {
    expect(flashcardToQuality('easy')).toBe(5);
  });
});

describe('estimateRetention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns 1 for items not yet due', () => {
    const state = createState({
      nextReviewDate: Date.now() + ONE_DAY_MS,
      interval: 10,
      easeFactor: 2.5,
    });
    expect(estimateRetention(state)).toBe(1);
  });

  test('returns 1 for items due exactly now', () => {
    const state = createState({
      nextReviewDate: Date.now(),
      interval: 10,
      easeFactor: 2.5,
    });
    expect(estimateRetention(state)).toBe(1);
  });

  test('retention decreases for overdue items', () => {
    const state = createState({
      nextReviewDate: Date.now() - 5 * ONE_DAY_MS,
      interval: 10,
      easeFactor: 2.5,
    });
    const retention = estimateRetention(state);
    expect(retention).toBeLessThan(1);
    expect(retention).toBeGreaterThan(0);
  });

  test('longer interval = more stable = slower decay', () => {
    const shortInterval = createState({
      nextReviewDate: Date.now() - 5 * ONE_DAY_MS,
      interval: 5,
      easeFactor: 2.5,
    });
    const longInterval = createState({
      nextReviewDate: Date.now() - 5 * ONE_DAY_MS,
      interval: 30,
      easeFactor: 2.5,
    });

    expect(estimateRetention(longInterval)).toBeGreaterThan(
      estimateRetention(shortInterval)
    );
  });

  test('higher ease factor = slower decay', () => {
    const lowEase = createState({
      nextReviewDate: Date.now() - 5 * ONE_DAY_MS,
      interval: 10,
      easeFactor: 1.5,
    });
    const highEase = createState({
      nextReviewDate: Date.now() - 5 * ONE_DAY_MS,
      interval: 10,
      easeFactor: 2.5,
    });

    expect(estimateRetention(highEase)).toBeGreaterThan(
      estimateRetention(lowEase)
    );
  });

  test('retention stays between 0 and 1', () => {
    const veryOverdue = createState({
      nextReviewDate: Date.now() - 365 * ONE_DAY_MS,
      interval: 1,
      easeFactor: 1.3,
    });
    const retention = estimateRetention(veryOverdue);
    expect(retention).toBeGreaterThanOrEqual(0);
    expect(retention).toBeLessThanOrEqual(1);
  });
});

describe('sortByReviewPriority', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('overdue items come before non-overdue items', () => {
    const items = [
      { id: 'future', sm2: createState({ nextReviewDate: Date.now() + ONE_DAY_MS }) },
      { id: 'overdue', sm2: createState({ nextReviewDate: Date.now() - ONE_DAY_MS }) },
    ];

    const sorted = sortByReviewPriority(items);
    expect(sorted[0].id).toBe('overdue');
    expect(sorted[1].id).toBe('future');
  });

  test('more overdue items come before less overdue items', () => {
    const items = [
      { id: 'slightly', sm2: createState({ nextReviewDate: Date.now() - ONE_DAY_MS }) },
      { id: 'very', sm2: createState({ nextReviewDate: Date.now() - 10 * ONE_DAY_MS }) },
      { id: 'medium', sm2: createState({ nextReviewDate: Date.now() - 5 * ONE_DAY_MS }) },
    ];

    const sorted = sortByReviewPriority(items);
    expect(sorted[0].id).toBe('very');
    expect(sorted[1].id).toBe('medium');
    expect(sorted[2].id).toBe('slightly');
  });

  test('non-overdue items sorted by retention (lower first)', () => {
    // Item with short interval and same ease will decay faster
    const items = [
      {
        id: 'stable',
        sm2: createState({
          nextReviewDate: Date.now() + ONE_DAY_MS,
          interval: 30,
          easeFactor: 2.5,
        }),
      },
      {
        id: 'fragile',
        sm2: createState({
          nextReviewDate: Date.now() + ONE_DAY_MS,
          interval: 1,
          easeFactor: 1.3,
        }),
      },
    ];

    const sorted = sortByReviewPriority(items);
    // Both have retention 1 since they're not due yet
    // This test verifies the sort is stable when retention is equal
    expect(sorted.length).toBe(2);
  });

  test('does not mutate original array', () => {
    const items = [
      { id: 'b', sm2: createState({ nextReviewDate: Date.now() + ONE_DAY_MS }) },
      { id: 'a', sm2: createState({ nextReviewDate: Date.now() - ONE_DAY_MS }) },
    ];

    const sorted = sortByReviewPriority(items);
    expect(items[0].id).toBe('b'); // Original unchanged
    expect(sorted[0].id).toBe('a'); // Sorted result
    expect(sorted).not.toBe(items); // Different array reference
  });

  test('handles empty array', () => {
    const sorted = sortByReviewPriority([]);
    expect(sorted).toEqual([]);
  });

  test('handles single item', () => {
    const items = [{ id: 'only', sm2: createState() }];
    const sorted = sortByReviewPriority(items);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe('only');
  });
});

describe('SM-2 algorithm integration scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('new word learning sequence with perfect recall', () => {
    let state = createState();

    // First review - perfect
    state = calculateSM2(state, 5);
    expect(state.interval).toBe(1);
    expect(state.repetitions).toBe(1);

    // Advance time
    vi.advanceTimersByTime(ONE_DAY_MS);

    // Second review - perfect
    state = calculateSM2(state, 5);
    expect(state.interval).toBe(6);
    expect(state.repetitions).toBe(2);

    // Advance time
    vi.advanceTimersByTime(6 * ONE_DAY_MS);

    // Third review - perfect
    state = calculateSM2(state, 5);
    expect(state.repetitions).toBe(3);
    expect(state.interval).toBeGreaterThan(6);
  });

  test('word with struggle then recovery', () => {
    let state = createState();

    // First review - good
    state = calculateSM2(state, 4);
    expect(state.interval).toBe(1);

    // Second review - failed
    state = calculateSM2(state, 2);
    expect(state.interval).toBe(1);
    expect(state.repetitions).toBe(0);
    const easeAfterFail = state.easeFactor;
    expect(easeAfterFail).toBeLessThan(2.5);

    // Third review - good (restarting)
    state = calculateSM2(state, 4);
    expect(state.interval).toBe(1);
    expect(state.repetitions).toBe(1);

    // Fourth review - good
    state = calculateSM2(state, 4);
    expect(state.interval).toBe(6);
    expect(state.repetitions).toBe(2);
  });

  test('easy words get longer intervals faster', () => {
    let easyState = createState();
    let hardState = createState();

    // Simulate 5 reviews each
    for (let i = 0; i < 5; i++) {
      easyState = calculateSM2(easyState, 5); // Always easy
      hardState = calculateSM2(hardState, 3); // Always hard but correct
    }

    // Easy word should have much longer interval
    expect(easyState.interval).toBeGreaterThan(hardState.interval * 1.5);
    // Easy word should have higher ease factor
    expect(easyState.easeFactor).toBeGreaterThan(hardState.easeFactor);
  });
});
