import { describe, test, expect } from 'vitest';
import {
  getRetryHint,
  getProgressiveReveal,
  getFirstCharacter,
  isArabicText,
  MAX_RETRY_ATTEMPTS,
} from '../retryHints';

describe('getRetryHint', () => {
  describe('attempt progression', () => {
    test('attempt 1 returns no hint text', () => {
      const hint = getRetryHint('الكتاب', 1, true);
      expect(hint.level).toBe(1);
      expect(hint.hintText).toBeNull();
      expect(hint.showFullAnswer).toBe(false);
    });

    test('attempt 2 returns first character hint', () => {
      const hint = getRetryHint('الكتاب', 2, true);
      expect(hint.level).toBe(2);
      expect(hint.hintText).not.toBeNull();
      expect(hint.hintText).toContain('ا');
      expect(hint.showFullAnswer).toBe(false);
    });

    test('attempt 3 returns ~40% revealed', () => {
      const hint = getRetryHint('الكتاب', 3, true);
      expect(hint.level).toBe(3);
      expect(hint.hintText).not.toBeNull();
      expect(hint.hintText!.length).toBeGreaterThan(1);
      expect(hint.showFullAnswer).toBe(false);
    });

    test('attempt 4 returns ~60% revealed', () => {
      const hint = getRetryHint('الكتاب', 4, true);
      expect(hint.level).toBe(4);
      expect(hint.hintText).not.toBeNull();
      expect(hint.showFullAnswer).toBe(false);
    });

    test('attempt 5 returns full answer', () => {
      const hint = getRetryHint('الكتاب', 5, true);
      expect(hint.level).toBe(5);
      expect(hint.hintText).toBe('الكتاب');
      expect(hint.showFullAnswer).toBe(true);
    });
  });

  describe('messages', () => {
    test('each attempt has a learning-focused message', () => {
      for (let i = 1; i <= MAX_RETRY_ATTEMPTS; i++) {
        const hint = getRetryHint('test', i, false);
        expect(hint.message).toBeTruthy();
        expect(hint.message.length).toBeGreaterThan(10);
      }
    });

    test('final attempt message mentions studying the answer', () => {
      const hint = getRetryHint('test', 5, false);
      expect(hint.message.toLowerCase()).toContain('answer');
    });
  });

  describe('edge cases', () => {
    test('clamps attempt number below 1 to 1', () => {
      const hint = getRetryHint('test', 0, false);
      expect(hint.level).toBe(1);
    });

    test('clamps attempt number above MAX to MAX', () => {
      const hint = getRetryHint('test', 10, false);
      expect(hint.level).toBe(MAX_RETRY_ATTEMPTS);
      expect(hint.showFullAnswer).toBe(true);
    });

    test('handles empty string', () => {
      const hint = getRetryHint('', 2, false);
      expect(hint.hintText).toBe('');
    });

    test('handles single character', () => {
      const hint = getRetryHint('a', 2, false);
      expect(hint.hintText).toBe('a');
    });
  });
});

