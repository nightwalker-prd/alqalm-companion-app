import { describe, test, expect } from 'vitest';
import {
  detectCollocationType,
  extractCollocationsFromExercises,
  generateCompleteCollocationExercise,
  generateTranslateCollocationExercise,
  generateChooseCollocationExercise,
  generateCollocationExercises,
  checkCollocationAnswer,
  calculateCollocationStrength,
  updateCollocationMastery,
  selectCollocationsForPractice,
  getCollocationsForWord,
  getCollocationsForLesson,
  getCollocationTypeDescription,
  getCollocationTypeDescriptionArabic,
  COLLOCATION_STRENGTH_CHANGES,
  MIN_WORD_STRENGTH_FOR_COLLOCATION,
  DEFAULT_COLLOCATION_MASTERY,
} from '../collocationUtils';
import type { Collocation, CollocationMastery } from '../../types/collocation';

// ============================================================================
// Test Data
// ============================================================================

const sampleCollocations: Collocation[] = [
  {
    id: 'coll-1',
    type: 'demonstrative_noun',
    arabic: 'هَذَا كِتَابٌ',
    english: 'this is a book',
    wordIds: ['word-001', 'word-002'],
    lessonId: 'b1-l01',
  },
  {
    id: 'coll-2',
    type: 'noun_adjective',
    arabic: 'بَيْتٌ كَبِيرٌ',
    english: 'a big house',
    wordIds: ['word-003', 'word-004'],
    lessonId: 'b1-l01',
  },
  {
    id: 'coll-3',
    type: 'preposition_noun',
    arabic: 'فِي البَيْتِ',
    english: 'in the house',
    wordIds: ['word-005', 'word-003'],
    lessonId: 'b1-l02',
  },
  {
    id: 'coll-4',
    type: 'question_answer',
    arabic: 'مَا هَذَا',
    english: 'what is this?',
    wordIds: ['word-006', 'word-001'],
    lessonId: 'b1-l01',
  },
];

// ============================================================================
// detectCollocationType Tests
// ============================================================================

