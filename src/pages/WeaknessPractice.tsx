import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  analyzeWeaknesses,
  generateWeaknessPractice,
  getErrorTypeLabel,
  getSeverityColorClass,
  type Weakness,
  type WeaknessPracticeItem,
} from '../lib/weaknessAnalysis';
import { normalizeArabic } from '../lib/arabic';
import type { ArabicErrorType } from '../types/progress';

type SessionState = 'select' | 'active' | 'feedback' | 'complete';

interface AnswerRecord {
  item: WeaknessPracticeItem;
  userAnswer: string;
  isCorrect: boolean;
}

export function WeaknessPractice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as ArabicErrorType | null;

  // Get weakness report
  const report = useMemo(() => analyzeWeaknesses(), []);

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>(typeParam ? 'active' : 'select');
  const [selectedWeakness, setSelectedWeakness] = useState<Weakness | null>(() => {
    if (typeParam) {
      return report.topWeaknesses.find(w => w.type === typeParam) || null;
    }
    return null;
  });
  const [items, setItems] = useState<WeaknessPracticeItem[]>(() => {
    if (typeParam) {
      const weakness = report.topWeaknesses.find(w => w.type === typeParam);
      return weakness ? generateWeaknessPractice(weakness) : [];
    }
    return [];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [userInput, setUserInput] = useState('');
  const [lastAnswer, setLastAnswer] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);

  // Select a weakness and start practice
  const handleSelectWeakness = useCallback((weakness: Weakness) => {
    const practiceItems = generateWeaknessPractice(weakness);
    setSelectedWeakness(weakness);
    setItems(practiceItems);
    setCurrentIndex(0);
    setAnswers([]);
    setUserInput('');
    setLastAnswer(null);
    setSessionState('active');
  }, []);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    const currentItem = items[currentIndex];
    if (!currentItem || !userInput.trim()) return;

    const normalizedUser = normalizeArabic(userInput);
    const normalizedExpected = normalizeArabic(currentItem.arabic);
    const isCorrect = normalizedUser === normalizedExpected;

    // Note: We don't record to main progress here - this is focused practice
    // The user will continue to practice these words in regular sessions

    // Save answer record
    const record: AnswerRecord = {
      item: currentItem,
      userAnswer: userInput,
      isCorrect,
    };
    setAnswers(prev => [...prev, record]);
    setLastAnswer({ isCorrect, correctAnswer: currentItem.arabic });
    setSessionState('feedback');
  }, [items, currentIndex, userInput]);

  // Move to next item or complete
  const handleNext = useCallback(() => {
    setUserInput('');
    setLastAnswer(null);

    if (currentIndex + 1 < items.length) {
      setCurrentIndex(i => i + 1);
      setSessionState('active');
    } else {
      setSessionState('complete');
    }
  }, [currentIndex, items.length]);

  // Restart session
  const handleRestart = useCallback(() => {
    if (selectedWeakness) {
      const practiceItems = generateWeaknessPractice(selectedWeakness);
      setItems(practiceItems);
      setCurrentIndex(0);
      setAnswers([]);
      setUserInput('');
      setLastAnswer(null);
      setSessionState('active');
    }
  }, [selectedWeakness]);

  // Current item
  const currentItem = items[currentIndex];

  // Calculate results
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalCount = answers.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // No weaknesses to practice
  if (!report.hasEnoughData || report.topWeaknesses.length === 0) {
    return (
      <>
        <Header title="Weakness Practice" titleArabic="تَدْرِيب الضَّعْف" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <svg className="w-12 h-12 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
              No Weaknesses Detected
            </h1>
            <p className="text-[var(--color-ink-muted)] mb-6">
              {report.hasEnoughData
                ? "You're doing great! No significant error patterns found."
                : "Keep practicing to identify areas for improvement."}
            </p>
            <Button variant="primary" onClick={() => navigate('/practice')}>
              Continue Practice
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Selection state
  if (sessionState === 'select') {
    return (
      <>
        <Header title="Weakness Practice" titleArabic="تَدْرِيب الضَّعْف" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-4">
            <div className="text-center mb-6">
              <h1 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-2">
                Deliberate Practice
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Target your specific weaknesses with focused practice
              </p>
            </div>

            <div className="space-y-3">
              {report.topWeaknesses.map((weakness) => (
                <button
                  key={weakness.type}
                  onClick={() => handleSelectWeakness(weakness)}
                  className="w-full text-left"
                >
                  <Card variant="default" padding="md" className="hover:bg-[var(--color-sand-100)] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getSeverityBgClass(weakness.severity)}`}>
                        <svg className={`w-6 h-6 ${getSeverityColorClass(weakness.severity)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${getSeverityColorClass(weakness.severity)}`}>
                          {getErrorTypeLabel(weakness.type)}
                        </div>
                        <p className="text-sm text-[var(--color-ink-muted)] line-clamp-1">
                          {weakness.description}
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {weakness.count} errors &middot; {weakness.affectedWordIds.length} words
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // Active state - answering
  if ((sessionState === 'active' || sessionState === 'feedback') && currentItem && selectedWeakness) {
    return (
      <>
        <Header title="Weakness Practice" titleArabic="تَدْرِيب الضَّعْف" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-4">
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-[var(--color-ink-muted)]">
                {currentIndex + 1} / {items.length}
              </span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${getSeverityBgClass(selectedWeakness.severity)} ${getSeverityColorClass(selectedWeakness.severity)}`}>
                {getErrorTypeLabel(selectedWeakness.type)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[var(--color-sand-200)] rounded-full mb-8">
              <div 
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
              />
            </div>

            {/* Instruction */}
            <div className="text-center mb-4">
              <p className="text-sm text-[var(--color-ink-muted)]">
                {currentItem.instruction}
              </p>
            </div>

            {/* English prompt */}
            <Card variant="default" padding="lg" className="mb-6">
              <p className="text-xl text-center text-[var(--color-ink)]">
                {currentItem.english}
              </p>
            </Card>

            {/* Input or feedback */}
            {sessionState === 'active' ? (
              <>
                <input
                  type="text"
                  dir="rtl"
                  lang="ar"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="اكتب الجواب هنا"
                  className="w-full p-4 text-2xl text-center arabic border-2 border-[var(--color-sand-300)] rounded-[var(--radius-lg)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                  autoFocus
                />
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={!userInput.trim()}
                  className="mt-4"
                >
                  Check Answer
                </Button>
              </>
            ) : (
              <>
                {/* Feedback display */}
                <div className={`p-4 rounded-[var(--radius-lg)] mb-4 ${
                  lastAnswer?.isCorrect
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-rose-100 dark:bg-rose-900/50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {lastAnswer?.isCorrect ? (
                      <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-medium ${
                      lastAnswer?.isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                    }`}>
                      {lastAnswer?.isCorrect ? 'Correct!' : 'Not quite'}
                    </span>
                  </div>
                  
                  {!lastAnswer?.isCorrect && (
                    <div className="mt-3">
                      <p className="text-sm text-[var(--color-ink-muted)] mb-1">Correct answer:</p>
                      <p className="text-2xl arabic text-center text-[var(--color-ink)]">
                        {lastAnswer?.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleNext}
                >
                  {currentIndex + 1 < items.length ? 'Next' : 'See Results'}
                </Button>
              </>
            )}
          </div>
        </PageContainer>
      </>
    );
  }

  // Complete state
  if (sessionState === 'complete' && selectedWeakness) {
    return (
      <>
        <Header title="Weakness Practice" titleArabic="تَدْرِيب الضَّعْف" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            {/* Result icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              accuracy >= 80
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : accuracy >= 50
                  ? 'bg-amber-100 dark:bg-amber-900/50'
                  : 'bg-rose-100 dark:bg-rose-900/50'
            }`}>
              {accuracy >= 80 ? (
                <svg className="w-12 h-12 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
              Practice Complete
            </h1>
            <p className="text-[var(--color-ink-muted)] mb-6">
              {getErrorTypeLabel(selectedWeakness.type)}
            </p>

            {/* Stats */}
            <Card variant="default" padding="lg" className="mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--color-primary)]">
                    {accuracy}%
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--color-ink)]">
                    {correctCount}/{totalCount}
                  </div>
                  <div className="text-sm text-[var(--color-ink-muted)]">Correct</div>
                </div>
              </div>
            </Card>

            {/* Advice */}
            <Card variant="default" padding="md" className="mb-6 text-left">
              <p className="text-sm text-[var(--color-ink)]">
                <span className="font-medium">Tip: </span>
                {selectedWeakness.advice}
              </p>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={handleRestart}>
                Practice Again
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setSessionState('select')}>
                Choose Different Weakness
              </Button>
              <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/')}>
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

/**
 * Get background color class for severity
 */
function getSeverityBgClass(severity: 'mild' | 'moderate' | 'severe'): string {
  switch (severity) {
    case 'severe':
      return 'bg-rose-100 dark:bg-rose-900/50';
    case 'moderate':
      return 'bg-amber-100 dark:bg-amber-900/50';
    case 'mild':
      return 'bg-[var(--color-sand-200)]';
  }
}

export default WeaknessPractice;
