/**
 * Arabic Morphological Patterns (الأوزان الصرفية)
 * اسم فاعل، اسم مفعول، مصدر، صفة مشبهة، اسم مكان، اسم آلة، اسم تفضيل
 */

export interface MorphPattern {
  id: string;
  nameAr: string;
  nameEn: string;
  patterns: string[];  // Multiple patterns possible (e.g., مصدر has many)
  description: string;
  examples: MorphExample[];
}

export interface MorphExample {
  word: string;
  meaning: string;
  root: string;
  pattern?: string;  // Specific pattern if multiple exist for this category
}

export const morphPatterns: MorphPattern[] = [
  {
    id: 'ism-faa3il',
    nameAr: 'اسم الفاعل',
    nameEn: 'Active Participle',
    patterns: ['فَاعِل', 'مُفَعِّل', 'مُفَاعِل', 'مُفْعِل', 'مُتَفَعِّل', 'مُتَفَاعِل', 'مُنْفَعِل', 'مُفْتَعِل', 'مُسْتَفْعِل'],
    description: 'The doer of the action',
    examples: [
      // Form I - فَاعِل
      { word: 'كَاتِب', meaning: 'writer', root: 'ك-ت-ب', pattern: 'فَاعِل' },
      { word: 'عَالِم', meaning: 'scholar', root: 'ع-ل-م', pattern: 'فَاعِل' },
      { word: 'قَارِئ', meaning: 'reader', root: 'ق-ر-أ', pattern: 'فَاعِل' },
      { word: 'سَامِع', meaning: 'listener', root: 'س-م-ع', pattern: 'فَاعِل' },
      { word: 'نَاصِر', meaning: 'helper', root: 'ن-ص-ر', pattern: 'فَاعِل' },
      { word: 'ذَاهِب', meaning: 'one going', root: 'ذ-ه-ب', pattern: 'فَاعِل' },
      { word: 'جَالِس', meaning: 'one sitting', root: 'ج-ل-س', pattern: 'فَاعِل' },
      { word: 'حَامِل', meaning: 'carrier', root: 'ح-م-ل', pattern: 'فَاعِل' },
      { word: 'قَائِل', meaning: 'speaker', root: 'ق-و-ل', pattern: 'فَاعِل' },
      { word: 'نَائِم', meaning: 'sleeper', root: 'ن-و-م', pattern: 'فَاعِل' },
      { word: 'صَائِم', meaning: 'one fasting', root: 'ص-و-م', pattern: 'فَاعِل' },
      { word: 'خَائِف', meaning: 'one fearing', root: 'خ-و-ف', pattern: 'فَاعِل' },
      // Form II - مُفَعِّل
      { word: 'مُعَلِّم', meaning: 'teacher', root: 'ع-ل-م', pattern: 'مُفَعِّل' },
      { word: 'مُدَرِّس', meaning: 'instructor', root: 'د-ر-س', pattern: 'مُفَعِّل' },
      { word: 'مُصَلِّي', meaning: 'one praying', root: 'ص-ل-ي', pattern: 'مُفَعِّل' },
      // Form III - مُفَاعِل
      { word: 'مُجَاهِد', meaning: 'one striving', root: 'ج-ه-د', pattern: 'مُفَاعِل' },
      { word: 'مُسَافِر', meaning: 'traveler', root: 'س-ف-ر', pattern: 'مُفَاعِل' },
      // Form IV - مُفْعِل
      { word: 'مُسْلِم', meaning: 'Muslim', root: 'س-ل-م', pattern: 'مُفْعِل' },
      { word: 'مُحْسِن', meaning: 'benefactor', root: 'ح-س-ن', pattern: 'مُفْعِل' },
      // Form V - مُتَفَعِّل
      { word: 'مُتَعَلِّم', meaning: 'learner', root: 'ع-ل-م', pattern: 'مُتَفَعِّل' },
      { word: 'مُتَكَلِّم', meaning: 'speaker', root: 'ك-ل-م', pattern: 'مُتَفَعِّل' },
      // Form VIII - مُفْتَعِل
      { word: 'مُجْتَهِد', meaning: 'one striving', root: 'ج-ه-د', pattern: 'مُفْتَعِل' },
      { word: 'مُسْتَمِع', meaning: 'listener', root: 'س-م-ع', pattern: 'مُفْتَعِل' },
      // Form X - مُسْتَفْعِل
      { word: 'مُسْتَغْفِر', meaning: 'one seeking forgiveness', root: 'غ-ف-ر', pattern: 'مُسْتَفْعِل' },
    ],
  },
  {
    id: 'ism-maf3ool',
    nameAr: 'اسم المفعول',
    nameEn: 'Passive Participle',
    patterns: ['مَفْعُول', 'مُفَعَّل', 'مُفَاعَل', 'مُفْعَل', 'مُتَفَعَّل', 'مُفْتَعَل', 'مُسْتَفْعَل'],
    description: 'The one upon whom action is done',
    examples: [
      // Form I - مَفْعُول
      { word: 'مَكْتُوب', meaning: 'written', root: 'ك-ت-ب', pattern: 'مَفْعُول' },
      { word: 'مَعْلُوم', meaning: 'known', root: 'ع-ل-م', pattern: 'مَفْعُول' },
      { word: 'مَسْمُوع', meaning: 'heard', root: 'س-م-ع', pattern: 'مَفْعُول' },
      { word: 'مَفْتُوح', meaning: 'opened', root: 'ف-ت-ح', pattern: 'مَفْعُول' },
      { word: 'مَنْصُور', meaning: 'helped/victorious', root: 'ن-ص-ر', pattern: 'مَفْعُول' },
      { word: 'مَقْرُوء', meaning: 'read', root: 'ق-ر-أ', pattern: 'مَفْعُول' },
      { word: 'مَشْرُوب', meaning: 'drink (beverage)', root: 'ش-ر-ب', pattern: 'مَفْعُول' },
      { word: 'مَحْمُول', meaning: 'carried', root: 'ح-م-ل', pattern: 'مَفْعُول' },
      { word: 'مَوْجُود', meaning: 'found/existing', root: 'و-ج-د', pattern: 'مَفْعُول' },
      { word: 'مَغْفُور', meaning: 'forgiven', root: 'غ-ف-ر', pattern: 'مَفْعُول' },
      { word: 'مَأْكُول', meaning: 'eaten', root: 'أ-ك-ل', pattern: 'مَفْعُول' },
      { word: 'مَأْخُوذ', meaning: 'taken', root: 'أ-خ-ذ', pattern: 'مَفْعُول' },
      // Form II - مُفَعَّل
      { word: 'مُعَلَّم', meaning: 'taught/marked', root: 'ع-ل-م', pattern: 'مُفَعَّل' },
      { word: 'مُقَدَّس', meaning: 'sanctified', root: 'ق-د-س', pattern: 'مُفَعَّل' },
      { word: 'مُحَمَّد', meaning: 'praised', root: 'ح-م-د', pattern: 'مُفَعَّل' },
      // Form IV - مُفْعَل
      { word: 'مُرْسَل', meaning: 'sent', root: 'ر-س-ل', pattern: 'مُفْعَل' },
      { word: 'مُنْزَل', meaning: 'revealed/sent down', root: 'ن-ز-ل', pattern: 'مُفْعَل' },
      // Form X - مُسْتَفْعَل
      { word: 'مُسْتَغْفَر', meaning: 'sought forgiveness for', root: 'غ-ف-ر', pattern: 'مُسْتَفْعَل' },
    ],
  },
  {
    id: 'masdar',
    nameAr: 'المصدر',
    nameEn: 'Verbal Noun',
    patterns: ['فَعْل', 'فِعْل', 'فُعْل', 'فَعَال', 'فِعَالَة', 'فُعُول', 'فَعِيل', 'مَفْعَل', 'تَفْعِيل', 'مُفَاعَلَة', 'إِفْعَال', 'تَفَعُّل', 'تَفَاعُل', 'اِنْفِعَال', 'اِفْتِعَال', 'اِسْتِفْعَال'],
    description: 'The abstract noun of the action',
    examples: [
      // Form I variations
      { word: 'كِتَابَة', meaning: 'writing', root: 'ك-ت-ب', pattern: 'فِعَالَة' },
      { word: 'عِلْم', meaning: 'knowledge', root: 'ع-ل-م', pattern: 'فِعْل' },
      { word: 'سَمْع', meaning: 'hearing', root: 'س-م-ع', pattern: 'فَعْل' },
      { word: 'نَصْر', meaning: 'help/victory', root: 'ن-ص-ر', pattern: 'فَعْل' },
      { word: 'فَتْح', meaning: 'opening/conquest', root: 'ف-ت-ح', pattern: 'فَعْل' },
      { word: 'خُرُوج', meaning: 'exit', root: 'خ-ر-ج', pattern: 'فُعُول' },
      { word: 'دُخُول', meaning: 'entry', root: 'د-خ-ل', pattern: 'فُعُول' },
      { word: 'قِرَاءَة', meaning: 'reading', root: 'ق-ر-أ', pattern: 'فِعَالَة' },
      { word: 'جُلُوس', meaning: 'sitting', root: 'ج-ل-س', pattern: 'فُعُول' },
      { word: 'وُجُود', meaning: 'existence', root: 'و-ج-د', pattern: 'فُعُول' },
      { word: 'ذَهَاب', meaning: 'going', root: 'ذ-ه-ب', pattern: 'فَعَال' },
      { word: 'قَوْل', meaning: 'saying', root: 'ق-و-ل', pattern: 'فَعْل' },
      { word: 'نَوْم', meaning: 'sleep', root: 'ن-و-م', pattern: 'فَعْل' },
      { word: 'صَوْم', meaning: 'fasting', root: 'ص-و-م', pattern: 'فَعْل' },
      { word: 'مَوْت', meaning: 'death', root: 'م-و-ت', pattern: 'فَعْل' },
      { word: 'خَوْف', meaning: 'fear', root: 'خ-و-ف', pattern: 'فَعْل' },
      // Form II - تَفْعِيل
      { word: 'تَعْلِيم', meaning: 'teaching', root: 'ع-ل-م', pattern: 'تَفْعِيل' },
      { word: 'تَدْرِيس', meaning: 'instruction', root: 'د-ر-س', pattern: 'تَفْعِيل' },
      { word: 'تَقْدِيس', meaning: 'sanctification', root: 'ق-د-س', pattern: 'تَفْعِيل' },
      { word: 'تَحْمِيد', meaning: 'praising', root: 'ح-م-د', pattern: 'تَفْعِيل' },
      // Form III - مُفَاعَلَة / فِعَال
      { word: 'مُجَاهَدَة', meaning: 'striving', root: 'ج-ه-د', pattern: 'مُفَاعَلَة' },
      { word: 'مُسَافَرَة', meaning: 'traveling', root: 'س-ف-ر', pattern: 'مُفَاعَلَة' },
      { word: 'جِهَاد', meaning: 'struggle/striving', root: 'ج-ه-د', pattern: 'فِعَال' },
      // Form IV - إِفْعَال
      { word: 'إِسْلَام', meaning: 'submission (Islam)', root: 'س-ل-م', pattern: 'إِفْعَال' },
      { word: 'إِحْسَان', meaning: 'excellence', root: 'ح-س-ن', pattern: 'إِفْعَال' },
      { word: 'إِرْسَال', meaning: 'sending', root: 'ر-س-ل', pattern: 'إِفْعَال' },
      { word: 'إِنْزَال', meaning: 'revealing', root: 'ن-ز-ل', pattern: 'إِفْعَال' },
      // Form V - تَفَعُّل
      { word: 'تَعَلُّم', meaning: 'learning', root: 'ع-ل-م', pattern: 'تَفَعُّل' },
      { word: 'تَكَلُّم', meaning: 'speaking', root: 'ك-ل-م', pattern: 'تَفَعُّل' },
      // Form VI - تَفَاعُل
      { word: 'تَعَاوُن', meaning: 'cooperation', root: 'ع-و-ن', pattern: 'تَفَاعُل' },
      // Form VIII - اِفْتِعَال
      { word: 'اِجْتِهَاد', meaning: 'striving/effort', root: 'ج-ه-د', pattern: 'اِفْتِعَال' },
      { word: 'اِسْتِمَاع', meaning: 'listening', root: 'س-م-ع', pattern: 'اِفْتِعَال' },
      // Form X - اِسْتِفْعَال
      { word: 'اِسْتِغْفَار', meaning: 'seeking forgiveness', root: 'غ-ف-ر', pattern: 'اِسْتِفْعَال' },
      { word: 'اِسْتِسْلَام', meaning: 'surrender', root: 'س-ل-م', pattern: 'اِسْتِفْعَال' },
    ],
  },
  {
    id: 'sifa-mushabbaha',
    nameAr: 'الصفة المشبهة',
    nameEn: 'Resembling Adjective',
    patterns: ['فَعِيل', 'فَعْلَان', 'فَعِل', 'فَعَل', 'أَفْعَل'],
    description: 'Permanent quality or characteristic',
    examples: [
      { word: 'كَبِير', meaning: 'big', root: 'ك-ب-ر', pattern: 'فَعِيل' },
      { word: 'صَغِير', meaning: 'small', root: 'ص-غ-ر', pattern: 'فَعِيل' },
      { word: 'جَمِيل', meaning: 'beautiful', root: 'ج-م-ل', pattern: 'فَعِيل' },
      { word: 'كَرِيم', meaning: 'generous', root: 'ك-ر-م', pattern: 'فَعِيل' },
      { word: 'عَظِيم', meaning: 'great', root: 'ع-ظ-م', pattern: 'فَعِيل' },
      { word: 'حَكِيم', meaning: 'wise', root: 'ح-ك-م', pattern: 'فَعِيل' },
      { word: 'رَحِيم', meaning: 'merciful', root: 'ر-ح-م', pattern: 'فَعِيل' },
      { word: 'قَوِيّ', meaning: 'strong', root: 'ق-و-ي', pattern: 'فَعِيل' },
      { word: 'غَنِيّ', meaning: 'rich', root: 'غ-ن-ي', pattern: 'فَعِيل' },
      { word: 'شَدِيد', meaning: 'severe', root: 'ش-د-د', pattern: 'فَعِيل' },
      { word: 'جَدِيد', meaning: 'new', root: 'ج-د-د', pattern: 'فَعِيل' },
      { word: 'بَعِيد', meaning: 'far', root: 'ب-ع-د', pattern: 'فَعِيل' },
      { word: 'قَرِيب', meaning: 'near', root: 'ق-ر-ب', pattern: 'فَعِيل' },
      { word: 'طَوِيل', meaning: 'tall/long', root: 'ط-و-ل', pattern: 'فَعِيل' },
      // فَعْلَان pattern
      { word: 'عَطْشَان', meaning: 'thirsty', root: 'ع-ط-ش', pattern: 'فَعْلَان' },
      { word: 'جَوْعَان', meaning: 'hungry', root: 'ج-و-ع', pattern: 'فَعْلَان' },
      { word: 'غَضْبَان', meaning: 'angry', root: 'غ-ض-ب', pattern: 'فَعْلَان' },
      { word: 'كَسْلَان', meaning: 'lazy', root: 'ك-س-ل', pattern: 'فَعْلَان' },
      // فَعِل pattern
      { word: 'حَسَن', meaning: 'good', root: 'ح-س-ن', pattern: 'فَعَل' },
      { word: 'فَرِح', meaning: 'happy', root: 'ف-ر-ح', pattern: 'فَعِل' },
      // أَفْعَل for colors/defects
      { word: 'أَحْمَر', meaning: 'red', root: 'ح-م-ر', pattern: 'أَفْعَل' },
      { word: 'أَبْيَض', meaning: 'white', root: 'ب-ي-ض', pattern: 'أَفْعَل' },
      { word: 'أَسْوَد', meaning: 'black', root: 'س-و-د', pattern: 'أَفْعَل' },
      { word: 'أَخْضَر', meaning: 'green', root: 'خ-ض-ر', pattern: 'أَفْعَل' },
      { word: 'أَزْرَق', meaning: 'blue', root: 'ز-ر-ق', pattern: 'أَفْعَل' },
      { word: 'أَصْفَر', meaning: 'yellow', root: 'ص-ف-ر', pattern: 'أَفْعَل' },
      { word: 'أَعْمَى', meaning: 'blind', root: 'ع-م-ي', pattern: 'أَفْعَل' },
      { word: 'أَصَمّ', meaning: 'deaf', root: 'ص-م-م', pattern: 'أَفْعَل' },
    ],
  },
  {
    id: 'ism-makan',
    nameAr: 'اسم المكان',
    nameEn: 'Noun of Place',
    patterns: ['مَفْعَل', 'مَفْعِل', 'مَفْعَلَة'],
    description: 'The place of the action',
    examples: [
      { word: 'مَكْتَب', meaning: 'office/desk', root: 'ك-ت-ب', pattern: 'مَفْعَل' },
      { word: 'مَدْرَسَة', meaning: 'school', root: 'د-ر-س', pattern: 'مَفْعَلَة' },
      { word: 'مَسْجِد', meaning: 'mosque', root: 'س-ج-د', pattern: 'مَفْعِل' },
      { word: 'مَطْبَخ', meaning: 'kitchen', root: 'ط-ب-خ', pattern: 'مَفْعَل' },
      { word: 'مَكْتَبَة', meaning: 'library', root: 'ك-ت-ب', pattern: 'مَفْعَلَة' },
      { word: 'مَطْعَم', meaning: 'restaurant', root: 'ط-ع-م', pattern: 'مَفْعَل' },
      { word: 'مَخْرَج', meaning: 'exit', root: 'خ-ر-ج', pattern: 'مَفْعَل' },
      { word: 'مَدْخَل', meaning: 'entrance', root: 'د-خ-ل', pattern: 'مَفْعَل' },
      { word: 'مَلْعَب', meaning: 'playground', root: 'ل-ع-ب', pattern: 'مَفْعَل' },
      { word: 'مَشْرِق', meaning: 'east/sunrise', root: 'ش-ر-ق', pattern: 'مَفْعِل' },
      { word: 'مَغْرِب', meaning: 'west/sunset', root: 'غ-ر-ب', pattern: 'مَفْعِل' },
      { word: 'مَوْقِف', meaning: 'parking/stance', root: 'و-ق-ف', pattern: 'مَفْعِل' },
      { word: 'مَجْلِس', meaning: 'sitting area/council', root: 'ج-ل-س', pattern: 'مَفْعِل' },
      { word: 'مَنْزِل', meaning: 'house', root: 'ن-ز-ل', pattern: 'مَفْعِل' },
      { word: 'مَوْلِد', meaning: 'birthplace', root: 'و-ل-د', pattern: 'مَفْعِل' },
    ],
  },
  {
    id: 'ism-aala',
    nameAr: 'اسم الآلة',
    nameEn: 'Noun of Instrument',
    patterns: ['مِفْعَل', 'مِفْعَلَة', 'مِفْعَال', 'فَعَّالَة'],
    description: 'The instrument/tool of the action',
    examples: [
      { word: 'مِفْتَاح', meaning: 'key', root: 'ف-ت-ح', pattern: 'مِفْعَال' },
      { word: 'مِقْلَمَة', meaning: 'pencil case', root: 'ق-ل-م', pattern: 'مِفْعَلَة' },
      { word: 'مِكْنَسَة', meaning: 'broom', root: 'ك-ن-س', pattern: 'مِفْعَلَة' },
      { word: 'مِنْشَار', meaning: 'saw', root: 'ن-ش-ر', pattern: 'مِفْعَال' },
      { word: 'مِطْرَقَة', meaning: 'hammer', root: 'ط-ر-ق', pattern: 'مِفْعَلَة' },
      { word: 'مِقَصّ', meaning: 'scissors', root: 'ق-ص-ص', pattern: 'مِفْعَل' },
      { word: 'مِلْعَقَة', meaning: 'spoon', root: 'ل-ع-ق', pattern: 'مِفْعَلَة' },
      { word: 'مِصْبَاح', meaning: 'lamp', root: 'ص-ب-ح', pattern: 'مِفْعَال' },
      { word: 'مِيزَان', meaning: 'scale/balance', root: 'و-ز-ن', pattern: 'مِفْعَال' },
      { word: 'مِرْآة', meaning: 'mirror', root: 'ر-أ-ي', pattern: 'مِفْعَلَة' },
      { word: 'مِسْطَرَة', meaning: 'ruler', root: 'س-ط-ر', pattern: 'مِفْعَلَة' },
      { word: 'مِنْظَار', meaning: 'telescope/binoculars', root: 'ن-ظ-ر', pattern: 'مِفْعَال' },
      // فَعَّالَة pattern
      { word: 'غَسَّالَة', meaning: 'washing machine', root: 'غ-س-ل', pattern: 'فَعَّالَة' },
      { word: 'ثَلَّاجَة', meaning: 'refrigerator', root: 'ث-ل-ج', pattern: 'فَعَّالَة' },
      { word: 'سَيَّارَة', meaning: 'car', root: 'س-ي-ر', pattern: 'فَعَّالَة' },
      { word: 'طَيَّارَة', meaning: 'airplane', root: 'ط-ي-ر', pattern: 'فَعَّالَة' },
    ],
  },
  {
    id: 'ism-tafdeel',
    nameAr: 'اسم التفضيل',
    nameEn: 'Comparative/Superlative',
    patterns: ['أَفْعَل'],
    description: 'Comparison - more/most',
    examples: [
      { word: 'أَكْبَر', meaning: 'bigger/biggest', root: 'ك-ب-ر', pattern: 'أَفْعَل' },
      { word: 'أَصْغَر', meaning: 'smaller/smallest', root: 'ص-غ-ر', pattern: 'أَفْعَل' },
      { word: 'أَفْضَل', meaning: 'better/best', root: 'ف-ض-ل', pattern: 'أَفْعَل' },
      { word: 'أَحْسَن', meaning: 'better/best', root: 'ح-س-ن', pattern: 'أَفْعَل' },
      { word: 'أَجْمَل', meaning: 'more/most beautiful', root: 'ج-م-ل', pattern: 'أَفْعَل' },
      { word: 'أَعْظَم', meaning: 'greater/greatest', root: 'ع-ظ-م', pattern: 'أَفْعَل' },
      { word: 'أَكْرَم', meaning: 'more/most generous', root: 'ك-ر-م', pattern: 'أَفْعَل' },
      { word: 'أَقْوَى', meaning: 'stronger/strongest', root: 'ق-و-ي', pattern: 'أَفْعَل' },
      { word: 'أَغْنَى', meaning: 'richer/richest', root: 'غ-ن-ي', pattern: 'أَفْعَل' },
      { word: 'أَعْلَى', meaning: 'higher/highest', root: 'ع-ل-و', pattern: 'أَفْعَل' },
      { word: 'أَدْنَى', meaning: 'lower/lowest', root: 'د-ن-و', pattern: 'أَفْعَل' },
      { word: 'أَكْثَر', meaning: 'more/most', root: 'ك-ث-ر', pattern: 'أَفْعَل' },
      { word: 'أَقَلّ', meaning: 'less/least', root: 'ق-ل-ل', pattern: 'أَفْعَل' },
      { word: 'أَسْرَع', meaning: 'faster/fastest', root: 'س-ر-ع', pattern: 'أَفْعَل' },
      { word: 'أَطْوَل', meaning: 'taller/tallest', root: 'ط-و-ل', pattern: 'أَفْعَل' },
      { word: 'أَقْرَب', meaning: 'closer/closest', root: 'ق-ر-ب', pattern: 'أَفْعَل' },
      { word: 'أَبْعَد', meaning: 'farther/farthest', root: 'ب-ع-د', pattern: 'أَفْعَل' },
    ],
  },
];

// Utility functions
export function getAllMorphExamples(): (MorphExample & { patternId: string })[] {
  return morphPatterns.flatMap(pattern =>
    pattern.examples.map(ex => ({ ...ex, patternId: pattern.id }))
  );
}

export function getPatternById(id: string): MorphPattern | undefined {
  return morphPatterns.find(p => p.id === id);
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
