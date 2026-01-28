import { useMemo, useCallback, useEffect, startTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { FillBlankExercise } from '../components/exercise/FillBlankExercise';
import { TranslateExercise } from '../components/exercise/TranslateExercise';
import { WordMeaningExercise } from '../components/exercise/WordMeaningExercise';
import { ErrorCorrectionExercise } from '../components/exercise/ErrorCorrectionExercise';
import { MultiClozeExercise } from '../components/exercise/MultiClozeExercise';
import { SemanticFieldExercise } from '../components/exercise/SemanticFieldExercise';
import { SentenceUnscrambleExercise } from '../components/exercise/SentenceUnscrambleExercise';
import { ExerciseFeedback } from '../components/exercise/ExerciseFeedback';
import { ProgressDotsWithReview } from '../components/ui/ProgressBar';
import { ExerciseReview } from '../components/exercise/ExerciseReview';
import { Button } from '../components/ui/Button';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useProgress } from '../hooks/useProgress';
import { useAchievementContext } from '../contexts/AchievementContext';
import { fisherYatesShuffle } from '../lib/interleave';
import { getLessonIdFromExerciseId } from '../lib/contentStatsCore';
import { getChallengeConfig, applyChallenge } from '../lib/challengeUtils';
import { getEncouragingMessage } from '../lib/feedbackMessages';
import type {
  Exercise,
  ChallengeConfig,
  FillBlankExercise as FillBlankType,
  TranslateExercise as TranslateType,
  WordToMeaningExercise,
  MeaningToWordExercise,
  ErrorCorrectionExercise as ErrorCorrectionType,
  MultiClozeExercise as MultiClozeType,
  SemanticFieldExercise as SemanticFieldType,
  SentenceUnscrambleExercise as SentenceUnscrambleType,
} from '../types/exercise';
import type { ConfidenceLevel } from '../types/progress';

// Import Book 1 lesson content
import b1lesson01 from '../content/book1/lessons/lesson-01.json';
import b1lesson02 from '../content/book1/lessons/lesson-02.json';
import b1lesson03 from '../content/book1/lessons/lesson-03.json';
import b1lesson04 from '../content/book1/lessons/lesson-04.json';
import b1lesson05 from '../content/book1/lessons/lesson-05.json';
import b1lesson06 from '../content/book1/lessons/lesson-06.json';
import b1lesson07 from '../content/book1/lessons/lesson-07.json';
import b1lesson08 from '../content/book1/lessons/lesson-08.json';
import b1lesson09 from '../content/book1/lessons/lesson-09.json';
import b1lesson10 from '../content/book1/lessons/lesson-10.json';
import b1lesson11 from '../content/book1/lessons/lesson-11.json';
import b1lesson12 from '../content/book1/lessons/lesson-12.json';
import b1lesson13 from '../content/book1/lessons/lesson-13.json';
import b1lesson14 from '../content/book1/lessons/lesson-14.json';
import b1lesson15 from '../content/book1/lessons/lesson-15.json';
import b1lesson16 from '../content/book1/lessons/lesson-16.json';
import b1lesson17 from '../content/book1/lessons/lesson-17.json';
import b1lesson18 from '../content/book1/lessons/lesson-18.json';
import b1lesson19 from '../content/book1/lessons/lesson-19.json';
import b1lesson20 from '../content/book1/lessons/lesson-20.json';
import b1lesson21 from '../content/book1/lessons/lesson-21.json';
import b1lesson22 from '../content/book1/lessons/lesson-22.json';
import b1lesson23 from '../content/book1/lessons/lesson-23.json';
import b1lesson24 from '../content/book1/lessons/lesson-24.json';
import b1lesson25 from '../content/book1/lessons/lesson-25.json';
import b1lesson26 from '../content/book1/lessons/lesson-26.json';
import b1lesson27 from '../content/book1/lessons/lesson-27.json';
import b1lesson28 from '../content/book1/lessons/lesson-28.json';
import b1lesson29 from '../content/book1/lessons/lesson-29.json';
import b1lesson30 from '../content/book1/lessons/lesson-30.json';
import b1lesson31 from '../content/book1/lessons/lesson-31.json';
import b1lesson32 from '../content/book1/lessons/lesson-32.json';
import b1lesson33 from '../content/book1/lessons/lesson-33.json';
import b1lesson34 from '../content/book1/lessons/lesson-34.json';
import b1lesson35 from '../content/book1/lessons/lesson-35.json';

