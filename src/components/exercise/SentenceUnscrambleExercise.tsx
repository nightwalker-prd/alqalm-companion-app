import { useState, useCallback } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import {
  checkUnscrambleAnswer,
  calculateUnscrambleScore,
  getUnscrambleHint,
} from '../../lib/sentenceUnscrambleUtils';
import type {
  SentenceUnscrambleExercise as SentenceUnscrambleExerciseType,
  UnscrambleWord,
  ExerciseState,
} from '../../types/exercise';

interface SentenceUnscrambleExerciseProps {
  exercise: SentenceUnscrambleExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    score?: number;
    distractorsIncluded?: number;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
}

/**
 * Sentence Unscramble Exercise Component
 * 
 * Shows shuffled words (including distractors) that users must arrange
 * into the correct sentence. Users tap words to add them to their answer,
 * and can tap arranged words to remove them.
 * 
 * Based on research showing that discrimination tasks strengthen pattern recognition.
 */
export function SentenceUnscrambleExercise({
  exercise,
  onComplete,
  showFeedback = true,
}: SentenceUnscrambleExerciseProps) {
  // Array of word IDs in user's arrangement order
  const [arrangement, setArrangement] = useState<string[]>([]);
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof checkUnscrambleAnswer> | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Create a map for quick word lookup
  const wordMap = new Map(exercise.words.map(w => [w.id, w]));

  // Get available words (not yet placed in arrangement)
  const availableWords = exercise.words.filter(w => !arrangement.includes(w.id));

  // Get arranged words in order
  const arrangedWords = arrangement
    .map(id => wordMap.get(id))
    .filter((w): w is UnscrambleWord => w !== undefined);

  // Handle adding a word to arrangement
  const handleAddWord = useCallback((wordId: string) => {
    if (hasSubmitted) return;
    setArrangement(prev => [...prev, wordId]);
    setShowHint(false);
  }, [hasSubmitted]);

  // Handle removing a word from arrangement
  const handleRemoveWord = useCallback((wordId: string) => {
    if (hasSubmitted) return;
    setArrangement(prev => prev.filter(id => id !== wordId));
  }, [hasSubmitted]);

  // Handle clearing all words
  const handleClear = useCallback(() => {
    if (hasSubmitted) return;
    setArrangement([]);
    setShowHint(false);
  }, [hasSubmitted]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (hasSubmitted || arrangement.length === 0) return;

    const responseTimeMs = Date.now() - startTime;
    const checkResult = checkUnscrambleAnswer(arrangement, exercise);
    const score = calculateUnscrambleScore(checkResult);

    setState(checkResult.isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    setResult(checkResult);

    // Format answer as the arranged words
    const answerStr = arrangedWords.map(w => w.text).join(' ');

    onComplete(checkResult.isCorrect, answerStr, {
      score,
      distractorsIncluded: checkResult.includedDistractors.length,
      responseTimeMs,
    });
  }, [arrangement, hasSubmitted, exercise, arrangedWords, onComplete, startTime]);

  // Get hint
  const hint = showHint ? getUnscrambleHint(arrangement, exercise) : '';

  return (
    <ExerciseCard type="sentence-unscramble" state={state}>
      <div className="space-y-6">
        {/* English hint */}
        {exercise.englishHint && (
          <div className="text-center text-sm text-[var(--color-ink-muted)] italic">
            &ldquo;{exercise.englishHint}&rdquo;
          </div>
        )}

        {/* Distractor warning */}
        {exercise.distractorCount > 0 && !hasSubmitted && (
          <div className="text-center text-xs text-[var(--color-warning)]">
            Note: {exercise.distractorCount} word{exercise.distractorCount > 1 ? 's' : ''} don&apos;t belong in this sentence
          </div>
        )}

        {/* Arranged words area */}
        <div
          className={`
            min-h-[80px] p-4 rounded-lg border-2 transition-all
            ${hasSubmitted
              ? result?.isCorrect
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-100/50 dark:bg-emerald-900/25'
                : 'border-rose-300 dark:border-rose-700 bg-rose-100/50 dark:bg-rose-900/25'
              : 'border-dashed border-[var(--color-border)] bg-[var(--color-sand-100)]'
            }
          `}
          dir="rtl"
        >
          {arrangedWords.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {arrangedWords.map((word, index) => {
                const isDistractor = word.isDistractor;
                const showError = hasSubmitted && isDistractor;
                
                return (
                  <button
                    key={word.id}
                    onClick={() => handleRemoveWord(word.id)}
                    disabled={hasSubmitted}
                    className={`
                      px-3 py-2 rounded-lg transition-all
                      ${showError
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 line-through'
                        : hasSubmitted
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[var(--color-ink)]'
                          : 'bg-white border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                      }
                    `}
                  >
                    <span className="text-xs text-[var(--color-ink-muted)] mr-1">
                      {index + 1}
                    </span>
                    <span className="arabic text-lg">{word.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-sm text-[var(--color-ink-muted)] py-4">
              Tap words below to build the sentence
            </div>
          )}
        </div>

        {/* Clear button */}
        {!hasSubmitted && arrangement.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={handleClear}
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Available words */}
        {!hasSubmitted && (
          <div className="space-y-2">
            <div className="text-xs text-center text-[var(--color-ink-muted)]">
              Available words:
            </div>
            <div className="flex flex-wrap gap-2 justify-center p-4 bg-[var(--color-sand-50)] rounded-lg min-h-[60px]">
              {availableWords.map(word => (
                <button
                  key={word.id}
                  onClick={() => handleAddWord(word.id)}
                  className={`
                    px-3 py-2 rounded-lg transition-all
                    bg-white border border-[var(--color-border)]
                    hover:border-[var(--color-primary)] hover:shadow-sm
                  `}
                >
                  <span className="arabic text-lg">{word.text}</span>
                </button>
              ))}
              
              {availableWords.length === 0 && (
                <div className="text-sm text-[var(--color-success)]">
                  All words used!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hint */}
        {!hasSubmitted && showHint && hint && (
          <div className="text-center text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded">
            {hint}
          </div>
        )}

        {/* Hint button */}
        {!hasSubmitted && arrangement.length > 0 && !showHint && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              Need a hint?
            </button>
          </div>
        )}

        {/* Submit button */}
        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            fullWidth
            size="lg"
            disabled={arrangement.length === 0}
          >
            Check Sentence
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
                text-lg font-bold mb-1
                ${result.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}
              `}>
                {result.isCorrect ? 'Perfect!' : `${result.correctPositions}/${result.totalExpected} correct`}
              </div>
              
              {/* Show issues */}
              {!result.isCorrect && (
                <div className="text-sm text-[var(--color-ink-muted)] space-y-1">
                  {result.includedDistractors.length > 0 && (
                    <div>{result.includedDistractors.length} distractor{result.includedDistractors.length > 1 ? 's' : ''} included</div>
                  )}
                  {result.missingWords.length > 0 && (
                    <div>{result.missingWords.length} word{result.missingWords.length > 1 ? 's' : ''} missing</div>
                  )}
                  {!result.orderCorrect && result.missingWords.length === 0 && result.includedDistractors.length === 0 && (
                    <div>Word order incorrect</div>
                  )}
                </div>
              )}
            </div>

            {/* Show correct sentence */}
            {!result.isCorrect && (
              <div className="space-y-2">
                <p className="text-xs text-center text-[var(--color-ink-muted)]">
                  Correct sentence:
                </p>
                <div className="text-center p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg" dir="rtl">
                  <span className="arabic text-lg text-emerald-700 dark:text-emerald-300">
                    {exercise.correctSentence}
                  </span>
                </div>
              </div>
            )}

            <ExerciseFeedback
              isCorrect={result.isCorrect}
              correctAnswer={exercise.correctSentence}
              userAnswer={arrangedWords.map(w => w.text).join(' ')}
            />
          </div>
        )}
      </div>
    </ExerciseCard>
  );
}

export default SentenceUnscrambleExercise;
