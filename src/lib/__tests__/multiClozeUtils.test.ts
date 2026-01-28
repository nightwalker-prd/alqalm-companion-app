import { describe, test, expect } from 'vitest';
import {
  isBlankableWord,
  selectBlankPositions,
  createPromptWithBlanks,
  generateMultiClozeExercise,
  checkMultiCloze,
  checkSingleBlank,
  generateMultiClozeExercises,
  reconstructSentence,
  getBlankHint,
  BLANK_MARKER,
  MIN_WORDS_FOR_MULTI_CLOZE,
  MAX_BLANKS,
  SKIP_WORDS,
} from '../multiClozeUtils';
import type { MultiClozeExercise } from '../../types/exercise';

// ============================================================================
// Test Data
// ============================================================================

const sampleExercise: MultiClozeExercise = {
  id: 'mc-test-1',
  type: 'multi-cloze',
  prompt: 'هَذَا _____ جَمِيلٌ _____',
  promptEn: 'This is a beautiful book here',
  blanks: [
    { position: 1, answer: 'كِتَابٌ' },
    { position: 3, answer: 'هُنَا' },
  ],
  completeSentence: 'هَذَا كِتَابٌ جَمِيلٌ هُنَا',
  itemIds: ['word-001', 'word-002'],
};

// ============================================================================
// isBlankableWord Tests
// ============================================================================

describe('isBlankableWord', () => {
  test('returns true for regular nouns', () => {
    expect(isBlankableWord('كِتَابٌ')).toBe(true);
    expect(isBlankableWord('بَيْتٌ')).toBe(true);
    expect(isBlankableWord('طَالِبٌ')).toBe(true);
  });

  test('returns true for verbs', () => {
    expect(isBlankableWord('ذَهَبَ')).toBe(true);
    expect(isBlankableWord('يَكْتُبُ')).toBe(true);
  });

  test('returns false for very short words', () => {
    expect(isBlankableWord('و')).toBe(false);
    expect(isBlankableWord('ف')).toBe(false);
  });

  test('returns false for prepositions', () => {
    expect(isBlankableWord('في')).toBe(false);
    expect(isBlankableWord('فِي')).toBe(false);
    expect(isBlankableWord('من')).toBe(false);
    expect(isBlankableWord('مِن')).toBe(false);
  });

  test('returns false for particles', () => {
    expect(isBlankableWord('إلى')).toBe(false);
    expect(isBlankableWord('على')).toBe(false);
  });
});

// ============================================================================
// selectBlankPositions Tests
// ============================================================================

