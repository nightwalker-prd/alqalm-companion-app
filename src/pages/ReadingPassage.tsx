import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { PassageReader } from '../components/reading/PassageReader';
import { usePassage } from '../hooks/useReading';
import { markPassageRead } from '../lib/readingService';

/**
 * ReadingPassage - Display a single reading passage.
 *
 * Provides the full reading experience with:
 * - Arabic text display
 * - Translation toggle
 * - Vocabulary highlights
 * - Grammar concepts
 * - Mark as read functionality (navigates back on first read)
 */
export function ReadingPassage() {
  const { passageId } = useParams<{ passageId: string }>();
  const navigate = useNavigate();
  const { passage, progress, isLoading, error } = usePassage(passageId || '');

  const handleMarkRead = useCallback(() => {
    if (passageId) {
      const wasUnread = !progress?.completed;
      markPassageRead(passageId);
      
      // Navigate back to reading list on first read
      if (wasUnread) {
        navigate('/reading');
      }
    }
  }, [passageId, progress?.completed, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <>
        <Header title="Loading..." />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading passage..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">
              Loading passage...
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
        <Header title="Error" />
        <PageContainer>
          <ErrorState
            title="Failed to load passage"
            message={error.message || 'Unable to load this passage. Please try again.'}
            onRetry={() => window.location.reload()}
            action={
              <Link to="/reading">
                <Button variant="secondary">Back to Reading</Button>
              </Link>
            }
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Show not found state
  if (!passage) {
    return (
      <>
        <Header title="Not Found" />
        <PageContainer>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-ink-muted)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="font-display text-2xl text-[var(--color-ink)] mb-2">
              Passage Not Found
            </h1>
            <p className="text-[var(--color-ink-muted)] mb-6">
              This passage doesn't exist or has been removed.
            </p>
            <Link to="/reading">
              <Button variant="primary">Browse Passages</Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header
        title={passage.title}
        titleArabic={passage.titleAr}
        showBackButton
      />
      <PageContainer>
        {/* Breadcrumb navigation */}
        <Breadcrumb 
          items={[
            { label: 'Reading', to: '/reading' },
            { label: passage.category || 'Passage', to: '/reading' },
            { label: passage.title, labelArabic: passage.titleAr }
          ]}
          className="mb-4"
        />

        <div className="animate-fade-in">
          <PassageReader
            passage={passage}
            progress={progress}
            onMarkRead={handleMarkRead}
          />
        </div>

        {/* Navigation footer */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-[var(--color-sand-200)]">
          <Link to="/reading">
            <Button variant="ghost" size="sm">
              <span className="flex items-center gap-2">
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
                Back to Reading
              </span>
            </Button>
          </Link>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default ReadingPassage;
