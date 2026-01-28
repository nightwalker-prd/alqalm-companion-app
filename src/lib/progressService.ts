/**
 * Progress service for localStorage-based progress tracking.
 * Designed to be easily replaceable with Convex service later.
 */

import type {
  ProgressData,
  ProgressStats,
  WordMastery,
  ExerciseRecord,
  LessonProgress,
  BookProgress,
  OverallStats,
  MasteryLevel,
  SM2Data,
  EncounterData,
  DirectionalStrengthData,
} from '../types/progress';
import { MASTERY_THRESHOLDS, CURRENT_PROGRESS_VERSION } from '../types/progress';
import type { FIReState, EncompassingGraph } from '../types/fire';
import { DEFAULT_FIRE_CONFIG } from '../types/fire';
import { calculateStrengthChange, calculateChallengeStrengthChange, calculateDecay } from './mastery';
import {
  getBookContentStats,
  getTotalContentStats,
  getWordIdsForBook,
  getLessonIdsForBook,
  getLessonExerciseCount,
} from './contentStatsCore';
import {
  calculateSM2,
  simpleToQuality,
  isDue,
  getDaysOverdue,
  DEFAULT_SM2_STATE,
} from './spacedRepetition';
import type { SM2Quality } from './spacedRepetition';
import {
  migrateStrengthToSM2,
  estimateEncountersFromLegacy,
  addEncounter as addEncounterToData,
  DEFAULT_ENCOUNTER_DATA,
} from './migrateMastery';
import {
  updateFIReState,
  isDue as isFIReDue,
  getDaysOverdue as getFIReDaysOverdue,
  flowCreditDown,
  flowPenaltyUp,
  simpleToQuality as fireSimpleToQuality,
  createFIReState,
  getDecayedMemory,
} from './fire';
import { migrateWordMasteryToFIRe } from './migrateSM2ToFIRe';
import { getTashkeelLevelForStrength, type TashkeelLevel } from './arabic';
import {
  getDifficultyLevel,
  DEFAULT_DIRECTIONAL_STRENGTH,
  getExerciseDirection,
  updateDirectionalStrength,
  getCombinedStrength,
  type DifficultyLevel,
} from './progressiveDifficulty';
import type { ExerciseType } from '../types/exercise';

const STORAGE_KEY = 'madina_progress';

/**
 * Get the default empty progress data
 */
function getDefaultProgressData(): ProgressData {
  return {
    version: CURRENT_PROGRESS_VERSION,
    exerciseResults: {},
    wordMastery: {},
    lessonProgress: {},
    stats: {
      totalExercisesAttempted: 0,
      totalCorrect: 0,
      currentAnswerStreak: 0,
      bestAnswerStreak: 0,
      currentPracticeStreak: 0,
      bestPracticeStreak: 0,
      lastPracticeDate: null,
    },
  };
}

/**
 * Migrate v1 progress data to v2 (adds SM-2 and encounter tracking)
 */
function migrateV1ToV2(data: ProgressData): ProgressData {
  const migrated: ProgressData = {
    ...data,
    version: 2,
    wordMastery: {},
  };

  // Migrate each word mastery entry
  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    const sm2 = migrateStrengthToSM2(mastery.strength, mastery.lastPracticed);
    const encounters = estimateEncountersFromLegacy(mastery);

    migrated.wordMastery[wordId] = {
      ...mastery,
      sm2,
      encounters,
    };
  }

  return migrated;
}

/**
 * Migrate v2 progress data to v3 (adds FIRe spaced repetition)
 */
function migrateV2ToV3(data: ProgressData): ProgressData {
  const migrated: ProgressData = {
    ...data,
    version: 3,
    wordMastery: {},
  };

  // Migrate each word mastery entry
  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    const fire = migrateWordMasteryToFIRe(mastery);

    migrated.wordMastery[wordId] = {
      ...mastery,
      fire,
    };
  }

  return migrated;
}

/**
 * Migrate v3 progress data to v4 (adds directional strength for progressive difficulty)
 * 
 * Estimates recognition and production strength from legacy strength:
 * - Recognition is typically easier, so we estimate it slightly higher
 * - Production is harder, so we estimate it at or below the legacy strength
 */
function migrateV3ToV4(data: ProgressData): ProgressData {
  const migrated: ProgressData = {
    ...data,
    version: 4,
    wordMastery: {},
  };

  // Migrate each word mastery entry
  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    // Estimate directional strength from legacy strength
    // Recognition is typically 10-20% higher than production
    const legacyStrength = mastery.strength;
    
    // Estimate recognition strength (easier, so likely higher)
    const estimatedRecognition = Math.min(100, Math.round(legacyStrength * 1.15));
    
    // Production strength stays closer to or below legacy
    const estimatedProduction = legacyStrength;
    
    // Determine levels based on estimated strengths
    const recognitionLevel = getDifficultyLevel(estimatedRecognition);
    const productionLevel = getDifficultyLevel(estimatedProduction);

    migrated.wordMastery[wordId] = {
      ...mastery,
      directionalStrength: {
        recognitionStrength: estimatedRecognition,
        productionStrength: estimatedProduction,
        recognitionLevel,
        productionLevel,
        // Use lastPracticed for both since we don't have separate history
        lastRecognitionPractice: mastery.lastPracticed || null,
        lastProductionPractice: mastery.lastPracticed || null,
      },
    };
  }

  return migrated;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local timezone)
 */
function getYesterdayDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate days between two date strings
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Read progress data from localStorage
 */
