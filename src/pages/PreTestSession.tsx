import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PreTestExercise } from '../components/exercise/PreTestExercise';
import {
  generatePreTestExercises,
  calculatePreTestResult,
  getPreTestFeedback,
  type PreTestExercise as PreTestExerciseType,
  type PreTestItemResult,
  type PreTestResult,
  type VocabItem,
} from '../lib/pretestUtils';
import { getWordsByLesson, getAllWords, type WordData } from '../lib/vocabularyAsync';
import { getLessonMetaForBook } from '../lib/contentStats';

type SessionState = 'intro' | 'exercise' | 'results';

/**
 * Convert WordData to VocabItem for pre-test utilities
 */
function toVocabItem(word: WordData): VocabItem {
  return {
    id: word.id,
    arabic: word.arabic,
    english: word.english,
    root: word.root,
    lesson: word.lesson,
    partOfSpeech: word.partOfSpeech,
  };
}

export function PreTestSession() {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [exercises, setExercises] = useState<PreTestExerciseType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<PreTestItemResult[]>([]);
  const [finalResult, setFinalResult] = useState<PreTestResult | null>(null);

  // Get lesson info
  const lessonMeta = useMemo(() => {
    if (!lessonId) return null;
    const bookNum = parseInt(lessonId.charAt(1), 10);
    const allMeta = getLessonMetaForBook(bookNum);
    return allMeta.find(m => m.id === lessonId) || null;
  }, [lessonId]);

  // Get vocabulary for this lesson
  const lessonVocab = useMemo(() => {
    if (!lessonId) return [];
    return getWordsByLesson(lessonId).map(toVocabItem);
  }, [lessonId]);

  // Get all vocabulary for distractors
  const allVocab = useMemo(() => {
    return getAllWords().map(toVocabItem);
  }, []);

  // Generate exercises when starting
  const handleStartPreTest = useCallback(() => {
    if (lessonVocab.length === 0) {
      navigate(`/lesson/${lessonId}`);
      return;
    }

    const generatedExercises = generatePreTestExercises(lessonVocab, allVocab);
    setExercises(generatedExercises);
    setCurrentIndex(0);
    setResults([]);
    setFinalResult(null);
    setSessionState('exercise');
  }, [lessonVocab, allVocab, lessonId, navigate]);

  // Handle exercise completion
  const handleExerciseComplete = useCallback((result: PreTestItemResult) => {
    const newResults = [...results, result];
    setResults(newResults);

    if (currentIndex < exercises.length - 1) {
      // Move to next exercise
      setCurrentIndex(currentIndex + 1);
    } else {
      // All exercises complete - calculate final result
      const final = calculatePreTestResult(lessonId!, newResults);
      setFinalResult(final);
      setSessionState('results');
      
      // Store completed pre-test in localStorage
      const completedKey = 'completedPreTests';
      const completed = JSON.parse(localStorage.getItem(completedKey) || '[]');
      if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        localStorage.setItem(completedKey, JSON.stringify(completed));
      }
    }
  }, [results, currentIndex, exercises.length, lessonId]);

  // Navigate to lesson after pre-test
  const handleContinueToLesson = useCallback(() => {
    navigate(`/lesson/${lessonId}`);
  }, [navigate, lessonId]);

  // Skip pre-test and go directly to lesson
  const handleSkip = useCallback(() => {
    navigate(`/lesson/${lessonId}`);
  }, [navigate, lessonId]);

  // No lesson ID
  if (!lessonId) {
    return (
      <>
        <Header title="Pre-test" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            <p className="text-[var(--color-ink-muted)]">No lesson selected.</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/practice')}>
              Choose a Lesson
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // No vocabulary for this lesson
  if (lessonVocab.length === 0) {
    return (
      <>
        <Header title="Pre-test" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            <p className="text-[var(--color-ink-muted)]">This lesson has no vocabulary to pre-test.</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate(`/lesson/${lessonId}`)}>
              Go to Lesson
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Intro state
  if (sessionState === 'intro') {
    return (
      <>
        <Header title="Pre-test" titleArabic="اختبار أولي" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-6">
            {/* Lesson info */}
            <Card variant="elevated" padding="lg" className="mb-6 text-center">
              <div className="mb-4">
                <span className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wide">
                  {lessonId?.toUpperCase()}
                </span>
              </div>
              <h1 className="arabic-2xl text-[var(--color-ink)] mb-2" dir="rtl">
                {lessonMeta?.titleArabic || 'Lesson'}
              </h1>
              <p className="text-[var(--color-ink-muted)]">
                {lessonMeta?.titleEnglish || ''}
              </p>
            </Card>

            {/* What is pre-testing */}
            <Card variant="default" padding="lg" className="mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-[var(--color-ink)] mb-2">
                    Prime Your Memory
                  </h2>
                  <p className="text-sm text-[var(--color-ink-muted)] mb-3">
                    Research shows that attempting to answer questions <strong>before</strong> learning 
                    improves retention by 10-20%.
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    You'll see {exercises.length || lessonVocab.length > 6 ? 6 : lessonVocab.length} questions 
                    about vocabulary you haven't learned yet. <strong>It's okay to get them wrong</strong> - 
                    that's the point!
                  </p>
                </div>
              </div>
            </Card>

            {/* Benefits list */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[var(--color-ink)]">Activates prior knowledge</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[var(--color-ink)]">Creates curiosity about correct answers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[var(--color-ink)]">Makes learning more memorable</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                onClick={handleStartPreTest}
              >
                Start Pre-test
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                fullWidth 
                onClick={handleSkip}
              >
                Skip to Lesson
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // Exercise state
  if (sessionState === 'exercise' && exercises.length > 0) {
    const currentExercise = exercises[currentIndex];

    return (
      <>
        <Header title="Pre-test" titleArabic="اختبار أولي" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-4">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)] mb-2">
                <span>Question {currentIndex + 1} of {exercises.length}</span>
                <span>{Math.round(((currentIndex) / exercises.length) * 100)}% complete</span>
              </div>
              <div className="h-2 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)] transition-all duration-300"
                  style={{ width: `${((currentIndex) / exercises.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Exercise */}
            <PreTestExercise
              key={currentExercise.id}
              exercise={currentExercise}
              questionNumber={currentIndex + 1}
              totalQuestions={exercises.length}
              onComplete={handleExerciseComplete}
            />
          </div>
        </PageContainer>
      </>
    );
  }

  // Results state
  if (sessionState === 'results' && finalResult) {
    const feedback = getPreTestFeedback(finalResult);
    const percentage = finalResult.totalQuestions > 0
      ? Math.round((finalResult.totalCorrect / finalResult.totalQuestions) * 100)
      : 0;

    return (
      <>
        <Header title="Pre-test Complete" titleArabic="اكتمل الاختبار" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-6">
            {/* Score display */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg className="w-12 h-12 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
                {feedback.title}
              </h1>
              <p className="text-[var(--color-ink-muted)] mb-4">
                {feedback.message}
              </p>
              <p className="text-sm text-[var(--color-primary)] font-medium">
                {feedback.encouragement}
              </p>
            </div>

            {/* Stats */}
            <Card variant="default" padding="md" className="mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--color-success)]">
                    {finalResult.totalCorrect}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Knew</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-ink)]">
                    {finalResult.failedVocabIds.length}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">To Learn</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {percentage}%
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Score</div>
                </div>
              </div>
            </Card>

            {/* Words to learn */}
            {finalResult.failedVocabIds.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-3">
                  Words primed for learning:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results
                    .filter(r => !r.wasCorrect)
                    .map((r) => (
                      <div
                        key={r.vocabId}
                        className="px-3 py-1.5 bg-[var(--color-sand-100)] rounded-full"
                      >
                        <span className="arabic text-sm text-[var(--color-ink)]">
                          {r.correctAnswer}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Research note */}
            <Card variant="default" padding="md" className="mb-6 bg-indigo-100 dark:bg-indigo-900/50">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-[var(--color-ink)]">
                  <strong>Why this works:</strong> Attempting to retrieve information before learning 
                  creates a "desirable difficulty" that strengthens memory encoding. Your brain is now 
                  primed to pay attention to these words!
                </p>
              </div>
            </Card>

            {/* Continue button */}
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onClick={handleContinueToLesson}
            >
              Continue to Lesson
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Fallback
  return null;
}

export default PreTestSession;
