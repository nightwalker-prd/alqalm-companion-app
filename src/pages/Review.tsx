import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EncounterBadge, EncounterCount } from '../components/ui/EncounterBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { useReviewQueue } from '../hooks/useReviewQueue';
import { useVocabulary } from '../hooks/useVocabulary';
import type { ReviewItem } from '../hooks/useReviewQueue';
import type { SM2Quality } from '../lib/spacedRepetition';
import { TARGET_ENCOUNTERS } from '../types/progress';

type ReviewMode = 'dashboard' | 'session';

/**
 * Review page for spaced repetition vocabulary review.
 * Based on SM-2 algorithm and Paul Nation's encounter research.
 */
export function Review() {
  const [mode, setMode] = useState<ReviewMode>('dashboard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  const {
    dueCount,
    reviewItems,
    stats,
    reviewWord,
    refresh,
  } = useReviewQueue();

  const {
    isLoaded: vocabLoaded,
    isLoading: vocabLoading,
    error: vocabError,
    getWord,
    load: loadVocab,
  } = useVocabulary();

  // Start a review session
  const startSession = useCallback(() => {
    setMode('session');
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ reviewed: 0, correct: 0 });
  }, []);

  // End review session
  const endSession = useCallback(() => {
    setMode('dashboard');
    refresh();
  }, [refresh]);

  // Handle quality rating from user
  const handleRating = useCallback(
    (quality: SM2Quality) => {
      const currentItem = reviewItems[currentIndex];
      if (!currentItem) return;

      // Record the review
      reviewWord(currentItem.wordId, quality, 'flashcard');

      // Update session stats
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      }));

      // Move to next card or end session
      if (currentIndex < reviewItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        endSession();
      }
    },
    [currentIndex, reviewItems, reviewWord, endSession]
  );

  // Show loading state while vocabulary loads
  if (vocabLoading && !vocabLoaded) {
    return (
      <>
        <Header title="Review" titleArabic="مُرَاجَعَة" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading vocabulary..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">Loading vocabulary...</p>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Show error state if vocabulary failed to load
  if (vocabError) {
    return (
      <>
        <Header title="Review" titleArabic="مُرَاجَعَة" />
        <PageContainer>
          <ErrorState
            title="Failed to load vocabulary"
            message={vocabError.message || "Unable to load word data. Please try again."}
            onRetry={() => loadVocab()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Render dashboard mode
  if (mode === 'dashboard') {
    return (
      <>
        <Header title="Review" titleArabic="مُرَاجَعَة" />
        <PageContainer>
          {/* Stats overview */}
          <div className="mb-8 animate-fade-in">
            <Card variant="elevated" padding="lg" hasGeometricAccent>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-1">
                  Spaced Repetition
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Based on SM-2 algorithm for optimal retention
                </p>
              </div>

              {/* Due count circle */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="var(--color-sand-200)"
                      strokeWidth="12"
                      fill="none"
                    />
                    {dueCount > 0 && (
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={
                          stats.overdueCount > 0
                            ? 'var(--color-error)'
                            : 'var(--color-primary)'
                        }
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(100, dueCount * 5) * 3.52} 352`}
                        className="transition-all duration-1000 ease-out"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--color-ink)]">
                      {dueCount}
                    </span>
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {dueCount === 1 ? 'word due' : 'words due'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox
                  value={stats.overdueCount}
                  label="Overdue"
                  color={stats.overdueCount > 0 ? 'error' : 'muted'}
                />
                <StatBox
                  value={stats.dueToday}
                  label="Due Today"
                  color="primary"
                />
                <StatBox
                  value={stats.reviewedToday}
                  label="Reviewed"
                  color="success"
                />
                <StatBox
                  value={stats.upcomingWeek}
                  label="This Week"
                  color="muted"
                />
              </div>

              {/* Start Review Button */}
              {dueCount > 0 && (
                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={startSession}
                  >
                    Start Review ({dueCount} {dueCount === 1 ? 'word' : 'words'})
                  </Button>
                </div>
              )}

              {dueCount === 0 && (
                <div className="mt-6 text-center text-[var(--color-ink-muted)]">
                  <p>All caught up! No words due for review.</p>
                  <Link
                    to="/practice"
                    className="text-[var(--color-primary)] hover:underline mt-2 inline-block"
                  >
                    Practice new words
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Due words list */}
          {reviewItems.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                Words Due for Review
              </h3>

              <div className="space-y-2">
                {reviewItems.slice(0, 10).map((item, index) => (
                  <ReviewItemCard
                    key={item.wordId}
                    item={item}
                    index={index}
                    getWord={getWord}
                  />
                ))}

                {reviewItems.length > 10 && (
                  <p className="text-center text-sm text-[var(--color-ink-muted)] py-2">
                    +{reviewItems.length - 10} more words
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Nation's Research Note */}
          <Card variant="default" padding="lg" className="mb-8 animate-slide-up">
            <CardHeader
              title="About Encounters"
              subtitle="From Paul Nation's research"
            />
            <CardContent className="mt-4 space-y-3 text-sm text-[var(--color-ink-muted)]">
              <p>
                Research shows vocabulary requires <strong className="text-[var(--color-ink)]">10-12 meaningful encounters</strong> for
                acquisition. The encounter badges show your progress toward this goal.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <EncounterBadge encounters={6} size="lg" />
                <span>= 6 of {TARGET_ENCOUNTERS} encounters completed</span>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Render session mode (flashcard review)
  const currentItem = reviewItems[currentIndex];
  const progress = ((currentIndex + 1) / reviewItems.length) * 100;

  return (
    <>
      <Header title="Review Session" titleArabic="جَلْسَة المُرَاجَعَة" />
      <PageContainer>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-[var(--color-ink-muted)] mb-2">
            <span>
              {currentIndex + 1} of {reviewItems.length}
            </span>
            <span>
              {sessionStats.correct} correct
            </span>
          </div>
          <div className="h-2 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        {currentItem && (
          <Card
            variant="elevated"
            padding="lg"
            className="mb-6 animate-fade-in min-h-[300px] flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              {(() => {
                const word = getWord(currentItem.wordId);
                return (
                  <>
                    <div className="text-center mb-4">
                      <span className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
                        {word?.arabic || currentItem.wordId}
                      </span>
                    </div>

                    {/* Encounter progress */}
                    <div className="flex items-center gap-2 mb-4">
                      <EncounterBadge
                        encounters={currentItem.encounters.total}
                        size="md"
                      />
                      <EncounterCount encounters={currentItem.encounters.total} />
                    </div>

                    {/* Overdue indicator */}
                    {Math.round(currentItem.daysOverdue) >= 1 && (
                      <span className="text-xs text-[var(--color-error)]">
                        {Math.round(currentItem.daysOverdue)} day{Math.round(currentItem.daysOverdue) !== 1 ? 's' : ''} overdue
                      </span>
                    )}

                    {/* Show answer button */}
                    {!showAnswer && (
                      <Button
                        variant="secondary"
                        onClick={() => setShowAnswer(true)}
                        className="mt-6"
                      >
                        Show Answer
                      </Button>
                    )}

                    {/* Answer section */}
                    {showAnswer && (
                      <div className="mt-6 text-center animate-fade-in">
                        <p className="text-xl text-[var(--color-ink-light)] mb-2">
                          {word?.english || 'Unknown word'}
                        </p>
                        {word?.root && (
                          <p className="text-sm text-[var(--color-ink-muted)]">
                            Root: <span className="arabic-sm" dir="rtl">{word.root}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </Card>
        )}

        {/* Rating buttons (SM-2 quality scale) */}
        {showAnswer && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-center text-sm text-[var(--color-ink-muted)] mb-3">
              How well did you remember?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => handleRating(0)}
                className="!border-[var(--color-error)] !text-[var(--color-error)]"
              >
                Forgot
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleRating(2)}
                className="!border-[var(--color-gold)] !text-[var(--color-gold-dark)]"
              >
                Hard
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleRating(3)}
                className="!border-[var(--color-learning)] !text-[var(--color-learning)]"
              >
                Good
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRating(5)}
              >
                Easy
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={endSession}
              className="mt-4"
              fullWidth
            >
              End Session
            </Button>
          </div>
        )}

        {/* Session complete */}
        {!currentItem && sessionStats.reviewed > 0 && (
          <Card variant="elevated" padding="lg" className="text-center animate-fade-in">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-4">
              Session Complete!
            </h2>
            <p className="text-[var(--color-ink-muted)] mb-6">
              You reviewed {sessionStats.reviewed} words with{' '}
              {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}% accuracy
            </p>
            <Button variant="primary" onClick={endSession} fullWidth>
              Back to Dashboard
            </Button>
          </Card>
        )}
      </PageContainer>
    </>
  );
}

// Stat box component
interface StatBoxProps {
  value: number;
  label: string;
  color: 'primary' | 'success' | 'error' | 'muted';
}

function StatBox({ value, label, color }: StatBoxProps) {
  const colorClasses = {
    primary: 'text-[var(--color-primary)]',
    success: 'text-[var(--color-success)]',
    error: 'text-[var(--color-error)]',
    muted: 'text-[var(--color-ink-muted)]',
  };

  return (
    <div className="text-center p-3 bg-[var(--color-sand-100)] rounded-[var(--radius-md)]">
      <div className={`text-xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-[var(--color-ink-muted)]">{label}</div>
    </div>
  );
}

// Review item card component
interface ReviewItemCardProps {
  item: ReviewItem;
  index: number;
  getWord: (wordId: string) => { arabic: string; english: string; root: string | null } | null;
}

function ReviewItemCard({ item, index, getWord }: ReviewItemCardProps) {
  const word = getWord(item.wordId);

  return (
    <Card
      variant="default"
      padding="sm"
      className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}
    >
      <div className="flex items-center gap-3">
        <EncounterBadge encounters={item.encounters.total} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="arabic-lg text-[var(--color-ink)] truncate block" dir="rtl">
            {word?.arabic || item.wordId}
          </span>
          <span className="text-xs text-[var(--color-ink-muted)] truncate block">
            {word?.english || 'Unknown'}
          </span>
        </div>
        {Math.round(item.daysOverdue) >= 1 && (
          <span className="text-xs text-[var(--color-error)]">
            {Math.round(item.daysOverdue)}d overdue
          </span>
        )}
      </div>
    </Card>
  );
}

export default Review;
