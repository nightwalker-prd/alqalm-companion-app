import { describe, test, expect } from 'vitest';
import {
  getWordById,
  getAllWords,
  getWordsByLesson,
  getWordsByRoot,
  getAllRoots,
  getWordCount,
} from '../vocabulary';

describe('getWordById', () => {
  test('returns word data for valid ID (word-001)', () => {
    const word = getWordById('word-001');
    expect(word).not.toBeNull();
    expect(word?.id).toBe('word-001');
    expect(word?.arabic).toBe('هَذَا');
    expect(word?.english).toBe('this (masc.)');
  });

  test('returns null for non-existent ID', () => {
    const word = getWordById('word-99999');
    expect(word).toBeNull();
  });

  test('returns null for empty string', () => {
    const word = getWordById('');
    expect(word).toBeNull();
  });

  test('returns correct Arabic text for word-007 (مَسْجِدٌ)', () => {
    const word = getWordById('word-007');
    expect(word).not.toBeNull();
    expect(word?.arabic).toBe('مَسْجِدٌ');
    expect(word?.english).toBe('mosque');
  });

  test('returns correct English meaning for word-002 (book)', () => {
    const word = getWordById('word-002');
    expect(word).not.toBeNull();
    expect(word?.english).toBe('book');
    expect(word?.arabic).toBe('كِتَابٌ');
  });

  test('includes root information when available', () => {
    const word = getWordById('word-002'); // كِتَابٌ - book
    expect(word).not.toBeNull();
    expect(word?.root).toBe('ك-ت-ب');
  });

  test('includes lesson reference', () => {
    const word = getWordById('word-001');
    expect(word).not.toBeNull();
    expect(word?.lesson).toBe('b1-l01');
  });

  test('includes part of speech', () => {
    const word = getWordById('word-002');
    expect(word).not.toBeNull();
    expect(word?.partOfSpeech).toBe('noun');
  });

  test('handles words with null root', () => {
    const word = getWordById('word-001'); // هَذَا - demonstrative, no root
    expect(word).not.toBeNull();
    expect(word?.root).toBeNull();
  });
});

describe('getAllWords', () => {
  test('returns non-empty array', () => {
    const words = getAllWords();
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBeGreaterThan(0);
  });

  test('includes words from book 1', () => {
    const words = getAllWords();
    const book1Words = words.filter(w => w.lesson.startsWith('b1-'));
    expect(book1Words.length).toBeGreaterThan(0);
  });

  test('includes words from book 2', () => {
    const words = getAllWords();
    const book2Words = words.filter(w => w.lesson.startsWith('b2-'));
    expect(book2Words.length).toBeGreaterThan(0);
  });

  test('includes words from book 3', () => {
    const words = getAllWords();
    const book3Words = words.filter(w => w.lesson.startsWith('b3-'));
    expect(book3Words.length).toBeGreaterThan(0);
  });

  test('each word has required fields', () => {
    const words = getAllWords();
    for (const word of words.slice(0, 20)) {
      // Sample first 20
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('arabic');
      expect(word).toHaveProperty('english');
      expect(word).toHaveProperty('lesson');
      expect(word).toHaveProperty('partOfSpeech');
      expect(typeof word.id).toBe('string');
      expect(typeof word.arabic).toBe('string');
      expect(typeof word.english).toBe('string');
    }
  });
});

describe('getWordsByLesson', () => {
  test('returns words for valid lesson (b1-l01)', () => {
    const words = getWordsByLesson('b1-l01');
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBeGreaterThan(0);
  });

  test('returns empty array for non-existent lesson', () => {
    const words = getWordsByLesson('b99-l99');
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBe(0);
  });

  test('returns empty array for empty string', () => {
    const words = getWordsByLesson('');
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBe(0);
  });

  test('all returned words belong to the requested lesson', () => {
    const lessonId = 'b1-l01';
    const words = getWordsByLesson(lessonId);
    for (const word of words) {
      expect(word.lesson).toBe(lessonId);
    }
  });

  test('returns multiple words for lessons with vocabulary', () => {
    const words = getWordsByLesson('b1-l01');
    expect(words.length).toBeGreaterThan(1);
  });
});

describe('getWordsByRoot', () => {
  test('returns words sharing root ك-ت-ب (write)', () => {
    const words = getWordsByRoot('ك-ت-ب');
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBeGreaterThan(0);
    // Should include كِتَابٌ (book)
    const hasKitab = words.some(w => w.arabic === 'كِتَابٌ');
    expect(hasKitab).toBe(true);
  });

  test('returns empty array for non-existent root', () => {
    const words = getWordsByRoot('x-y-z');
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBe(0);
  });

  test('returns empty array for empty string', () => {
    const words = getWordsByRoot('');
    expect(words).toBeInstanceOf(Array);
    expect(words.length).toBe(0);
  });

  test('all returned words have the requested root', () => {
    const root = 'ك-ت-ب';
    const words = getWordsByRoot(root);
    for (const word of words) {
      expect(word.root).toBe(root);
    }
  });
});

describe('getAllRoots', () => {
  test('returns non-empty array of roots', () => {
    const roots = getAllRoots();
    expect(roots).toBeInstanceOf(Array);
    expect(roots.length).toBeGreaterThan(0);
  });

  test('includes common Arabic root ك-ت-ب', () => {
    const roots = getAllRoots();
    expect(roots).toContain('ك-ت-ب');
  });

  test('all roots are strings', () => {
    const roots = getAllRoots();
    for (const root of roots) {
      expect(typeof root).toBe('string');
    }
  });
});

describe('getWordCount', () => {
  test('returns positive number', () => {
    const count = getWordCount();
    expect(count).toBeGreaterThan(0);
  });

  test('matches getAllWords length', () => {
    const count = getWordCount();
    const words = getAllWords();
    expect(count).toBe(words.length);
  });
});
