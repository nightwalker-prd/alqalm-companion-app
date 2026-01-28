/**
 * Text-to-Speech (TTS) Types
 *
 * Provides types for the TTS service using Web Speech API.
 * Supports Arabic audio playback for vocabulary and reading exercises.
 */

/**
 * Supported voice locales for Arabic
 */
export type ArabicVoiceLocale =
  | 'ar-SA' // Saudi Arabic (default)
  | 'ar-EG' // Egyptian Arabic
  | 'ar-AE' // UAE Arabic
  | 'ar-JO' // Jordanian Arabic
  | 'ar-KW' // Kuwaiti Arabic
  | 'ar-LB' // Lebanese Arabic
  | 'ar-QA' // Qatari Arabic
  | 'ar';   // Generic Arabic

/**
 * TTS playback options
 */
export interface TTSOptions {
  /** Playback rate (0.1 - 10, default 1.0) */
  rate?: number;
  /** Pitch (0 - 2, default 1.0) */
  pitch?: number;
  /** Volume (0 - 1, default 1.0) */
  volume?: number;
  /** Preferred voice locale */
  locale?: ArabicVoiceLocale;
  /** Voice name (if specific voice is desired) */
  voiceName?: string;
}

/**
 * TTS playback state
 */
export type TTSState = 
  | 'idle'
  | 'loading'
  | 'speaking'
  | 'paused'
  | 'error';

/**
 * TTS error types
 */
export type TTSErrorType =
  | 'not-supported'     // Browser doesn't support TTS
  | 'no-voice'          // No Arabic voice available
  | 'cancelled'         // Playback was cancelled
  | 'interrupted'       // Playback was interrupted
  | 'audio-busy'        // Audio is already playing
  | 'network'           // Network error loading voice
  | 'unknown';          // Unknown error

/**
 * TTS error information
 */
export interface TTSError {
  type: TTSErrorType;
  message: string;
  originalError?: Error | SpeechSynthesisErrorEvent;
}

/**
 * Voice information
 */
export interface VoiceInfo {
  name: string;
  lang: string;
  isLocal: boolean;
  isDefault: boolean;
}

/**
 * TTS service interface
 * Allows for mocking in tests
 */
export interface TTSService {
  /** Check if TTS is supported */
  isSupported(): boolean;
  
  /** Get available Arabic voices */
  getArabicVoices(): VoiceInfo[];
  
  /** Speak the given text */
  speak(text: string, options?: TTSOptions): Promise<void>;
  
  /** Stop current speech */
  stop(): void;
  
  /** Pause current speech */
  pause(): void;
  
  /** Resume paused speech */
  resume(): void;
  
  /** Get current state */
  getState(): TTSState;
  
  /** Check if currently speaking */
  isSpeaking(): boolean;
}

/**
 * Default TTS options
 */
export const DEFAULT_TTS_OPTIONS: Required<TTSOptions> = {
  rate: 0.9,    // Slightly slower for learning
  pitch: 1.0,
  volume: 1.0,
  locale: 'ar-SA',
  voiceName: '',
};

/**
 * Preferred voice locale order
 * Falls back through this list if preferred voice is not available
 */
export const VOICE_LOCALE_PREFERENCE: ArabicVoiceLocale[] = [
  'ar-SA',
  'ar-AE',
  'ar-EG',
  'ar-JO',
  'ar-KW',
  'ar-LB',
  'ar-QA',
  'ar',
];