// Import Book 2 lesson content
import b2lesson01 from '../content/book2/lessons/lesson-01.json';
import b2lesson02 from '../content/book2/lessons/lesson-02.json';
import b2lesson03 from '../content/book2/lessons/lesson-03.json';
import b2lesson04 from '../content/book2/lessons/lesson-04.json';
import b2lesson05 from '../content/book2/lessons/lesson-05.json';
import b2lesson06 from '../content/book2/lessons/lesson-06.json';
import b2lesson07 from '../content/book2/lessons/lesson-07.json';
import b2lesson08 from '../content/book2/lessons/lesson-08.json';
import b2lesson09 from '../content/book2/lessons/lesson-09.json';
import b2lesson10 from '../content/book2/lessons/lesson-10.json';
import b2lesson11 from '../content/book2/lessons/lesson-11.json';
import b2lesson12 from '../content/book2/lessons/lesson-12.json';
import b2lesson13 from '../content/book2/lessons/lesson-13.json';
import b2lesson14 from '../content/book2/lessons/lesson-14.json';
import b2lesson15 from '../content/book2/lessons/lesson-15.json';
import b2lesson16 from '../content/book2/lessons/lesson-16.json';
import b2lesson17 from '../content/book2/lessons/lesson-17.json';
import b2lesson18 from '../content/book2/lessons/lesson-18.json';
import b2lesson19 from '../content/book2/lessons/lesson-19.json';
import b2lesson20 from '../content/book2/lessons/lesson-20.json';
import b2lesson21 from '../content/book2/lessons/lesson-21.json';
import b2lesson22 from '../content/book2/lessons/lesson-22.json';
import b2lesson23 from '../content/book2/lessons/lesson-23.json';
import b2lesson24 from '../content/book2/lessons/lesson-24.json';
import b2lesson25 from '../content/book2/lessons/lesson-25.json';
import b2lesson26 from '../content/book2/lessons/lesson-26.json';
import b2lesson27 from '../content/book2/lessons/lesson-27.json';
import b2lesson28 from '../content/book2/lessons/lesson-28.json';
import b2lesson29 from '../content/book2/lessons/lesson-29.json';
import b2lesson30 from '../content/book2/lessons/lesson-30.json';
import b2lesson31 from '../content/book2/lessons/lesson-31.json';
import b2lesson32 from '../content/book2/lessons/lesson-32.json';
import b2lesson33 from '../content/book2/lessons/lesson-33.json';
import b2lesson34 from '../content/book2/lessons/lesson-34.json';
import b2lesson35 from '../content/book2/lessons/lesson-35.json';
import b2lesson36 from '../content/book2/lessons/lesson-36.json';
import b2lesson37 from '../content/book2/lessons/lesson-37.json';
import b2lesson38 from '../content/book2/lessons/lesson-38.json';
import b2lesson39 from '../content/book2/lessons/lesson-39.json';
import b2lesson40 from '../content/book2/lessons/lesson-40.json';
import b2lesson41 from '../content/book2/lessons/lesson-41.json';
import b2lesson42 from '../content/book2/lessons/lesson-42.json';
import b2lesson43 from '../content/book2/lessons/lesson-43.json';
import b2lesson44 from '../content/book2/lessons/lesson-44.json';
import b2lesson45 from '../content/book2/lessons/lesson-45.json';
import b2lesson46 from '../content/book2/lessons/lesson-46.json';
import b2lesson47 from '../content/book2/lessons/lesson-47.json';
import b2lesson48 from '../content/book2/lessons/lesson-48.json';
import b2lesson49 from '../content/book2/lessons/lesson-49.json';

