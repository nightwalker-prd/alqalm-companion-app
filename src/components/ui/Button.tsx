import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'error';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-primary)] text-white
    hover:bg-[var(--color-primary-dark)]
    active:bg-[var(--color-primary-dark)]
    shadow-[var(--shadow-sm)]
    hover:shadow-[var(--shadow-md)]
  `,
  secondary: `
    bg-[var(--color-sand-50)] text-[var(--color-ink)]
    border-2 border-[var(--color-sand-300)]
    hover:border-[var(--color-primary)] hover:bg-[var(--color-sand-100)]
    active:bg-[var(--color-sand-200)]
  `,
  ghost: `
    bg-transparent text-[var(--color-ink)]
    hover:bg-[var(--color-sand-200)] hover:text-[var(--color-ink)]
    active:bg-[var(--color-sand-300)]
  `,
  success: `
    bg-[var(--color-success)] text-white
    hover:opacity-90
    active:opacity-80
    shadow-[var(--shadow-sm)]
  `,
  error: `
    bg-[var(--color-error)] text-white
    hover:opacity-90
    active:opacity-80
    shadow-[var(--shadow-sm)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-5 py-2.5 text-base min-h-[48px]',
  lg: 'px-7 py-3.5 text-lg min-h-[56px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-[var(--radius-md)]
          transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
