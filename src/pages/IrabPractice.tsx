import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IrabExercise } from '../components/exercise/IrabExercise';
import { fisherYatesShuffle } from '../lib/interleave';
import { useAchievementContext } from '../contexts/AchievementContext';
import type { IrabExercise as IrabExerciseType, IrabDifficulty, GrammaticalFunction } from '../types/irab';

// Import I'rab exercises data
import irabExercisesData from '../content/nahw/irab-exercises.json';

interface SessionResult {
  exerciseId: string;
  isCorrect: boolean;
  responseTimeMs?: number;
  wordResults?: Array<{
    wordId: string;
    isCorrect: boolean;
    userFunction?: GrammaticalFunction;
    correctFunction: GrammaticalFunction;
  }>;
}

type SessionState = 'setup' | 'practicing' | 'complete';

interface ConceptInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
}

/**
 * Concept Card component for selection
 */
function ConceptCard({
  concept,
  exerciseCount,
  selected,
  onClick,
}: {
  concept: ConceptInfo;
  exerciseCount: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border-2 text-right transition-all
        ${selected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40'
          : 'border-[var(--color-sand-200)] hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
        }
      `}
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm
          ${selected
            ? 'border-indigo-500 bg-indigo-600 text-white'
            : 'border-[var(--color-sand-300)]'
          }
        `}>
          {selected && '✓'}
        </span>
        <span className={`arabic-lg font-semibold ${selected ? 'text-indigo-900 dark:text-indigo-100' : 'text-[var(--color-ink)]'}`}>
          {concept.nameAr}
        </span>
      </div>
      <p className={`text-sm mb-1 ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-[var(--color-ink-muted)]'}`}>{concept.nameEn}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">{exerciseCount} exercises</p>
    </button>
  );
}

/**
 * Session summary component
 */
