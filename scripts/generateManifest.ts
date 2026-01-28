#!/usr/bin/env npx tsx
/**
 * Generate content manifest from lesson files.
 *
 * This script reads all lesson, vocabulary, and grammar files and generates
 * a lightweight manifest.json that contains only the metadata needed for
 * the main bundle, without including the full content.
 *
 * Supports Books 1-3: Madina Arabic course
 *
 * Run with: npx tsx scripts/generateManifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content');
const OUTPUT_FILE = path.join(CONTENT_DIR, 'manifest.json');


interface LessonData {
  id: string;
  book: number;
  lesson: number;
  title: string;
  titleEn: string;
  exercises: unknown[];
  vocabulary?: string[];
  grammarPoints?: string[];
}

interface VocabWord {
  id: string;
  arabic: string;
  english: string;
  root: string | null;
  lesson: string;
  partOfSpeech: string;
}

interface GrammarPoint {
  id: string;
  [key: string]: unknown;
}

interface LessonMeta {
  id: string;
  lesson: number;
  title: string;
  titleEn: string;
  exerciseCount: number;
  vocabularyIds: string[];
  grammarPointIds: string[];
}

interface BookManifest {
  lessonCount: number;
  wordCount: number;
  grammarCount: number;
  exerciseCount: number;
  lessonIds: string[];
  wordIds: string[];
  lessons: LessonMeta[];
}

interface Manifest {
  version: number;
  generatedAt: string;
  books: {
    [key: string]: BookManifest;
  };
}

function readJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function getLessonFiles(bookDir: string): string[] {
  const lessonsDir = path.join(bookDir, 'lessons');
  if (!fs.existsSync(lessonsDir)) return [];

  return fs.readdirSync(lessonsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => path.join(lessonsDir, f));
}

function generateBookManifest(bookNumber: number): BookManifest {
  const bookDir = path.join(CONTENT_DIR, `book${bookNumber}`);

  // Read vocabulary
  const vocabFile = path.join(bookDir, 'vocabulary.json');
  const vocabulary: VocabWord[] = fs.existsSync(vocabFile)
    ? readJsonFile<VocabWord[]>(vocabFile)
    : [];

  // Read grammar
  const grammarFile = path.join(bookDir, 'grammar.json');
  const grammar: GrammarPoint[] = fs.existsSync(grammarFile)
    ? readJsonFile<GrammarPoint[]>(grammarFile)
    : [];

  // Read all lessons
  const lessonFiles = getLessonFiles(bookDir);
  const lessons: LessonMeta[] = [];
  let totalExercises = 0;

  for (const lessonFile of lessonFiles) {
    const lesson = readJsonFile<LessonData>(lessonFile);
    const exerciseCount = lesson.exercises?.length || 0;
    totalExercises += exerciseCount;

    lessons.push({
      id: lesson.id,
      lesson: lesson.lesson,
      title: lesson.title,
      titleEn: lesson.titleEn,
      exerciseCount,
      vocabularyIds: lesson.vocabulary || [],
      grammarPointIds: lesson.grammarPoints || [],
    });
  }

  return {
    lessonCount: lessons.length,
    wordCount: vocabulary.length,
    grammarCount: grammar.length,
    exerciseCount: totalExercises,
    lessonIds: lessons.map(l => l.id),
    wordIds: vocabulary.map(v => v.id),
    lessons,
  };
}

function generateManifest(): Manifest {
  const manifest: Manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    books: {},
  };

  // Generate manifests for Madina Books (1-3)
  for (const bookNumber of [1, 2, 3]) {
    manifest.books[bookNumber] = generateBookManifest(bookNumber);
  }

  return manifest;
}

function main() {
  console.log('Generating content manifest...');

  const manifest = generateManifest();

  // Write manifest
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

  // Print summary
  const totalBooks = Object.keys(manifest.books).length;
  const totalLessons = Object.values(manifest.books).reduce((sum, b) => sum + b.lessonCount, 0);
  const totalWords = Object.values(manifest.books).reduce((sum, b) => sum + b.wordCount, 0);
  const totalExercises = Object.values(manifest.books).reduce((sum, b) => sum + b.exerciseCount, 0);

  console.log(`\nManifest generated: ${OUTPUT_FILE}`);
  console.log(`  Books: ${totalBooks}`);
  console.log(`  Lessons: ${totalLessons}`);
  console.log(`  Words: ${totalWords}`);
  console.log(`  Exercises: ${totalExercises}`);

  // Print per-book summary
  console.log('\nPer-book breakdown:');
  for (const [bookNum, book] of Object.entries(manifest.books)) {
    console.log(`  Book ${bookNum}: ${book.lessonCount} lessons, ${book.exerciseCount} exercises`);
  }

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\nFile size: ${(stats.size / 1024).toFixed(1)}KB`);
}

main();
