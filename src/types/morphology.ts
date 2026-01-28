/**
 * Arabic Morphology (Sarf) Types
 * 
 * These types model the Arabic root-pattern system for vocabulary learning.
 * Based on data from Alqalam Institute's sarf exercises.
 */

/** Arabic verb forms (awzan) - I through X plus quadriliterals */
export type VerbForm = 
  | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X'
  | 'I-Q' | 'II-Q' | 'XI' | 'quad-II';

/** Root types based on the letters in the root */
export type RootType = 
  | 'saleem'          // Sound/regular (صحيح سالم)
  | 'mahmooz'         // Contains hamza (مهموز)
  | 'mudaaf'          // Doubled/geminate (مضعّف)
  | 'mithal'          // First letter is weak (مثال)
  | 'mithal-wawi'     // First letter is waw (مثال واوي)
  | 'mithal-ya'       // First letter is ya (مثال يائي)
  | 'ajwaf'           // Middle letter is weak (أجوف)
  | 'ajwaf-wawi'      // Middle letter is waw (أجوف واوي)
  | 'ajwaf-ya'        // Middle letter is ya (أجوف يائي)
  | 'naqis'           // Last letter is weak (ناقص)
  | 'naqis-wawi'      // Last letter is waw (ناقص واوي)
  | 'naqis-ya'        // Last letter is ya (ناقص يائي)
  | 'lafif'           // Two weak letters (لفيف)
  | 'lafif-maqrun'    // Two adjacent weak letters
  | 'lafif-mafruq';   // Two separated weak letters

/** Word categories derived from roots */
export type WordCategory = 
  | 'verb'              // فعل
  | 'masdar'            // مصدر (verbal noun)
  | 'active-participle' // اسم فاعل
  | 'passive-participle'// اسم مفعول  
  | 'noun'              // اسم
  | 'adjective';        // صفة

/** Difficulty levels */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * A word derived from an Arabic root with its morphological data.
 */
export interface SarfWord {
  /** Unique identifier */
  id: number;
  
  /** The Arabic word with tashkeel */
  word: string;
  
  /** Transliteration in Latin script */
  transliteration: string;
  
  /** Word category (verb, masdar, etc.) */
  category: WordCategory;
  
  /** The trilateral/quadrilateral root (e.g., "ك ت ب") */
  root: string;
  
  /** The Arabic pattern (e.g., "فَعَلَ", "فَاعِل") */
  pattern: string;
  
  /** Transliterated pattern (e.g., "fa'ala") */
  patternTranslit: string;
  
  /** Verb form (I-X) for verbs and derived words */
  verbForm?: VerbForm;
  
  /** English meaning/translation */
  meaning: string;
  
  /** Usage notes and context */
  usage?: string;
  
  /** Common prepositions used with this word */
  prepositions?: string[];
  
  /** Example sentence in Arabic */
  exampleSentence?: string;
  
  /** English translation of example */
  exampleTranslation?: string;
  
  /** Difficulty level */
  difficulty: Difficulty;
  
  /** Root type classification */
  rootType?: RootType;
  
  /** Unit/lesson number in curriculum */
  unit?: string;
}

/**
 * A root family groups all words derived from the same root.
 * This enables teaching vocabulary through morphological relationships.
 */
export interface RootFamily {
  /** The trilateral/quadrilateral root (e.g., "ك ت ب") */
  root: string;
  
  /** Root letters as array for display ["ك", "ت", "ب"] */
  rootLetters: string[];
  
  /** Core meaning shared by all derivatives */
  coreMeaning: string;
  
  /** Root type classification */
  rootType: RootType;
  
  /** All words derived from this root */
  words: SarfWord[];
  
  /** Count by category for quick reference */
  categoryCounts: Partial<Record<WordCategory, number>>;
  
  /** Verb forms present in this family */
  verbForms: VerbForm[];
  
  /** Minimum difficulty among words */
  minDifficulty: Difficulty;
}

/**
 * Sarf exercise types for root-pattern learning
 */
