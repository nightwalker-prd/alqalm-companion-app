/**
 * Async root families loading module.
 *
 * This module provides lazy loading of root families data to reduce
 * the initial bundle size. Data is loaded on-demand and cached.
 */

import type { RootFamily, Difficulty } from '../types/morphology';

/**
 * Root families loading state
 */
interface RootFamiliesState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  rootFamilies: RootFamily[];
  familyMap: Map<string, RootFamily>;
  difficultyMap: Map<Difficulty, RootFamily[]>;
}

// Module state
const state: RootFamiliesState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  rootFamilies: [],
  familyMap: new Map(),
  difficultyMap: new Map(),
};

// Promise for coordinating concurrent load requests
let loadPromise: Promise<void> | null = null;

// Subscribers for state changes
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * Subscribe to root families state changes.
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
 * Build lookup maps from root families array
 */
function buildMaps(families: RootFamily[]): void {
  state.rootFamilies = families;
  state.familyMap.clear();
  state.difficultyMap.clear();

  for (const family of families) {
    // Root -> Family map
    state.familyMap.set(family.root, family);

    // Difficulty map
    const diffFamilies = state.difficultyMap.get(family.minDifficulty) || [];
    diffFamilies.push(family);
    state.difficultyMap.set(family.minDifficulty, diffFamilies);
  }
}

/**
 * Load root families asynchronously.
 * Multiple concurrent calls will share the same promise.
 * Notifies subscribers when loading completes.
 */
export async function loadRootFamilies(): Promise<void> {
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
      // Dynamic import for root families JSON
      const dataModule = await import('../content/sarf/root-families.json');

      const data = dataModule.default as {
        rootFamilies: RootFamily[];
      };

      // Build lookup maps
      buildMaps(data.rootFamilies as RootFamily[]);

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
 * Check if root families are loaded
 */
export function isRootFamiliesLoaded(): boolean {
  return state.isLoaded;
}

/**
 * Check if root families are currently loading
 */
export function isRootFamiliesLoading(): boolean {
  return state.isLoading;
}

/**
 * Get loading error if any
 */
export function getRootFamiliesError(): Error | null {
  return state.error;
}

/**
 * Get a root family by its root string.
 * Returns null if not found or data not loaded.
 */
export function getRootFamilyByRoot(root: string): RootFamily | null {
  if (!state.isLoaded) return null;
  return state.familyMap.get(root) || null;
}

/**
 * Get all root families.
 * Returns empty array if data not loaded.
 */
export function getAllRootFamilies(): RootFamily[] {
  return state.rootFamilies;
}

/**
 * Get root families filtered by difficulty.
 * Returns empty array if data not loaded or difficulty not found.
 */
export function getRootFamiliesByDifficulty(difficulty: Difficulty): RootFamily[] {
  if (!state.isLoaded) return [];
  return state.difficultyMap.get(difficulty) || [];
}

/**
 * Get the total count of root families.
 * Returns 0 if data not loaded.
 */
export function getRootFamiliesCount(): number {
  return state.rootFamilies.length;
}

/**
 * Filter root families by multiple criteria
 */
export function filterRootFamilies(options: {
  difficulty?: Difficulty | 'all';
  searchQuery?: string;
}): RootFamily[] {
  if (!state.isLoaded) return [];

  let result = state.rootFamilies;

  // Filter by difficulty
  if (options.difficulty && options.difficulty !== 'all') {
    result = result.filter((f) => f.minDifficulty === options.difficulty);
  }

  // Filter by search query
  if (options.searchQuery && options.searchQuery.trim()) {
    const query = options.searchQuery.toLowerCase().trim();
    result = result.filter(
      (f) =>
        f.coreMeaning.toLowerCase().includes(query) ||
        f.root.includes(query) ||
        f.rootLetters.some((l) => l.includes(query)) ||
        f.words.some(
          (w) =>
            w.meaning.toLowerCase().includes(query) || w.word.includes(query)
        )
    );
  }

  return result;
}

/**
 * Reset root families state (for testing)
 */
export function resetRootFamilies(): void {
  state.isLoaded = false;
  state.isLoading = false;
  state.error = null;
  state.rootFamilies = [];
  state.familyMap.clear();
  state.difficultyMap.clear();
  loadPromise = null;
}