export function getProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultProgressData();
    }
    let data = JSON.parse(stored) as ProgressData;

    // Handle migrations based on version
    if (data.version === 1) {
      data = migrateV1ToV2(data);
      saveProgress(data); // Persist migration
    }
    if (data.version === 2) {
      data = migrateV2ToV3(data);
      saveProgress(data); // Persist migration
    }
    if (data.version === 3) {
      data = migrateV3ToV4(data);
      saveProgress(data); // Persist migration
    }

    return data;
  } catch {
    console.error('Failed to read progress from localStorage');
    return getDefaultProgressData();
  }
}

/**
 * Save progress data to localStorage
 */
export function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('Failed to save progress to localStorage');
  }
}

/**
 * Reset all progress data
 */
export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Failed to reset progress');
  }
}

/**
 * Update practice streak based on current date
 */
function updatePracticeStreak(stats: ProgressStats): void {
  const today = getLocalDateString();
  const lastDate = stats.lastPracticeDate;
  
  if (lastDate === today) {
    // Already practiced today, no change
    return;
  }
  
  const yesterday = getYesterdayDateString();
  
  if (lastDate === yesterday) {
    // Consecutive day - increment streak
    stats.currentPracticeStreak += 1;
  } else {
    // Streak broken or first time - reset to 1
    stats.currentPracticeStreak = 1;
  }
  
  stats.bestPracticeStreak = Math.max(stats.bestPracticeStreak, stats.currentPracticeStreak);
  stats.lastPracticeDate = today;
}

/**
 * Update answer streak based on correctness
 */
function updateAnswerStreak(stats: ProgressStats, isCorrect: boolean): void {
  if (isCorrect) {
    stats.currentAnswerStreak += 1;
    stats.bestAnswerStreak = Math.max(stats.bestAnswerStreak, stats.currentAnswerStreak);
  } else {
    stats.currentAnswerStreak = 0;
  }
}

/**
 * Record an exercise result and update all related progress
 */
export function recordExerciseResult(
  exerciseId: string,
  lessonId: string,
  itemIds: string[],
  isCorrect: boolean
): void {
  const data = getProgress();
  const now = new Date().toISOString();
  
  // Update exercise record
  const exerciseRecord = data.exerciseResults[exerciseId] || {
    attempts: 0,
    correctAttempts: 0,
    lastAttempt: now,
    lastCorrect: false,
  };
  exerciseRecord.attempts += 1;
  if (isCorrect) {
    exerciseRecord.correctAttempts += 1;
  }
  exerciseRecord.lastAttempt = now;
  exerciseRecord.lastCorrect = isCorrect;
  data.exerciseResults[exerciseId] = exerciseRecord;
  
  // Update word mastery for each item
  for (const itemId of itemIds) {
    const wordMastery = data.wordMastery[itemId] || {
      strength: 0,
      lastPracticed: now,
      timesCorrect: 0,
      timesIncorrect: 0,
    };
    
    wordMastery.strength = calculateStrengthChange(wordMastery.strength, isCorrect);
    wordMastery.lastPracticed = now;
    if (isCorrect) {
      wordMastery.timesCorrect += 1;
    } else {
      wordMastery.timesIncorrect += 1;
    }
    data.wordMastery[itemId] = wordMastery;
  }
  
  // Update lesson progress
  const lessonProgress = data.lessonProgress[lessonId] || {
    started: false,
    exercisesAttempted: [],
    correctExercises: [],
    bestAccuracy: 0,
    lastPracticed: now,
  };
  
  lessonProgress.started = true;
  lessonProgress.lastPracticed = now;
  
  if (!lessonProgress.exercisesAttempted.includes(exerciseId)) {
    lessonProgress.exercisesAttempted.push(exerciseId);
  }
  
  if (isCorrect && !lessonProgress.correctExercises.includes(exerciseId)) {
    lessonProgress.correctExercises.push(exerciseId);
  }
  
  // Calculate accuracy against total exercises in lesson (not just attempted)
  const totalExercises = getLessonExerciseCount(lessonId);
  const correctCount = lessonProgress.correctExercises.length;
  const currentAccuracy = totalExercises > 0 
    ? Math.round((correctCount / totalExercises) * 100)
    : 0;
  lessonProgress.bestAccuracy = Math.max(lessonProgress.bestAccuracy, currentAccuracy);
  
  data.lessonProgress[lessonId] = lessonProgress;
  
  // Update overall stats
  data.stats.totalExercisesAttempted += 1;
  if (isCorrect) {
    data.stats.totalCorrect += 1;
  }
  
  updateAnswerStreak(data.stats, isCorrect);
  updatePracticeStreak(data.stats);
  
  saveProgress(data);
}

/**
 * Get mastery level for a word based on strength and decay
 */
export function getWordMasteryLevel(wordId: string): MasteryLevel {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];
  
  if (!mastery || mastery.strength === 0) {
    return 'new';
  }
  
  // Apply decay if applicable
  const daysSincePractice = daysBetween(
    mastery.lastPracticed.split('T')[0],
    getLocalDateString()
  );
  
  if (daysSincePractice > MASTERY_THRESHOLDS.DECAY_DAYS) {
    return 'decaying';
  }
  
  const effectiveStrength = calculateDecay(mastery.strength, daysSincePractice);
  
  if (effectiveStrength >= MASTERY_THRESHOLDS.MASTERED) {
    return 'mastered';
  }
  if (effectiveStrength >= MASTERY_THRESHOLDS.FAMILIAR) {
    return 'familiar';
  }
  return 'learning';
}