// Import Book 3 lesson content
import b3lesson01 from '../content/book3/lessons/lesson-01.json';
import b3lesson02 from '../content/book3/lessons/lesson-02.json';
import b3lesson03 from '../content/book3/lessons/lesson-03.json';
import b3lesson04 from '../content/book3/lessons/lesson-04.json';
import b3lesson05 from '../content/book3/lessons/lesson-05.json';
import b3lesson06 from '../content/book3/lessons/lesson-06.json';
import b3lesson07 from '../content/book3/lessons/lesson-07.json';
import b3lesson08 from '../content/book3/lessons/lesson-08.json';
import b3lesson09 from '../content/book3/lessons/lesson-09.json';
import b3lesson10 from '../content/book3/lessons/lesson-10.json';
import b3lesson11 from '../content/book3/lessons/lesson-11.json';
import b3lesson12 from '../content/book3/lessons/lesson-12.json';
import b3lesson13 from '../content/book3/lessons/lesson-13.json';
import b3lesson14 from '../content/book3/lessons/lesson-14.json';
import b3lesson15 from '../content/book3/lessons/lesson-15.json';
import b3lesson16 from '../content/book3/lessons/lesson-16.json';
import b3lesson17 from '../content/book3/lessons/lesson-17.json';
import b3lesson18 from '../content/book3/lessons/lesson-18.json';
import b3lesson19 from '../content/book3/lessons/lesson-19.json';
import b3lesson20 from '../content/book3/lessons/lesson-20.json';
import b3lesson21 from '../content/book3/lessons/lesson-21.json';
import b3lesson22 from '../content/book3/lessons/lesson-22.json';
import b3lesson23 from '../content/book3/lessons/lesson-23.json';
import b3lesson24 from '../content/book3/lessons/lesson-24.json';
import b3lesson25 from '../content/book3/lessons/lesson-25.json';
import b3lesson26 from '../content/book3/lessons/lesson-26.json';
import b3lesson27 from '../content/book3/lessons/lesson-27.json';
import b3lesson28 from '../content/book3/lessons/lesson-28.json';
import b3lesson29 from '../content/book3/lessons/lesson-29.json';
import b3lesson30 from '../content/book3/lessons/lesson-30.json';
import b3lesson31 from '../content/book3/lessons/lesson-31.json';
import b3lesson32 from '../content/book3/lessons/lesson-32.json';
import b3lesson33 from '../content/book3/lessons/lesson-33.json';
import b3lesson34 from '../content/book3/lessons/lesson-34.json';
import b3lesson35 from '../content/book3/lessons/lesson-35.json';
import b3lesson36 from '../content/book3/lessons/lesson-36.json';
import b3lesson37 from '../content/book3/lessons/lesson-37.json';
import b3lesson38 from '../content/book3/lessons/lesson-38.json';
import b3lesson39 from '../content/book3/lessons/lesson-39.json';
import b3lesson40 from '../content/book3/lessons/lesson-40.json';
import b3lesson41 from '../content/book3/lessons/lesson-41.json';
import b3lesson42 from '../content/book3/lessons/lesson-42.json';
import b3lesson43 from '../content/book3/lessons/lesson-43.json';
import b3lesson44 from '../content/book3/lessons/lesson-44.json';
import b3lesson45 from '../content/book3/lessons/lesson-45.json';
import b3lesson46 from '../content/book3/lessons/lesson-46.json';
import b3lesson47 from '../content/book3/lessons/lesson-47.json';
import b3lesson48 from '../content/book3/lessons/lesson-48.json';
import b3lesson49 from '../content/book3/lessons/lesson-49.json';
import b3lesson50 from '../content/book3/lessons/lesson-50.json';
import b3lesson51 from '../content/book3/lessons/lesson-51.json';
import b3lesson52 from '../content/book3/lessons/lesson-52.json';
import b3lesson53 from '../content/book3/lessons/lesson-53.json';
import b3lesson54 from '../content/book3/lessons/lesson-54.json';
import b3lesson55 from '../content/book3/lessons/lesson-55.json';
import b3lesson56 from '../content/book3/lessons/lesson-56.json';

interface LessonContent {
  id: string;
  exercises: Exercise[];
}

