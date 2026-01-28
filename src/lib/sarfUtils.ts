/**
 * Sarf Data Processing Utilities
 * 
 * Functions for processing Arabic morphology data from Alqalam's sarf exercises.
 */

import type {
  SarfWord,
  RootFamily,
  WordCategory,
  VerbForm,
  RootType,
  Difficulty,
} from '../types/morphology';

/**
 * Parse root string into individual letters
 */
export function parseRootLetters(root: string): string[] {
  return root.split(' ').filter(Boolean);
}

/**
 * Infer core meaning from a root family's words
 * Uses the most common/basic verb meaning
 */
function inferCoreMeaning(words: SarfWord[]): string {
  // Prefer Form I verbs for core meaning
  const formIVerb = words.find(
    w => w.category === 'verb' && w.verbForm === 'I'
  );
  if (formIVerb) {
    // Extract infinitive meaning (remove "he" prefix if present)
    return formIVerb.meaning
      .replace(/^he\s+/i, 'to ')
      .replace(/^to\s+to\s+/, 'to ');
  }
  
  // Fall back to first verb
  const anyVerb = words.find(w => w.category === 'verb');
  if (anyVerb) {
    return anyVerb.meaning;
  }
  
  // Fall back to masdar
  const masdar = words.find(w => w.category === 'masdar');
  if (masdar) {
    return masdar.meaning;
  }
  
  // Last resort: first word
  return words[0]?.meaning || 'unknown';
}

/**
 * Determine root type from words (most common type wins)
 */