/**
 * Get effective strength for a word (with decay applied)
 */
export function getWordEffectiveStrength(wordId: string): number {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];
  
  if (!mastery) {
    return 0;
  }
  
  const daysSincePractice = daysBetween(
    mastery.lastPracticed.split('T')[0],
    getLocalDateString()
  );
  
  return calculateDecay(mastery.strength, daysSincePractice);
}

/**
 * Check if a lesson is completed (>= 90% accuracy)
 */
export function isLessonCompleted(lessonId: string): boolean {
  const data = getProgress();
  const progress = data.lessonProgress[lessonId];
  
  if (!progress) {
    return false;
  }
  
  return progress.bestAccuracy >= MASTERY_THRESHOLDS.LESSON_COMPLETE;
}

/**
 * Get lesson mastery percentage (0-100)
 */
export function getLessonMasteryPercent(lessonId: string): number {
  const data = getProgress();
  const progress = data.lessonProgress[lessonId];
  return progress?.bestAccuracy || 0;
}

/**
 * Get mastery level for a lesson
 */
export function getLessonMasteryLevel(lessonId: string): MasteryLevel {
  const data = getProgress();
  const progress = data.lessonProgress[lessonId];
  
  if (!progress || !progress.started) {
    return 'new';
  }
  
  // Check for decay
  const daysSincePractice = daysBetween(
    progress.lastPracticed.split('T')[0],
    getLocalDateString()
  );
  
  if (daysSincePractice > MASTERY_THRESHOLDS.DECAY_DAYS && progress.bestAccuracy < 100) {
    return 'decaying';
  }
  
  const accuracy = progress.bestAccuracy;
  
  if (accuracy >= MASTERY_THRESHOLDS.LESSON_COMPLETE) {
    return 'mastered';
  }
  if (accuracy >= MASTERY_THRESHOLDS.FAMILIAR) {
    return 'familiar';
  }
  if (accuracy > 0) {
    return 'learning';
  }
  return 'new';
}

/**
 * Get lesson progress details
 */
export function getLessonProgress(lessonId: string): LessonProgress | null {
  const data = getProgress();
  return data.lessonProgress[lessonId] || null;
}

/**
 * Count words learned (strength >= 80) for a book or all books
 */
export function getWordsLearnedCount(bookNumber?: number): number {
  const wordIds = bookNumber 
    ? getWordIdsForBook(bookNumber)
    : [...getWordIdsForBook(1), ...getWordIdsForBook(2), ...getWordIdsForBook(3)];
  
  let count = 0;
  for (const wordId of wordIds) {
    const strength = getWordEffectiveStrength(wordId);
    if (strength >= MASTERY_THRESHOLDS.LEARNED) {
      count += 1;
    }
  }
  
  return count;
}

/**
 * Count words in progress (strength > 0 but < LEARNED threshold) for a book or all books
 * These are words the user has practiced but haven't fully mastered yet
 */
export function getWordsInProgressCount(bookNumber?: number): number {
  const wordIds = bookNumber 
    ? getWordIdsForBook(bookNumber)
    : [...getWordIdsForBook(1), ...getWordIdsForBook(2), ...getWordIdsForBook(3)];
  
  let count = 0;
  for (const wordId of wordIds) {
    const strength = getWordEffectiveStrength(wordId);
    if (strength > 0 && strength < MASTERY_THRESHOLDS.LEARNED) {
      count += 1;
    }
  }
  
  return count;
}

/**
 * Count lessons completed (>= 90% accuracy) for a book or all books
 */
export function getLessonsCompletedCount(bookNumber?: number): number {
  const lessonIds = bookNumber
    ? getLessonIdsForBook(bookNumber)
    : [...getLessonIdsForBook(1), ...getLessonIdsForBook(2), ...getLessonIdsForBook(3)];
  
  let count = 0;
  for (const lessonId of lessonIds) {
    if (isLessonCompleted(lessonId)) {
      count += 1;
    }
  }
  
  return count;
}

/**
 * Get progress summary for a specific book
 */
export function getBookProgress(bookNumber: number): BookProgress {
  const contentStats = getBookContentStats(bookNumber);
  const lessonsCompleted = getLessonsCompletedCount(bookNumber);
  const wordsLearned = getWordsLearnedCount(bookNumber);
  const wordsInProgress = getWordsInProgressCount(bookNumber);
  
  // Calculate mastery percent as average of lesson accuracies
  const lessonIds = getLessonIdsForBook(bookNumber);
  let totalAccuracy = 0;
  let lessonsWithProgress = 0;
  
  for (const lessonId of lessonIds) {
    const accuracy = getLessonMasteryPercent(lessonId);
    if (accuracy > 0) {
      totalAccuracy += accuracy;
      lessonsWithProgress += 1;
    }
  }
  
  const masteryPercent = lessonsWithProgress > 0
    ? Math.round(totalAccuracy / lessonIds.length)
    : 0;
  
  return {
    bookNumber,
    lessonsCompleted,
    totalLessons: contentStats.lessonCount,
    wordsLearned,
    wordsInProgress,
    totalWords: contentStats.wordCount,
    masteryPercent,
  };
}

/**
 * Get overall statistics
 */
