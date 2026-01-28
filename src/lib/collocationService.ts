/**
 * Collocation Service
 * 
 * Provides lazy loading and caching of collocation data.
 * Collocations are loaded per-book when needed.
 */

import type { Collocation } from '../types/collocation';

/**
 * Collocation loading state
 */
interface CollocationState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  collocations: Collocation[];
  collocationMap: Map<string, Collocation>;
  lessonMap: Map<string, Collocation[]>;
  wordMap: Map<string, Collocation[]>;
}

// Module state - keyed by book (book1, book2, etc.)
const stateByBook: Map<string, CollocationState> = new Map();

// Promise cache for concurrent load requests
const loadPromises: Map<string, Promise<void>> = new Map();

/**
 * Create initial state for a book
 */
function createInitialState(): CollocationState {
  return {
    isLoaded: false,
    isLoading: false,
    error: null,
    collocations: [],
    collocationMap: new Map(),
    lessonMap: new Map(),
    wordMap: new Map(),
  };
}

/**
 * Get or create state for a book
 */
function getState(book: string): CollocationState {
  let state = stateByBook.get(book);
  if (!state) {
    state = createInitialState();
    stateByBook.set(book, state);
  }
  return state;
}

/**
 * Build lookup maps from collocation array
 */
function buildMaps(state: CollocationState, collocations: Collocation[]): void {
  state.collocations = collocations;
  state.collocationMap.clear();
  state.lessonMap.clear();
  state.wordMap.clear();

  for (const collocation of collocations) {
    // Collocation ID map
    state.collocationMap.set(collocation.id, collocation);

    // Lesson map
    const lessonCollocations = state.lessonMap.get(collocation.lessonId) || [];
    lessonCollocations.push(collocation);
    state.lessonMap.set(collocation.lessonId, lessonCollocations);

    // Word map (each word ID points to all collocations containing it)
    for (const wordId of collocation.wordIds) {
      const wordCollocations = state.wordMap.get(wordId) || [];
      wordCollocations.push(collocation);
      state.wordMap.set(wordId, wordCollocations);
    }
  }
}

/**
 * Load collocations for a specific book asynchronously.
 * Multiple concurrent calls will share the same promise.
 */
export async function loadCollocations(book: string): Promise<void> {
  const state = getState(book);

  if (state.isLoaded) {
    return;
  }

  // Return existing promise if already loading
  const existingPromise = loadPromises.get(book);
  if (existingPromise) {
    return existingPromise;
  }

  state.isLoading = true;

  const promise = (async () => {
    try {
      // Dynamic import based on book
      let data: Collocation[];
      switch (book) {
        case 'book1':
          data = (await import('../content/book1/collocations.json')).default as Collocation[];
          break;
        case 'book2':
          // Will be added later
          data = [];
          break;
        case 'book3':
          // Will be added later
          data = [];
          break;
        default:
          throw new Error(`Unknown book: ${book}`);
      }

      buildMaps(state, data);
      state.isLoaded = true;
      state.error = null;
    } catch (error) {
      state.error = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to load collocations for ${book}:`, error);
    } finally {
      state.isLoading = false;
      loadPromises.delete(book);
    }
  })();

  loadPromises.set(book, promise);
  return promise;
}

/**
 * Get all collocations for a book (assumes already loaded)
 */
export function getCollocations(book: string): Collocation[] {
  const state = stateByBook.get(book);
  return state?.collocations || [];
}

/**
 * Get a single collocation by ID
 */
export function getCollocationById(book: string, id: string): Collocation | undefined {
  const state = stateByBook.get(book);
  return state?.collocationMap.get(id);
}

/**
 * Get collocations for a specific lesson
 */
export function getCollocationsForLesson(book: string, lessonId: string): Collocation[] {
  const state = stateByBook.get(book);
  return state?.lessonMap.get(lessonId) || [];
}

/**
 * Get collocations containing a specific word
 */
export function getCollocationsForWord(book: string, wordId: string): Collocation[] {
  const state = stateByBook.get(book);
  return state?.wordMap.get(wordId) || [];
}

/**
 * Check if collocations are loaded for a book
 */
export function isLoaded(book: string): boolean {
  const state = stateByBook.get(book);
  return state?.isLoaded || false;
}

/**
 * Check if collocations are currently loading
 */
export function isLoading(book: string): boolean {
  const state = stateByBook.get(book);
  return state?.isLoading || false;
}

/**
 * Get loading error if any
 */
export function getError(book: string): Error | null {
  const state = stateByBook.get(book);
  return state?.error || null;
}

/**
 * Clear all cached collocations (useful for testing)
 */
export function clearCache(): void {
  stateByBook.clear();
  loadPromises.clear();
}
