import type { LearningGoal } from './types';

interface GoalScreenProps {
  onSelect: (goal: LearningGoal) => void;
  onBack: () => void;
}

export function GoalScreen({ onSelect, onBack }: GoalScreenProps) {
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
            What's your main goal?
          </h2>
          <p className="text-[var(--color-ink-muted)]">
            This helps us personalize your experience
          </p>
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          <GoalOption
            icon="📖"
            title="Understand the Quran"
            onClick={() => onSelect('quran')}
          />
          <GoalOption
            icon="📚"
            title="Read classical texts"
            onClick={() => onSelect('classical-texts')}
          />
          <GoalOption
            icon="🎓"
            title="Support my studies"
            subtitle="Al-Qalam, Bayyinah, etc."
            onClick={() => onSelect('studies-support')}
          />
          <GoalOption
            icon="🧠"
            title="Just learn Arabic"
            onClick={() => onSelect('general')}
          />
        </div>
      </div>
    </div>
  );
}

interface GoalOptionProps {
  icon: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}

function GoalOption({ icon, title, subtitle, onClick }: GoalOptionProps) {
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
          {subtitle && (
            <p className="text-sm text-[var(--color-ink-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
