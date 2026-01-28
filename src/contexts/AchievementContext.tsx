/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AchievementToastContainer } from '../components/achievements';
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
import { getProgress } from '../lib/progressService';

interface AchievementContextValue {
  streakData: StreakData;
  achievements: Achievement[];
  summary: ReturnType<typeof getAchievementSummary>;
  // Record a practice session and check for achievements
  recordPractice: (sessionStats?: {
    exerciseCount: number;
    correctCount: number;
    isPerfect: boolean;
  }) => Achievement[];
  // Manually check for achievements without recording practice
  checkForAchievements: () => Achievement[];
  // Refresh streak data from storage
  refreshStreak: () => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within AchievementProvider');
  }
  return context;
}

/**
 * Build user stats from progress data for achievement checking
 */
function buildUserStats(streakData: StreakData): UserStats {
  const progress = getProgress();

  // Count words with strength >= 80 as "learned"
  let totalWordsLearned = 0;
  let totalExercises = 0;

  if (progress.wordMastery) {
    for (const word of Object.values(progress.wordMastery)) {
      totalExercises += (word.timesCorrect || 0) + (word.timesIncorrect || 0);
      if (word.strength >= 80) {
        totalWordsLearned++;
      }
    }
  }

  const lessonsStarted = progress.lessonProgress ? Object.keys(progress.lessonProgress).length : 0;

  // Get session-level stats (stored separately)
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
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    totalWordsLearned,
    totalExercisesCompleted: totalExercises,
    totalPracticeSessions: sessionStats.totalSessions,
    perfectSessions: sessionStats.perfectSessions,
    lessonsStarted,
    lessonsCompleted: sessionStats.lessonsCompleted,
    booksCompleted: sessionStats.booksCompleted,
    rootsExplored: sessionStats.rootsExplored,
    irabSessionsCompleted: sessionStats.irabSessions,
    readingPassagesCompleted: sessionStats.readingCompleted,
    firstPracticeDate: progress.stats.lastPracticeDate ?? undefined,
  };
}

interface AchievementProviderProps {
  children: ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreakData());
  const [pendingToasts, setPendingToasts] = useState<Achievement[]>([]);

  // Record a practice session
  const recordPractice = useCallback((sessionStats?: {
    exerciseCount: number;
    correctCount: number;
    isPerfect: boolean;
  }) => {
    try {
      // Record the practice day (updates streak)
      const newStreakData = recordPracticeDay();
      setStreakData(newStreakData);

      // Update session stats if provided
      if (sessionStats) {
        try {
          const stored = localStorage.getItem('madina_session_stats');
          const currentStats = stored ? JSON.parse(stored) : {
            totalSessions: 0,
            perfectSessions: 0,
          };

          const updatedStats = {
            ...currentStats,
            totalSessions: (currentStats.totalSessions || 0) + 1,
            perfectSessions: (currentStats.perfectSessions || 0) + (sessionStats.isPerfect ? 1 : 0),
          };

          localStorage.setItem('madina_session_stats', JSON.stringify(updatedStats));
        } catch {
          // Ignore storage errors
        }
      }

      // Build stats and check for achievements
      const userStats = buildUserStats(newStreakData);
      const newAchievements = checkAchievements(userStats);

      // Queue toasts for new achievements
      if (newAchievements.length > 0) {
        setPendingToasts(prev => [...prev, ...newAchievements]);
      }

      return newAchievements;
    } catch (error) {
      console.error('Error recording practice:', error);
      return []; // Return empty achievements on error to prevent crash
    }
  }, []);

  // Check for achievements without recording practice
  const checkForAchievements = useCallback(() => {
    const userStats = buildUserStats(streakData);
    const newAchievements = checkAchievements(userStats);

    if (newAchievements.length > 0) {
      setPendingToasts(prev => [...prev, ...newAchievements]);
    }

    return newAchievements;
  }, [streakData]);

  // Refresh streak data
  const refreshStreak = useCallback(() => {
    setStreakData(loadStreakData());
  }, []);

  // Handle toast dismissal
  const handleToastsDismissed = useCallback(() => {
    setPendingToasts([]);
  }, []);

  const value: AchievementContextValue = {
    streakData,
    achievements: getAchievements(),
    summary: getAchievementSummary(),
    recordPractice,
    checkForAchievements,
    refreshStreak,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
      {pendingToasts.length > 0 && (
        <AchievementToastContainer
          achievements={pendingToasts}
          onAllDismissed={handleToastsDismissed}
        />
      )}
    </AchievementContext.Provider>
  );
}
