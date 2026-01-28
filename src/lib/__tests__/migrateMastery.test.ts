/**
 * Tests for Mastery Migration and Encounter Tracking
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  migrateStrengthToSM2,
  estimateEncountersFromLegacy,
  addEncounter,
  hasReachedTargetEncounters,
  getEncounterProgress,
  migrateLegacyMastery,
  needsMigration,
  DEFAULT_ENCOUNTER_DATA,
  TARGET_ENCOUNTERS,
  type EncounterData,
} from '../migrateMastery';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('DEFAULT_ENCOUNTER_DATA', () => {
  test('has correct default values', () => {
    expect(DEFAULT_ENCOUNTER_DATA.total).toBe(0);
    expect(DEFAULT_ENCOUNTER_DATA.byType.exercise).toBe(0);
    expect(DEFAULT_ENCOUNTER_DATA.byType.flashcard).toBe(0);
    expect(DEFAULT_ENCOUNTER_DATA.byType.reading).toBe(0);
    expect(DEFAULT_ENCOUNTER_DATA.byType.listening).toBe(0);
    expect(DEFAULT_ENCOUNTER_DATA.history).toEqual([]);
  });
});

describe('TARGET_ENCOUNTERS', () => {
  test('is 12 (Paul Nation research)', () => {
    expect(TARGET_ENCOUNTERS).toBe(12);
  });
});

describe('migrateStrengthToSM2', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('strength 0-19 (new)', () => {
    test('strength 0 creates new item due immediately', () => {
      const result = migrateStrengthToSM2(0, '2025-01-10T12:00:00Z');
      expect(result.easeFactor).toBe(2.5);
      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.nextReviewDate).toBe(Date.now());
    });

    test('strength 19 creates new item due immediately', () => {
      const result = migrateStrengthToSM2(19, '2025-01-10T12:00:00Z');
      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('strength 20-39 (learning)', () => {
    test('strength 20 creates learning item', () => {
      const lastPracticed = '2025-01-14T12:00:00Z';
      const result = migrateStrengthToSM2(20, lastPracticed);
      expect(result.easeFactor).toBe(2.3);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      // Due 1 day after last practiced
      const expectedDate = new Date(lastPracticed).getTime() + ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });

    test('strength 39 creates learning item', () => {
      const result = migrateStrengthToSM2(39, '2025-01-14T12:00:00Z');
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });
  });

  describe('strength 40-59 (familiar)', () => {
    test('strength 40 creates familiar item', () => {
      const lastPracticed = '2025-01-12T12:00:00Z';
      const result = migrateStrengthToSM2(40, lastPracticed);
      expect(result.easeFactor).toBe(2.5);
      expect(result.interval).toBe(3);
      expect(result.repetitions).toBe(2);
      // Due 3 days after last practiced
      const expectedDate = new Date(lastPracticed).getTime() + 3 * ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });

    test('strength 59 creates familiar item', () => {
      const result = migrateStrengthToSM2(59, '2025-01-12T12:00:00Z');
      expect(result.interval).toBe(3);
      expect(result.repetitions).toBe(2);
    });
  });

  describe('strength 60-79 (comfortable)', () => {
    test('strength 60 creates comfortable item', () => {
      const lastPracticed = '2025-01-08T12:00:00Z';
      const result = migrateStrengthToSM2(60, lastPracticed);
      expect(result.easeFactor).toBe(2.6);
      expect(result.interval).toBe(7);
      expect(result.repetitions).toBe(3);
      // Due 7 days after last practiced
      const expectedDate = new Date(lastPracticed).getTime() + 7 * ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });

    test('strength 79 creates comfortable item', () => {
      const result = migrateStrengthToSM2(79, '2025-01-08T12:00:00Z');
      expect(result.interval).toBe(7);
      expect(result.repetitions).toBe(3);
    });
  });

  describe('strength 80-100 (mastered)', () => {
    test('strength 80 creates mastered item', () => {
      const lastPracticed = '2025-01-01T12:00:00Z';
      const result = migrateStrengthToSM2(80, lastPracticed);
      expect(result.easeFactor).toBe(2.7);
      expect(result.interval).toBe(14);
      expect(result.repetitions).toBe(4);
      // Due 14 days after last practiced
      const expectedDate = new Date(lastPracticed).getTime() + 14 * ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });

    test('strength 100 creates mastered item', () => {
      const result = migrateStrengthToSM2(100, '2025-01-01T12:00:00Z');
      expect(result.interval).toBe(14);
      expect(result.repetitions).toBe(4);
      expect(result.easeFactor).toBe(2.7);
    });
  });

  describe('invalid date handling', () => {
    test('invalid lastPracticed uses current time', () => {
      const result = migrateStrengthToSM2(50, 'invalid-date');
      // For familiar (strength 50), should use now as base
      const expectedDate = Date.now() + 3 * ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });

    test('empty lastPracticed uses current time', () => {
      const result = migrateStrengthToSM2(50, '');
      const expectedDate = Date.now() + 3 * ONE_DAY_MS;
      expect(result.nextReviewDate).toBe(expectedDate);
    });
  });
});

describe('estimateEncountersFromLegacy', () => {
  test('sums timesCorrect and timesIncorrect as exercise encounters', () => {
    const legacy = {
      strength: 50,
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 8,
      timesIncorrect: 2,
    };

    const result = estimateEncountersFromLegacy(legacy);
    expect(result.total).toBe(10);
    expect(result.byType.exercise).toBe(10);
    expect(result.byType.flashcard).toBe(0);
    expect(result.byType.reading).toBe(0);
    expect(result.byType.listening).toBe(0);
  });

  test('handles zero encounters', () => {
    const legacy = {
      strength: 0,
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 0,
      timesIncorrect: 0,
    };

    const result = estimateEncountersFromLegacy(legacy);
    expect(result.total).toBe(0);
  });

  test('history is empty (cannot be reconstructed)', () => {
    const legacy = {
      strength: 50,
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 10,
      timesIncorrect: 5,
    };

    const result = estimateEncountersFromLegacy(legacy);
    expect(result.history).toEqual([]);
  });
});

describe('addEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('increments total count', () => {
    const result = addEncounter(DEFAULT_ENCOUNTER_DATA, 'exercise');
    expect(result.total).toBe(1);
  });

  test('increments correct type count', () => {
    let data = DEFAULT_ENCOUNTER_DATA;
    data = addEncounter(data, 'exercise');
    data = addEncounter(data, 'flashcard');
    data = addEncounter(data, 'exercise');

    expect(data.byType.exercise).toBe(2);
    expect(data.byType.flashcard).toBe(1);
    expect(data.byType.reading).toBe(0);
    expect(data.byType.listening).toBe(0);
  });

  test('adds entry to history with timestamp', () => {
    const result = addEncounter(DEFAULT_ENCOUNTER_DATA, 'reading');
    expect(result.history).toHaveLength(1);
    expect(result.history[0].type).toBe('reading');
    expect(result.history[0].date).toBe(Date.now());
  });

  test('prepends new entries to history (most recent first)', () => {
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'));
    let data = addEncounter(DEFAULT_ENCOUNTER_DATA, 'exercise');

    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    data = addEncounter(data, 'flashcard');

    expect(data.history[0].type).toBe('flashcard'); // Most recent
    expect(data.history[1].type).toBe('exercise');
  });

  test('caps history at 20 entries', () => {
    let data = DEFAULT_ENCOUNTER_DATA;

    // Add 25 encounters
    for (let i = 0; i < 25; i++) {
      vi.advanceTimersByTime(1000);
      data = addEncounter(data, 'exercise');
    }

    expect(data.total).toBe(25);
    expect(data.history).toHaveLength(20);
  });

  test('does not mutate original data', () => {
    const original: EncounterData = {
      total: 5,
      byType: { exercise: 3, flashcard: 2, reading: 0, listening: 0 },
      history: [],
    };

    const result = addEncounter(original, 'reading');

    expect(original.total).toBe(5);
    expect(original.byType.reading).toBe(0);
    expect(result.total).toBe(6);
    expect(result.byType.reading).toBe(1);
  });
});

describe('hasReachedTargetEncounters', () => {
  test('returns false when below target', () => {
    const data: EncounterData = {
      total: 5,
      byType: { exercise: 5, flashcard: 0, reading: 0, listening: 0 },
      history: [],
    };
    expect(hasReachedTargetEncounters(data)).toBe(false);
  });

  test('returns true when at exactly target (12)', () => {
    const data: EncounterData = {
      total: 12,
      byType: { exercise: 12, flashcard: 0, reading: 0, listening: 0 },
      history: [],
    };
    expect(hasReachedTargetEncounters(data)).toBe(true);
  });

  test('returns true when above target', () => {
    const data: EncounterData = {
      total: 20,
      byType: { exercise: 15, flashcard: 5, reading: 0, listening: 0 },
      history: [],
    };
    expect(hasReachedTargetEncounters(data)).toBe(true);
  });

  test('returns false for zero encounters', () => {
    expect(hasReachedTargetEncounters(DEFAULT_ENCOUNTER_DATA)).toBe(false);
  });
});

describe('getEncounterProgress', () => {
  test('returns 0 for zero encounters', () => {
    expect(getEncounterProgress(DEFAULT_ENCOUNTER_DATA)).toBe(0);
  });

  test('returns correct percentage', () => {
    const data: EncounterData = {
      total: 6,
      byType: { exercise: 6, flashcard: 0, reading: 0, listening: 0 },
      history: [],
    };
    expect(getEncounterProgress(data)).toBe(50); // 6/12 = 50%
  });

  test('rounds to nearest integer', () => {
    const data: EncounterData = {
      total: 7,
      byType: { exercise: 7, flashcard: 0, reading: 0, listening: 0 },
      history: [],
    };
    expect(getEncounterProgress(data)).toBe(58); // 7/12 = 58.33... → 58
  });

  test('caps at 100 for encounters above target', () => {
    const data: EncounterData = {
      total: 20,
      byType: { exercise: 20, flashcard: 0, reading: 0, listening: 0 },
      history: [],
    };
    expect(getEncounterProgress(data)).toBe(100);
  });

  test('returns 100 at exactly target', () => {
    const data: EncounterData = {
      total: 12,
      byType: { exercise: 12, flashcard: 0, reading: 0, listening: 0 },
      history: [],
    };
    expect(getEncounterProgress(data)).toBe(100);
  });
});

describe('migrateLegacyMastery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns both sm2 and encounters data', () => {
    const legacy = {
      strength: 60,
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 15,
      timesIncorrect: 3,
    };

    const result = migrateLegacyMastery(legacy);

    // Check SM2 state
    expect(result.sm2.easeFactor).toBe(2.6);
    expect(result.sm2.interval).toBe(7);
    expect(result.sm2.repetitions).toBe(3);

    // Check encounters
    expect(result.encounters.total).toBe(18);
    expect(result.encounters.byType.exercise).toBe(18);
  });

  test('handles new word (strength 0)', () => {
    const legacy = {
      strength: 0,
      lastPracticed: '2025-01-15T12:00:00Z',
      timesCorrect: 0,
      timesIncorrect: 0,
    };

    const result = migrateLegacyMastery(legacy);

    expect(result.sm2.repetitions).toBe(0);
    expect(result.sm2.interval).toBe(0);
    expect(result.encounters.total).toBe(0);
  });

  test('handles mastered word (strength 100)', () => {
    const legacy = {
      strength: 100,
      lastPracticed: '2025-01-01T12:00:00Z',
      timesCorrect: 50,
      timesIncorrect: 5,
    };

    const result = migrateLegacyMastery(legacy);

    expect(result.sm2.repetitions).toBe(4);
    expect(result.sm2.interval).toBe(14);
    expect(result.sm2.easeFactor).toBe(2.7);
    expect(result.encounters.total).toBe(55);
  });
});

describe('needsMigration', () => {
  test('returns false for null', () => {
    expect(needsMigration(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(needsMigration(undefined)).toBe(false);
  });

  test('returns false for non-object', () => {
    expect(needsMigration('string')).toBe(false);
    expect(needsMigration(123)).toBe(false);
    expect(needsMigration(true)).toBe(false);
  });

  test('returns true for legacy mastery without sm2', () => {
    const legacy = {
      strength: 50,
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 10,
      timesIncorrect: 2,
    };
    expect(needsMigration(legacy)).toBe(true);
  });

  test('returns false when sm2 field exists', () => {
    const migrated = {
      strength: 50,
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 10,
      timesIncorrect: 2,
      sm2: {
        easeFactor: 2.5,
        interval: 3,
        repetitions: 2,
        nextReviewDate: Date.now(),
      },
    };
    expect(needsMigration(migrated)).toBe(false);
  });

  test('returns false without strength field', () => {
    const incomplete = {
      lastPracticed: '2025-01-10T12:00:00Z',
      timesCorrect: 10,
    };
    expect(needsMigration(incomplete)).toBe(false);
  });

  test('returns false without lastPracticed field', () => {
    const incomplete = {
      strength: 50,
      timesCorrect: 10,
    };
    expect(needsMigration(incomplete)).toBe(false);
  });

  test('returns false when strength is not a number', () => {
    const invalid = {
      strength: '50',
      lastPracticed: '2025-01-10T12:00:00Z',
    };
    expect(needsMigration(invalid)).toBe(false);
  });
});
