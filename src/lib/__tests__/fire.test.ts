import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getInterval,
  getDaysSinceRep,
  getDecayedMemory,
  isDue,
  getDaysOverdue,
  getDaysUntilDue,
  updateFIReState,
  applyImplicitCredit,
  applyImplicitPenalty,
  flowCreditDown,
  flowPenaltyUp,
  selectOptimalReviews,
  sortByReviewPriority,
  calibrateLearningSpeed,
  createFIReState,
  estimateRetention,
  isChallengeCandidate,
  simpleToQuality,
} from '../fire';
import type { FIReState, EncompassingGraph, RepetitionResult } from '../../types/fire';
import { DEFAULT_FIRE_CONFIG } from '../../types/fire';

// Mock Date.now for consistent testing
const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('FIRe Algorithm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  describe('getInterval', () => {
    test('returns 1 day for repNum < 1', () => {
      expect(getInterval(0)).toBe(1);
      expect(getInterval(0.5)).toBe(1);
    });

    test('returns 1 day for repNum 1', () => {
      expect(getInterval(1)).toBe(1);
      expect(getInterval(1.5)).toBe(1);
    });

    test('returns 6 days for repNum 2', () => {
      expect(getInterval(2)).toBe(6);
      expect(getInterval(2.5)).toBe(6);
    });

    test('returns exponential growth for repNum 3+', () => {
      expect(getInterval(3)).toBe(4); // 2^(3-1) = 4
      expect(getInterval(4)).toBe(8); // 2^(4-1) = 8
      expect(getInterval(5)).toBe(16); // 2^(5-1) = 16
    });

    test('caps at 365 days', () => {
      expect(getInterval(10)).toBe(365);
      expect(getInterval(15)).toBe(365);
    });
  });

  describe('getDaysSinceRep', () => {
    test('returns 0 for current time', () => {
      expect(getDaysSinceRep(NOW)).toBe(0);
    });

    test('returns correct days', () => {
      expect(getDaysSinceRep(NOW - ONE_DAY_MS)).toBe(1);
      expect(getDaysSinceRep(NOW - 3 * ONE_DAY_MS)).toBe(3);
      expect(getDaysSinceRep(NOW - 7 * ONE_DAY_MS)).toBe(7);
    });
  });

  describe('getDecayedMemory', () => {
    test('returns full memory for just-reviewed item', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW,
        learningSpeed: 1,
      };
      expect(getDecayedMemory(state)).toBe(1);
    });

    test('returns half memory at interval', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 6 * ONE_DAY_MS, // 6 days ago, interval for repNum 2 is 6
        learningSpeed: 1,
      };
      const decayed = getDecayedMemory(state);
      expect(decayed).toBeCloseTo(0.5, 1);
    });

    test('decays further when overdue', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 12 * ONE_DAY_MS, // 12 days ago, 2x interval
        learningSpeed: 1,
      };
      const decayed = getDecayedMemory(state);
      expect(decayed).toBeCloseTo(0.25, 1);
    });
  });

  describe('isDue', () => {
    test('returns true when memory below threshold', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 0.3,
        lastRepDate: NOW,
        learningSpeed: 1,
      };
      expect(isDue(state)).toBe(true);
    });

    test('returns true when past interval', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 7 * ONE_DAY_MS, // Past 6 day interval
        learningSpeed: 1,
      };
      expect(isDue(state)).toBe(true);
    });

    test('returns false when within interval and memory high', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 3 * ONE_DAY_MS, // Within 6 day interval
        learningSpeed: 1,
      };
      expect(isDue(state)).toBe(false);
    });
  });

  describe('getDaysOverdue', () => {
    test('returns 0 when not overdue', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 3 * ONE_DAY_MS,
        learningSpeed: 1,
      };
      expect(getDaysOverdue(state)).toBe(0);
    });

    test('returns correct days when overdue', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 10 * ONE_DAY_MS, // 4 days overdue (10 - 6)
        learningSpeed: 1,
      };
      expect(getDaysOverdue(state)).toBe(4);
    });
  });

  describe('getDaysUntilDue', () => {
    test('returns positive days when not due', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 3 * ONE_DAY_MS,
        learningSpeed: 1,
      };
      expect(getDaysUntilDue(state)).toBe(3);
    });

    test('returns negative days when overdue', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 10 * ONE_DAY_MS,
        learningSpeed: 1,
      };
      expect(getDaysUntilDue(state)).toBe(-4);
    });
  });

  describe('updateFIReState', () => {
    test('increases repNum on pass', () => {
      const state: FIReState = {
        repNum: 1,
        memory: 0.5,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 1,
      };
      const updated = updateFIReState(state, true);
      expect(updated.repNum).toBeGreaterThan(state.repNum);
      expect(updated.memory).toBeGreaterThan(0.5);
    });

    test('decreases repNum on fail', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 0.5,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 1,
      };
      const updated = updateFIReState(state, false);
      expect(updated.repNum).toBeLessThan(state.repNum);
      expect(updated.memory).toBeLessThan(0.5);
    });

    test('respects learning speed multiplier', () => {
      const fastLearner: FIReState = {
        repNum: 1,
        memory: 0.5,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 1.5,
      };
      const slowLearner: FIReState = {
        repNum: 1,
        memory: 0.5,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 0.7,
      };
      const fastUpdated = updateFIReState(fastLearner, true);
      const slowUpdated = updateFIReState(slowLearner, true);
      expect(fastUpdated.repNum).toBeGreaterThan(slowUpdated.repNum);
    });

    test('amplifies penalty when overdue', () => {
      const state: FIReState = {
        repNum: 3,
        memory: 0.5,
        lastRepDate: NOW - 30 * ONE_DAY_MS, // Very overdue
        learningSpeed: 1,
      };
      const updated = updateFIReState(state, false);
      // Penalty should be amplified due to being overdue
      expect(updated.repNum).toBeLessThan(2);
    });

    test('updates lastRepDate to now', () => {
      const state = createFIReState();
      state.lastRepDate = NOW - 5 * ONE_DAY_MS;
      const updated = updateFIReState(state, true);
      expect(updated.lastRepDate).toBe(NOW);
    });
  });

  describe('applyImplicitCredit', () => {
    test('applies fractional credit', () => {
      const state: FIReState = {
        repNum: 1,
        memory: 0.3,
        lastRepDate: NOW - 2 * ONE_DAY_MS,
        learningSpeed: 1,
      };
      const updated = applyImplicitCredit(state, 0.5);
      expect(updated.repNum).toBeGreaterThan(state.repNum);
    });

    test('discounts early repetitions (high memory)', () => {
      const state: FIReState = {
        repNum: 1,
        memory: 0.9,
        lastRepDate: NOW, // Just reviewed
        learningSpeed: 1,
      };
      const updated = applyImplicitCredit(state, 0.5);
      // Should be heavily discounted due to high memory
      expect(updated.repNum - state.repNum).toBeLessThan(0.3);
    });

    test('skips credit for slow learners by default', () => {
      const state: FIReState = {
        repNum: 1,
        memory: 0.3,
        lastRepDate: NOW - 2 * ONE_DAY_MS,
        learningSpeed: 0.8, // Below 1.0
      };
      const updated = applyImplicitCredit(state, 0.5);
      expect(updated.repNum).toBe(state.repNum); // No change
    });
  });

  describe('applyImplicitPenalty', () => {
    test('applies fractional penalty', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 0.7,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 1,
      };
      const updated = applyImplicitPenalty(state, 0.5);
      expect(updated.repNum).toBeLessThan(state.repNum);
      expect(updated.memory).toBeLessThan(state.memory);
    });

    test('does not go below 0', () => {
      const state: FIReState = {
        repNum: 0.1,
        memory: 0.1,
        lastRepDate: NOW,
        learningSpeed: 1,
      };
      const updated = applyImplicitPenalty(state, 1);
      expect(updated.repNum).toBeGreaterThanOrEqual(0);
      expect(updated.memory).toBeGreaterThanOrEqual(0);
    });
  });

  describe('flowCreditDown', () => {
    test('flows credit to encompassed items', () => {
      const graph: EncompassingGraph = {
        encompasses: {
          'word-A': [{ target: 'word-B', weight: 1.0 }],
          'word-B': [{ target: 'word-C', weight: 0.5 }],
        },
        encompassedBy: {
          'word-B': [{ target: 'word-A', weight: 1.0 }],
          'word-C': [{ target: 'word-B', weight: 0.5 }],
        },
      };

      const mastery: Record<string, FIReState> = {
        'word-A': { repNum: 2, memory: 0.5, lastRepDate: NOW, learningSpeed: 1 },
        'word-B': { repNum: 1, memory: 0.3, lastRepDate: NOW - ONE_DAY_MS, learningSpeed: 1 },
        'word-C': { repNum: 0.5, memory: 0.2, lastRepDate: NOW - 2 * ONE_DAY_MS, learningSpeed: 1 },
      };

      const originalB = mastery['word-B'].repNum;
      const originalC = mastery['word-C'].repNum;

      flowCreditDown('word-A', 1.0, graph, mastery);

      expect(mastery['word-B'].repNum).toBeGreaterThan(originalB);
      expect(mastery['word-C'].repNum).toBeGreaterThan(originalC);
    });

    test('respects weight in credit flow', () => {
      const graph: EncompassingGraph = {
        encompasses: {
          'word-A': [
            { target: 'word-B', weight: 1.0 },
            { target: 'word-C', weight: 0.3 },
          ],
        },
        encompassedBy: {},
      };

      const mastery: Record<string, FIReState> = {
        'word-A': { repNum: 2, memory: 0.5, lastRepDate: NOW, learningSpeed: 1 },
        'word-B': { repNum: 1, memory: 0.3, lastRepDate: NOW - 3 * ONE_DAY_MS, learningSpeed: 1 },
        'word-C': { repNum: 1, memory: 0.3, lastRepDate: NOW - 3 * ONE_DAY_MS, learningSpeed: 1 },
      };

      const originalB = mastery['word-B'].repNum;
      const originalC = mastery['word-C'].repNum;

      flowCreditDown('word-A', 1.0, graph, mastery);

      const creditB = mastery['word-B'].repNum - originalB;
      const creditC = mastery['word-C'].repNum - originalC;

      // B should get more credit than C due to higher weight
      expect(creditB).toBeGreaterThan(creditC);
    });
  });

  describe('flowPenaltyUp', () => {
    test('flows penalty to encompassing items', () => {
      const graph: EncompassingGraph = {
        encompasses: {
          'word-A': [{ target: 'word-B', weight: 1.0 }],
        },
        encompassedBy: {
          'word-B': [{ target: 'word-A', weight: 1.0 }],
        },
      };

      const mastery: Record<string, FIReState> = {
        'word-A': { repNum: 2, memory: 0.8, lastRepDate: NOW, learningSpeed: 1 },
        'word-B': { repNum: 1, memory: 0.5, lastRepDate: NOW, learningSpeed: 1 },
      };

      const originalA = mastery['word-A'].repNum;

      flowPenaltyUp('word-B', 1.0, graph, mastery);

      expect(mastery['word-A'].repNum).toBeLessThan(originalA);
    });
  });

  describe('selectOptimalReviews', () => {
    test('selects items that knock out the most due items', () => {
      const graph: EncompassingGraph = {
        encompasses: {
          'word-A': [
            { target: 'word-B', weight: 1.0 },
            { target: 'word-C', weight: 0.8 },
          ],
        },
        encompassedBy: {
          'word-B': [{ target: 'word-A', weight: 1.0 }],
          'word-C': [{ target: 'word-A', weight: 0.8 }],
        },
      };

      const dueItems = ['word-A', 'word-B', 'word-C', 'word-D'];
      const selected = selectOptimalReviews(dueItems, graph, 2);

      // word-A should be selected first because it knocks out B and C
      expect(selected[0]).toBe('word-A');
      // Then word-D since B and C are knocked out
      expect(selected[1]).toBe('word-D');
    });

    test('returns all items if no knockouts possible', () => {
      const graph: EncompassingGraph = {
        encompasses: {},
        encompassedBy: {},
      };

      const dueItems = ['word-A', 'word-B', 'word-C'];
      const selected = selectOptimalReviews(dueItems, graph, 3);

      expect(selected).toHaveLength(3);
      expect(selected).toContain('word-A');
      expect(selected).toContain('word-B');
      expect(selected).toContain('word-C');
    });
  });

  describe('sortByReviewPriority', () => {
    test('sorts overdue items first', () => {
      const items = [
        { id: 'A', fire: { repNum: 2, memory: 0.8, lastRepDate: NOW - 3 * ONE_DAY_MS, learningSpeed: 1 } },
        { id: 'B', fire: { repNum: 2, memory: 0.5, lastRepDate: NOW - 10 * ONE_DAY_MS, learningSpeed: 1 } },
        { id: 'C', fire: { repNum: 2, memory: 0.3, lastRepDate: NOW - 8 * ONE_DAY_MS, learningSpeed: 1 } },
      ];

      const sorted = sortByReviewPriority(items);

      // B is most overdue (10 - 6 = 4 days)
      expect(sorted[0].id).toBe('B');
      // Then C (8 - 6 = 2 days)
      expect(sorted[1].id).toBe('C');
    });
  });

  describe('calibrateLearningSpeed', () => {
    test('slows down on unexpected failures', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 0.5,
        lastRepDate: NOW,
        learningSpeed: 1.0,
      };

      const results: RepetitionResult[] = [
        { passed: false, expectedToPass: true, timestamp: NOW - 3 * ONE_DAY_MS },
        { passed: false, expectedToPass: true, timestamp: NOW - 2 * ONE_DAY_MS },
        { passed: false, expectedToPass: true, timestamp: NOW - ONE_DAY_MS },
      ];

      const newSpeed = calibrateLearningSpeed(state, results);
      expect(newSpeed).toBeLessThan(state.learningSpeed);
    });

    test('speeds up on unexpected successes', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 0.5,
        lastRepDate: NOW,
        learningSpeed: 1.0,
      };

      const results: RepetitionResult[] = [
        { passed: true, expectedToPass: false, timestamp: NOW - 5 * ONE_DAY_MS },
        { passed: true, expectedToPass: false, timestamp: NOW - 4 * ONE_DAY_MS },
        { passed: true, expectedToPass: false, timestamp: NOW - 3 * ONE_DAY_MS },
        { passed: true, expectedToPass: false, timestamp: NOW - 2 * ONE_DAY_MS },
      ];

      const newSpeed = calibrateLearningSpeed(state, results);
      expect(newSpeed).toBeGreaterThan(state.learningSpeed);
    });

    test('does not change with insufficient data', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 0.5,
        lastRepDate: NOW,
        learningSpeed: 1.0,
      };

      const results: RepetitionResult[] = [
        { passed: true, expectedToPass: true, timestamp: NOW - ONE_DAY_MS },
      ];

      const newSpeed = calibrateLearningSpeed(state, results);
      expect(newSpeed).toBe(state.learningSpeed);
    });

    test('respects min/max bounds', () => {
      const slowState: FIReState = {
        repNum: 2,
        memory: 0.5,
        lastRepDate: NOW,
        learningSpeed: 0.5, // At minimum
      };

      const failResults: RepetitionResult[] = Array(10).fill({
        passed: false,
        expectedToPass: true,
        timestamp: NOW,
      });

      const newSlowSpeed = calibrateLearningSpeed(slowState, failResults);
      expect(newSlowSpeed).toBeGreaterThanOrEqual(DEFAULT_FIRE_CONFIG.minLearningSpeed);

      const fastState: FIReState = {
        repNum: 2,
        memory: 0.5,
        lastRepDate: NOW,
        learningSpeed: 2.0, // At maximum
      };

      const successResults: RepetitionResult[] = Array(10).fill({
        passed: true,
        expectedToPass: false,
        timestamp: NOW,
      });

      const newFastSpeed = calibrateLearningSpeed(fastState, successResults);
      expect(newFastSpeed).toBeLessThanOrEqual(DEFAULT_FIRE_CONFIG.maxLearningSpeed);
    });
  });

  describe('createFIReState', () => {
    test('creates default state with current timestamp', () => {
      const state = createFIReState();
      expect(state.repNum).toBe(0);
      expect(state.memory).toBe(0);
      expect(state.lastRepDate).toBe(NOW);
      expect(state.learningSpeed).toBe(1.0);
    });
  });

  describe('estimateRetention', () => {
    test('returns decayed memory', () => {
      const state: FIReState = {
        repNum: 2,
        memory: 1,
        lastRepDate: NOW - 3 * ONE_DAY_MS,
        learningSpeed: 1,
      };
      const retention = estimateRetention(state);
      expect(retention).toBeGreaterThan(0.5);
      expect(retention).toBeLessThan(1);
    });
  });

  describe('isChallengeCandidate', () => {
    test('returns true for high repNum and memory', () => {
      const state: FIReState = {
        repNum: 4,
        memory: 0.9,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 1,
      };
      expect(isChallengeCandidate(state)).toBe(true);
    });

    test('returns false for low repNum', () => {
      const state: FIReState = {
        repNum: 1,
        memory: 0.9,
        lastRepDate: NOW - ONE_DAY_MS,
        learningSpeed: 1,
      };
      expect(isChallengeCandidate(state)).toBe(false);
    });

    test('returns false for low memory', () => {
      const state: FIReState = {
        repNum: 4,
        memory: 0.3,
        lastRepDate: NOW - 10 * ONE_DAY_MS,
        learningSpeed: 1,
      };
      expect(isChallengeCandidate(state)).toBe(false);
    });
  });

  describe('simpleToQuality', () => {
    test('returns 0 for incorrect', () => {
      expect(simpleToQuality(false)).toBe(0);
      expect(simpleToQuality(false, true)).toBe(0);
    });

    test('returns 1 for correct easy', () => {
      expect(simpleToQuality(true)).toBe(1);
    });

    test('returns 0.6 for correct hard', () => {
      expect(simpleToQuality(true, true)).toBe(0.6);
    });
  });
});
