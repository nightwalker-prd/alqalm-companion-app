import { loadStreakData, isStreakActive } from '../../lib/achievementService';

interface StreakDisplayProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StreakDisplay({ size = 'md', showLabel = true }: StreakDisplayProps) {
  const streakData = loadStreakData();
  const active = isStreakActive();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  if (streakData.currentStreak === 0 && !active) {
    return null; // Don't show if no streak
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`${iconSizes[size]} ${active ? 'animate-pulse' : 'opacity-50'}`}>
        🔥
      </span>
      <div className="flex flex-col">
        <span className={`font-bold ${sizeClasses[size]} ${active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
          {streakData.currentStreak}
        </span>
        {showLabel && (
          <span className="text-xs text-[var(--color-ink-muted)]">
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>
    </div>
  );
}
