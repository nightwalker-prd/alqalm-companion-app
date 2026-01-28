/**
 * Free Recall Utilities
 * 
 * Based on "Make It Stick" research - pure recall exercises where users
 * list everything they remember without prompts strengthen memory more
 * effectively than recognition-based exercises.
 * 
 * Key principles:
 * - No hints or prompts - users must generate from memory
 * - Recall by category (lesson, root family)
 * - Immediate feedback on what was remembered and forgotten
 */

import { getWordsByLesson, getWordsByRoot, getAllRoots, type WordData } from './vocabularyAsync';
import { getProgress } from './progressService';
import { normalizeArabic, removeTashkeel } from './arabic';
import { fisherYatesShuffle } from './interleave';
import { getAllLessonMeta } from './contentStats';

/**
 * Types of free recall prompts
 */
export type RecallPromptType = 'lesson' | 'root';

/**
 * A free recall prompt
 */
export interface RecallPrompt {
  type: RecallPromptType;
  id: string;           // lesson ID or root string
  label: string;        // Display label
  labelArabic?: string; // Arabic label if applicable
  expectedWords: WordData[];
  description: string;
}

/**
 * Result of a free recall attempt
 */
export interface RecallResult {
  prompt: RecallPrompt;
  recalled: WordData[];
  forgotten: WordData[];
  extra: string[];       // Words user entered that weren't in the expected list
  recallRate: number;    // 0-1, percentage of expected words recalled
  timestamp: number;
}

/**
 * Minimum words in a category for it to be a valid recall prompt
 */
export const MIN_WORDS_FOR_RECALL = 3;

/**
 * Maximum words to include in a recall prompt
 */
export const MAX_WORDS_FOR_RECALL = 20;

/**
 * Get lesson recall prompts for lessons the user has practiced
 */
export function getLessonRecallPrompts(): RecallPrompt[] {
  const progress = getProgress();
  const prompts: RecallPrompt[] = [];

  // Build a map of lesson IDs to metadata for quick lookup
  const lessonMetaMap = new Map(
    getAllLessonMeta().map(meta => [meta.id, meta])
  );

  // Get lessons that have been practiced
  for (const [lessonId, lessonProgress] of Object.entries(progress.lessonProgress)) {
    if (!lessonProgress.started) continue;

    const words = getWordsByLesson(lessonId);
    if (words.length < MIN_WORDS_FOR_RECALL) continue;

    // Get lesson metadata for proper title display
    const lessonMeta = lessonMetaMap.get(lessonId);
    const label = lessonMeta?.titleEnglish || lessonId;
    const labelArabic = lessonMeta?.titleArabic;

    prompts.push({
      type: 'lesson',
      id: lessonId,
      label,
      labelArabic,
      expectedWords: words.slice(0, MAX_WORDS_FOR_RECALL),
      description: `List all vocabulary words you remember from this lesson`,
    });
  }

  // Sort by lesson ID
  prompts.sort((a, b) => a.id.localeCompare(b.id));

  return prompts;
}

/**
 * Get root family recall prompts for roots the user has encountered
 */
export function getRootRecallPrompts(): RecallPrompt[] {
  const progress = getProgress();
  const prompts: RecallPrompt[] = [];
  
  // Get roots from words the user has practiced
  const practicedRoots = new Set<string>();
  
  for (const wordId of Object.keys(progress.wordMastery)) {
    // Extract root from word data
    const words = getAllRoots().flatMap(root => getWordsByRoot(root));
    const word = words.find(w => w.id === wordId);
    if (word?.root) {
      practicedRoots.add(word.root);
    }
  }
  
  // Create prompts for practiced roots
  for (const root of practicedRoots) {
    const words = getWordsByRoot(root);
    if (words.length < MIN_WORDS_FOR_RECALL) continue;
    
    prompts.push({
      type: 'root',
      id: root,
      label: `Root: ${root}`,
      labelArabic: root,
      expectedWords: words.slice(0, MAX_WORDS_FOR_RECALL),
      description: `List all words you know from the root ${root}`,
    });
  }
  
  return prompts;
}