describe('detectCollocationType', () => {
  test('detects demonstrative_noun pattern with هَذَا', () => {
    expect(detectCollocationType('هَذَا كِتَابٌ')).toBe('demonstrative_noun');
  });

  test('detects demonstrative_noun pattern with هَذِهِ', () => {
    expect(detectCollocationType('هَذِهِ سَيَّارَةٌ')).toBe('demonstrative_noun');
  });

  test('detects demonstrative_noun pattern with ذَلِكَ', () => {
    expect(detectCollocationType('ذَلِكَ قَلَمٌ')).toBe('demonstrative_noun');
  });

  test('detects preposition_noun pattern with فِي', () => {
    expect(detectCollocationType('فِي البَيْتِ')).toBe('preposition_noun');
  });

  test('detects preposition_noun pattern with مِنْ', () => {
    expect(detectCollocationType('مِنْ المَدْرَسَةِ')).toBe('preposition_noun');
  });

  test('detects preposition_noun pattern with إِلَى', () => {
    expect(detectCollocationType('إِلَى المَسْجِدِ')).toBe('preposition_noun');
  });

  test('detects question_answer pattern with مَا', () => {
    expect(detectCollocationType('مَا هَذَا')).toBe('question_answer');
  });

  test('detects question_answer pattern with مَنْ', () => {
    expect(detectCollocationType('مَنْ هَذَا')).toBe('question_answer');
  });

  test('detects question_answer pattern with أَيْنَ', () => {
    expect(detectCollocationType('أَيْنَ البَيْتُ')).toBe('question_answer');
  });

  test('defaults to noun_adjective for 2-word phrases', () => {
    expect(detectCollocationType('بَيْتٌ كَبِيرٌ')).toBe('noun_adjective');
  });

  test('returns null for single word', () => {
    expect(detectCollocationType('كِتَابٌ')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(detectCollocationType('')).toBeNull();
  });
});

// ============================================================================
// extractCollocationsFromExercises Tests
// ============================================================================

describe('extractCollocationsFromExercises', () => {
  test('extracts collocations from multi-word answers', () => {
    const exercises = [
      { id: 'ex-1', answer: 'هَذَا كِتَابٌ', itemIds: ['word-001', 'word-002'] },
      { id: 'ex-2', answer: 'بَيْتٌ كَبِيرٌ', itemIds: ['word-003', 'word-004'] },
    ];

    const collocations = extractCollocationsFromExercises(exercises, 'b1-l01');

    expect(collocations).toHaveLength(2);
    expect(collocations[0].type).toBe('demonstrative_noun');
    expect(collocations[1].type).toBe('noun_adjective');
  });

  test('skips single-word answers', () => {
    const exercises = [
      { id: 'ex-1', answer: 'كِتَابٌ', itemIds: ['word-002'] },
    ];

    const collocations = extractCollocationsFromExercises(exercises, 'b1-l01');
    expect(collocations).toHaveLength(0);
  });

  test('skips answers with more than 4 words', () => {
    const exercises = [
      { id: 'ex-1', answer: 'هَذَا كِتَابٌ كَبِيرٌ جِدًّا جَمِيلٌ', itemIds: ['w1', 'w2', 'w3', 'w4', 'w5'] },
    ];

    const collocations = extractCollocationsFromExercises(exercises, 'b1-l01');
    expect(collocations).toHaveLength(0);
  });

  test('deduplicates identical phrases', () => {
    const exercises = [
      { id: 'ex-1', answer: 'هَذَا كِتَابٌ', itemIds: ['word-001', 'word-002'] },
      { id: 'ex-2', answer: 'هَذَا كِتَابٌ', itemIds: ['word-001', 'word-002'] },
    ];

    const collocations = extractCollocationsFromExercises(exercises, 'b1-l01');
    expect(collocations).toHaveLength(1);
  });

  test('assigns correct lesson ID and unique IDs', () => {
    const exercises = [
      { id: 'ex-1', answer: 'هَذَا كِتَابٌ', itemIds: ['word-001', 'word-002'] },
      { id: 'ex-2', answer: 'فِي البَيْتِ', itemIds: ['word-005', 'word-003'] },
    ];

    const collocations = extractCollocationsFromExercises(exercises, 'b1-l05');

    expect(collocations[0].lessonId).toBe('b1-l05');
    expect(collocations[0].id).toBe('coll-b1-l05-1');
    expect(collocations[1].id).toBe('coll-b1-l05-2');
  });
});

// ============================================================================
// generateCompleteCollocationExercise Tests
// ============================================================================

describe('generateCompleteCollocationExercise', () => {
  const collocation = sampleCollocations[0]; // هَذَا كِتَابٌ

  test('hides last word by default', () => {
    const exercise = generateCompleteCollocationExercise(collocation);

    expect(exercise.type).toBe('complete_collocation');
    expect(exercise.prompt).toBe('هَذَا ___');
    expect(exercise.answer).toBe('كِتَابٌ');
  });

  test('hides first word when hideFirst is true', () => {
    const exercise = generateCompleteCollocationExercise(collocation, true);

    expect(exercise.prompt).toBe('___ كِتَابٌ');
    expect(exercise.answer).toBe('هَذَا');
  });

  test('includes collocation ID in exercise ID', () => {
    const exercise = generateCompleteCollocationExercise(collocation, false);
    expect(exercise.id).toContain(collocation.id);
    expect(exercise.id).toContain('last');
  });

  test('includes English translation as promptEn', () => {
    const exercise = generateCompleteCollocationExercise(collocation);
    expect(exercise.promptEn).toBe('this is a book');
  });

  test('references correct collocation ID', () => {
    const exercise = generateCompleteCollocationExercise(collocation);
    expect(exercise.collocationId).toBe(collocation.id);
  });
});

// ============================================================================
// generateTranslateCollocationExercise Tests
// ============================================================================

describe('generateTranslateCollocationExercise', () => {
  test('creates translation exercise', () => {
    const collocation = sampleCollocations[0];
    const exercise = generateTranslateCollocationExercise(collocation);

    expect(exercise.type).toBe('translate_collocation');
    expect(exercise.prompt).toBe('this is a book');
    expect(exercise.answer).toBe('هَذَا كِتَابٌ');
    expect(exercise.collocationId).toBe(collocation.id);
  });
});

// ============================================================================
// generateChooseCollocationExercise Tests
// ============================================================================

describe('generateChooseCollocationExercise', () => {
  const collocation = sampleCollocations[0]; // هَذَا كِتَابٌ
  const distractors = ['قَلَمٌ', 'بَابٌ', 'سَيَّارَةٌ'];

  test('creates MCQ exercise with options', () => {
    const exercise = generateChooseCollocationExercise(collocation, distractors);

    expect(exercise.type).toBe('choose_collocation');
    expect(exercise.options).toBeDefined();
    expect(exercise.options).toHaveLength(4);
    expect(exercise.options).toContain('كِتَابٌ');
  });

  test('includes correct answer in options', () => {
    const exercise = generateChooseCollocationExercise(collocation, distractors);
    expect(exercise.options).toContain(exercise.answer);
  });

  test('shuffles options (not always in same order)', () => {
    // Run multiple times to check randomization works
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const exercise = generateChooseCollocationExercise(collocation, distractors);
      results.add(JSON.stringify(exercise.options));
    }
    // Should have at least 2 different orderings (very likely with Fisher-Yates)
    expect(results.size).toBeGreaterThan(1);
  });

  test('throws error for single-word collocation', () => {
    const invalidCollocation: Collocation = {
      ...collocation,
      arabic: 'كِتَابٌ',
    };
    expect(() =>
      generateChooseCollocationExercise(invalidCollocation, distractors)
    ).toThrow('Collocation must have at least 2 words');
  });
});

