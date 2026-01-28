import { useState, useCallback } from 'react';
import type { ReadingPassage, ReadingProgress } from '../../types/reading';
import { Button } from '../ui/Button';
import { ReadingTimer } from './ReadingTimer';
import { TappableText } from '../dictionary';

interface PassageReaderProps {
  passage: ReadingPassage;
  progress: ReadingProgress | null;
  onMarkRead: () => void;
}

/**
 * PassageReader - Full reading view for a passage.
 *
 * Features:
 * - RTL Arabic text display with proper styling
 * - Toggle for English translation
 * - Vocabulary highlights panel
 * - Grammar concepts display
 * - Mark as read button
 */
export function PassageReader({
  passage,
  progress,
  onMarkRead,
}: PassageReaderProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);

  const isRead = progress?.completed ?? false;
  const timesRead = progress?.timesRead ?? 0;

  const toggleTranslation = useCallback(() => {
    setShowTranslation((prev) => !prev);
  }, []);

  const toggleVocabulary = useCallback(() => {
    setShowVocabulary((prev) => !prev);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1
          className="arabic-2xl text-[var(--color-ink)] mb-2"
          dir="rtl"
        >
          {passage.titleAr}
        </h1>
        <h2 className="font-display text-xl text-[var(--color-ink)]">
          {passage.title}
        </h2>
        <div className="flex items-center justify-center gap-3 mt-2 text-sm text-[var(--color-ink-muted)]">
          <LevelBadge level={passage.level} />
          <span>{passage.category}</span>
          <span>{passage.wordCount} words</span>
        </div>
      </div>

      {/* Main reading area */}
      <div
        className="
          bg-white
          border border-[var(--color-sand-200)]
          rounded-[var(--radius-lg)]
          shadow-[var(--shadow-md)]
          p-6
        "
      >
        {/* Arabic text - tap words for definitions */}
        <div
          className="arabic-xl leading-[2.5] text-[var(--color-ink)] text-center"
        >
          <TappableText dir="rtl">
            {passage.text}
          </TappableText>
        </div>
        
        {/* Tap hint */}
        <p className="text-center text-xs text-[var(--color-ink-muted)] mt-4">
          💡 Tap any word for its definition
        </p>

        {/* Translation toggle */}
        {showTranslation && (
          <div className="mt-6 pt-6 border-t border-[var(--color-sand-200)]">
            <h3 className="text-sm font-medium text-[var(--color-ink-muted)] mb-2">
              Translation
            </h3>
            <p className="text-[var(--color-ink)] leading-relaxed">
              {passage.translation}
            </p>
          </div>
        )}
      </div>

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant={showTranslation ? 'primary' : 'secondary'}
          size="sm"
          onClick={toggleTranslation}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          }
        >
          {showTranslation ? 'Hide Translation' : 'Show Translation'}
        </Button>

        {passage.vocabularyHighlights.length > 0 && (
          <Button
            variant={showVocabulary ? 'primary' : 'secondary'}
            size="sm"
            onClick={toggleVocabulary}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          >
            Vocabulary ({passage.vocabularyHighlights.length})
          </Button>
        )}
      </div>

      {/* Vocabulary panel */}
      {showVocabulary && passage.vocabularyHighlights.length > 0 && (
        <div
          className="
            bg-[var(--color-sand-50)]
            border border-[var(--color-sand-200)]
            rounded-[var(--radius-lg)]
            p-4
          "
        >
          <h3 className="font-medium text-[var(--color-ink)] mb-3">
            Key Vocabulary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {passage.vocabularyHighlights.map((vocab, index) => (
              <div
                key={index}
                className="
                  flex items-center justify-between
                  bg-white
                  border border-[var(--color-sand-200)]
                  rounded-[var(--radius-md)]
                  px-3 py-2
                "
              >
                <span className="arabic-base text-[var(--color-ink)]" dir="rtl">
                  {vocab.word}
                </span>
                <span className="text-sm text-[var(--color-ink-muted)]">
                  {vocab.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar concepts */}
      {passage.grammaticalConcepts.length > 0 && (
        <div className="text-center">
          <h3 className="text-sm font-medium text-[var(--color-ink-muted)] mb-2">
            Grammar Concepts
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {passage.grammaticalConcepts.map((concept, index) => (
              <span
                key={index}
                className="
                  px-2 py-1
                  bg-[var(--color-sand-200)]
                  text-[var(--color-ink-muted)]
                  text-xs
                  rounded-full
                "
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Moral lesson */}
      {passage.moralLesson && (
        <div
          className="
            bg-[var(--color-gold-light)]
            border border-[var(--color-gold)]
            rounded-[var(--radius-lg)]
            p-4
            text-center
          "
        >
          <h3 className="text-sm font-medium text-[var(--color-ink)] mb-1">
            Lesson
          </h3>
          <p className="text-[var(--color-ink)] text-sm">
            {passage.moralLesson}
          </p>
        </div>
      )}

      {/* Timed Reading */}
      <ReadingTimer
        passageId={passage.id}
        passageLevel={passage.level}
        wordCount={passage.wordCount}
      />

      {/* Mark as read / stats */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-[var(--color-sand-200)]">
        {isRead ? (
          <div className="flex items-center gap-2 text-[var(--color-success)]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Read {timesRead} {timesRead === 1 ? 'time' : 'times'}
            </span>
          </div>
        ) : null}

        <Button
          variant={isRead ? 'secondary' : 'success'}
          size="md"
          onClick={onMarkRead}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        >
          {isRead ? 'Read Again' : 'Mark as Read'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Level badge component
 */
function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    beginner: {
      bg: 'bg-[var(--color-success)]',
      text: 'text-white',
      label: 'Beginner',
    },
    intermediate: {
      bg: 'bg-[var(--color-gold)]',
      text: 'text-[var(--color-ink)]',
      label: 'Intermediate',
    },
    advanced: {
      bg: 'bg-[var(--color-primary)]',
      text: 'text-white',
      label: 'Advanced',
    },
  };

  const style = styles[level] || styles.beginner;

  return (
    <span
      className={`
        px-2 py-0.5
        rounded-full
        text-xs font-medium
        ${style.bg}
        ${style.text}
      `}
    >
      {style.label}
    </span>
  );
}

export default PassageReader;
