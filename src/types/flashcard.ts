/**
 * Flashcard Types
 *
 * Based on Paul Nation's research on word cards for deliberate vocabulary learning.
 * Nation recommends specific card design features:
 * - L2 (Arabic) on front
 * - L1 (English) + context on back
 * - Receptive (L2→L1) and productive (L1→L2) modes
 * - Difficulty sorting (hard cards first)
 */

/**
 * Card direction modes based on Nation's receptive/productive distinction
 */
export type CardDirection = 'receptive' | 'productive';

/**
 * Difficulty levels for Nation's "hard cards first" sorting
 */
export type CardDifficulty = 'new' | 'hard' | 'medium' | 'easy';

/**
 * A flashcard with Nation's recommended design
 */
export interface Flashcard {
  /** Word ID reference */
  wordId: string;
  /** Arabic word (shown on front in receptive mode) */
  arabic: string;
  /** Arabic without vowels (for advanced mode) */
  arabicNoVowels: string;
  /** English meaning (shown on front in productive mode) */
  english: string;
  /** Part of speech */
  partOfSpeech: string;
  /** Root for word family reference */
  root: string | null;
  /** Lesson ID for pack creation */
  lessonId: string;
  /** Example sentence in Arabic */
  exampleArabic?: string;
  /** Example sentence translation */
  exampleEnglish?: string;
  /** Related word forms (from same root) */
  relatedForms?: string[];
  /** User's personal mnemonic */
  mnemonic?: string;
}

/**
 * Flashcard deck organized by lesson, book, or topic
 */
export interface FlashcardDeck {
  /** Unique deck ID */
  id: string;
  /** Deck name */
  name: string;
  /** Arabic name if applicable */
  nameAr?: string;
  /** Deck description */
  description?: string;
  /** Word IDs in this deck */
  wordIds: string[];
  /** Deck type */
  type: 'lesson' | 'book' | 'topic' | 'custom' | 'weak-words' | 'due-review';
  /** Associated lesson ID if type is 'lesson' */
  lessonId?: string;
  /** Book number if type is 'lesson' or 'book' */
  bookNumber?: number;
}

/**
 * Session state for flashcard practice
 */
export interface FlashcardSession {
  /** Current deck being studied */
  deckId: string;
  /** Card direction mode */
  direction: CardDirection;
  /** Whether to show vowels (tashkeel) */
  showVowels: boolean;
  /** Cards in session (sorted by difficulty) */
  cards: Flashcard[];
  /** Current card index */
  currentIndex: number;
  /** Cards marked correct in this session */
  correctCount: number;
  /** Cards marked incorrect (will be repeated) */
  incorrectCards: string[];
  /** Session start time */
  startedAt: number;
  /** Whether session is complete */
  isComplete: boolean;
}

/**
 * Result of a single card review
 */
export interface FlashcardResult {
  wordId: string;
  direction: CardDirection;
  /** User's self-reported knowledge */
  knew: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Whether this was a repeat of a missed card */
  wasRepeat: boolean;
}

/**
 * Flashcard statistics for a word
 */
export interface FlashcardStats {
  wordId: string;
  /** Total receptive reviews */
  receptiveReviews: number;
  /** Receptive correct rate (0-1) */
  receptiveRate: number;
  /** Total productive reviews */
  productiveReviews: number;
  /** Productive correct rate (0-1) */
  productiveRate: number;
  /** Current difficulty classification */
  difficulty: CardDifficulty;
  /** Last review timestamp */
  lastReviewed: number | null;
}

/**
 * Configuration for flashcard sessions
 */
export interface FlashcardConfig {
  /** Default card direction */
  defaultDirection: CardDirection;
  /** Whether to show vowels by default */
  showVowelsByDefault: boolean;
  /** Number of cards per session */
  cardsPerSession: number;
  /** Whether to prioritize hard cards */
  hardCardsFirst: boolean;
  /** Auto-flip delay in seconds (0 = manual) */
  autoFlipDelay: number;
}

/**
 * Default flashcard configuration
 */
export const DEFAULT_FLASHCARD_CONFIG: FlashcardConfig = {
  defaultDirection: 'receptive',
  showVowelsByDefault: true,
  cardsPerSession: 20,
  hardCardsFirst: true,
  autoFlipDelay: 0,
};