const lessons: Record<string, LessonContent> = {
  // Book 1
  'b1-l01': b1lesson01 as LessonContent,
  'b1-l02': b1lesson02 as LessonContent,
  'b1-l03': b1lesson03 as LessonContent,
  'b1-l04': b1lesson04 as LessonContent,
  'b1-l05': b1lesson05 as LessonContent,
  'b1-l06': b1lesson06 as LessonContent,
  'b1-l07': b1lesson07 as LessonContent,
  'b1-l08': b1lesson08 as LessonContent,
  'b1-l09': b1lesson09 as LessonContent,
  'b1-l10': b1lesson10 as LessonContent,
  'b1-l11': b1lesson11 as LessonContent,
  'b1-l12': b1lesson12 as LessonContent,
  'b1-l13': b1lesson13 as LessonContent,
  'b1-l14': b1lesson14 as LessonContent,
  'b1-l15': b1lesson15 as LessonContent,
  'b1-l16': b1lesson16 as LessonContent,
  'b1-l17': b1lesson17 as LessonContent,
  'b1-l18': b1lesson18 as LessonContent,
  'b1-l19': b1lesson19 as LessonContent,
  'b1-l20': b1lesson20 as LessonContent,
  'b1-l21': b1lesson21 as LessonContent,
  'b1-l22': b1lesson22 as LessonContent,
  'b1-l23': b1lesson23 as LessonContent,
  'b1-l24': b1lesson24 as LessonContent,
  'b1-l25': b1lesson25 as LessonContent,
  'b1-l26': b1lesson26 as LessonContent,
  'b1-l27': b1lesson27 as LessonContent,
  'b1-l28': b1lesson28 as LessonContent,
  'b1-l29': b1lesson29 as LessonContent,
  'b1-l30': b1lesson30 as LessonContent,
  'b1-l31': b1lesson31 as LessonContent,
  'b1-l32': b1lesson32 as LessonContent,
  'b1-l33': b1lesson33 as LessonContent,
  'b1-l34': b1lesson34 as LessonContent,
  'b1-l35': b1lesson35 as LessonContent,
  // Book 2
  'b2-l01': b2lesson01 as LessonContent,
  'b2-l02': b2lesson02 as LessonContent,
  'b2-l03': b2lesson03 as LessonContent,
  'b2-l04': b2lesson04 as LessonContent,
  'b2-l05': b2lesson05 as LessonContent,
  'b2-l06': b2lesson06 as LessonContent,
  'b2-l07': b2lesson07 as LessonContent,
  'b2-l08': b2lesson08 as LessonContent,
  'b2-l09': b2lesson09 as LessonContent,
  'b2-l10': b2lesson10 as LessonContent,
  'b2-l11': b2lesson11 as LessonContent,
  'b2-l12': b2lesson12 as LessonContent,
  'b2-l13': b2lesson13 as LessonContent,
  'b2-l14': b2lesson14 as LessonContent,
  'b2-l15': b2lesson15 as LessonContent,
  'b2-l16': b2lesson16 as LessonContent,
  'b2-l17': b2lesson17 as LessonContent,
  'b2-l18': b2lesson18 as LessonContent,
  'b2-l19': b2lesson19 as LessonContent,
  'b2-l20': b2lesson20 as LessonContent,
  'b2-l21': b2lesson21 as LessonContent,
  'b2-l22': b2lesson22 as LessonContent,
  'b2-l23': b2lesson23 as LessonContent,
  'b2-l24': b2lesson24 as LessonContent,
  'b2-l25': b2lesson25 as LessonContent,
  'b2-l26': b2lesson26 as LessonContent,
  'b2-l27': b2lesson27 as LessonContent,
  'b2-l28': b2lesson28 as LessonContent,
  'b2-l29': b2lesson29 as LessonContent,
  'b2-l30': b2lesson30 as LessonContent,
  'b2-l31': b2lesson31 as LessonContent,
  'b2-l32': b2lesson32 as LessonContent,
  'b2-l33': b2lesson33 as LessonContent,
  'b2-l34': b2lesson34 as LessonContent,
  'b2-l35': b2lesson35 as LessonContent,
  'b2-l36': b2lesson36 as LessonContent,
  'b2-l37': b2lesson37 as LessonContent,
  'b2-l38': b2lesson38 as LessonContent,
  'b2-l39': b2lesson39 as LessonContent,
  'b2-l40': b2lesson40 as LessonContent,
  'b2-l41': b2lesson41 as LessonContent,
  'b2-l42': b2lesson42 as LessonContent,
  'b2-l43': b2lesson43 as LessonContent,
  'b2-l44': b2lesson44 as LessonContent,
  'b2-l45': b2lesson45 as LessonContent,
  'b2-l46': b2lesson46 as LessonContent,
  'b2-l47': b2lesson47 as LessonContent,
  'b2-l48': b2lesson48 as LessonContent,
  'b2-l49': b2lesson49 as LessonContent,
  // Book 3
  'b3-l01': b3lesson01 as LessonContent,
  'b3-l02': b3lesson02 as LessonContent,
  'b3-l03': b3lesson03 as LessonContent,
  'b3-l04': b3lesson04 as LessonContent,
  'b3-l05': b3lesson05 as LessonContent,
  'b3-l06': b3lesson06 as LessonContent,
  'b3-l07': b3lesson07 as LessonContent,
  'b3-l08': b3lesson08 as LessonContent,
  'b3-l09': b3lesson09 as LessonContent,
  'b3-l10': b3lesson10 as LessonContent,
  'b3-l11': b3lesson11 as LessonContent,
  'b3-l12': b3lesson12 as LessonContent,
  'b3-l13': b3lesson13 as LessonContent,
  'b3-l14': b3lesson14 as LessonContent,
  'b3-l15': b3lesson15 as LessonContent,
  'b3-l16': b3lesson16 as LessonContent,
  'b3-l17': b3lesson17 as LessonContent,
  'b3-l18': b3lesson18 as LessonContent,
  'b3-l19': b3lesson19 as LessonContent,
  'b3-l20': b3lesson20 as LessonContent,
  'b3-l21': b3lesson21 as LessonContent,
  'b3-l22': b3lesson22 as LessonContent,
  'b3-l23': b3lesson23 as LessonContent,
  'b3-l24': b3lesson24 as LessonContent,
  'b3-l25': b3lesson25 as LessonContent,
  'b3-l26': b3lesson26 as LessonContent,
  'b3-l27': b3lesson27 as LessonContent,
  'b3-l28': b3lesson28 as LessonContent,
  'b3-l29': b3lesson29 as LessonContent,
  'b3-l30': b3lesson30 as LessonContent,
  'b3-l31': b3lesson31 as LessonContent,
  'b3-l32': b3lesson32 as LessonContent,
  'b3-l33': b3lesson33 as LessonContent,
  'b3-l34': b3lesson34 as LessonContent,
  'b3-l35': b3lesson35 as LessonContent,
  'b3-l36': b3lesson36 as LessonContent,
  'b3-l37': b3lesson37 as LessonContent,
  'b3-l38': b3lesson38 as LessonContent,
  'b3-l39': b3lesson39 as LessonContent,
  'b3-l40': b3lesson40 as LessonContent,
  'b3-l41': b3lesson41 as LessonContent,
  'b3-l42': b3lesson42 as LessonContent,
  'b3-l43': b3lesson43 as LessonContent,
  'b3-l44': b3lesson44 as LessonContent,
  'b3-l45': b3lesson45 as LessonContent,
  'b3-l46': b3lesson46 as LessonContent,
  'b3-l47': b3lesson47 as LessonContent,
  'b3-l48': b3lesson48 as LessonContent,
  'b3-l49': b3lesson49 as LessonContent,
  'b3-l50': b3lesson50 as LessonContent,
  'b3-l51': b3lesson51 as LessonContent,
  'b3-l52': b3lesson52 as LessonContent,
  'b3-l53': b3lesson53 as LessonContent,
  'b3-l54': b3lesson54 as LessonContent,
  'b3-l55': b3lesson55 as LessonContent,
  'b3-l56': b3lesson56 as LessonContent,
};

