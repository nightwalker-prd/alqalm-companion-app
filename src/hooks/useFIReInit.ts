/**
 * Hook for initializing the FIRe (Fractional Implicit Repetition) system.
 *
 * This hook builds the encompassing graph from lesson data and sets it up
 * for use by the FIRe spaced repetition algorithm.
 *
 * Should be called once at app initialization.
 */

import { useEffect, useState, useRef } from 'react';
import { buildEncompassingGraph } from '../lib/encompassingGraph';
import { getAllLessonsForGraph } from '../lib/contentStats';
import {
  setEncompassingGraph,
  getEncompassingGraph,
} from '../lib/progressService';
import type { EncompassingGraph } from '../types/fire';

export interface UseFIReInitResult {
  /** Whether the FIRe system has been initialized */
  isInitialized: boolean;
  /** The encompassing graph (null if not initialized) */
  graph: EncompassingGraph | null;
  /** Any error that occurred during initialization */
  error: Error | null;
  /** Statistics about the graph */
  stats: {
    nodeCount: number;
    edgeCount: number;
  } | null;
}

/**
 * Initialize the FIRe spaced repetition system.
 *
 * This hook:
 * 1. Builds the encompassing graph from all lesson data
 * 2. Sets the graph in the progress service
 * 3. Returns the initialization status
 *
 * The graph is built only once and cached.
 *
 * @returns Initialization status and graph reference
 */
export function useFIReInit(): UseFIReInitResult {
  // Use lazy initialization to check for existing graph
  const [state, setState] = useState(() => {
    const existingGraph = getEncompassingGraph();
    if (existingGraph) {
      return {
        isInitialized: true,
        graph: existingGraph,
        error: null as Error | null,
        stats: calculateStats(existingGraph),
      };
    }
    return {
      isInitialized: false,
      graph: null as EncompassingGraph | null,
      error: null as Error | null,
      stats: null as { nodeCount: number; edgeCount: number } | null,
    };
  });

  const initRef = useRef(false);

  useEffect(() => {
    // Skip if already initialized (either from lazy init or previous effect run)
    if (state.isInitialized || initRef.current) return;
    initRef.current = true;

    try {
      // Build the encompassing graph from lesson data
      const lessons = getAllLessonsForGraph();
      const newGraph = buildEncompassingGraph(lessons, {
        includeLessonEncompassing: true,
        adjacentLessonWeight: 0.5,
        sameLesonItemWeight: 0.3,
        crossBookWeight: 0.2,
        minWeight: 0.05,
      });

      // Set the graph in the progress service
      setEncompassingGraph(newGraph);

      // Update state
      const newStats = calculateStats(newGraph);
      setState({
        isInitialized: true,
        graph: newGraph,
        error: null,
        stats: newStats,
      });

      // Log initialization success in development
      if (import.meta.env.DEV) {
        console.log(
          `[FIRe] Initialized encompassing graph: ${newStats.nodeCount} nodes, ${newStats.edgeCount} edges`
        );
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
      console.error('[FIRe] Failed to initialize encompassing graph:', err);
    }
  }, [state.isInitialized]);

  return state;
}

/**
 * Calculate statistics about an encompassing graph
 */
function calculateStats(graph: EncompassingGraph): { nodeCount: number; edgeCount: number } {
  const nodes = new Set<string>();
  let edgeCount = 0;

  for (const [from, edges] of Object.entries(graph.encompasses)) {
    nodes.add(from);
    for (const { target } of edges) {
      nodes.add(target);
      edgeCount++;
    }
  }

  return { nodeCount: nodes.size, edgeCount };
}

/**
 * Initialize FIRe synchronously (for use outside React).
 *
 * This function builds and sets the encompassing graph immediately.
 * Use this when you need to initialize FIRe before React mounts.
 *
 * @returns The built encompassing graph
 */
export function initializeFIRe(): EncompassingGraph {
  // Check if already initialized
  const existingGraph = getEncompassingGraph();
  if (existingGraph) {
    return existingGraph;
  }

  // Build the encompassing graph from lesson data
  const lessons = getAllLessonsForGraph();
  const graph = buildEncompassingGraph(lessons, {
    includeLessonEncompassing: true,
    adjacentLessonWeight: 0.5,
    sameLesonItemWeight: 0.3,
    crossBookWeight: 0.2,
    minWeight: 0.05,
  });

  // Set the graph in the progress service
  setEncompassingGraph(graph);

  return graph;
}

export default useFIReInit;