export type SarfExerciseType = 
  | 'identify-root'        // Given a word, identify its root
  | 'identify-pattern'     // Given a word, identify its pattern
  | 'apply-pattern'        // Given root + pattern, produce the word
  | 'root-family-meaning'  // Match words from same root to meanings
  | 'pattern-family'       // Group words by shared pattern
  | 'verb-form-identify'   // Identify verb form (I-X)
  | 'derive-word';         // Given a root and category, produce the word

/**
 * A sarf exercise for morphology practice
 */
export interface SarfExercise {
  id: string;
  type: SarfExerciseType;
  
  /** The word being tested */
  word: SarfWord;
  
  /** For root/pattern identification */
  prompt: string;
  
  /** Expected answer(s) */
  answer: string;
  acceptableAnswers?: string[];
  
  /** Distractor options for multiple choice */
  distractors?: string[];
  
  /** Related words for context */
  relatedWords?: SarfWord[];
  
  /** Hint showing the pattern or root */
  hint?: string;
  
  /** Difficulty */
  difficulty: Difficulty;
}

/**
 * Complete sarf data structure
 */
export interface SarfData {
  version: string;
  generatedAt: string;
  words: SarfWord[];
  rootFamilies: RootFamily[];
}

/**
 * Pattern information for teaching
 */
export interface PatternInfo {
  /** The Arabic pattern (e.g., "فَاعِل") */
  pattern: string;
  
  /** Transliteration */
  patternTranslit: string;
  
  /** What this pattern typically indicates */
  meaning: string;
  
  /** Category this pattern produces */
  category: WordCategory;
  
  /** Associated verb form */
  verbForm?: VerbForm;
  
  /** Example words following this pattern */
  examples: string[];
}

/** Common Form I patterns */
export const FORM_I_PATTERNS: PatternInfo[] = [
  {
    pattern: 'فَعَلَ',
    patternTranslit: "fa'ala",
    meaning: 'Past tense verb (he did)',
    category: 'verb',
    verbForm: 'I',
    examples: ['كَتَبَ', 'ذَهَبَ', 'جَلَسَ'],
  },
  {
    pattern: 'يَفْعُلُ',
    patternTranslit: "yaf'ulu",
    meaning: 'Present tense (he does)',
    category: 'verb',
    verbForm: 'I',
    examples: ['يَكْتُبُ', 'يَنْصُرُ'],
  },
  {
    pattern: 'فَاعِل',
    patternTranslit: "fā'il",
    meaning: 'Active participle (one who does)',
    category: 'active-participle',
    verbForm: 'I',
    examples: ['كَاتِب', 'قَارِئ', 'ذَاهِب'],
  },
  {
    pattern: 'مَفْعُول',
    patternTranslit: "maf'ūl",
    meaning: 'Passive participle (that which is done)',
    category: 'passive-participle',
    verbForm: 'I',
    examples: ['مَكْتُوب', 'مَعْلُوم'],
  },
  {
    pattern: 'مَفْعَل',
    patternTranslit: "maf'al",
    meaning: 'Place/time noun (where/when it is done)',
    category: 'noun',
    verbForm: 'I',
    examples: ['مَكْتَب', 'مَسْجِد'],
  },
  {
    pattern: 'فِعَالَة',
    patternTranslit: "fi'āla",
    meaning: 'Verbal noun (masdar) - the act of',
    category: 'masdar',
    verbForm: 'I',
    examples: ['كِتَابَة', 'قِرَاءَة'],
  },
];

/** Verb form meanings */
export const VERB_FORM_MEANINGS: Record<VerbForm, string> = {
  'I': 'Base form - basic meaning',
  'II': 'Intensive/causative - فَعَّلَ',
  'III': 'Reciprocal/attempted - فَاعَلَ', 
  'IV': 'Causative/transitive - أَفْعَلَ',
  'V': 'Reflexive of II - تَفَعَّلَ',
  'VI': 'Reciprocal/mutual - تَفَاعَلَ',
  'VII': 'Passive/reflexive - اِنْفَعَلَ',
  'VIII': 'Reflexive/middle - اِفْتَعَلَ',
  'IX': 'Colors/defects - اِفْعَلَّ',
  'X': 'Seeking/considering - اِسْتَفْعَلَ',
  'I-Q': 'Quadrilateral base',
  'II-Q': 'Quadrilateral Form II',
  'XI': 'Extended form',
  'quad-II': 'Quadrilateral intensive',
};
