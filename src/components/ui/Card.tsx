import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'exercise' | 'flat';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hasGeometricAccent?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[var(--color-sand-50)]
    border border-[var(--color-sand-200)]
    shadow-[var(--shadow-sm)]
  `,
  elevated: `
    bg-white
    border border-[var(--color-sand-200)]
    shadow-[var(--shadow-lg)]
  `,
  outlined: `
    bg-transparent
    border-2 border-[var(--color-sand-300)]
  `,
  exercise: `
    bg-white
    border border-[var(--color-sand-200)]
    shadow-[var(--shadow-md)]
    hover:shadow-[var(--shadow-lg)]
    transition-shadow duration-200
  `,
  flat: `
    bg-[var(--color-surface-alt)]
    border-none
  `,
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hasGeometricAccent = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          relative
          rounded-[var(--radius-lg)]
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {hasGeometricAccent && (
          <>
            <GeometricCorner position="top-left" />
            <GeometricCorner position="bottom-right" />
          </>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  titleArabic?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({
  title,
  titleArabic,
  subtitle,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {titleArabic && (
          <h3 className="arabic-xl text-[var(--color-ink)] mb-1">
            {titleArabic}
          </h3>
        )}
        {title && (
          <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[var(--color-sand-200)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function GeometricCorner({ position }: { position: 'top-left' | 'bottom-right' }) {
  const positionStyles = {
    'top-left': 'top-0 left-0 border-t-2 border-l-2',
    'bottom-right': 'bottom-0 right-0 border-b-2 border-r-2',
  };

  return (
    <div
      className={`
        absolute w-8 h-8
        border-[var(--color-gold)]
        opacity-40
        pointer-events-none
        ${positionStyles[position]}
      `}
      style={{ borderRadius: position === 'top-left' ? '8px 0 0 0' : '0 0 8px 0' }}
    />
  );
}

export default Card;
