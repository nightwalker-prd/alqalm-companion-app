/**
 * Confetti Celebration Component
 * 
 * Lightweight confetti animation for achievements and milestones.
 * Uses CSS animations - no external dependencies.
 */

import { useEffect, useState } from 'react';

interface ConfettiProps {
  isActive: boolean;
  duration?: number; // ms
  particleCount?: number;
}

const COLORS = [
  '#D4A574', // gold
  '#0D7377', // primary teal
  '#4A7C59', // success green
  '#C4644A', // warm coral
  '#7A6558', // sand
  '#E5C9A8', // light gold
];

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
  duration: number;
  isCircle: boolean;
}

export function Confetti({ 
  isActive, 
  duration = 3000, 
  particleCount = 50 
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate particles
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // % from left
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 500, // stagger start
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        duration: 2000 + Math.random() * 1000,
        isCircle: Math.random() > 0.5,
      }));
      
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate pattern for one-time initialization
      setParticles(newParticles);
      setVisible(true);

      // Clean up after duration
      const timer = setTimeout(() => {
        setVisible(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount]);

  if (!visible || particles.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        >
          <div
            className="w-3 h-3 animate-confetti-spin"
            style={{
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
              borderRadius: particle.isCircle ? '50%' : '2px',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default Confetti;
