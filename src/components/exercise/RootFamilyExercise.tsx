import { useState, useCallback, useMemo } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '../ui/Button';
import { ExerciseFeedback } from './ExerciseFeedback';
import { ConfidenceRating } from './ConfidenceRating';
import { fisherYatesShuffle } from '../../lib/interleave';
import type { SarfWord, RootFamily } from '../../types/morphology';
import type { ExerciseState } from '../../types/exercise';
import type { ConfidenceLevel } from '../../types/progress';

/**
 * Exercise type for root-family learning.
 * - 'match-meanings': Given a word from the family, select the correct meaning
 * - 'identify-root': Given a word, type/select the root letters
 * - 'family-builder': Given the root, select which words belong to it
 */
export type RootFamilyExerciseType = 
  | 'match-meanings' 
  | 'identify-root' 
  | 'family-builder';

export interface RootFamilyExerciseData {
  id: string;
  type: RootFamilyExerciseType;
  family: RootFamily;
  /** Target word for match-meanings and identify-root */
  targetWord?: SarfWord;
  /** Options for multiple choice */
  options?: string[];
  /** Correct answer */
  answer: string;
  /** For family-builder: words that ARE from this family */
  correctWords?: SarfWord[];
  /** For family-builder: distractor words NOT from this family */
  distractorWords?: SarfWord[];
}

interface RootFamilyExerciseProps {
  exercise: RootFamilyExerciseData;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    confidence?: ConfidenceLevel;
    generatedWithoutHints?: boolean;
    responseTimeMs?: number;
  }) => void;
  showFeedback?: boolean;
  /** Enable confidence rating before revealing result */
  enableConfidence?: boolean;
}

/**
 * Display the three-letter root with proper styling
 */
