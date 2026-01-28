import { Button } from '../ui/Button';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-sand-100)]">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="text-6xl mb-4">🕌</div>
        
        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">
            Welcome to Madina Interactive
          </h1>
          <p className="text-[var(--color-ink-muted)] text-lg">
            Learn Classical Arabic the right way — output first, research-backed.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-3 text-left py-6">
          <FeatureItem 
            icon="📖" 
            text="Based on the Madina Arabic curriculum" 
          />
          <FeatureItem 
            icon="🧠" 
            text="Spaced repetition for lasting retention" 
          />
          <FeatureItem 
            icon="✍️" 
            text="Output-focused exercises" 
          />
        </div>

        {/* CTA */}
        <Button 
          size="lg" 
          fullWidth 
          onClick={onContinue}
          rightIcon={<span>→</span>}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--color-sand-50)] rounded-lg border border-[var(--color-sand-200)]">
      <span className="text-xl">{icon}</span>
      <span className="text-[var(--color-ink)]">{text}</span>
    </div>
  );
}
