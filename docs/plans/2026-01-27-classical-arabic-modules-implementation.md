# Classical Arabic Modules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement four new Classical Arabic curriculum modules (Balāghah, ʿArūḍ, Quranic Grammar, Text Analysis) with full content, TypeScript types, and service layers.

**Architecture:** Content-first approach - create JSON content files following existing patterns, add TypeScript types, then build service layers for data access. Each module is self-contained with its own manifest, vocabulary, lessons, and exercises.

**Tech Stack:** TypeScript, JSON content files, React (existing), Vite (existing)

---

## Phase 1: Foundation & Types (Tasks 1-5)

### Task 1: Create Directory Structure

**Files:**
- Create: `src/content/balagha/` (directory)
- Create: `src/content/arud/` (directory)
- Create: `src/content/quran-nahw/` (directory)
- Create: `src/content/text-analysis/` (directory)

**Step 1: Create all module directories**

```bash
mkdir -p src/content/balagha/{maani/lessons,bayan/lessons,badi/lessons,examples}
mkdir -p src/content/arud/{foundations/lessons,meters/lessons,qafiyah/lessons,forms/lessons,anthology,tools}
mkdir -p src/content/quran-nahw/{foundations/lessons,unique-constructions/lessons,particles/lessons,qiraat/lessons,surah-studies/juz-amma,themes,reference}
mkdir -p src/content/text-analysis/{methodology/lessons,hadith/nawawi-40,hadith/thematic,prose/khutab,prose/wasaya,prose/rasail,prose/maqamat,tafsir,fiqh/usul,fiqh/furu,history,philosophy,integrated-analysis}
```

**Step 2: Verify directories created**

```bash
ls -la src/content/balagha src/content/arud src/content/quran-nahw src/content/text-analysis
```

**Step 3: Commit**

```bash
git add src/content/
git commit -m "chore: create directory structure for 4 new Classical Arabic modules"
```

---

### Task 2: Create Balāghah TypeScript Types

**Files:**
- Create: `src/types/balagha.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/balagha.ts

/**
 * Types for Balāghah (Arabic Rhetoric) module
 * Covers: علم المعاني، علم البيان، علم البديع
 */

export type BalaghaCategory = 'maani' | 'bayan' | 'badi';

export type BalaghaDeviceType =
  // علم المعاني
  | 'khabar'           // الخبر
  | 'insha'            // الإنشاء
  | 'qasr'             // القصر
  | 'wasl-fasl'        // الوصل والفصل
  | 'ijaz'             // الإيجاز
  | 'itnab'            // الإطناب
  | 'musawah'          // المساواة
  // علم البيان
  | 'tashbih'          // التشبيه
  | 'istiarah-tasrihiyyah'  // الاستعارة التصريحية
  | 'istiarah-makniyyah'    // الاستعارة المكنية
  | 'istiarah-tamthiliyyah' // الاستعارة التمثيلية
  | 'majaz-mursal'     // المجاز المرسل
  | 'kinayah'          // الكناية
  // علم البديع
  | 'jinas'            // الجناس
  | 'saj'              // السجع
  | 'iqtibas'          // الاقتباس
  | 'tibaq'            // الطباق
  | 'muqabalah'        // المقابلة
  | 'tawriyah'         // التورية
  | 'husn-talil'       // حسن التعليل
  | 'mubalagha';       // المبالغة

export interface BalaghaDefinition {
  arabic: string;
  english: string;
}

export interface TashbihComponents {
  mushabbah: string;      // المشبه (tenor)
  mushabbahBih: string;   // المشبه به (vehicle)
  wajhShabah?: string;    // وجه الشبه (ground)
  adatTashbih?: string;   // أداة التشبيه (marker)
}

export interface BalaghaAnalysis {
  device: BalaghaDeviceType;
  explanation: string;
  tashbihComponents?: TashbihComponents;
  rhetoricalEffect?: string;
}

export interface BalaghaExample {
  id: string;
  source: 'quran' | 'hadith' | 'poetry' | 'prose';
  reference?: string;
  arabic: string;
  translation: string;
  analysis: BalaghaAnalysis;
}

export interface BalaghaLesson {
  id: string;
  branch: BalaghaCategory;
  topic: string;
  topicEn: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  definition: BalaghaDefinition;
  notes: {
    title: string;
    titleArabic: string;
    content: string[];
    keyPoints: string[];
  }[];
  examples: BalaghaExample[];
  exercises: BalaghaExercise[];
}

export type BalaghaExerciseType =
  | 'identify-device'
  | 'analyze-components'
  | 'explain-effect'
  | 'find-examples'
  | 'create-similar'
  | 'compare-devices'
  | 'correct-analysis';

export interface BalaghaExercise {
  id: string;
  type: BalaghaExerciseType;
  prompt: string;
  promptArabic?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  exampleId?: string;  // Reference to example being analyzed
}

export interface BalaghaVocabularyItem {
  id: string;
  term: string;
  termEn: string;
  definition: string;
  definitionEn: string;
  category: BalaghaCategory;
  relatedTerms?: string[];
}

export interface BalaghaManifest {
  version: number;
  generatedAt: string;
  branches: {
    maani: { lessonCount: number; lessonIds: string[] };
    bayan: { lessonCount: number; lessonIds: string[] };
    badi: { lessonCount: number; lessonIds: string[] };
  };
  totalExamples: number;
  vocabularyCount: number;
}
```

**Step 2: Commit**

```bash
git add src/types/balagha.ts
git commit -m "feat(types): add TypeScript types for Balāghah module"
```

---

### Task 3: Create ʿArūḍ TypeScript Types

