/**
 * Weakness Analysis Utilities
 * 
 * Based on Anders Ericsson's "Deliberate Practice" research from "Peak" -
 * focuses on identifying specific weaknesses and generating targeted practice.
 * 
 * Key principles:
 * - Analyze error patterns to find specific weak areas
 * - Generate practice that targets those weaknesses
 * - Provide feedback about what's being practiced and why
 */

import { getProgress } from './progressService';
import { getWordById, type WordData } from './vocabularyAsync';
import { fisherYatesShuffle } from './interleave';
import type { ArabicErrorType } from '../types/progress';

/**
 * Minimum errors needed for a weakness to be significant
 */
export const MIN_ERRORS_FOR_WEAKNESS = 3;

/**
 * Maximum number of top weaknesses to return
 */
export const MAX_TOP_WEAKNESSES = 5;

/**
 * Days to look back for recent errors
 */
export const RECENT_ERROR_DAYS = 14;

/**
 * Weakness severity based on error count
 */
export type WeaknessSeverity = 'mild' | 'moderate' | 'severe';

/**
 * Information about a specific weakness
 */
export interface Weakness {
  /** The error type */
  type: ArabicErrorType;
  /** Total error count */
  count: number;
  /** Recent errors (last 14 days) */
  recentCount: number;
  /** Trend direction */
  trend: 'improving' | 'stable' | 'worsening';
  /** Severity level */
  severity: WeaknessSeverity;
  /** Word IDs affected by this error type */
  affectedWordIds: string[];
  /** Example errors */
  examples: Array<{ expected: string; actual: string }>;
  /** Human-readable description */
  description: string;
  /** Actionable advice */
  advice: string;
}

/**
 * Complete weakness analysis report
 */
export interface WeaknessReport {
  /** Top weaknesses sorted by severity/count */
  topWeaknesses: Weakness[];
  /** Total errors analyzed */
  totalErrors: number;
  /** Number of words with error patterns */
  wordsWithErrors: number;
  /** Whether user has enough data for meaningful analysis */
  hasEnoughData: boolean;
}

/**
 * Analyze all error patterns and generate a weakness report
 */
export function analyzeWeaknesses(): WeaknessReport {
  const data = getProgress();
  const now = Date.now();
  const recentCutoff = now - (RECENT_ERROR_DAYS * 24 * 60 * 60 * 1000);
  
  // Aggregate errors by type
  const errorsByType: Record<ArabicErrorType, {
    count: number;
    recentCount: number;
    wordIds: Set<string>;
    examples: Array<{ expected: string; actual: string; timestamp: number }>;
  }> = {} as Record<ArabicErrorType, { count: number; recentCount: number; wordIds: Set<string>; examples: Array<{ expected: string; actual: string; timestamp: number }> }>;
  
  let totalErrors = 0;
  let wordsWithErrors = 0;
  
  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    if (!mastery.errorPatterns || mastery.errorPatterns.length === 0) continue;
    
    wordsWithErrors++;
    
    for (const pattern of mastery.errorPatterns) {
      totalErrors += pattern.count;
      
      if (!errorsByType[pattern.type]) {
        errorsByType[pattern.type] = {
          count: 0,
          recentCount: 0,
          wordIds: new Set(),
          examples: [],
        };
      }
      
      const entry = errorsByType[pattern.type];
      entry.count += pattern.count;
      entry.wordIds.add(wordId);
      
      // Count recent errors
      if (pattern.lastOccurred >= recentCutoff) {
        entry.recentCount += pattern.count;
      }
      
      // Collect examples (limit to 5 per type)
      if (entry.examples.length < 5 && pattern.examples) {
        for (const ex of pattern.examples) {
          if (entry.examples.length < 5) {
            entry.examples.push({
              expected: ex.expected,
              actual: ex.actual,
              timestamp: pattern.lastOccurred,
            });
          }
        }
      }
    }
  }
  
  // Build weakness list
  const weaknesses: Weakness[] = [];
  
  for (const [type, data] of Object.entries(errorsByType)) {
    const errorType = type as ArabicErrorType;
    
    if (data.count < MIN_ERRORS_FOR_WEAKNESS) continue;
    
    const severity = getSeverity(data.count);
    const trend = getTrend(data.count, data.recentCount);
    const { description, advice } = getErrorTypeInfo(errorType);
    
    weaknesses.push({
      type: errorType,
      count: data.count,
      recentCount: data.recentCount,
      trend,
      severity,
      affectedWordIds: Array.from(data.wordIds),
      examples: data.examples.map(e => ({ expected: e.expected, actual: e.actual })),
      description,
      advice,
    });
  }
  
  // Sort by severity (severe first), then by count
  weaknesses.sort((a, b) => {
    const severityOrder = { severe: 0, moderate: 1, mild: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.count - a.count;
  });
  
  return {
    topWeaknesses: weaknesses.slice(0, MAX_TOP_WEAKNESSES),
    totalErrors,
    wordsWithErrors,
    hasEnoughData: totalErrors >= MIN_ERRORS_FOR_WEAKNESS,
  };
}

/**
 * Get weakness severity based on error count
 */
function getSeverity(count: number): WeaknessSeverity {
  if (count >= 10) return 'severe';
  if (count >= 5) return 'moderate';
  return 'mild';
}

/**
 * Determine trend based on total vs recent errors
 */
function getTrend(total: number, recent: number): 'improving' | 'stable' | 'worsening' {
  // If most errors are recent, it's worsening
  const recentRatio = total > 0 ? recent / total : 0;
  
  if (recentRatio > 0.6) return 'worsening';
  if (recentRatio < 0.3) return 'improving';
  return 'stable';
}

