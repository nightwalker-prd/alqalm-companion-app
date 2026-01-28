/**
 * Encompassing Graph Construction and Management
 *
 * This module builds and manages the encompassing graph for the FIRe algorithm.
 * The encompassing graph defines which topics/items implicitly practice other items.
 *
 * Encompassing relationships are derived from:
 * 1. Exercise -> ItemIds: Each exercise encompasses its itemIds (weight 1.0)
 * 2. Lesson -> Previous Lessons: Later lessons encompass earlier lessons (decaying weight)
 * 3. Item -> Co-occurring Items: Items frequently seen together develop relationships
 * 4. Manual overrides: Custom encompassing edges for specific relationships
 */

import type { EncompassingEdge, EncompassingGraph } from '../types/fire';
import type { Exercise } from '../types/exercise';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal lesson data needed for graph construction
 */
export interface LessonForGraph {
  id: string;
  book: number;
  lesson: number;
  vocabulary?: string[];
  grammarPoints?: string[];
  exercises: Array<{
    id: string;
    itemIds: string[];
  }>;
}

/**
 * Options for building the encompassing graph
 */
export interface BuildGraphOptions {
  /**
   * Include lesson-level encompassing (lesson N encompasses lesson N-1, etc.)
   * Default: true
   */
  includeLessonEncompassing?: boolean;

  /**
   * Base weight for adjacent lessons (lesson N -> lesson N-1)
   * Decays with distance. Default: 0.5
   */
  adjacentLessonWeight?: number;

  /**
   * Minimum weight to include in the graph
   * Default: 0.05
   */
  minWeight?: number;

  /**
   * Weight for items within the same lesson
   * Default: 0.3
   */
  sameLesonItemWeight?: number;

  /**
   * Weight for later books encompassing earlier books
   * Default: 0.2
   */
  crossBookWeight?: number;

  /**
   * Manual overrides to apply after automatic construction
   */
  manualOverrides?: EncompassingEdge[];
}

const DEFAULT_BUILD_OPTIONS: Required<BuildGraphOptions> = {
  includeLessonEncompassing: true,
  adjacentLessonWeight: 0.5,
  minWeight: 0.05,
  sameLesonItemWeight: 0.3,
  crossBookWeight: 0.2,
  manualOverrides: [],
};

// ============================================================================
// Graph Construction
// ============================================================================

/**
 * Add an edge to the encompassing graph (both directions)
 */
function addEdge(
  encompasses: Record<string, Array<{ target: string; weight: number }>>,
  encompassedBy: Record<string, Array<{ target: string; weight: number }>>,
  from: string,
  to: string,
  weight: number,
  minWeight: number = 0.05
): void {
  if (weight < minWeight) return;
  if (from === to) return; // No self-loops

  // Add forward edge (from encompasses to)
  if (!encompasses[from]) {
    encompasses[from] = [];
  }
  // Check if edge already exists
  const existingForward = encompasses[from].find((e) => e.target === to);
  if (existingForward) {
    // Keep the higher weight
    existingForward.weight = Math.max(existingForward.weight, weight);
  } else {
    encompasses[from].push({ target: to, weight });
  }

  // Add reverse edge (to is encompassed by from)
  if (!encompassedBy[to]) {
    encompassedBy[to] = [];
  }
  const existingReverse = encompassedBy[to].find((e) => e.target === from);
  if (existingReverse) {
    existingReverse.weight = Math.max(existingReverse.weight, weight);
  } else {
    encompassedBy[to].push({ target: from, weight });
  }
}

/**
 * Build the encompassing graph from lesson data.
 *
 * This creates a graph where:
 * - Exercises encompass their itemIds (direct relationship)
 * - Later lessons encompass earlier lessons (decaying with distance)
 * - Items in the same lesson have weak mutual encompassing
 *
 * @param lessons - Array of lessons with exercises and itemIds
 * @param options - Build options
 * @returns Encompassing graph
 */