// ============================================================================
// generateCollocationExercises Tests
// ============================================================================

describe('generateCollocationExercises', () => {
  test('generates multiple exercise types without distractors', () => {
    const collocation = sampleCollocations[0];
    const exercises = generateCollocationExercises(collocation);

    // Should have: complete (hide last), complete (hide first), translate
    expect(exercises.length).toBeGreaterThanOrEqual(2);
    expect(exercises.some(e => e.type === 'complete_collocation')).toBe(true);
  });

  test('generates MCQ when distractors provided', () => {
    const collocation = sampleCollocations[0];
    const distractors = ['قَلَمٌ', 'بَابٌ', 'سَيَّارَةٌ'];
    const exercises = generateCollocationExercises(collocation, distractors);

    expect(exercises.some(e => e.type === 'choose_collocation')).toBe(true);
  });

  test('includes translate exercise when English is provided', () => {
    const collocation = sampleCollocations[0];
    const exercises = generateCollocationExercises(collocation);

    expect(exercises.some(e => e.type === 'translate_collocation')).toBe(true);
  });

  test('skips translate exercise when no English', () => {
    const collocation: Collocation = {
      ...sampleCollocations[0],
      english: '',
    };
    const exercises = generateCollocationExercises(collocation);

    expect(exercises.some(e => e.type === 'translate_collocation')).toBe(false);
  });
});

// ============================================================================
// checkCollocationAnswer Tests
// ============================================================================

describe('checkCollocationAnswer', () => {
  test('returns correct for exact match', () => {
    const result = checkCollocationAnswer('هَذَا كِتَابٌ', 'هَذَا كِتَابٌ');
    expect(result.isCorrect).toBe(true);
  });

  test('returns correct ignoring tashkeel differences', () => {
    const result = checkCollocationAnswer('هذا كتاب', 'هَذَا كِتَابٌ');
    expect(result.isCorrect).toBe(true);
  });

  test('returns incorrect for wrong answer', () => {
    const result = checkCollocationAnswer('هَذَا قَلَمٌ', 'هَذَا كِتَابٌ');
    expect(result.isCorrect).toBe(false);
  });

  test('detects word order errors', () => {
    const result = checkCollocationAnswer('كِتَابٌ هَذَا', 'هَذَا كِتَابٌ');
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toContain('order');
  });

  test('provides partial match feedback', () => {
    const result = checkCollocationAnswer('هَذَا قَلَمٌ', 'هَذَا كِتَابٌ كَبِيرٌ');
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toContain('1');
    expect(result.feedback).toContain('3');
  });

  test('handles empty input', () => {
    const result = checkCollocationAnswer('', 'هَذَا كِتَابٌ');
    expect(result.isCorrect).toBe(false);
  });
});

// ============================================================================
// calculateCollocationStrength Tests
// ============================================================================

