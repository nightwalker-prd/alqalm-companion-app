import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomNav } from '../components/layout/BottomNav';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { useVocabulary } from '../hooks/useVocabulary';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { getLessonMasteryPercent } from '../lib/progressService';

// Import Book 1 content
import b1lesson01 from '../content/book1/lessons/lesson-01.json';
import b1lesson02 from '../content/book1/lessons/lesson-02.json';
import b1lesson03 from '../content/book1/lessons/lesson-03.json';
import b1lesson04 from '../content/book1/lessons/lesson-04.json';
import b1lesson05 from '../content/book1/lessons/lesson-05.json';
import b1lesson06 from '../content/book1/lessons/lesson-06.json';
import b1lesson07 from '../content/book1/lessons/lesson-07.json';
import b1lesson08 from '../content/book1/lessons/lesson-08.json';
import b1lesson09 from '../content/book1/lessons/lesson-09.json';
import b1lesson10 from '../content/book1/lessons/lesson-10.json';
import b1lesson11 from '../content/book1/lessons/lesson-11.json';
import b1lesson12 from '../content/book1/lessons/lesson-12.json';
import b1lesson13 from '../content/book1/lessons/lesson-13.json';
import b1lesson14 from '../content/book1/lessons/lesson-14.json';
import b1lesson15 from '../content/book1/lessons/lesson-15.json';
import b1lesson16 from '../content/book1/lessons/lesson-16.json';
import b1lesson17 from '../content/book1/lessons/lesson-17.json';
import b1lesson18 from '../content/book1/lessons/lesson-18.json';
import b1lesson19 from '../content/book1/lessons/lesson-19.json';
import b1lesson20 from '../content/book1/lessons/lesson-20.json';
import b1lesson21 from '../content/book1/lessons/lesson-21.json';
import b1lesson22 from '../content/book1/lessons/lesson-22.json';
import b1lesson23 from '../content/book1/lessons/lesson-23.json';
import b1lesson24 from '../content/book1/lessons/lesson-24.json';
import b1lesson25 from '../content/book1/lessons/lesson-25.json';
import b1lesson26 from '../content/book1/lessons/lesson-26.json';
import b1lesson27 from '../content/book1/lessons/lesson-27.json';
import b1lesson28 from '../content/book1/lessons/lesson-28.json';
import b1lesson29 from '../content/book1/lessons/lesson-29.json';
import b1lesson30 from '../content/book1/lessons/lesson-30.json';
import b1lesson31 from '../content/book1/lessons/lesson-31.json';
import b1lesson32 from '../content/book1/lessons/lesson-32.json';
import b1lesson33 from '../content/book1/lessons/lesson-33.json';
import b1lesson34 from '../content/book1/lessons/lesson-34.json';
import b1lesson35 from '../content/book1/lessons/lesson-35.json';
import b1grammar from '../content/book1/grammar.json';

// Import Book 2 content
import b2lesson01 from '../content/book2/lessons/lesson-01.json';
import b2lesson02 from '../content/book2/lessons/lesson-02.json';
import b2lesson03 from '../content/book2/lessons/lesson-03.json';
import b2lesson04 from '../content/book2/lessons/lesson-04.json';
import b2lesson05 from '../content/book2/lessons/lesson-05.json';
import b2lesson06 from '../content/book2/lessons/lesson-06.json';
import b2lesson07 from '../content/book2/lessons/lesson-07.json';
import b2lesson08 from '../content/book2/lessons/lesson-08.json';
import b2lesson09 from '../content/book2/lessons/lesson-09.json';
import b2lesson10 from '../content/book2/lessons/lesson-10.json';
import b2lesson11 from '../content/book2/lessons/lesson-11.json';
import b2lesson12 from '../content/book2/lessons/lesson-12.json';
import b2lesson13 from '../content/book2/lessons/lesson-13.json';
import b2lesson14 from '../content/book2/lessons/lesson-14.json';
import b2lesson15 from '../content/book2/lessons/lesson-15.json';
import b2lesson16 from '../content/book2/lessons/lesson-16.json';
import b2lesson17 from '../content/book2/lessons/lesson-17.json';
import b2lesson18 from '../content/book2/lessons/lesson-18.json';
import b2lesson19 from '../content/book2/lessons/lesson-19.json';
import b2lesson20 from '../content/book2/lessons/lesson-20.json';
import b2lesson21 from '../content/book2/lessons/lesson-21.json';
import b2lesson22 from '../content/book2/lessons/lesson-22.json';
import b2lesson23 from '../content/book2/lessons/lesson-23.json';
import b2lesson24 from '../content/book2/lessons/lesson-24.json';
import b2lesson25 from '../content/book2/lessons/lesson-25.json';
import b2lesson26 from '../content/book2/lessons/lesson-26.json';
import b2lesson27 from '../content/book2/lessons/lesson-27.json';
import b2lesson28 from '../content/book2/lessons/lesson-28.json';
import b2lesson29 from '../content/book2/lessons/lesson-29.json';
import b2lesson30 from '../content/book2/lessons/lesson-30.json';
import b2lesson31 from '../content/book2/lessons/lesson-31.json';
import b2lesson32 from '../content/book2/lessons/lesson-32.json';
import b2lesson33 from '../content/book2/lessons/lesson-33.json';
import b2lesson34 from '../content/book2/lessons/lesson-34.json';
import b2lesson35 from '../content/book2/lessons/lesson-35.json';
import b2lesson36 from '../content/book2/lessons/lesson-36.json';
import b2lesson37 from '../content/book2/lessons/lesson-37.json';
import b2lesson38 from '../content/book2/lessons/lesson-38.json';
import b2lesson39 from '../content/book2/lessons/lesson-39.json';
import b2lesson40 from '../content/book2/lessons/lesson-40.json';
import b2lesson41 from '../content/book2/lessons/lesson-41.json';
import b2lesson42 from '../content/book2/lessons/lesson-42.json';
import b2lesson43 from '../content/book2/lessons/lesson-43.json';
import b2lesson44 from '../content/book2/lessons/lesson-44.json';
import b2lesson45 from '../content/book2/lessons/lesson-45.json';
import b2lesson46 from '../content/book2/lessons/lesson-46.json';
import b2lesson47 from '../content/book2/lessons/lesson-47.json';
import b2lesson48 from '../content/book2/lessons/lesson-48.json';
import b2lesson49 from '../content/book2/lessons/lesson-49.json';
import b2lesson50 from '../content/book2/lessons/lesson-50.json';
import b2lesson51 from '../content/book2/lessons/lesson-51.json';
import b2lesson52 from '../content/book2/lessons/lesson-52.json';
import b2lesson53 from '../content/book2/lessons/lesson-53.json';
import b2lesson54 from '../content/book2/lessons/lesson-54.json';
import b2lesson55 from '../content/book2/lessons/lesson-55.json';
import b2lesson56 from '../content/book2/lessons/lesson-56.json';
import b2grammar from '../content/book2/grammar.json';

