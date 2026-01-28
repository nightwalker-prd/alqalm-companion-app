import { useState, useCallback, useMemo } from 'react';
import type { Exercise, GenerationMode } from '../types/exercise';
import type { ConfidenceLevel } from '../types/progress';
import { getRetryHint, isArabicText, MAX_RETRY_ATTEMPTS, type RetryHint } from '../lib/retryHints';

interface ExerciseResult {
  exerciseId: string;
  isCorrect: boolean;
  userAnswer: string;
  // Enhanced tracking (Phase 1)
  confidence?: ConfidenceLevel;
  generatedWithoutHints?: boolean;
  responseTimeMs?: number;
  generationMode?: GenerationMode;
  // Retry tracking
  wasRetryAttempt?: boolean;
}

interface AnswerMetadata {
  confidence?: ConfidenceLevel;
  generatedWithoutHints?: boolean;
  responseTimeMs?: number;
}

/** State for retry mode when user answers incorrectly */
interface RetryState {
  /** Number of attempts made (1 = first wrong answer, 5 = max) */
  attemptCount: number;
  /** Current hint to display */
  currentHint: RetryHint;
  /** The last incorrect answer given */
  lastIncorrectAnswer: string;
  /** The correct answer (for reference) */
  correctAnswer: string;
}

/** Result for a single exercise (final outcome after any retries) */
interface FinalExerciseResult {
  exerciseId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

interface UsePracticeSessionReturn {
  // Current state
  currentExercise: Exercise | null;
  currentIndex: number;
  totalExercises: number;
  isComplete: boolean;

  // View state (for review navigation)
  viewIndex: number;
  viewingExercise: Exercise | null;
  isReviewing: boolean;
  canGoBack: boolean;
  canGoForward: boolean;

  // Feedback state
  showingFeedback: boolean;
  lastResult: { isCorrect: boolean; userAnswer: string } | null;

  // Retry state (Phase 1.1 - Immediate Error Retry)
  isRetrying: boolean;
  retryAttemptCount: number;
  currentHint: RetryHint | null;
  lastIncorrectAnswer: string | null;
  /** Trigger value that increments on retry - use as key for exercise component */
  retryTrigger: number;

  // Results
  results: ExerciseResult[];
  correctCount: number;
  incorrectCount: number;

  // Streaks
  currentStreak: number;
  bestStreak: number;

  // Statistics
  accuracy: number;

  // Enhanced statistics (Phase 1)
  generationStats: {
    totalGenerated: number;
    generatedCorrectly: number;
    generationRate: number;
  };
  confidenceStats: {
    totalRated: number;
    calibrationScore: number;
  };

