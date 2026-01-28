/**
 * Interference Detection Service
 *
 * Detects potential interference between vocabulary items to warn learners
 * about words that should not be learned together.
 *
 * Based on Paul Nation's research:
 * - Synonyms learned together interfere (learn 'big' fully before 'large')
 * - Antonyms cause confusion when presented together
 * - Semantic sets (days, colors) should be spread out over time
 * - Similar forms (spelling/sound) cause cross-association
 */

import type {
  InterferenceType,
  InterferenceSeverity,
  InterferencePair,
  InterferenceWarning,
  VocabSemanticInfo,
  InterferenceConfig,
  InterferenceAnalysis,
} from '../types/interference';

import {
  DEFAULT_INTERFERENCE_CONFIG,
  SEVERITY_ORDER,
  COMMON_ANTONYM_ROOTS,
} from '../types/interference';

import { removeTashkeel } from './arabic';

// ============================================================================
// Similarity Detection Functions
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Used to detect similar-looking words
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Check if two Arabic words have similar forms
 * Compares without tashkeel to catch core form similarities
 */
export function areFormsSimilar(
  arabic1: string,
  arabic2: string,
  threshold: number = 0.7
): boolean {
  const normalized1 = removeTashkeel(arabic1);
  const normalized2 = removeTashkeel(arabic2);

  // Exact match after normalization
  if (normalized1 === normalized2) return false; // Same word, not interference

  return stringSimilarity(normalized1, normalized2) >= threshold;
}

/**
 * Check if two words share the same root
 */
export function shareRoot(
  word1: VocabSemanticInfo,
  word2: VocabSemanticInfo
): boolean {
  if (!word1.root || !word2.root) return false;
  return word1.root === word2.root;
}

/**
 * Check if two roots are known antonyms
 */
