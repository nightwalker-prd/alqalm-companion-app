import type { EncompassingGraph, FIReState } from '../types/fire';
import { DEFAULT_FIRE_CONFIG } from '../types/fire';
import { isDue, getDecayedMemory, selectOptimalReviews } from './fire';

export interface Exercise {
  id: string;
  lessonId: string;
  type: string;
  itemIds: string[];
}

export interface MasteryRecord {
  itemId: string;
  strength: number;
  fire?: FIReState;
}

export interface CategorizedExercises {
  weak: Exercise[];
  learning: Exercise[];
  mastered: Exercise[];
}

// Strength thresholds
const WEAK_THRESHOLD = 40;
const MASTERED_THRESHOLD = 80;

// Distribution targets for practice sessions
const WEAK_RATIO = 0.4;
const MASTERED_RATIO = 0.2;

/**
 * Fisher-Yates shuffle algorithm.
 * Shuffles array in place and returns it.
 * Per user requirements: always use Fisher-Yates for shuffling.
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]; // Create a copy to avoid modifying original

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Get the average strength for an exercise based on its items.
 */
function getExerciseStrength(
  exercise: Exercise,
  masteryMap: Map<string, number>
): number {
  if (exercise.itemIds.length === 0) return 0;

  const strengths = exercise.itemIds.map(id => masteryMap.get(id) ?? 0);
  return strengths.reduce((a, b) => a + b, 0) / strengths.length;
}

/**
 * Categorize exercises by strength into weak, learning, and mastered.
 */
export function categorizeByStrength(
  exercises: Exercise[],
  mastery: MasteryRecord[]
): CategorizedExercises {
  const masteryMap = new Map(mastery.map(m => [m.itemId, m.strength]));

  const result: CategorizedExercises = {
    weak: [],
    learning: [],
    mastered: [],
  };

  for (const exercise of exercises) {
    const strength = getExerciseStrength(exercise, masteryMap);

    if (strength < WEAK_THRESHOLD) {
      result.weak.push(exercise);
    } else if (strength >= MASTERED_THRESHOLD) {
      result.mastered.push(exercise);
    } else {
      result.learning.push(exercise);
    }
  }

  return result;
}

/**
 * Reorder exercises to avoid more than 2 consecutive exercises of the same type.
 * Uses a greedy approach that prioritizes breaking consecutive patterns.
 */
