import { type HTMLAttributes } from 'react';
import { TARGET_ENCOUNTERS } from '../../types/progress';

interface EncounterBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of encounters so far */
  encounters: number;
  /** Target number of encounters (defaults to 12 per Nation's research) */
  target?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show the numeric count */
  showCount?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

const sizeStyles = {
  sm: {
    container: 'w-6 h-6',
    text: 'text-[8px]',
    ring: 'w-6 h-6',
  },
  md: {
    container: 'w-8 h-8',
    text: 'text-[10px]',
    ring: 'w-8 h-8',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-xs',
    ring: 'w-12 h-12',
  },
};

/**
 * EncounterBadge - Visual indicator of vocabulary encounter progress.
 *
 * Based on Paul Nation's research that vocabulary requires 10-12 meaningful
 * encounters for acquisition. This badge shows progress toward that goal.
 */
export function EncounterBadge({
  encounters,
  target = TARGET_ENCOUNTERS,
  size = 'md',
  showCount = true,
  showTooltip = true,
  className = '',
  ...props
}: EncounterBadgeProps) {
  const progress = Math.min(100, Math.round((encounters / target) * 100));
  const isComplete = encounters >= target;
  const styles = sizeStyles[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      title={
        showTooltip
          ? `${encounters}/${target} encounters${isComplete ? ' (Target reached!)' : ''}`
          : undefined
      }
      {...props}
    >
      {/* Background circle */}
      <div
        className={`
          ${styles.ring}
          rounded-full
          bg-[var(--color-sand-200)]
          flex items-center justify-center
          relative
          overflow-hidden
        `}
      >
        {/* Filled progress arc */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 36 36"
        >
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="var(--color-sand-300)"
            strokeWidth="3"
          />

          {/* Progress circle */}
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={
              isComplete
                ? 'var(--color-mastered)'
                : progress >= 50
                  ? 'var(--color-learning)'
                  : 'var(--color-primary)'
            }
            strokeWidth="3"
            strokeDasharray={`${progress} ${100 - progress}`}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        {showCount && (
          <span
            className={`
              ${styles.text}
              font-semibold
              z-10
              ${isComplete ? 'text-[var(--color-mastered)]' : 'text-[var(--color-ink-light)]'}
            `}
          >
            {encounters}
          </span>
        )}

        {/* Checkmark for complete */}
        {isComplete && !showCount && (
          <svg
            className="w-3/5 h-3/5 text-[var(--color-mastered)] z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * Compact encounter indicator with just the count
 */
interface EncounterCountProps extends HTMLAttributes<HTMLSpanElement> {
  encounters: number;
  target?: number;
}

export function EncounterCount({
  encounters,
  target = TARGET_ENCOUNTERS,
  className = '',
  ...props
}: EncounterCountProps) {
  const isComplete = encounters >= target;

  return (
    <span
      className={`
        inline-flex items-center gap-1
        text-xs font-medium
        ${isComplete ? 'text-[var(--color-mastered)]' : 'text-[var(--color-ink-muted)]'}
        ${className}
      `}
      title={`${encounters}/${target} encounters`}
      {...props}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      {encounters}/{target}
    </span>
  );
}

export default EncounterBadge;
