/**
 * Fractional Implicit Repetition (FIRe) Algorithm Implementation
 *
 * This module implements the core FIRe algorithm for spaced repetition
 * in hierarchical knowledge structures. It handles:
 * - Interval calculation based on repNum
 * - Memory decay over time
 * - Credit/penalty updates after repetitions
 * - Implicit credit flow through the encompassing graph
 * - Review prioritization and repetition compression
 * - Individual learning speed calibration
 *
 * Reference: https://www.justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures/
 */

import type {
  FIReState,
  FIReConfig,
  EncompassingGraph,
  RepetitionResult,
} from '../types/fire';
import {
  DEFAULT_FIRE_STATE,
  DEFAULT_FIRE_CONFIG,
  INTERVAL_SCHEDULE,
  CREDIT_DELTAS,
  DECAY_FACTORS,
} from '../types/fire';

// ============================================================================
// Interval Calculation
// ============================================================================

/**
 * Calculate the expected interval (in days) until next review based on repNum.
 *
 * Schedule:
 * - repNum < 1: 1 day (not yet learned)
 * - repNum 1: 1 day (first successful review)
 * - repNum 2: 6 days (second successful review)
 * - repNum 3+: exponential growth (2^(repNum-1) days)
 *
 * @param repNum - Accumulated successful repetitions
 * @returns Expected interval in days
 */
export function getInterval(repNum: number): number {
  if (repNum < 1) return INTERVAL_SCHEDULE.FIRST_REP;
  if (repNum < 2) return INTERVAL_SCHEDULE.FIRST_REP;
  if (repNum < 3) return INTERVAL_SCHEDULE.SECOND_REP;

  // Exponential growth: 2^(repNum-1), capped at 365 days
  return Math.min(365, Math.round(Math.pow(INTERVAL_SCHEDULE.EXPONENTIAL_BASE, repNum - 1)));
}

/**
 * Calculate days since last repetition.
 *
 * @param lastRepDate - Timestamp of last repetition
 * @returns Number of days since last rep
 */
export function getDaysSinceRep(lastRepDate: number): number {
  const now = Date.now();
  return (now - lastRepDate) / (24 * 60 * 60 * 1000);
}

// ============================================================================
// Memory Decay
// ============================================================================

/**
 * Calculate current memory level based on time since last rep.
 * Uses exponential decay (forgetting curve).
 *
 * Memory decays to 50% at the expected interval (half-life model).
 *
 * @param state - Current FIRe state
 * @returns Decayed memory value (0-1)
 */
export function getDecayedMemory(state: FIReState): number {
  const daysSinceRep = getDaysSinceRep(state.lastRepDate);
  const interval = Math.max(1, getInterval(state.repNum));

  // Exponential decay: memory = baseMemory * 0.5^(daysSinceRep/interval)
  const decay = Math.pow(DECAY_FACTORS.MEMORY_HALFLIFE, daysSinceRep / interval);
  return state.memory * decay;
}

// ============================================================================
// Due Status
// ============================================================================

/**
 * Check if an item is due for review.
 *
 * An item is due when:
 * - Its decayed memory falls below the threshold, OR
 * - The time since last rep exceeds the expected interval
 *
 * @param state - FIRe state of the item
 * @param config - FIRe configuration
 * @returns true if the item is due for review
 */
export function isDue(
  state: FIReState,
  config: FIReConfig = DEFAULT_FIRE_CONFIG
): boolean {
  const decayedMemory = getDecayedMemory(state);
  const daysSinceRep = getDaysSinceRep(state.lastRepDate);
  const interval = getInterval(state.repNum);

  return decayedMemory < config.memoryDueThreshold || daysSinceRep >= interval;
}

/**
 * Calculate how many days an item is overdue.
 *
 * @param state - FIRe state of the item
 * @returns Number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(state: FIReState): number {
  const daysSinceRep = getDaysSinceRep(state.lastRepDate);
  const interval = getInterval(state.repNum);
  return Math.max(0, daysSinceRep - interval);
}

/**
 * Calculate days until next review is due.
 *
 * @param state - FIRe state of the item
 * @returns Days until due (negative if overdue)
 */
export function getDaysUntilDue(state: FIReState): number {
  const daysSinceRep = getDaysSinceRep(state.lastRepDate);
  const interval = getInterval(state.repNum);
  return interval - daysSinceRep;
}

// ============================================================================
// State Updates
// ============================================================================

/**
 * Update FIRe state after an explicit repetition (review).
 *
 * This is the core update function based on Skycak's model:
 * - repNum += speed * decay^failed * rawDelta
 * - memory is updated with decay and boost/reduction
 *
 * @param current - Current FIRe state
 * @param passed - Whether the student passed the repetition
 * @param quality - Quality of response (0-1), defaults to 1 if passed, 0 if failed
 * @param config - FIRe configuration
 * @returns Updated FIRe state
 */
