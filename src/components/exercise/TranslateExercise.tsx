import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { ArabicInput } from '../ui/ArabicInput';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { ConfidenceRating } from './ConfidenceRating';
import { Timer } from '../ui/Timer';
import { compareAnswers, compareAnswersStrict } from '../../lib/arabic';
import type {
  TranslateExercise as TranslateExerciseType,
  ExerciseState,
  ChallengeConfig,
  GenerationMode,
} from '../../types/exercise';
import type { ConfidenceLevel } from '../../types/progress';

interface TranslateExerciseProps {
  exercise: TranslateExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    confidence?: ConfidenceLevel;
    generatedWithoutHints?: boolean;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
  challengeConfig?: ChallengeConfig;
  /** Enable generation-first mode (hide English prompt initially) */
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
const GENERATION_TIMEOUT = 10000;

export function TranslateExercise({
  exercise,
  onComplete,
  showFeedback = true,
  challengeConfig = DEFAULT_CHALLENGE_CONFIG,
  enableGeneration = false,
  enableConfidence = false,
}: TranslateExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const hasTimedOut = useRef(false);
  const [startTime] = useState(() => Date.now());

  // Generation mode state (hides English prompt initially)
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    enableGeneration ? 'hints_hidden' : 'standard'
  );

  // Confidence rating state
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    isCorrect: boolean;
    userAnswer: string;
  } | null>(null);

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
    const compare = requireTashkeel ? compareAnswersStrict : compareAnswers;
    return userAnswer.trim() ? compare(userAnswer, exercise.answer) : false;
  }, [userAnswer, exercise.answer, requireTashkeel]);

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
    const wasGeneration = generationMode === 'hints_hidden';

    // If confidence is enabled, wait for confidence rating
    if (enableConfidence && !hasTimedOut.current) {
      setAwaitingConfidence(true);
      setPendingResult({ isCorrect, userAnswer });
      return;
    }

    finalizeAnswer(isCorrect, userAnswer, wasGeneration);
  }, [userAnswer, hasSubmitted, awaitingConfidence, evaluateAnswer, enableConfidence, generationMode, finalizeAnswer]);

  const handleConfidenceSelect = useCallback((confidence: ConfidenceLevel) => {
    setSelectedConfidence(confidence);
    
    if (pendingResult) {
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
    <ExerciseCard type="translate-to-arabic" state={state}>
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
            <span>Try to recall the translation!</span>
          </div>
        )}

        {/* English prompt - hidden initially in generation mode */}
        <div className="text-center py-6">
          {generationMode !== 'hints_hidden' ? (
            <div className="inline-block px-6 py-4 bg-[var(--color-sand-100)] rounded-[var(--radius-lg)] border border-[var(--color-sand-200)]">
              <p className="font-display text-2xl text-[var(--color-ink)] font-medium">
                "{exercise.prompt}"
              </p>
            </div>
          ) : (
            <div className="inline-block px-6 py-4 bg-[var(--color-sand-100)] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-sand-300)]">
              <p className="text-[var(--color-ink-muted)] italic">
                English prompt hidden - try from memory!
              </p>
            </div>
          )}
          <p className="text-sm text-[var(--color-ink-muted)] mt-4">
            Write this in Arabic
          </p>

          {/* Tashkeel requirement hint for challenges */}
          {isChallenge && requireTashkeel && !hasSubmitted && (
            <p className="text-xs text-[var(--color-gold)] mt-2">
              Include tashkeel (diacritics) in your answer
            </p>
          )}
        </div>

        {/* Arabic input */}
        <ArabicInput
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder={requireTashkeel ? "اكتب الترجمة مع التشكيل..." : "اكتب الترجمة هنا..."}
          state={state === 'unanswered' ? 'default' : state}
          disabled={hasSubmitted || awaitingConfidence}
          autoFocus
        />

        {/* Generation mode: reveal hints button */}
        {enableGeneration && generationMode === 'hints_hidden' && !hasSubmitted && !awaitingConfidence && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleRevealHints}
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] underline"
            >
              Show English prompt
            </button>
          </div>
        )}

        {/* Confidence rating */}
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
            Check Translation
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

export default TranslateExercise;