function avoidConsecutiveSameType(exercises: Exercise[]): Exercise[] {
  if (exercises.length <= 2) return exercises;

  const result: Exercise[] = [];
  const remaining = [...exercises];

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let score = 0;

      if (result.length >= 2) {
        const last = result[result.length - 1];
        const secondLast = result[result.length - 2];

        // Strong penalty for creating a triplet
        if (last.type === secondLast.type && candidate.type === last.type) {
          score = -1000;
        } else if (candidate.type !== last.type) {
          // Prefer different type from last
          score = 10;
        } else {
          // Same as last but not triplet (last two were different)
          score = 0;
        }
      } else if (result.length === 1) {
        // Prefer different type from the first item
        if (candidate.type !== result[0].type) {
          score = 5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    result.push(remaining[bestIndex]);
    remaining.splice(bestIndex, 1);
  }

  return result;
}

/**
 * Build a practice session with interleaved exercises.
 * Distribution: ~40% weak, ~40% learning, ~20% mastered.
 * Exercises are shuffled and reordered to avoid consecutive same types.
 */
export function buildPracticeSession(
  exercises: Exercise[],
  mastery: MasteryRecord[],
  count: number
): Exercise[] {
  if (exercises.length === 0) return [];

  const categorized = categorizeByStrength(exercises, mastery);

  // Calculate how many from each category
  const weakCount = Math.round(count * WEAK_RATIO);
  const masteredCount = Math.round(count * MASTERED_RATIO);
  const learningCount = count - weakCount - masteredCount;

  // Shuffle each category
  const shuffledWeak = fisherYatesShuffle(categorized.weak);
  const shuffledLearning = fisherYatesShuffle(categorized.learning);
  const shuffledMastered = fisherYatesShuffle(categorized.mastered);

  // Take from each category up to the desired count
  const selected: Exercise[] = [
    ...shuffledWeak.slice(0, weakCount),
    ...shuffledLearning.slice(0, learningCount),
    ...shuffledMastered.slice(0, masteredCount),
  ];

  // If we don't have enough, fill from any category
  const allShuffled = fisherYatesShuffle(exercises);
  const selectedIds = new Set(selected.map(e => e.id));

  for (const exercise of allShuffled) {
    if (selected.length >= count) break;
    if (!selectedIds.has(exercise.id)) {
      selected.push(exercise);
      selectedIds.add(exercise.id);
    }
  }

  // Shuffle the combined selection
  const shuffled = fisherYatesShuffle(selected);

  // Reorder to avoid consecutive same types
  const reordered = avoidConsecutiveSameType(shuffled);

  // Return only the requested count (may be less if not enough exercises)
  return reordered.slice(0, Math.min(count, exercises.length));
}

// ============================================================================
// FIRe-based Practice Session Building
// ============================================================================

/**
 * Categorize exercises by FIRe state (repNum and memory).
 */
export function categorizeByFIRe(
  exercises: Exercise[],
  mastery: MasteryRecord[]
): CategorizedExercises {
  const masteryMap = new Map(mastery.map(m => [m.itemId, m]));

  const result: CategorizedExercises = {
    weak: [],
    learning: [],
    mastered: [],
  };

  for (const exercise of exercises) {
    const avgRepNum = getExerciseAvgRepNum(exercise, masteryMap);
    const avgMemory = getExerciseAvgMemory(exercise, masteryMap);

    // Categorize by repNum (accumulated successful repetitions)
    if (avgRepNum < 1) {
      result.weak.push(exercise);
    } else if (avgRepNum >= 3 && avgMemory >= 0.5) {
      result.mastered.push(exercise);
    } else {
      result.learning.push(exercise);
    }
  }

  return result;
}

/**
 * Get average repNum for an exercise based on its items' FIRe state.
 */
function getExerciseAvgRepNum(
  exercise: Exercise,
  masteryMap: Map<string, MasteryRecord>
): number {
  if (exercise.itemIds.length === 0) return 0;

  let total = 0;
  for (const id of exercise.itemIds) {
    const record = masteryMap.get(id);
    total += record?.fire?.repNum ?? 0;
  }
  return total / exercise.itemIds.length;
}

/**
 * Get average memory for an exercise based on its items' FIRe state.
 */
function getExerciseAvgMemory(
  exercise: Exercise,
  masteryMap: Map<string, MasteryRecord>
): number {
  if (exercise.itemIds.length === 0) return 0;

  let total = 0;
  for (const id of exercise.itemIds) {
    const record = masteryMap.get(id);
    if (record?.fire) {
      total += getDecayedMemory(record.fire);
    }
  }
  return total / exercise.itemIds.length;
}

/**
 * Get all item IDs from an exercise that are due for review.
 */
export function getDueItemsFromExercise(
  exercise: Exercise,
  masteryMap: Map<string, MasteryRecord>
): string[] {
  const dueItems: string[] = [];
  for (const id of exercise.itemIds) {
    const record = masteryMap.get(id);
    if (record?.fire && isDue(record.fire, DEFAULT_FIRE_CONFIG)) {
      dueItems.push(id);
    }
  }
  return dueItems;
}

/**
 * Build a practice session using FIRe with repetition compression.
 * 
 * This function:
 * 1. Finds all due items
 * 2. Uses repetition compression to select optimal items (those that knock out the most due reviews)
 * 3. Finds exercises that cover these items
 * 4. Fills remaining slots with interleaved exercises
 */
export function buildFIRePracticeSession(
  exercises: Exercise[],
  mastery: MasteryRecord[],
  count: number,
  encompassingGraph: EncompassingGraph | null = null
): Exercise[] {
  if (exercises.length === 0) return [];

  const masteryMap = new Map(mastery.map(m => [m.itemId, m]));

  // Step 1: Find all due items
  const dueItems: string[] = [];
  for (const record of mastery) {
    if (record.fire && isDue(record.fire, DEFAULT_FIRE_CONFIG)) {
      dueItems.push(record.itemId);
    }
  }

  // Step 2: Use repetition compression if we have an encompassing graph
  let priorityItems: string[];
  if (encompassingGraph && dueItems.length > 0) {
    // Select optimal items that knock out the most due reviews
    priorityItems = selectOptimalReviews(dueItems, encompassingGraph, count, DEFAULT_FIRE_CONFIG);
  } else {
    // No graph, just use all due items sorted by urgency
    priorityItems = [...dueItems].sort((a, b) => {
      const aRecord = masteryMap.get(a);
      const bRecord = masteryMap.get(b);
      if (!aRecord?.fire || !bRecord?.fire) return 0;
      // Sort by lowest memory first (most urgent)
      return getDecayedMemory(aRecord.fire) - getDecayedMemory(bRecord.fire);
    });
  }

  // Step 3: Find exercises that cover priority items
  const selected: Exercise[] = [];
  const selectedIds = new Set<string>();
  const coveredItems = new Set<string>();

  // First, select exercises that cover priority items
  for (const itemId of priorityItems) {
    if (selected.length >= count) break;

    // Find exercises that contain this item
    for (const exercise of exercises) {
      if (selectedIds.has(exercise.id)) continue;
      if (exercise.itemIds.includes(itemId)) {
        selected.push(exercise);
        selectedIds.add(exercise.id);
        // Mark all items in this exercise as covered
        for (const id of exercise.itemIds) {
          coveredItems.add(id);
        }
        break;
      }
    }
  }

  // Step 4: Fill remaining slots using traditional interleaving
  if (selected.length < count) {
    const remaining = exercises.filter(e => !selectedIds.has(e.id));
    const categorized = categorizeByFIRe(remaining, mastery);

    // Calculate remaining slots
    const remainingCount = count - selected.length;
    const weakCount = Math.round(remainingCount * WEAK_RATIO);
    const masteredCount = Math.round(remainingCount * MASTERED_RATIO);
    const learningCount = remainingCount - weakCount - masteredCount;

    // Shuffle and select from each category
    const shuffledWeak = fisherYatesShuffle(categorized.weak);
    const shuffledLearning = fisherYatesShuffle(categorized.learning);
    const shuffledMastered = fisherYatesShuffle(categorized.mastered);

    const additional: Exercise[] = [
      ...shuffledWeak.slice(0, weakCount),
      ...shuffledLearning.slice(0, learningCount),
      ...shuffledMastered.slice(0, masteredCount),
    ];

    for (const exercise of additional) {
      if (selected.length >= count) break;
      if (!selectedIds.has(exercise.id)) {
        selected.push(exercise);
        selectedIds.add(exercise.id);
      }
    }

    // If still not enough, fill from any remaining
    const allShuffled = fisherYatesShuffle(remaining);
    for (const exercise of allShuffled) {
      if (selected.length >= count) break;
      if (!selectedIds.has(exercise.id)) {
        selected.push(exercise);
        selectedIds.add(exercise.id);
      }
    }
  }

  // Shuffle the combined selection
  const shuffled = fisherYatesShuffle(selected);

  // Reorder to avoid consecutive same types
  const reordered = avoidConsecutiveSameType(shuffled);

  return reordered.slice(0, Math.min(count, exercises.length));
}

/**
 * Calculate the "reach" of an exercise - how many due items it would knock out.
 * Used for prioritizing exercises in repetition compression.
 */
export function calculateExerciseReach(
  exercise: Exercise,
  encompassingGraph: EncompassingGraph,
  dueItems: Set<string>
): number {
  let reach = 0;

  for (const itemId of exercise.itemIds) {
    if (dueItems.has(itemId)) {
      reach += 1;
    }

    // Also count items that would be knocked out through encompassing
    const encompasses = encompassingGraph.encompasses[itemId] ?? [];
    for (const { target, weight } of encompasses) {
      if (weight >= DEFAULT_FIRE_CONFIG.knockoutWeightThreshold && dueItems.has(target)) {
        reach += weight;
      }
    }
  }

  return reach;
}
