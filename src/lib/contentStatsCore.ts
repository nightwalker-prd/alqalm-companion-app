/**
 * Lightweight content statistics module.
 *
 * This module provides the same API as contentStats.ts but loads data from
 * a pre-generated manifest file instead of importing all lesson files.
 * This dramatically reduces the main bundle size.
 *
 * The manifest is loaded dynamically and cached after first load.
 */

import type { BookContentStats, TotalContentStats } from '../types/progress';

/**
 * Book type for distinguishing content types
 */
export type BookType = 'madina';

/**
 * All book numbers (Madina Arabic course only)
 */
const ALL_BOOK_NUMBERS = [1, 2, 3] as const;

/**
 * Lesson metadata for UI display
 */
export interface LessonMeta {
  id: string;
  lessonNumber: number;
  titleArabic: string;
  titleEnglish: string;
}

/**
 * Lesson data from manifest
 */
interface ManifestLesson {
  id: string;
  lesson: number;
  title: string;
  titleEn: string;
  exerciseCount: number;
  vocabularyIds: string[];
  grammarPointIds: string[];
}

/**
 * Book data from manifest
 */
interface ManifestBook {
  lessonCount: number;
  wordCount: number;
  grammarCount: number;
  exerciseCount: number;
  lessonIds: string[];
  wordIds: string[];
  lessons: ManifestLesson[];
}

/**
 * Full manifest structure
 */
interface ContentManifest {
  version: number;
  generatedAt: string;
  books: {
    [key: string]: ManifestBook;
  };
}

// Module state
let manifestCache: ContentManifest | null = null;
let manifestPromise: Promise<ContentManifest> | null = null;
let manifestError: Error | null = null;
let isLoading = false;

// Subscribers for state changes
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * Subscribe to manifest state changes.
 * Returns an unsubscribe function.
 */
