/**
 * Content statistics calculated from JSON lesson files.
 * Provides accurate counts of lessons, words, grammar points, and exercises.
 */

import type { BookContentStats, TotalContentStats } from '../types/progress';

// Import vocabulary files
import book1Vocabulary from '../content/book1/vocabulary.json';
import book2Vocabulary from '../content/book2/vocabulary.json';
import book3Vocabulary from '../content/book3/vocabulary.json';

// Import grammar files
import book1Grammar from '../content/book1/grammar.json';
import book2Grammar from '../content/book2/grammar.json';
import book3Grammar from '../content/book3/grammar.json';

// Import all lesson files for exercise counts
// Book 1
import b1l01 from '../content/book1/lessons/lesson-01.json';
import b1l02 from '../content/book1/lessons/lesson-02.json';
import b1l03 from '../content/book1/lessons/lesson-03.json';
import b1l04 from '../content/book1/lessons/lesson-04.json';
import b1l05 from '../content/book1/lessons/lesson-05.json';
import b1l06 from '../content/book1/lessons/lesson-06.json';
import b1l07 from '../content/book1/lessons/lesson-07.json';
import b1l08 from '../content/book1/lessons/lesson-08.json';
import b1l09 from '../content/book1/lessons/lesson-09.json';
import b1l10 from '../content/book1/lessons/lesson-10.json';
import b1l11 from '../content/book1/lessons/lesson-11.json';
import b1l12 from '../content/book1/lessons/lesson-12.json';
import b1l13 from '../content/book1/lessons/lesson-13.json';
import b1l14 from '../content/book1/lessons/lesson-14.json';
import b1l15 from '../content/book1/lessons/lesson-15.json';
import b1l16 from '../content/book1/lessons/lesson-16.json';
import b1l17 from '../content/book1/lessons/lesson-17.json';
import b1l18 from '../content/book1/lessons/lesson-18.json';
import b1l19 from '../content/book1/lessons/lesson-19.json';
import b1l20 from '../content/book1/lessons/lesson-20.json';
import b1l21 from '../content/book1/lessons/lesson-21.json';
import b1l22 from '../content/book1/lessons/lesson-22.json';
import b1l23 from '../content/book1/lessons/lesson-23.json';
import b1l24 from '../content/book1/lessons/lesson-24.json';
import b1l25 from '../content/book1/lessons/lesson-25.json';
import b1l26 from '../content/book1/lessons/lesson-26.json';
import b1l27 from '../content/book1/lessons/lesson-27.json';
import b1l28 from '../content/book1/lessons/lesson-28.json';
import b1l29 from '../content/book1/lessons/lesson-29.json';
import b1l30 from '../content/book1/lessons/lesson-30.json';
import b1l31 from '../content/book1/lessons/lesson-31.json';
import b1l32 from '../content/book1/lessons/lesson-32.json';
import b1l33 from '../content/book1/lessons/lesson-33.json';
import b1l34 from '../content/book1/lessons/lesson-34.json';
import b1l35 from '../content/book1/lessons/lesson-35.json';

