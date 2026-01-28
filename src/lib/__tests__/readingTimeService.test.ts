import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  calculateWPM,
  isValidSessionDuration,
  loadReadingTimeData,
  clearReadingTimeData,
  startReadingSession,
  getActiveSession,
  isPassageBeingRead,
  pauseReadingSession,
  resumeReadingSession,
  getElapsedReadingTime,
  stopReadingSession,
  cancelReadingSession,
  getAllSessions,
  getSessionsByPeriod,
  calculateWPMStats,
  getWPMByLevel,
  calculateFluencyProgress,
  classifyFluencyLevel,
  calculateReadingStreak,
  getReadingTimeSummary,
  getRecentSessions,
  getPassageReadingHistory,
  getPassageAverageWPM,
  saveReadingTimeData,
} from '../readingTimeService';
import type { ReadingTimeSession } from '../../types/readingTime';
import { MIN_SESSION_DURATION_MS, MAX_SESSION_DURATION_MS } from '../../types/readingTime';

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

describe('readingTimeService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // WPM Calculation Tests
  // ==========================================================================

  describe('calculateWPM', () => {
    test('calculates WPM correctly for 100 words in 1 minute', () => {
      const wpm = calculateWPM(100, 60000);
      expect(wpm).toBe(100);
    });

    test('calculates WPM correctly for 50 words in 30 seconds', () => {
      const wpm = calculateWPM(50, 30000);
      expect(wpm).toBe(100);
    });

    test('calculates WPM correctly for 75 words in 90 seconds', () => {
      const wpm = calculateWPM(75, 90000);
      expect(wpm).toBe(50);
    });

    test('returns 0 for zero word count', () => {
      expect(calculateWPM(0, 60000)).toBe(0);
    });

    test('returns 0 for zero duration', () => {
      expect(calculateWPM(100, 0)).toBe(0);
    });

    test('returns 0 for negative word count', () => {
      expect(calculateWPM(-10, 60000)).toBe(0);
    });

    test('returns 0 for negative duration', () => {
      expect(calculateWPM(100, -1000)).toBe(0);
    });

    test('rounds to one decimal place', () => {
      // 100 words in 45 seconds = 133.333... WPM
      const wpm = calculateWPM(100, 45000);
      expect(wpm).toBe(133.3);
    });
  });

  describe('isValidSessionDuration', () => {
    test('returns false for duration below minimum', () => {
      expect(isValidSessionDuration(MIN_SESSION_DURATION_MS - 1)).toBe(false);
    });

    test('returns true for duration at minimum', () => {
      expect(isValidSessionDuration(MIN_SESSION_DURATION_MS)).toBe(true);
    });

    test('returns true for duration above minimum', () => {
      expect(isValidSessionDuration(MIN_SESSION_DURATION_MS + 1000)).toBe(true);
    });

    test('returns true for duration at maximum', () => {
      expect(isValidSessionDuration(MAX_SESSION_DURATION_MS)).toBe(true);
    });

    test('returns false for duration above maximum', () => {
      expect(isValidSessionDuration(MAX_SESSION_DURATION_MS + 1)).toBe(false);
    });
  });

  // ==========================================================================
  // Data Persistence Tests
  // ==========================================================================

  describe('loadReadingTimeData', () => {
    test('returns initial data when localStorage is empty', () => {
      const data = loadReadingTimeData();
      expect(data.version).toBe(1);
      expect(data.sessions).toEqual([]);
      expect(data.activeSession).toBe(null);
    });

    test('loads existing data from localStorage', () => {
      const mockData = {
        version: 1,
        sessions: [],
        activeSession: null,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.setItem('madina_reading_time', JSON.stringify(mockData));

      const data = loadReadingTimeData();
      expect(data.version).toBe(1);
    });

    test('handles corrupted localStorage gracefully', () => {
      localStorageMock.setItem('madina_reading_time', 'not valid json');

      const data = loadReadingTimeData();
      expect(data.version).toBe(1);
      expect(data.sessions).toEqual([]);
    });
  });

  describe('clearReadingTimeData', () => {
    test('removes data from localStorage', () => {
      startReadingSession('b1', 'beginner', 50);
      clearReadingTimeData();

      const data = loadReadingTimeData();
      expect(data.sessions).toEqual([]);
      expect(data.activeSession).toBe(null);
    });
  });

  // ==========================================================================
  // Session Management Tests
  // ==========================================================================

  describe('startReadingSession', () => {
    test('creates a new active session', () => {
      const sessionId = startReadingSession('b1', 'beginner', 50);

      expect(sessionId).not.toBe(null);
      expect(sessionId).toMatch(/^rt_/);

      const session = getActiveSession();
      expect(session?.passageId).toBe('b1');
      expect(session?.passageLevel).toBe('beginner');
      expect(session?.wordCount).toBe(50);
    });

    test('returns null if session already active', () => {
      startReadingSession('b1', 'beginner', 50);
      const secondSession = startReadingSession('b2', 'intermediate', 100);

      expect(secondSession).toBe(null);
    });
  });

  describe('getActiveSession', () => {
    test('returns null when no session is active', () => {
      expect(getActiveSession()).toBe(null);
    });

    test('returns active session details', () => {
      startReadingSession('b1', 'beginner', 50);

      const session = getActiveSession();
      expect(session).not.toBe(null);
      expect(session?.passageId).toBe('b1');
    });
  });

  describe('isPassageBeingRead', () => {
    test('returns false when no session is active', () => {
      expect(isPassageBeingRead('b1')).toBe(false);
    });

    test('returns true for the passage being read', () => {
      startReadingSession('b1', 'beginner', 50);
      expect(isPassageBeingRead('b1')).toBe(true);
    });

    test('returns false for a different passage', () => {
      startReadingSession('b1', 'beginner', 50);
      expect(isPassageBeingRead('b2')).toBe(false);
    });
  });

  describe('pauseReadingSession', () => {
    test('returns false when no session is active', () => {
      expect(pauseReadingSession()).toBe(false);
    });

    test('pauses an active session', () => {
      startReadingSession('b1', 'beginner', 50);

      const result = pauseReadingSession();
      expect(result).toBe(true);

      const session = getActiveSession();
      expect(session?.isPaused).toBe(true);
    });

    test('returns false when already paused', () => {
      startReadingSession('b1', 'beginner', 50);
      pauseReadingSession();

      expect(pauseReadingSession()).toBe(false);
    });
  });

  describe('resumeReadingSession', () => {
    test('returns false when no session is active', () => {
      expect(resumeReadingSession()).toBe(false);
    });

    test('returns false when session is not paused', () => {
      startReadingSession('b1', 'beginner', 50);
      expect(resumeReadingSession()).toBe(false);
    });

    test('resumes a paused session', () => {
      startReadingSession('b1', 'beginner', 50);
      pauseReadingSession();

      const result = resumeReadingSession();
      expect(result).toBe(true);

      const session = getActiveSession();
      expect(session?.isPaused).toBe(false);
    });

    test('accumulates paused time correctly', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      startReadingSession('b1', 'beginner', 50);

      // Advance 10 seconds and pause
      vi.advanceTimersByTime(10000);
      pauseReadingSession();

      // Advance 5 seconds while paused
      vi.advanceTimersByTime(5000);
      resumeReadingSession();

      const session = getActiveSession();
      expect(session?.pausedDurationMs).toBe(5000);
    });
  });

  describe('getElapsedReadingTime', () => {
    test('returns 0 when no session is active', () => {
      expect(getElapsedReadingTime()).toBe(0);
    });

    test('returns elapsed time correctly', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      startReadingSession('b1', 'beginner', 50);

      vi.advanceTimersByTime(30000);

      expect(getElapsedReadingTime()).toBe(30000);
    });

    test('excludes paused time', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      startReadingSession('b1', 'beginner', 50);

      // Read for 20 seconds
      vi.advanceTimersByTime(20000);
      pauseReadingSession();

      // Paused for 10 seconds
      vi.advanceTimersByTime(10000);
      resumeReadingSession();

      // Read for 10 more seconds
      vi.advanceTimersByTime(10000);

      // Should be 30 seconds total (excluding 10 second pause)
      expect(getElapsedReadingTime()).toBe(30000);
    });

    test('handles currently paused state', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      startReadingSession('b1', 'beginner', 50);

      vi.advanceTimersByTime(20000);
      pauseReadingSession();
      vi.advanceTimersByTime(10000);

      // Still paused, should only count 20 seconds
      expect(getElapsedReadingTime()).toBe(20000);
    });
  });

  describe('stopReadingSession', () => {
    test('returns null when no session is active', () => {
      expect(stopReadingSession(true)).toBe(null);
    });

    test('returns null for sessions shorter than minimum', () => {
      startReadingSession('b1', 'beginner', 50);
      vi.advanceTimersByTime(1000); // Only 1 second

      const result = stopReadingSession(true);
      expect(result).toBe(null);
    });

    test('records valid session and calculates WPM', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      startReadingSession('b1', 'beginner', 100);
      vi.advanceTimersByTime(60000); // 1 minute

      const result = stopReadingSession(true);

      expect(result).not.toBe(null);
      expect(result?.wpm).toBe(100);
      expect(result?.completed).toBe(true);
      expect(result?.wordCount).toBe(100);
    });

    test('clears active session after stopping', () => {
      startReadingSession('b1', 'beginner', 50);
      vi.advanceTimersByTime(10000);
      stopReadingSession(true);

      expect(getActiveSession()).toBe(null);
    });

    test('adds session to history', () => {
      startReadingSession('b1', 'beginner', 50);
      vi.advanceTimersByTime(10000);
      stopReadingSession(true);

      const sessions = getAllSessions();
      expect(sessions.length).toBe(1);
    });
  });

  describe('cancelReadingSession', () => {
    test('returns false when no session is active', () => {
      expect(cancelReadingSession()).toBe(false);
    });

    test('cancels active session without recording', () => {
      startReadingSession('b1', 'beginner', 50);
      vi.advanceTimersByTime(30000);

      const result = cancelReadingSession();

      expect(result).toBe(true);
      expect(getActiveSession()).toBe(null);
      expect(getAllSessions().length).toBe(0);
    });
  });

  // ==========================================================================
  // Statistics Tests
  // ==========================================================================

  describe('calculateWPMStats', () => {
    test('returns null for empty sessions array', () => {
      expect(calculateWPMStats([])).toBe(null);
    });

    test('calculates stats correctly for single session', () => {
      const sessions: ReadingTimeSession[] = [
        createMockSession({ wpm: 100, wordCount: 50, durationMs: 30000 }),
      ];

      const stats = calculateWPMStats(sessions);

      expect(stats?.averageWpm).toBe(100);
      expect(stats?.fastestWpm).toBe(100);
      expect(stats?.slowestWpm).toBe(100);
      expect(stats?.sessionCount).toBe(1);
      expect(stats?.totalWordsRead).toBe(50);
    });

    test('calculates stats correctly for multiple sessions', () => {
      const sessions: ReadingTimeSession[] = [
        createMockSession({ wpm: 50, wordCount: 25, durationMs: 30000 }),
        createMockSession({ wpm: 100, wordCount: 50, durationMs: 30000 }),
        createMockSession({ wpm: 150, wordCount: 75, durationMs: 30000 }),
      ];

      const stats = calculateWPMStats(sessions);

      expect(stats?.averageWpm).toBe(100);
      expect(stats?.fastestWpm).toBe(150);
      expect(stats?.slowestWpm).toBe(50);
      expect(stats?.sessionCount).toBe(3);
      expect(stats?.totalWordsRead).toBe(150);
    });
  });

  describe('getWPMByLevel', () => {
    test('returns null for each level with no sessions', () => {
      const byLevel = getWPMByLevel([]);

      expect(byLevel.beginner).toBe(null);
      expect(byLevel.intermediate).toBe(null);
      expect(byLevel.advanced).toBe(null);
    });

    test('separates sessions by level', () => {
      const sessions: ReadingTimeSession[] = [
        createMockSession({ passageLevel: 'beginner', wpm: 50 }),
        createMockSession({ passageLevel: 'beginner', wpm: 70 }),
        createMockSession({ passageLevel: 'intermediate', wpm: 80 }),
        createMockSession({ passageLevel: 'advanced', wpm: 100 }),
      ];

      const byLevel = getWPMByLevel(sessions);

      expect(byLevel.beginner?.averageWpm).toBe(60);
      expect(byLevel.beginner?.sessionCount).toBe(2);
      expect(byLevel.intermediate?.averageWpm).toBe(80);
      expect(byLevel.advanced?.averageWpm).toBe(100);
    });
  });

  describe('calculateFluencyProgress', () => {
    test('returns null with fewer than minimum sessions', () => {
      const sessions = [createMockSession({})];
      expect(calculateFluencyProgress(sessions)).toBe(null);
    });

    test('detects improving trend', () => {
      const sessions = createProgressingSessions(40, 80, 8);

      const progress = calculateFluencyProgress(sessions);

      expect(progress?.trend).toBe('improving');
      expect(progress?.changePercent).toBeGreaterThan(0);
    });

    test('detects declining trend', () => {
      const sessions = createProgressingSessions(80, 40, 8);

      const progress = calculateFluencyProgress(sessions);

      expect(progress?.trend).toBe('declining');
      expect(progress?.changePercent).toBeLessThan(0);
    });

    test('detects stable trend', () => {
      const sessions = createProgressingSessions(60, 62, 8);

      const progress = calculateFluencyProgress(sessions);

      expect(progress?.trend).toBe('stable');
    });
  });

  describe('classifyFluencyLevel', () => {
    test('classifies beginner correctly', () => {
      expect(classifyFluencyLevel(20)).toBe('beginner');
      expect(classifyFluencyLevel(29)).toBe('beginner');
    });

    test('classifies developing correctly', () => {
      expect(classifyFluencyLevel(30)).toBe('developing');
      expect(classifyFluencyLevel(59)).toBe('developing');
    });

    test('classifies intermediate correctly', () => {
      expect(classifyFluencyLevel(60)).toBe('intermediate');
      expect(classifyFluencyLevel(99)).toBe('intermediate');
    });

    test('classifies advanced correctly', () => {
      expect(classifyFluencyLevel(100)).toBe('advanced');
      expect(classifyFluencyLevel(149)).toBe('advanced');
    });

    test('classifies fluent correctly', () => {
      expect(classifyFluencyLevel(150)).toBe('fluent');
      expect(classifyFluencyLevel(200)).toBe('fluent');
    });
  });

  describe('calculateReadingStreak', () => {
    test('returns 0 for empty sessions', () => {
      expect(calculateReadingStreak([])).toBe(0);
    });

    test('returns 1 for session today', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      vi.setSystemTime(today);

      const sessions = [createMockSession({ startTime: today.getTime() })];

      expect(calculateReadingStreak(sessions)).toBe(1);
    });

    test('counts consecutive days correctly', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      vi.setSystemTime(today);

      const sessions = [
        createMockSession({ startTime: today.getTime() }),
        createMockSession({ startTime: today.getTime() - 24 * 60 * 60 * 1000 }),
        createMockSession({ startTime: today.getTime() - 2 * 24 * 60 * 60 * 1000 }),
      ];

      expect(calculateReadingStreak(sessions)).toBe(3);
    });

    test('breaks streak on gap day', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      vi.setSystemTime(today);

      const sessions = [
        createMockSession({ startTime: today.getTime() }),
        // Gap - no yesterday session
        createMockSession({ startTime: today.getTime() - 2 * 24 * 60 * 60 * 1000 }),
      ];

      expect(calculateReadingStreak(sessions)).toBe(1);
    });

    test('returns 0 if most recent session is before yesterday', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      vi.setSystemTime(today);

      const sessions = [
        createMockSession({ startTime: today.getTime() - 3 * 24 * 60 * 60 * 1000 }),
      ];

      expect(calculateReadingStreak(sessions)).toBe(0);
    });
  });

  describe('getSessionsByPeriod', () => {
    test('returns all sessions for "all" period', () => {
      // Add sessions across different times
      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ startTime: Date.now() - 100 * 24 * 60 * 60 * 1000 }),
        createMockSession({ startTime: Date.now() }),
      ];
      saveReadingTimeData(data);

      const sessions = getSessionsByPeriod('all');
      expect(sessions.length).toBe(2);
    });

    test('filters sessions for "today"', () => {
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      vi.setSystemTime(now);

      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ startTime: now.getTime() - 24 * 60 * 60 * 1000 }), // Yesterday
        createMockSession({ startTime: now.getTime() }), // Today
      ];
      saveReadingTimeData(data);

      const sessions = getSessionsByPeriod('today');
      expect(sessions.length).toBe(1);
    });

    test('filters sessions for "week"', () => {
      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ startTime: Date.now() - 10 * 24 * 60 * 60 * 1000 }), // 10 days ago
        createMockSession({ startTime: Date.now() - 5 * 24 * 60 * 60 * 1000 }), // 5 days ago
        createMockSession({ startTime: Date.now() }), // Today
      ];
      saveReadingTimeData(data);

      const sessions = getSessionsByPeriod('week');
      expect(sessions.length).toBe(2);
    });
  });

  describe('getRecentSessions', () => {
    test('returns empty array when no sessions', () => {
      expect(getRecentSessions()).toEqual([]);
    });

    test('returns sessions in reverse chronological order', () => {
      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ id: 'first', startTime: 1000 }),
        createMockSession({ id: 'second', startTime: 2000 }),
        createMockSession({ id: 'third', startTime: 3000 }),
      ];
      saveReadingTimeData(data);

      const recent = getRecentSessions(10);

      expect(recent[0].id).toBe('third');
      expect(recent[2].id).toBe('first');
    });

    test('limits number of returned sessions', () => {
      const data = loadReadingTimeData();
      data.sessions = Array.from({ length: 20 }, (_, i) =>
        createMockSession({ id: `session-${i}` })
      );
      saveReadingTimeData(data);

      const recent = getRecentSessions(5);
      expect(recent.length).toBe(5);
    });
  });

  describe('getPassageReadingHistory', () => {
    test('returns empty array for passage with no sessions', () => {
      expect(getPassageReadingHistory('b1')).toEqual([]);
    });

    test('returns only sessions for specified passage', () => {
      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ passageId: 'b1' }),
        createMockSession({ passageId: 'b2' }),
        createMockSession({ passageId: 'b1' }),
      ];
      saveReadingTimeData(data);

      const history = getPassageReadingHistory('b1');
      expect(history.length).toBe(2);
      expect(history.every((s) => s.passageId === 'b1')).toBe(true);
    });
  });

  describe('getPassageAverageWPM', () => {
    test('returns null for passage with no sessions', () => {
      expect(getPassageAverageWPM('b1')).toBe(null);
    });

    test('returns average WPM for passage', () => {
      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ passageId: 'b1', wpm: 60 }),
        createMockSession({ passageId: 'b1', wpm: 80 }),
        createMockSession({ passageId: 'b2', wpm: 100 }), // Different passage
      ];
      saveReadingTimeData(data);

      expect(getPassageAverageWPM('b1')).toBe(70);
    });
  });

  describe('getReadingTimeSummary', () => {
    test('returns sensible defaults for empty data', () => {
      const summary = getReadingTimeSummary();

      expect(summary.allTime).toBe(null);
      expect(summary.fluencyLevel).toBe('beginner');
      expect(summary.totalSessions).toBe(0);
      expect(summary.readingStreak).toBe(0);
    });

    test('returns comprehensive summary with data', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      vi.setSystemTime(today);

      const data = loadReadingTimeData();
      data.sessions = [
        createMockSession({ wpm: 60, startTime: today.getTime() }),
        createMockSession({ wpm: 80, startTime: today.getTime() - 24 * 60 * 60 * 1000 }),
      ];
      saveReadingTimeData(data);

      const summary = getReadingTimeSummary();

      expect(summary.allTime).not.toBe(null);
      expect(summary.allTime?.averageWpm).toBe(70);
      expect(summary.fluencyLevel).toBe('intermediate');
      expect(summary.totalSessions).toBe(2);
      expect(summary.readingStreak).toBe(2);
    });
  });
});

// ==========================================================================
// Helper Functions
// ==========================================================================

function createMockSession(
  overrides: Partial<ReadingTimeSession> = {}
): ReadingTimeSession {
  const id = overrides.id || `mock_${Math.random().toString(36).slice(2)}`;
  return {
    id,
    passageId: overrides.passageId || 'b1',
    passageLevel: overrides.passageLevel || 'beginner',
    wordCount: overrides.wordCount || 50,
    startTime: overrides.startTime || Date.now(),
    endTime: overrides.endTime || Date.now() + 30000,
    durationMs: overrides.durationMs || 30000,
    wpm: overrides.wpm || 100,
    completed: overrides.completed ?? true,
  };
}

function createProgressingSessions(
  startWpm: number,
  endWpm: number,
  count: number
): ReadingTimeSession[] {
  const sessions: ReadingTimeSession[] = [];
  const wpmIncrement = (endWpm - startWpm) / (count - 1);

  for (let i = 0; i < count; i++) {
    sessions.push(
      createMockSession({
        wpm: Math.round(startWpm + wpmIncrement * i),
        startTime: Date.now() - (count - i) * 24 * 60 * 60 * 1000,
      })
    );
  }

  return sessions;
}
