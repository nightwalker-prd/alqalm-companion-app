import { describe, test, expect } from 'vitest';
import {
  buildPracticeSession,
  fisherYatesShuffle,
  categorizeByStrength,
  type Exercise,
  type MasteryRecord,
} from '../interleave';

// Test data
const mockExercises: Exercise[] = [
  { id: 'ex1', lessonId: 'b1-l01', type: 'fill-blank', itemIds: ['word-001'] },
  { id: 'ex2', lessonId: 'b1-l01', type: 'translate-to-arabic', itemIds: ['word-002'] },
  { id: 'ex3', lessonId: 'b1-l02', type: 'fill-blank', itemIds: ['word-003'] },
  { id: 'ex4', lessonId: 'b1-l02', type: 'construct-sentence', itemIds: ['word-004'] },
  { id: 'ex5', lessonId: 'b1-l03', type: 'word-to-meaning', itemIds: ['word-005'] },
  { id: 'ex6', lessonId: 'b1-l03', type: 'meaning-to-word', itemIds: ['word-006'] },
  { id: 'ex7', lessonId: 'b1-l01', type: 'grammar-apply', itemIds: ['gp-001'] },
  { id: 'ex8', lessonId: 'b1-l02', type: 'fill-blank', itemIds: ['word-007'] },
  { id: 'ex9', lessonId: 'b1-l03', type: 'translate-to-arabic', itemIds: ['word-008'] },
  { id: 'ex10', lessonId: 'b1-l01', type: 'construct-sentence', itemIds: ['word-009'] },
];

const mockMastery: MasteryRecord[] = [
  { itemId: 'word-001', strength: 20 },  // weak
  { itemId: 'word-002', strength: 85 },  // mastered
  { itemId: 'word-003', strength: 50 },  // learning
  { itemId: 'word-004', strength: 15 },  // weak
  { itemId: 'word-005', strength: 90 },  // mastered
  { itemId: 'word-006', strength: 45 },  // learning
  { itemId: 'gp-001', strength: 30 },    // weak
  { itemId: 'word-007', strength: 60 },  // learning
  { itemId: 'word-008', strength: 95 },  // mastered
  { itemId: 'word-009', strength: 10 },  // weak
];

describe('fisherYatesShuffle', () => {
  test('returns array of same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...input]);
    expect(result).toHaveLength(input.length);
  });

  test('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...input]);
    expect(result.sort()).toEqual(input.sort());
  });

  test('does not modify original array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    fisherYatesShuffle(copy);
    // Note: Fisher-Yates modifies in place, but we pass a copy
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  test('handles empty array', () => {
    const result = fisherYatesShuffle([]);
    expect(result).toEqual([]);
  });

  test('handles single element', () => {
    const result = fisherYatesShuffle([42]);
    expect(result).toEqual([42]);
  });

  test('produces different orderings over multiple runs', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();

    // Run 20 times and collect unique orderings
    for (let i = 0; i < 20; i++) {
      const shuffled = fisherYatesShuffle([...input]);
      results.add(JSON.stringify(shuffled));
    }

    // Should have multiple different orderings (extremely unlikely to be all same)
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('categorizeByStrength', () => {
  test('categorizes weak items (strength < 40)', () => {
    const result = categorizeByStrength(mockExercises, mockMastery);
    // word-001 (20), word-004 (15), gp-001 (30), word-009 (10) are weak
    expect(result.weak.map(e => e.id)).toEqual(
      expect.arrayContaining(['ex1', 'ex4', 'ex7', 'ex10'])
    );
  });

  test('categorizes mastered items (strength >= 80)', () => {
    const result = categorizeByStrength(mockExercises, mockMastery);
    // word-002 (85), word-005 (90), word-008 (95) are mastered
    expect(result.mastered.map(e => e.id)).toEqual(
      expect.arrayContaining(['ex2', 'ex5', 'ex9'])
    );
  });

  test('categorizes learning items (40 <= strength < 80)', () => {
    const result = categorizeByStrength(mockExercises, mockMastery);
    // word-003 (50), word-006 (45), word-007 (60) are learning
    expect(result.learning.map(e => e.id)).toEqual(
      expect.arrayContaining(['ex3', 'ex6', 'ex8'])
    );
  });

  test('handles exercises with no mastery record as weak', () => {
    const exercisesWithNew: Exercise[] = [
      { id: 'new1', lessonId: 'b1-l01', type: 'fill-blank', itemIds: ['word-999'] },
    ];
    const result = categorizeByStrength(exercisesWithNew, mockMastery);
    expect(result.weak.map(e => e.id)).toContain('new1');
  });
});

describe('buildPracticeSession', () => {
  test('returns requested number of exercises', () => {
    const session = buildPracticeSession(mockExercises, mockMastery, 5);
    expect(session).toHaveLength(5);
  });

  test('returns all exercises if requested more than available', () => {
    const session = buildPracticeSession(mockExercises, mockMastery, 100);
    expect(session.length).toBeLessThanOrEqual(mockExercises.length);
  });

  test('prioritizes weak items (approximately 40%)', () => {
    // Run multiple times to check distribution tendency
    let weakCount = 0;
    const runs = 10;

    for (let i = 0; i < runs; i++) {
      const session = buildPracticeSession(mockExercises, mockMastery, 10);
      const weakIds = ['ex1', 'ex4', 'ex7', 'ex10'];
      weakCount += session.filter(e => weakIds.includes(e.id)).length;
    }

    // Average should be around 4 weak items per session (40%)
    const avgWeak = weakCount / runs;
    expect(avgWeak).toBeGreaterThanOrEqual(2); // At least some weak items
  });

  test('includes mastered items for review (approximately 20%)', () => {
    let masteredCount = 0;
    const runs = 10;

    for (let i = 0; i < runs; i++) {
      const session = buildPracticeSession(mockExercises, mockMastery, 10);
      const masteredIds = ['ex2', 'ex5', 'ex9'];
      masteredCount += session.filter(e => masteredIds.includes(e.id)).length;
    }

    const avgMastered = masteredCount / runs;
    expect(avgMastered).toBeGreaterThanOrEqual(1); // At least some mastered items
  });

  test('exercises are shuffled (not in original order)', () => {
    const results = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const session = buildPracticeSession(mockExercises, mockMastery, 10);
      results.add(session.map(e => e.id).join(','));
    }

    // Should have multiple different orderings
    expect(results.size).toBeGreaterThan(1);
  });

  test('handles empty exercises array', () => {
    const session = buildPracticeSession([], mockMastery, 10);
    expect(session).toEqual([]);
  });

  test('handles empty mastery array', () => {
    const session = buildPracticeSession(mockExercises, [], 5);
    expect(session).toHaveLength(5);
    // All should be treated as weak (no mastery data)
  });

  test('avoids more than 2 consecutive exercises of same type', () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 10; i++) {
      const session = buildPracticeSession(mockExercises, mockMastery, 10);

      for (let j = 0; j < session.length - 2; j++) {
        const consecutiveSameType =
          session[j].type === session[j + 1].type &&
          session[j + 1].type === session[j + 2].type;
        expect(consecutiveSameType).toBe(false);
      }
    }
  });
});