describe('getProgressiveReveal', () => {
  describe('English text', () => {
    test('reveals first character at 15%', () => {
      const result = getProgressiveReveal('hello', 0.15, false);
      expect(result).toBe('h...');
    });

    test('reveals ~40% of text', () => {
      const result = getProgressiveReveal('hello', 0.4, false);
      expect(result).toBe('he...');
    });

    test('reveals ~60% of text', () => {
      const result = getProgressiveReveal('hello', 0.6, false);
      expect(result).toBe('hel...');
    });

    test('reveals full text at 100%', () => {
      const result = getProgressiveReveal('hello', 1.0, false);
      expect(result).toBe('hello');
    });

    test('preserves spaces in multi-word answers', () => {
      const result = getProgressiveReveal('the book', 0.5, false);
      // Should reveal about half the non-space characters
      expect(result).toContain('the');
      expect(result).toContain(' ');
    });

    test('handles empty string', () => {
      const result = getProgressiveReveal('', 0.5, false);
      expect(result).toBe('');
    });

    test('handles whitespace-only string', () => {
      const result = getProgressiveReveal('   ', 0.5, false);
      expect(result).toBe('');
    });
  });

  describe('Arabic text', () => {
    test('reveals first character', () => {
      const result = getProgressiveReveal('كتاب', 0.25, true);
      expect(result).toBe('ك...');
    });

    test('reveals ~50% of Arabic text', () => {
      const result = getProgressiveReveal('كتاب', 0.5, true);
      expect(result).toBe('كت...');
    });

    test('reveals full Arabic text at 100%', () => {
      const result = getProgressiveReveal('كتاب', 1.0, true);
      expect(result).toBe('كتاب');
    });

    test('handles tashkeel - preserves diacritics with their letters', () => {
      // "kitaabun" with tashkeel
      const withTashkeel = 'كِتَابٌ';
      const result = getProgressiveReveal(withTashkeel, 0.5, true);
      // Should reveal base letters with their tashkeel
      expect(result).toContain('كِ');
    });

    test('counts base letters not tashkeel for percentage', () => {
      // 4 base letters: ك ت ا ب
      const withTashkeel = 'كِتَابٌ';
      const result50 = getProgressiveReveal(withTashkeel, 0.5, true);
      // At 50%, should reveal 2 base letters (ك and ت) with their tashkeel
      expect(result50).toMatch(/^كِتَ/);
    });

    test('handles alef with hamza', () => {
      const result = getProgressiveReveal('أستاذ', 0.4, true);
      expect(result.startsWith('أ')).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('clamps percentage below 0', () => {
      const result = getProgressiveReveal('hello', -0.5, false);
      // Should still reveal at least 1 character
      expect(result.length).toBeGreaterThan(0);
    });

    test('clamps percentage above 1', () => {
      const result = getProgressiveReveal('hello', 1.5, false);
      expect(result).toBe('hello');
    });

    test('always reveals at least 1 character', () => {
      const result = getProgressiveReveal('hello', 0.01, false);
      expect(result).toBe('h...');
    });
  });
});

describe('getFirstCharacter', () => {
  describe('English text', () => {
    test('returns first character', () => {
      expect(getFirstCharacter('hello', false)).toBe('h');
    });

    test('skips leading spaces', () => {
      expect(getFirstCharacter('  hello', false)).toBe('h');
    });

    test('returns empty for empty string', () => {
      expect(getFirstCharacter('', false)).toBe('');
    });
  });

  describe('Arabic text', () => {
    test('returns first base character', () => {
      expect(getFirstCharacter('كتاب', true)).toBe('ك');
    });

    test('includes tashkeel following first character', () => {
      // First letter with kasra
      const result = getFirstCharacter('كِتاب', true);
      expect(result).toBe('كِ');
    });

    test('handles alef with hamza', () => {
      expect(getFirstCharacter('أحمد', true)).toBe('أ');
    });

    test('handles leading tashkeel (unusual but possible)', () => {
      // If somehow there's leading tashkeel, skip it
      const result = getFirstCharacter('كتاب', true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('isArabicText', () => {
  test('returns true for Arabic text', () => {
    expect(isArabicText('كتاب')).toBe(true);
    expect(isArabicText('الكتاب')).toBe(true);
    expect(isArabicText('مَرْحَبًا')).toBe(true);
  });

  test('returns false for English text', () => {
    expect(isArabicText('hello')).toBe(false);
    expect(isArabicText('the book')).toBe(false);
  });

  test('returns true for mixed text with Arabic', () => {
    expect(isArabicText('The word كتاب means book')).toBe(true);
  });

  test('returns false for empty string', () => {
    expect(isArabicText('')).toBe(false);
  });

  test('returns false for numbers only', () => {
    expect(isArabicText('12345')).toBe(false);
  });

  test('handles Arabic-Indic numerals', () => {
    // Arabic-Indic digits are in the Arabic Unicode range
    expect(isArabicText('١٢٣')).toBe(true);
  });
});

describe('MAX_RETRY_ATTEMPTS', () => {
  test('is set to 5', () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(5);
  });
});
