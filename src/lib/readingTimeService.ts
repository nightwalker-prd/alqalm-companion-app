/**
 * Reading Time & WPM Tracking Service
 *
 * Tracks reading speed (words per minute) for fluency measurement.
 * Implements Paul Nation's Strand 4: Fluency Development metrics.
 *
 * Key features:
 * - Start/stop/pause reading timer
 * - Calculate WPM for each session
 * - Track fluency progress over time
 * - Classify fluency level based on WPM
 * - Store reading sessions in localStorage
 */

import type { PassageLevel } from '../types/reading';
import type {
  ReadingTimeSession,
  ReadingTimeData,
  ActiveReadingSession,
  WPMStats,
  WPMByLevel,
  FluencyProgress,
  FluencyLevel,
  ReadingTimeSummary,
} from '../types/readingTime';

import {
  READING_TIME_VERSION,
  MAX_READING_SESSIONS,
  MIN_SESSION_DURATION_MS,
  MAX_SESSION_DURATION_MS,
  FLUENCY_THRESHOLDS,
  TREND_THRESHOLD_PERCENT,
  MIN_SESSIONS_FOR_TREND,
} from '../types/readingTime';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'madina_reading_time';

// ============================================================================
// Session ID Generation
// ============================================================================

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `rt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Data Persistence
// ============================================================================

/**
 * Get initial empty reading time data
 */
function getInitialData(): ReadingTimeData {
  return {
    version: READING_TIME_VERSION,
    sessions: [],
    activeSession: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Load reading time data from localStorage
 */
export function loadReadingTimeData(): ReadingTimeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getInitialData();

    const data = JSON.parse(stored) as ReadingTimeData;

    // Version migration (if needed in future)
    if (data.version !== READING_TIME_VERSION) {
      data.version = READING_TIME_VERSION;
      saveReadingTimeData(data);
    }

    return data;
  } catch {
    return getInitialData();
  }
}

/**
 * Save reading time data to localStorage
 */
export function saveReadingTimeData(data: ReadingTimeData): void {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save reading time data to localStorage');
  }
}

/**
 * Clear all reading time data (for testing/reset)
 */
export function clearReadingTimeData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// WPM Calculation
// ============================================================================

/**
 * Calculate words per minute from word count and duration
 * @param wordCount - Number of words read
 * @param durationMs - Reading duration in milliseconds
 * @returns WPM value (0 if invalid inputs)
 */
export function calculateWPM(wordCount: number, durationMs: number): number {
  if (wordCount <= 0 || durationMs <= 0) return 0;

  const minutes = durationMs / 60000;
  if (minutes === 0) return 0;

  const wpm = wordCount / minutes;
  return Math.round(wpm * 10) / 10; // Round to 1 decimal place
}

/**
 * Clamp session duration to valid range
 */
function clampDuration(durationMs: number): number {
  return Math.min(MAX_SESSION_DURATION_MS, Math.max(0, durationMs));
}

/**
 * Check if a session duration is valid for recording
 */
export function isValidSessionDuration(durationMs: number): boolean {
  return durationMs >= MIN_SESSION_DURATION_MS && durationMs <= MAX_SESSION_DURATION_MS;
}

// ============================================================================
// Reading Session Management
// ============================================================================

/**
 * Start a new reading session
 * @returns The active session ID, or null if another session is already active
 */
export function startReadingSession(
  passageId: string,
  passageLevel: PassageLevel,
  wordCount: number
): string | null {
  const data = loadReadingTimeData();

  // Don't start if there's already an active session
  if (data.activeSession !== null) {
    return null;
  }

  const sessionId = generateSessionId();
  const now = Date.now();

  data.activeSession = {
    id: sessionId,
    passageId,
    passageLevel,
    wordCount,
    startTime: now,
    pausedDurationMs: 0,
    isPaused: false,
    pauseStartTime: null,
  };

  saveReadingTimeData(data);
  return sessionId;
}

/**
 * Get the current active session (if any)
 */
export function getActiveSession(): ActiveReadingSession | null {
  const data = loadReadingTimeData();
  return data.activeSession;
}

/**
 * Check if a specific passage is currently being read
 */
export function isPassageBeingRead(passageId: string): boolean {
  const session = getActiveSession();
  return session?.passageId === passageId;
}

/**
 * Pause the active reading session
 */
export function pauseReadingSession(): boolean {
  const data = loadReadingTimeData();

  if (!data.activeSession || data.activeSession.isPaused) {
    return false;
  }

  data.activeSession.isPaused = true;
  data.activeSession.pauseStartTime = Date.now();
  saveReadingTimeData(data);
  return true;
}

/**
 * Resume the active reading session
 */
export function resumeReadingSession(): boolean {
  const data = loadReadingTimeData();

  if (!data.activeSession || !data.activeSession.isPaused) {
    return false;
  }

  const pauseDuration = Date.now() - (data.activeSession.pauseStartTime || Date.now());
  data.activeSession.pausedDurationMs += pauseDuration;
  data.activeSession.isPaused = false;
  data.activeSession.pauseStartTime = null;

  saveReadingTimeData(data);
  return true;
}

/**
 * Get elapsed reading time for active session (excluding paused time)
 * @returns Elapsed time in milliseconds, or 0 if no active session
 */
export function getElapsedReadingTime(): number {
  const data = loadReadingTimeData();
  const session = data.activeSession;

  if (!session) return 0;

  const now = Date.now();
  let elapsed = now - session.startTime - session.pausedDurationMs;

  // If currently paused, subtract the current pause duration
  if (session.isPaused && session.pauseStartTime) {
    elapsed -= now - session.pauseStartTime;
  }

  return Math.max(0, elapsed);
}

/**
 * Stop the active reading session and record the result
 * @param completed - Whether the user finished reading the full passage
 * @returns The completed session, or null if no active session or invalid duration
 */
export function stopReadingSession(completed: boolean): ReadingTimeSession | null {
  const data = loadReadingTimeData();
  const session = data.activeSession;

  if (!session) return null;

  const now = Date.now();

  // Calculate total duration excluding paused time
  let durationMs = now - session.startTime - session.pausedDurationMs;

  // If currently paused, subtract the current pause duration
  if (session.isPaused && session.pauseStartTime) {
    durationMs -= now - session.pauseStartTime;
  }

  // Clamp and validate duration
  durationMs = clampDuration(durationMs);

  // Clear active session first
  data.activeSession = null;

  // Don't record sessions that are too short
  if (!isValidSessionDuration(durationMs)) {
    saveReadingTimeData(data);
    return null;
  }

  // Calculate WPM
  const wpm = calculateWPM(session.wordCount, durationMs);

  // Create completed session record
  const completedSession: ReadingTimeSession = {
    id: session.id,
    passageId: session.passageId,
    passageLevel: session.passageLevel,
    wordCount: session.wordCount,
    startTime: session.startTime,
    endTime: now,
    durationMs,
    wpm,
    completed,
  };

  // Add to sessions array
  data.sessions.push(completedSession);

  // Prune old sessions if over limit
  if (data.sessions.length > MAX_READING_SESSIONS) {
    data.sessions = data.sessions.slice(-MAX_READING_SESSIONS);
  }

  saveReadingTimeData(data);
  return completedSession;
}

/**
 * Cancel the active reading session without recording
 */
export function cancelReadingSession(): boolean {
  const data = loadReadingTimeData();

  if (!data.activeSession) {
    return false;
  }

  data.activeSession = null;
  saveReadingTimeData(data);
  return true;
}

// ============================================================================
// Statistics & Analysis
// ============================================================================

/**
 * Get all recorded reading sessions
 */
export function getAllSessions(): ReadingTimeSession[] {
  const data = loadReadingTimeData();
  return data.sessions;
}

/**
 * Get sessions filtered by time period
 * @param period - 'today' | 'week' | 'month' | 'all'
 */
export function getSessionsByPeriod(
  period: 'today' | 'week' | 'month' | 'all'
): ReadingTimeSession[] {
  const data = loadReadingTimeData();
  const now = Date.now();

  if (period === 'all') {
    return data.sessions;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let cutoffTime: number;

  switch (period) {
    case 'today':
      cutoffTime = startOfDay.getTime();
      break;
    case 'week':
      cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      cutoffTime = 0;
  }

  return data.sessions.filter((s) => s.startTime >= cutoffTime);
}

/**
 * Calculate WPM statistics from a set of sessions
 */
export function calculateWPMStats(sessions: ReadingTimeSession[]): WPMStats | null {
  if (sessions.length === 0) return null;

  let totalWpm = 0;
  let fastestWpm = 0;
  let slowestWpm = Infinity;
  let totalWordsRead = 0;
  let totalTimeMs = 0;

  for (const session of sessions) {
    totalWpm += session.wpm;
    totalWordsRead += session.wordCount;
    totalTimeMs += session.durationMs;

    if (session.wpm > fastestWpm) {
      fastestWpm = session.wpm;
    }
    if (session.wpm < slowestWpm) {
      slowestWpm = session.wpm;
    }
  }

  return {
    averageWpm: Math.round((totalWpm / sessions.length) * 10) / 10,
    fastestWpm,
    slowestWpm,
    sessionCount: sessions.length,
    totalWordsRead,
    totalTimeMs,
  };
}

/**
 * Get WPM statistics broken down by passage level
 */
export function getWPMByLevel(sessions: ReadingTimeSession[]): WPMByLevel {
  const byLevel: WPMByLevel = {
    beginner: null,
    intermediate: null,
    advanced: null,
  };

  const levelSessions: Record<PassageLevel, ReadingTimeSession[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };

  for (const session of sessions) {
    levelSessions[session.passageLevel].push(session);
  }

  for (const level of ['beginner', 'intermediate', 'advanced'] as PassageLevel[]) {
    byLevel[level] = calculateWPMStats(levelSessions[level]);
  }

  return byLevel;
}

/**
 * Calculate fluency progress (trend) over time
 */
export function calculateFluencyProgress(
  sessions: ReadingTimeSession[]
): FluencyProgress | null {
  if (sessions.length < MIN_SESSIONS_FOR_TREND) {
    return null;
  }

  // Sort by time
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);

  // Split into first and second half
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  // Calculate average WPM for each half
  const firstStats = calculateWPMStats(firstHalf);
  const secondStats = calculateWPMStats(secondHalf);

  if (!firstStats || !secondStats) return null;

  const startPeriodWpm = firstStats.averageWpm;
  const endPeriodWpm = secondStats.averageWpm;

  // Calculate percentage change
  const changePercent =
    startPeriodWpm > 0
      ? Math.round(((endPeriodWpm - startPeriodWpm) / startPeriodWpm) * 100)
      : 0;

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining';
  if (changePercent >= TREND_THRESHOLD_PERCENT) {
    trend = 'improving';
  } else if (changePercent <= -TREND_THRESHOLD_PERCENT) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return {
    trend,
    changePercent,
    startPeriodWpm,
    endPeriodWpm,
  };
}

/**
 * Classify fluency level based on average WPM
 */
export function classifyFluencyLevel(averageWpm: number): FluencyLevel {
  if (averageWpm >= FLUENCY_THRESHOLDS.fluent.min) return 'fluent';
  if (averageWpm >= FLUENCY_THRESHOLDS.advanced.min) return 'advanced';
  if (averageWpm >= FLUENCY_THRESHOLDS.intermediate.min) return 'intermediate';
  if (averageWpm >= FLUENCY_THRESHOLDS.developing.min) return 'developing';
  return 'beginner';
}

/**
 * Calculate reading streak (consecutive days with reading sessions)
 */
export function calculateReadingStreak(sessions: ReadingTimeSession[]): number {
  if (sessions.length === 0) return 0;

  // Get unique days (in local timezone)
  const days = new Set<string>();
  for (const session of sessions) {
    const date = new Date(session.startTime);
    days.add(date.toDateString());
  }

  // Sort days in descending order
  const sortedDays = Array.from(days)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if today or yesterday is in the list (streak must be current)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecentDay = sortedDays[0];
  if (!mostRecentDay) return 0;

  const mostRecentDayStart = new Date(mostRecentDay);
  mostRecentDayStart.setHours(0, 0, 0, 0);

  // Streak is broken if most recent day is before yesterday
  if (mostRecentDayStart < yesterday) {
    return 0;
  }

  // Count consecutive days
  let streak = 1;
  let currentDay = mostRecentDayStart;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = new Date(sortedDays[i]);
    prevDay.setHours(0, 0, 0, 0);

    const expectedPrevDay = new Date(currentDay);
    expectedPrevDay.setDate(expectedPrevDay.getDate() - 1);

    if (prevDay.getTime() === expectedPrevDay.getTime()) {
      streak++;
      currentDay = prevDay;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get comprehensive reading time summary
 */
export function getReadingTimeSummary(): ReadingTimeSummary {
  const allSessions = getAllSessions();
  const todaySessions = getSessionsByPeriod('today');
  const weekSessions = getSessionsByPeriod('week');

  const allTimeStats = calculateWPMStats(allSessions);

  return {
    allTime: allTimeStats,
    thisWeek: calculateWPMStats(weekSessions),
    today: calculateWPMStats(todaySessions),
    byLevel: getWPMByLevel(allSessions),
    progress: calculateFluencyProgress(allSessions),
    fluencyLevel: allTimeStats ? classifyFluencyLevel(allTimeStats.averageWpm) : 'beginner',
    totalSessions: allSessions.length,
    readingStreak: calculateReadingStreak(allSessions),
  };
}

/**
 * Get the most recent sessions (for display)
 * @param limit - Maximum number of sessions to return
 */
export function getRecentSessions(limit: number = 10): ReadingTimeSession[] {
  const data = loadReadingTimeData();
  return data.sessions.slice(-limit).reverse();
}

/**
 * Get reading session history for a specific passage
 */
export function getPassageReadingHistory(passageId: string): ReadingTimeSession[] {
  const data = loadReadingTimeData();
  return data.sessions.filter((s) => s.passageId === passageId);
}

/**
 * Get average WPM for a specific passage
 */
export function getPassageAverageWPM(passageId: string): number | null {
  const sessions = getPassageReadingHistory(passageId);
  if (sessions.length === 0) return null;

  const totalWpm = sessions.reduce((sum, s) => sum + s.wpm, 0);
  return Math.round((totalWpm / sessions.length) * 10) / 10;
}
