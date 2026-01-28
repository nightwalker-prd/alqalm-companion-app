/**
 * Unified Lesson Renderer
 *
 * Renders lesson content for Madina Arabic course.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { UnifiedLesson, UnifiedExercise } from '../../lib/unifiedLessonLoader';

/**
 * Props for the LessonRenderer component
 */
interface LessonRendererProps {
  lesson: UnifiedLesson;
  onComplete?: (score: number) => void;
  showExercises?: boolean;
}

/**
 * Madina-specific content renderer (simplified view)
 */
function MadinaContent({ lesson }: { lesson: any }) {
  return (
    <div className="space-y-6">
      {/* Objectives */}
      {lesson.objectives && lesson.objectives.length > 0 && (
        <Card variant="flat" padding="lg">
          <CardHeader title="Objectives" titleArabic="الأهداف" />
          <CardContent>
            <ul className="space-y-2">
              {lesson.objectives.map((obj: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-[var(--color-ink)]">
                  <span className="text-[var(--color-accent)]">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Dialogue */}
      {lesson.dialogue && lesson.dialogue.length > 0 && (
        <Card variant="elevated" padding="lg">
          <CardHeader title="Dialogue" titleArabic="الحوار" />
          <CardContent>
            <div className="space-y-4">
              {lesson.dialogue.map((line: any, index: number) => (
                <div key={index} className="p-3 bg-[var(--color-surface-alt)] rounded-lg">
                  <p className="arabic-lg text-[var(--color-ink)] mb-1" dir="rtl">
                    {line.arabic}
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {line.english}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Exercise component for unified lessons
 */
function ExerciseSection({
  exercises,
  onComplete,
}: {
  exercises: UnifiedExercise[];
  onComplete?: (score: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number | null)[]>(
    new Array(exercises.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);

  const currentExercise = exercises[currentIndex];

  const handleAnswer = (answer: string | number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate score
      const correct = answers.filter(
        (a, i) => a === exercises[i].answer
      ).length;
      const score = Math.round((correct / exercises.length) * 100);
      setShowResults(true);
      onComplete?.(score);
    }
  };

  if (showResults) {
    const correct = answers.filter((a, i) => a === exercises[i].answer).length;
    const score = Math.round((correct / exercises.length) * 100);

    return (
      <Card variant="elevated" padding="lg">
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'}
            </div>
            <h3 className="text-2xl font-display text-[var(--color-ink)] mb-2">
              {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good job!' : 'Keep practicing!'}
            </h3>
            <p className="text-lg text-[var(--color-ink-muted)] mb-4">
              You scored {correct} out of {exercises.length} ({score}%)
            </p>
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setAnswers(new Array(exercises.length).fill(null));
                setShowResults(false);
              }}
              variant="secondary"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader
        title={`Exercise ${currentIndex + 1} of ${exercises.length}`}
        action={
          <span className="text-sm text-[var(--color-ink-muted)]">
            {currentExercise.type}
          </span>
        }
      />
      <CardContent>
        <p className="text-lg text-[var(--color-ink)] mb-6" dir="rtl">
          {currentExercise.prompt}
        </p>

        {currentExercise.options && (
          <div className="space-y-3">
            {currentExercise.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(typeof currentExercise.answer === 'number' ? index : option)}
                className={`w-full text-right p-4 rounded-lg border transition-colors ${
                  answers[currentIndex] === (typeof currentExercise.answer === 'number' ? index : option)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                }`}
                dir="rtl"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={answers[currentIndex] === null}
          >
            {currentIndex === exercises.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main LessonRenderer component
 */
export function LessonRenderer({
  lesson,
  onComplete,
  showExercises = true,
}: LessonRendererProps) {
  return (
    <div className="space-y-6">
      {/* Lesson header */}
      <div className="text-center mb-8 animate-fade-in">
        {/* Book type badge */}
        <div className="inline-block px-4 py-1 rounded-full mb-4 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
          <span className="text-sm font-medium">
            Madina Arabic
          </span>
        </div>

        {/* Titles */}
        <h1 className="arabic-2xl text-[var(--color-ink)] mb-2" dir="rtl">
          {lesson.title}
        </h1>
        <p className="font-display text-xl text-[var(--color-ink)]">
          {lesson.titleEn}
        </p>

        {/* Difficulty badge */}
        {lesson.difficulty && (
          <div className="mt-3">
            <span className={`text-xs px-2 py-1 rounded ${
              lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {lesson.difficulty}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <MadinaContent lesson={lesson.content as any} />

      {/* Exercises section */}
      {showExercises && lesson.exercises.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-display text-[var(--color-ink)] mb-4">
            Exercises ({lesson.exerciseCount})
          </h2>
          <ExerciseSection
            exercises={lesson.exercises}
            onComplete={onComplete}
          />
        </div>
      )}
    </div>
  );
}

export default LessonRenderer;
