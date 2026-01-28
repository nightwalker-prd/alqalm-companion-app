/**
 * Confidence Calibration Analysis
 * 
 * Based on metacognition research from "Make It Stick" - helps users understand
 * how well their confidence predicts actual correctness.
 * 
 * A well-calibrated learner:
 * - When they feel "unsure" (1), they're correct ~33% of the time
 * - When they feel "somewhat sure" (2), they're correct ~66% of the time
 * - When they feel "very sure" (3), they're correct ~90% of the time
 */

import type { ConfidenceRecord, ConfidenceLevel, WordMastery } from '../types/progress';

/**
 * Expected accuracy for each confidence level
 * Based on the 3-level scale: unsure, somewhat sure, very sure
 */
export const EXPECTED_ACCURACY: Record<ConfidenceLevel, number> = {
  1: 0.33, // Unsure - expect ~33% correct
  2: 0.66, // Somewhat sure - expect ~66% correct
  3: 0.90, // Very sure - expect ~90% correct
};

/**
 * Minimum ratings required for meaningful calibration analysis
 */
export const MIN_RATINGS_FOR_CALIBRATION = 10;

/**
 * Threshold for determining tendency
 * If actual accuracy exceeds expected by this much, they're overconfident/underconfident
 */
export const TENDENCY_THRESHOLD = 0.15;

/**
 * Calibration tendency based on confidence vs. actual accuracy
 */
export type CalibrationTendency = 
  | 'well-calibrated'
  | 'overconfident'
  | 'underconfident'
  | 'insufficient-data';

/**
 * Statistics for a single confidence level
 */
export interface LevelStats {
  level: ConfidenceLevel;
  count: number;
  correctCount: number;
  expectedAccuracy: number;
  actualAccuracy: number;
  difference: number; // positive = overconfident, negative = underconfident
}

/**
 * Complete calibration statistics
 */
export interface CalibrationStats {
  /** Total number of confidence ratings */
  totalRatings: number;
  /** Calibration score from 0-1 (1 = perfectly calibrated) */
  calibrationScore: number;
  /** Overall tendency */
  tendency: CalibrationTendency;
  /** Breakdown by confidence level */
  byLevel: LevelStats[];
  /** Actionable feedback message */
  feedbackMessage: string;
}

/**
 * Aggregate confidence records from all word mastery data
 */
export function aggregateConfidenceRecords(
  wordMastery: Record<string, WordMastery>
): ConfidenceRecord[] {
  const allRecords: ConfidenceRecord[] = [];
  
  for (const mastery of Object.values(wordMastery)) {
    if (mastery.confidence?.history) {
      allRecords.push(...mastery.confidence.history);
    }
  }
  
  // Sort by timestamp (most recent first) for trend analysis
  return allRecords.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Calculate calibration statistics from confidence records
 */
export function calculateCalibrationStats(records: ConfidenceRecord[]): CalibrationStats {
  const totalRatings = records.length;
  
  // Insufficient data
  if (totalRatings < MIN_RATINGS_FOR_CALIBRATION) {
    return {
      totalRatings,
      calibrationScore: 0,
      tendency: 'insufficient-data',
      byLevel: [],
      feedbackMessage: `Need ${MIN_RATINGS_FOR_CALIBRATION - totalRatings} more ratings for calibration analysis.`,
    };
  }
  
  // Calculate stats by level
  const byLevelRaw: Record<ConfidenceLevel, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
  };
  
  for (const record of records) {
    byLevelRaw[record.rating].total++;
    if (record.wasCorrect) {
      byLevelRaw[record.rating].correct++;
    }
  }
  
  // Build level stats
  const byLevel: LevelStats[] = ([1, 2, 3] as ConfidenceLevel[]).map(level => {
    const { correct, total } = byLevelRaw[level];
    const actualAccuracy = total > 0 ? correct / total : 0;
    const expectedAccuracy = EXPECTED_ACCURACY[level];
    
    return {
      level,
      count: total,
      correctCount: correct,
      expectedAccuracy,
      actualAccuracy,
      difference: actualAccuracy - expectedAccuracy,
    };
  });
  
  // Calculate weighted calibration score
  let totalError = 0;
  let totalWeight = 0;
  
  for (const levelStats of byLevel) {
    if (levelStats.count > 0) {
      const error = Math.abs(levelStats.difference);
      totalError += error * levelStats.count;
      totalWeight += levelStats.count;
    }
  }
  
  const meanError = totalWeight > 0 ? totalError / totalWeight : 0;
  const calibrationScore = Math.max(0, Math.min(1, 1 - meanError));
  
  // Determine tendency
  const tendency = determineTendency(byLevel);
  
  // Generate feedback message
  const feedbackMessage = generateFeedbackMessage(tendency, byLevel, calibrationScore);
  
  return {
    totalRatings,
    calibrationScore,
    tendency,
    byLevel,
    feedbackMessage,
  };
}

