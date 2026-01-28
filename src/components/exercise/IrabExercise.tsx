import { useState, useCallback, type FormEvent } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type {
  IrabExercise as IrabExerciseType,
  GrammaticalCase,
  GrammaticalFunction,
  IrabWord,
} from '../../types/irab';
import { CASE_LABELS, FUNCTION_LABELS } from '../../types/irab';

type ExerciseState = 'unanswered' | 'correct' | 'incorrect';

interface IrabExerciseProps {
  exercise: IrabExerciseType;
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    responseTimeMs?: number;
    wordResults?: Array<{
      wordId: string;
      isCorrect: boolean;
      userFunction?: GrammaticalFunction;
      correctFunction: GrammaticalFunction;
    }>;
  }) => void;
  showFeedback?: boolean;
}

const stateStyles: Record<ExerciseState, string> = {
  unanswered: '',
  correct: 'ring-2 ring-[var(--color-success)]',
  incorrect: 'ring-2 ring-[var(--color-error)]',
};

const modeLabels: Record<string, { en: string; ar: string }> = {
  'identify-case': { en: 'Identify the Case', ar: 'حدّد الإعراب' },
  'identify-function': { en: 'Identify the Function', ar: 'حدّد الوظيفة النحوية' },
  'full-parse': { en: 'Parse the Sentence', ar: 'أعرب الجملة' },
  'explain-why': { en: 'Explain Why', ar: 'علّل الإعراب' },
  'select-correct': { en: 'Select the Correct Form', ar: 'اختر الصيغة الصحيحة' },
  'fix-case': { en: 'Fix the Case Error', ar: 'صحّح الخطأ' },
};

/**
 * I'rab Exercise Component
 *
 * Handles various types of Arabic grammatical case exercises.
 */
export function IrabExercise({
  exercise,
  onComplete,
  showFeedback = true,
}: IrabExerciseProps) {
  const [state, setState] = useState<ExerciseState>('unanswered');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [startTime] = useState(() => Date.now());

  const handleComplete = useCallback((isCorrect: boolean, userAnswer: string, metadata?: {
    wordResults?: Array<{
      wordId: string;
      isCorrect: boolean;
      userFunction?: GrammaticalFunction;
      correctFunction: GrammaticalFunction;
    }>;
  }) => {
    const responseTimeMs = Date.now() - startTime;
    setState(isCorrect ? 'correct' : 'incorrect');
    setHasSubmitted(true);
    onComplete(isCorrect, userAnswer, { responseTimeMs, ...metadata });
  }, [onComplete, startTime]);

  const labels = modeLabels[exercise.mode];

  return (
    <Card
      variant="exercise"
      padding="lg"
      hasGeometricAccent
      className={stateStyles[state]}
    >
      {/* Exercise type indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IrabIcon />
          <div>
            <span className="text-sm font-medium text-[var(--color-ink-muted)]">
              {labels.en}
            </span>
          </div>
        </div>
        <span className="arabic-sm text-[var(--color-ink-muted)]" dir="rtl">
          {labels.ar}
        </span>
      </div>

      {/* Difficulty badge */}
      <div className="flex justify-center mb-4">
        <DifficultyBadge difficulty={exercise.difficulty} />
      </div>

      {/* Concept badge if available */}
      {exercise.concept && (
        <div className="flex justify-center mb-4">
          <ConceptBadge concept={exercise.concept} />
        </div>
      )}

      {/* Render the appropriate exercise type */}
      <div className="space-y-6">
        {exercise.mode === 'identify-case' && (
          <IdentifyCaseMode
            exercise={exercise}
            onComplete={handleComplete}
            hasSubmitted={hasSubmitted}
            showFeedback={showFeedback}
          />
        )}
        {exercise.mode === 'identify-function' && (
          <IdentifyFunctionMode
            exercise={exercise}
            onComplete={handleComplete}
            hasSubmitted={hasSubmitted}
            showFeedback={showFeedback}
          />
        )}
        {exercise.mode === 'full-parse' && (
          <FullParseMode
            exercise={exercise}
            onComplete={handleComplete}
            hasSubmitted={hasSubmitted}
            showFeedback={showFeedback}
          />
        )}
        {exercise.mode === 'explain-why' && (
          <ExplainWhyMode
            exercise={exercise}
            onComplete={handleComplete}
            hasSubmitted={hasSubmitted}
            showFeedback={showFeedback}
          />
        )}
        {exercise.mode === 'select-correct' && (
          <SelectCorrectMode
            exercise={exercise}
            onComplete={handleComplete}
            hasSubmitted={hasSubmitted}
            showFeedback={showFeedback}
          />
        )}
        {exercise.mode === 'fix-case' && (
          <FixCaseMode
            exercise={exercise}
            onComplete={handleComplete}
            hasSubmitted={hasSubmitted}
            showFeedback={showFeedback}
          />
        )}
      </div>
    </Card>
  );
}

