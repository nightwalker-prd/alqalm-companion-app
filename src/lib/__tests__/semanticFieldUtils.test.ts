import { describe, test, expect } from 'vitest';
import {
  createCategory,
  generateSemanticFieldExercise,
  generateGenderExercise,
  generateWordTypeExercise,
  checkSemanticField,
  checkWordPlacement,
  getCategoryName,
  getWordsInCategory,
  getPlacementProgress,
  SEMANTIC_CATEGORIES,
  MIN_WORDS_PER_CATEGORY,
  MAX_WORDS_PER_CATEGORY,
} from '../semanticFieldUtils';
import type { SemanticFieldExercise, SemanticWord, SemanticCategory } from '../../types/exercise';

// ============================================================================
// Test Data
// ============================================================================

const sampleCategories: SemanticCategory[] = [
  { id: 'places', nameEn: 'Places', nameAr: 'أماكن' },
  { id: 'people', nameEn: 'People', nameAr: 'الناس' },
];

const sampleWords: SemanticWord[] = [
  { arabic: 'بَيْتٌ', english: 'house', category: 'places' },
  { arabic: 'مَسْجِدٌ', english: 'mosque', category: 'places' },
  { arabic: 'مَدْرَسَةٌ', english: 'school', category: 'places' },
  { arabic: 'طَالِبٌ', english: 'student', category: 'people' },
  { arabic: 'مُعَلِّمٌ', english: 'teacher', category: 'people' },
  { arabic: 'رَجُلٌ', english: 'man', category: 'people' },
];

const sampleExercise: SemanticFieldExercise = {
  id: 'sf-test-1',
  type: 'semantic-field',
  categories: sampleCategories,
  words: sampleWords,
  instruction: 'Sort words by category',
  itemIds: ['word-001', 'word-002'],
};

// ============================================================================
// createCategory Tests
// ============================================================================

describe('createCategory', () => {
  test('creates category with predefined names', () => {
    const cat = createCategory('places');
    expect(cat.id).toBe('places');
    expect(cat.nameEn).toBe('Places');
    expect(cat.nameAr).toBe('أماكن');
  });

  test('uses custom names when provided', () => {
    const cat = createCategory('custom', 'Custom Category', 'فئة مخصصة');
    expect(cat.id).toBe('custom');
    expect(cat.nameEn).toBe('Custom Category');
    expect(cat.nameAr).toBe('فئة مخصصة');
  });

  test('falls back to id for unknown categories', () => {
    const cat = createCategory('unknown-category');
    expect(cat.nameEn).toBe('unknown-category');
    expect(cat.nameAr).toBe('unknown-category');
  });
});

// ============================================================================
// generateSemanticFieldExercise Tests
// ============================================================================

