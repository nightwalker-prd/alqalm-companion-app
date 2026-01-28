import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { Card } from '../ui/Card';
import { ArabicInput } from '../ui/ArabicInput';
import { Button } from '../ui/Button';
import type { PreTestExercise as PreTestExerciseType, PreTestItemResult } from '../../lib/pretestUtils';
import { checkPreTestAnswer } from '../../lib/pretestUtils';

interface PreTestExerciseProps {
  exercise: PreTestExerciseType;
  questionNumber: number;
  totalQuestions: number;
  onComplete: (result: PreTestItemResult) => void;
}

/**
 * Pre-test exercise component for productive failure learning.
 * 
 * Supports two exercise types:
 * - Recognition (multiple choice): Shows Arabic word, pick English meaning
 * - Production (free recall): Shows English meaning, type Arabic word
 * 
 * The goal is NOT to get correct answers, but to prime the brain for learning.
 */
export function PreTestExercise({
  exercise,
  questionNumber,
  totalQuestions,
  onComplete,
}: PreTestExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const startTimeRef = useRef<number>(0);

  const isRecognition = exercise.type === 'pretest-recognize';

  // Initialize start time on mount (the parent uses key={exercise.id} to reset component)
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    if (hasSubmitted) return;

    // Check if answer is valid
    const userAnswer = isRecognition ? selectedOption : userInput.trim();
    if (userAnswer === null || userAnswer === '') return;

    const correct = checkPreTestAnswer(exercise, userAnswer);
    const responseTimeMs = Date.now() - startTimeRef.current;

    setIsCorrect(correct);
    setHasSubmitted(true);

    // Brief delay to show result, then call onComplete
    setTimeout(() => {
      const result: PreTestItemResult = {
        vocabId: exercise.vocabId,
        wasCorrect: correct,
        userAnswer: isRecognition 
          ? exercise.options![userAnswer as number] 
          : userInput,
        correctAnswer: isRecognition ? exercise.english : exercise.arabic,
        responseTimeMs,
      };
      onComplete(result);
    }, 800);
  }, [exercise, hasSubmitted, isRecognition, selectedOption, userInput, onComplete]);

  const handleOptionSelect = useCallback((index: number) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
  }, [hasSubmitted]);

  const canSubmit = isRecognition 
    ? selectedOption !== null 
    : userInput.trim().length > 0;

  return (
    <Card
      variant="exercise"
      padding="lg"
      hasGeometricAccent
      className={hasSubmitted ? (isCorrect ? 'ring-2 ring-[var(--color-success)] ring-opacity-50' : 'ring-2 ring-[var(--color-error)] ring-opacity-50') : ''}
    >
      {/* Pre-test indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-700 dark:text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--color-ink-muted)]">
              Pre-test
            </span>
            <span className="text-xs text-[var(--color-ink-muted)] ml-2">
              ({questionNumber}/{totalQuestions})
            </span>
          </div>
        </div>
        <span className="arabic-sm text-[var(--color-ink-muted)]" dir="rtl">
          اختبار أولي
        </span>
      </div>

      {/* Prompt */}
      <div className="text-center py-6">
        <div
          className={`
            inline-block px-8 py-5
            bg-[var(--color-sand-100)]
            rounded-[var(--radius-lg)]
            border border-[var(--color-sand-200)]
            shadow-[var(--shadow-sm)]
          `}
        >
          {isRecognition ? (
            // Show Arabic word, ask for meaning
            <p className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
              {exercise.arabic}
            </p>
          ) : (
            // Show English, ask for Arabic
            <p className="font-display text-2xl text-[var(--color-ink)] font-medium">
              {exercise.english}
            </p>
          )}
        </div>

        <p className="text-sm text-[var(--color-ink-muted)] mt-4">
          {isRecognition
            ? "What do you think this word means?"
            : "Try to write this word in Arabic"
          }
        </p>

        <p className="text-xs text-[var(--color-ink-light)] mt-2 italic">
          It's okay to guess - this is just priming your memory!
        </p>
      </div>

      {/* Recognition: Multiple choice options */}
      {isRecognition && exercise.options && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {exercise.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showResult = hasSubmitted;
            const isCorrectOption = index === exercise.correctIndex;

            let optionStyle = '';
            if (showResult) {
              if (isCorrectOption) {
                optionStyle = 'border-[var(--color-success)] bg-[var(--color-success-light)]';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-[var(--color-error)] bg-[var(--color-error-light)]';
              } else {
                optionStyle = 'border-[var(--color-sand-300)] opacity-50';
              }
            } else if (isSelected) {
              optionStyle = 'border-indigo-600 dark:border-indigo-400 bg-indigo-100 dark:bg-indigo-900/50';
            } else {
              optionStyle = 'border-[var(--color-sand-300)] hover:border-[var(--color-primary)] hover:bg-[var(--color-sand-50)]';
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(index)}
                disabled={hasSubmitted}
                className={`
                  p-4 rounded-[var(--radius-md)]
                  border-2 transition-all duration-200
                  text-left font-medium
                  ${optionStyle}
                  ${hasSubmitted ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <span className="text-[var(--color-ink)]">{option}</span>
                {showResult && isCorrectOption && (
                  <svg className="w-5 h-5 text-[var(--color-success)] inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Production: Text input */}
      {!isRecognition && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ArabicInput
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="اكتب هنا..."
            state={hasSubmitted ? (isCorrect ? 'correct' : 'incorrect') : 'default'}
            disabled={hasSubmitted}
            autoFocus
          />

          {hasSubmitted && !isCorrect && (
            <div className="flex items-center justify-between text-sm p-3 bg-[var(--color-sand-100)] rounded-[var(--radius-md)]">
              <span className="text-[var(--color-ink-muted)]">Correct answer:</span>
              <span className="arabic-base text-[var(--color-success)] font-bold" dir="rtl">
                {exercise.arabic}
              </span>
            </div>
          )}

          {!hasSubmitted && (
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={!canSubmit}
            >
              Submit Guess
            </Button>
          )}
        </form>
      )}

      {/* Submit button for recognition */}
      {isRecognition && !hasSubmitted && (
        <Button
          type="button"
          fullWidth
          size="lg"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Submit Guess
        </Button>
      )}

      {/* Feedback after submission */}
      {hasSubmitted && (
        <div
          className={`
            mt-4 p-4 rounded-[var(--radius-md)]
            animate-slide-up
            ${isCorrect
              ? 'bg-[var(--color-success-light)] border border-[var(--color-success)] border-opacity-30'
              : 'bg-[var(--color-sand-100)] border border-[var(--color-sand-300)]'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full
                flex items-center justify-center
                ${isCorrect ? 'bg-[var(--color-success)]' : 'bg-[var(--color-sand-400)]'}
              `}
            >
              {isCorrect ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-medium text-sm ${isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-ink)]'}`}>
                {isCorrect ? 'You knew this one!' : 'New word to learn!'}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                {isCorrect 
                  ? 'Great - the lesson will help reinforce this.' 
                  : 'Attempting to guess primes your memory for learning.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default PreTestExercise;
