/**
 * Vocabulary lookup utility.
 * Provides O(1) access to word data by ID, lesson, or root.
 */

import book1Vocabulary from '../content/book1/vocabulary.json';
import book2Vocabulary from '../content/book2/vocabulary.json';
import book3Vocabulary from '../content/book3/vocabulary.json';
import nahwVocabulary from '../content/nahw/vocabulary.json';
import sarfVocabulary from '../content/sarf/vocabulary.json';

/**
 * Word data structure from vocabulary.json files
 */
export interface WordData {
  id: string;
  arabic: string;
  english: string;
  root: string | null;
  lesson: string;
  partOfSpeech: string;
}

// Combine all vocabulary into a single array
const allWords: WordData[] = [
  ...(book1Vocabulary as WordData[]),
  ...(book2Vocabulary as WordData[]),
  ...(book3Vocabulary as WordData[]),
  ...(nahwVocabulary as WordData[]),
  ...(sarfVocabulary as WordData[]),
];

// Build lookup maps for O(1) access
const wordMap = new Map<string, WordData>();
const lessonMap = new Map<string, WordData[]>();
const rootMap = new Map<string, WordData[]>();

// Populate maps on module load
for (const word of allWords) {
  // Word ID map
  wordMap.set(word.id, word);

  // Lesson map
  const lessonWords = lessonMap.get(word.lesson) || [];
  lessonWords.push(word);
  lessonMap.set(word.lesson, lessonWords);

  // Root map (only for words with roots)
  if (word.root) {
    const rootWords = rootMap.get(word.root) || [];
    rootWords.push(word);
    rootMap.set(word.root, rootWords);
  }
}

/**
 * Get a word by its ID.
 * @param wordId - The word ID (e.g., "word-007")
 * @returns The word data or null if not found
 */
export function getWordById(wordId: string): WordData | null {
  return wordMap.get(wordId) || null;
}

/**
 * Get all words from all books.
 * @returns Array of all word data
 */
export function getAllWords(): WordData[] {
  return allWords;
}

/**
 * Get all words introduced in a specific lesson.
 * @param lessonId - The lesson ID (e.g., "b1-l01")
 * @returns Array of words from that lesson, or empty array if none found
 */
export function getWordsByLesson(lessonId: string): WordData[] {
  return lessonMap.get(lessonId) || [];
}

/**
 * Get all words sharing the same Arabic root.
 * @param root - The Arabic root (e.g., "ك-ت-ب")
 * @returns Array of words with that root, or empty array if none found
 */
export function getWordsByRoot(root: string): WordData[] {
  return rootMap.get(root) || [];
}

/**
 * Get all unique roots in the vocabulary.
 * @returns Array of root strings
 */
export function getAllRoots(): string[] {
  return Array.from(rootMap.keys());
}

/**
 * Get the total count of words in the vocabulary.
 * @returns Total word count
 */
export function getWordCount(): number {
  return allWords.length;
}
