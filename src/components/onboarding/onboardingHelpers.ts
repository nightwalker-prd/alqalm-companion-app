/**
 * Onboarding Helper Functions
 * 
 * Separated from Onboarding.tsx for fast refresh compatibility.
 */

import type { OnboardingData } from './types';

const STORAGE_KEY = 'madina-onboarding';

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get stored onboarding data
 */
export function getOnboardingData(): OnboardingData | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Reset onboarding (for settings page)
 */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Save onboarding data
 */
export function saveOnboardingData(data: OnboardingData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