export function subscribeManifest(callback: Subscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of state changes
 */
function notifySubscribers(): void {
  for (const callback of subscribers) {
    callback();
  }
}

/**
 * Check if manifest is currently loading
 */
export function isManifestLoading(): boolean {
  return isLoading;
}

/**
 * Get manifest loading error if any
 */
export function getManifestError(): Error | null {
  return manifestError;
}

/**
 * Load the content manifest.
 * Returns cached manifest if already loaded.
 */
export async function loadManifest(): Promise<ContentManifest> {
  if (manifestCache) return manifestCache;
  if (manifestError) throw manifestError;

  if (!manifestPromise) {
    isLoading = true;
    notifySubscribers();

    manifestPromise = (async () => {
      try {
        const module = await import('../content/manifest.json');
        manifestCache = module.default as ContentManifest;
        isLoading = false;
        notifySubscribers();
        return manifestCache;
      } catch (e) {
        manifestError = e instanceof Error ? e : new Error(String(e));
        isLoading = false;
        notifySubscribers();
        throw manifestError;
      }
    })();
  }

  return manifestPromise;
}

/**
 * Get the cached manifest synchronously.
 * Returns null if not yet loaded.
 * Throws if loading failed.
 */
export function getManifestSync(): ContentManifest | null {
  if (manifestError) throw manifestError;
  return manifestCache;
}

/**
 * Check if manifest is loaded
 */
export function isManifestLoaded(): boolean {
  return manifestCache !== null;
}

/**
 * Get a book from the manifest.
 * Throws if manifest not loaded.
 */
function getBook(bookNumber: number): ManifestBook {
  const manifest = getManifestSync();
  if (!manifest) {
    throw new Error('Content manifest not loaded. Call loadManifest() first.');
  }
  const book = manifest.books[bookNumber];
  if (!book) {
    throw new Error(`Book ${bookNumber} not found in manifest`);
  }
  return book;
}

/**
 * Get content statistics for a specific book.
 * Requires manifest to be loaded.
 */
export function getBookContentStats(bookNumber: number): BookContentStats {
  const book = getBook(bookNumber);
  return {
    bookNumber,
    lessonCount: book.lessonCount,
    wordCount: book.wordCount,
    grammarCount: book.grammarCount,
    exerciseCount: book.exerciseCount,
  };
}

/**
 * Get total content statistics across all books (1-7).
 * Requires manifest to be loaded.
 */
export function getTotalContentStats(): TotalContentStats {
  let lessonCount = 0;
  let wordCount = 0;
  let grammarCount = 0;
  let exerciseCount = 0;

  for (const bookNum of ALL_BOOK_NUMBERS) {
    try {
      const stats = getBookContentStats(bookNum);
      lessonCount += stats.lessonCount;
      wordCount += stats.wordCount;
      grammarCount += stats.grammarCount;
      exerciseCount += stats.exerciseCount;
    } catch {
      // Book may not exist in manifest
    }
  }

  return { lessonCount, wordCount, grammarCount, exerciseCount };
}

/**
 * Get all word IDs for a specific book.
 * Requires manifest to be loaded.
 */
export function getWordIdsForBook(bookNumber: number): string[] {
  const book = getBook(bookNumber);
  return book.wordIds;
}

/**
 * Get all word IDs for a specific lesson.
 * Requires manifest to be loaded.
 */
export function getLessonWordIds(lessonId: string): string[] {
  const bookNumber = parseInt(lessonId.charAt(1), 10);
  const book = getBook(bookNumber);
  const lesson = book.lessons.find(l => l.id === lessonId);
  return lesson?.vocabularyIds || [];
}

/**
 * Get exercise count for a specific lesson.
 * Requires manifest to be loaded.
 */
export function getLessonExerciseCount(lessonId: string): number {
  const bookNumber = parseInt(lessonId.charAt(1), 10);
  const book = getBook(bookNumber);
  const lesson = book.lessons.find(l => l.id === lessonId);
  return lesson?.exerciseCount || 0;
}

/**
 * Get all lesson IDs for a specific book.
 * Requires manifest to be loaded.
 */
export function getLessonIdsForBook(bookNumber: number): string[] {
  const book = getBook(bookNumber);
  return book.lessonIds;
}

/**
 * Get all lesson IDs across all books.
 * Requires manifest to be loaded.
 */
export function getAllLessonIds(): string[] {
  const ids: string[] = [];
  for (const bookNum of ALL_BOOK_NUMBERS) {
    try {
      ids.push(...getLessonIdsForBook(bookNum));
    } catch {
      // Book may not exist in manifest
    }
  }
  return ids;
}

/**
 * Extract book number from lesson ID (e.g., 'b1-l01' -> 1)
 * Does not require manifest.
 */
export function getBookNumberFromLessonId(lessonId: string): number {
  return parseInt(lessonId.charAt(1), 10);
}

/**
 * Extract lesson ID from exercise ID (e.g., 'b1-l01-ex01' -> 'b1-l01')
 * Does not require manifest.
 */
export function getLessonIdFromExerciseId(exerciseId: string): string {
  const parts = exerciseId.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return exerciseId;
}

/**
 * Get lesson metadata for a specific book.
 * Requires manifest to be loaded.
 */
export function getLessonMetaForBook(bookNumber: number): LessonMeta[] {
  const book = getBook(bookNumber);
  return book.lessons.map(lesson => ({
    id: lesson.id,
    lessonNumber: lesson.lesson,
    titleArabic: lesson.title,
    titleEnglish: lesson.titleEn,
  }));
}

/**
 * Get all lesson metadata across all books.
 * Requires manifest to be loaded.
 */
export function getAllLessonMeta(): LessonMeta[] {
  const meta: LessonMeta[] = [];
  for (const bookNum of ALL_BOOK_NUMBERS) {
    try {
      meta.push(...getLessonMetaForBook(bookNum));
    } catch {
      // Book may not exist in manifest
    }
  }
  return meta;
}

/**
 * Get book type from book number.
 * Does not require manifest.
 */
export function getBookType(): BookType {
  return 'madina';
}

/**
 * Get all available book numbers from the manifest.
 * Requires manifest to be loaded.
 */
export function getAvailableBookNumbers(): number[] {
  const manifest = getManifestSync();
  if (!manifest) {
    throw new Error('Content manifest not loaded. Call loadManifest() first.');
  }
  return Object.keys(manifest.books).map(Number).sort((a, b) => a - b);
}
