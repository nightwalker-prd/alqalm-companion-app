import { useEffect, useState, useCallback, useMemo } from 'react';

interface TimerProps {
  /** Initial seconds to count down from */
  seconds: number;
  /** Callback when timer reaches 0 */
  onTimeUp: () => void;
  /** Pause the timer */
  isPaused?: boolean;
  /** Size of the timer circle */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className */
  className?: string;
}

const sizeConfig = {
  sm: { diameter: 40, strokeWidth: 3, fontSize: 'text-sm' },
  md: { diameter: 56, strokeWidth: 4, fontSize: 'text-base' },
  lg: { diameter: 72, strokeWidth: 5, fontSize: 'text-lg' },
};

/**
 * Circular countdown timer component.
 * Shows remaining time with an animated circular progress indicator.
 */
export function Timer({
  seconds,
  onTimeUp,
  isPaused = false,
  size = 'md',
  className = '',
}: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  
  // Reset when seconds prop changes
  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  // Countdown logic
  useEffect(() => {
    if (isPaused || remaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remaining]);

  // Trigger onTimeUp when timer hits 0
  const handleTimeUp = useCallback(() => {
    onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    if (remaining === 0) {
      handleTimeUp();
    }
  }, [remaining, handleTimeUp]);

  const { diameter, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress (starts full, decreases to 0)
  const progress = useMemo(() => {
    return seconds > 0 ? remaining / seconds : 0;
  }, [remaining, seconds]);
  
  const strokeDashoffset = circumference * (1 - progress);

  // Color based on remaining time
  const getColor = () => {
    const percentRemaining = (remaining / seconds) * 100;
    if (percentRemaining <= 20) return 'var(--color-error)';
    if (percentRemaining <= 40) return 'var(--color-gold)';
    return 'var(--color-primary)';
  };

  const color = getColor();

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: diameter, height: diameter }}
    >
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      {/* Time display */}
      <span
        className={`
          absolute
          font-semibold
          ${fontSize}
          ${remaining <= seconds * 0.2 ? 'text-[var(--color-error)]' : 'text-[var(--color-ink)]'}
        `}
      >
        {remaining}
      </span>
    </div>
  );
}

export default Timer;
