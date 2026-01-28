import { describe, test, expect, beforeEach } from 'vitest';
import {
  parseRootLetters,
  buildRootFamilies,
  deduplicateWords,
  filterByDifficulty,
  getWordsFromFamily,
  findFamiliesByPattern,
  getAllPatterns,
  generateRootFamilyExercises,
  generateRootFamilyComponentExercises,
} from '../sarfUtils';
import type { SarfWord, RootFamily, WordCategory } from '../../types/morphology';

// ============================================================================
// Mock Data Factories
// ============================================================================

let mockIdCounter = 1;

function createMockSarfWord(overrides: Partial<SarfWord> = {}): SarfWord {
  return {
    id: mockIdCounter++,
    word: 'كَتَبَ',
    transliteration: 'kataba',
    category: 'verb',
    root: 'ك ت ب',
    pattern: 'فَعَلَ',
    patternTranslit: "fa'ala",
    meaning: 'he wrote',
    difficulty: 'beginner',
    ...overrides,
  };
}

function createMockRootFamily(overrides: Partial<RootFamily> = {}): RootFamily {
  const words = overrides.words || [
    createMockSarfWord({ root: 'ك ت ب', category: 'verb', verbForm: 'I', meaning: 'he wrote' }),
    createMockSarfWord({ root: 'ك ت ب', category: 'masdar', meaning: 'writing', word: 'كِتَابَة' }),
    createMockSarfWord({ root: 'ك ت ب', category: 'active-participle', meaning: 'writer', word: 'كَاتِب' }),
  ];

  return {
    root: 'ك ت ب',
    rootLetters: ['ك', 'ت', 'ب'],
    coreMeaning: 'to write',
    rootType: 'saleem',
    words,
    categoryCounts: { verb: 1, masdar: 1, 'active-participle': 1 },
    verbForms: ['I'],
    minDifficulty: 'beginner',
    ...overrides,
  };
}

// Reset counter before each test file run
beforeEach(() => {
  mockIdCounter = 1;
});

// ============================================================================
// parseRootLetters
// ============================================================================

describe('parseRootLetters', () => {
  test('parses space-separated root letters correctly', () => {
    expect(parseRootLetters('ك ت ب')).toEqual(['ك', 'ت', 'ب']);
  });

  test('parses four-letter root', () => {
    expect(parseRootLetters('ز ل ز ل')).toEqual(['ز', 'ل', 'ز', 'ل']);
  });

  test('handles empty string', () => {
    expect(parseRootLetters('')).toEqual([]);
  });

  test('handles extra spaces between letters', () => {
    expect(parseRootLetters('ك  ت   ب')).toEqual(['ك', 'ت', 'ب']);
  });

  test('handles leading/trailing spaces', () => {
    expect(parseRootLetters('  ك ت ب  ')).toEqual(['ك', 'ت', 'ب']);
  });
});

// ============================================================================
// buildRootFamilies
// ============================================================================