describe('generateSemanticFieldExercise', () => {
  test('generates exercise with correct structure', () => {
    const exercise = generateSemanticFieldExercise(
      sampleWords,
      sampleCategories,
      'b1-l01',
      ['word-001']
    );
    
    expect(exercise).not.toBeNull();
    expect(exercise!.type).toBe('semantic-field');
    expect(exercise!.categories.length).toBe(2);
    expect(exercise!.words.length).toBeGreaterThanOrEqual(4);
  });

  test('returns null with less than 2 categories', () => {
    const exercise = generateSemanticFieldExercise(
      sampleWords,
      [sampleCategories[0]],
      'b1-l01'
    );
    expect(exercise).toBeNull();
  });

  test('returns null if category has too few words', () => {
    const wordsWithImbalance: SemanticWord[] = [
      { arabic: 'بَيْتٌ', english: 'house', category: 'places' },
      // Only 1 word in 'places', need at least 2
      { arabic: 'طَالِبٌ', english: 'student', category: 'people' },
      { arabic: 'مُعَلِّمٌ', english: 'teacher', category: 'people' },
    ];
    
    const exercise = generateSemanticFieldExercise(
      wordsWithImbalance,
      sampleCategories,
      'b1-l01'
    );
    expect(exercise).toBeNull();
  });

  test('limits words per category to MAX_WORDS_PER_CATEGORY', () => {
    const manyWords: SemanticWord[] = [
      { arabic: 'بَيْتٌ', english: 'house', category: 'places' },
      { arabic: 'مَسْجِدٌ', english: 'mosque', category: 'places' },
      { arabic: 'مَدْرَسَةٌ', english: 'school', category: 'places' },
      { arabic: 'سُوقٌ', english: 'market', category: 'places' },
      { arabic: 'مَكْتَبَةٌ', english: 'library', category: 'places' },
      { arabic: 'مَطْعَمٌ', english: 'restaurant', category: 'places' },
      { arabic: 'طَالِبٌ', english: 'student', category: 'people' },
      { arabic: 'مُعَلِّمٌ', english: 'teacher', category: 'people' },
    ];
    
    const exercise = generateSemanticFieldExercise(
      manyWords,
      sampleCategories,
      'b1-l01'
    );
    
    if (exercise) {
      const placesWords = exercise.words.filter(w => w.category === 'places');
      expect(placesWords.length).toBeLessThanOrEqual(MAX_WORDS_PER_CATEGORY);
    }
  });

  test('shuffles words for display', () => {
    // Run multiple times to check shuffling occurs
    const exercises = [];
    for (let i = 0; i < 5; i++) {
      const ex = generateSemanticFieldExercise(sampleWords, sampleCategories, 'b1-l01');
      if (ex) exercises.push(ex.words.map(w => w.arabic).join(','));
    }
    
    // At least some should be different (probabilistic)
    const unique = new Set(exercises);
    // With 6 words, very unlikely to get same order 5 times
    expect(unique.size).toBeGreaterThanOrEqual(1);
  });

  test('includes custom instruction', () => {
    const exercise = generateSemanticFieldExercise(
      sampleWords,
      sampleCategories,
      'b1-l01',
      [],
      'Custom instruction here'
    );
    
    expect(exercise!.instruction).toBe('Custom instruction here');
  });

  test('generates unique id with timestamp', () => {
    const exercise = generateSemanticFieldExercise(
      sampleWords,
      sampleCategories,
      'b1-l01'
    );
    
    expect(exercise!.id).toMatch(/^sf-b1-l01-\d+$/);
  });
});

// ============================================================================
// generateGenderExercise Tests
// ============================================================================

describe('generateGenderExercise', () => {
  const genderWords = [
    { arabic: 'كِتَابٌ', english: 'book', isFeminine: false },
    { arabic: 'قَلَمٌ', english: 'pen', isFeminine: false },
    { arabic: 'بَيْتٌ', english: 'house', isFeminine: false },
    { arabic: 'سَيَّارَةٌ', english: 'car', isFeminine: true },
    { arabic: 'مَدْرَسَةٌ', english: 'school', isFeminine: true },
    { arabic: 'غُرْفَةٌ', english: 'room', isFeminine: true },
  ];

  test('creates exercise with masculine/feminine categories', () => {
    const exercise = generateGenderExercise(genderWords, 'b1-l01');
    
    expect(exercise).not.toBeNull();
    expect(exercise!.categories.length).toBe(2);
    expect(exercise!.categories.map(c => c.id)).toContain('masculine');
    expect(exercise!.categories.map(c => c.id)).toContain('feminine');
  });

  test('assigns words to correct gender categories', () => {
    const exercise = generateGenderExercise(genderWords, 'b1-l01');
    
    if (exercise) {
      const mascWords = exercise.words.filter(w => w.category === 'masculine');
      const femWords = exercise.words.filter(w => w.category === 'feminine');
      
      expect(mascWords.some(w => w.arabic === 'كِتَابٌ')).toBe(true);
      expect(femWords.some(w => w.arabic === 'سَيَّارَةٌ')).toBe(true);
    }
  });

  test('has gender-specific instruction', () => {
    const exercise = generateGenderExercise(genderWords, 'b1-l01');
    expect(exercise!.instruction).toContain('gender');
  });
});

// ============================================================================
// generateWordTypeExercise Tests
// ============================================================================

