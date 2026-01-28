/**
 * Study Time Tracking Service
 *
 * Tracks time spent on each of Paul Nation's Four Strands to help users
 * maintain balanced learning. Persists data to localStorage.
 *
 * Key features:
 * - Start/stop session tracking
 * - Calculate totals and balance percentages
 * - Recommend underutilized strands
 * - Filter by time period (today, week, all-time)
 */

import type {
  LearningStrand,
  ActivityType,
  StudySession,
  StrandTotals,
  StrandBalance,
  StrandRecommendation,
  StudyTimeData,
  StudyTimeSummary,
} from '../types/studyTime';

import {
  ACTIVITY_TO_STRAND,
  TARGET_STRAND_PERCENT,
  MAX_STORED_SESSIONS,
  MIN_SESSION_DURATION_MS,
  STRAND_FULL_NAMES,
} from '../types/studyTime';

/**
 * Storage key for study time data
 */
const STORAGE_KEY = 'madina_study_time';

/**
 * Current data version
 */
const CURRENT_VERSION = 1;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get empty strand totals
 */
function emptyTotals(): StrandTotals {
  return {
    'meaning-input': 0,
    'meaning-output': 0,
    'language-focused': 0,
    fluency: 0,
  };
}

/**
 * Get initial empty study time data
 */
function getInitialData(): StudyTimeData {
  return {
    version: CURRENT_VERSION,
    sessions: [],
    totals: emptyTotals(),
    activeSessionId: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Load study time data from localStorage
 */
export function loadStudyTimeData(): StudyTimeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as StudyTimeData;
      // Could add migration logic here if version changes
      return data;
    }
  } catch (e) {
    console.warn('Failed to load study time data:', e);
  }
  return getInitialData();
}

/**
 * Save study time data to localStorage
 */
export function saveStudyTimeData(data: StudyTimeData): void {
  try {
    // Prune old sessions if exceeding max
    if (data.sessions.length > MAX_STORED_SESSIONS) {
      // Keep most recent sessions
      data.sessions = data.sessions.slice(-MAX_STORED_SESSIONS);
    }
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save study time data:', e);
  }
}

/**
 * Start a new study session
 * @returns The new session ID
 */
export function startStudySession(activityType: ActivityType): string {
  let data = loadStudyTimeData();

  // End any currently active session first
  if (data.activeSessionId) {
    endStudySession();
    // Reload data after ending session since endStudySession modifies localStorage
    data = loadStudyTimeData();
  }

  const strand = ACTIVITY_TO_STRAND[activityType];
  const sessionId = generateSessionId();

  const session: StudySession = {
    id: sessionId,
    strand,
    activityType,
    startTime: Date.now(),
    endTime: null,
    durationMs: null,
  };

  data.sessions.push(session);
  data.activeSessionId = sessionId;

  saveStudyTimeData(data);

  return sessionId;
}

/**
 * End the currently active study session
 * @returns The completed session, or null if no active session
 */
export function endStudySession(): StudySession | null {
  const data = loadStudyTimeData();

  if (!data.activeSessionId) {
    return null;
  }

  const sessionIndex = data.sessions.findIndex(
    (s) => s.id === data.activeSessionId
  );

  if (sessionIndex === -1) {
    data.activeSessionId = null;
    saveStudyTimeData(data);
    return null;
  }

  const session = data.sessions[sessionIndex];
  const endTime = Date.now();
  const durationMs = endTime - session.startTime;

  // Update session
  session.endTime = endTime;
  session.durationMs = durationMs;

  // Only count if duration is above minimum threshold
  if (durationMs >= MIN_SESSION_DURATION_MS) {
    data.totals[session.strand] += durationMs;
  }

  data.activeSessionId = null;
  saveStudyTimeData(data);

  return session;
}

/**
 * Get the currently active session, if any
 */
export function getActiveSession(): StudySession | null {
  const data = loadStudyTimeData();

  if (!data.activeSessionId) {
    return null;
  }

  return data.sessions.find((s) => s.id === data.activeSessionId) || null;
}

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
  const data = loadStudyTimeData();
  return data.activeSessionId !== null;
}

/**
 * Get total time by strand (all-time)
 */
export function getStrandTotals(): StrandTotals {
  const data = loadStudyTimeData();
  return { ...data.totals };
}

/**
 * Get strand totals for a specific time period
 */
export function getStrandTotalsForPeriod(
  startTime: number,
  endTime: number = Date.now()
): StrandTotals {
  const data = loadStudyTimeData();
  const totals = emptyTotals();

  for (const session of data.sessions) {
    if (
      session.endTime &&
      session.durationMs &&
      session.startTime >= startTime &&
      session.startTime <= endTime &&
      session.durationMs >= MIN_SESSION_DURATION_MS
    ) {
      totals[session.strand] += session.durationMs;
    }
  }

  return totals;
}

/**
 * Get strand totals for today (local timezone)
 */
