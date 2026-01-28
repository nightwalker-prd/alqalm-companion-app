import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { useProgress } from '../hooks/useProgress';
import { useManifest } from '../hooks/useManifest';
import { useUserSettings } from '../contexts/UserSettingsContext';
import type { BookProgress } from '../types/progress';

// Book metadata (static)
const bookMetadata = [
  {
    id: 1,
    title: 'Book 1: Fundamentals',
    titleArabic: 'الكِتَاب الأَوَّل',
    description: 'Master the basics: demonstratives, questions, pronouns, and simple sentences.',
    coverColor: 'from-[var(--color-primary)] to-[var(--color-primary-dark)]',
  },
  {
    id: 2,
    title: 'Book 2: Intermediate',
    titleArabic: 'الكِتَاب الثَّانِي',
    description: 'Expand your knowledge: verb conjugations, noun patterns, and complex sentences.',
    coverColor: 'from-[var(--color-gold)] to-[var(--color-gold-dark)]',
  },
  {
    id: 3,
    title: 'Book 3: Advanced',
    titleArabic: 'الكِتَاب الثَّالِث',
    description: 'Master Arabic: advanced grammar, eloquent expression, and classical texts.',
    coverColor: 'from-[var(--color-success)] to-[#2D5A3D]',
  },
];

export function Books() {
  const {
    isLoaded: manifestLoaded,
    isLoading: manifestLoading,
    error: manifestError,
    load: loadManifest,
  } = useManifest();

  const { getBookStats } = useProgress();
  const { settings } = useUserSettings();

  // Show loading state while manifest loads
  if (manifestLoading && !manifestLoaded) {
    return (
      <>
        <Header title="Books" titleArabic="الكُتُب" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading books..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">Loading books...</p>
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
        <Header title="Books" titleArabic="الكُتُب" />
        <PageContainer>
          <ErrorState
            title="Failed to load content"
            message={manifestError.message || "Unable to load book data. Please try again."}
            onRetry={() => loadManifest()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header title="Books" titleArabic="الكُتُب" />
      <PageContainer>
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
            Durūs al-lughah al-ʻArabīyah
          </h1>
          <p className="text-[var(--color-ink-muted)]">
            The complete Arabic curriculum
          </p>
        </div>

        {/* Books grid */}
        <div className="flex flex-col gap-4 py-4">
          {bookMetadata.map((meta, index) => {
            const stats = getBookStats(meta.id);
            if (!stats) return null; // Skip if stats not available
            // Book is locked if user hasn't reached it yet
            const isLocked = settings ? !settings.isBookUnlocked(meta.id) : false;
            return (
              <BookCard
                key={meta.id}
                meta={meta}
                stats={stats}
                index={index}
                isLocked={isLocked}
              />
            );
          })}
        </div>

        {/* Info footer */}
        <div className="mt-6 p-4 bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)] rounded-[var(--radius-lg)] text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Based on the Madina Arabic course by Dr. V. Abdur Rahim.
          </p>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

interface BookCardProps {
  meta: typeof bookMetadata[0];
  stats: BookProgress;
  index: number;
  isLocked?: boolean;
}

function BookCard({ meta, stats, index, isLocked = false }: BookCardProps) {
  const content = (
    <Card
      variant="elevated"
      padding="none"
      className={`
        overflow-hidden
        animate-slide-up
        transition-shadow
        ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-[var(--shadow-lg)] cursor-pointer'}
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Book cover header */}
      <div className={`bg-gradient-to-br ${meta.coverColor} p-6 relative overflow-hidden`}>
        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id={`pattern-${meta.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="10" cy="10" r="1.5" fill="white" />
            </pattern>
            <rect width="100" height="100" fill={`url(#pattern-${meta.id})`} />
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded text-xs text-white font-semibold mb-2 shadow-sm">
                Book {meta.id}
              </span>
              <h2 className="font-display text-xl font-semibold text-white mb-1">
                {meta.title.split(':')[1]?.trim() || meta.title}
              </h2>
              <p className="arabic-base text-white/95" dir="rtl">
                {meta.titleArabic}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Book content */}
      <div className="p-5">
        <p className="text-sm text-[var(--color-ink-light)] mb-4">
          {meta.description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--color-ink-muted)]">Progress</span>
            <span className="text-[var(--color-ink-muted)]">
              {stats.lessonsCompleted}/{stats.totalLessons} lessons
            </span>
          </div>
          <ProgressBar value={stats.masteryPercent} variant="mastery" size="sm" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-[var(--color-ink-muted)]">
              <strong className="text-[var(--color-ink)]">{stats.wordsLearned}</strong> learned
              {stats.wordsInProgress > 0 && (
                <span className="ml-1">
                  · <strong className="text-amber-700 dark:text-amber-400">{stats.wordsInProgress}</strong> in progress
                </span>
              )}
            </span>
          </div>

          {isLocked ? (
            <span className="text-[var(--color-ink-muted)]">
              Complete Book {meta.id - 1} to unlock
            </span>
          ) : (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
              {stats.lessonsCompleted > 0 ? 'Continue' : 'Start'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </Card>
  );

  if (isLocked) {
    return content;
  }

  return <Link to={`/lesson/b${meta.id}-l01`}>{content}</Link>;
}

export default Books;