export function buildEncompassingGraph(
  lessons: LessonForGraph[],
  options: BuildGraphOptions = {}
): EncompassingGraph {
  const opts = { ...DEFAULT_BUILD_OPTIONS, ...options };
  const encompasses: Record<string, Array<{ target: string; weight: number }>> = {};
  const encompassedBy: Record<string, Array<{ target: string; weight: number }>> = {};

  // Group lessons by book
  const lessonsByBook = new Map<number, LessonForGraph[]>();
  for (const lesson of lessons) {
    const bookLessons = lessonsByBook.get(lesson.book) ?? [];
    bookLessons.push(lesson);
    lessonsByBook.set(lesson.book, bookLessons);
  }

  // Sort lessons within each book by lesson number
  for (const bookLessons of lessonsByBook.values()) {
    bookLessons.sort((a, b) => a.lesson - b.lesson);
  }

  // Build lesson-level encompassing
  if (opts.includeLessonEncompassing) {
    for (const [bookNum, bookLessons] of lessonsByBook) {
      for (let i = 0; i < bookLessons.length; i++) {
        const currentLesson = bookLessons[i];

        // Current lesson encompasses all previous lessons in the same book
        for (let j = 0; j < i; j++) {
          const prevLesson = bookLessons[j];
          const distance = i - j;
          // Weight decays with distance: baseWeight / distance
          const weight = opts.adjacentLessonWeight / distance;
          addEdge(encompasses, encompassedBy, currentLesson.id, prevLesson.id, weight, opts.minWeight);
        }
      }

      // Later books encompass all earlier books
      if (bookNum > 1) {
        for (let prevBook = 1; prevBook < bookNum; prevBook++) {
          const prevBookLessons = lessonsByBook.get(prevBook) ?? [];
          const currentBookLessons = bookLessons;

          // Each lesson in current book weakly encompasses all lessons in previous books
          for (const currentLesson of currentBookLessons) {
            for (const prevLesson of prevBookLessons) {
              addEdge(
                encompasses,
                encompassedBy,
                currentLesson.id,
                prevLesson.id,
                opts.crossBookWeight,
                opts.minWeight
              );
            }
          }
        }
      }
    }
  }

  // Build item-level encompassing within lessons
  for (const lesson of lessons) {
    const allItems = [
      ...(lesson.vocabulary ?? []),
      ...(lesson.grammarPoints ?? []),
    ];

    // Lesson encompasses all its items
    for (const itemId of allItems) {
      addEdge(encompasses, encompassedBy, lesson.id, itemId, 1.0, opts.minWeight);
    }

    // Items in the same lesson weakly encompass each other
    // This represents the idea that practicing one word from a lesson
    // gives some context for other words learned together
    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        // Bidirectional weak encompassing
        addEdge(
          encompasses,
          encompassedBy,
          allItems[i],
          allItems[j],
          opts.sameLesonItemWeight,
          opts.minWeight
        );
        addEdge(
          encompasses,
          encompassedBy,
          allItems[j],
          allItems[i],
          opts.sameLesonItemWeight,
          opts.minWeight
        );
      }
    }
  }

  // Apply manual overrides
  for (const edge of opts.manualOverrides) {
    addEdge(encompasses, encompassedBy, edge.from, edge.to, edge.weight, 0);
  }

  return { encompasses, encompassedBy };
}

// ============================================================================
// Exercise-Level Encompassing
// ============================================================================

/**
 * Get the items encompassed by an exercise.
 *
 * This is based on the exercise's itemIds - when a student completes
 * an exercise, they implicitly practice all items referenced by it.
 *
 * @param exercise - The exercise
 * @returns Array of item IDs with weights
 */
export function getExerciseEncompasses(
  exercise: Pick<Exercise, 'itemIds'>
): Array<{ target: string; weight: number }> {
  // All items in an exercise are fully encompassed (weight 1.0)
  return exercise.itemIds.map((id) => ({ target: id, weight: 1.0 }));
}

/**
 * Build encompassing edges from exercises.
 *
 * Exercises are not stored as nodes in the main graph, but we can
 * use their itemIds to determine credit flow.
 *
 * @param exercises - Array of exercises
 * @returns Map of exercise ID to encompassed items
 */
export function buildExerciseEncompassing(
  exercises: Array<Pick<Exercise, 'id' | 'itemIds'>>
): Map<string, Array<{ target: string; weight: number }>> {
  const result = new Map<string, Array<{ target: string; weight: number }>>();

  for (const exercise of exercises) {
    result.set(exercise.id, getExerciseEncompasses(exercise));
  }

  return result;
}

// ============================================================================
// Co-occurrence Analysis
// ============================================================================

/**
 * Analyze item co-occurrence across exercises to find implicit relationships.
 *
 * Items that frequently appear together in exercises may have
 * conceptual relationships worth capturing.
 *
 * @param exercises - Array of exercises with itemIds
 * @returns Map of item pairs to co-occurrence count
 */
export function analyzeCoOccurrence(
  exercises: Array<Pick<Exercise, 'itemIds'>>
): Map<string, number> {
  const coOccurrence = new Map<string, number>();

  for (const exercise of exercises) {
    const items = exercise.itemIds;
    // Count each pair
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        // Create canonical key (sorted to avoid a-b vs b-a duplicates)
        const key = [items[i], items[j]].sort().join('::');
        coOccurrence.set(key, (coOccurrence.get(key) ?? 0) + 1);
      }
    }
  }

  return coOccurrence;
}

