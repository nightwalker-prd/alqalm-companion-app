import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type InputState = 'default' | 'correct' | 'incorrect' | 'focused';

interface ArabicInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  state?: InputState;
  size?: 'md' | 'lg';
  label?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

const stateStyles: Record<InputState, string> = {
  default: `
    border-[var(--color-sand-300)]
    focus:border-[var(--color-primary)]
    focus:shadow-[var(--shadow-glow)]
  `,
  correct: `
    border-[var(--color-success)]
    bg-[var(--color-success-light)]
    shadow-[0_0_0_3px_rgba(74,124,89,0.1)]
  `,
  incorrect: `
    border-[var(--color-error)]
    bg-[var(--color-error-light)]
    shadow-[0_0_0_3px_rgba(196,100,74,0.1)]
  `,
  focused: `
    border-[var(--color-primary)]
    shadow-[var(--shadow-glow)]
  `,
};

const sizeStyles = {
  md: 'text-[var(--font-size-arabic-base)] py-3 px-4',
  lg: 'text-[var(--font-size-arabic-lg)] py-4 px-5',
};

export const ArabicInput = forwardRef<HTMLInputElement, ArabicInputProps>(
  (
    {
      state = 'default',
      size = 'lg',
      label,
      hint,
      leftAddon,
      rightAddon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            dir="rtl"
            disabled={disabled}
            className={`
              w-full
              font-[var(--font-arabic)]
              line-height-[var(--line-height-arabic)]
              text-right
              bg-white
              border-2
              rounded-[var(--radius-md)]
              text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-muted)]
              placeholder:opacity-50
              transition-all duration-200 ease-out
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:bg-[var(--color-sand-100)]
              ${stateStyles[state]}
              ${sizeStyles[size]}
              ${leftAddon ? 'pl-12' : ''}
              ${rightAddon ? 'pr-12' : ''}
              ${className}
            `}
            style={{
              fontFamily: 'var(--font-arabic)',
              fontSize: size === 'lg' ? 'var(--font-size-arabic-lg)' : 'var(--font-size-arabic-base)',
              lineHeight: 'var(--line-height-arabic)',
            }}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]">
              {rightAddon}
            </div>
          )}
        </div>

        {hint && (
          <p
            className={`
              mt-2 text-sm
              ${state === 'correct' ? 'text-[var(--color-success)]' : ''}
              ${state === 'incorrect' ? 'text-[var(--color-error)]' : ''}
              ${state === 'default' || state === 'focused' ? 'text-[var(--color-ink-muted)]' : ''}
            `}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

ArabicInput.displayName = 'ArabicInput';

export default ArabicInput;
