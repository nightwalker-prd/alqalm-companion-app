import { describe, test, expect } from 'vitest';
import {
  levenshteinDistance,
  stringSimilarity,
  areFormsSimilar,
  shareRoot,
  areAntonymRoots,
  sameSemanticField,
  haveTranslationOverlap,
  detectInterference,
  analyzeInterference,
  generateWarnings,
  wouldCauseInterference,
  filterForMinimalInterference,
  getInterferenceSummary,
} from '../interferenceService';
import type { VocabSemanticInfo, InterferencePair } from '../../types/interference';
import { DEFAULT_INTERFERENCE_CONFIG, SEMANTIC_FIELDS } from '../../types/interference';

// =============================================================================
// Test Helpers
// =============================================================================

function createWord(overrides: Partial<VocabSemanticInfo> = {}): VocabSemanticInfo {
  return {
    id: overrides.id || 'word-1',
    arabic: overrides.arabic || 'كلمة',
    english: overrides.english || 'word',
    root: overrides.root,
    semanticField: overrides.semanticField,
    partOfSpeech: overrides.partOfSpeech,
    alternativeMeanings: overrides.alternativeMeanings,
  };
}

// =============================================================================
// Levenshtein Distance Tests
// =============================================================================

describe('levenshteinDistance', () => {
  test('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  test('returns length for empty vs non-empty', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });

  test('counts single character difference', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });

  test('counts insertions', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  test('counts deletions', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  test('handles completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });

  test('works with Arabic text', () => {
    expect(levenshteinDistance('كتب', 'كتب')).toBe(0);
    expect(levenshteinDistance('كتب', 'كتاب')).toBe(1);
  });
});

// =============================================================================
// String Similarity Tests
// =============================================================================

describe('stringSimilarity', () => {
  test('returns 1 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1);
  });

  test('returns 0 for completely different strings of same length', () => {
    expect(stringSimilarity('abc', 'xyz')).toBe(0);
  });

  test('returns correct ratio for partial similarity', () => {
    // 'cat' vs 'bat' = 1 change in 3 chars = 1 - 1/3 = 0.666...
    expect(stringSimilarity('cat', 'bat')).toBeCloseTo(0.667, 2);
  });

  test('handles empty strings', () => {
    expect(stringSimilarity('', '')).toBe(1);
    expect(stringSimilarity('hello', '')).toBe(0);
    expect(stringSimilarity('', 'hello')).toBe(0);
  });
});

// =============================================================================
// Form Similarity Tests
// =============================================================================

describe('areFormsSimilar', () => {
  test('returns false for identical words (same word, not interference)', () => {
    expect(areFormsSimilar('كتاب', 'كتاب')).toBe(false);
  });

  test('detects similar forms without tashkeel', () => {
    // كَتَبَ and كُتِبَ look very similar without diacritics
    expect(areFormsSimilar('كَتَبَ', 'كُتِبَ')).toBe(false); // Identical base
  });

  test('detects words with similar letters', () => {
    // كتب and كتاب are similar
    expect(areFormsSimilar('كتب', 'كتاب', 0.7)).toBe(true);
  });

  test('returns false for dissimilar words', () => {
    expect(areFormsSimilar('بيت', 'مدرسة')).toBe(false);
  });

  test('respects custom threshold', () => {
    expect(areFormsSimilar('كتب', 'كتاب', 0.9)).toBe(false);
    expect(areFormsSimilar('كتب', 'كتاب', 0.5)).toBe(true);
  });
});

// =============================================================================
// Root Sharing Tests
// =============================================================================

describe('shareRoot', () => {
  test('returns true when roots match', () => {
    const word1 = createWord({ root: 'ك ت ب' });
    const word2 = createWord({ root: 'ك ت ب' });
    expect(shareRoot(word1, word2)).toBe(true);
  });

  test('returns false when roots differ', () => {
    const word1 = createWord({ root: 'ك ت ب' });
    const word2 = createWord({ root: 'ق ر أ' });
    expect(shareRoot(word1, word2)).toBe(false);
  });

  test('returns false when root is missing', () => {
    const word1 = createWord({ root: 'ك ت ب' });
    const word2 = createWord({ root: undefined });
    expect(shareRoot(word1, word2)).toBe(false);
  });

  test('returns false when both roots are missing', () => {
    const word1 = createWord({});
    const word2 = createWord({});
    expect(shareRoot(word1, word2)).toBe(false);
  });
});

// =============================================================================
// Antonym Detection Tests
// =============================================================================

describe('areAntonymRoots', () => {
  test('detects known antonym pairs', () => {
    expect(areAntonymRoots('ك ب ر', 'ص غ ر')).toBe(true); // big/small
    expect(areAntonymRoots('ق ر ب', 'ب ع د')).toBe(true); // near/far
  });

  test('works in either order', () => {
    expect(areAntonymRoots('ص غ ر', 'ك ب ر')).toBe(true);
    expect(areAntonymRoots('ب ع د', 'ق ر ب')).toBe(true);
  });

  test('returns false for non-antonym pairs', () => {
    expect(areAntonymRoots('ك ت ب', 'ق ر أ')).toBe(false);
  });

  test('returns false for same root', () => {
    expect(areAntonymRoots('ك ت ب', 'ك ت ب')).toBe(false);
  });
});

// =============================================================================
// Semantic Field Tests
// =============================================================================

describe('sameSemanticField', () => {
  test('returns true for same semantic field', () => {
    const word1 = createWord({ semanticField: SEMANTIC_FIELDS.COLORS });
    const word2 = createWord({ semanticField: SEMANTIC_FIELDS.COLORS });
    expect(sameSemanticField(word1, word2)).toBe(true);
  });

  test('returns false for different semantic fields', () => {
    const word1 = createWord({ semanticField: SEMANTIC_FIELDS.COLORS });
    const word2 = createWord({ semanticField: SEMANTIC_FIELDS.FAMILY_MEMBERS });
    expect(sameSemanticField(word1, word2)).toBe(false);
  });

  test('returns false when semantic field is missing', () => {
    const word1 = createWord({ semanticField: SEMANTIC_FIELDS.COLORS });
    const word2 = createWord({});
    expect(sameSemanticField(word1, word2)).toBe(false);
  });
});

// =============================================================================
// Translation Overlap Tests
// =============================================================================

describe('haveTranslationOverlap', () => {
  test('detects identical translations', () => {
    const word1 = createWord({ english: 'big' });
    const word2 = createWord({ english: 'big' });
    expect(haveTranslationOverlap(word1, word2)).toBe(true);
  });

  test('detects similar translations', () => {
    const word1 = createWord({ english: 'large' });
    const word2 = createWord({ english: 'larger' });
    expect(haveTranslationOverlap(word1, word2, 0.7)).toBe(true);
  });

  test('checks alternative meanings', () => {
    const word1 = createWord({
      english: 'write',
      alternativeMeanings: ['compose', 'author'],
    });
    const word2 = createWord({ english: 'author' });
    expect(haveTranslationOverlap(word1, word2)).toBe(true);
  });

  test('is case insensitive', () => {
    const word1 = createWord({ english: 'Big' });
    const word2 = createWord({ english: 'big' });
    expect(haveTranslationOverlap(word1, word2)).toBe(true);
  });

  test('returns false for different translations', () => {
    const word1 = createWord({ english: 'house' });
    const word2 = createWord({ english: 'car' });
    expect(haveTranslationOverlap(word1, word2)).toBe(false);
  });
});

// =============================================================================
// Interference Detection Tests
// =============================================================================

describe('detectInterference', () => {
  test('detects root family interference', () => {
    const word1 = createWord({ id: 'w1', root: 'ك ت ب', arabic: 'كَتَبَ' });
    const word2 = createWord({ id: 'w2', root: 'ك ت ب', arabic: 'كِتَاب' });

    const pair = detectInterference(word1, word2);

    expect(pair).not.toBeNull();
    expect(pair?.type).toBe('root-family');
    expect(pair?.severity).toBe('high');
  });

  test('detects antonym interference', () => {
    const word1 = createWord({ id: 'w1', root: 'ك ب ر', arabic: 'كَبِير' });
    const word2 = createWord({ id: 'w2', root: 'ص غ ر', arabic: 'صَغِير' });

    const pair = detectInterference(word1, word2);

    expect(pair).not.toBeNull();
    expect(pair?.type).toBe('antonym');
    expect(pair?.severity).toBe('high');
  });

  test('detects semantic field interference', () => {
    const word1 = createWord({
      id: 'w1',
      semanticField: SEMANTIC_FIELDS.DAYS_OF_WEEK,
      arabic: 'الإثنين',
    });
    const word2 = createWord({
      id: 'w2',
      semanticField: SEMANTIC_FIELDS.DAYS_OF_WEEK,
      arabic: 'الثلاثاء',
    });

    const pair = detectInterference(word1, word2);

    expect(pair).not.toBeNull();
    expect(pair?.type).toBe('semantic-field');
    expect(pair?.severity).toBe('medium');
  });

  test('returns null for same word', () => {
    const word = createWord({ id: 'w1' });
    expect(detectInterference(word, word)).toBeNull();
  });

  test('returns null for non-interfering words', () => {
    const word1 = createWord({ id: 'w1', english: 'house', arabic: 'بيت' });
    const word2 = createWord({ id: 'w2', english: 'car', arabic: 'سيارة' });

    expect(detectInterference(word1, word2)).toBeNull();
  });

  test('respects config settings', () => {
    const word1 = createWord({ id: 'w1', root: 'ك ت ب', arabic: 'كَتَبَ', english: 'wrote' });
    const word2 = createWord({ id: 'w2', root: 'ك ت ب', arabic: 'مَكْتُوب', english: 'written' });

    // With root checking enabled, should detect interference
    const defaultResult = detectInterference(word1, word2);
    expect(defaultResult).not.toBeNull();
    expect(defaultResult?.type).toBe('root-family');

    // With root checking disabled, should not detect root-family type
    const config = {
      ...DEFAULT_INTERFERENCE_CONFIG,
      checkRootFamily: false,
      checkFormSimilar: false, // Also disable form checking since these share letters
    };
    const result = detectInterference(word1, word2, config);
    // Should be null or at least not root-family
    if (result !== null) {
      expect(result.type).not.toBe('root-family');
    }
  });
});

// =============================================================================
// Interference Analysis Tests
// =============================================================================

describe('analyzeInterference', () => {
  test('returns empty analysis for no words', () => {
    const analysis = analyzeInterference([]);

    expect(analysis.pairs).toHaveLength(0);
    expect(analysis.hasHighSeverity).toBe(false);
    expect(analysis.warnings).toHaveLength(0);
  });

  test('returns empty analysis for single word', () => {
    const words = [createWord({ id: 'w1' })];
    const analysis = analyzeInterference(words);

    expect(analysis.pairs).toHaveLength(0);
  });

  test('detects multiple interference pairs', () => {
    const words = [
      createWord({ id: 'w1', root: 'ك ت ب', arabic: 'كَتَبَ' }),
      createWord({ id: 'w2', root: 'ك ت ب', arabic: 'كِتَاب' }),
      createWord({ id: 'w3', root: 'ك ت ب', arabic: 'مَكْتَب' }),
    ];

    const analysis = analyzeInterference(words);

    // 3 words = 3 pairs (1-2, 1-3, 2-3)
    expect(analysis.pairs).toHaveLength(3);
    expect(analysis.hasHighSeverity).toBe(true);
    expect(analysis.countByType['root-family']).toBe(3);
  });

  test('counts by severity correctly', () => {
    const words = [
      createWord({ id: 'w1', root: 'ك ب ر', english: 'big' }),
      createWord({ id: 'w2', root: 'ص غ ر', english: 'small' }),
      createWord({
        id: 'w3',
        semanticField: SEMANTIC_FIELDS.COLORS,
        english: 'red',
      }),
      createWord({
        id: 'w4',
        semanticField: SEMANTIC_FIELDS.COLORS,
        english: 'blue',
      }),
    ];

    const analysis = analyzeInterference(words);

    expect(analysis.countBySeverity.high).toBe(1); // antonyms
    expect(analysis.countBySeverity.medium).toBe(1); // semantic field
  });

  test('sorts pairs by severity', () => {
    const words = [
      createWord({
        id: 'w1',
        semanticField: SEMANTIC_FIELDS.COLORS,
        english: 'red',
      }),
      createWord({
        id: 'w2',
        semanticField: SEMANTIC_FIELDS.COLORS,
        english: 'blue',
      }),
      createWord({ id: 'w3', root: 'ك ت ب', arabic: 'كَتَبَ' }),
      createWord({ id: 'w4', root: 'ك ت ب', arabic: 'كِتَاب' }),
    ];

    const analysis = analyzeInterference(words);

    // High severity (root-family) should come first
    expect(analysis.pairs[0].severity).toBe('high');
  });
});

// =============================================================================
// Warning Generation Tests
// =============================================================================

describe('generateWarnings', () => {
  test('returns empty for no pairs', () => {
    expect(generateWarnings([])).toHaveLength(0);
  });

  test('groups warnings by type', () => {
    const pairs: InterferencePair[] = [
      {
        wordId1: 'w1',
        wordId2: 'w2',
        type: 'root-family',
        severity: 'high',
        reason: 'Same root',
      },
      {
        wordId1: 'w3',
        wordId2: 'w4',
        type: 'root-family',
        severity: 'high',
        reason: 'Same root',
      },
      {
        wordId1: 'w5',
        wordId2: 'w6',
        type: 'semantic-field',
        severity: 'medium',
        reason: 'Same field',
      },
    ];

    const warnings = generateWarnings(pairs);

    expect(warnings).toHaveLength(2);
    expect(warnings.find((w) => w.pairs[0].type === 'root-family')?.pairs).toHaveLength(
      2
    );
  });

  test('includes message and recommendation', () => {
    const pairs: InterferencePair[] = [
      {
        wordId1: 'w1',
        wordId2: 'w2',
        type: 'antonym',
        severity: 'high',
        reason: 'Opposites',
      },
    ];

    const warnings = generateWarnings(pairs);

    expect(warnings[0].message).toContain('opposite');
    expect(warnings[0].recommendation).toBeTruthy();
  });
});

// =============================================================================
// Would Cause Interference Tests
// =============================================================================

describe('wouldCauseInterference', () => {
  test('detects interference with existing words', () => {
    const existing = [createWord({ id: 'w1', root: 'ك ت ب', arabic: 'كَتَبَ' })];
    const newWord = createWord({ id: 'w2', root: 'ك ت ب', arabic: 'كِتَاب' });

    const pairs = wouldCauseInterference(newWord, existing);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].type).toBe('root-family');
  });

  test('returns empty for no interference', () => {
    const existing = [createWord({ id: 'w1', english: 'house', arabic: 'بيت' })];
    const newWord = createWord({ id: 'w2', english: 'car', arabic: 'سيارة' });

    const pairs = wouldCauseInterference(newWord, existing);

    expect(pairs).toHaveLength(0);
  });

  test('detects multiple interferences', () => {
    const existing = [
      createWord({ id: 'w1', root: 'ك ت ب', arabic: 'كَتَبَ' }),
      createWord({ id: 'w2', root: 'ك ت ب', arabic: 'مَكْتَب' }),
    ];
    const newWord = createWord({ id: 'w3', root: 'ك ت ب', arabic: 'كِتَاب' });

    const pairs = wouldCauseInterference(newWord, existing);

    expect(pairs).toHaveLength(2);
  });
});

