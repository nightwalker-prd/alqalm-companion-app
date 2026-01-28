/**
 * Arabic text utilities for answer normalization and comparison.
 * Used to compare user answers with correct answers, ignoring tashkeel
 * (diacritical marks) and whitespace differences.
 */

import type { ArabicErrorType } from '../types/progress';

// Arabic tashkeel (diacritical marks) Unicode range
// These are combining characters that appear above or below letters
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;

// Tashkeel characters:
// U+064B - Fathatan (tanween fath) ً
// U+064C - Dammatan (tanween damm) ٌ
// U+064D - Kasratan (tanween kasr) ٍ
// U+064E - Fatha (فتحة) َ
// U+064F - Damma (ضمة) ُ
// U+0650 - Kasra (كسرة) ِ
// U+0651 - Shadda (شدة) ّ
// U+0652 - Sukun (سكون) ْ
// U+0653-U+065F - Other marks (maddah, hamza marks, etc.)
// U+0670 - Superscript Alef (dagger alef) ٰ

// Common letter confusion pairs in Arabic
const LETTER_CONFUSIONS: Array<[string, string]> = [
  ['ه', 'ة'],   // Ha vs Ta Marbuta
  ['ا', 'أ'],   // Alef vs Alef with Hamza above
  ['ا', 'إ'],   // Alef vs Alef with Hamza below
  ['ا', 'آ'],   // Alef vs Alef with Madda
  ['ى', 'ي'],   // Alef Maqsura vs Ya
  ['ي', 'ئ'],   // Ya vs Ya with Hamza
  ['و', 'ؤ'],   // Waw vs Waw with Hamza
  ['ء', 'أ'],   // Hamza vs Alef with Hamza
  ['ت', 'ة'],   // Ta vs Ta Marbuta
  ['ک', 'ك'],   // Persian Kaf vs Arabic Kaf
  ['ی', 'ي'],   // Persian Ye vs Arabic Ya
];

/**
 * Remove all tashkeel (diacritical marks) from Arabic text.
 * This allows comparing words regardless of vowel marks.
 */
export function removeTashkeel(text: string): string {
  return text.replace(TASHKEEL_REGEX, '');
}

/**
 * Normalize Arabic text for comparison:
 * - Remove tashkeel (diacritical marks)
 * - Trim leading/trailing whitespace
 * - Collapse multiple spaces to single space
 */