// Get exercises from specified lesson or mix from all
function getExercises(lessonId?: string | null, count: number = 10): Exercise[] {
  if (lessonId && lessons[lessonId]) {
    // Return ALL exercises for specific lesson practice (shuffled)
    // No limit - user should practice all exercises in the lesson
    const lessonExercises = [...lessons[lessonId].exercises];
    return fisherYatesShuffle(lessonExercises);
  }

  // Mix exercises from all available lessons (limited for variety)
  const allExercises: Exercise[] = [];
  Object.values(lessons).forEach(lesson => {
    allExercises.push(...lesson.exercises);
  });

  // Shuffle using Fisher-Yates and take requested count
  return fisherYatesShuffle(allExercises).slice(0, count);
}

// Maximum lessons per book
const BOOK_MAX_LESSONS: Record<number, number> = {
  1: 35,
  2: 49,
  3: 56,
};

// Get the next lesson ID, or null if at the end
function getNextLessonId(currentLessonId: string | null): string | null {
  if (!currentLessonId) return null;

  // Parse lesson ID format: b{book}-l{lesson} (e.g., b1-l01)
  const match = currentLessonId.match(/^b(\d+)-l(\d+)$/);
  if (!match) return null;

  const book = parseInt(match[1], 10);
  const lesson = parseInt(match[2], 10);
  const maxLessons = BOOK_MAX_LESSONS[book];

  if (!maxLessons) return null;

  // Check if there's a next lesson in the same book
  if (lesson < maxLessons) {
    const nextLesson = (lesson + 1).toString().padStart(2, '0');
    const nextId = `b${book}-l${nextLesson}`;
    return lessons[nextId] ? nextId : null;
  }

  // Check if there's a next book
  const nextBook = book + 1;
  if (BOOK_MAX_LESSONS[nextBook]) {
    const nextId = `b${nextBook}-l01`;
    return lessons[nextId] ? nextId : null;
  }

  return null;
}

