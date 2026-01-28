/**
 * Export/Import Service
 * Handles backup and restore of all user progress data
 */

// All localStorage keys used by the app
const STORAGE_KEYS = [
  'madina_progress',
  'madina-reading-progress',
  'madina_reading_time',
  'madina_study_time',
  'madina_flashcard_stats',
  'madina_flashcard_config',
  'madina_flashcard_mnemonics',
  'madina_fluency_stats',
  'madina_speed_reading_stats',
  'madina_speed_reading_config',
  'madina_topic_progress',
  'madina-onboarding',
  'madina_achievements',
  'madina_streak',
  'madina_dashboard_sections',
  'madina_session_stats',
  'madina_wazn_stats',
  'madina_wazn_settings',
  'madina_typing_stats',
  'madina_sentence_stats',
] as const;

const EXPORT_VERSION = 1;

export interface ExportData {
  version: number;
  exportedAt: string;
  appName: 'madina-interactive';
  data: Record<string, unknown>;
}

/**
 * Export all user data as a JSON object
 */
export function exportAllData(): ExportData {
  const data: Record<string, unknown> = {};

  for (const key of STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        // Store as string if not valid JSON
        data[key] = value;
      }
    }
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'madina-interactive',
    data,
  };
}

/**
 * Download export data as a JSON file
 */
export function downloadExport(): void {
  const exportData = exportAllData();
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `madina-backup-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.appName !== 'madina-interactive') {
    return false;
  }

  if (typeof obj.version !== 'number') {
    return false;
  }

  if (typeof obj.data !== 'object' || obj.data === null) {
    return false;
  }

  return true;
}

/**
 * Import data from a backup file
 * Returns true on success, throws on error
 */
export function importData(data: ExportData, merge: boolean = false): void {
  if (!validateImportData(data)) {
    throw new Error('Invalid backup file format');
  }

  // Clear existing data if not merging
  if (!merge) {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }

  // Import each key
  for (const [key, value] of Object.entries(data.data)) {
    if (STORAGE_KEYS.includes(key as typeof STORAGE_KEYS[number])) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

/**
 * Read a file and parse as JSON
 */
export function readFileAsJson(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Get summary of current data for display
 */
export function getDataSummary(): {
  hasProgress: boolean;
  hasOnboarding: boolean;
  keyCount: number;
  estimatedSize: string;
} {
  let totalSize = 0;
  let keyCount = 0;

  for (const key of STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      keyCount++;
      totalSize += value.length;
    }
  }

  // Convert to KB
  const sizeKB = (totalSize / 1024).toFixed(1);

  return {
    hasProgress: localStorage.getItem('madina_progress') !== null,
    hasOnboarding: localStorage.getItem('madina-onboarding') !== null,
    keyCount,
    estimatedSize: `${sizeKB} KB`,
  };
}

/**
 * Clear all app data (factory reset)
 */
export function clearAllData(): void {
  for (const key of STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}
