import { describe, test, expect } from 'vitest';
import {
  generateGenderError,
  generateDefinitenessError,
  generateWordOrderError,
  generateErrorCorrectionExercise,
  checkErrorCorrection,
  checkErrorIdentification,
  generateErrorCorrectionExercises,
  getErrorTypeLabel,
  ERROR_TYPE_DESCRIPTIONS,
  GENDER_PAIRS,
} from '../errorCorrectionUtils';
import type { ErrorCorrectionExercise } from '../../types/exercise';

// ============================================================================
// Test Data
// ============================================================================

const sampleExercise: ErrorCorrectionExercise = {
  id: 'err-test-1',
  type: 'error-correction',
  sentenceWithError: 'هَذِهِ كِتَابٌ',
  correctSentence: 'هَذَا كِتَابٌ',
  errorWord: 'هَذِهِ',
  correctWord: 'هَذَا',
  errorType: 'gender',
  englishHint: 'This is a book',
  explanation: 'Gender agreement error',
  itemIds: ['word-001'],
};

// ============================================================================
// generateGenderError Tests
// ============================================================================

describe('generateGenderError', () => {
  test('swaps هَذَا to هَذِهِ', () => {
    const result = generateGenderError('هَذَا كِتَابٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('هَذِهِ كِتَابٌ');
    expect(result!.errorWord).toBe('هَذِهِ');
    expect(result!.correctWord).toBe('هَذَا');
  });

  test('swaps هَذِهِ to هَذَا', () => {
    const result = generateGenderError('هَذِهِ سَيَّارَةٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('هَذَا سَيَّارَةٌ');
    expect(result!.errorWord).toBe('هَذَا');
    expect(result!.correctWord).toBe('هَذِهِ');
  });

  test('swaps ذَلِكَ to تِلْكَ', () => {
    const result = generateGenderError('ذَلِكَ رَجُلٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('تِلْكَ رَجُلٌ');
    expect(result!.errorWord).toBe('تِلْكَ');
    expect(result!.correctWord).toBe('ذَلِكَ');
  });

  test('swaps هُوَ to هِيَ', () => {
    const result = generateGenderError('هُوَ طَالِبٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('هِيَ طَالِبٌ');
    expect(result!.errorWord).toBe('هِيَ');
    expect(result!.correctWord).toBe('هُوَ');
  });

  test('returns null when no gender words found', () => {
    const result = generateGenderError('كِتَابٌ جَمِيلٌ');
    expect(result).toBeNull();
  });

  test('handles sentences with multiple words', () => {
    const result = generateGenderError('هَذَا الكِتَابُ جَدِيدٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('هَذِهِ الكِتَابُ جَدِيدٌ');
  });
});

// ============================================================================
// generateDefinitenessError Tests
// ============================================================================

describe('generateDefinitenessError', () => {
  test('removes ال from definite word', () => {
    const result = generateDefinitenessError('فِي البَيْتِ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('فِي بَيْتِ');
    expect(result!.errorWord).toBe('بَيْتِ');
    expect(result!.correctWord).toBe('البَيْتِ');
  });

  test('adds ال to indefinite word', () => {
    const result = generateDefinitenessError('هَذَا كِتَابٌ');
    expect(result).not.toBeNull();
    // Should add ال to كِتَابٌ since هَذَا is skipped
    expect(result!.errorSentence).toBe('هَذَا الكِتَابٌ');
    expect(result!.errorWord).toBe('الكِتَابٌ');
    expect(result!.correctWord).toBe('كِتَابٌ');
  });

  test('skips demonstratives when adding ال', () => {
    const result = generateDefinitenessError('هَذَا طَالِبٌ');
    expect(result).not.toBeNull();
    // Should not add ال to هَذَا, but to طَالِبٌ
    expect(result!.errorSentence).not.toContain('الهَذَا');
  });

  test('returns null for very short sentences', () => {
    const result = generateDefinitenessError('مِن');
    expect(result).toBeNull();
  });
});

// ============================================================================
// generateWordOrderError Tests
// ============================================================================

describe('generateWordOrderError', () => {
  test('swaps adjacent words', () => {
    const result = generateWordOrderError('هَذَا كِتَابٌ جَمِيلٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('هَذَا جَمِيلٌ كِتَابٌ');
  });

  test('handles two-word sentences', () => {
    const result = generateWordOrderError('هَذَا كِتَابٌ');
    expect(result).not.toBeNull();
    expect(result!.errorSentence).toBe('كِتَابٌ هَذَا');
  });

  test('returns null for single word', () => {
    const result = generateWordOrderError('كِتَابٌ');
    expect(result).toBeNull();
  });

  test('returns combined error word for word order', () => {
    const result = generateWordOrderError('هَذَا كِتَابٌ جَدِيدٌ');
    expect(result).not.toBeNull();
    expect(result!.errorWord).toContain(' ');
    expect(result!.correctWord).toContain(' ');
  });
});

// ============================================================================
// generateErrorCorrectionExercise Tests
// ============================================================================

describe('generateErrorCorrectionExercise', () => {
  test('generates exercise with gender error', () => {
    const exercise = generateErrorCorrectionExercise(
      'هَذَا كِتَابٌ',
      'b1-l01',
      'This is a book',
      ['word-001'],
      'gender'
    );
    expect(exercise).not.toBeNull();
    expect(exercise!.type).toBe('error-correction');
    expect(exercise!.errorType).toBe('gender');
    expect(exercise!.correctSentence).toBe('هَذَا كِتَابٌ');
    expect(exercise!.englishHint).toBe('This is a book');
  });

  test('generates exercise with definiteness error', () => {
    const exercise = generateErrorCorrectionExercise(
      'فِي البَيْتِ',
      'b1-l01',
      'In the house',
      ['word-001'],
      'definiteness'
    );
    expect(exercise).not.toBeNull();
    expect(exercise!.errorType).toBe('definiteness');
  });

  test('generates exercise with word_order error', () => {
    const exercise = generateErrorCorrectionExercise(
      'هَذَا كِتَابٌ جَمِيلٌ',
      'b1-l01',
      'This is a beautiful book',
      ['word-001'],
      'word_order'
    );
    expect(exercise).not.toBeNull();
    expect(exercise!.errorType).toBe('word_order');
  });

  test('includes itemIds in generated exercise', () => {
    const exercise = generateErrorCorrectionExercise(
      'هَذَا كِتَابٌ',
      'b1-l01',
      undefined,
      ['word-001', 'word-002']
    );
    expect(exercise!.itemIds).toEqual(['word-001', 'word-002']);
  });

  test('generates unique id with timestamp', () => {
    const exercise = generateErrorCorrectionExercise(
      'هَذَا كِتَابٌ',
      'b1-l01'
    );
    expect(exercise!.id).toMatch(/^err-b1-l01-\d+$/);
  });

  test('returns null when no error can be generated', () => {
    const exercise = generateErrorCorrectionExercise(
      'مِن',
      'b1-l01'
    );
    expect(exercise).toBeNull();
  });
});

// ============================================================================
// checkErrorCorrection Tests
// ============================================================================

describe('checkErrorCorrection', () => {
  test('returns correct when answer matches exactly', () => {
    const result = checkErrorCorrection('هَذَا كِتَابٌ', sampleExercise);
    expect(result.isCorrect).toBe(true);
    expect(result.identifiedError).toBe(true);
    expect(result.correctedProperly).toBe(true);
    expect(result.feedback).toContain('Correct');
  });

  test('returns correct with normalized answer (no tashkeel)', () => {
    const result = checkErrorCorrection('هذا كتاب', sampleExercise);
    expect(result.isCorrect).toBe(true);
  });

  test('detects when error was not identified (error word kept)', () => {
    const result = checkErrorCorrection('هَذِهِ كِتَابٌ', sampleExercise);
    expect(result.isCorrect).toBe(false);
    expect(result.identifiedError).toBe(false);
    expect(result.correctedProperly).toBe(false);
    expect(result.feedback).toContain('هَذِهِ');
  });

  test('detects when error found but wrong correction', () => {
    const result = checkErrorCorrection('ذَلِكَ كِتَابٌ', sampleExercise);
    expect(result.isCorrect).toBe(false);
    expect(result.identifiedError).toBe(true);
    expect(result.correctedProperly).toBe(false);
  });

  test('detects correct word but other changes made', () => {
    const result = checkErrorCorrection('هَذَا قَلَمٌ', sampleExercise);
    expect(result.isCorrect).toBe(false);
    expect(result.identifiedError).toBe(true);
    expect(result.correctedProperly).toBe(true);
    expect(result.feedback).toContain('something else changed');
  });

  test('returns error type in result', () => {
    const result = checkErrorCorrection('wrong answer', sampleExercise);
    expect(result.errorType).toBe('gender');
  });
});

// ============================================================================
// checkErrorIdentification Tests
// ============================================================================

describe('checkErrorIdentification', () => {
  test('returns true when error word correctly identified', () => {
    const result = checkErrorIdentification('هَذِهِ', sampleExercise);
    expect(result).toBe(true);
  });

  test('returns true with normalized input', () => {
    const result = checkErrorIdentification('هذه', sampleExercise);
    expect(result).toBe(true);
  });

  test('returns false when wrong word identified', () => {
    const result = checkErrorIdentification('كِتَابٌ', sampleExercise);
    expect(result).toBe(false);
  });
});

// ============================================================================
// generateErrorCorrectionExercises Tests
// ============================================================================

describe('generateErrorCorrectionExercises', () => {
  const sampleSentences = [
    { arabic: 'هَذَا كِتَابٌ', english: 'This is a book', lessonId: 'b1-l01' },
    { arabic: 'هَذِهِ سَيَّارَةٌ', english: 'This is a car', lessonId: 'b1-l01' },
    { arabic: 'فِي البَيْتِ', english: 'In the house', lessonId: 'b1-l02' },
    { arabic: 'هُوَ طَالِبٌ', english: 'He is a student', lessonId: 'b1-l03' },
  ];

  test('generates requested number of exercises', () => {
    const exercises = generateErrorCorrectionExercises(sampleSentences, 2);
    expect(exercises.length).toBe(2);
  });

  test('generates all possible exercises when limit is high', () => {
    const exercises = generateErrorCorrectionExercises(sampleSentences, 10);
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.length).toBeLessThanOrEqual(4);
  });

  test('returns empty array for empty input', () => {
    const exercises = generateErrorCorrectionExercises([], 5);
    expect(exercises).toEqual([]);
  });

  test('includes lesson info in generated exercises', () => {
    const exercises = generateErrorCorrectionExercises(sampleSentences, 2);
    exercises.forEach((ex) => {
      expect(ex.id).toMatch(/^err-b1-l0[1-3]-\d+$/);
    });
  });

  test('preserves english hint', () => {
    const exercises = generateErrorCorrectionExercises(sampleSentences, 4);
    const withHint = exercises.find((ex) => ex.englishHint);
    expect(withHint).toBeDefined();
  });
});

// ============================================================================
// getErrorTypeLabel Tests
// ============================================================================

describe('getErrorTypeLabel', () => {
  test('returns English label by default', () => {
    expect(getErrorTypeLabel('gender')).toBe('Gender agreement error');
  });

  test('returns Arabic label when specified', () => {
    expect(getErrorTypeLabel('gender', 'ar')).toBe('خطأ في التذكير والتأنيث');
  });

  test('returns correct label for all error types', () => {
    const errorTypes = Object.keys(ERROR_TYPE_DESCRIPTIONS) as Array<keyof typeof ERROR_TYPE_DESCRIPTIONS>;
    errorTypes.forEach((type) => {
      expect(getErrorTypeLabel(type, 'en')).toBe(ERROR_TYPE_DESCRIPTIONS[type].en);
      expect(getErrorTypeLabel(type, 'ar')).toBe(ERROR_TYPE_DESCRIPTIONS[type].ar);
    });
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('GENDER_PAIRS', () => {
  test('has bidirectional mappings', () => {
    expect(GENDER_PAIRS['هَذَا']).toBe('هَذِهِ');
    expect(GENDER_PAIRS['هَذِهِ']).toBe('هَذَا');
  });

  test('includes all demonstratives', () => {
    expect(GENDER_PAIRS).toHaveProperty('ذَلِكَ');
    expect(GENDER_PAIRS).toHaveProperty('تِلْكَ');
  });

  test('includes pronouns', () => {
    expect(GENDER_PAIRS).toHaveProperty('هُوَ');
    expect(GENDER_PAIRS).toHaveProperty('هِيَ');
    expect(GENDER_PAIRS).toHaveProperty('أَنْتَ');
    expect(GENDER_PAIRS).toHaveProperty('أَنْتِ');
  });
});

describe('ERROR_TYPE_DESCRIPTIONS', () => {
  test('has descriptions for all error types', () => {
    const expectedTypes = [
      'gender',
      'number',
      'case',
      'definiteness',
      'word_order',
      'vocabulary',
      'tashkeel',
      'spelling',
    ];
    expectedTypes.forEach((type) => {
      expect(ERROR_TYPE_DESCRIPTIONS).toHaveProperty(type);
      expect(ERROR_TYPE_DESCRIPTIONS[type as keyof typeof ERROR_TYPE_DESCRIPTIONS]).toHaveProperty('en');
      expect(ERROR_TYPE_DESCRIPTIONS[type as keyof typeof ERROR_TYPE_DESCRIPTIONS]).toHaveProperty('ar');
    });
  });
});
