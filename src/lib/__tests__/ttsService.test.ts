/**
 * Tests for Text-to-Speech Service
 *
 * Since Web Speech API is browser-specific, we mock it for testing.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TTSService, VoiceInfo } from '../../types/tts';
import { DEFAULT_TTS_OPTIONS, VOICE_LOCALE_PREFERENCE } from '../../types/tts';

// ============================================================================
// Mock Web Speech API
// ============================================================================

interface MockSpeechSynthesis {
  speaking: boolean;
  paused: boolean;
  getVoices: () => SpeechSynthesisVoice[];
  speak: (utterance: SpeechSynthesisUtterance) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
}

interface MockUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null;
  onpause: (() => void) | null;
  onresume: (() => void) | null;
}

function createMockVoice(
  name: string,
  lang: string,
  localService: boolean = true
): SpeechSynthesisVoice {
  return {
    name,
    lang,
    localService,
    default: false,
    voiceURI: `urn:${name}`,
  };
}

function createMockSpeechSynthesis(): MockSpeechSynthesis {
  const arabicVoice = createMockVoice('Arabic Saudi', 'ar-SA');
  const arabicEgyptVoice = createMockVoice('Arabic Egypt', 'ar-EG');
  const englishVoice = createMockVoice('English US', 'en-US');

  return {
    speaking: false,
    paused: false,
    getVoices: () => [arabicVoice, arabicEgyptVoice, englishVoice],
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

let mockSpeechSynthesis: MockSpeechSynthesis;
let lastUtterance: MockUtterance | null = null;

// ============================================================================
// Mock TTS Service (for isolation from browser API)
// ============================================================================

/**
 * Create a mock TTS service for testing
 * This doesn't depend on the real Web Speech API
 */
export function createMockTTSService(): TTSService & {
  // Test helpers
  simulateVoicesLoaded: () => void;
  simulateSpeechStart: () => void;
  simulateSpeechEnd: () => void;
  simulateSpeechError: (error: string) => void;
  getLastSpokenText: () => string | null;
  setAvailableVoices: (voices: VoiceInfo[]) => void;
  setSupported: (supported: boolean) => void;
} {
  let isSupported = true;
  let state: 'idle' | 'loading' | 'speaking' | 'paused' | 'error' = 'idle';
  let lastSpokenText: string | null = null;
  let speakingPromiseResolve: (() => void) | null = null;
  let speakingPromiseReject: ((error: Error) => void) | null = null;
  let voices: VoiceInfo[] = [
    { name: 'Arabic Saudi', lang: 'ar-SA', isLocal: true, isDefault: false },
    { name: 'Arabic Egypt', lang: 'ar-EG', isLocal: true, isDefault: false },
  ];

  return {
    isSupported: () => isSupported,
    getArabicVoices: () => voices,
    speak: (text: string) => {
      if (!isSupported) {
        return Promise.reject(new Error('TTS not supported'));
      }
      if (voices.length === 0) {
        return Promise.reject(new Error('No Arabic voice available'));
      }
      lastSpokenText = text;
      state = 'loading';
      return new Promise((resolve, reject) => {
        speakingPromiseResolve = resolve;
        speakingPromiseReject = reject;
        // Simulate async start
        setTimeout(() => {
          state = 'speaking';
        }, 0);
      });
    },
    stop: () => {
      state = 'idle';
      if (speakingPromiseResolve) {
        speakingPromiseResolve();
        speakingPromiseResolve = null;
      }
    },
    pause: () => {
      if (state === 'speaking') {
        state = 'paused';
      }
    },
    resume: () => {
      if (state === 'paused') {
        state = 'speaking';
      }
    },
    getState: () => state,
    isSpeaking: () => state === 'speaking',

    // Test helpers
    simulateVoicesLoaded: () => {
      // Already loaded by default
    },
    simulateSpeechStart: () => {
      state = 'speaking';
    },
    simulateSpeechEnd: () => {
      state = 'idle';
      if (speakingPromiseResolve) {
        speakingPromiseResolve();
        speakingPromiseResolve = null;
      }
    },
    simulateSpeechError: (error: string) => {
      state = 'error';
      if (speakingPromiseReject) {
        speakingPromiseReject(new Error(error));
        speakingPromiseReject = null;
      }
    },
    getLastSpokenText: () => lastSpokenText,
    setAvailableVoices: (v: VoiceInfo[]) => {
      voices = v;
    },
    setSupported: (supported: boolean) => {
      isSupported = supported;
    },
  };
}

// ============================================================================
// Tests for Type Definitions
// ============================================================================

