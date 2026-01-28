/**
 * I'rab (إعراب) - Arabic Case Marking System Types
 *
 * I'rab refers to the system of case endings in Arabic that indicate
 * the grammatical function of words in a sentence.
 */

/**
 * The three grammatical cases in Arabic
 */
export type GrammaticalCase =
  | 'marfu'    // مرفوع - Nominative (subject, predicate)
  | 'mansub'   // منصوب - Accusative (direct object, after certain particles)
  | 'majrur';  // مجرور - Genitive (after prepositions, in idafa)

/**
 * Grammatical functions that words can have in Arabic sentences
 */
export type GrammaticalFunction =
  // Nominal sentence components
  | 'mubtada'       // مبتدأ - Subject of nominal sentence
  | 'khabar'        // خبر - Predicate of nominal sentence

  // Verbal sentence components
  | 'fail'          // فاعل - Subject/doer of verb
  | 'mafool_bih'    // مفعول به - Direct object
  | 'naib_fail'     // نائب الفاعل - Deputy subject (passive voice)

  // Modifiers and additions
  | 'sifa'          // صفة/نعت - Adjective/descriptor
  | 'mudaf'         // مضاف - First part of idafa (possessive)
  | 'mudaf_ilayh'   // مضاف إليه - Second part of idafa
  | 'hal'           // حال - Circumstantial accusative
  | 'tamyiz'        // تمييز - Specification/distinction
  | 'badal'         // بدل - Substitute/appositive
  | 'atf'           // عطف - Conjunction follower

  // After particles
  | 'majrur_bi_harf' // مجرور بحرف جر - After preposition
  | 'ism_inna'       // اسم إنّ - Subject of inna and sisters
  | 'khabar_inna'    // خبر إنّ - Predicate of inna and sisters
  | 'ism_kana'       // اسم كان - Subject of kana and sisters
  | 'khabar_kana'    // خبر كان - Predicate of kana and sisters

  // Adverbials
  | 'mafool_fih'    // مفعول فيه/ظرف - Adverb of time/place
  | 'mafool_mutlaq' // مفعول مطلق - Cognate accusative
  | 'mafool_lahu'   // مفعول لأجله - Adverb of reason
  | 'mafool_maahu'  // مفعول معه - Accusative of accompaniment

  // Additional functions
  | 'munada'        // منادى - Vocative
  | 'mustathna'     // مستثنى - Excepted noun
  | 'tawkeed'       // توكيد - Emphasis

  // Verbs of thinking (ظن وأخواتها)
  | 'mafool_bih_awwal'  // مفعول به أول - First object
  | 'mafool_bih_thani'  // مفعول به ثان - Second object

  // لا النافية للجنس
  | 'ism_la'        // اسم لا - Subject of la (absolute negation)
  | 'khabar_la'     // خبر لا - Predicate of la

  // Conditional sentences
  | 'fiel_shart'    // فعل الشرط - Condition verb
  | 'jawab_shart'   // جواب الشرط - Answer to condition

  // Verbs of imminence/hope/beginning
  | 'ism_kada'      // اسم كاد - Subject of kada and sisters
  | 'khabar_kada';  // خبر كاد - Predicate of kada (verbal sentence)

/**
 * Arabic labels for grammatical cases
 */
export const CASE_LABELS: Record<GrammaticalCase, { ar: string; en: string; marker: string }> = {
  marfu: { ar: 'مرفوع', en: 'Nominative', marker: 'ضمة (ـُ)' },
  mansub: { ar: 'منصوب', en: 'Accusative', marker: 'فتحة (ـَ)' },
  majrur: { ar: 'مجرور', en: 'Genitive', marker: 'كسرة (ـِ)' },
};

/**
 * Arabic labels for grammatical functions
 */