export function getOverallStats(): OverallStats {
  const data = getProgress();
  const totalContent = getTotalContentStats();
  
  const wordsLearned = getWordsLearnedCount();
  const wordsInProgress = getWordsInProgressCount();
  const lessonsCompleted = getLessonsCompletedCount();
  
  // Calculate grammar points learned (based on lessons completed)
  // Simplified: assume grammar points learned proportionally to lessons completed
  const grammarPoints = Math.round(
    (lessonsCompleted / totalContent.lessonCount) * totalContent.grammarCount
  );
  
  const accuracy = data.stats.totalExercisesAttempted > 0
    ? Math.round((data.stats.totalCorrect / data.stats.totalExercisesAttempted) * 100)
    : 0;
  
  return {
    wordsLearned,
    wordsInProgress,
    totalWords: totalContent.wordCount,
    grammarPoints,
    totalGrammar: totalContent.grammarCount,
    lessonsCompleted,
    totalLessons: totalContent.lessonCount,
    accuracy,
    currentAnswerStreak: data.stats.currentAnswerStreak,
    bestAnswerStreak: data.stats.bestAnswerStreak,
    currentPracticeStreak: data.stats.currentPracticeStreak,
    bestPracticeStreak: data.stats.bestPracticeStreak,
    lastPracticeDate: data.stats.lastPracticeDate,
  };
}

/**
 * Get raw word mastery data
 */
export function getWordMastery(wordId: string): WordMastery | null {
  const data = getProgress();
  return data.wordMastery[wordId] || null;
}

/**
 * Get raw exercise record
 */
export function getExerciseRecord(exerciseId: string): ExerciseRecord | null {
  const data = getProgress();
  return data.exerciseResults[exerciseId] || null;
}

/**
 * Record a CHALLENGE exercise result.
 * Uses higher stakes scoring: +15/-30 instead of +10/-20.
 * On success, marks the word as having proven mastery (slower decay).
 */
export function recordChallengeResult(
  exerciseId: string,
  lessonId: string,
  itemIds: string[],
  isCorrect: boolean
): void {
  const data = getProgress();
  const now = new Date().toISOString();
  const today = getLocalDateString();
  
  // Update exercise record
  const exerciseRecord = data.exerciseResults[exerciseId] || {
    attempts: 0,
    correctAttempts: 0,
    lastAttempt: now,
    lastCorrect: false,
  };
  exerciseRecord.attempts += 1;
  if (isCorrect) {
    exerciseRecord.correctAttempts += 1;
  }
  exerciseRecord.lastAttempt = now;
  exerciseRecord.lastCorrect = isCorrect;
  data.exerciseResults[exerciseId] = exerciseRecord;
  
  // Update word mastery for each item with CHALLENGE scoring
  for (const itemId of itemIds) {
    const wordMastery = data.wordMastery[itemId] || {
      strength: 0,
      lastPracticed: now,
      timesCorrect: 0,
      timesIncorrect: 0,
      challengesPassed: 0,
      lastChallengeDate: null,
    };
    
    // Use challenge scoring (+15/-30)
    wordMastery.strength = calculateChallengeStrengthChange(wordMastery.strength, isCorrect);
    wordMastery.lastPracticed = now;
    
    if (isCorrect) {
      wordMastery.timesCorrect += 1;
      // Mark as proven mastery for slower decay
      wordMastery.challengesPassed = (wordMastery.challengesPassed || 0) + 1;
      wordMastery.lastChallengeDate = today;
    } else {
      wordMastery.timesIncorrect += 1;
    }
    
    data.wordMastery[itemId] = wordMastery;
  }
  
  // Update lesson progress (same as regular exercise)
  const lessonProgress = data.lessonProgress[lessonId] || {
    started: false,
    exercisesAttempted: [],
    correctExercises: [],
    bestAccuracy: 0,
    lastPracticed: now,
  };
  
  lessonProgress.started = true;
  lessonProgress.lastPracticed = now;
  
  if (!lessonProgress.exercisesAttempted.includes(exerciseId)) {
    lessonProgress.exercisesAttempted.push(exerciseId);
  }
  
  if (isCorrect && !lessonProgress.correctExercises.includes(exerciseId)) {
    lessonProgress.correctExercises.push(exerciseId);
  }
  
  // Calculate accuracy against total exercises in lesson (not just attempted)
  const totalExercises = getLessonExerciseCount(lessonId);
  const correctCount = lessonProgress.correctExercises.length;
  const currentAccuracy = totalExercises > 0 
    ? Math.round((correctCount / totalExercises) * 100)
    : 0;
  lessonProgress.bestAccuracy = Math.max(lessonProgress.bestAccuracy, currentAccuracy);
  
  data.lessonProgress[lessonId] = lessonProgress;
  
  // Update overall stats
  data.stats.totalExercisesAttempted += 1;
  if (isCorrect) {
    data.stats.totalCorrect += 1;
  }
  
  updateAnswerStreak(data.stats, isCorrect);
  updatePracticeStreak(data.stats);
  
  saveProgress(data);
}

/**
 * Check if a word has proven mastery (passed at least one challenge)
 */
export function hasProvenMastery(wordId: string): boolean {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];
  return mastery?.challengesPassed !== undefined && mastery.challengesPassed > 0;
}

// ============================================================================
// SM-2 Spaced Repetition Functions
// ============================================================================

/**
 * Get the SM-2 state for a word, initializing if needed
 */
export function getWordSM2State(wordId: string): SM2Data {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];

  if (mastery?.sm2) {
    return mastery.sm2;
  }

  // Return default state for new words
  return {
    easeFactor: DEFAULT_SM2_STATE.easeFactor,
    interval: DEFAULT_SM2_STATE.interval,
    repetitions: DEFAULT_SM2_STATE.repetitions,
    nextReviewDate: DEFAULT_SM2_STATE.nextReviewDate,
  };
}

