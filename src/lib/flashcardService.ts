/**
 * Flashcard Service
 *
 * Implements Paul Nation's word card methodology:
 * - Difficulty sorting (hard cards first)
 * - Receptive vs. productive card modes
 * - Pack creation by lesson/topic
 * - Progress tracking separate from main mastery
 */

import type {
  Flashcard,
  FlashcardDeck,
  FlashcardSession,
  FlashcardResult,
  FlashcardStats,
  FlashcardConfig,
  CardDirection,
  CardDifficulty,
} from '../types/flashcard';
import { DEFAULT_FLASHCARD_CONFIG } from '../types/flashcard';
import type { WordData } from './vocabularyAsync';
import { getProgress } from './progressService';

// Storage keys
const FLASHCARD_STATS_KEY = 'madina_flashcard_stats';
const FLASHCARD_CONFIG_KEY = 'madina_flashcard_config';
const FLASHCARD_MNEMONICS_KEY = 'madina_flashcard_mnemonics';

/**
 * Remove Arabic diacritical marks (tashkeel) from text
 */
export function removeVowels(arabic: string): string {
  // Unicode range for Arabic diacritics: 0x064B - 0x065F
  return arabic.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Convert WordData to Flashcard format
 */
export function wordToFlashcard(
  word: WordData,
  relatedForms?: string[],
  mnemonic?: string
): Flashcard {
  return {
    wordId: word.id,
    arabic: word.arabic,
    arabicNoVowels: removeVowels(word.arabic),
    english: word.english,
    partOfSpeech: word.partOfSpeech,
    root: word.root,
    lessonId: word.lesson,
    relatedForms,
    mnemonic,
  };
}

/**
 * Get flashcard stats from localStorage
 */
export function getFlashcardStats(): Record<string, FlashcardStats> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(FLASHCARD_STATS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save flashcard stats to localStorage
 */
function saveFlashcardStats(stats: Record<string, FlashcardStats>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FLASHCARD_STATS_KEY, JSON.stringify(stats));
}

/**
 * Get stats for a specific word
 */
export function getWordFlashcardStats(wordId: string): FlashcardStats {
  const allStats = getFlashcardStats();
  return (
    allStats[wordId] || {
      wordId,
      receptiveReviews: 0,
      receptiveRate: 0,
      productiveReviews: 0,
      productiveRate: 0,
      difficulty: 'new' as CardDifficulty,
      lastReviewed: null,
    }
  );
}

/**
 * Calculate difficulty based on review performance
 */
function calculateDifficulty(stats: FlashcardStats): CardDifficulty {
  const totalReviews = stats.receptiveReviews + stats.productiveReviews;
  if (totalReviews === 0) return 'new';

  const avgRate =
    (stats.receptiveRate * stats.receptiveReviews +
      stats.productiveRate * stats.productiveReviews) /
    totalReviews;

  if (avgRate >= 0.9) return 'easy';
  if (avgRate >= 0.7) return 'medium';
  return 'hard';
}

/**
 * Record a flashcard review result
 */
export function recordFlashcardResult(result: FlashcardResult): void {
  const allStats = getFlashcardStats();
  const stats = allStats[result.wordId] || {
    wordId: result.wordId,
    receptiveReviews: 0,
    receptiveRate: 0,
    productiveReviews: 0,
    productiveRate: 0,
    difficulty: 'new' as CardDifficulty,
    lastReviewed: null,
  };

  // Update counts and rates
  if (result.direction === 'receptive') {
    const totalCorrect = stats.receptiveRate * stats.receptiveReviews;
    stats.receptiveReviews += 1;
    stats.receptiveRate =
      (totalCorrect + (result.knew ? 1 : 0)) / stats.receptiveReviews;
  } else {
    const totalCorrect = stats.productiveRate * stats.productiveReviews;
    stats.productiveReviews += 1;
    stats.productiveRate =
      (totalCorrect + (result.knew ? 1 : 0)) / stats.productiveReviews;
  }

  stats.lastReviewed = Date.now();
  stats.difficulty = calculateDifficulty(stats);

  allStats[result.wordId] = stats;
  saveFlashcardStats(allStats);
}

/**
 * Sort cards by difficulty (hard first per Nation's recommendation)
 */
export function sortByDifficulty(cards: Flashcard[]): Flashcard[] {
  const allStats = getFlashcardStats();
  const progress = getProgress();

  return [...cards].sort((a, b) => {
    const statsA = allStats[a.wordId];
    const statsB = allStats[b.wordId];

    // Priority order: new > hard > medium > easy
    const difficultyOrder: Record<CardDifficulty, number> = {
      new: 0,
      hard: 1,
      medium: 2,
      easy: 3,
    };

    const diffA = statsA?.difficulty || 'new';
    const diffB = statsB?.difficulty || 'new';

    if (diffA !== diffB) {
      return difficultyOrder[diffA] - difficultyOrder[diffB];
    }

    // Secondary sort: lower mastery strength first
    const strengthA = progress.wordMastery[a.wordId]?.strength ?? 0;
    const strengthB = progress.wordMastery[b.wordId]?.strength ?? 0;

    return strengthA - strengthB;
  });
}

/**
 * Get user's flashcard configuration
 */
export function getFlashcardConfig(): FlashcardConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_FLASHCARD_CONFIG };
  }
  const stored = localStorage.getItem(FLASHCARD_CONFIG_KEY);
  if (!stored) return { ...DEFAULT_FLASHCARD_CONFIG };
  try {
    return { ...DEFAULT_FLASHCARD_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_FLASHCARD_CONFIG };
  }
}

