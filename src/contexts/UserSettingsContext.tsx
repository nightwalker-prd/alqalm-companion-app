/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getOnboardingData, resetOnboarding } from '../components/onboarding';
import type { OnboardingData, LearningGoal } from '../components/onboarding/types';
import { getLessonMasteryPercent } from '../lib/progressService';
import { MASTERY_THRESHOLDS } from '../types/progress';

// Minimum mastery % to unlock next lesson
const UNLOCK_THRESHOLD = 60;

interface UserSettings extends OnboardingData {
  // Computed helpers - these check real mastery data
  isLessonUnlocked: (book: number, lesson: number) => boolean;
  isLessonCompleted: (book: number, lesson: number) => boolean;
  isBookUnlocked: (book: number) => boolean;
  getNextUnlockedLesson: () => { book: number; lesson: number };
}

interface UserSettingsContextValue {
  settings: UserSettings | null;
  isLoading: boolean;
  refreshProgress: () => void;
  resetSettings: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

// Max lessons per book (Madina Arabic Course)
const MAX_LESSONS: Record<number, number> = {
  1: 35,   // Madina Book 1
  2: 56,   // Madina Book 2
  3: 119,  // Madina Book 3
};

// Total number of books
const TOTAL_BOOKS = 3;

// Convert book/lesson to lessonId format used by progressService
function toLessonId(book: number, lesson: number): string {
  return `b${book}-l${String(lesson).padStart(2, '0')}`;
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Build settings with real mastery checks
  const buildSettings = useCallback((onboardingData: OnboardingData): UserSettings => {
    const { startingBook, startingLesson } = onboardingData;

    // Check if a lesson is unlocked based on mastery of previous lesson
    const isLessonUnlocked = (book: number, lesson: number): boolean => {
      // Lessons before starting point are always unlocked (placement/review)
      if (book < startingBook) return true;
      if (book === startingBook && lesson <= startingLesson) return true;

      // First lesson of a book: check if previous book's last lesson is complete
      if (lesson === 1 && book > 1) {
        const prevBookLastLesson = MAX_LESSONS[book - 1] || 35;
        const prevLessonId = toLessonId(book - 1, prevBookLastLesson);
        const prevMastery = getLessonMasteryPercent(prevLessonId);
        return prevMastery >= UNLOCK_THRESHOLD;
      }

      // Check previous lesson's mastery
      const prevLessonId = toLessonId(book, lesson - 1);
      const prevMastery = getLessonMasteryPercent(prevLessonId);
      return prevMastery >= UNLOCK_THRESHOLD;
    };

    // Check if a lesson is fully completed (90%+ mastery)
    const isLessonCompleted = (book: number, lesson: number): boolean => {
      const lessonId = toLessonId(book, lesson);
      const mastery = getLessonMasteryPercent(lessonId);
      return mastery >= MASTERY_THRESHOLDS.LESSON_COMPLETE;
    };

    // Check if a book is unlocked
    const isBookUnlocked = (book: number): boolean => {
      if (book <= startingBook) return true;
      if (book === 1) return true;
      
      // Book unlocks when its first lesson is unlocked
      return isLessonUnlocked(book, 1);
    };

    // Find the furthest unlocked lesson the user can access
    const getNextUnlockedLesson = (): { book: number; lesson: number } => {
      // Start from current position and find the furthest unlocked
      for (let book = TOTAL_BOOKS; book >= 1; book--) {
        const maxLesson = MAX_LESSONS[book] || 35;
        for (let lesson = maxLesson; lesson >= 1; lesson--) {
          if (isLessonUnlocked(book, lesson)) {
            return { book, lesson };
          }
        }
      }
      return { book: startingBook, lesson: startingLesson };
    };

    return {
      ...onboardingData,
      isLessonUnlocked,
      isLessonCompleted,
      isBookUnlocked,
      getNextUnlockedLesson,
    };
  }, []);

  // Load settings on mount and when refreshKey changes
  useEffect(() => {
    const onboardingData = getOnboardingData();
    
    if (onboardingData) {
      const builtSettings = buildSettings(onboardingData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(builtSettings);
    }
    
    setIsLoading(false);
  }, [buildSettings, refreshKey]);

  // Force refresh of progress checks (call after exercises complete)
  const refreshProgress = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const resetSettings = useCallback(() => {
    resetOnboarding();
    setSettings(null);
  }, []);

  return (
    <UserSettingsContext.Provider value={{ settings, isLoading, refreshProgress, resetSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return context;
}

// Helper hooks for common use cases
export function useDailyGoal() {
  const { settings } = useUserSettings();
  return settings?.dailyLessonGoal ?? 2;
}

export function useLearningGoal(): LearningGoal {
  const { settings } = useUserSettings();
  return settings?.goal ?? 'general';
}

export function useStartingPoint() {
  const { settings } = useUserSettings();
  return {
    book: settings?.startingBook ?? 1,
    lesson: settings?.startingLesson ?? 1,
  };
}
