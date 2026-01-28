import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { LoadingPage } from './components/ui/LoadingSpinner';
import { hasCompletedOnboarding } from './components/onboarding';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { ProtectedLesson } from './components/layout/ProtectedLesson';
import { PWAUpdatePrompt, OfflineIndicator } from './components/pwa';
import { useVocabularyPreload } from './hooks/useVocabulary';
import { useFIReInit } from './hooks/useFIReInit';
import { loadManifest } from './lib/contentStatsCore';

// Lazy-load all pages except Dashboard (landing page)
// This reduces the initial bundle size significantly
const PracticeSession = lazy(() => import('./pages/PracticeSession'));
const LessonDetail = lazy(() => import('./pages/LessonDetail'));
const Books = lazy(() => import('./pages/Books'));
const Progress = lazy(() => import('./pages/Progress'));
const Review = lazy(() => import('./pages/Review'));
const Reading = lazy(() => import('./pages/Reading'));
const ReadingPassage = lazy(() => import('./pages/ReadingPassage'));
const RootsPractice = lazy(() => import('./pages/RootsPractice'));
const RootsExplore = lazy(() => import('./pages/RootsExplore'));
const FluencyPractice = lazy(() => import('./pages/FluencyPractice'));
const WeaknessPractice = lazy(() => import('./pages/WeaknessPractice'));
const FreeRecallPractice = lazy(() => import('./pages/FreeRecallPractice'));
const PreTestSession = lazy(() => import('./pages/PreTestSession'));
const CollocationPractice = lazy(() => import('./pages/CollocationPractice'));
const Vocabulary = lazy(() => import('./pages/Vocabulary'));
const FlashcardPractice = lazy(() => import('./pages/FlashcardPractice'));
const NarrowReading = lazy(() => import('./pages/NarrowReading'));
const SpeedReadingPractice = lazy(() => import('./pages/SpeedReadingPractice'));
const IrabPractice = lazy(() => import('./pages/IrabPractice'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const Achievements = lazy(() => import('./pages/Achievements'));
const WaznPractice = lazy(() => import('./pages/WaznPractice'));
const MorphPractice = lazy(() => import('./pages/MorphPractice'));
const DailyChallenge = lazy(() => import('./pages/DailyChallenge'));
const GrammarReference = lazy(() => import('./pages/GrammarReference'));
const TypingPractice = lazy(() => import('./pages/TypingPractice'));
const SentenceBuilding = lazy(() => import('./pages/SentenceBuilding'));
const Settings = lazy(() => import('./pages/Settings'));

// Wrapper to redirect to onboarding if not completed
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  if (!hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

// Wrapper to redirect away from onboarding if already completed
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  if (hasCompletedOnboarding()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/**
 * Preload content in background after initial render.
 * This starts loading vocabulary and manifest data early
 * so they're ready when users navigate to other pages.
 */
function useBackgroundPreload() {
  useVocabularyPreload();

  // Initialize FIRe spaced repetition system
  // This builds the encompassing graph from lesson data
  useFIReInit();

  // Also preload the content manifest for stats
  // Uses same delayed pattern as vocabulary
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      loadManifest().catch(() => {
        // Errors will be handled by components
      });
    }, 150);
  }
}

function App() {
  // Start background preloading of vocabulary and manifest
  useBackgroundPreload();

  return (
    <BrowserRouter>
      <UserSettingsProvider>
        <AchievementProvider>
        <OfflineIndicator />
        <Suspense fallback={<LoadingPage message="Loading page..." />}>
          <Routes>
          <Route path="/" element={<RequireOnboarding><Dashboard /></RequireOnboarding>} />
          <Route path="/practice" element={<RequireOnboarding><PracticeSession /></RequireOnboarding>} />
          <Route path="/practice/fluency" element={<RequireOnboarding><FluencyPractice /></RequireOnboarding>} />
          <Route path="/practice/weaknesses" element={<RequireOnboarding><WeaknessPractice /></RequireOnboarding>} />
          <Route path="/practice/recall" element={<RequireOnboarding><FreeRecallPractice /></RequireOnboarding>} />
          <Route path="/practice/collocations" element={<RequireOnboarding><CollocationPractice /></RequireOnboarding>} />
          <Route path="/roots" element={<RequireOnboarding><RootsPractice /></RequireOnboarding>} />
          <Route path="/roots/explore" element={<RequireOnboarding><RootsExplore /></RequireOnboarding>} />
          <Route path="/lesson/:lessonId" element={<ProtectedLesson><LessonDetail /></ProtectedLesson>} />
          <Route path="/pretest/:lessonId" element={<ProtectedLesson><PreTestSession /></ProtectedLesson>} />
          <Route path="/books" element={<RequireOnboarding><Books /></RequireOnboarding>} />
          <Route path="/progress" element={<RequireOnboarding><Progress /></RequireOnboarding>} />
          <Route path="/review" element={<RequireOnboarding><Review /></RequireOnboarding>} />
          <Route path="/reading" element={<RequireOnboarding><Reading /></RequireOnboarding>} />
          <Route path="/reading/:passageId" element={<RequireOnboarding><ReadingPassage /></RequireOnboarding>} />
          <Route path="/vocabulary" element={<RequireOnboarding><Vocabulary /></RequireOnboarding>} />
          <Route path="/practice/flashcards" element={<RequireOnboarding><FlashcardPractice /></RequireOnboarding>} />
          <Route path="/reading/topics" element={<RequireOnboarding><NarrowReading /></RequireOnboarding>} />
          <Route path="/reading/speed" element={<RequireOnboarding><SpeedReadingPractice /></RequireOnboarding>} />
          <Route path="/practice/irab" element={<RequireOnboarding><IrabPractice /></RequireOnboarding>} />
          <Route path="/achievements" element={<RequireOnboarding><Achievements /></RequireOnboarding>} />
          <Route path="/practice/wazn" element={<RequireOnboarding><WaznPractice /></RequireOnboarding>} />
          <Route path="/practice/morph" element={<RequireOnboarding><MorphPractice /></RequireOnboarding>} />
          <Route path="/daily" element={<RequireOnboarding><DailyChallenge /></RequireOnboarding>} />
          <Route path="/grammar" element={<RequireOnboarding><GrammarReference /></RequireOnboarding>} />
          <Route path="/practice/typing" element={<RequireOnboarding><TypingPractice /></RequireOnboarding>} />
          <Route path="/practice/sentences" element={<RequireOnboarding><SentenceBuilding /></RequireOnboarding>} />
          <Route path="/settings" element={<RequireOnboarding><Settings /></RequireOnboarding>} />
          <Route path="/onboarding" element={<OnboardingGuard><OnboardingPage /></OnboardingGuard>} />
        </Routes>
        </Suspense>
        <PWAUpdatePrompt />
        </AchievementProvider>
      </UserSettingsProvider>
    </BrowserRouter>
  );
}

export default App;
