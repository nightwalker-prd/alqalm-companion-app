import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useVocabulary } from '../hooks/useVocabulary';
import { useUserSettings } from '../contexts/UserSettingsContext';
import type { WordData } from '../lib/vocabularyAsync';

/**
 * Get book number from lesson ID
 */
function getBookFromLesson(lessonId: string): number | null {
  if (lessonId.startsWith('b1-l')) return 1;
  if (lessonId.startsWith('b2-l')) return 2;
  if (lessonId.startsWith('b3-l')) return 3;
  return null; // nahw/sarf - always available
}

/**
 * Format lesson ID for display
 * b1-l01 -> B1.L01, nahw-01 -> Nahw 01, etc.
 */
function formatLesson(lessonId: string): string {
  if (lessonId.startsWith('b1-l')) return `B1.L${lessonId.slice(4)}`;
  if (lessonId.startsWith('b2-l')) return `B2.L${lessonId.slice(4)}`;
  if (lessonId.startsWith('b3-l')) return `B3.L${lessonId.slice(4)}`;
  if (lessonId.startsWith('nahw-')) return `Nahw ${lessonId.slice(5)}`;
  if (lessonId.startsWith('sarf-')) return `Sarf ${lessonId.slice(5)}`;
  return lessonId;
}

/**
 * Part of speech badge with color coding
 */