export function updateFIReState(
  current: FIReState,
  passed: boolean,
  quality: number = passed ? 1 : 0,
  _config: FIReConfig = DEFAULT_FIRE_CONFIG
): FIReState {
  // Note: _config reserved for future use (e.g., configurable credit deltas)
  void _config;
  const now = Date.now();
  const daysSinceRep = getDaysSinceRep(current.lastRepDate);
  const expectedInterval = getInterval(current.repNum);

  // Calculate raw delta based on pass/fail and quality
  let rawDelta: number;
  if (passed) {
    rawDelta = CREDIT_DELTAS.PASS_BASE + CREDIT_DELTAS.PASS_QUALITY_MULTIPLIER * quality;
  } else {
    rawDelta = CREDIT_DELTAS.FAIL_PENALTY;
  }

  // Speed adjustment (individualized learning rate)
  const speed = current.learningSpeed;

  // Decay factor for failures when overdue
  // When a review is very overdue and failed, the penalty is amplified
  const overdueRatio = Math.max(0, daysSinceRep - expectedInterval) / Math.max(1, expectedInterval);
  const decay = 1 + overdueRatio;

  // Apply decay multiplier only for failures
  const decayMultiplier = passed ? 1 : decay;

  // Update repNum
  const newRepNum = Math.max(0, current.repNum + speed * decayMultiplier * rawDelta);

  // Update memory with decay and boost/reduction
  const memoryDecay = Math.pow(
    DECAY_FACTORS.MEMORY_HALFLIFE,
    daysSinceRep / Math.max(1, expectedInterval)
  );
  const baseMemory = current.memory * memoryDecay;
  const memoryChange = passed ? CREDIT_DELTAS.MEMORY_BOOST : CREDIT_DELTAS.MEMORY_REDUCTION;
  const newMemory = Math.max(0, Math.min(1, baseMemory + memoryChange));

  return {
    repNum: newRepNum,
    memory: newMemory,
    lastRepDate: now,
    learningSpeed: current.learningSpeed,
  };
}

/**
 * Apply implicit (fractional) credit from an encompassing item.
 *
 * Implicit credit is discounted based on:
 * - The encompassing weight
 * - Current memory (early reps count less)
 * - Learning speed (slow learners may not receive implicit credit)
 *
 * @param current - Current FIRe state
 * @param fractionalCredit - Amount of credit to apply (already weighted)
 * @param config - FIRe configuration
 * @returns Updated FIRe state
 */
export function applyImplicitCredit(
  current: FIReState,
  fractionalCredit: number,
  config: FIReConfig = DEFAULT_FIRE_CONFIG
): FIReState {
  // Skip implicit credit for slow learners if configured
  if (!config.implicitCreditForSlowLearners && current.learningSpeed < 1.0) {
    return current;
  }

  // Discount early repetitions: if memory is high, this rep is early
  // and shouldn't count for full credit
  const discount = 1 - getDecayedMemory(current) * DECAY_FACTORS.IMPLICIT_DISCOUNT_FACTOR;
  const effectiveCredit = fractionalCredit * discount;

  // Skip if credit is negligible
  if (effectiveCredit < config.minCreditThreshold) {
    return current;
  }

  const now = Date.now();

  return {
    repNum: current.repNum + effectiveCredit,
    memory: Math.min(1, current.memory + effectiveCredit * 0.3),
    lastRepDate: now,
    learningSpeed: current.learningSpeed,
  };
}

/**
 * Apply implicit penalty from a failed encompassed item.
 *
 * When a simpler (encompassed) item is failed, it indicates that
 * more advanced items that depend on it may also be at risk.
 *
 * @param current - Current FIRe state
 * @param fractionalPenalty - Penalty magnitude (positive number)
 * @param config - FIRe configuration
 * @returns Updated FIRe state
 */
export function applyImplicitPenalty(
  current: FIReState,
  fractionalPenalty: number,
  config: FIReConfig = DEFAULT_FIRE_CONFIG
): FIReState {
  if (fractionalPenalty < config.minCreditThreshold) {
    return current;
  }

  return {
    ...current,
    repNum: Math.max(0, current.repNum - fractionalPenalty * DECAY_FACTORS.PENALTY_PROPAGATION_FACTOR),
    memory: Math.max(0, current.memory - fractionalPenalty * 0.2),
  };
}

// ============================================================================
// Credit/Penalty Flow
// ============================================================================

