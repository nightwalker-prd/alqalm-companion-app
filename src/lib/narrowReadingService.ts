/**
 * Narrow Reading Service
 *
 * Implements Paul Nation's narrow reading methodology:
 * - Group reading passages by topic/theme
 * - Track topic-specific vocabulary exposure
 * - Provide "Read More About This Topic" recommendations
 * - Award topic completion badges
 */

import type {
  ReadingPassage,
  NarrowReadingCollection,
  TopicProgress,
} from '../types/reading';
import { getReadingData } from './readingService';

// Storage key for topic progress
const TOPIC_PROGRESS_KEY = 'madina_topic_progress';

/**
 * Get topic progress from localStorage
 */
export function getTopicProgress(): Record<string, TopicProgress> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(TOPIC_PROGRESS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save topic progress to localStorage
 */
function saveTopicProgress(progress: Record<string, TopicProgress>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOPIC_PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Update topic progress when a passage is read
 */
export function updateTopicProgress(
  topic: string,
  passagesRead: number,
  totalPassages: number
): TopicProgress {
  const allProgress = getTopicProgress();
  const existing = allProgress[topic] || {
    topic,
    passagesRead: 0,
    totalPassages: 0,
    vocabularyEncountered: 0,
    badgeEarned: false,
    lastReadDate: null,
  };

  const updated: TopicProgress = {
    ...existing,
    passagesRead,
    totalPassages,
    lastReadDate: Date.now(),
    badgeEarned: passagesRead >= totalPassages,
  };

  allProgress[topic] = updated;
  saveTopicProgress(allProgress);

  return updated;
}

/**
 * Group passages by category/topic into narrow reading collections
 */
export function groupPassagesByTopic(
  passages: ReadingPassage[]
): NarrowReadingCollection[] {
  const readingData = getReadingData();
  const topicMap = new Map<string, ReadingPassage[]>();

  // Group passages by category
  for (const passage of passages) {
    const existing = topicMap.get(passage.category) || [];
    existing.push(passage);
    topicMap.set(passage.category, existing);
  }

  // Convert to NarrowReadingCollection array
  const collections: NarrowReadingCollection[] = [];

  for (const [topic, topicPassages] of topicMap.entries()) {
    // Calculate stats
    const totalWordCount = topicPassages.reduce((sum, p) => sum + p.wordCount, 0);
    const passagesRead = topicPassages.filter(
      (p) => readingData.passageProgress[p.id]?.completed
    ).length;

    const levelDistribution = {
      beginner: topicPassages.filter((p) => p.level === 'beginner').length,
      intermediate: topicPassages.filter((p) => p.level === 'intermediate').length,
      advanced: topicPassages.filter((p) => p.level === 'advanced').length,
    };

    // Get Arabic topic name from first passage
    const topicAr = topicPassages[0]?.categoryAr || topic;

    collections.push({
      topic,
      topicAr,
      passages: topicPassages,
      totalWordCount,
      passagesRead,
      progressPercent:
        topicPassages.length > 0
          ? Math.round((passagesRead / topicPassages.length) * 100)
          : 0,
      levelDistribution,
    });
  }

  // Sort by topic name
  return collections.sort((a, b) => a.topic.localeCompare(b.topic));
}

/**
 * Get a specific topic collection
 */
export function getTopicCollection(
  passages: ReadingPassage[],
  topic: string
): NarrowReadingCollection | null {
  const collections = groupPassagesByTopic(passages);
  return collections.find((c) => c.topic === topic) || null;
}

/**
 * Get related passages in the same topic (for "Read More About This Topic")
 */
export function getRelatedPassages(
  passages: ReadingPassage[],
  currentPassageId: string,
  limit: number = 5
): ReadingPassage[] {
  const currentPassage = passages.find((p) => p.id === currentPassageId);
  if (!currentPassage) return [];

  const readingData = getReadingData();

  // Get other passages in same category
  const related = passages.filter(
    (p) =>
      p.category === currentPassage.category && p.id !== currentPassageId
  );

  // Prioritize unread passages
  const unread = related.filter(
    (p) => !readingData.passageProgress[p.id]?.completed
  );
  const read = related.filter(
    (p) => readingData.passageProgress[p.id]?.completed
  );

  // Return unread first, then read, up to limit
  return [...unread, ...read].slice(0, limit);
}

/**
 * Get topic recommendations based on user's reading history
 */
export function getRecommendedTopics(
  passages: ReadingPassage[],
  limit: number = 3
): NarrowReadingCollection[] {
  const collections = groupPassagesByTopic(passages);
  const topicProgress = getTopicProgress();

  // Score topics by:
  // 1. Started but not completed (highest priority)
  // 2. Has beginner-level passages (for accessibility)
  // 3. Not yet started
  const scored = collections.map((collection) => {
    let score = 0;
    const progress = topicProgress[collection.topic];

    // Started but not completed
    if (
      collection.passagesRead > 0 &&
      collection.passagesRead < collection.passages.length
    ) {
      score += 100;
    }

    // Has beginner passages
    if (collection.levelDistribution.beginner > 0) {
      score += 20;
    }

    // More passages = more content
    score += Math.min(collection.passages.length, 10);

    // Recently read
    if (progress?.lastReadDate) {
      const daysSinceRead =
        (Date.now() - progress.lastReadDate) / (1000 * 60 * 60 * 24);
      if (daysSinceRead < 7) {
        score += 30; // Continue recent topics
      }
    }

    return { collection, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.collection);
}

/**
 * Get topics where the user has earned a completion badge
 */
export function getCompletedTopics(): string[] {
  const progress = getTopicProgress();
  return Object.entries(progress)
    .filter(([, p]) => p.badgeEarned)
    .map(([topic]) => topic);
}

/**
 * Get topic statistics summary
 */
export function getTopicStats(
  passages: ReadingPassage[]
): {
  totalTopics: number;
  topicsStarted: number;
  topicsCompleted: number;
  averageProgress: number;
} {
  const collections = groupPassagesByTopic(passages);
  const topicsStarted = collections.filter((c) => c.passagesRead > 0).length;
  const topicsCompleted = collections.filter(
    (c) => c.passagesRead === c.passages.length && c.passages.length > 0
  ).length;
  const totalProgress = collections.reduce(
    (sum, c) => sum + c.progressPercent,
    0
  );

  return {
    totalTopics: collections.length,
    topicsStarted,
    topicsCompleted,
    averageProgress:
      collections.length > 0
        ? Math.round(totalProgress / collections.length)
        : 0,
  };
}

/**
 * Sort passages within a topic by recommended reading order
 * (beginner first, then by length, then unread first)
 */
export function sortPassagesForNarrowReading(
  passages: ReadingPassage[]
): ReadingPassage[] {
  const readingData = getReadingData();
  const levelOrder: Record<string, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  return [...passages].sort((a, b) => {
    // Unread first
    const aRead = readingData.passageProgress[a.id]?.completed ? 1 : 0;
    const bRead = readingData.passageProgress[b.id]?.completed ? 1 : 0;
    if (aRead !== bRead) return aRead - bRead;

    // Then by level
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];
    if (levelDiff !== 0) return levelDiff;

    // Then by word count (shorter first)
    return a.wordCount - b.wordCount;
  });
}
