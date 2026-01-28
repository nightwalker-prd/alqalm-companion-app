/**
 * StrandBalanceWidget
 *
 * Displays Paul Nation's Four Strands balance as a visual bar chart.
 * Shows the user how their study time is distributed and recommends
 * underutilized strands to maintain balanced learning.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import {
  getStrandTotalsToday,
  getStrandTotalsThisWeek,
  calculateBalance,
  getRecommendedStrand,
  formatDuration,
  getStrandName,
} from '../../lib/studyTimeService';
import type { LearningStrand, StrandBalance, StrandRecommendation } from '../../types/studyTime';

/**
 * Colors for each strand (using CSS variables where possible)
 */
const STRAND_COLORS: Record<LearningStrand, string> = {
  'meaning-input': 'var(--color-primary)',      // Blue - reading/listening
  'meaning-output': 'var(--color-success)',     // Green - speaking/writing
  'language-focused': 'var(--color-gold)',      // Gold - vocabulary/grammar
  fluency: 'var(--color-error)',                // Red - speed practice
};

/**
 * Links for each strand to relevant practice activities
 */
const STRAND_LINKS: Record<LearningStrand, string> = {
  'meaning-input': '/reading',
  'meaning-output': '/practice',
  'language-focused': '/practice',
  fluency: '/practice/fluency',
};

interface StrandBarProps {
  strand: LearningStrand;
  percent: number;
  timeMs: number;
  isRecommended: boolean;
}

function StrandBar({ strand, percent, timeMs, isRecommended }: StrandBarProps) {
  const name = getStrandName(strand);
  const color = STRAND_COLORS[strand];
  const link = STRAND_LINKS[strand];

  return (
    <Link to={link} className="block group">
      <div className="flex items-center gap-3 py-2">
        {/* Strand name */}
        <div className="w-28 flex-shrink-0">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {name}
          </span>
          {isRecommended && (
            <span className="ml-1 text-xs text-[var(--color-gold)]">*</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-4 bg-[var(--color-sand-100)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
            style={{
              width: `${Math.min(percent, 100)}%`,
              backgroundColor: color,
              minWidth: percent > 0 ? '4px' : '0',
            }}
          />
        </div>

        {/* Percentage and time */}
        <div className="w-20 flex-shrink-0 text-right">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {percent}%
          </span>
          <span className="text-xs text-[var(--color-ink-muted)] ml-1">
            ({formatDuration(timeMs)})
          </span>
        </div>
      </div>
    </Link>
  );
}

interface StrandLegendProps {
  balance: StrandBalance;
}

function StrandLegend({ balance }: StrandLegendProps) {
  const strands: LearningStrand[] = [
    'meaning-input',
    'meaning-output',
    'language-focused',
    'fluency',
  ];

  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[var(--color-sand-200)]">
      {strands.map((strand) => (
        <div key={strand} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: STRAND_COLORS[strand] }}
          />
          <span className="text-xs text-[var(--color-ink-muted)]">
            {getStrandName(strand)} ({balance[strand]}%)
          </span>
        </div>
      ))}
    </div>
  );
}

interface RecommendationBannerProps {
  recommendation: StrandRecommendation;
}

function RecommendationBanner({ recommendation }: RecommendationBannerProps) {
  const link = STRAND_LINKS[recommendation.strand];

  return (
    <Link to={link} className="block">
      <div className="mt-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Recommendation
            </p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              {recommendation.suggestion}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

type TimePeriod = 'today' | 'week';

interface StrandBalanceWidgetProps {
  /** Time period to show - today or this week */
  period?: TimePeriod;
  /** Whether to show the recommendation banner */
  showRecommendation?: boolean;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function StrandBalanceWidget({
  period = 'today',
  showRecommendation = true,
  showLegend = false,
  className = '',
}: StrandBalanceWidgetProps) {
  const strands: LearningStrand[] = [
    'meaning-input',
    'meaning-output',
    'language-focused',
    'fluency',
  ];

  const { totals, balance, recommendation, totalTime } = useMemo(() => {
    const totals = period === 'today' ? getStrandTotalsToday() : getStrandTotalsThisWeek();
    const balance = calculateBalance(totals);
    const recommendation = getRecommendedStrand(totals);
    const totalTime =
      totals['meaning-input'] +
      totals['meaning-output'] +
      totals['language-focused'] +
      totals.fluency;

    return { totals, balance, recommendation, totalTime };
  }, [period]);

  const periodLabel = period === 'today' ? 'Today' : 'This Week';

  return (
    <Card variant="default" padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Four Strands Balance
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {periodLabel} - {formatDuration(totalTime)} total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--color-ink-muted)]">
            Target: 25% each
          </span>
        </div>
      </div>

      {/* Strand bars */}
      <div className="space-y-1">
        {strands.map((strand) => (
          <StrandBar
            key={strand}
            strand={strand}
            percent={balance[strand]}
            timeMs={totals[strand]}
            isRecommended={recommendation?.strand === strand}
          />
        ))}
      </div>

      {/* Legend (optional) */}
      {showLegend && <StrandLegend balance={balance} />}

      {/* Recommendation banner */}
      {showRecommendation && recommendation && (
        <RecommendationBanner recommendation={recommendation} />
      )}

      {/* Empty state */}
      {totalTime === 0 && (
        <div className="mt-4 text-center py-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            No study time recorded {period === 'today' ? 'today' : 'this week'} yet.
          </p>
          <Link
            to="/practice"
            className="inline-block mt-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Start practicing
          </Link>
        </div>
      )}
    </Card>
  );
}

export default StrandBalanceWidget;
