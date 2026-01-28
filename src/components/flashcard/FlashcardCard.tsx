/**
 * FlashcardCard Component
 *
 * A flippable flashcard implementing Paul Nation's word card design:
 * - Front: L2 (Arabic) in receptive mode, L1 (English) in productive mode
 * - Back: Full context including meaning, example, related forms
 * - Optional mnemonic display
 */

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SpeakButton } from '../ui/SpeakButton';
import type { Flashcard, CardDirection } from '../../types/flashcard';

interface FlashcardCardProps {
  card: Flashcard;
  direction: CardDirection;
  showVowels: boolean;
  isFlipped: boolean;
  onFlip: () => void;
  onKnew: (knew: boolean) => void;
  showButtons?: boolean;
}

export function FlashcardCard({
  card,
  direction,
  showVowels,
  isFlipped,
  onFlip,
  onKnew,
  showButtons = true,
}: FlashcardCardProps) {
  // Determine what to show based on direction
  const frontContent =
    direction === 'receptive'
      ? showVowels
        ? card.arabic
        : card.arabicNoVowels
      : card.english;

  const frontLabel = direction === 'receptive' ? 'Arabic' : 'English';
  const isArabicFront = direction === 'receptive';

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <div
        className={`relative w-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front of card */}
        <div
          className="w-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Card
            variant="elevated"
            padding="lg"
            className="min-h-[280px] flex flex-col cursor-pointer"
            onClick={onFlip}
          >
            {/* Card direction indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
                {frontLabel}
              </span>
              {card.partOfSpeech && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-sand-200)] dark:bg-[var(--color-sand-700)] text-[var(--color-ink-muted)]">
                  {card.partOfSpeech}
                </span>
              )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center">
              <p
                className={`text-center ${
                  isArabicFront
                    ? 'font-arabic text-4xl leading-relaxed'
                    : 'font-display text-2xl'
                } text-[var(--color-ink)]`}
                dir={isArabicFront ? 'rtl' : 'ltr'}
              >
                {frontContent}
              </p>
            </div>

            {/* Speak button for Arabic */}
            {isArabicFront && (
              <div className="flex justify-center mt-4">
                <SpeakButton text={card.arabic} />
              </div>
            )}

            {/* Tap hint */}
            <p className="text-center text-xs text-[var(--color-ink-muted)] mt-4">
              Tap to flip
            </p>
          </Card>
        </div>

        {/* Back of card */}
        <div
          className="w-full absolute top-0 left-0 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <Card
            variant="elevated"
            padding="lg"
            className="min-h-[280px] flex flex-col"
          >
            {/* Back header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
                Answer
              </span>
              {card.root && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-gold)] bg-opacity-25 text-[var(--color-gold)]">
                  Root: {card.root}
                </span>
              )}
            </div>

            {/* Answer content */}
            <div className="flex-1">
              {/* Primary answer */}
              <div className="text-center mb-4">
                <p
                  className={`${
                    direction === 'receptive'
                      ? 'font-display text-2xl'
                      : 'font-arabic text-4xl leading-relaxed'
                  } text-[var(--color-ink)] font-semibold`}
                  dir={direction === 'receptive' ? 'ltr' : 'rtl'}
                >
                  {direction === 'receptive' ? card.english : card.arabic}
                </p>
              </div>

              {/* Full Arabic with vowels (if productive mode and vowels hidden) */}
              {direction === 'productive' && !showVowels && (
                <p className="text-center text-sm text-[var(--color-ink-muted)] mb-2">
                  (with vowels: {card.arabic})
                </p>
              )}

              {/* Example sentence */}
              {card.exampleArabic && (
                <div className="mt-4 p-3 bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)] rounded-lg">
                  <p className="font-arabic text-lg text-center" dir="rtl">
                    {card.exampleArabic}
                  </p>
                  {card.exampleEnglish && (
                    <p className="text-sm text-[var(--color-ink-muted)] text-center mt-1">
                      {card.exampleEnglish}
                    </p>
                  )}
                </div>
              )}

              {/* Related forms */}
              {card.relatedForms && card.relatedForms.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-[var(--color-ink-muted)] mb-1">
                    Related:
                  </p>
                  <p className="font-arabic text-sm" dir="rtl">
                    {card.relatedForms.join(' • ')}
                  </p>
                </div>
              )}

              {/* Mnemonic */}
              {card.mnemonic && (
                <div className="mt-3 p-2 border border-dashed border-[var(--color-sand-300)] dark:border-[var(--color-sand-600)] rounded-lg">
                  <p className="text-xs text-[var(--color-ink-muted)] mb-1">
                    Your mnemonic:
                  </p>
                  <p className="text-sm text-[var(--color-ink)]">
                    {card.mnemonic}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {showButtons && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]">
                <Button
                  variant="error"
                  size="md"
                  fullWidth
                  onClick={() => onKnew(false)}
                >
                  Didn't Know
                </Button>
                <Button
                  variant="success"
                  size="md"
                  fullWidth
                  onClick={() => onKnew(true)}
                >
                  Knew It
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FlashcardCard;
