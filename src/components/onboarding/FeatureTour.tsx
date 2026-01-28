/**
 * Feature Tour Component
 * 
 * First-run guided tour highlighting key features.
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Madina Interactive! 🎉',
    description: 'Let me show you around. This tour will help you discover all the features to accelerate your Arabic learning.',
    position: 'center',
    icon: '👋',
  },
  {
    id: 'daily-challenge',
    title: 'Daily Challenge',
    description: 'Start each day with a quick 10-question challenge. Build streaks to stay motivated and track your consistency.',
    icon: '🎯',
  },
  {
    id: 'spaced-review',
    title: 'Spaced Repetition',
    description: 'The Review tab uses a smart algorithm to show you words right before you forget them. This is the most efficient way to build long-term memory.',
    icon: '📚',
  },
  {
    id: 'practice-modes',
    title: 'Multiple Practice Modes',
    description: 'Flashcards, typing drills, free recall, sentence building, and more. Tap "Quick Practice" or "Deep Work" on the home screen to explore.',
    icon: '⚡',
  },
  {
    id: 'grammar',
    title: 'Grammar Deep Dives',
    description: "I'rab practice, Wazn trainer, and morphology exercises help you master the patterns that make Arabic logical and beautiful.",
    icon: '📖',
  },
  {
    id: 'reading',
    title: 'Reading Practice',
    description: '600+ graded reading passages from beginner to advanced. Track your reading speed and comprehension.',
    icon: '📚',
  },
  {
    id: 'search',
    title: 'Search Everything',
    description: 'Use the search bar to quickly find lessons, vocabulary, or any feature. Just start typing!',
    icon: '🔍',
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Visit Settings to adjust your daily goals, enable dark mode, configure text-to-speech, and export your progress.',
    icon: '⚙️',
  },
  {
    id: 'done',
    title: "You're All Set! 🚀",
    description: "Start with the Daily Challenge to build your streak, or explore any activity that interests you. بالتوفيق - Good luck!",
    position: 'center',
    icon: '✨',
  },
];

const TOUR_STORAGE_KEY = 'madina_feature_tour_completed';

interface FeatureTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function FeatureTour({ onComplete, forceShow = false }: FeatureTourProps) {
  // Initialize visibility based on forceShow prop
  const [isVisible, setIsVisible] = useState(() => forceShow);
  const [currentStep, setCurrentStep] = useState(0);

  // Show tour after delay if not completed (only when not forceShow)
  useEffect(() => {
    if (forceShow) return; // Already visible from initial state

    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so page renders first
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const step = TOUR_STEPS[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete tour
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setIsVisible(false);
      onComplete?.();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour card */}
      <div className="relative bg-white dark:bg-[var(--color-sand-900)] rounded-2xl shadow-2xl max-w-md w-[90%] mx-4 overflow-hidden animate-scale-in">
        {/* Progress bar */}
        <div className="h-1 bg-[var(--color-sand-200)]">
          <div 
            className="h-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <span className="text-4xl">{step.icon}</span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-[var(--color-ink)] text-center mb-2">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-[var(--color-ink-muted)] text-center mb-6">
            {step.description}
          </p>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${index === currentStep 
                    ? 'w-6 bg-[var(--color-primary)]' 
                    : index < currentStep
                      ? 'bg-[var(--color-primary)]/50'
                      : 'bg-[var(--color-sand-300)]'
                  }
                `}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep > 0 ? (
              <Button variant="secondary" onClick={handleBack} className="flex-1">
                Back
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleSkip} className="flex-1">
                Skip Tour
              </Button>
            )}
            <Button variant="primary" onClick={handleNext} className="flex-1">
              {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureTour;
