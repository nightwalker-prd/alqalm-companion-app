/**
 * FlashcardSessionSummary Component
 *
 * Shows results after completing a flashcard session.
 */

import { useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { useAchievementContext } from '../../contexts/AchievementContext';

interface FlashcardSessionSummaryProps {
  totalCards: number;
  correctCount: number;
  accuracy: number;
  duration: number;
  cardsPerMinute: number;
  onPracticeAgain: () => void;
  onChangeDeck: () => void;
}

export function FlashcardSessionSummary({
  totalCards,
  correctCount,
  accuracy,
  duration,
  cardsPerMinute,
  onPracticeAgain,
  onChangeDeck,
}: FlashcardSessionSummaryProps) {
  const { recordPractice } = useAchievementContext();
  const isPerfect = accuracy === 100;

  // Record flashcard session for streak/achievements
  useEffect(() => {
    recordPractice({
      exerciseCount: totalCards,
      correctCount,
      isPerfect,
    });
  }, []); // Only run once on mount

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPerformanceMessage = (): { message: string; emoji: string } => {
    if (accuracy >= 90) return { message: 'Excellent!', emoji: '🌟' };
    if (accuracy >= 75) return { message: 'Great job!', emoji: '👏' };
    if (accuracy >= 60) return { message: 'Good progress!', emoji: '💪' };
    return { message: 'Keep practicing!', emoji: '📚' };
  };

  const { message, emoji } = getPerformanceMessage();

  return (
    <Card variant="elevated" padding="lg" className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-5xl mb-3 block">{emoji}</span>
        <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
          Session Complete
        </h2>
        <p className="text-lg text-[var(--color-ink-muted)] mt-1">{message}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox
          label="Accuracy"
          value={`${accuracy}%`}
          highlight={accuracy >= 75}
        />
        <StatBox
          label="Cards Reviewed"
          value={`${correctCount}/${totalCards}`}
        />
        <StatBox
          label="Time"
          value={formatDuration(duration)}
        />
        <StatBox
          label="Speed"
          value={`${cardsPerMinute}/min`}
        />
      </div>

      {/* Progress info */}
      <div className="p-4 bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)] rounded-lg mb-6">
        <p className="text-sm text-[var(--color-ink)]">
          <strong>Nation's Tip:</strong> Aim for 90%+ accuracy. If you're below
          80%, focus on fewer cards at a time for deeper learning.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="primary" size="lg" fullWidth onClick={onPracticeAgain}>
          Practice Again
        </Button>
        <Button variant="secondary" size="md" fullWidth onClick={onChangeDeck}>
          Choose Different Deck
        </Button>
        <Link to="/practice" className="block">
          <Button variant="ghost" size="md" fullWidth>
            Back to Practice
          </Button>
        </Link>
      </div>
    </Card>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatBox({ label, value, highlight }: StatBoxProps) {
  return (
    <div
      className={`p-4 rounded-lg text-center ${
        highlight
          ? 'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700'
          : 'bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)]'
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--color-ink)]'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--color-ink-muted)] mt-1">{label}</p>
    </div>
  );
}

export default FlashcardSessionSummary;
