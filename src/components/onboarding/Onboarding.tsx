/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { ExperienceScreen } from './ExperienceScreen';
import { GoalScreen } from './GoalScreen';
import { TimeScreen } from './TimeScreen';
import { PlacementQuiz } from './PlacementQuiz';
import { ResultScreen } from './ResultScreen';
import { saveOnboardingData } from './onboardingHelpers';
import type { 
  OnboardingStep, 
  OnboardingState, 
  ExperienceLevel, 
  LearningGoal, 
  TimeCommitment,
  PlacementResult,
  OnboardingData
} from './types';

// Re-export helpers for backwards compatibility
export { hasCompletedOnboarding, getOnboardingData, resetOnboarding } from './onboardingHelpers';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    step: 'welcome',
  });

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const handleExperienceSelect = useCallback((experience: ExperienceLevel) => {
    setState(prev => ({ ...prev, experience }));
    
    if (experience === 'experienced') {
      goToStep('placement-quiz');
    } else {
      goToStep('goal');
    }
  }, [goToStep]);

  const handleGoalSelect = useCallback((goal: LearningGoal) => {
    setState(prev => ({ ...prev, goal }));
    goToStep('time');
  }, [goToStep]);

  const handleTimeSelect = useCallback((timeCommitment: TimeCommitment) => {
    setState(prev => ({ ...prev, timeCommitment }));
    goToStep('result');
  }, [goToStep]);

  const handleQuizComplete = useCallback((result: PlacementResult) => {
    setState(prev => ({ ...prev, placementResult: result }));
    goToStep('result');
  }, [goToStep]);

  const handleQuizSkip = useCallback(() => {
    goToStep('goal');
  }, [goToStep]);

  const handleStart = useCallback(() => {
    const data: OnboardingData = {
      experience: state.experience ?? 'beginner',
      goal: state.goal ?? 'general',
      timeCommitment: state.timeCommitment ?? '30min',
      placementResult: state.placementResult,
      startingBook: state.placementResult?.recommendedBook ?? 1,
      startingLesson: state.placementResult?.recommendedLesson ?? 1,
      dailyLessonGoal: getDailyGoal(state.timeCommitment),
    };

    // Persist to localStorage
    saveOnboardingData(data);
    
    onComplete(data);
  }, [state, onComplete]);

  const handleChangeSettings = useCallback(() => {
    goToStep('experience');
  }, [goToStep]);

  // Render current step
  switch (state.step) {
    case 'welcome':
      return <WelcomeScreen onContinue={() => goToStep('experience')} />;
    
    case 'experience':
      return (
        <ExperienceScreen 
          onSelect={handleExperienceSelect} 
          onBack={() => goToStep('welcome')} 
        />
      );
    
    case 'placement-quiz':
      return (
        <PlacementQuiz 
          onComplete={handleQuizComplete}
          onSkip={handleQuizSkip}
          onBack={() => goToStep('experience')}
        />
      );
    
    case 'goal':
      return (
        <GoalScreen 
          onSelect={handleGoalSelect} 
          onBack={() => goToStep('experience')} 
        />
      );
    
    case 'time':
      return (
        <TimeScreen 
          onSelect={handleTimeSelect} 
          onBack={() => goToStep('goal')} 
        />
      );
    
    case 'result':
      return (
        <ResultScreen 
          data={{
            experience: state.experience,
            goal: state.goal,
            timeCommitment: state.timeCommitment,
            startingBook: state.placementResult?.recommendedBook ?? 1,
            startingLesson: state.placementResult?.recommendedLesson ?? 1,
          }}
          placementResult={state.placementResult}
          onStart={handleStart}
          onChangeSettings={handleChangeSettings}
        />
      );
    
    default:
      return <WelcomeScreen onContinue={() => goToStep('experience')} />;
  }
}

function getDailyGoal(time?: TimeCommitment): number {
  switch (time) {
    case '15min': return 1;
    case '30min': return 2;
    case '60min': return 4;
    default: return 2;
  }
}

export default Onboarding;