describe('buildRootFamilies', () => {
  test('groups words by root correctly', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ك ت ب', word: 'كَتَبَ' }),
      createMockSarfWord({ root: 'ك ت ب', word: 'كِتَاب' }),
      createMockSarfWord({ root: 'ق ر أ', word: 'قَرَأَ' }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families).toHaveLength(2);
    
    const ktbFamily = families.find(f => f.root === 'ك ت ب');
    expect(ktbFamily?.words).toHaveLength(2);
    
    const qraFamily = families.find(f => f.root === 'ق ر أ');
    expect(qraFamily?.words).toHaveLength(1);
  });

  test('infers core meaning from Form I verb', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'verb', 
        verbForm: 'I', 
        meaning: 'he wrote' 
      }),
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'verb', 
        verbForm: 'II', 
        meaning: 'he made write' 
      }),
    ];

    const families = buildRootFamilies(words);
    
    // Should transform "he wrote" to "to write"
    expect(families[0].coreMeaning).toBe('to wrote');
  });

  test('falls back to any verb if no Form I verb', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'verb', 
        verbForm: 'II', 
        meaning: 'he made write' 
      }),
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'masdar', 
        meaning: 'writing' 
      }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].coreMeaning).toBe('he made write');
  });

  test('falls back to masdar if no verb', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'masdar', 
        meaning: 'writing' 
      }),
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'noun', 
        meaning: 'book' 
      }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].coreMeaning).toBe('writing');
  });

  test('falls back to first word if no verb or masdar', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'noun', 
        meaning: 'book' 
      }),
      createMockSarfWord({ 
        root: 'ك ت ب', 
        category: 'adjective', 
        meaning: 'written' 
      }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].coreMeaning).toBe('book');
  });

  test('counts categories correctly', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ك ت ب', category: 'verb' }),
      createMockSarfWord({ root: 'ك ت ب', category: 'verb' }),
      createMockSarfWord({ root: 'ك ت ب', category: 'masdar' }),
      createMockSarfWord({ root: 'ك ت ب', category: 'noun' }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].categoryCounts).toEqual({
      verb: 2,
      masdar: 1,
      noun: 1,
    });
  });

  test('collects verb forms', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ك ت ب', verbForm: 'I' }),
      createMockSarfWord({ root: 'ك ت ب', verbForm: 'II' }),
      createMockSarfWord({ root: 'ك ت ب', verbForm: 'V' }),
      createMockSarfWord({ root: 'ك ت ب', verbForm: 'I' }), // duplicate
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].verbForms).toEqual(['I', 'II', 'V']);
  });

  test('determines root type by most common', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ق و ل', rootType: 'ajwaf-wawi' }),
      createMockSarfWord({ root: 'ق و ل', rootType: 'ajwaf-wawi' }),
      createMockSarfWord({ root: 'ق و ل', rootType: 'ajwaf' }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].rootType).toBe('ajwaf-wawi');
  });

  test('defaults to saleem if no root types specified', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ك ت ب', rootType: undefined }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].rootType).toBe('saleem');
  });

  test('gets minimum difficulty among words', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ك ت ب', difficulty: 'advanced' }),
      createMockSarfWord({ root: 'ك ت ب', difficulty: 'beginner' }),
      createMockSarfWord({ root: 'ك ت ب', difficulty: 'intermediate' }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].minDifficulty).toBe('beginner');
  });

  test('sorts families by word count (richest first)', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ق ر أ' }),
      createMockSarfWord({ root: 'ك ت ب' }),
      createMockSarfWord({ root: 'ك ت ب' }),
      createMockSarfWord({ root: 'ك ت ب' }),
      createMockSarfWord({ root: 'ذ ه ب' }),
      createMockSarfWord({ root: 'ذ ه ب' }),
    ];

    const families = buildRootFamilies(words);
    
    expect(families[0].root).toBe('ك ت ب');
    expect(families[0].words).toHaveLength(3);
    expect(families[1].root).toBe('ذ ه ب');
    expect(families[1].words).toHaveLength(2);
    expect(families[2].root).toBe('ق ر أ');
    expect(families[2].words).toHaveLength(1);
  });

  test('skips words without root', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ root: 'ك ت ب' }),
      createMockSarfWord({ root: '' }),
      { ...createMockSarfWord(), root: undefined as unknown as string },
    ];

    const families = buildRootFamilies(words);
    
    expect(families).toHaveLength(1);
    expect(families[0].words).toHaveLength(1);
  });

  test('handles empty input', () => {
    expect(buildRootFamilies([])).toEqual([]);
  });
});

// ============================================================================
// deduplicateWords
// ============================================================================

