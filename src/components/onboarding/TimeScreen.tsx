import type { TimeCommitment } from './types';

interface TimeScreenProps {
  onSelect: (time: TimeCommitment) => void;
  onBack: () => void;
}

export function TimeScreen({ onSelect, onBack }: TimeScreenProps) {
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
            How much time can you practice daily?
          </h2>
          <p className="text-[var(--color-ink-muted)]">
            Be realistic — consistency beats intensity
          </p>
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          <TimeOption
            icon="⚡"
            title="10-15 minutes"
            subtitle="1 lesson per day"
            onClick={() => onSelect('15min')}
          />
          <TimeOption
            icon="🔥"
            title="30 minutes"
            subtitle="2-3 lessons per day"
            onClick={() => onSelect('30min')}
          />
          <TimeOption
            icon="💪"
            title="1 hour+"
            subtitle="4-5 lessons per day"
            onClick={() => onSelect('60min')}
          />
        </div>

        <p className="text-sm text-[var(--color-ink-muted)] mt-6 text-center">
          You can change this anytime in settings
        </p>
      </div>
    </div>
  );
}

interface TimeOptionProps {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function TimeOption({ icon, title, subtitle, onClick }: TimeOptionProps) {
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
