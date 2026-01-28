import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RootFamilyExercise } from '../components/exercise/RootFamilyExercise';
import { generateRootFamilyComponentExercises } from '../lib/sarfUtils';
import { fisherYatesShuffle } from '../lib/interleave';
import { useAchievementContext } from '../contexts/AchievementContext';
import { useRootFamilies } from '../hooks/useRootFamilies';
import type { RootFamily, Difficulty } from '../types/morphology';
import type { RootFamilyExerciseData } from '../components/exercise/RootFamilyExercise';
import type { ConfidenceLevel } from '../types/progress';

interface SessionResult {
  exerciseId: string;
  isCorrect: boolean;
  confidence?: ConfidenceLevel;
  responseTimeMs?: number;
}

type SessionState = 'setup' | 'practicing' | 'complete';

/**
 * Root display component
 */
function RootCard({ family, onClick }: { family: RootFamily; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-white rounded-lg border border-[var(--color-sand-200)] hover:border-[var(--color-primary)] hover:shadow-md transition-all text-left w-full h-full flex flex-col"
    >
      <div className="flex items-center justify-center gap-2 font-arabic text-2xl mb-2" dir="rtl">
        {family.rootLetters.map((letter, idx) => (
          <span key={idx} className="text-[var(--color-primary)]">{letter}</span>
        ))}
      </div>
      <p className="text-sm text-center text-[var(--color-ink)] line-clamp-2 flex-1">
        {family.coreMeaning}
      </p>
      <p className="text-xs text-center text-[var(--color-ink-muted)] mt-2">
        {family.words.length} words
      </p>
    </button>
  );
}

/**
 * Session summary component
 */