**Files:**
- Create: `src/types/arud.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/arud.ts

/**
 * Types for ʿArūḍ (Prosody) module
 * Covers: العروض، القافية، أشكال الشعر
 */

export type MeterName =
  | 'tawil'      // الطويل
  | 'madid'      // المديد
  | 'basit'      // البسيط
  | 'wafir'      // الوافر
  | 'kamil'      // الكامل
  | 'hazaj'      // الهزج
  | 'rajaz'      // الرجز
  | 'ramal'      // الرمل
  | 'sari'       // السريع
  | 'munsarih'   // المنسرح
  | 'khafif'     // الخفيف
  | 'mudari'     // المضارع
  | 'muqtadab'   // المقتضب
  | 'mujtathth'  // المجتث
  | 'mutaqarib'  // المتقارب
  | 'mutadarik'; // المتدارك

export type TafilaName =
  | 'faulun'         // فَعُولُنْ
  | 'mafailun'       // مَفَاعِيلُنْ
  | 'failatun'       // فَاعِلَاتُنْ
  | 'mustaf'ilun'    // مُسْتَفْعِلُنْ
  | 'failun'         // فَاعِلُنْ
  | 'mutafailun'     // مُتَفَاعِلُنْ
  | 'mafaalatun'     // مَفَاعَلَتُنْ
  | 'mafulatu';      // مَفْعُولَاتُ

export type PoetryEra =
  | 'jahili'    // الجاهلي
  | 'islami'    // الإسلامي
  | 'umawi'     // الأموي
  | 'abbasi'    // العباسي
  | 'andalusi'; // الأندلسي

export interface MeterPattern {
  tafailat: string[];           // Array of tafila names in Arabic
  symbolic: string;             // Pattern like "//o/o //o/o/o"
  perHemistich: number;         // Feet per half-line
  totalFeet: number;
}

export interface MeterVariation {
  name: string;
  nameEn: string;
  pattern: string;
  notes: string;
}

export interface ScansionData {
  written: string;              // Original text
  prosodic: string;             // Prosodic transcription
  pattern: string;              // Symbolic pattern
  feet: string[];               // Identified tafailat
}

export interface PoetryLineScansion {
  sadr: ScansionData;           // First hemistich
  ajuz: ScansionData;           // Second hemistich
}

export interface PoetryLine {
  number: number;
  sadr: string;                 // صدر البيت
  ajuz: string;                 // عجز البيت
  translation?: string;
  scansion?: PoetryLineScansion;
  vocabulary?: string[];
  rhetoric?: string[];
  grammar?: string[];
}

export interface Poet {
  name: string;
  nameEn: string;
  era: PoetryEra;
  death?: string;
  bio?: string;
}

export interface Poem {
  id: string;
  title: string;
  titleEn?: string;
  poet: Poet;
  meter: MeterName;
  rhyme: string;                // الروي
  theme: string;
  lineCount: number;
  lines: PoetryLine[];
  commentary?: {
    classical?: string[];
    overview?: string;
  };
}

export interface MeterLesson {
  id: string;
  meter: string;                // Arabic name
  meterEn: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prevalence: 'most-common' | 'common' | 'rare';
  pattern: MeterPattern;
  mnemonic: {
    arabic: string;
    explanation: string;
  };
  variations: MeterVariation[];
  examples: {
    id: string;
    poet: string;
    era: PoetryEra;
    source?: string;
    bayt: { sadr: string; ajuz: string };
    scansion: PoetryLineScansion;
    translation: string;
    notes?: string;
  }[];
  exercises: ArudExercise[];
}

export interface ProsodicRule {
  pattern: string;
  rule: string;
  example?: string;
}

export interface ScansionRules {
  prosodicRules: {
    alwaysWritten: ProsodicRule[];
    alwaysOmitted: ProsodicRule[];
  };
  tafailat: Record<string, { pattern: string; weight: string }>;
  zihaafat: Record<string, { removes: string; example: string }>;
}

export type ArudExerciseType =
  | 'prosodic-transcription'
  | 'identify-meter'
  | 'scansion'
  | 'complete-hemistich'
  | 'find-defects'
  | 'match-tafila'
  | 'identify-zihaf'
  | 'compose-meter';

export interface ArudExercise {
  id: string;
  type: ArudExerciseType;
  prompt: string;
  promptArabic?: string;
  options?: string[];
  answer?: string;
  bayt?: { sadr: string; ajuz: string };
  targetMeter?: MeterName;
  explanation?: string;
}

export interface ArudManifest {
  version: number;
  generatedAt: string;
  sections: {
    foundations: { lessonCount: number; lessonIds: string[] };
    meters: { lessonCount: number; lessonIds: string[] };
    qafiyah: { lessonCount: number; lessonIds: string[] };
    forms: { lessonCount: number; lessonIds: string[] };
  };
  anthology: {
    jahili: number;
    islami: number;
    umawi: number;
    abbasi: number;
    andalusi: number;
  };
  vocabularyCount: number;
}
```

**Step 2: Commit**

```bash
git add src/types/arud.ts
git commit -m "feat(types): add TypeScript types for ʿArūḍ (Prosody) module"
```

---

### Task 4: Create Quranic Grammar TypeScript Types

