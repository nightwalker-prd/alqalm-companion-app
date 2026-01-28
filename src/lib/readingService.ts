/**
 * Async reading content loading module.
 *
 * This module provides lazy loading of reading passages to reduce
 * the initial bundle size. Passages are loaded on-demand and cached.
 * Implements Paul Nation's Strand 1: Meaning-focused Input.
 */

import type {
  ReadingPassage,
  ReadingManifest,
  ReadingProgress,
  ReadingData,
  ReadingFilters,
  ReadingStats,
  PassageLevel,
} from '../types/reading';
import { CURRENT_READING_VERSION } from '../types/reading';

const STORAGE_KEY = 'madina-reading-progress';

/**
 * Reading content loading state
 */
interface ReadingState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  passages: ReadingPassage[];
  passageMap: Map<string, ReadingPassage>;
  categoryMap: Map<string, ReadingPassage[]>;
  levelMap: Map<PassageLevel, ReadingPassage[]>;
  manifest: ReadingManifest | null;
}

// Module state
const state: ReadingState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  passages: [],
  passageMap: new Map(),
  categoryMap: new Map(),
  levelMap: new Map(),
  manifest: null,
};

// Promise for coordinating concurrent load requests
let loadPromise: Promise<void> | null = null;

// Subscribers for state changes
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * Subscribe to reading state changes.
 * Returns an unsubscribe function.
 */
export function subscribe(callback: Subscriber): () => void {
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
 * Build lookup maps from passage array
 */
function buildMaps(passages: ReadingPassage[]): void {
  state.passages = passages;
  state.passageMap.clear();
  state.categoryMap.clear();
  state.levelMap.clear();

  for (const passage of passages) {
    // Passage ID map
    state.passageMap.set(passage.id, passage);

    // Category map
    const categoryPassages = state.categoryMap.get(passage.category) || [];
    categoryPassages.push(passage);
    state.categoryMap.set(passage.category, categoryPassages);

    // Level map
    const levelPassages = state.levelMap.get(passage.level) || [];
    levelPassages.push(passage);
    state.levelMap.set(passage.level, levelPassages);
  }
}

/**
 * Load reading content asynchronously.
 * Multiple concurrent calls will share the same promise.
 * Notifies subscribers when loading completes.
 */
export async function loadReading(): Promise<void> {
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
      // Dynamic imports for reading JSON files
      const [passagesModule, manifestModule] = await Promise.all([
        import('../content/reading/passages.json'),
        import('../content/reading/manifest.json'),
      ]);

      const passagesData = passagesModule.default as {
        version: number;
        passages: ReadingPassage[];
      };

      // Build lookup maps
      buildMaps(passagesData.passages);

      state.manifest = manifestModule.default as ReadingManifest;
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
 * Check if reading content is loaded
 */
export function isReadingLoaded(): boolean {
  return state.isLoaded;
}

/**
 * Check if reading content is currently loading
 */
export function isReadingLoading(): boolean {
  return state.isLoading;
}

/**
 * Get reading loading error if any
 */
export function getReadingError(): Error | null {
  return state.error;
}

/**
 * Get the reading manifest
 */
export function getManifest(): ReadingManifest | null {
  return state.manifest;
}

/**
 * Get a passage by its ID.
 * Returns null if not found or reading content not loaded.
 */
export function getPassageById(passageId: string): ReadingPassage | null {
  if (!state.isLoaded) return null;
  return state.passageMap.get(passageId) || null;
}

/**
 * Get all passages.
 * Returns empty array if reading content not loaded.
 */
export function getAllPassages(): ReadingPassage[] {
  return state.passages;
}

/**
 * Get passages filtered by level.
 * Returns empty array if reading content not loaded or level not found.
 */
export function getPassagesByLevel(level: PassageLevel): ReadingPassage[] {
  if (!state.isLoaded) return [];
  return state.levelMap.get(level) || [];
}

/**
 * Get passages filtered by category.
 * Returns empty array if reading content not loaded or category not found.
 */
export function getPassagesByCategory(category: string): ReadingPassage[] {
  if (!state.isLoaded) return [];
  return state.categoryMap.get(category) || [];
}

/**
 * Get all unique categories.
 * Returns empty array if reading content not loaded.
 */
export function getCategories(): string[] {
  if (!state.isLoaded) return [];
  return Array.from(state.categoryMap.keys()).sort();
}

/**
 * Get the total count of passages.
 * Returns 0 if reading content not loaded.
 */
export function getPassageCount(): number {
  return state.passages.length;
}

/**
 * Filter passages by multiple criteria
 */
export function filterPassages(filters: ReadingFilters): ReadingPassage[] {
  if (!state.isLoaded) return [];

  let result = state.passages;

  // Filter by level
  if (filters.level && filters.level !== 'all') {
    result = result.filter((p) => p.level === filters.level);
  }

  // Filter by category
  if (filters.category && filters.category !== 'all') {
    result = result.filter((p) => p.category === filters.category);
  }

  // Filter by read status
  if (filters.readStatus && filters.readStatus !== 'all') {
    const progress = getReadingData();
    if (filters.readStatus === 'read') {
      result = result.filter((p) => progress.passageProgress[p.id]?.completed);
    } else {
      result = result.filter((p) => !progress.passageProgress[p.id]?.completed);
    }
  }

  // Filter by search query
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.titleAr.includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  return result;
}

// ============================================================================
// Reading Progress (localStorage)
// ============================================================================

/**
 * Get initial empty reading data
 */
function getEmptyReadingData(): ReadingData {
  return {
    version: CURRENT_READING_VERSION,
    passageProgress: {},
    stats: {
      totalTimesRead: 0,
      lastReadDate: null,
    },
  };
}

/**
 * Load reading data from localStorage
 */
export function getReadingData(): ReadingData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getEmptyReadingData();

    const data = JSON.parse(stored) as ReadingData;

    // Handle version migrations if needed
    if (data.version !== CURRENT_READING_VERSION) {
      // For now, just update version; add migrations as needed
      data.version = CURRENT_READING_VERSION;
      saveReadingData(data);
    }

    return data;
  } catch {
    return getEmptyReadingData();
  }
}