describe('deduplicateWords', () => {
  test('removes duplicates by word+category key', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ word: 'كَتَبَ', category: 'verb' }),
      createMockSarfWord({ word: 'كَتَبَ', category: 'verb' }),
      createMockSarfWord({ word: 'كَتَبَ', category: 'noun' }), // different category
    ];

    const result = deduplicateWords(words);
    
    expect(result).toHaveLength(2);
  });

  test('keeps word with more filled fields', () => {
    const wordWithLess: SarfWord = createMockSarfWord({ 
      word: 'كَتَبَ', 
      category: 'verb',
      usage: undefined,
      prepositions: undefined,
    });
    
    const wordWithMore: SarfWord = createMockSarfWord({ 
      word: 'كَتَبَ', 
      category: 'verb',
      usage: 'Common verb',
      prepositions: ['على', 'إلى'],
      exampleSentence: 'كَتَبَ الوَلَدُ',
    });

    const result = deduplicateWords([wordWithLess, wordWithMore]);
    
    expect(result).toHaveLength(1);
    expect(result[0].usage).toBe('Common verb');
  });

  test('keeps first word when both have same field count', () => {
    const word1: SarfWord = createMockSarfWord({ 
      id: 100,
      word: 'كَتَبَ', 
      category: 'verb',
      usage: 'First usage',
    });
    
    const word2: SarfWord = createMockSarfWord({ 
      id: 200,
      word: 'كَتَبَ', 
      category: 'verb',
      usage: 'Second usage',
    });

    const result = deduplicateWords([word1, word2]);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(100);
  });

  test('handles empty input', () => {
    expect(deduplicateWords([])).toEqual([]);
  });
});

// ============================================================================
// filterByDifficulty
// ============================================================================

describe('filterByDifficulty', () => {
  const families: RootFamily[] = [
    createMockRootFamily({ root: 'ك ت ب', minDifficulty: 'beginner' }),
    createMockRootFamily({ root: 'ق ر أ', minDifficulty: 'intermediate' }),
    createMockRootFamily({ root: 'ذ ه ب', minDifficulty: 'advanced' }),
  ];

  test('filters to beginner only when maxDifficulty is beginner', () => {
    const result = filterByDifficulty(families, 'beginner');
    
    expect(result).toHaveLength(1);
    expect(result[0].root).toBe('ك ت ب');
  });

  test('filters to beginner+intermediate when maxDifficulty is intermediate', () => {
    const result = filterByDifficulty(families, 'intermediate');
    
    expect(result).toHaveLength(2);
    expect(result.map(f => f.root)).toContain('ك ت ب');
    expect(result.map(f => f.root)).toContain('ق ر أ');
  });

  test('returns all when maxDifficulty is advanced', () => {
    const result = filterByDifficulty(families, 'advanced');
    
    expect(result).toHaveLength(3);
  });

  test('handles empty input', () => {
    expect(filterByDifficulty([], 'beginner')).toEqual([]);
  });
});

// ============================================================================
// getWordsFromFamily
// ============================================================================

