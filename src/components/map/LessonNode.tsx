import { Link } from 'react-router-dom';

export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered' | 'decaying';

interface LessonNodeProps {
  lessonId: string;
  lessonNumber: number;
  titleArabic: string;
  titleEnglish: string;
  masteryLevel: MasteryLevel;
  masteryPercent: number;
  isLocked?: boolean;
}

const masteryColors: Record<MasteryLevel, { dot: string; badge: string }> = {
  new: { dot: 'bg-[var(--color-sand-300)]', badge: 'bg-[var(--color-sand-200)] text-[var(--color-ink-muted)]' },
  learning: { dot: 'bg-[var(--color-gold)]', badge: 'bg-[var(--color-gold)]/20 text-[var(--color-gold-dark)]' },
  familiar: { dot: 'bg-[var(--color-primary)]', badge: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' },
  mastered: { dot: 'bg-[var(--color-success)]', badge: 'bg-[var(--color-success)]/20 text-[var(--color-success)]' },
  decaying: { dot: 'bg-[var(--color-error)]', badge: 'bg-[var(--color-error)]/20 text-[var(--color-error)]' },
};

const masteryStyles: Record<MasteryLevel, { bg: string; border: string; text: string; glow?: string }> = {
  new: {
    bg: 'bg-[var(--color-sand-200)]',
    border: 'border-[var(--color-sand-300)]',
    text: 'text-[var(--color-ink-muted)]',
  },
  learning: {
    bg: 'bg-gradient-to-br from-[var(--color-gold-light)] to-[var(--color-gold)]',
    border: 'border-[var(--color-gold)]',
    text: 'text-[var(--color-ink)]',
    glow: 'shadow-[0_0_12px_rgba(212,165,116,0.3)]',
  },
  familiar: {
    bg: 'bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)]',
    border: 'border-[var(--color-primary)]',
    text: 'text-white',
    glow: 'shadow-[0_0_12px_rgba(13,115,119,0.3)]',
  },
  mastered: {
    bg: 'bg-gradient-to-br from-[var(--color-success)] to-[#3A6449]',
    border: 'border-[var(--color-success)]',
    text: 'text-white',
    glow: 'shadow-[0_0_12px_rgba(74,124,89,0.4)]',
  },
  decaying: {
    bg: 'bg-gradient-to-br from-[var(--color-error-light)] to-[var(--color-error)]',
    border: 'border-[var(--color-error)]',
    text: 'text-white',
    glow: 'shadow-[0_0_12px_rgba(196,100,74,0.3)]',
  },
};

export function LessonNode({
  lessonId,
  lessonNumber,
  titleArabic,
  titleEnglish,
  masteryLevel,
  masteryPercent,
  isLocked = false,
}: LessonNodeProps) {
  const styles = masteryStyles[masteryLevel];

  const content = (
    <div
      className={`
        relative
        w-full
        h-32
        p-4
        rounded-[var(--radius-lg)]
        border-2
        transition-all duration-300 ease-out
        flex flex-col justify-center
        ${styles.bg}
        ${styles.border}
        ${styles.glow || ''}
        ${!isLocked ? 'hover:scale-[1.02] hover:shadow-[var(--shadow-lg)] cursor-pointer' : 'opacity-60 cursor-not-allowed'}
        group
      `}
    >
      {/* Lesson number badge */}
      <div
        className={`
          absolute -top-2 -left-2
          w-8 h-8
          rounded-full
          flex items-center justify-center
          text-sm font-bold
          shadow-[var(--shadow-sm)]
          ${masteryLevel === 'mastered' || masteryLevel === 'decaying'
            ? 'bg-white text-[var(--color-ink)]'
            : 'bg-[var(--color-primary)] text-white'
          }
        `}
      >
        {lessonNumber}
      </div>

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-sand-100)] bg-opacity-80">
          <svg className="w-6 h-6 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className={`text-center ${isLocked ? 'opacity-30' : ''}`}>
        {/* Arabic title */}
        <p className={`arabic-base ${styles.text} mb-1 line-clamp-1`} dir="rtl">
          {titleArabic}
        </p>

        {/* English title */}
        <p className={`text-xs line-clamp-1 ${masteryLevel === 'mastered' || masteryLevel === 'decaying' ? 'text-white text-opacity-80' : 'text-[var(--color-ink-muted)]'}`}>
          {titleEnglish}
        </p>

        {/* Mastery indicator */}
        {!isLocked && masteryLevel !== 'new' && (
          <div className="mt-3">
            <div className="h-1.5 bg-black bg-opacity-10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  masteryLevel === 'mastered' ? 'bg-white' :
                  masteryLevel === 'decaying' ? 'bg-white' :
                  'bg-[var(--color-ink)]'
                }`}
                style={{ width: `${masteryPercent}%` }}
              />
            </div>
            <p className={`text-[10px] mt-1 ${
              masteryLevel === 'mastered' || masteryLevel === 'decaying' ? 'text-white text-opacity-70' : 'text-[var(--color-ink-muted)]'
            }`}>
              {masteryPercent}% mastery
            </p>
          </div>
        )}
      </div>

      {/* Hover arrow */}
      {!isLocked && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className={`w-4 h-4 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (isLocked) {
    return content;
  }

  return (
    <Link to={`/lesson/${lessonId}`} className="block">
      {content}
    </Link>
  );
}

/**
 * Compact lesson node for horizontal scroll view
 * Shows essential info in a smaller, scannable format
 */
export function LessonNodeCompact({
  lessonId,
  lessonNumber,
  titleArabic,
  titleEnglish,
  masteryLevel,
  masteryPercent,
  isLocked = false,
}: LessonNodeProps) {
  const colors = masteryColors[masteryLevel];
  
  const content = (
    <div
      className={`
        flex-shrink-0
        w-36
        p-3
        rounded-[var(--radius-md)]
        border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]
        bg-white dark:bg-[var(--color-sand-800)]
        transition-all duration-200
        ${!isLocked ? 'hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary)]/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
      `}
    >
      {/* Header row: number + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[var(--color-ink-muted)]">
          L{lessonNumber}
        </span>
        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
      </div>
      
      {/* Arabic title */}
      <p className="arabic-sm text-[var(--color-ink)] line-clamp-1 mb-1" dir="rtl">
        {titleArabic}
      </p>
      
      {/* English subtitle */}
      <p className="text-[10px] text-[var(--color-ink-muted)] line-clamp-1">
        {titleEnglish}
      </p>
      
      {/* Progress bar (if not new) */}
      {masteryLevel !== 'new' && !isLocked && (
        <div className="mt-2">
          <div className="h-1 bg-[var(--color-sand-200)] dark:bg-[var(--color-sand-700)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.dot}`}
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Lock icon */}
      {isLocked && (
        <div className="flex items-center justify-center mt-2">
          <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}
    </div>
  );
  
  if (isLocked) return content;
  
  return (
    <Link to={`/lesson/${lessonId}`} className="block">
      {content}
    </Link>
  );
}

export default LessonNode;
