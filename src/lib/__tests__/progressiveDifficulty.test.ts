import { describe, test, expect } from 'vitest';
import {
  getDifficultyLevel,
  checkRegression,
  calculateDirectionalStrength,
  getExerciseDirection,
  getPriorityDirection,
  selectExerciseType,
  updateDirectionalStrength,
  getCombinedStrength,
  needsRecognitionPractice,
  needsProductionPractice,
  getDifficultyDescription,
  getDifficultyDisplay,
  DIFFICULTY_THRESHOLDS,
  STRENGTH_CHANGES,
  DEFAULT_DIRECTIONAL_STRENGTH,
  type DirectionalStrength,
} from '../progressiveDifficulty';
import type { ExerciseType } from '../../types/exercise';

describe('getDifficultyLevel', () => {
  test('returns recognition for strength 0', () => {
    expect(getDifficultyLevel(0)).toBe('recognition');
  });

  test('returns recognition for strength below threshold', () => {
    expect(getDifficultyLevel(39)).toBe('recognition');
  });

  test('returns cued_recall at recognition threshold', () => {
    expect(getDifficultyLevel(40)).toBe('cued_recall');
  });

  test('returns cued_recall for mid-range strength', () => {
    expect(getDifficultyLevel(55)).toBe('cued_recall');
  });

  test('returns free_recall at cued threshold', () => {
    expect(getDifficultyLevel(70)).toBe('free_recall');
  });

  test('returns free_recall for high strength', () => {
    expect(getDifficultyLevel(100)).toBe('free_recall');
  });
});

describe('checkRegression', () => {
  test('does not regress from recognition', () => {
    expect(checkRegression('recognition', 0)).toBe('recognition');
    expect(checkRegression('recognition', 20)).toBe('recognition');
  });

  test('does not regress from cued_recall if above buffer', () => {
    // Threshold is 40, buffer is 10, so should stay at cued_recall >= 30
    expect(checkRegression('cued_recall', 35)).toBe('cued_recall');
    expect(checkRegression('cued_recall', 40)).toBe('cued_recall');
  });

  test('regresses from cued_recall to recognition if below buffer', () => {
    // Should regress if < 40 - 10 = 30
    expect(checkRegression('cued_recall', 29)).toBe('recognition');
    expect(checkRegression('cued_recall', 20)).toBe('recognition');
  });

  test('does not regress from free_recall if above buffer', () => {
    // Threshold is 70, buffer is 10, so should stay at free_recall >= 60
    expect(checkRegression('free_recall', 65)).toBe('free_recall');
    expect(checkRegression('free_recall', 70)).toBe('free_recall');
  });

  test('regresses from free_recall to cued_recall if below buffer', () => {
    // Should regress if < 70 - 10 = 60
    expect(checkRegression('free_recall', 59)).toBe('cued_recall');
    expect(checkRegression('free_recall', 45)).toBe('cued_recall');
  });
});

describe('calculateDirectionalStrength', () => {
  describe('recognition level', () => {
    test('adds 5 for correct answer', () => {
      expect(calculateDirectionalStrength(0, true, 'recognition')).toBe(5);
      expect(calculateDirectionalStrength(50, true, 'recognition')).toBe(55);
    });

    test('subtracts 10 for incorrect answer', () => {
      expect(calculateDirectionalStrength(50, false, 'recognition')).toBe(40);
      expect(calculateDirectionalStrength(20, false, 'recognition')).toBe(10);
    });
  });

  describe('cued_recall level', () => {
    test('adds 10 for correct answer', () => {
      expect(calculateDirectionalStrength(40, true, 'cued_recall')).toBe(50);
    });

    test('subtracts 15 for incorrect answer', () => {
      expect(calculateDirectionalStrength(50, false, 'cued_recall')).toBe(35);
    });
  });

  describe('free_recall level', () => {
    test('adds 15 for correct answer', () => {
      expect(calculateDirectionalStrength(70, true, 'free_recall')).toBe(85);
    });

    test('subtracts 10 for incorrect answer', () => {
      expect(calculateDirectionalStrength(80, false, 'free_recall')).toBe(70);
    });
  });

  test('clamps to minimum 0', () => {
    expect(calculateDirectionalStrength(5, false, 'recognition')).toBe(0);
    expect(calculateDirectionalStrength(0, false, 'cued_recall')).toBe(0);
  });

  test('clamps to maximum 100', () => {
    expect(calculateDirectionalStrength(98, true, 'free_recall')).toBe(100);
    expect(calculateDirectionalStrength(100, true, 'recognition')).toBe(100);
  });
});

describe('getExerciseDirection', () => {
  test('word-to-meaning is recognition', () => {
    expect(getExerciseDirection('word-to-meaning')).toBe('recognition');
  });

  test('meaning-to-word is production', () => {
    expect(getExerciseDirection('meaning-to-word')).toBe('production');
  });

  test('fill-blank is production', () => {
    expect(getExerciseDirection('fill-blank')).toBe('production');
  });

  test('translate-to-arabic is production', () => {
    expect(getExerciseDirection('translate-to-arabic')).toBe('production');
  });

  test('construct-sentence is production', () => {
    expect(getExerciseDirection('construct-sentence')).toBe('production');
  });

  test('grammar-apply is production', () => {
    expect(getExerciseDirection('grammar-apply')).toBe('production');
  });
});