/**
 * Get the encounter data for a word, initializing if needed
 */
export function getWordEncounters(wordId: string): EncounterData {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];

  if (mastery?.encounters) {
    return mastery.encounters;
  }

  return { ...DEFAULT_ENCOUNTER_DATA };
}

/**
 * Check if a word is due for review (SM-2)
 */
export function isWordDueForReview(wordId: string): boolean {
  const sm2 = getWordSM2State(wordId);
  return isDue(sm2);
}

/**
 * Get the number of days a word is overdue
 */
export function getWordDaysOverdue(wordId: string): number {
  const sm2 = getWordSM2State(wordId);
  return getDaysOverdue(sm2);
}

/**
 * Get all words that are due for review
 */
export function getDueWords(): string[] {
  const data = getProgress();
  const dueWords: string[] = [];

  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    if (mastery.sm2 && isDue(mastery.sm2)) {
      dueWords.push(wordId);
    }
  }

  // Sort by most overdue first
  dueWords.sort((a, b) => {
    const aOverdue = getWordDaysOverdue(a);
    const bOverdue = getWordDaysOverdue(b);
    return bOverdue - aOverdue;
  });

  return dueWords;
}

/**
 * Get count of words due for review
 */
export function getDueWordCount(): number {
  return getDueWords().length;
}

/**
 * Record a review result using SM-2 algorithm
 */
export function recordSM2Review(
  wordId: string,
  quality: SM2Quality,
  encounterType: 'exercise' | 'flashcard' | 'reading' | 'listening' = 'exercise'
): void {
  const data = getProgress();
  const now = new Date().toISOString();

  // Get or create mastery entry
  const mastery: WordMastery = data.wordMastery[wordId] || {
    strength: 0,
    lastPracticed: now,
    timesCorrect: 0,
    timesIncorrect: 0,
    challengesPassed: 0,
    lastChallengeDate: null,
    sm2: { ...DEFAULT_SM2_STATE },
    encounters: { ...DEFAULT_ENCOUNTER_DATA },
  };

  // Get current SM-2 state
  const currentSM2: SM2Data = mastery.sm2 || {
    easeFactor: DEFAULT_SM2_STATE.easeFactor,
    interval: DEFAULT_SM2_STATE.interval,
    repetitions: DEFAULT_SM2_STATE.repetitions,
    nextReviewDate: DEFAULT_SM2_STATE.nextReviewDate,
  };

  // Calculate new SM-2 state
  const newSM2 = calculateSM2(currentSM2, quality);
  mastery.sm2 = newSM2;

  // Update encounters
  const currentEncounters = mastery.encounters || { ...DEFAULT_ENCOUNTER_DATA };
  mastery.encounters = addEncounterToData(currentEncounters, encounterType);

  // Also update legacy strength for backward compatibility
  const isCorrect = quality >= 3;
  mastery.strength = calculateStrengthChange(mastery.strength, isCorrect);
  mastery.lastPracticed = now;

  if (isCorrect) {
    mastery.timesCorrect += 1;
  } else {
    mastery.timesIncorrect += 1;
  }

  data.wordMastery[wordId] = mastery;
  saveProgress(data);
}

/**
 * Record an exercise result with SM-2 (simplified interface)
 */
export function recordExerciseWithSM2(
  exerciseId: string,
  lessonId: string,
  itemIds: string[],
  isCorrect: boolean,
  wasHard: boolean = false
): void {
  // Use legacy function for exercise/lesson tracking
  recordExerciseResult(exerciseId, lessonId, itemIds, isCorrect);

  // Additionally update SM-2 for each word
  const quality = simpleToQuality(isCorrect, wasHard);
  for (const itemId of itemIds) {
    const data = getProgress();
    const mastery = data.wordMastery[itemId];

    if (mastery) {
      // Get current SM-2 state
      const currentSM2: SM2Data = mastery.sm2 || {
        easeFactor: DEFAULT_SM2_STATE.easeFactor,
        interval: DEFAULT_SM2_STATE.interval,
        repetitions: DEFAULT_SM2_STATE.repetitions,
        nextReviewDate: DEFAULT_SM2_STATE.nextReviewDate,
      };

      // Calculate new SM-2 state
      const newSM2 = calculateSM2(currentSM2, quality);
      mastery.sm2 = newSM2;

      // Update encounters
      const currentEncounters = mastery.encounters || { ...DEFAULT_ENCOUNTER_DATA };
      mastery.encounters = addEncounterToData(currentEncounters, 'exercise');

      data.wordMastery[itemId] = mastery;
      saveProgress(data);
    }
  }
}

/**
 * Get review statistics
 */
export function getReviewStats(): {
  dueToday: number;
  overdueCount: number;
  reviewedToday: number;
  upcomingWeek: number;
} {
  const data = getProgress();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  let dueToday = 0;
  let overdueCount = 0;
  let reviewedToday = 0;
  let upcomingWeek = 0;

  for (const mastery of Object.values(data.wordMastery)) {
    if (!mastery.sm2) continue;

    const nextReview = mastery.sm2.nextReviewDate;

    // Check if due today or overdue
    if (nextReview <= todayEnd.getTime()) {
      if (nextReview < todayStart.getTime()) {
        overdueCount++;
      }
      dueToday++;
    }

    // Check if due in the next week (but not today)
    if (nextReview > todayEnd.getTime() && nextReview <= weekFromNow) {
      upcomingWeek++;
    }

    // Check if reviewed today (by looking at lastPracticed)
    const lastPracticed = new Date(mastery.lastPracticed).getTime();
    if (lastPracticed >= todayStart.getTime() && lastPracticed <= todayEnd.getTime()) {
      reviewedToday++;
    }
  }

  return {
    dueToday,
    overdueCount,
    reviewedToday,
    upcomingWeek,
  };
}

