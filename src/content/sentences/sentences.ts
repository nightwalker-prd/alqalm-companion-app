/**
 * Sentence Building Exercise Data
 * 
 * Hand-curated sentences for word order practice.
 * Tests: verb-subject order, case endings, agreement, prepositions.
 */

export interface SentenceExercise {
  id: string;
  book: number;
  lesson?: string;
  english: string;
  // Correct word order (array of tokens)
  correctOrder: string[];
  // Extra distractor words (wrong forms, etc.)
  distractors?: string[];
  // Grammar points tested
  grammarPoints: string[];
  difficulty: 1 | 2 | 3;
}

export const SENTENCE_EXERCISES: SentenceExercise[] = [
  // ============ BOOK 1 - Basic Sentences ============
  
  // Nominal sentences (المبتدأ والخبر)
  {
    id: 'b1-s01',
    book: 1,
    english: 'The book is new.',
    correctOrder: ['الكِتَابُ', 'جَدِيدٌ'],
    grammarPoints: ['nominal-sentence', 'mubtada-khabar'],
    difficulty: 1,
  },
  {
    id: 'b1-s02',
    book: 1,
    english: 'The student is diligent.',
    correctOrder: ['الطَّالِبُ', 'مُجْتَهِدٌ'],
    grammarPoints: ['nominal-sentence', 'mubtada-khabar'],
    difficulty: 1,
  },
  {
    id: 'b1-s03',
    book: 1,
    english: 'This is a house.',
    correctOrder: ['هٰذَا', 'بَيْتٌ'],
    grammarPoints: ['demonstrative', 'nominal-sentence'],
    difficulty: 1,
  },
  {
    id: 'b1-s04',
    book: 1,
    english: 'That is a mosque.',
    correctOrder: ['ذٰلِكَ', 'مَسْجِدٌ'],
    grammarPoints: ['demonstrative', 'nominal-sentence'],
    difficulty: 1,
  },
  {
    id: 'b1-s05',
    book: 1,
    english: 'The teacher is in the classroom.',
    correctOrder: ['المُدَرِّسُ', 'فِي', 'الفَصْلِ'],
    grammarPoints: ['preposition', 'jar-majroor'],
    difficulty: 1,
  },
  
  // Verbal sentences (الجملة الفعلية)
  {
    id: 'b1-s06',
    book: 1,
    english: 'The student went.',
    correctOrder: ['ذَهَبَ', 'الطَّالِبُ'],
    distractors: ['الطَّالِبَ', 'طَالِبٌ'],
    grammarPoints: ['verbal-sentence', 'verb-subject-order', 'marfoo-subject'],
    difficulty: 1,
  },
  {
    id: 'b1-s07',
    book: 1,
    english: 'The teacher entered.',
    correctOrder: ['دَخَلَ', 'المُدَرِّسُ'],
    distractors: ['المُدَرِّسَ'],
    grammarPoints: ['verbal-sentence', 'verb-subject-order'],
    difficulty: 1,
  },
  {
    id: 'b1-s08',
    book: 1,
    english: 'Muhammad wrote.',
    correctOrder: ['كَتَبَ', 'مُحَمَّدٌ'],
    grammarPoints: ['verbal-sentence', 'proper-noun'],
    difficulty: 1,
  },
  
  // Verb + Subject + Object
  {
    id: 'b1-s09',
    book: 1,
    english: 'The student read the book.',
    correctOrder: ['قَرَأَ', 'الطَّالِبُ', 'الكِتَابَ'],
    distractors: ['الطَّالِبَ', 'الكِتَابُ'],
    grammarPoints: ['verbal-sentence', 'mafool-bihi', 'mansoob-object'],
    difficulty: 2,
  },
  {
    id: 'b1-s10',
    book: 1,
    english: 'The teacher opened the door.',
    correctOrder: ['فَتَحَ', 'المُدَرِّسُ', 'البَابَ'],
    distractors: ['البَابُ', 'المُدَرِّسَ'],
    grammarPoints: ['verbal-sentence', 'mafool-bihi'],
    difficulty: 2,
  },
  
  // With prepositions
  {
    id: 'b1-s11',
    book: 1,
    english: 'The student went to the mosque.',
    correctOrder: ['ذَهَبَ', 'الطَّالِبُ', 'إِلَى', 'المَسْجِدِ'],
    distractors: ['المَسْجِدُ', 'المَسْجِدَ'],
    grammarPoints: ['preposition', 'jar-majroor'],
    difficulty: 2,
  },
  {
    id: 'b1-s12',
    book: 1,
    english: 'The teacher came from the school.',
    correctOrder: ['جَاءَ', 'المُدَرِّسُ', 'مِنَ', 'المَدْرَسَةِ'],
    distractors: ['المَدْرَسَةُ'],
    grammarPoints: ['preposition', 'jar-majroor'],
    difficulty: 2,
  },
  
  // ============ BOOK 1 - Intermediate ============
  
  // Idaafa (الإضافة)
  {
    id: 'b1-s13',
    book: 1,
    english: "The student's book is new.",
    correctOrder: ['كِتَابُ', 'الطَّالِبِ', 'جَدِيدٌ'],
    distractors: ['الكِتَابُ', 'الطَّالِبُ'],
    grammarPoints: ['idaafa', 'jar-mudaf-ilayhi'],
    difficulty: 2,
  },
  {
    id: 'b1-s14',
    book: 1,
    english: "The door of the house is open.",
    correctOrder: ['بَابُ', 'البَيْتِ', 'مَفْتُوحٌ'],
    distractors: ['البَابُ', 'البَيْتُ'],
    grammarPoints: ['idaafa', 'jar-mudaf-ilayhi'],
    difficulty: 2,
  },
  
  // Adjective agreement
  {
    id: 'b1-s15',
    book: 1,
    english: 'The new student went.',
    correctOrder: ['ذَهَبَ', 'الطَّالِبُ', 'الجَدِيدُ'],
    distractors: ['الجَدِيدَ', 'جَدِيدٌ'],
    grammarPoints: ['adjective-agreement', 'sifa-mawsoof'],
    difficulty: 2,
  },
  {
    id: 'b1-s16',
    book: 1,
    english: 'I read the big book.',
    correctOrder: ['قَرَأْتُ', 'الكِتَابَ', 'الكَبِيرَ'],
    distractors: ['الكَبِيرُ', 'كَبِيرٌ'],
    grammarPoints: ['adjective-agreement', 'mansoob-adjective'],
    difficulty: 2,
  },

  // ============ BOOK 2 - More Complex ============
  
  // Dual and plural
  {
    id: 'b2-s01',
    book: 2,
    english: 'The two students went.',
    correctOrder: ['ذَهَبَ', 'الطَّالِبَانِ'],
    distractors: ['الطَّالِبَيْنِ', 'الطَّالِبُونَ'],
    grammarPoints: ['dual', 'raf-dual'],
    difficulty: 2,
  },
  {
    id: 'b2-s02',
    book: 2,
    english: 'The students (m.pl) wrote.',
    correctOrder: ['كَتَبَ', 'الطُّلَّابُ'],
    distractors: ['الطُّلَّابَ', 'الطَّالِبُونَ'],
    grammarPoints: ['plural', 'broken-plural'],
    difficulty: 2,
  },
  {
    id: 'b2-s03',
    book: 2,
    english: 'The female students studied.',
    correctOrder: ['دَرَسَتِ', 'الطَّالِبَاتُ'],
    distractors: ['دَرَسَ', 'الطَّالِبَاتِ'],
    grammarPoints: ['feminine-plural', 'verb-agreement'],
    difficulty: 2,
  },
  
  // More prepositions
  {
    id: 'b2-s04',
    book: 2,
    english: 'The book is on the table.',
    correctOrder: ['الكِتَابُ', 'عَلَى', 'الطَّاوِلَةِ'],
    grammarPoints: ['preposition', 'nominal-sentence'],
    difficulty: 2,
  },
  {
    id: 'b2-s05',
    book: 2,
    english: 'He sat with the teacher.',
    correctOrder: ['جَلَسَ', 'مَعَ', 'المُدَرِّسِ'],
    grammarPoints: ['preposition', 'jar-majroor'],
    difficulty: 2,
  },
  
  // Attached pronouns
  {
    id: 'b2-s06',
    book: 2,
    english: 'I read his book.',
    correctOrder: ['قَرَأْتُ', 'كِتَابَهُ'],
    distractors: ['كِتَابُهُ', 'الكِتَابَ'],
    grammarPoints: ['attached-pronoun', 'idaafa-pronoun'],
    difficulty: 2,
  },
  {
    id: 'b2-s07',
    book: 2,
    english: 'She went to her house.',
    correctOrder: ['ذَهَبَتْ', 'إِلَى', 'بَيْتِهَا'],
    distractors: ['ذَهَبَ', 'بَيْتُهَا'],
    grammarPoints: ['feminine-verb', 'attached-pronoun'],
    difficulty: 2,
  },

  // ============ More Advanced ============
  
  // Kana and its sisters
  {
    id: 'b2-s08',
    book: 2,
    english: 'The student was diligent.',
    correctOrder: ['كَانَ', 'الطَّالِبُ', 'مُجْتَهِدًا'],
    distractors: ['مُجْتَهِدٌ', 'الطَّالِبَ'],
    grammarPoints: ['kana', 'nasb-khabar-kana'],
    difficulty: 3,
  },
  {
    id: 'b2-s09',
    book: 2,
    english: 'The weather became cold.',
    correctOrder: ['أَصْبَحَ', 'الجَوُّ', 'بَارِدًا'],
    distractors: ['بَارِدٌ'],
    grammarPoints: ['kana-sisters', 'nasb-khabar'],
    difficulty: 3,
  },
  
  // Inna and its sisters
  {
    id: 'b2-s10',
    book: 2,
    english: 'Indeed the book is useful.',
    correctOrder: ['إِنَّ', 'الكِتَابَ', 'مُفِيدٌ'],
    distractors: ['الكِتَابُ', 'مُفِيدًا'],
    grammarPoints: ['inna', 'nasb-ism-inna'],
    difficulty: 3,
  },
  {
    id: 'b2-s11',
    book: 2,
    english: 'Perhaps the teacher is present.',
    correctOrder: ['لَعَلَّ', 'المُدَرِّسَ', 'حَاضِرٌ'],
    distractors: ['المُدَرِّسُ'],
    grammarPoints: ['inna-sisters', 'nasb-ism'],
    difficulty: 3,
  },
];

// Helper to get sentences by book
export function getSentencesByBook(book: number): SentenceExercise[] {
  return SENTENCE_EXERCISES.filter(s => s.book === book);
}

// Helper to get sentences by difficulty
export function getSentencesByDifficulty(difficulty: 1 | 2 | 3): SentenceExercise[] {
  return SENTENCE_EXERCISES.filter(s => s.difficulty === difficulty);
}

// Shuffle helper
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