**Files:**
- Create: `src/types/quran-nahw.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/quran-nahw.ts

/**
 * Types for Quranic Grammar module
 * Covers: الإعراب القرآني، القراءات، الأساليب القرآنية
 */

export type GrammaticalCase = 'marfu' | 'mansub' | 'majrur' | 'majzum';

export type GrammaticalFunction =
  | 'mubtada'         // مبتدأ
  | 'khabar'          // خبر
  | 'fail'            // فاعل
  | 'naib-fail'       // نائب فاعل
  | 'mafool-bih'      // مفعول به
  | 'mafool-mutlaq'   // مفعول مطلق
  | 'mafool-lahu'     // مفعول لأجله
  | 'mafool-maahu'    // مفعول معه
  | 'hal'             // حال
  | 'tamyiz'          // تمييز
  | 'sifa'            // صفة
  | 'badal'           // بدل
  | 'atf'             // عطف
  | 'mudaf-ilayh'     // مضاف إليه
  | 'jar-majrur'      // جار ومجرور
  | 'zarf';           // ظرف

export type IltifatType =
  | 'person-ghayba-khitab'    // من الغيبة إلى الخطاب
  | 'person-khitab-ghayba'    // من الخطاب إلى الغيبة
  | 'person-takallum-ghayba'  // من التكلم إلى الغيبة
  | 'person-ghayba-takallum'  // من الغيبة إلى التكلم
  | 'number-mufrad-jam'       // من المفرد إلى الجمع
  | 'number-jam-mufrad'       // من الجمع إلى المفرد
  | 'tense-madi-mudari'       // من الماضي إلى المضارع
  | 'tense-mudari-madi';      // من المضارع إلى الماضي

export type UniqueConstructionType =
  | 'iltifat'           // الالتفات
  | 'hadhf'             // الحذف والتقدير
  | 'taqdim-takhir'     // التقديم والتأخير
  | 'fasl-wasl'         // الفصل والوصل
  | 'idmar-fil'         // إضمار الفعل
  | 'istinaf'           // الاستئناف
  | 'itirad'            // الاعتراض
  | 'atf-ala-mana'      // العطف على المعنى
  | 'haml-lafz-mana'    // الحمل على اللفظ والمعنى
  | 'taghlib'           // التغليب
  | 'nafy-istithna'     // النفي والاستثناء
  | 'shart';            // الشرط

export interface WordIrab {
  word: string;
  irab: string;
  function?: GrammaticalFunction;
  case?: GrammaticalCase;
  components?: { part: string; irab: string }[];
}

export interface AyahIrab {
  number: number;
  text: string;
  translation: string;
  irab: {
    full: WordIrab[];
    sentenceType: string;
    notes: string[];
  };
  qiraat?: {
    reading: string;
    reciters: string[];
    note?: string;
  }[];
  rhetoricalNotes?: string[];
}

export interface SurahStudy {
  id: string;
  surah: string;
  surahNumber: number;
  ayahCount: number;
  overview: {
    names: string[];
    mainThemes: string[];
    grammaticalFeatures: string[];
  };
  ayat: AyahIrab[];
  exercises?: QuranNahwExercise[];
}

export interface IltifatExample {
  id: string;
  surah: string;
  ayah: string;
  arabic: string;
  shiftType: IltifatType;
  analysis: {
    before: string;
    after: string;
    reason: string;
  };
  translation: string;
  rhetoricalEffect: string;
}

export interface UniqueConstructionLesson {
  id: string;
  topic: string;
  topicEn: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  definition: {
    arabic: string;
    english: string;
  };
  types?: {
    name: string;
    nameEn: string;
    subtypes?: string[];
  }[];
  examples: IltifatExample[] | QuranNahwExample[];
  exercises: QuranNahwExercise[];
}

export interface QuranNahwExample {
  id: string;
  surah: string;
  ayah: string;
  arabic: string;
  translation: string;
  construction: UniqueConstructionType;
  analysis: {
    explanation: string;
    grammaticalNote?: string;
    rhetoricalEffect?: string;
  };
}

export type QuranNahwExerciseType =
  | 'parse-word'
  | 'parse-sentence'
  | 'identify-shift'
  | 'explain-case'
  | 'identify-particle'
  | 'compare-qiraat'
  | 'find-ellipsis'
  | 'complete-irab'
  | 'identify-function';

export interface QuranNahwExercise {
  id: string;
  type: QuranNahwExerciseType;
  ayah?: string;
  targetWord?: string;
  question: string;
  questionArabic?: string;
  options?: string[];
  answer: string | number;
  explanation?: string;
}

export interface ParticleLesson {
  id: string;
  particle: string;
  particleEn: string;
  types: {
    name: string;
    usage: string;
    examples: { arabic: string; translation: string; surah?: string }[];
  }[];
  exercises: QuranNahwExercise[];
}

export interface QuranNahwManifest {
  version: number;
  generatedAt: string;
  sections: {
    foundations: { lessonCount: number; lessonIds: string[] };
    uniqueConstructions: { lessonCount: number; lessonIds: string[] };
    particles: { lessonCount: number; lessonIds: string[] };
    qiraat: { lessonCount: number; lessonIds: string[] };
  };
  surahStudies: {
    complete: string[];
    selected: string[];
    juzAmma: string[];
  };
  vocabularyCount: number;
}
```

**Step 2: Commit**

```bash
git add src/types/quran-nahw.ts
git commit -m "feat(types): add TypeScript types for Quranic Grammar module"
```

---

### Task 5: Create Text Analysis TypeScript Types

**Files:**
- Create: `src/types/text-analysis.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/text-analysis.ts

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

export interface MorphologicalAnalysis {
  keyWords: {
    word: string;
    root: string;
    pattern: string;
    type: string;
    singular?: string;
    originalForm?: string;
    note?: string;
  }[];
}

export interface SentenceAnalysis {
  text: string;
  type: string;
  irab: { word: string; function: string }[];
  note?: string;
}

export interface GrammaticalAnalysis {
  sentences: SentenceAnalysis[];
  connectives?: { particle: string; type: string; connects: string }[];
}

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

export interface TextAnalysis {
  morphological?: MorphologicalAnalysis;
  grammatical?: GrammaticalAnalysis;
  rhetorical?: RhetoricalAnalysis;
  semantic?: SemanticAnalysis;
}

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
export interface HadithText {
  id: string;
  collection: string;
  number: number;
  source: {
    primary: string;
    narrator: string;
  };
  text: {
    arabic: string;
    transliteration?: string;
    translation: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  analysis: TextAnalysis;
  contextual?: ContextualInfo;
  exercises?: TextAnalysisExercise[];
}

// Prose-specific types
export interface ProseSection {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  analysis: {
    grammatical?: { phrase: string; irab: string }[];
    rhetorical?: { device: string; effect: string }[];
    stylistic?: string[];
  };
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
  genreFeatures?: {
    elements: { element: string; present: boolean; example?: string }[];
    stylistic_markers: string[];
  };
  vocabulary?: {
    legal_terms?: { word: string; meaning: string; category: string }[];
    rhetorical_terms?: { word: string; meaning: string; usage: string }[];
  };
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
```

