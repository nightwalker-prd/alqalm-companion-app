import { LessonNode, LessonNodeCompact, type MasteryLevel } from './LessonNode';

export interface LessonData {
  id: string;
  lessonNumber: number;
  titleArabic: string;
  titleEnglish: string;
  masteryLevel: MasteryLevel;
  masteryPercent: number;
  isLocked?: boolean;
}

interface BookSectionProps {
  bookNumber: number;
  bookTitle: string;
  bookTitleArabic: string;
  lessons: LessonData[];
  isExpanded?: boolean;
  onToggle?: () => void;
  compact?: boolean;
  showAllLessons?: boolean;
  onShowAllLessonsToggle?: () => void;
}

// How many lessons to show in compact mode
const COMPACT_LESSON_COUNT = 6;

export function BookSection({
  bookNumber,
  bookTitle,
  bookTitleArabic,
  lessons,
  isExpanded = true,
  onToggle,
  compact = false,
  showAllLessons = false,
  onShowAllLessonsToggle,
}: BookSectionProps) {
  
  // Calculate overall book progress
  const completedLessons = lessons.filter(l => l.masteryLevel === 'mastered').length;
  const inProgressLessons = lessons.filter(l => l.masteryLevel === 'learning' || l.masteryLevel === 'decaying').length;

  // Get priority lessons for compact view:
  // 1. In progress lessons (learning/decaying)
  // 2. First unlocked "new" lesson (next up)
  // 3. Fill remaining with recent mastered or upcoming new
  const getPriorityLessons = () => {
    const inProgress = lessons.filter(l => l.masteryLevel === 'learning' || l.masteryLevel === 'decaying');
    const newUnlocked = lessons.filter(l => l.masteryLevel === 'new' && !l.isLocked);
    const mastered = lessons.filter(l => l.masteryLevel === 'mastered');
    
    const priority: LessonData[] = [];
    
    // Add in-progress first
    priority.push(...inProgress.slice(0, 3));
    
    // Add next unlocked lesson
    if (newUnlocked.length > 0 && priority.length < COMPACT_LESSON_COUNT) {
      priority.push(newUnlocked[0]);
    }
    
    // Fill with recent mastered (for review access)
    const remaining = COMPACT_LESSON_COUNT - priority.length;
    if (remaining > 0) {
      const recent = mastered.slice(-remaining);
      priority.push(...recent);
    }
    
    // Sort by lesson number for display
    return priority.sort((a, b) => a.lessonNumber - b.lessonNumber);
  };

  const displayLessons = compact && !showAllLessons 
    ? getPriorityLessons() 
    : lessons;
  
  const hasMoreLessons = compact && lessons.length > COMPACT_LESSON_COUNT;

  return (
    <div className="mb-6">
      {/* Book header */}
      <button
        onClick={onToggle}
        className={`
          w-full
          flex items-center justify-between
          p-4
          bg-gradient-to-r from-[var(--color-sand-100)] to-[var(--color-sand-50)]
          dark:from-[var(--color-sand-800)] dark:to-[var(--color-sand-900)]
          rounded-[var(--radius-lg)]
          border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]
          shadow-[var(--shadow-sm)]
          transition-all duration-200
          hover:shadow-[var(--shadow-md)]
          ${onToggle ? 'cursor-pointer' : 'cursor-default'}
        `}
      >
        <div className="flex items-center gap-4">
          {/* Book number emblem */}
          <div
            className={`
              w-12 h-12
              rounded-full
              bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]
              flex items-center justify-center
              shadow-[var(--shadow-md)]
            `}
          >
            <span className="text-white font-display text-xl font-bold">{bookNumber}</span>
          </div>

          <div className="text-left">
            <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
              {bookTitle}
            </h2>
            <p className="arabic-sm text-[var(--color-ink-muted)]" dir="rtl">
              {bookTitleArabic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress stats - simplified */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--color-success)]">{completedLessons}</span>
              <span className="text-[var(--color-ink-muted)] text-xs">/{lessons.length}</span>
            </div>
            {inProgressLessons > 0 && (
              <div className="px-2 py-0.5 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold-dark)] text-xs font-medium">
                {inProgressLessons} active
              </div>
            )}
          </div>

          {/* Expand/collapse icon */}
          {onToggle && (
            <svg
              className={`w-5 h-5 text-[var(--color-ink-muted)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {/* Lessons grid */}
      {isExpanded && (
        <div className="mt-4 animate-slide-up">
          {compact && !showAllLessons ? (
            /* Compact horizontal scroll or small grid */
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden">
              {displayLessons.map((lesson) => (
                <LessonNodeCompact
                  key={lesson.id}
                  lessonId={lesson.id}
                  lessonNumber={lesson.lessonNumber}
                  titleArabic={lesson.titleArabic}
                  titleEnglish={lesson.titleEnglish}
                  masteryLevel={lesson.masteryLevel}
                  masteryPercent={lesson.masteryPercent}
                  isLocked={lesson.isLocked}
                />
              ))}
            </div>
          ) : (
            /* Full grid view */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayLessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <LessonNode
                    lessonId={lesson.id}
                    lessonNumber={lesson.lessonNumber}
                    titleArabic={lesson.titleArabic}
                    titleEnglish={lesson.titleEnglish}
                    masteryLevel={lesson.masteryLevel}
                    masteryPercent={lesson.masteryPercent}
                    isLocked={lesson.isLocked}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Show all / Show less toggle */}
          {hasMoreLessons && onShowAllLessonsToggle && (
            <button
              onClick={onShowAllLessonsToggle}
              className="mt-3 w-full py-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium transition-colors flex items-center justify-center gap-1"
            >
              {showAllLessons ? (
                <>
                  Show less
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  View all {lessons.length} lessons
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BookSection;
