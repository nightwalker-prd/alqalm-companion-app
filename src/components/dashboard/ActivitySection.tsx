import { useState, useEffect, type ReactNode } from 'react';

interface ActivitySectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const STORAGE_KEY = 'madina_dashboard_sections';

function getSectionState(id: string, defaultExpanded: boolean): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const states = JSON.parse(stored);
      if (typeof states[id] === 'boolean') {
        return states[id];
      }
    }
  } catch {
    // Ignore
  }
  return defaultExpanded;
}

function setSectionState(id: string, expanded: boolean): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const states = stored ? JSON.parse(stored) : {};
    states[id] = expanded;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch {
    // Ignore
  }
}

export function ActivitySection({
  id,
  title,
  icon,
  children,
  defaultExpanded = true,
}: ActivitySectionProps) {
  const [expanded, setExpanded] = useState(() => getSectionState(id, defaultExpanded));

  useEffect(() => {
    setSectionState(id, expanded);
  }, [id, expanded]);

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-sand-100)] transition-colors"
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 text-left font-medium text-[var(--color-ink)]">
          {title}
        </span>
        <svg
          className={`w-5 h-5 text-[var(--color-ink-muted)] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-2 space-y-3">{children}</div>
      </div>
    </div>
  );
}
