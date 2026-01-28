import { forwardRef, type HTMLAttributes } from 'react';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label for accessibility */
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

/**
 * LoadingSpinner - Animated loading indicator.
 *
 * Uses CSS animation for smooth spinning effect.
 * Includes accessibility label for screen readers.
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', label = 'Loading...', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={`flex items-center justify-center ${className}`}
        {...props}
      >
        <div
          className={`
            ${sizeClasses[size]}
            border-[var(--color-sand-300)]
            border-t-[var(--color-primary)]
            rounded-full
            animate-spin
          `}
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export interface LoadingPageProps {
  /** Optional message to display */
  message?: string;
}

/**
 * Full-page loading state for Suspense fallbacks.
 */
export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-sand-50)] dark:bg-[var(--color-sand-900)]">
      <LoadingSpinner size="lg" label={message} />
      <p className="mt-4 text-[var(--color-ink-muted)] text-sm">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