// Book 2
import b2l01 from '../content/book2/lessons/lesson-01.json';
import b2l02 from '../content/book2/lessons/lesson-02.json';
import b2l03 from '../content/book2/lessons/lesson-03.json';
import b2l04 from '../content/book2/lessons/lesson-04.json';
import b2l05 from '../content/book2/lessons/lesson-05.json';
import b2l06 from '../content/book2/lessons/lesson-06.json';
import b2l07 from '../content/book2/lessons/lesson-07.json';
import b2l08 from '../content/book2/lessons/lesson-08.json';
import b2l09 from '../content/book2/lessons/lesson-09.json';
import b2l10 from '../content/book2/lessons/lesson-10.json';
import b2l11 from '../content/book2/lessons/lesson-11.json';
import b2l12 from '../content/book2/lessons/lesson-12.json';
import b2l13 from '../content/book2/lessons/lesson-13.json';
import b2l14 from '../content/book2/lessons/lesson-14.json';
import b2l15 from '../content/book2/lessons/lesson-15.json';
import b2l16 from '../content/book2/lessons/lesson-16.json';
import b2l17 from '../content/book2/lessons/lesson-17.json';
import b2l18 from '../content/book2/lessons/lesson-18.json';
import b2l19 from '../content/book2/lessons/lesson-19.json';
import b2l20 from '../content/book2/lessons/lesson-20.json';
import b2l21 from '../content/book2/lessons/lesson-21.json';
import b2l22 from '../content/book2/lessons/lesson-22.json';
import b2l23 from '../content/book2/lessons/lesson-23.json';
import b2l24 from '../content/book2/lessons/lesson-24.json';
import b2l25 from '../content/book2/lessons/lesson-25.json';
import b2l26 from '../content/book2/lessons/lesson-26.json';
import b2l27 from '../content/book2/lessons/lesson-27.json';
import b2l28 from '../content/book2/lessons/lesson-28.json';
import b2l29 from '../content/book2/lessons/lesson-29.json';
import b2l30 from '../content/book2/lessons/lesson-30.json';
import b2l31 from '../content/book2/lessons/lesson-31.json';
import b2l32 from '../content/book2/lessons/lesson-32.json';
import b2l33 from '../content/book2/lessons/lesson-33.json';
import b2l34 from '../content/book2/lessons/lesson-34.json';
import b2l35 from '../content/book2/lessons/lesson-35.json';
import b2l36 from '../content/book2/lessons/lesson-36.json';
import b2l37 from '../content/book2/lessons/lesson-37.json';
import b2l38 from '../content/book2/lessons/lesson-38.json';
import b2l39 from '../content/book2/lessons/lesson-39.json';
import b2l40 from '../content/book2/lessons/lesson-40.json';
import b2l41 from '../content/book2/lessons/lesson-41.json';
import b2l42 from '../content/book2/lessons/lesson-42.json';
import b2l43 from '../content/book2/lessons/lesson-43.json';
import b2l44 from '../content/book2/lessons/lesson-44.json';
import b2l45 from '../content/book2/lessons/lesson-45.json';
import b2l46 from '../content/book2/lessons/lesson-46.json';
import b2l47 from '../content/book2/lessons/lesson-47.json';
import b2l48 from '../content/book2/lessons/lesson-48.json';
import b2l49 from '../content/book2/lessons/lesson-49.json';
import b2l50 from '../content/book2/lessons/lesson-50.json';
import b2l51 from '../content/book2/lessons/lesson-51.json';
import b2l52 from '../content/book2/lessons/lesson-52.json';
import b2l53 from '../content/book2/lessons/lesson-53.json';
import b2l54 from '../content/book2/lessons/lesson-54.json';
import b2l55 from '../content/book2/lessons/lesson-55.json';
import b2l56 from '../content/book2/lessons/lesson-56.json';

