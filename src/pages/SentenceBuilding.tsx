/**
 * Sentence Building Practice Page
 * 
 * Arrange Arabic words in correct order to form sentences.
 * Tests word order, case endings, and grammar understanding.
 */

import { useState, useCallback, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  SENTENCE_EXERCISES,
  getSentencesByBook,
  shuffleArray,
  type SentenceExercise,
} from '../content/sentences/sentences';
import { useAchievementContext } from '../contexts/AchievementContext';

// Storage keys
const SENTENCE_STATS_KEY = 'madina_sentence_stats';

type SessionState = 'setup' | 'playing' | 'result';

interface SentenceStats {
  totalAttempts: number;
  totalCorrect: number;
  sessionsCompleted: number;
  grammarPointAccuracy: Record<string, { correct: number; total: number }>;
}

interface SessionResult {
  correct: number;
  total: number;
  accuracy: number;
}

function loadStats(): SentenceStats {
  try {
    const stored = localStorage.getItem(SENTENCE_STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }
  return { totalAttempts: 0, totalCorrect: 0, sessionsCompleted: 0, grammarPointAccuracy: {} };
}

function saveStats(stats: SentenceStats): void {
  localStorage.setItem(SENTENCE_STATS_KEY, JSON.stringify(stats));
}

export function SentenceBuilding() {
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [book, setBook] = useState<1 | 2 | 'all'>('all');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 'all'>('all');
  const [questionCount, setQuestionCount] = useState(5);
  
  // Session state
  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  
  // Stats
  const [stats, setStats] = useState<SentenceStats>(loadStats);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  
  const { recordPractice } = useAchievementContext();

  // Get current exercise
  const currentExercise = exercises[currentIndex];

  // Start session
  const handleStart = useCallback(() => {
    let pool = SENTENCE_EXERCISES;
    
    if (book !== 'all') {
      pool = getSentencesByBook(book);
    }
    if (difficulty !== 'all') {
      pool = pool.filter(s => s.difficulty === difficulty);
    }
    
    if (pool.length === 0) {
      pool = SENTENCE_EXERCISES;
    }
    
    const shuffled = shuffleArray(pool).slice(0, questionCount);
    setExercises(shuffled);
    setCurrentIndex(0);
    setSelectedWords([]);
    setResults([]);
    setShowFeedback(false);
    setSessionResult(null);
    setSessionState('playing');
  }, [book, difficulty, questionCount]);

  // Setup available words when exercise changes
  useEffect(() => {
    if (currentExercise) {
      const allWords = [...currentExercise.correctOrder, ...(currentExercise.distractors || [])];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate pattern for resetting state when exercise changes
      setAvailableWords(shuffleArray(allWords));
      setSelectedWords([]);
      setShowFeedback(false);
    }
  }, [currentExercise]);

  // Add word to sentence
  const handleAddWord = useCallback((word: string) => {
    if (showFeedback) return;
    setSelectedWords(prev => [...prev, word]);
    setAvailableWords(prev => {
      const idx = prev.indexOf(word);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, [showFeedback]);

  // Remove word from sentence
  const handleRemoveWord = useCallback((index: number) => {
    if (showFeedback) return;
    const word = selectedWords[index];
    setSelectedWords(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    setAvailableWords(prev => [...prev, word]);
  }, [selectedWords, showFeedback]);

  // Check answer
  const handleCheck = useCallback(() => {
    if (!currentExercise) return;
    
    const correct = selectedWords.length === currentExercise.correctOrder.length &&
      selectedWords.every((w, i) => w === currentExercise.correctOrder[i]);
    
    setIsCorrect(correct);
    setShowFeedback(true);
    setResults(prev => [...prev, correct]);
  }, [selectedWords, currentExercise]);

  // Continue to next
  const handleContinue = useCallback(() => {
    if (currentIndex + 1 >= exercises.length) {
      // Session complete
      const correctCount = results.filter(Boolean).length + (isCorrect ? 1 : 0);
      const totalCount = results.length + 1;
      
      const result: SessionResult = {
        correct: correctCount,
        total: totalCount,
        accuracy: Math.round((correctCount / totalCount) * 100),
      };
      
      setSessionResult(result);
      
      // Update stats
      const newStats: SentenceStats = {
        ...stats,
        totalAttempts: stats.totalAttempts + totalCount,
        totalCorrect: stats.totalCorrect + correctCount,
        sessionsCompleted: stats.sessionsCompleted + 1,
        grammarPointAccuracy: stats.grammarPointAccuracy, // TODO: track per grammar point
      };
      setStats(newStats);
      saveStats(newStats);
      
      // Record for achievements
      recordPractice({
        exerciseCount: totalCount,
        correctCount,
        isPerfect: correctCount === totalCount,
      });
      
      setSessionState('result');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, exercises, results, isCorrect, stats, recordPractice]);

  // Clear selection
  const handleClear = useCallback(() => {
    if (!currentExercise) return;
    const allWords = [...currentExercise.correctOrder, ...(currentExercise.distractors || [])];
    setAvailableWords(shuffleArray(allWords));
    setSelectedWords([]);
  }, [currentExercise]);

  // Setup screen
  if (sessionState === 'setup') {
    return (
      <>
        <Header title="Sentence Building" titleArabic="بِنَاء الجُمَل" />
        <PageContainer>
          <div className="max-w-md mx-auto space-y-6 py-4 animate-fade-in">
            {/* Description */}
            <Card variant="default" padding="md">
              <p className="text-[var(--color-ink-muted)] text-sm">
                Arrange Arabic words in the correct order to form grammatically correct sentences.
                Tests word order, case endings, and grammar understanding.
              </p>
            </Card>

            {/* Book filter */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Book Level
              </label>
              <div className="flex gap-2">
                {(['all', 1, 2] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setBook(b)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      book === b
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {b === 'all' ? 'All' : `Book ${b}`}
                  </button>
                ))}
              </div>
            </Card>

            {/* Difficulty filter */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Difficulty
              </label>
              <div className="flex gap-2">
                {(['all', 1, 2, 3] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {d === 'all' ? 'All' : d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Hard'}
                  </button>
                ))}
              </div>
            </Card>

            {/* Question count */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Sentences per session
              </label>
              <div className="flex gap-2">
                {[5, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      questionCount === n
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Card>

            {/* Stats preview */}
            {stats.sessionsCompleted > 0 && (
              <Card variant="default" padding="md">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-ink)]">{stats.sessionsCompleted}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Sessions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-success)]">
                      {stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0}%
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-primary)]">{stats.totalCorrect}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Correct</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Start button */}
            <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
              Start Practice
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Playing screen
  if (sessionState === 'playing' && currentExercise) {
    const correctCount = results.filter(Boolean).length;

    return (
      <>
        <Header title="Sentence Building" titleArabic="بِنَاء الجُمَل" />
        <PageContainer>
          <div className="max-w-md mx-auto animate-fade-in">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-[var(--color-ink-muted)] mb-2">
                <span>Sentence {currentIndex + 1} of {exercises.length}</span>
                <span className="text-[var(--color-success)]">{correctCount} correct</span>
              </div>
              <ProgressBar value={(currentIndex + 1) / exercises.length * 100} />
            </div>

            {/* English prompt */}
            <Card variant="elevated" padding="lg" className="text-center mb-6">
              <p className="text-sm text-[var(--color-ink-muted)] mb-2">Translate to Arabic:</p>
              <p className="text-xl text-[var(--color-ink)]">{currentExercise.english}</p>
              {currentExercise.grammarPoints.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {currentExercise.grammarPoints.slice(0, 2).map(point => (
                    <span
                      key={point}
                      className="text-xs px-2 py-0.5 bg-[var(--color-sand-100)] text-[var(--color-ink-muted)] rounded-full"
                    >
                      {point.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Selected words (sentence being built) */}
            <div className="mb-4">
              <p className="text-sm text-[var(--color-ink-muted)] mb-2">Your sentence:</p>
              <div
                className={`min-h-[60px] p-3 rounded-xl border-2 flex flex-wrap gap-2 justify-end ${
                  showFeedback
                    ? isCorrect
                      ? 'border-[var(--color-success)] bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-[var(--color-error)] bg-red-50 dark:bg-red-900/20'
                    : 'border-[var(--color-sand-300)] bg-white dark:bg-gray-800'
                }`}
                dir="rtl"
              >
                {selectedWords.length === 0 ? (
                  <span className="text-[var(--color-ink-muted)] text-sm">Tap words below to build sentence</span>
                ) : (
                  selectedWords.map((word, i) => (
                    <button
                      key={`${word}-${i}`}
                      onClick={() => handleRemoveWord(i)}
                      disabled={showFeedback}
                      className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg font-arabic text-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Available words */}
            <div className="mb-6">
              <p className="text-sm text-[var(--color-ink-muted)] mb-2">Available words:</p>
              <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                {availableWords.map((word, i) => (
                  <button
                    key={`${word}-${i}`}
                    onClick={() => handleAddWord(word)}
                    disabled={showFeedback}
                    className="px-3 py-1.5 bg-[var(--color-sand-100)] text-[var(--color-ink)] rounded-lg font-arabic text-lg hover:bg-[var(--color-sand-200)] transition-colors disabled:opacity-50"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {!showFeedback ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCheck}
                  disabled={selectedWords.length === 0}
                >
                  Check Answer
                </Button>
                <Button variant="secondary" fullWidth onClick={handleClear}>
                  Clear
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl ${
                  isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                }`}>
                  {isCorrect ? (
                    <p className="text-emerald-800 dark:text-emerald-300 font-medium">✓ Correct!</p>
                  ) : (
                    <div>
                      <p className="text-red-800 dark:text-red-300 font-medium mb-2">✗ Not quite</p>
                      <p className="text-red-700 dark:text-red-400 text-sm">Correct order:</p>
                      <p className="font-arabic text-lg mt-1" dir="rtl">
                        {currentExercise.correctOrder.join(' ')}
                      </p>
                    </div>
                  )}
                </div>
                <Button variant="primary" fullWidth onClick={handleContinue}>
                  {currentIndex + 1 >= exercises.length ? 'See Results' : 'Continue'}
                </Button>
              </div>
            )}
          </div>
        </PageContainer>
      </>
    );
  }

  // Results screen
  if (sessionState === 'result' && sessionResult) {
    const isPerfect = sessionResult.accuracy === 100;
    const isGood = sessionResult.accuracy >= 70;

    return (
      <>
        <Header title="Results" titleArabic="النتائج" />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8 animate-fade-in">
            {/* Score */}
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isPerfect ? 'bg-amber-100 dark:bg-amber-900/50' : isGood ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-[var(--color-sand-200)]'
            }`}>
              <span className="text-4xl">
                {isPerfect ? '🌟' : isGood ? '🏗️' : '📚'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-ink)]">
              {isPerfect ? 'Perfect!' : isGood ? 'Good job!' : 'Keep practicing!'}
            </h2>
            <p className="text-[var(--color-ink-muted)] mt-2">
              {sessionResult.correct} of {sessionResult.total} correct
            </p>

            {/* Stats */}
            <Card variant="default" padding="lg" className="mt-6 mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-[var(--color-primary)]">{sessionResult.accuracy}%</p>
                <p className="text-[var(--color-ink-muted)] text-sm mt-1">Accuracy</p>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={handleStart}>
                Practice Again
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setSessionState('setup')}>
                Change Settings
              </Button>
            </div>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return null;
}

export default SentenceBuilding;
