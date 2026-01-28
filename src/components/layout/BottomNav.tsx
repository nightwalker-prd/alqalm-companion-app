import { NavLink } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useDueCount } from '../../hooks/useDueCount';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/books',
    label: 'Books',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: '/reading',
    label: 'Read',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/practice',
    label: 'Practice',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    to: '/review',
    label: 'Review',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const { dueCount } = useDueCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-sand-200)] shadow-[0_-4px_20px_rgba(44,24,16,0.08)]">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center
                min-w-[56px] py-2 px-2
                rounded-[var(--radius-md)]
                transition-all duration-200
                ${isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sand-100)]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    relative
                    transition-transform duration-200
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}>
                    {item.icon}
                    {/* Badge dot for due reviews */}
                    {item.to === '/review' && dueCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-error)] rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className={`
                    text-xs mt-1 font-medium
                    ${isActive ? 'opacity-100' : 'opacity-70'}
                  `}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0 w-8 h-0.5 bg-[var(--color-primary)] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

export default BottomNav;
