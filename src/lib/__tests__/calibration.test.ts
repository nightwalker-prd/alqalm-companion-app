import { describe, test, expect } from 'vitest';
import {
  calculateCalibrationStats,
  aggregateConfidenceRecords,
  getCalibrationTrend,
  getConfidenceLevelLabel,
  EXPECTED_ACCURACY,
  MIN_RATINGS_FOR_CALIBRATION,
} from '../calibration';
import type { ConfidenceRecord, ConfidenceLevel, WordMastery } from '../../types/progress';

// Helper to create a confidence record
function makeRecord(
  rating: ConfidenceLevel,
  wasCorrect: boolean,
  timestamp = Date.now()
): ConfidenceRecord {
  return { rating, wasCorrect, timestamp };
}

// Helper to create multiple records
function makeRecords(
  specs: Array<{ rating: ConfidenceLevel; wasCorrect: boolean }>
): ConfidenceRecord[] {
  return specs.map((spec, i) => makeRecord(spec.rating, spec.wasCorrect, Date.now() - i * 1000));
}

describe('calibration', () => {
  describe('calculateCalibrationStats', () => {
    test('returns insufficient-data for empty records', () => {
      const stats = calculateCalibrationStats([]);
      
      expect(stats.totalRatings).toBe(0);
      expect(stats.tendency).toBe('insufficient-data');
      expect(stats.calibrationScore).toBe(0);
      expect(stats.byLevel).toEqual([]);
    });

    test('returns insufficient-data when below minimum threshold', () => {
      const records = makeRecords([
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 2, wasCorrect: true },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.totalRatings).toBe(3);
      expect(stats.tendency).toBe('insufficient-data');
      expect(stats.feedbackMessage).toContain(`${MIN_RATINGS_FOR_CALIBRATION - 3}`);
    });

    test('returns well-calibrated when accuracy matches expected', () => {
      // Create records that match expected accuracy:
      // Level 1: 33% correct, Level 2: 66% correct, Level 3: 90% correct
      const records: ConfidenceRecord[] = [
        // Level 1 (expect 33%): 1 correct, 2 wrong = 33%
        ...makeRecords([
          { rating: 1, wasCorrect: true },
          { rating: 1, wasCorrect: false },
          { rating: 1, wasCorrect: false },
        ]),
        // Level 2 (expect 66%): 2 correct, 1 wrong = 66%
        ...makeRecords([
          { rating: 2, wasCorrect: true },
          { rating: 2, wasCorrect: true },
          { rating: 2, wasCorrect: false },
        ]),
        // Level 3 (expect 90%): 9 correct, 1 wrong = 90%
        ...makeRecords([
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: true },
          { rating: 3, wasCorrect: false },
        ]),
      ];
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.totalRatings).toBe(16);
      expect(stats.tendency).toBe('well-calibrated');
      expect(stats.calibrationScore).toBeGreaterThan(0.8);
    });

    test('returns overconfident when actual accuracy is lower than expected', () => {
      // High confidence (3) but low accuracy
      const records = makeRecords([
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.tendency).toBe('overconfident');
      expect(stats.byLevel.find(l => l.level === 3)?.actualAccuracy).toBe(0.2);
    });

    test('returns underconfident when actual accuracy exceeds expected', () => {
      // Low confidence (1) but high accuracy
      const records = makeRecords([
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: false },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.tendency).toBe('underconfident');
      expect(stats.byLevel.find(l => l.level === 1)?.actualAccuracy).toBe(0.9);
    });

    test('calculates calibration score correctly', () => {
      // Perfect calibration at level 3: 90% accuracy
      const records = makeRecords([
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: false },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      // 90% actual vs 90% expected = 0% error = 1.0 calibration
      expect(stats.calibrationScore).toBeCloseTo(1.0, 1);
    });

    test('handles all same level correctly', () => {
      const records = makeRecords([
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: false },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: false },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: false },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: true },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      // 7/10 = 70% vs expected 66% = well-calibrated (within threshold)
      expect(stats.byLevel.find(l => l.level === 2)?.count).toBe(10);
      expect(stats.byLevel.find(l => l.level === 1)?.count).toBe(0);
      expect(stats.byLevel.find(l => l.level === 3)?.count).toBe(0);
    });

    test('handles 100% accuracy at all levels', () => {
      const records = makeRecords([
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      // 100% at level 1 when expecting 33% = underconfident
      expect(stats.tendency).toBe('underconfident');
    });

    test('handles 0% accuracy at all levels', () => {
      const records = makeRecords([
        { rating: 1, wasCorrect: false },
        { rating: 1, wasCorrect: false },
        { rating: 1, wasCorrect: false },
        { rating: 2, wasCorrect: false },
        { rating: 2, wasCorrect: false },
        { rating: 2, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      // 0% at level 3 when expecting 90% = overconfident
      expect(stats.tendency).toBe('overconfident');
    });

    test('provides feedback message for overconfident', () => {
      const records = makeRecords([
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
        { rating: 3, wasCorrect: false },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.feedbackMessage).toContain('very sure');
    });

    test('provides feedback message for underconfident', () => {
      const records = makeRecords([
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 1, wasCorrect: true },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.feedbackMessage).toContain('know more than you think');
    });

    test('byLevel contains correct expected accuracy values', () => {
      const records = makeRecords([
        { rating: 1, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 1, wasCorrect: false },
        { rating: 2, wasCorrect: false },
        { rating: 3, wasCorrect: true },
        { rating: 1, wasCorrect: true },
        { rating: 2, wasCorrect: true },
        { rating: 3, wasCorrect: true },
        { rating: 3, wasCorrect: true },
      ]);
      
      const stats = calculateCalibrationStats(records);
      
      expect(stats.byLevel.find(l => l.level === 1)?.expectedAccuracy).toBe(EXPECTED_ACCURACY[1]);
      expect(stats.byLevel.find(l => l.level === 2)?.expectedAccuracy).toBe(EXPECTED_ACCURACY[2]);
      expect(stats.byLevel.find(l => l.level === 3)?.expectedAccuracy).toBe(EXPECTED_ACCURACY[3]);
    });
  });

  describe('aggregateConfidenceRecords', () => {
    test('returns empty array for empty mastery data', () => {
      const records = aggregateConfidenceRecords({});
      expect(records).toEqual([]);
    });

    test('aggregates records from multiple words', () => {
      const wordMastery: Record<string, WordMastery> = {
        word1: {
          strength: 50,
          lastPracticed: '2024-01-01',
          timesCorrect: 5,
          timesIncorrect: 2,
          challengesPassed: 0,
          lastChallengeDate: null,
          confidence: {
            history: [
              makeRecord(3, true, 1000),
              makeRecord(2, false, 2000),
            ],
          },
        },
        word2: {
          strength: 80,
          lastPracticed: '2024-01-02',
          timesCorrect: 10,
          timesIncorrect: 1,
          challengesPassed: 1,
          lastChallengeDate: null,
          confidence: {
            history: [
              makeRecord(3, true, 3000),
            ],
          },
        },
      };
      
      const records = aggregateConfidenceRecords(wordMastery);
      
      expect(records).toHaveLength(3);
    });

    test('sorts by timestamp descending (most recent first)', () => {
      const wordMastery: Record<string, WordMastery> = {
        word1: {
          strength: 50,
          lastPracticed: '2024-01-01',
          timesCorrect: 5,
          timesIncorrect: 2,
          challengesPassed: 0,
          lastChallengeDate: null,
          confidence: {
            history: [
              makeRecord(1, true, 1000),
              makeRecord(2, true, 3000),
            ],
          },
        },
        word2: {
          strength: 80,
          lastPracticed: '2024-01-02',
          timesCorrect: 10,
          timesIncorrect: 1,
          challengesPassed: 1,
          lastChallengeDate: null,
          confidence: {
            history: [
              makeRecord(3, false, 2000),
            ],
          },
        },
      };
      
      const records = aggregateConfidenceRecords(wordMastery);
      
      expect(records[0].timestamp).toBe(3000);
      expect(records[1].timestamp).toBe(2000);
      expect(records[2].timestamp).toBe(1000);
    });

    test('handles words without confidence data', () => {
      const wordMastery: Record<string, WordMastery> = {
        word1: {
          strength: 50,
          lastPracticed: '2024-01-01',
          timesCorrect: 5,
          timesIncorrect: 2,
          challengesPassed: 0,
          lastChallengeDate: null,
          // No confidence field
        },
        word2: {
          strength: 80,
          lastPracticed: '2024-01-02',
          timesCorrect: 10,
          timesIncorrect: 1,
          challengesPassed: 1,
          lastChallengeDate: null,
          confidence: {
            history: [makeRecord(3, true, 1000)],
          },
        },
      };
      
      const records = aggregateConfidenceRecords(wordMastery);
      
      expect(records).toHaveLength(1);
    });
  });

  describe('getCalibrationTrend', () => {
    test('returns insufficient-data for less than 40 records', () => {
      const records = makeRecords(
        Array(30).fill({ rating: 3 as ConfidenceLevel, wasCorrect: true })
      );
      
      const trend = getCalibrationTrend(records);
      
      expect(trend).toBe('insufficient-data');
    });

    test('returns improving when recent calibration is better', () => {
      // Recent 20: well-calibrated (90% at level 3)
      const recent = Array(18).fill({ rating: 3 as ConfidenceLevel, wasCorrect: true })
        .concat([
          { rating: 3 as ConfidenceLevel, wasCorrect: false },
          { rating: 3 as ConfidenceLevel, wasCorrect: false },
        ]);
      
      // Previous 20: poorly calibrated (30% at level 3)
      const previous = Array(6).fill({ rating: 3 as ConfidenceLevel, wasCorrect: true })
        .concat(Array(14).fill({ rating: 3 as ConfidenceLevel, wasCorrect: false }));
      
      const records = makeRecords([...recent, ...previous]);
      
      const trend = getCalibrationTrend(records);
      
      expect(trend).toBe('improving');
    });

    test('returns declining when recent calibration is worse', () => {
      // Recent 20: poorly calibrated (20% at level 3)
      const recent = Array(4).fill({ rating: 3 as ConfidenceLevel, wasCorrect: true })
        .concat(Array(16).fill({ rating: 3 as ConfidenceLevel, wasCorrect: false }));
      
      // Previous 20: well-calibrated (90% at level 3)
      const previous = Array(18).fill({ rating: 3 as ConfidenceLevel, wasCorrect: true })
        .concat([
          { rating: 3 as ConfidenceLevel, wasCorrect: false },
          { rating: 3 as ConfidenceLevel, wasCorrect: false },
        ]);
      
      const records = makeRecords([...recent, ...previous]);
      
      const trend = getCalibrationTrend(records);
      
      expect(trend).toBe('declining');
    });

    test('returns stable when calibration is similar', () => {
      // Both periods: ~90% at level 3
      const period = Array(18).fill({ rating: 3 as ConfidenceLevel, wasCorrect: true })
        .concat([
          { rating: 3 as ConfidenceLevel, wasCorrect: false },
          { rating: 3 as ConfidenceLevel, wasCorrect: false },
        ]);
      
      const records = makeRecords([...period, ...period]);
      
      const trend = getCalibrationTrend(records);
      
      expect(trend).toBe('stable');
    });
  });

  describe('getConfidenceLevelLabel', () => {
    test('returns correct labels for each level', () => {
      expect(getConfidenceLevelLabel(1)).toBe('Unsure');
      expect(getConfidenceLevelLabel(2)).toBe('Somewhat sure');
      expect(getConfidenceLevelLabel(3)).toBe('Very sure');
    });
  });

  describe('EXPECTED_ACCURACY constants', () => {
    test('has correct expected values', () => {
      expect(EXPECTED_ACCURACY[1]).toBe(0.33);
      expect(EXPECTED_ACCURACY[2]).toBe(0.66);
      expect(EXPECTED_ACCURACY[3]).toBe(0.90);
    });
  });
});
