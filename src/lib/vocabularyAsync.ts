/**
 * Async vocabulary loading module.
 *
 * This module provides lazy loading of vocabulary data to reduce
 * the initial bundle size. Vocabulary is loaded on-demand and cached.
 */

/**
 * Word data structure from vocabulary.json files
 */
export interface WordData {
  id: string;
  arabic: string;
  english: string;
  root: string | null;
  lesson: string;
  partOfSpeech: string;
}

/**
 * Vocabulary loading state
 */
interface VocabularyState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  words: WordData[];
  wordMap: Map<string, WordData>;
  lessonMap: Map<string, WordData[]>;
  rootMap: Map<string, WordData[]>;
}

// Module state
const state: VocabularyState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  words: [],
  wordMap: new Map(),
  lessonMap: new Map(),
  rootMap: new Map(),
};

// Promise for coordinating concurrent load requests
let loadPromise: Promise<void> | null = null;

// Subscribers for state changes
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * Subscribe to vocabulary state changes.
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
 * Build lookup maps from word array
 */
function buildMaps(words: WordData[]): void {
  state.words = words;
  state.wordMap.clear();
  state.lessonMap.clear();
  state.rootMap.clear();

  for (const word of words) {
    // Word ID map
    state.wordMap.set(word.id, word);

    // Lesson map
    const lessonWords = state.lessonMap.get(word.lesson) || [];
    lessonWords.push(word);
    state.lessonMap.set(word.lesson, lessonWords);

    // Root map (only for words with roots)
    if (word.root) {
      const rootWords = state.rootMap.get(word.root) || [];
      rootWords.push(word);
      state.rootMap.set(word.root, rootWords);
    }
  }
}

/**
 * Load vocabulary data asynchronously.
 * Multiple concurrent calls will share the same promise.
 * Notifies subscribers when loading completes.
 */
export async function loadVocabulary(): Promise<void> {
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
      // Dynamic imports for vocabulary JSON files
      const [book1, book2, book3, nahw, sarf] = await Promise.all([
        import('../content/book1/vocabulary.json'),
        import('../content/book2/vocabulary.json'),
        import('../content/book3/vocabulary.json'),
        import('../content/nahw/vocabulary.json'),
        import('../content/sarf/vocabulary.json'),
      ]);

      // Combine all vocabulary
      const allWords: WordData[] = [
        ...(book1.default as WordData[]),
        ...(book2.default as WordData[]),
        ...(book3.default as WordData[]),
        ...(nahw.default as WordData[]),
        ...(sarf.default as WordData[]),
      ];

      // Build lookup maps
      buildMaps(allWords);

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
 * Check if vocabulary is loaded
 */
export function isVocabularyLoaded(): boolean {
  return state.isLoaded;
}

/**
 * Check if vocabulary is currently loading
 */
export function isVocabularyLoading(): boolean {
  return state.isLoading;
}

/**
 * Get vocabulary loading error if any
 */
export function getVocabularyError(): Error | null {
  return state.error;
}

/**
 * Get a word by its ID.
 * Returns null if not found or vocabulary not loaded.
 */
export function getWordById(wordId: string): WordData | null {
  if (!state.isLoaded) return null;
  return state.wordMap.get(wordId) || null;
}

/**
 * Get all words.
 * Returns empty array if vocabulary not loaded.
 */
export function getAllWords(): WordData[] {
  return state.words;
}

/**
 * Get all words introduced in a specific lesson.
 * Returns empty array if vocabulary not loaded or lesson not found.
 */
export function getWordsByLesson(lessonId: string): WordData[] {
  if (!state.isLoaded) return [];
  return state.lessonMap.get(lessonId) || [];
}

/**
 * Get all words sharing the same Arabic root.
 * Returns empty array if vocabulary not loaded or root not found.
 */
export function getWordsByRoot(root: string): WordData[] {
  if (!state.isLoaded) return [];
  return state.rootMap.get(root) || [];
}

/**
 * Get all unique roots in the vocabulary.
 * Returns empty array if vocabulary not loaded.
 */
export function getAllRoots(): string[] {
  if (!state.isLoaded) return [];
  return Array.from(state.rootMap.keys());
}

/**
 * Get the total count of words in the vocabulary.
 * Returns 0 if vocabulary not loaded.
 */
export function getWordCount(): number {
  return state.words.length;
}

/**
 * Reset vocabulary state (for testing)
 */
export function resetVocabulary(): void {
  state.isLoaded = false;
  state.isLoading = false;
  state.error = null;
  state.words = [];
  state.wordMap.clear();
  state.lessonMap.clear();
  state.rootMap.clear();
  loadPromise = null;
}