function SessionSummary({ 
  results, 
  onRestart, 
  onBackToSetup 
}: { 
  results: SessionResult[];
  onRestart: () => void;
  onBackToSetup: () => void;
}) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isPerfect = percentage === 100;
  
  const avgResponseTime = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / results.length / 1000)
    : 0;

  const { recordPractice } = useAchievementContext();

  // Record roots practice session for streak/achievements
  useEffect(() => {
    recordPractice({
      exerciseCount: totalCount,
      correctCount,
      isPerfect,
    });
  }, []); // Only run once on mount

  return (
    <Card className="p-6 text-center">
      <div className="mb-6">
        <div className="text-6xl font-display font-bold text-[var(--color-primary)]">
          {percentage}%
        </div>
        <p className="text-lg text-[var(--color-ink-muted)] mt-2">
          {correctCount} of {totalCount} correct
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-[var(--color-sand-100)] rounded-lg">
          <p className="text-2xl font-bold text-[var(--color-success)]">{correctCount}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Correct</p>
        </div>
        <div className="p-3 bg-[var(--color-sand-100)] rounded-lg">
          <p className="text-2xl font-bold text-[var(--color-error)]">{totalCount - correctCount}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Incorrect</p>
        </div>
      </div>

      {avgResponseTime > 0 && (
        <p className="text-sm text-[var(--color-ink-muted)] mb-6">
          Average response time: {avgResponseTime}s
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={onRestart} fullWidth>
          Practice Again
        </Button>
        <Button onClick={onBackToSetup} variant="secondary" fullWidth>
          Choose Roots
        </Button>
      </div>
    </Card>
  );
}

export function RootsPractice() {
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [selectedFamilies, setSelectedFamilies] = useState<RootFamily[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [exercises, setExercises] = useState<RootFamilyExerciseData[]>([]);

  // Load root families asynchronously
  const { isLoaded, isLoading, error, getAllFamilies } = useRootFamilies();

  // Filter families by difficulty
  const allFamilies = useMemo(() => {
    if (!isLoaded) return [];
    return getAllFamilies().filter(
      f => f.minDifficulty === difficulty || difficulty === 'intermediate'
    );
  }, [isLoaded, getAllFamilies, difficulty]);

  // Generate exercises when starting practice (called from handlers, not effect)
  const startSession = useCallback((families: RootFamily[]) => {
    const allExercises: RootFamilyExerciseData[] = [];

    for (const family of families) {
      const familyExercises = generateRootFamilyComponentExercises(
        family,
        allFamilies,
        { difficulty, maxExercises: 3 }
      );
      allExercises.push(...familyExercises);
    }

    setExercises(fisherYatesShuffle(allExercises));
    setCurrentIndex(0);
    setResults([]);
    setSessionState('practicing');
  }, [allFamilies, difficulty]);

  const handleFamilySelect = useCallback((family: RootFamily) => {
    setSelectedFamilies(prev => {
      const isSelected = prev.some(f => f.root === family.root);
      if (isSelected) {
        return prev.filter(f => f.root !== family.root);
      }
      return [...prev, family];
    });
  }, []);

  const handleStartPractice = useCallback(() => {
    if (selectedFamilies.length === 0) return;
    startSession(selectedFamilies);
  }, [selectedFamilies, startSession]);

  const handleQuickStart = useCallback(() => {
    // Select 3 random families
    const shuffled = fisherYatesShuffle([...allFamilies]);
    const quickFamilies = shuffled.slice(0, 3);
    setSelectedFamilies(quickFamilies);
    startSession(quickFamilies);
  }, [allFamilies, startSession]);

  const handleExerciseComplete = useCallback((
    isCorrect: boolean,
    _userAnswer: string,
    metadata?: { confidence?: ConfidenceLevel; responseTimeMs?: number }
  ) => {
    const result: SessionResult = {
      exerciseId: exercises[currentIndex]?.id || '',
      isCorrect,
      confidence: metadata?.confidence,
      responseTimeMs: metadata?.responseTimeMs,
    };

    setResults(prev => [...prev, result]);

    // Show continue button to let user advance when ready
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
    setCurrentIndex(0);
    setResults([]);
    setShowContinueButton(false);
    setSessionState('practicing');
  }, []);

  const handleBackToSetup = useCallback(() => {
    setSelectedFamilies([]);
    setShowContinueButton(false);
    setSessionState('setup');
  }, []);

  const currentExercise = exercises[currentIndex];

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header showBackButton title="Root Practice" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
            <p className="text-[var(--color-ink-muted)]">Loading root families...</p>
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
        <Header showBackButton title="Root Practice" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <p className="text-[var(--color-error)]">Failed to load root families</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{error.message}</p>
            <Link to="/practice">
              <Button variant="secondary">Back to Practice</Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header showBackButton title="Root Practice" />
      <PageContainer>
        {/* Setup State */}
        {sessionState === 'setup' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-display font-semibold text-[var(--color-ink)]">
                Learn Arabic Root Families
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2">
                Arabic words are built from 3-letter roots. Learn how one root creates many related words.
              </p>
            </div>

            {/* Quick start */}
            <Card className="p-4">
              <Button onClick={handleQuickStart} fullWidth size="lg">
                Quick Start (3 Random Roots)
              </Button>
            </Card>

            {/* Difficulty selector */}
            <div className="flex gap-2 justify-center">
              {(['beginner', 'intermediate'] as Difficulty[]).map(level => (
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

            {/* Selected families summary */}
            {selectedFamilies.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {selectedFamilies.length} root{selectedFamilies.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button onClick={handleStartPractice} size="sm">
                    Start Practice
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFamilies.map(f => (
                    <span
                      key={f.root}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-[var(--color-primary)] rounded-full text-sm font-arabic"
                    >
                      {f.rootLetters.join(' ')}
                      <button
                        onClick={() => handleFamilySelect(f)}
                        className="ml-1 hover:text-[var(--color-error)]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Root family grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-fr">
              {allFamilies.slice(0, 18).map(family => (
                <div
                  key={family.root}
                  className={`
                    relative h-full
                    ${selectedFamilies.some(f => f.root === family.root) 
                      ? 'ring-2 ring-[var(--color-primary)] rounded-lg' 
                      : ''
                    }
                  `}
                >
                  <RootCard family={family} onClick={() => handleFamilySelect(family)} />
                  {selectedFamilies.some(f => f.root === family.root) && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-sm">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View all link */}
            {allFamilies.length > 18 && (
              <p className="text-center text-sm text-[var(--color-ink-muted)]">
                Showing 18 of {allFamilies.length} root families
              </p>
            )}
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
              <span>
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
            <RootFamilyExercise
              exercise={currentExercise}
              onComplete={handleExerciseComplete}
              showFeedback={true}
              enableConfidence={false}
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

        {/* Link back */}
        <div className="mt-8 text-center space-y-2">
          <Link
            to="/roots/explore"
            className="block text-sm text-[var(--color-primary)] hover:underline"
          >
            Browse all root families
          </Link>
          <Link
            to="/practice"
            className="block text-sm text-[var(--color-ink-muted)] hover:underline"
          >
            Go to regular practice
          </Link>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default RootsPractice;
