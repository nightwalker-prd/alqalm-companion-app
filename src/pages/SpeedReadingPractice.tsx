/**
 * SpeedReadingPractice Page
 *
 * Implements Paul Nation's fluency development through timed reading:
 * - Timed reading with WPM tracking
 * - Comprehension verification
 * - Personal best records
 * - Progress visualization
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { usePassages } from '../hooks/useReading';
import {
  calculateWPM,
  getWPMRating,
  recordSpeedReadingResultWithLevel,
  getSpeedReadingStats,
  getPersonalBest,
  getSuggestedTargetWPM,
  generateSimpleQuestions,
  calculateComprehensionScore,
  formatReadingTime,
  getPerformanceFeedback,
  getSpeedReadingPassages,
} from '../lib/speedReadingService';
import type { ReadingPassage, PassageLevel } from '../types/reading';

type PageState = 'select' | 'ready' | 'reading' | 'comprehension' | 'results';

export function SpeedReadingPractice() {
  const navigate = useNavigate();

  // Page state
  const [pageState, setPageState] = useState<PageState>('select');
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [levelFilter, setLevelFilter] = useState<PassageLevel | 'all'>('all');

  // Reading state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [currentWPM, setCurrentWPM] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Comprehension state
  const [questions, setQuestions] = useState<
    Array<{ id: string; question: string; options: string[]; correctIndex: number }>
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  // Results
  const [result, setResult] = useState<{
    wpm: number;
    readingTimeMs: number;
    comprehensionScore: number;
    isPersonalBest: boolean;
    questionsCorrect: number;
  } | null>(null);

  // Load passages
  const { passages, isLoading } = usePassages({
    level: levelFilter === 'all' ? 'all' : levelFilter,
    category: 'all',
    readStatus: 'all',
    searchQuery: '',
  });

  // Filter for speed reading (min word count)
  const speedReadingPassages = useMemo(() => {
    return getSpeedReadingPassages(passages, 20);
  }, [passages]);

  // Get stats from localStorage (fresh read each render to show latest after session)
  const stats = getSpeedReadingStats();

  // Live WPM update during reading
  useEffect(() => {
    if (pageState === 'reading' && startTime && selectedPassage) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setElapsedMs(elapsed);
        const wpm = calculateWPM(selectedPassage.wordCount, elapsed);
        setCurrentWPM(wpm);
      }, 500);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [pageState, startTime, selectedPassage]);

  // Handle passage selection
  const handleSelectPassage = useCallback((passage: ReadingPassage) => {
    setSelectedPassage(passage);
    setPageState('ready');
  }, []);

  // Start reading
  const handleStartReading = useCallback(() => {
    setStartTime(Date.now());
    setElapsedMs(0);
    setPageState('reading');
  }, []);

  // Finish reading
  const handleFinishReading = useCallback(() => {
    if (!startTime || !selectedPassage) return;

    const end = Date.now();
    setEndTime(end);

    // Clear timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Generate questions
    const generatedQuestions = generateSimpleQuestions(selectedPassage, 3);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setAnswers([]);

    setPageState('comprehension');
  }, [startTime, selectedPassage]);

  // Handle answer selection
  const handleSelectAnswer = useCallback(
    (answerIndex: number) => {
      const newAnswers = [...answers, answerIndex];
      setAnswers(newAnswers);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((i) => i + 1);
      } else {
        // Calculate results
        if (!startTime || !endTime || !selectedPassage) return;

        const readingTimeMs = endTime - startTime;
        const wpm = calculateWPM(selectedPassage.wordCount, readingTimeMs);
        const questionsCorrect = newAnswers.filter(
          (a, i) => a === questions[i].correctIndex
        ).length;
        const comprehensionScore = calculateComprehensionScore(
          questionsCorrect,
          questions.length
        );

        // Record result
        const recordedResult = recordSpeedReadingResultWithLevel(
          {
            sessionId: `sr-${Date.now()}`,
            passageId: selectedPassage.id,
            wpm,
            readingTimeMs,
            wordCount: selectedPassage.wordCount,
            comprehensionScore,
            questionsCorrect,
            totalQuestions: questions.length,
          },
          selectedPassage.level
        );

        setResult({
          wpm,
          readingTimeMs,
          comprehensionScore,
          isPersonalBest: recordedResult.isPersonalBest,
          questionsCorrect,
        });
        setPageState('results');
      }
    },
    [answers, currentQuestionIndex, questions, startTime, endTime, selectedPassage]
  );

  // Reset and try again
  const handleTryAgain = useCallback(() => {
    setStartTime(null);
    setEndTime(null);
    setCurrentWPM(0);
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setPageState('ready');
  }, []);

  // Choose different passage
  const handleChooseDifferent = useCallback(() => {
    setSelectedPassage(null);
    setStartTime(null);
    setEndTime(null);
    setCurrentWPM(0);
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setPageState('select');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Speed Reading" titleArabic="القراءة السريعة" showBackButton />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading passages..." />
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Passage selection
  if (pageState === 'select') {
    return (
      <>
        <Header title="Speed Reading" titleArabic="القراءة السريعة" showBackButton />
        <PageContainer>
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-2">
              Speed Reading Practice
            </h1>
            <p className="text-[var(--color-ink-muted)]">
              Develop reading fluency with timed practice and comprehension checks.
            </p>
          </div>

          {/* Stats card */}
          <Card variant="default" padding="md" className="mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[var(--color-primary)]">
                  {stats.bestWPM || '-'}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Best WPM</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-ink)]">
                  {stats.averageWPM || '-'}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Avg WPM</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-success)]">
                  {stats.totalSessions}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Sessions</div>
              </div>
            </div>
          </Card>

          {/* Level filter */}
          <div className="mb-4">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as PassageLevel | 'all')}
              className="w-full px-4 py-2 bg-white border border-[var(--color-sand-200)] rounded-lg text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Passage list */}
          <div className="space-y-3">
            {speedReadingPassages.length === 0 ? (
              <Card variant="outlined" padding="lg" className="text-center">
                <p className="text-[var(--color-ink-muted)]">
                  No passages available for speed reading.
                </p>
              </Card>
            ) : (
              speedReadingPassages.slice(0, 20).map((passage) => {
                const personalBest = getPersonalBest(passage.id);
                return (
                  <button
                    key={passage.id}
                    onClick={() => handleSelectPassage(passage)}
                    className="w-full text-left"
                  >
                    <Card
                      variant="default"
                      padding="md"
                      className="hover:border-[var(--color-primary)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--color-ink)] truncate">
                            {passage.title}
                          </p>
                          <p
                            className="font-arabic text-sm text-[var(--color-ink-muted)] truncate"
                            dir="rtl"
                          >
                            {passage.titleAr}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                passage.level === 'beginner'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[var(--color-success)]'
                                  : passage.level === 'intermediate'
                                  ? 'bg-amber-100 dark:bg-amber-900/50 text-[var(--color-gold)]'
                                  : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              {passage.level}
                            </span>
                            <span className="text-xs text-[var(--color-ink-muted)]">
                              {passage.wordCount} words
                            </span>
                            {personalBest && (
                              <span className="text-xs text-[var(--color-gold)]">
                                PB: {personalBest} WPM
                              </span>
                            )}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-[var(--color-ink-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Card>
                  </button>
                );
              })
            )}
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Ready state
  if (pageState === 'ready' && selectedPassage) {
    const suggestedTarget = getSuggestedTargetWPM(selectedPassage.level);
    const personalBest = getPersonalBest(selectedPassage.id);

    return (
      <>
        <Header title="Speed Reading" titleArabic="القراءة السريعة" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center">
            {/* Passage info */}
            <Card variant="elevated" padding="lg" className="mb-6">
              <h2 className="font-display text-xl font-bold text-[var(--color-ink)] mb-2">
                {selectedPassage.title}
              </h2>
              <p className="font-arabic text-lg text-[var(--color-ink-muted)]" dir="rtl">
                {selectedPassage.titleAr}
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <span
                  className={`px-2 py-1 rounded ${
                    selectedPassage.level === 'beginner'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[var(--color-success)]'
                      : selectedPassage.level === 'intermediate'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-[var(--color-gold)]'
                      : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {selectedPassage.level}
                </span>
                <span className="text-[var(--color-ink-muted)]">
                  {selectedPassage.wordCount} words
                </span>
              </div>
            </Card>

            {/* Target info */}
            <Card variant="default" padding="md" className="mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-[var(--color-primary)]">
                    {suggestedTarget}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    Target WPM
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--color-gold)]">
                    {personalBest || '-'}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    Personal Best
                  </div>
                </div>
              </div>
            </Card>

            {/* Instructions */}
            <p className="text-sm text-[var(--color-ink-muted)] mb-6">
              Read the passage as quickly as you can while maintaining comprehension.
              Click "Done" when finished, then answer comprehension questions.
            </p>

            {/* Start button */}
            <Button variant="primary" size="lg" fullWidth onClick={handleStartReading}>
              Start Reading
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="mt-3"
              onClick={handleChooseDifferent}
            >
              Choose Different Passage
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Reading state
  if (pageState === 'reading' && selectedPassage) {
    return (
      <>
        <Header title="Speed Reading" titleArabic="القراءة السريعة" />
        <PageContainer>
          {/* Timer header */}
          <div className="sticky top-16 z-10 bg-[var(--color-sand-50)] py-3 mb-4 border-b border-[var(--color-sand-200)]">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-primary)]">
                  {currentWPM}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Current WPM</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-[var(--color-ink)]">
                  {formatReadingTime(elapsedMs)}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">Time</div>
              </div>
              <Button variant="success" size="md" onClick={handleFinishReading}>
                Done
              </Button>
            </div>
          </div>

          {/* Passage text */}
          <Card variant="elevated" padding="lg">
            <h3 className="font-display font-semibold text-[var(--color-ink)] mb-2">
              {selectedPassage.title}
            </h3>
            <div
              className="font-arabic text-2xl leading-loose text-[var(--color-ink)]"
              dir="rtl"
            >
              {selectedPassage.text}
            </div>
          </Card>
        </PageContainer>
      </>
    );
  }

  // Comprehension state
  if (pageState === 'comprehension' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <>
        <Header title="Comprehension Check" />
        <PageContainer>
          <div className="max-w-md mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-[var(--color-ink-muted)] mb-2">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              <ProgressBar
                value={((currentQuestionIndex + 1) / questions.length) * 100}
                max={100}
                variant="default"
              />
            </div>

            {/* Question */}
            <Card variant="elevated" padding="lg" className="mb-4">
              <p className="font-medium text-[var(--color-ink)] text-lg mb-6">
                {currentQuestion.question}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className="w-full text-left p-4 rounded-lg border-2 border-[var(--color-sand-200)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    <span className="text-[var(--color-ink)]">{option}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </PageContainer>
      </>
    );
  }

  // Results state
  if (pageState === 'results' && result && selectedPassage) {
    const feedback = getPerformanceFeedback(
      result.wpm,
      selectedPassage.level,
      result.comprehensionScore
    );
    const rating = getWPMRating(result.wpm, selectedPassage.level);

    return (
      <>
        <Header title="Results" />
        <PageContainer>
          <div className="max-w-md mx-auto text-center">
            {/* Personal best banner */}
            {result.isPersonalBest && (
              <div className="mb-6 py-3 px-4 bg-amber-100 dark:bg-amber-900/50 rounded-lg animate-pulse">
                <span className="text-lg font-bold text-[var(--color-gold-dark)]">
                  New Personal Best!
                </span>
              </div>
            )}

            {/* Main result */}
            <Card variant="elevated" padding="lg" className="mb-6">
              <div className="text-6xl font-bold text-[var(--color-primary)] mb-2">
                {result.wpm}
              </div>
              <div className="text-xl text-[var(--color-ink-muted)] mb-4">
                Words Per Minute
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  rating === 'excellent' || rating === 'fast'
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[var(--color-success)]'
                    : rating === 'average'
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-[var(--color-gold)]'
                    : 'bg-[var(--color-sand-200)] text-[var(--color-ink-muted)]'
                }`}
              >
                {rating.charAt(0).toUpperCase() + rating.slice(1)}
              </div>
            </Card>

            {/* Stats */}
            <Card variant="default" padding="md" className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-ink)]">
                    {formatReadingTime(result.readingTimeMs)}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    Reading Time
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      result.comprehensionScore >= 70
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-gold)]'
                    }`}
                  >
                    {result.comprehensionScore}%
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    Comprehension
                  </div>
                </div>
              </div>
            </Card>

            {/* Feedback */}
            <div
              className={`p-4 rounded-lg mb-6 ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : feedback.type === 'good'
                  ? 'bg-amber-100 dark:bg-amber-900/50'
                  : 'bg-[var(--color-sand-200)]'
              }`}
            >
              <p className="text-sm text-[var(--color-ink)]">{feedback.message}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={handleTryAgain}>
                Try Again
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleChooseDifferent}
              >
                Choose Different Passage
              </Button>
              <Button variant="ghost" size="md" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return null;
}

export default SpeedReadingPractice;