describe('selectBlankPositions', () => {
  test('selects requested number of positions', () => {
    const words = ['هَذَا', 'كِتَابٌ', 'جَمِيلٌ', 'جِدًّا'];
    const positions = selectBlankPositions(words, 2);
    expect(positions.length).toBe(2);
  });

  test('returns sorted positions', () => {
    const words = ['هَذَا', 'كِتَابٌ', 'جَمِيلٌ', 'كَبِيرٌ', 'جِدًّا'];
    const positions = selectBlankPositions(words, 3);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('skips non-blankable words', () => {
    const words = ['في', 'البَيْتِ', 'الكَبِيرِ'];
    const positions = selectBlankPositions(words, 2);
    // 'في' should be skipped
    expect(positions).not.toContain(0);
  });

  test('returns fewer positions if not enough blankable words', () => {
    const words = ['من', 'في', 'إلى'];
    const positions = selectBlankPositions(words, 2);
    expect(positions.length).toBe(0);
  });

  test('does not exceed requested blanks', () => {
    const words = ['أَنَا', 'طَالِبٌ', 'جَدِيدٌ', 'هُنَا', 'اليَوْمَ'];
    const positions = selectBlankPositions(words, 2);
    expect(positions.length).toBeLessThanOrEqual(2);
  });
});

// ============================================================================
// createPromptWithBlanks Tests
// ============================================================================

describe('createPromptWithBlanks', () => {
  test('replaces specified positions with blanks', () => {
    const words = ['هَذَا', 'كِتَابٌ', 'جَمِيلٌ'];
    const prompt = createPromptWithBlanks(words, [1]);
    expect(prompt).toBe(`هَذَا ${BLANK_MARKER} جَمِيلٌ`);
  });

  test('handles multiple blanks', () => {
    const words = ['هَذَا', 'كِتَابٌ', 'جَمِيلٌ', 'هُنَا'];
    const prompt = createPromptWithBlanks(words, [1, 3]);
    expect(prompt).toBe(`هَذَا ${BLANK_MARKER} جَمِيلٌ ${BLANK_MARKER}`);
  });

  test('handles first position as blank', () => {
    const words = ['هَذَا', 'كِتَابٌ'];
    const prompt = createPromptWithBlanks(words, [0]);
    expect(prompt).toBe(`${BLANK_MARKER} كِتَابٌ`);
  });

  test('handles last position as blank', () => {
    const words = ['هَذَا', 'كِتَابٌ'];
    const prompt = createPromptWithBlanks(words, [1]);
    expect(prompt).toBe(`هَذَا ${BLANK_MARKER}`);
  });
});

// ============================================================================
// generateMultiClozeExercise Tests
// ============================================================================

describe('generateMultiClozeExercise', () => {
  test('generates exercise with correct structure', () => {
    const exercise = generateMultiClozeExercise(
      'هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ',
      'b1-l01',
      'This is a beautiful big book'
    );
    
    expect(exercise).not.toBeNull();
    expect(exercise!.type).toBe('multi-cloze');
    expect(exercise!.blanks.length).toBeGreaterThanOrEqual(2);
    expect(exercise!.completeSentence).toBe('هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ');
    expect(exercise!.promptEn).toBe('This is a beautiful big book');
  });

  test('returns null for sentences too short', () => {
    const exercise = generateMultiClozeExercise(
      'هَذَا كِتَابٌ',
      'b1-l01'
    );
    expect(exercise).toBeNull();
  });

  test('respects numBlanks parameter', () => {
    const exercise = generateMultiClozeExercise(
      'هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ قَدِيمٌ',
      'b1-l01',
      undefined,
      [],
      3
    );
    
    if (exercise) {
      expect(exercise.blanks.length).toBeLessThanOrEqual(3);
    }
  });

  test('includes itemIds', () => {
    const exercise = generateMultiClozeExercise(
      'هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ',
      'b1-l01',
      undefined,
      ['word-001', 'word-002']
    );
    
    expect(exercise!.itemIds).toEqual(['word-001', 'word-002']);
  });

  test('generates unique id with timestamp', () => {
    const exercise = generateMultiClozeExercise(
      'هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ',
      'b1-l01'
    );
    
    expect(exercise!.id).toMatch(/^mc-b1-l01-\d+$/);
  });

  test('prompt contains correct number of blanks', () => {
    const exercise = generateMultiClozeExercise(
      'هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ',
      'b1-l01'
    );
    
    if (exercise) {
      const blankCount = (exercise.prompt.match(/_____/g) || []).length;
      expect(blankCount).toBe(exercise.blanks.length);
    }
  });
});

// ============================================================================
// checkMultiCloze Tests
// ============================================================================

describe('checkMultiCloze', () => {
  test('returns correct when all answers match', () => {
    const result = checkMultiCloze(['كِتَابٌ', 'هُنَا'], sampleExercise);
    
    expect(result.isCorrect).toBe(true);
    expect(result.correctCount).toBe(2);
    expect(result.totalBlanks).toBe(2);
    expect(result.accuracy).toBe(100);
  });

  test('returns correct with normalized answers', () => {
    const result = checkMultiCloze(['كتاب', 'هنا'], sampleExercise);
    expect(result.isCorrect).toBe(true);
  });

  test('handles partial correct answers', () => {
    const result = checkMultiCloze(['كِتَابٌ', 'خَطَأ'], sampleExercise);
    
    expect(result.isCorrect).toBe(false);
    expect(result.correctCount).toBe(1);
    expect(result.accuracy).toBe(50);
  });

  test('handles all wrong answers', () => {
    const result = checkMultiCloze(['خَطَأ', 'غَلَط'], sampleExercise);
    
    expect(result.isCorrect).toBe(false);
    expect(result.correctCount).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  test('handles missing answers', () => {
    const result = checkMultiCloze(['كِتَابٌ'], sampleExercise);
    
    expect(result.isCorrect).toBe(false);
    expect(result.correctCount).toBe(1);
  });

  test('returns detailed blank results', () => {
    const result = checkMultiCloze(['كِتَابٌ', 'خَطَأ'], sampleExercise);
    
    expect(result.blankResults.length).toBe(2);
    expect(result.blankResults[0].isCorrect).toBe(true);
    expect(result.blankResults[1].isCorrect).toBe(false);
    expect(result.blankResults[0].correctAnswer).toBe('كِتَابٌ');
    expect(result.blankResults[1].correctAnswer).toBe('هُنَا');
  });

  test('provides appropriate feedback', () => {
    const perfectResult = checkMultiCloze(['كِتَابٌ', 'هُنَا'], sampleExercise);
    expect(perfectResult.feedback).toContain('Excellent');

    const almostResult = checkMultiCloze(['كِتَابٌ', 'خَطَأ'], sampleExercise);
    expect(almostResult.feedback).toContain('Almost');

    const wrongResult = checkMultiCloze(['خَطَأ', 'غَلَط'], sampleExercise);
    expect(wrongResult.feedback).toContain('practicing');
  });
});

// ============================================================================
// checkSingleBlank Tests
// ============================================================================

describe('checkSingleBlank', () => {
  test('returns true for correct answer', () => {
    expect(checkSingleBlank('كِتَابٌ', 0, sampleExercise)).toBe(true);
  });

  test('returns true with normalized answer', () => {
    expect(checkSingleBlank('كتاب', 0, sampleExercise)).toBe(true);
  });

  test('returns false for incorrect answer', () => {
    expect(checkSingleBlank('خَطَأ', 0, sampleExercise)).toBe(false);
  });

  test('returns false for invalid blank index', () => {
    expect(checkSingleBlank('كِتَابٌ', 10, sampleExercise)).toBe(false);
  });

  test('checks second blank correctly', () => {
    expect(checkSingleBlank('هُنَا', 1, sampleExercise)).toBe(true);
    expect(checkSingleBlank('هنا', 1, sampleExercise)).toBe(true);
  });
});

// ============================================================================
// generateMultiClozeExercises Tests
// ============================================================================

describe('generateMultiClozeExercises', () => {
  const sampleSentences = [
    { arabic: 'هَذَا كِتَابٌ جَمِيلٌ كَبِيرٌ', english: 'This is a beautiful big book', lessonId: 'b1-l01' },
    { arabic: 'ذَلِكَ بَيْتٌ صَغِيرٌ قَدِيمٌ', english: 'That is a small old house', lessonId: 'b1-l01' },
    { arabic: 'هِيَ طَالِبَةٌ جَدِيدَةٌ ذَكِيَّةٌ', english: 'She is a new smart student', lessonId: 'b1-l02' },
    { arabic: 'نَحْنُ طُلَّابٌ مُجْتَهِدُونَ هُنَا', english: 'We are hardworking students here', lessonId: 'b1-l03' },
  ];

  test('generates requested number of exercises', () => {
    const exercises = generateMultiClozeExercises(sampleSentences, 2);
    expect(exercises.length).toBe(2);
  });

  test('does not exceed available sentences', () => {
    const exercises = generateMultiClozeExercises(sampleSentences, 10);
    expect(exercises.length).toBeLessThanOrEqual(4);
  });

  test('returns empty array for empty input', () => {
    const exercises = generateMultiClozeExercises([], 5);
    expect(exercises).toEqual([]);
  });

  test('respects blanksPerExercise parameter', () => {
    const exercises = generateMultiClozeExercises(sampleSentences, 2, 3);
    exercises.forEach(ex => {
      expect(ex.blanks.length).toBeLessThanOrEqual(3);
    });
  });

  test('preserves english hints', () => {
    const exercises = generateMultiClozeExercises(sampleSentences, 4);
    const withHint = exercises.find(ex => ex.promptEn);
    expect(withHint).toBeDefined();
  });
});

// ============================================================================
// reconstructSentence Tests
// ============================================================================

describe('reconstructSentence', () => {
  test('reconstructs with correct answers', () => {
    const result = reconstructSentence(sampleExercise, ['كِتَابٌ', 'هُنَا']);
    expect(result).toBe('هَذَا كِتَابٌ جَمِيلٌ هُنَا');
  });

  test('shows blanks for missing answers', () => {
    const result = reconstructSentence(sampleExercise, ['كِتَابٌ']);
    expect(result).toBe(`هَذَا كِتَابٌ جَمِيلٌ ${BLANK_MARKER}`);
  });

  test('shows user answers even if wrong', () => {
    const result = reconstructSentence(sampleExercise, ['خَطَأ', 'غَلَط']);
    expect(result).toBe('هَذَا خَطَأ جَمِيلٌ غَلَط');
  });
});

// ============================================================================
// getBlankHint Tests
// ============================================================================

describe('getBlankHint', () => {
  const blank = { position: 0, answer: 'كِتَابٌ' };

  test('returns empty for level 0', () => {
    expect(getBlankHint(blank, 0)).toBe('');
  });

  test('returns first letter for level 1', () => {
    expect(getBlankHint(blank, 1)).toBe('ك...');
  });

  test('returns first two letters for level 2', () => {
    expect(getBlankHint(blank, 2)).toBe('كِ...');
  });

  test('returns half word for level 3+', () => {
    const hint = getBlankHint(blank, 3);
    expect(hint.length).toBeLessThan(blank.answer.length + 3);
    expect(hint.endsWith('...')).toBe(true);
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Constants', () => {
  test('MIN_WORDS_FOR_MULTI_CLOZE is reasonable', () => {
    expect(MIN_WORDS_FOR_MULTI_CLOZE).toBeGreaterThanOrEqual(3);
    expect(MIN_WORDS_FOR_MULTI_CLOZE).toBeLessThanOrEqual(6);
  });

  test('MAX_BLANKS is reasonable', () => {
    expect(MAX_BLANKS).toBeGreaterThanOrEqual(2);
    expect(MAX_BLANKS).toBeLessThanOrEqual(5);
  });

  test('SKIP_WORDS contains common particles', () => {
    expect(SKIP_WORDS.has('في')).toBe(true);
    expect(SKIP_WORDS.has('من')).toBe(true);
    expect(SKIP_WORDS.has('إلى')).toBe(true);
  });

  test('BLANK_MARKER is consistent', () => {
    expect(BLANK_MARKER).toBe('_____');
  });
});
