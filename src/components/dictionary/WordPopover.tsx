/**
 * WordPopover Component
 * 
 * Shows a popover with word definition when tapping an Arabic word.
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { WordData } from '../../lib/vocabularyAsync';

interface WordPopoverProps {
  word: string;
  wordData: WordData[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function WordPopover({ word, wordData, position, onClose }: WordPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Close on escape
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const padding = 16;

    // Adjust horizontal position
    if (rect.right > window.innerWidth - padding) {
      popoverRef.current.style.left = `${window.innerWidth - rect.width - padding}px`;
    }
    if (rect.left < padding) {
      popoverRef.current.style.left = `${padding}px`;
    }

    // Adjust vertical position (show above if too close to bottom)
    if (rect.bottom > window.innerHeight - padding) {
      popoverRef.current.style.top = `${position.y - rect.height - 10}px`;
    }
  }, [position]);

  const primaryWord = wordData[0];

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-[var(--color-sand-200)] dark:border-gray-700 p-4 min-w-[250px] max-w-[320px] animate-fade-in"
      style={{
        left: position.x,
        top: position.y + 10,
      }}
    >
      {/* Header with word */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-2xl font-arabic" dir="rtl">{word}</p>
          {primaryWord && (
            <p className="text-sm text-[var(--color-ink-muted)]">{primaryWord.partOfSpeech}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--color-sand-100)] rounded transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Definitions */}
      {wordData.length > 0 ? (
        <div className="space-y-3">
          {wordData.slice(0, 3).map((w, i) => (
            <div key={w.id} className={i > 0 ? 'pt-2 border-t border-[var(--color-sand-200)]' : ''}>
              <p className="text-[var(--color-ink)] font-medium">{w.english}</p>
              {w.root && (
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  Root: <span className="font-arabic">{w.root}</span>
                </p>
              )}
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                {w.lesson.replace('b', 'Book ').replace('-l', ' Lesson ')}
              </p>
            </div>
          ))}

          {wordData.length > 3 && (
            <p className="text-xs text-[var(--color-ink-muted)]">
              +{wordData.length - 3} more meanings
            </p>
          )}

          {/* Link to explore root */}
          {primaryWord?.root && (
            <Link
              to={`/roots/explore?root=${encodeURIComponent(primaryWord.root)}`}
              onClick={onClose}
              className="block mt-3 pt-3 border-t border-[var(--color-sand-200)] text-sm text-[var(--color-primary)] hover:underline"
            >
              Explore root family →
            </Link>
          )}
        </div>
      ) : (
        <p className="text-[var(--color-ink-muted)] text-sm">
          Not in vocabulary yet
        </p>
      )}
    </div>
  );
}