// ============================================================================
// FIRe Spaced Repetition Functions
// ============================================================================

// Cached encompassing graph (built lazily)
let cachedEncompassingGraph: EncompassingGraph | null = null;

/**
 * Set the encompassing graph for FIRe credit/penalty flow.
 * Should be called once when the app initializes with lesson data.
 */
export function setEncompassingGraph(graph: EncompassingGraph): void {
  cachedEncompassingGraph = graph;
}

/**
 * Get the cached encompassing graph.
 * Returns null if not yet initialized.
 */
export function getEncompassingGraph(): EncompassingGraph | null {
  return cachedEncompassingGraph;
}

/**
 * Get the FIRe state for a word, initializing if needed
 */
export function getWordFIReState(wordId: string): FIReState {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];

  if (mastery?.fire) {
    return mastery.fire;
  }

  // Return default state for new words
  return createFIReState();
}

/**
 * Check if a word is due for review using FIRe algorithm
 */
export function isWordDueForFIReReview(wordId: string): boolean {
  const fire = getWordFIReState(wordId);
  return isFIReDue(fire, DEFAULT_FIRE_CONFIG);
}

/**
 * Get the number of days a word is overdue (FIRe)
 */
export function getWordFIReDaysOverdue(wordId: string): number {
  const fire = getWordFIReState(wordId);
  return getFIReDaysOverdue(fire);
}

/**
 * Get the estimated retention for a word (0-1)
 */
export function getWordRetention(wordId: string): number {
  const fire = getWordFIReState(wordId);
  return getDecayedMemory(fire);
}

/**
 * Get all words that are due for review (FIRe)
 */
export function getFIReDueWords(): string[] {
  const data = getProgress();
  const dueWords: string[] = [];

  for (const [wordId, mastery] of Object.entries(data.wordMastery)) {
    if (mastery.fire && isFIReDue(mastery.fire, DEFAULT_FIRE_CONFIG)) {
      dueWords.push(wordId);
    }
  }

  // Sort by most overdue first
  dueWords.sort((a, b) => {
    const aOverdue = getWordFIReDaysOverdue(a);
    const bOverdue = getWordFIReDaysOverdue(b);
    return bOverdue - aOverdue;
  });

  return dueWords;
}

/**
 * Get count of words due for review (FIRe)
 */
export function getFIReDueWordCount(): number {
  return getFIReDueWords().length;
}

/**
 * Record a review result using FIRe algorithm.
 * Also handles credit/penalty flow through the encompassing graph.
 */
export function recordFIReReview(
  wordId: string,
  isCorrect: boolean,
  quality: number = isCorrect ? 1 : 0,
  encounterType: 'exercise' | 'flashcard' | 'reading' | 'listening' = 'exercise'
): void {
  const data = getProgress();
  const now = new Date().toISOString();

  // Get or create mastery entry
  const mastery: WordMastery = data.wordMastery[wordId] || {
    strength: 0,
    lastPracticed: now,
    timesCorrect: 0,
    timesIncorrect: 0,
    challengesPassed: 0,
    lastChallengeDate: null,
    fire: createFIReState(),
    encounters: { ...DEFAULT_ENCOUNTER_DATA },
  };

  // Get current FIRe state
  const currentFIRe: FIReState = mastery.fire || createFIReState();

  // Calculate new FIRe state
  const newFIRe = updateFIReState(currentFIRe, isCorrect, quality, DEFAULT_FIRE_CONFIG);
  mastery.fire = newFIRe;

  // Update encounters
  const currentEncounters = mastery.encounters || { ...DEFAULT_ENCOUNTER_DATA };
  mastery.encounters = addEncounterToData(currentEncounters, encounterType);

  // Also update legacy strength for backward compatibility
  mastery.strength = calculateStrengthChange(mastery.strength, isCorrect);
  mastery.lastPracticed = now;

  if (isCorrect) {
    mastery.timesCorrect += 1;
  } else {
    mastery.timesIncorrect += 1;
  }

  data.wordMastery[wordId] = mastery;

  // Handle credit/penalty flow through encompassing graph
  if (cachedEncompassingGraph) {
    // Create a mutable copy of fire states for flow
    const fireStates: Record<string, FIReState> = {};
    for (const [id, m] of Object.entries(data.wordMastery)) {
      if (m.fire) {
        fireStates[id] = { ...m.fire };
      }
    }

    if (isCorrect) {
      // Flow credit down to encompassed items
      flowCreditDown(wordId, 1.0, cachedEncompassingGraph, fireStates, DEFAULT_FIRE_CONFIG);
    } else {
      // Flow penalty up to encompassing items
      flowPenaltyUp(wordId, 1.0, cachedEncompassingGraph, fireStates, DEFAULT_FIRE_CONFIG);
    }

    // Apply updated fire states back to mastery
    for (const [id, fireState] of Object.entries(fireStates)) {
      if (data.wordMastery[id] && id !== wordId) {
        data.wordMastery[id].fire = fireState;
      }
    }
  }

  saveProgress(data);
}

/**
 * Record an exercise result with FIRe (simplified interface)
 */
