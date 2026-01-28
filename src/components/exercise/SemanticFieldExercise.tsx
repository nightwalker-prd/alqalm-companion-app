import { useState, useCallback } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { checkSemanticField, getPlacementProgress } from '../../lib/semanticFieldUtils';
import type {
  SemanticFieldExercise as SemanticFieldExerciseType,
  SemanticWord,
  ExerciseState,
} from '../../types/exercise';

interface SemanticFieldExerciseProps {
  exercise: SemanticFieldExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    correctCount?: number;
    totalWords?: number;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
}

/**
 * Semantic Field Exercise Component
 * 
 * Shows categories and words to be sorted into them.
 * Users tap a word then tap a category to place it.
 * Based on research showing that organizing vocabulary by semantic
 * relationships strengthens memory networks.
 */
export function SemanticFieldExercise({
  exercise,
  onComplete,
  showFeedback = true,
}: SemanticFieldExerciseProps) {
  // Map of word arabic -> category id
  const [placements, setPlacements] = useState<Map<string, string>>(() => new Map());
  // Currently selected word (waiting to be placed)
  const [selectedWord, setSelectedWord] = useState<SemanticWord | null>(null);
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof checkSemanticField> | null>(null);
  const [startTime] = useState(() => Date.now());

  // Handle word selection
  const handleWordClick = useCallback((word: SemanticWord) => {
    if (hasSubmitted) return;
    
    // If word is already placed, unplace it
    if (placements.has(word.arabic)) {
      setPlacements(prev => {
        const next = new Map(prev);
        next.delete(word.arabic);
        return next;
      });
      return;
    }
    
    // Toggle selection
    setSelectedWord(prev => prev?.arabic === word.arabic ? null : word);
  }, [hasSubmitted, placements]);

  // Handle category selection (place word)
  const handleCategoryClick = useCallback((categoryId: string) => {
    if (hasSubmitted || !selectedWord) return;
    
    setPlacements(prev => {
      const next = new Map(prev);
      next.set(selectedWord.arabic, categoryId);
      return next;
    });
    setSelectedWord(null);
  }, [hasSubmitted, selectedWord]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (hasSubmitted) return;
    
    const progress = getPlacementProgress(placements, exercise);
    if (progress.placed === 0) return;

    const responseTimeMs = Date.now() - startTime;
    const checkResult = checkSemanticField(placements, exercise);

    setState(checkResult.isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    setResult(checkResult);

    // Format answer as category assignments
    const answerStr = Array.from(placements.entries())
      .map(([word, cat]) => `${word}→${cat}`)
      .join(', ');

    onComplete(checkResult.isCorrect, answerStr, {
      correctCount: checkResult.correctCount,
      totalWords: checkResult.totalWords,
      responseTimeMs,
    });
  }, [placements, hasSubmitted, exercise, onComplete, startTime]);

  const progress = getPlacementProgress(placements, exercise);

  // Get words not yet placed
  const unplacedWords = exercise.words.filter(w => !placements.has(w.arabic));

  // Get words placed in each category
  const getWordsInCategory = (categoryId: string): SemanticWord[] => {
    return exercise.words.filter(w => placements.get(w.arabic) === categoryId);
  };

  return (
    <ExerciseCard type="semantic-field" state={state}>
      <div className="space-y-6">
        {/* Instruction */}
        {exercise.instruction && (
          <p className="text-center text-sm text-[var(--color-ink-muted)]">
            {exercise.instruction}
          </p>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="text-sm text-[var(--color-ink-muted)]">
            {progress.placed} / {progress.total} placed
          </div>
          <div className="flex-1 max-w-32 h-2 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${exercise.categories.length}, 1fr)` }}>
          {exercise.categories.map(category => {
            const wordsInCat = getWordsInCategory(category.id);
            const isSelected = selectedWord !== null;
            
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`
                  min-h-[140px] p-3 rounded-lg border-2 transition-all
                  ${isSelected && !hasSubmitted
                    ? 'border-[var(--color-primary)] cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                    : 'border-[var(--color-border)]'
                  }
                  ${hasSubmitted ? 'cursor-default' : ''}
                `}
              >
                {/* Category header */}
                <div className="text-center mb-3 pb-2 border-b border-[var(--color-border)]">
                  <div className="font-medium text-[var(--color-ink)]">
                    {category.nameEn}
                  </div>
                  <div className="arabic-sm text-[var(--color-ink-muted)]" dir="rtl">
                    {category.nameAr}
                  </div>
                </div>

                {/* Words in this category */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {wordsInCat.map(word => {
                    const wordResult = result?.wordResults.find(r => r.arabic === word.arabic);
                    
                    return (
                      <button
                        key={word.arabic}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWordClick(word);
                        }}
                        disabled={hasSubmitted}
                        className={`
                          px-2 py-1 rounded text-sm transition-all
                          ${hasSubmitted
                            ? wordResult?.isCorrect
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/60'
                          }
                        `}
                      >
                        <span className="arabic">{word.arabic}</span>
                      </button>
                    );
                  })}
                  
                  {/* Empty state */}
                  {wordsInCat.length === 0 && !hasSubmitted && (
                    <div className="text-xs text-[var(--color-ink-muted)] opacity-50 py-4">
                      {isSelected ? 'Tap to place word here' : 'No words yet'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unplaced words */}
        {!hasSubmitted && (
          <div className="space-y-2">
            <div className="text-xs text-center text-[var(--color-ink-muted)]">
              {selectedWord 
                ? `Now tap a category to place "${selectedWord.english}"`
                : 'Tap a word to select it'
              }
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center p-4 bg-[var(--color-sand-100)] rounded-lg min-h-[60px]">
              {unplacedWords.map(word => (
                <button
                  key={word.arabic}
                  onClick={() => handleWordClick(word)}
                  className={`
                    px-3 py-2 rounded-lg transition-all
                    ${selectedWord?.arabic === word.arabic
                      ? 'bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-primary)] ring-offset-2'
                      : 'bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }
                  `}
                >
                  <div className="arabic text-lg">{word.arabic}</div>
                  <div className="text-xs text-[var(--color-ink-muted)]">{word.english}</div>
                </button>
              ))}
              
              {unplacedWords.length === 0 && (
                <div className="text-sm text-emerald-700 dark:text-emerald-300">
                  All words placed! Check your answers.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit button */}
        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            fullWidth
            size="lg"
            disabled={progress.placed === 0}
          >
            Check Categories
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && hasSubmitted && result && (
          <div className="space-y-4">
            {/* Score summary */}
            <div className={`
              text-center p-4 rounded-lg
              ${result.isCorrect 
                ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                : 'bg-rose-100 dark:bg-rose-900/50'
              }
            `}>
              <div className={`
                text-2xl font-bold mb-1
                ${result.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}
              `}>
                {result.correctCount}/{result.totalWords}
              </div>
              <div className="text-sm text-[var(--color-ink-muted)]">
                {result.feedback}
              </div>
            </div>

            {/* Show incorrect placements */}
            {!result.isCorrect && (
              <div className="space-y-2">
                <p className="text-xs text-center text-[var(--color-ink-muted)]">
                  Incorrect placements:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {result.wordResults
                    .filter(r => !r.isCorrect)
                    .map(r => (
                      <div 
                        key={r.arabic}
                        className="px-2 py-1 bg-rose-100 dark:bg-rose-900/50 rounded text-sm"
                      >
                        <span className="arabic">{r.arabic}</span>
                        <span className="text-[var(--color-ink-muted)] mx-1">→</span>
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {exercise.categories.find(c => c.id === r.correctCategory)?.nameEn}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            <ExerciseFeedback
              isCorrect={result.isCorrect}
              correctAnswer={`${result.correctCount}/${result.totalWords} correct`}
              userAnswer={`${result.correctCount} words categorized correctly`}
            />
          </div>
        )}
      </div>
    </ExerciseCard>
  );
}

export default SemanticFieldExercise;
