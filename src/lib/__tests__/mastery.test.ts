import { describe, test, expect } from 'vitest';
import {
  calculateStrengthChange,
  calculateDecay,
  calculateLessonStrength,
} from '../mastery';

describe('calculateStrengthChange', () => {
  test('correct answer increases strength by 10', () => {
    expect(calculateStrengthChange(50, true)).toBe(60);
  });

  test('correct answer caps strength at 100', () => {
    expect(calculateStrengthChange(95, true)).toBe(100);
  });

  test('incorrect answer decreases strength by 20', () => {
    expect(calculateStrengthChange(50, false)).toBe(30);
  });

  test('incorrect answer has minimum of 0', () => {
    expect(calculateStrengthChange(10, false)).toBe(0);
    expect(calculateStrengthChange(5, false)).toBe(0);
  });

  test('handles edge cases at boundaries', () => {
    expect(calculateStrengthChange(0, true)).toBe(10);
    expect(calculateStrengthChange(100, true)).toBe(100);
    expect(calculateStrengthChange(0, false)).toBe(0);
    expect(calculateStrengthChange(100, false)).toBe(80);
  });
});

describe('calculateDecay', () => {
  test('no decay within first 3 days', () => {
    expect(calculateDecay(100, 0)).toBe(100);
    expect(calculateDecay(100, 1)).toBe(100);
    expect(calculateDecay(100, 2)).toBe(100);
    expect(calculateDecay(100, 3)).toBe(100);
  });

  test('strength decays 5% per day after 3 days', () => {
    // Day 4: 1 day of decay = 5%
    expect(calculateDecay(100, 4)).toBe(95);
    // Day 5: 2 days of decay = 10%
    expect(calculateDecay(100, 5)).toBe(90);
    // Day 6: 3 days of decay = 15%
    expect(calculateDecay(100, 6)).toBe(85);
  });

  test('decay has minimum of 0', () => {
    // 30 days of decay would be 135% decay, but minimum is 0
    expect(calculateDecay(100, 30)).toBe(0);
  });

  test('decay works with partial strength', () => {
    expect(calculateDecay(50, 5)).toBe(40); // 50 - (2 * 5) = 40
  });
});

describe('calculateLessonStrength', () => {
  test('calculates weighted average of vocab, grammar, and exercises', () => {
    // 50% vocab + 30% grammar + 20% exercise accuracy
    const result = calculateLessonStrength({
      avgVocabStrength: 100,
      avgGrammarStrength: 100,
      exerciseAccuracy: 100,
    });
    expect(result).toBe(100);
  });

  test('weights components correctly', () => {
    // 80 * 0.5 = 40
    // 60 * 0.3 = 18
    // 50 * 0.2 = 10
    // Total = 68
    const result = calculateLessonStrength({
      avgVocabStrength: 80,
      avgGrammarStrength: 60,
      exerciseAccuracy: 50,
    });
    expect(result).toBe(68);
  });

  test('handles zero values', () => {
    const result = calculateLessonStrength({
      avgVocabStrength: 0,
      avgGrammarStrength: 0,
      exerciseAccuracy: 0,
    });
    expect(result).toBe(0);
  });

  test('rounds to nearest integer', () => {
    // 33 * 0.5 = 16.5
    // 33 * 0.3 = 9.9
    // 33 * 0.2 = 6.6
    // Total = 33 (rounded)
    const result = calculateLessonStrength({
      avgVocabStrength: 33,
      avgGrammarStrength: 33,
      exerciseAccuracy: 33,
    });
    expect(result).toBe(33);
  });
});
