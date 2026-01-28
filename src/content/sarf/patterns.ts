/**
 * Arabic Verb Patterns (الأوزان)
 * Data for the Wazn Trainer app
 */

export interface VerbPattern {
  id: number;
  nameAr: string;
  nameEn: string;
  pattern: string;
  meaning: string;
  examples: VerbExample[];
}

export interface VerbExample {
  verb: string;
  meaning: string;
  root: string;
}

export const patterns: VerbPattern[] = [
  {
    id: 1,
    nameAr: 'الباب الأول',
    nameEn: 'Form I',
    pattern: 'فَعَلَ',
    meaning: 'Base form - various meanings',
    examples: [
      { verb: 'كَتَبَ', meaning: 'to write', root: 'ك-ت-ب' },
      { verb: 'ذَهَبَ', meaning: 'to go', root: 'ذ-ه-ب' },
      { verb: 'سَمِعَ', meaning: 'to hear', root: 'س-م-ع' },
      { verb: 'عَلِمَ', meaning: 'to know', root: 'ع-ل-م' },
      { verb: 'نَصَرَ', meaning: 'to help', root: 'ن-ص-ر' },
      { verb: 'فَتَحَ', meaning: 'to open', root: 'ف-ت-ح' },
      { verb: 'خَرَجَ', meaning: 'to exit', root: 'خ-ر-ج' },
      { verb: 'دَخَلَ', meaning: 'to enter', root: 'د-خ-ل' },
      { verb: 'قَرَأَ', meaning: 'to read', root: 'ق-ر-أ' },
      { verb: 'شَرِبَ', meaning: 'to drink', root: 'ش-ر-ب' },
      { verb: 'ضَرَبَ', meaning: 'to hit', root: 'ض-ر-ب' },
      { verb: 'جَلَسَ', meaning: 'to sit', root: 'ج-ل-س' },
      { verb: 'وَجَدَ', meaning: 'to find', root: 'و-ج-د' },
      { verb: 'حَمَلَ', meaning: 'to carry', root: 'ح-م-ل' },
      { verb: 'غَفَرَ', meaning: 'to forgive', root: 'غ-ف-ر' },
      // Hollow verbs (أجوف)
      { verb: 'قَالَ', meaning: 'to say', root: 'ق-و-ل' },
      { verb: 'نَامَ', meaning: 'to sleep', root: 'ن-و-م' },
      { verb: 'زَارَ', meaning: 'to visit', root: 'ز-و-ر' },
      { verb: 'صَامَ', meaning: 'to fast', root: 'ص-و-م' },
      { verb: 'قَامَ', meaning: 'to stand', root: 'ق-و-م' },
      { verb: 'بَاعَ', meaning: 'to sell', root: 'ب-ي-ع' },
      { verb: 'سَارَ', meaning: 'to walk', root: 'س-ي-ر' },
      { verb: 'طَارَ', meaning: 'to fly', root: 'ط-ي-ر' },
      { verb: 'مَاتَ', meaning: 'to die', root: 'م-و-ت' },
      { verb: 'خَافَ', meaning: 'to fear', root: 'خ-و-ف' },
      // Defective verbs (ناقص)
      { verb: 'دَعَا', meaning: 'to call', root: 'د-ع-و' },
      { verb: 'مَشَى', meaning: 'to walk', root: 'م-ش-ي' },
      { verb: 'رَمَى', meaning: 'to throw', root: 'ر-م-ي' },
      { verb: 'بَكَى', meaning: 'to cry', root: 'ب-ك-ي' },
      { verb: 'نَسِيَ', meaning: 'to forget', root: 'ن-س-ي' },
      { verb: 'بَقِيَ', meaning: 'to remain', root: 'ب-ق-ي' },
      { verb: 'سَعَى', meaning: 'to strive', root: 'س-ع-ي' },
      { verb: 'هَدَى', meaning: 'to guide', root: 'ه-د-ي' },
      // Assimilated verbs (مثال)
      { verb: 'وَعَدَ', meaning: 'to promise', root: 'و-ع-د' },
      { verb: 'وَصَلَ', meaning: 'to arrive', root: 'و-ص-ل' },
      { verb: 'وَقَفَ', meaning: 'to stop', root: 'و-ق-ف' },
      { verb: 'وَضَعَ', meaning: 'to put', root: 'و-ض-ع' },
      // Doubled verbs (مضعّف)
      { verb: 'مَدَّ', meaning: 'to extend', root: 'م-د-د' },
      { verb: 'رَدَّ', meaning: 'to return', root: 'ر-د-د' },
      { verb: 'ظَنَّ', meaning: 'to think', root: 'ظ-ن-ن' },
      { verb: 'مَرَّ', meaning: 'to pass', root: 'م-ر-ر' },
      { verb: 'ضَلَّ', meaning: 'to go astray', root: 'ض-ل-ل' },
      // Hamzated verbs (مهموز)
      { verb: 'أَكَلَ', meaning: 'to eat', root: 'أ-ك-ل' },
      { verb: 'أَخَذَ', meaning: 'to take', root: 'أ-خ-ذ' },
      { verb: 'أَمَرَ', meaning: 'to command', root: 'أ-م-ر' },
      { verb: 'سَأَلَ', meaning: 'to ask', root: 'س-أ-ل' },
    ],
  },
  {
    id: 2,
    nameAr: 'الباب الثاني',
    nameEn: 'Form II',
    pattern: 'فَعَّلَ',
    meaning: 'Intensive/causative - makes Form I stronger or causative',
    examples: [
      { verb: 'عَلَّمَ', meaning: 'to teach', root: 'ع-ل-م' },
      { verb: 'كَذَّبَ', meaning: 'to reject/deny', root: 'ك-ذ-ب' },
      { verb: 'صَدَّقَ', meaning: 'to believe', root: 'ص-د-ق' },
      { verb: 'قَدَّمَ', meaning: 'to present', root: 'ق-د-م' },
      { verb: 'نَزَّلَ', meaning: 'to reveal', root: 'ن-ز-ل' },
      { verb: 'كَبَّرَ', meaning: 'to magnify', root: 'ك-ب-ر' },
      { verb: 'صَلَّى', meaning: 'to pray', root: 'ص-ل-و' },
      { verb: 'زَكَّى', meaning: 'to purify', root: 'ز-ك-و' },
      { verb: 'سَمَّى', meaning: 'to name', root: 'س-م-و' },
      { verb: 'وَحَّدَ', meaning: 'to unify', root: 'و-ح-د' },
      // Hollow
      { verb: 'قَوَّمَ', meaning: 'to straighten', root: 'ق-و-م' },
      { verb: 'صَوَّرَ', meaning: 'to picture', root: 'ص-و-ر' },
      { verb: 'كَوَّنَ', meaning: 'to form', root: 'ك-و-ن' },
      { verb: 'بَيَّنَ', meaning: 'to clarify', root: 'ب-ي-ن' },
      { verb: 'زَيَّنَ', meaning: 'to adorn', root: 'ز-ي-ن' },
      // Defective
      { verb: 'وَلَّى', meaning: 'to turn away', root: 'و-ل-ي' },
      { verb: 'غَطَّى', meaning: 'to cover', root: 'غ-ط-و' },
      { verb: 'رَبَّى', meaning: 'to raise/nurture', root: 'ر-ب-و' },
      { verb: 'نَجَّى', meaning: 'to save', root: 'ن-ج-و' },
      // Doubled
      { verb: 'مَدَّدَ', meaning: 'to extend', root: 'م-د-د' },
      { verb: 'حَلَّلَ', meaning: 'to analyze', root: 'ح-ل-ل' },
    ],
  },
  {
    id: 3,
    nameAr: 'الباب الثالث',
    nameEn: 'Form III',
    pattern: 'فَاعَلَ',
    meaning: 'Reciprocal/attempting - doing to/with someone',
    examples: [
      { verb: 'قَاتَلَ', meaning: 'to fight', root: 'ق-ت-ل' },
      { verb: 'جَادَلَ', meaning: 'to argue', root: 'ج-د-ل' },
      { verb: 'سَافَرَ', meaning: 'to travel', root: 'س-ف-ر' },
      { verb: 'عَاقَبَ', meaning: 'to punish', root: 'ع-ق-ب' },
      { verb: 'نَافَقَ', meaning: 'to be hypocritical', root: 'ن-ف-ق' },
      { verb: 'حَاسَبَ', meaning: 'to hold accountable', root: 'ح-س-ب' },
      { verb: 'شَاوَرَ', meaning: 'to consult', root: 'ش-و-ر' },
      { verb: 'بَارَكَ', meaning: 'to bless', root: 'ب-ر-ك' },
      { verb: 'هَاجَرَ', meaning: 'to emigrate', root: 'ه-ج-ر' },
      { verb: 'وَاصَلَ', meaning: 'to continue', root: 'و-ص-ل' },
    ],
  },
  {
    id: 4,
    nameAr: 'الباب الرابع',
    nameEn: 'Form IV',
    pattern: 'أَفْعَلَ',
    meaning: 'Causative - causing someone to do Form I',
    examples: [
      { verb: 'أَسْلَمَ', meaning: 'to submit (Islam)', root: 'س-ل-م' },
      { verb: 'أَكْرَمَ', meaning: 'to honor', root: 'ك-ر-م' },
      { verb: 'أَنْزَلَ', meaning: 'to send down', root: 'ن-ز-ل' },
      { verb: 'أَرْسَلَ', meaning: 'to send', root: 'ر-س-ل' },
      { verb: 'أَحْسَنَ', meaning: 'to do good', root: 'ح-س-ن' },
      { verb: 'آمَنَ', meaning: 'to believe', root: 'أ-م-ن' },
      { verb: 'أَصْلَحَ', meaning: 'to reform', root: 'ص-ل-ح' },
      { verb: 'أَقَامَ', meaning: 'to establish', root: 'ق-و-م' },
      { verb: 'أَرَادَ', meaning: 'to want', root: 'ر-و-د' },
      { verb: 'أَوْضَحَ', meaning: 'to clarify', root: 'و-ض-ح' },
      // Hollow
      { verb: 'أَفَادَ', meaning: 'to benefit', root: 'ف-ي-د' },
      { verb: 'أَجَابَ', meaning: 'to answer', root: 'ج-و-ب' },
      { verb: 'أَصَابَ', meaning: 'to hit/afflict', root: 'ص-و-ب' },
      { verb: 'أَعَادَ', meaning: 'to repeat', root: 'ع-و-د' },
      { verb: 'أَدَارَ', meaning: 'to manage', root: 'د-و-ر' },
      { verb: 'أَزَالَ', meaning: 'to remove', root: 'ز-و-ل' },
      { verb: 'أَنَارَ', meaning: 'to illuminate', root: 'ن-و-ر' },
      // Defective
      { verb: 'أَعْطَى', meaning: 'to give', root: 'ع-ط-و' },
      { verb: 'أَبْقَى', meaning: 'to keep', root: 'ب-ق-ي' },
      { verb: 'أَلْقَى', meaning: 'to throw/deliver', root: 'ل-ق-ي' },
      { verb: 'أَوْحَى', meaning: 'to reveal', root: 'و-ح-ي' },
      { verb: 'أَخْفَى', meaning: 'to hide', root: 'خ-ف-ي' },
      { verb: 'أَدْنَى', meaning: 'to bring near', root: 'د-ن-و' },
      // Doubled
      { verb: 'أَحَبَّ', meaning: 'to love', root: 'ح-ب-ب' },
      { verb: 'أَعَدَّ', meaning: 'to prepare', root: 'ع-د-د' },
      { verb: 'أَضَلَّ', meaning: 'to lead astray', root: 'ض-ل-ل' },
    ],
  },
  {
    id: 5,
    nameAr: 'الباب الخامس',
    nameEn: 'Form V',
    pattern: 'تَفَعَّلَ',
    meaning: 'Reflexive of Form II - doing to oneself',
    examples: [
      { verb: 'تَعَلَّمَ', meaning: 'to learn', root: 'ع-ل-م' },
      { verb: 'تَكَلَّمَ', meaning: 'to speak', root: 'ك-ل-م' },
      { verb: 'تَذَكَّرَ', meaning: 'to remember', root: 'ذ-ك-ر' },
      { verb: 'تَصَدَّقَ', meaning: 'to give charity', root: 'ص-د-ق' },
      { verb: 'تَبَسَّمَ', meaning: 'to smile', root: 'ب-س-م' },
      { verb: 'تَوَكَّلَ', meaning: 'to rely upon', root: 'و-ك-ل' },
      { verb: 'تَقَبَّلَ', meaning: 'to accept', root: 'ق-ب-ل' },
      { verb: 'تَأَمَّلَ', meaning: 'to contemplate', root: 'أ-م-ل' },
      { verb: 'تَوَجَّهَ', meaning: 'to turn toward', root: 'و-ج-ه' },
      { verb: 'تَغَيَّرَ', meaning: 'to change', root: 'غ-ي-ر' },
      // Hollow
      { verb: 'تَكَوَّنَ', meaning: 'to be formed', root: 'ك-و-ن' },
      { verb: 'تَحَوَّلَ', meaning: 'to transform', root: 'ح-و-ل' },
      { verb: 'تَصَوَّرَ', meaning: 'to imagine', root: 'ص-و-ر' },
      { verb: 'تَبَيَّنَ', meaning: 'to become clear', root: 'ب-ي-ن' },
      // Defective
      { verb: 'تَوَلَّى', meaning: 'to take charge', root: 'و-ل-ي' },
      { verb: 'تَمَنَّى', meaning: 'to wish', root: 'م-ن-ي' },
      { verb: 'تَعَدَّى', meaning: 'to transgress', root: 'ع-د-و' },
      { verb: 'تَزَكَّى', meaning: 'to purify oneself', root: 'ز-ك-و' },
      { verb: 'تَجَلَّى', meaning: 'to manifest', root: 'ج-ل-و' },
    ],
  },
  {
    id: 6,
    nameAr: 'الباب السادس',
    nameEn: 'Form VI',
    pattern: 'تَفَاعَلَ',
    meaning: 'Reciprocal/pretending - mutual action or feigning',
    examples: [
      { verb: 'تَعَاوَنَ', meaning: 'to cooperate', root: 'ع-و-ن' },
      { verb: 'تَشَاوَرَ', meaning: 'to consult each other', root: 'ش-و-ر' },
      { verb: 'تَنَافَسَ', meaning: 'to compete', root: 'ن-ف-س' },
      { verb: 'تَخَاصَمَ', meaning: 'to quarrel', root: 'خ-ص-م' },
      { verb: 'تَبَارَكَ', meaning: 'to be blessed', root: 'ب-ر-ك' },
      { verb: 'تَعَارَفَ', meaning: 'to know each other', root: 'ع-ر-ف' },
      { verb: 'تَوَاضَعَ', meaning: 'to be humble', root: 'و-ض-ع' },
      { verb: 'تَنَازَعَ', meaning: 'to dispute', root: 'ن-ز-ع' },
      { verb: 'تَوَاتَرَ', meaning: 'to continue successively', root: 'و-ت-ر' },
      { verb: 'تَلَاوَمَ', meaning: 'to blame each other', root: 'ل-و-م' },
    ],
  },
  {
    id: 7,
    nameAr: 'الباب السابع',
    nameEn: 'Form VII',
    pattern: 'اِنْفَعَلَ',
    meaning: 'Passive/reflexive - being affected by an action',
    examples: [
      { verb: 'اِنْصَرَفَ', meaning: 'to leave', root: 'ص-ر-ف' },
      { verb: 'اِنْطَلَقَ', meaning: 'to set off', root: 'ط-ل-ق' },
      { verb: 'اِنْقَلَبَ', meaning: 'to overturn', root: 'ق-ل-ب' },
      { verb: 'اِنْفَصَلَ', meaning: 'to separate', root: 'ف-ص-ل' },
      { verb: 'اِنْفَرَدَ', meaning: 'to be alone', root: 'ف-ر-د' },
      { verb: 'اِنْفَطَرَ', meaning: 'to split', root: 'ف-ط-ر' },
      { verb: 'اِنْقَادَ', meaning: 'to submit', root: 'ق-و-د' },
      { verb: 'اِنْهَارَ', meaning: 'to collapse', root: 'ه-و-ر' },
      { verb: 'اِنْكَسَرَ', meaning: 'to break', root: 'ك-س-ر' },
      { verb: 'اِنْفَتَحَ', meaning: 'to open (intrans.)', root: 'ف-ت-ح' },
    ],
  },
  {
    id: 8,
    nameAr: 'الباب الثامن',
    nameEn: 'Form VIII',
    pattern: 'اِفْتَعَلَ',
    meaning: 'Reflexive - doing for oneself',
    examples: [
      { verb: 'اِجْتَمَعَ', meaning: 'to gather', root: 'ج-م-ع' },
      { verb: 'اِخْتَلَفَ', meaning: 'to differ', root: 'خ-ل-ف' },
      { verb: 'اِقْتَرَبَ', meaning: 'to approach', root: 'ق-ر-ب' },
      { verb: 'اِسْتَمَعَ', meaning: 'to listen', root: 'س-م-ع' },
      { verb: 'اِجْتَنَبَ', meaning: 'to avoid', root: 'ج-ن-ب' },
      { verb: 'اِعْتَرَفَ', meaning: 'to confess', root: 'ع-ر-ف' },
      { verb: 'اِتَّخَذَ', meaning: 'to take/adopt', root: 'أ-خ-ذ' },
      { verb: 'اِحْتَاجَ', meaning: 'to need', root: 'ح-و-ج' },
      { verb: 'اِخْتَارَ', meaning: 'to choose', root: 'خ-ي-ر' },
      { verb: 'اِغْتَابَ', meaning: 'to backbite', root: 'غ-ي-ب' },
      // Hollow
      { verb: 'اِزْدَادَ', meaning: 'to increase', root: 'ز-ي-د' },
      { verb: 'اِمْتَازَ', meaning: 'to be distinguished', root: 'م-ي-ز' },
      { verb: 'اِسْتَادَ', meaning: 'to hunt', root: 'ص-ي-د' },
      { verb: 'اِرْتَاحَ', meaning: 'to rest', root: 'ر-و-ح' },
      { verb: 'اِنْقَادَ', meaning: 'to be led', root: 'ق-و-د' },
      // Defective
      { verb: 'اِشْتَرَى', meaning: 'to buy', root: 'ش-ر-ي' },
      { verb: 'اِبْتَغَى', meaning: 'to seek', root: 'ب-غ-ي' },
      { verb: 'اِهْتَدَى', meaning: 'to be guided', root: 'ه-د-ي' },
      { verb: 'اِفْتَرَى', meaning: 'to fabricate', root: 'ف-ر-ي' },
      { verb: 'اِكْتَفَى', meaning: 'to be satisfied', root: 'ك-ف-ي' },
      // Assimilated
      { verb: 'اِتَّصَلَ', meaning: 'to connect', root: 'و-ص-ل' },
      { verb: 'اِتَّفَقَ', meaning: 'to agree', root: 'و-ف-ق' },
      { verb: 'اِتَّقَى', meaning: 'to fear (Allah)', root: 'و-ق-ي' },
      { verb: 'اِتَّجَهَ', meaning: 'to head toward', root: 'و-ج-ه' },
      // Doubled
      { verb: 'اِمْتَدَّ', meaning: 'to extend', root: 'م-د-د' },
      { verb: 'اِهْتَمَّ', meaning: 'to be interested', root: 'ه-م-م' },
    ],
  },
  {
    id: 9,
    nameAr: 'الباب التاسع',
    nameEn: 'Form IX',
    pattern: 'اِفْعَلَّ',
    meaning: 'Colors/defects - becoming a color or state',
    examples: [
      { verb: 'اِحْمَرَّ', meaning: 'to become red', root: 'ح-م-ر' },
      { verb: 'اِصْفَرَّ', meaning: 'to become yellow', root: 'ص-ف-ر' },
      { verb: 'اِسْوَدَّ', meaning: 'to become black', root: 'س-و-د' },
      { verb: 'اِبْيَضَّ', meaning: 'to become white', root: 'ب-ي-ض' },
      { verb: 'اِخْضَرَّ', meaning: 'to become green', root: 'خ-ض-ر' },
      { verb: 'اِزْرَقَّ', meaning: 'to become blue', root: 'ز-ر-ق' },
      { verb: 'اِعْوَجَّ', meaning: 'to become crooked', root: 'ع-و-ج' },
      { verb: 'اِحْلَوْلَى', meaning: 'to become sweet', root: 'ح-ل-و' },
    ],
  },
  {
    id: 10,
    nameAr: 'الباب العاشر',
    nameEn: 'Form X',
    pattern: 'اِسْتَفْعَلَ',
    meaning: 'Seeking/considering - seeking or considering as',
    examples: [
      { verb: 'اِسْتَغْفَرَ', meaning: 'to seek forgiveness', root: 'غ-ف-ر' },
      { verb: 'اِسْتَكْبَرَ', meaning: 'to be arrogant', root: 'ك-ب-ر' },
      { verb: 'اِسْتَعْجَلَ', meaning: 'to hasten', root: 'ع-ج-ل' },
      { verb: 'اِسْتَخْرَجَ', meaning: 'to extract', root: 'خ-ر-ج' },
      { verb: 'اِسْتَقَامَ', meaning: 'to be upright', root: 'ق-و-م' },
      { verb: 'اِسْتَطَاعَ', meaning: 'to be able', root: 'ط-و-ع' },
      { verb: 'اِسْتَعَانَ', meaning: 'to seek help', root: 'ع-و-ن' },
      { verb: 'اِسْتَجَابَ', meaning: 'to respond', root: 'ج-و-ب' },
      { verb: 'اِسْتَبْدَلَ', meaning: 'to replace', root: 'ب-د-ل' },
      { verb: 'اِسْتَيْقَظَ', meaning: 'to wake up', root: 'ي-ق-ظ' },
      // Hollow
      { verb: 'اِسْتَفَادَ', meaning: 'to benefit from', root: 'ف-ي-د' },
      { verb: 'اِسْتَقَالَ', meaning: 'to resign', root: 'ق-و-ل' },
      { verb: 'اِسْتَعَارَ', meaning: 'to borrow', root: 'ع-و-ر' },
      { verb: 'اِسْتَدَارَ', meaning: 'to turn around', root: 'د-و-ر' },
      { verb: 'اِسْتَنَارَ', meaning: 'to be illuminated', root: 'ن-و-ر' },
      // Defective
      { verb: 'اِسْتَوْلَى', meaning: 'to seize', root: 'و-ل-ي' },
      { verb: 'اِسْتَعْلَى', meaning: 'to rise above', root: 'ع-ل-و' },
      { verb: 'اِسْتَهْدَى', meaning: 'to seek guidance', root: 'ه-د-ي' },
      { verb: 'اِسْتَقْصَى', meaning: 'to investigate', root: 'ق-ص-و' },
      { verb: 'اِسْتَدْعَى', meaning: 'to summon', root: 'د-ع-و' },
      // Doubled
      { verb: 'اِسْتَمَرَّ', meaning: 'to continue', root: 'م-ر-ر' },
      { verb: 'اِسْتَعَدَّ', meaning: 'to prepare', root: 'ع-د-د' },
      { verb: 'اِسْتَقَرَّ', meaning: 'to settle', root: 'ق-ر-ر' },
      { verb: 'اِسْتَحَقَّ', meaning: 'to deserve', root: 'ح-ق-ق' },
      { verb: 'اِسْتَدَلَّ', meaning: 'to deduce', root: 'د-ل-ل' },
    ],
  },
];

// Helper to get all examples as a flat array
export function getAllExamples(): Array<VerbExample & { patternId: number }> {
  return patterns.flatMap(p => 
    p.examples.map(e => ({ ...e, patternId: p.id }))
  );
}

// Helper to get pattern by ID
export function getPatternById(id: number): VerbPattern | undefined {
  return patterns.find(p => p.id === id);
}

// Fisher-Yates shuffle
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
