import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ArabicInput } from '../ui/ArabicInput';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { checkCollocationAnswer } from '../../lib/collocationUtils';
import { fisherYatesShuffle } from '../../lib/interleave';
import type { CollocationExercise as CollocationExerciseType } from '../../types/collocation';
import type { ExerciseState } from '../../types/exercise';

interface CollocationExerciseProps {
  exercise: CollocationExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    responseTimeMs?: number;
    feedback?: string;
  }) => void;
  showFeedback?: boolean;
  /** Show the pattern type (e.g., "Demonstrative + Noun") */
  showPatternHint?: boolean;
  /** The collocation type for context display */
  collocationTypeLabel?: string;
}

export function CollocationExercise({
  exercise,
  onComplete,
  showFeedback = true,
  showPatternHint = false,
  collocationTypeLabel,
}: CollocationExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
  const startTimeRef = useRef<number>(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const isMultipleChoice = exercise.type === 'choose_collocation';

  // Initialize startTime and shuffle options on mount
  // Note: Parent components should use key={exercise.id} to reset state between exercises
  useEffect(() => {
    startTimeRef.current = Date.now();
    if (exercise.options) {
      setShuffledOptions(fisherYatesShuffle([...exercise.options]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    if (hasSubmitted) return;

    const answer = isMultipleChoice ? (selectedOption || '') : userAnswer;
    if (!answer.trim()) return;

    const result = checkCollocationAnswer(answer, exercise.answer);
    const responseTimeMs = Date.now() - startTimeRef.current;

    setState(result.isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    setFeedbackMessage(result.feedback);
    
    onComplete(result.isCorrect, answer, {
      responseTimeMs,
      feedback: result.feedback,
    });
  }, [hasSubmitted, isMultipleChoice, selectedOption, userAnswer, exercise.answer, onComplete]);

  const handleOptionSelect = useCallback((option: string) => {
    if (hasSubmitted) return;
    setSelectedOption(option);
  }, [hasSubmitted]);

  // Get the appropriate title based on exercise type
  const getExerciseTitle = () => {
    switch (exercise.type) {
      case 'complete_collocation':
        return 'Complete the phrase';
      case 'translate_collocation':
        return 'Translate the phrase';
      case 'choose_collocation':
        return 'Choose the correct word';
      case 'match_collocation':
        return 'Match the parts';
      case 'fill_collocation':
        return 'Fill in the blank';
      default:
        return 'Complete the phrase';
    }
  };

  return (
    <ExerciseCard type="fill-blank" state={state}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pattern type hint */}
        {showPatternHint && collocationTypeLabel && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-[var(--color-primary)] text-xs font-medium rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {collocationTypeLabel}
            </span>
          </div>
        )}

        {/* Exercise title */}
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--color-ink-muted)]">
            {getExerciseTitle()}
          </p>
        </div>

        {/* Prompt */}
        <div className="text-center py-4">
          {exercise.type === 'translate_collocation' ? (
            // English prompt for translation
            <div className="inline-block px-8 py-5 bg-[var(--color-sand-100)] rounded-[var(--radius-lg)] border border-[var(--color-sand-200)]">
              <p className="font-display text-2xl text-[var(--color-ink)] font-medium">
                {exercise.prompt}
              </p>
            </div>
          ) : (
            // Arabic prompt with blank
            <div className="inline-block px-8 py-5 bg-[var(--color-sand-100)] rounded-[var(--radius-lg)] border border-[var(--color-sand-200)]">
              <p className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
                {exercise.prompt}
              </p>
            </div>
          )}

          {/* English translation hint for non-translation exercises */}
          {exercise.promptEn && exercise.type !== 'translate_collocation' && (
            <p className="text-sm text-[var(--color-ink-muted)] mt-3">
              {exercise.promptEn}
            </p>
          )}
        </div>

        {/* Input or Options */}
        {isMultipleChoice && shuffledOptions.length > 0 ? (
          // Multiple choice options
          <div className="grid grid-cols-2 gap-3">
            {shuffledOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(option)}
                disabled={hasSubmitted}
                className={`
                  py-4 px-4
                  rounded-[var(--radius-md)]
                  border-2
                  text-right
                  transition-all duration-200
                  ${hasSubmitted ? 'cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-primary)]'}
                  ${selectedOption === option && !hasSubmitted
                    ? 'border-[var(--color-primary)] bg-indigo-100 dark:bg-indigo-900/50'
                    : 'border-[var(--color-sand-300)] bg-white'
                  }
                  ${hasSubmitted && option === exercise.answer
                    ? 'border-[var(--color-success)] bg-[var(--color-success-light)]'
                    : ''
                  }
                  ${hasSubmitted && selectedOption === option && option !== exercise.answer
                    ? 'border-[var(--color-error)] bg-[var(--color-error-light)]'
                    : ''
                  }
                `}
                dir="rtl"
              >
                <span className="arabic-lg">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          // Text input for production exercises
          <ArabicInput
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="اكتب الإجابة هنا..."
            state={state === 'unanswered' ? 'default' : state}
            disabled={hasSubmitted}
            autoFocus
          />
        )}

        {/* Submit button */}
        {!hasSubmitted && (
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={isMultipleChoice ? !selectedOption : !userAnswer.trim()}
          >
            Check Answer
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && hasSubmitted && (
          <ExerciseFeedback
            isCorrect={state === 'correct'}
            correctAnswer={exercise.answer}
            userAnswer={isMultipleChoice ? (selectedOption || '') : userAnswer}
            message={feedbackMessage}
          />
        )}
      </form>
    </ExerciseCard>
  );
}

export default CollocationExercise;