// Import Book 3 content
import b3lesson01 from '../content/book3/lessons/lesson-01.json';
import b3lesson02 from '../content/book3/lessons/lesson-02.json';
import b3lesson03 from '../content/book3/lessons/lesson-03.json';
import b3lesson04 from '../content/book3/lessons/lesson-04.json';
import b3lesson05 from '../content/book3/lessons/lesson-05.json';
import b3lesson06 from '../content/book3/lessons/lesson-06.json';
import b3lesson07 from '../content/book3/lessons/lesson-07.json';
import b3lesson08 from '../content/book3/lessons/lesson-08.json';
import b3lesson09 from '../content/book3/lessons/lesson-09.json';
import b3lesson10 from '../content/book3/lessons/lesson-10.json';
import b3lesson11 from '../content/book3/lessons/lesson-11.json';
import b3lesson12 from '../content/book3/lessons/lesson-12.json';
import b3lesson13 from '../content/book3/lessons/lesson-13.json';
import b3lesson14 from '../content/book3/lessons/lesson-14.json';
import b3lesson15 from '../content/book3/lessons/lesson-15.json';
import b3lesson16 from '../content/book3/lessons/lesson-16.json';
import b3lesson17 from '../content/book3/lessons/lesson-17.json';
import b3lesson18 from '../content/book3/lessons/lesson-18.json';
import b3lesson19 from '../content/book3/lessons/lesson-19.json';
import b3lesson20 from '../content/book3/lessons/lesson-20.json';
import b3lesson21 from '../content/book3/lessons/lesson-21.json';
import b3lesson22 from '../content/book3/lessons/lesson-22.json';
import b3lesson23 from '../content/book3/lessons/lesson-23.json';
import b3lesson24 from '../content/book3/lessons/lesson-24.json';
import b3lesson25 from '../content/book3/lessons/lesson-25.json';
import b3lesson26 from '../content/book3/lessons/lesson-26.json';
import b3lesson27 from '../content/book3/lessons/lesson-27.json';
import b3lesson28 from '../content/book3/lessons/lesson-28.json';
import b3lesson29 from '../content/book3/lessons/lesson-29.json';
import b3lesson30 from '../content/book3/lessons/lesson-30.json';
import b3lesson31 from '../content/book3/lessons/lesson-31.json';
import b3lesson32 from '../content/book3/lessons/lesson-32.json';
import b3lesson33 from '../content/book3/lessons/lesson-33.json';
import b3lesson34 from '../content/book3/lessons/lesson-34.json';
import b3lesson35 from '../content/book3/lessons/lesson-35.json';
import b3lesson36 from '../content/book3/lessons/lesson-36.json';
import b3lesson37 from '../content/book3/lessons/lesson-37.json';
import b3lesson38 from '../content/book3/lessons/lesson-38.json';
import b3lesson39 from '../content/book3/lessons/lesson-39.json';
import b3lesson40 from '../content/book3/lessons/lesson-40.json';
import b3lesson41 from '../content/book3/lessons/lesson-41.json';
import b3lesson42 from '../content/book3/lessons/lesson-42.json';
import b3lesson43 from '../content/book3/lessons/lesson-43.json';
import b3lesson44 from '../content/book3/lessons/lesson-44.json';
import b3lesson45 from '../content/book3/lessons/lesson-45.json';
import b3lesson46 from '../content/book3/lessons/lesson-46.json';
import b3lesson47 from '../content/book3/lessons/lesson-47.json';
import b3lesson48 from '../content/book3/lessons/lesson-48.json';
import b3lesson49 from '../content/book3/lessons/lesson-49.json';
import b3lesson50 from '../content/book3/lessons/lesson-50.json';
import b3lesson51 from '../content/book3/lessons/lesson-51.json';
import b3lesson52 from '../content/book3/lessons/lesson-52.json';
import b3lesson53 from '../content/book3/lessons/lesson-53.json';
import b3lesson54 from '../content/book3/lessons/lesson-54.json';
import b3lesson55 from '../content/book3/lessons/lesson-55.json';
import b3lesson56 from '../content/book3/lessons/lesson-56.json';
import b3lesson57 from '../content/book3/lessons/lesson-57.json';
import b3lesson58 from '../content/book3/lessons/lesson-58.json';
import b3lesson59 from '../content/book3/lessons/lesson-59.json';
import b3lesson60 from '../content/book3/lessons/lesson-60.json';
import b3lesson61 from '../content/book3/lessons/lesson-61.json';
import b3lesson62 from '../content/book3/lessons/lesson-62.json';
import b3lesson63 from '../content/book3/lessons/lesson-63.json';
import b3lesson64 from '../content/book3/lessons/lesson-64.json';
import b3lesson65 from '../content/book3/lessons/lesson-65.json';
import b3lesson66 from '../content/book3/lessons/lesson-66.json';
import b3lesson67 from '../content/book3/lessons/lesson-67.json';
import b3lesson68 from '../content/book3/lessons/lesson-68.json';
import b3lesson69 from '../content/book3/lessons/lesson-69.json';
import b3lesson70 from '../content/book3/lessons/lesson-70.json';
import b3lesson71 from '../content/book3/lessons/lesson-71.json';
import b3lesson72 from '../content/book3/lessons/lesson-72.json';
import b3lesson73 from '../content/book3/lessons/lesson-73.json';
import b3lesson74 from '../content/book3/lessons/lesson-74.json';
import b3lesson75 from '../content/book3/lessons/lesson-75.json';
import b3lesson76 from '../content/book3/lessons/lesson-76.json';
import b3lesson77 from '../content/book3/lessons/lesson-77.json';
import b3lesson78 from '../content/book3/lessons/lesson-78.json';
import b3lesson79 from '../content/book3/lessons/lesson-79.json';
import b3lesson80 from '../content/book3/lessons/lesson-80.json';
import b3lesson81 from '../content/book3/lessons/lesson-81.json';
import b3lesson82 from '../content/book3/lessons/lesson-82.json';
import b3lesson83 from '../content/book3/lessons/lesson-83.json';
import b3lesson84 from '../content/book3/lessons/lesson-84.json';
import b3lesson85 from '../content/book3/lessons/lesson-85.json';
import b3lesson86 from '../content/book3/lessons/lesson-86.json';
import b3lesson87 from '../content/book3/lessons/lesson-87.json';
import b3lesson88 from '../content/book3/lessons/lesson-88.json';
import b3lesson89 from '../content/book3/lessons/lesson-89.json';
import b3lesson90 from '../content/book3/lessons/lesson-90.json';
import b3lesson91 from '../content/book3/lessons/lesson-91.json';
import b3lesson92 from '../content/book3/lessons/lesson-92.json';
import b3lesson93 from '../content/book3/lessons/lesson-93.json';
import b3lesson94 from '../content/book3/lessons/lesson-94.json';
import b3lesson95 from '../content/book3/lessons/lesson-95.json';
import b3lesson96 from '../content/book3/lessons/lesson-96.json';
import b3lesson97 from '../content/book3/lessons/lesson-97.json';
import b3lesson98 from '../content/book3/lessons/lesson-98.json';
import b3lesson99 from '../content/book3/lessons/lesson-99.json';
import b3lesson100 from '../content/book3/lessons/lesson-100.json';
import b3lesson101 from '../content/book3/lessons/lesson-101.json';
import b3lesson102 from '../content/book3/lessons/lesson-102.json';
import b3lesson103 from '../content/book3/lessons/lesson-103.json';
import b3lesson104 from '../content/book3/lessons/lesson-104.json';
import b3lesson105 from '../content/book3/lessons/lesson-105.json';
import b3lesson106 from '../content/book3/lessons/lesson-106.json';
import b3lesson107 from '../content/book3/lessons/lesson-107.json';
import b3lesson108 from '../content/book3/lessons/lesson-108.json';
import b3lesson109 from '../content/book3/lessons/lesson-109.json';
import b3lesson110 from '../content/book3/lessons/lesson-110.json';
import b3lesson111 from '../content/book3/lessons/lesson-111.json';
import b3lesson112 from '../content/book3/lessons/lesson-112.json';
import b3lesson113 from '../content/book3/lessons/lesson-113.json';
import b3lesson114 from '../content/book3/lessons/lesson-114.json';
import b3lesson115 from '../content/book3/lessons/lesson-115.json';
import b3lesson116 from '../content/book3/lessons/lesson-116.json';
import b3lesson117 from '../content/book3/lessons/lesson-117.json';
import b3lesson118 from '../content/book3/lessons/lesson-118.json';
import b3lesson119 from '../content/book3/lessons/lesson-119.json';
import b3grammar from '../content/book3/grammar.json';

