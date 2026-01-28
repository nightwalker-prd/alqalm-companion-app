/**
 * Unified Lesson Loader
 *
 * Provides a single interface for loading lessons from Madina Arabic books (1-3).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookType } from './contentStatsCore';

/**
 * Common exercise interface for unified lessons
 */
export interface UnifiedExercise {
  id: string;
  type: string;
  prompt: string;
  promptEn?: string;
  options?: string[];
  answer?: string | number;
  explanation?: string;
  explanationEn?: string;
}

/**
 * Unified lesson interface
 */
export interface UnifiedLesson {
  // Identity
  id: string;                    // Book lesson ID (b1-l01 format)
  originalId: string;            // Original content ID
  bookNumber: number;
  lessonNumber: number;

  // Metadata
  title: string;                 // Arabic title
  titleEn: string;               // English title
  type: BookType;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  // Content - the raw lesson data
  content: MadinaLessonContent;

  // Exercises in unified format
  exercises: UnifiedExercise[];
  exerciseCount: number;
}

/**
 * Madina lesson content structure
 */
export interface MadinaLessonContent {
  id: string;
  book: number;
  lesson: number;
  title: string;
  titleEn: string;
  objectives: string[];
  dialogue?: { arabic: string; english: string }[];
  grammarPoints: string[];
  vocabulary: string[];
  exercises: unknown[];
}

// Cache for loaded lessons
const lessonCache = new Map<string, UnifiedLesson>();

/**
 * Parse a lesson ID (b1-l01 format)
 */
function parseLessonId(lessonId: string): { bookNumber: number; lessonNumber: number } | null {
  const match = lessonId.match(/^b(\d+)-l(\d+)$/);
  if (!match) return null;
  return {
    bookNumber: parseInt(match[1], 10),
    lessonNumber: parseInt(match[2], 10),
  };
}

/**
 * Load a Madina book lesson (Books 1-3)
 */
async function loadMadinaLesson(bookNumber: number, lessonNumber: number): Promise<UnifiedLesson> {
  const lessonId = `b${bookNumber}-l${String(lessonNumber).padStart(2, '0')}`;
  const lessonNum = String(lessonNumber).padStart(2, '0');

  try {
    const module = await import(`../content/book${bookNumber}/lessons/lesson-${lessonNum}.json`);
    const lessonData = module.default as MadinaLessonContent;

    const exercises: UnifiedExercise[] = (lessonData.exercises || []).map((ex: any, i: number) => ({
      id: ex.id || `${lessonId}-ex${i + 1}`,
      type: ex.type || 'multiple-choice',
      prompt: ex.prompt || ex.question || '',
      promptEn: ex.promptEn || ex.questionEn,
      options: ex.options,
      answer: ex.answer,
      explanation: ex.explanation,
      explanationEn: ex.explanationEn,
    }));

    return {
      id: lessonId,
      originalId: lessonId,
      bookNumber,
      lessonNumber,
      title: lessonData.title,
      titleEn: lessonData.titleEn,
      type: 'madina',
      difficulty: 'beginner',
      content: lessonData,
      exercises,
      exerciseCount: exercises.length,
    };
  } catch (error) {
    throw new Error(`Failed to load Madina lesson ${lessonId}: ${error}`);
  }
}

/**
 * Load a lesson by its ID (b1-l01, b2-l03, etc.)
 * Returns a unified lesson interface.
 *
 * @param lessonId - Lesson ID in format b{book}-l{lesson} (e.g., 'b1-l01')
 * @returns Promise<UnifiedLesson>
 */
export async function loadUnifiedLesson(lessonId: string): Promise<UnifiedLesson> {
  // Check cache first
  if (lessonCache.has(lessonId)) {
    return lessonCache.get(lessonId)!;
  }

  const parsed = parseLessonId(lessonId);
  if (!parsed) {
    throw new Error(`Invalid lesson ID format: ${lessonId}`);
  }

  const { bookNumber, lessonNumber } = parsed;

  if (bookNumber < 1 || bookNumber > 3) {
    throw new Error(`Invalid book number ${bookNumber}. Only books 1-3 are supported.`);
  }

  const lesson = await loadMadinaLesson(bookNumber, lessonNumber);

  // Cache the loaded lesson
  lessonCache.set(lessonId, lesson);

  return lesson;
}

/**
 * Preload lessons for a book (useful for offline support or prefetching)
 */
export async function preloadBookLessons(bookNumber: number): Promise<void> {
  const lessonCount = { 1: 35, 2: 56, 3: 119 }[bookNumber] || 0;

  const promises: Promise<UnifiedLesson>[] = [];
  for (let i = 1; i <= lessonCount; i++) {
    const lessonId = `b${bookNumber}-l${String(i).padStart(2, '0')}`;
    promises.push(loadUnifiedLesson(lessonId).catch(() => null as any));
  }

  await Promise.all(promises);
}

/**
 * Clear the lesson cache (useful for testing or memory management)
 */
export function clearLessonCache(): void {
  lessonCache.clear();
}

/**
 * Check if a lesson is cached
 */
export function isLessonCached(lessonId: string): boolean {
  return lessonCache.has(lessonId);
}

/**
 * Get the book type from a unified lesson
 */
export function getUnifiedLessonType(lesson: UnifiedLesson): BookType {
  return lesson.type;
}
