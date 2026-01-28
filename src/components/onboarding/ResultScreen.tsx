import { Button } from '../ui/Button';
import type { OnboardingData, PlacementResult, TimeCommitment } from './types';

interface ResultScreenProps {
  data: Partial<OnboardingData>;
  placementResult?: PlacementResult;
  onStart: () => void;
  onChangeSettings: () => void;
}

export function ResultScreen({ 
  data, 
  placementResult, 
  onStart, 
  onChangeSettings 
}: ResultScreenProps) {
  const startingBook = placementResult?.recommendedBook ?? data.startingBook ?? 1;
  const startingLesson = placementResult?.recommendedLesson ?? data.startingLesson ?? 1;
  const dailyGoal = getDailyGoal(data.timeCommitment);
  const weeksToComplete = getWeeksEstimate(startingBook, data.timeCommitment);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-sand-100)]">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Header */}
        {placementResult ? (
          <>
            <div className="text-4xl mb-2">📊</div>
            <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
              Quiz Complete!
            </h2>
            <p className="text-[var(--color-ink-muted)]">
              You got {placementResult.score}/{placementResult.total} correct
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">✨</div>
            <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
              You're all set!
            </h2>
          </>
        )}

        {/* Recommendation Card */}
        <div className="bg-white rounded-2xl border border-[var(--color-sand-200)] p-6 text-left space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📘</span>
            <div>
              <p className="text-sm text-[var(--color-ink-muted)]">Starting Point</p>
              <p className="font-medium text-[var(--color-ink)]">
                Book {startingBook}, Lesson {startingLesson}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-sm text-[var(--color-ink-muted)]">Daily Goal</p>
              <p className="font-medium text-[var(--color-ink)]">
                {dailyGoal} lessons + review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="text-sm text-[var(--color-ink-muted)]">Est. to finish Book {startingBook}</p>
              <p className="font-medium text-[var(--color-ink)]">
                {weeksToComplete} weeks
              </p>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses (if quiz taken) */}
        {placementResult && placementResult.score > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-sand-200)] p-6 text-left space-y-4 shadow-sm">
            {placementResult.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--color-success)] mb-2">
                  ✓ You know:
                </p>
                <ul className="text-sm text-[var(--color-ink-muted)] space-y-1">
                  {placementResult.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {placementResult.weaknesses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                  ○ To strengthen:
                </p>
                <ul className="text-sm text-[var(--color-ink-muted)] space-y-1">
                  {placementResult.weaknesses.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Button 
            size="lg" 
            fullWidth 
            onClick={onStart}
            rightIcon={<span>→</span>}
          >
            Start Learning
          </Button>
          
          <button 
            onClick={onChangeSettings}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Change my settings
          </button>
        </div>
      </div>
    </div>
  );
}

function getDailyGoal(time?: TimeCommitment): number {
  switch (time) {
    case '15min': return 1;
    case '30min': return 2;
    case '60min': return 4;
    default: return 2;
  }
}

function getWeeksEstimate(book: number, time?: TimeCommitment): number {
  const lessonsPerBook = book === 1 ? 30 : book === 2 ? 40 : 50;
  const dailyGoal = getDailyGoal(time);
  const daysToComplete = Math.ceil(lessonsPerBook / dailyGoal);
  return Math.ceil(daysToComplete / 7);
}
