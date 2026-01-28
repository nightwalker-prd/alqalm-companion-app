import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getAllRecallPrompts,
  checkRecallAttempt,
  canDoFreeRecall,
  getRecallGrade,
  getRecallFeedback,
  getRecallRateColorClass,
  type RecallPrompt,
  type RecallResult,
} from '../lib/freeRecallUtils';

type SessionState = 'select' | 'recall' | 'results';

export function FreeRecallPractice() {
  const navigate = useNavigate();

  // Get available prompts
  const prompts = useMemo(() => getAllRecallPrompts(), []);
  const canStart = canDoFreeRecall();

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('select');
  const [selectedPrompt, setSelectedPrompt] = useState<RecallPrompt | null>(null);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [result, setResult] = useState<RecallResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering recall state
  useEffect(() => {
    if (sessionState === 'recall' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionState]);

  // Select a prompt and start
  const handleSelectPrompt = useCallback((prompt: RecallPrompt) => {
    setSelectedPrompt(prompt);
    setUserInputs([]);
    setCurrentInput('');
    setResult(null);
    setSessionState('recall');
  }, []);

  // Add a word to the list
  const handleAddWord = useCallback(() => {
    if (!currentInput.trim()) return;
    
    // Don't add duplicates
    const normalized = currentInput.trim();
    if (!userInputs.includes(normalized)) {
      setUserInputs(prev => [...prev, normalized]);
    }
    setCurrentInput('');
    inputRef.current?.focus();
  }, [currentInput, userInputs]);

  // Remove a word from the list
  const handleRemoveWord = useCallback((index: number) => {
    setUserInputs(prev => prev.filter((_, i) => i !== index));
    inputRef.current?.focus();
  }, []);

  // Submit and check results
  const handleSubmit = useCallback(() => {
    if (!selectedPrompt) return;
    
    const checkResult = checkRecallAttempt(selectedPrompt, userInputs);
    setResult(checkResult);
    setSessionState('results');
  }, [selectedPrompt, userInputs]);

  // Try again with same prompt
  const handleTryAgain = useCallback(() => {
    setUserInputs([]);
    setCurrentInput('');
    setResult(null);
    setSessionState('recall');
  }, []);

  // Choose different prompt
  const handleChooseDifferent = useCallback(() => {
    setSelectedPrompt(null);
    setUserInputs([]);
    setCurrentInput('');
    setResult(null);
    setSessionState('select');
  }, []);

  // Not enough data state
  if (!canStart) {
    return (
      <>
        <Header title="Free Recall" titleArabic="الاِسْتِرْجَاع" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--color-sand-200)] flex items-center justify-center">
              <svg className="w-12 h-12 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
              Not Enough Practice Yet
            </h1>
            <p className="text-[var(--color-ink-muted)] mb-6">
              Complete some lessons first to unlock free recall practice.
            </p>
            <Button variant="primary" onClick={() => navigate('/practice')}>
              Start Practice
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Selection state
  if (sessionState === 'select') {
    // Group prompts by type
    const lessonPrompts = prompts.filter(p => p.type === 'lesson');
    const rootPrompts = prompts.filter(p => p.type === 'root');

    return (
      <>
        <Header title="Free Recall" titleArabic="الاِسْتِرْجَاع" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-4">
            <div className="text-center mb-6">
              <h1 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-2">
                Test Your Memory
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)]">
                List everything you remember - no hints, just pure recall
              </p>
            </div>

            {/* Lesson prompts */}
            {lessonPrompts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-[var(--color-ink-muted)] mb-3">
                  By Lesson
                </h2>
                <div className="space-y-2">
                  {lessonPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className="w-full text-left"
                    >
                      <Card variant="default" padding="md" className="hover:bg-[var(--color-sand-100)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--color-ink)] truncate">
                              {prompt.label}
                            </div>
                            {prompt.labelArabic && (
                              <div className="font-arabic text-sm text-[var(--color-ink-light)] truncate" dir="rtl">
                                {prompt.labelArabic}
                              </div>
                            )}
                            <div className="text-xs text-[var(--color-ink-muted)]">
                              {prompt.expectedWords.length} words
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-[var(--color-ink-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Root prompts */}
            {rootPrompts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-[var(--color-ink-muted)] mb-3">
                  By Root Family
                </h2>
                <div className="space-y-2">
                  {rootPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className="w-full text-left"
                    >
                      <Card variant="default" padding="md" className="hover:bg-[var(--color-sand-100)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <span className="font-arabic text-sm text-[var(--color-gold-dark)]">
                              {prompt.labelArabic || prompt.id}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-[var(--color-ink)]">
                              {prompt.label}
                            </div>
                            <div className="text-xs text-[var(--color-ink-muted)]">
                              {prompt.expectedWords.length} words
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageContainer>
      </>
    );
  }

  // Recall state - entering words
  if (sessionState === 'recall' && selectedPrompt) {
    return (
      <>
        <Header title="Free Recall" titleArabic="الاِسْتِرْجَاع" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-4">
            {/* Prompt */}
            <Card variant="elevated" padding="lg" className="mb-6">
              <p className="text-center text-[var(--color-ink)]">
                {selectedPrompt.description}
              </p>
              {selectedPrompt.labelArabic && (
                <p className="text-center text-2xl font-arabic mt-2 text-[var(--color-primary)]">
                  {selectedPrompt.labelArabic}
                </p>
              )}
            </Card>

            {/* Input area */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  dir="rtl"
                  lang="ar"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                  placeholder="اكتب كلمة"
                  className="flex-1 p-3 text-xl text-center arabic border-2 border-[var(--color-sand-300)] rounded-[var(--radius-lg)] focus:border-[var(--color-primary)] focus:outline-none"
                  autoFocus
                />
                <Button
                  variant="secondary"
                  onClick={handleAddWord}
                  disabled={!currentInput.trim()}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] mt-2 text-center">
                Press Enter or click Add after each word
              </p>
            </div>

            {/* Words entered */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-ink-muted)]">
                  Words recalled: {userInputs.length}
                </span>
                <span className="text-sm text-[var(--color-ink-muted)]">
                  Target: {selectedPrompt.expectedWords.length}
                </span>
              </div>
              
              {userInputs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userInputs.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => handleRemoveWord(index)}
                      className="group flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-[var(--color-primary)] rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
                    >
                      <span className="arabic text-lg">{word}</span>
                      <svg className="w-4 h-4 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-ink-muted)] text-sm">
                  Start typing words you remember
                </div>
              )}
            </div>

            {/* Submit button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmit}
            >
              {userInputs.length > 0 ? "Check My Recall" : "I can't remember any"}
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // Results state
  if (sessionState === 'results' && result && selectedPrompt) {
    const grade = getRecallGrade(result.recallRate);
    const feedback = getRecallFeedback(result.recallRate);
    const colorClass = getRecallRateColorClass(result.recallRate);
    const percentage = Math.round(result.recallRate * 100);

    return (
      <>
        <Header title="Free Recall" titleArabic="الاِسْتِرْجَاع" showBackButton />
        <PageContainer>
          <div className="max-w-md mx-auto py-4">
            {/* Score display */}
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold ${colorClass}`}>
                {grade}
              </div>
              <div className="text-xl text-[var(--color-ink-muted)] mt-1">
                {percentage}% Recalled
              </div>
              <p className="text-sm text-[var(--color-ink)] mt-3">
                {feedback}
              </p>
            </div>

            {/* Stats */}
            <Card variant="default" padding="md" className="mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--color-success)]">
                    {result.recalled.length}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Recalled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-error)]">
                    {result.forgotten.length}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Forgotten</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-ink)]">
                    {selectedPrompt.expectedWords.length}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Total</div>
                </div>
              </div>
            </Card>

            {/* Recalled words */}
            {result.recalled.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[var(--color-success)] mb-2">
                  Recalled ({result.recalled.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.recalled.map((word) => (
                    <div
                      key={word.id}
                      className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-[var(--color-success)] rounded-full text-sm"
                    >
                      <span className="arabic">{word.arabic}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forgotten words */}
            {result.forgotten.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[var(--color-error)] mb-2">
                  Forgotten ({result.forgotten.length})
                </h3>
                <div className="space-y-2">
                  {result.forgotten.map((word) => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between px-3 py-2 bg-rose-50 dark:bg-rose-900/30 rounded-[var(--radius-md)]"
                    >
                      <span className="arabic text-lg text-[var(--color-ink)]">{word.arabic}</span>
                      <span className="text-sm text-[var(--color-ink-muted)]">{word.english}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra words */}
            {result.extra.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                  Extra words entered ({result.extra.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.extra.map((word, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-[var(--color-sand-200)] text-[var(--color-ink-muted)] rounded-full text-sm"
                    >
                      <span className="arabic">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={handleTryAgain}>
                Try Again
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={handleChooseDifferent}>
                Choose Different Topic
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

export default FreeRecallPractice;
