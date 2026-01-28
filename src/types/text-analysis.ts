/**
 * Types for Classical Text Analysis module
 * Covers: الحديث، النثر، التفسير، الفقه، التاريخ، الفلسفة
 */

export type TextGenre =
  | 'hadith'      // الحديث النبوي
  | 'khutbah'     // الخطب
  | 'wasiyyah'    // الوصايا
  | 'risalah'     // الرسائل
  | 'maqamah'     // المقامات
  | 'tafsir'      // التفسير
  | 'fiqh'        // الفقه
  | 'usul'        // أصول الفقه
  | 'tarikh'      // التاريخ
  | 'falsafah';   // الفلسفة

export type AnalysisLevel =
  | 'morphological'   // التحليل الصرفي
  | 'grammatical'     // التحليل النحوي
  | 'rhetorical'      // التحليل البلاغي
  | 'semantic';       // التحليل الدلالي

// Morphological Analysis Types
export interface MorphologicalWord {
  word: string;
  root: string;
  pattern: string;
  type: string;
  singular?: string;
  originalForm?: string;
  note?: string;
}

export interface MorphologicalAnalysis {
  keyWords: MorphologicalWord[];
}

// Grammatical Analysis Types
export interface SentenceIrab {
  word: string;
  function: string;
}

export interface SentenceAnalysis {
  text: string;
  type: string;
  irab: SentenceIrab[];
  note?: string;
}

export interface Connective {
  particle: string;
  type: string;
  connects: string;
}

export interface GrammaticalAnalysis {
  sentences: SentenceAnalysis[];
  connectives?: Connective[];
}

// Rhetorical Analysis Types
export interface RhetoricalDevice {
  device: string;
  location?: string;
  elements?: string[];
  effect: string;
  expected?: string;
  note?: string;
}

export interface RhetoricalAnalysis {
  devices: RhetoricalDevice[];
  style?: {
    features: string[];
  };
}

// Semantic Analysis Types
export interface SemanticTerm {
  term: string;
  definition?: string;
  scope?: string;
  location?: string;
  scholarly_discussion?: string;
  components?: string[];
}

export interface SemanticAnalysis {
  keyTerms: SemanticTerm[];
  implications: string[];
}

// Combined Analysis
export interface TextAnalysis {
  morphological?: MorphologicalAnalysis;
  grammatical?: GrammaticalAnalysis;
  rhetorical?: RhetoricalAnalysis;
  semantic?: SemanticAnalysis;
}

// Contextual Information
export interface ScholarlyCommentary {
  scholar: string;
  quote: string;
  explanation?: string;
}

export interface RelatedText {
  type: 'quran' | 'hadith' | 'poetry' | 'prose';
  ref?: string;
  text: string;
}

export interface ContextualInfo {
  occasionOfStatement?: string;
  historicalContext?: string;
  scholarlyCommentary?: ScholarlyCommentary[];
  relatedTexts?: RelatedText[];
}

// Hadith-specific types
export interface HadithSource {
  primary: string;
  narrator: string;
}

export interface HadithTextContent {
  arabic: string;
  transliteration?: string;
  translation: string;
}

export interface HadithText {
  id: string;
  collection: string;
  number: number;
  source: HadithSource;
  text: HadithTextContent;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  analysis: TextAnalysis;
  contextual?: ContextualInfo;
  exercises?: TextAnalysisExercise[];
}

// Prose-specific types
export interface ProseSectionAnalysis {
  grammatical?: { phrase: string; irab: string }[];
  rhetorical?: { device: string; effect: string }[];
  stylistic?: string[];
}

export interface ProseSection {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  analysis: ProseSectionAnalysis;
}

export interface GenreElement {
  element: string;
  present: boolean;
  example?: string;
}

export interface ProseGenreFeatures {
  elements: GenreElement[];
  stylistic_markers: string[];
}

export interface LegalTerm {
  word: string;
  meaning: string;
  category: string;
}

export interface RhetoricalTerm {
  word: string;
  meaning: string;
  usage: string;
}

export interface ProseVocabulary {
  legal_terms?: LegalTerm[];
  rhetorical_terms?: RhetoricalTerm[];
}

export interface ProseText {
  id: string;
  title: string;
  titleEn: string;
  speaker?: string;
  author?: string;
  date?: string;
  occasion?: string;
  genre: TextGenre;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  text: {
    sections: ProseSection[];
  };
  genreFeatures?: ProseGenreFeatures;
  vocabulary?: ProseVocabulary;
  exercises?: TextAnalysisExercise[];
}

// Genre comparison types
export interface GenreFeatures {
  vocabulary: string[];
  grammar: string[];
  rhetoric: string[];
  style: string[];
}

export interface GenreProfile {
  name: string;
  nameEn: string;
  features: GenreFeatures;
  challenges: string[];
}

export interface GenreComparison {
  id: string;
  title: string;
  genres: GenreProfile[];
}

// Exercise types
export type TextAnalysisExerciseType =
  | 'integrated-analysis'
  | 'genre-identification'
  | 'compare-texts'
  | 'translate-analyze'
  | 'fill-analysis'
  | 'identify-style'
  | 'contextualize'
  | 'extract-principles'
  | 'scholarly-commentary'
  | 'creative-application'
  | 'morphological-analysis'
  | 'grammatical-parsing'
  | 'rhetorical-identification'
  | 'application';

export interface TextAnalysisExercise {
  id: string;
  type: TextAnalysisExerciseType;
  word?: string;
  sentence?: string;
  question?: string;
  questions?: string[];
  task?: string;
  hint?: string;
  note?: string;
  scenario?: string;
  answer?: string;
  options?: string[];
  explanation?: string;
}

// Manifest
export interface TextAnalysisManifest {
  version: number;
  generatedAt: string;
  methodology: { lessonCount: number; lessonIds: string[] };
  hadith: {
    nawawi40: number;
    bukhariSelected: number;
    thematic: { iman: number; akhlaq: number; muamalat: number };
  };
  prose: {
    khutab: number;
    wasaya: number;
    rasail: number;
    maqamat: number;
  };
  tafsir: number;
  fiqh: { usul: number; furu: number };
  history: number;
  philosophy: number;
  vocabularyCount: number;
}
