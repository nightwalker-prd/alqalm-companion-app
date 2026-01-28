/**
 * Settings Page
 * 
 * User preferences and app configuration.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { resetOnboarding, getOnboardingData } from '../components/onboarding';
import { resetProgress } from '../lib/progressService';
import { resetStreakData } from '../lib/achievementService';

type TimeCommitment = '15min' | '30min' | '60min';

const TIME_OPTIONS: { value: TimeCommitment; label: string; lessons: number }[] = [
  { value: '15min', label: '15 minutes', lessons: 1 },
  { value: '30min', label: '30 minutes', lessons: 2 },
  { value: '60min', label: '1 hour', lessons: 4 },
];

export function Settings() {
  const navigate = useNavigate();
  const { resetSettings } = useUserSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOnboardingConfirm, setShowOnboardingConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('madina_tts_enabled') !== 'false';
  });
  const [ttsSpeed, setTtsSpeed] = useState(() => {
    return parseFloat(localStorage.getItem('madina_tts_speed') || '1.0');
  });

  const onboardingData = getOnboardingData();

  // Toggle dark mode
  const handleDarkModeToggle = useCallback(() => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('madina_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('madina_dark_mode', 'false');
    }
  }, [darkMode]);

  // Toggle TTS
  const handleTtsToggle = useCallback(() => {
    const newValue = !ttsEnabled;
    setTtsEnabled(newValue);
    localStorage.setItem('madina_tts_enabled', String(newValue));
  }, [ttsEnabled]);

  // Update TTS speed
  const handleTtsSpeedChange = useCallback((speed: number) => {
    setTtsSpeed(speed);
    localStorage.setItem('madina_tts_speed', String(speed));
  }, []);

  // Update time commitment
  const handleTimeChange = useCallback((time: TimeCommitment) => {
    if (onboardingData) {
      const updated = { ...onboardingData, timeCommitment: time };
      updated.dailyLessonGoal = TIME_OPTIONS.find(t => t.value === time)?.lessons ?? 2;
      localStorage.setItem('madina-onboarding', JSON.stringify(updated));
      window.location.reload(); // Refresh to apply changes
    }
  }, [onboardingData]);

  // Reset all progress
  const handleResetProgress = useCallback(() => {
    resetProgress();
    resetStreakData();
    localStorage.removeItem('madina_session_stats');
    localStorage.removeItem('madina_typing_stats');
    localStorage.removeItem('madina_wazn_stats');
    localStorage.removeItem('madina_morph_stats');
    localStorage.removeItem('madina_sentence_stats');
    setShowResetConfirm(false);
    window.location.reload();
  }, []);

  // Redo onboarding
  const handleRedoOnboarding = useCallback(() => {
    resetOnboarding();
    resetSettings();
    setShowOnboardingConfirm(false);
    navigate('/onboarding');
  }, [navigate, resetSettings]);

  // Export progress data
  const handleExportData = useCallback(() => {
    const data = {
      progress: localStorage.getItem('madina_progress'),
      onboarding: localStorage.getItem('madina-onboarding'),
      streaks: localStorage.getItem('madina_achievement_streak'),
      achievements: localStorage.getItem('madina_achievements'),
      sessionStats: localStorage.getItem('madina_session_stats'),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `madina-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <>
      <Header title="Settings" titleArabic="الإعدادات" showBack />
      <PageContainer>
        {/* Daily Goal */}
        <Card className="mb-4 p-4">
          <h2 className="font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <span>🎯</span> Daily Goal
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-3">
            How much time can you dedicate each day?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => handleTimeChange(option.value)}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all
                  ${onboardingData?.timeCommitment === option.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-sand-300)] hover:border-[var(--color-primary)]/50'
                  }
                `}
              >
                <p className="font-medium text-[var(--color-ink)]">{option.label}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">{option.lessons} lessons</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Appearance */}
        <Card className="mb-4 p-4">
          <h2 className="font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <span>🎨</span> Appearance
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-[var(--color-ink)]">Dark Mode</p>
              <p className="text-sm text-[var(--color-ink-muted)]">Easier on the eyes at night</p>
            </div>
            <button
              onClick={handleDarkModeToggle}
              className={`
                w-14 h-8 rounded-full transition-colors relative
                ${darkMode ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-sand-300)]'}
              `}
            >
              <span
                className={`
                  absolute top-1 left-0 w-6 h-6 rounded-full bg-white shadow transition-transform
                  ${darkMode ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </Card>

        {/* Audio */}
        <Card className="mb-4 p-4">
          <h2 className="font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <span>🔊</span> Audio
          </h2>
          
          <div className="flex items-center justify-between py-2 border-b border-[var(--color-sand-200)]">
            <div>
              <p className="font-medium text-[var(--color-ink)]">Text-to-Speech</p>
              <p className="text-sm text-[var(--color-ink-muted)]">Hear Arabic pronunciations</p>
            </div>
            <button
              onClick={handleTtsToggle}
              className={`
                w-14 h-8 rounded-full transition-colors relative
                ${ttsEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-sand-300)]'}
              `}
            >
              <span
                className={`
                  absolute top-1 left-0 w-6 h-6 rounded-full bg-white shadow transition-transform
                  ${ttsEnabled ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {ttsEnabled && (
            <div className="py-3">
              <p className="font-medium text-[var(--color-ink)] mb-2">Speech Speed</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-ink-muted)]">Slow</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={ttsSpeed}
                  onChange={(e) => handleTtsSpeedChange(parseFloat(e.target.value))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-ink-muted)]">Fast</span>
              </div>
              <p className="text-center text-sm text-[var(--color-ink-muted)] mt-1">
                {ttsSpeed}x
              </p>
            </div>
          )}
        </Card>

        {/* Data Management */}
        <Card className="mb-4 p-4">
          <h2 className="font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <span>💾</span> Data
          </h2>
          
          <button
            onClick={handleExportData}
            className="w-full py-3 px-4 rounded-lg border border-[var(--color-sand-300)] hover:bg-[var(--color-sand-100)] transition-colors text-left flex items-center gap-3 mb-2"
          >
            <span>📤</span>
            <div>
              <p className="font-medium text-[var(--color-ink)]">Export Backup</p>
              <p className="text-sm text-[var(--color-ink-muted)]">Download your progress data</p>
            </div>
          </button>

          <button
            onClick={() => setShowOnboardingConfirm(true)}
            className="w-full py-3 px-4 rounded-lg border border-[var(--color-sand-300)] hover:bg-[var(--color-sand-100)] transition-colors text-left flex items-center gap-3 mb-2"
          >
            <span>🔄</span>
            <div>
              <p className="font-medium text-[var(--color-ink)]">Redo Onboarding</p>
              <p className="text-sm text-[var(--color-ink-muted)]">Change your learning goals</p>
            </div>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 px-4 rounded-lg border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left flex items-center gap-3"
          >
            <span>🗑️</span>
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Reset All Progress</p>
              <p className="text-sm text-red-600 dark:text-red-500">This cannot be undone</p>
            </div>
          </button>
        </Card>

        {/* About */}
        <Card className="mb-4 p-4">
          <h2 className="font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <span>ℹ️</span> About
          </h2>
          <div className="space-y-2 text-sm text-[var(--color-ink-muted)]">
            <p><strong>Madina Interactive</strong> — Arabic learning companion</p>
            <p>Based on the Madina Arabic curriculum</p>
            <p className="text-xs">Version 1.0.0</p>
          </div>
        </Card>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">Reset All Progress?</h3>
              <p className="text-[var(--color-ink-muted)] mb-4">
                This will delete all your learning progress, streaks, and achievements. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleResetProgress}
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                >
                  Reset
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Onboarding Confirmation Modal */}
        {showOnboardingConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">Redo Onboarding?</h3>
              <p className="text-[var(--color-ink-muted)] mb-4">
                This will let you change your learning goals and starting point. Your progress will be kept.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowOnboardingConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRedoOnboarding}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default Settings;
