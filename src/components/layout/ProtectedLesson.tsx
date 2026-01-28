import { Navigate, useParams } from 'react-router-dom';
import { useUserSettings } from '../../contexts/UserSettingsContext';
import { hasCompletedOnboarding } from '../onboarding';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Header } from './Header';
import { PageContainer } from './PageContainer';

interface ProtectedLessonProps {
  children: React.ReactNode;
}

/**
 * Route guard that checks if a lesson is unlocked.
 * Redirects to onboarding if not completed, or to last unlocked lesson if locked.
 */
export function ProtectedLesson({ children }: ProtectedLessonProps) {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { settings, isLoading } = useUserSettings();

  // Show loading while settings load
  if (isLoading) {
    return (
      <>
        <Header title="Loading..." />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </PageContainer>
      </>
    );
  }

  // Redirect to onboarding if not completed
  const onboardingComplete = hasCompletedOnboarding();
  
  if (!onboardingComplete || !settings) {
    return <Navigate to="/onboarding" replace />;
  }

  // Parse lesson ID (format: "b1-l05" -> book 1, lesson 5)
  if (!lessonId) {
    return <>{children}</>;
  }

  const match = lessonId.match(/^b(\d+)-l(\d+)$/);
  if (!match) {
    return <>{children}</>;
  }

  const book = parseInt(match[1], 10);
  const lesson = parseInt(match[2], 10);

  // Check if this lesson is unlocked
  const isUnlocked = settings.isLessonUnlocked(book, lesson);
  
  if (!isUnlocked) {
    // Find the last unlocked lesson to redirect to
    const nextUnlocked = settings.getNextUnlockedLesson();
    const redirectId = `b${nextUnlocked.book}-l${String(nextUnlocked.lesson).padStart(2, '0')}`;
    
    // Avoid redirect loop - if we're already at the target, just show the content
    if (nextUnlocked.book === book && nextUnlocked.lesson === lesson) {
      return <>{children}</>;
    }
    
    return <Navigate to={`/lesson/${redirectId}`} replace />;
  }

  return <>{children}</>;
}

/**
 * Route guard for book-level access.
 * Redirects if trying to access a locked book.
 */
export function ProtectedBook({ children, bookNumber }: { children: React.ReactNode; bookNumber: number }) {
  const { settings, isLoading } = useUserSettings();

  if (isLoading) {
    return (
      <>
        <Header title="Loading..." />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!settings) {
    return <>{children}</>;
  }

  if (!settings.isBookUnlocked(bookNumber)) {
    // Redirect to books page
    return <Navigate to="/books" replace />;
  }

  return <>{children}</>;
}

export default ProtectedLesson;