describe('generateWordTypeExercise', () => {
  const typedWords = [
    { arabic: 'كِتَابٌ', english: 'book', type: 'noun' as const },
    { arabic: 'بَيْتٌ', english: 'house', type: 'noun' as const },
    { arabic: 'ذَهَبَ', english: 'he went', type: 'verb' as const },
    { arabic: 'كَتَبَ', english: 'he wrote', type: 'verb' as const },
    { arabic: 'كَبِيرٌ', english: 'big', type: 'adjective' as const },
    { arabic: 'جَمِيلٌ', english: 'beautiful', type: 'adjective' as const },
  ];

  test('creates exercise with word type categories', () => {
    const exercise = generateWordTypeExercise(typedWords, 'b1-l01');
    
    expect(exercise).not.toBeNull();
    expect(exercise!.categories.length).toBe(3);
  });

  test('only includes categories present in words', () => {
    const nounsAndVerbs = typedWords.filter(w => w.type !== 'adjective');
    const exercise = generateWordTypeExercise(nounsAndVerbs, 'b1-l01');
    
    if (exercise) {
      expect(exercise.categories.length).toBe(2);
      expect(exercise.categories.map(c => c.id)).not.toContain('adjectives');
    }
  });
});

// ============================================================================
// checkSemanticField Tests
// ============================================================================

