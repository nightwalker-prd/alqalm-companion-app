import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import type { FluencyItem } from '../../lib/fluencyUtils';

interface FluencyExerciseProps {
  /** Current fluency item to display */
  item: FluencyItem;
  /** Called when user submits an answer */
  onAnswer: (userAnswer: string, responseTimeMs: number) => void;
  /** Whether to show feedback before advancing */
  showFeedback?: boolean;
  /** Last answer result (for feedback) */
  lastResult?: { isCorrect: boolean; correctAnswer: string } | null;
  /** Auto-focus the input */
  autoFocus?: boolean;
}

/**
 * FluencyExercise - A streamlined exercise component for speed rounds
 * 
 * Features:
 * - Minimal UI for fast interaction
 * - Auto-focus on input
 * - Submit on Enter key
 * - Brief feedback flash (correct/incorrect)
 */
export function FluencyExercise({
  item,
  onAnswer,
  showFeedback = false,
  lastResult = null,
  autoFocus = true,
}: FluencyExerciseProps) {
  const [userInput, setUserInput] = useState('');
  const [startTime] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userInput.trim()) return;

    const responseTime = Date.now() - startTime;
    onAnswer(userInput.trim(), responseTime);
    setUserInput('');
  }, [userInput, onAnswer, startTime]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  // Determine if we're showing Arabic or English prompt
  const isArabicPrompt = item.type === 'word-to-meaning';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Feedback overlay */}
      {showFeedback && lastResult && (
        <div 
          className={`
            fixed inset-0 z-50 flex items-center justify-center
            pointer-events-none animate-fade-in
            ${lastResult.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}
          `}
        >
          <div className={`
            text-6xl font-bold
            ${lastResult.isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}
          `}>
            {lastResult.isCorrect ? '✓' : '✗'}
          </div>
        </div>
      )}

      {/* Prompt */}
      <div className="text-center mb-6">
        <p className="text-sm text-[var(--color-ink-muted)] mb-2">
          {isArabicPrompt ? 'What does this mean?' : 'How do you say this in Arabic?'}
        </p>
        <div 
          className={`
            ${isArabicPrompt ? 'arabic-2xl' : 'text-2xl font-medium'}
            text-[var(--color-ink)]
          `}
          dir={isArabicPrompt ? 'rtl' : 'ltr'}
        >
          {item.prompt}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isArabicPrompt ? 'Type the meaning...' : 'اكتب بالعربية...'}
          dir={isArabicPrompt ? 'ltr' : 'rtl'}
          className={`
            w-full px-4 py-3 
            text-center text-xl
            ${!isArabicPrompt ? 'font-arabic' : ''}
            bg-white
            border-2 border-[var(--color-sand-300)]
            rounded-[var(--radius-lg)]
            focus:border-[var(--color-primary)]
            focus:outline-none
            transition-colors
          `}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!userInput.trim()}
        >
          Submit
        </Button>
      </form>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-[var(--color-ink-muted)] mt-3">
        Press <kbd className="px-1.5 py-0.5 bg-[var(--color-sand-200)] rounded text-xs">Enter</kbd> to submit
      </p>
    </div>
  );
}

export default FluencyExercise;