describe('TTS Types', () => {
  test('DEFAULT_TTS_OPTIONS has correct values', () => {
    expect(DEFAULT_TTS_OPTIONS.rate).toBe(0.9);
    expect(DEFAULT_TTS_OPTIONS.pitch).toBe(1.0);
    expect(DEFAULT_TTS_OPTIONS.volume).toBe(1.0);
    expect(DEFAULT_TTS_OPTIONS.locale).toBe('ar-SA');
    expect(DEFAULT_TTS_OPTIONS.voiceName).toBe('');
  });

  test('VOICE_LOCALE_PREFERENCE includes Arabic locales', () => {
    expect(VOICE_LOCALE_PREFERENCE).toContain('ar-SA');
    expect(VOICE_LOCALE_PREFERENCE).toContain('ar-EG');
    expect(VOICE_LOCALE_PREFERENCE).toContain('ar');
    expect(VOICE_LOCALE_PREFERENCE[0]).toBe('ar-SA'); // First preference
  });

  test('VOICE_LOCALE_PREFERENCE has correct order', () => {
    const saIndex = VOICE_LOCALE_PREFERENCE.indexOf('ar-SA');
    const genericIndex = VOICE_LOCALE_PREFERENCE.indexOf('ar');
    expect(saIndex).toBeLessThan(genericIndex); // SA preferred over generic
  });
});

// ============================================================================
// Tests for Mock TTS Service
// ============================================================================

describe('Mock TTS Service', () => {
  let mockTTS: ReturnType<typeof createMockTTSService>;

  beforeEach(() => {
    mockTTS = createMockTTSService();
  });

  describe('isSupported', () => {
    test('returns true by default', () => {
      expect(mockTTS.isSupported()).toBe(true);
    });

    test('returns false when set to unsupported', () => {
      mockTTS.setSupported(false);
      expect(mockTTS.isSupported()).toBe(false);
    });
  });

  describe('getArabicVoices', () => {
    test('returns default Arabic voices', () => {
      const voices = mockTTS.getArabicVoices();
      expect(voices.length).toBe(2);
      expect(voices[0].lang).toBe('ar-SA');
      expect(voices[1].lang).toBe('ar-EG');
    });

    test('returns custom voices when set', () => {
      mockTTS.setAvailableVoices([
        { name: 'Custom', lang: 'ar-JO', isLocal: false, isDefault: true },
      ]);
      const voices = mockTTS.getArabicVoices();
      expect(voices.length).toBe(1);
      expect(voices[0].lang).toBe('ar-JO');
    });
  });

  describe('speak', () => {
    test('rejects when not supported', async () => {
      mockTTS.setSupported(false);
      await expect(mockTTS.speak('مرحبا')).rejects.toThrow('TTS not supported');
    });

    test('rejects when no voices available', async () => {
      mockTTS.setAvailableVoices([]);
      await expect(mockTTS.speak('مرحبا')).rejects.toThrow('No Arabic voice');
    });

    test('stores the spoken text', () => {
      mockTTS.speak('مرحبا بالعالم');
      expect(mockTTS.getLastSpokenText()).toBe('مرحبا بالعالم');
    });

    test('sets state to loading then speaking', async () => {
      mockTTS.speak('مرحبا');
      expect(mockTTS.getState()).toBe('loading');
      
      // Wait for async start
      await new Promise((r) => setTimeout(r, 10));
      expect(mockTTS.getState()).toBe('speaking');
    });

    test('resolves when speech ends', async () => {
      const speakPromise = mockTTS.speak('مرحبا');
      
      // Simulate speech completion
      await new Promise((r) => setTimeout(r, 10));
      mockTTS.simulateSpeechEnd();
      
      await expect(speakPromise).resolves.toBeUndefined();
    });

    test('rejects when speech errors', async () => {
      const speakPromise = mockTTS.speak('مرحبا');
      
      // Simulate error
      await new Promise((r) => setTimeout(r, 10));
      mockTTS.simulateSpeechError('audio-busy');
      
      await expect(speakPromise).rejects.toThrow('audio-busy');
    });
  });

  describe('stop', () => {
    test('sets state to idle', async () => {
      mockTTS.speak('مرحبا');
      await new Promise((r) => setTimeout(r, 10));
      expect(mockTTS.getState()).toBe('speaking');
      
      mockTTS.stop();
      expect(mockTTS.getState()).toBe('idle');
    });

    test('resolves pending speak promise', async () => {
      const speakPromise = mockTTS.speak('مرحبا');
      mockTTS.stop();
      
      // Should resolve, not reject
      await expect(speakPromise).resolves.toBeUndefined();
    });
  });

  describe('pause/resume', () => {
    test('pause sets state to paused when speaking', async () => {
      mockTTS.speak('مرحبا');
      await new Promise((r) => setTimeout(r, 10));
      
      mockTTS.pause();
      expect(mockTTS.getState()).toBe('paused');
    });

    test('pause does nothing when not speaking', () => {
      expect(mockTTS.getState()).toBe('idle');
      mockTTS.pause();
      expect(mockTTS.getState()).toBe('idle');
    });

    test('resume sets state to speaking when paused', async () => {
      mockTTS.speak('مرحبا');
      await new Promise((r) => setTimeout(r, 10));
      mockTTS.pause();
      
      mockTTS.resume();
      expect(mockTTS.getState()).toBe('speaking');
    });

    test('resume does nothing when not paused', () => {
      expect(mockTTS.getState()).toBe('idle');
      mockTTS.resume();
      expect(mockTTS.getState()).toBe('idle');
    });
  });

  describe('isSpeaking', () => {
    test('returns false when idle', () => {
      expect(mockTTS.isSpeaking()).toBe(false);
    });

    test('returns true when speaking', async () => {
      mockTTS.speak('مرحبا');
      await new Promise((r) => setTimeout(r, 10));
      expect(mockTTS.isSpeaking()).toBe(true);
    });

    test('returns false when paused', async () => {
      mockTTS.speak('مرحبا');
      await new Promise((r) => setTimeout(r, 10));
      mockTTS.pause();
      expect(mockTTS.isSpeaking()).toBe(false);
    });
  });
});

