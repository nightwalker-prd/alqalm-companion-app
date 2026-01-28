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

export interface WordIrabComponent {
  part: string;
  irab: string;
}

export interface WordIrab {
  word: string;
  irab: string;
  function?: GrammaticalFunction;
  case?: GrammaticalCase;
  components?: WordIrabComponent[];
}

export interface QiraatReading {
  reading: string;
  reciters: string[];
  note?: string;
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
  qiraat?: QiraatReading[];
  rhetoricalNotes?: string[];
}

export interface SurahStudyOverview {
  names: string[];
  mainThemes: string[];
  grammaticalFeatures: string[];
}

export interface SurahStudy {
  id: string;
  surah: string;
  surahNumber: number;
  ayahCount: number;
  overview: SurahStudyOverview;
  ayat: AyahIrab[];
  exercises?: QuranNahwExercise[];
}

export interface IltifatAnalysis {
  before: string;
  after: string;
  reason: string;
}

export interface IltifatExample {
  id: string;
  surah: string;
  ayah: string;
  arabic: string;
  shiftType: IltifatType;
  analysis: IltifatAnalysis;
  translation: string;
  rhetoricalEffect: string;
}

export interface QuranNahwExampleAnalysis {
  explanation: string;
  grammaticalNote?: string;
  rhetoricalEffect?: string;
}

export interface QuranNahwExample {
  id: string;
  surah: string;
  ayah: string;
  arabic: string;
  translation: string;
  construction: UniqueConstructionType;
  analysis: QuranNahwExampleAnalysis;
}

export interface UniqueConstructionType_ {
  name: string;
  nameEn: string;
  subtypes?: string[];
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
  types?: UniqueConstructionType_[];
  examples: (IltifatExample | QuranNahwExample)[];
  exercises: QuranNahwExercise[];
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

export interface ParticleType {
  name: string;
  usage: string;
  examples: { arabic: string; translation: string; surah?: string }[];
}

export interface ParticleLesson {
  id: string;
  particle: string;
  particleEn: string;
  types: ParticleType[];
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
