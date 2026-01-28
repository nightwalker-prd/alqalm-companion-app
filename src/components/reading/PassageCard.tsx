import { Link } from 'react-router-dom';
import type { ReadingPassage, ReadingProgress } from '../../types/reading';

interface PassageCardProps {
  passage: ReadingPassage;
  progress?: ReadingProgress | null;
}

const levelStyles: Record<string, { bg: string; text: string; label: string }> = {
  beginner: {
    bg: 'bg-[var(--color-success)]',
    text: 'text-white',
    label: 'Beginner',
  },
  intermediate: {
    bg: 'bg-[var(--color-gold)]',
    text: 'text-[var(--color-ink)]',
    label: 'Intermediate',
  },
  advanced: {
    bg: 'bg-[var(--color-primary)]',
    text: 'text-white',
    label: 'Advanced',
  },
};

/**
 * PassageCard - Display a reading passage in a list.
 *
 * Shows the title (Arabic and English), level badge, category,
 * word count, and read status.
 */
export function PassageCard({ passage, progress }: PassageCardProps) {
  const level = levelStyles[passage.level] || levelStyles.beginner;
  const isRead = progress?.completed ?? false;
  const timesRead = progress?.timesRead ?? 0;

  return (
    <Link
      to={`/reading/${passage.id}`}
      className="block group"
    >
      <div
        className={`
          relative
          p-4
          bg-[var(--color-sand-50)]
          border border-[var(--color-sand-200)]
          rounded-[var(--radius-lg)]
          shadow-[var(--shadow-sm)]
          transition-all duration-200 ease-out
          hover:shadow-[var(--shadow-md)]
          hover:border-[var(--color-primary)]
          ${isRead ? 'bg-opacity-70' : ''}
        `}
      >
        {/* Level badge */}
        <div
          className={`
            absolute -top-2 -right-2
            px-2 py-0.5
            rounded-full
            text-xs font-medium
            ${level.bg}
            ${level.text}
            shadow-[var(--shadow-sm)]
          `}
        >
          {level.label}
        </div>

        {/* Read indicator */}
        {isRead && (
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center shadow-[var(--shadow-sm)]">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {/* Arabic title */}
        <h3
          className="arabic-lg text-[var(--color-ink)] mb-1 line-clamp-1"
          dir="rtl"
        >
          {passage.titleAr}
        </h3>

        {/* English title */}
        <h4 className="font-medium text-[var(--color-ink-light)] text-sm mb-3 line-clamp-1">
          {passage.title}
        </h4>

        {/* Preview text (first ~60 chars) */}
        <p
          className="arabic-base text-[var(--color-ink-muted)] line-clamp-2 mb-3"
          dir="rtl"
        >
          {passage.text.slice(0, 100)}...
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span className="truncate max-w-[50%]">{passage.category}</span>
          <div className="flex items-center gap-3">
            <span>{passage.wordCount} words</span>
            {timesRead > 0 && (
              <span className="text-[var(--color-success)]">
                Read {timesRead}x
              </span>
            )}
          </div>
        </div>

        {/* Hover arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-4 h-4 text-[var(--color-primary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default PassageCard;
