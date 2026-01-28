import { describe, test, expect, beforeEach } from 'vitest';
import {
  splitSentenceIntoWords,
  generateWordId,
  selectDistractors,
  generateUnscrambleWords,
  createSentenceUnscrambleExercise,
  checkUnscrambleAnswer,
  getCorrectArrangement,
  calculateUnscrambleScore,
  getUnscrambleHint,
  getDistractorCountForDifficulty,
  COMMON_DISTRACTOR_POOL,
} from '../sentenceUnscrambleUtils';
import type { SentenceUnscrambleExercise, UnscrambleWord } from '../../types/exercise';

describe('splitSentenceIntoWords', () => {
  test('splits a simple sentence', () => {
    const result = splitSentenceIntoWords('هَذَا كِتَابٌ جَدِيدٌ');
    expect(result).toEqual(['هَذَا', 'كِتَابٌ', 'جَدِيدٌ']);
  });

  test('handles multiple spaces', () => {
    const result = splitSentenceIntoWords('هَذَا   كِتَابٌ    جَدِيدٌ');
    expect(result).toEqual(['هَذَا', 'كِتَابٌ', 'جَدِيدٌ']);
  });

  test('trims leading and trailing whitespace', () => {
    const result = splitSentenceIntoWords('  هَذَا كِتَابٌ  ');
    expect(result).toEqual(['هَذَا', 'كِتَابٌ']);
  });

  test('returns empty array for empty string', () => {
    const result = splitSentenceIntoWords('');
    expect(result).toEqual([]);
  });

  test('returns empty array for whitespace-only string', () => {
    const result = splitSentenceIntoWords('   ');
    expect(result).toEqual([]);
  });
});

describe('generateWordId', () => {
  test('generates unique IDs', () => {
    const id1 = generateWordId(0);
    const id2 = generateWordId(0);
    expect(id1).not.toBe(id2);
  });

  test('includes index in ID', () => {
    const id = generateWordId(5);
    expect(id).toContain('word-5-');
  });
});

describe('selectDistractors', () => {
  test('selects requested number of distractors', () => {
    const result = selectDistractors('هَذَا بَيْتٌ', 3);
    expect(result.length).toBe(3);
  });

  test('excludes words that appear in the sentence', () => {
    // Use a word from the pool in the sentence
    const sentence = 'هُوَ طَالِبٌ';
    const result = selectDistractors(sentence, 10);
    
    // هُوَ should not be in distractors since it's in the sentence
    const hasHuwa = result.some(d => d.includes('هُوَ'));
    expect(hasHuwa).toBe(false);
  });

  test('returns fewer distractors if pool is exhausted', () => {
    const smallPool = [{ arabic: 'أَنَا', english: 'I' }];
    const result = selectDistractors('هَذَا بَيْتٌ', 5, smallPool);
    expect(result.length).toBe(1);
  });

  test('returns empty array if all pool words are in sentence', () => {
    const smallPool = [{ arabic: 'هَذَا', english: 'this' }];
    const result = selectDistractors('هَذَا بَيْتٌ', 3, smallPool);
    expect(result.length).toBe(0);
  });
});

