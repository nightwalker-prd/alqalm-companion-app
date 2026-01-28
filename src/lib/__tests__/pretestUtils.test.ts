import { describe, test, expect } from 'vitest';
import {
  generatePreTestExercises,
  checkPreTestAnswer,
  calculatePreTestResult,
  getPreTestFeedback,
  shouldOfferPreTest,
  countNewVocabulary,
  extractPreTestableExercises,
  DEFAULT_PRETEST_CONFIG,
  type VocabItem,
  type PreTestExercise,
  type PreTestItemResult,
} from '../pretestUtils';
import type { Exercise } from '../../types/exercise';

// Helper to create mock vocabulary items
function mockVocab(id: string, arabic: string, english: string, lesson = 'b1-l01'): VocabItem {
  return {
    id,
    arabic,
    english,
    root: null,
    lesson,
    partOfSpeech: 'noun',
  };
}

describe('generatePreTestExercises', () => {
  const lessonVocab: VocabItem[] = [
    mockVocab('w1', 'كِتَاب', 'book'),
    mockVocab('w2', 'قَلَم', 'pen'),
    mockVocab('w3', 'بَيْت', 'house'),
    mockVocab('w4', 'بَاب', 'door'),
    mockVocab('w5', 'نَافِذَة', 'window'),
    mockVocab('w6', 'كُرْسِي', 'chair'),
  ];

  const allVocab: VocabItem[] = [
    ...lessonVocab,
    mockVocab('w7', 'مَدْرَسَة', 'school', 'b1-l02'),
    mockVocab('w8', 'مَسْجِد', 'mosque', 'b1-l02'),
    mockVocab('w9', 'سَيَّارَة', 'car', 'b1-l03'),
    mockVocab('w10', 'طَاوِلَة', 'table', 'b1-l03'),
  ];

  test('returns empty array for empty vocabulary', () => {
    const result = generatePreTestExercises([], allVocab);
    expect(result).toEqual([]);
  });

  test('generates exercises up to maxQuestions limit', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab, { maxQuestions: 4, recognitionRatio: 0.5 });
    expect(result.length).toBe(4);
  });

  test('generates fewer exercises if vocabulary is smaller than maxQuestions', () => {
    const smallVocab = lessonVocab.slice(0, 2);
    const result = generatePreTestExercises(smallVocab, allVocab, { maxQuestions: 6, recognitionRatio: 0.5 });
    expect(result.length).toBe(2);
  });

  test('generates mix of recognition and production exercises', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab, { maxQuestions: 6, recognitionRatio: 0.5 });
    
    const recognitionCount = result.filter(e => e.type === 'pretest-recognize').length;
    const productionCount = result.filter(e => e.type === 'pretest-produce').length;
    
    expect(recognitionCount).toBe(3); // 50% of 6
    expect(productionCount).toBe(3);
  });

  test('recognition exercises have 4 options with correct answer included', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab, { maxQuestions: 6, recognitionRatio: 1.0 });
    
    for (const exercise of result) {
      if (exercise.type === 'pretest-recognize') {
        expect(exercise.options).toBeDefined();
        expect(exercise.options!.length).toBe(4);
        expect(exercise.correctIndex).toBeDefined();
        expect(exercise.options![exercise.correctIndex!]).toBe(exercise.english);
      }
    }
  });

  test('production exercises do not have options', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab, { maxQuestions: 6, recognitionRatio: 0.0 });
    
    for (const exercise of result) {
      expect(exercise.type).toBe('pretest-produce');
      expect(exercise.options).toBeUndefined();
      expect(exercise.correctIndex).toBeUndefined();
    }
  });

  test('uses default config when not specified', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab);
    expect(result.length).toBeLessThanOrEqual(DEFAULT_PRETEST_CONFIG.maxQuestions);
  });

  test('all exercises have unique IDs', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab);
    const ids = result.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('exercises contain valid vocab data', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab);
    
    for (const exercise of result) {
      expect(exercise.vocabId).toBeTruthy();
      expect(exercise.arabic).toBeTruthy();
      expect(exercise.english).toBeTruthy();
    }
  });

  test('distractors are from different lessons when possible', () => {
    const result = generatePreTestExercises(lessonVocab, allVocab, { maxQuestions: 1, recognitionRatio: 1.0 });
    
    const exercise = result[0];
    if (exercise.type === 'pretest-recognize' && exercise.options) {
      // The correct answer should be the only one from the lesson
      const correctAnswer = exercise.options[exercise.correctIndex!];
      const distractors = exercise.options.filter((_, i) => i !== exercise.correctIndex);
      
      // All distractors should be from allVocab (other lessons)
      for (const distractor of distractors) {
        const vocabItem = allVocab.find(v => v.english === distractor);
        expect(vocabItem).toBeDefined();
        // Should be from a different lesson (if enough candidates)
        if (vocabItem && vocabItem.lesson === 'b1-l01') {
          // This could happen if not enough distractors from other lessons
          // but the correct answer should not be repeated
          expect(distractor).not.toBe(correctAnswer);
        }
      }
    }
  });
});

