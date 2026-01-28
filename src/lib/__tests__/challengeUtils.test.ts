import { describe, test, expect } from 'vitest';
import {
  getChallengeConfig,
  reverseExercise,
  applyChallenge,
} from '../challengeUtils';
import type {
  WordToMeaningExercise,
  MeaningToWordExercise,
  FillBlankExercise,
  ChallengeConfig,
} from '../../types/exercise';

describe('getChallengeConfig', () => {
  const mockExercise: FillBlankExercise = {
    id: 'test-ex-1',
    type: 'fill-blank',
    itemIds: ['word-1', 'word-2'],
    prompt: 'Test _____ prompt',
    promptEn: 'Test prompt in English',
    answer: 'test',
  };

  test('returns default config when no items qualify', () => {
    const getStrength = () => 50; // Below threshold
    const config = getChallengeConfig(mockExercise, getStrength);
    
    expect(config.isChallenge).toBe(false);
    expect(config.timerSeconds).toBe(0);
    expect(config.requireTashkeel).toBe(false);
    expect(config.hideEnglishHint).toBe(false);
    expect(config.reversedDirection).toBe(false);
  });

  test('returns default config when only some items qualify', () => {
    const getStrength = (id: string) => (id === 'word-1' ? 90 : 50);
    const config = getChallengeConfig(mockExercise, getStrength);
    
    expect(config.isChallenge).toBe(false);
  });

  test('returns challenge config when ALL items qualify (>=80)', () => {
    const getStrength = () => 80; // At threshold
    const config = getChallengeConfig(mockExercise, getStrength);
    
    expect(config.isChallenge).toBe(true);
    expect(config.timerSeconds).toBe(30);
    expect(config.requireTashkeel).toBe(true);
    expect(config.hideEnglishHint).toBe(true);
  });

  test('returns challenge config when items are above threshold', () => {
    const getStrength = () => 95; // Above threshold
    const config = getChallengeConfig(mockExercise, getStrength);
    
    expect(config.isChallenge).toBe(true);
  });

  test('returns default config when itemIds is empty', () => {
    const emptyExercise = { ...mockExercise, itemIds: [] };
    const getStrength = () => 100;
    const config = getChallengeConfig(emptyExercise, getStrength);
    
    expect(config.isChallenge).toBe(false);
  });
});

describe('reverseExercise', () => {
  test('reverses word-to-meaning to meaning-to-word', () => {
    const exercise: WordToMeaningExercise = {
      id: 'test-1',
      type: 'word-to-meaning',
      itemIds: ['word-1'],
      prompt: 'كِتَاب',
      answer: 'book',
    };

    const reversed = reverseExercise(exercise);
    
    expect(reversed.type).toBe('meaning-to-word');
    expect(reversed.prompt).toBe('book'); // English now the prompt
    expect(reversed.answer).toBe('كِتَاب'); // Arabic now the answer
    expect(reversed.id).toBe('test-1'); // ID preserved
    expect(reversed.itemIds).toEqual(['word-1']); // itemIds preserved
  });

  test('reverses meaning-to-word to word-to-meaning', () => {
    const exercise: MeaningToWordExercise = {
      id: 'test-2',
      type: 'meaning-to-word',
      itemIds: ['word-2'],
      prompt: 'pen',
      answer: 'قَلَم',
    };

    const reversed = reverseExercise(exercise);
    
    expect(reversed.type).toBe('word-to-meaning');
    expect(reversed.prompt).toBe('قَلَم'); // Arabic now the prompt
    expect(reversed.answer).toBe('pen'); // English now the answer
  });
});

describe('applyChallenge', () => {
  const defaultConfig: ChallengeConfig = {
    isChallenge: false,
    timerSeconds: 0,
    requireTashkeel: false,
    hideEnglishHint: false,
    reversedDirection: false,
  };

  const challengeConfigNotReversed: ChallengeConfig = {
    isChallenge: true,
    timerSeconds: 30,
    requireTashkeel: true,
    hideEnglishHint: true,
    reversedDirection: false,
  };

  const challengeConfigReversed: ChallengeConfig = {
    isChallenge: true,
    timerSeconds: 30,
    requireTashkeel: true,
    hideEnglishHint: true,
    reversedDirection: true,
  };

  test('returns exercise unchanged when not reversed', () => {
    const exercise: WordToMeaningExercise = {
      id: 'test-1',
      type: 'word-to-meaning',
      itemIds: ['word-1'],
      prompt: 'كِتَاب',
      answer: 'book',
    };

    const result = applyChallenge(exercise, challengeConfigNotReversed);
    
    expect(result).toEqual(exercise);
  });

  test('returns exercise unchanged for non-reversible types', () => {
    const exercise: FillBlankExercise = {
      id: 'test-1',
      type: 'fill-blank',
      itemIds: ['word-1'],
      prompt: 'Test _____',
      answer: 'test',
    };

    const result = applyChallenge(exercise, challengeConfigReversed);
    
    expect(result).toEqual(exercise); // fill-blank cannot be reversed
  });

  test('reverses word-to-meaning when reversedDirection is true', () => {
    const exercise: WordToMeaningExercise = {
      id: 'test-1',
      type: 'word-to-meaning',
      itemIds: ['word-1'],
      prompt: 'كِتَاب',
      answer: 'book',
    };

    const result = applyChallenge(exercise, challengeConfigReversed) as MeaningToWordExercise;
    
    expect(result.type).toBe('meaning-to-word');
    expect(result.prompt).toBe('book');
    expect(result.answer).toBe('كِتَاب');
  });

  test('reverses meaning-to-word when reversedDirection is true', () => {
    const exercise: MeaningToWordExercise = {
      id: 'test-1',
      type: 'meaning-to-word',
      itemIds: ['word-1'],
      prompt: 'pen',
      answer: 'قَلَم',
    };

    const result = applyChallenge(exercise, challengeConfigReversed) as WordToMeaningExercise;
    
    expect(result.type).toBe('word-to-meaning');
    expect(result.prompt).toBe('قَلَم');
    expect(result.answer).toBe('pen');
  });

  test('returns exercise unchanged when config is default', () => {
    const exercise: WordToMeaningExercise = {
      id: 'test-1',
      type: 'word-to-meaning',
      itemIds: ['word-1'],
      prompt: 'كِتَاب',
      answer: 'book',
    };

    const result = applyChallenge(exercise, defaultConfig);
    
    expect(result).toEqual(exercise);
  });
});