// Book 3
import b3l01 from '../content/book3/lessons/lesson-01.json';
import b3l02 from '../content/book3/lessons/lesson-02.json';
import b3l03 from '../content/book3/lessons/lesson-03.json';
import b3l04 from '../content/book3/lessons/lesson-04.json';
import b3l05 from '../content/book3/lessons/lesson-05.json';
import b3l06 from '../content/book3/lessons/lesson-06.json';
import b3l07 from '../content/book3/lessons/lesson-07.json';
import b3l08 from '../content/book3/lessons/lesson-08.json';
import b3l09 from '../content/book3/lessons/lesson-09.json';
import b3l10 from '../content/book3/lessons/lesson-10.json';
import b3l11 from '../content/book3/lessons/lesson-11.json';
import b3l12 from '../content/book3/lessons/lesson-12.json';
import b3l13 from '../content/book3/lessons/lesson-13.json';
import b3l14 from '../content/book3/lessons/lesson-14.json';
import b3l15 from '../content/book3/lessons/lesson-15.json';
import b3l16 from '../content/book3/lessons/lesson-16.json';
import b3l17 from '../content/book3/lessons/lesson-17.json';
import b3l18 from '../content/book3/lessons/lesson-18.json';
import b3l19 from '../content/book3/lessons/lesson-19.json';
import b3l20 from '../content/book3/lessons/lesson-20.json';
import b3l21 from '../content/book3/lessons/lesson-21.json';
import b3l22 from '../content/book3/lessons/lesson-22.json';
import b3l23 from '../content/book3/lessons/lesson-23.json';
import b3l24 from '../content/book3/lessons/lesson-24.json';
import b3l25 from '../content/book3/lessons/lesson-25.json';
import b3l26 from '../content/book3/lessons/lesson-26.json';
import b3l27 from '../content/book3/lessons/lesson-27.json';
import b3l28 from '../content/book3/lessons/lesson-28.json';
import b3l29 from '../content/book3/lessons/lesson-29.json';
import b3l30 from '../content/book3/lessons/lesson-30.json';
import b3l31 from '../content/book3/lessons/lesson-31.json';
import b3l32 from '../content/book3/lessons/lesson-32.json';
import b3l33 from '../content/book3/lessons/lesson-33.json';
import b3l34 from '../content/book3/lessons/lesson-34.json';
import b3l35 from '../content/book3/lessons/lesson-35.json';
import b3l36 from '../content/book3/lessons/lesson-36.json';
import b3l37 from '../content/book3/lessons/lesson-37.json';
import b3l38 from '../content/book3/lessons/lesson-38.json';
import b3l39 from '../content/book3/lessons/lesson-39.json';
import b3l40 from '../content/book3/lessons/lesson-40.json';
import b3l41 from '../content/book3/lessons/lesson-41.json';
import b3l42 from '../content/book3/lessons/lesson-42.json';
import b3l43 from '../content/book3/lessons/lesson-43.json';
import b3l44 from '../content/book3/lessons/lesson-44.json';
import b3l45 from '../content/book3/lessons/lesson-45.json';
import b3l46 from '../content/book3/lessons/lesson-46.json';
import b3l47 from '../content/book3/lessons/lesson-47.json';
import b3l48 from '../content/book3/lessons/lesson-48.json';
import b3l49 from '../content/book3/lessons/lesson-49.json';
import b3l50 from '../content/book3/lessons/lesson-50.json';
import b3l51 from '../content/book3/lessons/lesson-51.json';
import b3l52 from '../content/book3/lessons/lesson-52.json';
import b3l53 from '../content/book3/lessons/lesson-53.json';
import b3l54 from '../content/book3/lessons/lesson-54.json';
import b3l55 from '../content/book3/lessons/lesson-55.json';
import b3l56 from '../content/book3/lessons/lesson-56.json';
import b3l57 from '../content/book3/lessons/lesson-57.json';
import b3l58 from '../content/book3/lessons/lesson-58.json';
import b3l59 from '../content/book3/lessons/lesson-59.json';
import b3l60 from '../content/book3/lessons/lesson-60.json';
import b3l61 from '../content/book3/lessons/lesson-61.json';
import b3l62 from '../content/book3/lessons/lesson-62.json';
import b3l63 from '../content/book3/lessons/lesson-63.json';
import b3l64 from '../content/book3/lessons/lesson-64.json';
import b3l65 from '../content/book3/lessons/lesson-65.json';
import b3l66 from '../content/book3/lessons/lesson-66.json';
import b3l67 from '../content/book3/lessons/lesson-67.json';
import b3l68 from '../content/book3/lessons/lesson-68.json';
import b3l69 from '../content/book3/lessons/lesson-69.json';
import b3l70 from '../content/book3/lessons/lesson-70.json';
import b3l71 from '../content/book3/lessons/lesson-71.json';
import b3l72 from '../content/book3/lessons/lesson-72.json';
import b3l73 from '../content/book3/lessons/lesson-73.json';
import b3l74 from '../content/book3/lessons/lesson-74.json';
import b3l75 from '../content/book3/lessons/lesson-75.json';
import b3l76 from '../content/book3/lessons/lesson-76.json';
import b3l77 from '../content/book3/lessons/lesson-77.json';
import b3l78 from '../content/book3/lessons/lesson-78.json';
import b3l79 from '../content/book3/lessons/lesson-79.json';
import b3l80 from '../content/book3/lessons/lesson-80.json';
import b3l81 from '../content/book3/lessons/lesson-81.json';
import b3l82 from '../content/book3/lessons/lesson-82.json';
import b3l83 from '../content/book3/lessons/lesson-83.json';
import b3l84 from '../content/book3/lessons/lesson-84.json';
import b3l85 from '../content/book3/lessons/lesson-85.json';
import b3l86 from '../content/book3/lessons/lesson-86.json';
import b3l87 from '../content/book3/lessons/lesson-87.json';
import b3l88 from '../content/book3/lessons/lesson-88.json';
import b3l89 from '../content/book3/lessons/lesson-89.json';
import b3l90 from '../content/book3/lessons/lesson-90.json';
import b3l91 from '../content/book3/lessons/lesson-91.json';
import b3l92 from '../content/book3/lessons/lesson-92.json';
import b3l93 from '../content/book3/lessons/lesson-93.json';
import b3l94 from '../content/book3/lessons/lesson-94.json';
import b3l95 from '../content/book3/lessons/lesson-95.json';
import b3l96 from '../content/book3/lessons/lesson-96.json';
import b3l97 from '../content/book3/lessons/lesson-97.json';
import b3l98 from '../content/book3/lessons/lesson-98.json';
import b3l99 from '../content/book3/lessons/lesson-99.json';
import b3l100 from '../content/book3/lessons/lesson-100.json';
import b3l101 from '../content/book3/lessons/lesson-101.json';
import b3l102 from '../content/book3/lessons/lesson-102.json';
import b3l103 from '../content/book3/lessons/lesson-103.json';
import b3l104 from '../content/book3/lessons/lesson-104.json';
import b3l105 from '../content/book3/lessons/lesson-105.json';
import b3l106 from '../content/book3/lessons/lesson-106.json';
import b3l107 from '../content/book3/lessons/lesson-107.json';
import b3l108 from '../content/book3/lessons/lesson-108.json';
import b3l109 from '../content/book3/lessons/lesson-109.json';
import b3l110 from '../content/book3/lessons/lesson-110.json';
import b3l111 from '../content/book3/lessons/lesson-111.json';
import b3l112 from '../content/book3/lessons/lesson-112.json';
import b3l113 from '../content/book3/lessons/lesson-113.json';
import b3l114 from '../content/book3/lessons/lesson-114.json';
import b3l115 from '../content/book3/lessons/lesson-115.json';
import b3l116 from '../content/book3/lessons/lesson-116.json';
import b3l117 from '../content/book3/lessons/lesson-117.json';
import b3l118 from '../content/book3/lessons/lesson-118.json';
import b3l119 from '../content/book3/lessons/lesson-119.json';