export function PracticeSession() {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const { recordExerciseWithDirection, recordChallengeExercise, getWordStrength } = useProgress();

  // Learning science features - can be enabled via URL params
  // ?generation=1 enables generation-first mode (try without hints)
  // ?confidence=1 enables confidence rating (metacognition)
  const enableGeneration = searchParams.get('generation') === '1';
  const enableConfidence = searchParams.get('confidence') === '1';

  // Get shuffled exercises - memoized to prevent re-shuffle on re-render
  // For specific lessons, returns ALL exercises; for mixed practice, limits to 10
  const exercises = useMemo(
    () => getExercises(lessonId),
    [lessonId]
  );

  const session = usePracticeSession(exercises);

  // Compute challenge config for current exercise
  const currentExercise = session.currentExercise;
  const challengeConfig: ChallengeConfig = useMemo(() => {
    if (!currentExercise) {
      return {
        isChallenge: false,
        timerSeconds: 0,
        requireTashkeel: false,
        hideEnglishHint: false,
        reversedDirection: false,
      };
    }
    return getChallengeConfig(currentExercise, getWordStrength);
  }, [currentExercise, getWordStrength]);

  // Apply challenge transformations (e.g., reverse direction)
  const displayExercise = useMemo(() => {
    if (!currentExercise) return null;
    return applyChallenge(currentExercise, challengeConfig);
  }, [currentExercise, challengeConfig]);

  const handleExerciseComplete = useCallback((
    isCorrect: boolean,
    userAnswer: string,
    metadata?: {
      confidence?: ConfidenceLevel;
      generatedWithoutHints?: boolean;
      responseTimeMs?: number;
    }
  ) => {
    const exercise = session.currentExercise;
    if (exercise) {
      // Record progress to localStorage
      const exerciseLessonId = lessonId || getLessonIdFromExerciseId(exercise.id);

      // Use challenge scoring if this is a challenge
      if (challengeConfig.isChallenge) {
        recordChallengeExercise(exercise.id, exerciseLessonId, exercise.itemIds, isCorrect);
      } else {
        // Use directional strength tracking (Phase 1.2 - Progressive Difficulty)
        recordExerciseWithDirection(exercise.id, exerciseLessonId, exercise.itemIds, isCorrect, exercise.type);
      }
    }

    // Pass metadata to session for tracking generation/confidence stats
    // User will manually advance via Continue button
    session.recordAnswer(isCorrect, userAnswer, metadata);
  }, [session, lessonId, recordExerciseWithDirection, recordChallengeExercise, challengeConfig.isChallenge]);

  // Keyboard navigation for review mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && session.canGoBack) {
        e.preventDefault();
        session.goToPrevious();
      } else if (e.key === 'ArrowRight' && session.canGoForward) {
        e.preventDefault();
        session.goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.canGoBack, session.canGoForward, session.goToPrevious, session.goToNext]);

  // Navigate to a specific exercise via progress dots
  const handleNavigate = useCallback((index: number) => {
    if (index < session.currentIndex) {
      // Navigating to a completed exercise
      while (session.viewIndex !== index) {
        if (session.viewIndex > index) {
          session.goToPrevious();
        } else {
          session.goToNext();
        }
      }
    } else if (index === session.currentIndex) {
      // Navigate back to current active exercise
      while (session.viewIndex < session.currentIndex) {
        session.goToNext();
      }
    }
  }, [session]);

  // Get result for currently viewed exercise (when reviewing)
  const reviewResult = session.isReviewing ? session.getResultForExercise(session.viewIndex) : null;

  // Session complete - show summary
  if (session.isComplete) {
    return (
      <SessionSummary
        correctCount={session.correctCount}
        totalCount={session.totalExercises}
        accuracy={session.accuracy}
        bestStreak={session.bestStreak}
        incorrectExercises={session.getIncorrectExercises()}
        onRestart={session.restart}
        onPracticeIncorrect={() => {
          // TODO: Practice only incorrect exercises
          session.restart();
        }}
        lessonId={lessonId}
        generationStats={enableGeneration ? session.generationStats : undefined}
        confidenceStats={enableConfidence ? session.confidenceStats : undefined}
      />
    );
  }

  if (!displayExercise) return null;

  return (
    <>
      <Header title="Practice" titleArabic="تَمْرِين" />
      <PageContainer>
        {/* Learning mode indicator */}
        {(enableGeneration || enableConfidence) && (
          <div className="flex items-center gap-2 mb-4 text-xs">
            {enableGeneration && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-[var(--color-primary)] rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generation Mode
              </span>
            )}
            {enableConfidence && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-[var(--color-gold)] rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Confidence Rating
              </span>
            )}
          </div>
        )}

        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--color-ink-muted)]">
              {session.isReviewing ? (
                <>Reviewing Exercise {session.viewIndex + 1}</>
              ) : (
                <>Exercise {session.currentIndex + 1} of {session.totalExercises}</>
              )}
            </span>
            <div className="flex items-center gap-4">
              {session.currentStreak >= 2 && !session.isReviewing && (
                <span className="text-sm font-medium text-[var(--color-gold)] animate-scale-in">
                  {session.currentStreak} streak
                </span>
              )}
              <span className="text-sm font-medium text-[var(--color-success)]">
                {session.correctCount} correct
              </span>
            </div>
          </div>
          <ProgressDotsWithReview
            viewIndex={session.viewIndex}
            currentIndex={session.currentIndex}
            total={session.totalExercises}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Navigation controls for review mode */}
        {(session.canGoBack || session.canGoForward) && (
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={session.goToPrevious}
              disabled={!session.canGoBack}
              className="flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>

            {session.isReviewing && (
              <span className="text-xs text-[var(--color-ink-muted)]">
                Use arrow keys to navigate
              </span>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={session.goToNext}
              disabled={!session.canGoForward}
              className="flex items-center gap-1"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}

        {/* Review mode - show read-only exercise */}
        {session.isReviewing && session.viewingExercise && reviewResult && (
          <ExerciseReview
            exercise={session.viewingExercise}
            userAnswer={reviewResult.userAnswer}
            correctAnswer={reviewResult.correctAnswer}
            isCorrect={reviewResult.isCorrect}
          />
        )}

        {/* Active exercise - key includes retryTrigger to force re-mount on retry */}
        {!session.isReviewing && (
          <div key={`${displayExercise.id}-${session.retryTrigger}`} className="animate-slide-up">
            {displayExercise.type === 'fill-blank' && (
              <FillBlankExercise
                exercise={displayExercise as FillBlankType}
                onComplete={handleExerciseComplete}
                challengeConfig={challengeConfig}
                enableGeneration={enableGeneration}
                enableConfidence={enableConfidence}
                showFeedback={false}
              />
            )}
            {displayExercise.type === 'translate-to-arabic' && (
              <TranslateExercise
                exercise={displayExercise as TranslateType}
                onComplete={handleExerciseComplete}
                challengeConfig={challengeConfig}
                enableGeneration={enableGeneration}
                enableConfidence={enableConfidence}
                showFeedback={false}
              />
            )}
            {(displayExercise.type === 'word-to-meaning' || displayExercise.type === 'meaning-to-word') && (
              <WordMeaningExercise
                exercise={displayExercise as WordToMeaningExercise | MeaningToWordExercise}
                onComplete={handleExerciseComplete}
                challengeConfig={challengeConfig}
                enableGeneration={enableGeneration}
                enableConfidence={enableConfidence}
                showFeedback={false}
              />
            )}
            {displayExercise.type === 'error-correction' && (
              <ErrorCorrectionExercise
                exercise={displayExercise as ErrorCorrectionType}
                onComplete={handleExerciseComplete}
                showFeedback={false}
              />
            )}
            {displayExercise.type === 'multi-cloze' && (
              <MultiClozeExercise
                exercise={displayExercise as MultiClozeType}
                onComplete={handleExerciseComplete}
                showFeedback={false}
              />
            )}
            {displayExercise.type === 'semantic-field' && (
              <SemanticFieldExercise
                exercise={displayExercise as SemanticFieldType}
                onComplete={handleExerciseComplete}
                showFeedback={false}
              />
            )}
            {displayExercise.type === 'sentence-unscramble' && (
              <SentenceUnscrambleExercise
                exercise={displayExercise as SentenceUnscrambleType}
                onComplete={handleExerciseComplete}
                showFeedback={false}
              />
            )}
          </div>
        )}

        {/* Retry mode - show hint and Try Again button (only when not reviewing) */}
        {!session.isReviewing && session.isRetrying && session.currentHint && !session.currentHint.showFullAnswer && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <ExerciseFeedback
              isCorrect={false}
              correctAnswer={'answer' in displayExercise ? (displayExercise as { answer: string }).answer : ''}
              userAnswer={session.lastIncorrectAnswer || ''}
              retryMode={true}
              retryHint={session.currentHint}
            />
            <Button
              onClick={() => session.retryExercise()}
              fullWidth
              size="lg"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Max retries reached - show full answer and Continue button (only when not reviewing) */}
        {!session.isReviewing && session.isRetrying && session.currentHint?.showFullAnswer && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <ExerciseFeedback
              isCorrect={false}
              correctAnswer={'answer' in displayExercise ? (displayExercise as { answer: string }).answer : ''}
              userAnswer={session.lastIncorrectAnswer || ''}
              retryMode={true}
              retryHint={session.currentHint}
            />
            <Button
              onClick={() => session.advanceToNext()}
              fullWidth
              size="lg"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Success feedback - shown after correct answer (only when not reviewing) */}
        {!session.isReviewing && session.showingFeedback && !session.isRetrying && session.lastResult?.isCorrect && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <ExerciseFeedback
              isCorrect={true}
              correctAnswer={'answer' in displayExercise ? (displayExercise as { answer: string }).answer : ''}
              userAnswer={session.lastResult.userAnswer}
              succeededAfterRetries={session.retryAttemptCount > 0}
              retryCount={session.retryAttemptCount}
            />
            <Button
              onClick={() => session.advanceToNext()}
              fullWidth
              size="lg"
            >
              Continue
            </Button>
          </div>
        )}
      </PageContainer>
      <BottomNav />
    </>
  );
}

