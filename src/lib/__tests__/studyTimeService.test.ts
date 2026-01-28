/**
 * Tests for Study Time Tracking Service
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

import {
  loadStudyTimeData,
  saveStudyTimeData,
  startStudySession,
  endStudySession,
  getActiveSession,
  hasActiveSession,
  getStrandTotals,
  getStrandTotalsForPeriod,
  getStrandTotalsToday,
  getStrandTotalsThisWeek,
  calculateBalance,
  getRecommendedStrand,
  getSessionsToday,
  getStudyTimeSummary,
  formatDuration,
  formatDurationShort,
  clearStudyTimeData,
  getStrandForActivity,
} from '../studyTimeService';
import { MIN_SESSION_DURATION_MS } from '../../types/studyTime';
import type { StrandTotals } from '../../types/studyTime';

describe('studyTimeService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loadStudyTimeData', () => {
    test('returns initial data when localStorage is empty', () => {
      const data = loadStudyTimeData();

      expect(data.version).toBe(1);
      expect(data.sessions).toEqual([]);
      expect(data.totals).toEqual({
        'meaning-input': 0,
        'meaning-output': 0,
        'language-focused': 0,
        fluency: 0,
      });
      expect(data.activeSessionId).toBeNull();
    });

    test('returns stored data when available', () => {
      const storedData = {
        version: 1,
        sessions: [],
        totals: {
          'meaning-input': 60000,
          'meaning-output': 30000,
          'language-focused': 45000,
          fluency: 15000,
        },
        activeSessionId: null,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };
      localStorage.setItem('madina_study_time', JSON.stringify(storedData));

      const data = loadStudyTimeData();

      expect(data.totals['meaning-input']).toBe(60000);
      expect(data.totals.fluency).toBe(15000);
    });

    test('returns initial data on invalid JSON', () => {
      localStorage.setItem('madina_study_time', 'invalid json');

      const data = loadStudyTimeData();

      expect(data.version).toBe(1);
      expect(data.sessions).toEqual([]);
    });
  });

  describe('saveStudyTimeData', () => {
    test('saves data to localStorage', () => {
      const data = loadStudyTimeData();
      data.totals['meaning-input'] = 60000;

      saveStudyTimeData(data);

      const stored = JSON.parse(localStorage.getItem('madina_study_time')!);
      expect(stored.totals['meaning-input']).toBe(60000);
    });

    test('prunes sessions when exceeding max', () => {
      const data = loadStudyTimeData();

      // Add 600 sessions (more than MAX_STORED_SESSIONS = 500)
      for (let i = 0; i < 600; i++) {
        data.sessions.push({
          id: `session_${i}`,
          strand: 'meaning-input',
          activityType: 'reading',
          startTime: i * 1000,
          endTime: i * 1000 + 5000,
          durationMs: 5000,
        });
      }

      saveStudyTimeData(data);

      const stored = JSON.parse(localStorage.getItem('madina_study_time')!);
      expect(stored.sessions.length).toBe(500);
      // Should keep the most recent (last 500)
      expect(stored.sessions[0].id).toBe('session_100');
    });
  });

  describe('startStudySession', () => {
    test('creates a new session with correct strand', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

      const sessionId = startStudySession('reading');

      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);

      const data = loadStudyTimeData();
      expect(data.sessions.length).toBe(1);
      expect(data.sessions[0].strand).toBe('meaning-input');
      expect(data.sessions[0].activityType).toBe('reading');
      expect(data.sessions[0].startTime).toBe(Date.now());
      expect(data.sessions[0].endTime).toBeNull();
      expect(data.activeSessionId).toBe(sessionId);
    });

    test('maps different activity types to correct strands', () => {
      startStudySession('translate-to-arabic');
      let data = loadStudyTimeData();
      expect(data.sessions[0].strand).toBe('meaning-output');

      clearStudyTimeData();
      startStudySession('fill-blank');
      data = loadStudyTimeData();
      expect(data.sessions[0].strand).toBe('language-focused');

      clearStudyTimeData();
      startStudySession('fluency-speed-round');
      data = loadStudyTimeData();
      expect(data.sessions[0].strand).toBe('fluency');
    });

    test('ends previous session when starting a new one', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      const firstId = startStudySession('reading');

      vi.advanceTimersByTime(30000); // 30 seconds
      const secondId = startStudySession('fill-blank');

      const data = loadStudyTimeData();
      expect(data.sessions.length).toBe(2);
      expect(data.sessions[0].id).toBe(firstId);
      expect(data.sessions[0].endTime).not.toBeNull();
      expect(data.sessions[0].durationMs).toBe(30000);
      expect(data.activeSessionId).toBe(secondId);
    });
  });

  describe('endStudySession', () => {
    test('ends the active session and calculates duration', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      startStudySession('reading');

      vi.advanceTimersByTime(60000); // 60 seconds
      const session = endStudySession();

      expect(session).not.toBeNull();
      expect(session!.durationMs).toBe(60000);
      expect(session!.endTime).toBe(Date.now());

      const data = loadStudyTimeData();
      expect(data.activeSessionId).toBeNull();
      expect(data.totals['meaning-input']).toBe(60000);
    });

    test('returns null when no active session', () => {
      const session = endStudySession();
      expect(session).toBeNull();
    });

    test('does not add duration below minimum threshold', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      startStudySession('reading');

      vi.advanceTimersByTime(1000); // Only 1 second (below 5s minimum)
      endStudySession();

      const data = loadStudyTimeData();
      expect(data.totals['meaning-input']).toBe(0); // Not counted
    });

    test('adds duration at or above minimum threshold', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      startStudySession('reading');

      vi.advanceTimersByTime(MIN_SESSION_DURATION_MS);
      endStudySession();

      const data = loadStudyTimeData();
      expect(data.totals['meaning-input']).toBe(MIN_SESSION_DURATION_MS);
    });
  });

  describe('getActiveSession / hasActiveSession', () => {
    test('returns null when no active session', () => {
      expect(getActiveSession()).toBeNull();
      expect(hasActiveSession()).toBe(false);
    });

    test('returns active session when exists', () => {
      startStudySession('reading');

      expect(getActiveSession()).not.toBeNull();
      expect(getActiveSession()!.activityType).toBe('reading');
      expect(hasActiveSession()).toBe(true);
    });

    test('returns null after ending session', () => {
      startStudySession('reading');
      endStudySession();

      expect(getActiveSession()).toBeNull();
      expect(hasActiveSession()).toBe(false);
    });
  });

  describe('getStrandTotals', () => {
    test('returns zeros when no sessions', () => {
      const totals = getStrandTotals();

      expect(totals).toEqual({
        'meaning-input': 0,
        'meaning-output': 0,
        'language-focused': 0,
        fluency: 0,
      });
    });

    test('returns accumulated totals', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      startStudySession('translate-to-arabic');
      vi.advanceTimersByTime(30000);
      endStudySession();

      const totals = getStrandTotals();

      expect(totals['meaning-input']).toBe(60000);
      expect(totals['meaning-output']).toBe(30000);
      expect(totals['language-focused']).toBe(0);
      expect(totals.fluency).toBe(0);
    });
  });

  describe('getStrandTotalsForPeriod', () => {
    test('filters sessions by time period', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

      // Session 1: at 10:00
      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      // Session 2: at 10:01
      vi.advanceTimersByTime(60000); // Gap
      startStudySession('fill-blank');
      vi.advanceTimersByTime(30000);
      endStudySession();

      // Get totals only for the second part
      const periodStart = new Date('2024-01-15T10:01:30.000Z').getTime();
      const totals = getStrandTotalsForPeriod(periodStart);

      expect(totals['meaning-input']).toBe(0); // First session excluded
      expect(totals['language-focused']).toBe(30000);
    });
  });

  describe('getStrandTotalsToday', () => {
    test('only includes sessions from today', () => {
      // Session yesterday
      vi.setSystemTime(new Date('2024-01-14T23:00:00.000Z'));
      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      // Session today
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      startStudySession('fill-blank');
      vi.advanceTimersByTime(30000);
      endStudySession();

      const todayTotals = getStrandTotalsToday();

      expect(todayTotals['meaning-input']).toBe(0); // Yesterday's session
      expect(todayTotals['language-focused']).toBe(30000); // Today's session
    });
  });

  describe('getStrandTotalsThisWeek', () => {
    test('only includes sessions from this week (Monday start)', () => {
      // Session last week (Sunday Jan 7)
      vi.setSystemTime(new Date('2024-01-07T10:00:00.000Z'));
      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      // Session this week (Monday Jan 8)
      vi.setSystemTime(new Date('2024-01-08T10:00:00.000Z'));
      startStudySession('fill-blank');
      vi.advanceTimersByTime(30000);
      endStudySession();

      // Current time: Wednesday Jan 10
      vi.setSystemTime(new Date('2024-01-10T10:00:00.000Z'));
      const weekTotals = getStrandTotalsThisWeek();

      expect(weekTotals['meaning-input']).toBe(0); // Last week
      expect(weekTotals['language-focused']).toBe(30000); // This week
    });
  });

  describe('calculateBalance', () => {
    test('returns 25% each when all zeros', () => {
      const totals: StrandTotals = {
        'meaning-input': 0,
        'meaning-output': 0,
        'language-focused': 0,
        fluency: 0,
      };

      const balance = calculateBalance(totals);

      expect(balance['meaning-input']).toBe(25);
      expect(balance['meaning-output']).toBe(25);
      expect(balance['language-focused']).toBe(25);
      expect(balance.fluency).toBe(25);
    });

    test('calculates correct percentages', () => {
      const totals: StrandTotals = {
        'meaning-input': 50000,
        'meaning-output': 25000,
        'language-focused': 15000,
        fluency: 10000,
      };

      const balance = calculateBalance(totals);

      expect(balance['meaning-input']).toBe(50);
      expect(balance['meaning-output']).toBe(25);
      expect(balance['language-focused']).toBe(15);
      expect(balance.fluency).toBe(10);
    });

    test('rounds percentages to whole numbers', () => {
      const totals: StrandTotals = {
        'meaning-input': 33333,
        'meaning-output': 33333,
        'language-focused': 33333,
        fluency: 1,
      };

      const balance = calculateBalance(totals);

      // All should be whole numbers
      expect(Number.isInteger(balance['meaning-input'])).toBe(true);
      expect(Number.isInteger(balance['meaning-output'])).toBe(true);
      expect(Number.isInteger(balance['language-focused'])).toBe(true);
      expect(Number.isInteger(balance.fluency)).toBe(true);
    });
  });

  describe('getRecommendedStrand', () => {
    test('recommends meaning-input when no study time', () => {
      const recommendation = getRecommendedStrand();

      expect(recommendation).not.toBeNull();
      expect(recommendation!.strand).toBe('meaning-input');
      expect(recommendation!.suggestion).toContain('reading');
    });

    test('recommends the most underutilized strand', () => {
      const totals: StrandTotals = {
        'meaning-input': 30000,
        'meaning-output': 30000,
        'language-focused': 30000,
        fluency: 5000, // Most underutilized
      };

      const recommendation = getRecommendedStrand(totals);

      expect(recommendation).not.toBeNull();
      expect(recommendation!.strand).toBe('fluency');
    });

    test('returns null when well balanced', () => {
      const totals: StrandTotals = {
        'meaning-input': 25000,
        'meaning-output': 25000,
        'language-focused': 25000,
        fluency: 25000,
      };

      const recommendation = getRecommendedStrand(totals);

      expect(recommendation).toBeNull();
    });

    test('returns null when slightly imbalanced (within 5%)', () => {
      const totals: StrandTotals = {
        'meaning-input': 22000, // 22% - only 3% below target
        'meaning-output': 26000,
        'language-focused': 26000,
        fluency: 26000,
      };

      const recommendation = getRecommendedStrand(totals);

      expect(recommendation).toBeNull();
    });
  });

  describe('getSessionsToday', () => {
    test('returns empty array when no sessions', () => {
      expect(getSessionsToday()).toEqual([]);
    });

    test('returns only completed sessions from today', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      // Active session (not completed)
      startStudySession('fill-blank');

      const sessions = getSessionsToday();

      expect(sessions.length).toBe(1);
      expect(sessions[0].activityType).toBe('reading');
    });
  });

  describe('getStudyTimeSummary', () => {
    test('returns complete summary with all fields', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      const summary = getStudyTimeSummary();

      expect(summary.totalTimeMs).toBe(60000);
      expect(summary.byStrand['meaning-input']).toBe(60000);
      expect(summary.balance['meaning-input']).toBe(100);
      expect(summary.sessionsToday).toBe(1);
      expect(summary.todayTimeMs).toBe(60000);
      expect(summary.recommendation).not.toBeNull();
    });
  });

  describe('formatDuration', () => {
    test('formats milliseconds correctly', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(500)).toBe('0s');
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(120000)).toBe('2m');
      expect(formatDuration(3665000)).toBe('1h 1m');
      expect(formatDuration(3600000)).toBe('1h');
    });
  });

  describe('formatDurationShort', () => {
    test('formats to short form', () => {
      expect(formatDurationShort(0)).toBe('0m');
      expect(formatDurationShort(60000)).toBe('1m');
      expect(formatDurationShort(3600000)).toBe('1h');
      expect(formatDurationShort(5400000)).toBe('1h'); // 1.5 hours -> 1h
    });
  });

  describe('clearStudyTimeData', () => {
    test('removes all study time data', () => {
      startStudySession('reading');
      vi.advanceTimersByTime(60000);
      endStudySession();

      clearStudyTimeData();

      const data = loadStudyTimeData();
      expect(data.sessions).toEqual([]);
      expect(data.totals['meaning-input']).toBe(0);
    });
  });

  describe('getStrandForActivity', () => {
    test('returns correct strand for each activity type', () => {
      expect(getStrandForActivity('reading')).toBe('meaning-input');
      expect(getStrandForActivity('listening')).toBe('meaning-input');
      expect(getStrandForActivity('translate-to-arabic')).toBe('meaning-output');
      expect(getStrandForActivity('meaning-to-word')).toBe('meaning-output');
      expect(getStrandForActivity('fill-blank')).toBe('language-focused');
      expect(getStrandForActivity('error-correction')).toBe('language-focused');
      expect(getStrandForActivity('fluency-speed-round')).toBe('fluency');
      expect(getStrandForActivity('challenge-mode')).toBe('fluency');
    });
  });
});
