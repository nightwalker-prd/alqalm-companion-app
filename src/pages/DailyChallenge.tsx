/**
 * Daily Challenge Page
 * 
 * Quick 5-minute mixed practice session with streak tracking.
 * Combines due words, weakness-targeted exercises, and random practice.
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Confetti } from '../components/ui/Confetti';
import { useAchievementContext } from '../contexts/AchievementContext';
import {
  loadDailyChallengeState,
  isTodayCompleted,
  completeDailyChallenge,
  getDueWordIds,
  getWeaknessWordIds,
  saveSessionProgress,
  clearSavedSession,
  hasResumableSession,
  type DailyChallengeState,
} from '../lib/dailyChallengeService';
import { getWordById, getAllWords, type WordData } from '../lib/vocabularyAsync';
import { fisherYatesShuffle } from '../lib/interleave';

type SessionState = 'menu' | 'playing' | 'complete';

interface ChallengeQuestion {
  word: WordData;
  type: 'ar-to-en' | 'en-to-ar';
  options: string[];
  correctAnswer: string;
}

interface ChallengeAnswer {
  question: ChallengeQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  timeMs: number;
}

const QUESTION_COUNT = 10;

export function DailyChallenge() {
  const [sessionState, setSessionState] = useState<SessionState>('menu');
  const [challengeState, setChallengeState] = useState<DailyChallengeState>(loadDailyChallengeState);
  const [isCompleted, setIsCompleted] = useState(isTodayCompleted);
  const [hasResumeOption, setHasResumeOption] = useState(hasResumableSession);
  
  // Game state
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ChallengeAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { recordPractice } = useAchievementContext();

  // Generate questions
  const generateQuestions = useCallback(async () => {
    // Get word IDs from different sources
    const dueWordIds = getDueWordIds(4);
    const weaknessWordIds = getWeaknessWordIds(3);
    
    // Combine and dedupe
    let allWordIds = [...new Set([...dueWordIds, ...weaknessWordIds])];
    
    // If not enough targeted words, fill with random vocabulary
    if (allWordIds.length < QUESTION_COUNT) {
      const allVocab = getAllWords();
      const randomWords = fisherYatesShuffle(allVocab)
        .filter(w => !allWordIds.includes(w.id))
        .slice(0, QUESTION_COUNT - allWordIds.length)
        .map(w => w.id);
      allWordIds = [...allWordIds, ...randomWords];
    }
    
    // Shuffle and take what we need
    const selectedIds = fisherYatesShuffle(allWordIds).slice(0, QUESTION_COUNT);
    
    // Load word data
    const words: WordData[] = [];
    for (const id of selectedIds) {
      const word = await getWordById(id);
      if (word) words.push(word);
    }
    
    if (words.length < 3) {
      // Not enough words - show error state
      console.error('Not enough words for daily challenge');
      return;
    }
    
    // Generate questions
    const generated: ChallengeQuestion[] = words.map((word, i) => {
      // Alternate between ar-to-en and en-to-ar
      const type: 'ar-to-en' | 'en-to-ar' = i % 2 === 0 ? 'ar-to-en' : 'en-to-ar';
      
      // Get wrong options from other words
      const otherWords = words.filter(w => w.id !== word.id);
      const wrongOptions = fisherYatesShuffle(otherWords)
        .slice(0, 3)
        .map(w => type === 'ar-to-en' ? w.english : w.arabic);
      
      const correctAnswer = type === 'ar-to-en' ? word.english : word.arabic;
      const options = fisherYatesShuffle([correctAnswer, ...wrongOptions]);
      
      return {
        word,
        type,
        options,
        correctAnswer,
      };
    });
    
    setQuestions(fisherYatesShuffle(generated));
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionStartTime(Date.now());
    setSessionState('playing');
  }, []);

  // Handle answer selection
  const handleAnswer = useCallback((answer: string) => {
    if (showFeedback) return;
    
    const timeMs = Date.now() - questionStartTime;
    const question = questions[currentIndex];
    const isCorrect = answer === question.correctAnswer;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    // Use functional update to avoid dependency on `answers`
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers, {
        question,
        selectedAnswer: answer,
        isCorrect,
        timeMs,
      }];
      
      // Save progress with updated answers
      saveSessionProgress({
        date: new Date().toISOString().split('T')[0],
        questionWordIds: questions.map(q => q.word.id),
        currentIndex: currentIndex,
        answers: newAnswers.map(a => ({
          wordId: a.question.word.id,
          isCorrect: a.isCorrect,
        })),
      });
      
      return newAnswers;
    });
  }, [showFeedback, questionStartTime, questions, currentIndex]);

  // Next question
  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      // Session complete
      const finalAnswers = answers;
      const correct = finalAnswers.filter(a => a.isCorrect).length;
      
      // Mark challenge as completed
      const newState = completeDailyChallenge();
      setChallengeState(newState);
      setIsCompleted(true);
      
      // Record for achievements
      recordPractice({
        exerciseCount: finalAnswers.length,
        correctCount: correct,
        isPerfect: correct === finalAnswers.length,
      });
      
      // Trigger celebration!
      setShowConfetti(true);
      
      // Clear saved session
      clearSavedSession();
      setHasResumeOption(false);
      
      setSessionState('complete');
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, questions.length, answers, recordPractice]);

  // Current question
  const currentQuestion = questions[currentIndex];

  // Session stats
  const sessionStats = useMemo(() => {
    const correct = answers.filter(a => a.isCorrect).length;
    return {
      correct,
      total: answers.length,
      accuracy: answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0,
    };
  }, [answers]);

  // Menu screen
  if (sessionState === 'menu') {
    return (
      <>
        <Header title="Daily Challenge" showBackButton />
        <PageContainer>
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-4xl mb-2">🎯</h1>
              <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">Daily Challenge</h2>
              <p className="text-[var(--color-ink-muted)]">
                {QUESTION_COUNT} quick questions to keep your skills sharp
              </p>
            </div>

            {/* Streak Card */}
            <Card className="p-6 text-center">
              <div className="text-5xl mb-2">🔥</div>
              <div className="text-3xl font-bold text-[var(--color-ink)] mb-1">
                {challengeState.streak} day{challengeState.streak !== 1 ? 's' : ''}
              </div>
              <p className="text-[var(--color-ink-muted)]">Current streak</p>
              {challengeState.totalCompleted > 0 && (
                <p className="text-sm text-[var(--color-ink-muted)] mt-2">
                  {challengeState.totalCompleted} total challenges completed
                </p>
              )}
            </Card>

            {/* Status */}
            {isCompleted ? (
              <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-200">
                      Today's challenge complete!
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Come back tomorrow to keep your streak
                    </p>
                  </div>
                </div>
              </Card>
            ) : hasResumeOption ? (
              <div className="space-y-3">
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        You have an unfinished challenge
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Pick up where you left off
                      </p>
                    </div>
                  </div>
                </Card>
                <Button onClick={generateQuestions} className="w-full py-4 text-lg">
                  Resume Challenge
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    clearSavedSession();
                    setHasResumeOption(false);
                    generateQuestions();
                  }} 
                  className="w-full"
                >
                  Start Fresh
                </Button>
              </div>
            ) : (
              <Button onClick={generateQuestions} className="w-full py-4 text-lg">
                Start Today's Challenge
              </Button>
            )}

            {/* Practice more option */}
            {isCompleted && (
              <Button
                variant="secondary"
                onClick={generateQuestions}
                className="w-full"
              >
                Practice Again (won't affect streak)
              </Button>
            )}

            <Link to="/">
              <Button variant="secondary" className="w-full">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Playing screen
  if (sessionState === 'playing' && currentQuestion) {
    return (
      <>
        <Header title="Daily Challenge" />
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
              <div className="text-sm text-[var(--color-ink-muted)] mb-2">
                {currentQuestion.type === 'ar-to-en' 
                  ? 'What does this mean?' 
                  : 'How do you say this in Arabic?'}
              </div>
              <div 
                className={`text-4xl mb-2 ${
                  currentQuestion.type === 'ar-to-en' ? 'font-arabic' : ''
                }`}
                dir={currentQuestion.type === 'ar-to-en' ? 'rtl' : 'ltr'}
              >
                {currentQuestion.type === 'ar-to-en' 
                  ? currentQuestion.word.arabic 
                  : currentQuestion.word.english}
              </div>
              {currentQuestion.word.root && (
                <div className="text-sm text-[var(--color-ink-muted)]">
                  Root: <span className="font-arabic">{currentQuestion.word.root}</span>
                </div>
              )}
            </Card>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const isArabic = currentQuestion.type === 'en-to-ar';
                
                let className = 'w-full p-4 rounded-xl text-center transition-all border-2 ';
                
                if (showFeedback) {
                  if (isCorrect) {
                    className += 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100';
                  } else if (isSelected) {
                    className += 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-100';
                  } else {
                    className += 'bg-[var(--color-sand-50)] border-[var(--color-sand-200)] text-[var(--color-ink-muted)]';
                  }
                } else {
                  className += 'bg-white dark:bg-[var(--color-sand-50)] border-[var(--color-sand-200)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:scale-[0.98]';
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    disabled={showFeedback}
                    className={className}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    <span className={isArabic ? 'font-arabic text-xl' : 'text-lg'}>
                      {option}
                    </span>
                    {showFeedback && isCorrect && (
                      <span className="ml-2">✓</span>
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <span className="ml-2">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            {showFeedback && (
              <Button onClick={handleNext} className="w-full py-4 text-lg">
                {currentIndex + 1 >= questions.length ? 'See Results' : 'Next →'}
              </Button>
            )}
          </div>
        </PageContainer>
      </>
    );
  }

  // Complete screen
  if (sessionState === 'complete') {
    const correct = answers.filter(a => a.isCorrect).length;
    const total = answers.length;
    const accuracy = Math.round((correct / total) * 100);
    
    return (
      <>
        <Confetti isActive={showConfetti} />
        <Header title="Challenge Complete!" showBackButton />
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
              
              {/* Streak update */}
              <div className="pt-4 border-t border-[var(--color-sand-200)]">
                <div className="text-3xl mb-1">🔥</div>
                <div className="text-2xl font-bold text-[var(--color-ink)]">
                  {challengeState.streak} day streak!
                </div>
                {challengeState.streak > 1 && (
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    Keep it going tomorrow!
                  </p>
                )}
              </div>
            </Card>

            {/* Review wrong answers */}
            {answers.some(a => !a.isCorrect) && (
              <Card className="p-4">
                <h2 className="font-semibold text-[var(--color-ink)] mb-3">Review Mistakes</h2>
                <div className="space-y-3">
                  {answers.filter(a => !a.isCorrect).map((answer, i) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-arabic text-xl text-center mb-1" dir="rtl">
                        {answer.question.word.arabic}
                      </div>
                      <div className="text-sm text-center text-red-700 dark:text-red-300">
                        <span className="line-through">{answer.selectedAnswer}</span>
                        {' → '}
                        <span className="font-medium">{answer.question.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Link to="/">
                <Button className="w-full py-4">
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  generateQuestions();
                }}
                className="w-full"
              >
                Practice Again
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

export default DailyChallenge;