export const FUNCTION_LABELS: Record<GrammaticalFunction, { ar: string; en: string; case: GrammaticalCase }> = {
  mubtada: { ar: 'مُبْتَدَأ', en: 'Subject (nominal)', case: 'marfu' },
  khabar: { ar: 'خَبَر', en: 'Predicate (nominal)', case: 'marfu' },
  fail: { ar: 'فَاعِل', en: 'Subject (verbal)', case: 'marfu' },
  mafool_bih: { ar: 'مَفْعُول بِهِ', en: 'Direct object', case: 'mansub' },
  naib_fail: { ar: 'نَائِب الفَاعِل', en: 'Deputy subject', case: 'marfu' },
  sifa: { ar: 'صِفَة / نَعْت', en: 'Adjective', case: 'marfu' }, // follows mawsuf
  mudaf: { ar: 'مُضَاف', en: 'Possessor (1st)', case: 'marfu' }, // case varies
  mudaf_ilayh: { ar: 'مُضَاف إِلَيْهِ', en: 'Possessed (2nd)', case: 'majrur' },
  hal: { ar: 'حَال', en: 'Circumstantial', case: 'mansub' },
  tamyiz: { ar: 'تَمْيِيز', en: 'Specification', case: 'mansub' },
  badal: { ar: 'بَدَل', en: 'Appositive', case: 'marfu' }, // follows mubdal minhu
  atf: { ar: 'مَعْطُوف', en: 'Conjoined', case: 'marfu' }, // follows matuf alayh
  majrur_bi_harf: { ar: 'مَجْرُور بِحَرْف جَرّ', en: 'After preposition', case: 'majrur' },
  ism_inna: { ar: 'اسْم إِنَّ', en: 'Subject of inna', case: 'mansub' },
  khabar_inna: { ar: 'خَبَر إِنَّ', en: 'Predicate of inna', case: 'marfu' },
  ism_kana: { ar: 'اسْم كَان', en: 'Subject of kana', case: 'marfu' },
  khabar_kana: { ar: 'خَبَر كَان', en: 'Predicate of kana', case: 'mansub' },
  mafool_fih: { ar: 'ظَرْف / مَفْعُول فِيهِ', en: 'Adverb (time/place)', case: 'mansub' },
  mafool_mutlaq: { ar: 'مَفْعُول مُطْلَق', en: 'Cognate accusative', case: 'mansub' },
  mafool_lahu: { ar: 'مَفْعُول لَهُ', en: 'Adverb of reason', case: 'mansub' },
  mafool_maahu: { ar: 'مَفْعُول مَعَهُ', en: 'Accusative of accompaniment', case: 'mansub' },
  munada: { ar: 'مُنَادَى', en: 'Vocative', case: 'mansub' },
  mustathna: { ar: 'مُسْتَثْنَى', en: 'Excepted noun', case: 'mansub' },
  tawkeed: { ar: 'تَوْكِيد', en: 'Emphasis', case: 'marfu' },
  mafool_bih_awwal: { ar: 'مَفْعُول بِهِ أَوَّل', en: 'First object', case: 'mansub' },
  mafool_bih_thani: { ar: 'مَفْعُول بِهِ ثَانٍ', en: 'Second object', case: 'mansub' },
  ism_la: { ar: 'اسْم لَا', en: 'Subject of la', case: 'mansub' },
  khabar_la: { ar: 'خَبَر لَا', en: 'Predicate of la', case: 'marfu' },
  fiel_shart: { ar: 'فِعْل الشَّرْط', en: 'Condition verb', case: 'marfu' },
  jawab_shart: { ar: 'جَوَاب الشَّرْط', en: 'Answer to condition', case: 'marfu' },
  ism_kada: { ar: 'اسْم كَادَ', en: 'Subject of kada', case: 'marfu' },
  khabar_kada: { ar: 'خَبَر كَادَ', en: 'Predicate of kada', case: 'mansub' },
};

/**
 * A word in a sentence that needs to be parsed for i'rab
 */
export interface IrabWord {
  /** The word ID for tracking */
  id: string;
  /** The Arabic word with tashkeel */
  text: string;
  /** The correct grammatical function */
  function: GrammaticalFunction;
  /** The correct grammatical case */
  case: GrammaticalCase;
  /** Optional explanation for why this word has this function/case */
  explanation?: string;
  /** Whether this word is the target for identification (some exercises focus on specific words) */
  isTarget?: boolean;
}

/**
 * Types of I'rab exercises
 */