**Step 2: Commit**

```bash
git add src/types/text-analysis.ts
git commit -m "feat(types): add TypeScript types for Text Analysis module"
```

---

## Phase 2: Balāghah Content (Tasks 6-15)

### Task 6: Create Balāghah Manifest and Vocabulary

**Files:**
- Create: `src/content/balagha/manifest.json`
- Create: `src/content/balagha/vocabulary.json`

**Step 1: Create manifest.json**

```json
{
  "version": 1,
  "generatedAt": "2026-01-27T00:00:00.000Z",
  "branches": {
    "maani": {
      "lessonCount": 12,
      "lessonIds": [
        "balagha-maani-01", "balagha-maani-02", "balagha-maani-03",
        "balagha-maani-04", "balagha-maani-05", "balagha-maani-06",
        "balagha-maani-07", "balagha-maani-08", "balagha-maani-09",
        "balagha-maani-10", "balagha-maani-11", "balagha-maani-12"
      ]
    },
    "bayan": {
      "lessonCount": 13,
      "lessonIds": [
        "balagha-bayan-01", "balagha-bayan-02", "balagha-bayan-03",
        "balagha-bayan-04", "balagha-bayan-05", "balagha-bayan-06",
        "balagha-bayan-07", "balagha-bayan-08", "balagha-bayan-09",
        "balagha-bayan-10", "balagha-bayan-11", "balagha-bayan-12",
        "balagha-bayan-13"
      ]
    },
    "badi": {
      "lessonCount": 12,
      "lessonIds": [
        "balagha-badi-01", "balagha-badi-02", "balagha-badi-03",
        "balagha-badi-04", "balagha-badi-05", "balagha-badi-06",
        "balagha-badi-07", "balagha-badi-08", "balagha-badi-09",
        "balagha-badi-10", "balagha-badi-11", "balagha-badi-12"
      ]
    }
  },
  "totalExamples": 0,
  "vocabularyCount": 0
}
```

**Step 2: Create vocabulary.json with core terms**

```json
[
  {
    "id": "balagha-term-001",
    "term": "البلاغة",
    "termEn": "Balāghah (Rhetoric)",
    "definition": "علم يُعرف به إيراد المعنى الواحد بطرق مختلفة في وضوح الدلالة",
    "definitionEn": "The science of expressing a single meaning in various ways with clear indication",
    "category": "general",
    "relatedTerms": ["الفصاحة", "البيان"]
  },
  {
    "id": "balagha-term-002",
    "term": "علم المعاني",
    "termEn": "ʿIlm al-Maʿānī (Science of Meanings)",
    "definition": "علم يُعرف به أحوال اللفظ العربي التي بها يطابق مقتضى الحال",
    "definitionEn": "The science of knowing the states of Arabic expression by which it conforms to context",
    "category": "maani",
    "relatedTerms": ["الخبر", "الإنشاء", "القصر"]
  },
  {
    "id": "balagha-term-003",
    "term": "علم البيان",
    "termEn": "ʿIlm al-Bayān (Science of Clarity)",
    "definition": "علم يُعرف به إيراد المعنى الواحد بطرق مختلفة",
    "definitionEn": "The science of expressing a single meaning through different methods",
    "category": "bayan",
    "relatedTerms": ["التشبيه", "الاستعارة", "الكناية"]
  },
  {
    "id": "balagha-term-004",
    "term": "علم البديع",
    "termEn": "ʿIlm al-Badīʿ (Science of Embellishment)",
    "definition": "علم يُعرف به وجوه تحسين الكلام بعد رعاية المطابقة ووضوح الدلالة",
    "definitionEn": "The science of knowing ways to beautify speech after observing appropriateness and clarity",
    "category": "badi",
    "relatedTerms": ["الجناس", "الطباق", "السجع"]
  },
  {
    "id": "balagha-term-005",
    "term": "التشبيه",
    "termEn": "Tashbīh (Simile)",
    "definition": "إلحاق أمر بأمر في صفة بأداة لغرض",
    "definitionEn": "Joining one thing to another in an attribute using a particle for a purpose",
    "category": "bayan",
    "relatedTerms": ["المشبه", "المشبه به", "أداة التشبيه", "وجه الشبه"]
  },
  {
    "id": "balagha-term-006",
    "term": "الاستعارة",
    "termEn": "Istiʿārah (Metaphor)",
    "definition": "استعمال اللفظ في غير ما وضع له لعلاقة المشابهة مع قرينة مانعة من إرادة المعنى الأصلي",
    "definitionEn": "Using a word for other than its original meaning due to similarity, with a context preventing the literal meaning",
    "category": "bayan",
    "relatedTerms": ["الاستعارة التصريحية", "الاستعارة المكنية"]
  },
  {
    "id": "balagha-term-007",
    "term": "الكناية",
    "termEn": "Kināyah (Metonymy/Allusion)",
    "definition": "لفظ أُريد به لازم معناه مع جواز إرادة ذلك المعنى",
    "definitionEn": "An expression intended to convey an implication of its meaning while allowing the literal meaning",
    "category": "bayan",
    "relatedTerms": ["كناية عن صفة", "كناية عن موصوف"]
  },
  {
    "id": "balagha-term-008",
    "term": "الطباق",
    "termEn": "Ṭibāq (Antithesis)",
    "definition": "الجمع بين الشيء وضده في الكلام",
    "definitionEn": "Combining a thing and its opposite in speech",
    "category": "badi",
    "relatedTerms": ["طباق الإيجاب", "طباق السلب"]
  },
  {
    "id": "balagha-term-009",
    "term": "الجناس",
    "termEn": "Jinās (Paronomasia/Wordplay)",
    "definition": "تشابه اللفظين في النطق واختلافهما في المعنى",
    "definitionEn": "Similarity of two words in pronunciation but difference in meaning",
    "category": "badi",
    "relatedTerms": ["الجناس التام", "الجناس الناقص"]
  },
  {
    "id": "balagha-term-010",
    "term": "السجع",
    "termEn": "Sajʿ (Rhymed Prose)",
    "definition": "توافق الفاصلتين في الحرف الأخير",
    "definitionEn": "Agreement of two clause endings in the final letter",
    "category": "badi",
    "relatedTerms": ["السجع المطرف", "السجع المرصع"]
  }
]
```

