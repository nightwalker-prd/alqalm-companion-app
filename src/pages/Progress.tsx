import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { CalibrationCard } from '../components/progress/CalibrationCard';
import { WeaknessCard } from '../components/progress/WeaknessCard';
import { DataManagement } from '../components/progress/DataManagement';
import { analyzeWeaknesses } from '../lib/weaknessAnalysis';
import { useProgress } from '../hooks/useProgress';
import { useManifest } from '../hooks/useManifest';

// Book metadata
const bookMetadata = [
  {
    book: 1,
    title: 'Book 1: Fundamentals',
    titleArabic: 'الكِتَاب الأَوَّل',
  },
  {
    book: 2,
    title: 'Book 2: Intermediate',
    titleArabic: 'الكِتَاب الثَّانِي',
  },
  {
    book: 3,
    title: 'Book 3: Advanced',
    titleArabic: 'الكِتَاب الثَّالِث',
  },
];

export function Progress() {
  const {
    isLoaded: manifestLoaded,
    isLoading: manifestLoading,
    error: manifestError,
    load: loadManifest,
  } = useManifest();

  const { stats, getBookStats, getCalibrationStats, getCalibrationTrend, resetAllProgress } = useProgress();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Get calibration data
  const calibrationStats = getCalibrationStats();
  const calibrationTrend = getCalibrationTrend();

  // Show loading state while manifest loads
  if (manifestLoading && !manifestLoaded) {
    return (
      <>
        <Header title="Progress" titleArabic="تَقَدُّم" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading progress..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">Loading progress...</p>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Show error state if manifest failed to load
  if (manifestError) {
    return (
      <>
        <Header title="Progress" titleArabic="تَقَدُّم" />
        <PageContainer>
          <ErrorState
            title="Failed to load progress"
            message={manifestError.message || "Unable to load progress data. Please try again."}
            onRetry={() => loadManifest()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Stats should be available now that manifest is loaded
  if (!stats) {
    return (
      <>
        <Header title="Progress" titleArabic="تَقَدُّم" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading stats..." />
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  const overallProgress = stats.totalWords > 0
    ? Math.round((stats.wordsLearned / stats.totalWords) * 100)
    : 0;

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    resetAllProgress();
    setShowResetConfirm(false);
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  return (
    <>
      <Header title="Progress" titleArabic="تَقَدُّم" showBack />
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Progress', labelArabic: 'تقدم' }
          ]}
          className="mb-4"
        />
        {/* Reset confirmation modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-[var(--radius-xl)] p-6 mx-4 max-w-sm w-full shadow-xl">
              <h3 className="font-display text-lg font-semibold text-[var(--color-ink)] mb-2">
                Reset All Progress?
              </h3>
              <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                This will permanently delete all your learning progress, streaks, and statistics.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleResetCancel}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleResetConfirm}
                  fullWidth
                  className="!bg-[var(--color-error)] hover:!bg-red-700"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Overall stats header */}
        <div className="mb-8 animate-fade-in">
          <Card variant="elevated" padding="lg" hasGeometricAccent>
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-1">
                Your Journey
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Mastering Arabic through the Madina Books
              </p>
            </div>

            {/* Progress ring */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="var(--color-sand-200)"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="var(--color-primary)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${overallProgress * 3.52} 352`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[var(--color-ink)]">
                    {overallProgress}%
                  </span>
                  <span className="text-xs text-[var(--color-ink-muted)]">Complete</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox
                value={stats.wordsLearned}
                label="Words Learned"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                }
              />
              <StatBox
                value={stats.wordsInProgress}
                label="In Progress"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                }
              />
              <StatBox
                value={stats.lessonsCompleted}
                label="Lessons Done"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                }
              />
              <StatBox
                value={`${stats.accuracy}%`}
                label="Accuracy"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                }
              />
            </div>

            {/* Streak display */}
            {(stats.currentPracticeStreak > 0 || stats.currentAnswerStreak > 0) && (
              <div className="mt-6 pt-4 border-t border-[var(--color-sand-200)]">
                <div className="flex justify-center gap-8">
                  {stats.currentPracticeStreak > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--color-gold)]">
                        {stats.currentPracticeStreak}
                      </div>
                      <div className="text-xs text-[var(--color-ink-muted)]">Day Streak</div>
                    </div>
                  )}
                  {stats.currentAnswerStreak > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--color-success)]">
                        {stats.currentAnswerStreak}
                      </div>
                      <div className="text-xs text-[var(--color-ink-muted)]">Answer Streak</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Book-by-book progress */}
        <div className="space-y-4 mb-8">
          <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Progress by Book
          </h3>

          {bookMetadata.map((meta, index) => {
            const bookStats = getBookStats(meta.book);
            if (!bookStats) return null; // Skip if not available
            return (
              <Card
                key={meta.book}
                variant="default"
                padding="md"
                className={`animate-slide-up stagger-${index + 1}`}
              >
                <div className="flex items-center gap-4">
                  {/* Book number */}
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-lg font-bold text-[var(--color-primary)]">
                      {meta.book}
                    </span>
                  </div>

                  {/* Book info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-[var(--color-ink)] truncate">
                        {meta.title}
                      </h4>
                      <span className="text-sm text-[var(--color-ink-muted)] ml-2">
                        {bookStats.lessonsCompleted}/{bookStats.totalLessons}
                      </span>
                    </div>
                    <ProgressBar value={bookStats.masteryPercent} variant="mastery" size="sm" />
                    <div className="flex items-center justify-between mt-2 text-xs text-[var(--color-ink-muted)]">
                      <span>
                        {bookStats.wordsLearned} learned
                        {bookStats.wordsInProgress > 0 && ` · ${bookStats.wordsInProgress} in progress`}
                      </span>
                      <span className="arabic-sm" dir="rtl">{meta.titleArabic}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Learning insights */}
        <Card variant="default" padding="lg" className="mb-4 animate-slide-up stagger-4">
          <CardHeader
            title="Learning Insights"
            subtitle="From the science of memory"
          />
          <CardContent className="mt-4 space-y-4">
            <InsightItem
              title="Spaced Repetition"
              description="Review vocabulary at increasing intervals to move knowledge to long-term memory."
              status={stats.lastPracticeDate ? 'active' : 'not-started'}
            />
            <InsightItem
              title="Interleaving"
              description="Mix different topics and exercise types for deeper learning."
              status="active"
            />
            <InsightItem
              title="Active Recall"
              description="Type answers instead of selecting them to strengthen memory traces."
              status="active"
            />
          </CardContent>
        </Card>

        {/* Confidence Calibration */}
        <div className="mb-4 animate-slide-up stagger-5">
          <CalibrationCard stats={calibrationStats} trend={calibrationTrend} />
        </div>

        {/* Weakness Analysis */}
        <div className="mb-8 animate-slide-up stagger-5">
          <WeaknessCard report={analyzeWeaknesses()} />
        </div>

        {/* Data Management (Export/Import) */}
        <div className="mb-4 animate-slide-up stagger-5">
          <DataManagement />
        </div>

        {/* Reset progress button */}
        <div className="mb-8">
          <Button
            variant="secondary"
            onClick={handleResetClick}
            fullWidth
            className="!text-[var(--color-error)] !border-[var(--color-error)] hover:!bg-red-50"
          >
            Reset All Progress
          </Button>
        </div>

        {/* Encouragement */}
        <div className="text-center py-6 text-sm text-[var(--color-ink-muted)]">
          <p className="italic">
            "The more effort required to retrieve something from memory,
            the better you learn it."
          </p>
          <p className="mt-1 text-xs">— Make It Stick</p>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

// Stat box component
interface StatBoxProps {
  value: number | string;
  label: string;
  icon: React.ReactNode;
}

function StatBox({ value, label, icon }: StatBoxProps) {
  return (
    <div className="text-center p-3 bg-[var(--color-sand-100)] rounded-[var(--radius-md)]">
      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
        <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div className="text-xl font-bold text-[var(--color-ink)]">{value}</div>
      <div className="text-xs text-[var(--color-ink-muted)]">{label}</div>
    </div>
  );
}

// Insight item component
interface InsightItemProps {
  title: string;
  description: string;
  status: 'active' | 'not-started' | 'needs-attention';
}

function InsightItem({ title, description, status }: InsightItemProps) {
  const statusStyles = {
    active: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    'not-started': 'bg-[var(--color-sand-200)] text-[var(--color-ink-muted)]',
    'needs-attention': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  };

  const statusLabels = {
    active: 'Active',
    'not-started': 'Not Started',
    'needs-attention': 'Needs Attention',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-[var(--color-sand-50)] rounded-[var(--radius-md)]">
      <div className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </div>
      <div className="flex-1">
        <h5 className="font-medium text-sm text-[var(--color-ink)]">{title}</h5>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default Progress;