/**
 * Get all available recall prompts
 */
export function getAllRecallPrompts(): RecallPrompt[] {
  return [
    ...getLessonRecallPrompts(),
    ...getRootRecallPrompts(),
  ];
}

/**
 * Get a random recall prompt suitable for the user
 */
export function getRandomRecallPrompt(): RecallPrompt | null {
  const prompts = getAllRecallPrompts();
  if (prompts.length === 0) return null;
  
  const shuffled = fisherYatesShuffle(prompts);
  return shuffled[0];
}

/**
 * Check a user's recall attempt against expected words
 */
export function checkRecallAttempt(
  prompt: RecallPrompt,
  userInputs: string[]
): RecallResult {
  const recalled: WordData[] = [];
  const forgotten: WordData[] = [];
  const extra: string[] = [];
  
  // Normalize user inputs for comparison
  const normalizedInputs = userInputs.map(input => ({
    original: input,
    normalized: normalizeArabic(input),
    stripped: removeTashkeel(input),
  }));
  
  // Check each expected word
  for (const word of prompt.expectedWords) {
    const wordNormalized = normalizeArabic(word.arabic);
    const wordStripped = removeTashkeel(word.arabic);
    
    // Check if any user input matches this word
    const wasRecalled = normalizedInputs.some(input => 
      input.normalized === wordNormalized ||
      input.stripped === wordStripped
    );
    
    if (wasRecalled) {
      recalled.push(word);
    } else {
      forgotten.push(word);
    }
  }
  
  // Find extra words that weren't in the expected list
  for (const input of normalizedInputs) {
    const matchedWord = prompt.expectedWords.find(word => {
      const wordNormalized = normalizeArabic(word.arabic);
      const wordStripped = removeTashkeel(word.arabic);
      return input.normalized === wordNormalized || input.stripped === wordStripped;
    });
    
    if (!matchedWord && input.original.trim().length > 0) {
      extra.push(input.original);
    }
  }
  
  const recallRate = prompt.expectedWords.length > 0
    ? recalled.length / prompt.expectedWords.length
    : 0;
  
  return {
    prompt,
    recalled,
    forgotten,
    extra,
    recallRate,
    timestamp: Date.now(),
  };
}

/**
 * Check if user has enough data for free recall practice
 */
export function canDoFreeRecall(): boolean {
  const prompts = getAllRecallPrompts();
  return prompts.length > 0;
}

/**
 * Get the number of available recall prompts
 */
export function getRecallPromptCount(): number {
  return getAllRecallPrompts().length;
}

/**
 * Format recall rate as a letter grade
 */
export function getRecallGrade(recallRate: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (recallRate >= 0.9) return 'A';
  if (recallRate >= 0.8) return 'B';
  if (recallRate >= 0.7) return 'C';
  if (recallRate >= 0.6) return 'D';
  return 'F';
}

/**
 * Get feedback message based on recall rate
 */
export function getRecallFeedback(recallRate: number): string {
  if (recallRate >= 0.9) {
    return 'Excellent memory! You recalled almost everything.';
  }
  if (recallRate >= 0.8) {
    return 'Great job! Your memory is strong for these words.';
  }
  if (recallRate >= 0.7) {
    return 'Good recall! A few words need more practice.';
  }
  if (recallRate >= 0.5) {
    return 'Not bad! Keep practicing to strengthen these connections.';
  }
  if (recallRate >= 0.3) {
    return 'Some words came to mind. Review the forgotten ones.';
  }
  return 'This is challenging! Review these words and try again.';
}

/**
 * Get color class based on recall rate
 */
export function getRecallRateColorClass(recallRate: number): string {
  if (recallRate >= 0.8) return 'text-[var(--color-success)]';
  if (recallRate >= 0.5) return 'text-[var(--color-gold)]';
  return 'text-[var(--color-error)]';
}
