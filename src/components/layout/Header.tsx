import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  showBackButton?: boolean;
  showBack?: boolean; // Alias for showBackButton
  title?: string;
  titleArabic?: string;
}

export function Header({ showBackButton = false, showBack = false, title, titleArabic }: HeaderProps) {
  const navigate = useNavigate();
  const shouldShowBack = showBackButton || showBack;

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-sand-50)] border-b border-[var(--color-sand-200)] backdrop-blur-sm bg-opacity-95">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {shouldShowBack ? (
            <button
              onClick={handleBack}
              className="
                w-10 h-10 rounded-full
                flex items-center justify-center
                bg-[var(--color-sand-100)]
                hover:bg-[var(--color-sand-200)]
                transition-colors
              "
            >
              <svg className="w-5 h-5 text-[var(--color-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <Logo />
              <span className="font-display text-xl font-semibold text-[var(--color-ink)]">
                Madina
              </span>
            </Link>
          )}

          {title && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--color-ink)]">{title}</span>
              {titleArabic && (
                <span className="arabic-sm text-[var(--color-ink-muted)]">{titleArabic}</span>
              )}
            </div>
          )}
        </div>

        {/* Right side - settings */}
        <Link 
          to="/settings"
          className="w-10 h-10 rounded-full bg-[var(--color-sand-100)] hover:bg-[var(--color-sand-200)] flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-sm)]">
      <span className="text-white font-arabic text-xl">م</span>
    </div>
  );
}

export default Header;
