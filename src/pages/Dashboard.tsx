import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { ActivitySection } from '../components/dashboard/ActivitySection';
import { ActivityCard } from '../components/dashboard/ActivityCard';
import { SearchBar } from '../components/dashboard/SearchBar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { KnowledgeMap } from '../components/map/KnowledgeMap';
import { StreakDisplay } from '../components/achievements';
import { FeatureTour } from '../components/onboarding/FeatureTour';
import { useProgress } from '../hooks/useProgress';
import { useManifest } from '../hooks/useManifest';
import { getLessonMetaForBook } from '../lib/contentStatsCore';
import { getRandomWord } from '../lib/wordOfTheDay';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { useDueCount } from '../hooks/useDueCount';
import { loadDailyChallengeState, isTodayCompleted } from '../lib/dailyChallengeService';
import { loadStreakData } from '../lib/achievementService';
import type { LessonData } from '../components/map/BookSection';

// Book metadata (static)
const booksMetadata = [
  {
    bookNumber: 1,
    bookTitle: 'Book 1: Fundamentals',
    bookTitleArabic: 'الكِتَاب الأَوَّل',
  },
  {
    bookNumber: 2,
    bookTitle: 'Book 2: Intermediate',
    bookTitleArabic: 'الكِتَاب الثَّانِي',
  },
  {
    bookNumber: 3,
    bookTitle: 'Book 3: Advanced',
    bookTitleArabic: 'الكِتَاب الثَّالِث',
  },
];

