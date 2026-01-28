/**
 * NarrowReadingCollections Component
 *
 * Displays reading passages grouped by topic for "narrow reading" practice.
 * Based on Paul Nation's research showing that reading multiple texts on
 * the same topic builds vocabulary through repeated natural exposure.
 */

import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import type { NarrowReadingCollection } from '../../types/reading';

interface NarrowReadingCollectionsProps {
  collections: NarrowReadingCollection[];
  onSelectTopic: (topic: string) => void;
}

export function NarrowReadingCollections({
  collections,
  onSelectTopic,
}: NarrowReadingCollectionsProps) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-ink-muted)]">
          No topic collections available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {collections.map((collection) => (
        <TopicCard
          key={collection.topic}
          collection={collection}
          onSelect={() => onSelectTopic(collection.topic)}
        />
      ))}
    </div>
  );
}

interface TopicCardProps {
  collection: NarrowReadingCollection;
  onSelect: () => void;
}

function TopicCard({ collection, onSelect }: TopicCardProps) {
  const isCompleted =
    collection.passagesRead === collection.passages.length &&
    collection.passages.length > 0;
  const isStarted = collection.passagesRead > 0;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left"
    >
      <Card
        variant="default"
        padding="md"
        className={`
          transition-all duration-200
          hover:shadow-[var(--shadow-md)]
          hover:border-[var(--color-primary)]
          ${isCompleted ? 'border-[var(--color-success)] border-opacity-50' : ''}
        `}
      >
        <div className="flex items-start gap-4">
          {/* Topic icon */}
          <div
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
              ${
                isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : isStarted
                  ? 'bg-indigo-100 dark:bg-indigo-900/50'
                  : 'bg-[var(--color-sand-200)]'
              }
            `}
          >
            {isCompleted ? (
              <svg
                className="w-6 h-6 text-[var(--color-success)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className={`w-6 h-6 ${
                  isStarted
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-ink-muted)]'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            )}
          </div>

          {/* Topic info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-[var(--color-ink)] truncate">
                {collection.topic}
              </h3>
              {isCompleted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">
                  Completed
                </span>
              )}
            </div>

            <p
              className="font-arabic text-sm text-[var(--color-ink-muted)] mb-2"
              dir="rtl"
            >
              {collection.topicAr}
            </p>

            {/* Progress bar */}
            <div className="mb-2">
              <ProgressBar
                value={collection.progressPercent}
                max={100}
                variant={isCompleted ? 'success' : 'default'}
                size="sm"
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-[var(--color-ink-muted)]">
              <span>
                {collection.passagesRead}/{collection.passages.length} passages
              </span>
              <span>{collection.totalWordCount.toLocaleString()} words</span>
              <div className="flex items-center gap-1">
                {collection.levelDistribution.beginner > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    {collection.levelDistribution.beginner}B
                  </span>
                )}
                {collection.levelDistribution.intermediate > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                    {collection.levelDistribution.intermediate}I
                  </span>
                )}
                {collection.levelDistribution.advanced > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    {collection.levelDistribution.advanced}A
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <svg
            className="w-5 h-5 text-[var(--color-ink-muted)] flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Card>
    </button>
  );
}

interface RelatedPassagesProps {
  passages: Array<{
    id: string;
    title: string;
    titleAr: string;
    level: string;
    wordCount: number;
  }>;
  topic: string;
}

export function RelatedPassages({ passages, topic }: RelatedPassagesProps) {
  if (passages.length === 0) return null;

  return (
    <Card variant="default" padding="md">
      <h3 className="font-display font-semibold text-[var(--color-ink)] mb-3">
        Read More About {topic}
      </h3>
      <p className="text-xs text-[var(--color-ink-muted)] mb-4">
        Nation's tip: Reading multiple texts on the same topic builds vocabulary
        through repeated exposure.
      </p>
      <div className="space-y-2">
        {passages.map((passage) => (
          <Link
            key={passage.id}
            to={`/reading/${passage.id}`}
            className="block p-3 rounded-lg bg-[var(--color-sand-100)] hover:bg-[var(--color-sand-200)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--color-ink)] truncate">
                  {passage.title}
                </p>
                <p
                  className="font-arabic text-sm text-[var(--color-ink-muted)] truncate"
                  dir="rtl"
                >
                  {passage.titleAr}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    passage.level === 'beginner'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : passage.level === 'intermediate'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {passage.level.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {passage.wordCount} words
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default NarrowReadingCollections;