**Step 3: Commit**

```bash
git add src/content/balagha/manifest.json src/content/balagha/vocabulary.json
git commit -m "feat(content): add Balāghah manifest and core vocabulary"
```

---

### Task 7: Create Balāghah Maʿānī Lesson 1 - الخبر والإنشاء

**Files:**
- Create: `src/content/balagha/maani/lessons/lesson-01.json`

**Step 1: Create the lesson file**

```json
{
  "id": "balagha-maani-01",
  "branch": "maani",
  "topic": "الخبر والإنشاء",
  "topicEn": "Declarative vs Performative Speech",
  "difficulty": "beginner",
  "prerequisites": [],
  "definition": {
    "arabic": "الكلام إما خبر يحتمل الصدق والكذب، أو إنشاء لا يحتمل ذلك",
    "english": "Speech is either declarative (capable of being true or false) or performative (neither true nor false)"
  },
  "notes": [
    {
      "title": "Understanding Khabar (Declarative Speech)",
      "titleArabic": "فهم الخبر",
      "content": [
        "Khabar (الخبر) is any statement that can be verified as true or false. It reports information about reality.",
        "The speaker of khabar can be truthful (صادق) if the statement matches reality, or lying (كاذب) if it doesn't.",
        "Examples: 'The sun rose' - this can be verified. 'Muhammad came' - this can be checked."
      ],
      "keyPoints": [
        "الخبر يحتمل الصدق والكذب - Khabar can be true or false",
        "يُنسب إلى قائله الصدق أو الكذب - The speaker can be called truthful or lying",
        "يُفيد إخبار المخاطب بشيء - It informs the listener of something"
      ],
      "examples": [
        { "arabic": "السَّمَاءُ صَافِيَةٌ", "english": "The sky is clear" },
        { "arabic": "جَاءَ الطَّالِبُ", "english": "The student came" },
        { "arabic": "اللهُ وَاحِدٌ", "english": "Allah is One" }
      ]
    },
    {
      "title": "Understanding Inshā' (Performative Speech)",
      "titleArabic": "فهم الإنشاء",
      "content": [
        "Inshā' (الإنشاء) is speech that doesn't report facts but creates meaning through the act of speaking.",
        "You cannot call a command 'true' or 'false' - it simply requests action.",
        "Inshā' includes commands, prohibitions, questions, wishes, and exclamations."
      ],
      "keyPoints": [
        "الإنشاء لا يحتمل الصدق والكذب - Inshā' cannot be true or false",
        "ينقسم إلى طلبي وغير طلبي - Divided into requestive and non-requestive",
        "الطلبي: الأمر، النهي، الاستفهام، التمني، النداء"
      ],
      "examples": [
        { "arabic": "اقْرَأْ كِتَابَكَ", "english": "Read your book (command)" },
        { "arabic": "لَا تَكْذِبْ", "english": "Don't lie (prohibition)" },
        { "arabic": "هَلْ فَهِمْتَ؟", "english": "Did you understand? (question)" },
        { "arabic": "لَيْتَ الشَّبَابَ يَعُودُ", "english": "If only youth would return (wish)" },
        { "arabic": "يَا مُحَمَّدُ", "english": "O Muhammad (vocative)" }
      ]
    }
  ],
  "examples": [
    {
      "id": "maani-01-ex-01",
      "source": "quran",
      "reference": "الفاتحة: 2",
      "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      "translation": "All praise is due to Allah, Lord of the worlds",
      "analysis": {
        "device": "khabar",
        "explanation": "هذا خبر يُفيد أن الحمد كله مستحق لله، ويحتمل التصديق من السامع",
        "rhetoricalEffect": "Using declarative form for praise emphasizes it as established fact, not mere opinion"
      }
    },
    {
      "id": "maani-01-ex-02",
      "source": "quran",
      "reference": "الفاتحة: 5",
      "arabic": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      "translation": "You alone we worship, and You alone we ask for help",
      "analysis": {
        "device": "khabar",
        "explanation": "خبر في معنى الإنشاء، أي: نعبدك ونستعين بك. الخبر هنا للإنشاء والالتزام",
        "rhetoricalEffect": "Declarative form used for commitment makes the worship statement feel more solemn and binding"
      }
    },
    {
      "id": "maani-01-ex-03",
      "source": "quran",
      "reference": "الفاتحة: 6",
      "arabic": "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      "translation": "Guide us to the straight path",
      "analysis": {
        "device": "insha",
        "explanation": "هذا إنشاء طلبي (دعاء) لا يحتمل الصدق والكذب",
        "rhetoricalEffect": "The imperative form makes this a direct request to Allah, not a statement about reality"
      }
    }
  ],
  "exercises": [
    {
      "id": "maani-01-exercise-01",
      "type": "identify-device",
      "prompt": "Classify this statement: السَّمَاءُ زَرْقَاءُ (The sky is blue)",
      "promptArabic": "صنّف هذه العبارة: السَّمَاءُ زَرْقَاءُ",
      "options": ["خبر (Declarative)", "إنشاء (Performative)"],
      "answer": "خبر (Declarative)",
      "explanation": "This is khabar because it can be verified as true or false"
    },
    {
      "id": "maani-01-exercise-02",
      "type": "identify-device",
      "prompt": "Classify this statement: اجْلِسْ هُنَا (Sit here)",
      "promptArabic": "صنّف هذه العبارة: اجْلِسْ هُنَا",
      "options": ["خبر (Declarative)", "إنشاء (Performative)"],
      "answer": "إنشاء (Performative)",
      "explanation": "This is inshā' (command) - you cannot call it true or false"
    },
    {
      "id": "maani-01-exercise-03",
      "type": "identify-device",
      "prompt": "Classify: مَا أَجْمَلَ السَّمَاءَ! (How beautiful the sky is!)",
      "promptArabic": "صنّف: مَا أَجْمَلَ السَّمَاءَ!",
      "options": ["خبر (Declarative)", "إنشاء (Performative)"],
      "answer": "إنشاء (Performative)",
      "explanation": "Exclamations are inshā' - they express emotion, not verifiable facts"
    },
    {
      "id": "maani-01-exercise-04",
      "type": "explain-effect",
      "prompt": "Why might the Quran use khabar (declarative) form when praising Allah instead of inshā'?",
      "promptArabic": "لماذا قد يستخدم القرآن صيغة الخبر في الثناء على الله بدلاً من الإنشاء؟",
      "answer": "Using declarative form presents praise as established fact rather than personal opinion, emphasizing that Allah's worthiness of praise is objective reality",
      "explanation": "الخبر يُفيد أن الحمد لله حقيقة ثابتة لا رأي شخصي"
    },
    {
      "id": "maani-01-exercise-05",
      "type": "analyze-components",
      "prompt": "In the verse اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ, identify: (1) Is this khabar or inshā'? (2) What type of inshā'?",
      "promptArabic": "في الآية اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ، حدد: (1) هل هذا خبر أم إنشاء؟ (2) ما نوع الإنشاء؟",
      "answer": "This is inshā' ṭalabī (requestive performative), specifically duʿā' (supplication/request)",
      "explanation": "إنشاء طلبي من نوع الدعاء - طلب الهداية من الله"
    }
  ]
}
```

