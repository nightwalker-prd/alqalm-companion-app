import { Component, type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch React render errors
 * and display a friendly error message with recovery options.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--color-sand-50)] dark:bg-[var(--color-sand-900)] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500 dark:text-red-400"
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

            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-inverse)] mb-2">
              Something went wrong
            </h1>

            <p className="text-[var(--color-ink-muted)] dark:text-[var(--color-ink-muted)] mb-6">
              We encountered an unexpected error. Your progress has been saved.
            </p>

            <div className="space-y-3">
              <Button onClick={this.handleRetry} fullWidth size="lg">
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="secondary" fullWidth size="lg">
                Go to Home
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)] rounded-lg text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
