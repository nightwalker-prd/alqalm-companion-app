export type ExerciseType =
  | 'fill-blank'
  | 'translate-to-arabic'
  | 'word-to-meaning'
  | 'meaning-to-word'
  | 'construct-sentence'
  | 'grammar-apply'
  | 'error-correction'
  | 'multi-cloze'
  | 'semantic-field'
  | 'sentence-unscramble';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  itemIds: string[];
}

export interface FillBlankExercise extends BaseExercise {
  type: 'fill-blank';
  prompt: string;
  promptEn?: string;
  answer: string;
}

export interface TranslateExercise extends BaseExercise {
  type: 'translate-to-arabic';
  prompt: string;
  answer: string;
}

export interface WordToMeaningExercise extends BaseExercise {
  type: 'word-to-meaning';
  prompt: string;
  answer: string;
}

export interface MeaningToWordExercise extends BaseExercise {
  type: 'meaning-to-word';
  prompt: string;
  answer: string;
}

export interface ConstructSentenceExercise extends BaseExercise {
  type: 'construct-sentence';
  words: string[];
  answer: string;
}

export interface GrammarApplyExercise extends BaseExercise {
  type: 'grammar-apply';
  prompt: string;
  promptEn?: string;
  answer: string;
}

/**
 * Error type for error correction exercises
 */
export type ErrorType =
  | 'gender'           // Wrong gender agreement (masc/fem)
  | 'number'           // Wrong number agreement (singular/dual/plural)
  | 'case'             // Wrong case ending (nominative/accusative/genitive)
  | 'definiteness'     // Wrong definite/indefinite article
  | 'word_order'       // Words in wrong order
  | 'vocabulary'       // Wrong word used
  | 'tashkeel'         // Wrong diacritical marks
  | 'spelling';        // Spelling mistake

/**
 * Error correction exercise - find and fix the mistake
 * Based on research showing error analysis builds deeper understanding
 */
export interface ErrorCorrectionExercise extends BaseExercise {
  type: 'error-correction';
  /** The sentence containing an error */
  sentenceWithError: string;
  /** The correct version of the sentence */
  correctSentence: string;
  /** The specific word/phrase that is wrong */
  errorWord: string;
  /** The correct word/phrase */
  correctWord: string;
  /** Type of error (for feedback) */
  errorType: ErrorType;
  /** English translation hint */
  englishHint?: string;
  /** Explanation of the error (shown after) */
  explanation?: string;
}

/**
 * Represents a single blank in a multi-cloze exercise
 */
export interface ClozeBlank {
  /** Position index in the sentence (0-based word index) */
  position: number;
  /** The correct answer for this blank */
  answer: string;
  /** Optional hint for this specific blank */
  hint?: string;
}

/**
 * Multi-cloze exercise - sentence with 2-3 blanks to fill
 * Based on research showing that multiple retrieval attempts in context
 * strengthen associative memory networks
 */
export interface MultiClozeExercise extends BaseExercise {
  type: 'multi-cloze';
  /** The sentence template with blanks marked as _____ */
  prompt: string;
  /** English translation hint */
  promptEn?: string;
  /** Array of blanks with their positions and answers */
  blanks: ClozeBlank[];
  /** Original complete sentence (for reference) */
  completeSentence: string;
}

/**
 * A word item for semantic field categorization
 */
export interface SemanticWord {
  /** The Arabic word */
  arabic: string;
  /** English meaning */
  english: string;
  /** The category this word belongs to */
  category: string;
}

/**
 * A category in a semantic field exercise
 */
export interface SemanticCategory {
  /** Category identifier */
  id: string;
  /** Category name in English */
  nameEn: string;
  /** Category name in Arabic */
  nameAr: string;
}

/**
 * Semantic field mapping exercise - categorize words by meaning
 * Based on research showing that organizing vocabulary by semantic
 * relationships strengthens memory networks and aids retrieval
 */
export interface SemanticFieldExercise extends BaseExercise {
  type: 'semantic-field';
  /** The categories to sort words into */
  categories: SemanticCategory[];
  /** All words to be categorized (shuffled for display) */
  words: SemanticWord[];
  /** Optional instruction text */
  instruction?: string;
}

/**
 * A word tile in a sentence unscramble exercise
 */
export interface UnscrambleWord {
  /** The word text */
  text: string;
  /** Unique ID for the tile */
  id: string;
  /** Whether this is a distractor (doesn't belong in the sentence) */
  isDistractor: boolean;
}

/**
 * Sentence unscramble exercise with distractors
 * User must arrange words in correct order, ignoring distractors.
 * Based on research showing that discrimination tasks (selecting correct
 * items while rejecting foils) strengthen pattern recognition.
 */
export interface SentenceUnscrambleExercise extends BaseExercise {
  type: 'sentence-unscramble';
  /** The correct sentence in proper word order */
  correctSentence: string;
  /** All words including distractors (pre-shuffled for display) */
  words: UnscrambleWord[];
  /** English translation hint */
  englishHint?: string;
  /** Number of distractors included */
  distractorCount: number;
}

export type Exercise =
  | FillBlankExercise
  | TranslateExercise
  | WordToMeaningExercise
  | MeaningToWordExercise
  | ConstructSentenceExercise
  | GrammarApplyExercise
  | ErrorCorrectionExercise
  | MultiClozeExercise
  | SemanticFieldExercise
  | SentenceUnscrambleExercise;

export type ExerciseState = 'unanswered' | 'correct' | 'incorrect';

/**
 * Generation mode for exercises.
 * Based on "generation effect" research - producing answers creates stronger memories.
 */
export type GenerationMode = 
  | 'hints_hidden'    // Attempting without hints (generation phase)
  | 'hints_shown'     // Revealed hints after attempt or timeout
  | 'standard';       // Traditional mode with hints always visible

/**
 * Exercise result with enhanced tracking for learning science features.
 */
export interface ExerciseResult {
  exerciseId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  
  // Metacognition (Make It Stick)
  confidence?: 1 | 2 | 3;
  
  // Generation tracking
  generationMode?: GenerationMode;
  generatedWithoutHints?: boolean;
  
  // Response timing (for fluency measurement)
  responseTimeMs?: number;
  
  // Pre-test flag (productive failure)
  wasPretest?: boolean;
}

/**
 * Challenge configuration for mastery-level exercises.
 * When all itemIds have strength >= 80, the exercise becomes a challenge.
 */
export interface ChallengeConfig {
  isChallenge: boolean;
  timerSeconds: number;          // 30 for challenges, 0 for normal
  requireTashkeel: boolean;      // Must type correct diacritics
  hideEnglishHint: boolean;      // Hide promptEn for fill-blank
  reversedDirection: boolean;    // e.g., word-to-meaning becomes meaning-to-word
}