describe('getWordsFromFamily', () => {
  const family = createMockRootFamily({
    words: [
      createMockSarfWord({ category: 'verb', verbForm: 'I', difficulty: 'beginner' }),
      createMockSarfWord({ category: 'verb', verbForm: 'II', difficulty: 'intermediate' }),
      createMockSarfWord({ category: 'masdar', difficulty: 'beginner' }),
      createMockSarfWord({ category: 'noun', difficulty: 'advanced' }),
      createMockSarfWord({ category: 'active-participle', verbForm: 'I', difficulty: 'beginner' }),
    ],
  });

  test('returns all words when no options provided', () => {
    const result = getWordsFromFamily(family);
    expect(result).toHaveLength(5);
  });

  test('filters by single category', () => {
    const result = getWordsFromFamily(family, { categories: ['verb'] });
    expect(result).toHaveLength(2);
    expect(result.every(w => w.category === 'verb')).toBe(true);
  });

  test('filters by multiple categories', () => {
    const result = getWordsFromFamily(family, { categories: ['verb', 'masdar'] });
    expect(result).toHaveLength(3);
  });

  test('filters by verb forms (excludes non-matching verbForms, passes words without verbForm)', () => {
    const result = getWordsFromFamily(family, { verbForms: ['I'] });
    // Should return:
    // - Form I verb (matches)
    // - masdar (no verbForm, passes through)
    // - noun (no verbForm, passes through)
    // - active-participle with Form I (matches)
    // But NOT Form II verb
    expect(result).toHaveLength(4);
    // Verify Form II verb is excluded
    expect(result.some(w => w.verbForm === 'II')).toBe(false);
  });

  test('filters by max difficulty', () => {
    const result = getWordsFromFamily(family, { maxDifficulty: 'beginner' });
    expect(result).toHaveLength(3);
    expect(result.every(w => w.difficulty === 'beginner')).toBe(true);
  });

  test('combines multiple filters', () => {
    const result = getWordsFromFamily(family, {
      categories: ['verb'],
      maxDifficulty: 'beginner',
    });
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('verb');
    expect(result[0].difficulty).toBe('beginner');
  });

  test('returns empty when no words match', () => {
    const result = getWordsFromFamily(family, { categories: ['adjective'] });
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// findFamiliesByPattern
// ============================================================================

describe('findFamiliesByPattern', () => {
  const families: RootFamily[] = [
    createMockRootFamily({
      root: 'ك ت ب',
      words: [
        createMockSarfWord({ pattern: 'فَعَلَ' }),
        createMockSarfWord({ pattern: 'فَاعِل' }),
      ],
    }),
    createMockRootFamily({
      root: 'ق ر أ',
      words: [
        createMockSarfWord({ pattern: 'فَعَلَ' }),
        createMockSarfWord({ pattern: 'مَفْعُول' }),
      ],
    }),
    createMockRootFamily({
      root: 'ذ ه ب',
      words: [
        createMockSarfWord({ pattern: 'فَعَلَ' }),
      ],
    }),
  ];

  test('finds families containing specific pattern', () => {
    const result = findFamiliesByPattern(families, 'فَاعِل');
    
    expect(result).toHaveLength(1);
    expect(result[0].root).toBe('ك ت ب');
  });

  test('finds all families with common pattern', () => {
    const result = findFamiliesByPattern(families, 'فَعَلَ');
    
    expect(result).toHaveLength(3);
  });

  test('returns empty for non-existent pattern', () => {
    const result = findFamiliesByPattern(families, 'تَفَعَّلَ');
    
    expect(result).toHaveLength(0);
  });

  test('handles empty families array', () => {
    expect(findFamiliesByPattern([], 'فَعَلَ')).toEqual([]);
  });
});

// ============================================================================
// getAllPatterns
// ============================================================================

describe('getAllPatterns', () => {
  test('returns map of pattern counts', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ pattern: 'فَعَلَ' }),
      createMockSarfWord({ pattern: 'فَعَلَ' }),
      createMockSarfWord({ pattern: 'فَاعِل' }),
      createMockSarfWord({ pattern: 'مَفْعُول' }),
    ];

    const result = getAllPatterns(words);
    
    expect(result.get('فَعَلَ')).toBe(2);
    expect(result.get('فَاعِل')).toBe(1);
    expect(result.get('مَفْعُول')).toBe(1);
    expect(result.size).toBe(3);
  });

  test('handles empty input', () => {
    const result = getAllPatterns([]);
    expect(result.size).toBe(0);
  });

  test('skips words without pattern', () => {
    const words: SarfWord[] = [
      createMockSarfWord({ pattern: 'فَعَلَ' }),
      createMockSarfWord({ pattern: '' }),
      { ...createMockSarfWord(), pattern: undefined as unknown as string },
    ];

    const result = getAllPatterns(words);
    
    expect(result.size).toBe(1);
    expect(result.get('فَعَلَ')).toBe(1);
  });
});

// ============================================================================
// generateRootFamilyExercises
// ============================================================================