// Session Summary Component
interface SessionSummaryProps {
  correctCount: number;
  totalCount: number;
  accuracy: number;
  bestStreak: number;
  incorrectExercises: Exercise[];
  onRestart: () => void;
  onPracticeIncorrect: () => void;
  lessonId: string | null;
  // Enhanced stats
  generationStats?: {
    totalGenerated: number;
    generatedCorrectly: number;
    generationRate: number;
  };
  confidenceStats?: {
    totalRated: number;
    calibrationScore: number;
  };
}

function SessionSummary({
  correctCount,
  totalCount,
  accuracy,
  bestStreak,
  incorrectExercises,
  onRestart,
  onPracticeIncorrect,
  lessonId,
  generationStats,
  confidenceStats,
}: SessionSummaryProps) {
  const navigate = useNavigate();
  const isPerfect = accuracy === 100;
  const isGood = accuracy >= 70;
  const { recordPractice } = useAchievementContext();
  const nextLessonId = getNextLessonId(lessonId);

  // Record practice session for streak/achievements when summary is shown
  useEffect(() => {
    recordPractice({
      exerciseCount: totalCount,
      correctCount,
      isPerfect,
    });
  }, []); // Only run once on mount

  return (
    <>
      <Header />
      <PageContainer>
        <div className="text-center py-8 animate-fade-in">
          {/* Celebration icon */}
          <div
            className={`
              w-24 h-24 mx-auto mb-6 rounded-full
              flex items-center justify-center
              ${isPerfect ? 'bg-amber-100 dark:bg-amber-900/50' : ''}
              ${isGood && !isPerfect ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}
              ${!isGood ? 'bg-[var(--color-sand-200)]' : ''}
            `}
          >
            {isPerfect ? (
              <span className="text-5xl">🌟</span>
            ) : isGood ? (
              <svg className="w-12 h-12 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)] mb-2">
            {isPerfect ? 'Perfect!' : isGood ? 'Well Done!' : 'Keep Practicing!'}
          </h1>

          <p className="text-[var(--color-ink-muted)] mb-8">
            {getEncouragingMessage(isGood, bestStreak)}
          </p>

          {/* Stats grid */}
          <div className="inline-flex items-center gap-6 px-8 py-6 bg-white dark:bg-[var(--color-sand-800)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--color-sand-200)] dark:border-[var(--color-sand-700)] mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-success)]">{correctCount}</div>
              <div className="text-xs text-[var(--color-ink-muted)]">Correct</div>
            </div>
            <div className="w-px h-12 bg-[var(--color-sand-300)]" />
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-error)]">{totalCount - correctCount}</div>
              <div className="text-xs text-[var(--color-ink-muted)]">To Review</div>
            </div>
            <div className="w-px h-12 bg-[var(--color-sand-300)]" />
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-primary)]">{accuracy}%</div>
              <div className="text-xs text-[var(--color-ink-muted)]">Accuracy</div>
            </div>
            {bestStreak >= 2 && (
              <>
                <div className="w-px h-12 bg-[var(--color-sand-300)]" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-gold)]">{bestStreak}</div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Best Streak</div>
                </div>
              </>
            )}
          </div>

          {/* Enhanced learning stats */}
          {(generationStats?.totalGenerated ?? 0) > 0 || (confidenceStats?.totalRated ?? 0) >= 3 ? (
            <div className="flex justify-center gap-4 mb-8">
              {generationStats && generationStats.totalGenerated > 0 && (
                <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-[var(--radius-lg)] px-4 py-3 text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--color-primary)]">
                      Recalled from Memory
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {generationStats.generatedCorrectly}/{generationStats.totalGenerated}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    {Math.round(generationStats.generationRate * 100)}% success rate
                  </div>
                </div>
              )}
              {confidenceStats && confidenceStats.totalRated >= 3 && (
                <div className="bg-amber-100 dark:bg-amber-900/50 rounded-[var(--radius-lg)] px-4 py-3 text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <svg className="w-4 h-4 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--color-gold)]">
                      Calibration
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-gold)]">
                    {Math.round(confidenceStats.calibrationScore * 100)}%
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    prediction accuracy
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Learning insight - Make It Stick principle */}
          <div className="bg-[var(--color-sand-100)] rounded-[var(--radius-lg)] p-4 mb-8 max-w-md mx-auto">
            <p className="text-sm text-[var(--color-ink-light)] italic">
              {incorrectExercises.length > 0 ? (
                <>
                  💡 <strong>Learning tip:</strong> The exercises you found difficult are actually the most valuable for learning.
                  Struggling means your brain is building stronger connections.
                </>
              ) : (
                <>
                  💡 <strong>Learning tip:</strong> Perfect scores feel great, but spacing out your practice over time
                  helps move knowledge to long-term memory. Come back tomorrow!
                </>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 max-w-xs mx-auto">
            {incorrectExercises.length > 0 && (
              <Button
                onClick={onPracticeIncorrect}
                fullWidth
                size="lg"
              >
                Practice {incorrectExercises.length} Missed
              </Button>
            )}
            <Button
              onClick={onRestart}
              variant={incorrectExercises.length > 0 || nextLessonId ? 'secondary' : 'primary'}
              fullWidth
              size="lg"
            >
              {incorrectExercises.length > 0 ? 'Start New Session' : 'Practice Again'}
            </Button>
            {nextLessonId && (
              <Button
                onClick={() => startTransition(() => navigate(`/lesson/${nextLessonId}`))}
                variant="primary"
                fullWidth
                size="lg"
                className="flex items-center justify-center gap-2"
              >
                Next Lesson
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default PracticeSession;
