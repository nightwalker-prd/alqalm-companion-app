/**
 * VocabularySizeWidget
 *
 * Displays the user's estimated Arabic vocabulary size based on their
 * mastery data. Shows proficiency level, progress to next level,
 * and text coverage estimate.
 *
 * Based on Paul Nation's vocabulary size research.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import {
  estimateFromMasteryCount,
  getVocabSizeSummary,
  formatVocabSize,
  getLevelColor,
  estimateTextCoverage,
} from '../../lib/vocabSizeService';
import type { VocabSizeSummary } from '../../types/vocabSize';

// ============================================================================
// Sub-components
// ============================================================================

interface LevelBadgeProps {
  level: string;
  color: string;
}

function LevelBadge({ level, color }: LevelBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
        border: `1px solid ${color}`,
      }}
    >
      {level}
    </span>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  sublabel?: string;
}

function StatItem({ label, value, sublabel }: StatItemProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-display font-bold text-[var(--color-ink)]">
        {value}
      </p>
      <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
      {sublabel && (
        <p className="text-xs text-[var(--color-ink-muted)] opacity-75">
          {sublabel}
        </p>
      )}
    </div>
  );
}

interface ProgressSectionProps {
  summary: VocabSizeSummary;
  color: string;
}

function ProgressSection({ summary, color }: ProgressSectionProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--color-ink-muted)]">
          Progress to {summary.nextLevelLabel}
        </span>
        <span className="text-sm font-medium text-[var(--color-ink)]">
          {summary.progressToNext}%
        </span>
      </div>
      <div className="h-2.5 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${summary.progressToNext}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {summary.wordsToNext > 0 && (
        <p className="text-xs text-[var(--color-ink-muted)] mt-1.5">
          {formatVocabSize(summary.wordsToNext)} words to go
        </p>
      )}
    </div>
  );
}

interface CapabilityCardProps {
  capability: string;
  textCoverage: string;
}

function CapabilityCard({ capability, textCoverage }: CapabilityCardProps) {
  return (
    <div className="mt-4 p-3 rounded-lg bg-[var(--color-sand-100)] border border-[var(--color-sand-200)]">
      <p className="text-sm text-[var(--color-ink)]">
        <span className="font-medium">You can:</span> {capability}
      </p>
      <p className="text-xs text-[var(--color-ink-muted)] mt-1">
        Estimated text coverage: {textCoverage}
      </p>
    </div>
  );
}

interface ConfidenceIndicatorProps {
  confidence: number;
}

function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const confidencePercent = Math.round(confidence * 100);
  let label = 'Low';
  let color = 'var(--color-error)';

  if (confidence >= 0.7) {
    label = 'High';
    color = 'var(--color-success)';
  } else if (confidence >= 0.5) {
    label = 'Medium';
    color = 'var(--color-gold)';
  }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-[var(--color-ink-muted)]">
        {label} confidence ({confidencePercent}%)
      </span>
    </div>
  );
}

// ============================================================================
// Main Widget
// ============================================================================

interface VocabularySizeWidgetProps {
  /** Number of words the user has mastered */
  masteredWords: number;
  /** Total words in the course/curriculum */
  totalCourseWords: number;
  /** Optional: number of roots the user knows */
  knownRoots?: number;
  /** Whether to show the capability description */
  showCapability?: boolean;
  /** Whether to show the confidence indicator */
  showConfidence?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function VocabularySizeWidget({
  masteredWords,
  totalCourseWords,
  knownRoots,
  showCapability = true,
  showConfidence = true,
  className = '',
}: VocabularySizeWidgetProps) {
  const { estimate, summary, color, textCoverage } = useMemo(() => {
    const estimate = estimateFromMasteryCount(
      masteredWords,
      totalCourseWords,
      knownRoots
    );
    const summary = getVocabSizeSummary(estimate);
    const color = getLevelColor(estimate.level);
    const textCoverage = estimateTextCoverage(estimate.estimatedSize);

    return { estimate, summary, color, textCoverage };
  }, [masteredWords, totalCourseWords, knownRoots]);

  return (
    <Card variant="default" padding="md" className={className}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Vocabulary Size
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Estimated Arabic vocabulary
          </p>
        </div>
        <LevelBadge level={summary.levelLabel} color={color} />
      </div>

      {/* Main stat */}
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <p
            className="text-4xl font-display font-bold"
            style={{ color }}
          >
            {formatVocabSize(estimate.estimatedSize)}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            words
          </p>
          {estimate.range.min !== estimate.range.max && (
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              ({formatVocabSize(estimate.range.min)} - {formatVocabSize(estimate.range.max)})
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 py-4 border-y border-[var(--color-sand-200)]">
        <StatItem
          label="Mastered"
          value={formatVocabSize(masteredWords)}
          sublabel={`of ${formatVocabSize(totalCourseWords)}`}
        />
        <StatItem
          label="Text Coverage"
          value={textCoverage}
        />
        <StatItem
          label="Roots Known"
          value={formatVocabSize(estimate.rootStats.known)}
          sublabel={`${estimate.rootStats.percent.toFixed(0)}%`}
        />
      </div>

      {/* Progress to next level */}
      {summary.nextLevelLabel !== 'Maximum' && (
        <ProgressSection summary={summary} color={color} />
      )}

      {/* Capability description */}
      {showCapability && (
        <CapabilityCard capability={summary.capability} textCoverage={textCoverage} />
      )}

      {/* Confidence indicator */}
      {showConfidence && (
        <div className="mt-4 flex items-center justify-between">
          <ConfidenceIndicator confidence={estimate.confidence} />
          <Link
            to="/practice"
            className="text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            Practice more to improve estimate
          </Link>
        </div>
      )}

      {/* Empty state */}
      {masteredWords === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Start learning vocabulary to see your estimated size.
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

export default VocabularySizeWidget;