/**
 * Get human-readable description and advice for error types
 */
function getErrorTypeInfo(type: ArabicErrorType): { description: string; advice: string } {
  switch (type) {
    case 'tashkeel_missing':
      return {
        description: 'Missing diacritical marks (tashkeel)',
        advice: 'Practice writing words with full vowel marks. Pay attention to the short vowels (fatha, kasra, damma).',
      };
    case 'tashkeel_wrong':
      return {
        description: 'Incorrect diacritical marks',
        advice: 'Review the vowel patterns for these words. Notice how the vowels change based on grammatical position.',
      };
    case 'letter_confusion':
      return {
        description: 'Confusing similar-looking letters',
        advice: 'Focus on distinguishing between similar letters like ه/ة, ا/أ, ى/ي. Practice writing them side by side.',
      };
    case 'word_order':
      return {
        description: 'Incorrect word order in sentences',
        advice: 'Review Arabic sentence structure. Remember: Arabic often follows Verb-Subject-Object order.',
      };
    case 'vocabulary_unknown':
      return {
        description: 'Unknown or forgotten vocabulary',
        advice: 'These words need more practice. Try using flashcards or reading them in context.',
      };
    case 'partial_match':
      return {
        description: 'Close but not quite correct',
        advice: 'Pay attention to the exact form of words. Small details matter in Arabic.',
      };
    case 'spelling_error':
      return {
        description: 'Spelling mistakes',
        advice: 'Practice writing these words carefully. Break them into syllables if needed.',
      };
    case 'typo':
      return {
        description: 'Typing errors',
        advice: 'Slow down when typing Arabic. Make sure your keyboard layout is correct.',
      };
    default:
      return {
        description: 'General errors',
        advice: 'Review these words and practice them more frequently.',
      };
  }
}

/**
 * Get words affected by a specific weakness
 */
export function getWordsForWeakness(weakness: Weakness): WordData[] {
  const words: WordData[] = [];
  
  for (const wordId of weakness.affectedWordIds) {
    const word = getWordById(wordId);
    if (word) {
      words.push(word);
    }
  }
  
  return words;
}

/**
 * Generate a practice session targeting a specific weakness
 */
export function generateWeaknessPractice(
  weakness: Weakness,
  maxItems: number = 10
): WeaknessPracticeItem[] {
  const affectedWords = getWordsForWeakness(weakness);
  
  if (affectedWords.length === 0) {
    return [];
  }
  
  // Shuffle and limit
  const shuffled = fisherYatesShuffle(affectedWords);
  const selected = shuffled.slice(0, maxItems);
  
  // Generate practice items based on error type
  return selected.map(word => ({
    wordId: word.id,
    arabic: word.arabic,
    english: word.english,
    focusType: weakness.type,
    instruction: getInstructionForErrorType(weakness.type),
  }));
}

/**
 * Practice item for weakness-targeted practice
 */
export interface WeaknessPracticeItem {
  wordId: string;
  arabic: string;
  english: string;
  focusType: ArabicErrorType;
  instruction: string;
}

/**
 * Get practice instruction based on error type
 */
function getInstructionForErrorType(type: ArabicErrorType): string {
  switch (type) {
    case 'tashkeel_missing':
    case 'tashkeel_wrong':
      return 'Pay special attention to the vowel marks';
    case 'letter_confusion':
      return 'Look carefully at each letter';
    case 'word_order':
      return 'Focus on the word order';
    case 'vocabulary_unknown':
      return 'Try to recall this word from memory';
    case 'partial_match':
    case 'spelling_error':
      return 'Write the complete word carefully';
    case 'typo':
      return 'Type slowly and accurately';
    default:
      return 'Practice this word';
  }
}

/**
 * Check if user has any significant weaknesses to practice
 */
export function hasSignificantWeaknesses(): boolean {
  const report = analyzeWeaknesses();
  return report.hasEnoughData && report.topWeaknesses.length > 0;
}

/**
 * Get a summary string of top weaknesses
 */
export function getWeaknessSummary(): string {
  const report = analyzeWeaknesses();
  
  if (!report.hasEnoughData) {
    return 'Keep practicing to identify areas for improvement';
  }
  
  if (report.topWeaknesses.length === 0) {
    return 'No significant weaknesses detected';
  }
  
  const top = report.topWeaknesses[0];
  return `Focus area: ${top.description}`;
}

/**
 * Get error type display label
 */
export function getErrorTypeLabel(type: ArabicErrorType): string {
  switch (type) {
    case 'tashkeel_missing': return 'Missing Tashkeel';
    case 'tashkeel_wrong': return 'Wrong Tashkeel';
    case 'letter_confusion': return 'Letter Confusion';
    case 'word_order': return 'Word Order';
    case 'vocabulary_unknown': return 'Unknown Words';
    case 'partial_match': return 'Partial Matches';
    case 'spelling_error': return 'Spelling';
    case 'typo': return 'Typos';
    default: return 'Other';
  }
}

/**
 * Get severity display color class
 */
export function getSeverityColorClass(severity: WeaknessSeverity): string {
  switch (severity) {
    case 'severe': return 'text-[var(--color-error)]';
    case 'moderate': return 'text-[var(--color-gold)]';
    case 'mild': return 'text-[var(--color-ink-muted)]';
  }
}

/**
 * Get trend icon direction
 */
export function getTrendIcon(trend: 'improving' | 'stable' | 'worsening'): 'up' | 'down' | 'flat' {
  switch (trend) {
    case 'improving': return 'down'; // Down is good for errors
    case 'worsening': return 'up';
    case 'stable': return 'flat';
  }
}