describe('getPriorityDirection', () => {
  test('prioritizes recognition when it is weak', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 30,
      productionStrength: 10,
    };
    expect(getPriorityDirection(strength)).toBe('recognition');
  });

  test('prioritizes production when recognition is strong but production is weak', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 60,
      productionStrength: 30,
    };
    expect(getPriorityDirection(strength)).toBe('production');
  });

  test('prioritizes recognition when both are strong', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 80,
      productionStrength: 75,
    };
    expect(getPriorityDirection(strength)).toBe('recognition');
  });

  test('prioritizes production when balanced but production is not mastered', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 50,
      productionStrength: 45,
    };
    expect(getPriorityDirection(strength)).toBe('production');
  });
});

describe('selectExerciseType', () => {
  const allTypes: ExerciseType[] = [
    'word-to-meaning',
    'meaning-to-word',
    'fill-blank',
    'translate-to-arabic',
  ];

  test('returns null for empty exercise types', () => {
    expect(selectExerciseType([], DEFAULT_DIRECTIONAL_STRENGTH)).toBeNull();
  });

  test('selects recognition exercise for new word', () => {
    const result = selectExerciseType(allTypes, DEFAULT_DIRECTIONAL_STRENGTH);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('recognition');
    expect(result!.difficultyLevel).toBe('recognition');
    expect(result!.useWordBank).toBe(true);
    expect(result!.showHints).toBe(true);
  });

  test('selects production exercise when recognition is strong', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 60,
      productionStrength: 20,
    };
    const result = selectExerciseType(allTypes, strength);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('production');
  });

  test('respects preferred direction', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 20,
      productionStrength: 10,
    };
    const result = selectExerciseType(allTypes, strength, 'production');
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('production');
  });

  test('falls back to available types if no matching direction', () => {
    const recognitionOnly: ExerciseType[] = ['word-to-meaning'];
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 80,
      productionStrength: 20,
    };
    // Would prefer production, but only recognition is available
    const result = selectExerciseType(recognitionOnly, strength);
    expect(result).not.toBeNull();
    expect(result!.exerciseType).toBe('word-to-meaning');
  });

  test('sets showHints false for free_recall', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 80,
      productionStrength: 75,
      recognitionLevel: 'free_recall',
    };
    const result = selectExerciseType(allTypes, strength, 'recognition');
    expect(result).not.toBeNull();
    expect(result!.difficultyLevel).toBe('free_recall');
    expect(result!.showHints).toBe(false);
    expect(result!.useWordBank).toBe(false);
  });
});

describe('updateDirectionalStrength', () => {
  test('updates recognition strength on correct recognition exercise', () => {
    const current = { ...DEFAULT_DIRECTIONAL_STRENGTH };
    const updated = updateDirectionalStrength(current, 'recognition', true, 'recognition');
    
    expect(updated.recognitionStrength).toBe(5);
    expect(updated.productionStrength).toBe(0);
    expect(updated.lastRecognitionPractice).not.toBeNull();
    expect(updated.lastProductionPractice).toBeNull();
  });

  test('updates production strength on incorrect production exercise', () => {
    const current: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      productionStrength: 50,
      productionLevel: 'cued_recall',
    };
    const updated = updateDirectionalStrength(current, 'production', false, 'cued_recall');
    
    expect(updated.productionStrength).toBe(35); // 50 - 15
    expect(updated.recognitionStrength).toBe(0);
    expect(updated.lastProductionPractice).not.toBeNull();
  });

  test('updates level when crossing threshold', () => {
    const current: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 38,
      recognitionLevel: 'recognition',
    };
    const updated = updateDirectionalStrength(current, 'recognition', true, 'recognition');
    
    expect(updated.recognitionStrength).toBe(43); // 38 + 5
    expect(updated.recognitionLevel).toBe('cued_recall');
  });

  test('regresses level when dropping below threshold', () => {
    const current: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      productionStrength: 35,
      productionLevel: 'cued_recall',
    };
    const updated = updateDirectionalStrength(current, 'production', false, 'cued_recall');
    
    expect(updated.productionStrength).toBe(20); // 35 - 15
    expect(updated.productionLevel).toBe('recognition'); // regressed
  });
});

describe('getCombinedStrength', () => {
  test('returns 0 for default strength', () => {
    expect(getCombinedStrength(DEFAULT_DIRECTIONAL_STRENGTH)).toBe(0);
  });

  test('weights production more heavily (70%)', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 100,
      productionStrength: 0,
    };
    expect(getCombinedStrength(strength)).toBe(30); // 100 * 0.3 + 0 * 0.7
  });

  test('calculates correctly for mixed strengths', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 80,
      productionStrength: 60,
    };
    // 80 * 0.3 + 60 * 0.7 = 24 + 42 = 66
    expect(getCombinedStrength(strength)).toBe(66);
  });

  test('returns 100 for max strengths', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 100,
      productionStrength: 100,
    };
    expect(getCombinedStrength(strength)).toBe(100);
  });
});

