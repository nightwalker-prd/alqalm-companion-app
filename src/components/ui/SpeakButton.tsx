/**
 * SpeakButton Component
 *
 * A button that speaks Arabic text using TTS.
 * Shows visual feedback for speaking/loading states.
 */

import { useState, useCallback } from 'react';
import { useTTS } from '../../hooks/useTTS';
import type { TTSOptions } from '../../types/tts';

type SpeakSpeed = 'slow' | 'normal' | 'fast';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'default' | 'ghost' | 'outline';

interface SpeakButtonProps {
  /** Arabic text to speak */
  text: string;
  /** Speed of speech */
  speed?: SpeakSpeed;
  /** Button size */
  size?: ButtonSize;
  /** Button variant */
  variant?: ButtonVariant;
  /** Additional TTS options */
  options?: TTSOptions;
  /** Show label text */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech ends */
  onEnd?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-10 h-10 text-lg',
};

const variantStyles: Record<ButtonVariant, string> = {
  default: `
    bg-[var(--color-primary)]
    text-white
    hover:bg-[var(--color-primary-dark)]
    shadow-sm
  `,
  ghost: `
    bg-transparent
    text-[var(--color-primary)]
    hover:bg-indigo-100
    dark:hover:bg-indigo-900/50
  `,
  outline: `
    bg-transparent
    border border-[var(--color-primary)]
    text-[var(--color-primary)]
    hover:bg-indigo-100
    dark:hover:bg-indigo-900/50
  `,
};

/**
 * Speaker icon SVG
 */
function SpeakerIcon({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {isSpeaking ? (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      ) : (
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      )}
    </svg>
  );
}

/**
 * Loading spinner for when speech is loading
 */
function LoadingSpinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeOpacity={0.25}
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        strokeOpacity={1}
      />
    </svg>
  );
}

export function SpeakButton({
  text,
  speed = 'normal',
  size = 'md',
  variant = 'ghost',
  options,
  showLabel = false,
  label = 'Listen',
  className = '',
  onStart,
  onEnd,
  onError,
}: SpeakButtonProps) {
  const { speak, speakSlowly, speakFast, stop, isSupported, state } = useTTS();
  const [isActive, setIsActive] = useState(false);

  const isSpeaking = state === 'speaking' && isActive;
  const isLoading = state === 'loading' && isActive;

  const handleClick = useCallback(async () => {
    if (isSpeaking) {
      stop();
      setIsActive(false);
      return;
    }

    setIsActive(true);
    onStart?.();

    try {
      switch (speed) {
        case 'slow':
          await speakSlowly(text, options);
          break;
        case 'fast':
          await speakFast(text, options);
          break;
        default:
          await speak(text, options);
      }
      onEnd?.();
    } catch (err) {
      onError?.(err as Error);
    } finally {
      setIsActive(false);
    }
  }, [text, speed, options, isSpeaking, speak, speakSlowly, speakFast, stop, onStart, onEnd, onError]);

  // Don't render if TTS is not supported
  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-1.5
        rounded-full
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${showLabel ? 'px-3' : ''}
        ${className}
      `}
      title={isSpeaking ? 'Stop' : `Listen to "${text}"`}
      aria-label={isSpeaking ? 'Stop audio' : `Listen to pronunciation`}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <SpeakerIcon isSpeaking={isSpeaking} />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {isSpeaking ? 'Stop' : label}
        </span>
      )}
    </button>
  );
}

/**
 * Inline speak button for use within text
 */
export function InlineSpeakButton({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  return (
    <SpeakButton
      text={text}
      size="sm"
      variant="ghost"
      className={`inline-flex align-middle -mt-0.5 ${className}`}
    />
  );
}

export default SpeakButton;