function SessionSummary({
  results,
  onRestart,
  onBackToSetup,
}: {
  results: SessionResult[];
  onRestart: () => void;
  onBackToSetup: () => void;
}) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const avgResponseTime = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / results.length / 1000)
    : 0;

  const isPerfect = percentage === 100;
  const isGood = percentage >= 70;

  const { recordPractice } = useAchievementContext();

  // Record I'rab practice session for streak/achievements
  useEffect(() => {
    // Update irab sessions count
    try {
      const stored = localStorage.getItem('madina_session_stats');
      const stats = stored ? JSON.parse(stored) : {};
      stats.irabSessions = (stats.irabSessions || 0) + 1;
      localStorage.setItem('madina_session_stats', JSON.stringify(stats));
    } catch {
      // Ignore
    }

    recordPractice({
      exerciseCount: totalCount,
      correctCount,
      isPerfect,
    });
  }, []); // Only run once on mount

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero section */}
      <div className="text-center py-8">
        <div className={`
          w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
          ${isPerfect ? 'bg-amber-100 dark:bg-amber-900/50' : ''}
          ${isGood && !isPerfect ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''}
          ${!isGood ? 'bg-[var(--color-sand-200)]' : ''}
        `}>
          {isPerfect ? (
            <span className="text-5xl">🌟</span>
          ) : isGood ? (
            <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )}
        </div>

        <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)] mb-2">
          {isPerfect ? 'Perfect!' : isGood ? 'Well Done!' : 'Keep Practicing!'}
        </h1>

        <p className="text-[var(--color-ink-muted)]">
          {isPerfect
            ? 'You mastered all the exercises!'
            : isGood
            ? 'Great progress on your I\'rab skills!'
            : 'Review the concepts and try again.'}
        </p>
      </div>

      {/* Stats card */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-display font-bold text-[var(--color-primary)]">
            {percentage}%
          </div>
          <p className="text-sm text-[var(--color-ink-muted)] mt-2">
            {correctCount} of {totalCount} correct
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-center">
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{correctCount}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Correct</p>
          </div>
          <div className="p-4 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-center">
            <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">{totalCount - correctCount}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400">To Review</p>
          </div>
        </div>

        {avgResponseTime > 0 && (
          <p className="text-sm text-center text-[var(--color-ink-muted)] mb-6">
            Average response time: {avgResponseTime}s
          </p>
        )}

        <div className="flex gap-3">
          <Button onClick={onRestart} fullWidth>
            Practice Again
          </Button>
          <Button onClick={onBackToSetup} variant="secondary" fullWidth>
            Choose Topics
          </Button>
        </div>
      </Card>

      {/* Learning tip */}
      <Card className="p-4 bg-[var(--color-sand-100)]">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)] mb-1">Learning Tip</p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              I'rab is the foundation of Arabic grammar. Practice identifying cases daily to build strong intuition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function IrabPractice() {
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [difficulty, setDifficulty] = useState<IrabDifficulty>('beginner');
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [exercises, setExercises] = useState<IrabExerciseType[]>([]);

  // Get exercises from data
  const allExercises = useMemo(() =>
    irabExercisesData.exercises as IrabExerciseType[],
    []
  );

  // Get concepts from data
  const concepts = useMemo(() =>
    irabExercisesData.concepts as ConceptInfo[],
    []
  );

  // Filter exercises by difficulty
  const filteredByDifficulty = useMemo(() =>
    allExercises.filter(e => e.difficulty === difficulty),
    [allExercises, difficulty]
  );

  // Count exercises per concept
  const exerciseCountByConcept = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByDifficulty.forEach(e => {
      if (e.concept) {
        counts[e.concept] = (counts[e.concept] || 0) + 1;
      }
    });
    return counts;
  }, [filteredByDifficulty]);

  // Start a practice session
  const startSession = useCallback((conceptIds: string[]) => {
    let selectedExercises: IrabExerciseType[];

    if (conceptIds.length === 0) {
      // If no concepts selected, use all exercises for the difficulty
      selectedExercises = [...filteredByDifficulty];
    } else {
      // Filter by selected concepts
      selectedExercises = filteredByDifficulty.filter(
        e => e.concept && conceptIds.includes(e.concept)
      );
    }

    // Shuffle and limit to 10 exercises
    setExercises(fisherYatesShuffle(selectedExercises).slice(0, 10));
    setCurrentIndex(0);
    setResults([]);
    setShowContinueButton(false);
    setSessionState('practicing');
  }, [filteredByDifficulty]);

  const handleConceptToggle = useCallback((conceptId: string) => {
    setSelectedConcepts(prev => {
      if (prev.includes(conceptId)) {
        return prev.filter(c => c !== conceptId);
      }
      return [...prev, conceptId];
    });
  }, []);

  const handleStartPractice = useCallback(() => {
    startSession(selectedConcepts);
  }, [selectedConcepts, startSession]);

  const handleQuickStart = useCallback(() => {
    // Start with all exercises for current difficulty
    startSession([]);
  }, [startSession]);

  const handleExerciseComplete = useCallback((
    isCorrect: boolean,
    _userAnswer: string,
    metadata?: {
      responseTimeMs?: number;
      wordResults?: Array<{
        wordId: string;
        isCorrect: boolean;
        userFunction?: GrammaticalFunction;
        correctFunction: GrammaticalFunction;
      }>;
    }
  ) => {
    const result: SessionResult = {
      exerciseId: exercises[currentIndex]?.id || '',
      isCorrect,
      responseTimeMs: metadata?.responseTimeMs,
      wordResults: metadata?.wordResults,
    };

    setResults(prev => [...prev, result]);
    setShowContinueButton(true);
  }, [currentIndex, exercises]);

  const handleContinue = useCallback(() => {
    setShowContinueButton(false);
    if (currentIndex + 1 >= exercises.length) {
      setSessionState('complete');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, exercises.length]);

  const handleRestart = useCallback(() => {
    // Re-shuffle the same exercises
    setExercises(prev => fisherYatesShuffle([...prev]));
    setCurrentIndex(0);
    setResults([]);
    setShowContinueButton(false);
    setSessionState('practicing');
  }, []);

  const handleBackToSetup = useCallback(() => {
    setSelectedConcepts([]);
    setShowContinueButton(false);
    setSessionState('setup');
  }, []);

  const currentExercise = exercises[currentIndex];

  return (
    <>
      <Header showBackButton title="I'rab Practice" titleArabic="تَدْرِيب الإِعْرَاب" />
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Practice', to: '/practice' },
            { label: "I'rab Practice", labelArabic: 'الإعراب' }
          ]}
          className="mb-4"
        />

        {/* Setup State */}
        {sessionState === 'setup' && (
          <div className="space-y-6">
            {/* Hero section */}
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-700 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--color-ink)]">
                Master Arabic Case Endings
              </h2>
              <p className="arabic-lg text-[var(--color-ink-muted)] mt-2" dir="rtl">
                تعلّم الإعراب
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2 max-w-sm mx-auto">
                Practice identifying grammatical cases (marfu', mansub, majrur) and their functions in sentences.
              </p>
            </div>

            {/* Quick start */}
            <Card className="p-4">
              <Button onClick={handleQuickStart} fullWidth size="lg">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Start
                </span>
              </Button>
              <p className="text-xs text-center text-[var(--color-ink-muted)] mt-2">
                Practice with all exercises for your level
              </p>
            </Card>

            {/* Difficulty selector */}
            <div>
              <p className="text-sm font-medium text-[var(--color-ink-muted)] mb-3 text-center">
                Select Difficulty
              </p>
              <div className="flex gap-2 justify-center">
                {(['beginner', 'intermediate', 'advanced'] as IrabDifficulty[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${difficulty === level
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink-muted)] hover:bg-[var(--color-sand-200)]'
                      }
                    `}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-[var(--color-ink-muted)] mt-2">
                {filteredByDifficulty.length} exercises available
              </p>
            </div>

            {/* Concept selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Or choose specific topics:
                </p>
                {selectedConcepts.length > 0 && (
                  <button
                    onClick={() => setSelectedConcepts([])}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid gap-3">
                {concepts
                  .filter(concept => (exerciseCountByConcept[concept.id] || 0) > 0)
                  .map(concept => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    exerciseCount={exerciseCountByConcept[concept.id] || 0}
                    selected={selectedConcepts.includes(concept.id)}
                    onClick={() => handleConceptToggle(concept.id)}
                  />
                ))}
              </div>
            </div>

            {/* Start button for selected concepts */}
            {selectedConcepts.length > 0 && (
              <Card className="p-4 sticky bottom-20 bg-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {selectedConcepts.length} topic{selectedConcepts.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {filteredByDifficulty.filter(e => e.concept && selectedConcepts.includes(e.concept)).length} exercises
                  </p>
                </div>
                <Button onClick={handleStartPractice} fullWidth size="lg">
                  Start Practice
                </Button>
              </Card>
            )}

            {/* Info card */}
            <Card className="p-4 bg-[var(--color-sand-100)]">
              <h3 className="text-sm font-medium text-[var(--color-ink)] mb-2">What is I'rab?</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">
                I'rab (الإعراب) is the Arabic system of case endings that shows a word's grammatical function.
                The three main cases are:
              </p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="arabic font-semibold text-[var(--color-primary)]">مرفوع</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Nominative</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">ـُ / ضمة</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="arabic font-semibold text-[var(--color-gold)]">منصوب</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Accusative</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">ـَ / فتحة</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="arabic font-semibold text-[var(--color-success)]">مجرور</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Genitive</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">ـِ / كسرة</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Practicing State */}
        {sessionState === 'practicing' && currentExercise && (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm text-[var(--color-ink-muted)]">
              <span>
                Exercise {currentIndex + 1} of {exercises.length}
              </span>
              <span className="text-[var(--color-success)]">
                {results.filter(r => r.isCorrect).length} correct
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
              />
            </div>

            {/* Exercise */}
            <IrabExercise
              key={currentExercise.id}
              exercise={currentExercise}
              onComplete={handleExerciseComplete}
              showFeedback={true}
            />

            {/* Continue button - shown after answering */}
            {showContinueButton && (
              <Button onClick={handleContinue} fullWidth size="lg">
                {currentIndex + 1 >= exercises.length ? 'See Results' : 'Continue'}
              </Button>
            )}
          </div>
        )}

        {/* Complete State */}
        {sessionState === 'complete' && (
          <SessionSummary
            results={results}
            onRestart={handleRestart}
            onBackToSetup={handleBackToSetup}
          />
        )}

        {/* Navigation links */}
        <div className="mt-8 text-center space-y-2">
          <Link
            to="/practice"
            className="block text-sm text-[var(--color-primary)] hover:underline"
          >
            Go to regular practice
          </Link>
          <Link
            to="/roots"
            className="block text-sm text-[var(--color-ink-muted)] hover:underline"
          >
            Practice root families
          </Link>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default IrabPractice;
