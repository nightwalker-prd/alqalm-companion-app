/**
 * Dashboard Search Bar
 * 
 * Unified search across lessons, vocabulary, grammar, and activities.
 */

import { useState, useCallback, useMemo, useRef, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllWords } from '../../lib/vocabularyAsync';
import { getAllLessonMeta } from '../../lib/contentStats';

interface SearchResult {
  type: 'lesson' | 'word' | 'activity' | 'grammar';
  id: string;
  title: string;
  titleArabic?: string;
  subtitle?: string;
  to: string;
  icon: string;
}

// Static activities for search
const ACTIVITIES: SearchResult[] = [
  { type: 'activity', id: 'daily', title: 'Daily Challenge', subtitle: 'Quick 10-question practice', to: '/daily', icon: '🎯' },
  { type: 'activity', id: 'review', title: 'Spaced Review', subtitle: 'Review due words', to: '/review', icon: '📚' },
  { type: 'activity', id: 'flashcards', title: 'Flashcards', subtitle: 'Word cards practice', to: '/practice/flashcards', icon: '🗂️' },
  { type: 'activity', id: 'fluency', title: 'Speed Round', subtitle: '60-second fluency challenge', to: '/practice/fluency', icon: '⚡' },
  { type: 'activity', id: 'recall', title: 'Free Recall', subtitle: 'Test memory without hints', to: '/practice/recall', icon: '🧠' },
  { type: 'activity', id: 'irab', title: "I'rab Practice", subtitle: 'Arabic case endings', to: '/practice/irab', icon: '📝' },
  { type: 'activity', id: 'wazn', title: 'Wazn Trainer', subtitle: 'Verb pattern recognition', to: '/practice/wazn', icon: '⚖️' },
  { type: 'activity', id: 'morph', title: 'Morphology', subtitle: 'Pattern analysis', to: '/practice/morph', icon: '🔍' },
  { type: 'activity', id: 'roots', title: 'Root Families', subtitle: 'Practice Arabic roots', to: '/roots', icon: '🌳' },
  { type: 'activity', id: 'sentences', title: 'Sentence Building', subtitle: 'Word order practice', to: '/practice/sentences', icon: '🏗️' },
  { type: 'activity', id: 'typing', title: 'Typing Drills', subtitle: 'Arabic keyboard practice', to: '/practice/typing', icon: '⌨️' },
  { type: 'activity', id: 'reading', title: 'Reading Library', subtitle: 'Browse reading passages', to: '/reading', icon: '📖' },
  { type: 'activity', id: 'narrow', title: 'Narrow Reading', subtitle: 'Read by topic', to: '/reading/topics', icon: '📚' },
  { type: 'activity', id: 'speed', title: 'Speed Reading', subtitle: 'Timed reading with WPM', to: '/reading/speed', icon: '⏱️' },
  { type: 'activity', id: 'grammar', title: 'Grammar Reference', subtitle: '339 grammar rules', to: '/grammar', icon: '📖' },
  { type: 'activity', id: 'vocabulary', title: 'Vocabulary Browser', subtitle: 'Explore all words', to: '/vocabulary', icon: '📋' },
  { type: 'activity', id: 'progress', title: 'Progress Stats', subtitle: 'Track your learning', to: '/progress', icon: '📊' },
  { type: 'activity', id: 'achievements', title: 'Achievements', subtitle: 'Badges and streaks', to: '/achievements', icon: '🏆' },
  { type: 'activity', id: 'settings', title: 'Settings', subtitle: 'App preferences', to: '/settings', icon: '⚙️' },
];

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    // Search activities
    ACTIVITIES.forEach(activity => {
      if (
        activity.title.toLowerCase().includes(q) ||
        activity.subtitle?.toLowerCase().includes(q)
      ) {
        matches.push(activity);
      }
    });

    // Search lessons (limit to avoid too many results)
    try {
      const lessons = getAllLessonMeta();
      lessons.slice(0, 100).forEach(lesson => {
        if (
          lesson.titleEnglish?.toLowerCase().includes(q) ||
          lesson.titleArabic?.includes(q) ||
          lesson.id.includes(q)
        ) {
          matches.push({
            type: 'lesson',
            id: lesson.id,
            title: lesson.titleEnglish || lesson.id,
            titleArabic: lesson.titleArabic,
            subtitle: `Book ${lesson.id.charAt(1)}, Lesson ${parseInt(lesson.id.slice(-2))}`,
            to: `/lesson/${lesson.id}`,
            icon: '📚',
          });
        }
      });
    } catch {
      // Manifest not loaded yet
    }

    // Search vocabulary (limit results)
    try {
      const words = getAllWords();
      let wordMatches = 0;
      words.forEach(word => {
        if (wordMatches >= 10) return;
        if (
          word.arabic.includes(q) ||
          word.english.toLowerCase().includes(q) ||
          word.root?.includes(q)
        ) {
          matches.push({
            type: 'word',
            id: word.id,
            title: word.english,
            titleArabic: word.arabic,
            subtitle: word.root ? `Root: ${word.root}` : word.partOfSpeech,
            to: `/vocabulary?word=${word.id}`,
            icon: '📝',
          });
          wordMatches++;
        }
      });
    } catch {
      // Vocabulary not loaded yet
    }

    return matches.slice(0, 15);
  }, [query]);

  // Handle selection
  // Use startTransition to keep current content visible while the new page loads
  // This prevents the flash of the Suspense loading fallback
  const handleSelect = useCallback((result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    startTransition(() => {
      navigate(result.to);
    });
  }, [navigate, startTransition]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [results, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative z-20 ${className}`}>
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search lessons, words, activities..."
          className="
            w-full py-3 pl-11 pr-4
            bg-[var(--color-sand-100)] dark:bg-[var(--color-sand-800)]
            border border-[var(--color-sand-300)] dark:border-[var(--color-sand-600)]
            rounded-xl
            text-[var(--color-ink)]
            placeholder:text-[var(--color-ink-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50
            transition-all
          "
        />
        <svg 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-ink-muted)]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--color-sand-200)] rounded-full transition-colors"
          >
            <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-50
          bg-white dark:bg-[var(--color-sand-900)]
          border border-[var(--color-sand-300)] dark:border-[var(--color-sand-600)]
          rounded-xl shadow-lg
          max-h-[60vh] overflow-y-auto
        ">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`
                w-full px-4 py-3 flex items-center gap-3 text-left
                transition-colors
                ${index === selectedIndex 
                  ? 'bg-[var(--color-primary)]/10' 
                  : 'hover:bg-[var(--color-sand-100)] dark:hover:bg-[var(--color-sand-800)]'
                }
                ${index > 0 ? 'border-t border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)]' : ''}
              `}
            >
              <span className="text-xl shrink-0">{result.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-ink)] truncate">
                  {result.title}
                  {result.titleArabic && (
                    <span className="arabic-sm mr-2 text-[var(--color-ink-muted)]" dir="rtl">
                      {' '}{result.titleArabic}
                    </span>
                  )}
                </p>
                {result.subtitle && (
                  <p className="text-sm text-[var(--color-ink-muted)] truncate">
                    {result.subtitle}
                  </p>
                )}
              </div>
              <span className="text-xs text-[var(--color-ink-muted)] uppercase shrink-0">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-50
          bg-white dark:bg-[var(--color-sand-900)]
          border border-[var(--color-sand-300)] dark:border-[var(--color-sand-600)]
          rounded-xl shadow-lg
          p-4 text-center text-[var(--color-ink-muted)]
        ">
          No results for "{query}"
        </div>
      )}
    </div>
  );
}

export default SearchBar;
