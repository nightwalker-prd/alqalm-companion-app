import type { DiffChar } from '../../lib/arabic';
import { computeCharDiff } from '../../lib/arabic';

interface ArabicDiffProps {
  /** The correct/expected text */
  expected: string;
  /** The user's actual input */
  actual: string;
  /** Whether to show the expected text diff (default: true) */
  showExpected?: boolean;
  /** Whether to show the actual text diff (default: true) */
  showActual?: boolean;
  /** Additional CSS class for the container */
  className?: string;
  /** Size variant for the text */
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

/**
 * Renders a single diff character with appropriate styling.
 */
function DiffCharSpan({ diffChar }: { diffChar: DiffChar }) {
  const baseStyles = 'inline-block transition-colors';
  
  const typeStyles = {
    correct: 'text-[var(--color-success)]',
    wrong: 'text-[var(--color-error)] line-through',
    missing: 'text-[var(--color-error)] bg-red-100 dark:bg-red-900/30 rounded px-0.5',
    extra: 'text-[var(--color-warning)] bg-yellow-100 dark:bg-yellow-900/30 rounded px-0.5',
  };

  return (
    <span className={`${baseStyles} ${typeStyles[diffChar.type]}`}>
      {diffChar.char}
    </span>
  );
}

/**
 * Renders a sequence of diff characters.
 */
function DiffLine({ 
  chars, 
  label, 
  size = 'md' 
}: { 
  chars: DiffChar[]; 
  label: string; 
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wide">
        {label}
      </span>
      <div 
        className={`arabic ${sizeStyles[size]} leading-relaxed`}
        dir="rtl"
      >
        {chars.map((char, index) => (
          <DiffCharSpan key={index} diffChar={char} />
        ))}
      </div>
    </div>
  );
}

/**
 * ArabicDiff component - Shows character-level differences between expected and actual Arabic text.
 * 
 * Color coding:
 * - Green: Correct characters
 * - Red (with strikethrough): Wrong characters in user's input
 * - Red (highlighted): Missing characters from expected
 * - Yellow (highlighted): Extra characters in user's input
 * 
 * @example
 * ```tsx
 * <ArabicDiff 
 *   expected="الْكِتَابُ" 
 *   actual="الكتاب" 
 * />
 * ```
 */
export function ArabicDiff({
  expected,
  actual,
  showExpected = true,
  showActual = true,
  className = '',
  size = 'md',
}: ArabicDiffProps) {
  const diff = computeCharDiff(expected, actual);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {showActual && (
        <DiffLine 
          chars={diff.actual} 
          label="Your answer" 
          size={size}
        />
      )}
      {showExpected && (
        <DiffLine 
          chars={diff.expected} 
          label="Correct answer" 
          size={size}
        />
      )}
    </div>
  );
}

/**
 * Inline diff display - shows just the user's answer with diff highlighting.
 * More compact for inline feedback.
 */
export function ArabicDiffInline({
  expected,
  actual,
  className = '',
  size = 'md',
}: Omit<ArabicDiffProps, 'showExpected' | 'showActual'>) {
  const diff = computeCharDiff(expected, actual);

  return (
    <div 
      className={`arabic ${sizeStyles[size]} leading-relaxed ${className}`}
      dir="rtl"
    >
      {diff.actual.map((char, index) => (
        <DiffCharSpan key={index} diffChar={char} />
      ))}
    </div>
  );
}

/**
 * Legend component explaining the diff colors.
 */
export function DiffLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-[var(--color-success)]" />
        <span className="text-[var(--color-ink-muted)]">Correct</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-[var(--color-error)]" />
        <span className="text-[var(--color-ink-muted)]">Missing</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-[var(--color-warning)]" />
        <span className="text-[var(--color-ink-muted)]">Extra</span>
      </div>
    </div>
  );
}

export default ArabicDiff;