// Difficulty Badge Component
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    advanced: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  };

  const labels = {
    beginner: { en: 'Beginner', ar: 'مبتدئ' },
    intermediate: { en: 'Intermediate', ar: 'متوسط' },
    advanced: { en: 'Advanced', ar: 'متقدم' },
  };

  const label = labels[difficulty as keyof typeof labels] || labels.beginner;
  const color = colors[difficulty as keyof typeof colors] || colors.beginner;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${color}`}>
      <span>{label.en}</span>
      <span className="arabic-sm">{label.ar}</span>
    </span>
  );
}

// Concept Badge Component
function ConceptBadge({ concept }: { concept: string }) {
  const conceptLabels: Record<string, { ar: string; en: string }> = {
    'nominal-sentence': { ar: 'الجملة الاسمية', en: 'Nominal' },
    'verbal-sentence': { ar: 'الجملة الفعلية', en: 'Verbal' },
    'idafa': { ar: 'الإضافة', en: 'Idafa' },
    'prepositions': { ar: 'حروف الجر', en: 'Prepositions' },
    'adjectives': { ar: 'الصفة', en: 'Adjectives' },
    'inna-sisters': { ar: 'إنّ وأخواتها', en: 'Inna' },
    'kana-sisters': { ar: 'كان وأخواتها', en: 'Kana' },
    'nominal-with-adjective': { ar: 'جملة اسمية مع صفة', en: 'Nominal+Adj' },
    'verbal-with-adjective': { ar: 'جملة فعلية مع صفة', en: 'Verbal+Adj' },
    'inna-with-idafa': { ar: 'إنّ مع إضافة', en: 'Inna+Idafa' },
  };

  const label = conceptLabels[concept] || { ar: concept, en: concept };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--color-sand-200)] text-[var(--color-ink-muted)] text-xs rounded-full">
      <span className="arabic-sm">{label.ar}</span>
    </span>
  );
}

// I'rab Icon Component
function IrabIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
      <svg
        className="w-5 h-5 text-indigo-700 dark:text-indigo-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  );
}

// Sentence Display Component with highlighted target word
function SentenceDisplay({
  sentence,
  words,
  targetWordIndex,
  state = 'unanswered',
}: {
  sentence: string;
  words: IrabWord[];
  targetWordIndex?: number;
  state?: ExerciseState;
}) {
  // If we have a target word, highlight it
  if (targetWordIndex !== undefined && words[targetWordIndex]) {
    const targetWord = words[targetWordIndex];
    const parts = sentence.split(targetWord.text);

    const highlightColor = state === 'correct'
      ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500'
      : state === 'incorrect'
      ? 'bg-rose-100 dark:bg-rose-900/50 border-rose-500'
      : 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-400';

    return (
      <div className="text-center py-6">
        <p className="arabic-xl text-[var(--color-ink)] leading-relaxed" dir="rtl">
          {parts[0]}
          <span className={`inline-block px-2 py-1 mx-1 rounded-lg border-2 border-dashed ${highlightColor} transition-colors duration-200`}>
            {targetWord.text}
          </span>
          {parts.slice(1).join(targetWord.text)}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <p className="arabic-xl text-[var(--color-ink)] leading-relaxed" dir="rtl">
        {sentence}
      </p>
    </div>
  );
}

// Translation Display
function TranslationDisplay({ translation }: { translation: string }) {
  return (
    <p className="text-sm text-center text-[var(--color-ink-muted)] -mt-4 mb-4">
      {translation}
    </p>
  );
}

// Hint Display
function HintDisplay({ hint }: { hint?: string }) {
  if (!hint) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-primary)]">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <span className="arabic-sm">{hint}</span>
    </div>
  );
}

// Case Option Button
function CaseOptionButton({
  caseKey,
  selected,
  correct,
  incorrect,
  disabled,
  onClick,
}: {
  caseKey: GrammaticalCase;
  selected: boolean;
  correct: boolean;
  incorrect: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = CASE_LABELS[caseKey];

  let stateClass = 'border-[var(--color-sand-300)] hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
  let textClass = 'text-[var(--color-ink)]';

  if (selected && !correct && !incorrect) {
    stateClass = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40';
    textClass = 'text-indigo-900 dark:text-indigo-100';
  }
  if (correct) {
    stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40';
    textClass = 'text-emerald-900 dark:text-emerald-100';
  }
  if (incorrect) {
    stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/40';
    textClass = 'text-rose-900 dark:text-rose-100';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-lg border-2 text-center
        transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-60
        ${stateClass}
      `}
    >
      <div className={`arabic-lg font-semibold mb-1 ${textClass}`}>{label.ar}</div>
      <div className="text-sm text-[var(--color-ink-muted)]">{label.en}</div>
      <div className="text-xs text-[var(--color-ink-muted)] mt-1">{label.marker}</div>
    </button>
  );
}

