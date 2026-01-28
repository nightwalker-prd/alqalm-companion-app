/**
 * Typing Drills Service
 * 
 * Manages typing practice for Arabic keyboard input.
 */

import { getAllWords } from './vocabularyAsync';
import { getAllExamples } from '../content/sarf/patterns';

// Storage key
const TYPING_STATS_KEY = 'madina_typing_stats';

// Arabic letters with their names
export const ARABIC_LETTERS = [
  { letter: 'ا', name: 'alif', transliteration: 'ā' },
  { letter: 'ب', name: 'bā', transliteration: 'b' },
  { letter: 'ت', name: 'tā', transliteration: 't' },
  { letter: 'ث', name: 'thā', transliteration: 'th' },
  { letter: 'ج', name: 'jīm', transliteration: 'j' },
  { letter: 'ح', name: 'ḥā', transliteration: 'ḥ' },
  { letter: 'خ', name: 'khā', transliteration: 'kh' },
  { letter: 'د', name: 'dāl', transliteration: 'd' },
  { letter: 'ذ', name: 'dhāl', transliteration: 'dh' },
  { letter: 'ر', name: 'rā', transliteration: 'r' },
  { letter: 'ز', name: 'zāy', transliteration: 'z' },
  { letter: 'س', name: 'sīn', transliteration: 's' },
  { letter: 'ش', name: 'shīn', transliteration: 'sh' },
  { letter: 'ص', name: 'ṣād', transliteration: 'ṣ' },
  { letter: 'ض', name: 'ḍād', transliteration: 'ḍ' },
  { letter: 'ط', name: 'ṭā', transliteration: 'ṭ' },
  { letter: 'ظ', name: 'ẓā', transliteration: 'ẓ' },
  { letter: 'ع', name: 'ʿayn', transliteration: 'ʿ' },
  { letter: 'غ', name: 'ghayn', transliteration: 'gh' },
  { letter: 'ف', name: 'fā', transliteration: 'f' },
  { letter: 'ق', name: 'qāf', transliteration: 'q' },
  { letter: 'ك', name: 'kāf', transliteration: 'k' },
  { letter: 'ل', name: 'lām', transliteration: 'l' },
  { letter: 'م', name: 'mīm', transliteration: 'm' },
  { letter: 'ن', name: 'nūn', transliteration: 'n' },
  { letter: 'ه', name: 'hā', transliteration: 'h' },
  { letter: 'و', name: 'wāw', transliteration: 'w' },
  { letter: 'ي', name: 'yā', transliteration: 'y' },
];

// Additional forms
export const SPECIAL_LETTERS = [
  { letter: 'ء', name: 'hamza', transliteration: "'" },
  { letter: 'ة', name: 'tā marbūṭa', transliteration: 'a/at' },
  { letter: 'ى', name: 'alif maqṣūra', transliteration: 'ā' },
  { letter: 'أ', name: 'alif with hamza above', transliteration: 'a' },
  { letter: 'إ', name: 'alif with hamza below', transliteration: 'i' },
  { letter: 'آ', name: 'alif madda', transliteration: 'ā' },
  { letter: 'ؤ', name: 'wāw with hamza', transliteration: "'" },
  { letter: 'ئ', name: 'yā with hamza', transliteration: "'" },
];

export type TypingMode = 'letters' | 'words' | 'verbs';

export interface TypingStats {
  totalAttempts: number;
  totalCorrect: number;
  totalCharacters: number;
  totalTimeMs: number;
  sessionsCompleted: number;
  bestWpm: number;
  letterAccuracy: Record<string, { correct: number; total: number }>;
}

export interface TypingItem {
  arabic: string;
  hint?: string; // English meaning or letter name
  type: 'letter' | 'word' | 'verb';
}

// Normalize for comparison (remove tashkeel for lenient mode)
export function normalizeForComparison(text: string, strict: boolean = false): string {
  if (strict) return text;
  
  return text
    // Remove tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alef variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize taa marbuta
    .replace(/ة/g, 'ه')
    // Normalize yaa
    .replace(/ى/g, 'ي')
    .trim();
}

// Check if input matches target
export function checkTyping(input: string, target: string, strict: boolean = false): boolean {
  return normalizeForComparison(input, strict) === normalizeForComparison(target, strict);
}

// Generate typing items for a session
export function generateTypingSession(mode: TypingMode, count: number = 10): TypingItem[] {
  const items: TypingItem[] = [];
  
  switch (mode) {
    case 'letters': {
      // Shuffle and pick letters
      const allLetters = [...ARABIC_LETTERS, ...SPECIAL_LETTERS];
      const shuffled = allLetters.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        items.push({
          arabic: shuffled[i].letter,
          hint: shuffled[i].name,
          type: 'letter',
        });
      }
      break;
    }
    
    case 'words': {
      const words = getAllWords();
      const shuffled = words.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        items.push({
          arabic: shuffled[i].arabic,
          hint: shuffled[i].english,
          type: 'word',
        });
      }
      break;
    }
    
    case 'verbs': {
      const verbs = getAllExamples();
      const shuffled = verbs.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        items.push({
          arabic: shuffled[i].verb,
          hint: shuffled[i].meaning,
          type: 'verb',
        });
      }
      break;
    }
  }
  
  return items;
}

// Load stats
export function loadTypingStats(): TypingStats {
  try {
    const stored = localStorage.getItem(TYPING_STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }
  return {
    totalAttempts: 0,
    totalCorrect: 0,
    totalCharacters: 0,
    totalTimeMs: 0,
    sessionsCompleted: 0,
    bestWpm: 0,
    letterAccuracy: {},
  };
}

// Save stats
export function saveTypingStats(stats: TypingStats): void {
  localStorage.setItem(TYPING_STATS_KEY, JSON.stringify(stats));
}

// Calculate WPM (words per minute, where a "word" is 5 characters)
export function calculateWpm(characters: number, timeMs: number): number {
  if (timeMs === 0) return 0;
  const minutes = timeMs / 60000;
  const words = characters / 5;
  return Math.round(words / minutes);
}