function RootDisplay({ letters, size = 'lg' }: { letters: string[]; size?: 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    md: 'text-xl gap-2',
    lg: 'text-2xl gap-3',
    xl: 'text-3xl gap-4',
  };

  return (
    <div className={`flex items-center justify-center font-arabic ${sizeClasses[size]}`} dir="rtl">
      {letters.map((letter, idx) => (
        <span
          key={idx}
          className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg border border-[var(--color-primary)] border-opacity-50"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

/**
 * Category badge for word type
 */
function CategoryBadge({ category }: { category: string }) {
  const categoryLabels: Record<string, string> = {
    'verb': 'Verb',
    'masdar': 'Masdar',
    'active-participle': 'Doer',
    'passive-participle': 'Done',
    'noun': 'Noun',
    'adjective': 'Adj',
  };

  const categoryColors: Record<string, string> = {
    'verb': 'bg-blue-100 text-blue-700',
    'masdar': 'bg-purple-100 text-purple-700',
    'active-participle': 'bg-green-100 text-green-700',
    'passive-participle': 'bg-orange-100 text-orange-700',
    'noun': 'bg-amber-100 text-amber-700',
    'adjective': 'bg-pink-100 text-pink-700',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[category] || 'bg-gray-100 text-gray-700'}`}>
      {categoryLabels[category] || category}
    </span>
  );
}

export function RootFamilyExercise({
  exercise,
  onComplete,
  showFeedback = true,
  enableConfidence = false,
}: RootFamilyExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Confidence rating state
  const [awaitingConfidence, setAwaitingConfidence] = useState(false);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    isCorrect: boolean;
    userAnswer: string;
  } | null>(null);

  // Shuffle options for multiple choice
  const shuffledOptions = useMemo(() => {
    if (!exercise.options) return [];
    return fisherYatesShuffle([...exercise.options]);
  }, [exercise.options]);

  // Shuffle words for family-builder
  const shuffledWords = useMemo(() => {
    if (exercise.type !== 'family-builder') return [];
    const allWords = [
      ...(exercise.correctWords || []),
      ...(exercise.distractorWords || []),
    ];
    return fisherYatesShuffle(allWords);
  }, [exercise.type, exercise.correctWords, exercise.distractorWords]);

  // Note: Parent should use key={exercise.id} to reset this component between exercises

  const finalizeAnswer = useCallback((
    isCorrect: boolean,
    answer: string,
    confidence?: ConfidenceLevel
  ) => {
    const responseTimeMs = Date.now() - startTime;
    setState(isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    onComplete(isCorrect, answer, {
      confidence,
      responseTimeMs,
    });
  }, [onComplete, startTime]);

  const handleOptionSelect = useCallback((option: string) => {
    if (hasSubmitted || awaitingConfidence) return;
    setSelectedOption(option);
  }, [hasSubmitted, awaitingConfidence]);

  const handleWordToggle = useCallback((wordId: string) => {
    if (hasSubmitted || awaitingConfidence) return;
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }, [hasSubmitted, awaitingConfidence]);

  const handleSubmit = useCallback(() => {
    if (hasSubmitted || awaitingConfidence) return;

    let isCorrect = false;
    let userAnswer = '';

    if (exercise.type === 'match-meanings' || exercise.type === 'identify-root') {
      if (!selectedOption) return;
      userAnswer = selectedOption;
      isCorrect = selectedOption === exercise.answer;
    } else if (exercise.type === 'family-builder') {
      const correctIds = new Set((exercise.correctWords || []).map(w => String(w.id)));
      const selectedCorrect = [...selectedWords].filter(id => correctIds.has(id)).length;
      const selectedWrong = [...selectedWords].filter(id => !correctIds.has(id)).length;
      
      // Correct if all correct words selected and no wrong ones
      isCorrect = selectedCorrect === correctIds.size && selectedWrong === 0;
      userAnswer = [...selectedWords].join(',');
    }

    // If confidence is enabled, wait for rating
    if (enableConfidence) {
      setAwaitingConfidence(true);
      setPendingResult({ isCorrect, userAnswer });
      return;
    }

    finalizeAnswer(isCorrect, userAnswer);
  }, [
    hasSubmitted,
    awaitingConfidence,
    exercise.type,
    exercise.answer,
    exercise.correctWords,
    selectedOption,
    selectedWords,
    enableConfidence,
    finalizeAnswer,
  ]);

  const handleConfidenceSelect = useCallback((confidence: ConfidenceLevel) => {
    setSelectedConfidence(confidence);
    
    if (pendingResult) {
      setTimeout(() => {
        finalizeAnswer(pendingResult.isCorrect, pendingResult.userAnswer, confidence);
        setAwaitingConfidence(false);
      }, 300);
    }
  }, [pendingResult, finalizeAnswer]);

  const canSubmit = exercise.type === 'family-builder' 
    ? selectedWords.size > 0 
    : selectedOption !== null;

  // Get explanation for feedback
  const getFeedbackMessage = () => {
    if (exercise.type === 'match-meanings' && exercise.targetWord) {
      return `${exercise.targetWord.word} comes from the root ${exercise.family.root} which means "${exercise.family.coreMeaning}"`;
    }
    if (exercise.type === 'identify-root' && exercise.targetWord) {
      return `The root ${exercise.family.root} (${exercise.family.rootLetters.join('-')}) gives us words related to "${exercise.family.coreMeaning}"`;
    }
    return `This root family is based on ${exercise.family.root}`;
  };

  return (
    <ExerciseCard type="word-to-meaning" state={state}>
      <div className="space-y-6">
        {/* Root family header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full mb-3">
            Root Family
          </span>
          
          <RootDisplay letters={exercise.family.rootLetters} size="xl" />
          
          <p className="text-sm text-[var(--color-ink-muted)] mt-2">
            Core meaning: <span className="font-medium text-[var(--color-ink)]">{exercise.family.coreMeaning}</span>
          </p>
        </div>

        {/* Match-meanings: show target word, select meaning */}
        {exercise.type === 'match-meanings' && exercise.targetWord && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-block px-6 py-4 bg-[var(--color-sand-100)] rounded-lg border border-[var(--color-sand-200)]">
                <p className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
                  {exercise.targetWord.word}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <CategoryBadge category={exercise.targetWord.category} />
                  {exercise.targetWord.verbForm && (
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      Form {exercise.targetWord.verbForm}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mt-3">
                What does this word mean?
              </p>
            </div>

            <div className="grid gap-2">
              {shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={hasSubmitted || awaitingConfidence}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border-2 transition-all
                    ${selectedOption === option
                      ? 'border-[var(--color-primary)] bg-indigo-100 dark:bg-indigo-900/50'
                      : 'border-[var(--color-sand-200)] hover:border-[var(--color-sand-300)]'
                    }
                    ${hasSubmitted && option === exercise.answer ? 'border-[var(--color-success)] bg-[var(--color-success-light)]' : ''}
                    ${hasSubmitted && selectedOption === option && option !== exercise.answer ? 'border-[var(--color-error)] bg-[var(--color-error-light)]' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Identify-root: show word, select root */}
        {exercise.type === 'identify-root' && exercise.targetWord && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-block px-6 py-4 bg-[var(--color-sand-100)] rounded-lg border border-[var(--color-sand-200)]">
                <p className="arabic-2xl text-[var(--color-ink)]" dir="rtl">
                  {exercise.targetWord.word}
                </p>
                <p className="text-sm text-[var(--color-ink-muted)] mt-2">
                  {exercise.targetWord.meaning}
                </p>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mt-3">
                What is the root of this word?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={hasSubmitted || awaitingConfidence}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all
                    font-arabic text-lg text-center
                    ${selectedOption === option
                      ? 'border-[var(--color-primary)] bg-indigo-100 dark:bg-indigo-900/50'
                      : 'border-[var(--color-sand-200)] hover:border-[var(--color-sand-300)]'
                    }
                    ${hasSubmitted && option === exercise.answer ? 'border-[var(--color-success)] bg-[var(--color-success-light)]' : ''}
                    ${hasSubmitted && selectedOption === option && option !== exercise.answer ? 'border-[var(--color-error)] bg-[var(--color-error-light)]' : ''}
                    disabled:cursor-not-allowed
                  `}
                  dir="rtl"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Family-builder: select all words from the family */}
        {exercise.type === 'family-builder' && (
          <div className="space-y-4">
            <p className="text-center text-sm text-[var(--color-ink-muted)]">
              Select all words that come from this root:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {shuffledWords.map((word) => {
                const wordId = String(word.id);
                const isSelected = selectedWords.has(wordId);
                const isCorrect = (exercise.correctWords || []).some(w => String(w.id) === wordId);
                
                return (
                  <button
                    key={word.id}
                    onClick={() => handleWordToggle(wordId)}
                    disabled={hasSubmitted || awaitingConfidence}
                    className={`
                      px-3 py-3 rounded-lg border-2 transition-all text-center
                      ${isSelected
                        ? 'border-[var(--color-primary)] bg-indigo-100 dark:bg-indigo-900/50'
                        : 'border-[var(--color-sand-200)] hover:border-[var(--color-sand-300)]'
                      }
                      ${hasSubmitted && isCorrect ? 'border-[var(--color-success)] bg-[var(--color-success-light)]' : ''}
                      ${hasSubmitted && isSelected && !isCorrect ? 'border-[var(--color-error)] bg-[var(--color-error-light)]' : ''}
                      disabled:cursor-not-allowed
                    `}
                  >
                    <p className="arabic-lg" dir="rtl">{word.word}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                      {word.meaning}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Confidence rating */}
        {awaitingConfidence && !hasSubmitted && (
          <div className="animate-slide-up">
            <ConfidenceRating
              onSelect={handleConfidenceSelect}
              selectedLevel={selectedConfidence}
              disabled={selectedConfidence !== null}
            />
          </div>
        )}

        {/* Submit button */}
        {!hasSubmitted && !awaitingConfidence && (
          <Button
            onClick={handleSubmit}
            fullWidth
            size="lg"
            disabled={!canSubmit}
          >
            Check Answer
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && hasSubmitted && (
          <ExerciseFeedback
            isCorrect={state === 'correct'}
            correctAnswer={exercise.answer}
            userAnswer={selectedOption || [...selectedWords].join(', ')}
            message={getFeedbackMessage()}
          />
        )}

        {/* Show related words after submission */}
        {hasSubmitted && exercise.family.words.length > 1 && (
          <div className="mt-4 pt-4 border-t border-[var(--color-sand-200)]">
            <p className="text-sm font-medium text-[var(--color-ink)] mb-2">
              Words from this root family:
            </p>
            <div className="flex flex-wrap gap-2">
              {exercise.family.words.slice(0, 6).map((word) => (
                <div 
                  key={word.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-sand-100)] rounded-lg"
                >
                  <span className="arabic-base" dir="rtl">{word.word}</span>
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    ({word.meaning})
                  </span>
                </div>
              ))}
              {exercise.family.words.length > 6 && (
                <span className="text-xs text-[var(--color-ink-muted)] self-center">
                  +{exercise.family.words.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </ExerciseCard>
  );
}

export default RootFamilyExercise;
