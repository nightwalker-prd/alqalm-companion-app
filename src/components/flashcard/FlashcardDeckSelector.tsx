/**
 * FlashcardDeckSelector Component
 *
 * Redesigned deck selector with:
 * - Recommended section (Due Review, Weak Words)
 * - Book-level decks with gating and mastery bars
 * - Supplementary decks (Nahw, Sarf)
 * - Collapsible settings panel
 */

import { useState } from 'react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import type { FlashcardDeck, CardDirection } from '../../types/flashcard';

interface FlashcardDeckSelectorProps {
  // Deck data
  recommendedDecks: FlashcardDeck[];
  bookDecks: FlashcardDeck[];
  supplementaryDecks: FlashcardDeck[];

  // Selection
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string) => void;

  // Settings
  direction: CardDirection;
  showVowels: boolean;
  onChangeDirection: (direction: CardDirection) => void;
  onChangeShowVowels: (show: boolean) => void;

  // Gating
  isBookLocked: (book: number) => boolean;
  getBookMastery: (book: number) => number;

  // Action
  onStartSession: () => void;
}

export function FlashcardDeckSelector({
  recommendedDecks,
  bookDecks,
  supplementaryDecks,
  selectedDeckId,
  onSelectDeck,
  direction,
  showVowels,
  onChangeDirection,
  onChangeShowVowels,
  onStartSession,
  isBookLocked,
  getBookMastery,
}: FlashcardDeckSelectorProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Find selected deck for the start button
  const allDecks = [...recommendedDecks, ...bookDecks, ...supplementaryDecks];
  const selectedDeck = allDecks.find((d) => d.id === selectedDeckId);

  return (
    <div className="space-y-6 pb-24">
      {/* Recommended Section */}
      {recommendedDecks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📌</span>
            <h3 className="font-display text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Recommended for You
            </h3>
          </div>
          <div className="space-y-2">
            {recommendedDecks.map((deck) => (
              <RecommendedCard
                key={deck.id}
                deck={deck}
                isSelected={deck.id === selectedDeckId}
                onSelect={() => onSelectDeck(deck.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Book Decks Section */}
      {bookDecks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📚</span>
            <h3 className="font-display text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Book Decks
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {bookDecks.map((deck) => (
              <BookDeckCard
                key={deck.id}
                deck={deck}
                isSelected={deck.id === selectedDeckId}
                isLocked={isBookLocked(deck.bookNumber || 0)}
                mastery={getBookMastery(deck.bookNumber || 0)}
                onSelect={() => onSelectDeck(deck.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Supplementary Section */}
      {supplementaryDecks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📖</span>
            <h3 className="font-display text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Supplementary
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {supplementaryDecks.map((deck) => (
              <SupplementaryCard
                key={deck.id}
                deck={deck}
                isSelected={deck.id === selectedDeckId}
                onSelect={() => onSelectDeck(deck.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Collapsible Settings */}
      <section>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] bg-[var(--color-sand-50)] dark:bg-[var(--color-sand-800)] hover:bg-[var(--color-sand-100)] dark:hover:bg-[var(--color-sand-700)] transition-colors"
        >
          <span className="flex items-center gap-2 text-[var(--color-ink)]">
            <svg
              className="w-5 h-5 text-[var(--color-ink-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="font-medium">Settings</span>
          </span>
          <svg
            className={`w-5 h-5 text-[var(--color-ink-muted)] transition-transform ${
              settingsOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {settingsOpen && (
          <div className="mt-2 p-4 rounded-lg border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] bg-white dark:bg-[var(--color-sand-800)] space-y-4">
            {/* Direction toggle */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                Card Direction
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onChangeDirection('receptive')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    direction === 'receptive'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-700)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)] dark:hover:bg-[var(--color-sand-600)]'
                  }`}
                >
                  Receptive
                  <span className="block text-xs opacity-75 mt-0.5">
                    Arabic → English
                  </span>
                </button>
                <button
                  onClick={() => onChangeDirection('productive')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    direction === 'productive'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-700)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)] dark:hover:bg-[var(--color-sand-600)]'
                  }`}
                >
                  Productive
                  <span className="block text-xs opacity-75 mt-0.5">
                    English → Arabic
                  </span>
                </button>
              </div>
            </div>

            {/* Vowels toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Show Vowels (Tashkeel)
                </label>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Hide for advanced practice
                </p>
              </div>
              <button
                onClick={() => onChangeShowVowels(!showVowels)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showVowels
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-sand-300)] dark:bg-[var(--color-sand-600)]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    showVowels ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sticky Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-sand-50)] dark:from-[var(--color-sand-900)] via-[var(--color-sand-50)] dark:via-[var(--color-sand-900)] to-transparent pt-8">
        <div className="max-w-lg mx-auto">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onStartSession}
            disabled={!selectedDeck}
          >
            {selectedDeck ? (
              <>
                Start Practice
                <span className="ml-2 text-sm opacity-75">
                  ({selectedDeck.wordIds.length} cards)
                </span>
              </>
            ) : (
              'Select a deck to start'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Recommended deck card (Due Review, Weak Words)
interface RecommendedCardProps {
  deck: FlashcardDeck;
  isSelected: boolean;
  onSelect: () => void;
}

function RecommendedCard({ deck, isSelected, onSelect }: RecommendedCardProps) {
  const icon = deck.type === 'due-review' ? '⏰' : '🔄';
  const iconBg =
    deck.type === 'due-review'
      ? 'bg-amber-100 dark:bg-amber-900/30'
      : 'bg-blue-100 dark:bg-blue-900/30';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
          : 'border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] hover:border-[var(--color-sand-300)] dark:hover:border-[var(--color-sand-600)] bg-white dark:bg-[var(--color-sand-800)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${iconBg}`}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--color-ink)]">{deck.name}</p>
          {deck.description && (
            <p className="text-xs text-[var(--color-ink-muted)]">
              {deck.description}
            </p>
          )}
        </div>
        <span className="text-sm font-medium text-[var(--color-ink-muted)] bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-700)] px-2 py-1 rounded-full">
          {deck.wordIds.length} cards
        </span>
      </div>
    </button>
  );
}

// Book deck card with lock icon and mastery bar
interface BookDeckCardProps {
  deck: FlashcardDeck;
  isSelected: boolean;
  isLocked: boolean;
  mastery: number;
  onSelect: () => void;
}

function BookDeckCard({
  deck,
  isSelected,
  isLocked,
  mastery,
  onSelect,
}: BookDeckCardProps) {
  const bookNumber = deck.bookNumber || 1;

  return (
    <button
      onClick={() => !isLocked && onSelect()}
      disabled={isLocked}
      className={`relative p-4 rounded-xl border-2 text-center transition-all ${
        isLocked
          ? 'opacity-60 cursor-not-allowed border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)]'
          : isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
          : 'border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] hover:border-[var(--color-sand-300)] dark:hover:border-[var(--color-sand-600)] bg-white dark:bg-[var(--color-sand-800)]'
      }`}
    >
      {/* Lock icon */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <svg
            className="w-4 h-4 text-[var(--color-ink-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      )}

      {/* Book number */}
      <p className="font-display text-lg font-semibold text-[var(--color-ink)]">
        Book {bookNumber}
      </p>

      {/* Card count */}
      <p className="text-sm text-[var(--color-ink-muted)] mt-1">
        {deck.wordIds.length} cards
      </p>

      {/* Mastery bar or unlock requirement */}
      {isLocked ? (
        <p className="text-xs text-[var(--color-ink-muted)] mt-3">
          Complete Book {bookNumber - 1}
        </p>
      ) : (
        <div className="mt-3">
          <ProgressBar value={mastery} max={100} size="sm" variant="mastery" />
          <span className="text-xs text-[var(--color-ink-muted)]">
            {mastery}% mastery
          </span>
        </div>
      )}
    </button>
  );
}

// Supplementary deck card (Nahw, Sarf)
interface SupplementaryCardProps {
  deck: FlashcardDeck;
  isSelected: boolean;
  onSelect: () => void;
}

function SupplementaryCard({
  deck,
  isSelected,
  onSelect,
}: SupplementaryCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 text-center transition-all ${
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
          : 'border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] hover:border-[var(--color-sand-300)] dark:hover:border-[var(--color-sand-600)] bg-white dark:bg-[var(--color-sand-800)]'
      }`}
    >
      <p className="font-display text-lg font-semibold text-[var(--color-ink)]">
        {deck.name}
      </p>
      {deck.nameAr && (
        <p className="font-arabic text-lg text-[var(--color-ink-muted)]">
          {deck.nameAr}
        </p>
      )}
      <p className="text-sm text-[var(--color-ink-muted)] mt-1">
        {deck.wordIds.length} cards
      </p>
    </button>
  );
}

export default FlashcardDeckSelector;