// Lesson data type (matches JSON structure)
interface LessonData {
  id: string;
  book: number;
  lesson: number;
  title: string;       // Arabic title
  titleEn: string;     // English title
  exercises: unknown[];
  vocabulary?: string[];
  grammarPoints?: string[];
}

// Lesson metadata for UI display
export interface LessonMeta {
  id: string;
  lessonNumber: number;
  titleArabic: string;
  titleEnglish: string;
}

// Organize lessons by book
const book1Lessons: LessonData[] = [
  b1l01, b1l02, b1l03, b1l04, b1l05, b1l06, b1l07, b1l08, b1l09, b1l10,
  b1l11, b1l12, b1l13, b1l14, b1l15, b1l16, b1l17, b1l18, b1l19, b1l20,
  b1l21, b1l22, b1l23, b1l24, b1l25, b1l26, b1l27, b1l28, b1l29, b1l30,
  b1l31, b1l32, b1l33, b1l34, b1l35,
] as LessonData[];

const book2Lessons: LessonData[] = [
  b2l01, b2l02, b2l03, b2l04, b2l05, b2l06, b2l07, b2l08, b2l09, b2l10,
  b2l11, b2l12, b2l13, b2l14, b2l15, b2l16, b2l17, b2l18, b2l19, b2l20,
  b2l21, b2l22, b2l23, b2l24, b2l25, b2l26, b2l27, b2l28, b2l29, b2l30,
  b2l31, b2l32, b2l33, b2l34, b2l35, b2l36, b2l37, b2l38, b2l39, b2l40,
  b2l41, b2l42, b2l43, b2l44, b2l45, b2l46, b2l47, b2l48, b2l49, b2l50,
  b2l51, b2l52, b2l53, b2l54, b2l55, b2l56,
] as LessonData[];

