/**
 * NarrowReading Page
 *
 * Implements Paul Nation's narrow reading methodology:
 * - Browse reading passages grouped by topic
 * - Track topic completion progress
 * - Earn badges for completing topics
 */

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { NarrowReadingCollections } from '../components/reading/NarrowReadingCollections';
import { PassageCard } from '../components/reading/PassageCard';
import { usePassages } from '../hooks/useReading';
import {
  groupPassagesByTopic,
  getTopicStats,
  getRecommendedTopics,
  sortPassagesForNarrowReading,
} from '../lib/narrowReadingService';
import { getPassageProgress } from '../lib/readingService';

type ViewMode = 'collections' | 'topic';

export function NarrowReading() {
  const [viewMode, setViewMode] = useState<ViewMode>('collections');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { passages, isLoading, error } = usePassages({
    level: 'all',
    category: 'all',
    readStatus: 'all',
    searchQuery: '',
  });

  // Group passages by topic
  const collections = useMemo(() => {
    if (!passages.length) return [];
    return groupPassagesByTopic(passages);
  }, [passages]);

  // Get topic stats
  const topicStats = useMemo(() => {
    if (!passages.length) return null;
    return getTopicStats(passages);
  }, [passages]);

  // Get recommended topics
  const recommendedTopics = useMemo(() => {
    if (!passages.length) return [];
    return getRecommendedTopics(passages, 3);
  }, [passages]);

  // Filter collections by search
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const query = searchQuery.toLowerCase();
    return collections.filter(
      (c) =>
        c.topic.toLowerCase().includes(query) ||
        c.topicAr.includes(searchQuery)
    );
  }, [collections, searchQuery]);

  // Get selected collection
  const selectedCollection = useMemo(() => {
    if (!selectedTopic) return null;
    return collections.find((c) => c.topic === selectedTopic) || null;
  }, [collections, selectedTopic]);

  // Handle topic selection
  const handleSelectTopic = useCallback((topic: string) => {
    setSelectedTopic(topic);
    setViewMode('topic');
  }, []);

  // Handle back to collections
  const handleBackToCollections = useCallback(() => {
    setSelectedTopic(null);
    setViewMode('collections');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Narrow Reading" titleArabic="القراءة المركزة" showBackButton />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading topics..." />
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header title="Narrow Reading" titleArabic="القراءة المركزة" showBackButton />
        <PageContainer>
          <ErrorState
            title="Failed to load topics"
            message={error.message || 'Unable to load reading topics.'}
            onRetry={() => window.location.reload()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Topic view
  if (viewMode === 'topic' && selectedCollection) {
    const sortedPassages = sortPassagesForNarrowReading(
      selectedCollection.passages
    );

    return (
      <>
        <Header
          title={selectedCollection.topic}
          titleArabic={selectedCollection.topicAr}
          showBackButton
        />
        <PageContainer>
          {/* Back button */}
          <button
            onClick={handleBackToCollections}
            className="flex items-center gap-2 text-[var(--color-primary)] hover:underline mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            All Topics
          </button>

          {/* Topic header */}
          <Card variant="elevated" padding="md" className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-[var(--color-primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">
                  {selectedCollection.topic}
                </h2>
                <p
                  className="font-arabic text-[var(--color-ink-muted)]"
                  dir="rtl"
                >
                  {selectedCollection.topicAr}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--color-ink-muted)]">Progress</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {selectedCollection.passagesRead}/{selectedCollection.passages.length}
                </span>
              </div>
              <ProgressBar
                value={selectedCollection.progressPercent}
                max={100}
                variant={
                  selectedCollection.progressPercent === 100 ? 'success' : 'default'
                }
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-[var(--color-sand-200)]">
              <div>
                <div className="text-lg font-bold text-[var(--color-ink)]">
                  {selectedCollection.passages.length}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Passages</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--color-ink)]">
                  {selectedCollection.totalWordCount.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Words</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--color-success)]">
                  {selectedCollection.progressPercent}%
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Complete</div>
              </div>
            </div>
          </Card>

          {/* Paul Nation tip */}
          <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg border border-[var(--color-gold)] border-opacity-30">
            <p className="text-sm text-[var(--color-ink)]">
              <strong>Nation's Tip:</strong> Read all passages in this topic to
              maximize vocabulary exposure through context.
            </p>
          </div>

          {/* Passages list */}
          <div className="space-y-3">
            {sortedPassages.map((passage) => (
              <PassageCard
                key={passage.id}
                passage={passage}
                progress={getPassageProgress(passage.id)}
              />
            ))}
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Collections view
  return (
    <>
      <Header title="Narrow Reading" titleArabic="القراءة المركزة" showBackButton />
      <PageContainer>
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-2">
            Narrow Reading
          </h1>
          <p className="text-[var(--color-ink-muted)]">
            Read multiple texts on the same topic to build vocabulary through
            repeated natural exposure.
          </p>
        </div>

        {/* Stats overview */}
        {topicStats && (
          <Card variant="default" padding="md" className="mb-6">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-[var(--color-ink)]">
                  {topicStats.totalTopics}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Topics</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-primary)]">
                  {topicStats.topicsStarted}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Started</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-success)]">
                  {topicStats.topicsCompleted}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-gold)]">
                  {topicStats.averageProgress}%
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Avg</div>
              </div>
            </div>
          </Card>
        )}

        {/* Recommended topics */}
        {recommendedTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-semibold text-[var(--color-ink)] mb-3">
              Recommended for You
            </h2>
            <div className="grid gap-3">
              {recommendedTopics.map((collection) => (
                <button
                  key={collection.topic}
                  onClick={() => handleSelectTopic(collection.topic)}
                  className="w-full text-left"
                >
                  <Card
                    variant="outlined"
                    padding="sm"
                    className="hover:border-[var(--color-primary)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--color-ink)] truncate">
                          {collection.topic}
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {collection.passagesRead}/{collection.passages.length}{' '}
                          passages read
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="w-16">
                          <ProgressBar
                            value={collection.progressPercent}
                            max={100}
                            variant="default"
                            size="sm"
                          />
                        </div>
                        <svg
                          className="w-4 h-4 text-[var(--color-ink-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full px-4 py-2
              bg-white border border-[var(--color-sand-200)]
              rounded-[var(--radius-md)]
              text-sm
              placeholder:text-[var(--color-ink-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
            "
          />
        </div>

        {/* All topics */}
        <h2 className="font-display font-semibold text-[var(--color-ink)] mb-3">
          All Topics ({filteredCollections.length})
        </h2>
        <NarrowReadingCollections
          collections={filteredCollections}
          onSelectTopic={handleSelectTopic}
        />

        {/* Link to regular reading */}
        <div className="mt-6 text-center">
          <Link
            to="/reading"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            Browse all passages without topic grouping
          </Link>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default NarrowReading;
