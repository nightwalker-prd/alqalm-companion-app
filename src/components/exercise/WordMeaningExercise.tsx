import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ArabicInput } from '../ui/ArabicInput';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { ConfidenceRating } from './ConfidenceRating';
import { Timer } from '../ui/Timer';
import { compareAnswers, compareAnswersStrict } from '../../lib/arabic';
import type {
  WordToMeaningExercise,
  MeaningToWordExercise,
  ExerciseState,
  ChallengeConfig,
  GenerationMode,
} from '../../types/exercise';
import type { ConfidenceLevel } from '../../types/progress';

type WordMeaningExerciseType = WordToMeaningExercise | MeaningToWordExercise;

interface WordMeaningExerciseProps {
  exercise: WordMeaningExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    confidence?: ConfidenceLevel;
    generatedWithoutHints?: boolean;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
  challengeConfig?: ChallengeConfig;
  /** Enable generation-first mode (try without hints first) */
  enableGeneration?: boolean;
  /** Enable confidence rating before revealing result */
  enableConfidence?: boolean;
}

const DEFAULT_CHALLENGE_CONFIG: ChallengeConfig = {
  isChallenge: false,
  timerSeconds: 0,
  requireTashkeel: false,
  hideEnglishHint: false,
  reversedDirection: false,
};

/** Time before auto-revealing hints in generation mode (ms) */
const GENERATION_TIMEOUT = 8000;