function determineRootType(words: SarfWord[]): RootType {
  const typeCounts = new Map<RootType, number>();
  
  for (const word of words) {
    if (word.rootType) {
      typeCounts.set(word.rootType, (typeCounts.get(word.rootType) || 0) + 1);
    }
  }
  
  if (typeCounts.size === 0) return 'saleem';
  
  let maxType: RootType = 'saleem';
  let maxCount = 0;
  
  for (const [type, count] of typeCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  
  return maxType;
}

/**
 * Get minimum difficulty from words
 */
function getMinDifficulty(words: SarfWord[]): Difficulty {
  const order: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  let minIndex = order.length - 1;
  
  for (const word of words) {
    const idx = order.indexOf(word.difficulty);
    if (idx >= 0 && idx < minIndex) {
      minIndex = idx;
    }
  }
  
  return order[minIndex];
}

/**
 * Build root families from flat word list
 */
export function buildRootFamilies(words: SarfWord[]): RootFamily[] {
  // Group words by root
  const byRoot = new Map<string, SarfWord[]>();
  
  for (const word of words) {
    if (!word.root) continue;
    
    const existing = byRoot.get(word.root) || [];
    existing.push(word);
    byRoot.set(word.root, existing);
  }
  
  // Build root family objects
  const families: RootFamily[] = [];
  
  for (const [root, rootWords] of byRoot) {
    // Count by category
    const categoryCounts: Partial<Record<WordCategory, number>> = {};
    const verbFormSet = new Set<VerbForm>();
    
    for (const word of rootWords) {
      categoryCounts[word.category] = (categoryCounts[word.category] || 0) + 1;
      if (word.verbForm) {
        verbFormSet.add(word.verbForm);
      }
    }
    
    const family: RootFamily = {
      root,
      rootLetters: parseRootLetters(root),
      coreMeaning: inferCoreMeaning(rootWords),
      rootType: determineRootType(rootWords),
      words: rootWords,
      categoryCounts,
      verbForms: Array.from(verbFormSet).sort(),
      minDifficulty: getMinDifficulty(rootWords),
    };
    
    families.push(family);
  }
  
  // Sort by number of words (richest families first)
  families.sort((a, b) => b.words.length - a.words.length);
  
  return families;
}

/**
 * Filter root families by difficulty
 */
export function filterByDifficulty(
  families: RootFamily[],
  maxDifficulty: Difficulty
): RootFamily[] {
  const order: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  const maxIndex = order.indexOf(maxDifficulty);
  
  return families.filter(f => order.indexOf(f.minDifficulty) <= maxIndex);
}

/**
 * Get words from a family that match certain criteria
 */
export function getWordsFromFamily(
  family: RootFamily,
  options: {
    categories?: WordCategory[];
    verbForms?: VerbForm[];
    maxDifficulty?: Difficulty;
  } = {}
): SarfWord[] {
  const { categories, verbForms, maxDifficulty } = options;
  const difficultyOrder: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  const maxDiffIndex = maxDifficulty ? difficultyOrder.indexOf(maxDifficulty) : 2;
  
  return family.words.filter(word => {
    if (categories && !categories.includes(word.category)) {
      return false;
    }
    if (verbForms && word.verbForm && !verbForms.includes(word.verbForm)) {
      return false;
    }
    if (difficultyOrder.indexOf(word.difficulty) > maxDiffIndex) {
      return false;
    }
    return true;
  });
}

/**
 * Find families that contain a specific pattern
 */
export function findFamiliesByPattern(
  families: RootFamily[],
  pattern: string
): RootFamily[] {
  return families.filter(f => 
    f.words.some(w => w.pattern === pattern)
  );
}

/**
 * Get all unique patterns from the data
 */
export function getAllPatterns(words: SarfWord[]): Map<string, number> {
  const patterns = new Map<string, number>();
  
  for (const word of words) {
    if (word.pattern) {
      patterns.set(word.pattern, (patterns.get(word.pattern) || 0) + 1);
    }
  }
  
  return patterns;
}

/**
 * Deduplicate words by (word, category) pair
 * Keeps the one with more information
 */
export function deduplicateWords(words: SarfWord[]): SarfWord[] {
  const seen = new Map<string, SarfWord>();
  
  for (const word of words) {
    const key = `${word.word}|${word.category}`;
    const existing = seen.get(key);
    
    if (!existing) {
      seen.set(key, word);
    } else {
      // Keep the one with more fields filled
      const existingScore = countFilledFields(existing);
      const newScore = countFilledFields(word);
      
      if (newScore > existingScore) {
        seen.set(key, word);
      }
    }
  }
  
  return Array.from(seen.values());
}

function countFilledFields(word: SarfWord): number {
  let count = 0;
  if (word.usage) count++;
  if (word.prepositions?.length) count++;
  if (word.exampleSentence) count++;
  if (word.exampleTranslation) count++;
  if (word.rootType) count++;
  return count;
}

/**
 * Generate exercises from a root family
 */
export function generateRootFamilyExercises(
  family: RootFamily,
  options: {
    maxWords?: number;
    includeTypes?: WordCategory[];
  } = {}
): Array<{
  type: 'root-to-meaning' | 'meaning-to-word' | 'identify-category';
  prompt: string;
  promptAr?: string;
  answer: string;
  distractors?: string[];
  word: SarfWord;
}> {
  const { maxWords = 5, includeTypes } = options;
  
  let words = family.words;
  if (includeTypes) {
    words = words.filter(w => includeTypes.includes(w.category));
  }
  
  // Limit and deduplicate
  words = deduplicateWords(words).slice(0, maxWords);
  
  const exercises: Array<{
    type: 'root-to-meaning' | 'meaning-to-word' | 'identify-category';
    prompt: string;
    promptAr?: string;
    answer: string;
    distractors?: string[];
    word: SarfWord;
  }> = [];
  
  for (const word of words) {
    // Word to meaning
    exercises.push({
      type: 'root-to-meaning',
      prompt: `What does "${word.word}" mean?`,
      promptAr: word.word,
      answer: word.meaning,
      word,
    });
    
    // Meaning to word (for non-verbs primarily)
    if (word.category !== 'verb') {
      exercises.push({
        type: 'meaning-to-word',
        prompt: `Write the Arabic for: ${word.meaning}`,
        answer: word.word,
        word,
      });
    }
    
    // Identify category
    exercises.push({
      type: 'identify-category',
      prompt: `What type of word is "${word.word}"?`,
      promptAr: word.word,
      answer: word.category,
      distractors: ['verb', 'noun', 'masdar', 'active-participle'].filter(
        c => c !== word.category
      ).slice(0, 3),
      word,
    });
  }
  
  return exercises;
}

/**
 * Exercise data for RootFamilyExercise component
 */
export interface RootFamilyExerciseData {
  id: string;
  type: 'match-meanings' | 'identify-root' | 'family-builder';
  family: RootFamily;
  targetWord?: SarfWord;
  options?: string[];
  answer: string;
  correctWords?: SarfWord[];
  distractorWords?: SarfWord[];
}

/**
 * Generate exercises for RootFamilyExercise component.
 * Creates a variety of exercise types for learning root-pattern relationships.
 */
export function generateRootFamilyComponentExercises(
  family: RootFamily,
  allFamilies: RootFamily[],
  options: {
    maxExercises?: number;
    difficulty?: Difficulty;
  } = {}
): RootFamilyExerciseData[] {
  const { maxExercises = 5, difficulty = 'beginner' } = options;
  const exercises: RootFamilyExerciseData[] = [];
  
  // Filter words by difficulty
  const targetWords = family.words.filter(w => w.difficulty === difficulty);
  if (targetWords.length === 0) return [];
  
  // Get other families for distractors
  const otherFamilies = allFamilies.filter(f => f.root !== family.root);
  
  // 1. Match-meanings exercises: given word, select correct meaning
  for (const word of targetWords.slice(0, 2)) {
    // Get distractor meanings from other words
    const distractorMeanings = otherFamilies
      .flatMap(f => f.words)
      .filter(w => w.category === word.category && w.meaning !== word.meaning)
      .map(w => w.meaning)
      .slice(0, 10);
    
    // Pick 3 random distractors using Fisher-Yates
    const shuffledDistractors = fisherYatesShuffle(distractorMeanings).slice(0, 3);
    
    if (shuffledDistractors.length >= 3) {
      exercises.push({
        id: `rf-match-${family.root}-${word.id}`,
        type: 'match-meanings',
        family,
        targetWord: word,
        options: [word.meaning, ...shuffledDistractors],
        answer: word.meaning,
      });
    }
  }
  
  // 2. Identify-root exercises: given word, select root
  if (targetWords.length > 0 && otherFamilies.length >= 3) {
    const word = targetWords[0];
    const distractorRoots = fisherYatesShuffle(
      otherFamilies.map(f => f.root)
    ).slice(0, 3);
    
    exercises.push({
      id: `rf-root-${family.root}-${word.id}`,
      type: 'identify-root',
      family,
      targetWord: word,
      options: [family.root, ...distractorRoots],
      answer: family.root,
    });
  }
  
  // 3. Family-builder exercises: select all words from this family
  if (targetWords.length >= 2 && otherFamilies.length >= 2) {
    const correctWords = targetWords.slice(0, 3);
    const distractorWords = fisherYatesShuffle(
      otherFamilies.flatMap(f => f.words.filter(w => w.difficulty === difficulty))
    ).slice(0, 3);
    
    if (distractorWords.length >= 2) {
      exercises.push({
        id: `rf-builder-${family.root}`,
        type: 'family-builder',
        family,
        correctWords,
        distractorWords,
        answer: correctWords.map(w => String(w.id)).join(','),
      });
    }
  }
  
  return exercises.slice(0, maxExercises);
}

/**
 * Fisher-Yates shuffle (imported for local use)
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
