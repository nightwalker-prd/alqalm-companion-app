/**
 * Wazn (Verb Pattern) Practice Page
 * 
 * Drills for recognizing Arabic verb patterns (أوزان) Forms I-X.
 * Adapted from standalone wazn-trainer project.
 */

import { useState, useCallback, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { patterns, getAllExamples, getPatternById, shuffle } from '../content/sarf/patterns';
import { useAchievementContext } from '../contexts/AchievementContext';
import type { VerbPattern, VerbExample } from '../content/sarf/patterns';

// Storage keys
const WAZN_STATS_KEY = 'madina_wazn_stats';
const WAZN_SETTINGS_KEY = 'madina_wazn_settings';

type GameState = 'menu' | 'settings' | 'playing' | 'result';

interface Question {
  example: VerbExample & { patternId: number };
  options: VerbPattern[];
}

interface Answer {
  question: Question;
  selectedId: number | null;
  isCorrect: boolean;
  timeMs: number;
}

interface WaznStats {
  totalQuestions: number;
  totalCorrect: number;
  avgTimeMs: number;
  patternAccuracy: Record<number, { correct: number; total: number }>;
}

interface WaznSettings {
  questionCount: number;
  selectedPatterns: number[];
}

function loadStats(): WaznStats {
  try {
    const stored = localStorage.getItem(WAZN_STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }
  return { totalQuestions: 0, totalCorrect: 0, avgTimeMs: 0, patternAccuracy: {} };
}

function saveStats(stats: WaznStats): void {
  localStorage.setItem(WAZN_STATS_KEY, JSON.stringify(stats));
}

function loadSettings(): WaznSettings {
  try {
    const stored = localStorage.getItem(WAZN_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }
  return { questionCount: 10, selectedPatterns: [1, 2, 3, 4, 5, 6, 7, 8, 10] };
}

function saveSettings(settings: WaznSettings): void {
  localStorage.setItem(WAZN_SETTINGS_KEY, JSON.stringify(settings));
}

export function WaznPractice() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  // Settings
  const [settings, setSettings] = useState<WaznSettings>(loadSettings);

  // Lifetime stats
  const [lifetimeStats, setLifetimeStats] = useState<WaznStats>(loadStats);

  // Achievement context
  const { recordPractice } = useAchievementContext();

  // Generate questions
  const generateQuestions = useCallback(() => {
    const allExamples = getAllExamples().filter(e =>
      settings.selectedPatterns.includes(e.patternId)
    );
    const shuffled = shuffle(allExamples).slice(0, settings.questionCount);

    const generatedQuestions: Question[] = shuffled.map(example => {
      const correctPattern = getPatternById(example.patternId)!;

      // Get 3 random wrong patterns
      const wrongPatterns = shuffle(
        patterns.filter(p => p.id !== example.patternId && settings.selectedPatterns.includes(p.id))
      ).slice(0, 3);

      // Combine and shuffle options
      const options = shuffle([correctPattern, ...wrongPatterns]);

      return { example, options };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionStartTime(Date.now());
    setGameState('playing');
  }, [settings]);

  // Handle answer selection
  const handleSelectAnswer = useCallback((patternId: number) => {
    if (showFeedback) return;

    const timeMs = Date.now() - questionStartTime;
    const isCorrect = patternId === questions[currentIndex].example.patternId;

    setSelectedAnswer(patternId);
    setShowFeedback(true);

    const answer: Answer = {
      question: questions[currentIndex],
      selectedId: patternId,
      isCorrect,
      timeMs,
    };

    setAnswers(prev => [...prev, answer]);
  }, [showFeedback, questionStartTime, questions, currentIndex]);

  // Handle continue to next question
  const handleContinue = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      // Session complete - update stats
      const allAnswers = [...answers];
      if (selectedAnswer !== null) {
        // Include current answer
        const currentAnswer = {
          question: questions[currentIndex],
          selectedId: selectedAnswer,
          isCorrect: selectedAnswer === questions[currentIndex].example.patternId,
          timeMs: Date.now() - questionStartTime,
        };
        if (!allAnswers.find(a => a.question.example === currentAnswer.question.example)) {
          allAnswers.push(currentAnswer);
        }
      }

      const sessionCorrect = allAnswers.filter(a => a.isCorrect).length;
      const sessionTotal = allAnswers.length;
      const sessionAvgTime = allAnswers.reduce((sum, a) => sum + a.timeMs, 0) / sessionTotal;

      // Update pattern accuracy
      const patternAccuracy = { ...lifetimeStats.patternAccuracy };
      allAnswers.forEach(a => {
        const pid = a.question.example.patternId;
        if (!patternAccuracy[pid]) {
          patternAccuracy[pid] = { correct: 0, total: 0 };
        }
        patternAccuracy[pid].total++;
        if (a.isCorrect) patternAccuracy[pid].correct++;
      });

      const newStats: WaznStats = {
        totalQuestions: lifetimeStats.totalQuestions + sessionTotal,
        totalCorrect: lifetimeStats.totalCorrect + sessionCorrect,
        avgTimeMs: lifetimeStats.totalQuestions === 0
          ? sessionAvgTime
          : (lifetimeStats.avgTimeMs * lifetimeStats.totalQuestions + sessionAvgTime * sessionTotal) / (lifetimeStats.totalQuestions + sessionTotal),
        patternAccuracy,
      };

      setLifetimeStats(newStats);
      saveStats(newStats);

      // Record for achievements
      recordPractice({
        exerciseCount: sessionTotal,
        correctCount: sessionCorrect,
        isPerfect: sessionCorrect === sessionTotal,
      });

      setGameState('result');
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, questions, answers, selectedAnswer, lifetimeStats, questionStartTime, recordPractice]);

  // Update settings
  const updateQuestionCount = (count: number) => {
    const newSettings = { ...settings, questionCount: count };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const togglePattern = (patternId: number) => {
    const newPatterns = settings.selectedPatterns.includes(patternId)
      ? settings.selectedPatterns.filter(id => id !== patternId)
      : [...settings.selectedPatterns, patternId];

    if (newPatterns.length >= 2) {
      const newSettings = { ...settings, selectedPatterns: newPatterns };
      setSettings(newSettings);
      saveSettings(newSettings);
    }
  };

  // Current session stats
  const sessionStats = useMemo(() => {
    const correct = answers.filter(a => a.isCorrect).length;
    const total = answers.length;
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [answers]);

  // Current question
  const currentQuestion = questions[currentIndex];

  // Menu screen
  if (gameState === 'menu') {
    return (
      <>
        <Header title="Wazn Trainer" titleArabic="مُدَرِّب الأَوْزان" showBack />
        <PageContainer>
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Practice', to: '/practice' },
              { label: 'Wazn Trainer', labelArabic: 'الأوزان' }
            ]}
            className="mb-4"
          />
          <div className="max-w-md mx-auto text-center space-y-6 py-8 animate-fade-in">
            {/* Logo */}
            <div className="space-y-3">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl font-arabic text-amber-800 dark:text-amber-200">و</span>
              </div>
              <p className="text-[var(--color-ink-muted)]">
                Master Arabic verb patterns through pattern recognition drills.
              </p>
            </div>

            {/* Stats preview */}
            {lifetimeStats.totalQuestions > 0 && (
              <Card variant="default" padding="md">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-ink)]">{lifetimeStats.totalQuestions}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Questions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-success)]">
                      {Math.round((lifetimeStats.totalCorrect / lifetimeStats.totalQuestions) * 100)}%
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-ink)]">{(lifetimeStats.avgTimeMs / 1000).toFixed(1)}s</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Avg Time</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={generateQuestions}>
                Start Practice
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setGameState('settings')}>
                Settings
              </Button>
            </div>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Settings screen
  if (gameState === 'settings') {
    return (
      <>
        <Header title="Settings" titleArabic="الإعدادات" />
        <PageContainer>
          <div className="max-w-md mx-auto space-y-6 py-4 animate-fade-in">
            {/* Question count */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Questions per session
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => updateQuestionCount(n)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      settings.questionCount === n
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Card>

            {/* Pattern selection */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Patterns to practice
              </label>
              <div className="grid grid-cols-2 gap-2">
                {patterns.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePattern(p.id)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      settings.selectedPatterns.includes(p.id)
                        ? 'bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600'
                        : 'bg-[var(--color-sand-50)] border-2 border-transparent hover:border-[var(--color-sand-300)]'
                    }`}
                  >
                    <p className="font-arabic text-lg" dir="rtl">{p.pattern}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">{p.nameEn}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] mt-2">
                Select at least 2 patterns. Currently: {settings.selectedPatterns.length}
              </p>
            </Card>

            {/* Back button */}
            <Button variant="secondary" fullWidth onClick={() => setGameState('menu')}>
              Back to Menu
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Playing screen
  if (gameState === 'playing' && currentQuestion) {
    return (
      <>
        <Header title="Wazn Trainer" titleArabic="مُدَرِّب الأَوْزان" />
        <PageContainer>
          <div className="max-w-md mx-auto animate-fade-in">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-[var(--color-ink-muted)] mb-2">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-[var(--color-success)]">{sessionStats.correct} correct</span>
              </div>
              <ProgressBar value={(currentIndex + 1) / questions.length * 100} />
            </div>

            {/* Centered content */}
            <div className="flex flex-col justify-center min-h-[400px]">
              {/* Question card */}
              <Card
                variant="elevated"
                padding="lg"
                className={`text-center mb-6 ${
                  showFeedback
                    ? selectedAnswer === currentQuestion.example.patternId
                      ? 'ring-2 ring-[var(--color-success)]'
                      : 'ring-2 ring-[var(--color-error)]'
                    : ''
                }`}
              >
                <p className="text-sm text-[var(--color-ink-muted)] mb-4">What pattern is this verb?</p>
                <p className="text-4xl font-arabic mb-3" dir="rtl">{currentQuestion.example.verb}</p>
                <p className="text-[var(--color-ink-muted)]">{currentQuestion.example.meaning}</p>

                {showFeedback && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-sand-200)]">
                    <p className="text-sm text-[var(--color-ink-muted)]">
                      Root: <span className="font-arabic">{currentQuestion.example.root}</span>
                    </p>
                  </div>
                )}
              </Card>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map(option => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrect = option.id === currentQuestion.example.patternId;

                  let bgClass = 'bg-white dark:bg-gray-800 border-[var(--color-sand-200)]';
                  if (showFeedback) {
                    if (isCorrect) bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-[var(--color-success)]';
                    else if (isSelected) bgClass = 'bg-red-50 dark:bg-red-900/30 border-[var(--color-error)]';
                  } else if (isSelected) {
                    bgClass = 'bg-[var(--color-sand-100)] border-[var(--color-primary)]';
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAnswer(option.id)}
                      disabled={showFeedback}
                      className={`py-3 px-4 rounded-xl border-2 text-center transition-all ${bgClass} ${
                        !showFeedback ? 'hover:border-[var(--color-primary)] hover:bg-[var(--color-sand-50)]' : ''
                      }`}
                    >
                      <p className="font-arabic text-2xl mb-1" dir="rtl">{option.pattern}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{option.nameEn}</p>
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Continue */}
              {showFeedback && (
                <div className="mt-6 animate-fade-in">
                  <div className={`p-4 rounded-xl mb-4 ${
                    selectedAnswer === currentQuestion.example.patternId
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    {selectedAnswer === currentQuestion.example.patternId ? (
                      <p className="text-emerald-800 dark:text-emerald-300 font-medium">✓ Correct!</p>
                    ) : (
                      <div>
                        <p className="text-red-800 dark:text-red-300 font-medium mb-1">✗ Incorrect</p>
                        <p className="text-red-700 dark:text-red-400 text-sm">
                          The correct pattern is{' '}
                          <span className="font-arabic">{getPatternById(currentQuestion.example.patternId)?.pattern}</span>{' '}
                          ({getPatternById(currentQuestion.example.patternId)?.nameEn})
                        </p>
                      </div>
                    )}
                  </div>

                  <Button variant="primary" fullWidth onClick={handleContinue}>
                    {currentIndex + 1 >= questions.length ? 'See Results' : 'Continue'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // Results screen
  if (gameState === 'result') {
    const finalAnswers = answers;
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / finalAnswers.length) * 100);
    const isPerfect = percentage === 100;
    const isGood = percentage >= 70;

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
                {isPerfect ? '🌟' : isGood ? '👍' : '📚'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-ink)]">
              {isPerfect ? 'Perfect!' : isGood ? 'Good job!' : 'Keep practicing!'}
            </h2>
            <p className="text-[var(--color-ink-muted)] mt-2">
              You got {correctCount} out of {finalAnswers.length} correct
            </p>

            {/* Stats card */}
            <Card variant="default" padding="lg" className="mt-6 mb-6">
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-[var(--color-primary)]">{percentage}%</p>
                <p className="text-[var(--color-ink-muted)] text-sm">Session accuracy</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--color-success)]">{correctCount}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Correct</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--color-error)]">{finalAnswers.length - correctCount}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">To Review</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--color-sand-200)] text-center">
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Average time: {(finalAnswers.reduce((sum, a) => sum + a.timeMs, 0) / finalAnswers.length / 1000).toFixed(1)}s
                </p>
              </div>
            </Card>

            {/* Mistakes review */}
            {finalAnswers.some(a => !a.isCorrect) && (
              <Card variant="default" padding="md" className="mb-6 text-left">
                <h3 className="font-medium text-[var(--color-ink)] mb-3">Review mistakes</h3>
                <div className="space-y-2">
                  {finalAnswers.filter(a => !a.isCorrect).map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-sand-50)] rounded-lg">
                      <div>
                        <p className="font-arabic text-lg" dir="rtl">{a.question.example.verb}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">{a.question.example.meaning}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-arabic text-[var(--color-success)]">{getPatternById(a.question.example.patternId)?.pattern}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">{getPatternById(a.question.example.patternId)?.nameEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={generateQuestions}>
                Practice Again
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setGameState('menu')}>
                Back to Menu
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

export default WaznPractice;