describe('checkPreTestAnswer', () => {
  test('recognition: returns true for correct index', () => {
    const exercise: PreTestExercise = {
      id: 'test-1',
      type: 'pretest-recognize',
      vocabId: 'w1',
      arabic: 'كِتَاب',
      english: 'book',
      options: ['pen', 'book', 'house', 'door'],
      correctIndex: 1,
    };
    
    expect(checkPreTestAnswer(exercise, 1)).toBe(true);
    expect(checkPreTestAnswer(exercise, 0)).toBe(false);
    expect(checkPreTestAnswer(exercise, 2)).toBe(false);
  });

  test('production: returns true for exact Arabic match', () => {
    const exercise: PreTestExercise = {
      id: 'test-1',
      type: 'pretest-produce',
      vocabId: 'w1',
      arabic: 'كِتَاب',
      english: 'book',
    };
    
    expect(checkPreTestAnswer(exercise, 'كِتَاب')).toBe(true);
  });

  test('production: returns true when tashkeel differs', () => {
    const exercise: PreTestExercise = {
      id: 'test-1',
      type: 'pretest-produce',
      vocabId: 'w1',
      arabic: 'كِتَاب',
      english: 'book',
    };
    
    // Without tashkeel
    expect(checkPreTestAnswer(exercise, 'كتاب')).toBe(true);
  });

  test('production: returns true for whitespace differences', () => {
    const exercise: PreTestExercise = {
      id: 'test-1',
      type: 'pretest-produce',
      vocabId: 'w1',
      arabic: 'الْبَيْت',
      english: 'the house',
    };
    
    expect(checkPreTestAnswer(exercise, ' الْبَيْت ')).toBe(true);
    expect(checkPreTestAnswer(exercise, 'البيت')).toBe(true);
  });

  test('production: returns false for wrong word', () => {
    const exercise: PreTestExercise = {
      id: 'test-1',
      type: 'pretest-produce',
      vocabId: 'w1',
      arabic: 'كِتَاب',
      english: 'book',
    };
    
    expect(checkPreTestAnswer(exercise, 'قلم')).toBe(false);
    expect(checkPreTestAnswer(exercise, 'book')).toBe(false);
  });
});