interface LessonNote {
  title: string;
  titleArabic?: string;
  content: string[];
  examples?: { arabic: string; english: string }[];
  keyPoints?: string[];
}

interface Lesson {
  id: string;
  book: number;
  lesson: number;
  title: string;
  titleEn: string;
  description: string;
  vocabulary: string[];
  grammarPoints: string[];
  exercises: unknown[];
  notes?: LessonNote[];
}

interface GrammarPoint {
  id: string;
  title: string;
  titleEn: string;
  explanation: string;
  examples: { arabic: string; english: string }[];
  lesson: string;
}

const lessons: Record<string, Lesson> = {
  // Book 1
  'b1-l01': b1lesson01 as Lesson,
  'b1-l02': b1lesson02 as Lesson,
  'b1-l03': b1lesson03 as Lesson,
  'b1-l04': b1lesson04 as Lesson,
  'b1-l05': b1lesson05 as Lesson,
  'b1-l06': b1lesson06 as Lesson,
  'b1-l07': b1lesson07 as Lesson,
  'b1-l08': b1lesson08 as Lesson,
  'b1-l09': b1lesson09 as Lesson,
  'b1-l10': b1lesson10 as Lesson,
  'b1-l11': b1lesson11 as Lesson,
  'b1-l12': b1lesson12 as Lesson,
  'b1-l13': b1lesson13 as Lesson,
  'b1-l14': b1lesson14 as Lesson,
  'b1-l15': b1lesson15 as Lesson,
  'b1-l16': b1lesson16 as Lesson,
  'b1-l17': b1lesson17 as Lesson,
  'b1-l18': b1lesson18 as Lesson,
  'b1-l19': b1lesson19 as Lesson,
  'b1-l20': b1lesson20 as Lesson,
  'b1-l21': b1lesson21 as Lesson,
  'b1-l22': b1lesson22 as Lesson,
  'b1-l23': b1lesson23 as Lesson,
  'b1-l24': b1lesson24 as Lesson,
  'b1-l25': b1lesson25 as Lesson,
  'b1-l26': b1lesson26 as Lesson,
  'b1-l27': b1lesson27 as Lesson,
  'b1-l28': b1lesson28 as Lesson,
  'b1-l29': b1lesson29 as Lesson,
  'b1-l30': b1lesson30 as Lesson,
  'b1-l31': b1lesson31 as Lesson,
  'b1-l32': b1lesson32 as Lesson,
  'b1-l33': b1lesson33 as Lesson,
  'b1-l34': b1lesson34 as Lesson,
  'b1-l35': b1lesson35 as Lesson,
  // Book 2
  'b2-l01': b2lesson01 as Lesson,
  'b2-l02': b2lesson02 as Lesson,
  'b2-l03': b2lesson03 as Lesson,
  'b2-l04': b2lesson04 as Lesson,
  'b2-l05': b2lesson05 as Lesson,
  'b2-l06': b2lesson06 as Lesson,
  'b2-l07': b2lesson07 as Lesson,
  'b2-l08': b2lesson08 as Lesson,
  'b2-l09': b2lesson09 as Lesson,
  'b2-l10': b2lesson10 as Lesson,
  'b2-l11': b2lesson11 as Lesson,
  'b2-l12': b2lesson12 as Lesson,
  'b2-l13': b2lesson13 as Lesson,
  'b2-l14': b2lesson14 as Lesson,
  'b2-l15': b2lesson15 as Lesson,
  'b2-l16': b2lesson16 as Lesson,
  'b2-l17': b2lesson17 as Lesson,
  'b2-l18': b2lesson18 as Lesson,
  'b2-l19': b2lesson19 as Lesson,
  'b2-l20': b2lesson20 as Lesson,
  'b2-l21': b2lesson21 as Lesson,
  'b2-l22': b2lesson22 as Lesson,
  'b2-l23': b2lesson23 as Lesson,
  'b2-l24': b2lesson24 as Lesson,
  'b2-l25': b2lesson25 as Lesson,
  'b2-l26': b2lesson26 as Lesson,
  'b2-l27': b2lesson27 as Lesson,
  'b2-l28': b2lesson28 as Lesson,
  'b2-l29': b2lesson29 as Lesson,
  'b2-l30': b2lesson30 as Lesson,
  'b2-l31': b2lesson31 as Lesson,
  'b2-l32': b2lesson32 as Lesson,
  'b2-l33': b2lesson33 as Lesson,
  'b2-l34': b2lesson34 as Lesson,
  'b2-l35': b2lesson35 as Lesson,
  'b2-l36': b2lesson36 as Lesson,
  'b2-l37': b2lesson37 as Lesson,
  'b2-l38': b2lesson38 as Lesson,
  'b2-l39': b2lesson39 as Lesson,
  'b2-l40': b2lesson40 as Lesson,
  'b2-l41': b2lesson41 as Lesson,
  'b2-l42': b2lesson42 as Lesson,
  'b2-l43': b2lesson43 as Lesson,
  'b2-l44': b2lesson44 as Lesson,
  'b2-l45': b2lesson45 as Lesson,
  'b2-l46': b2lesson46 as Lesson,
  'b2-l47': b2lesson47 as Lesson,
  'b2-l48': b2lesson48 as Lesson,
  'b2-l49': b2lesson49 as Lesson,
  'b2-l50': b2lesson50 as Lesson,
  'b2-l51': b2lesson51 as Lesson,
  'b2-l52': b2lesson52 as Lesson,
  'b2-l53': b2lesson53 as Lesson,
  'b2-l54': b2lesson54 as Lesson,
  'b2-l55': b2lesson55 as Lesson,
  'b2-l56': b2lesson56 as Lesson,
  // Book 3
  'b3-l01': b3lesson01 as Lesson,
  'b3-l02': b3lesson02 as Lesson,
  'b3-l03': b3lesson03 as Lesson,
  'b3-l04': b3lesson04 as Lesson,
  'b3-l05': b3lesson05 as Lesson,
  'b3-l06': b3lesson06 as Lesson,
  'b3-l07': b3lesson07 as Lesson,
  'b3-l08': b3lesson08 as Lesson,
  'b3-l09': b3lesson09 as Lesson,
  'b3-l10': b3lesson10 as Lesson,
  'b3-l11': b3lesson11 as Lesson,
  'b3-l12': b3lesson12 as Lesson,
  'b3-l13': b3lesson13 as Lesson,
  'b3-l14': b3lesson14 as Lesson,
  'b3-l15': b3lesson15 as Lesson,
  'b3-l16': b3lesson16 as Lesson,
  'b3-l17': b3lesson17 as Lesson,
  'b3-l18': b3lesson18 as Lesson,
  'b3-l19': b3lesson19 as Lesson,
  'b3-l20': b3lesson20 as Lesson,
  'b3-l21': b3lesson21 as Lesson,
  'b3-l22': b3lesson22 as Lesson,
  'b3-l23': b3lesson23 as Lesson,
  'b3-l24': b3lesson24 as Lesson,
  'b3-l25': b3lesson25 as Lesson,
  'b3-l26': b3lesson26 as Lesson,
  'b3-l27': b3lesson27 as Lesson,
  'b3-l28': b3lesson28 as Lesson,
  'b3-l29': b3lesson29 as Lesson,
  'b3-l30': b3lesson30 as Lesson,
  'b3-l31': b3lesson31 as Lesson,
  'b3-l32': b3lesson32 as Lesson,
  'b3-l33': b3lesson33 as Lesson,
  'b3-l34': b3lesson34 as Lesson,
  'b3-l35': b3lesson35 as Lesson,
  'b3-l36': b3lesson36 as Lesson,
  'b3-l37': b3lesson37 as Lesson,
  'b3-l38': b3lesson38 as Lesson,
  'b3-l39': b3lesson39 as Lesson,
  'b3-l40': b3lesson40 as Lesson,
  'b3-l41': b3lesson41 as Lesson,
  'b3-l42': b3lesson42 as Lesson,
  'b3-l43': b3lesson43 as Lesson,
  'b3-l44': b3lesson44 as Lesson,
  'b3-l45': b3lesson45 as Lesson,
  'b3-l46': b3lesson46 as Lesson,
  'b3-l47': b3lesson47 as Lesson,
  'b3-l48': b3lesson48 as Lesson,
  'b3-l49': b3lesson49 as Lesson,
  'b3-l50': b3lesson50 as Lesson,
  'b3-l51': b3lesson51 as Lesson,
  'b3-l52': b3lesson52 as Lesson,
  'b3-l53': b3lesson53 as Lesson,
  'b3-l54': b3lesson54 as Lesson,
  'b3-l55': b3lesson55 as Lesson,
  'b3-l56': b3lesson56 as Lesson,
  'b3-l57': b3lesson57 as Lesson,
  'b3-l58': b3lesson58 as Lesson,
  'b3-l59': b3lesson59 as Lesson,
  'b3-l60': b3lesson60 as Lesson,
  'b3-l61': b3lesson61 as Lesson,
  'b3-l62': b3lesson62 as Lesson,
  'b3-l63': b3lesson63 as Lesson,
  'b3-l64': b3lesson64 as Lesson,
  'b3-l65': b3lesson65 as Lesson,
  'b3-l66': b3lesson66 as Lesson,
  'b3-l67': b3lesson67 as Lesson,
  'b3-l68': b3lesson68 as Lesson,
  'b3-l69': b3lesson69 as Lesson,
  'b3-l70': b3lesson70 as Lesson,
  'b3-l71': b3lesson71 as Lesson,
  'b3-l72': b3lesson72 as Lesson,
  'b3-l73': b3lesson73 as Lesson,
  'b3-l74': b3lesson74 as Lesson,
  'b3-l75': b3lesson75 as Lesson,
  'b3-l76': b3lesson76 as Lesson,
  'b3-l77': b3lesson77 as Lesson,
  'b3-l78': b3lesson78 as Lesson,
  'b3-l79': b3lesson79 as Lesson,
  'b3-l80': b3lesson80 as Lesson,
  'b3-l81': b3lesson81 as Lesson,
  'b3-l82': b3lesson82 as Lesson,
  'b3-l83': b3lesson83 as Lesson,
  'b3-l84': b3lesson84 as Lesson,
  'b3-l85': b3lesson85 as Lesson,
  'b3-l86': b3lesson86 as Lesson,
  'b3-l87': b3lesson87 as Lesson,
  'b3-l88': b3lesson88 as Lesson,
  'b3-l89': b3lesson89 as Lesson,
  'b3-l90': b3lesson90 as Lesson,
  'b3-l91': b3lesson91 as Lesson,
  'b3-l92': b3lesson92 as Lesson,
  'b3-l93': b3lesson93 as Lesson,
  'b3-l94': b3lesson94 as Lesson,
  'b3-l95': b3lesson95 as Lesson,
  'b3-l96': b3lesson96 as Lesson,
  'b3-l97': b3lesson97 as Lesson,
  'b3-l98': b3lesson98 as Lesson,
  'b3-l99': b3lesson99 as Lesson,
  'b3-l100': b3lesson100 as Lesson,
  'b3-l101': b3lesson101 as Lesson,
  'b3-l102': b3lesson102 as Lesson,
  'b3-l103': b3lesson103 as Lesson,
  'b3-l104': b3lesson104 as Lesson,
  'b3-l105': b3lesson105 as Lesson,
  'b3-l106': b3lesson106 as Lesson,
  'b3-l107': b3lesson107 as Lesson,
  'b3-l108': b3lesson108 as Lesson,
  'b3-l109': b3lesson109 as Lesson,
  'b3-l110': b3lesson110 as Lesson,
  'b3-l111': b3lesson111 as Lesson,
  'b3-l112': b3lesson112 as Lesson,
  'b3-l113': b3lesson113 as Lesson,
  'b3-l114': b3lesson114 as Lesson,
  'b3-l115': b3lesson115 as Lesson,
  'b3-l116': b3lesson116 as Lesson,
  'b3-l117': b3lesson117 as Lesson,
  'b3-l118': b3lesson118 as Lesson,
  'b3-l119': b3lesson119 as Lesson,
};

