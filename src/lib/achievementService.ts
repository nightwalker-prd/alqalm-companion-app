/**
 * Achievement & Streak Service
 * Tracks user milestones and daily streaks
 */

// Storage keys
const ACHIEVEMENTS_KEY = 'madina_achievements';
const STREAK_KEY = 'madina_streak';

// Achievement definitions
export interface AchievementDef {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  category: 'streak' | 'mastery' | 'practice' | 'milestone';
  // For threshold-based achievements
  threshold?: number;
  // For checking if earned
  check?: (stats: UserStats) => boolean;
}

export interface Achievement extends AchievementDef {
  unlockedAt?: string; // ISO date when earned
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalWordsLearned: number;
  totalExercisesCompleted: number;
  totalPracticeSessions: number;
  perfectSessions: number;
  lessonsStarted: number;
  lessonsCompleted: number;
  booksCompleted: number;
  rootsExplored: number;
  irabSessionsCompleted: number;
  readingPassagesCompleted: number;
  firstPracticeDate?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null; // ISO date
  streakDates: string[]; // Last 30 days of practice
}

// All achievement definitions
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // === Streak Achievements ===
  {
    id: 'streak-3',
    title: 'Three-Peat',
    titleAr: 'ثلاثة أيام',
    description: 'Practice 3 days in a row',
    icon: '🔥',
    tier: 'bronze',
    category: 'streak',
    threshold: 3,
    check: (s) => s.currentStreak >= 3 || s.longestStreak >= 3,
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    titleAr: 'محارب الأسبوع',
    description: 'Practice 7 days in a row',
    icon: '🔥',
    tier: 'bronze',
    category: 'streak',
    threshold: 7,
    check: (s) => s.currentStreak >= 7 || s.longestStreak >= 7,
  },
  {
    id: 'streak-14',
    title: 'Fortnight Fighter',
    titleAr: 'مقاتل الأسبوعين',
    description: 'Practice 14 days in a row',
    icon: '🔥',
    tier: 'silver',
    category: 'streak',
    threshold: 14,
    check: (s) => s.currentStreak >= 14 || s.longestStreak >= 14,
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    titleAr: 'سيد الشهر',
    description: 'Practice 30 days in a row',
    icon: '🔥',
    tier: 'silver',
    category: 'streak',
    threshold: 30,
    check: (s) => s.currentStreak >= 30 || s.longestStreak >= 30,
  },
  {
    id: 'streak-100',
    title: 'Century',
    titleAr: 'المئوية',
    description: 'Practice 100 days in a row',
    icon: '💯',
    tier: 'gold',
    category: 'streak',
    threshold: 100,
    check: (s) => s.currentStreak >= 100 || s.longestStreak >= 100,
  },

  // === Mastery Achievements ===
  {
    id: 'words-25',
    title: 'Word Collector',
    titleAr: 'جامع الكلمات',
    description: 'Learn 25 vocabulary words',
    icon: '📝',
    tier: 'bronze',
    category: 'mastery',
    threshold: 25,
    check: (s) => s.totalWordsLearned >= 25,
  },
  {
    id: 'words-100',
    title: 'Vocabulary Builder',
    titleAr: 'بنّاء المفردات',
    description: 'Learn 100 vocabulary words',
    icon: '📚',
    tier: 'bronze',
    category: 'mastery',
    threshold: 100,
    check: (s) => s.totalWordsLearned >= 100,
  },
  {
    id: 'words-250',
    title: 'Word Hoarder',
    titleAr: 'مكتنز الكلمات',
    description: 'Learn 250 vocabulary words',
    icon: '📖',
    tier: 'silver',
    category: 'mastery',
    threshold: 250,
    check: (s) => s.totalWordsLearned >= 250,
  },
  {
    id: 'words-500',
    title: 'Lexicon Lord',
    titleAr: 'سيد المعجم',
    description: 'Learn 500 vocabulary words',
    icon: '👑',
    tier: 'gold',
    category: 'mastery',
    threshold: 500,
    check: (s) => s.totalWordsLearned >= 500,
  },

  // === Practice Achievements ===
  {
    id: 'exercises-50',
    title: 'Getting Started',
    titleAr: 'البداية',
    description: 'Complete 50 exercises',
    icon: '✏️',
    tier: 'bronze',
    category: 'practice',
    threshold: 50,
    check: (s) => s.totalExercisesCompleted >= 50,
  },
  {
    id: 'exercises-250',
    title: 'Practice Makes Perfect',
    titleAr: 'الممارسة تصنع الكمال',
    description: 'Complete 250 exercises',
    icon: '💪',
    tier: 'silver',
    category: 'practice',
    threshold: 250,
    check: (s) => s.totalExercisesCompleted >= 250,
  },
  {
    id: 'exercises-1000',
    title: 'Exercise Champion',
    titleAr: 'بطل التمارين',
    description: 'Complete 1000 exercises',
    icon: '🏆',
    tier: 'gold',
    category: 'practice',
    threshold: 1000,
    check: (s) => s.totalExercisesCompleted >= 1000,
  },
  {
    id: 'perfect-5',
    title: 'Sharp Mind',
    titleAr: 'عقل حاد',
    description: 'Complete 5 perfect practice sessions (100%)',
    icon: '🎯',
    tier: 'bronze',
    category: 'practice',
    threshold: 5,
    check: (s) => s.perfectSessions >= 5,
  },
  {
    id: 'perfect-25',
    title: 'Perfectionist',
    titleAr: 'الكمالي',
    description: 'Complete 25 perfect practice sessions',
    icon: '⭐',
    tier: 'silver',
    category: 'practice',
    threshold: 25,
    check: (s) => s.perfectSessions >= 25,
  },

  // === Milestone Achievements ===
  {
    id: 'first-practice',
    title: 'First Steps',
    titleAr: 'الخطوات الأولى',
    description: 'Complete your first practice session',
    icon: '🌱',
    tier: 'bronze',
    category: 'milestone',
    check: (s) => s.totalPracticeSessions >= 1,
  },
  {
    id: 'first-irab',
    title: 'Grammar Explorer',
    titleAr: 'مستكشف النحو',
    description: "Complete your first i'rab session",
    icon: '🔤',
    tier: 'bronze',
    category: 'milestone',
    check: (s) => s.irabSessionsCompleted >= 1,
  },
  {
    id: 'roots-10',
    title: 'Root Digger',
    titleAr: 'حفّار الجذور',
    description: 'Explore 10 root families',
    icon: '🌳',
    tier: 'bronze',
    category: 'milestone',
    threshold: 10,
    check: (s) => s.rootsExplored >= 10,
  },
  {
    id: 'book1-complete',
    title: 'Book 1 Graduate',
    titleAr: 'خريج الكتاب الأول',
    description: 'Complete all lessons in Book 1',
    icon: '🎓',
    tier: 'silver',
    category: 'milestone',
    check: (s) => s.booksCompleted >= 1,
  },
  {
    id: 'reading-10',
    title: 'Avid Reader',
    titleAr: 'قارئ نهم',
    description: 'Complete 10 reading passages',
    icon: '📖',
    tier: 'bronze',
    category: 'milestone',
    threshold: 10,
    check: (s) => s.readingPassagesCompleted >= 10,
  },
];