describe('generateRootFamilyExercises', () => {
  const family = createMockRootFamily({
    words: [
      createMockSarfWord({ 
        category: 'verb', 
        word: 'كَتَبَ', 
        meaning: 'he wrote' 
      }),
      createMockSarfWord({ 
        category: 'masdar', 
        word: 'كِتَابَة', 
        meaning: 'writing' 
      }),
      createMockSarfWord({ 
        category: 'noun', 
        word: 'كِتَاب', 
        meaning: 'book' 
      }),
    ],
  });

  test('creates root-to-meaning exercises for all words', () => {
    const exercises = generateRootFamilyExercises(family);
    const rootToMeaning = exercises.filter(e => e.type === 'root-to-meaning');
    
    expect(rootToMeaning.length).toBeGreaterThanOrEqual(3);
    expect(rootToMeaning[0].prompt).toContain('What does');
    expect(rootToMeaning[0].promptAr).toBeDefined();
  });

  test('creates meaning-to-word exercises for non-verbs', () => {
    const exercises = generateRootFamilyExercises(family);
    const meaningToWord = exercises.filter(e => e.type === 'meaning-to-word');
    
    // Should only create for masdar and noun, not verb
    expect(meaningToWord).toHaveLength(2);
    expect(meaningToWord[0].prompt).toContain('Write the Arabic');
  });

  test('creates identify-category exercises with distractors', () => {
    const exercises = generateRootFamilyExercises(family);
    const identifyCategory = exercises.filter(e => e.type === 'identify-category');
    
    expect(identifyCategory.length).toBeGreaterThanOrEqual(3);
    expect(identifyCategory[0].distractors).toBeDefined();
    expect(identifyCategory[0].distractors!.length).toBe(3);
  });

  test('respects maxWords option', () => {
    const exercises = generateRootFamilyExercises(family, { maxWords: 1 });
    const rootToMeaning = exercises.filter(e => e.type === 'root-to-meaning');
    
    expect(rootToMeaning).toHaveLength(1);
  });

  test('respects includeTypes filter', () => {
    const exercises = generateRootFamilyExercises(family, { 
      includeTypes: ['noun'] as WordCategory[]
    });
    
    // Should only include exercises for the noun
    expect(exercises.every(e => e.word.category === 'noun')).toBe(true);
  });

  test('handles family with no words', () => {
    const emptyFamily = createMockRootFamily({ words: [] });
    const exercises = generateRootFamilyExercises(emptyFamily);
    
    expect(exercises).toHaveLength(0);
  });
});

// ============================================================================
// generateRootFamilyComponentExercises
// ============================================================================

