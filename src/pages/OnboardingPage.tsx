import { useNavigate } from 'react-router-dom';
import { Onboarding } from '../components/onboarding';
import type { OnboardingData } from '../components/onboarding/types';

export function OnboardingPage() {
  const navigate = useNavigate();

  const handleComplete = (data: OnboardingData) => {
    console.log('Onboarding complete:', data);
    // Navigate to dashboard after onboarding
    navigate('/');
  };

  return <Onboarding onComplete={handleComplete} />;
}

export default OnboardingPage;
