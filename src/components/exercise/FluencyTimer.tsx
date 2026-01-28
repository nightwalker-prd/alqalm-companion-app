import { useEffect, useState, useRef, useCallback } from 'react';

interface FluencyTimerProps {
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether the timer is running */
  isRunning: boolean;
  /** Called when the timer reaches zero */
  onComplete: () => void;
  /** Called with remaining time on each tick */
  onTick?: (remainingMs: number) => void;
  /** Size of the timer display */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * FluencyTimer - A circular countdown timer for fluency speed rounds
 */
export function FluencyTimer({
  durationMs,
  isRunning,
  onComplete,
  onTick,
  size = 'md',
}: FluencyTimerProps) {
  // Note: Parent should use key={durationMs} to reset this component when duration changes
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const startTimeRef = useRef<number | null>(null);

  // Timer tick - starts timer when isRunning becomes true
  useEffect(() => {
    if (!isRunning) {
      startTimeRef.current = null;
      return;
    }

    // Initialize start time when starting
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const startTime = startTimeRef.current;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(remaining);
      onTick?.(remaining);

      if (remaining <= 0) {
        onComplete();
      }
    };

    // Tick immediately and then every 100ms
    tick();
    const interval = setInterval(tick, 100);

    return () => clearInterval(interval);
  }, [isRunning, durationMs, onComplete, onTick]);

  // Calculate display values
  const seconds = Math.ceil(remainingMs / 1000);
  const percentage = (remainingMs / durationMs) * 100;
  
  // Size configurations
  const sizeConfig = {
    sm: { size: 80, strokeWidth: 6, fontSize: 'text-xl' },
    md: { size: 120, strokeWidth: 8, fontSize: 'text-3xl' },
    lg: { size: 160, strokeWidth: 10, fontSize: 'text-5xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  // Color based on time remaining
  const getColor = useCallback(() => {
    if (percentage > 50) return 'var(--color-primary)';
    if (percentage > 25) return 'var(--color-gold)';
    return 'var(--color-error)';
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-100"
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className={`font-bold ${config.fontSize} tabular-nums`}
          style={{ color: getColor() }}
        >
          {seconds}
        </span>
      </div>
    </div>
  );
}

export default FluencyTimer;
