import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { WeaknessReport, Weakness } from '../../lib/weaknessAnalysis';
import {
  getErrorTypeLabel,
  getSeverityColorClass,
} from '../../lib/weaknessAnalysis';

interface WeaknessCardProps {
  report: WeaknessReport;
}

/**
 * WeaknessCard displays analysis of user's error patterns to help target
 * practice on specific weaknesses (deliberate practice from "Peak").
 */
export function WeaknessCard({ report }: WeaknessCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Not enough data state
  if (!report.hasEnoughData) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader
          title="Weakness Analysis"
          subtitle="Identify and target your weak areas"
        />
        <CardContent className="mt-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand-200)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Keep practicing to identify patterns in your errors.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-2">
              We'll analyze your mistakes and suggest targeted practice.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No significant weaknesses
  if (report.topWeaknesses.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader
          title="Weakness Analysis"
          subtitle="Identify and target your weak areas"
        />
        <CardContent className="mt-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-ink)]">
              No significant weaknesses detected!
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-2">
              You're making consistent progress. Keep it up!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topWeakness = report.topWeaknesses[0];

  return (
    <Card variant="default" padding="lg">
      <CardHeader
        title="Weakness Analysis"
        subtitle="Deliberate practice on your weak areas"
      />
      <CardContent className="mt-4">
        {/* Top weakness highlight */}
        <div className="flex items-start gap-4 mb-4">
          {/* Severity indicator */}
          <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${getSeverityBgClass(topWeakness.severity)}`}>
            <SeverityIcon severity={topWeakness.severity} />
          </div>

          {/* Weakness info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${getSeverityColorClass(topWeakness.severity)}`}>
                {getErrorTypeLabel(topWeakness.type)}
              </span>
              <TrendBadge trend={topWeakness.trend} />
            </div>
            <p className="text-sm text-[var(--color-ink-muted)] line-clamp-2">
              {topWeakness.description}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              {topWeakness.count} errors across {topWeakness.affectedWordIds.length} words
            </p>
          </div>
        </div>

        {/* Action button */}
        <Link to={`/practice/weaknesses?type=${topWeakness.type}`}>
          <Button
            variant="primary"
            size="md"
            className="w-full"
          >
            Practice This Weakness
          </Button>
        </Link>

        {/* Expand to see more weaknesses */}
        {report.topWeaknesses.length > 1 && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-2 mt-3 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              <span>{expanded ? 'Hide other weaknesses' : `Show ${report.topWeaknesses.length - 1} more weaknesses`}</span>
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-[var(--color-sand-200)] space-y-3">
                {report.topWeaknesses.slice(1).map((weakness) => (
                  <WeaknessRow key={weakness.type} weakness={weakness} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact row for additional weaknesses
 */
function WeaknessRow({ weakness }: { weakness: Weakness }) {
  return (
    <Link
      to={`/practice/weaknesses?type=${weakness.type}`}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-sand-100)] transition-colors"
    >
      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${getSeverityBgClass(weakness.severity)}`}>
        <SeverityIcon severity={weakness.severity} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getSeverityColorClass(weakness.severity)}`}>
            {getErrorTypeLabel(weakness.type)}
          </span>
          <TrendBadge trend={weakness.trend} />
        </div>
        <p className="text-xs text-[var(--color-ink-muted)]">
          {weakness.count} errors
        </p>
      </div>
      <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/**
 * Trend indicator badge
 */
function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'worsening' }) {
  const config = {
    improving: {
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      class: 'text-[var(--color-success)]',
      label: 'Improving',
    },
    stable: {
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
      class: 'text-[var(--color-ink-muted)]',
      label: 'Stable',
    },
    worsening: {
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      class: 'text-[var(--color-error)]',
      label: 'Needs attention',
    },
  };

  const { icon, class: className, label } = config[trend];

  return (
    <span className={`inline-flex items-center ${className}`} title={label}>
      {icon}
    </span>
  );
}

/**
 * Severity icon component
 */
function SeverityIcon({ severity, size = 'md' }: { severity: 'mild' | 'moderate' | 'severe'; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  
  // Warning/alert icon that changes color based on severity
  return (
    <svg className={`${sizeClass} ${getSeverityColorClass(severity)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

/**
 * Get background color class for severity
 */
function getSeverityBgClass(severity: 'mild' | 'moderate' | 'severe'): string {
  switch (severity) {
    case 'severe':
      return 'bg-rose-100 dark:bg-rose-900/50';
    case 'moderate':
      return 'bg-amber-100 dark:bg-amber-900/50';
    case 'mild':
      return 'bg-[var(--color-sand-200)]';
  }
}

export default WeaknessCard;