**Step 2: Commit**

```bash
git add src/content/balagha/maani/lessons/lesson-01.json
git commit -m "feat(content): add Balāghah Maʿānī lesson 1 - Khabar vs Inshā'"
```

---

### Task 8: Create Balāghah Bayān Lesson 1 - التشبيه Introduction

**Files:**
- Create: `src/content/balagha/bayan/lessons/lesson-01.json`

**Step 1: Create the lesson file**

```json
{
  "id": "balagha-bayan-01",
  "branch": "bayan",
  "topic": "التشبيه - مقدمة",
  "topicEn": "Simile - Introduction",
  "difficulty": "beginner",
  "prerequisites": [],
  "definition": {
    "arabic": "التشبيه: إلحاق أمر بأمر في صفة مشتركة بينهما بأداة لغرض",
    "english": "Simile: Joining one thing to another in a shared attribute using a particle for a purpose"
  },
  "notes": [
    {
      "title": "The Four Components of Simile",
      "titleArabic": "أركان التشبيه الأربعة",
      "content": [
        "Every simile has up to four components, though not all must be explicit:",
        "1. المشبه (mushabbah) - The tenor: what is being compared",
        "2. المشبه به (mushabbah bih) - The vehicle: what it is compared to",
        "3. أداة التشبيه (adāt al-tashbīh) - The comparison particle: like, as, resembles",
        "4. وجه الشبه (wajh al-shabah) - The ground: the shared quality"
      ],
      "keyPoints": [
        "المشبه والمشبه به هما طرفا التشبيه - The two things compared are the 'sides'",
        "أداة التشبيه قد تُحذف للبلاغة - The particle may be omitted for effect",
        "وجه الشبه هو الصفة المشتركة - The ground is the shared attribute"
      ],
      "examples": [
        { "arabic": "العِلْمُ كَالنُّورِ", "english": "Knowledge is like light" },
        { "arabic": "الجَنْدِيُّ كَالأَسَدِ في الشَّجَاعَةِ", "english": "The soldier is like a lion in bravery" }
      ]
    },
    {
      "title": "Common Comparison Particles",
      "titleArabic": "أدوات التشبيه الشائعة",
      "content": [
        "Arabic has several particles that signal comparison:",
        "الكاف (ka-) - the most common, meaning 'like'",
        "كأنّ (ka'anna) - 'as if', often for vivid comparisons",
        "مثل (mithl) - 'like', 'similar to'",
        "شبه (shibh) - 'resembling'"
      ],
      "keyPoints": [
        "الكاف أكثر أدوات التشبيه استعمالاً",
        "كأنّ تُفيد التشبيه المؤكد والتخييل",
        "حذف الأداة يُقوّي التشبيه"
      ],
      "examples": [
        { "arabic": "هُوَ كَالْبَحْرِ", "english": "He is like the sea (generous)" },
        { "arabic": "كَأَنَّهُ أَسَدٌ", "english": "As if he is a lion" },
        { "arabic": "هُوَ مِثْلُ الْقَمَرِ", "english": "He is like the moon" }
      ]
    },
    {
      "title": "Purpose of Simile",
      "titleArabic": "أغراض التشبيه",
      "content": [
        "Similes serve various rhetorical purposes:",
        "بيان حال المشبه - Clarifying the state of the tenor",
        "بيان مقدار حاله - Showing the degree of a quality",
        "تقرير حاله في نفس السامع - Establishing its state in the listener's mind",
        "تزيين المشبه أو تقبيحه - Beautifying or vilifying the tenor"
      ],
      "keyPoints": [
        "التشبيه يُوضّح المعنى المجرد بالمحسوس",
        "يُقرّب البعيد ويُجسّد المعنوي",
        "يُثير الخيال ويُحرّك العاطفة"
      ],
      "examples": [
        { "arabic": "وَجْهُهَا كَالْقَمَرِ", "english": "Her face is like the moon (beautification)" },
        { "arabic": "قَلْبُهُ كَالْحَجَرِ", "english": "His heart is like stone (vilification)" }
      ]
    }
  ],
  "examples": [
    {
      "id": "bayan-01-ex-01",
      "source": "quran",
      "reference": "البقرة: 17",
      "arabic": "مَثَلُهُمْ كَمَثَلِ الَّذِي اسْتَوْقَدَ نَارًا",
      "translation": "Their example is like that of one who kindled a fire",
      "analysis": {
        "device": "tashbih",
        "tashbihComponents": {
          "mushabbah": "المنافقون",
          "mushabbahBih": "الذي استوقد ناراً",
          "adatTashbih": "كـ",
          "wajhShabah": "فقدان الهداية بعد ظهورها"
        },
        "explanation": "شبّه المنافقين بمن أوقد ناراً ثم انطفأت، فبقي في ظلمة",
        "rhetoricalEffect": "The extended simile makes the abstract concept of hypocrisy concrete and memorable"
      }
    },
    {
      "id": "bayan-01-ex-02",
      "source": "quran",
      "reference": "البقرة: 261",
      "arabic": "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ",
      "translation": "The example of those who spend their wealth in the way of Allah is like a seed which grows seven spikes",
      "analysis": {
        "device": "tashbih",
        "tashbihComponents": {
          "mushabbah": "إنفاق المال في سبيل الله",
          "mushabbahBih": "حبة أنبتت سبع سنابل",
          "adatTashbih": "كـ",
          "wajhShabah": "المضاعفة والنماء"
        },
        "explanation": "شبّه ثواب الإنفاق في سبيل الله بالحبة التي تُنبت سبع سنابل، في كل سنبلة مئة حبة",
        "rhetoricalEffect": "Makes the abstract reward tangible through agricultural imagery familiar to the audience"
      }
    },
    {
      "id": "bayan-01-ex-03",
      "source": "poetry",
      "reference": "المتنبي",
      "arabic": "أَنَا الَّذِي نَظَرَ الأَعْمَى إِلَى أَدَبِي ... وَأَسْمَعَتْ كَلِمَاتِي مَنْ بِهِ صَمَمُ",
      "translation": "I am the one whose literature even the blind have seen, and whose words even the deaf have heard",
      "analysis": {
        "device": "tashbih",
        "explanation": "تشبيه ضمني: شبّه وضوح أدبه بشيء يراه حتى الأعمى، وشبّه قوة كلماته بما يسمعه حتى الأصم",
        "rhetoricalEffect": "Hyperbolic simile emphasizes the poet's fame and impact through paradoxical imagery"
      }
    }
  ],
  "exercises": [
    {
      "id": "bayan-01-exercise-01",
      "type": "analyze-components",
      "prompt": "Identify the four components of this simile: العِلْمُ كَالنُّورِ في الهِدَايَةِ",
      "promptArabic": "حدد أركان التشبيه الأربعة في: العِلْمُ كَالنُّورِ في الهِدَايَةِ",
      "answer": "المشبه: العلم | المشبه به: النور | أداة التشبيه: الكاف | وجه الشبه: الهداية",
      "explanation": "All four components are explicit in this complete simile"
    },
    {
      "id": "bayan-01-exercise-02",
      "type": "analyze-components",
      "prompt": "In مَثَلُهُمْ كَمَثَلِ الَّذِي اسْتَوْقَدَ نَارًا, identify: What is being compared to what?",
      "promptArabic": "في مَثَلُهُمْ كَمَثَلِ الَّذِي اسْتَوْقَدَ نَارًا، ما المشبه وما المشبه به؟",
      "answer": "المشبه: المنافقون (هم) | المشبه به: الذي استوقد ناراً",
      "explanation": "The hypocrites are compared to one who kindles a fire (then loses its light)"
    },
    {
      "id": "bayan-01-exercise-03",
      "type": "identify-device",
      "prompt": "What comparison particle is used in: كَأَنَّ وَجْهَهَا الشَّمْسُ?",
      "promptArabic": "ما أداة التشبيه في: كَأَنَّ وَجْهَهَا الشَّمْسُ؟",
      "options": ["الكاف", "كأنّ", "مثل", "شبه"],
      "answer": "كأنّ",
      "explanation": "كأنّ is used for vivid comparisons, often implying the comparison is almost literal"
    },
    {
      "id": "bayan-01-exercise-04",
      "type": "explain-effect",
      "prompt": "Why does the Quran use agricultural imagery (seeds, crops) when describing charity rewards?",
      "promptArabic": "لماذا يستخدم القرآن صور الزراعة (الحبوب، المحاصيل) عند وصف ثواب الصدقة؟",
      "answer": "Agricultural imagery was familiar to the audience, made abstract rewards concrete, and effectively conveyed the concept of multiplication/growth",
      "explanation": "The simile connects abstract spiritual rewards to tangible, observable phenomena the audience understood"
    },
    {
      "id": "bayan-01-exercise-05",
      "type": "create-similar",
      "prompt": "Create a simile comparing 'patience' (الصبر) to something using the particle كـ",
      "promptArabic": "أنشئ تشبيهاً يُقارن الصبر بشيء باستخدام الكاف",
      "answer": "Examples: الصبر كالدواء المر (Patience is like bitter medicine) | الصبر كالسيف القاطع",
      "explanation": "Open-ended creative exercise - various valid answers possible"
    }
  ]
}
```