describe('calculatePreTestResult', () => {
  test('calculates correct totals', () => {
    const items: PreTestItemResult[] = [
      { vocabId: 'w1', wasCorrect: true, userAnswer: 'book', correctAnswer: 'book' },
      { vocabId: 'w2', wasCorrect: false, userAnswer: 'pen', correctAnswer: 'pencil' },
      { vocabId: 'w3', wasCorrect: true, userAnswer: 'house', correctAnswer: 'house' },
      { vocabId: 'w4', wasCorrect: false, userAnswer: 'window', correctAnswer: 'door' },
    ];
    
    const result = calculatePreTestResult('b1-l01', items);
    
    expect(result.lessonId).toBe('b1-l01');
    expect(result.totalCorrect).toBe(2);
    expect(result.totalQuestions).toBe(4);
    expect(result.items).toBe(items);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  test('identifies failed vocab IDs', () => {
    const items: PreTestItemResult[] = [
      { vocabId: 'w1', wasCorrect: true, userAnswer: 'book', correctAnswer: 'book' },
      { vocabId: 'w2', wasCorrect: false, userAnswer: 'pen', correctAnswer: 'pencil' },
      { vocabId: 'w3', wasCorrect: false, userAnswer: 'home', correctAnswer: 'house' },
    ];
    
    const result = calculatePreTestResult('b1-l01', items);
    
    expect(result.failedVocabIds).toEqual(['w2', 'w3']);
  });

  test('handles all correct answers', () => {
    const items: PreTestItemResult[] = [
      { vocabId: 'w1', wasCorrect: true, userAnswer: 'book', correctAnswer: 'book' },
      { vocabId: 'w2', wasCorrect: true, userAnswer: 'pen', correctAnswer: 'pen' },
    ];
    
    const result = calculatePreTestResult('b1-l01', items);
    
    expect(result.totalCorrect).toBe(2);
    expect(result.failedVocabIds).toEqual([]);
  });

  test('handles all incorrect answers', () => {
    const items: PreTestItemResult[] = [
      { vocabId: 'w1', wasCorrect: false, userAnswer: 'wrong', correctAnswer: 'book' },
      { vocabId: 'w2', wasCorrect: false, userAnswer: 'wrong', correctAnswer: 'pen' },
    ];
    
    const result = calculatePreTestResult('b1-l01', items);
    
    expect(result.totalCorrect).toBe(0);
    expect(result.failedVocabIds).toEqual(['w1', 'w2']);
  });

  test('handles empty items array', () => {
    const result = calculatePreTestResult('b1-l01', []);
    
    expect(result.totalCorrect).toBe(0);
    expect(result.totalQuestions).toBe(0);
    expect(result.failedVocabIds).toEqual([]);
  });
});

describe('getPreTestFeedback', () => {
  test('returns perfect feedback for 100%', () => {
    const result = {
      lessonId: 'b1-l01',
      timestamp: Date.now(),
      items: [],
      totalCorrect: 5,
      totalQuestions: 5,
      failedVocabIds: [],
    };
    
    const feedback = getPreTestFeedback(result);
    
    expect(feedback.title).toBe('Perfect!');
    expect(feedback.message).toContain('already know');
  });

  test('returns good start feedback for 70%+', () => {
    const result = {
      lessonId: 'b1-l01',
      timestamp: Date.now(),
      items: [],
      totalCorrect: 4,
      totalQuestions: 5,
      failedVocabIds: ['w1'],
    };
    
    const feedback = getPreTestFeedback(result);
    
    expect(feedback.title).toBe('Good Start!');
    expect(feedback.message).toContain('4 of 5');
  });

  test('returns nice effort feedback for 40-69%', () => {
    const result = {
      lessonId: 'b1-l01',
      timestamp: Date.now(),
      items: [],
      totalCorrect: 3,
      totalQuestions: 6,
      failedVocabIds: ['w1', 'w2', 'w3'],
    };
    
    const feedback = getPreTestFeedback(result);
    
    expect(feedback.title).toBe('Nice Effort!');
    expect(feedback.encouragement).toContain('struggling now helps');
  });

  test('returns great preparation feedback for low scores', () => {
    const result = {
      lessonId: 'b1-l01',
      timestamp: Date.now(),
      items: [],
      totalCorrect: 1,
      totalQuestions: 6,
      failedVocabIds: ['w1', 'w2', 'w3', 'w4', 'w5'],
    };
    
    const feedback = getPreTestFeedback(result);
    
    expect(feedback.title).toBe('Great Preparation!');
    expect(feedback.encouragement).toContain('10-20%');
  });

  test('handles zero questions gracefully', () => {
    const result = {
      lessonId: 'b1-l01',
      timestamp: Date.now(),
      items: [],
      totalCorrect: 0,
      totalQuestions: 0,
      failedVocabIds: [],
    };
    
    const feedback = getPreTestFeedback(result);
    
    // Should return low score feedback (0%)
    expect(feedback.title).toBe('Great Preparation!');
  });
});

describe('shouldOfferPreTest', () => {
  test('returns false if pre-test already completed', () => {
    const completedPreTests = new Set(['b1-l01']);
    expect(shouldOfferPreTest('b1-l01', completedPreTests, 5, 5)).toBe(false);
  });

  test('returns true if pre-test not completed and mostly new vocab', () => {
    const completedPreTests = new Set<string>();
    expect(shouldOfferPreTest('b1-l01', completedPreTests, 5, 6)).toBe(true);
  });

  test('returns false if mostly review material (less than 50% new)', () => {
    const completedPreTests = new Set<string>();
    expect(shouldOfferPreTest('b1-l01', completedPreTests, 2, 10)).toBe(false);
  });

  test('returns true at exactly 50% new vocab', () => {
    const completedPreTests = new Set<string>();
    expect(shouldOfferPreTest('b1-l01', completedPreTests, 5, 10)).toBe(true);
  });

  test('handles zero total vocab', () => {
    const completedPreTests = new Set<string>();
    expect(shouldOfferPreTest('b1-l01', completedPreTests, 0, 0)).toBe(false);
  });
});

describe('countNewVocabulary', () => {
  test('counts words not in mastered set', () => {
    const lessonVocabIds = ['w1', 'w2', 'w3', 'w4', 'w5'];
    const masteredVocabIds = new Set(['w1', 'w3']);
    
    expect(countNewVocabulary(lessonVocabIds, masteredVocabIds)).toBe(3);
  });

  test('returns all when none mastered', () => {
    const lessonVocabIds = ['w1', 'w2', 'w3'];
    const masteredVocabIds = new Set<string>();
    
    expect(countNewVocabulary(lessonVocabIds, masteredVocabIds)).toBe(3);
  });

  test('returns zero when all mastered', () => {
    const lessonVocabIds = ['w1', 'w2', 'w3'];
    const masteredVocabIds = new Set(['w1', 'w2', 'w3', 'w4']);
    
    expect(countNewVocabulary(lessonVocabIds, masteredVocabIds)).toBe(0);
  });

  test('handles empty lesson vocab', () => {
    const lessonVocabIds: string[] = [];
    const masteredVocabIds = new Set(['w1', 'w2']);
    
    expect(countNewVocabulary(lessonVocabIds, masteredVocabIds)).toBe(0);
  });
});

describe('extractPreTestableExercises', () => {
  test('extracts word-to-meaning and meaning-to-word exercises', () => {
    const exercises: Exercise[] = [
      { type: 'word-to-meaning', id: '1', itemIds: ['w1'], prompt: 'كتاب', answer: 'book' },
      { type: 'meaning-to-word', id: '2', itemIds: ['w2'], prompt: 'pen', answer: 'قلم' },
      { type: 'fill-blank', id: '3', itemIds: ['w3'], prompt: 'test ___', answer: 'test' },
      { type: 'translate-to-arabic', id: '4', itemIds: ['w4'], prompt: 'test', answer: 'اختبار' },
    ];
    
    const result = extractPreTestableExercises(exercises);
    
    expect(result.length).toBe(2);
    expect(result.every(e => e.type === 'word-to-meaning' || e.type === 'meaning-to-word')).toBe(true);
  });

  test('returns empty array when no matching exercises', () => {
    const exercises: Exercise[] = [
      { type: 'fill-blank', id: '1', itemIds: ['w1'], prompt: 'test ___', answer: 'test' },
    ];
    
    const result = extractPreTestableExercises(exercises);
    
    expect(result).toEqual([]);
  });

  test('handles empty array', () => {
    expect(extractPreTestableExercises([])).toEqual([]);
  });
});

describe('DEFAULT_PRETEST_CONFIG', () => {
  test('has reasonable defaults', () => {
    expect(DEFAULT_PRETEST_CONFIG.maxQuestions).toBe(6);
    expect(DEFAULT_PRETEST_CONFIG.recognitionRatio).toBe(0.7);
  });
});
