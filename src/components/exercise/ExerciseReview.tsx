import type { Exercise } from '../../types/exercise';

interface ExerciseReviewProps {
  exercise: Exercise;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

/**
 * Renders an answer inline with visual cues for correctness.
 */
function InlineAnswer({
  userAnswer,
  correctAnswer,
  isCorrect,
  className = '',
}: {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  className?: string;
}) {
  if (isCorrect) {
    return (
      <span
        className={`inline-block px-3 py-1 rounded-lg bg-[var(--color-success-light)] text-[var(--color-success)] font-medium ${className}`}
        dir="rtl"
      >
        {userAnswer}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span
        className="inline-block px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-[var(--color-error)] line-through opacity-80"
        dir="rtl"
      >
        {userAnswer || '—'}
      </span>
      <span
        className="inline-block px-3 py-1 rounded-lg bg-[var(--color-success-light)] text-[var(--color-success)] font-medium"
        dir="rtl"
      >
        {correctAnswer}
      </span>
    </span>
  );
}

/**
 * Read-only display of a completed exercise for review mode.
 * Shows the exercise content with the answer displayed in-context.
 */
export function ExerciseReview({
  exercise,
  userAnswer,
  correctAnswer,
  isCorrect,
}: ExerciseReviewProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Review mode badge */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-sand-200)] text-[var(--color-ink-muted)] text-sm font-medium rounded-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Review Mode
        </span>

        {/* Result indicator */}
        <span
          className={`
            inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full
            ${isCorrect
              ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
              : 'bg-red-100 dark:bg-red-900/30 text-[var(--color-error)]'
            }
          `}
        >
          {isCorrect ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Correct
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Needs Practice
            </>
          )}
        </span>
      </div>

      {/* Exercise content with inline answer */}
      <div className="bg-white dark:bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-sand-200)] p-6">
        <ExerciseContent
          exercise={exercise}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
        />
      </div>
    </div>
  );
}

interface ExerciseContentProps {
  exercise: Exercise;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

/**
 * Displays the exercise prompt with the answer shown in-context.
 */
function ExerciseContent({ exercise, userAnswer, correctAnswer, isCorrect }: ExerciseContentProps) {
  switch (exercise.type) {
    case 'fill-blank': {
      const fillBlank = exercise as unknown as { prompt: string; englishHint?: string };
      // Split prompt on blank marker (2+ underscores or 3+ dots)
      const blankPattern = /_{2,}|\.{3,}/;
      const parts = fillBlank.prompt.split(blankPattern);

      return (
        <div className="space-y-4">
          <div className="text-center">
            <p className="arabic-xl text-[var(--color-ink)] leading-relaxed" dir="rtl">
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <InlineAnswer
                    userAnswer={userAnswer}
                    correctAnswer={correctAnswer}
                    isCorrect={isCorrect}
                    className="arabic-xl mx-1 align-middle"
                  />
                  {parts[1]}
                </>
              ) : (
                // No blank found, show answer below
                <>
                  {fillBlank.prompt}
                  <span className="block mt-4">
                    <InlineAnswer
                      userAnswer={userAnswer}
                      correctAnswer={correctAnswer}
                      isCorrect={isCorrect}
                      className="arabic-xl"
                    />
                  </span>
                </>
              )}
            </p>
          </div>
          {fillBlank.englishHint && (
            <p className="text-center text-sm text-[var(--color-ink-muted)]">
              {fillBlank.englishHint}
            </p>
          )}
        </div>
      );
    }

    case 'translate-to-arabic': {
      const translate = exercise as unknown as { prompt: string };
      return (
        <div className="space-y-4 text-center">
          <p className="text-lg text-[var(--color-ink)]">
            {translate.prompt}
          </p>
          <div className="pt-2">
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="arabic-xl"
            />
          </div>
        </div>
      );
    }

    case 'word-to-meaning': {
      const wordMeaning = exercise as unknown as { prompt: string };
      return (
        <div className="space-y-4 text-center">
          <p className="arabic-xl text-[var(--color-ink)]" dir="rtl">
            {wordMeaning.prompt}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Select the correct meaning
          </p>
          <div className="pt-2">
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="text-lg"
            />
          </div>
        </div>
      );
    }

    case 'meaning-to-word': {
      const meaningWord = exercise as unknown as { prompt: string };
      return (
        <div className="space-y-4 text-center">
          <p className="text-lg text-[var(--color-ink)]">
            {meaningWord.prompt}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Select the correct Arabic word
          </p>
          <div className="pt-2">
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="arabic-xl"
            />
          </div>
        </div>
      );
    }

    case 'error-correction': {
      const errorCorrection = exercise as unknown as { sentenceWithError: string };
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)] text-center">
            Find and correct the error:
          </p>
          <p className="arabic-xl text-[var(--color-ink)] text-center opacity-60 line-through" dir="rtl">
            {errorCorrection.sentenceWithError}
          </p>
          <div className="text-center pt-2">
            <span className="text-sm text-[var(--color-ink-muted)] mr-2">Your correction:</span>
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="arabic-xl"
            />
          </div>
        </div>
      );
    }

    case 'multi-cloze': {
      const multiCloze = exercise as unknown as { prompt: string };
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)] text-center">
            Fill in all the blanks:
          </p>
          <p className="arabic-xl text-[var(--color-ink)] text-center" dir="rtl">
            {multiCloze.prompt}
          </p>
          <div className="text-center pt-2">
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="arabic-xl"
            />
          </div>
        </div>
      );
    }

    case 'semantic-field': {
      const semanticField = exercise as unknown as { instruction?: string };
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            {semanticField.instruction || 'Categorize the words:'}
          </p>
          <div className="pt-2">
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="arabic-lg"
            />
          </div>
        </div>
      );
    }

    case 'sentence-unscramble': {
      const unscramble = exercise as unknown as { englishHint?: string };
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Arrange the words in the correct order
          </p>
          {unscramble.englishHint && (
            <p className="text-lg text-[var(--color-ink)]">
              {unscramble.englishHint}
            </p>
          )}
          <div className="pt-2">
            <InlineAnswer
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              isCorrect={isCorrect}
              className="arabic-xl"
            />
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="space-y-4 text-center">
          <p className="text-[var(--color-ink-muted)]">
            Exercise type: {exercise.type}
          </p>
          <InlineAnswer
            userAnswer={userAnswer}
            correctAnswer={correctAnswer}
            isCorrect={isCorrect}
            className="arabic-lg"
          />
        </div>
      );
  }
}

export default ExerciseReview;
