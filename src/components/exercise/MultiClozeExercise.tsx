import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ArabicInput } from '../ui/ArabicInput';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { checkMultiCloze, BLANK_MARKER } from '../../lib/multiClozeUtils';
import type {
  MultiClozeExercise as MultiClozeExerciseType,
  ExerciseState,
} from '../../types/exercise';

interface MultiClozeExerciseProps {
  exercise: MultiClozeExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    correctCount?: number;
    totalBlanks?: number;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
}

/**
 * Multi-Cloze Exercise Component
 * 
 * Shows a sentence with multiple blanks (2-3) that the user must fill in.
 * Based on research showing that multiple retrieval attempts in context
 * strengthen associative memory networks.
 */
export function MultiClozeExercise({
  exercise,
  onComplete,
  showFeedback = true,
}: MultiClozeExerciseProps) {
  const [userAnswers, setUserAnswers] = useState<string[]>(() => 
    exercise.blanks.map(() => '')
  );
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof checkMultiCloze> | null>(null);
  const [activeInput, setActiveInput] = useState(0);
  const [startTime] = useState(() => Date.now());
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleAnswerChange = useCallback((index: number, value: string) => {
    setUserAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    // Tab or Enter to move to next input
    if (e.key === 'Tab' && !e.shiftKey && index < exercise.blanks.length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }
    // Shift+Tab to move to previous input
    if (e.key === 'Tab' && e.shiftKey && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    }
  }, [exercise.blanks.length]);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    if (hasSubmitted) return;
    
    // Check if at least one answer is filled
    const hasAnyAnswer = userAnswers.some(a => a.trim());
    if (!hasAnyAnswer) return;

    const responseTimeMs = Date.now() - startTime;
    const checkResult = checkMultiCloze(userAnswers, exercise);

    setState(checkResult.isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    setResult(checkResult);

    onComplete(checkResult.isCorrect, userAnswers.join(' | '), {
      correctCount: checkResult.correctCount,
      totalBlanks: checkResult.totalBlanks,
      responseTimeMs,
    });
  }, [userAnswers, hasSubmitted, exercise, onComplete, startTime]);

  // Parse prompt to render with inline blanks
  const renderPromptWithBlanks = () => {
    const parts = exercise.prompt.split(BLANK_MARKER);
    
    return (
      <div className="arabic-xl text-[var(--color-ink)] leading-loose" dir="rtl">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="inline-block align-middle mx-1">
                {hasSubmitted ? (
                  // Show result inline
                  <span className={`
                    inline-block px-2 py-1 rounded min-w-[60px] text-center
                    ${result?.blankResults[index]?.isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                    }
                  `}>
                    {userAnswers[index] || '—'}
                    {!result?.blankResults[index]?.isCorrect && (
                      <span className="block text-xs mt-0.5">
                        ← {result?.blankResults[index]?.correctAnswer}
                      </span>
                    )}
                  </span>
                ) : (
                  // Show input
                  <span 
                    className={`
                      inline-block border-b-2 min-w-[80px] px-1
                      ${activeInput === index 
                        ? 'border-[var(--color-primary)]' 
                        : 'border-[var(--color-border)]'
                      }
                    `}
                  >
                    <span className="text-[var(--color-ink-muted)] text-sm">
                      {index + 1}
                    </span>
                  </span>
                )}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <ExerciseCard type="multi-cloze" state={state}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          {exercise.blanks.map((_, index) => (
            <div
              key={index}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                transition-colors
                ${hasSubmitted
                  ? result?.blankResults[index]?.isCorrect
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                  : activeInput === index
                    ? 'bg-indigo-600 text-white'
                    : userAnswers[index]
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'bg-[var(--color-sand-200)] text-[var(--color-ink-muted)]'
                }
              `}
            >
              {hasSubmitted ? (
                result?.blankResults[index]?.isCorrect ? '✓' : '✗'
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>

        {/* Sentence with blanks */}
        <div className="text-center py-4">
          {renderPromptWithBlanks()}

          {/* English hint */}
          {exercise.promptEn && (
            <p className="text-sm text-[var(--color-ink-muted)] mt-4">
              {exercise.promptEn}
            </p>
          )}
        </div>

        {/* Input fields for each blank */}
        {!hasSubmitted && (
          <div className="space-y-3">
            {exercise.blanks.map((blank, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${activeInput === index 
                    ? 'bg-[var(--color-primary)] text-white' 
                    : 'bg-[var(--color-sand-200)] text-[var(--color-ink-muted)]'
                  }
                `}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <ArabicInput
                    ref={(el) => { inputRefs.current[index] = el; }}
                    value={userAnswers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => setActiveInput(index)}
                    placeholder={blank.hint || `الكلمة ${index + 1}...`}
                    state="default"
                    disabled={hasSubmitted}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit button */}
        {!hasSubmitted && (
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={!userAnswers.some(a => a.trim())}
          >
            Check All Answers
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && hasSubmitted && result && (
          <div className="space-y-4">
            {/* Score summary */}
            <div className={`
              text-center p-4 rounded-lg
              ${result.isCorrect
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : 'bg-rose-100 dark:bg-rose-900/50'
              }
            `}>
              <div className={`
                text-2xl font-bold mb-1
                ${result.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}
              `}>
                {result.correctCount}/{result.totalBlanks}
              </div>
              <div className="text-sm text-[var(--color-ink-muted)]">
                {result.feedback}
              </div>
            </div>

            {/* Complete sentence */}
            <div className="p-4 bg-[var(--color-sand-100)] rounded-lg">
              <p className="text-xs text-[var(--color-ink-muted)] mb-2">Complete sentence:</p>
              <p className="arabic text-lg text-center" dir="rtl">
                {exercise.completeSentence}
              </p>
            </div>

            {/* Standard feedback component */}
            <ExerciseFeedback
              isCorrect={result.isCorrect}
              correctAnswer={exercise.completeSentence}
              userAnswer={userAnswers.join(' | ')}
              message={result.isCorrect ? 'All blanks filled correctly!' : undefined}
            />
          </div>
        )}
      </form>
    </ExerciseCard>
  );
}

export default MultiClozeExercise;
