
import type { ExperienceLevel } from './types';

interface ExperienceScreenProps {
  onSelect: (level: ExperienceLevel) => void;
  onBack: () => void;
}

export function ExperienceScreen({ onSelect, onBack }: ExperienceScreenProps) {
  return (
    <div className="min-h-screen flex flex-col p-6 bg-[var(--color-sand-100)]">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="self-start text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-8"
      >
        ← Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-2">
            Have you studied Arabic grammar before?
          </h2>
          <p className="text-[var(--color-ink-muted)]">
            Nahw, Sarf, or similar courses
          </p>
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          <OptionButton
            icon="📚"
            title="Yes, I have some background"
            subtitle="I've studied nahw/sarf basics"
            onClick={() => onSelect('experienced')}
          />
          <OptionButton
            icon="🌱"
            title="No, I'm starting fresh"
            subtitle="Complete beginner to grammar"
            onClick={() => onSelect('beginner')}
          />
          <OptionButton
            icon="🔤"
            title="I can read Arabic letters"
            subtitle="But haven't studied grammar"
            onClick={() => onSelect('letters-only')}
          />
        </div>
      </div>
    </div>
  );
}

interface OptionButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function OptionButton({ icon, title, subtitle, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-[var(--color-sand-50)] border-2 border-[var(--color-sand-200)] rounded-xl
        hover:border-[var(--color-primary)] hover:bg-white
        transition-all duration-200 text-left group"
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">
            {title}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}