/**
 * Save reading data to localStorage
 */
function saveReadingData(data: ReadingData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full or disabled
    console.warn('Failed to save reading progress to localStorage');
  }
}

/**
 * Get progress for a specific passage
 */
export function getPassageProgress(passageId: string): ReadingProgress | null {
  const data = getReadingData();
  return data.passageProgress[passageId] || null;
}

/**
 * Mark a passage as read (or increment read count if already read)
 */
export function markPassageRead(passageId: string): ReadingProgress {
  const data = getReadingData();
  const now = Date.now();

  const existing = data.passageProgress[passageId];

  const progress: ReadingProgress = {
    passageId,
    completed: true,
    timesRead: (existing?.timesRead || 0) + 1,
    firstReadDate: existing?.firstReadDate || now,
    lastReadDate: now,
  };

  data.passageProgress[passageId] = progress;
  data.stats.totalTimesRead += 1;
  data.stats.lastReadDate = now;

  saveReadingData(data);
  notifySubscribers();

  return progress;
}

/**
 * Get reading statistics
 */
export function getReadingStats(): ReadingStats {
  const data = getReadingData();

  // Count read passages by level
  const readByLevel = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  for (const passageId of Object.keys(data.passageProgress)) {
    if (data.passageProgress[passageId]?.completed) {
      const passage = state.passageMap.get(passageId);
      if (passage) {
        readByLevel[passage.level]++;
      }
    }
  }

  // Get totals by level from manifest or calculate from loaded data
  const totalByLevel = state.manifest?.byLevel || {
    beginner: state.levelMap.get('beginner')?.length || 0,
    intermediate: state.levelMap.get('intermediate')?.length || 0,
    advanced: state.levelMap.get('advanced')?.length || 0,
  };

  return {
    totalPassages: state.passages.length || state.manifest?.passageCount || 0,
    passagesRead: Object.values(data.passageProgress).filter((p) => p.completed)
      .length,
    totalEncounters: data.stats.totalTimesRead,
    byLevel: {
      beginner: {
        total: totalByLevel.beginner,
        read: readByLevel.beginner,
      },
      intermediate: {
        total: totalByLevel.intermediate,
        read: readByLevel.intermediate,
      },
      advanced: {
        total: totalByLevel.advanced,
        read: readByLevel.advanced,
      },
    },
  };
}

/**
 * Clear all reading progress (for testing/reset)
 */
export function clearReadingProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
  notifySubscribers();
}

/**
 * Reset reading state (for testing)
 */
export function resetReading(): void {
  state.isLoaded = false;
  state.isLoading = false;
  state.error = null;
  state.passages = [];
  state.passageMap.clear();
  state.categoryMap.clear();
  state.levelMap.clear();
  state.manifest = null;
  loadPromise = null;
}
