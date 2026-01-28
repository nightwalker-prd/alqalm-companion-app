#!/usr/bin/env npx tsx
/**
 * Import reading content from Al-Qalam Institute Platform.
 *
 * This script reads the reading-texts.json from the Al-Qalam project,
 * transforms it to the Madina Interactive schema, and outputs:
 * - passages.json: All reading passages
 * - manifest.json: Reading content summary for quick loading
 *
 * Run with: npx tsx scripts/importReadingContent.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination paths
const SOURCE_FILE = '/Users/miftah/Projects/tayib/Alqalaminstituteplatform/public/data/reading-texts.json';
const OUTPUT_DIR = path.join(__dirname, '../src/content/reading');
const PASSAGES_FILE = path.join(OUTPUT_DIR, 'passages.json');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

// Types matching the source data
interface SourceVocabulary {
  word: string;
  meaning: string;
}

interface SourcePassage {
  id: string;
  title: string;
  titleAr: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  categoryAr: string;
  text: string;
  translation: string;
  grammaticalConcepts: string[];
  vocabularyHighlights: SourceVocabulary[];
  moralLesson?: string;
  moralLessonAr?: string;
  wordCount: number;
}

interface SourceData {
  version: string;
  generatedAt: string;
  data: SourcePassage[];
}

// Output types (matching src/types/reading.ts)
interface ReadingPassage {
  id: string;
  title: string;
  titleAr: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  categoryAr: string;
  text: string;
  translation: string;
  grammaticalConcepts: string[];
  vocabularyHighlights: { word: string; meaning: string }[];
  moralLesson?: string;
  moralLessonAr?: string;
  wordCount: number;
}

interface ReadingManifest {
  version: number;
  generatedAt: string;
  passageCount: number;
  categories: string[];
  byLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

interface PassagesOutput {
  version: number;
  generatedAt: string;
  passages: ReadingPassage[];
}

function transformPassage(source: SourcePassage): ReadingPassage {
  return {
    id: source.id,
    title: source.title,
    titleAr: source.titleAr,
    level: source.level,
    category: source.category,
    categoryAr: source.categoryAr,
    text: source.text,
    translation: source.translation,
    grammaticalConcepts: source.grammaticalConcepts || [],
    vocabularyHighlights: source.vocabularyHighlights || [],
    moralLesson: source.moralLesson,
    moralLessonAr: source.moralLessonAr,
    wordCount: source.wordCount,
  };
}

function generateManifest(passages: ReadingPassage[]): ReadingManifest {
  // Get unique categories, sorted alphabetically
  const categories = [...new Set(passages.map(p => p.category))].sort();

  // Count by level
  const byLevel = {
    beginner: passages.filter(p => p.level === 'beginner').length,
    intermediate: passages.filter(p => p.level === 'intermediate').length,
    advanced: passages.filter(p => p.level === 'advanced').length,
  };

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    passageCount: passages.length,
    categories,
    byLevel,
  };
}

function main() {
  console.log('Importing reading content from Al-Qalam Institute Platform...\n');

  // Check source file exists
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Source file not found: ${SOURCE_FILE}`);
    console.error('Make sure the Al-Qalam project is available at the expected path.');
    process.exit(1);
  }

  // Read source data
  const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const sourceData: SourceData = JSON.parse(sourceContent);

  console.log(`Source version: ${sourceData.version}`);
  console.log(`Source generated: ${sourceData.generatedAt}`);
  console.log(`Total passages in source: ${sourceData.data.length}\n`);

  // Transform passages
  const passages = sourceData.data.map(transformPassage);

  // Generate manifest
  const manifest = generateManifest(passages);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write passages file
  const passagesOutput: PassagesOutput = {
    version: 1,
    generatedAt: new Date().toISOString(),
    passages,
  };
  fs.writeFileSync(PASSAGES_FILE, JSON.stringify(passagesOutput, null, 2));

  // Write manifest file
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  // Print summary
  console.log('Import complete!\n');
  console.log('Passages:');
  console.log(`  Total: ${passages.length}`);
  console.log(`  Beginner: ${manifest.byLevel.beginner}`);
  console.log(`  Intermediate: ${manifest.byLevel.intermediate}`);
  console.log(`  Advanced: ${manifest.byLevel.advanced}`);
  console.log(`\nCategories: ${manifest.categories.length}`);
  console.log('\nFiles written:');

  const passagesStats = fs.statSync(PASSAGES_FILE);
  console.log(`  ${PASSAGES_FILE}`);
  console.log(`    Size: ${(passagesStats.size / 1024).toFixed(1)}KB`);

  const manifestStats = fs.statSync(MANIFEST_FILE);
  console.log(`  ${MANIFEST_FILE}`);
  console.log(`    Size: ${(manifestStats.size / 1024).toFixed(1)}KB`);
}

main();
