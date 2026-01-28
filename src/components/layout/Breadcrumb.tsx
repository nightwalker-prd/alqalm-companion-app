/**
 * Breadcrumb Navigation Component
 * 
 * Shows navigation path for deep pages.
 */

import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  labelArabic?: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center gap-2 text-sm overflow-x-auto ${className}`}
    >
      {/* Home icon */}
      <Link 
        to="/" 
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors shrink-0"
        aria-label="Home"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2 min-w-0">
            {/* Separator */}
            <svg 
              className="w-4 h-4 text-[var(--color-sand-400)] shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            {/* Item */}
            {isLast || !item.to ? (
              <span className="text-[var(--color-ink)] font-medium truncate">
                {item.label}
                {item.labelArabic && (
                  <span className="arabic-sm mr-1 text-[var(--color-ink-muted)]" dir="rtl">
                    {' '}({item.labelArabic})
                  </span>
                )}
              </span>
            ) : (
              <Link 
                to={item.to}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors truncate"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
