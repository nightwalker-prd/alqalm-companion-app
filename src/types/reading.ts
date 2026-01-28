/**
 * Reading passage types for the Madina Interactive app.
 * Implements Paul Nation's Strand 1: Meaning-focused Input.
 */

/**
 * Difficulty level for reading passages
 */
export type PassageLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Vocabulary highlight within a passage
 */
export interface VocabularyHighlight {
  /** Arabic word with tashkeel */
  word: string;
  /** English meaning */
  meaning: string;
}

/**
 * Word-by-word translation entry (optional detailed breakdown)
 */
export interface WordTranslation {
  /** Arabic word */
  arabic: string;
  /** English translation */
  translation: string;
  /** Grammatical information (e.g., "noun", "verb past tense") */
  grammaticalInfo?: string;
}

/**
 * A reading passage for comprehension practice
 */
export interface ReadingPassage {
  /** Unique identifier (e.g., "b1", "i15", "a23") */
  id: string;
  /** English title */
  title: string;
  /** Arabic title */
  titleAr: string;
  /** Difficulty level */
  level: PassageLevel;
  /** Category (e.g., "Character Building", "Dialogues") */
  category: string;
  /** Arabic category name */
  categoryAr: string;
  /** Full Arabic text with tashkeel */
  text: string;
  /** English translation */
  translation: string;
  /** Grammar concepts covered (e.g., ["Nominal sentences", "idafa"]) */
  grammaticalConcepts: string[];
  /** Key vocabulary items */
  vocabularyHighlights: VocabularyHighlight[];
  /** Moral/lesson in English (optional) */
  moralLesson?: string;
  /** Moral/lesson in Arabic (optional) */
  moralLessonAr?: string;
  /** Word count of the Arabic text */
  wordCount: number;
  /** Optional word-by-word translation data */
  wordByWordTranslation?: WordTranslation[];
}

/**
 * User's progress on a reading passage
 */
export interface ReadingProgress {
  /** Passage ID */
  passageId: string;
  /** Whether the passage has been fully read */
  completed: boolean;
  /** Number of times this passage was read */
  timesRead: number;
  /** Timestamp of first read */
  firstReadDate: number | null;
  /** Timestamp of most recent read */
  lastReadDate: number | null;
}

/**
 * Filters for the reading passage list
 */
export interface ReadingFilters {
  /** Filter by difficulty level */
  level?: PassageLevel | 'all';
  /** Filter by category */
  category?: string | 'all';
  /** Filter by read status */
  readStatus?: 'all' | 'read' | 'unread';
  /** Search query (matches title or titleAr) */
  searchQuery?: string;
}

/**
 * Summary statistics for reading progress
 */
export interface ReadingStats {
  /** Total number of available passages */
  totalPassages: number;
  /** Number of passages read at least once */
  passagesRead: number;
  /** Total reading encounters (across all passages) */
  totalEncounters: number;
  /** Breakdown by level */
  byLevel: {
    beginner: { total: number; read: number };
    intermediate: { total: number; read: number };
    advanced: { total: number; read: number };
  };
}

/**
 * Reading content manifest for lazy loading
 */
export interface ReadingManifest {
  /** Manifest version */
  version: number;
  /** When the manifest was generated */
  generatedAt: string;
  /** Total passage count */
  passageCount: number;
  /** Unique categories */
  categories: string[];
  /** Passage summary by level */
  byLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

/**
 * Reading data stored in localStorage
 */
export interface ReadingData {
  /** Data version for migrations */
  version: number;
  /** Progress on individual passages */
  passageProgress: Record<string, ReadingProgress>;
  /** Aggregate stats */
  stats: {
    totalTimesRead: number;
    lastReadDate: number | null;
  };
}

/** Current reading data version */
export const CURRENT_READING_VERSION = 1;

/**
 * Narrow Reading Types
 *
 * Based on Paul Nation's research: Reading multiple texts on the same topic
 * builds vocabulary through repeated natural exposure.
 */

/**
 * A collection of passages grouped by topic for narrow reading
 */
export interface NarrowReadingCollection {
  /** Topic/category identifier */
  topic: string;
  /** Arabic topic name */
  topicAr: string;
  /** Description of the topic */
  description?: string;
  /** Passages in this collection */
  passages: ReadingPassage[];
  /** Total word count across all passages */
  totalWordCount: number;
  /** Number of passages read in this collection */
  passagesRead: number;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** Level distribution */
  levelDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

/**
 * User's progress on a topic collection
 */
export interface TopicProgress {
  /** Topic identifier */
  topic: string;
  /** Number of passages read */
  passagesRead: number;
  /** Total passages in topic */
  totalPassages: number;
  /** Unique vocabulary encountered in topic */
  vocabularyEncountered: number;
  /** Completion badge earned */
  badgeEarned: boolean;
  /** Last read date */
  lastReadDate: number | null;
}
