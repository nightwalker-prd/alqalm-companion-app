import { getTierColors, type Achievement } from '../../lib/achievementService';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showDetails = true,
}: AchievementBadgeProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const tierColors = getTierColors(achievement.tier);

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'text-xl',
      title: 'text-xs',
      desc: 'text-[10px]',
    },
    md: {
      container: 'p-3',
      icon: 'text-3xl',
      title: 'text-sm',
      desc: 'text-xs',
    },
    lg: {
      container: 'p-4',
      icon: 'text-4xl',
      title: 'text-base',
      desc: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`
        rounded-[var(--radius-lg)] border-2 transition-all
        ${classes.container}
        ${isUnlocked
          ? `${tierColors.bg} ${tierColors.border}`
          : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50'
        }
      `}
    >
      <div className="flex flex-col items-center text-center gap-1">
        {/* Icon */}
        <span className={`${classes.icon} ${isUnlocked ? '' : 'grayscale'}`}>
          {achievement.icon}
        </span>

        {showDetails && (
          <>
            {/* Title */}
            <h4 className={`font-medium ${classes.title} ${isUnlocked ? tierColors.text : 'text-gray-400 dark:text-gray-500'}`}>
              {achievement.title}
            </h4>

            {/* Description */}
            <p className={`${classes.desc} text-[var(--color-ink-muted)]`}>
              {achievement.description}
            </p>

            {/* Unlock date */}
            {isUnlocked && achievement.unlockedAt && (
              <p className={`${classes.desc} ${tierColors.text} mt-1`}>
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
