/**
 * Tests for Frequency Service
 */

import { describe, test, expect, beforeAll } from 'vitest';
import {
  getWordFrequency,
  getWordsFrequency,
  isInFrequencyCorpus,
  getCorpusSize,
  getFrequencyBand,
  getFrequencyBandLabel,
  getFrequencyBandColor,
  sortByFrequency,
  getFrequencyStats,
  loadFrequencyData,
} from '../frequencyService';

describe('frequencyService', () => {
  // Load frequency data before all tests
  beforeAll(async () => {
    await loadFrequencyData();
  });
  describe('getWordFrequency', () => {
    test('returns rank for common word "في" (in)', () => {
      const info = getWordFrequency('في');

      expect(info.rank).toBe(1); // Should be #1 most common
      expect(info.count).toBeGreaterThan(0);
      expect(info.band).toBe('high');
      expect(info.bandLabel).toBe('Very Common');
      expect(info.percentile).toBeGreaterThan(99);
    });

    test('returns rank for word "من" (from)', () => {
      const info = getWordFrequency('من');

      expect(info.rank).toBe(2); // Should be #2
      expect(info.band).toBe('high');
    });

    test('returns rank for word "الله" (Allah)', () => {
      const info = getWordFrequency('الله');

      expect(info.rank).toBeLessThan(10);
      expect(info.band).toBe('high');
    });

    test('returns not-found for non-existent word', () => {
      const info = getWordFrequency('xyz123');

      expect(info.rank).toBeNull();
      expect(info.count).toBeNull();
      expect(info.band).toBe('not-found');
      expect(info.bandLabel).toBe('Not in corpus');
      expect(info.percentile).toBeNull();
    });

    test('handles words with tashkeel by stripping diacritics', () => {
      // "قال" with tashkeel
      const withTashkeel = getWordFrequency('قَالَ');
      const withoutTashkeel = getWordFrequency('قال');

      // Both should find the same word
      expect(withTashkeel.rank).toBe(withoutTashkeel.rank);
    });

    test('correctly categorizes mid-frequency words', () => {
      // Find a word ranked between 2001-6000
      // We'll test the band logic directly
      const mockRank = 3000;
      const band = getFrequencyBand(mockRank);

      expect(band).toBe('mid');
    });

    test('correctly categorizes low-frequency words', () => {
      const band = getFrequencyBand(7000);
      expect(band).toBe('low');
    });

    test('correctly categorizes rare words', () => {
      const band = getFrequencyBand(15000);
      expect(band).toBe('rare');
    });
  });

  describe('getFrequencyBand', () => {
    test('returns high for ranks 1-2000', () => {
      expect(getFrequencyBand(1)).toBe('high');
      expect(getFrequencyBand(1000)).toBe('high');
      expect(getFrequencyBand(2000)).toBe('high');
    });

    test('returns mid for ranks 2001-6000', () => {
      expect(getFrequencyBand(2001)).toBe('mid');
      expect(getFrequencyBand(4000)).toBe('mid');
      expect(getFrequencyBand(6000)).toBe('mid');
    });

    test('returns low for ranks 6001-9000', () => {
      expect(getFrequencyBand(6001)).toBe('low');
      expect(getFrequencyBand(7500)).toBe('low');
      expect(getFrequencyBand(9000)).toBe('low');
    });

    test('returns rare for ranks 9001+', () => {
      expect(getFrequencyBand(9001)).toBe('rare');
      expect(getFrequencyBand(20000)).toBe('rare');
    });

    test('returns not-found for null', () => {
      expect(getFrequencyBand(null)).toBe('not-found');
    });
  });

  describe('getWordsFrequency', () => {
    test('returns frequency info for multiple words', () => {
      const words = ['في', 'من', 'الله', 'xyz123'];
      const result = getWordsFrequency(words);

      expect(result.size).toBe(4);
      expect(result.get('في')?.rank).toBe(1);
      expect(result.get('من')?.rank).toBe(2);
      expect(result.get('xyz123')?.rank).toBeNull();
    });

    test('returns empty map for empty input', () => {
      const result = getWordsFrequency([]);
      expect(result.size).toBe(0);
    });
  });

  describe('isInFrequencyCorpus', () => {
    test('returns true for words in corpus', () => {
      expect(isInFrequencyCorpus('في')).toBe(true);
      expect(isInFrequencyCorpus('من')).toBe(true);
    });

    test('returns false for words not in corpus', () => {
      expect(isInFrequencyCorpus('xyz123')).toBe(false);
    });
  });

  describe('getCorpusSize', () => {
    test('returns the number of words in corpus', () => {
      const size = getCorpusSize();

      expect(size).toBe(20000); // Based on our generated data
    });
  });

  describe('getFrequencyBandLabel', () => {
    test('returns correct labels', () => {
      expect(getFrequencyBandLabel('high')).toBe('Very Common');
      expect(getFrequencyBandLabel('mid')).toBe('Common');
      expect(getFrequencyBandLabel('low')).toBe('Uncommon');
      expect(getFrequencyBandLabel('rare')).toBe('Rare');
      expect(getFrequencyBandLabel('not-found')).toBe('Not in corpus');
    });
  });

  describe('getFrequencyBandColor', () => {
    test('returns CSS variable colors for each band', () => {
      expect(getFrequencyBandColor('high')).toContain('var(');
      expect(getFrequencyBandColor('mid')).toContain('var(');
      expect(getFrequencyBandColor('low')).toContain('var(');
      expect(getFrequencyBandColor('rare')).toContain('var(');
      expect(getFrequencyBandColor('not-found')).toContain('var(');
    });
  });

  describe('sortByFrequency', () => {
    test('sorts words by frequency (most common first)', () => {
      const words = ['الله', 'من', 'في']; // Not in order
      const sorted = sortByFrequency(words);

      // في should be first (rank 1), then من (rank 2), then الله
      expect(sorted[0]).toBe('في');
      expect(sorted[1]).toBe('من');
    });

    test('puts not-found words at the end', () => {
      const words = ['xyz123', 'في', 'abc456'];
      const sorted = sortByFrequency(words);

      expect(sorted[0]).toBe('في');
      // The unknown words should be after
      expect(sorted.indexOf('في')).toBe(0);
    });

    test('returns empty array for empty input', () => {
      expect(sortByFrequency([])).toEqual([]);
    });

    test('does not modify original array', () => {
      const original = ['الله', 'من', 'في'];
      const originalCopy = [...original];
      sortByFrequency(original);

      expect(original).toEqual(originalCopy);
    });
  });

  describe('getFrequencyStats', () => {
    test('returns statistics for word list', () => {
      const words = ['في', 'من', 'الله', 'xyz123'];
      const stats = getFrequencyStats(words);

      expect(stats.total).toBe(4);
      expect(stats.inCorpus).toBe(3);
      expect(stats.byBand.high).toBe(3);
      expect(stats.byBand['not-found']).toBe(1);
      expect(stats.averageRank).toBeGreaterThan(0);
    });

    test('returns null average for all not-found words', () => {
      const words = ['xyz123', 'abc456'];
      const stats = getFrequencyStats(words);

      expect(stats.averageRank).toBeNull();
      expect(stats.inCorpus).toBe(0);
    });

    test('handles empty word list', () => {
      const stats = getFrequencyStats([]);

      expect(stats.total).toBe(0);
      expect(stats.inCorpus).toBe(0);
      expect(stats.averageRank).toBeNull();
    });
  });
});