export function Dashboard() {
  // Load manifest first - required for content stats
  const {
    isLoaded: manifestLoaded,
    isLoading: manifestLoading,
    error: manifestError,
    load: loadManifest,
  } = useManifest();

  const { getLessonMastery, getLessonPercent } = useProgress();
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const { dueCount } = useDueCount();
  const dailyChallengeState = loadDailyChallengeState();
  const dailyChallengeCompleted = isTodayCompleted();
  
  // Check if streak is at risk
  const streakData = loadStreakData();
  const today = new Date().toISOString().split('T')[0];
  const streakAtRisk = streakData.currentStreak > 0 && 
    streakData.lastPracticeDate !== today && 
    !dailyChallengeCompleted;

  // Get random word of the day (computed once on component mount)
  const [wordOfDay] = useState(() => getRandomWord());

  // Merge lesson metadata from JSON files with dynamic mastery data
  // Only compute when manifest is loaded
  const booksData = useMemo(() => {
    if (!manifestLoaded || settingsLoading) return [];

    return booksMetadata.map(book => {
      const lessonsMeta = getLessonMetaForBook(book.bookNumber);
      return {
        bookNumber: book.bookNumber,
        bookTitle: book.bookTitle,
        bookTitleArabic: book.bookTitleArabic,
        lessons: lessonsMeta.map(lesson => {
          // Extract lesson number from id (e.g., "b1-l05" -> 5)
          const lessonMatch = lesson.id.match(/l(\d+)$/);
          const lessonNum = lessonMatch ? parseInt(lessonMatch[1], 10) : 1;
          const isLocked = settings ? !settings.isLessonUnlocked(book.bookNumber, lessonNum) : false;
          return {
            ...lesson,
            masteryLevel: getLessonMastery(lesson.id),
            masteryPercent: getLessonPercent(lesson.id),
            isLocked,
          };
        }) as LessonData[],
      };
    });
  }, [manifestLoaded, settingsLoading, getLessonMastery, getLessonPercent, settings]);

  // Show loading state while manifest or settings loads
  if ((manifestLoading && !manifestLoaded) || settingsLoading) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading content..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">Loading content...</p>
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
        <Header />
        <PageContainer>
          <ErrorState
            title="Failed to load content"
            message={manifestError.message || "Unable to load content data. Please try again."}
            onRetry={() => loadManifest()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <PageContainer>
        {/* Welcome section with streak */}
        <div className="flex items-start justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)] mb-2">
              Welcome back
            </h1>
            <p className="text-[var(--color-ink-muted)]">
              {settings?.goal === 'quran' && 'Working towards Quranic fluency'}
              {settings?.goal === 'classical-texts' && 'Mastering classical Arabic'}
              {settings?.goal === 'studies-support' && 'Supporting your Arabic studies'}
              {!settings?.goal || settings?.goal === 'general' ? 'Continue your Arabic journey' : ''}
            </p>
          </div>
          <Link to="/achievements" className="hover:scale-105 transition-transform">
            <StreakDisplay size="md" />
          </Link>
        </div>

        {/* Search bar */}
        <SearchBar className="mb-6 animate-fade-in" />

        {/* ═══════════════════════════════════════════════════════════════
            TODAY'S FOCUS - The 3 key actions
        ═══════════════════════════════════════════════════════════════ */}
        
        {/* Streak at risk warning */}
        {streakAtRisk && (
          <div className="mb-4 animate-pulse">
            <Card className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 dark:text-red-200">
                    Your {streakData.currentStreak}-day streak is at risk!
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Complete today's challenge to keep it alive
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* 1. Daily Challenge - Most prominent */}
        <div className="mb-4 animate-slide-up">
          <Link to="/daily">
            <Card className={`p-5 ${dailyChallengeCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700' : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dailyChallengeCompleted ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-amber-100 dark:bg-amber-800'}`}>
                    <span className="text-3xl">{dailyChallengeCompleted ? '✅' : '🎯'}</span>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${dailyChallengeCompleted ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-900 dark:text-amber-100'}`}>
                      {dailyChallengeCompleted ? 'Challenge Complete!' : 'Daily Challenge'}
                    </p>
                    <p className={`text-sm ${dailyChallengeCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}`}>
                      {dailyChallengeCompleted 
                        ? `🔥 ${dailyChallengeState.streak} day streak — see you tomorrow!` 
                        : '10 questions • 5 minutes • Build your streak'}
                    </p>
                  </div>
                </div>
                {!dailyChallengeCompleted && (
                  <div className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold text-sm">
                    Start
                  </div>
                )}
              </div>
            </Card>
          </Link>
        </div>

        {/* 2 & 3. Due Reviews + Continue Lesson - Side by side on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 animate-slide-up">
          {/* Due Reviews */}
          <Link to="/review">
            <Card variant="default" padding="md" className="h-full hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  dueCount === 0 ? 'bg-emerald-100 dark:bg-emerald-900/50' :
                  dueCount >= 20 ? 'bg-red-100 dark:bg-red-900/50' :
                  dueCount >= 10 ? 'bg-amber-100 dark:bg-amber-900/50' :
                  'bg-blue-100 dark:bg-blue-900/50'
                }`}>
                  <span className="text-2xl">{dueCount === 0 ? '✨' : '📚'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {dueCount === 0 ? 'All caught up!' : `${dueCount} due`}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)] truncate">
                    {dueCount === 0 ? 'No reviews pending' : 'Words to review'}
                  </p>
                </div>
                {dueCount > 0 && (
                  <div className={`text-xl font-bold ${
                    dueCount >= 20 ? 'text-red-600' : dueCount >= 10 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    →
                  </div>
                )}
              </div>
            </Card>
          </Link>

          {/* Continue Lesson */}
          {settings && (() => {
            const currentPosition = settings.getNextUnlockedLesson();
            const lessonId = `b${currentPosition.book}-l${String(currentPosition.lesson).padStart(2, '0')}`;
            return (
              <Link to={`/lesson/${lessonId}`}>
                <Card variant="default" padding="md" className="h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center">
                      <span className="text-2xl">📖</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-ink)]">Continue</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        Book {currentPosition.book}, Lesson {currentPosition.lesson}
                      </p>
                    </div>
                    <div className="text-[var(--color-primary)] text-xl font-bold">→</div>
                  </div>
                </Card>
              </Link>
            );
          })()}
        </div>

        {/* Quick Start Practice */}
        <div className="mb-6 animate-slide-up">
          <Link to="/practice">
            <Card variant="default" padding="md" className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-[var(--color-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-ink)]">Mixed Practice</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">5 exercises from your current lessons</p>
                </div>
                <div className="text-[var(--color-primary)] text-xl font-bold">→</div>
              </div>
            </Card>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MORE ACTIVITIES - Collapsed by default
        ═══════════════════════════════════════════════════════════════ */}

        {/* ⚡ Quick Practice Section */}
        <ActivitySection id="quick-practice" title="Quick Practice" icon="⚡" defaultExpanded={false}>
          <ActivityCard
            to="/practice/fluency"
            title="Speed Round"
            description="60-second fluency challenge with mastered words"
            iconBg="bg-rose-100 dark:bg-rose-900/50"
            icon={<svg className="w-5 h-5 text-rose-700 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <ActivityCard
            to="/practice/flashcards"
            title="Word Cards"
            description="Nation-style flashcards for deliberate vocabulary learning"
            iconBg="bg-indigo-100 dark:bg-indigo-900/50"
            icon={<svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
          <ActivityCard
            to="/practice/recall"
            title="Free Recall"
            description="Test your memory - list words without hints"
            iconBg="bg-emerald-100 dark:bg-emerald-900/50"
            icon={<svg className="w-5 h-5 text-emerald-700 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          />
        </ActivitySection>

        {/* 📚 Deep Work Section */}
        <ActivitySection id="deep-work" title="Deep Work" icon="📚" defaultExpanded={false}>
          <ActivityCard
            to="/practice/irab"
            title="I'rab Practice"
            description="Master Arabic case endings and grammar"
            iconBg="bg-indigo-100 dark:bg-indigo-900/50"
            icon={<span className="font-arabic text-indigo-700 dark:text-indigo-300 text-[10px] whitespace-nowrap">إعراب</span>}
          />
          <ActivityCard
            to="/practice/wazn"
            title="Wazn Trainer"
            description="Recognize verb patterns (Forms I-X)"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            icon={<span className="font-arabic text-amber-700 dark:text-amber-300 text-sm">وزن</span>}
          />
          <ActivityCard
            to="/practice/morph"
            title="Pattern Recognition"
            description="اسم فاعل، مصدر، صفة مشبهة..."
            iconBg="bg-teal-100 dark:bg-teal-900/50"
            icon={<span className="text-teal-700 dark:text-teal-300 text-lg">🔍</span>}
          />
          <ActivityCard
            to="/roots"
            title="Root Families"
            description="Practice Arabic roots and word families"
            iconBg="bg-indigo-100 dark:bg-indigo-900/50"
            icon={<span className="font-arabic text-indigo-700 dark:text-indigo-300 text-[10px] whitespace-nowrap">ك-ت-ب</span>}
          />
          <ActivityCard
            to="/roots/explore"
            title="Explore Roots"
            description="Browse 50 root families and their words"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            icon={<svg className="w-5 h-5 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
          <ActivityCard
            to="/practice/sentences"
            title="Sentence Building"
            description="Arrange words in correct Arabic order"
            iconBg="bg-teal-100 dark:bg-teal-900/50"
            icon={<span className="text-lg">🏗️</span>}
          />
          <ActivityCard
            to="/practice/collocations"
            title="Collocations"
            description="Learn common word combinations"
            iconBg="bg-purple-100 dark:bg-purple-900/50"
            icon={<svg className="w-5 h-5 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
          />
          <ActivityCard
            to="/grammar"
            title="Grammar Reference"
            description="Search 339 grammar rules across all books"
            iconBg="bg-sky-100 dark:bg-sky-900/50"
            icon={<span className="text-lg">📖</span>}
          />
        </ActivitySection>

        {/* 📖 Reading Section */}
        <ActivitySection id="reading" title="Reading" icon="📖" defaultExpanded={false}>
          <ActivityCard
            to="/reading/topics"
            title="Narrow Reading"
            description="Read by topic for repeated vocabulary exposure"
            iconBg="bg-emerald-100 dark:bg-emerald-900/50"
            icon={<svg className="w-5 h-5 text-emerald-700 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <ActivityCard
            to="/reading/speed"
            title="Speed Reading"
            description="Timed reading with WPM tracking and comprehension"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            icon={<svg className="w-5 h-5 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <ActivityCard
            to="/reading"
            title="Reading Library"
            description="Browse all reading passages by level"
            iconBg="bg-blue-100 dark:bg-blue-900/50"
            icon={<svg className="w-5 h-5 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
        </ActivitySection>

        {/* 🎯 Skill Building Section */}
        <ActivitySection id="skill-building" title="Skill Building" icon="🎯" defaultExpanded={false}>
          <ActivityCard
            to="/practice/weaknesses"
            title="Target Weaknesses"
            description="Deliberate practice on your error patterns"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            icon={<svg className="w-5 h-5 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          />
          <ActivityCard
            to="/progress"
            title="View Progress"
            description="Track your learning stats and streaks"
            iconBg="bg-emerald-100 dark:bg-emerald-900/50"
            icon={<svg className="w-5 h-5 text-emerald-700 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <ActivityCard
            to="/achievements"
            title="Achievements"
            description="Track your badges and streaks"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            icon={<span className="text-lg">🏆</span>}
          />
          <ActivityCard
            to="/practice/typing"
            title="Typing Drills"
            description="Practice Arabic keyboard input"
            iconBg="bg-blue-100 dark:bg-blue-900/50"
            icon={<span className="text-lg">⌨️</span>}
          />
          <ActivityCard
            to="/vocabulary"
            title="Vocabulary Browser"
            description="Explore all vocabulary across lessons"
            iconBg="bg-indigo-100 dark:bg-indigo-900/50"
            icon={<svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
          />
        </ActivitySection>

        {/* Knowledge Map - compact view for dashboard */}
        <div className="mb-8 animate-slide-up stagger-2">
          <KnowledgeMap books={booksData} compact />
        </div>

        {/* Arabic of the day */}
        <Card variant="elevated" padding="lg" className="animate-slide-up stagger-3">
          <div className="text-center">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Word of the Day
            </span>
            <div className="my-4">
              <span className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
                {wordOfDay?.arabic ?? 'كِتَابٌ'}
              </span>
            </div>
            <p className="font-display text-lg text-[var(--color-ink-light)]">
              {wordOfDay?.english ?? 'book'}
            </p>
            {(wordOfDay?.root ?? 'ك-ت-ب') && (
              <p className="text-sm text-[var(--color-ink-muted)] mt-2" dir="rtl">
                Root: <span className="arabic-sm">{wordOfDay?.root ?? 'ك-ت-ب'}</span>
              </p>
            )}
          </div>
        </Card>
      </PageContainer>
      <BottomNav />
      
      {/* First-run feature tour */}
      <FeatureTour />
    </>
  );
}

export default Dashboard;