/**
 * Convert co-occurrence counts to encompassing weights.
 *
 * Items that co-occur frequently get higher encompassing weights,
 * indicating they implicitly practice each other.
 *
 * @param coOccurrence - Map of item pairs to counts
 * @param maxCount - Maximum co-occurrence count (for normalization)
 * @param minWeight - Minimum weight to include
 * @returns Array of encompassing edges
 */
export function coOccurrenceToEdges(
  coOccurrence: Map<string, number>,
  maxCount: number = 10,
  minWeight: number = 0.1
): EncompassingEdge[] {
  const edges: EncompassingEdge[] = [];

  for (const [key, count] of coOccurrence) {
    // Normalize to 0-1 range
    const weight = Math.min(1, count / maxCount);

    if (weight >= minWeight) {
      const [item1, item2] = key.split('::');
      // Add bidirectional edges
      edges.push({ from: item1, to: item2, weight });
      edges.push({ from: item2, to: item1, weight });
    }
  }

  return edges;
}

// ============================================================================
// Graph Analysis
// ============================================================================

/**
 * Get all items that would be knocked out by reviewing a given item.
 *
 * Uses BFS to find all reachable items through encompassing edges
 * with sufficient weight.
 *
 * @param itemId - Starting item ID
 * @param graph - Encompassing graph
 * @param minWeight - Minimum weight to traverse
 * @returns Set of item IDs that would receive significant implicit credit
 */
export function getAllEncompassed(
  itemId: string,
  graph: EncompassingGraph,
  minWeight: number = 0.5
): Set<string> {
  const result = new Set<string>();
  const queue: string[] = [itemId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const edges = graph.encompasses[current] ?? [];
    for (const { target, weight } of edges) {
      if (weight >= minWeight && !visited.has(target)) {
        result.add(target);
        queue.push(target);
      }
    }
  }

  return result;
}

/**
 * Get items that encompass a given item (items that would be penalized if this fails).
 *
 * @param itemId - Item ID
 * @param graph - Encompassing graph
 * @returns Array of items that encompass this item
 */
export function getEncompassingItems(
  itemId: string,
  graph: EncompassingGraph
): Array<{ target: string; weight: number }> {
  return graph.encompassedBy[itemId] ?? [];
}

/**
 * Calculate the "reach" of an item - how many other items it encompasses.
 *
 * Items with higher reach are more valuable to review because they
 * provide implicit credit to more items.
 *
 * @param itemId - Item ID
 * @param graph - Encompassing graph
 * @returns Number of items encompassed (directly and transitively)
 */
export function calculateReach(
  itemId: string,
  graph: EncompassingGraph
): number {
  return getAllEncompassed(itemId, graph, 0.5).size;
}

/**
 * Find the most valuable items to review (highest reach).
 *
 * @param itemIds - Array of item IDs to consider
 * @param graph - Encompassing graph
 * @param topN - Number of top items to return
 * @returns Array of item IDs sorted by reach (highest first)
 */
export function findHighReachItems(
  itemIds: string[],
  graph: EncompassingGraph,
  topN: number = 10
): string[] {
  const withReach = itemIds.map((id) => ({
    id,
    reach: calculateReach(id, graph),
  }));

  withReach.sort((a, b) => b.reach - a.reach);

  return withReach.slice(0, topN).map((item) => item.id);
}

// ============================================================================
// Graph Serialization
// ============================================================================

/**
 * Serialize the encompassing graph to JSON.
 *
 * @param graph - Encompassing graph
 * @returns JSON string
 */
export function serializeGraph(graph: EncompassingGraph): string {
  return JSON.stringify(graph, null, 2);
}

/**
 * Deserialize an encompassing graph from JSON.
 *
 * @param json - JSON string
 * @returns Encompassing graph
 */
export function deserializeGraph(json: string): EncompassingGraph {
  return JSON.parse(json) as EncompassingGraph;
}

/**
 * Create an empty encompassing graph.
 *
 * @returns Empty graph
 */
export function createEmptyGraph(): EncompassingGraph {
  return { encompasses: {}, encompassedBy: {} };
}

/**
 * Merge multiple encompassing graphs.
 *
 * When edges conflict, the higher weight is kept.
 *
 * @param graphs - Array of graphs to merge
 * @returns Merged graph
 */
export function mergeGraphs(...graphs: EncompassingGraph[]): EncompassingGraph {
  const encompasses: Record<string, Array<{ target: string; weight: number }>> = {};
  const encompassedBy: Record<string, Array<{ target: string; weight: number }>> = {};

  for (const graph of graphs) {
    for (const [from, edges] of Object.entries(graph.encompasses)) {
      for (const { target, weight } of edges) {
        addEdge(encompasses, encompassedBy, from, target, weight, 0);
      }
    }
  }

  return { encompasses, encompassedBy };
}