const book3Lessons: LessonData[] = [
  b3l01, b3l02, b3l03, b3l04, b3l05, b3l06, b3l07, b3l08, b3l09, b3l10,
  b3l11, b3l12, b3l13, b3l14, b3l15, b3l16, b3l17, b3l18, b3l19, b3l20,
  b3l21, b3l22, b3l23, b3l24, b3l25, b3l26, b3l27, b3l28, b3l29, b3l30,
  b3l31, b3l32, b3l33, b3l34, b3l35, b3l36, b3l37, b3l38, b3l39, b3l40,
  b3l41, b3l42, b3l43, b3l44, b3l45, b3l46, b3l47, b3l48, b3l49, b3l50,
  b3l51, b3l52, b3l53, b3l54, b3l55, b3l56, b3l57, b3l58, b3l59, b3l60,
  b3l61, b3l62, b3l63, b3l64, b3l65, b3l66, b3l67, b3l68, b3l69, b3l70,
  b3l71, b3l72, b3l73, b3l74, b3l75, b3l76, b3l77, b3l78, b3l79, b3l80,
  b3l81, b3l82, b3l83, b3l84, b3l85, b3l86, b3l87, b3l88, b3l89, b3l90,
  b3l91, b3l92, b3l93, b3l94, b3l95, b3l96, b3l97, b3l98, b3l99, b3l100,
  b3l101, b3l102, b3l103, b3l104, b3l105, b3l106, b3l107, b3l108, b3l109, b3l110,
  b3l111, b3l112, b3l113, b3l114, b3l115, b3l116, b3l117, b3l118, b3l119,
] as LessonData[];

// All lessons by book number
const lessonsByBook: Record<number, LessonData[]> = {
  1: book1Lessons,
  2: book2Lessons,
  3: book3Lessons,
};

// All vocabulary by book
const vocabularyByBook: Record<number, unknown[]> = {
  1: book1Vocabulary,
  2: book2Vocabulary,
  3: book3Vocabulary,
};

// All grammar by book
const grammarByBook: Record<number, unknown[]> = {
  1: book1Grammar,
  2: book2Grammar,
  3: book3Grammar,
};

/**
 * Get content statistics for a specific book
 */
export function getBookContentStats(bookNumber: number): BookContentStats {
  const lessons = lessonsByBook[bookNumber] || [];
  const vocabulary = vocabularyByBook[bookNumber] || [];
  const grammar = grammarByBook[bookNumber] || [];
  
  const exerciseCount = lessons.reduce(
    (sum, lesson) => sum + (lesson.exercises?.length || 0),
    0
  );
  
  return {
    bookNumber,
    lessonCount: lessons.length,
    wordCount: vocabulary.length,
    grammarCount: grammar.length,
    exerciseCount,
  };
}

/**
 * Get total content statistics across all books
 */
export function getTotalContentStats(): TotalContentStats {
  const book1 = getBookContentStats(1);
  const book2 = getBookContentStats(2);
  const book3 = getBookContentStats(3);
  
  return {
    lessonCount: book1.lessonCount + book2.lessonCount + book3.lessonCount,
    wordCount: book1.wordCount + book2.wordCount + book3.wordCount,
    grammarCount: book1.grammarCount + book2.grammarCount + book3.grammarCount,
    exerciseCount: book1.exerciseCount + book2.exerciseCount + book3.exerciseCount,
  };
}

