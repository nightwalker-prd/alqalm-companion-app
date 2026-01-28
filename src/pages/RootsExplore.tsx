import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useRootFamilies } from '../hooks/useRootFamilies';
import type { RootFamily, SarfWord, WordCategory, Difficulty } from '../types/morphology';

/**
 * Category badge for word type
 */
function CategoryBadge({ category }: { category: WordCategory }) {
  const categoryLabels: Record<string, string> = {
    'verb': 'Verb',
    'masdar': 'Masdar',
    'active-participle': 'Doer',
    'passive-participle': 'Done',
    'noun': 'Noun',
    'adjective': 'Adjective',
  };

  const categoryColors: Record<string, string> = {
    'verb': 'bg-blue-100 text-blue-700 border-blue-200',
    'masdar': 'bg-purple-100 text-purple-700 border-purple-200',
    'active-participle': 'bg-green-100 text-green-700 border-green-200',
    'passive-participle': 'bg-orange-100 text-orange-700 border-orange-200',
    'noun': 'bg-amber-100 text-amber-700 border-amber-200',
    'adjective': 'bg-pink-100 text-pink-700 border-pink-200',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {categoryLabels[category] || category}
    </span>
  );
}

/**
 * Difficulty badge
 */
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const colors: Record<Difficulty, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}

/**
 * Word card in the family detail view
 */
function WordCard({ word }: { word: SarfWord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className="p-3 bg-white rounded-lg border border-[var(--color-sand-200)] hover:border-[var(--color-sand-300)] transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="arabic-lg text-[var(--color-ink)]" dir="rtl">
            {word.word}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            {word.meaning}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <CategoryBadge category={word.category} />
          {word.verbForm && (
            <span className="text-xs text-[var(--color-ink-muted)]">
              Form {word.verbForm}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--color-sand-100)] space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-[var(--color-ink-muted)]">Pattern:</span>
            <span className="font-arabic" dir="rtl">{word.pattern}</span>
            <span className="text-[var(--color-ink-muted)]">({word.patternTranslit})</span>
          </div>
          
          {word.transliteration && (
            <div className="flex gap-2">
              <span className="text-[var(--color-ink-muted)]">Pronunciation:</span>
              <span>{word.transliteration}</span>
            </div>
          )}

          {word.usage && (
            <div>
              <span className="text-[var(--color-ink-muted)]">Usage: </span>
              <span className="text-[var(--color-ink)]">{word.usage}</span>
            </div>
          )}

          {word.exampleSentence && (
            <div className="bg-[var(--color-sand-50)] p-2 rounded">
              <p className="arabic-base text-[var(--color-ink)]" dir="rtl">
                {word.exampleSentence}
              </p>
              {word.exampleTranslation && (
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  {word.exampleTranslation}
                </p>
              )}
            </div>
          )}

          {word.prepositions && word.prepositions.length > 0 && (
            <div>
              <span className="text-[var(--color-ink-muted)]">Common prepositions: </span>
              <span className="text-[var(--color-ink)]">{word.prepositions.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Root family detail view
 */
function FamilyDetail({ 
  family, 
  onClose,
  onPractice,
}: { 
  family: RootFamily; 
  onClose: () => void;
  onPractice: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | 'all'>('all');

  const filteredWords = useMemo(() => {
    if (categoryFilter === 'all') return family.words;
    return family.words.filter(w => w.category === categoryFilter);
  }, [family.words, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(family.words.map(w => w.category));
    return Array.from(cats) as WordCategory[];
  }, [family.words]);

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
          Root Family
        </h2>
      </div>

      {/* Root display */}
      <Card className="p-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4" dir="rtl">
          {family.rootLetters.map((letter, idx) => (
            <span
              key={idx}
              className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-primary)] text-white text-2xl font-arabic rounded-xl shadow-md"
            >
              {letter}
            </span>
          ))}
        </div>
        
        <p className="text-lg font-medium text-[var(--color-ink)]">
          {family.coreMeaning}
        </p>
        
        <div className="flex items-center justify-center gap-3 mt-3 text-sm text-[var(--color-ink-muted)]">
          <span>{family.words.length} words</span>
          <span>•</span>
          <span className="capitalize">{family.rootType?.replace(/-/g, ' ')}</span>
          {family.verbForms.length > 0 && (
            <>
              <span>•</span>
              <span>Forms: {family.verbForms.join(', ')}</span>
            </>
          )}
        </div>

        <Button onClick={onPractice} className="mt-4" size="sm">
          Practice This Root
        </Button>
      </Card>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-sand-100)] text-[var(--color-ink-muted)] hover:bg-[var(--color-sand-200)]'
          }`}
        >
          All ({family.words.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-sand-100)] text-[var(--color-ink-muted)] hover:bg-[var(--color-sand-200)]'
            }`}
          >
            {cat.replace('-', ' ')} ({family.categoryCounts[cat] || 0})
          </button>
        ))}
      </div>

      {/* Words list */}
      <div className="space-y-2">
        {filteredWords.map(word => (
          <WordCard key={word.id} word={word} />
        ))}
      </div>
    </div>
  );
}

/**
 * Root card for the browse grid
 */
function RootCard({ 
  family, 
  onClick 
}: { 
  family: RootFamily; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-white rounded-lg border border-[var(--color-sand-200)] hover:border-[var(--color-primary)] hover:shadow-md transition-all text-left w-full h-full flex flex-col"
    >
      <div className="flex items-center justify-center gap-2 font-arabic text-2xl mb-2" dir="rtl">
        {family.rootLetters.map((letter, idx) => (
          <span key={idx} className="text-[var(--color-primary)]">{letter}</span>
        ))}
      </div>
      <p className="text-sm text-center text-[var(--color-ink)] line-clamp-2 flex-1">
        {family.coreMeaning}
      </p>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-xs text-[var(--color-ink-muted)]">
          {family.words.length} words
        </span>
        <DifficultyBadge difficulty={family.minDifficulty} />
      </div>
    </button>
  );
}