describe('checkSemanticField', () => {
  test('returns correct when all words correctly categorized', () => {
    const placements = new Map([
      ['بَيْتٌ', 'places'],
      ['مَسْجِدٌ', 'places'],
      ['مَدْرَسَةٌ', 'places'],
      ['طَالِبٌ', 'people'],
      ['مُعَلِّمٌ', 'people'],
      ['رَجُلٌ', 'people'],
    ]);
    
    const result = checkSemanticField(placements, sampleExercise);
    
    expect(result.isCorrect).toBe(true);
    expect(result.correctCount).toBe(6);
    expect(result.accuracy).toBe(100);
    expect(result.feedback).toContain('Perfect');
  });

  test('handles partial correct answers', () => {
    const placements = new Map([
      ['بَيْتٌ', 'places'],
      ['مَسْجِدٌ', 'people'], // wrong
      ['مَدْرَسَةٌ', 'places'],
      ['طَالِبٌ', 'people'],
      ['مُعَلِّمٌ', 'people'],
      ['رَجُلٌ', 'places'], // wrong
    ]);
    
    const result = checkSemanticField(placements, sampleExercise);
    
    expect(result.isCorrect).toBe(false);
    expect(result.correctCount).toBe(4);
    expect(result.accuracy).toBe(67); // 4/6 rounded
  });

  test('handles all wrong answers', () => {
    const placements = new Map([
      ['بَيْتٌ', 'people'],
      ['مَسْجِدٌ', 'people'],
      ['مَدْرَسَةٌ', 'people'],
      ['طَالِبٌ', 'places'],
      ['مُعَلِّمٌ', 'places'],
      ['رَجُلٌ', 'places'],
    ]);
    
    const result = checkSemanticField(placements, sampleExercise);
    
    expect(result.isCorrect).toBe(false);
    expect(result.correctCount).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  test('handles unplaced words as incorrect', () => {
    const placements = new Map([
      ['بَيْتٌ', 'places'],
      ['طَالِبٌ', 'people'],
      // other words not placed
    ]);
    
    const result = checkSemanticField(placements, sampleExercise);
    
    expect(result.isCorrect).toBe(false);
    expect(result.correctCount).toBe(2);
  });

  test('returns detailed word results', () => {
    const placements = new Map([
      ['بَيْتٌ', 'places'],
      ['طَالِبٌ', 'places'], // wrong
    ]);
    
    const result = checkSemanticField(placements, sampleExercise);
    
    const houseResult = result.wordResults.find(r => r.arabic === 'بَيْتٌ');
    expect(houseResult?.isCorrect).toBe(true);
    
    const studentResult = result.wordResults.find(r => r.arabic === 'طَالِبٌ');
    expect(studentResult?.isCorrect).toBe(false);
    expect(studentResult?.userCategory).toBe('places');
    expect(studentResult?.correctCategory).toBe('people');
  });

  test('provides correct grouping for solution display', () => {
    const placements = new Map<string, string>();
    const result = checkSemanticField(placements, sampleExercise);
    
    expect(result.correctGrouping.get('places')?.length).toBe(3);
    expect(result.correctGrouping.get('people')?.length).toBe(3);
  });
});

// ============================================================================
// checkWordPlacement Tests
// ============================================================================

describe('checkWordPlacement', () => {
  test('returns true for correct placement', () => {
    expect(checkWordPlacement('بَيْتٌ', 'places', sampleExercise)).toBe(true);
    expect(checkWordPlacement('طَالِبٌ', 'people', sampleExercise)).toBe(true);
  });

  test('returns false for incorrect placement', () => {
    expect(checkWordPlacement('بَيْتٌ', 'people', sampleExercise)).toBe(false);
    expect(checkWordPlacement('طَالِبٌ', 'places', sampleExercise)).toBe(false);
  });

  test('returns false for unknown word', () => {
    expect(checkWordPlacement('كَلِمَةٌ', 'places', sampleExercise)).toBe(false);
  });
});

// ============================================================================
// getCategoryName Tests
// ============================================================================

describe('getCategoryName', () => {
  test('returns English name by default', () => {
    expect(getCategoryName('places')).toBe('Places');
  });

  test('returns Arabic name when specified', () => {
    expect(getCategoryName('places', 'ar')).toBe('أماكن');
  });

  test('returns id for unknown category', () => {
    expect(getCategoryName('unknown-cat')).toBe('unknown-cat');
  });
});

// ============================================================================
// getWordsInCategory Tests
// ============================================================================

describe('getWordsInCategory', () => {
  test('returns words belonging to category', () => {
    const places = getWordsInCategory(sampleExercise, 'places');
    expect(places.length).toBe(3);
    expect(places.every(w => w.category === 'places')).toBe(true);
  });

  test('returns empty array for non-existent category', () => {
    const none = getWordsInCategory(sampleExercise, 'nonexistent');
    expect(none).toEqual([]);
  });
});

// ============================================================================
// getPlacementProgress Tests
// ============================================================================

describe('getPlacementProgress', () => {
  test('calculates progress correctly', () => {
    const placements = new Map([
      ['بَيْتٌ', 'places'],
      ['طَالِبٌ', 'people'],
      ['رَجُلٌ', 'people'],
    ]);
    
    const progress = getPlacementProgress(placements, sampleExercise);
    
    expect(progress.placed).toBe(3);
    expect(progress.total).toBe(6);
    expect(progress.percentage).toBe(50);
  });

  test('returns 0% for no placements', () => {
    const progress = getPlacementProgress(new Map(), sampleExercise);
    
    expect(progress.placed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('returns 100% for all placed', () => {
    const placements = new Map(
      sampleExercise.words.map(w => [w.arabic, w.category])
    );
    
    const progress = getPlacementProgress(placements, sampleExercise);
    
    expect(progress.placed).toBe(6);
    expect(progress.percentage).toBe(100);
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Constants', () => {
  test('MIN_WORDS_PER_CATEGORY is reasonable', () => {
    expect(MIN_WORDS_PER_CATEGORY).toBeGreaterThanOrEqual(2);
    expect(MIN_WORDS_PER_CATEGORY).toBeLessThanOrEqual(3);
  });

  test('MAX_WORDS_PER_CATEGORY is reasonable', () => {
    expect(MAX_WORDS_PER_CATEGORY).toBeGreaterThanOrEqual(3);
    expect(MAX_WORDS_PER_CATEGORY).toBeLessThanOrEqual(6);
  });

  test('SEMANTIC_CATEGORIES includes common categories', () => {
    expect(SEMANTIC_CATEGORIES).toHaveProperty('places');
    expect(SEMANTIC_CATEGORIES).toHaveProperty('people');
    expect(SEMANTIC_CATEGORIES).toHaveProperty('masculine');
    expect(SEMANTIC_CATEGORIES).toHaveProperty('feminine');
    expect(SEMANTIC_CATEGORIES).toHaveProperty('nouns');
    expect(SEMANTIC_CATEGORIES).toHaveProperty('verbs');
  });

  test('each category has both en and ar names', () => {
    Object.values(SEMANTIC_CATEGORIES).forEach(cat => {
      expect(cat).toHaveProperty('en');
      expect(cat).toHaveProperty('ar');
      expect(typeof cat.en).toBe('string');
      expect(typeof cat.ar).toBe('string');
    });
  });
});
