/**
 * Retry hint utilities for immediate error retry feature.
 * 
 * Based on "Make It Stick" research - productive struggle with scaffolded hints
 * improves long-term retention. Users must retry incorrect answers (up to 5 times)
 * with progressively more helpful hints.
 * 
 * Key principles:
 * - Errors are learning opportunities, not failures
 * - Retrieval practice (even failed) strengthens memory
 * - Graduated hints prevent learned helplessness while maintaining challenge
 */

// Arabic diacritical marks (tashkeel) - these don't count as "characters" for hints
const TASHKEEL_PATTERN = /[\u064B-\u065F\u0670]/g;

export interface RetryHint {
  /** Hint level 0-4 (0 = no hint, 4 = full answer revealed) */
  level: number;
  /** Learning-focused encouraging message */
  message: string;
  /** The actual hint text (partially revealed answer), null if no hint yet */
  hintText: string | null;
  /** True when max attempts reached and full answer is shown */
  showFullAnswer: boolean;
}

/** Maximum number of retry attempts before showing the answer */
export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Learning-focused messages for each retry attempt.
 * Based on growth mindset and desirable difficulties research.
 */
const RETRY_MESSAGES: string[] = [
  "Errors are part of learning! Each attempt strengthens your memory.",
  "You're building neural pathways. Try again!",
  "Retrieval practice works best when it's challenging. Keep going!",
  "Almost there! Struggling now means remembering later.",
  "Here's the answer. Study it carefully for next time.",
];

/**
 * Generate a retry hint based on the attempt number.
 * 
 * Hint progression:
 * - Attempt 1: No hint, just encouragement
 * - Attempt 2: First character revealed
 * - Attempt 3: ~40% of answer revealed
 * - Attempt 4: ~60% of answer revealed  
 * - Attempt 5: Full answer shown
 * 
 * @param answer - The correct answer to generate hints for
 * @param attemptNumber - Current attempt number (1-5)
 * @param isArabic - Whether the answer is in Arabic (affects character handling)
 * @returns RetryHint object with message and hint text
 */
export function getRetryHint(
  answer: string,
  attemptNumber: number,
  isArabic: boolean
): RetryHint {
  // Clamp attempt number to valid range
  const attempt = Math.max(1, Math.min(attemptNumber, MAX_RETRY_ATTEMPTS));
  const level = attempt - 1; // 0-indexed level
  
  // Get the appropriate message
  const message = RETRY_MESSAGES[level] || RETRY_MESSAGES[RETRY_MESSAGES.length - 1];
  
  // Determine hint text based on attempt
  let hintText: string | null = null;
  let showFullAnswer = false;
  
  switch (attempt) {
    case 1:
      // No hint on first attempt
      hintText = null;
      break;
      
    case 2:
      // First character only
      hintText = getProgressiveReveal(answer, 0.15, isArabic);
      break;
      
    case 3:
      // ~40% revealed
      hintText = getProgressiveReveal(answer, 0.4, isArabic);
      break;
      
    case 4:
      // ~60% revealed
      hintText = getProgressiveReveal(answer, 0.6, isArabic);
      break;
      
    case 5:
    default:
      // Full answer
      hintText = answer;
      showFullAnswer = true;
      break;
  }
  
  return {
    level: attempt,
    message,
    hintText,
    showFullAnswer,
  };
}

/**
 * Reveal a percentage of the answer, replacing unrevealed characters with dots.
 * 
 * For Arabic: Skips tashkeel when counting characters, but preserves them in output.
 * For English: Handles multi-word answers, preserving spaces.
 * 
 * @param answer - The full answer text
 * @param percentage - How much to reveal (0.0 - 1.0)
 * @param isArabic - Whether the answer is in Arabic
 * @returns Partially revealed string with ... for hidden parts
 */
export function getProgressiveReveal(
  answer: string,
  percentage: number,
  isArabic: boolean
): string {
  if (!answer || answer.trim().length === 0) {
    return '';
  }
  
  // Clamp percentage
  const pct = Math.max(0, Math.min(1, percentage));
  
  if (pct >= 1) {
    return answer;
  }
  
  if (isArabic) {
    return revealArabicText(answer, pct);
  } else {
    return revealEnglishText(answer, pct);
  }
}

/**
 * Reveal Arabic text progressively, handling tashkeel properly.
 * Tashkeel marks stay attached to their base letters.
 */
function revealArabicText(text: string, percentage: number): string {
  // Get base characters (without tashkeel) for counting
  const baseText = text.replace(TASHKEEL_PATTERN, '');
  const baseChars = [...baseText]; // Handle multi-byte chars properly
  
  // Calculate how many base characters to reveal
  const charsToReveal = Math.max(1, Math.ceil(baseChars.length * percentage));
  
  // Build result by iterating through original text
  const chars = [...text];
  let result = '';
  let baseCharCount = 0;
  let revealed = 0;
  
  for (const char of chars) {
    const isTashkeel = TASHKEEL_PATTERN.test(char);
    TASHKEEL_PATTERN.lastIndex = 0; // Reset regex state
    
    if (isTashkeel) {
      // Tashkeel follows its base letter
      if (revealed <= charsToReveal) {
        result += char;
      }
    } else {
      baseCharCount++;
      if (baseCharCount <= charsToReveal) {
        result += char;
        revealed++;
      }
    }
  }
  
  // Add ellipsis if there's more
  if (revealed < baseChars.length) {
    result += '...';
  }
  
  return result;
}

/**
 * Reveal English text progressively, handling spaces and multi-word answers.
 */
function revealEnglishText(text: string, percentage: number): string {
  const chars = [...text];
  const nonSpaceChars = chars.filter(c => c !== ' ');
  const charsToReveal = Math.max(1, Math.ceil(nonSpaceChars.length * percentage));
  
  let result = '';
  let revealed = 0;
  
  for (const char of chars) {
    if (char === ' ') {
      // Preserve spaces
      result += ' ';
    } else if (revealed < charsToReveal) {
      result += char;
      revealed++;
    }
  }
  
  // Add ellipsis if there's more
  if (revealed < nonSpaceChars.length) {
    result = result.trimEnd() + '...';
  }
  
  return result;
}

/**
 * Get the first meaningful character of text.
 * For Arabic, skips any leading tashkeel marks.
 * 
 * @param text - The text to extract from
 * @param isArabic - Whether the text is Arabic
 * @returns The first character (with any following tashkeel for Arabic)
 */
export function getFirstCharacter(text: string, isArabic: boolean): string {
  if (!text || text.trim().length === 0) {
    return '';
  }
  
  if (isArabic) {
    const chars = [...text];
    let result = '';
    let foundBase = false;
    
    for (const char of chars) {
      const isTashkeel = TASHKEEL_PATTERN.test(char);
      TASHKEEL_PATTERN.lastIndex = 0;
      
      if (!isTashkeel && !foundBase) {
        result = char;
        foundBase = true;
      } else if (isTashkeel && foundBase) {
        // Include tashkeel that follows the base letter
        result += char;
      } else if (!isTashkeel && foundBase) {
        // Stop at next base letter
        break;
      }
    }
    
    return result || text[0];
  } else {
    // English: just return first non-space character
    const trimmed = text.trimStart();
    return trimmed[0] || '';
  }
}

/**
 * Determine if a given answer should be treated as Arabic text.
 * Uses Unicode range detection for Arabic characters.
 * 
 * @param text - The text to check
 * @returns true if the text contains Arabic characters
 */
export function isArabicText(text: string): boolean {
  // Arabic Unicode range: 0600-06FF (Arabic), 0750-077F (Arabic Supplement)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text);
}