/**
 * Save flashcard configuration
 */
export function saveFlashcardConfig(config: Partial<FlashcardConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getFlashcardConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(FLASHCARD_CONFIG_KEY, JSON.stringify(updated));
}

/**
 * Get user mnemonics for words
 */
export function getMnemonics(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(FLASHCARD_MNEMONICS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save a mnemonic for a word
 */
export function saveMnemonic(wordId: string, mnemonic: string): void {
  if (typeof window === 'undefined') return;
  const mnemonics = getMnemonics();
  if (mnemonic.trim()) {
    mnemonics[wordId] = mnemonic.trim();
  } else {
    delete mnemonics[wordId];
  }
  localStorage.setItem(FLASHCARD_MNEMONICS_KEY, JSON.stringify(mnemonics));
}

/**
 * Get mnemonic for a specific word
 */
export function getMnemonic(wordId: string): string | undefined {
  return getMnemonics()[wordId];
}

/**
 * Create a flashcard session from a deck
 */
export function createFlashcardSession(
  deck: FlashcardDeck,
  cards: Flashcard[],
  direction: CardDirection,
  showVowels: boolean
): FlashcardSession {
  const config = getFlashcardConfig();

  // Sort by difficulty if configured
  const sortedCards = config.hardCardsFirst
    ? sortByDifficulty(cards)
    : cards;

  // Limit to session size
  const sessionCards = sortedCards.slice(0, config.cardsPerSession);

  return {
    deckId: deck.id,
    direction,
    showVowels,
    cards: sessionCards,
    currentIndex: 0,
    correctCount: 0,
    incorrectCards: [],
    startedAt: Date.now(),
    isComplete: false,
  };
}

/**
 * Process a card answer and advance session
 */
export function processCardAnswer(
  session: FlashcardSession,
  knew: boolean,
  responseTimeMs: number
): FlashcardSession {
  const currentCard = session.cards[session.currentIndex];

  // Record the result
  recordFlashcardResult({
    wordId: currentCard.wordId,
    direction: session.direction,
    knew,
    responseTimeMs,
    wasRepeat: session.incorrectCards.includes(currentCard.wordId),
  });

  // Update session state
  const newSession = { ...session };

  if (knew) {
    newSession.correctCount += 1;
  } else if (!session.incorrectCards.includes(currentCard.wordId)) {
    // Add to incorrect list for repeat (only if not already there)
    newSession.incorrectCards = [...session.incorrectCards, currentCard.wordId];
  }

  // Advance to next card
  newSession.currentIndex += 1;

  // Check if we need to repeat incorrect cards
  if (newSession.currentIndex >= newSession.cards.length) {
    if (newSession.incorrectCards.length > 0) {
      // Add incorrect cards back to the end
      const repeatCards = newSession.cards.filter((c) =>
        newSession.incorrectCards.includes(c.wordId)
      );
      newSession.cards = [...newSession.cards, ...repeatCards];
      newSession.incorrectCards = [];
    } else {
      newSession.isComplete = true;
    }
  }

  return newSession;
}

/**
 * Create preset decks from lessons
 */
export function createLessonDeck(
  lessonId: string,
  lessonTitle: string,
  wordIds: string[],
  bookNumber: number
): FlashcardDeck {
  return {
    id: `lesson-${lessonId}`,
    name: `Lesson ${lessonId.split('-')[1]?.replace('l', '') || ''}: ${lessonTitle}`,
    type: 'lesson',
    lessonId,
    bookNumber,
    wordIds,
  };
}

/**
 * Create a deck of weak words (low mastery)
 */
export function createWeakWordsDeck(
  allWordIds: string[],
  masteryData: Record<string, { strength: number }>
): FlashcardDeck {
  const weakWordIds = allWordIds.filter((id) => {
    const mastery = masteryData[id];
    return mastery && mastery.strength > 0 && mastery.strength < 50;
  });

  return {
    id: 'weak-words',
    name: 'Weak Words',
    description: 'Words that need more practice',
    type: 'weak-words',
    wordIds: weakWordIds,
  };
}

/**
 * Create a deck of words due for review
 */
export function createDueReviewDeck(
  allWordIds: string[],
  flashcardStats: Record<string, FlashcardStats>,
  daysThreshold: number = 7
): FlashcardDeck {
  const now = Date.now();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

  const dueWordIds = allWordIds.filter((id) => {
    const stats = flashcardStats[id];
    if (!stats || !stats.lastReviewed) return false;
    return now - stats.lastReviewed > thresholdMs;
  });

  return {
    id: 'due-review',
    name: 'Due for Review',
    description: `Words not reviewed in ${daysThreshold}+ days`,
    type: 'due-review',
    wordIds: dueWordIds,
  };
}

/**
 * Get session summary statistics
 */
export function getSessionSummary(session: FlashcardSession): {
  totalCards: number;
  correctCount: number;
  accuracy: number;
  duration: number;
  cardsPerMinute: number;
} {
  const duration = Date.now() - session.startedAt;
  const totalCards = session.currentIndex;
  const accuracy = totalCards > 0 ? session.correctCount / totalCards : 0;
  const durationMinutes = duration / 60000;
  const cardsPerMinute = durationMinutes > 0 ? totalCards / durationMinutes : 0;

  return {
    totalCards,
    correctCount: session.correctCount,
    accuracy: Math.round(accuracy * 100),
    duration,
    cardsPerMinute: Math.round(cardsPerMinute * 10) / 10,
  };
}
