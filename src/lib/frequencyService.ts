/**
 * Frequency Service
 *
 * Provides frequency rank lookups for Arabic words based on Classical Arabic corpus data.
 * Used to show learners how common each word is (Paul Nation's frequency principle).
 *
 * Frequency bands based on Paul Nation's research:
 * - High frequency (1-2000): Most common words, essential for basic communication
 * - Mid frequency (2001-6000): Needed for movies and everyday conversations
 * - Low frequency (6001-9000): Required for novels and formal texts
 * - Rare (9001+): Specialized vocabulary
 *
 * This module uses lazy loading to reduce initial bundle size.
 */

import { removeTashkeel } from './arabic';

/**
 * Frequency entry from the corpus data
 */
interface FrequencyEntry {
  rank: number;
  count: number;
}

/**
 * Frequency data structure from JSON
 */
interface FrequencyData {
  version: number;
  source: string;
  topWordsCount: number;
  generatedAt: string;
  words: Record<string, FrequencyEntry>;
}

/**
 * Frequency band categories based on Paul Nation's research
 */
export type FrequencyBand = 'high' | 'mid' | 'low' | 'rare' | 'not-found';

/**
 * Frequency info for a word
 */
export interface WordFrequencyInfo {
  /** 1-indexed rank (lower = more common). null if not in corpus */
  rank: number | null;
  /** Raw occurrence count in corpus. null if not in corpus */
  count: number | null;
  /** Frequency band category */
  band: FrequencyBand;
  /** Human-readable description */
  bandLabel: string;
  /** Percentile (0-100, higher = more common) */
  percentile: number | null;
}

/**
 * Band thresholds based on Paul Nation's research
 */
const BAND_THRESHOLDS = {
  HIGH: 2000,
  MID: 6000,
  LOW: 9000,
} as const;

/**
 * Band labels for display
 */
const BAND_LABELS: Record<FrequencyBand, string> = {
  high: 'Very Common',
  mid: 'Common',
  low: 'Uncommon',
  rare: 'Rare',
  'not-found': 'Not in corpus',
};

/**
 * Frequency loading state
 */
interface FrequencyState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  data: FrequencyData | null;
}

// Module state
const state: FrequencyState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  data: null,
};

// Promise for coordinating concurrent load requests
let loadPromise: Promise<void> | null = null;

// Subscribers for state changes
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * Subscribe to frequency state changes.
 * Returns an unsubscribe function.
 */