export function areAntonymRoots(root1: string, root2: string): boolean {
  for (const [r1, r2] of COMMON_ANTONYM_ROOTS) {
    if ((root1 === r1 && root2 === r2) || (root1 === r2 && root2 === r1)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if two words are in the same semantic field
 */
export function sameSemanticField(
  word1: VocabSemanticInfo,
  word2: VocabSemanticInfo
): boolean {
  if (!word1.semanticField || !word2.semanticField) return false;
  return word1.semanticField === word2.semanticField;
}

/**
 * Check if two words have overlapping English translations
 */
export function haveTranslationOverlap(
  word1: VocabSemanticInfo,
  word2: VocabSemanticInfo,
  threshold: number = 0.8
): boolean {
  // Check primary meanings
  const similarity = stringSimilarity(
    word1.english.toLowerCase(),
    word2.english.toLowerCase()
  );
  if (similarity >= threshold) return true;

  // Check alternative meanings
  const allMeanings1 = [word1.english, ...(word1.alternativeMeanings || [])].map(
    (m) => m.toLowerCase()
  );
  const allMeanings2 = [word2.english, ...(word2.alternativeMeanings || [])].map(
    (m) => m.toLowerCase()
  );

  for (const m1 of allMeanings1) {
    for (const m2 of allMeanings2) {
      if (stringSimilarity(m1, m2) >= threshold) return true;
    }
  }

  return false;
}

// ============================================================================
// Interference Detection
// ============================================================================

/**
 * Detect interference between two vocabulary items
 */
export function detectInterference(
  word1: VocabSemanticInfo,
  word2: VocabSemanticInfo,
  config: InterferenceConfig = DEFAULT_INTERFERENCE_CONFIG
): InterferencePair | null {
  // Skip if same word
  if (word1.id === word2.id) return null;

  // Check for root family interference (high severity)
  if (config.checkRootFamily && shareRoot(word1, word2)) {
    return {
      wordId1: word1.id,
      wordId2: word2.id,
      type: 'root-family',
      severity: 'high',
      reason: `Both words share the root "${word1.root}". Learning related forms together causes confusion.`,
    };
  }

  // Check for antonyms (high severity)
  if (config.checkAntonyms && word1.root && word2.root) {
    if (areAntonymRoots(word1.root, word2.root)) {
      return {
        wordId1: word1.id,
        wordId2: word2.id,
        type: 'antonym',
        severity: 'high',
        reason: `These words are antonyms. Research shows learning opposites together causes confusion.`,
      };
    }
  }

  // Check for semantic field overlap (medium-high severity for closed sets)
  if (config.checkSemanticField && sameSemanticField(word1, word2)) {
    return {
      wordId1: word1.id,
      wordId2: word2.id,
      type: 'semantic-field',
      severity: 'medium',
      reason: `Both words are in the "${word1.semanticField}" category. Learning items from the same set together slows acquisition.`,
    };
  }

  // Check for translation overlap (medium severity)
  if (config.checkTranslationOverlap && haveTranslationOverlap(word1, word2)) {
    return {
      wordId1: word1.id,
      wordId2: word2.id,
      type: 'translation-overlap',
      severity: 'medium',
      reason: `"${word1.english}" and "${word2.english}" have similar meanings. It's better to master one before learning the other.`,
    };
  }

  // Check for form similarity (low-medium severity)
  if (config.checkFormSimilar && areFormsSimilar(word1.arabic, word2.arabic)) {
    return {
      wordId1: word1.id,
      wordId2: word2.id,
      type: 'form-similar',
      severity: 'low',
      reason: `The Arabic forms look similar. This may cause recognition confusion.`,
    };
  }

  return null;
}

/**
 * Analyze a set of words for interference
 */
export function analyzeInterference(
  words: VocabSemanticInfo[],
  config: InterferenceConfig = DEFAULT_INTERFERENCE_CONFIG
): InterferenceAnalysis {
  const pairs: InterferencePair[] = [];
  const countByType: Record<InterferenceType, number> = {
    synonym: 0,
    antonym: 0,
    'semantic-field': 0,
    'form-similar': 0,
    'root-family': 0,
    'translation-overlap': 0,
  };
  const countBySeverity: Record<InterferenceSeverity, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  // Compare all pairs
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const pair = detectInterference(words[i], words[j], config);
      if (pair) {
        // Filter by minimum severity
        if (SEVERITY_ORDER[pair.severity] >= SEVERITY_ORDER[config.minSeverity]) {
          pairs.push(pair);
          countByType[pair.type]++;
          countBySeverity[pair.severity]++;
        }
      }
    }
  }

  // Sort by severity (highest first)
  pairs.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

  return {
    pairs,
    hasHighSeverity: countBySeverity.high > 0,
    countByType,
    countBySeverity,
    warnings: generateWarnings(pairs),
  };
}

/**
 * Generate user-friendly warnings from interference pairs
 */
export function generateWarnings(pairs: InterferencePair[]): InterferenceWarning[] {
  if (pairs.length === 0) return [];

  const warnings: InterferenceWarning[] = [];

  // Group by type for consolidated warnings
  const byType = new Map<InterferenceType, InterferencePair[]>();
  for (const pair of pairs) {
    const existing = byType.get(pair.type) || [];
    existing.push(pair);
    byType.set(pair.type, existing);
  }

  // Generate a warning for each type
  for (const [type, typePairs] of byType) {
    const highestSeverity = typePairs.reduce<InterferenceSeverity>(
      (max, p) => (SEVERITY_ORDER[p.severity] > SEVERITY_ORDER[max] ? p.severity : max),
      'low'
    );

    warnings.push({
      pairs: typePairs,
      severity: highestSeverity,
      message: getWarningMessage(type, typePairs.length),
      recommendation: getRecommendation(type, highestSeverity),
    });
  }

  // Sort by severity
  warnings.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

  return warnings;
}

/**
 * Get user-friendly warning message
 */
function getWarningMessage(type: InterferenceType, count: number): string {
  const pairWord = count === 1 ? 'pair' : 'pairs';

  switch (type) {
    case 'root-family':
      return `${count} ${pairWord} of words share the same root. Learning related forms together can slow acquisition.`;
    case 'antonym':
      return `${count} ${pairWord} of opposite words detected. Research shows antonyms interfere when learned together.`;
    case 'semantic-field':
      return `${count} ${pairWord} of words from the same category. Semantic sets should be spaced out over time.`;
    case 'synonym':
      return `${count} ${pairWord} of similar-meaning words. Master one synonym before learning another.`;
    case 'form-similar':
      return `${count} ${pairWord} of similar-looking words. This may cause recognition confusion.`;
    case 'translation-overlap':
      return `${count} ${pairWord} of words with similar translations. Consider learning them at different times.`;
  }
}

/**
 * Get recommendation for handling interference
 */
function getRecommendation(
  type: InterferenceType,
  severity: InterferenceSeverity
): string {
  if (severity === 'high') {
    switch (type) {
      case 'root-family':
        return 'Wait until you have mastered one word from this root before learning related forms.';
      case 'antonym':
        return 'Learn one word thoroughly before introducing its opposite. Avoid practicing them in the same session.';
      default:
        return 'Consider removing one word from this practice session to avoid interference.';
    }
  }

  if (severity === 'medium') {
    return 'Be aware of potential confusion. Focus on distinctive features of each word.';
  }

  return 'Minor interference detected. Proceed with awareness.';
}

/**
 * Check if a word would interfere with words already in a learning set
 */
export function wouldCauseInterference(
  newWord: VocabSemanticInfo,
  existingWords: VocabSemanticInfo[],
  config: InterferenceConfig = DEFAULT_INTERFERENCE_CONFIG
): InterferencePair[] {
  const pairs: InterferencePair[] = [];

  for (const existing of existingWords) {
    const pair = detectInterference(newWord, existing, config);
    if (pair && SEVERITY_ORDER[pair.severity] >= SEVERITY_ORDER[config.minSeverity]) {
      pairs.push(pair);
    }
  }

  return pairs;
}

/**
 * Filter a word list to minimize interference
 * Returns a subset with reduced interference, prioritizing earlier items
 */
export function filterForMinimalInterference(
  words: VocabSemanticInfo[],
  maxWords: number,
  config: InterferenceConfig = DEFAULT_INTERFERENCE_CONFIG
): VocabSemanticInfo[] {
  if (words.length <= maxWords) {
    return words;
  }

  const selected: VocabSemanticInfo[] = [];

  for (const word of words) {
    if (selected.length >= maxWords) break;

    const interferences = wouldCauseInterference(word, selected, config);
    const hasHighInterference = interferences.some((p) => p.severity === 'high');

    // Skip words that would cause high interference
    if (!hasHighInterference) {
      selected.push(word);
    }
  }

  // If we couldn't get enough words without high interference, add some anyway
  if (selected.length < maxWords) {
    for (const word of words) {
      if (selected.length >= maxWords) break;
      if (!selected.includes(word)) {
        selected.push(word);
      }
    }
  }

  return selected;
}

/**
 * Get interference summary for display
 */
export function getInterferenceSummary(analysis: InterferenceAnalysis): string {
  if (analysis.pairs.length === 0) {
    return 'No interference detected. Good word selection!';
  }

  const parts: string[] = [];

  if (analysis.countBySeverity.high > 0) {
    parts.push(`${analysis.countBySeverity.high} high-risk`);
  }
  if (analysis.countBySeverity.medium > 0) {
    parts.push(`${analysis.countBySeverity.medium} medium-risk`);
  }
  if (analysis.countBySeverity.low > 0) {
    parts.push(`${analysis.countBySeverity.low} low-risk`);
  }

  return `Found ${parts.join(', ')} interference ${analysis.pairs.length === 1 ? 'pair' : 'pairs'}.`;
}
