import { describe, test, expect } from 'vitest';
import {
  normalizeArabic,
  normalizeArabicStrict,
  removeTashkeel,
  compareAnswers,
  compareAnswersStrict,
  computeCharDiff,
  isTashkeel,
  applyTashkeelScaffolding,
  getTashkeelLevelForStrength,
  countTashkeel,
} from '../arabic';

describe('removeTashkeel', () => {
  test('removes fatha (َ)', () => {
    expect(removeTashkeel('كَتَبَ')).toBe('كتب');
  });

  test('removes kasra (ِ)', () => {
    expect(removeTashkeel('كِتَابٌ')).toBe('كتاب');
  });

  test('removes damma (ُ)', () => {
    expect(removeTashkeel('كُتُبٌ')).toBe('كتب');
  });

  test('removes sukun (ْ)', () => {
    expect(removeTashkeel('مِنْ')).toBe('من');
  });

  test('removes shadda (ّ)', () => {
    expect(removeTashkeel('مُحَمَّدٌ')).toBe('محمد');
  });

  test('removes tanween fath (ً)', () => {
    expect(removeTashkeel('كِتَابًا')).toBe('كتابا');
  });

  test('removes tanween damm (ٌ)', () => {
    expect(removeTashkeel('كِتَابٌ')).toBe('كتاب');
  });

  test('removes tanween kasr (ٍ)', () => {
    expect(removeTashkeel('كِتَابٍ')).toBe('كتاب');
  });

  test('removes all tashkeel from complex word', () => {
    // الْمُسْلِمُونَ → المسلمون
    expect(removeTashkeel('الْمُسْلِمُونَ')).toBe('المسلمون');
  });

  test('handles text without tashkeel', () => {
    expect(removeTashkeel('كتاب')).toBe('كتاب');
  });

  test('handles empty string', () => {
    expect(removeTashkeel('')).toBe('');
  });
});

describe('normalizeArabic', () => {
  test('removes tashkeel', () => {
    expect(normalizeArabic('كِتَابٌ')).toBe('كتاب');
  });

  test('trims leading whitespace', () => {
    expect(normalizeArabic('  كتاب')).toBe('كتاب');
  });

  test('trims trailing whitespace', () => {
    expect(normalizeArabic('كتاب  ')).toBe('كتاب');
  });

  test('trims both leading and trailing whitespace', () => {
    expect(normalizeArabic('  كتاب  ')).toBe('كتاب');
  });

  test('normalizes multiple spaces between words to single space', () => {
    expect(normalizeArabic('هذا    كتاب')).toBe('هذا كتاب');
  });

  test('handles combination of whitespace and tashkeel', () => {
    expect(normalizeArabic('  هَذَا  كِتَابٌ  ')).toBe('هذا كتاب');
  });

  test('handles empty string', () => {
    expect(normalizeArabic('')).toBe('');
  });

  test('handles only whitespace', () => {
    expect(normalizeArabic('   ')).toBe('');
  });

  test('preserves Arabic letters', () => {
    const input = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي';
    expect(normalizeArabic(input)).toBe(input);
  });

  test('preserves hamza variations', () => {
    // Keep different hamza forms as they are significant
    expect(normalizeArabic('أ إ ؤ ئ ء')).toBe('أ إ ؤ ئ ء');
  });
});

describe('compareAnswers', () => {
  test('returns true for exact match', () => {
    expect(compareAnswers('كتاب', 'كتاب')).toBe(true);
  });

  test('returns true when tashkeel differs', () => {
    expect(compareAnswers('كِتَابٌ', 'كتاب')).toBe(true);
  });

  test('returns true when one has full tashkeel and other has partial', () => {
    expect(compareAnswers('كِتَابٌ', 'كِتَاب')).toBe(true);
  });

  test('returns true with whitespace differences', () => {
    expect(compareAnswers('  كتاب  ', 'كتاب')).toBe(true);
  });

  test('returns false for different words', () => {
    expect(compareAnswers('كتاب', 'قلم')).toBe(false);
  });

  test('returns false for similar but different words', () => {
    expect(compareAnswers('كتب', 'كتاب')).toBe(false);
  });

  test('handles full sentences', () => {
    expect(compareAnswers(
      'هَذَا كِتَابٌ',
      'هذا كتاب'
    )).toBe(true);
  });

  test('returns false for sentences with different word order', () => {
    expect(compareAnswers(
      'كتاب هذا',
      'هذا كتاب'
    )).toBe(false);
  });

  test('handles empty strings', () => {
    expect(compareAnswers('', '')).toBe(true);
  });

  test('returns false when only one is empty', () => {
    expect(compareAnswers('كتاب', '')).toBe(false);
    expect(compareAnswers('', 'كتاب')).toBe(false);
  });
});