export function subscribeFrequency(callback: Subscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of state changes
 */
function notifySubscribers(): void {
  for (const callback of subscribers) {
    callback();
  }
}

/**
 * Load frequency data asynchronously.
 * Multiple concurrent calls will share the same promise.
 */
export async function loadFrequencyData(): Promise<void> {
  // Already loaded
  if (state.isLoaded) return;

  // Already loading - return existing promise
  if (loadPromise) return loadPromise;

  // Start loading
  state.isLoading = true;
  state.error = null;
  notifySubscribers();

  loadPromise = (async () => {
    try {
      // Dynamic import for frequency data JSON
      const dataModule = await import('../content/frequency-data.json');
      state.data = dataModule.default as FrequencyData;
      state.isLoaded = true;
      state.isLoading = false;
      state.error = null;
    } catch (e) {
      state.isLoading = false;
      state.error = e instanceof Error ? e : new Error(String(e));
      throw state.error;
    } finally {
      loadPromise = null;
      notifySubscribers();
    }
  })();

  return loadPromise;
}

/**
 * Check if frequency data is loaded
 */
export function isFrequencyLoaded(): boolean {
  return state.isLoaded;
}

/**
 * Check if frequency data is currently loading
 */
export function isFrequencyLoading(): boolean {
  return state.isLoading;
}

/**
 * Get frequency loading error if any
 */
export function getFrequencyError(): Error | null {
  return state.error;
}

/**
 * Get the frequency band for a rank
 */
export function getFrequencyBand(rank: number | null): FrequencyBand {
  if (rank === null) return 'not-found';
  if (rank <= BAND_THRESHOLDS.HIGH) return 'high';
  if (rank <= BAND_THRESHOLDS.MID) return 'mid';
  if (rank <= BAND_THRESHOLDS.LOW) return 'low';
  return 'rare';
}

/**
 * Calculate percentile from rank (higher = more common)
 */
function calculatePercentile(rank: number, totalWords: number): number {
  // Percentile = 100 - (rank / totalWords * 100)
  // So rank 1 gets ~100%, and the last rank gets ~0%
  return Math.round(100 - (rank / totalWords) * 100);
}

/**
 * Look up frequency info for an Arabic word
 *
 * @param arabic - The Arabic word (with or without tashkeel)
 * @returns Frequency information for the word
 */
export function getWordFrequency(arabic: string): WordFrequencyInfo {
  // Return not-found if data not loaded
  if (!state.data) {
    return {
      rank: null,
      count: null,
      band: 'not-found',
      bandLabel: BAND_LABELS['not-found'],
      percentile: null,
    };
  }

  // Try exact match first
  let entry = state.data.words[arabic];

  // If not found, try without tashkeel
  if (!entry) {
    const stripped = removeTashkeel(arabic);
    entry = state.data.words[stripped];
  }

  if (!entry) {
    return {
      rank: null,
      count: null,
      band: 'not-found',
      bandLabel: BAND_LABELS['not-found'],
      percentile: null,
    };
  }

  const band = getFrequencyBand(entry.rank);

  return {
    rank: entry.rank,
    count: entry.count,
    band,
    bandLabel: BAND_LABELS[band],
    percentile: calculatePercentile(entry.rank, state.data.topWordsCount),
  };
}

/**
 * Get frequency info for multiple words at once
 *
 * @param words - Array of Arabic words
 * @returns Map of word to frequency info
 */
export function getWordsFrequency(words: string[]): Map<string, WordFrequencyInfo> {
  const result = new Map<string, WordFrequencyInfo>();

  for (const word of words) {
    result.set(word, getWordFrequency(word));
  }

  return result;
}

/**
 * Check if a word is in the frequency corpus
 *
 * @param arabic - The Arabic word
 * @returns True if the word is found in the corpus
 */
export function isInFrequencyCorpus(arabic: string): boolean {
  return getWordFrequency(arabic).rank !== null;
}

/**
 * Get the total number of words in the frequency corpus
 */
export function getCorpusSize(): number {
  return state.data?.topWordsCount ?? 0;
}

/**
 * Get the frequency band label
 */
export function getFrequencyBandLabel(band: FrequencyBand): string {
  return BAND_LABELS[band];
}

/**
 * Get a color for a frequency band (for UI display)
 */
export function getFrequencyBandColor(band: FrequencyBand): string {
  switch (band) {
    case 'high':
      return 'var(--color-success)';
    case 'mid':
      return 'var(--color-primary)';
    case 'low':
      return 'var(--color-gold)';
    case 'rare':
      return 'var(--color-error)';
    case 'not-found':
      return 'var(--color-ink-muted)';
  }
}

/**
 * Sort words by frequency (most common first)
 *
 * @param words - Array of Arabic words
 * @returns Sorted array (most common first, not-found at end)
 */
export function sortByFrequency(words: string[]): string[] {
  return [...words].sort((a, b) => {
    const freqA = getWordFrequency(a);
    const freqB = getWordFrequency(b);

    // Not found words go to the end
    if (freqA.rank === null && freqB.rank === null) return 0;
    if (freqA.rank === null) return 1;
    if (freqB.rank === null) return -1;

    return freqA.rank - freqB.rank;
  });
}

/**
 * Get statistics about the frequency distribution of a word list
 */
export function getFrequencyStats(words: string[]): {
  total: number;
  byBand: Record<FrequencyBand, number>;
  averageRank: number | null;
  inCorpus: number;
} {
  const byBand: Record<FrequencyBand, number> = {
    high: 0,
    mid: 0,
    low: 0,
    rare: 0,
    'not-found': 0,
  };

  let rankSum = 0;
  let rankCount = 0;

  for (const word of words) {
    const info = getWordFrequency(word);
    byBand[info.band]++;

    if (info.rank !== null) {
      rankSum += info.rank;
      rankCount++;
    }
  }

  return {
    total: words.length,
    byBand,
    averageRank: rankCount > 0 ? Math.round(rankSum / rankCount) : null,
    inCorpus: rankCount,
  };
}

/**
 * Reset frequency state (for testing)
 */
export function resetFrequency(): void {
  state.isLoaded = false;
  state.isLoading = false;
  state.error = null;
  state.data = null;
  loadPromise = null;
}