/**
 * Determine overall calibration tendency from level stats
 */
function determineTendency(byLevel: LevelStats[]): CalibrationTendency {
  // Calculate weighted average difference
  let weightedDiff = 0;
  let totalWeight = 0;
  
  for (const stats of byLevel) {
    if (stats.count > 0) {
      weightedDiff += stats.difference * stats.count;
      totalWeight += stats.count;
    }
  }
  
  if (totalWeight === 0) {
    return 'insufficient-data';
  }
  
  const avgDifference = weightedDiff / totalWeight;
  
  // Positive difference = actual accuracy > expected = underconfident (they're better than they think)
  // Negative difference = actual accuracy < expected = overconfident (they think they're better)
  if (avgDifference < -TENDENCY_THRESHOLD) {
    return 'overconfident';
  } else if (avgDifference > TENDENCY_THRESHOLD) {
    return 'underconfident';
  }
  
  return 'well-calibrated';
}

/**
 * Generate actionable feedback based on calibration analysis
 */
function generateFeedbackMessage(
  tendency: CalibrationTendency,
  byLevel: LevelStats[],
  score: number
): string {
  switch (tendency) {
    case 'overconfident': {
      // Find the worst level
      const worstOverconfident = byLevel
        .filter(l => l.count >= 3 && l.difference < 0)
        .sort((a, b) => a.difference - b.difference)[0];

      if (worstOverconfident?.level === 3) {
        return "When you feel 'very sure', pause and double-check. You might be overlooking something.";
      }
      return "Your confidence tends to exceed your accuracy. Take a moment to verify before answering.";
    }

    case 'underconfident': {
      const worstUnderconfident = byLevel
        .filter(l => l.count >= 3 && l.difference > 0)
        .sort((a, b) => b.difference - a.difference)[0];

      if (worstUnderconfident?.level === 1) {
        return "You know more than you think! Trust your instincts more when answering.";
      }
      return "You're more accurate than you believe. Have more confidence in your knowledge!";
    }

    case 'well-calibrated':
      if (score >= 0.85) {
        return "Excellent metacognition! Your confidence accurately predicts your performance.";
      }
      return "Good calibration. Your confidence levels reasonably match your actual accuracy.";
      
    case 'insufficient-data':
    default:
      return "Keep practicing with confidence ratings to unlock your calibration insights.";
  }
}

/**
 * Get the display label for a confidence level
 */
export function getConfidenceLevelLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 1: return 'Unsure';
    case 2: return 'Somewhat sure';
    case 3: return 'Very sure';
  }
}

/**
 * Get recent trend (last 20 vs. previous 20 ratings)
 */
export function getCalibrationTrend(
  records: ConfidenceRecord[]
): 'improving' | 'stable' | 'declining' | 'insufficient-data' {
  if (records.length < 40) {
    return 'insufficient-data';
  }
  
  // Records are already sorted by timestamp (most recent first)
  const recent = records.slice(0, 20);
  const previous = records.slice(20, 40);
  
  const recentStats = calculateCalibrationStats(recent);
  const previousStats = calculateCalibrationStats(previous);
  
  if (recentStats.tendency === 'insufficient-data' || previousStats.tendency === 'insufficient-data') {
    return 'insufficient-data';
  }
  
  const improvement = recentStats.calibrationScore - previousStats.calibrationScore;
  
  if (improvement > 0.1) {
    return 'improving';
  } else if (improvement < -0.1) {
    return 'declining';
  }
  
  return 'stable';
}
