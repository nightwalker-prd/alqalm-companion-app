import { useState, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  downloadExport,
  readFileAsJson,
  validateImportData,
  importData,
  getDataSummary,
  type ExportData,
} from '../../lib/exportService';

interface DataManagementProps {
  onImportComplete?: () => void;
}

export function DataManagement({ onImportComplete }: DataManagementProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<ExportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = getDataSummary();

  const handleExport = () => {
    downloadExport();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    setIsImporting(true);

    try {
      const data = await readFileAsJson(file);
      
      if (!validateImportData(data)) {
        throw new Error('Invalid backup file. Please select a valid Madina Interactive backup.');
      }

      // Show confirmation dialog
      setPendingImport(data as ExportData);
      setShowConfirm(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;

    try {
      importData(pendingImport, false);
      setImportSuccess(true);
      setShowConfirm(false);
      setPendingImport(null);
      
      // Notify parent to refresh
      onImportComplete?.();
      
      // Reload page after short delay to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import data');
      setShowConfirm(false);
      setPendingImport(null);
    }
  };

  const handleCancelImport = () => {
    setShowConfirm(false);
    setPendingImport(null);
  };

  return (
    <>
      <Card variant="default" padding="md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <h3 className="font-display font-semibold text-[var(--color-ink)]">
              Your Data
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {/* Data summary */}
          <div className="mb-4 p-3 bg-[var(--color-sand-50)] rounded-[var(--radius-md)]">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--color-ink-muted)]">Data stored:</span>
                <span className="ml-2 font-medium text-[var(--color-ink)]">{summary.estimatedSize}</span>
              </div>
              <div>
                <span className="text-[var(--color-ink-muted)]">Items:</span>
                <span className="ml-2 font-medium text-[var(--color-ink)]">{summary.keyCount}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {isImporting ? 'Reading...' : 'Import'}
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Error message */}
          {importError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[var(--radius-md)]">
              <p className="text-sm text-red-700 dark:text-red-300">{importError}</p>
            </div>
          )}

          {/* Success message */}
          {importSuccess && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-[var(--radius-md)]">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                ✓ Data imported successfully! Reloading...
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
            Export creates a backup file. Import restores from a backup.
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && pendingImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[var(--radius-lg)] p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              Import Backup?
            </h3>
            <p className="text-sm text-[var(--color-ink-muted)] mb-4">
              This will replace your current progress with the backup from{' '}
              <strong>{new Date(pendingImport.exportedAt).toLocaleDateString()}</strong>.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              ⚠️ Your current data will be lost. Consider exporting first.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelImport}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmImport}
                className="flex-1"
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
