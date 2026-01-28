import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FluencyTimer } from '../components/exercise/FluencyTimer';
import { useFluencyTimer } from '../hooks/useFluencyTimer';
import { FluencyExercise } from '../components/exercise/FluencyExercise';
import {
  generateFluencySession,
  checkFluencyAnswer,
  calculateFluencyResult,
  updateFluencyStats,
  loadFluencyStats,
  saveFluencyStats,
  canStartFluencySession,
  getMasteredWordCount,
  DEFAULT_FLUENCY_DURATION_MS,
  MIN_WORDS_FOR_FLUENCY,
  type FluencyItem,
  type FluencyAnswerResult,
  type FluencySessionResult,
  type FluencyStats,
} from '../lib/fluencyUtils';
import { useAchievementContext } from '../contexts/AchievementContext';

type SessionState = 'ready' | 'countdown' | 'active' | 'complete';

export function FluencyPractice() {
  const navigate = useNavigate();
  
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [items, setItems] = useState<FluencyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<FluencyAnswerResult[]>([]);
  const [result, setResult] = useState<FluencySessionResult | null>(null);
  const [stats, setStats] = useState<FluencyStats>(loadFluencyStats());
  
  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  
  // Timer
  const timer = useFluencyTimer(DEFAULT_FLUENCY_DURATION_MS);
  
  // Countdown timer (3 seconds before start)
  const [countdown, setCountdown] = useState(3);
  
  // Check if user can start
  const canStart = canStartFluencySession();
  const masteredCount = getMasteredWordCount();

  // Achievement context
  const { recordPractice } = useAchievementContext();

  // Record practice when session completes
  useEffect(() => {
    if (sessionState === 'complete' && result) {
      const isPerfect = result.totalAttempted > 0 && result.totalCorrect === result.totalAttempted;
      recordPractice({
        exerciseCount: result.totalAttempted,
        correctCount: result.totalCorrect,
        isPerfect,
      });
    }
  }, [sessionState, result, recordPractice]);

  // Start countdown
  const handleStart = useCallback(() => {
    const session = generateFluencySession();
    if (session.length === 0) return;
    
    setItems(session);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
    setSessionState('countdown');
    setCountdown(3);
  }, []);

  // Countdown effect - transitions to active when countdown reaches 0
  useEffect(() => {
    if (sessionState !== 'countdown' || countdown <= 0) return;

    const timeout = setTimeout(() => {
      if (countdown === 1) {
        // Last tick - transition to active state
        setCountdown(0);
        setSessionState('active');
        timer.start();
      } else {
        setCountdown(c => c - 1);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [sessionState, countdown, timer]);

  // Handle timer complete
  const handleTimerComplete = useCallback(() => {
    // Calculate and save results
    const sessionResult = calculateFluencyResult(
      answers,
      DEFAULT_FLUENCY_DURATION_MS,
      stats.bestWordsPerMinute
    );
    setResult(sessionResult);
    
    // Update and save stats
    const newStats = updateFluencyStats(stats, sessionResult);
    setStats(newStats);
    saveFluencyStats(newStats);
    
    setSessionState('complete');
  }, [answers, stats]);

  // Handle answer submission
  const handleAnswer = useCallback((userAnswer: string, responseTimeMs: number) => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;
    
    const isCorrect = checkFluencyAnswer(currentItem, userAnswer);
    
    // Record answer
    const answerResult: FluencyAnswerResult = {
      itemId: currentItem.id,
      isCorrect,
      responseTimeMs,
    };
    setAnswers(prev => [...prev, answerResult]);
    
    // Show brief feedback
    setLastResult({ isCorrect, correctAnswer: currentItem.answer });
    setShowFeedback(true);
    
    // Advance after brief feedback
    setTimeout(() => {
      setShowFeedback(false);
      setLastResult(null);
      
      if (currentIndex + 1 < items.length) {
        setCurrentIndex(i => i + 1);
      }
      // If we run out of items before timer, keep showing last item
      // Timer will complete the session
    }, 300);
  }, [items, currentIndex]);

  // Current item
  const currentItem = items[currentIndex];
  
  // Calculate current stats
  const correctCount = answers.filter(a => a.isCorrect).length;
  const attemptCount = answers.length;

  // Ready state - show start screen
  if (sessionState === 'ready') {
    return (
      <>
        <Header title="Speed Round" titleArabic="جَوْلَة السُّرْعَة" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg className="w-12 h-12 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
                Fluency Speed Round
              </h1>
              <p className="text-[var(--color-ink-muted)]">
                Answer as many as you can in 60 seconds!
              </p>
            </div>

            {canStart ? (
              <>
                {/* Stats preview */}
                <Card variant="default" padding="md" className="mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[var(--color-primary)]">
                        {stats.bestWordsPerMinute}
                      </div>
                      <div className="text-xs text-[var(--color-ink-muted)]">Best WPM</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--color-ink)]">
                        {stats.totalSessions}
                      </div>
                      <div className="text-xs text-[var(--color-ink-muted)]">Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--color-success)]">
                        {Math.round(stats.averageAccuracy * 100)}%
                      </div>
                      <div className="text-xs text-[var(--color-ink-muted)]">Accuracy</div>
                    </div>
                  </div>
                </Card>

                <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                  {masteredCount} mastered words available
                </p>

                <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
                  Start Speed Round
                </Button>
              </>
            ) : (
              <Card variant="default" padding="lg">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand-200)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-[var(--color-ink)] mb-2">
                    Not Enough Mastered Words
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                    You need at least {MIN_WORDS_FOR_FLUENCY} mastered words to start a speed round.
                    Currently you have {masteredCount}.
                  </p>
                  <Button variant="secondary" onClick={() => navigate('/practice')}>
                    Practice More
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </PageContainer>
      </>
    );
  }

  // Countdown state
  if (sessionState === 'countdown') {
    return (
      <>
        <Header title="Speed Round" titleArabic="جَوْلَة السُّرْعَة" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-[var(--color-ink-muted)] mb-4">Get ready!</p>
            <div className="text-8xl font-bold text-[var(--color-primary)] animate-pulse">
              {countdown}
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // Active state
  if (sessionState === 'active' && currentItem) {
    return (
      <>
        <Header title="Speed Round" titleArabic="جَوْلَة السُّرْعَة" />
        <PageContainer>
          {/* Timer and stats bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-success)]">{correctCount}</div>
              <div className="text-xs text-[var(--color-ink-muted)]">Correct</div>
            </div>
            
            <FluencyTimer
              durationMs={DEFAULT_FLUENCY_DURATION_MS}
              isRunning={timer.isRunning}
              onComplete={handleTimerComplete}
              onTick={timer.handleTick}
              size="lg"
            />
            
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-ink)]">{attemptCount}</div>
              <div className="text-xs text-[var(--color-ink-muted)]">Attempted</div>
            </div>
          </div>

          {/* Exercise */}
          <FluencyExercise
            item={currentItem}
            onAnswer={handleAnswer}
            showFeedback={showFeedback}
            lastResult={lastResult}
          />
        </PageContainer>
      </>
    );
  }

  // Complete state
  if (sessionState === 'complete' && result) {
    return (
      <>
        <Header title="Speed Round" titleArabic="جَوْلَة السُّرْعَة" />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            {/* Personal best banner */}
            {result.isNewPersonalBest && (
              <div className="mb-6 py-3 px-4 bg-amber-100 dark:bg-amber-900/50 rounded-[var(--radius-lg)] animate-pulse">
                <span className="text-lg font-bold text-[var(--color-gold-dark)]">
                  New Personal Best!
                </span>
              </div>
            )}

            {/* Main result */}
            <div className="mb-8">
              <div className="text-6xl font-bold text-[var(--color-primary)] mb-2">
                {result.wordsPerMinute}
              </div>
              <div className="text-xl text-[var(--color-ink-muted)]">
                Words Per Minute
              </div>
            </div>

            {/* Stats grid */}
            <Card variant="default" padding="lg" className="mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-success)]">
                    {result.totalCorrect}
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-ink)]">
                    {result.totalAttempted}
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Attempted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-ink)]">
                    {result.totalAttempted > 0 
                      ? Math.round((result.totalCorrect / result.totalAttempted) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-ink)]">
                    {(result.averageResponseTimeMs / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Avg Time</div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
                Try Again
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // Fallback
  return null;
}

export default FluencyPractice;
