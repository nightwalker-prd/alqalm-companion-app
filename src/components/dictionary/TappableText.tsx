/**
 * TappableText Component
 * 
 * Wraps Arabic text and makes individual words tappable for dictionary lookup.
 */

import { useState, useCallback } from 'react';
import { WordPopover } from './WordPopover';
import { segmentText } from '../../lib/dictionaryService';
import type { WordData } from '../../lib/vocabularyAsync';

interface TappableTextProps {
  children: string;
  className?: string;
  dir?: 'rtl' | 'ltr';
}

interface PopoverState {
  word: string;
  wordData: WordData[];
  position: { x: number; y: number };
}

export function TappableText({ children, className = '', dir = 'rtl' }: TappableTextProps) {
  const [popover, setPopover] = useState<PopoverState | null>(null);

  const handleWordClick = useCallback((
    event: React.MouseEvent,
    word: string,
    wordData?: WordData[]
  ) => {
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    setPopover({
      word,
      wordData: wordData || [],
      position: {
        x: rect.left + rect.width / 2 - 125, // Center the 250px popover
        y: rect.bottom,
      },
    });
  }, []);

  const handleClose = useCallback(() => {
    setPopover(null);
  }, []);

  // Segment the text into tappable and non-tappable parts
  const segments = segmentText(children);

  return (
    <>
      <span className={className} dir={dir}>
        {segments.map((segment, i) => {
          if (segment.type === 'arabic') {
            const hasDefinition = segment.wordData && segment.wordData.length > 0;
            return (
              <span
                key={i}
                onClick={(e) => handleWordClick(e, segment.text, segment.wordData)}
                className={`
                  cursor-pointer transition-colors rounded px-0.5 -mx-0.5
                  ${hasDefinition 
                    ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 active:bg-amber-200 dark:active:bg-amber-800/50' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                title={hasDefinition ? 'Tap for definition' : 'Not in vocabulary'}
              >
                {segment.text}
              </span>
            );
          }
          return <span key={i}>{segment.text}</span>;
        })}
      </span>

      {popover && (
        <WordPopover
          word={popover.word}
          wordData={popover.wordData}
          position={popover.position}
          onClose={handleClose}
        />
      )}
    </>
  );
}

/**
 * Simple wrapper for a single word (when you already know the word data)
 */
interface TappableWordProps {
  word: string;
  wordData?: WordData[];
  className?: string;
}

export function TappableWord({ word, wordData, className = '' }: TappableWordProps) {
  const [popover, setPopover] = useState<PopoverState | null>(null);

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    setPopover({
      word,
      wordData: wordData || [],
      position: {
        x: rect.left + rect.width / 2 - 125,
        y: rect.bottom,
      },
    });
  }, [word, wordData]);

  const handleClose = useCallback(() => {
    setPopover(null);
  }, []);

  const hasDefinition = wordData && wordData.length > 0;

  return (
    <>
      <span
        onClick={handleClick}
        className={`
          cursor-pointer transition-colors rounded px-0.5 -mx-0.5
          ${hasDefinition 
            ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 active:bg-amber-200' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${className}
        `}
        title={hasDefinition ? 'Tap for definition' : 'Not in vocabulary'}
      >
        {word}
      </span>

      {popover && (
        <WordPopover
          word={popover.word}
          wordData={popover.wordData}
          position={popover.position}
          onClose={handleClose}
        />
      )}
    </>
  );
}
