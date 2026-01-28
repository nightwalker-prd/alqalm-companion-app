/**
 * useTTS Hook
 *
 * React hook for Text-to-Speech functionality.
 * Provides a simple interface for speaking Arabic text in components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TTSOptions, TTSState, TTSError, VoiceInfo } from '../types/tts';
import {
  isTTSSupported,
  getArabicVoices,
  speak as ttsSpeak,
  stop as ttsStop,
  pause as ttsPause,
  resume as ttsResume,
  getTTSState,
  isSpeaking as ttsisSpeaking,
  waitForVoices,
  speakSlowly as ttsSpeakSlowly,
  speakFast as ttsSpeakFast,
} from '../lib/ttsService';

export interface UseTTSResult {
  /** Whether TTS is supported in this browser */
  isSupported: boolean;
  /** Whether voices have loaded */
  voicesLoaded: boolean;
  /** Available Arabic voices */
  voices: VoiceInfo[];
  /** Current TTS state */
  state: TTSState;
  /** Whether currently speaking */
  isSpeaking: boolean;
  /** Last error that occurred */
  error: TTSError | null;
  /** Speak the given text */
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  /** Speak slowly (for learning) */
  speakSlowly: (text: string, options?: TTSOptions) => Promise<void>;
  /** Speak fast (for fluency practice) */
  speakFast: (text: string, options?: TTSOptions) => Promise<void>;
  /** Stop current speech */
  stop: () => void;
  /** Pause current speech */
  pause: () => void;
  /** Resume paused speech */
  resume: () => void;
}

/**
 * Hook for using Text-to-Speech in React components
 *
 * @example
 * ```tsx
 * function VocabCard({ word }: { word: string }) {
 *   const { speak, isSpeaking, isSupported } = useTTS();
 *
 *   return (
 *     <div>
 *       <span className="arabic">{word}</span>
 *       {isSupported && (
 *         <button
 *           onClick={() => speak(word)}
 *           disabled={isSpeaking}
 *         >
 *           🔊
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTTS(): UseTTSResult {
  const [isSupported] = useState(() => isTTSSupported());
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [state, setState] = useState<TTSState>('idle');
  const [error, setError] = useState<TTSError | null>(null);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Load voices on mount
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = async () => {
      await waitForVoices();
      if (isMountedRef.current) {
        setVoices(getArabicVoices());
        setVoicesLoaded(true);
      }
    };

    loadVoices();

    return () => {
      isMountedRef.current = false;
    };
  }, [isSupported]);

  // Update state periodically while speaking
  useEffect(() => {
    if (!isSupported) return;

    const updateState = () => {
      if (isMountedRef.current) {
        setState(getTTSState());
      }
    };

    // Update state when speaking starts
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, [isSupported]);

  const speak = useCallback(
    async (text: string, options?: TTSOptions): Promise<void> => {
      if (!isSupported) {
        setError({
          type: 'not-supported',
          message: 'TTS is not supported in this browser',
        });
        return;
      }

      setError(null);
      setState('loading');

      try {
        await ttsSpeak(text, options);
        if (isMountedRef.current) {
          setState('idle');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as TTSError);
          setState('error');
        }
      }
    },
    [isSupported]
  );

  const speakSlowly = useCallback(
    async (text: string, options?: TTSOptions): Promise<void> => {
      if (!isSupported) {
        setError({
          type: 'not-supported',
          message: 'TTS is not supported in this browser',
        });
        return;
      }

      setError(null);
      setState('loading');

      try {
        await ttsSpeakSlowly(text, options);
        if (isMountedRef.current) {
          setState('idle');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as TTSError);
          setState('error');
        }
      }
    },
    [isSupported]
  );

  const speakFast = useCallback(
    async (text: string, options?: TTSOptions): Promise<void> => {
      if (!isSupported) {
        setError({
          type: 'not-supported',
          message: 'TTS is not supported in this browser',
        });
        return;
      }

      setError(null);
      setState('loading');

      try {
        await ttsSpeakFast(text, options);
        if (isMountedRef.current) {
          setState('idle');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as TTSError);
          setState('error');
        }
      }
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    ttsStop();
    setState('idle');
  }, []);

  const pause = useCallback(() => {
    ttsPause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    ttsResume();
    setState('speaking');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsStop();
    };
  }, []);

  return {
    isSupported,
    voicesLoaded,
    voices,
    state,
    isSpeaking: state === 'speaking' || ttsisSpeaking(),
    error,
    speak,
    speakSlowly,
    speakFast,
    stop,
    pause,
    resume,
  };
}

export default useTTS;
