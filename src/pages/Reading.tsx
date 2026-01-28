import { useState, useCallback, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PassageCard } from '../components/reading/PassageCard';
import { usePassages } from '../hooks/useReading';
import { getPassageProgress } from '../lib/readingService';
import type { ReadingFilters, PassageLevel } from '../types/reading';

/**
 * Reading - Browse and filter reading passages.
 *
 * Implements Paul Nation's Strand 1: Meaning-focused Input.
 * Provides comprehensible input through graded reading passages.
 */
export function Reading() {
  const [filters, setFilters] = useState<ReadingFilters>({
    level: 'all',
    category: 'all',
    readStatus: 'all',
    searchQuery: '',
  });

  const { passages, stats, categories, isLoading, error } = usePassages(filters);

  const handleLevelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as PassageLevel | 'all';
      setFilters((prev) => ({ ...prev, level: value }));
    },
    []
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters((prev) => ({ ...prev, category: e.target.value }));
    },
    []
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as 'all' | 'read' | 'unread';
      setFilters((prev) => ({ ...prev, readStatus: value }));
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
    },
    []
  );

  // Get progress for displayed passages
  const passagesWithProgress = useMemo(() => {
    return passages.map((p) => ({
      passage: p,
      progress: getPassageProgress(p.id),
    }));
  }, [passages]);

  // Show loading state
  if (isLoading) {
    return (
      <>
        <Header title="Reading" titleArabic="المطالعة" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading passages..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">
              Loading reading passages...
            </p>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <Header title="Reading" titleArabic="المطالعة" />
        <PageContainer>
          <ErrorState
            title="Failed to load passages"
            message={error.message || 'Unable to load reading passages. Please try again.'}
            onRetry={() => window.location.reload()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  const progressPercent =
    stats.totalPassages > 0
      ? Math.round((stats.passagesRead / stats.totalPassages) * 100)
      : 0;

  return (
    <>
      <Header title="Reading" titleArabic="المطالعة" />
      <PageContainer>
        {/* Header with stats */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
            Reading Practice
          </h1>
          <p className="text-[var(--color-ink-muted)] text-sm mb-4">
            Build comprehension through graded Arabic texts
          </p>

          {/* Progress summary */}
          <div className="bg-white border border-[var(--color-sand-200)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--color-ink-muted)]">
                Passages Read
              </span>
              <span className="font-medium text-[var(--color-ink)]">
                {stats.passagesRead} / {stats.totalPassages}
              </span>
            </div>
            <ProgressBar value={progressPercent} variant="mastery" size="sm" />

            {/* Level breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div className="text-center">
                <div className="font-medium text-[var(--color-success)]">
                  {stats.byLevel.beginner.read}/{stats.byLevel.beginner.total}
                </div>
                <div className="text-[var(--color-ink-muted)]">Beginner</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-[var(--color-gold)]">
                  {stats.byLevel.intermediate.read}/{stats.byLevel.intermediate.total}
                </div>
                <div className="text-[var(--color-ink-muted)]">Intermediate</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-[var(--color-primary)]">
                  {stats.byLevel.advanced.read}/{stats.byLevel.advanced.total}
                </div>
                <div className="text-[var(--color-ink-muted)]">Advanced</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-sand-50)] border border-[var(--color-sand-200)] rounded-[var(--radius-lg)] p-4 mb-6 animate-slide-up">
          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search passages..."
              value={filters.searchQuery || ''}
              onChange={handleSearchChange}
              className="
                w-full
                px-3 py-2
                bg-white
                border border-[var(--color-sand-200)]
                rounded-[var(--radius-md)]
                text-sm
                placeholder:text-[var(--color-ink-muted)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
              "
            />
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-3 gap-2">
            <select
              value={filters.level || 'all'}
              onChange={handleLevelChange}
              className="
                px-2 py-1.5
                bg-white
                border border-[var(--color-sand-200)]
                rounded-[var(--radius-md)]
                text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
              "
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.category || 'all'}
              onChange={handleCategoryChange}
              className="
                px-2 py-1.5
                bg-white
                border border-[var(--color-sand-200)]
                rounded-[var(--radius-md)]
                text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
              "
            >
              <option value="all">All Topics</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filters.readStatus || 'all'}
              onChange={handleStatusChange}
              className="
                px-2 py-1.5
                bg-white
                border border-[var(--color-sand-200)]
                rounded-[var(--radius-md)]
                text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
              "
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4 text-sm text-[var(--color-ink-muted)]">
          <span>
            Showing {passages.length} passage{passages.length !== 1 ? 's' : ''}
          </span>
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="text-[var(--color-primary)] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Passage list */}
        {passages.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-[var(--color-ink-muted)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-[var(--color-ink-muted)]">
              No passages match your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            {passagesWithProgress.map(({ passage, progress }, index) => (
              <div
                key={passage.id}
                className="animate-slide-up"
                style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
              >
                <PassageCard passage={passage} progress={progress} />
              </div>
            ))}
          </div>
        )}
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default Reading;