describe('normalizeArabicStrict', () => {
  test('preserves tashkeel', () => {
    expect(normalizeArabicStrict('كِتَابٌ')).toBe('كِتَابٌ');
  });

  test('trims leading whitespace', () => {
    expect(normalizeArabicStrict('  كِتَابٌ')).toBe('كِتَابٌ');
  });

  test('trims trailing whitespace', () => {
    expect(normalizeArabicStrict('كِتَابٌ  ')).toBe('كِتَابٌ');
  });

  test('normalizes multiple spaces to single space', () => {
    expect(normalizeArabicStrict('هَذَا    كِتَابٌ')).toBe('هَذَا كِتَابٌ');
  });

  test('handles empty string', () => {
    expect(normalizeArabicStrict('')).toBe('');
  });
});

describe('compareAnswersStrict', () => {
  test('returns true for exact match with tashkeel', () => {
    expect(compareAnswersStrict('كِتَابٌ', 'كِتَابٌ')).toBe(true);
  });

  test('returns false when tashkeel differs', () => {
    expect(compareAnswersStrict('كِتَابٌ', 'كتاب')).toBe(false);
  });

  test('returns false when tashkeel is partial', () => {
    expect(compareAnswersStrict('كِتَابٌ', 'كِتَاب')).toBe(false);
  });

  test('returns true with whitespace differences but same tashkeel', () => {
    expect(compareAnswersStrict('  كِتَابٌ  ', 'كِتَابٌ')).toBe(true);
  });

  test('returns false for different words', () => {
    expect(compareAnswersStrict('كِتَابٌ', 'قَلَمٌ')).toBe(false);
  });

  test('handles full sentences with tashkeel', () => {
    expect(compareAnswersStrict(
      'هَذَا كِتَابٌ',
      'هَذَا كِتَابٌ'
    )).toBe(true);
  });

  test('returns false for same base letters different tashkeel', () => {
    // Same letters "هذا كتاب" but different tashkeel
    expect(compareAnswersStrict(
      'هَذَا كِتَابٌ',
      'هَذَا كِتَابٍ'  // tanween kasr vs tanween damm
    )).toBe(false);
  });

  test('handles empty strings', () => {
    expect(compareAnswersStrict('', '')).toBe(true);
  });
});

// ============================================================================
// Character-Level Diff Tests
// ============================================================================

describe('computeCharDiff', () => {
  test('returns all correct for identical strings', () => {
    const result = computeCharDiff('كتاب', 'كتاب');
    expect(result.similarity).toBe(1);
    expect(result.expected.every(c => c.type === 'correct')).toBe(true);
    expect(result.actual.every(c => c.type === 'correct')).toBe(true);
  });

  test('marks missing characters in expected', () => {
    const result = computeCharDiff('كتاب', 'كتب');
    // 'ا' is missing from actual
    expect(result.expected.some(c => c.char === 'ا' && c.type === 'missing')).toBe(true);
  });

  test('marks extra characters in actual', () => {
    const result = computeCharDiff('كتب', 'كتاب');
    // 'ا' is extra in actual
    expect(result.actual.some(c => c.char === 'ا' && c.type === 'extra')).toBe(true);
  });

  test('handles completely different strings', () => {
    const result = computeCharDiff('كتاب', 'قلم');
    expect(result.similarity).toBeLessThan(0.5);
  });

  test('handles empty expected string', () => {
    const result = computeCharDiff('', 'كتاب');
    expect(result.expected).toHaveLength(0);
    expect(result.actual.every(c => c.type === 'extra')).toBe(true);
    expect(result.similarity).toBe(0);
  });

  test('handles empty actual string', () => {
    const result = computeCharDiff('كتاب', '');
    expect(result.actual).toHaveLength(0);
    expect(result.expected.every(c => c.type === 'missing')).toBe(true);
    expect(result.similarity).toBe(0);
  });

  test('handles tashkeel differences', () => {
    const result = computeCharDiff('كِتَابٌ', 'كتاب');
    // Should mark tashkeel as missing
    expect(result.expected.filter(c => c.type === 'missing').length).toBeGreaterThan(0);
    // Base letters should be correct
    expect(result.expected.filter(c => c.type === 'correct').length).toBeGreaterThanOrEqual(4);
  });

  test('calculates correct similarity for partial match', () => {
    const result = computeCharDiff('الكتاب', 'الكتب');
    expect(result.similarity).toBeGreaterThan(0.5);
    expect(result.similarity).toBeLessThan(1);
  });

  test('handles single character strings', () => {
    const result = computeCharDiff('ك', 'ك');
    expect(result.similarity).toBe(1);
    expect(result.expected).toHaveLength(1);
    expect(result.actual).toHaveLength(1);
  });

  test('handles single character mismatch', () => {
    const result = computeCharDiff('ك', 'ب');
    expect(result.similarity).toBe(0);
    expect(result.expected[0].type).toBe('missing');
    expect(result.actual[0].type).toBe('extra');
  });

  test('preserves order of characters in diff', () => {
    const result = computeCharDiff('أبت', 'أبت');
    expect(result.expected.map(c => c.char).join('')).toBe('أبت');
    expect(result.actual.map(c => c.char).join('')).toBe('أبت');
  });
});

// ============================================================================
// Tashkeel Utility Tests
// ============================================================================

