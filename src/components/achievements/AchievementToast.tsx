import { useState, useEffect } from 'react';
import { getTierColors, type Achievement } from '../../lib/achievementService';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  duration?: number;
}

export function AchievementToast({
  achievement,
  onDismiss,
  duration = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const tierColors = getTierColors(achievement.tier);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <div
        className={`
          flex items-center gap-4 px-5 py-4 rounded-[var(--radius-lg)]
          shadow-lg border-2 min-w-[300px] max-w-[90vw]
          ${tierColors.bg} ${tierColors.border}
        `}
      >
        {/* Icon */}
        <span className="text-4xl animate-bounce">{achievement.icon}</span>

        {/* Content */}
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
            Achievement Unlocked!
          </p>
          <h3 className={`text-lg font-bold ${tierColors.text}`}>
            {achievement.title}
          </h3>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {achievement.description}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(onDismiss, 300);
          }}
          className="p-1 hover:bg-black/10 rounded transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Toast container for showing multiple achievements
 */
interface AchievementToastContainerProps {
  achievements: Achievement[];
  onAllDismissed: () => void;
}

export function AchievementToastContainer({
  achievements,
  onAllDismissed,
}: AchievementToastContainerProps) {
  const [queue, setQueue] = useState<Achievement[]>(achievements);

  useEffect(() => {
    setQueue(achievements);
  }, [achievements]);

  const handleDismiss = () => {
    setQueue(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        onAllDismissed();
      }
      return next;
    });
  };

  if (queue.length === 0) return null;

  return <AchievementToast achievement={queue[0]} onDismiss={handleDismiss} />;
}