// Function Option Button
function FunctionOptionButton({
  functionKey,
  selected,
  correct,
  incorrect,
  disabled,
  onClick,
}: {
  functionKey: GrammaticalFunction;
  selected: boolean;
  correct: boolean;
  incorrect: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = FUNCTION_LABELS[functionKey];
  const caseLabel = CASE_LABELS[label.case];

  let stateClass = 'border-[var(--color-sand-300)] hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
  let textClass = 'text-[var(--color-ink)]';

  if (selected && !correct && !incorrect) {
    stateClass = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40';
    textClass = 'text-indigo-900 dark:text-indigo-100';
  }
  if (correct) {
    stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40';
    textClass = 'text-emerald-900 dark:text-emerald-100';
  }
  if (incorrect) {
    stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/40';
    textClass = 'text-rose-900 dark:text-rose-100';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-3 rounded-lg border-2 text-right
        transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-60
        ${stateClass}
      `}
      dir="rtl"
    >
      <div className={`arabic font-semibold ${textClass}`}>{label.ar}</div>
      <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">{label.en}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        ({caseLabel.ar})
      </div>
    </button>
  );
}

// Feedback Component
function IrabFeedback({
  isCorrect,
  correctAnswer,
  explanation,
}: {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}) {
  return (
    <div className={`
      p-4 rounded-lg animate-slide-up
      ${isCorrect
        ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
        : 'bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700'
      }
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isCorrect ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-rose-200 dark:bg-rose-800'}
        `}>
          {isCorrect ? (
            <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-700 dark:text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`font-medium ${isCorrect ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
            {isCorrect ? 'Correct!' : 'Not quite'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              The correct answer is: <span className="arabic font-medium text-rose-700 dark:text-rose-300">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 arabic" dir="rtl">
              {explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXERCISE MODE COMPONENTS
// ============================================

// Identify Case Mode
function IdentifyCaseMode({
  exercise,
  onComplete,
  hasSubmitted,
  showFeedback,
}: {
  exercise: IrabExerciseType & { mode: 'identify-case' };
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
  hasSubmitted: boolean;
  showFeedback: boolean;
}) {
  const [selectedCase, setSelectedCase] = useState<GrammaticalCase | null>(null);
  const [localState, setLocalState] = useState<ExerciseState>('unanswered');

  const targetWord = exercise.words[exercise.targetWordIndex];
  const correctCase = targetWord.case;
  const cases: GrammaticalCase[] = ['marfu', 'mansub', 'majrur'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCase || hasSubmitted) return;

    const isCorrect = selectedCase === correctCase;
    setLocalState(isCorrect ? 'correct' : 'incorrect');
    onComplete(isCorrect, selectedCase);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SentenceDisplay
        sentence={exercise.sentence}
        words={exercise.words}
        targetWordIndex={exercise.targetWordIndex}
        state={localState}
      />

      <TranslationDisplay translation={exercise.translation} />

      {!hasSubmitted && <HintDisplay hint={exercise.hint} />}

      {/* Case options */}
      <div className="grid grid-cols-3 gap-3">
        {cases.map((caseKey) => (
          <CaseOptionButton
            key={caseKey}
            caseKey={caseKey}
            selected={selectedCase === caseKey}
            correct={hasSubmitted && caseKey === correctCase}
            incorrect={hasSubmitted && selectedCase === caseKey && caseKey !== correctCase}
            disabled={hasSubmitted}
            onClick={() => setSelectedCase(caseKey)}
          />
        ))}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!selectedCase}
        >
          Check Answer
        </Button>
      )}

      {/* Feedback */}
      {showFeedback && hasSubmitted && (
        <IrabFeedback
          isCorrect={localState === 'correct'}
          correctAnswer={CASE_LABELS[correctCase].ar}
          explanation={targetWord.explanation}
        />
      )}
    </form>
  );
}

// Identify Function Mode
function IdentifyFunctionMode({
  exercise,
  onComplete,
  hasSubmitted,
  showFeedback,
}: {
  exercise: IrabExerciseType & { mode: 'identify-function' };
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
  hasSubmitted: boolean;
  showFeedback: boolean;
}) {
  const [selectedFunction, setSelectedFunction] = useState<GrammaticalFunction | null>(null);
  const [localState, setLocalState] = useState<ExerciseState>('unanswered');

  const targetWord = exercise.words[exercise.targetWordIndex];
  const correctFunction = targetWord.function;
  const options = exercise.options || ['mubtada', 'khabar', 'fail', 'mafool_bih'] as GrammaticalFunction[];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFunction || hasSubmitted) return;

    const isCorrect = selectedFunction === correctFunction;
    setLocalState(isCorrect ? 'correct' : 'incorrect');
    onComplete(isCorrect, selectedFunction);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SentenceDisplay
        sentence={exercise.sentence}
        words={exercise.words}
        targetWordIndex={exercise.targetWordIndex}
        state={localState}
      />

      <TranslationDisplay translation={exercise.translation} />

      {!hasSubmitted && <HintDisplay hint={exercise.hint} />}

      {/* Function options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((funcKey) => (
          <FunctionOptionButton
            key={funcKey}
            functionKey={funcKey}
            selected={selectedFunction === funcKey}
            correct={hasSubmitted && funcKey === correctFunction}
            incorrect={hasSubmitted && selectedFunction === funcKey && funcKey !== correctFunction}
            disabled={hasSubmitted}
            onClick={() => setSelectedFunction(funcKey)}
          />
        ))}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!selectedFunction}
        >
          Check Answer
        </Button>
      )}

      {/* Feedback */}
      {showFeedback && hasSubmitted && (
        <IrabFeedback
          isCorrect={localState === 'correct'}
          correctAnswer={FUNCTION_LABELS[correctFunction].ar}
          explanation={targetWord.explanation}
        />
      )}
    </form>
  );
}