**Step 2: Commit**

```bash
git add src/content/balagha/bayan/lessons/lesson-01.json
git commit -m "feat(content): add Balāghah Bayān lesson 1 - Tashbīh introduction"
```

---

## Phase 3: Continue Content Creation (Tasks 9-30)

The pattern established in Tasks 7-8 should be repeated for all remaining lessons. Due to the size of this implementation, I'll outline the remaining tasks at a higher level:

### Tasks 9-15: Complete Balāghah Maʿānī Lessons (2-12)
- Lesson 02: أضرب الخبر (Types of Declarative)
- Lesson 03: خروج الخبر عن مقتضى الظاهر
- Lesson 04: أغراض الخبر (Purposes of Declarative)
- Lesson 05: الإنشاء الطلبي (Requestive Performatives)
- Lesson 06: الأمر والنهي (Command & Prohibition)
- Lesson 07: الاستفهام (Interrogation)
- Lesson 08: التمني والنداء (Wishing & Vocative)
- Lesson 09: القصر (Restriction)
- Lesson 10: الوصل والفصل (Conjunction & Disjunction)
- Lesson 11: الإيجاز والإطناب (Concision & Prolixity)
- Lesson 12: المساواة (Equivalence)

### Tasks 16-28: Complete Balāghah Bayān Lessons (2-13)
- Follow the same pattern as lesson-01.json

