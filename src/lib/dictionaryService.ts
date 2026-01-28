/**
 * Dictionary Service
 * 
 * Provides word lookup by Arabic text for tap-to-define functionality.
 * Uses the vocabulary data as the primary source.
 */

import { getAllWords, type WordData } from './vocabularyAsync';

// Normalize Arabic text for matching
function normalizeArabic(text: string): string {
  return text
    // Remove tashkeel (diacritics)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel
    .replace(/\u0640/g, '')
    // Normalize alef variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize taa marbuta
    .replace(/ة/g, 'ه')
    // Normalize yaa variants
    .replace(/ى/g, 'ي')
    .trim();
}

// Build a lookup map from Arabic text to words
let lookupMap: Map<string, WordData[]> | null = null;

function buildLookupMap(): Map<string, WordData[]> {
  if (lookupMap) return lookupMap;
  
  lookupMap = new Map();
  const words = getAllWords();
  
  for (const word of words) {
    // Add normalized form
    const normalized = normalizeArabic(word.arabic);
    const existing = lookupMap.get(normalized) || [];
    existing.push(word);
    lookupMap.set(normalized, existing);
    
    // Also add original if different
    if (word.arabic !== normalized) {
      const origExisting = lookupMap.get(word.arabic) || [];
      origExisting.push(word);
      lookupMap.set(word.arabic, origExisting);
    }
  }
  
  return lookupMap;
}

// Clear the cache when vocabulary changes
export function clearDictionaryCache(): void {
  lookupMap = null;
}

/**
 * Look up a word by its Arabic text.
 * Returns all matching words (there may be multiple with same spelling).
 */
export function lookupWord(arabicText: string): WordData[] {
  const map = buildLookupMap();
  
  // Try exact match first
  const exact = map.get(arabicText);
  if (exact && exact.length > 0) return exact;
  
  // Try normalized match
  const normalized = normalizeArabic(arabicText);
  const normalizedMatch = map.get(normalized);
  if (normalizedMatch && normalizedMatch.length > 0) return normalizedMatch;
  
  return [];
}

/**
 * Check if a word exists in the dictionary.
 */
export function hasWord(arabicText: string): boolean {
  return lookupWord(arabicText).length > 0;
}

/**
 * Get the best match for a word (first result).
 */
export function getBestMatch(arabicText: string): WordData | null {
  const matches = lookupWord(arabicText);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Extract individual Arabic words from a text.
 * Returns array of { word, start, end } for each word.
 */
export function extractArabicWords(text: string): Array<{
  word: string;
  start: number;
  end: number;
}> {
  const results: Array<{ word: string; start: number; end: number }> = [];
  
  // Match Arabic word characters (including diacritics)
  const arabicWordRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g;
  
  let match;
  while ((match = arabicWordRegex.exec(text)) !== null) {
    results.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return results;
}

/**
 * Split text into segments, identifying Arabic words that can be looked up.
 */
export function segmentText(text: string): Array<{
  type: 'arabic' | 'other';
  text: string;
  wordData?: WordData[];
}> {
  const words = extractArabicWords(text);
  const segments: Array<{ type: 'arabic' | 'other'; text: string; wordData?: WordData[] }> = [];
  
  let lastEnd = 0;
  
  for (const { word, start, end } of words) {
    // Add any text before this word
    if (start > lastEnd) {
      segments.push({
        type: 'other',
        text: text.slice(lastEnd, start),
      });
    }
    
    // Add the Arabic word
    const wordData = lookupWord(word);
    segments.push({
      type: 'arabic',
      text: word,
      wordData: wordData.length > 0 ? wordData : undefined,
    });
    
    lastEnd = end;
  }
  
  // Add any remaining text
  if (lastEnd < text.length) {
    segments.push({
      type: 'other',
      text: text.slice(lastEnd),
    });
  }
  
  return segments;
}