// Full Parse Mode
function FullParseMode({
  exercise,
  onComplete,
  hasSubmitted,
  showFeedback,
}: {
  exercise: IrabExerciseType & { mode: 'full-parse' };
  onComplete: (isCorrect: boolean, userAnswer: string, metadata?: {
    wordResults?: Array<{
      wordId: string;
      isCorrect: boolean;
      userFunction?: GrammaticalFunction;
      correctFunction: GrammaticalFunction;
    }>;
  }) => void;
  hasSubmitted: boolean;
  showFeedback: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, GrammaticalFunction>>({});
  const [localState, setLocalState] = useState<ExerciseState>('unanswered');
  const [wordStates, setWordStates] = useState<Record<number, 'correct' | 'incorrect'>>({});

  const allCommonFunctions: GrammaticalFunction[] = [
    'mubtada', 'khabar', 'fail', 'mafool_bih', 'sifa',
    'mudaf', 'mudaf_ilayh', 'ism_inna', 'khabar_inna',
    'ism_kana', 'khabar_kana', 'majrur_bi_harf'
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (hasSubmitted) return;

    // Check each word
    const newWordStates: Record<number, 'correct' | 'incorrect'> = {};
    const wordResults: Array<{
      wordId: string;
      isCorrect: boolean;
      userFunction?: GrammaticalFunction;
      correctFunction: GrammaticalFunction;
    }> = [];

    let allCorrect = true;
    exercise.words.forEach((word, idx) => {
      const userAnswer = answers[idx];
      const isWordCorrect = userAnswer === word.function;
      if (!isWordCorrect) allCorrect = false;
      newWordStates[idx] = isWordCorrect ? 'correct' : 'incorrect';
      wordResults.push({
        wordId: word.id,
        isCorrect: isWordCorrect,
        userFunction: userAnswer,
        correctFunction: word.function,
      });
    });

    setWordStates(newWordStates);
    setLocalState(allCorrect ? 'correct' : 'incorrect');
    onComplete(allCorrect, JSON.stringify(answers), { wordResults });
  };

  const allAnswered = exercise.words.every((_, idx) => answers[idx] !== undefined);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center text-sm text-[var(--color-ink-muted)] mb-2">
        Parse each word in the sentence
      </div>

      <SentenceDisplay
        sentence={exercise.sentence}
        words={exercise.words}
        state={localState}
      />

      <TranslationDisplay translation={exercise.translation} />

      {!hasSubmitted && <HintDisplay hint={exercise.hint} />}

      {/* Word-by-word parsing */}
      <div className="space-y-4">
        {exercise.words.map((word, idx) => (
          <div
            key={word.id}
            className={`
              p-4 rounded-lg border-2 transition-colors duration-200
              ${hasSubmitted
                ? wordStates[idx] === 'correct'
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-rose-400 bg-rose-50 dark:bg-rose-900/30'
                : 'border-[var(--color-sand-200)]'
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="arabic-lg text-[var(--color-ink)]" dir="rtl">{word.text}</span>
              {hasSubmitted && (
                <span className={`text-xs font-medium ${
                  wordStates[idx] === 'correct' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {wordStates[idx] === 'correct' ? 'Correct' : `Should be: ${FUNCTION_LABELS[word.function].ar}`}
                </span>
              )}
            </div>

            <select
              value={answers[idx] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value as GrammaticalFunction }))}
              disabled={hasSubmitted}
              className={`
                w-full p-3 rounded-lg border-2 bg-white
                text-[var(--color-ink)] arabic-sm
                transition-colors duration-200
                focus:outline-none focus:border-[var(--color-primary)]
                disabled:opacity-60 disabled:cursor-not-allowed
                ${answers[idx] ? 'border-[var(--color-primary)] border-opacity-50' : 'border-[var(--color-sand-300)]'}
              `}
              dir="rtl"
            >
              <option value="">اختر الوظيفة النحوية...</option>
              {allCommonFunctions.map((func) => (
                <option key={func} value={func}>
                  {FUNCTION_LABELS[func].ar} - {FUNCTION_LABELS[func].en}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!allAnswered}
        >
          Check All Answers
        </Button>
      )}

      {/* Summary feedback */}
      {showFeedback && hasSubmitted && (
        <div className={`
          p-4 rounded-lg text-center
          ${localState === 'correct'
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200'
          }
        `}>
          {localState === 'correct' ? (
            <p className="font-medium">Excellent! You parsed all words correctly.</p>
          ) : (
            <p className="font-medium">
              Some answers need correction. Review the highlighted words above.
            </p>
          )}
        </div>
      )}
    </form>
  );
}

