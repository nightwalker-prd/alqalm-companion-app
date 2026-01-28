/**
 * Text-to-Speech (TTS) Service
 *
 * Provides Arabic audio playback using the Web Speech API.
 * Used for vocabulary pronunciation, reading exercises, and
 * listening comprehension activities.
 *
 * Features:
 * - Automatic voice selection (prefers ar-SA)
 * - Rate/pitch/volume control
 * - Playback state management
 * - Graceful degradation when not supported
 */

import type {
  TTSOptions,
  TTSState,
  TTSError,
  TTSErrorType,
  VoiceInfo,
  TTSService,
  ArabicVoiceLocale,
} from '../types/tts';

import {
  DEFAULT_TTS_OPTIONS,
  VOICE_LOCALE_PREFERENCE,
} from '../types/tts';

// ============================================================================
// Browser Support Detection
// ============================================================================

/**
 * Check if the browser supports the Web Speech API
 */
export function isTTSSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

// ============================================================================
// Voice Management
// ============================================================================

/**
 * Get all available voices from the browser
 */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Get all available Arabic voices
 */
export function getArabicVoices(): VoiceInfo[] {
  const voices = getAllVoices();
  return voices
    .filter((voice) => voice.lang.startsWith('ar'))
    .map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      isLocal: voice.localService,
      isDefault: voice.default,
    }));
}

/**
 * Find the best Arabic voice based on preferences
 */
export function findBestArabicVoice(
  preferredLocale?: ArabicVoiceLocale,
  preferredVoiceName?: string
): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  const arabicVoices = voices.filter((v) => v.lang.startsWith('ar'));

  if (arabicVoices.length === 0) return null;

  // Try to find by exact voice name
  if (preferredVoiceName) {
    const namedVoice = arabicVoices.find(
      (v) => v.name.toLowerCase() === preferredVoiceName.toLowerCase()
    );
    if (namedVoice) return namedVoice;
  }

  // Try to find by preferred locale
  if (preferredLocale) {
    const localeVoice = arabicVoices.find((v) => v.lang === preferredLocale);
    if (localeVoice) return localeVoice;
  }

  // Fall back through locale preferences
  for (const locale of VOICE_LOCALE_PREFERENCE) {
    const voice = arabicVoices.find((v) => v.lang === locale);
    if (voice) return voice;
  }

  // Fall back to any Arabic voice
  return arabicVoices[0] || null;
}

/**
 * Wait for voices to be loaded
 * Some browsers load voices asynchronously
 */
export function waitForVoices(timeoutMs: number = 2000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve([]);
      return;
    }

    const voices = getAllVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      clearTimeout(timeout);
      resolve(getAllVoices());
    };

    const timeout = setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(getAllVoices());
    }, timeoutMs);

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  });
}

// ============================================================================
// TTS State
// ============================================================================

let currentState: TTSState = 'idle';
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Get current TTS state
 */
export function getTTSState(): TTSState {
  return currentState;
}

/**
 * Get current utterance text (if speaking)
 */
export function getCurrentText(): string | null {
  return currentUtterance?.text ?? null;
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Check if paused
 */
export function isPaused(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.paused;
}

// ============================================================================
// Playback Control
// ============================================================================

/**
 * Create a TTS error object
 */
function createTTSError(
  type: TTSErrorType,
  message: string,
  originalError?: Error | SpeechSynthesisErrorEvent
): TTSError {
  return { type, message, originalError };
}

/**
 * Speak the given text using TTS
 */
export function speak(text: string, options: TTSOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check support
    if (!isTTSSupported()) {
      currentState = 'error';
      reject(
        createTTSError(
          'not-supported',
          'Text-to-speech is not supported in this browser'
        )
      );
      return;
    }

    // Merge with default options
    const opts = { ...DEFAULT_TTS_OPTIONS, ...options };

    // Find appropriate voice
    const voice = findBestArabicVoice(opts.locale, opts.voiceName);
    if (!voice) {
      currentState = 'error';
      reject(
        createTTSError(
          'no-voice',
          'No Arabic voice is available on this device'
        )
      );
      return;
    }

    // Stop any current speech
    stop();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = opts.rate;
    utterance.pitch = opts.pitch;
    utterance.volume = opts.volume;
    utterance.lang = voice.lang;

    currentUtterance = utterance;
    currentState = 'loading';

    // Event handlers
    utterance.onstart = () => {
      currentState = 'speaking';
    };

    utterance.onend = () => {
      currentState = 'idle';
      currentUtterance = null;
      resolve();
    };

    utterance.onerror = (event) => {
      currentState = 'error';
      currentUtterance = null;

      let errorType: TTSErrorType = 'unknown';
      let message = 'An unknown error occurred';

      switch (event.error) {
        case 'canceled':
          errorType = 'cancelled';
          message = 'Speech was cancelled';
          // Cancelled is not really an error, just resolve
          resolve();
          return;
        case 'interrupted':
          errorType = 'interrupted';
          message = 'Speech was interrupted';
          break;
        case 'audio-busy':
          errorType = 'audio-busy';
          message = 'Audio is busy';
          break;
        case 'network':
          errorType = 'network';
          message = 'Network error loading voice';
          break;
        default:
          message = `Speech error: ${event.error}`;
      }

      reject(createTTSError(errorType, message, event));
    };

    utterance.onpause = () => {
      currentState = 'paused';
    };

    utterance.onresume = () => {
      currentState = 'speaking';
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop current speech
 */
export function stop(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
  currentState = 'idle';
  currentUtterance = null;
}

/**
 * Pause current speech
 */
export function pause(): void {
  if (!isTTSSupported()) return;
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    currentState = 'paused';
  }
}

/**
 * Resume paused speech
 */
export function resume(): void {
  if (!isTTSSupported()) return;
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    currentState = 'speaking';
  }
}

// ============================================================================
// Service Object (for dependency injection / mocking)
// ============================================================================

/**
 * Create a TTS service instance
 * Useful for dependency injection and testing
 */
export function createTTSService(): TTSService {
  return {
    isSupported: isTTSSupported,
    getArabicVoices,
    speak,
    stop,
    pause,
    resume,
    getState: getTTSState,
    isSpeaking,
  };
}

/**
 * Default TTS service instance
 */
export const ttsService = createTTSService();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Speak with automatic retry on failure
 */
export async function speakWithRetry(
  text: string,
  options: TTSOptions = {},
  maxRetries: number = 2
): Promise<void> {
  let lastError: TTSError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await speak(text, options);
      return;
    } catch (error) {
      lastError = error as TTSError;
      // Don't retry for unsupported or no voice errors
      if (
        lastError.type === 'not-supported' ||
        lastError.type === 'no-voice'
      ) {
        throw lastError;
      }
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  throw lastError;
}

/**
 * Speak a word slowly for learning
 */
export function speakSlowly(text: string, options: TTSOptions = {}): Promise<void> {
  return speak(text, {
    ...options,
    rate: Math.min(options.rate ?? 0.7, 0.7), // Max 0.7 for slow mode
  });
}

/**
 * Speak at normal conversational speed
 */
export function speakNormal(text: string, options: TTSOptions = {}): Promise<void> {
  return speak(text, {
    ...options,
    rate: options.rate ?? 1.0,
  });
}

/**
 * Speak at faster speed for fluency practice
 */
export function speakFast(text: string, options: TTSOptions = {}): Promise<void> {
  return speak(text, {
    ...options,
    rate: Math.max(options.rate ?? 1.3, 1.3), // Min 1.3 for fast mode
  });
}
