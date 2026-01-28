/**
 * Compact Insights Widget for Dashboard
 * 
 * Shows top weakness with actionable advice.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { analyzeWeaknesses, getErrorTypeLabel } from '../../lib/weaknessAnalysis';

export function InsightsWidget() {
  const report = useMemo(() => analyzeWeaknesses(), []);

  // Not enough data - show encouraging message
  if (!report.hasEnoughData) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-[var(--color-ink)]">Building your profile</p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Complete more exercises to unlock personalized insights
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // No weaknesses
  if (report.topWeaknesses.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <span className="text-xl">✨</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-[var(--color-ink)]">Looking good!</p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              No major weaknesses detected
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const topWeakness = report.topWeaknesses[0];
  
  // Severity colors
  const severityColors = {
    mild: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    moderate: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    severe: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  };

  const severityIcons = {
    mild: '💡',
    moderate: '⚠️',
    severe: '🔴',
  };

  return (
    <Link to="/progress">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${severityColors[topWeakness.severity].split(' ').slice(0, 2).join(' ')}`}>
            <span className="text-xl">{severityIcons[topWeakness.severity]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-[var(--color-ink)]">
                {getErrorTypeLabel(topWeakness.type)}
              </p>
              {topWeakness.trend === 'improving' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  ↗ improving
                </span>
              )}
              {topWeakness.trend === 'worsening' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                  ↘ needs work
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-ink-muted)] line-clamp-2">
              {topWeakness.advice}
            </p>
            <p className="text-xs text-[var(--color-primary)] mt-1">
              Tap to see details →
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default InsightsWidget;
