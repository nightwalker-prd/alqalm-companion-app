import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookSection, type LessonData } from './BookSection';

interface BookData {
  bookNumber: number;
  bookTitle: string;
  bookTitleArabic: string;
  lessons: LessonData[];
}

interface KnowledgeMapProps {
  books: BookData[];
  showAllBooks?: boolean;
  compact?: boolean;
}

export function KnowledgeMap({ books, showAllBooks = true, compact = false }: KnowledgeMapProps) {
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(() => {
    // In compact mode, only expand the book with active lessons
    if (compact) {
      for (const book of books) {
        const hasActive = book.lessons.some(l =>
          l.masteryLevel === 'learning' || l.masteryLevel === 'decaying'
        );
        const hasUnlocked = book.lessons.some(l => !l.isLocked && l.masteryLevel === 'new');
        if (hasActive || hasUnlocked) {
          return new Set([book.bookNumber]);
        }
      }
    }
    return new Set([1]); // Default to Book 1
  });

  // Track which books have "show all lessons" enabled (lifted from BookSection)
  const [showAllLessonsBooks, setShowAllLessonsBooks] = useState<Set<number>>(new Set());

  const toggleBook = (bookNumber: number) => {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookNumber)) {
        next.delete(bookNumber);
      } else {
        next.add(bookNumber);
      }
      return next;
    });
  };

  const toggleShowAllLessons = (bookNumber: number) => {
    setShowAllLessonsBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookNumber)) {
        next.delete(bookNumber);
      } else {
        next.add(bookNumber);
      }
      return next;
    });
  };

  // Calculate overall progress
  const totalLessons = books.reduce((sum, book) => sum + book.lessons.length, 0);
  const masteredLessons = books.reduce(
    (sum, book) => sum + book.lessons.filter(l => l.masteryLevel === 'mastered').length,
    0
  );
  const inProgressLessons = books.reduce(
    (sum, book) => sum + book.lessons.filter(l => l.masteryLevel === 'learning' || l.masteryLevel === 'decaying').length,
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((masteredLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Compact progress header */}
      <div className="bg-white dark:bg-[var(--color-sand-800)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)] border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Lesson Progress
          </h2>
          <Link 
            to="/books" 
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium"
          >
            View all →
          </Link>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 bg-[var(--color-sand-200)] dark:bg-[var(--color-sand-700)] rounded-full overflow-hidden flex">
            {masteredLessons > 0 && (
              <div
                className="h-full bg-[var(--color-success)] transition-all duration-500"
                style={{ width: `${(masteredLessons / totalLessons) * 100}%` }}
              />
            )}
            {inProgressLessons > 0 && (
              <div
                className="h-full bg-[var(--color-gold)] transition-all duration-500"
                style={{ width: `${(inProgressLessons / totalLessons) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-[var(--color-ink-muted)]">
            <span>
              <span className="font-medium text-[var(--color-success)]">{masteredLessons}</span> mastered
              {inProgressLessons > 0 && (
                <span> · <span className="font-medium text-[var(--color-gold)]">{inProgressLessons}</span> active</span>
              )}
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Book sections */}
      <div className="space-y-2">
        {books.map(book => (
          <BookSection
            key={book.bookNumber}
            bookNumber={book.bookNumber}
            bookTitle={book.bookTitle}
            bookTitleArabic={book.bookTitleArabic}
            lessons={book.lessons}
            isExpanded={expandedBooks.has(book.bookNumber)}
            onToggle={showAllBooks ? () => toggleBook(book.bookNumber) : undefined}
            compact={compact}
            showAllLessons={showAllLessonsBooks.has(book.bookNumber)}
            onShowAllLessonsToggle={() => toggleShowAllLessons(book.bookNumber)}
          />
        ))}
      </div>
    </div>
  );
}

export default KnowledgeMap;
