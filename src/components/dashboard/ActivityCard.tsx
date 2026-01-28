import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

interface ActivityCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  primary?: boolean;
}

export function ActivityCard({
  to,
  title,
  description,
  icon,
  iconBg,
  primary = false,
}: ActivityCardProps) {
  if (primary) {
    return (
      <Link to={to} className="block">
        <Card variant="exercise" padding="lg" className="group">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center shadow-[var(--shadow-md)] group-hover:scale-105 transition-transform`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                {title}
              </h3>
              <p className="text-sm text-[var(--color-ink-muted)]">
                {description}
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--color-ink-muted)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={to} className="block">
      <Card variant="default" padding="md" className="group">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-[var(--color-ink)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {description}
            </p>
          </div>
          <svg className="w-4 h-4 text-[var(--color-ink-muted)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
