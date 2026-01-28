import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { StreakDisplay, AchievementGrid } from '../components/achievements';
import { loadStreakData } from '../lib/achievementService';

type CategoryFilter = 'all' | 'streak' | 'mastery' | 'practice' | 'milestone';

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🏆' },
  { id: 'streak', label: 'Streaks', icon: '🔥' },
  { id: 'mastery', label: 'Mastery', icon: '📚' },
  { id: 'practice', label: 'Practice', icon: '💪' },
  { id: 'milestone', label: 'Milestones', icon: '🎯' },
];

export function Achievements() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const streakData = loadStreakData();

  return (
    <>
      <Header title="Achievements" titleArabic="الإنجازات" />
      <PageContainer>
        {/* Streak Hero */}
        <Card variant="elevated" padding="lg" className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-1">
                Your Streak
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">
                {streakData.currentStreak > 0
                  ? `Keep it going! You're on fire.`
                  : 'Start practicing to build your streak!'
                }
              </p>
            </div>
            <StreakDisplay size="lg" />
          </div>

          {/* Streak stats */}
          <div className="mt-4 pt-4 border-t border-[var(--color-sand-200)] grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-[var(--color-ink)]">
                {streakData.longestStreak}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">Longest streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-ink)]">
                {streakData.streakDates.length}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">Days this month</p>
            </div>
          </div>
        </Card>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide animate-slide-up">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${category === cat.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                }
              `}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        <div className="animate-slide-up stagger-1">
          <AchievementGrid category={category} />
        </div>

        {/* Motivation quote */}
        <div className="text-center py-8 text-sm text-[var(--color-ink-muted)]">
          <p className="italic">
            "Every accomplishment starts with the decision to try."
          </p>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default Achievements;