export function WordMeaningExercise({
  exercise,
  onComplete,
  showFeedback = true,
  challengeConfig = DEFAULT_CHALLENGE_CONFIG,
  enableGeneration = false,
  enableConfidence = false,
}: WordMeaningExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const hasTimedOut = useRef(false);
  const [startTime] = useState(() => Date.now());

  // Generation mode state
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    enableGeneration ? 'hints_hidden' : 'standard'
  );
  const [generationAttempted, setGenerationAttempted] = useState(false);

  // Confidence rating state
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    isCorrect: boolean;
    userAnswer: string;
  } | null>(null);

  const isArabicToEnglish = exercise.type === 'word-to-meaning';
  const { isChallenge, timerSeconds, requireTashkeel } = challengeConfig;

  // Auto-reveal hints after timeout in generation mode
  useEffect(() => {
    if (generationMode !== 'hints_hidden' || hasSubmitted) return;

    const timer = setTimeout(() => {
      setGenerationMode('hints_shown');
    }, GENERATION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [generationMode, hasSubmitted]);

  const evaluateAnswer = useCallback(() => {
    let isCorrect: boolean;
    if (!userAnswer.trim()) {
      isCorrect = false;
    } else if (isArabicToEnglish) {
      isCorrect = userAnswer.toLowerCase().trim() === exercise.answer.toLowerCase().trim();
    } else {
      const compare = requireTashkeel ? compareAnswersStrict : compareAnswers;
      isCorrect = compare(userAnswer, exercise.answer);
    }
    return isCorrect;
  }, [userAnswer, exercise.answer, isArabicToEnglish, requireTashkeel]);

  const finalizeAnswer = useCallback((
    isCorrect: boolean,
    answer: string,
    wasGeneration: boolean,
    confidence?: ConfidenceLevel
  ) => {
    const responseTimeMs = Date.now() - startTime;

    setState(isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    onComplete(isCorrect, answer, {
      confidence,
      generatedWithoutHints: wasGeneration && isCorrect,
      responseTimeMs,
    });
  }, [onComplete, startTime]);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    if (hasSubmitted || awaitingConfidence) return;
    if (!userAnswer.trim() && !hasTimedOut.current) return;

    const isCorrect = evaluateAnswer();

    // Track if this was a generation attempt (answered before hints shown)
    const wasGeneration = generationMode === 'hints_hidden' && !generationAttempted;
    if (wasGeneration) {
      setGenerationAttempted(true);
    }

    // If confidence is enabled, wait for confidence rating before showing result
    if (enableConfidence && !hasTimedOut.current) {
      setAwaitingConfidence(true);
      setPendingResult({ isCorrect, userAnswer });
      return;
    }

    // Otherwise, complete immediately
    finalizeAnswer(isCorrect, userAnswer, wasGeneration);
  }, [userAnswer, hasSubmitted, awaitingConfidence, evaluateAnswer, enableConfidence, generationMode, generationAttempted, finalizeAnswer]);

  const handleConfidenceSelect = useCallback((confidence: ConfidenceLevel) => {
    setSelectedConfidence(confidence);
    
    if (pendingResult) {
      // Short delay to show selection, then finalize
      setTimeout(() => {
        finalizeAnswer(
          pendingResult.isCorrect,
          pendingResult.userAnswer,
          generationMode === 'hints_hidden',
          confidence
        );
        setAwaitingConfidence(false);
      }, 300);
    }
  }, [pendingResult, generationMode, finalizeAnswer]);

  const handleTimeUp = useCallback(() => {
    if (hasSubmitted) return;
    hasTimedOut.current = true;
    setState('incorrect');
    setHasSubmitted(true);
    onComplete(false, userAnswer || '(time expired)', {
      responseTimeMs: timerSeconds * 1000,
    });
  }, [hasSubmitted, userAnswer, onComplete, timerSeconds]);

  const handleRevealHints = useCallback(() => {
    setGenerationMode('hints_shown');
  }, []);

  return (
    <ExerciseCard type={exercise.type} state={state}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Challenge badge and timer */}
        {isChallenge && (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Challenge
            </span>
            {timerSeconds > 0 && !hasSubmitted && (
              <Timer
                seconds={timerSeconds}
                onTimeUp={handleTimeUp}
                isPaused={hasSubmitted}
                size="sm"
              />
            )}
          </div>
        )}

        {/* Generation mode indicator */}
        {enableGeneration && generationMode === 'hints_hidden' && !hasSubmitted && (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-primary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Try to recall from memory first!</span>
          </div>
        )}

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
            {isArabicToEnglish ? (
              <p className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
                {exercise.prompt}
              </p>
            ) : (
              <p className="font-display text-2xl text-[var(--color-ink)] font-medium">
                {exercise.prompt}
              </p>
            )}
          </div>

          <p className="text-sm text-[var(--color-ink-muted)] mt-4">
            {isArabicToEnglish
              ? 'What does this word mean?'
              : 'Write this word in Arabic'
            }
          </p>

          {isChallenge && requireTashkeel && !isArabicToEnglish && !hasSubmitted && (
            <p className="text-xs text-[var(--color-gold)] mt-2">
              Include tashkeel (diacritics) in your answer
            </p>
          )}
        </div>

        {/* Input */}
        {isArabicToEnglish ? (
          <div className="w-full">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type the meaning..."
              disabled={hasSubmitted || awaitingConfidence}
              autoFocus
              className={`
                w-full
                font-body text-lg
                py-4 px-5
                bg-white
                border-2 rounded-[var(--radius-md)]
                text-[var(--color-ink)]
                placeholder:text-[var(--color-ink-muted)]
                placeholder:opacity-50
                transition-all duration-200 ease-out
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:bg-[var(--color-sand-100)]
                ${state === 'unanswered' ? 'border-[var(--color-sand-300)] focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-glow)]' : ''}
                ${state === 'correct' ? 'border-[var(--color-success)] bg-[var(--color-success-light)]' : ''}
                ${state === 'incorrect' ? 'border-[var(--color-error)] bg-[var(--color-error-light)]' : ''}
              `}
            />
          </div>
        ) : (
          <ArabicInput
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder={requireTashkeel ? "اكتب الكلمة مع التشكيل..." : "اكتب الكلمة هنا..."}
            state={state === 'unanswered' ? 'default' : state}
            disabled={hasSubmitted || awaitingConfidence}
            autoFocus
          />
        )}

        {/* Generation mode: reveal hints button */}
        {enableGeneration && generationMode === 'hints_hidden' && !hasSubmitted && !awaitingConfidence && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleRevealHints}
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] underline"
            >
              I need a hint
            </button>
          </div>
        )}

        {/* Confidence rating (shown after submit, before revealing result) */}
        {awaitingConfidence && !hasSubmitted && (
          <div className="animate-slide-up">
            <ConfidenceRating
              onSelect={handleConfidenceSelect}
              selectedLevel={selectedConfidence}
              disabled={selectedConfidence !== null}
            />
          </div>
        )}

        {/* Submit button */}
        {!hasSubmitted && !awaitingConfidence && (
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={!userAnswer.trim()}
          >
            Check Answer
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && hasSubmitted && (
          <ExerciseFeedback
            isCorrect={state === 'correct'}
            correctAnswer={exercise.answer}
            userAnswer={userAnswer}
            message={isChallenge ? (state === 'correct' ? 'Challenge completed!' : 'Challenge failed') : undefined}
            generatedWithoutHints={generationMode === 'hints_hidden' && state === 'correct'}
          />
        )}
      </form>
    </ExerciseCard>
  );
}

export default WordMeaningExercise;