/**
 * Get all word IDs for a specific book
 */
export function getWordIdsForBook(bookNumber: number): string[] {
  const vocabulary = vocabularyByBook[bookNumber] || [];
  return vocabulary.map((word: unknown) => (word as { id: string }).id);
}

/**
 * Get all word IDs for a specific lesson
 */
export function getLessonWordIds(lessonId: string): string[] {
  const bookNumber = parseInt(lessonId.charAt(1), 10);
  const lessons = lessonsByBook[bookNumber] || [];
  const lesson = lessons.find(l => l.id === lessonId);
  return lesson?.vocabulary || [];
}

/**
 * Get exercise count for a specific lesson
 */
export function getLessonExerciseCount(lessonId: string): number {
  const bookNumber = parseInt(lessonId.charAt(1), 10);
  const lessons = lessonsByBook[bookNumber] || [];
  const lesson = lessons.find(l => l.id === lessonId);
  return lesson?.exercises?.length || 0;
}

/**
 * Get all lesson IDs for a specific book
 */
export function getLessonIdsForBook(bookNumber: number): string[] {
  const lessons = lessonsByBook[bookNumber] || [];
  return lessons.map(l => l.id);
}

/**
 * Get all lesson IDs across all books
 */
export function getAllLessonIds(): string[] {
  return [
    ...getLessonIdsForBook(1),
    ...getLessonIdsForBook(2),
    ...getLessonIdsForBook(3),
  ];
}

/**
 * Extract book number from lesson ID (e.g., 'b1-l01' -> 1)
 */
export function getBookNumberFromLessonId(lessonId: string): number {
  return parseInt(lessonId.charAt(1), 10);
}

/**
 * Extract lesson ID from exercise ID (e.g., 'b1-l01-ex01' -> 'b1-l01')
 */
export function getLessonIdFromExerciseId(exerciseId: string): string {
  // Exercise IDs are formatted as 'b1-l01-ex01'
  const parts = exerciseId.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return exerciseId;
}

/**
 * Get lesson metadata for a specific book (for Dashboard/UI display)
 */
export function getLessonMetaForBook(bookNumber: number): LessonMeta[] {
  const lessons = lessonsByBook[bookNumber] || [];
  return lessons.map(lesson => ({
    id: lesson.id,
    lessonNumber: lesson.lesson,
    titleArabic: lesson.title,
    titleEnglish: lesson.titleEn,
  }));
}

/**
 * Get all lesson metadata across all books
 */
export function getAllLessonMeta(): LessonMeta[] {
  return [
    ...getLessonMetaForBook(1),
    ...getLessonMetaForBook(2),
    ...getLessonMetaForBook(3),
  ];
}

/**
 * Lesson data in the format needed for building the FIRe encompassing graph
 */
export interface LessonForGraph {
  id: string;
  book: number;
  lesson: number;
  vocabulary?: string[];
  grammarPoints?: string[];
  exercises: Array<{
    id: string;
    itemIds: string[];
  }>;
}

/**
 * Get all lessons in the format needed for building the FIRe encompassing graph.
 * This includes vocabulary, grammar points, and exercise itemIds.
 */
export function getAllLessonsForGraph(): LessonForGraph[] {
  const allLessons: LessonForGraph[] = [];

  for (const bookNumber of [1, 2, 3] as const) {
    const lessons = lessonsByBook[bookNumber] || [];
    for (const lesson of lessons) {
      allLessons.push({
        id: lesson.id,
        book: lesson.book,
        lesson: lesson.lesson,
        vocabulary: lesson.vocabulary ?? [],
        grammarPoints: lesson.grammarPoints ?? [],
        exercises: (lesson.exercises as Array<{ id: string; itemIds?: string[] }>).map((ex) => ({
          id: ex.id,
          itemIds: ex.itemIds ?? [],
        })),
      });
    }
  }

  return allLessons;
}
