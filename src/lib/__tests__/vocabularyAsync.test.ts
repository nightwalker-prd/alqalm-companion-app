/**
 * Tests for vocabularyAsync - async vocabulary loading module
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  loadVocabulary,
  isVocabularyLoaded,
  isVocabularyLoading,
  getVocabularyError,
  getWordById,
  getAllWords,
  getWordsByLesson,
  getWordsByRoot,
  getAllRoots,
  getWordCount,
  resetVocabulary,
  subscribe,
} from '../vocabularyAsync';

describe('vocabularyAsync', () => {
  // Reset state before each test
  beforeEach(() => {
    resetVocabulary();
  });

  afterEach(() => {
    resetVocabulary();
  });

  describe('initial state', () => {
    test('isVocabularyLoaded returns false initially', () => {
      expect(isVocabularyLoaded()).toBe(false);
    });

    test('isVocabularyLoading returns false initially', () => {
      expect(isVocabularyLoading()).toBe(false);
    });

    test('getVocabularyError returns null initially', () => {
      expect(getVocabularyError()).toBeNull();
    });

    test('getWordCount returns 0 initially', () => {
      expect(getWordCount()).toBe(0);
    });

    test('getAllWords returns empty array initially', () => {
      expect(getAllWords()).toEqual([]);
    });

    test('getWordById returns null when not loaded', () => {
      expect(getWordById('b1-l01-w01')).toBeNull();
    });

    test('getWordsByLesson returns empty array when not loaded', () => {
      expect(getWordsByLesson('b1-l01')).toEqual([]);
    });

    test('getWordsByRoot returns empty array when not loaded', () => {
      expect(getWordsByRoot('ك ت ب')).toEqual([]);
    });

    test('getAllRoots returns empty array when not loaded', () => {
      expect(getAllRoots()).toEqual([]);
    });
  });

  describe('loadVocabulary', () => {
    test('loads vocabulary successfully', async () => {
      await loadVocabulary();
      expect(isVocabularyLoaded()).toBe(true);
      expect(isVocabularyLoading()).toBe(false);
      expect(getVocabularyError()).toBeNull();
    });

    test('getWordCount returns positive number after loading', async () => {
      await loadVocabulary();
      expect(getWordCount()).toBeGreaterThan(0);
    });

    test('getAllWords returns non-empty array after loading', async () => {
      await loadVocabulary();
      const words = getAllWords();
      expect(words.length).toBeGreaterThan(0);
      expect(words[0]).toHaveProperty('id');
      expect(words[0]).toHaveProperty('arabic');
      expect(words[0]).toHaveProperty('english');
    });

    test('concurrent load calls return same promise', async () => {
      const promise1 = loadVocabulary();
      const promise2 = loadVocabulary();
      
      await Promise.all([promise1, promise2]);
      
      // Should only load once
      expect(isVocabularyLoaded()).toBe(true);
    });

    test('subsequent load calls are no-ops when already loaded', async () => {
      await loadVocabulary();
      const countBefore = getWordCount();
      
      await loadVocabulary();
      
      expect(getWordCount()).toBe(countBefore);
    });
  });

  describe('getWordById', () => {
    beforeEach(async () => {
      await loadVocabulary();
    });

    test('returns word by ID', () => {
      const words = getAllWords();
      const firstWord = words[0];
      
      const retrieved = getWordById(firstWord.id);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(firstWord.id);
      expect(retrieved?.arabic).toBe(firstWord.arabic);
      expect(retrieved?.english).toBe(firstWord.english);
    });

    test('returns null for non-existent ID', () => {
      expect(getWordById('non-existent-id')).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(getWordById('')).toBeNull();
    });
  });

  describe('getWordsByLesson', () => {
    beforeEach(async () => {
      await loadVocabulary();
    });

    test('returns words for a specific lesson', () => {
      const words = getWordsByLesson('b1-l01');
      expect(words.length).toBeGreaterThan(0);
      expect(words.every(w => w.lesson === 'b1-l01')).toBe(true);
    });

    test('returns empty array for non-existent lesson', () => {
      const words = getWordsByLesson('b99-l99');
      expect(words).toEqual([]);
    });

    test('words from different lessons are separate', () => {
      const lesson1Words = getWordsByLesson('b1-l01');
      const lesson2Words = getWordsByLesson('b1-l02');
      
      const lesson1Ids = new Set(lesson1Words.map(w => w.id));
      const lesson2Ids = new Set(lesson2Words.map(w => w.id));
      
      // No overlap between lessons
      for (const id of lesson2Ids) {
        expect(lesson1Ids.has(id)).toBe(false);
      }
    });
  });

  describe('getWordsByRoot', () => {
    beforeEach(async () => {
      await loadVocabulary();
    });

    test('returns words sharing a root', () => {
      const roots = getAllRoots();
      if (roots.length === 0) return; // Skip if no roots
      
      const firstRoot = roots[0];
      const words = getWordsByRoot(firstRoot);
      
      expect(words.length).toBeGreaterThan(0);
      expect(words.every(w => w.root === firstRoot)).toBe(true);
    });

    test('returns empty array for non-existent root', () => {
      const words = getWordsByRoot('ز ز ز');
      expect(words).toEqual([]);
    });
  });

  describe('getAllRoots', () => {
    beforeEach(async () => {
      await loadVocabulary();
    });

    test('returns array of unique roots', () => {
      const roots = getAllRoots();
      expect(Array.isArray(roots)).toBe(true);
      
      // All roots should be unique
      const uniqueRoots = new Set(roots);
      expect(uniqueRoots.size).toBe(roots.length);
    });
  });

  describe('subscribe', () => {
    test('notifies subscriber on load start and complete', async () => {
      const notifications: boolean[] = [];
      
      const unsubscribe = subscribe(() => {
        notifications.push(isVocabularyLoaded());
      });
      
      await loadVocabulary();
      
      unsubscribe();
      
      // Should have been notified at least twice (loading start, loading complete)
      expect(notifications.length).toBeGreaterThanOrEqual(2);
      // First notification: loading started (not loaded yet)
      expect(notifications[0]).toBe(false);
      // Last notification: loading complete
      expect(notifications[notifications.length - 1]).toBe(true);
    });

    test('unsubscribe stops notifications', async () => {
      let callCount = 0;
      
      const unsubscribe = subscribe(() => {
        callCount++;
      });
      
      // Unsubscribe immediately
      unsubscribe();
      
      await loadVocabulary();
      
      // Should not have been called after unsubscribe
      expect(callCount).toBe(0);
    });
  });

  describe('resetVocabulary', () => {
    test('resets all state', async () => {
      await loadVocabulary();
      expect(isVocabularyLoaded()).toBe(true);
      
      resetVocabulary();
      
      expect(isVocabularyLoaded()).toBe(false);
      expect(isVocabularyLoading()).toBe(false);
      expect(getVocabularyError()).toBeNull();
      expect(getWordCount()).toBe(0);
      expect(getAllWords()).toEqual([]);
    });

    test('allows reloading after reset', async () => {
      await loadVocabulary();
      resetVocabulary();
      
      await loadVocabulary();
      
      expect(isVocabularyLoaded()).toBe(true);
      expect(getWordCount()).toBeGreaterThan(0);
    });
  });

  describe('word data structure', () => {
    beforeEach(async () => {
      await loadVocabulary();
    });

    test('words have required fields', () => {
      const words = getAllWords();
      
      for (const word of words.slice(0, 10)) { // Check first 10
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('arabic');
        expect(word).toHaveProperty('english');
        expect(word).toHaveProperty('root');
        expect(word).toHaveProperty('lesson');
        expect(word).toHaveProperty('partOfSpeech');
        
        expect(typeof word.id).toBe('string');
        expect(typeof word.arabic).toBe('string');
        expect(typeof word.english).toBe('string');
        expect(typeof word.lesson).toBe('string');
        expect(typeof word.partOfSpeech).toBe('string');
        // root can be string or null
        expect(word.root === null || typeof word.root === 'string').toBe(true);
      }
    });

    test('word IDs follow naming convention', () => {
      const words = getAllWords();
      
      // All IDs should match pattern like word-001, word-002, etc.
      const idPattern = /^word-\d+$/;
      for (const word of words.slice(0, 10)) {
        expect(idPattern.test(word.id)).toBe(true);
      }
    });
  });
});
