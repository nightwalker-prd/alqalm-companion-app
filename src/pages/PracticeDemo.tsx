import { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { FillBlankExercise } from '../components/exercise/FillBlankExercise';
import { TranslateExercise } from '../components/exercise/TranslateExercise';
import { WordMeaningExercise } from '../components/exercise/WordMeaningExercise';
import { ProgressDots } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import type { Exercise, FillBlankExercise as FillBlankType, TranslateExercise as TranslateType, WordToMeaningExercise, MeaningToWordExercise } from '../types/exercise';

// Demo exercises from Lesson 1
const demoExercises: Exercise[] = [
  {
    id: 'demo-1',
    type: 'fill-blank',
    prompt: '_____ كِتَابٌ',
    promptEn: '_____ is a book',
    answer: 'هَذَا',
    itemIds: ['word-001', 'word-002'],
  } as FillBlankType,
  {
    id: 'demo-2',
    type: 'translate-to-arabic',
    prompt: 'This is a pen',
    answer: 'هَذَا قَلَمٌ',
    itemIds: ['word-001', 'word-003'],
  } as TranslateType,
  {
    id: 'demo-3',
    type: 'word-to-meaning',
    prompt: 'مَسْجِدٌ',
    answer: 'mosque',
    itemIds: ['word-007'],
  } as WordToMeaningExercise,
  {
    id: 'demo-4',
    type: 'meaning-to-word',
    prompt: 'house',
    answer: 'بَيْتٌ',
    itemIds: ['word-006'],
  } as MeaningToWordExercise,
  {
    id: 'demo-5',
    type: 'fill-blank',
    prompt: '_____ بَابٌ',
    promptEn: '_____ is a door',
    answer: 'هَذَا',
    itemIds: ['word-001', 'word-005'],
  } as FillBlankType,
];

export function PracticeDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ isCorrect: boolean; userAnswer: string }[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentExercise = demoExercises[currentIndex];

  const handleComplete = useCallback((isCorrect: boolean, userAnswer: string) => {
    setResults((prev) => [...prev, { isCorrect, userAnswer }]);

    // Auto-advance after a delay
    setTimeout(() => {
      if (currentIndex < demoExercises.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, 1500);
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setResults([]);
    setIsComplete(false);
  };

  const correctCount = results.filter((r) => r.isCorrect).length;

  if (isComplete) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="text-center py-12 animate-fade-in">
            {/* Completion celebration */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)] mb-2">
              Practice Complete!
            </h1>

            <p className="text-[var(--color-ink-muted)] mb-8">
              You got {correctCount} out of {demoExercises.length} correct
            </p>

            {/* Results breakdown */}
            <div className="inline-flex items-center gap-4 px-6 py-4 bg-[var(--color-sand-100)] rounded-[var(--radius-lg)] mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-success)]">{correctCount}</div>
                <div className="text-xs text-[var(--color-ink-muted)]">Correct</div>
              </div>
              <div className="w-px h-10 bg-[var(--color-sand-300)]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-error)]">{demoExercises.length - correctCount}</div>
                <div className="text-xs text-[var(--color-ink-muted)]">To Review</div>
              </div>
              <div className="w-px h-10 bg-[var(--color-sand-300)]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">
                  {Math.round((correctCount / demoExercises.length) * 100)}%
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Score</div>
              </div>
            </div>

            <Button onClick={handleRestart} size="lg">
              Practice Again
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header title="Practice" titleArabic="تمرين" />
      <PageContainer>
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-ink-muted)]">
              Exercise {currentIndex + 1} of {demoExercises.length}
            </span>
            <span className="text-sm font-medium text-[var(--color-primary)]">
              {correctCount} correct
            </span>
          </div>
          <ProgressDots current={currentIndex} total={demoExercises.length} />
        </div>

        {/* Current exercise */}
        <div key={currentExercise.id} className="animate-slide-up">
          {currentExercise.type === 'fill-blank' && (
            <FillBlankExercise
              exercise={currentExercise as FillBlankType}
              onComplete={handleComplete}
            />
          )}
          {currentExercise.type === 'translate-to-arabic' && (
            <TranslateExercise
              exercise={currentExercise as TranslateType}
              onComplete={handleComplete}
            />
          )}
          {(currentExercise.type === 'word-to-meaning' || currentExercise.type === 'meaning-to-word') && (
            <WordMeaningExercise
              exercise={currentExercise as WordToMeaningExercise | MeaningToWordExercise}
              onComplete={handleComplete}
            />
          )}
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default PracticeDemo;