function PartOfSpeechBadge({ pos }: { pos: string }) {
  const colors: Record<string, string> = {
    noun: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    verb: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'verb-past': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'verb-present': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'verb-imperative': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    adjective: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    particle: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    demonstrative: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    pronoun: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
    preposition: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    adverb: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  };

  const colorClass = colors[pos] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  const label = pos.replace('-', ' ');

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${colorClass}`}>
      {label}
    </span>
  );
}

/**
 * Word card for the browse grid
 */
function WordCard({
  word,
  onClick,
}: {
  word: WordData;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group p-4 bg-[var(--color-sand-50)] dark:bg-[var(--color-sand-800)] rounded-xl border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all text-left w-full h-full flex flex-col"
    >
      <p className="arabic-xl text-[var(--color-ink)] mb-2 group-hover:text-[var(--color-primary)] transition-colors" dir="rtl">
        {word.arabic}
      </p>
      <p className="text-sm text-[var(--color-ink-muted)] line-clamp-2 flex-1">
        {word.english}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]">
        <PartOfSpeechBadge pos={word.partOfSpeech} />
        <span className="text-xs text-[var(--color-ink-muted)]">
          {formatLesson(word.lesson)}
        </span>
      </div>
    </button>
  );
}

/**
 * Word detail view when a word is selected
 */
function WordDetail({
  word,
  relatedWords,
  onClose,
}: {
  word: WordData;
  relatedWords: WordData[];
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[var(--color-sand-100)] hover:bg-[var(--color-sand-200)] flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--color-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-display font-semibold text-[var(--color-ink)]">
          Word Details
        </h2>
      </div>

      {/* Main word display */}
      <Card className="p-6 text-center">
        <p className="arabic-2xl text-[var(--color-ink)] mb-4" dir="rtl">
          {word.arabic}
        </p>
        <p className="text-lg text-[var(--color-ink)] mb-4">
          {word.english}
        </p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <PartOfSpeechBadge pos={word.partOfSpeech} />
          <span className="text-sm text-[var(--color-ink-muted)]">
            {formatLesson(word.lesson)}
          </span>
        </div>

        {word.root && (
          <div className="text-sm text-[var(--color-ink-muted)] mb-4">
            Root: <span className="font-arabic" dir="rtl">{word.root}</span>
          </div>
        )}

        <Button
          onClick={() => navigate(`/practice/flashcards?word=${word.id}`)}
          className="mt-2"
        >
          Practice This Word
        </Button>
      </Card>

      {/* Root family link */}
      {word.root && (
        <Card
          className="p-4 cursor-pointer hover:bg-[var(--color-sand-50)] transition-colors"
          onClick={() => navigate(`/roots/explore?root=${encodeURIComponent(word.root!)}`)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-ink)]">Explore Root Family</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                See all words from <span className="font-arabic" dir="rtl">{word.root}</span>
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      )}

      {/* Related words (same root) */}
      {relatedWords.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-[var(--color-ink)]">
            Related Words ({relatedWords.length})
          </h3>
          <div className="space-y-2">
            {relatedWords.slice(0, 5).map((related) => (
              <div
                key={related.id}
                className="p-3 bg-[var(--color-sand-50)] dark:bg-[var(--color-sand-800)] rounded-lg border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="arabic-lg text-[var(--color-ink)]" dir="rtl">
                      {related.arabic}
                    </p>
                    <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                      {related.english}
                    </p>
                  </div>
                  <PartOfSpeechBadge pos={related.partOfSpeech} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type BookFilter = 'all' | 'b1' | 'b2' | 'b3' | 'nahw' | 'sarf';
type SortOption = 'lesson' | 'arabic' | 'english';

const MAX_DISPLAYED = 100;

export function Vocabulary() {
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookFilter, setBookFilter] = useState<BookFilter>('all');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('lesson');

  const { settings } = useUserSettings();
  const { isLoaded, isLoading, error, getAllWords, getWordsForRoot } = useVocabulary();

  const allWords = useMemo(() => (isLoaded ? getAllWords() : []), [isLoaded, getAllWords]);

  // Get unique parts of speech for filter dropdown
  const uniquePOS = useMemo(() => {
    const posSet = new Set(allWords.map((w) => w.partOfSpeech));
    return Array.from(posSet).sort();
  }, [allWords]);

  // Filter and sort words
  const filteredWords = useMemo(() => {
    let result = allWords;

    // Gate by book unlock status
    if (settings) {
      result = result.filter((w) => {
        const book = getBookFromLesson(w.lesson);
        if (book === null) return true; // nahw/sarf always available
        if (book === 1) return true; // Book 1 always available
        return settings.isBookUnlocked(book);
      });
    }

    // Book filter by lesson prefix
    if (bookFilter !== 'all') {
      const prefix = bookFilter === 'nahw' || bookFilter === 'sarf' ? `${bookFilter}-` : `${bookFilter}-l`;
      result = result.filter((w) => w.lesson.startsWith(prefix));
    }

    // Part of speech filter
    if (posFilter !== 'all') {
      result = result.filter((w) => w.partOfSpeech === posFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (w) => w.arabic.includes(query) || w.english.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'lesson') {
      result = [...result].sort((a, b) => a.lesson.localeCompare(b.lesson));
    } else if (sortBy === 'arabic') {
      result = [...result].sort((a, b) => a.arabic.localeCompare(b.arabic, 'ar'));
    } else {
      result = [...result].sort((a, b) => a.english.localeCompare(b.english));
    }

    return result;
  }, [allWords, settings, bookFilter, posFilter, searchQuery, sortBy]);

  // Get related words for selected word
  const relatedWords = useMemo(() => {
    if (!selectedWord?.root) return [];
    return getWordsForRoot(selectedWord.root).filter((w) => w.id !== selectedWord.id);
  }, [selectedWord, getWordsForRoot]);

  const handleWordSelect = useCallback((word: WordData) => {
    setSelectedWord(word);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedWord(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header showBackButton title="Vocabulary" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
            <p className="text-[var(--color-ink-muted)]">Loading vocabulary...</p>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header showBackButton title="Vocabulary" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <p className="text-[var(--color-error)]">Failed to load vocabulary</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{error.message}</p>
            <Link to="/">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header showBackButton title="Vocabulary" />
      <PageContainer>
        {selectedWord ? (
          <WordDetail word={selectedWord} relatedWords={relatedWords} onClose={handleClose} />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-display font-semibold text-[var(--color-ink)]">
                Arabic Vocabulary
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2">
                Browse {allWords.length.toLocaleString()} words from Madinah Arabic
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Arabic or English..."
                className="w-full px-4 py-3 pl-10 bg-[var(--color-sand-50)] dark:bg-[var(--color-sand-800)] border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] rounded-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-ink-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Book filter pills */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'b1', 'b2', 'b3', 'nahw', 'sarf'] as const).map((book) => {
                const labels: Record<BookFilter, string> = {
                  all: 'All',
                  b1: 'Book 1',
                  b2: 'Book 2',
                  b3: 'Book 3',
                  nahw: 'Nahw',
                  sarf: 'Sarf',
                };
                // Check if this book filter is locked
                const bookNumber = book === 'b2' ? 2 : book === 'b3' ? 3 : null;
                const isLocked = bookNumber !== null && settings && !settings.isBookUnlocked(bookNumber);

                return (
                  <button
                    key={book}
                    onClick={() => !isLocked && setBookFilter(book)}
                    disabled={!!isLocked}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isLocked
                        ? 'bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-700)] text-[var(--color-ink-muted)] opacity-50 cursor-not-allowed'
                        : bookFilter === book
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-700)] text-[var(--color-ink-muted)] hover:bg-[var(--color-sand-200)] dark:hover:bg-[var(--color-sand-600)]'
                    }`}
                  >
                    {isLocked && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    {labels[book]}
                  </button>
                );
              })}
            </div>

            {/* POS filter and sort */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Part of speech dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-ink-muted)]">Type:</span>
                <select
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                  className="text-sm bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)] border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] text-[var(--color-ink)] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="all">All</option>
                  {uniquePOS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-[var(--color-ink-muted)]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)] border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] text-[var(--color-ink)] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="lesson">Lesson Order</option>
                  <option value="arabic">Arabic (أ→ي)</option>
                  <option value="english">English (A→Z)</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-[var(--color-ink-muted)]">
              Showing {Math.min(filteredWords.length, MAX_DISPLAYED).toLocaleString()} of{' '}
              {filteredWords.length.toLocaleString()} words
              {filteredWords.length > MAX_DISPLAYED && (
                <span className="text-[var(--color-ink-muted)]"> — use filters to narrow down</span>
              )}
            </p>

            {/* Word grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-fr">
              {filteredWords.slice(0, MAX_DISPLAYED).map((word) => (
                <WordCard key={word.id} word={word} onClick={() => handleWordSelect(word)} />
              ))}
            </div>

            {filteredWords.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--color-ink-muted)]">No words found matching your search.</p>
              </div>
            )}

            {/* Link to practice */}
            <div className="text-center pt-4">
              <Link to="/practice" className="text-sm text-[var(--color-primary)] hover:underline">
                Go to Practice
              </Link>
            </div>
          </div>
        )}
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default Vocabulary;
