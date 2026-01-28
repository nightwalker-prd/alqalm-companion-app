import { type HTMLAttributes } from 'react';

type ProgressVariant = 'default' | 'success' | 'warning' | 'mastery';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const variantColors: Record<ProgressVariant, string> = {
  default: 'bg-[var(--color-primary)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-gold)]',
  mastery: '', // Dynamic based on value
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

function getMasteryColor(percentage: number): string {
  if (percentage >= 80) return 'bg-[var(--color-mastered)]';
  if (percentage >= 40) return 'bg-[var(--color-learning)]';
  return 'bg-[var(--color-sand-400)]';
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className = '',
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const barColor = variant === 'mastery'
    ? getMasteryColor(percentage)
    : variantColors[variant];

  return (
    <div className={`w-full ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-[var(--color-ink-muted)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={`
          w-full
          bg-[var(--color-sand-200)]
          rounded-full
          overflow-hidden
          ${sizeStyles[size]}
        `}
      >
        <div
          className={`
            h-full
            rounded-full
            ${barColor}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ProgressDotsProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressDots({ current, total, className = '' }: ProgressDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`
            w-2.5 h-2.5 rounded-full
            transition-all duration-300
            ${i < current
              ? 'bg-[var(--color-primary)] scale-100'
              : i === current
                ? 'bg-[var(--color-primary)] scale-125 shadow-[var(--shadow-glow)]'
                : 'bg-[var(--color-sand-300)] scale-100'
            }
          `}
        />
      ))}
    </div>
  );
}

interface ProgressDotsWithReviewProps {
  /** The index the user is currently viewing */
  viewIndex: number;
  /** The furthest exercise the user has progressed to (active exercise) */
  currentIndex: number;
  /** Total number of exercises */
  total: number;
  /** Click handler for navigating to a specific exercise */
  onNavigate?: (index: number) => void;
  className?: string;
}

/**
 * Progress dots with review navigation support.
 * Shows completed exercises (filled), active exercise (highlighted),
 * and currently viewed exercise (ring indicator).
 */
export function ProgressDotsWithReview({
  viewIndex,
  currentIndex,
  total,
  onNavigate,
  className = '',
}: ProgressDotsWithReviewProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        const isViewing = i === viewIndex;
        const isClickable = i <= currentIndex && onNavigate;

        return (
          <button
            key={i}
            type="button"
            onClick={() => isClickable && onNavigate?.(i)}
            disabled={!isClickable}
            className={`
              relative w-2.5 h-2.5 rounded-full
              transition-all duration-300
              ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              ${isCompleted
                ? 'bg-[var(--color-primary)]'
                : isActive
                  ? 'bg-[var(--color-primary)] scale-125 shadow-[var(--shadow-glow)]'
                  : 'bg-[var(--color-sand-300)]'
              }
            `}
            aria-label={`Exercise ${i + 1}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
          >
            {/* Ring indicator for currently viewed exercise (when reviewing) */}
            {isViewing && i < currentIndex && (
              <span className="absolute inset-0 rounded-full ring-2 ring-[var(--color-primary)] ring-offset-1 ring-offset-white animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ProgressBar;