export function recordExerciseWithFIRe(
  exerciseId: string,
  lessonId: string,
  itemIds: string[],
  isCorrect: boolean,
  wasHard: boolean = false
): void {
  // Use legacy function for exercise/lesson tracking
  recordExerciseResult(exerciseId, lessonId, itemIds, isCorrect);

  // Additionally update FIRe for each word
  const quality = fireSimpleToQuality(isCorrect, wasHard);
  for (const itemId of itemIds) {
    const data = getProgress();
    const mastery = data.wordMastery[itemId];

    if (mastery) {
      // Get current FIRe state
      const currentFIRe: FIReState = mastery.fire || createFIReState();

      // Calculate new FIRe state
      const newFIRe = updateFIReState(currentFIRe, isCorrect, quality, DEFAULT_FIRE_CONFIG);
      mastery.fire = newFIRe;

      // Update encounters
      const currentEncounters = mastery.encounters || { ...DEFAULT_ENCOUNTER_DATA };
      mastery.encounters = addEncounterToData(currentEncounters, 'exercise');

      data.wordMastery[itemId] = mastery;
      saveProgress(data);
    }
  }

  // Handle credit/penalty flow through encompassing graph
  if (cachedEncompassingGraph) {
    const data = getProgress();

    // Create a mutable copy of fire states for flow
    const fireStates: Record<string, FIReState> = {};
    for (const [id, m] of Object.entries(data.wordMastery)) {
      if (m.fire) {
        fireStates[id] = { ...m.fire };
      }
    }

    // Flow credit/penalty for each item in the exercise
    for (const itemId of itemIds) {
      if (isCorrect) {
        flowCreditDown(itemId, 1.0, cachedEncompassingGraph, fireStates, DEFAULT_FIRE_CONFIG);
      } else {
        flowPenaltyUp(itemId, 1.0, cachedEncompassingGraph, fireStates, DEFAULT_FIRE_CONFIG);
      }
    }

    // Apply updated fire states back to mastery
    for (const [id, fireState] of Object.entries(fireStates)) {
      if (data.wordMastery[id] && !itemIds.includes(id)) {
        data.wordMastery[id].fire = fireState;
      }
    }

    saveProgress(data);
  }
}

/**
 * Get review statistics using FIRe algorithm
 */
export function getFIReReviewStats(): {
  dueToday: number;
  overdueCount: number;
  reviewedToday: number;
  upcomingWeek: number;
} {
  const data = getProgress();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let dueToday = 0;
  let overdueCount = 0;
  let reviewedToday = 0;
  const upcomingWeek = 0; // FIRe doesn't have fixed next review dates

  for (const mastery of Object.values(data.wordMastery)) {
    if (!mastery.fire) continue;

    // Check if due using FIRe
    if (isFIReDue(mastery.fire, DEFAULT_FIRE_CONFIG)) {
      dueToday++;
      if (getFIReDaysOverdue(mastery.fire) > 0) {
        overdueCount++;
      }
    }

    // Check if reviewed today (by looking at lastPracticed)
    const lastPracticed = new Date(mastery.lastPracticed).getTime();
    if (lastPracticed >= todayStart.getTime() && lastPracticed <= todayEnd.getTime()) {
      reviewedToday++;
    }
  }

  return {
    dueToday,
    overdueCount,
    reviewedToday,
    upcomingWeek,
  };
}

/**
 * Get mastery level for a word using FIRe state
 */
export function getWordMasteryLevelFIRe(wordId: string): MasteryLevel {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];

  if (!mastery?.fire || mastery.fire.repNum === 0) {
    return 'new';
  }

  const fire = mastery.fire;
  const memory = getDecayedMemory(fire);

  // Check for decay (low memory)
  if (memory < 0.3 && fire.repNum >= 1) {
    return 'decaying';
  }

  // Based on repNum thresholds
  if (fire.repNum >= 3) {
    return 'mastered';
  }
  if (fire.repNum >= 1.5) {
    return 'familiar';
  }
  return 'learning';
}

// ============================================================================
// Tashkeel Scaffolding Functions
// ============================================================================

/**
 * Get the appropriate tashkeel display level for a word based on its mastery.
 * 
 * This implements progressive scaffolding where:
 * - New/learning words show full tashkeel (maximum support)
 * - Familiar words show partial tashkeel (structural marks only)
 * - Mastered words show no tashkeel (full independence)
 * 
 * @param wordId The word ID to check
 * @returns The appropriate TashkeelLevel for display
 */
export function getWordTashkeelLevel(wordId: string): TashkeelLevel {
  const strength = getWordEffectiveStrength(wordId);
  return getTashkeelLevelForStrength(strength);
}

/**
 * Get tashkeel levels for multiple words at once.
 * Useful for batch processing exercises.
 * 
 * @param wordIds Array of word IDs
 * @returns Record mapping word IDs to their tashkeel levels
 */
export function getWordsTashkeelLevels(wordIds: string[]): Record<string, TashkeelLevel> {
  const result: Record<string, TashkeelLevel> = {};
  for (const wordId of wordIds) {
    result[wordId] = getWordTashkeelLevel(wordId);
  }
  return result;
}

// ============================================================================
// Progressive Difficulty Functions (Phase 1.2)
// ============================================================================

/**
 * Get the directional strength for a word, initializing if needed.
 * 
 * @param wordId The word ID
 * @returns DirectionalStrength data
 */
export function getWordDirectionalStrength(wordId: string): DirectionalStrengthData {
  const data = getProgress();
  const mastery = data.wordMastery[wordId];

  if (mastery?.directionalStrength) {
    return mastery.directionalStrength;
  }

  // Return default for new words
  return { ...DEFAULT_DIRECTIONAL_STRENGTH };
}

