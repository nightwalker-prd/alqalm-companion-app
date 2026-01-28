/**
 * Fractional Implicit Repetition (FIRe) Type Definitions
 *
 * Based on the FIRe algorithm by Justin Skycak at Math Academy.
 * This system optimizes spaced repetition for hierarchical knowledge structures
 * by allowing repetitions on advanced topics to "trickle down" and provide
 * implicit credit to simpler topics that are encompassed.
 *
 * Key concepts:
 * - repNum: Accumulated successful spaced repetitions (can be fractional from implicit reps)
 * - memory: Current memory strength (0-1), decays over time
 * - learningSpeed: Individual calibration factor for each student-topic pair
 * - Encompassing Graph: Defines which topics implicitly practice other topics
 *
 * Reference: https://www.justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures/
 */

/**
 * FIRe state for a single item (word, grammar point, or lesson)
 */
export interface FIReState {
  /**
   * Accumulated successful spaced repetitions.
   * Can be fractional due to implicit repetitions from encompassing topics.
   * Higher repNum = longer intervals between reviews.
   */
  repNum: number;

  /**
   * Current memory strength (0-1).
   * Decays over time according to the forgetting curve.
   * Used to discount early repetitions and determine when item is due.
   */
  memory: number;

  /**
   * Timestamp of last repetition (explicit or implicit).
   * Used to calculate time-based decay.
   */
  lastRepDate: number;

  /**
   * Individualized learning speed multiplier.
   * - 1.0 = normal speed
   * - > 1.0 = faster learner (intervals grow faster)
   * - < 1.0 = slower learner (more repetitions needed)
   *
   * Calibrated based on observed performance vs. expected performance.
   */
  learningSpeed: number;
}

/**
 * Default FIRe state for a new item
 */
export const DEFAULT_FIRE_STATE: FIReState = {
  repNum: 0,
  memory: 0,
  lastRepDate: Date.now(),
  learningSpeed: 1.0,
};

/**
 * Edge in the encompassing graph.
 * Represents that the 'from' topic implicitly practices the 'to' topic.
 */
export interface EncompassingEdge {
  /** ID of the topic that encompasses (more advanced) */
  from: string;
  /** ID of the topic that is encompassed (simpler, prerequisite) */
  to: string;
  /**
   * Weight of the encompassing relationship (0-1).
   * - 1.0 = full encompassing (practicing 'from' fully practices 'to')
   * - 0.5 = partial encompassing (50% credit flows through)
   * - 0.0 = no encompassing (edge should not exist)
   */
  weight: number;
}

/**
 * Adjacency list representation of the encompassing graph.
 * Optimized for efficient traversal during credit/penalty flow.
 */
export interface EncompassingGraph {
  /**
   * Forward edges: from -> Array of (target, weight)
   * Used for flowing credit DOWN when a student passes a review.
   * Key is the encompassing (advanced) item ID.
   */
  encompasses: Record<string, Array<{ target: string; weight: number }>>;

  /**
   * Reverse edges: to -> Array of (source, weight)
   * Used for flowing penalty UP when a student fails a review.
   * Key is the encompassed (simpler) item ID.
   */
  encompassedBy: Record<string, Array<{ target: string; weight: number }>>;
}

/**
 * Result of a repetition (used for calibration)
 */
export interface RepetitionResult {
  /** Whether the student passed the repetition */
  passed: boolean;
  /** Whether we expected the student to pass based on memory state */
  expectedToPass: boolean;
  /** Quality of the response (0-1, optional) */
  quality?: number;
  /** Timestamp of the repetition */
  timestamp: number;
}

/**
 * Configuration for the FIRe algorithm
 */
export interface FIReConfig {
  /**
   * Minimum credit threshold for propagation.
   * Credit below this value is not propagated to prevent infinite recursion.
   * Default: 0.01
   */
  minCreditThreshold: number;

  /**
   * Maximum depth for credit/penalty propagation.
   * Prevents runaway recursion in cyclic graphs.
   * Default: 10
   */
  maxPropagationDepth: number;

  /**
   * Minimum weight for an encompassing to count as a "knockout".
   * Items encompassed with weight >= this value are removed from due queue
   * when the encompassing item is reviewed.
   * Default: 0.5
   */
  knockoutWeightThreshold: number;

  /**
   * Whether to allow implicit credit for slow learners (learningSpeed < 1.0).
   * When false, slow learners only get credit from explicit reviews.
   * Default: false
   */
  implicitCreditForSlowLearners: boolean;

  /**
   * Memory threshold below which an item is considered due.
   * Default: 0.5
   */
  memoryDueThreshold: number;

  /**
   * Minimum learning speed (prevents speed from dropping too low).
   * Default: 0.5
   */
  minLearningSpeed: number;

  /**
   * Maximum learning speed (prevents speed from getting too high).
   * Default: 2.0
   */
  maxLearningSpeed: number;
}

/**
 * Default FIRe configuration
 */
export const DEFAULT_FIRE_CONFIG: FIReConfig = {
  minCreditThreshold: 0.01,
  maxPropagationDepth: 10,
  knockoutWeightThreshold: 0.5,
  implicitCreditForSlowLearners: false,
  memoryDueThreshold: 0.5,
  minLearningSpeed: 0.5,
  maxLearningSpeed: 2.0,
};

/**
 * Interval schedule based on repNum.
 * Maps repNum ranges to days until next review.
 */
export const INTERVAL_SCHEDULE = {
  /** First successful review: 1 day */
  FIRST_REP: 1,
  /** Second successful review: 6 days */
  SECOND_REP: 6,
  /** Base for exponential growth after second rep */
  EXPONENTIAL_BASE: 2,
} as const;

/**
 * Credit/penalty deltas for pass/fail outcomes
 */
export const CREDIT_DELTAS = {
  /** Base credit for a perfect pass */
  PASS_BASE: 0.5,
  /** Additional credit scaled by quality (0-1) */
  PASS_QUALITY_MULTIPLIER: 0.5,
  /** Penalty for a fail */
  FAIL_PENALTY: -1,
  /** Memory boost on pass */
  MEMORY_BOOST: 0.5,
  /** Memory reduction on fail */
  MEMORY_REDUCTION: -0.3,
} as const;

/**
 * Decay factors for memory and overdue calculations
 */
export const DECAY_FACTORS = {
  /** Memory decays to 50% at the expected interval */
  MEMORY_HALFLIFE: 0.5,
  /** Discount factor for implicit credit when memory is high */
  IMPLICIT_DISCOUNT_FACTOR: 0.7,
  /** Fraction of penalty that propagates up the graph */
  PENALTY_PROPAGATION_FACTOR: 0.5,
} as const;