// Explain Why Mode
function ExplainWhyMode({
  exercise,
  onComplete,
  hasSubmitted,
  showFeedback,
}: {
  exercise: IrabExerciseType & { mode: 'explain-why' };
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
  hasSubmitted: boolean;
  showFeedback: boolean;
}) {
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);
  const [localState, setLocalState] = useState<ExerciseState>('unanswered');

  const targetWord = exercise.words[exercise.targetWordIndex];
  const correctExplanation = exercise.correctExplanation;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedExplanation || hasSubmitted) return;

    const isCorrect = selectedExplanation === correctExplanation;
    setLocalState(isCorrect ? 'correct' : 'incorrect');
    onComplete(isCorrect, selectedExplanation);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SentenceDisplay
        sentence={exercise.sentence}
        words={exercise.words}
        targetWordIndex={exercise.targetWordIndex}
        state={localState}
      />

      <TranslationDisplay translation={exercise.translation} />

      <div className="text-center p-3 bg-[var(--color-sand-100)] rounded-lg">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Why is <span className="arabic font-medium">{targetWord.text}</span> {CASE_LABELS[targetWord.case].en.toLowerCase()}?
        </p>
      </div>

      {/* Explanation options */}
      <div className="space-y-2">
        {exercise.explanationOptions.map((explanation, idx) => {
          const isSelected = selectedExplanation === explanation;
          const isCorrect = hasSubmitted && explanation === correctExplanation;
          const isWrong = hasSubmitted && isSelected && explanation !== correctExplanation;

          let stateClass = 'border-[var(--color-sand-300)] hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
          let textClass = 'text-[var(--color-ink)]';
          if (isSelected && !hasSubmitted) {
            stateClass = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40';
            textClass = 'text-indigo-900 dark:text-indigo-100';
          }
          if (isCorrect) {
            stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40';
            textClass = 'text-emerald-900 dark:text-emerald-100';
          }
          if (isWrong) {
            stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/40';
            textClass = 'text-rose-900 dark:text-rose-100';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedExplanation(explanation)}
              disabled={hasSubmitted}
              className={`
                w-full p-4 rounded-lg border-2 text-right
                transition-all duration-200
                disabled:cursor-not-allowed
                ${stateClass}
              `}
              dir="rtl"
            >
              <span className={`arabic ${textClass}`}>{explanation}</span>
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!selectedExplanation}
        >
          Check Answer
        </Button>
      )}

      {/* Feedback */}
      {showFeedback && hasSubmitted && (
        <IrabFeedback
          isCorrect={localState === 'correct'}
          correctAnswer={correctExplanation}
        />
      )}
    </form>
  );
}

