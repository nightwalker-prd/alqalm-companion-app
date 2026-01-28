import { analyzeArabicError, getErrorExplanation } from '../../lib/arabic';
import type { ArabicErrorType } from '../../types/progress';
import type { RetryHint } from '../../lib/retryHints';
import { MAX_RETRY_ATTEMPTS } from '../../lib/retryHints';

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  message?: string;
  /** Whether to show detailed error analysis for Arabic answers */
  showErrorAnalysis?: boolean;
  /** Whether the answer was generated without hints (for bonus feedback) */
  generatedWithoutHints?: boolean;
  /** Whether this is retry mode (shows hint instead of full answer) */
  retryMode?: boolean;
  /** Retry hint to display when in retry mode */
  retryHint?: RetryHint;
  /** Whether user succeeded after retries (for celebration) */
  succeededAfterRetries?: boolean;
  /** Number of retries it took to succeed */
  retryCount?: number;
}

export function ExerciseFeedback({
  isCorrect,
  correctAnswer,
  userAnswer,
  message,
  showErrorAnalysis = true,
  generatedWithoutHints = false,
  retryMode = false,
  retryHint,
  succeededAfterRetries = false,
  retryCount = 0,
}: ExerciseFeedbackProps) {
  // Analyze error if incorrect and analysis is enabled (not in retry mode)
  const errorAnalysis = !isCorrect && showErrorAnalysis && !retryMode
    ? analyzeArabicError(correctAnswer, userAnswer)
    : null;

  // In retry mode with hints remaining, show retry-specific feedback
  if (retryMode && retryHint && !retryHint.showFullAnswer) {
    return (
      <RetryFeedback 
        hint={retryHint} 
        userAnswer={userAnswer}
      />
    );
  }

  return (
    <div
      className={`
        p-4 rounded-[var(--radius-md)]
        animate-slide-up
        ${isCorrect
          ? 'bg-[var(--color-success-light)] border border-[var(--color-success)] border-opacity-30'
          : 'bg-white border-2 border-[var(--color-error)]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <FeedbackIcon isCorrect={isCorrect} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`
                font-semibold text-base
                ${isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}
              `}
            >
              {message || (isCorrect ? 'Excellent!' : 'Not quite right')}
            </p>
            
            {/* Generation bonus indicator */}
            {isCorrect && generatedWithoutHints && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Recalled from memory!
              </span>
            )}

            {/* Succeeded after retries indicator */}
            {isCorrect && succeededAfterRetries && retryCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Got it on attempt {retryCount + 1}!
              </span>
            )}
          </div>

          {/* Learning encouragement for success after retries */}
          {isCorrect && succeededAfterRetries && (
            <p className="text-xs text-[var(--color-ink)] mt-2 italic">
              The struggle made this stronger in your memory!
            </p>
          )}

          {!isCorrect && (
            <div className="mt-3 space-y-3">
              {/* Final attempt message when max retries reached */}
              {retryMode && retryHint?.showFullAnswer && (
                <div className="p-3 bg-[var(--color-sand-100)] rounded-[var(--radius-sm)] border border-[var(--color-sand-200)]">
                  <p className="text-sm text-[var(--color-ink)] font-medium mb-1">
                    {retryHint.message}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Take a moment to study the correct answer below.
                  </p>
                </div>
              )}

              {/* Error type explanation (not shown in retry mode) */}
              {errorAnalysis && !retryMode && (
                <div className="p-3 bg-[var(--color-sand-100)] rounded-[var(--radius-sm)] border border-[var(--color-sand-200)]">
                  <p className="text-sm text-[var(--color-ink)]">
                    {getErrorExplanation(errorAnalysis.errorType, correctAnswer, userAnswer)}
                  </p>
                  <ErrorTypeBadge errorType={errorAnalysis.errorType} />
                </div>
              )}

              <div className="space-y-2 p-3 bg-[var(--color-sand-50)] rounded-[var(--radius-sm)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-ink)] font-medium">Your answer:</span>
                  <span className="arabic-base text-[var(--color-ink)] line-through opacity-70" dir="rtl">
                    {userAnswer}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-sand-200)]">
                  <span className="text-[var(--color-ink)] font-medium">Correct answer:</span>
                  <span className="arabic-base text-[var(--color-success)] font-bold" dir="rtl">
                    {correctAnswer}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isCorrect && (
            <div className="mt-2">
              <span className="arabic-base text-[var(--color-success)]" dir="rtl">
                {correctAnswer}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Retry feedback shown when user has attempts remaining.
 * Displays learning-focused message and progressive hints.
 */
function RetryFeedback({ 
  hint, 
  userAnswer 
}: { 
  hint: RetryHint; 
  userAnswer: string;
}) {
  return (
    <div className="p-4 bg-white border-2 border-[var(--color-primary)] rounded-[var(--radius-lg)] shadow-sm animate-slide-up">
      {/* Learning-focused message */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-700 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {hint.message}
          </p>
          
          {/* Show what they answered */}
          <p className="text-xs text-[var(--color-ink)] mt-1">
            You answered: <span className="arabic-base" dir="rtl">{userAnswer}</span>
          </p>
        </div>
      </div>

      {/* Hint display */}
      {hint.hintText && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-[var(--radius-md)] shadow-sm border border-[var(--color-sand-200)]">
            <span className="text-xs text-[var(--color-ink)] font-medium">Hint:</span>
            <span className="arabic-lg font-semibold text-[var(--color-ink)]" dir="rtl">
              {hint.hintText}
            </span>
          </div>
        </div>
      )}

      {/* Progress indicator - dots showing attempt progress */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-[var(--radius-md)] shadow-sm border border-[var(--color-sand-200)]">
          <span className="text-xs text-[var(--color-ink)] font-medium">
            Attempt {hint.level} of {MAX_RETRY_ATTEMPTS}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_RETRY_ATTEMPTS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < hint.level
                    ? 'bg-[var(--color-error)]'
                    : 'bg-[var(--color-sand-300)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackIcon({ isCorrect }: { isCorrect: boolean }) {
  return (
    <div
      className={`
        flex-shrink-0 w-8 h-8 rounded-full
        flex items-center justify-center
        ${isCorrect ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}
      `}
    >
      {isCorrect ? (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}

/**
 * Small badge showing the error type classification
 */
function ErrorTypeBadge({ errorType }: { errorType: ArabicErrorType }) {
  const labels: Record<ArabicErrorType, { text: string; icon: string }> = {
    tashkeel_missing: { text: 'Missing diacritics', icon: '◌' },
    tashkeel_wrong: { text: 'Wrong diacritics', icon: '◌' },
    letter_confusion: { text: 'Letter confusion', icon: '↔' },
    word_order: { text: 'Word order', icon: '⇄' },
    vocabulary_unknown: { text: 'Vocabulary', icon: '?' },
    partial_match: { text: 'Almost there', icon: '~' },
    spelling_error: { text: 'Spelling', icon: '✏' },
    typo: { text: 'Typo', icon: '⌨' },
  };

  const { text, icon } = labels[errorType];

  return (
    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-full">
      <span>{icon}</span>
      <span>{text}</span>
    </span>
  );
}

export default ExerciseFeedback;
