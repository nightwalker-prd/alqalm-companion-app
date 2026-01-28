import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePracticeSession, MAX_RETRY_ATTEMPTS } from '../usePracticeSession';
import type { Exercise } from '../../types/exercise';

const mockExercises: Exercise[] = [
  {
    id: 'ex-1',
    type: 'fill-blank',
    prompt: '_____ كِتَابٌ',
    promptEn: '_____ is a book',
    answer: 'هَذَا',
    itemIds: ['word-001'],
  },
  {
    id: 'ex-2',
    type: 'word-to-meaning',
    prompt: 'قَلَمٌ',
    answer: 'pen',
    itemIds: ['word-003'],
  },
  {
    id: 'ex-3',
    type: 'translate-to-arabic',
    prompt: 'This is a house',
    answer: 'هَذَا بَيْتٌ',
    itemIds: ['word-001', 'word-006'],
  },
];

describe('usePracticeSession', () => {
  describe('initialization', () => {
    test('initializes with exercises and sets first as current', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      expect(result.current.currentExercise).toEqual(mockExercises[0]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalExercises).toBe(3);
      expect(result.current.isComplete).toBe(false);
    });

    test('initializes with empty results array', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      expect(result.current.results).toEqual([]);
      expect(result.current.correctCount).toBe(0);
      expect(result.current.incorrectCount).toBe(0);
    });

    test('handles empty exercise array', () => {
      const { result } = renderHook(() => usePracticeSession([]));

      expect(result.current.currentExercise).toBeNull();
      expect(result.current.isComplete).toBe(true);
      expect(result.current.totalExercises).toBe(0);
    });
  });

  describe('recordAnswer', () => {
    test('records correct answer and enters feedback state (does not auto-advance)', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });

      expect(result.current.results).toHaveLength(1);
      // Check core fields (additional metadata fields may be undefined)
      expect(result.current.results[0].exerciseId).toBe('ex-1');
      expect(result.current.results[0].isCorrect).toBe(true);
      expect(result.current.results[0].userAnswer).toBe('هَذَا');
      expect(result.current.results[0].wasRetryAttempt).toBe(false);
      expect(result.current.correctCount).toBe(1);
      // Should NOT advance yet - still showing feedback
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentExercise).toEqual(mockExercises[0]);
      expect(result.current.showingFeedback).toBe(true);
      expect(result.current.lastResult).toEqual({ isCorrect: true, userAnswer: 'هَذَا' });
    });

    test('records incorrect answer and enters retry mode (not feedback)', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      expect(result.current.incorrectCount).toBe(1);
      expect(result.current.correctCount).toBe(0);
      expect(result.current.results[0].isCorrect).toBe(false);
      // With retry feature: first incorrect enters retry mode, NOT feedback
      expect(result.current.isRetrying).toBe(true);
      expect(result.current.retryAttemptCount).toBe(1);
      expect(result.current.showingFeedback).toBe(false); // Not showing final feedback yet
      expect(result.current.lastResult).toEqual({ isCorrect: false, userAnswer: 'wrong' });
      expect(result.current.currentHint).not.toBeNull();
    });

    test('does not record answer while showing feedback', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      // Try to submit again while showing feedback
      act(() => {
        result.current.recordAnswer(true, 'another');
      });

      expect(result.current.results).toHaveLength(1);
    });

    test('marks session complete after last exercise', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'pen');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'هَذَا بَيْتٌ');
      });
      act(() => {
        result.current.advanceToNext();
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.currentExercise).toBeNull();
      expect(result.current.results).toHaveLength(3);
    });
  });

  describe('advanceToNext', () => {
    test('advances to next exercise and clears feedback state', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });

      expect(result.current.showingFeedback).toBe(true);
      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.advanceToNext();
      });

      expect(result.current.showingFeedback).toBe(false);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentExercise).toEqual(mockExercises[1]);
    });
  });

  describe('streak tracking', () => {
    test('tracks current streak of correct answers', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      expect(result.current.currentStreak).toBe(0);

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      expect(result.current.currentStreak).toBe(1);

      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'pen');
      });
      expect(result.current.currentStreak).toBe(2);
    });

    test('resets streak on incorrect answer', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      expect(result.current.currentStreak).toBe(0);
    });

    test('tracks best streak', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'pen');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      expect(result.current.bestStreak).toBe(2);
      expect(result.current.currentStreak).toBe(0);
    });
  });

  describe('session statistics', () => {
    test('calculates accuracy percentage', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      expect(result.current.accuracy).toBe(50);
    });

    test('returns 0 accuracy when no results', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      expect(result.current.accuracy).toBe(0);
    });

    test('returns 100 accuracy when all correct', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'pen');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'هَذَا بَيْتٌ');
      });

      expect(result.current.accuracy).toBe(100);
    });
  });

  describe('restart', () => {
    test('resets session to initial state', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      // Complete some exercises
      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      // Restart
      act(() => {
        result.current.restart();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.results).toEqual([]);
      expect(result.current.correctCount).toBe(0);
      expect(result.current.incorrectCount).toBe(0);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.bestStreak).toBe(0);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.showingFeedback).toBe(false);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.currentExercise).toEqual(mockExercises[0]);
    });
  });

  describe('getIncorrectExercises', () => {
    test('returns exercises that were answered incorrectly', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      // First wrong answer enters retry mode
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });
      // Exhaust retries to show answer
      for (let i = 1; i < MAX_RETRY_ATTEMPTS; i++) {
        act(() => {
          result.current.retryExercise();
        });
        act(() => {
          result.current.recordAnswer(false, `wrong${i}`);
        });
      }
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'هَذَا بَيْتٌ');
      });

      const incorrect = result.current.getIncorrectExercises();
      expect(incorrect).toHaveLength(1);
      expect(incorrect[0].id).toBe('ex-2');
    });

    test('returns empty array when all correct', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'pen');
      });
      act(() => {
        result.current.advanceToNext();
      });
      act(() => {
        result.current.recordAnswer(true, 'هَذَا بَيْتٌ');
      });

      expect(result.current.getIncorrectExercises()).toHaveLength(0);
    });
  });

  describe('retry functionality', () => {
    test('enters retry mode on first incorrect answer', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      expect(result.current.isRetrying).toBe(true);
      expect(result.current.retryAttemptCount).toBe(1);
      expect(result.current.currentHint).not.toBeNull();
      expect(result.current.currentHint?.level).toBe(1);
      expect(result.current.lastIncorrectAnswer).toBe('wrong');
    });

    test('increments retry count on subsequent wrong answers', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      // First wrong answer
      act(() => {
        result.current.recordAnswer(false, 'wrong1');
      });
      expect(result.current.retryAttemptCount).toBe(1);

      // Trigger retry (simulates user clicking Try Again)
      act(() => {
        result.current.retryExercise();
      });

      // Second wrong answer
      act(() => {
        result.current.recordAnswer(false, 'wrong2');
      });
      expect(result.current.retryAttemptCount).toBe(2);
      expect(result.current.currentHint?.level).toBe(2);
    });

    test('exits retry mode on correct answer', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      // First wrong answer
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });
      expect(result.current.isRetrying).toBe(true);

      // Retry and get correct
      act(() => {
        result.current.retryExercise();
      });
      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });

      expect(result.current.isRetrying).toBe(false);
      expect(result.current.showingFeedback).toBe(true);
      expect(result.current.lastResult?.isCorrect).toBe(true);
    });

    test('shows full answer after max retries', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      // Exhaust all retries
      for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
        act(() => {
          result.current.recordAnswer(false, `wrong${i}`);
        });
        if (i < MAX_RETRY_ATTEMPTS - 1) {
          act(() => {
            result.current.retryExercise();
          });
        }
      }

      expect(result.current.retryAttemptCount).toBe(MAX_RETRY_ATTEMPTS);
      expect(result.current.currentHint?.showFullAnswer).toBe(true);
      expect(result.current.showingFeedback).toBe(true);
    });

    test('records each failed attempt in results', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      // Two wrong answers, then correct
      act(() => {
        result.current.recordAnswer(false, 'wrong1');
      });
      act(() => {
        result.current.retryExercise();
      });
      act(() => {
        result.current.recordAnswer(false, 'wrong2');
      });
      act(() => {
        result.current.retryExercise();
      });
      act(() => {
        result.current.recordAnswer(true, 'هَذَا');
      });

      // Should have 3 results: 2 incorrect + 1 correct
      expect(result.current.results).toHaveLength(3);
      expect(result.current.results[0].isCorrect).toBe(false);
      expect(result.current.results[1].isCorrect).toBe(false);
      expect(result.current.results[1].wasRetryAttempt).toBe(true);
      expect(result.current.results[2].isCorrect).toBe(true);
      expect(result.current.results[2].wasRetryAttempt).toBe(true);
    });

    test('clears retry state on advanceToNext', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      // Enter retry mode
      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });
      
      // Exhaust retries to show answer
      for (let i = 1; i < MAX_RETRY_ATTEMPTS; i++) {
        act(() => {
          result.current.retryExercise();
        });
        act(() => {
          result.current.recordAnswer(false, `wrong${i}`);
        });
      }

      // Advance to next
      act(() => {
        result.current.advanceToNext();
      });

      expect(result.current.isRetrying).toBe(false);
      expect(result.current.retryAttemptCount).toBe(0);
      expect(result.current.currentHint).toBeNull();
      expect(result.current.currentIndex).toBe(1);
    });

    test('increments retryTrigger on retryExercise', () => {
      const { result } = renderHook(() => usePracticeSession(mockExercises));

      act(() => {
        result.current.recordAnswer(false, 'wrong');
      });

      const initialTrigger = result.current.retryTrigger;
      
      act(() => {
        result.current.retryExercise();
      });

      expect(result.current.retryTrigger).toBe(initialTrigger + 1);
    });
  });
});