describe('needsRecognitionPractice', () => {
  test('returns true for weak recognition', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 30,
      recognitionLevel: 'recognition',
    };
    expect(needsRecognitionPractice(strength, 0)).toBe(true);
  });

  test('returns true when overdue at recognition level', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 50,
      recognitionLevel: 'recognition',
    };
    expect(needsRecognitionPractice(strength, 1)).toBe(true);
  });

  test('returns false when not overdue at recognition level', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 50,
      recognitionLevel: 'recognition',
    };
    expect(needsRecognitionPractice(strength, 0)).toBe(false);
  });

  test('returns true when overdue at free_recall level (7 days)', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 80,
      recognitionLevel: 'free_recall',
    };
    expect(needsRecognitionPractice(strength, 7)).toBe(true);
    expect(needsRecognitionPractice(strength, 6)).toBe(false);
  });
});

describe('needsProductionPractice', () => {
  test('returns false if recognition is too weak', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 30,
      productionStrength: 10,
    };
    expect(needsProductionPractice(strength, 0)).toBe(false);
  });

  test('returns true for weak production when recognition is adequate', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 50,
      productionStrength: 30,
      productionLevel: 'recognition',
    };
    expect(needsProductionPractice(strength, 0)).toBe(true);
  });

  test('returns true when overdue at production level', () => {
    const strength: DirectionalStrength = {
      ...DEFAULT_DIRECTIONAL_STRENGTH,
      recognitionStrength: 50,
      productionStrength: 50,
      productionLevel: 'cued_recall',
    };
    expect(needsProductionPractice(strength, 2)).toBe(true);
    expect(needsProductionPractice(strength, 1)).toBe(false);
  });
});

describe('getDifficultyDescription', () => {
  test('returns correct description for recognition', () => {
    expect(getDifficultyDescription('recognition')).toBe('Choose from options');
  });

  test('returns correct description for cued_recall', () => {
    expect(getDifficultyDescription('cued_recall')).toBe('Fill in with hints');
  });

  test('returns correct description for free_recall', () => {
    expect(getDifficultyDescription('free_recall')).toBe('Type from memory');
  });
});

describe('getDifficultyDisplay', () => {
  test('returns Easy label for recognition', () => {
    const display = getDifficultyDisplay('recognition');
    expect(display.label).toBe('Easy');
    expect(display.color).toBe('text-green-600');
    expect(display.icon).toBe('1');
  });

  test('returns Medium label for cued_recall', () => {
    const display = getDifficultyDisplay('cued_recall');
    expect(display.label).toBe('Medium');
    expect(display.color).toBe('text-yellow-600');
    expect(display.icon).toBe('2');
  });

  test('returns Hard label for free_recall', () => {
    const display = getDifficultyDisplay('free_recall');
    expect(display.label).toBe('Hard');
    expect(display.color).toBe('text-red-600');
    expect(display.icon).toBe('3');
  });
});

describe('constants', () => {
  test('DIFFICULTY_THRESHOLDS has expected values', () => {
    expect(DIFFICULTY_THRESHOLDS.RECOGNITION_TO_CUED).toBe(40);
    expect(DIFFICULTY_THRESHOLDS.CUED_TO_FREE).toBe(70);
    expect(DIFFICULTY_THRESHOLDS.REGRESSION_BUFFER).toBe(10);
  });

  test('STRENGTH_CHANGES has expected values', () => {
    expect(STRENGTH_CHANGES.recognition.correct).toBe(5);
    expect(STRENGTH_CHANGES.recognition.incorrect).toBe(-10);
    expect(STRENGTH_CHANGES.cued_recall.correct).toBe(10);
    expect(STRENGTH_CHANGES.cued_recall.incorrect).toBe(-15);
    expect(STRENGTH_CHANGES.free_recall.correct).toBe(15);
    expect(STRENGTH_CHANGES.free_recall.incorrect).toBe(-10);
  });

  test('DEFAULT_DIRECTIONAL_STRENGTH has expected values', () => {
    expect(DEFAULT_DIRECTIONAL_STRENGTH.recognitionStrength).toBe(0);
    expect(DEFAULT_DIRECTIONAL_STRENGTH.productionStrength).toBe(0);
    expect(DEFAULT_DIRECTIONAL_STRENGTH.recognitionLevel).toBe('recognition');
    expect(DEFAULT_DIRECTIONAL_STRENGTH.productionLevel).toBe('recognition');
    expect(DEFAULT_DIRECTIONAL_STRENGTH.lastRecognitionPractice).toBeNull();
    expect(DEFAULT_DIRECTIONAL_STRENGTH.lastProductionPractice).toBeNull();
  });
});
