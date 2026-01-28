/**
 * FlashcardPractice Page
 *
 * Nation-style word card practice implementing Paul Nation's research:
 * - Receptive (Arabic → English) and Productive (English → Arabic) modes
 * - Difficulty sorting (hard cards first)
 * - Optional vowel hiding for advanced practice
 * - Book-level deck selection with gating
 */

import { useState, useCallback, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { FlashcardCard } from '../components/flashcard/FlashcardCard';
import { FlashcardDeckSelector } from '../components/flashcard/FlashcardDeckSelector';
import { FlashcardSessionSummary } from '../components/flashcard/FlashcardSessionSummary';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  wordToFlashcard,
  createFlashcardSession,
  processCardAnswer,
  getSessionSummary,
  getFlashcardConfig,
  getFlashcardStats,
  getMnemonics,
  createWeakWordsDeck,
  createDueReviewDeck,
} from '../lib/flashcardService';
import { getAllWords, getWordsByRoot, isVocabularyLoaded } from '../lib/vocabularyAsync';
import { getProgress, getBookProgress } from '../lib/progressService';
import { useUserSettings } from '../contexts/UserSettingsContext';
import type {
  Flashcard,
  FlashcardDeck,
  FlashcardSession,
  CardDirection,
} from '../types/flashcard';

type PageState = 'selecting' | 'practicing' | 'complete';

// Helper to extract book number from lesson ID
function getBookFromLessonId(lessonId: string): number {
  // Format: b1-l01, b2-l15, nahw-u1, sarf-u1
  if (lessonId.startsWith('b1-')) return 1;
  if (lessonId.startsWith('b2-')) return 2;
  if (lessonId.startsWith('b3-')) return 3;
  if (lessonId.startsWith('nahw-')) return 0; // Nahw
  if (lessonId.startsWith('sarf-')) return -1; // Sarf
  return 0;
}