  // Actions
  recordAnswer: (isCorrect: boolean, userAnswer: string, metadata?: AnswerMetadata) => void;
  advanceToNext: () => void;
  restart: () => void;
  getIncorrectExercises: () => Exercise[];
  /** Trigger a retry attempt - clears input and allows user to try again */
  retryExercise: () => void;
  /** Navigate to previous exercise (review mode) */
  goToPrevious: () => void;
  /** Navigate to next exercise (review mode) or current active */
  goToNext: () => void;
  /** Get the final result for an exercise at given index */
  getResultForExercise: (index: number) => FinalExerciseResult | null;
}

// Re-export for convenience
export { MAX_RETRY_ATTEMPTS };
export type { RetryHint };

export function usePracticeSession(exercises: Exercise[]): UsePracticeSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; userAnswer: string } | null>(null);

  // Retry state (Phase 1.1)
  const [retryState, setRetryState] = useState<RetryState | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Derived state
  const totalExercises = exercises.length;
  const isComplete = currentIndex >= totalExercises;
  const currentExercise = isComplete ? null : exercises[currentIndex];

  // View/review derived state
  const viewingExercise = exercises[viewIndex] ?? null;
  const isReviewing = viewIndex < currentIndex;
  const canGoBack = viewIndex > 0;
  const canGoForward = viewIndex < currentIndex;

  // Retry-derived state
  const isRetrying = retryState !== null;
  const retryAttemptCount = retryState?.attemptCount ?? 0;
  const currentHint = retryState?.currentHint ?? null;
  const lastIncorrectAnswer = retryState?.lastIncorrectAnswer ?? null;

  const correctCount = useMemo(
    () => results.filter(r => r.isCorrect).length,
    [results]
  );

  const incorrectCount = useMemo(
    () => results.filter(r => !r.isCorrect).length,
    [results]
  );

  const accuracy = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round((correctCount / results.length) * 100);
  }, [results.length, correctCount]);

  // Enhanced statistics for generation effect tracking
  const generationStats = useMemo(() => {
    const generated = results.filter(r => r.generatedWithoutHints !== undefined);
    const generatedCorrectly = results.filter(r => r.generatedWithoutHints === true).length;
    const totalGenerated = generated.length;
    
    return {
      totalGenerated,
      generatedCorrectly,
      generationRate: totalGenerated > 0 ? generatedCorrectly / totalGenerated : 0,
    };
  }, [results]);

  // Confidence calibration statistics
  const confidenceStats = useMemo(() => {
    const rated = results.filter(r => r.confidence !== undefined);
    const totalRated = rated.length;
    
    if (totalRated < 3) {
      return { totalRated, calibrationScore: 0 };
    }

    // Calculate calibration: how well does confidence predict correctness?
    // Group by confidence level and calculate accuracy per level
    const byLevel: Record<number, { correct: number; total: number }> = {
      1: { correct: 0, total: 0 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 },
    };

    for (const r of rated) {
      if (r.confidence) {
        byLevel[r.confidence].total++;
        if (r.isCorrect) byLevel[r.confidence].correct++;
      }
    }

    // Expected accuracy for each confidence level
    const expected = { 1: 0.33, 2: 0.66, 3: 0.9 };
    
    let totalError = 0;
    let totalWeight = 0;

    for (const level of [1, 2, 3]) {
      const { correct, total } = byLevel[level];
      if (total > 0) {
        const actual = correct / total;
        const error = Math.abs(actual - expected[level as 1 | 2 | 3]);
        totalError += error * total;
        totalWeight += total;
      }
    }

    const meanError = totalWeight > 0 ? totalError / totalWeight : 0;
    const calibrationScore = Math.max(0, 1 - meanError);

    return { totalRated, calibrationScore };
  }, [results]);

  /**
   * Record an answer attempt.
   * 
   * If incorrect and under retry limit: enters retry mode (user must try again)
   * If incorrect and at retry limit: records failure and shows feedback
   * If correct: records success and shows feedback
   * 
   * Each failed attempt is recorded to results (affects mastery).
   */
  const recordAnswer = useCallback((
    isCorrect: boolean,
    userAnswer: string,
    metadata?: AnswerMetadata
  ) => {
    if (isComplete || !currentExercise) return;
    
    // If already showing final feedback, ignore
    if (showingFeedback && !isRetrying) return;

    // Get the correct answer for hint generation
    const correctAnswer = 'answer' in currentExercise 
      ? (currentExercise as { answer: string }).answer 
      : '';
    const answerIsArabic = isArabicText(correctAnswer);

    // Calculate current attempt number
    const currentAttempt = (retryState?.attemptCount ?? 0) + 1;

    // Record the result (each attempt counts toward mastery)
    const result: ExerciseResult = {
      exerciseId: currentExercise.id,
      isCorrect,
      userAnswer,
      confidence: metadata?.confidence,
      generatedWithoutHints: metadata?.generatedWithoutHints,
      responseTimeMs: metadata?.responseTimeMs,
      wasRetryAttempt: currentAttempt > 1,
    };
    setResults(prev => [...prev, result]);

    if (isCorrect) {
      // Success! Update streak and show feedback
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(best => Math.max(best, newStreak));
        return newStreak;
      });
      
      // Clear retry state and show success feedback
      setRetryState(null);
      setShowingFeedback(true);
      setLastResult({ isCorrect: true, userAnswer });
      
      // TODO: Add success sound/haptic feedback here
      // Consider celebratory feedback if succeeded after retries
      
    } else if (currentAttempt < MAX_RETRY_ATTEMPTS) {
      // Wrong answer, but still have retries left
      // Enter/continue retry mode
      const hint = getRetryHint(correctAnswer, currentAttempt, answerIsArabic);
      
      setRetryState({
        attemptCount: currentAttempt,
        currentHint: hint,
        lastIncorrectAnswer: userAnswer,
        correctAnswer,
      });
      
      // Reset streak on first wrong answer
      if (currentAttempt === 1) {
        setCurrentStreak(0);
      }
      
      // Don't show feedback yet - user needs to retry
      setShowingFeedback(false);
      setLastResult({ isCorrect: false, userAnswer });
      
      // TODO: Add wrong answer haptic/sound feedback here
      
    } else {
      // Max retries reached - show the answer and allow continue
      const finalHint = getRetryHint(correctAnswer, MAX_RETRY_ATTEMPTS, answerIsArabic);
      
      setRetryState({
        attemptCount: MAX_RETRY_ATTEMPTS,
        currentHint: finalHint,
        lastIncorrectAnswer: userAnswer,
        correctAnswer,
      });
      
      // Reset streak (already reset on first wrong)
      setCurrentStreak(0);
      
      // Show final feedback with the answer
      setShowingFeedback(true);
      setLastResult({ isCorrect: false, userAnswer });
      
      // TODO: Add "study the answer" sound/haptic here
    }
  }, [isComplete, currentExercise, showingFeedback, isRetrying, retryState]);

  /**
   * Trigger a retry attempt.
   * Increments retryTrigger to force re-mount of exercise component.
   */
  const retryExercise = useCallback(() => {
    if (!isRetrying) return;
    
    // Increment trigger to force exercise component re-mount
    setRetryTrigger(prev => prev + 1);
  }, [isRetrying]);

  /**
   * Advance to the next exercise.
   * Clears all feedback and retry state.
   */
  const advanceToNext = useCallback(() => {
    setShowingFeedback(false);
    setLastResult(null);
    setRetryState(null);
    setRetryTrigger(0);
    setCurrentIndex(prev => {
      const next = prev + 1;
      setViewIndex(next); // Keep view synced with progress
      return next;
    });
  }, []);

  /**
   * Restart the session from the beginning.
   */
  const restart = useCallback(() => {
    setCurrentIndex(0);
    setViewIndex(0);
    setResults([]);
    setCurrentStreak(0);
    setBestStreak(0);
    setShowingFeedback(false);
    setLastResult(null);
    setRetryState(null);
    setRetryTrigger(0);
  }, []);

  /**
   * Navigate to previous exercise (review mode).
   */
  const goToPrevious = useCallback(() => {
    if (viewIndex > 0) {
      // Clear any active feedback/retry state when navigating away
      setShowingFeedback(false);
      setLastResult(null);
      setRetryState(null);
      setRetryTrigger(0);
      setViewIndex(prev => prev - 1);
    }
  }, [viewIndex]);

  /**
   * Navigate to next exercise (up to current active exercise).
   */
  const goToNext = useCallback(() => {
    if (viewIndex < currentIndex) {
      // Clear any state when navigating
      setShowingFeedback(false);
      setLastResult(null);
      setRetryState(null);
      setRetryTrigger(0);
      setViewIndex(prev => prev + 1);
    }
  }, [viewIndex, currentIndex]);

  /**
   * Get the final result for an exercise at given index.
   * Returns the last result recorded for that exercise (handles retries).
   */
  const getResultForExercise = useCallback((index: number): FinalExerciseResult | null => {
    const exercise = exercises[index];
    if (!exercise) return null;

    // Find all results for this exercise and return the last one (final attempt)
    const exerciseResults = results.filter(r => r.exerciseId === exercise.id);
    if (exerciseResults.length === 0) return null;

    const lastResult = exerciseResults[exerciseResults.length - 1];

    // Get correct answer from exercise
    const correctAnswer = 'answer' in exercise
      ? (exercise as { answer: string }).answer
      : '';

    return {
      exerciseId: exercise.id,
      isCorrect: lastResult.isCorrect,
      userAnswer: lastResult.userAnswer,
      correctAnswer,
    };
  }, [exercises, results]);

  const getIncorrectExercises = useCallback(() => {
    // Get unique exercise IDs that had incorrect attempts
    // An exercise is "incorrect" if its final result was wrong
    // (i.e., they never got it right even after retries)
    const exerciseOutcomes = new Map<string, boolean>();
    
    for (const result of results) {
      // Update with latest result for each exercise
      exerciseOutcomes.set(result.exerciseId, result.isCorrect);
    }
    
    const incorrectIds = new Set<string>();
    for (const [id, wasCorrect] of exerciseOutcomes) {
      if (!wasCorrect) {
        incorrectIds.add(id);
      }
    }
    
    return exercises.filter(ex => incorrectIds.has(ex.id));
  }, [results, exercises]);

  return {
    // Current state
    currentExercise,
    currentIndex,
    totalExercises,
    isComplete,

    // View state (for review navigation)
    viewIndex,
    viewingExercise,
    isReviewing,
    canGoBack,
    canGoForward,

    // Feedback state
    showingFeedback,
    lastResult,

    // Retry state
    isRetrying,
    retryAttemptCount,
    currentHint,
    lastIncorrectAnswer,
    retryTrigger,

    // Results
    results,
    correctCount,
    incorrectCount,

    // Streaks
    currentStreak,
    bestStreak,

    // Statistics
    accuracy,
    generationStats,
    confidenceStats,

    // Actions
    recordAnswer,
    advanceToNext,
    restart,
    getIncorrectExercises,
    retryExercise,
    goToPrevious,
    goToNext,
    getResultForExercise,
  };
}

export default usePracticeSession;