describe('isTashkeel', () => {
  test('returns true for fatha', () => {
    expect(isTashkeel('َ')).toBe(true);
  });

  test('returns true for kasra', () => {
    expect(isTashkeel('ِ')).toBe(true);
  });

  test('returns true for damma', () => {
    expect(isTashkeel('ُ')).toBe(true);
  });

  test('returns true for sukun', () => {
    expect(isTashkeel('ْ')).toBe(true);
  });

  test('returns true for shadda', () => {
    expect(isTashkeel('ّ')).toBe(true);
  });

  test('returns true for tanween fath', () => {
    expect(isTashkeel('ً')).toBe(true);
  });

  test('returns true for tanween damm', () => {
    expect(isTashkeel('ٌ')).toBe(true);
  });

  test('returns true for tanween kasr', () => {
    expect(isTashkeel('ٍ')).toBe(true);
  });

  test('returns false for Arabic letters', () => {
    expect(isTashkeel('ك')).toBe(false);
    expect(isTashkeel('ت')).toBe(false);
    expect(isTashkeel('ا')).toBe(false);
  });

  test('returns false for Latin letters', () => {
    expect(isTashkeel('a')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isTashkeel('')).toBe(false);
  });
});

describe('countTashkeel', () => {
  test('counts tashkeel in word with full marks', () => {
    // كِتَابٌ has kasra, fatha, tanween damm = 3 marks
    expect(countTashkeel('كِتَابٌ')).toBe(3);
  });

  test('counts all marks in complex word', () => {
    // الْمُسْلِمُونَ has sukun, damma, sukun, kasra, damma, fatha = 6 marks
    expect(countTashkeel('الْمُسْلِمُونَ')).toBe(6);
  });

  test('returns 0 for text without tashkeel', () => {
    expect(countTashkeel('كتاب')).toBe(0);
  });

  test('returns 0 for empty string', () => {
    expect(countTashkeel('')).toBe(0);
  });
});

// ============================================================================
// Tashkeel Scaffolding Tests
// ============================================================================

describe('applyTashkeelScaffolding', () => {
  test('full level preserves all tashkeel', () => {
    const text = 'كِتَابٌ';
    expect(applyTashkeelScaffolding(text, 'full')).toBe(text);
  });

  test('none level removes all tashkeel', () => {
    expect(applyTashkeelScaffolding('كِتَابٌ', 'none')).toBe('كتاب');
  });

  test('partial level keeps shadda', () => {
    const result = applyTashkeelScaffolding('مُحَمَّدٌ', 'partial');
    expect(result).toContain('ّ'); // Should contain shadda
    expect(result).not.toContain('ُ'); // Should not contain damma
    expect(result).not.toContain('َ'); // Should not contain fatha
  });

  test('partial level keeps sukun', () => {
    const result = applyTashkeelScaffolding('مِنْهُ', 'partial');
    expect(result).toContain('ْ'); // Should contain sukun
    expect(result).not.toContain('ِ'); // Should not contain kasra
    expect(result).not.toContain('ُ'); // Should not contain damma
  });

  test('partial level removes vowel marks', () => {
    const result = applyTashkeelScaffolding('كِتَابٌ', 'partial');
    expect(result).toBe('كتاب'); // No structural marks, so same as none
  });

  test('handles empty string', () => {
    expect(applyTashkeelScaffolding('', 'full')).toBe('');
    expect(applyTashkeelScaffolding('', 'partial')).toBe('');
    expect(applyTashkeelScaffolding('', 'none')).toBe('');
  });

  test('handles text without tashkeel', () => {
    expect(applyTashkeelScaffolding('كتاب', 'full')).toBe('كتاب');
    expect(applyTashkeelScaffolding('كتاب', 'partial')).toBe('كتاب');
    expect(applyTashkeelScaffolding('كتاب', 'none')).toBe('كتاب');
  });
});

describe('getTashkeelLevelForStrength', () => {
  test('returns full for new words (0)', () => {
    expect(getTashkeelLevelForStrength(0)).toBe('full');
  });

  test('returns full for learning words (< 40)', () => {
    expect(getTashkeelLevelForStrength(10)).toBe('full');
    expect(getTashkeelLevelForStrength(30)).toBe('full');
    expect(getTashkeelLevelForStrength(39)).toBe('full');
  });

  test('returns partial for familiar words (40-69)', () => {
    expect(getTashkeelLevelForStrength(40)).toBe('partial');
    expect(getTashkeelLevelForStrength(50)).toBe('partial');
    expect(getTashkeelLevelForStrength(69)).toBe('partial');
  });

  test('returns none for mastered words (70+)', () => {
    expect(getTashkeelLevelForStrength(70)).toBe('none');
    expect(getTashkeelLevelForStrength(85)).toBe('none');
    expect(getTashkeelLevelForStrength(100)).toBe('none');
  });

  test('handles boundary values correctly', () => {
    expect(getTashkeelLevelForStrength(39)).toBe('full');
    expect(getTashkeelLevelForStrength(40)).toBe('partial');
    expect(getTashkeelLevelForStrength(69)).toBe('partial');
    expect(getTashkeelLevelForStrength(70)).toBe('none');
  });
});
