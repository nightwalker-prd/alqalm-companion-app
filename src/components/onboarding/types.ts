export type ExperienceLevel = 'experienced' | 'beginner' | 'letters-only';

export type LearningGoal = 'quran' | 'classical-texts' | 'studies-support' | 'general';

export type TimeCommitment = '15min' | '30min' | '60min';

export interface PlacementResult {
  score: number;
  total: number;
  recommendedBook: 1 | 2 | 3;
  recommendedLesson: number;
  strengths: string[];
  weaknesses: string[];
}

export interface OnboardingState {
  step: OnboardingStep;
  experience?: ExperienceLevel;
  goal?: LearningGoal;
  timeCommitment?: TimeCommitment;
  placementResult?: PlacementResult;
}

export type OnboardingStep = 
  | 'welcome'
  | 'experience'
  | 'placement-quiz'
  | 'goal'
  | 'time'
  | 'result';

export interface OnboardingData {
  experience: ExperienceLevel;
  goal: LearningGoal;
  timeCommitment: TimeCommitment;
  placementResult?: PlacementResult;
  startingBook: 1 | 2 | 3;
  startingLesson: number;
  dailyLessonGoal: number;
}