export function FlashcardPractice() {
  // User settings for gating
  const { settings } = useUserSettings();

  // Page state
  const [pageState, setPageState] = useState<PageState>('selecting');

  // Deck selection - use lazy initialization to load from config
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [direction, setDirection] = useState<CardDirection>(() => {
    const config = getFlashcardConfig();
    return config.defaultDirection;
  });
  const [showVowels, setShowVowels] = useState(() => {
    const config = getFlashcardConfig();
    return config.showVowelsByDefault;
  });

  // Session state
  const [session, setSession] = useState<FlashcardSession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipStartTime, setFlipStartTime] = useState<number | null>(null);

  // Check if a book is locked
  const isBookLocked = useCallback((book: number): boolean => {
    if (!settings) return book > 1; // Default: only book 1 unlocked
    return !settings.isBookUnlocked(book);
  }, [settings]);

  // Get book mastery percentage
  const getBookMastery = useCallback((book: number): number => {
    const bookProgress = getBookProgress(book);
    return bookProgress.masteryPercent;
  }, []);

  // Get unlocked word IDs (only words from unlocked books)
  const getUnlockedWordIds = useCallback((allWords: { id: string; lesson: string }[]): string[] => {
    return allWords
      .filter(w => {
        const book = getBookFromLessonId(w.lesson);
        // Supplementary content (Nahw=0, Sarf=-1) is always available
        if (book <= 0) return true;
        return !isBookLocked(book);
      })
      .map(w => w.id);
  }, [isBookLocked]);

  // Generate decks organized by category
  const { recommendedDecks, bookDecks, supplementaryDecks } = useMemo(() => {
    // Wait for vocabulary to be loaded
    if (!isVocabularyLoaded()) {
      return { recommendedDecks: [], bookDecks: [], supplementaryDecks: [] };
    }

    const progress = getProgress();
    const flashcardStats = getFlashcardStats();
    const allWords = getAllWords();

    // Get unlocked word IDs for recommended decks
    const unlockedWordIds = getUnlockedWordIds(allWords);

    // RECOMMENDED DECKS (filtered by gating)
    const recommended: FlashcardDeck[] = [];

    // Due review deck (words not seen in 7+ days)
    const dueDeck = createDueReviewDeck(unlockedWordIds, flashcardStats, 7);
    if (dueDeck.wordIds.length > 0) {
      recommended.push(dueDeck);
    }

    // Weak words deck (below 50% mastery)
    const weakDeck = createWeakWordsDeck(unlockedWordIds, progress.wordMastery);
    if (weakDeck.wordIds.length > 0) {
      recommended.push(weakDeck);
    }

    // BOOK DECKS (aggregate all lessons per book)
    const books: FlashcardDeck[] = [];

    for (const bookNum of [1, 2, 3]) {
      const bookWords = allWords.filter(w => getBookFromLessonId(w.lesson) === bookNum);
      if (bookWords.length > 0) {
        books.push({
          id: `book-${bookNum}`,
          name: `Book ${bookNum}`,
          nameAr: bookNum === 1 ? 'الكِتَاب ١' : bookNum === 2 ? 'الكِتَاب ٢' : 'الكِتَاب ٣',
          description: `All vocabulary from Book ${bookNum}`,
          type: 'book',
          bookNumber: bookNum,
          wordIds: bookWords.map(w => w.id),
        });
      }
    }

    // SUPPLEMENTARY DECKS (Nahw and Sarf)
    const supplementary: FlashcardDeck[] = [];

    // Nahw deck (all nahw units combined)
    const nahwWords = allWords.filter(w => w.lesson.startsWith('nahw-'));
    if (nahwWords.length > 0) {
      supplementary.push({
        id: 'nahw-all',
        name: 'Nahw',
        nameAr: 'النَّحْو',
        description: 'Grammar vocabulary',
        type: 'topic',
        bookNumber: 0,
        wordIds: nahwWords.map(w => w.id),
      });
    }

    // Sarf deck (all sarf units combined)
    const sarfWords = allWords.filter(w => w.lesson.startsWith('sarf-'));
    if (sarfWords.length > 0) {
      supplementary.push({
        id: 'sarf-all',
        name: 'Sarf',
        nameAr: 'الصَّرْف',
        description: 'Morphology vocabulary',
        type: 'topic',
        bookNumber: -1,
        wordIds: sarfWords.map(w => w.id),
      });
    }

    return {
      recommendedDecks: recommended,
      bookDecks: books,
      supplementaryDecks: supplementary,
    };
  }, [getUnlockedWordIds]);

  // Combine all decks for lookup
  const allDecks = useMemo(() => [
    ...recommendedDecks,
    ...bookDecks,
    ...supplementaryDecks,
  ], [recommendedDecks, bookDecks, supplementaryDecks]);

  // Create flashcards for selected deck
  const createCardsForDeck = useCallback(
    (deck: FlashcardDeck): Flashcard[] => {
      const mnemonics = getMnemonics();
      const allWords = getAllWords();
      const wordMap = new Map(allWords.map((w) => [w.id, w]));

      return deck.wordIds
        .map((wordId) => {
          const word = wordMap.get(wordId);
          if (!word) return null;

          // Get related forms from same root
          const relatedForms = word.root
            ? getWordsByRoot(word.root)
                .filter((w) => w.id !== wordId)
                .map((w) => w.arabic)
                .slice(0, 3)
            : undefined;

          return wordToFlashcard(word, relatedForms, mnemonics[wordId]);
        })
        .filter((card): card is Flashcard => card !== null);
    },
    []
  );

  // Start session
  const handleStartSession = useCallback(() => {
    if (!selectedDeckId) return;

    const deck = allDecks.find((d) => d.id === selectedDeckId);
    if (!deck) return;

    const cards = createCardsForDeck(deck);
    if (cards.length === 0) return;

    const newSession = createFlashcardSession(deck, cards, direction, showVowels);
    setSession(newSession);
    setIsFlipped(false);
    setFlipStartTime(null);
    setPageState('practicing');
  }, [selectedDeckId, allDecks, createCardsForDeck, direction, showVowels]);

  // Flip card
  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
      setFlipStartTime(Date.now());
    }
  }, [isFlipped]);

  // Handle answer
  const handleKnew = useCallback(
    (knew: boolean) => {
      if (!session || !flipStartTime) return;

      const responseTimeMs = Date.now() - flipStartTime;
      const newSession = processCardAnswer(session, knew, responseTimeMs);

      if (newSession.isComplete) {
        setSession(newSession);
        setPageState('complete');
      } else {
        setSession(newSession);
        setIsFlipped(false);
        setFlipStartTime(null);
      }
    },
    [session, flipStartTime]
  );

  // Reset to deck selection
  const handleChangeDeck = useCallback(() => {
    setSession(null);
    setIsFlipped(false);
    setFlipStartTime(null);
    setPageState('selecting');
  }, []);

  // Practice again with same deck
  const handlePracticeAgain = useCallback(() => {
    if (!selectedDeckId) return;

    const deck = allDecks.find((d) => d.id === selectedDeckId);
    if (!deck) return;

    const cards = createCardsForDeck(deck);
    if (cards.length === 0) return;

    const newSession = createFlashcardSession(deck, cards, direction, showVowels);
    setSession(newSession);
    setIsFlipped(false);
    setFlipStartTime(null);
    setPageState('practicing');
  }, [selectedDeckId, allDecks, createCardsForDeck, direction, showVowels]);

  // Calculate progress
  const progress = session
    ? Math.round((session.currentIndex / session.cards.length) * 100)
    : 0;

  const currentCard = session?.cards[session.currentIndex];

  // Render deck selection
  if (pageState === 'selecting') {
    return (
      <>
        <Header title="Word Cards" titleArabic="بِطَاقَات" showBackButton />
        <PageContainer>
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Practice', to: '/practice' },
              { label: 'Flashcards', labelArabic: 'بطاقات' }
            ]}
            className="mb-4"
          />
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-2">
              Nation-Style Word Cards
            </h1>
            <p className="text-[var(--color-ink-muted)]">
              Deliberate vocabulary learning with optimal card design based on
              Paul Nation's research.
            </p>
          </div>

          {allDecks.length > 0 ? (
            <FlashcardDeckSelector
              recommendedDecks={recommendedDecks}
              bookDecks={bookDecks}
              supplementaryDecks={supplementaryDecks}
              selectedDeckId={selectedDeckId}
              direction={direction}
              showVowels={showVowels}
              onSelectDeck={setSelectedDeckId}
              onChangeDirection={setDirection}
              onChangeShowVowels={setShowVowels}
              onStartSession={handleStartSession}
              isBookLocked={isBookLocked}
              getBookMastery={getBookMastery}
            />
          ) : (
            <Card variant="default" padding="lg" className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand-200)] dark:bg-[var(--color-sand-700)] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--color-ink-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--color-ink)] mb-2">
                No Vocabulary Available
              </h3>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Start practicing lessons to build your vocabulary.
              </p>
            </Card>
          )}
        </PageContainer>
      </>
    );
  }

  // Render practice session
  if (pageState === 'practicing' && session && currentCard) {
    return (
      <>
        <Header title="Word Cards" titleArabic="بِطَاقَات" showBackButton />
        <PageContainer>
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-[var(--color-ink-muted)] mb-2">
              <span>
                Card {session.currentIndex + 1} of {session.cards.length}
              </span>
              <span>{session.correctCount} correct</span>
            </div>
            <ProgressBar value={progress} max={100} variant="default" />
          </div>

          {/* Direction indicator */}
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-sand-200)] dark:bg-[var(--color-sand-700)] text-[var(--color-ink-muted)]">
              {direction === 'receptive'
                ? 'Arabic → English'
                : 'English → Arabic'}
            </span>
          </div>

          {/* Flashcard */}
          <FlashcardCard
            key={session.currentIndex}
            card={currentCard}
            direction={direction}
            showVowels={showVowels}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onKnew={handleKnew}
            showButtons={isFlipped}
          />

          {/* Skip button (only when not flipped) */}
          {!isFlipped && (
            <div className="flex justify-center mt-6">
              <Button variant="ghost" size="sm" onClick={handleChangeDeck}>
                Exit Session
              </Button>
            </div>
          )}
        </PageContainer>
      </>
    );
  }

  // Render session complete
  if (pageState === 'complete' && session) {
    const summary = getSessionSummary(session);

    return (
      <>
        <Header title="Word Cards" titleArabic="بِطَاقَات" showBackButton />
        <PageContainer>
          <FlashcardSessionSummary
            totalCards={summary.totalCards}
            correctCount={summary.correctCount}
            accuracy={summary.accuracy}
            duration={summary.duration}
            cardsPerMinute={summary.cardsPerMinute}
            onPracticeAgain={handlePracticeAgain}
            onChangeDeck={handleChangeDeck}
          />
        </PageContainer>
      </>
    );
  }

  // Fallback
  return null;
}

export default FlashcardPractice;
