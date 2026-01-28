import { type ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message to display */
  message: string;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Optional custom action */
  action?: ReactNode;
  /** Size variant */
  variant?: 'inline' | 'page';
}

/**
 * ErrorState - Display error messages with optional retry action.
 *
 * Use for showing loading failures, API errors, etc.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  action,
  variant = 'inline',
}: ErrorStateProps) {
  const isPage = variant === 'page';

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${isPage ? 'min-h-screen bg-[var(--color-sand-50)] p-8' : 'p-6'}
      `}
      role="alert"
    >
      {/* Error icon */}
      <div
        className={`
          flex items-center justify-center rounded-full
          bg-[var(--color-error-light,#FEE2E2)]
          ${isPage ? 'w-16 h-16 mb-4' : 'w-12 h-12 mb-3'}
        `}
      >
        <svg
          className={`text-[var(--color-error)] ${isPage ? 'w-8 h-8' : 'w-6 h-6'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3
        className={`
          font-display font-semibold text-[var(--color-ink)]
          ${isPage ? 'text-xl mb-2' : 'text-lg mb-1'}
        `}
      >
        {title}
      </h3>

      {/* Message */}
      <p
        className={`
          text-[var(--color-ink-muted)] max-w-md
          ${isPage ? 'text-base mb-6' : 'text-sm mb-4'}
        `}
      >
        {message}
      </p>

      {/* Actions */}
      {(onRetry || action) && (
        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="primary" size={isPage ? 'md' : 'sm'}>
              Try Again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

export interface ErrorPageProps {
  /** Error message */
  message?: string;
  /** Retry handler */
  onRetry?: () => void;
}

/**
 * Full-page error state for critical failures.
 */
export function ErrorPage({
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
}: ErrorPageProps) {
  return (
    <ErrorState
      variant="page"
      title="Oops!"
      message={message}
      onRetry={onRetry}
    />
  );
}

export default ErrorState;
