import type { CharDiffResult } from '../lib/arabic';
import { computeCharDiff } from '../lib/arabic';

/**
 * Hook to get diff result for custom rendering.
 */
export function useDiff(expected: string, actual: string): CharDiffResult {
  return computeCharDiff(expected, actual);
}
