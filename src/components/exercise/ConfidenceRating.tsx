/**
 * Confidence Rating Component
 * 
 * Based on "Make It Stick" research on metacognition.
 * Asking learners to rate their confidence before seeing results:
 * 1. Improves awareness of what they actually know
 * 2. Combats "illusion of knowing" (dropping flashcards too soon)
 * 3. Provides calibration data to improve review scheduling
 */

import type { ConfidenceLevel } from '../../types/progress';

interface ConfidenceRatingProps {
  onSelect: (level: ConfidenceLevel) => void;
  disabled?: boolean;
  selectedLevel?: ConfidenceLevel | null;
}

const CONFIDENCE_OPTIONS: Array<{
  level: ConfidenceLevel;
  label: string;
  description: string;
  emoji: string;
  color: string;
}> = [
  {
    level: 1,
    label: 'Unsure',
    description: 'I guessed or am not confident',
    emoji: '🤔',
    color: 'var(--color-error)',
  },
  {
    level: 2,
    label: 'Somewhat sure',
    description: 'I think I know it',
    emoji: '😐',
    color: 'var(--color-gold)',
  },
  {
    level: 3,
    label: 'Very sure',
    description: 'I definitely know this',
    emoji: '😊',
    color: 'var(--color-success)',
  },
];

export function ConfidenceRating({
  onSelect,
  disabled = false,
  selectedLevel = null,
}: ConfidenceRatingProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-ink-muted)] text-center">
        How confident are you in your answer?
      </p>
      <div className="flex gap-2 justify-center">
        {CONFIDENCE_OPTIONS.map(({ level, label, description, color }) => {
          const isSelected = selectedLevel === level;
          
          return (
            <button
              key={level}
              onClick={() => onSelect(level)}
              disabled={disabled}
              title={description}
              className={`
                flex flex-col items-center
                px-4 py-3 rounded-[var(--radius-md)]
                border-2 transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                ${isSelected
                  ? 'border-current bg-opacity-10'
                  : 'border-[var(--color-sand-300)] bg-white hover:border-[var(--color-sand-400)]'
                }
              `}
              style={{
                borderColor: isSelected ? color : undefined,
                backgroundColor: isSelected ? `${color}15` : undefined,
                color: isSelected ? color : 'var(--color-ink)',
              }}
            >
              <span className="text-sm font-medium">{label}</span>
              <div className="flex mt-1 gap-0.5">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`
                      w-2 h-2 rounded-full transition-colors
                      ${dot <= level ? '' : 'opacity-30'}
                    `}
                    style={{
                      backgroundColor: dot <= level ? color : 'var(--color-sand-300)',
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact confidence indicator for inline use
 */
export function ConfidenceIndicator({
  level,
  size = 'sm',
}: {
  level: ConfidenceLevel;
  size?: 'sm' | 'md';
}) {
  const option = CONFIDENCE_OPTIONS.find((o) => o.level === level);
  if (!option) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}
        ${option.level === 1 ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' : ''}
        ${option.level === 2 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' : ''}
        ${option.level === 3 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : ''}
      `}
    >
      <span>{option.emoji}</span>
      <span>{option.label}</span>
    </span>
  );
}

export default ConfidenceRating;
