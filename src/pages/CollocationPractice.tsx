import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { CollocationExercise } from '../components/exercise/CollocationExercise';
import { ProgressDots } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { 
  loadCollocations, 
  getCollocationsForLesson, 
  getCollocations,
} from '../lib/collocationService';
import { 
  generateCollocationExercises,
  getCollocationTypeDescription,
  updateCollocationMastery,
  DEFAULT_COLLOCATION_MASTERY,
} from '../lib/collocationUtils';
import { fisherYatesShuffle } from '../lib/interleave';
import { useAchievementContext } from '../contexts/AchievementContext';
import type { CollocationExercise as CollocationExerciseType, CollocationMastery } from '../types/collocation';

/**
 * Collocation Practice Page
 * 
 * A dedicated practice mode for learning Arabic collocations (word combinations).
 * Uses the collocation exercise component and tracks mastery of phrases.
 */
export function CollocationPractice() {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const book = lessonId?.startsWith('b2-') ? 'book2' : lessonId?.startsWith('b3-') ? 'book3' : 'book1';
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exercise state
  const [exercises, setExercises] = useState<CollocationExerciseType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Array<{ exerciseId: string; isCorrect: boolean }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  // Mastery tracking (in-memory for now, could be persisted to localStorage)
  const [, setMasteryMap] = useState<Map<string, CollocationMastery>>(new Map());

  // Achievement context
  const { recordPractice } = useAchievementContext();

  // Record practice when session completes
  useEffect(() => {
    if (isComplete && results.length > 0) {
      const correctCount = results.filter(r => r.isCorrect).length;
      const isPerfect = correctCount === results.length;
      recordPractice({
        exerciseCount: results.length,
        correctCount,
        isPerfect,
      });
    }
  }, [isComplete, results, recordPractice]);
  
  // Load collocations on mount
  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        await loadCollocations(book);
        
        // Get collocations for the lesson or all
        const collocations = lessonId 
          ? getCollocationsForLesson(book, lessonId)
          : getCollocations(book);
        
        if (collocations.length === 0) {
          setError('No collocations found for this lesson');
          return;
        }
        
        // Generate exercises for each collocation
        // Get distractor words from other collocations for MCQ
        const allWords = collocations.flatMap(c => c.arabic.split(/\s+/).slice(1));
        const uniqueWords = [...new Set(allWords)];
        
        const allExercises: CollocationExerciseType[] = [];
        for (const collocation of collocations.slice(0, 5)) { // Limit to 5 collocations per session
          const distractors = fisherYatesShuffle(
            uniqueWords.filter(w => !collocation.arabic.includes(w))
          ).slice(0, 3);
          
          const exercisesForCollocation = generateCollocationExercises(collocation, distractors);
          allExercises.push(...exercisesForCollocation);
        }
        
        // Shuffle all exercises
        const shuffled = fisherYatesShuffle(allExercises);
        setExercises(shuffled);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collocations');
        setIsLoading(false);
      }
    }
    
    load();
  }, [book, lessonId]);
  
  // Derived state
  const currentExercise = exercises[currentIndex] ?? null;
  const correctCount = results.filter(r => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  
  // Handle answer completion
  const handleComplete = useCallback((isCorrect: boolean) => {
    if (!currentExercise) return;
    
    // Record result
    setResults(prev => [...prev, { exerciseId: currentExercise.id, isCorrect }]);
    
    // Update mastery for the collocation
    const collocationId = currentExercise.collocationId;
    const isProduction = currentExercise.type !== 'choose_collocation';
    
    setMasteryMap(prev => {
      const current = prev.get(collocationId) ?? { ...DEFAULT_COLLOCATION_MASTERY, collocationId };
      const updated = updateCollocationMastery(current, isCorrect, isProduction);
      const newMap = new Map(prev);
      newMap.set(collocationId, updated);
      return newMap;
    });
    
    // Auto-advance after a delay
    setTimeout(() => {
      if (currentIndex + 1 >= exercises.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  }, [currentExercise, currentIndex, exercises.length]);
  
  // Restart practice
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setResults([]);
    setIsComplete(false);
    // Re-shuffle exercises
    setExercises(prev => fisherYatesShuffle([...prev]));
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
            <p className="text-[var(--color-ink-muted)]">Loading collocations...</p>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }
  
  // Error state
  if (error || exercises.length === 0) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <p className="text-[var(--color-ink-muted)]">
              {error || 'No collocation exercises available for this lesson yet.'}
            </p>
            <Link to="/lessons">
              <Button variant="secondary">Back to Lessons</Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }
  
  // Complete state
  if (isComplete) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--color-success-light)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="font-display text-2xl text-[var(--color-ink)]">
              Practice Complete!
            </h2>
            
            <div className="space-y-2">
              <p className="text-4xl font-display text-[var(--color-primary)]">{accuracy}%</p>
              <p className="text-[var(--color-ink-muted)]">
                {correctCount} of {results.length} correct
              </p>
            </div>
            
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={handleRestart}>
                Practice Again
              </Button>
              <Link to="/lessons">
                <Button>Back to Lessons</Button>
              </Link>
            </div>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }
  
  // Get the collocation for the current exercise (for pattern hint)
  const currentCollocation = exercises[currentIndex] 
    ? getCollocations(book).find(c => c.id === exercises[currentIndex].collocationId)
    : null;
  
  return (
    <>
      <Header />
      <PageContainer>
        <div className="max-w-lg mx-auto space-y-6">
          {/* Progress header */}
          <div className="flex items-center justify-between">
            <Link 
              to={lessonId ? `/lesson/${lessonId}` : '/lessons'} 
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
            
            <ProgressDots total={exercises.length} current={currentIndex} />
            
            <span className="text-sm text-[var(--color-ink-muted)]">
              {currentIndex + 1}/{exercises.length}
            </span>
          </div>
          
          {/* Section title */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-[var(--color-primary)] text-sm font-medium rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Collocation Practice
            </span>
          </div>
          
          {/* Exercise */}
          {currentExercise && (
            <CollocationExercise
              key={currentExercise.id}
              exercise={currentExercise}
              onComplete={handleComplete}
              showPatternHint={true}
              collocationTypeLabel={
                currentCollocation 
                  ? getCollocationTypeDescription(currentCollocation.type)
                  : undefined
              }
            />
          )}
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default CollocationPractice;
