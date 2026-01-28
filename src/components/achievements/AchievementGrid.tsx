import { useMemo } from 'react';
import { AchievementBadge } from './AchievementBadge';
import { getAchievements, getAchievementSummary } from '../../lib/achievementService';

interface AchievementGridProps {
  filter?: 'all' | 'unlocked' | 'locked';
  category?: 'streak' | 'mastery' | 'practice' | 'milestone' | 'all';
}

export function AchievementGrid({
  filter = 'all',
  category = 'all',
}: AchievementGridProps) {
  const achievements = useMemo(() => {
    let list = getAchievements();

    // Filter by unlock status
    if (filter === 'unlocked') {
      list = list.filter(a => a.unlockedAt);
    } else if (filter === 'locked') {
      list = list.filter(a => !a.unlockedAt);
    }

    // Filter by category
    if (category !== 'all') {
      list = list.filter(a => a.category === category);
    }

    // Sort: unlocked first, then by tier (gold > silver > bronze)
    const tierOrder = { gold: 0, silver: 1, bronze: 2 };
    list.sort((a, b) => {
      // Unlocked first
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      // Then by tier
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

    return list;
  }, [filter, category]);

  const summary = getAchievementSummary();

  return (
    <div>
      {/* Summary stats */}
      <div className="flex items-center justify-center gap-6 mb-6 p-4 bg-[var(--color-sand-50)] rounded-[var(--radius-lg)]">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-ink)]">
            {summary.unlocked}/{summary.total}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">Unlocked</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-sand-200)]" />
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-lg">🥉</span>
            <p className="text-sm font-medium">{summary.bronze}</p>
          </div>
          <div className="text-center">
            <span className="text-lg">🥈</span>
            <p className="text-sm font-medium">{summary.silver}</p>
          </div>
          <div className="text-center">
            <span className="text-lg">🥇</span>
            <p className="text-sm font-medium">{summary.gold}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {achievements.length === 0 ? (
        <p className="text-center text-[var(--color-ink-muted)] py-8">
          No achievements {filter === 'unlocked' ? 'unlocked yet' : 'in this category'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map(achievement => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="md"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact achievement summary for dashboard
 */
export function AchievementSummaryCard() {
  const summary = getAchievementSummary();
  const achievements = getAchievements();
  const recentUnlocked = achievements
    .filter(a => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {recentUnlocked.length > 0 ? (
          recentUnlocked.map(a => (
            <span key={a.id} className="text-2xl" title={a.title}>
              {a.icon}
            </span>
          ))
        ) : (
          <span className="text-[var(--color-ink-muted)] text-sm">No achievements yet</span>
        )}
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-[var(--color-ink)]">
          {summary.unlocked}/{summary.total}
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">achievements</p>
      </div>
    </div>
  );
}
