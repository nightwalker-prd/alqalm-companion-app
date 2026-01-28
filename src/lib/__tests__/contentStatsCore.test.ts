/**
 * Tests for contentStatsCore - lightweight manifest-based content stats
 */

import { describe, test, expect, beforeAll } from 'vitest';
import {
  loadManifest,
  getManifestSync,
  isManifestLoaded,
  getBookContentStats,
  getTotalContentStats,
  getWordIdsForBook,
  getLessonWordIds,
  getLessonExerciseCount,
  getLessonIdsForBook,
  getAllLessonIds,
  getBookNumberFromLessonId,
  getLessonIdFromExerciseId,
  getLessonMetaForBook,
  getAllLessonMeta,
} from '../contentStatsCore';

describe('contentStatsCore', () => {
  // Load manifest before tests
  beforeAll(async () => {
    await loadManifest();
  });

  describe('manifest loading', () => {
    test('loadManifest loads successfully', async () => {
      const manifest = await loadManifest();
      expect(manifest).toBeDefined();
      expect(manifest.version).toBe(1);
      expect(manifest.books).toBeDefined();
    });

    test('isManifestLoaded returns true after loading', () => {
      expect(isManifestLoaded()).toBe(true);
    });

    test('getManifestSync returns manifest after loading', () => {
      const manifest = getManifestSync();
      expect(manifest).not.toBeNull();
      expect(manifest?.books).toBeDefined();
    });
  });

  describe('getBookContentStats', () => {
    test('returns stats for book 1', () => {
      const stats = getBookContentStats(1);
      expect(stats.bookNumber).toBe(1);
      expect(stats.lessonCount).toBe(35);
      expect(stats.wordCount).toBeGreaterThan(0);
      expect(stats.grammarCount).toBeGreaterThan(0);
      expect(stats.exerciseCount).toBeGreaterThan(0);
    });

    test('returns stats for book 2', () => {
      const stats = getBookContentStats(2);
      expect(stats.bookNumber).toBe(2);
      expect(stats.lessonCount).toBe(56);
    });

    test('returns stats for book 3', () => {
      const stats = getBookContentStats(3);
      expect(stats.bookNumber).toBe(3);
      expect(stats.lessonCount).toBe(119);
    });

    test('throws for non-existent book', () => {
      expect(() => getBookContentStats(99)).toThrow('Book 99 not found');
    });
  });

  describe('getTotalContentStats', () => {
    test('returns combined stats for all books', () => {
      const total = getTotalContentStats();
      const book1 = getBookContentStats(1);
      const book2 = getBookContentStats(2);
      const book3 = getBookContentStats(3);

      expect(total.lessonCount).toBe(
        book1.lessonCount + book2.lessonCount + book3.lessonCount
      );
      expect(total.wordCount).toBe(
        book1.wordCount + book2.wordCount + book3.wordCount
      );
    });

    test('total lesson count is 210', () => {
      const total = getTotalContentStats();
      expect(total.lessonCount).toBe(210);
    });
  });

  describe('getWordIdsForBook', () => {
    test('returns word IDs for book 1', () => {
      const wordIds = getWordIdsForBook(1);
      expect(Array.isArray(wordIds)).toBe(true);
      expect(wordIds.length).toBeGreaterThan(0);
      // Word IDs follow format 'word-XXX'
      expect(wordIds.every(id => id.startsWith('word-'))).toBe(true);
    });

    test('returns word IDs for book 2', () => {
      const wordIds = getWordIdsForBook(2);
      expect(wordIds.every(id => id.startsWith('word-'))).toBe(true);
    });
  });

  describe('getLessonWordIds', () => {
    test('returns word IDs for a specific lesson', () => {
      const wordIds = getLessonWordIds('b1-l01');
      expect(Array.isArray(wordIds)).toBe(true);
      expect(wordIds.length).toBeGreaterThan(0);
    });

    test('returns empty array for non-existent lesson', () => {
      const wordIds = getLessonWordIds('b1-l99');
      expect(wordIds).toEqual([]);
    });
  });

  describe('getLessonExerciseCount', () => {
    test('returns exercise count for a lesson', () => {
      const count = getLessonExerciseCount('b1-l01');
      expect(count).toBeGreaterThan(0);
    });

    test('returns 0 for non-existent lesson', () => {
      const count = getLessonExerciseCount('b1-l99');
      expect(count).toBe(0);
    });
  });

  describe('getLessonIdsForBook', () => {
    test('returns lesson IDs for book 1', () => {
      const lessonIds = getLessonIdsForBook(1);
      expect(lessonIds.length).toBe(35);
      expect(lessonIds[0]).toBe('b1-l01');
      expect(lessonIds[34]).toBe('b1-l35');
    });

    test('returns lesson IDs for book 2', () => {
      const lessonIds = getLessonIdsForBook(2);
      expect(lessonIds.length).toBe(56);
    });

    test('returns lesson IDs for book 3', () => {
      const lessonIds = getLessonIdsForBook(3);
      expect(lessonIds.length).toBe(119);
    });
  });

  describe('getAllLessonIds', () => {
    test('returns all 210 lesson IDs', () => {
      const allIds = getAllLessonIds();
      expect(allIds.length).toBe(210);
    });

    test('includes lessons from all books', () => {
      const allIds = getAllLessonIds();
      expect(allIds.some(id => id.startsWith('b1-'))).toBe(true);
      expect(allIds.some(id => id.startsWith('b2-'))).toBe(true);
      expect(allIds.some(id => id.startsWith('b3-'))).toBe(true);
    });
  });

  describe('ID parsing utilities', () => {
    test('getBookNumberFromLessonId extracts book number', () => {
      expect(getBookNumberFromLessonId('b1-l01')).toBe(1);
      expect(getBookNumberFromLessonId('b2-l15')).toBe(2);
      expect(getBookNumberFromLessonId('b3-l34')).toBe(3);
    });

    test('getLessonIdFromExerciseId extracts lesson ID', () => {
      expect(getLessonIdFromExerciseId('b1-l01-ex01')).toBe('b1-l01');
      expect(getLessonIdFromExerciseId('b2-l15-ex03')).toBe('b2-l15');
    });
  });

  describe('getLessonMetaForBook', () => {
    test('returns lesson metadata for book 1', () => {
      const meta = getLessonMetaForBook(1);
      expect(meta.length).toBe(35);
      expect(meta[0]).toEqual({
        id: 'b1-l01',
        lessonNumber: 1,
        titleArabic: expect.any(String),
        titleEnglish: expect.any(String),
      });
    });

    test('each lesson has required metadata', () => {
      const meta = getLessonMetaForBook(2);
      for (const lesson of meta) {
        expect(lesson.id).toBeDefined();
        expect(lesson.lessonNumber).toBeGreaterThan(0);
        expect(lesson.titleArabic).toBeDefined();
        expect(lesson.titleEnglish).toBeDefined();
      }
    });
  });

  describe('getAllLessonMeta', () => {
    test('returns metadata for all 210 lessons', () => {
      const allMeta = getAllLessonMeta();
      expect(allMeta.length).toBe(210);
    });

    test('lessons are ordered by book then lesson number', () => {
      const allMeta = getAllLessonMeta();
      // First lesson should be b1-l01
      expect(allMeta[0].id).toBe('b1-l01');
      // Lesson 36 should be b2-l01 (after 35 book 1 lessons)
      expect(allMeta[35].id).toBe('b2-l01');
    });
  });
});
