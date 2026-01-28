import { useState, useCallback, type FormEvent } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ArabicInput } from '../ui/ArabicInput';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { checkErrorCorrection, getErrorTypeLabel } from '../../lib/errorCorrectionUtils';
import type {
  ErrorCorrectionExercise as ErrorCorrectionExerciseType,
  ExerciseState,
} from '../../types/exercise';

interface ErrorCorrectionExerciseProps {
  exercise: ErrorCorrectionExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    identifiedError?: boolean;
    correctedProperly?: boolean;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
}

/**
 * Error Correction Exercise Component
 * 
 * Shows a sentence with an intentional grammar error.
 * The user must find the error and type the corrected sentence.
 */
export function ErrorCorrectionExercise({
  exercise,
  onComplete,
  showFeedback = true,
}: ErrorCorrectionExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [startTime] = useState(() => Date.now());

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    if (hasSubmitted) return;
    if (!userAnswer.trim()) return;

    const responseTimeMs = Date.now() - startTime;
    const result = checkErrorCorrection(userAnswer, exercise);

    setState(result.isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    setFeedbackMessage(result.feedback);

    onComplete(result.isCorrect, userAnswer, {
      identifiedError: result.identifiedError,
      correctedProperly: result.correctedProperly,
      responseTimeMs,
    });
  }, [userAnswer, hasSubmitted, exercise, onComplete, startTime]);

  return (
    <ExerciseCard type="error-correction" state={state}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Instructions */}
        <div className="text-center text-sm text-[var(--color-ink-muted)]">
          Find and correct the error in this sentence
        </div>

        {/* Error type badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Contains: {getErrorTypeLabel(exercise.errorType)}
          </span>
        </div>

        {/* Sentence with error */}
        <div className="text-center py-4">
          <div 
            className="arabic-xl text-[var(--color-ink)] leading-relaxed"
            dir="rtl"
          >
            <span className={`
              inline-block px-4 py-3 rounded-lg
              ${state === 'unanswered' ? 'bg-rose-100/50 dark:bg-rose-900/25 border border-rose-200 dark:border-rose-800' : ''}
              ${state === 'correct' ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}
              ${state === 'incorrect' ? 'bg-rose-100 dark:bg-rose-900/50' : ''}
            `}>
              {exercise.sentenceWithError}
            </span>
          </div>

          {/* English hint */}
          {exercise.englishHint && (
            <p className="text-sm text-[var(--color-ink-muted)] mt-4">
              Meaning: {exercise.englishHint}
            </p>
          )}
        </div>

        {/* Divider with arrow */}
        <div className="flex items-center justify-center gap-3 text-[var(--color-ink-muted)]">
          <div className="h-px flex-1 bg-[var(--color-border)]"></div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <div className="h-px flex-1 bg-[var(--color-border)]"></div>
        </div>

        {/* Input label */}
        <label className="block text-sm text-center text-[var(--color-ink-muted)]">
          Write the corrected sentence:
        </label>

        {/* Arabic input */}
        <ArabicInput
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="اكتب الجملة الصحيحة هنا..."
          state={state === 'unanswered' ? 'default' : state}
          disabled={hasSubmitted}
          autoFocus
        />

        {/* Submit button */}
        {!hasSubmitted && (
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={!userAnswer.trim()}
          >
            Check Correction
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && hasSubmitted && (
          <div className="space-y-4">
            <ExerciseFeedback
              isCorrect={state === 'correct'}
              correctAnswer={exercise.correctSentence}
              userAnswer={userAnswer}
              message={feedbackMessage}
            />

            {/* Additional explanation for errors */}
            {state === 'incorrect' && exercise.explanation && (
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                      {getErrorTypeLabel(exercise.errorType)}
                    </p>
                    <p className="text-[var(--color-ink-muted)]">
                      The error was in "<span className="arabic">{exercise.errorWord}</span>" which should be "<span className="arabic">{exercise.correctWord}</span>"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show correct vs incorrect comparison */}
            {state === 'incorrect' && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-800">
                  <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">With Error</p>
                  <p className="arabic text-sm" dir="rtl">{exercise.sentenceWithError}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Correct</p>
                  <p className="arabic text-sm" dir="rtl">{exercise.correctSentence}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </ExerciseCard>
  );
}

export default ErrorCorrectionExercise;