// ============================================================================
// Tests for Service Functions (when browser API is mocked)
// ============================================================================

describe('TTS Service with mocked browser API', () => {
  beforeEach(() => {
    mockSpeechSynthesis = createMockSpeechSynthesis();
    lastUtterance = null;

    // Mock window.speechSynthesis
    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string;
      voice: SpeechSynthesisVoice | null = null;
      rate: number = 1;
      pitch: number = 1;
      volume: number = 1;
      lang: string = '';
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
      onpause: (() => void) | null = null;
      onresume: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
        lastUtterance = this as MockUtterance;
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Import the actual service after mocking
  test('isTTSSupported returns true when API is available', async () => {
    const { isTTSSupported } = await import('../ttsService');
    expect(isTTSSupported()).toBe(true);
  });

  test('getAllVoices returns voices from browser', async () => {
    const { getAllVoices } = await import('../ttsService');
    const voices = getAllVoices();
    expect(voices.length).toBe(3);
  });

  test('getArabicVoices filters to Arabic only', async () => {
    const { getArabicVoices } = await import('../ttsService');
    const voices = getArabicVoices();
    expect(voices.length).toBe(2);
    expect(voices.every((v) => v.lang.startsWith('ar'))).toBe(true);
  });

  test('findBestArabicVoice prefers ar-SA', async () => {
    const { findBestArabicVoice } = await import('../ttsService');
    const voice = findBestArabicVoice();
    expect(voice?.lang).toBe('ar-SA');
  });

  test('findBestArabicVoice uses preferred locale', async () => {
    const { findBestArabicVoice } = await import('../ttsService');
    const voice = findBestArabicVoice('ar-EG');
    expect(voice?.lang).toBe('ar-EG');
  });

  test('speak calls speechSynthesis.speak', async () => {
    const { speak, stop } = await import('../ttsService');
    
    // Don't await - it won't resolve without simulating onend
    speak('مرحبا');
    
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    expect(lastUtterance?.text).toBe('مرحبا');
    
    // Cleanup
    stop();
  });

  test('speak sets utterance properties from options', async () => {
    const { speak, stop } = await import('../ttsService');
    
    speak('مرحبا', { rate: 0.5, pitch: 1.5, volume: 0.8 });
    
    expect(lastUtterance?.rate).toBe(0.5);
    expect(lastUtterance?.pitch).toBe(1.5);
    expect(lastUtterance?.volume).toBe(0.8);
    
    stop();
  });

  test('stop calls speechSynthesis.cancel', async () => {
    const { stop } = await import('../ttsService');
    stop();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });
});

// ============================================================================
// Tests for Utility Functions
// ============================================================================

describe('TTS Utility Functions', () => {
  let mockTTS: ReturnType<typeof createMockTTSService>;

  beforeEach(() => {
    mockTTS = createMockTTSService();
  });

  test('mock service can be used for integration testing', async () => {
    // This demonstrates how to use the mock in component tests
    const text = 'مرحبا بكم';
    
    // Start speaking
    const speakPromise = mockTTS.speak(text);
    expect(mockTTS.getLastSpokenText()).toBe(text);
    
    // Wait for speaking to start
    await new Promise((r) => setTimeout(r, 10));
    expect(mockTTS.getState()).toBe('speaking');
    expect(mockTTS.isSpeaking()).toBe(true);
    
    // Simulate completion
    mockTTS.simulateSpeechEnd();
    await speakPromise;
    
    expect(mockTTS.getState()).toBe('idle');
    expect(mockTTS.isSpeaking()).toBe(false);
  });

  test('mock service handles pause/resume cycle', async () => {
    mockTTS.speak('مرحبا');
    await new Promise((r) => setTimeout(r, 10));
    
    expect(mockTTS.isSpeaking()).toBe(true);
    
    mockTTS.pause();
    expect(mockTTS.getState()).toBe('paused');
    expect(mockTTS.isSpeaking()).toBe(false);
    
    mockTTS.resume();
    expect(mockTTS.getState()).toBe('speaking');
    expect(mockTTS.isSpeaking()).toBe(true);
    
    mockTTS.stop();
    expect(mockTTS.getState()).toBe('idle');
  });
});