export function getStrandTotalsToday(): StrandTotals {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  return getStrandTotalsForPeriod(startOfDay);
}

/**
 * Get strand totals for this week (starting Monday, local timezone)
 */
export function getStrandTotalsThisWeek(): StrandTotals {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Adjust so Monday is 0
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday
  ).getTime();
  return getStrandTotalsForPeriod(startOfWeek);
}

/**
 * Calculate balance percentages from totals
 */
export function calculateBalance(totals: StrandTotals): StrandBalance {
  const total =
    totals['meaning-input'] +
    totals['meaning-output'] +
    totals['language-focused'] +
    totals.fluency;

  if (total === 0) {
    return {
      'meaning-input': 25,
      'meaning-output': 25,
      'language-focused': 25,
      fluency: 25,
    };
  }

  return {
    'meaning-input': Math.round((totals['meaning-input'] / total) * 100),
    'meaning-output': Math.round((totals['meaning-output'] / total) * 100),
    'language-focused': Math.round((totals['language-focused'] / total) * 100),
    fluency: Math.round((totals.fluency / total) * 100),
  };
}

/**
 * Get the strand balance (all-time)
 */
export function getStrandBalance(): StrandBalance {
  return calculateBalance(getStrandTotals());
}

/**
 * Get the most underutilized strand and a recommendation
 */
export function getRecommendedStrand(
  totals?: StrandTotals
): StrandRecommendation | null {
  const actualTotals = totals || getStrandTotals();
  const balance = calculateBalance(actualTotals);

  const total =
    actualTotals['meaning-input'] +
    actualTotals['meaning-output'] +
    actualTotals['language-focused'] +
    actualTotals.fluency;

  // If no study time yet, recommend starting with input
  if (total === 0) {
    return {
      strand: 'meaning-input',
      currentPercent: 0,
      targetPercent: TARGET_STRAND_PERCENT,
      suggestion: 'Start with some reading practice to build your foundation!',
    };
  }

  // Find the most underutilized strand
  const strands: LearningStrand[] = [
    'meaning-input',
    'meaning-output',
    'language-focused',
    'fluency',
  ];

  let mostUnderutilized: LearningStrand = 'meaning-input';
  let lowestPercent = balance['meaning-input'];

  for (const strand of strands) {
    if (balance[strand] < lowestPercent) {
      lowestPercent = balance[strand];
      mostUnderutilized = strand;
    }
  }

  // Only recommend if significantly underutilized (more than 5% below target)
  if (lowestPercent >= TARGET_STRAND_PERCENT - 5) {
    return null; // Well balanced!
  }

  const suggestions: Record<LearningStrand, string> = {
    'meaning-input':
      'Try some reading practice to boost your comprehension skills!',
    'meaning-output':
      'Practice translating to Arabic to strengthen your production!',
    'language-focused':
      'Work on some vocabulary exercises to build your word knowledge!',
    fluency: 'Try a speed round to build automaticity with known words!',
  };

  return {
    strand: mostUnderutilized,
    currentPercent: lowestPercent,
    targetPercent: TARGET_STRAND_PERCENT,
    suggestion: suggestions[mostUnderutilized],
  };
}

/**
 * Get the display name for a strand
 */
export function getStrandName(strand: LearningStrand): string {
  return STRAND_FULL_NAMES[strand];
}

/**
 * Get sessions for today
 */
export function getSessionsToday(): StudySession[] {
  const data = loadStudyTimeData();
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  return data.sessions.filter(
    (s) => s.startTime >= startOfDay && s.endTime !== null
  );
}

/**
 * Get a complete summary of study time
 */
export function getStudyTimeSummary(): StudyTimeSummary {
  const totals = getStrandTotals();
  const todayTotals = getStrandTotalsToday();
  const weekTotals = getStrandTotalsThisWeek();

  const totalTimeMs =
    totals['meaning-input'] +
    totals['meaning-output'] +
    totals['language-focused'] +
    totals.fluency;

  const todayTimeMs =
    todayTotals['meaning-input'] +
    todayTotals['meaning-output'] +
    todayTotals['language-focused'] +
    todayTotals.fluency;

  const weekTimeMs =
    weekTotals['meaning-input'] +
    weekTotals['meaning-output'] +
    weekTotals['language-focused'] +
    weekTotals.fluency;

  return {
    totalTimeMs,
    byStrand: totals,
    balance: calculateBalance(totals),
    sessionsToday: getSessionsToday().length,
    todayTimeMs,
    weekTimeMs,
    recommendation: getRecommendedStrand(totals),
  };
}

/**
 * Format milliseconds as a human-readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return '0s';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Format milliseconds as a short duration (for compact display)
 */
export function formatDurationShort(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Clear all study time data (for testing/reset)
 */
export function clearStudyTimeData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get the strand for an activity type
 */
export function getStrandForActivity(activityType: ActivityType): LearningStrand {
  return ACTIVITY_TO_STRAND[activityType];
}