// Select Correct Mode
function SelectCorrectMode({
  exercise,
  onComplete,
  hasSubmitted,
  showFeedback,
}: {
  exercise: IrabExerciseType & { mode: 'select-correct' };
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
  hasSubmitted: boolean;
  showFeedback: boolean;
}) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [localState, setLocalState] = useState<ExerciseState>('unanswered');

  const targetWord = exercise.words[exercise.targetWordIndex];
  const correctWord = targetWord.text;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWord || hasSubmitted) return;

    const isCorrect = selectedWord === correctWord;
    setLocalState(isCorrect ? 'correct' : 'incorrect');
    onComplete(isCorrect, selectedWord);
  };

  // Display sentence with blank
  const sentenceParts = exercise.sentence.split('_____');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center py-6">
        <p className="arabic-xl text-[var(--color-ink)] leading-relaxed" dir="rtl">
          {sentenceParts[0]}
          <span className="inline-block px-4 py-1 mx-2 border-b-2 border-dashed border-[var(--color-primary)]">
            {selectedWord || '______'}
          </span>
          {sentenceParts[1]}
        </p>
      </div>

      <TranslationDisplay translation={exercise.translation} />

      {!hasSubmitted && <HintDisplay hint={exercise.hint} />}

      {/* Word options */}
      <div className="flex flex-wrap justify-center gap-3">
        {exercise.wordOptions.map((word, idx) => {
          const isSelected = selectedWord === word;
          const isCorrect = hasSubmitted && word === correctWord;
          const isWrong = hasSubmitted && isSelected && word !== correctWord;

          let stateClass = 'border-[var(--color-sand-300)] hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
          let textClass = 'text-[var(--color-ink)]';
          if (isSelected && !hasSubmitted) {
            stateClass = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40';
            textClass = 'text-indigo-900 dark:text-indigo-100';
          }
          if (isCorrect) {
            stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40';
            textClass = 'text-emerald-900 dark:text-emerald-100';
          }
          if (isWrong) {
            stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/40';
            textClass = 'text-rose-900 dark:text-rose-100';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedWord(word)}
              disabled={hasSubmitted}
              className={`
                px-6 py-3 rounded-lg border-2
                transition-all duration-200
                disabled:cursor-not-allowed
                ${stateClass}
              `}
            >
              <span className={`arabic-lg ${textClass}`}>{word}</span>
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!selectedWord}
        >
          Check Answer
        </Button>
      )}

      {/* Feedback */}
      {showFeedback && hasSubmitted && (
        <IrabFeedback
          isCorrect={localState === 'correct'}
          correctAnswer={correctWord}
          explanation={targetWord.explanation}
        />
      )}
    </form>
  );
}