/**
 * Flow credit down through the encompassing graph after a passed review.
 *
 * Credit flows from the reviewed item to all items it encompasses,
 * weighted by the encompassing relationship and diminishing with depth.
 *
 * @param itemId - ID of the item that was reviewed
 * @param credit - Amount of credit to flow (1.0 for full pass)
 * @param graph - Encompassing graph
 * @param mastery - Map of item IDs to FIRe states (mutated in place)
 * @param config - FIRe configuration
 * @param visited - Set of already-visited items (for cycle detection)
 * @param depth - Current recursion depth
 */
export function flowCreditDown(
  itemId: string,
  credit: number,
  graph: EncompassingGraph,
  mastery: Record<string, FIReState>,
  config: FIReConfig = DEFAULT_FIRE_CONFIG,
  visited: Set<string> = new Set(),
  depth: number = 0
): void {
  // Prevent infinite loops and excessive recursion
  if (visited.has(itemId) || depth > config.maxPropagationDepth) {
    return;
  }
  if (credit < config.minCreditThreshold) {
    return;
  }

  visited.add(itemId);

  const edges = graph.encompasses[itemId] ?? [];
  for (const { target, weight } of edges) {
    const fractionalCredit = credit * weight;

    // Apply credit to target if it exists in mastery
    if (mastery[target]) {
      mastery[target] = applyImplicitCredit(mastery[target], fractionalCredit, config);
    }

    // Recurse to deeper levels (credit diminishes)
    flowCreditDown(target, fractionalCredit, graph, mastery, config, visited, depth + 1);
  }
}

/**
 * Flow penalty up through the encompassing graph after a failed review.
 *
 * Penalty flows from the failed item to all items that encompass it,
 * because if a simpler skill is forgotten, advanced skills may be at risk.
 *
 * @param itemId - ID of the item that was failed
 * @param penalty - Penalty magnitude (positive number)
 * @param graph - Encompassing graph
 * @param mastery - Map of item IDs to FIRe states (mutated in place)
 * @param config - FIRe configuration
 * @param visited - Set of already-visited items (for cycle detection)
 * @param depth - Current recursion depth
 */
export function flowPenaltyUp(
  itemId: string,
  penalty: number,
  graph: EncompassingGraph,
  mastery: Record<string, FIReState>,
  config: FIReConfig = DEFAULT_FIRE_CONFIG,
  visited: Set<string> = new Set(),
  depth: number = 0
): void {
  // Prevent infinite loops and excessive recursion
  if (visited.has(itemId) || depth > config.maxPropagationDepth) {
    return;
  }
  if (penalty < config.minCreditThreshold) {
    return;
  }

  visited.add(itemId);

  const edges = graph.encompassedBy[itemId] ?? [];
  for (const { target, weight } of edges) {
    const fractionalPenalty = penalty * weight;

    // Apply penalty to target if it exists in mastery
    if (mastery[target]) {
      mastery[target] = applyImplicitPenalty(mastery[target], fractionalPenalty, config);
    }

    // Recurse upward (penalty diminishes)
    flowPenaltyUp(
      target,
      fractionalPenalty * DECAY_FACTORS.PENALTY_PROPAGATION_FACTOR,
      graph,
      mastery,
      config,
      visited,
      depth + 1
    );
  }
}

// ============================================================================
// Repetition Compression (Review Selection)
// ============================================================================

/**
 * Get all items that would be "knocked out" (implicitly reviewed)
 * by reviewing a given item.
 *
 * @param itemId - ID of the item to review
 * @param graph - Encompassing graph
 * @param config - FIRe configuration
 * @param visited - Set of already-visited items
 * @returns Array of item IDs that would receive significant implicit credit
 */
export function getKnockouts(
  itemId: string,
  graph: EncompassingGraph,
  config: FIReConfig = DEFAULT_FIRE_CONFIG,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(itemId)) return [];
  visited.add(itemId);

  const knockouts: string[] = [];
  const edges = graph.encompasses[itemId] ?? [];

  for (const { target, weight } of edges) {
    // Only count as knockout if weight is above threshold
    if (weight >= config.knockoutWeightThreshold) {
      knockouts.push(target);
      // Recursively get knockouts of knockouts
      knockouts.push(...getKnockouts(target, graph, config, visited));
    }
  }

  return knockouts;
}

/**
 * Select optimal reviews using repetition compression.
 *
 * Chooses reviews that "knock out" the most other due items,
 * minimizing total explicit reviews needed.
 *
 * @param dueItems - Array of item IDs that are due for review
 * @param graph - Encompassing graph
 * @param maxReviews - Maximum number of reviews to select
 * @param config - FIRe configuration
 * @returns Array of item IDs to review (optimized order)
 */
