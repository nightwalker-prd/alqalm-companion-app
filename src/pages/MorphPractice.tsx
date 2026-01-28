/**
 * Morphological Pattern Recognition Practice
 * 
 * Drills for recognizing اسم فاعل، اسم مفعول، مصدر، صفة مشبهة، اسم مكان، اسم آلة، اسم تفضيل
 */

import { useState, useCallback, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { morphPatterns, getAllMorphExamples, getPatternById, shuffle } from '../content/sarf/morphPatterns';
import { useAchievementContext } from '../contexts/AchievementContext';
import type { MorphPattern, MorphExample } from '../content/sarf/morphPatterns';

// Storage keys
const MORPH_STATS_KEY = 'madina_morph_stats';
const MORPH_SETTINGS_KEY = 'madina_morph_settings';

type GameState = 'menu' | 'settings' | 'playing' | 'result';

interface Question {
  example: MorphExample & { patternId: string };
  options: MorphPattern[];
}

interface Answer {
  question: Question;
  selectedId: string | null;
  isCorrect: boolean;
  timeMs: number;
}

interface MorphStats {
  totalQuestions: number;
  totalCorrect: number;
  avgTimeMs: number;
  patternAccuracy: Record<string, { correct: number; total: number }>;
}

interface MorphSettings {
  questionCount: number;
  selectedPatterns: string[];
}

function loadStats(): MorphStats {
  try {
    const stored = localStorage.getItem(MORPH_STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }
  return { totalQuestions: 0, totalCorrect: 0, avgTimeMs: 0, patternAccuracy: {} };
}

function saveStats(stats: MorphStats): void {
  localStorage.setItem(MORPH_STATS_KEY, JSON.stringify(stats));
}

function loadSettings(): MorphSettings {
  try {
    const stored = localStorage.getItem(MORPH_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }
  return { 
    questionCount: 10, 
    selectedPatterns: morphPatterns.map(p => p.id)
  };
}

function saveSettings(settings: MorphSettings): void {
  localStorage.setItem(MORPH_SETTINGS_KEY, JSON.stringify(settings));
}

export function MorphPractice() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  // Settings
  const [settings, setSettings] = useState<MorphSettings>(loadSettings);

  // Lifetime stats
  const [lifetimeStats, setLifetimeStats] = useState<MorphStats>(loadStats);

  // Achievement context
  const { recordPractice } = useAchievementContext();

  // Generate questions
  const generateQuestions = useCallback(() => {
    const allExamples = getAllMorphExamples().filter(e =>
      settings.selectedPatterns.includes(e.patternId)
    );
    const shuffled = shuffle(allExamples).slice(0, settings.questionCount);

    const generatedQuestions: Question[] = shuffled.map(example => {
      const correctPattern = getPatternById(example.patternId)!;
      
      // Get wrong options (other patterns)
      const wrongPatterns = morphPatterns
        .filter(p => p.id !== example.patternId)
        .filter(p => settings.selectedPatterns.includes(p.id));
      
      const shuffledWrong = shuffle(wrongPatterns).slice(0, 3);
      const options = shuffle([correctPattern, ...shuffledWrong]);
      
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
  const handleAnswer = useCallback((patternId: string) => {
    if (showFeedback) return;
    
    const timeMs = Date.now() - questionStartTime;
    const question = questions[currentIndex];
    const isCorrect = patternId === question.example.patternId;
    
    setSelectedAnswer(patternId);
    setShowFeedback(true);
    
    setAnswers(prev => [...prev, {
      question,
      selectedId: patternId,
      isCorrect,
      timeMs,
    }]);
  }, [showFeedback, questionStartTime, questions, currentIndex]);

  // Next question
  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      // Session complete - update stats
      const sessionCorrect = answers.filter(a => a.isCorrect).length;
      const sessionTotal = answers.length;
      const sessionAvgTime = answers.reduce((sum, a) => sum + a.timeMs, 0) / answers.length;
      
      // Update pattern accuracy
      const patternAccuracy = { ...lifetimeStats.patternAccuracy };
      answers.forEach(answer => {
        const pid = answer.question.example.patternId;
        if (!patternAccuracy[pid]) {
          patternAccuracy[pid] = { correct: 0, total: 0 };
        }
        patternAccuracy[pid].total++;
        if (answer.isCorrect) {
          patternAccuracy[pid].correct++;
        }
      });

      const newStats: MorphStats = {
        totalQuestions: lifetimeStats.totalQuestions + sessionTotal,
        totalCorrect: lifetimeStats.totalCorrect + sessionCorrect,
        avgTimeMs: Math.round(
          (lifetimeStats.avgTimeMs * lifetimeStats.totalQuestions + sessionAvgTime * sessionTotal) /
          (lifetimeStats.totalQuestions + sessionTotal)
        ),
        patternAccuracy,
      };
      
      saveStats(newStats);
      setLifetimeStats(newStats);
      
      // Record practice for achievements
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

  // Session stats
  const sessionStats = useMemo(() => {
    if (answers.length === 0) return { correct: 0, total: 0, accuracy: 0 };
    const correct = answers.filter(a => a.isCorrect).length;
    return {
      correct,
      total: answers.length,
      accuracy: Math.round((correct / answers.length) * 100),
    };
  }, [answers]);

  // Current question
  const currentQuestion = questions[currentIndex];

  // Render menu
  if (gameState === 'menu') {
    return (
      <>
        <Header title="Pattern Recognition" showBackButton />
        <PageContainer>
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-2">🔍 Pattern Recognition</h1>
              <p className="text-[var(--color-ink-muted)]">
                Identify morphological patterns:<br />
                اسم فاعل، اسم مفعول، مصدر، صفة مشبهة...
              </p>
            </div>

            {/* Lifetime stats */}
            <Card className="p-4">
              <h2 className="font-semibold text-[var(--color-ink)] mb-3">📊 Your Progress</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">{lifetimeStats.totalQuestions}</div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {lifetimeStats.totalQuestions > 0
                      ? Math.round((lifetimeStats.totalCorrect / lifetimeStats.totalQuestions) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {lifetimeStats.avgTimeMs > 0 ? (lifetimeStats.avgTimeMs / 1000).toFixed(1) : '—'}s
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Avg Time</div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={generateQuestions}
                className="w-full py-4 text-lg"
                disabled={settings.selectedPatterns.length < 2}
              >
                Start Practice
              </Button>
              <Button
                variant="secondary"
                onClick={() => setGameState('settings')}
                className="w-full"
              >
                ⚙️ Settings
              </Button>
            </div>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Render settings
  if (gameState === 'settings') {
    return (
      <>
        <Header title="Settings" showBackButton />
        <PageContainer>
          <div className="space-y-6">
            {/* Question count */}
            <Card className="p-4">
              <h2 className="font-semibold text-[var(--color-ink)] mb-3">Questions per session</h2>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    onClick={() => {
                      const newSettings = { ...settings, questionCount: count };
                      setSettings(newSettings);
                      saveSettings(newSettings);
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      settings.questionCount === count
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </Card>

            {/* Pattern selection */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[var(--color-ink)]">Patterns to practice</h2>
                <button
                  onClick={() => {
                    const allSelected = settings.selectedPatterns.length === morphPatterns.length;
                    const newSettings = {
                      ...settings,
                      selectedPatterns: allSelected ? [] : morphPatterns.map(p => p.id),
                    };
                    setSettings(newSettings);
                    saveSettings(newSettings);
                  }}
                  className="text-sm text-[var(--color-primary)] hover:opacity-80"
                >
                  {settings.selectedPatterns.length === morphPatterns.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-2">
                {morphPatterns.map(pattern => {
                  const isSelected = settings.selectedPatterns.includes(pattern.id);
                  const stats = lifetimeStats.patternAccuracy[pattern.id];
                  const accuracy = stats ? Math.round((stats.correct / stats.total) * 100) : null;
                  
                  return (
                    <button
                      key={pattern.id}
                      onClick={() => {
                        const newSelected = isSelected
                          ? settings.selectedPatterns.filter(id => id !== pattern.id)
                          : [...settings.selectedPatterns, pattern.id];
                        const newSettings = { ...settings, selectedPatterns: newSelected };
                        setSettings(newSettings);
                        saveSettings(newSettings);
                      }}
                      className={`w-full p-3 rounded-lg text-right flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-400 dark:border-teal-600'
                          : 'bg-[var(--color-sand-50)] border-2 border-transparent hover:border-[var(--color-sand-300)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-teal-500 border-teal-500' : 'border-[var(--color-sand-300)]'
                        }`}>
                          {isSelected && <span className="text-white text-sm">✓</span>}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-[var(--color-ink)]">{pattern.nameAr}</div>
                          <div className="text-sm text-[var(--color-ink-muted)]">{pattern.nameEn}</div>
                        </div>
                      </div>
                      {accuracy !== null && (
                        <div className={`text-sm font-medium ${
                          accuracy >= 80 ? 'text-green-600' :
                          accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {accuracy}%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Back button */}
            <Button
              variant="secondary"
              onClick={() => setGameState('menu')}
              className="w-full"
            >
              ← Back to Menu
            </Button>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Render playing
  if (gameState === 'playing' && currentQuestion) {
    const correctPattern = getPatternById(currentQuestion.example.patternId);
    
    return (
      <>
        <Header title="Pattern Recognition" showBackButton />
        <PageContainer>
          <div className="space-y-6">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm text-[var(--color-ink-muted)] mb-1">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{sessionStats.correct}/{sessionStats.total} correct</span>
              </div>
              <ProgressBar 
                value={currentIndex + 1} 
                max={questions.length}
                className="h-2"
              />
            </div>

            {/* Question */}
            <Card className="p-6 text-center">
              <div className="text-sm text-[var(--color-ink-muted)] mb-2">What type of word is this?</div>
              <div className="text-5xl font-arabic mb-4" dir="rtl">
                {currentQuestion.example.word}
              </div>
              <div className="text-[var(--color-ink-muted)]">
                {currentQuestion.example.meaning}
              </div>
              {showFeedback && (
                <div className="mt-4 text-sm text-[var(--color-ink-muted)]">
                  Root: <span className="font-arabic">{currentQuestion.example.root}</span>
                  {currentQuestion.example.pattern && (
                    <span> • Pattern: <span className="font-arabic">{currentQuestion.example.pattern}</span></span>
                  )}
                </div>
              )}
            </Card>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map(pattern => {
                const isSelected = selectedAnswer === pattern.id;
                const isCorrect = pattern.id === currentQuestion.example.patternId;
                
                let className = 'w-full p-4 rounded-xl text-right transition-all border-2 ';
                
                if (showFeedback) {
                  if (isCorrect) {
                    className += 'bg-green-50 border-green-500 text-green-900';
                  } else if (isSelected) {
                    className += 'bg-red-50 border-red-500 text-red-900';
                  } else {
                    className += 'bg-[var(--color-sand-50)] border-[var(--color-sand-200)] text-[var(--color-ink-muted)]';
                  }
                } else {
                  className += 'bg-white border-[var(--color-sand-200)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:scale-[0.98]';
                }
                
                return (
                  <button
                    key={pattern.id}
                    onClick={() => handleAnswer(pattern.id)}
                    disabled={showFeedback}
                    className={className}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-semibold">{pattern.nameAr}</div>
                        <div className="text-sm opacity-70">{pattern.nameEn}</div>
                      </div>
                      {showFeedback && isCorrect && (
                        <span className="text-2xl">✓</span>
                      )}
                      {showFeedback && isSelected && !isCorrect && (
                        <span className="text-2xl">✗</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Next */}
            {showFeedback && (
              <div className="space-y-4">
                <Card className={`p-4 ${
                  selectedAnswer === currentQuestion.example.patternId
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  {selectedAnswer === currentQuestion.example.patternId ? (
                    <div className="text-green-800">
                      <span className="font-semibold">✓ Correct!</span>
                    </div>
                  ) : (
                    <div className="text-red-800">
                      <span className="font-semibold">✗ Not quite.</span>
                      <p className="mt-1 text-sm">
                        This is {correctPattern?.nameAr} ({correctPattern?.nameEn}) — {correctPattern?.description}
                      </p>
                    </div>
                  )}
                </Card>
                
                <Button onClick={handleNext} className="w-full py-4 text-lg">
                  {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question →'}
                </Button>
              </div>
            )}
          </div>
        </PageContainer>
      </>
    );
  }

  // Render results
  if (gameState === 'result') {
    const finalAnswers = [...answers];
    const correct = finalAnswers.filter(a => a.isCorrect).length;
    const total = finalAnswers.length;
    const accuracy = Math.round((correct / total) * 100);
    const avgTime = Math.round(finalAnswers.reduce((sum, a) => sum + a.timeMs, 0) / total / 1000 * 10) / 10;
    
    // Group by pattern
    const byPattern: Record<string, { correct: number; total: number }> = {};
    finalAnswers.forEach(answer => {
      const pid = answer.question.example.patternId;
      if (!byPattern[pid]) {
        byPattern[pid] = { correct: 0, total: 0 };
      }
      byPattern[pid].total++;
      if (answer.isCorrect) byPattern[pid].correct++;
    });

    return (
      <>
        <Header title="Results" showBackButton />
        <PageContainer>
          <div className="space-y-6">
            {/* Score */}
            <Card className="p-6 text-center">
              <div className="text-6xl mb-2">
                {accuracy >= 80 ? '🌟' : accuracy >= 60 ? '👍' : '💪'}
              </div>
              <div className="text-4xl font-bold text-[var(--color-ink)] mb-1">
                {correct}/{total}
              </div>
              <div className="text-xl text-[var(--color-ink-muted)] mb-4">
                {accuracy}% accuracy
              </div>
              <div className="text-[var(--color-ink-muted)]">
                Average: {avgTime}s per question
              </div>
            </Card>

            {/* Breakdown by pattern */}
            <Card className="p-4">
              <h2 className="font-semibold text-[var(--color-ink)] mb-3">Pattern Breakdown</h2>
              <div className="space-y-2">
                {Object.entries(byPattern).map(([pid, stats]) => {
                  const pattern = getPatternById(pid);
                  const acc = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={pid} className="flex items-center justify-between py-2 border-b border-[var(--color-sand-100)] last:border-0">
                      <div>
                        <span className="font-medium text-[var(--color-ink)]">{pattern?.nameAr}</span>
                        <span className="text-[var(--color-ink-muted)] text-sm ml-2">{pattern?.nameEn}</span>
                      </div>
                      <div className={`font-medium ${
                        acc >= 80 ? 'text-green-600' :
                        acc >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stats.correct}/{stats.total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Review wrong answers */}
            {finalAnswers.some(a => !a.isCorrect) && (
              <Card className="p-4">
                <h2 className="font-semibold text-[var(--color-ink)] mb-3">Review Mistakes</h2>
                <div className="space-y-3">
                  {finalAnswers.filter(a => !a.isCorrect).map((answer, i) => {
                    const correctPattern = getPatternById(answer.question.example.patternId);
                    const selectedPattern = answer.selectedId ? getPatternById(answer.selectedId) : null;
                    return (
                      <div key={i} className="p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-arabic text-center mb-2" dir="rtl">
                          {answer.question.example.word}
                        </div>
                        <div className="text-sm text-red-700">
                          <span className="line-through">{selectedPattern?.nameAr}</span>
                          {' → '}
                          <span className="font-medium">{correctPattern?.nameAr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={generateQuestions} className="w-full py-4">
                Practice Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => setGameState('menu')}
                className="w-full"
              >
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

export default MorphPractice;