// Fix Case Mode
function FixCaseMode({
  exercise,
  onComplete,
  hasSubmitted,
  showFeedback,
}: {
  exercise: IrabExerciseType & { mode: 'fix-case' };
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
  hasSubmitted: boolean;
  showFeedback: boolean;
}) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [localState, setLocalState] = useState<ExerciseState>('unanswered');

  const targetWord = exercise.words[exercise.targetWordIndex];
  const correctWord = targetWord.text;

  // Get the incorrect word from the incorrect sentence
  const incorrectWord = exercise.incorrectSentence.split(' ')[exercise.targetWordIndex];

  // Generate options: correct word + incorrect word + one more distractor
  const wordOptions = [
    correctWord, // Correct
    incorrectWord, // Incorrect (as shown)
  ];

  // Add a third option if not already present
  if (wordOptions.length < 3) {
    // Simple case ending swap for third option
    const base = correctWord.replace(/[ًٌٍَُِْ]$/g, '');
    const thirdOption = base + 'ٍ'; // Kasra tanwin as third option
    if (!wordOptions.includes(thirdOption)) {
      wordOptions.push(thirdOption);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWord || hasSubmitted) return;

    const isCorrect = selectedWord === correctWord;
    setLocalState(isCorrect ? 'correct' : 'incorrect');
    onComplete(isCorrect, selectedWord);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center text-sm text-[var(--color-ink-muted)] mb-2">
        Find and fix the case marking error
      </div>

      {/* Show incorrect sentence with error highlighted */}
      <div className="text-center py-4 px-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
        <p className="arabic-xl text-[var(--color-ink)] leading-relaxed" dir="rtl">
          {exercise.incorrectSentence.split(' ').map((word, idx) => (
            <span key={idx}>
              {idx === exercise.targetWordIndex ? (
                <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-800 rounded border-b-2 border-rose-500">
                  {word}
                </span>
              ) : (
                word
              )}
              {idx < exercise.incorrectSentence.split(' ').length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>

      <TranslationDisplay translation={exercise.translation} />

      {!hasSubmitted && <HintDisplay hint={exercise.hint} />}

      <div className="text-center text-sm text-[var(--color-ink-muted)]">
        Select the correct form:
      </div>

      {/* Word options */}
      <div className="flex flex-wrap justify-center gap-3">
        {wordOptions.map((word, idx) => {
          const isSelected = selectedWord === word;
          const isCorrect = hasSubmitted && word === correctWord;
          const isWrong = hasSubmitted && isSelected && word !== correctWord;

          let stateClass = 'border-[var(--color-sand-300)] hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
          let textClass = 'text-[var(--color-ink)]';
          if (isSelected && !hasSubmitted) {
            stateClass = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40';
            textClass = 'text-indigo-900 dark:text-indigo-100';
          }
          if (isCorrect) {
            stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40';
            textClass = 'text-emerald-900 dark:text-emerald-100';
          }
          if (isWrong) {
            stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/40';
            textClass = 'text-rose-900 dark:text-rose-100';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedWord(word)}
              disabled={hasSubmitted}
              className={`
                px-6 py-3 rounded-lg border-2
                transition-all duration-200
                disabled:cursor-not-allowed
                ${stateClass}
              `}
            >
              <span className={`arabic-lg ${textClass}`}>{word}</span>
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!selectedWord}
        >
          Check Answer
        </Button>
      )}

      {/* Feedback */}
      {showFeedback && hasSubmitted && (
        <div className="space-y-4">
          <IrabFeedback
            isCorrect={localState === 'correct'}
            correctAnswer={correctWord}
            explanation={targetWord.explanation}
          />

          {/* Show corrected sentence */}
          {localState === 'correct' && (
            <div className="text-center py-4 px-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2">Corrected sentence:</p>
              <p className="arabic-lg text-[var(--color-ink)]" dir="rtl">
                {exercise.sentence}
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

export default IrabExercise;
