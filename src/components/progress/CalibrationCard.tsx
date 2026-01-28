import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import type { CalibrationStats } from '../../lib/calibration';
import { getConfidenceLevelLabel, EXPECTED_ACCURACY } from '../../lib/calibration';

interface CalibrationCardProps {
  stats: CalibrationStats;
  trend?: 'improving' | 'stable' | 'declining' | 'insufficient-data';
}

/**
 * CalibrationCard displays confidence calibration statistics to help users
 * understand how well their confidence predicts actual correctness.
 */
export function CalibrationCard({ stats, trend }: CalibrationCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Insufficient data state
  if (stats.tendency === 'insufficient-data') {
    return (
      <Card variant="default" padding="lg">
        <CardHeader
          title="Confidence Calibration"
          subtitle="How well does your confidence predict success?"
        />
        <CardContent className="mt-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand-200)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {stats.feedbackMessage}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-2">
              Rate your confidence during practice to unlock insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scorePercent = Math.round(stats.calibrationScore * 100);
  const tendencyInfo = getTendencyInfo(stats.tendency);

  return (
    <Card variant="default" padding="lg">
      <CardHeader
        title="Confidence Calibration"
        subtitle="How well does your confidence predict success?"
      />
      <CardContent className="mt-4">
        {/* Main score display */}
        <div className="flex items-center gap-4 mb-4">
          {/* Score circle */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="var(--color-sand-200)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={tendencyInfo.color}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${scorePercent * 2.136} 213.6`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[var(--color-ink)]">
                {scorePercent}%
              </span>
            </div>
          </div>

          {/* Tendency and message */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tendencyInfo.badgeClass}`}>
                {tendencyInfo.icon}
                {tendencyInfo.label}
              </span>
              {trend && trend !== 'insufficient-data' && (
                <TrendBadge trend={trend} />
              )}
            </div>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {stats.feedbackMessage}
            </p>
          </div>
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          <span>{expanded ? 'Hide details' : 'Show breakdown'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded breakdown by level */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-[var(--color-sand-200)] space-y-3">
            <p className="text-xs text-[var(--color-ink-muted)] mb-2">
              Accuracy by confidence level ({stats.totalRatings} total ratings)
            </p>
            {stats.byLevel.map((level) => (
              <LevelBreakdown key={level.level} level={level} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual level breakdown row
 */
function LevelBreakdown({ level }: { level: CalibrationStats['byLevel'][0] }) {
  if (level.count === 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="w-24 text-xs text-[var(--color-ink-muted)]">
          {getConfidenceLevelLabel(level.level)}
        </span>
        <span className="flex-1 text-xs text-[var(--color-ink-muted)] italic">
          No data yet
        </span>
      </div>
    );
  }

  const actualPercent = Math.round(level.actualAccuracy * 100);
  const expectedPercent = Math.round(EXPECTED_ACCURACY[level.level] * 100);
  const isOverconfident = level.difference < -0.1;
  const isUnderconfident = level.difference > 0.1;

  // Map calibration status to available ProgressBar variants
  const variant = isOverconfident ? 'warning' : isUnderconfident ? 'warning' : 'success';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-ink)]">
          {getConfidenceLevelLabel(level.level)}
        </span>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {level.correctCount}/{level.count} correct
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar
            value={actualPercent}
            variant={variant}
            size="sm"
          />
        </div>
        <span className="text-xs w-16 text-right">
          <span className={
            isOverconfident ? 'text-[var(--color-error)]' :
            isUnderconfident ? 'text-[var(--color-gold)]' :
            'text-[var(--color-success)]'
          }>
            {actualPercent}%
          </span>
          <span className="text-[var(--color-ink-muted)]"> / {expectedPercent}%</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Trend indicator badge
 */
function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  const config = {
    improving: {
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      class: 'text-[var(--color-success)]',
    },
    stable: {
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
      class: 'text-[var(--color-ink-muted)]',
    },
    declining: {
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      class: 'text-[var(--color-error)]',
    },
  };

  const { icon, class: className } = config[trend];

  return (
    <span className={`inline-flex items-center ${className}`} title={`Trend: ${trend}`}>
      {icon}
    </span>
  );
}

/**
 * Get display info for a calibration tendency
 */
function getTendencyInfo(tendency: CalibrationStats['tendency']) {
  switch (tendency) {
    case 'well-calibrated':
      return {
        label: 'Well Calibrated',
        color: 'var(--color-success)',
        badgeClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'overconfident':
      return {
        label: 'Overconfident',
        color: 'var(--color-error)',
        badgeClass: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ),
      };
    case 'underconfident':
      return {
        label: 'Underconfident',
        color: 'var(--color-gold)',
        badgeClass: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        ),
      };
    default:
      return {
        label: 'Analyzing',
        color: 'var(--color-ink-muted)',
        badgeClass: 'bg-[var(--color-sand-200)] text-[var(--color-ink-muted)]',
        icon: null,
      };
  }
}

export default CalibrationCard;
