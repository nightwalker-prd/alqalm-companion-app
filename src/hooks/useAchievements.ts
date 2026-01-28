import { useState, useCallback } from 'react';
import {
  checkAchievements,
  recordPracticeDay,
  loadStreakData,
  getAchievements,
  getAchievementSummary,
  type Achievement,
  type UserStats,
  type StreakData,
} from '../lib/achievementService';
import { useProgress } from './useProgress';

/**
 * Hook to manage achievements and streaks.
 * Gathers stats from progress system and checks for new achievements.
 */
export function useAchievements() {
  const { stats } = useProgress();
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreakData());

  // Build user stats from progress data
  const getUserStats = useCallback((): UserStats => {
    const streak = loadStreakData();

    // Get session-level stats from localStorage (stored separately from progress)
    let sessionStats = { totalSessions: 0, perfectSessions: 0, irabSessions: 0, readingCompleted: 0, rootsExplored: 0, lessonsCompleted: 0, booksCompleted: 0 };
    try {
      const stored = localStorage.getItem('madina_session_stats');
      if (stored) {
        sessionStats = { ...sessionStats, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalWordsLearned: stats?.wordsLearned || 0,
      totalExercisesCompleted: stats?.accuracy ? Math.round((stats.accuracy / 100) * 100) : 0, // approximation
      totalPracticeSessions: sessionStats.totalSessions || 0,
      perfectSessions: sessionStats.perfectSessions || 0,
      lessonsStarted: stats?.lessonsCompleted || 0,
      lessonsCompleted: stats?.lessonsCompleted || 0,
      booksCompleted: sessionStats.booksCompleted || 0,
      rootsExplored: sessionStats.rootsExplored || 0,
      irabSessionsCompleted: sessionStats.irabSessions || 0,
      readingPassagesCompleted: sessionStats.readingCompleted || 0,
      firstPracticeDate: stats?.lastPracticeDate ?? undefined,
    };
  }, [stats]);

  // Record a practice day and check achievements
  const recordPractice = useCallback(() => {
    // Record the practice day for streak
    const newStreakData = recordPracticeDay();
    setStreakData(newStreakData);

    // Check for new achievements
    const userStats = getUserStats();
    // Update streak in stats
    userStats.currentStreak = newStreakData.currentStreak;
    userStats.longestStreak = newStreakData.longestStreak;

    const earned = checkAchievements(userStats);
    if (earned.length > 0) {
      setNewAchievements(earned);
    }

    return { streakData: newStreakData, newAchievements: earned };
  }, [getUserStats]);

  // Clear new achievements (after showing toast)
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Check achievements without recording practice (for manual checks)
  const checkForAchievements = useCallback(() => {
    const userStats = getUserStats();
    const earned = checkAchievements(userStats);
    if (earned.length > 0) {
      setNewAchievements(prev => [...prev, ...earned]);
    }
    return earned;
  }, [getUserStats]);

  // Refresh streak data
  const refreshStreak = useCallback(() => {
    setStreakData(loadStreakData());
  }, []);

  return {
    streakData,
    newAchievements,
    recordPractice,
    clearNewAchievements,
    checkForAchievements,
    refreshStreak,
    getUserStats,
    achievements: getAchievements(),
    summary: getAchievementSummary(),
  };
}