export type IrabExerciseMode =
  | 'identify-case'      // Given a word, identify its case (marfu/mansub/majrur)
  | 'identify-function'  // Given a word, identify its grammatical function
  | 'full-parse'         // Parse all words in a sentence
  | 'explain-why'        // Explain why a word has a certain case
  | 'select-correct'     // Select the correctly voweled word for a position
  | 'fix-case';          // Fix incorrect case marking

/**
 * Difficulty level for exercises
 */
export type IrabDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Base I'rab exercise interface
 */
export interface BaseIrabExercise {
  id: string;
  mode: IrabExerciseMode;
  difficulty: IrabDifficulty;
  /** The full sentence being analyzed */
  sentence: string;
  /** English translation of the sentence */
  translation: string;
  /** The words in the sentence with their i'rab analysis */
  words: IrabWord[];
  /** Grammar concept being tested (e.g., "nominal sentence", "idafa") */
  concept?: string;
  /** Hint to show the user */
  hint?: string;
}

/**
 * Exercise to identify the case of a highlighted word
 */
export interface IdentifyCaseExercise extends BaseIrabExercise {
  mode: 'identify-case';
  /** Index of the target word in the words array */
  targetWordIndex: number;
}

/**
 * Exercise to identify the grammatical function of a highlighted word
 */
export interface IdentifyFunctionExercise extends BaseIrabExercise {
  mode: 'identify-function';
  /** Index of the target word in the words array */
  targetWordIndex: number;
  /** Options to choose from (to limit difficulty) */
  options?: GrammaticalFunction[];
}

/**
 * Exercise to parse all words in a sentence
 */
export interface FullParseExercise extends BaseIrabExercise {
  mode: 'full-parse';
}

/**
 * Exercise to explain why a word has a certain case
 */
export interface ExplainWhyExercise extends BaseIrabExercise {
  mode: 'explain-why';
  /** Index of the target word in the words array */
  targetWordIndex: number;
  /** The correct explanation (for validation) */
  correctExplanation: string;
  /** Multiple choice explanations */
  explanationOptions: string[];
}

/**
 * Exercise to select the correctly voweled word
 */
export interface SelectCorrectExercise extends BaseIrabExercise {
  mode: 'select-correct';
  /** Index of the word position in sentence */
  targetWordIndex: number;
  /** Options with different case markings (one is correct) */
  wordOptions: string[];
}

/**
 * Exercise to fix incorrect case marking
 */
export interface FixCaseExercise extends BaseIrabExercise {
  mode: 'fix-case';
  /** The sentence with incorrect case marking */
  incorrectSentence: string;
  /** Index of the word that has the wrong case */
  targetWordIndex: number;
}

/**
 * Union type of all I'rab exercise types
 */
export type IrabExercise =
  | IdentifyCaseExercise
  | IdentifyFunctionExercise
  | FullParseExercise
  | ExplainWhyExercise
  | SelectCorrectExercise
  | FixCaseExercise;

/**
 * Result of an I'rab exercise attempt
 */
export interface IrabExerciseResult {
  exerciseId: string;
  isCorrect: boolean;
  userAnswer: GrammaticalCase | GrammaticalFunction | string | Record<number, GrammaticalFunction>;
  correctAnswer: GrammaticalCase | GrammaticalFunction | string | Record<number, GrammaticalFunction>;
  responseTimeMs: number;
  /** For full-parse, track individual word results */
  wordResults?: Array<{
    wordId: string;
    isCorrect: boolean;
    userFunction?: GrammaticalFunction;
    correctFunction: GrammaticalFunction;
  }>;
}

/**
 * Progress tracking for I'rab concepts
 */
export interface IrabProgress {
  /** Total exercises attempted */
  totalAttempts: number;
  /** Total correct answers */
  correctAnswers: number;
  /** Mastery by concept area */
  conceptMastery: Record<string, number>;
  /** Mastery by grammatical function */
  functionMastery: Record<GrammaticalFunction, number>;
  /** Mastery by case */
  caseMastery: Record<GrammaticalCase, number>;
  /** Last practiced timestamp */
  lastPracticed?: number;
}