### Tasks 29-40: Complete Balāghah Badīʿ Lessons (1-12)
- Follow the same pattern

### Tasks 41-45: Create Balāghah Examples Files
- `src/content/balagha/examples/quran.json`
- `src/content/balagha/examples/hadith.json`
- `src/content/balagha/examples/poetry.json`
- `src/content/balagha/examples/prose.json`

---

## Phase 4: ʿArūḍ Content (Tasks 46-75)

### Task 46: Create ʿArūḍ Manifest and Vocabulary

Similar pattern to Balāghah, creating:
- `src/content/arud/manifest.json`
- `src/content/arud/vocabulary.json`

### Tasks 47-52: ʿArūḍ Foundations Lessons (1-6)
### Tasks 53-68: ʿArūḍ Meters Lessons (1-16)
### Tasks 69-74: ʿArūḍ Qāfiyah Lessons (1-6)
### Task 75: Scansion Rules Data
- `src/content/arud/tools/scansion-rules.json`

---

## Phase 5: Quranic Grammar Content (Tasks 76-110)

### Task 76: Create Quranic Grammar Manifest and Vocabulary
### Tasks 77-81: Foundations Lessons (1-5)
### Tasks 82-93: Unique Constructions Lessons (1-12)
### Tasks 94-103: Particles Lessons (1-10)
### Tasks 104-109: Qiraat Lessons (1-6)
### Task 110: Surah Al-Fatiha Complete I'rab

---

## Phase 6: Text Analysis Content (Tasks 111-140)

### Task 111: Create Text Analysis Manifest and Vocabulary
### Tasks 112-120: Methodology Lessons (1-9)
### Tasks 121-130: Nawawi 40 Hadith (first 10)
### Tasks 131-135: Prose Texts (5 khutab)
### Tasks 136-140: Genre Comparison Data

---

## Phase 7: Service Layer (Tasks 141-150)

### Task 141: Create Balāghah Service

**Files:**
- Create: `src/lib/balaghaService.ts`

```typescript
// Basic service for loading and querying Balāghah content
import type { BalaghaLesson, BalaghaManifest, BalaghaVocabularyItem } from '../types/balagha';

export async function getBalaghaManifest(): Promise<BalaghaManifest> {
  const manifest = await import('../content/balagha/manifest.json');
  return manifest.default as BalaghaManifest;
}

export async function getBalaghaLesson(branch: string, lessonNum: number): Promise<BalaghaLesson> {
  const lesson = await import(`../content/balagha/${branch}/lessons/lesson-${String(lessonNum).padStart(2, '0')}.json`);
  return lesson.default as BalaghaLesson;
}

export async function getBalaghaVocabulary(): Promise<BalaghaVocabularyItem[]> {
  const vocab = await import('../content/balagha/vocabulary.json');
  return vocab.default as BalaghaVocabularyItem[];
}
```

### Tasks 142-144: Create ʿArūḍ, Quranic Grammar, Text Analysis Services

### Tasks 145-150: Update Main Content Index and Types Export

---

## Execution Notes

**Estimated Total Tasks:** ~150 tasks
**Estimated Content Files:** ~200+ JSON files
**Commit Frequency:** After each task

**Priority Order:**
1. Types (foundation for everything)
2. Balāghah (most foundational module)
3. Text Analysis (provides practical application)
4. ʿArūḍ (specialized but independent)
5. Quranic Grammar (builds on all others)

**Quality Checklist per Lesson:**
- [ ] Valid JSON syntax
- [ ] All Arabic text properly vocalized
- [ ] English translations accurate
- [ ] 3+ examples minimum
- [ ] 5+ exercises minimum
- [ ] Exercises cover different types
- [ ] References are accurate (Quran, Hadith)

---

## Next Actions

After this plan is approved:
1. Create a git worktree for this feature
2. Execute Phase 1 (Tasks 1-5) to set up foundation
3. Execute Phase 2 (Tasks 6-15) to complete first module section
4. Review and iterate

---

Plan complete and saved to `docs/plans/2026-01-27-classical-arabic-modules-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