describe('calculateCollocationStrength', () => {
  test('increases strength on correct answer', () => {
    const newStrength = calculateCollocationStrength(50, true);
    expect(newStrength).toBe(50 + COLLOCATION_STRENGTH_CHANGES.correct);
  });

  test('decreases strength on incorrect answer', () => {
    const newStrength = calculateCollocationStrength(50, false);
    expect(newStrength).toBe(50 + COLLOCATION_STRENGTH_CHANGES.incorrect);
  });

  test('caps strength at 100', () => {
    const newStrength = calculateCollocationStrength(95, true);
    expect(newStrength).toBe(100);
  });

  test('floors strength at 0', () => {
    const newStrength = calculateCollocationStrength(5, false);
    expect(newStrength).toBe(0);
  });
});

// ============================================================================
// updateCollocationMastery Tests
// ============================================================================

describe('updateCollocationMastery', () => {
  const baseMastery: CollocationMastery = {
    collocationId: 'coll-1',
    strength: 50,
    lastPracticed: null,
    timesCorrect: 5,
    timesIncorrect: 2,
    canProduce: false,
  };

  test('updates strength correctly on correct answer', () => {
    const updated = updateCollocationMastery(baseMastery, true, false);
    expect(updated.strength).toBe(50 + COLLOCATION_STRENGTH_CHANGES.correct);
  });

  test('updates strength correctly on incorrect answer', () => {
    const updated = updateCollocationMastery(baseMastery, false, false);
    expect(updated.strength).toBe(50 + COLLOCATION_STRENGTH_CHANGES.incorrect);
  });

  test('increments timesCorrect on correct answer', () => {
    const updated = updateCollocationMastery(baseMastery, true, false);
    expect(updated.timesCorrect).toBe(6);
    expect(updated.timesIncorrect).toBe(2);
  });

  test('increments timesIncorrect on incorrect answer', () => {
    const updated = updateCollocationMastery(baseMastery, false, false);
    expect(updated.timesCorrect).toBe(5);
    expect(updated.timesIncorrect).toBe(3);
  });

  test('sets canProduce to true on correct production', () => {
    const updated = updateCollocationMastery(baseMastery, true, true);
    expect(updated.canProduce).toBe(true);
  });

  test('keeps canProduce false on correct recognition', () => {
    const updated = updateCollocationMastery(baseMastery, true, false);
    expect(updated.canProduce).toBe(false);
  });

  test('keeps canProduce true once set', () => {
    const masteryWithProduction = { ...baseMastery, canProduce: true };
    const updated = updateCollocationMastery(masteryWithProduction, false, false);
    expect(updated.canProduce).toBe(true);
  });

  test('updates lastPracticed timestamp', () => {
    const updated = updateCollocationMastery(baseMastery, true, false);
    expect(updated.lastPracticed).not.toBeNull();
    const timestamp = new Date(updated.lastPracticed!);
    expect(timestamp.getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
  });
});

// ============================================================================
// selectCollocationsForPractice Tests
// ============================================================================

describe('selectCollocationsForPractice', () => {
  test('returns collocations where all words meet minimum strength', () => {
    const wordStrengths: Record<string, number> = {
      'word-001': 30,
      'word-002': 30,
      'word-003': 30,
      'word-004': 30,
      'word-005': 5, // Below threshold
      'word-006': 30,
    };

    const selected = selectCollocationsForPractice(sampleCollocations, wordStrengths);

    // Should include coll-1, coll-2, coll-4 but not coll-3 (word-005 too weak)
    expect(selected.map(c => c.id)).not.toContain('coll-3');
    expect(selected.length).toBe(3);
  });

  test('returns empty array if no words meet threshold', () => {
    const wordStrengths: Record<string, number> = {
      'word-001': 5,
      'word-002': 5,
    };

    const selected = selectCollocationsForPractice(sampleCollocations, wordStrengths);
    expect(selected).toHaveLength(0);
  });

  test('respects limit parameter', () => {
    const wordStrengths: Record<string, number> = {
      'word-001': 50,
      'word-002': 50,
      'word-003': 50,
      'word-004': 50,
      'word-005': 50,
      'word-006': 50,
    };

    const selected = selectCollocationsForPractice(sampleCollocations, wordStrengths, 2);
    expect(selected.length).toBe(2);
  });

  test('shuffles results', () => {
    const wordStrengths: Record<string, number> = {
      'word-001': 50,
      'word-002': 50,
      'word-003': 50,
      'word-004': 50,
      'word-005': 50,
      'word-006': 50,
    };

    // Run multiple times to check randomization
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const selected = selectCollocationsForPractice(sampleCollocations, wordStrengths);
      results.add(selected.map(c => c.id).join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

// ============================================================================
// getCollocationsForWord Tests
// ============================================================================

describe('getCollocationsForWord', () => {
  test('returns collocations containing the word', () => {
    const result = getCollocationsForWord('word-001', sampleCollocations);
    
    // word-001 appears in coll-1 (هَذَا كِتَابٌ) and coll-4 (مَا هَذَا)
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toContain('coll-1');
    expect(result.map(c => c.id)).toContain('coll-4');
  });

  test('returns empty array if word not found', () => {
    const result = getCollocationsForWord('word-999', sampleCollocations);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// getCollocationsForLesson Tests
// ============================================================================

describe('getCollocationsForLesson', () => {
  test('returns collocations from the lesson', () => {
    const result = getCollocationsForLesson('b1-l01', sampleCollocations);
    
    expect(result).toHaveLength(3);
    result.forEach(c => expect(c.lessonId).toBe('b1-l01'));
  });

  test('returns empty array for unknown lesson', () => {
    const result = getCollocationsForLesson('b99-l99', sampleCollocations);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// Type Description Tests
// ============================================================================

describe('getCollocationTypeDescription', () => {
  test('returns correct description for each type', () => {
    expect(getCollocationTypeDescription('demonstrative_noun')).toContain('Demonstrative');
    expect(getCollocationTypeDescription('noun_adjective')).toContain('Noun');
    expect(getCollocationTypeDescription('verb_object')).toContain('Verb');
    expect(getCollocationTypeDescription('preposition_noun')).toContain('Preposition');
    expect(getCollocationTypeDescription('possessive')).toContain('Possessive');
    expect(getCollocationTypeDescription('idiomatic')).toContain('Idiomatic');
    expect(getCollocationTypeDescription('question_answer')).toContain('Question');
  });
});

describe('getCollocationTypeDescriptionArabic', () => {
  test('returns Arabic description for each type', () => {
    expect(getCollocationTypeDescriptionArabic('demonstrative_noun')).toBe('اسم الإشارة + اسم');
    expect(getCollocationTypeDescriptionArabic('noun_adjective')).toBe('اسم + صفة');
    expect(getCollocationTypeDescriptionArabic('verb_object')).toBe('فعل + مفعول به');
    expect(getCollocationTypeDescriptionArabic('preposition_noun')).toBe('حرف جر + اسم');
    expect(getCollocationTypeDescriptionArabic('possessive')).toBe('إضافة');
    expect(getCollocationTypeDescriptionArabic('idiomatic')).toBe('تعبير اصطلاحي');
    expect(getCollocationTypeDescriptionArabic('question_answer')).toBe('أداة استفهام');
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('constants', () => {
  test('MIN_WORD_STRENGTH_FOR_COLLOCATION is reasonable', () => {
    expect(MIN_WORD_STRENGTH_FOR_COLLOCATION).toBeGreaterThan(0);
    expect(MIN_WORD_STRENGTH_FOR_COLLOCATION).toBeLessThan(50);
  });

  test('COLLOCATION_STRENGTH_CHANGES has correct polarity', () => {
    expect(COLLOCATION_STRENGTH_CHANGES.correct).toBeGreaterThan(0);
    expect(COLLOCATION_STRENGTH_CHANGES.incorrect).toBeLessThan(0);
  });

  test('DEFAULT_COLLOCATION_MASTERY has zeroed values', () => {
    expect(DEFAULT_COLLOCATION_MASTERY.strength).toBe(0);
    expect(DEFAULT_COLLOCATION_MASTERY.timesCorrect).toBe(0);
    expect(DEFAULT_COLLOCATION_MASTERY.timesIncorrect).toBe(0);
    expect(DEFAULT_COLLOCATION_MASTERY.canProduce).toBe(false);
    expect(DEFAULT_COLLOCATION_MASTERY.lastPracticed).toBeNull();
  });
});