// Combine grammar from all books
const grammarMap: Record<string, GrammarPoint> = Object.fromEntries([
  ...(b1grammar as GrammarPoint[]).map(g => [g.id, g]),
  ...(b2grammar as GrammarPoint[]).map(g => [g.id, g]),
  ...(b3grammar as GrammarPoint[]).map(g => [g.id, g]),
]);

export function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { settings, isLoading: settingsLoading } = useUserSettings();

  // Get lesson
  const lesson = lessonId ? lessons[lessonId] : null;

  // Load vocabulary asynchronously
  const {
    isLoaded: vocabLoaded,
    isLoading: vocabLoading,
    error: vocabError,
    getWord,
    load: loadVocab,
  } = useVocabulary();

  // Show loading state while vocabulary loads
  if (vocabLoading && !vocabLoaded) {
    return (
      <>
        <Header title={lesson ? `Lesson ${lesson.lesson}` : 'Loading...'} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" label="Loading lesson..." />
            <p className="mt-4 text-[var(--color-ink-muted)]">Loading lesson content...</p>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Show error state if vocabulary failed to load
  if (vocabError) {
    return (
      <>
        <Header title="Error" />
        <PageContainer>
          <ErrorState
            title="Failed to load vocabulary"
            message={vocabError.message || "Unable to load vocabulary data. Please try again."}
            onRetry={() => loadVocab()}
          />
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="text-center py-12">
            <h1 className="font-display text-2xl text-[var(--color-ink)] mb-2">
              Lesson Not Found
            </h1>
            <p className="text-[var(--color-ink-muted)] mb-6">
              This lesson doesn't exist or hasn't been added yet.
            </p>
            <Link to="/">
              <Button variant="secondary">Return to Dashboard</Button>
            </Link>
          </div>
        </PageContainer>
        <BottomNav />
      </>
    );
  }

  // Get vocabulary for this lesson using the async hook
  const lessonVocab = lesson.vocabulary
    .map(id => getWord(id))
    .filter((word): word is NonNullable<typeof word> => word !== null);

  const lessonGrammar = lesson.grammarPoints
    .map(id => grammarMap[id])
    .filter(Boolean);

  return (
    <>
      <Header title={`Lesson ${lesson.lesson}`} titleArabic={lesson.title} showBack />
      <PageContainer>
        {/* Breadcrumb navigation */}
        <Breadcrumb 
          items={[
            { label: 'Books', to: '/books' },
            { label: `Book ${lesson.book}`, to: '/books' },
            { label: `Lesson ${lesson.lesson}`, labelArabic: lesson.title }
          ]}
          className="mb-4"
        />

        {/* Lesson header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block px-4 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Book {lesson.book} · Lesson {lesson.lesson}
            </span>
          </div>
          <h1 className="arabic-2xl text-[var(--color-ink)] mb-2" dir="rtl">
            {lesson.title}
          </h1>
          <p className="font-display text-xl text-[var(--color-ink)]">
            {lesson.titleEn}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-3 max-w-md mx-auto">
            {lesson.description}
          </p>
        </div>

        {/* Practice button */}
        <div className="mb-8 animate-slide-up stagger-1 space-y-3">
          {/* Pre-test option (shown if not already taken) */}
          {(() => {
            const completedPreTests = JSON.parse(localStorage.getItem('completedPreTests') || '[]');
            const showPreTest = !completedPreTests.includes(lesson.id) && lesson.vocabulary.length >= 3;
            
            if (showPreTest) {
              return (
                <Link to={`/pretest/${lesson.id}`}>
                  <Button variant="secondary" size="lg" fullWidth className="mb-3">
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Take Pre-test First
                      <span className="text-xs opacity-70">(Recommended)</span>
                    </span>
                  </Button>
                </Link>
              );
            }
            return null;
          })()}
          
          <Link to={`/practice?lesson=${lesson.id}`}>
            <Button size="lg" fullWidth className="shadow-[var(--shadow-md)]">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Practice This Lesson
                <span className="text-sm opacity-80">({lesson.exercises.length} exercises)</span>
              </span>
            </Button>
          </Link>
        </div>

        {/* Vocabulary section */}
        <Card variant="default" padding="lg" className="mb-6 animate-slide-up stagger-2">
          <CardHeader
            title="Vocabulary"
            subtitle={`${lessonVocab.length} words`}
            action={
              <span className="arabic-sm text-[var(--color-primary)]" dir="rtl">
                المفردات
              </span>
            }
          />
          <CardContent className="mt-4">
            <div className="space-y-3">
              {lessonVocab.map((word, index) => (
                <div
                  key={word.id}
                  className="
                    flex items-center justify-between
                    p-3
                    bg-[var(--color-sand-100)]
                    rounded-[var(--radius-md)]
                    border border-[var(--color-sand-200)]
                    hover:border-[var(--color-primary)] hover:border-opacity-30
                    transition-colors
                  "
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="
                      w-8 h-8
                      rounded-full
                      bg-indigo-100 dark:bg-indigo-900/50
                      flex items-center justify-center
                      text-xs font-medium text-[var(--color-primary)]
                    ">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm text-[var(--color-ink)]">{word.english}</p>
                      {word.root && (
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Root: <span className="arabic-sm" dir="rtl">{word.root}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="arabic-base text-[var(--color-ink)]" dir="rtl">
                    {word.arabic}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grammar section */}
        <Card variant="elevated" padding="lg" hasGeometricAccent className="mb-8 animate-slide-up stagger-3">
          <CardHeader
            title="Grammar Points"
            subtitle={`${lessonGrammar.length} concepts`}
            action={
              <span className="arabic-sm text-[var(--color-gold)]" dir="rtl">
                القواعد
              </span>
            }
          />
          <CardContent className="mt-4">
            <div className="space-y-6">
              {lessonGrammar.map((point, index) => (
                <div
                  key={point.id}
                  className={index > 0 ? 'pt-6 border-t border-[var(--color-sand-200)]' : ''}
                >
                  {/* Grammar title */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                        {point.titleEn}
                      </h4>
                      <p className="arabic-sm text-[var(--color-ink-muted)]" dir="rtl">
                        {point.title}
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-sm text-[var(--color-ink)] mb-4 leading-relaxed">
                    {point.explanation}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wide">
                      Examples
                    </p>
                    {point.examples.map((example, exIndex) => (
                      <div
                        key={exIndex}
                        className="
                          flex items-center justify-between
                          p-3
                          bg-[var(--color-sand-50)]
                          rounded-[var(--radius-md)]
                        "
                      >
                        <span className="text-sm text-[var(--color-ink)]">
                          {example.english}
                        </span>
                        <span className="arabic-base text-[var(--color-ink)]" dir="rtl">
                          {example.arabic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes section */}
        {lesson.notes && lesson.notes.length > 0 && (
          <Card variant="default" padding="lg" className="mb-8 animate-slide-up stagger-4">
            <CardHeader
              title="Lesson Notes"
              subtitle={`${lesson.notes.length} ${lesson.notes.length === 1 ? 'topic' : 'topics'}`}
              action={
                <span className="arabic-sm text-[var(--color-primary)]" dir="rtl">
                  ملاحظات
                </span>
              }
            />
            <CardContent className="mt-4">
              <div className="space-y-6">
                {lesson.notes.map((note, noteIndex) => (
                  <div
                    key={noteIndex}
                    className={noteIndex > 0 ? 'pt-6 border-t border-[var(--color-sand-200)]' : ''}
                  >
                    {/* Note title */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                          {note.title}
                        </h4>
                        {note.titleArabic && (
                          <p className="arabic-sm text-[var(--color-ink-muted)]" dir="rtl">
                            {note.titleArabic}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Note content */}
                    <div className="space-y-2 mb-4">
                      {note.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-sm text-[var(--color-ink)] leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Key points */}
                    {note.keyPoints && note.keyPoints.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wide mb-2">
                          Key Points
                        </p>
                        <ul className="space-y-1">
                          {note.keyPoints.map((point, kpIndex) => (
                            <li key={kpIndex} className="text-sm text-[var(--color-ink-light)] flex items-start gap-2">
                              <span className="text-[var(--color-primary)] mt-1">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Note examples */}
                    {note.examples && note.examples.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wide">
                          Examples
                        </p>
                        {note.examples.map((example, exIndex) => (
                          <div
                            key={exIndex}
                            className="
                              flex items-center justify-between
                              p-3
                              bg-[var(--color-sand-50)]
                              rounded-[var(--radius-md)]
                            "
                          >
                            <span className="text-sm text-[var(--color-ink-light)]">
                              {example.english}
                            </span>
                            <span className="arabic-base text-[var(--color-ink)]" dir="rtl">
                              {example.arabic}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </span>
            </Button>
          </Link>

          {/* Next lesson - mastery-based progression */}
          {(() => {
            if (settingsLoading || !settings) return null;
            
            const maxLessonsPerBook: Record<number, number> = { 1: 35, 2: 56, 3: 119 };
            const maxLessons = maxLessonsPerBook[lesson.book] || 20;
            const hasNextInBook = lesson.lesson < maxLessons;
            const hasNextBook = lesson.book < 3 && lesson.lesson === maxLessons;
            
            // Get current lesson mastery
            const currentLessonId = `b${lesson.book}-l${String(lesson.lesson).padStart(2, '0')}`;
            const currentMastery = getLessonMasteryPercent(currentLessonId);
            const UNLOCK_THRESHOLD = 60;
            
            // Check if next lesson is unlocked
            const nextLessonUnlocked = hasNextInBook 
              ? settings.isLessonUnlocked(lesson.book, lesson.lesson + 1)
              : false;
            const nextBookUnlocked = hasNextBook
              ? settings.isLessonUnlocked(lesson.book + 1, 1)
              : false;

            // Next lesson in same book
            if (hasNextInBook) {
              if (nextLessonUnlocked) {
                return (
                  <Link to={`/lesson/b${lesson.book}-l${String(lesson.lesson + 1).padStart(2, '0')}`}>
                    <Button variant="secondary" size="sm">
                      <span className="flex items-center gap-2">
                        Next Lesson
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Button>
                  </Link>
                );
              } else {
                // Show progress toward unlocking
                return (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{currentMastery}% / {UNLOCK_THRESHOLD}% to unlock</span>
                    </div>
                    <div className="w-32 h-2 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (currentMastery / UNLOCK_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                    <Link to={`/practice?lesson=${currentLessonId}`} className="text-xs text-[var(--color-primary)] hover:underline">
                      Practice this lesson →
                    </Link>
                  </div>
                );
              }
            }

            // Next book
            if (hasNextBook) {
              if (nextBookUnlocked) {
                return (
                  <Link to={`/lesson/b${lesson.book + 1}-l01`}>
                    <Button variant="secondary" size="sm">
                      <span className="flex items-center gap-2">
                        Start Book {lesson.book + 1}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Button>
                  </Link>
                );
              } else {
                return (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{currentMastery}% / {UNLOCK_THRESHOLD}% to unlock Book {lesson.book + 1}</span>
                    </div>
                    <div className="w-32 h-2 bg-[var(--color-sand-200)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (currentMastery / UNLOCK_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                    <Link to={`/practice?lesson=${currentLessonId}`} className="text-xs text-[var(--color-primary)] hover:underline">
                      Practice this lesson →
                    </Link>
                  </div>
                );
              }
            }

            return null;
          })()}
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}

export default LessonDetail;