/**
 * Record an exercise result with directional strength tracking.
 * Updates both the legacy strength and the new directional strength.
 * 
 * @param exerciseId The exercise ID
 * @param lessonId The lesson ID
 * @param itemIds Word IDs tested in this exercise
 * @param isCorrect Whether the answer was correct
 * @param exerciseType The type of exercise (determines direction)
 */
export function recordExerciseWithDirection(
  exerciseId: string,
  lessonId: string,
  itemIds: string[],
  isCorrect: boolean,
  exerciseType: ExerciseType
): void {
  // Use existing function for legacy tracking
  recordExerciseResult(exerciseId, lessonId, itemIds, isCorrect);

  // Additionally update directional strength for each word
  const direction = getExerciseDirection(exerciseType);
  
  for (const itemId of itemIds) {
    const data = getProgress();
    const mastery = data.wordMastery[itemId];

    if (mastery) {
      // Get current directional strength or default
      const currentDirectional = mastery.directionalStrength || { ...DEFAULT_DIRECTIONAL_STRENGTH };
      
      // Get the current level for this direction
      const currentLevel = direction === 'recognition'
        ? currentDirectional.recognitionLevel
        : currentDirectional.productionLevel;
      
      // Update directional strength
      const updatedDirectional = updateDirectionalStrength(
        currentDirectional,
        direction,
        isCorrect,
        currentLevel
      );

      // Also update legacy strength for backward compatibility
      // Use combined strength as the legacy value
      const combinedStrength = getCombinedStrength(updatedDirectional);
      
      mastery.directionalStrength = updatedDirectional;
      mastery.strength = combinedStrength;
      
      data.wordMastery[itemId] = mastery;
      saveProgress(data);
    }
  }
}

/**
 * Get directional strength for multiple words at once.
 * 
 * @param wordIds Array of word IDs
 * @returns Record mapping word IDs to their directional strength
 */
export function getWordsDirectionalStrength(
  wordIds: string[]
): Record<string, DirectionalStrengthData> {
  const result: Record<string, DirectionalStrengthData> = {};
  for (const wordId of wordIds) {
    result[wordId] = getWordDirectionalStrength(wordId);
  }
  return result;
}

/**
 * Get the difficulty level for a word in a specific direction.
 * 
 * @param wordId The word ID
 * @param direction 'recognition' or 'production'
 * @returns The current difficulty level
 */
export function getWordDifficultyLevel(
  wordId: string,
  direction: 'recognition' | 'production'
): DifficultyLevel {
  const directional = getWordDirectionalStrength(wordId);
  
  return direction === 'recognition'
    ? directional.recognitionLevel
    : directional.productionLevel;
}

/**
 * Check if a word needs practice in a specific direction.
 * Based on strength and time since last practice.
 * 
 * @param wordId The word ID
 * @param direction 'recognition' or 'production'
 * @returns Whether practice is needed
 */
export function wordNeedsPractice(
  wordId: string,
  direction: 'recognition' | 'production'
): boolean {
  const directional = getWordDirectionalStrength(wordId);
  const today = getLocalDateString();
  
  const lastPractice = direction === 'recognition'
    ? directional.lastRecognitionPractice
    : directional.lastProductionPractice;
  
  const strength = direction === 'recognition'
    ? directional.recognitionStrength
    : directional.productionStrength;
  
  // New words always need practice
  if (!lastPractice || strength === 0) {
    return true;
  }
  
  // Calculate days since practice
  const days = daysBetween(lastPractice.split('T')[0], today);
  
  // Review interval based on strength
  const level = direction === 'recognition'
    ? directional.recognitionLevel
    : directional.productionLevel;
  
  const intervals = {
    recognition: 1,
    cued_recall: 3,
    free_recall: 7,
  };
  
  return days >= intervals[level];
}

/**
 * Get words that need practice, sorted by priority.
 * Prioritizes:
 * 1. Words with weak recognition (foundation)
 * 2. Words with weak production
 * 3. Words due for review
 * 
 * @param wordIds Words to check
 * @param limit Maximum words to return
 * @returns Sorted list of word IDs needing practice
 */
export function getWordsPrioritizedForPractice(
  wordIds: string[],
  limit: number = 20
): string[] {
  const priorities: Array<{ wordId: string; priority: number }> = [];
  
  for (const wordId of wordIds) {
    const directional = getWordDirectionalStrength(wordId);
    
    // Calculate priority score (lower = higher priority)
    // Recognition is foundation, so weak recognition is highest priority
    let priority = 0;
    
    // New words (never practiced) get highest priority
    if (directional.recognitionStrength === 0) {
      priority = 0;
    }
    // Weak recognition
    else if (directional.recognitionStrength < 40) {
      priority = 10 + directional.recognitionStrength;
    }
    // Weak production (but recognition is ok)
    else if (directional.productionStrength < 40) {
      priority = 50 + directional.productionStrength;
    }
    // Due for review
    else if (wordNeedsPractice(wordId, 'recognition') || wordNeedsPractice(wordId, 'production')) {
      priority = 100 + getCombinedStrength(directional);
    }
    // Not urgent
    else {
      priority = 200 + getCombinedStrength(directional);
    }
    
    priorities.push({ wordId, priority });
  }
  
  // Sort by priority (lower = higher priority)
  priorities.sort((a, b) => a.priority - b.priority);
  
  return priorities.slice(0, limit).map(p => p.wordId);
}
