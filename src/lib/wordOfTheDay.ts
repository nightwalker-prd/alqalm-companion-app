/**
 * Word of the Day utility.
 * Provides random word selection from eligible vocabulary.
 */

import { getAllWords, type WordData } from './vocabulary';

const ELIGIBLE_TYPES = [
  'noun', 'proper noun',
  'verb', 'verb-II', 'verb-III', 'verb-IV', 'verb-V', 'verb-VI',
  'verb-VII', 'verb-VIII', 'verb-IX', 'verb-X',
  'verb-hollow', 'verb-defective', 'verb-doubled',
  'verb-hamzated', 'verb-assimilated', 'verb-quadriliteral',
  'adjective', 'comparative',
  'active participle', 'passive participle'
];

let cachedEligibleWords: WordData[] | null = null;

/**
 * Get all words eligible for "Word of the Day" selection.
 * Filters to core vocabulary types: nouns, verbs, adjectives, and participles.
 * @returns Array of eligible words
 */
export function getEligibleWords(): WordData[] {
  if (!cachedEligibleWords) {
    cachedEligibleWords = getAllWords().filter(
      word => ELIGIBLE_TYPES.includes(word.partOfSpeech)
    );
  }
  return cachedEligibleWords;
}

/**
 * Get a random word for "Word of the Day" display.
 * Selects from nouns, verbs, adjectives, and participles only.
 * @returns A random word or null if no eligible words exist
 */
export function getRandomWord(): WordData | null {
  const words = getEligibleWords();
  if (words.length === 0) return null;
  return words[Math.floor(Math.random() * words.length)];
}
