import { usePWA } from '../../hooks/usePWA';
import { Button } from '../ui/Button';

/**
 * PWA Update Prompt - shows when a new version is available.
 * Displays a toast-like notification at the bottom of the screen.
 */
export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, dismissUpdate } = usePWA();

  // Show offline ready notification
  if (offlineReady) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4"
        role="alert"
      >
        <div className="bg-[var(--color-success)] text-white rounded-[var(--radius-lg)] p-4 shadow-lg flex items-center gap-3">
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Ready for offline use</p>
            <p className="text-sm opacity-90">
              All content has been cached. You can study without internet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show update available notification
  if (needRefresh) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4"
        role="alert"
      >
        <div className="bg-[var(--color-sand-50)] border border-[var(--color-sand-300)] rounded-[var(--radius-lg)] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-[var(--color-ink)]">
                Update Available
              </h3>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                A new version of Madina Arabic is ready. Update now for the latest features.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={updateServiceWorker}
                >
                  Update Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissUpdate}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PWAUpdatePrompt;