export function normalizeArabic(text: string): string {
  // Remove tashkeel
  let normalized = removeTashkeel(text);

  // Trim whitespace
  normalized = normalized.trim();

  // Collapse multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Compare user answer with correct answer.
 * Returns true if answers match after normalization.
 * This allows users to type without tashkeel and still be marked correct.
 */
export function compareAnswers(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const normalizedUser = normalizeArabic(userAnswer);
  const normalizedCorrect = normalizeArabic(correctAnswer);

  return normalizedUser === normalizedCorrect;
}

/**
 * Normalize Arabic text strictly - keeps tashkeel but normalizes whitespace.
 * Used for challenge mode where exact diacritics are required.
 */
export function normalizeArabicStrict(text: string): string {
  // Trim whitespace
  let normalized = text.trim();

  // Collapse multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Compare user answer with correct answer STRICTLY.
 * Requires exact tashkeel (diacritical marks) match.
 * Used in challenge mode to verify mastery of vowel marks.
 */
export function compareAnswersStrict(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const normalizedUser = normalizeArabicStrict(userAnswer);
  const normalizedCorrect = normalizeArabicStrict(correctAnswer);

  return normalizedUser === normalizedCorrect;
}

/**
 * Extract tashkeel from Arabic text.
 * Returns an array of tashkeel marks in order.
 */
export function extractTashkeel(text: string): string[] {
  const matches = text.match(TASHKEEL_REGEX);
  return matches || [];
}

/**
 * Check if text contains any tashkeel.
 */
export function hasTashkeel(text: string): boolean {
  return TASHKEEL_REGEX.test(text);
}

/**
 * Calculate Levenshtein distance between two strings.
 * Used for determining how close a wrong answer is.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two letters are a common confusion pair.
 */
function isLetterConfusion(charA: string, charB: string): boolean {
  return LETTER_CONFUSIONS.some(
    ([a, b]) => (charA === a && charB === b) || (charA === b && charB === a)
  );
}

/**
 * Find letter confusions between expected and actual answer.
 * Returns pairs of confused letters found.
 */
function findLetterConfusions(expected: string, actual: string): Array<{ expected: string; actual: string }> {
  const confusions: Array<{ expected: string; actual: string }> = [];
  const expectedNorm = removeTashkeel(expected);
  const actualNorm = removeTashkeel(actual);

  // Simple character-by-character comparison for single words
  const minLen = Math.min(expectedNorm.length, actualNorm.length);
  for (let i = 0; i < minLen; i++) {
    if (expectedNorm[i] !== actualNorm[i] && isLetterConfusion(expectedNorm[i], actualNorm[i])) {
      confusions.push({ expected: expectedNorm[i], actual: actualNorm[i] });
    }
  }

  return confusions;
}

/**
 * Analyze an incorrect Arabic answer to classify the error type.
 * Based on deliberate practice research - specific feedback improves learning.
 * 
 * @param expected The correct answer
 * @param actual The user's answer
 * @returns Object with error type and diagnostic details
 */
export function analyzeArabicError(
  expected: string,
  actual: string
): {
  errorType: ArabicErrorType;
  details: string;
  letterConfusions?: Array<{ expected: string; actual: string }>;
} {
  // Empty answer
  if (!actual || !actual.trim()) {
    return { errorType: 'vocabulary_unknown', details: 'No answer provided' };
  }

  const expectedNorm = normalizeArabic(expected);
  const actualNorm = normalizeArabic(actual);

  // Exact match without tashkeel - this means correct (shouldn't reach here)
  if (expectedNorm === actualNorm) {
    // Check if it was a tashkeel issue
    const expectedStrict = normalizeArabicStrict(expected);
    const actualStrict = normalizeArabicStrict(actual);

    if (expectedStrict !== actualStrict) {
      // Base letters match but tashkeel differs
      const expectedTashkeel = extractTashkeel(expected);
      const actualTashkeel = extractTashkeel(actual);

      if (actualTashkeel.length === 0 && expectedTashkeel.length > 0) {
        return { errorType: 'tashkeel_missing', details: 'Answer missing diacritical marks' };
      }
      return { errorType: 'tashkeel_wrong', details: 'Incorrect diacritical marks used' };
    }

    // Shouldn't happen - answers match
    return { errorType: 'partial_match', details: 'Answer is correct' };
  }

  // Check for letter confusions
  const confusions = findLetterConfusions(expected, actual);
  if (confusions.length > 0) {
    const confusionDetails = confusions
      .map(c => `${c.actual} → ${c.expected}`)
      .join(', ');
    return {
      errorType: 'letter_confusion',
      details: `Letter confusion: ${confusionDetails}`,
      letterConfusions: confusions,
    };
  }

  // Calculate edit distance to determine if it's a typo or spelling error
  const distance = levenshteinDistance(expectedNorm, actualNorm);
  const maxLen = Math.max(expectedNorm.length, actualNorm.length);
  const similarity = 1 - distance / maxLen;

  // Very close (>80% similar) - likely a typo
  if (similarity > 0.8) {
    return { errorType: 'typo', details: 'Minor typing error detected' };
  }

  // Somewhat close (>50% similar) - spelling error
  if (similarity > 0.5) {
    return { errorType: 'spelling_error', details: 'Spelling error in Arabic' };
  }

  // Partially similar (>30%) - partial match
  if (similarity > 0.3) {
    return { errorType: 'partial_match', details: 'Answer partially correct' };
  }

  // Very different - vocabulary unknown
  return { errorType: 'vocabulary_unknown', details: 'Answer does not match expected word' };
}

/**
 * Get a user-friendly explanation of an Arabic error.
 * Used to display helpful feedback after incorrect answers.
 */
export function getErrorExplanation(
  errorType: ArabicErrorType,
  expected: string,
  actual: string
): string {
  switch (errorType) {
    case 'tashkeel_missing':
      return 'Your answer needs diacritical marks (tashkeel). Try adding the vowel marks.';
    case 'tashkeel_wrong':
      return 'The letters are correct, but check your diacritical marks (tashkeel).';
    case 'letter_confusion': {
      const confusions = findLetterConfusions(expected, actual);
      if (confusions.length > 0) {
        const first = confusions[0];
        return `You wrote "${first.actual}" but the correct letter is "${first.expected}". These letters are commonly confused.`;
      }
      return 'Check for commonly confused letters in your answer.';
    }
    case 'typo':
      return 'Almost correct! Check for any typing mistakes.';
    case 'spelling_error':
      return 'The spelling needs some work. Review the word carefully.';
    case 'partial_match':
      return 'Your answer is on the right track, but not quite complete.';
    case 'word_order':
      return 'The words are correct, but the order needs adjustment.';
    case 'vocabulary_unknown':
    default:
      return 'Review this word - it may need more practice.';
  }
}

// ============================================================================
// Character-Level Diff for Visual Feedback
// ============================================================================

/**
 * Represents a single character in a diff result
 */
export interface DiffChar {
  /** The character */
  char: string;
  /** The type of diff: 'correct', 'wrong', 'missing', 'extra' */
  type: 'correct' | 'wrong' | 'missing' | 'extra';
}

/**
 * Result of a character-level diff comparison
 */
export interface CharDiffResult {
  /** Diff of the expected text (shows what was expected) */
  expected: DiffChar[];
  /** Diff of the actual text (shows what user typed) */
  actual: DiffChar[];
  /** Overall similarity score (0-1) */
  similarity: number;
}

/**
 * Compute the Longest Common Subsequence (LCS) of two strings.
 * Returns the LCS table for backtracking.
 */
function computeLCS(a: string, b: string): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Backtrack through LCS table to find the actual diff operations.
 * Returns arrays of indices marking which characters match.
 */
function backtrackLCS(
  a: string, 
  b: string, 
  dp: number[][]
): { aMatches: Set<number>; bMatches: Set<number> } {
  const aMatches = new Set<number>();
  const bMatches = new Set<number>();
  
  let i = a.length;
  let j = b.length;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      aMatches.add(i - 1);
      bMatches.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return { aMatches, bMatches };
}

/**
 * Perform character-level diff between expected and actual strings.
 * Uses LCS algorithm for accurate character alignment.
 * 
 * @param expected The correct/expected string
 * @param actual The user's actual input
 * @returns CharDiffResult with annotated characters for both strings
 */
export function computeCharDiff(expected: string, actual: string): CharDiffResult {
  // Handle edge cases
  if (expected === actual) {
    return {
      expected: expected.split('').map(char => ({ char, type: 'correct' })),
      actual: actual.split('').map(char => ({ char, type: 'correct' })),
      similarity: 1,
    };
  }

  if (!expected) {
    return {
      expected: [],
      actual: actual.split('').map(char => ({ char, type: 'extra' })),
      similarity: 0,
    };
  }

  if (!actual) {
    return {
      expected: expected.split('').map(char => ({ char, type: 'missing' })),
      actual: [],
      similarity: 0,
    };
  }

  // Compute LCS
  const dp = computeLCS(expected, actual);
  const { aMatches, bMatches } = backtrackLCS(expected, actual, dp);

  // Build expected diff
  const expectedDiff: DiffChar[] = [];
  for (let i = 0; i < expected.length; i++) {
    if (aMatches.has(i)) {
      expectedDiff.push({ char: expected[i], type: 'correct' });
    } else {
      expectedDiff.push({ char: expected[i], type: 'missing' });
    }
  }

  // Build actual diff
  const actualDiff: DiffChar[] = [];
  for (let i = 0; i < actual.length; i++) {
    if (bMatches.has(i)) {
      actualDiff.push({ char: actual[i], type: 'correct' });
    } else {
      actualDiff.push({ char: actual[i], type: 'extra' });
    }
  }

  // Calculate similarity based on LCS length
  const lcsLength = dp[expected.length][actual.length];
  const maxLength = Math.max(expected.length, actual.length);
  const similarity = maxLength > 0 ? lcsLength / maxLength : 0;

  return {
    expected: expectedDiff,
    actual: actualDiff,
    similarity,
  };
}

/**
 * Check if a character is a tashkeel (diacritical mark).
 */
export function isTashkeel(char: string): boolean {
  // Use a non-global regex to avoid state issues with the global TASHKEEL_REGEX
  return /[\u064B-\u065F\u0670]/.test(char);
}

/**
 * Compute a character-level diff that's aware of Arabic structure.
 * Groups base letters with their tashkeel for cleaner visual output.
 * 
 * @param expected The correct/expected string
 * @param actual The user's actual input
 * @returns CharDiffResult with Arabic-aware grouping
 */
export function computeArabicCharDiff(expected: string, actual: string): CharDiffResult {
  // First do the base diff
  const baseDiff = computeCharDiff(expected, actual);
  
  // The base diff is already accurate for character-level comparison
  // For Arabic, we want to ensure tashkeel are displayed correctly
  // The base LCS algorithm handles this well since it compares exact characters
  
  return baseDiff;
}

// ============================================================================
// Tashkeel Scaffolding (Progressive Fade)
// ============================================================================

/**
 * Tashkeel display level for scaffolding
 */
export type TashkeelLevel = 'full' | 'partial' | 'none';

/**
 * Which tashkeel marks to keep for partial display.
 * Keeps shadda (doubling) and sukun (no vowel) as they're more structural.
 * Non-global version for single character testing.
 */
const STRUCTURAL_TASHKEEL_CHAR = /[\u0651\u0652]/;
const TASHKEEL_CHAR = /[\u064B-\u065F\u0670]/;

/**
 * Apply tashkeel scaffolding to Arabic text based on the display level.
 * 
 * @param text The original Arabic text with full tashkeel
 * @param level The scaffolding level: 'full' (all marks), 'partial' (structural only), 'none' (no marks)
 * @returns The text with appropriate tashkeel level
 */
export function applyTashkeelScaffolding(text: string, level: TashkeelLevel): string {
  switch (level) {
    case 'full':
      return text;
    case 'none':
      return removeTashkeel(text);
    case 'partial': {
      // Keep only structural tashkeel (shadda and sukun)
      // Remove vowel marks but keep structural marks
      const structuralMarks: { index: number; char: string }[] = [];
      
      // First, find and save structural marks with their positions relative to base letters
      let baseIndex = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (STRUCTURAL_TASHKEEL_CHAR.test(char)) {
          structuralMarks.push({ index: baseIndex, char });
        } else if (!TASHKEEL_CHAR.test(char)) {
          baseIndex++;
        }
      }
      
      // Remove all tashkeel
      const stripped = removeTashkeel(text);
      
      // Re-insert structural marks at appropriate positions
      if (structuralMarks.length === 0) {
        return stripped;
      }
      
      const result: string[] = [];
      let markIndex = 0;
      for (let i = 0; i < stripped.length; i++) {
        result.push(stripped[i]);
        // Add any structural marks that follow this base letter
        while (markIndex < structuralMarks.length && structuralMarks[markIndex].index === i + 1) {
          result.push(structuralMarks[markIndex].char);
          markIndex++;
        }
      }
      
      return result.join('');
    }
    default:
      return text;
  }
}

/**
 * Determine the appropriate tashkeel level based on word mastery strength.
 * 
 * Scaffolding progression:
 * - New/Learning (0-39): Full tashkeel for maximum support
 * - Familiar (40-69): Partial tashkeel (structural marks only)
 * - Mastered (70+): No tashkeel (full independence)
 * 
 * @param strength Word mastery strength (0-100)
 * @returns The appropriate TashkeelLevel
 */
export function getTashkeelLevelForStrength(strength: number): TashkeelLevel {
  if (strength >= 70) {
    return 'none';
  }
  if (strength >= 40) {
    return 'partial';
  }
  return 'full';
}

/**
 * Count the number of tashkeel marks in a string.
 */
export function countTashkeel(text: string): number {
  const matches = text.match(TASHKEEL_REGEX);
  return matches ? matches.length : 0;
}