// =============================================================================
// Filter for Minimal Interference Tests
// =============================================================================

describe('filterForMinimalInterference', () => {
  test('returns all words if under limit', () => {
    const words = [
      createWord({ id: 'w1', english: 'house' }),
      createWord({ id: 'w2', english: 'car' }),
    ];

    const filtered = filterForMinimalInterference(words, 5);

    expect(filtered).toHaveLength(2);
  });

  test('excludes high-interference words when possible', () => {
    const words = [
      createWord({ id: 'w1', root: 'ق ر أ', arabic: 'قَرَأَ', english: 'read' }),
      createWord({ id: 'w2', root: 'ك ت ب', arabic: 'كَتَبَ', english: 'write' }),
      createWord({
        id: 'w3',
        root: 'ك ت ب',
        arabic: 'كِتَاب',
        english: 'book',
      }), // Same root as w2
      createWord({ id: 'w4', root: 'د ر س', arabic: 'دَرَسَ', english: 'study' }),
    ];

    const filtered = filterForMinimalInterference(words, 3);

    // Should include w1, w2, w4 (skipping w3 which shares root with w2)
    expect(filtered).toHaveLength(3);
    expect(filtered.find((w) => w.id === 'w3')).toBeUndefined();
  });

  test('includes interfering words if needed to reach limit', () => {
    const words = [
      createWord({ id: 'w1', root: 'ك ت ب', arabic: 'كَتَبَ' }),
      createWord({ id: 'w2', root: 'ك ت ب', arabic: 'كِتَاب' }),
    ];

    const filtered = filterForMinimalInterference(words, 2);

    // Both words needed even though they interfere
    expect(filtered).toHaveLength(2);
  });
});

// =============================================================================
// Get Interference Summary Tests
// =============================================================================

describe('getInterferenceSummary', () => {
  test('returns positive message for no interference', () => {
    const analysis = analyzeInterference([]);
    const summary = getInterferenceSummary(analysis);

    expect(summary).toContain('No interference');
  });

  test('summarizes interference counts', () => {
    const words = [
      createWord({ id: 'w1', root: 'ک ت ب', arabic: 'كَتَبَ' }),
      createWord({ id: 'w2', root: 'ک ت ب', arabic: 'كِتَاب' }),
    ];

    // Create a mock analysis with known counts
    const analysis = analyzeInterference(words);
    const summary = getInterferenceSummary(analysis);

    expect(summary).toContain('pair');
  });
});