// === Storage Functions ===

export function loadAchievements(): Record<string, string> {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveAchievements(achievements: Record<string, string>): void {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
}

export function loadStreakData(): StreakData {
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    streakDates: [],
  };
}

export function saveStreakData(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function resetStreakData(): void {
  localStorage.removeItem(STREAK_KEY);
  localStorage.removeItem(ACHIEVEMENTS_KEY);
}

// === Streak Logic ===

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Record a practice session for today.
 * Updates streak if needed.
 */
export function recordPracticeDay(): StreakData {
  const data = loadStreakData();
  const today = getToday();
  const yesterday = getYesterday();

  // Already recorded today
  if (data.lastPracticeDate === today) {
    return data;
  }

  // Update streak
  if (data.lastPracticeDate === yesterday) {
    // Continue streak
    data.currentStreak += 1;
  } else if (data.lastPracticeDate !== today) {
    // Streak broken (or first time)
    data.currentStreak = 1;
  }

  // Update longest streak
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  // Record date
  data.lastPracticeDate = today;

  // Keep last 30 days of practice dates
  if (!data.streakDates.includes(today)) {
    data.streakDates.push(today);
    // Keep only last 30
    if (data.streakDates.length > 30) {
      data.streakDates = data.streakDates.slice(-30);
    }
  }

  saveStreakData(data);
  return data;
}

/**
 * Check if streak is still active (practiced today or yesterday)
 */
export function isStreakActive(): boolean {
  const data = loadStreakData();
  const today = getToday();
  const yesterday = getYesterday();
  return data.lastPracticeDate === today || data.lastPracticeDate === yesterday;
}

// === Achievement Checking ===

/**
 * Get all achievements with their unlock status
 */
export function getAchievements(): Achievement[] {
  const unlocked = loadAchievements();
  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlockedAt: unlocked[def.id],
  }));
}

/**
 * Check for newly earned achievements.
 * Returns array of newly unlocked achievements.
 */
export function checkAchievements(stats: UserStats): Achievement[] {
  const unlocked = loadAchievements();
  const newlyUnlocked: Achievement[] = [];
  const today = new Date().toISOString();

  for (const def of ACHIEVEMENT_DEFS) {
    // Skip if already unlocked
    if (unlocked[def.id]) continue;

    // Check if earned
    if (def.check && def.check(stats)) {
      unlocked[def.id] = today;
      newlyUnlocked.push({ ...def, unlockedAt: today });
    }
  }

  // Save if any new
  if (newlyUnlocked.length > 0) {
    saveAchievements(unlocked);
  }

  return newlyUnlocked;
}

/**
 * Get achievement stats summary
 */
export function getAchievementSummary(): {
  total: number;
  unlocked: number;
  bronze: number;
  silver: number;
  gold: number;
} {
  const achievements = getAchievements();
  const unlockedList = achievements.filter(a => a.unlockedAt);

  return {
    total: achievements.length,
    unlocked: unlockedList.length,
    bronze: unlockedList.filter(a => a.tier === 'bronze').length,
    silver: unlockedList.filter(a => a.tier === 'silver').length,
    gold: unlockedList.filter(a => a.tier === 'gold').length,
  };
}

/**
 * Get tier color classes
 */
export function getTierColors(tier: 'bronze' | 'silver' | 'gold'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case 'gold':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-300 dark:border-amber-700',
      };
    case 'silver':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
      };
    case 'bronze':
    default:
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/50',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-300 dark:border-orange-700',
      };
  }
}
