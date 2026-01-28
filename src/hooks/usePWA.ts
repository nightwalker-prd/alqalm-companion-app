import { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface PWAState {
  needRefresh: boolean;
  offlineReady: boolean;
  isOffline: boolean;
  isStandalone: boolean;
  updateServiceWorker: () => Promise<void>;
  dismissUpdate: () => void;
}

/**
 * Hook for managing PWA state including service worker registration,
 * update prompts, and offline status.
 */
export function usePWA(): PWAState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const updateSWRef = useRef<(() => Promise<void>) | null>(null);

  // Check if running as installed PWA
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    // Register service worker
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
        // Auto-dismiss after 5 seconds
        setTimeout(() => setOfflineReady(false), 5000);
      },
      onRegisteredSW(swUrl, registration) {
        // Check for updates periodically (every hour)
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
        console.log('Service Worker registered:', swUrl);
      },
      onRegisterError(error) {
        console.error('Service Worker registration error:', error);
      },
    });

    updateSWRef.current = update;

    // Listen for online/offline status changes
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = useCallback(async () => {
    if (updateSWRef.current) {
      await updateSWRef.current();
      setNeedRefresh(false);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    isOffline,
    isStandalone,
    updateServiceWorker,
    dismissUpdate,
  };
}
