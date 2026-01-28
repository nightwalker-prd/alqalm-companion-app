import { type ReactNode } from 'react';
import { Card } from '../ui/Card';
import type { ExerciseType, ExerciseState } from '../../types/exercise';

interface ExerciseCardProps {
  type: ExerciseType;
  state: ExerciseState;
  children: ReactNode;
  className?: string;
}

const exerciseTypeLabels: Record<ExerciseType, { en: string; ar: string }> = {
  'fill-blank': { en: 'Fill in the blank', ar: 'املأ الفراغ' },
  'translate-to-arabic': { en: 'Translate to Arabic', ar: 'ترجم إلى العربية' },
  'word-to-meaning': { en: 'What does this mean?', ar: 'ما معنى هذه الكلمة؟' },
  'meaning-to-word': { en: 'Write in Arabic', ar: 'اكتب بالعربية' },
  'construct-sentence': { en: 'Build the sentence', ar: 'كوّن الجملة' },
  'grammar-apply': { en: 'Apply the rule', ar: 'طبّق القاعدة' },
  'error-correction': { en: 'Find and fix the error', ar: 'أصلح الخطأ' },
  'multi-cloze': { en: 'Fill all blanks', ar: 'املأ الفراغات' },
  'semantic-field': { en: 'Sort by category', ar: 'صنّف حسب المعنى' },
  'sentence-unscramble': { en: 'Unscramble the sentence', ar: 'رتّب الجملة' },
};

const stateStyles: Record<ExerciseState, string> = {
  unanswered: '',
  correct: 'ring-2 ring-emerald-500',
  incorrect: 'ring-2 ring-rose-500',
};

export function ExerciseCard({
  type,
  state,
  children,
  className = '',
}: ExerciseCardProps) {
  const labels = exerciseTypeLabels[type];

  return (
    <Card
      variant="exercise"
      padding="lg"
      hasGeometricAccent
      className={`
        ${stateStyles[state]}
        ${className}
      `}
    >
      {/* Exercise type indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ExerciseTypeIcon type={type} />
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

      {/* Exercise content */}
      <div className="space-y-6">
        {children}
      </div>
    </Card>
  );
}

function ExerciseTypeIcon({ type }: { type: ExerciseType }) {
  const iconPaths: Record<ExerciseType, ReactNode> = {
    'fill-blank': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h8m-8 6h16"
      />
    ),
    'translate-to-arabic': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
      />
    ),
    'word-to-meaning': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    'meaning-to-word': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    ),
    'construct-sentence': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    ),
    'grammar-apply': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
    'error-correction': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    'multi-cloze': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    ),
    'semantic-field': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
    'sentence-unscramble': (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    ),
  };

  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
      <svg
        className="w-5 h-5 text-indigo-700 dark:text-indigo-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {iconPaths[type]}
      </svg>
    </div>
  );
}

export default ExerciseCard;
