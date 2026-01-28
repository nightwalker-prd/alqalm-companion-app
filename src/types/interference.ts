/**
 * Interference Detection Types
 *
 * Based on Paul Nation's research on vocabulary learning interference.
 *
 * Key findings:
 * - Learning synonyms together slows acquisition of both words
 * - Antonyms presented together cause confusion
 * - Words from the same semantic field (e.g., days of the week) interfere
 * - Similar-sounding or similar-looking words cause cross-association errors
 * - Words with the same root are best learned at different times
 *
 * This module provides types for detecting and warning about these patterns.
 */

/**
 * Types of interference that can occur between vocabulary items
 */
export type InterferenceType =
  | 'synonym' // Words with similar meanings (big/large)
  | 'antonym' // Words with opposite meanings (hot/cold)
  | 'semantic-field' // Words from same category (Monday/Tuesday)
  | 'form-similar' // Similar spelling/sound patterns
  | 'root-family' // Words sharing the same Arabic root
  | 'translation-overlap'; // Different Arabic words with similar English translations

/**
 * Severity of interference
 * - high: Strong interference, avoid learning together
 * - medium: Moderate interference, caution advised
 * - low: Mild interference, usually manageable
 */
export type InterferenceSeverity = 'high' | 'medium' | 'low';

/**
 * A pair of vocabulary items that may cause interference
 */
export interface InterferencePair {
  /** First word ID */
  wordId1: string;
  /** Second word ID */
  wordId2: string;
  /** Type of interference */
  type: InterferenceType;
  /** Severity level */
  severity: InterferenceSeverity;
  /** Explanation of the interference */
  reason: string;
}

/**
 * Warning about interference in current learning context
 */
export interface InterferenceWarning {
  /** The pairs of words that may interfere */
  pairs: InterferencePair[];
  /** Overall severity (highest of any pair) */
  severity: InterferenceSeverity;
  /** User-friendly warning message */
  message: string;
  /** Recommendation for how to handle */
  recommendation: string;
}

/**
 * Vocabulary item with its semantic information for interference checking
 */
export interface VocabSemanticInfo {
  /** Unique ID */
  id: string;
  /** Arabic word */
  arabic: string;
  /** Primary English meaning */
  english: string;
  /** Arabic root (if known) */
  root?: string;
  /** Semantic category/field */
  semanticField?: string;
  /** Part of speech */
  partOfSpeech?: string;
  /** Alternative English meanings */
  alternativeMeanings?: string[];
}

/**
 * Configuration for interference detection
 */
export interface InterferenceConfig {
  /** Whether to check for synonyms */
  checkSynonyms: boolean;
  /** Whether to check for antonyms */
  checkAntonyms: boolean;
  /** Whether to check for semantic field overlap */
  checkSemanticField: boolean;
  /** Whether to check for form similarity */
  checkFormSimilar: boolean;
  /** Whether to check for root family overlap */
  checkRootFamily: boolean;
  /** Whether to check for translation overlap */
  checkTranslationOverlap: boolean;
  /** Minimum severity to report */
  minSeverity: InterferenceSeverity;
}

/**
 * Result of interference analysis on a set of words
 */
export interface InterferenceAnalysis {
  /** All detected interference pairs */
  pairs: InterferencePair[];
  /** Whether any high-severity interference was found */
  hasHighSeverity: boolean;
  /** Count by type */
  countByType: Record<InterferenceType, number>;
  /** Count by severity */
  countBySeverity: Record<InterferenceSeverity, number>;
  /** Generated warnings */
  warnings: InterferenceWarning[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration for interference detection
 */
export const DEFAULT_INTERFERENCE_CONFIG: InterferenceConfig = {
  checkSynonyms: true,
  checkAntonyms: true,
  checkSemanticField: true,
  checkFormSimilar: true,
  checkRootFamily: true,
  checkTranslationOverlap: true,
  minSeverity: 'low',
};

/**
 * Human-readable labels for interference types
 */
export const INTERFERENCE_TYPE_LABELS: Record<InterferenceType, string> = {
  synonym: 'Synonyms',
  antonym: 'Antonyms',
  'semantic-field': 'Same Category',
  'form-similar': 'Similar Form',
  'root-family': 'Same Root',
  'translation-overlap': 'Similar Translation',
};

/**
 * Severity sort order (for sorting warnings)
 */
export const SEVERITY_ORDER: Record<InterferenceSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Common semantic fields in Arabic vocabulary
 */
export const SEMANTIC_FIELDS = {
  // Time-related
  DAYS_OF_WEEK: 'days-of-week',
  MONTHS: 'months',
  TIME_PERIODS: 'time-periods',

  // Family
  FAMILY_MEMBERS: 'family',

  // Numbers
  CARDINAL_NUMBERS: 'cardinal-numbers',
  ORDINAL_NUMBERS: 'ordinal-numbers',

  // Colors
  COLORS: 'colors',

  // Body parts
  BODY_PARTS: 'body-parts',

  // Directions
  DIRECTIONS: 'directions',

  // Religious terms
  RELIGIOUS: 'religious',

  // Pronouns
  PRONOUNS: 'pronouns',

  // Question words
  QUESTION_WORDS: 'question-words',

  // Emotions
  EMOTIONS: 'emotions',

  // Size/dimension
  SIZE: 'size',

  // Animals
  ANIMALS: 'animals',

  // Food/drink
  FOOD: 'food',

  // Clothing
  CLOTHING: 'clothing',
} as const;

/**
 * Common antonym pairs in Arabic (roots)
 */
export const COMMON_ANTONYM_ROOTS: Array<[string, string]> = [
  ['ك ب ر', 'ص غ ر'], // big/small
  ['ق ر ب', 'ب ع د'], // near/far
  ['ح ر ر', 'ب ر د'], // hot/cold
  ['ج م ل', 'ق ب ح'], // beautiful/ugly
  ['ق و ي', 'ض ع ف'], // strong/weak
  ['س ه ل', 'ص ع ب'], // easy/difficult
  ['ف ت ح', 'غ ل ق'], // open/close
  ['د خ ل', 'خ ر ج'], // enter/exit
  ['ط ل ع', 'ن ز ل'], // ascend/descend
  ['ق و م', 'ج ل س'], // stand/sit
];
