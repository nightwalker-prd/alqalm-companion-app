/**
 * Grammar Reference Page
 * 
 * Searchable index of all 339 grammar points across all 3 books.
 */

import { useState, useMemo, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card } from '../components/ui/Card';

// Import grammar data directly
import book1Grammar from '../content/book1/grammar.json';
import book2Grammar from '../content/book2/grammar.json';
import book3Grammar from '../content/book3/grammar.json';

interface GrammarPoint {
  id: string;
  title: string;
  titleEn: string;
  explanation: string;
  examples: Array<{ arabic: string; english: string }>;
  lesson: string;
  book?: number;
}

// Combine all grammar with book numbers
const allGrammar: GrammarPoint[] = [
  ...book1Grammar.map(g => ({ ...g, book: 1 })),
  ...book2Grammar.map(g => ({ ...g, book: 2 })),
  ...book3Grammar.map(g => ({ ...g, book: 3 })),
];

// Recently viewed storage
const RECENT_KEY = 'madina_grammar_recent';
const MAX_RECENT = 5;

function loadRecentIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentId(id: string): void {
  const recent = loadRecentIds().filter(r => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function GrammarReference() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>(loadRecentIds);

  // Track when a grammar point is expanded
  const handleExpand = useCallback((id: string | null) => {
    setExpandedId(id);
    if (id) {
      saveRecentId(id);
      setRecentIds(loadRecentIds());
    }
  }, []);

  // Get recent grammar points
  const recentGrammar = useMemo(() => {
    return recentIds
      .map(id => allGrammar.find(g => g.id === id))
      .filter((g): g is GrammarPoint => g !== undefined);
  }, [recentIds]);

  // Filter grammar points
  const filteredGrammar = useMemo(() => {
    let result = allGrammar;
    
    // Filter by book
    if (selectedBook !== null) {
      result = result.filter(g => g.book === selectedBook);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(g => 
        g.title.toLowerCase().includes(query) ||
        g.titleEn.toLowerCase().includes(query) ||
        g.explanation.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [searchQuery, selectedBook]);

  // Stats
  const stats = useMemo(() => ({
    total: allGrammar.length,
    book1: allGrammar.filter(g => g.book === 1).length,
    book2: allGrammar.filter(g => g.book === 2).length,
    book3: allGrammar.filter(g => g.book === 3).length,
  }), []);

  return (
    <>
      <Header title="Grammar Reference" titleArabic="مَرْجِع النَّحْو" showBackButton />
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Grammar Reference', labelArabic: 'النحو' }
          ]}
          className="mb-4"
        />

        <div className="space-y-4">
          {/* Search */}
          <div className="sticky top-0 z-10 bg-[var(--color-bg)] pb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grammar rules..."
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-sand-200)] bg-white dark:bg-[var(--color-sand-50)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              dir="auto"
            />
          </div>

          {/* Book filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedBook(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedBook === null
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setSelectedBook(1)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedBook === 1
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
              }`}
            >
              Book 1 ({stats.book1})
            </button>
            <button
              onClick={() => setSelectedBook(2)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedBook === 2
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
              }`}
            >
              Book 2 ({stats.book2})
            </button>
            <button
              onClick={() => setSelectedBook(3)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedBook === 3
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
              }`}
            >
              Book 3 ({stats.book3})
            </button>
          </div>

          {/* Results count */}
          <p className="text-sm text-[var(--color-ink-muted)]">
            {filteredGrammar.length} grammar point{filteredGrammar.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>

          {/* Recently viewed */}
          {!searchQuery && selectedBook === null && recentGrammar.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] mb-2">
                Recently Viewed
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentGrammar.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleExpand(expandedId === g.id ? null : g.id)}
                    className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                      expandedId === g.id
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    <span className="font-arabic">{g.title.split(':')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grammar list */}
          <div className="space-y-3">
            {filteredGrammar.map(grammar => {
              const isExpanded = expandedId === grammar.id;
              
              return (
                <Card
                  key={grammar.id}
                  className="overflow-hidden"
                >
                  <button
                    onClick={() => handleExpand(isExpanded ? null : grammar.id)}
                    className="w-full p-4 text-right"
                    dir="rtl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-arabic text-lg font-semibold text-[var(--color-ink)]">
                          {grammar.title}
                        </div>
                        <div className="text-sm text-[var(--color-ink-muted)] text-left" dir="ltr">
                          {grammar.titleEn}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-[var(--color-sand-100)] text-[var(--color-ink-muted)]">
                          B{grammar.book}
                        </span>
                        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[var(--color-sand-200)]">
                      {/* Explanation */}
                      <div className="mt-4 mb-4">
                        <h3 className="text-sm font-semibold text-[var(--color-ink-muted)] mb-2">
                          Explanation
                        </h3>
                        <p className="text-[var(--color-ink)] leading-relaxed">
                          {grammar.explanation}
                        </p>
                      </div>
                      
                      {/* Examples */}
                      {grammar.examples && grammar.examples.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--color-ink-muted)] mb-2">
                            Examples
                          </h3>
                          <div className="space-y-2">
                            {grammar.examples.map((ex, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-[var(--color-sand-50)]"
                              >
                                <div
                                  className="font-arabic text-lg text-[var(--color-ink)] mb-1"
                                  dir="rtl"
                                >
                                  {ex.arabic}
                                </div>
                                <div className="text-sm text-[var(--color-ink-muted)]">
                                  {ex.english}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Lesson reference */}
                      <div className="mt-4 pt-3 border-t border-[var(--color-sand-100)]">
                        <span className="text-xs text-[var(--color-ink-muted)]">
                          From: {grammar.lesson}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredGrammar.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-[var(--color-ink-muted)]">
                No grammar points found for "{searchQuery}"
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBook(null);
                }}
                className="mt-2 text-[var(--color-primary)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default GrammarReference;