describe('generateUnscrambleWords', () => {
  test('includes all sentence words', () => {
    const result = generateUnscrambleWords('هَذَا كِتَابٌ', 2);
    const sentenceWords = result.filter(w => !w.isDistractor);
    expect(sentenceWords.length).toBe(2);
  });

  test('includes requested number of distractors', () => {
    const result = generateUnscrambleWords('هَذَا كِتَابٌ', 3);
    const distractors = result.filter(w => w.isDistractor);
    expect(distractors.length).toBe(3);
  });

  test('each word has a unique ID', () => {
    const result = generateUnscrambleWords('هَذَا كِتَابٌ جَدِيدٌ', 2);
    const ids = result.map(w => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('words are shuffled (probabilistic)', () => {
    // Run multiple times and check that order varies
    const orders: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = generateUnscrambleWords('كَلِمَةٌ أُخْرَى ثَالِثَةٌ رَابِعَةٌ', 2);
      orders.push(result.map(w => w.text).join(','));
    }
    const uniqueOrders = new Set(orders);
    // With 6 words shuffled 10 times, we expect some variation
    expect(uniqueOrders.size).toBeGreaterThan(1);
  });

  test('uses custom distractors when provided', () => {
    const customDistractors = ['فِي', 'مِنْ'];
    const result = generateUnscrambleWords('هَذَا بَيْتٌ', 2, customDistractors);
    const distractors = result.filter(w => w.isDistractor);
    expect(distractors.map(d => d.text).sort()).toEqual(['فِي', 'مِنْ'].sort());
  });
});

describe('createSentenceUnscrambleExercise', () => {
  test('creates exercise with correct structure', () => {
    const exercise = createSentenceUnscrambleExercise(
      'test-1',
      'هَذَا كِتَابٌ',
      ['item-1', 'item-2'],
      { distractorCount: 2, englishHint: 'This is a book' }
    );

    expect(exercise.id).toBe('test-1');
    expect(exercise.type).toBe('sentence-unscramble');
    expect(exercise.correctSentence).toBe('هَذَا كِتَابٌ');
    expect(exercise.itemIds).toEqual(['item-1', 'item-2']);
    expect(exercise.englishHint).toBe('This is a book');
    expect(exercise.distractorCount).toBe(2);
  });

  test('includes correct number of words', () => {
    const exercise = createSentenceUnscrambleExercise(
      'test-2',
      'الطَّالِبُ فِي المَدْرَسَةِ',
      ['item-1'],
      { distractorCount: 3 }
    );

    // 3 sentence words + 3 distractors = 6 total
    expect(exercise.words.length).toBe(6);
  });

  test('uses custom distractors when provided', () => {
    const exercise = createSentenceUnscrambleExercise(
      'test-3',
      'هَذَا بَيْتٌ',
      ['item-1'],
      { customDistractors: ['كَبِيرٌ', 'صَغِيرٌ'] }
    );

    const distractors = exercise.words.filter(w => w.isDistractor);
    expect(distractors.length).toBe(2);
  });
});

describe('checkUnscrambleAnswer', () => {
  let exercise: SentenceUnscrambleExercise;
  let correctWordIds: string[];

  beforeEach(() => {
    // Create a predictable exercise for testing
    const words: UnscrambleWord[] = [
      { text: 'هَذَا', id: 'w1', isDistractor: false },
      { text: 'كِتَابٌ', id: 'w2', isDistractor: false },
      { text: 'جَدِيدٌ', id: 'w3', isDistractor: false },
      { text: 'فِي', id: 'd1', isDistractor: true },
      { text: 'مِنْ', id: 'd2', isDistractor: true },
    ];

    exercise = {
      id: 'test',
      type: 'sentence-unscramble',
      itemIds: ['item-1'],
      correctSentence: 'هَذَا كِتَابٌ جَدِيدٌ',
      words,
      distractorCount: 2,
    };

    correctWordIds = ['w1', 'w2', 'w3'];
    // distractorIds are d1, d2 - available in exercise.words
  });

  test('returns correct for perfect answer', () => {
    const result = checkUnscrambleAnswer(correctWordIds, exercise);
    expect(result.isCorrect).toBe(true);
    expect(result.orderCorrect).toBe(true);
    expect(result.distractorsExcluded).toBe(true);
    expect(result.correctPositions).toBe(3);
    expect(result.totalExpected).toBe(3);
    expect(result.includedDistractors).toEqual([]);
    expect(result.missingWords).toEqual([]);
  });

  test('returns incorrect for wrong order', () => {
    const wrongOrder = ['w2', 'w1', 'w3'];
    const result = checkUnscrambleAnswer(wrongOrder, exercise);
    expect(result.isCorrect).toBe(false);
    expect(result.orderCorrect).toBe(false);
    expect(result.distractorsExcluded).toBe(true);
    expect(result.correctPositions).toBe(1); // Only w3 is correct
  });

  test('returns incorrect when distractor included', () => {
    const withDistractor = ['w1', 'w2', 'w3', 'd1'];
    const result = checkUnscrambleAnswer(withDistractor, exercise);
    expect(result.isCorrect).toBe(false);
    expect(result.distractorsExcluded).toBe(false);
    expect(result.includedDistractors).toEqual(['d1']);
  });

  test('returns incorrect when word is missing', () => {
    const missingWord = ['w1', 'w2'];
    const result = checkUnscrambleAnswer(missingWord, exercise);
    expect(result.isCorrect).toBe(false);
    expect(result.missingWords).toEqual(['w3']);
  });

  test('handles empty arrangement', () => {
    const result = checkUnscrambleAnswer([], exercise);
    expect(result.isCorrect).toBe(false);
    expect(result.correctPositions).toBe(0);
    expect(result.missingWords.length).toBe(3);
  });

  test('handles invalid word IDs gracefully', () => {
    const result = checkUnscrambleAnswer(['invalid-id', 'w1'], exercise);
    expect(result.isCorrect).toBe(false);
  });
});

describe('getCorrectArrangement', () => {
  test('returns correct word IDs in order', () => {
    const words: UnscrambleWord[] = [
      { text: 'مِنْ', id: 'd1', isDistractor: true },
      { text: 'كِتَابٌ', id: 'w2', isDistractor: false },
      { text: 'هَذَا', id: 'w1', isDistractor: false },
    ];

    const exercise: SentenceUnscrambleExercise = {
      id: 'test',
      type: 'sentence-unscramble',
      itemIds: ['item-1'],
      correctSentence: 'هَذَا كِتَابٌ',
      words,
      distractorCount: 1,
    };

    const result = getCorrectArrangement(exercise);
    expect(result).toEqual(['w1', 'w2']);
  });

  test('excludes distractors from result', () => {
    const words: UnscrambleWord[] = [
      { text: 'هَذَا', id: 'w1', isDistractor: false },
      { text: 'فِي', id: 'd1', isDistractor: true },
      { text: 'مِنْ', id: 'd2', isDistractor: true },
    ];

    const exercise: SentenceUnscrambleExercise = {
      id: 'test',
      type: 'sentence-unscramble',
      itemIds: ['item-1'],
      correctSentence: 'هَذَا',
      words,
      distractorCount: 2,
    };

    const result = getCorrectArrangement(exercise);
    expect(result).toEqual(['w1']);
    expect(result).not.toContain('d1');
    expect(result).not.toContain('d2');
  });
});

describe('calculateUnscrambleScore', () => {
  test('returns 100 for correct answer', () => {
    const result = {
      isCorrect: true,
      orderCorrect: true,
      distractorsExcluded: true,
      correctPositions: 3,
      totalExpected: 3,
      includedDistractors: [],
      missingWords: [],
    };
    expect(calculateUnscrambleScore(result)).toBe(100);
  });

  test('returns partial score for partial correct positions', () => {
    const result = {
      isCorrect: false,
      orderCorrect: false,
      distractorsExcluded: true,
      correctPositions: 2,
      totalExpected: 4,
      includedDistractors: [],
      missingWords: [],
    };
    // 2/4 * 70 = 35
    expect(calculateUnscrambleScore(result)).toBe(35);
  });

  test('applies distractor penalty', () => {
    const result = {
      isCorrect: false,
      orderCorrect: true,
      distractorsExcluded: false,
      correctPositions: 3,
      totalExpected: 3,
      includedDistractors: ['d1'],
      missingWords: [],
    };
    // 3/3 * 70 - 10 = 60
    expect(calculateUnscrambleScore(result)).toBe(60);
  });

  test('applies missing word penalty', () => {
    const result = {
      isCorrect: false,
      orderCorrect: false,
      distractorsExcluded: true,
      correctPositions: 2,
      totalExpected: 3,
      includedDistractors: [],
      missingWords: ['w3'],
    };
    // 2/3 * 70 - 15 = 46.67 - 15 = 31.67 ≈ 32
    expect(calculateUnscrambleScore(result)).toBe(32);
  });

  test('never returns negative score', () => {
    const result = {
      isCorrect: false,
      orderCorrect: false,
      distractorsExcluded: false,
      correctPositions: 0,
      totalExpected: 3,
      includedDistractors: ['d1', 'd2', 'd3'],
      missingWords: ['w1', 'w2', 'w3'],
    };
    expect(calculateUnscrambleScore(result)).toBeGreaterThanOrEqual(0);
  });
});

describe('getUnscrambleHint', () => {
  let exercise: SentenceUnscrambleExercise;

  beforeEach(() => {
    const words: UnscrambleWord[] = [
      { text: 'هَذَا', id: 'w1', isDistractor: false },
      { text: 'كِتَابٌ', id: 'w2', isDistractor: false },
      { text: 'فِي', id: 'd1', isDistractor: true },
    ];

    exercise = {
      id: 'test',
      type: 'sentence-unscramble',
      itemIds: ['item-1'],
      correctSentence: 'هَذَا كِتَابٌ',
      words,
      distractorCount: 1,
    };
  });

  test('hints about distractors when included', () => {
    const hint = getUnscrambleHint(['w1', 'w2', 'd1'], exercise);
    expect(hint.toLowerCase()).toContain("don't belong");
  });

  test('hints about missing words', () => {
    const hint = getUnscrambleHint(['w1'], exercise);
    expect(hint.toLowerCase()).toContain('missing');
  });

  test('hints about word order when wrong', () => {
    const hint = getUnscrambleHint(['w2', 'w1'], exercise);
    expect(hint.toLowerCase()).toContain('position');
  });
});

describe('getDistractorCountForDifficulty', () => {
  test('returns 1 for easy with short sentence', () => {
    expect(getDistractorCountForDifficulty('easy', 3)).toBe(1);
  });

  test('returns 2 for medium with short sentence', () => {
    expect(getDistractorCountForDifficulty('medium', 3)).toBe(2);
  });

  test('returns 3 for hard with short sentence', () => {
    expect(getDistractorCountForDifficulty('hard', 3)).toBe(3);
  });

  test('adds bonus for longer sentences', () => {
    expect(getDistractorCountForDifficulty('easy', 10)).toBe(3);
  });

  test('caps at maximum of 5', () => {
    expect(getDistractorCountForDifficulty('hard', 20)).toBe(5);
  });
});

describe('COMMON_DISTRACTOR_POOL', () => {
  test('contains at least 30 words', () => {
    expect(COMMON_DISTRACTOR_POOL.length).toBeGreaterThanOrEqual(30);
  });

  test('each entry has arabic and english', () => {
    for (const entry of COMMON_DISTRACTOR_POOL) {
      expect(entry.arabic).toBeTruthy();
      expect(entry.english).toBeTruthy();
    }
  });

  test('contains common pronouns', () => {
    const arabicWords = COMMON_DISTRACTOR_POOL.map(e => e.arabic);
    expect(arabicWords).toContain('هُوَ');
    expect(arabicWords).toContain('هِيَ');
  });

  test('contains common prepositions', () => {
    const arabicWords = COMMON_DISTRACTOR_POOL.map(e => e.arabic);
    expect(arabicWords).toContain('فِي');
    expect(arabicWords).toContain('مِنْ');
  });
});