export function RootsExplore() {
  const [searchParams] = useSearchParams();
  const [userSelectedFamily, setUserSelectedFamily] = useState<RootFamily | null>(null);
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<'words' | 'alphabetical'>('words');

  // Load root families asynchronously
  const { isLoaded, isLoading, error, getAllFamilies, getFamily } = useRootFamilies();

  // Get root param from URL
  const rootParam = searchParams.get('root');

  // Derive selected family from URL param or user selection
  const { selectedFamily, notFoundRoot } = useMemo(() => {
    // If user has manually selected, use their selection
    if (hasUserSelected) {
      return { selectedFamily: userSelectedFamily, notFoundRoot: null };
    }

    // If data isn't loaded yet or no URL param, no selection
    if (!isLoaded || !rootParam) {
      return { selectedFamily: null, notFoundRoot: null };
    }

    // Try to find family from URL param
    const normalizedRoot = rootParam.replace(/-/g, ' ');
    const family = getFamily(normalizedRoot);

    if (family) {
      return { selectedFamily: family, notFoundRoot: null };
    } else {
      return { selectedFamily: null, notFoundRoot: rootParam };
    }
  }, [isLoaded, rootParam, getFamily, userSelectedFamily, hasUserSelected]);

  // Wrapper to track user selections
  const setSelectedFamily = useCallback((family: RootFamily | null) => {
    setHasUserSelected(true);
    setUserSelectedFamily(family);
  }, []);

  // For loading state before data is ready
  const needsUrlProcessing = rootParam && !isLoaded;

  const allFamilies = useMemo(() =>
    isLoaded ? getAllFamilies() : [],
    [isLoaded, getAllFamilies]
  );

  // Filter and sort families
  const filteredFamilies = useMemo(() => {
    let result = allFamilies;

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      result = result.filter(f => f.minDifficulty === difficultyFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(f => 
        f.coreMeaning.toLowerCase().includes(query) ||
        f.root.includes(query) ||
        f.rootLetters.some(l => l.includes(query)) ||
        f.words.some(w => 
          w.meaning.toLowerCase().includes(query) ||
          w.word.includes(query)
        )
      );
    }

    // Sort
    if (sortBy === 'words') {
      result = [...result].sort((a, b) => b.words.length - a.words.length);
    } else {
      result = [...result].sort((a, b) => a.coreMeaning.localeCompare(b.coreMeaning));
    }

    return result;
  }, [allFamilies, difficultyFilter, searchQuery, sortBy]);

  const handleFamilySelect = useCallback((family: RootFamily) => {
    setSelectedFamily(family);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFamily(null);
  }, []);

  const handlePractice = useCallback(() => {
    // Navigate to practice with this family pre-selected
    // For now, just show an alert - could use URL params
    if (selectedFamily) {
      window.location.href = `/roots?family=${encodeURIComponent(selectedFamily.root)}`;
    }
  }, [selectedFamily]);

  // Loading state - also wait if we have a URL param that needs processing
  if (isLoading || needsUrlProcessing) {
    return (
      <>
        <Header showBackButton title="Explore Roots" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
            <p className="text-[var(--color-ink-muted)]">Loading root families...</p>
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
        <Header showBackButton title="Explore Roots" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <p className="text-[var(--color-error)]">Failed to load root families</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{error.message}</p>
            <Link to="/practice">
              <Button variant="secondary">Back to Practice</Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header showBackButton title="Explore Roots" />
      <PageContainer>
        {selectedFamily ? (
          <FamilyDetail 
            family={selectedFamily} 
            onClose={handleClose}
            onPractice={handlePractice}
          />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-display font-semibold text-[var(--color-ink)]">
                Arabic Root Families
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-2">
                Explore {allFamilies.length} root families and their derived words
              </p>
            </div>

            {/* Root not found notice */}
            {notFoundRoot && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  The root <span className="font-arabic font-medium" dir="rtl">{notFoundRoot}</span> is not yet in our root families collection.
                  Browse the available roots below or search for similar ones.
                </p>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by meaning, root, or word..."
                className="w-full px-4 py-3 pl-10 bg-white border border-[var(--color-sand-200)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-ink-muted)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty filter */}
              <div className="flex gap-1">
                {(['all', 'beginner', 'intermediate'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficultyFilter(level)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      difficultyFilter === level
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-sand-100)] text-[var(--color-ink-muted)] hover:bg-[var(--color-sand-200)]'
                    }`}
                  >
                    {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-[var(--color-ink-muted)]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'words' | 'alphabetical')}
                  className="text-sm bg-[var(--color-sand-100)] border-none rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="words">Most Words</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-[var(--color-ink-muted)]">
              Showing {filteredFamilies.length} of {allFamilies.length} roots
            </p>

            {/* Root family grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-fr">
              {filteredFamilies.map(family => (
                <RootCard 
                  key={family.root} 
                  family={family} 
                  onClick={() => handleFamilySelect(family)} 
                />
              ))}
            </div>

            {filteredFamilies.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--color-ink-muted)]">
                  No roots found matching your search.
                </p>
              </div>
            )}

            {/* Link to practice */}
            <div className="text-center pt-4">
              <Link
                to="/roots"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Go to Root Practice
              </Link>
            </div>
          </div>
        )}
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default RootsExplore;