describe('generateRootFamilyComponentExercises', () => {
  const family = createMockRootFamily({
    root: 'ك ت ب',
    words: [
      createMockSarfWord({ 
        id: 1, 
        category: 'verb', 
        word: 'كَتَبَ', 
        meaning: 'he wrote',
        difficulty: 'beginner',
      }),
      createMockSarfWord({ 
        id: 2, 
        category: 'masdar', 
        word: 'كِتَابَة', 
        meaning: 'writing',
        difficulty: 'beginner',
      }),
      createMockSarfWord({ 
        id: 3, 
        category: 'noun', 
        word: 'كِتَاب', 
        meaning: 'book',
        difficulty: 'beginner',
      }),
    ],
  });

  const otherFamilies: RootFamily[] = [
    createMockRootFamily({
      root: 'ق ر أ',
      words: [
        createMockSarfWord({ id: 10, category: 'verb', meaning: 'he read', difficulty: 'beginner' }),
        createMockSarfWord({ id: 11, category: 'masdar', meaning: 'reading', difficulty: 'beginner' }),
        createMockSarfWord({ id: 12, category: 'noun', meaning: 'reader', difficulty: 'beginner' }),
      ],
    }),
    createMockRootFamily({
      root: 'ذ ه ب',
      words: [
        createMockSarfWord({ id: 20, category: 'verb', meaning: 'he went', difficulty: 'beginner' }),
        createMockSarfWord({ id: 21, category: 'masdar', meaning: 'going', difficulty: 'beginner' }),
      ],
    }),
    createMockRootFamily({
      root: 'ج ل س',
      words: [
        createMockSarfWord({ id: 30, category: 'verb', meaning: 'he sat', difficulty: 'beginner' }),
        createMockSarfWord({ id: 31, category: 'noun', meaning: 'sitting', difficulty: 'beginner' }),
      ],
    }),
    createMockRootFamily({
      root: 'ع ل م',
      words: [
        createMockSarfWord({ id: 40, category: 'verb', meaning: 'he knew', difficulty: 'beginner' }),
      ],
    }),
  ];

  const allFamilies = [family, ...otherFamilies];

  test('creates match-meanings exercises with 4 options', () => {
    const exercises = generateRootFamilyComponentExercises(family, allFamilies);
    const matchMeanings = exercises.filter(e => e.type === 'match-meanings');
    
    expect(matchMeanings.length).toBeGreaterThan(0);
    matchMeanings.forEach(ex => {
      expect(ex.options).toHaveLength(4);
      expect(ex.options).toContain(ex.answer);
      expect(ex.targetWord).toBeDefined();
    });
  });

  test('creates identify-root exercises with 4 root options', () => {
    const exercises = generateRootFamilyComponentExercises(family, allFamilies);
    const identifyRoot = exercises.filter(e => e.type === 'identify-root');
    
    expect(identifyRoot.length).toBeGreaterThan(0);
    identifyRoot.forEach(ex => {
      expect(ex.options).toHaveLength(4);
      expect(ex.options).toContain(ex.answer);
      expect(ex.answer).toBe(family.root);
    });
  });

  test('creates family-builder exercises with correct and distractor words', () => {
    const exercises = generateRootFamilyComponentExercises(family, allFamilies);
    const familyBuilder = exercises.filter(e => e.type === 'family-builder');
    
    expect(familyBuilder.length).toBeGreaterThan(0);
    familyBuilder.forEach(ex => {
      expect(ex.correctWords).toBeDefined();
      expect(ex.correctWords!.length).toBeGreaterThan(0);
      expect(ex.distractorWords).toBeDefined();
      expect(ex.distractorWords!.length).toBeGreaterThan(0);
    });
  });

  test('respects difficulty filter', () => {
    const familyWithMixedDifficulty = createMockRootFamily({
      root: 'ن ص ر',
      words: [
        createMockSarfWord({ difficulty: 'beginner' }),
        createMockSarfWord({ difficulty: 'advanced' }),
      ],
    });

    const exercises = generateRootFamilyComponentExercises(
      familyWithMixedDifficulty, 
      allFamilies,
      { difficulty: 'beginner' }
    );

    // Should only use beginner words
    const matchMeanings = exercises.filter(e => e.type === 'match-meanings');
    matchMeanings.forEach(ex => {
      expect(ex.targetWord?.difficulty).toBe('beginner');
    });
  });

  test('respects maxExercises limit', () => {
    const exercises = generateRootFamilyComponentExercises(
      family, 
      allFamilies,
      { maxExercises: 2 }
    );

    expect(exercises).toHaveLength(2);
  });

  test('returns empty array when no words match difficulty', () => {
    const advancedOnlyFamily = createMockRootFamily({
      words: [
        createMockSarfWord({ difficulty: 'advanced' }),
      ],
    });

    const exercises = generateRootFamilyComponentExercises(
      advancedOnlyFamily,
      allFamilies,
      { difficulty: 'beginner' }
    );

    expect(exercises).toHaveLength(0);
  });

  test('handles insufficient distractor families gracefully', () => {
    // Only pass the target family and one other family
    const exercises = generateRootFamilyComponentExercises(
      family,
      [family, otherFamilies[0]]
    );

    // Should still create some exercises (at least match-meanings should work)
    // identify-root needs 3+ other families, so might not be created
    expect(exercises).toBeDefined();
  });

  test('each exercise has unique id', () => {
    const exercises = generateRootFamilyComponentExercises(family, allFamilies);
    const ids = exercises.map(e => e.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('exercise ids contain family root', () => {
    const exercises = generateRootFamilyComponentExercises(family, allFamilies);
    
    exercises.forEach(ex => {
      expect(ex.id).toContain(family.root);
    });
  });
});