export function selectOptimalReviews(
  dueItems: string[],
  graph: EncompassingGraph,
  maxReviews: number = 10,
  config: FIReConfig = DEFAULT_FIRE_CONFIG
): string[] {
  const selected: string[] = [];
  const remaining = new Set(dueItems);

  while (selected.length < maxReviews && remaining.size > 0) {
    let bestItem = '';
    let bestKnockoutCount = -1;

    // Find item that knocks out the most other due items
    for (const item of remaining) {
      const knockouts = getKnockouts(item, graph, config);
      const knockoutCount = knockouts.filter((ko) => remaining.has(ko)).length;

      if (knockoutCount > bestKnockoutCount) {
        bestKnockoutCount = knockoutCount;
        bestItem = item;
      }
    }

    // If no knockouts found, just pick any remaining item
    if (!bestItem) {
      const firstRemaining = remaining.values().next().value;
      if (firstRemaining) {
        bestItem = firstRemaining;
      }
    }

    if (bestItem) {
      selected.push(bestItem);
      remaining.delete(bestItem);

      // Remove knocked-out items from remaining
      const knockouts = getKnockouts(bestItem, graph, config);
      for (const ko of knockouts) {
        remaining.delete(ko);
      }
    }
  }

  return selected;
}

// ============================================================================
// Review Priority Sorting
// ============================================================================

/**
 * Sort items by review priority.
 *
 * Priority is based on:
 * 1. Most overdue items first
 * 2. Then by lowest memory (most likely to be forgotten)
 *
 * @param items - Array of items with FIRe state
 * @returns Sorted array (highest priority first)
 */
export function sortByReviewPriority<T extends { id: string; fire: FIReState }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const aOverdue = getDaysOverdue(a.fire);
    const bOverdue = getDaysOverdue(b.fire);

    // Most overdue first
    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue;
    }

    // Then by lowest memory
    const aMemory = getDecayedMemory(a.fire);
    const bMemory = getDecayedMemory(b.fire);
    return aMemory - bMemory;
  });
}

// ============================================================================
// Learning Speed Calibration
// ============================================================================

/**
 * Calibrate learning speed based on recent performance.
 *
 * Adjusts the learning speed multiplier based on whether the student
 * is performing better or worse than expected.
 *
 * @param current - Current FIRe state
 * @param recentResults - Array of recent repetition results
 * @param config - FIRe configuration
 * @returns Updated learning speed
 */
export function calibrateLearningSpeed(
  current: FIReState,
  recentResults: RepetitionResult[],
  config: FIReConfig = DEFAULT_FIRE_CONFIG
): number {
  // Need at least 3 results to calibrate
  if (recentResults.length < 3) {
    return current.learningSpeed;
  }

  // Look at the last 10 results
  const outcomes = recentResults.slice(-10);

  // Count unexpected outcomes
  const unexpectedFailures = outcomes.filter(
    (r) => !r.passed && r.expectedToPass
  ).length;
  const unexpectedSuccesses = outcomes.filter(
    (r) => r.passed && !r.expectedToPass
  ).length;

  let newSpeed = current.learningSpeed;

  if (unexpectedFailures > 2) {
    // Struggling: slow down
    newSpeed = Math.max(config.minLearningSpeed, newSpeed - 0.1);
  } else if (unexpectedSuccesses > 3) {
    // Doing better than expected: speed up
    newSpeed = Math.min(config.maxLearningSpeed, newSpeed + 0.1);
  }

  return newSpeed;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new FIRe state with default values.
 *
 * @returns New FIRe state
 */
export function createFIReState(): FIReState {
  return { ...DEFAULT_FIRE_STATE, lastRepDate: Date.now() };
}

/**
 * Estimate retention rate based on current state.
 *
 * @param state - FIRe state
 * @returns Estimated retention (0-1)
 */
export function estimateRetention(state: FIReState): number {
  return getDecayedMemory(state);
}

/**
 * Check if an item would benefit from a "challenge" (higher stakes review).
 *
 * Items with high repNum and high memory are good candidates for
 * challenge reviews that provide bonus credit if passed.
 *
 * @param state - FIRe state
 * @returns true if item is a good challenge candidate
 */
export function isChallengeCandidate(state: FIReState): boolean {
  return state.repNum >= 3 && getDecayedMemory(state) >= 0.7;
}

/**
 * Convert simple correct/incorrect to quality score.
 *
 * @param correct - Whether the answer was correct
 * @param wasHard - Whether it was difficult (optional)
 * @returns Quality score (0-1)
 */
export function simpleToQuality(correct: boolean, wasHard: boolean = false): number {
  if (!correct) return 0;
  return wasHard ? 0.6 : 1.0;
}
