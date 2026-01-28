/**
 * Typing Practice Page
 * 
 * Arabic keyboard input drills with letters, words, and verbs.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  generateTypingSession,
  checkTyping,
  loadTypingStats,
  saveTypingStats,
  calculateWpm,
  type TypingMode,
  type TypingItem,
  type TypingStats,
} from '../lib/typingService';
import { useAchievementContext } from '../contexts/AchievementContext';

type SessionState = 'setup' | 'playing' | 'result';

interface SessionResult {
  correct: number;
  total: number;
  accuracy: number;
  wpm: number;
  timeMs: number;
  characters: number;
}

export function TypingPractice() {
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [mode, setMode] = useState<TypingMode>('words');
  const [strictMode, setStrictMode] = useState(false);
  const [itemCount, setItemCount] = useState(10);
  
  // Session state
  const [items, setItems] = useState<TypingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Array<{ correct: boolean; timeMs: number }>>([]);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [itemStartTime, setItemStartTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<TypingStats>(loadTypingStats);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { recordPractice } = useAchievementContext();

  // Focus input when playing
  useEffect(() => {
    if (sessionState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionState, currentIndex, showFeedback]);

  // Start session
  const handleStart = useCallback(() => {
    const sessionItems = generateTypingSession(mode, itemCount);
    if (sessionItems.length === 0) return;
    
    setItems(sessionItems);
    setCurrentIndex(0);
    setInput('');
    setResults([]);
    setSessionStartTime(Date.now());
    setItemStartTime(Date.now());
    setShowFeedback(false);
    setSessionResult(null);
    setSessionState('playing');
  }, [mode, itemCount]);

  // Check answer
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (showFeedback || !items[currentIndex]) return;
    
    const timeMs = Date.now() - itemStartTime;
    const isCorrect = checkTyping(input, items[currentIndex].arabic, strictMode);
    
    setLastCorrect(isCorrect);
    setShowFeedback(true);
    setResults(prev => [...prev, { correct: isCorrect, timeMs }]);
  }, [input, items, currentIndex, itemStartTime, strictMode, showFeedback]);

  // Continue to next
  const handleContinue = useCallback(() => {
    if (currentIndex + 1 >= items.length) {
      // Session complete
      const totalTimeMs = Date.now() - sessionStartTime;
      const correctCount = results.filter(r => r.correct).length + (lastCorrect ? 1 : 0);
      const totalCount = results.length + 1;
      const totalChars = items.reduce((sum, item) => sum + item.arabic.length, 0);
      const wpm = calculateWpm(totalChars, totalTimeMs);
      
      const result: SessionResult = {
        correct: correctCount,
        total: totalCount,
        accuracy: Math.round((correctCount / totalCount) * 100),
        wpm,
        timeMs: totalTimeMs,
        characters: totalChars,
      };
      
      setSessionResult(result);
      
      // Update stats
      const newStats: TypingStats = {
        ...stats,
        totalAttempts: stats.totalAttempts + totalCount,
        totalCorrect: stats.totalCorrect + correctCount,
        totalCharacters: stats.totalCharacters + totalChars,
        totalTimeMs: stats.totalTimeMs + totalTimeMs,
        sessionsCompleted: stats.sessionsCompleted + 1,
        bestWpm: Math.max(stats.bestWpm, wpm),
        letterAccuracy: stats.letterAccuracy, // TODO: track per-letter
      };
      setStats(newStats);
      saveTypingStats(newStats);
      
      // Record for achievements
      recordPractice({
        exerciseCount: totalCount,
        correctCount,
        isPerfect: correctCount === totalCount,
      });
      
      setSessionState('result');
    } else {
      setCurrentIndex(prev => prev + 1);
      setInput('');
      setShowFeedback(false);
      setItemStartTime(Date.now());
    }
  }, [currentIndex, items, results, lastCorrect, sessionStartTime, stats, recordPractice]);

  // Setup screen
  if (sessionState === 'setup') {
    return (
      <>
        <Header title="Typing Practice" titleArabic="تَدْرِيب الكِتَابَة" />
        <PageContainer>
          <div className="max-w-md mx-auto space-y-6 py-4 animate-fade-in">
            {/* Mode selection */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Practice Mode
              </label>
              <div className="space-y-2">
                {[
                  { id: 'letters', label: 'Letters', desc: 'Individual Arabic letters', icon: 'أ' },
                  { id: 'words', label: 'Words', desc: 'Vocabulary words', icon: '📝' },
                  { id: 'verbs', label: 'Verbs', desc: 'Verb patterns from Wazn Trainer', icon: '🔤' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as TypingMode)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      mode === m.id
                        ? 'bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-400'
                        : 'bg-[var(--color-sand-50)] border-2 border-transparent hover:border-[var(--color-sand-300)]'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-[var(--color-ink)]">{m.label}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Item count */}
            <Card variant="default" padding="md">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                Items per session
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setItemCount(n)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      itemCount === n
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Card>

            {/* Strict mode toggle */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">Strict Mode</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Require exact tashkeel (diacritics)
                  </p>
                </div>
                <button
                  onClick={() => setStrictMode(!strictMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    strictMode ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-sand-300)]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    strictMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
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
                    <p className="text-2xl font-bold text-[var(--color-primary)]">{stats.bestWpm}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">Best WPM</p>
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
  if (sessionState === 'playing' && items[currentIndex]) {
    const currentItem = items[currentIndex];
    const correctCount = results.filter(r => r.correct).length;
    
    return (
      <>
        <Header title="Typing Practice" titleArabic="تَدْرِيب الكِتَابَة" />
        <PageContainer>
          <div className="max-w-md mx-auto animate-fade-in">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-[var(--color-ink-muted)] mb-2">
                <span>Item {currentIndex + 1} of {items.length}</span>
                <span className="text-[var(--color-success)]">{correctCount} correct</span>
              </div>
              <ProgressBar value={(currentIndex + 1) / items.length * 100} />
            </div>

            {/* Target */}
            <Card variant="elevated" padding="lg" className="text-center mb-6">
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">Type this:</p>
              <p className="text-5xl font-arabic mb-3" dir="rtl">{currentItem.arabic}</p>
              {currentItem.hint && (
                <p className="text-[var(--color-ink-muted)]">{currentItem.hint}</p>
              )}
            </Card>

            {/* Input */}
            <form onSubmit={handleSubmit}>
              <div className="relative mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={showFeedback}
                  dir="rtl"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={`
                    w-full text-3xl font-arabic text-center py-4 px-6 rounded-xl border-2 transition-colors
                    ${showFeedback
                      ? lastCorrect
                        ? 'border-[var(--color-success)] bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-[var(--color-error)] bg-red-50 dark:bg-red-900/20'
                      : 'border-[var(--color-sand-300)] focus:border-[var(--color-primary)] bg-white dark:bg-gray-800'
                    }
                    focus:outline-none
                  `}
                  placeholder="اكتب هنا..."
                />
              </div>

              {!showFeedback ? (
                <Button type="submit" variant="primary" fullWidth disabled={!input.trim()}>
                  Check
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl ${
                    lastCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                  }`}>
                    {lastCorrect ? (
                      <p className="text-emerald-800 dark:text-emerald-300 font-medium">✓ Correct!</p>
                    ) : (
                      <div>
                        <p className="text-red-800 dark:text-red-300 font-medium mb-1">✗ Not quite</p>
                        <p className="text-red-700 dark:text-red-400 text-sm">
                          Expected: <span className="font-arabic text-lg">{currentItem.arabic}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <Button variant="primary" fullWidth onClick={handleContinue}>
                    {currentIndex + 1 >= items.length ? 'See Results' : 'Continue'}
                  </Button>
                </div>
              )}
            </form>

            {/* Keyboard hint */}
            <p className="text-center text-xs text-[var(--color-ink-muted)] mt-6">
              💡 Use an Arabic keyboard layout to type
            </p>
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
                {isPerfect ? '🌟' : isGood ? '⌨️' : '📚'}
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
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--color-primary)]">{sessionResult.accuracy}%</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--color-ink)]">{sessionResult.wpm}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">WPM</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--color-success)]">{sessionResult.characters}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Characters</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--color-ink)]">{(sessionResult.timeMs / 1000).toFixed(1)}s</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">Time</p>
                </div>
              </div>

              {sessionResult.wpm >= stats.bestWpm && sessionResult.wpm > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--color-sand-200)]">
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    🏆 New personal best WPM!
                  </p>
                </div>
              )}
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

export default TypingPractice;
