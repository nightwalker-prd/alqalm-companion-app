# Classical Arabic Curriculum Expansion: Module Design

**Date:** 2026-01-27
**Status:** Draft
**Purpose:** Comprehensive design for four new modules to complete Classical Arabic curriculum coverage

---

## Executive Summary

The current Madina Interactive platform covers ~70-75% of essential Classical Arabic topics. This design document outlines four new modules to address the remaining gaps:

1. **Balāghah (البلاغة)** - Arabic Rhetoric
2. **ʿArūḍ & Qāfiyah (العروض والقافية)** - Poetry & Prosody
3. **Naḥw Qurʾānī (النحو القرآني)** - Quranic Grammar
4. **Taḥlīl al-Nuṣūṣ (تحليل النصوص)** - Classical Text Analysis

**Target Audience:** Comprehensive coverage for:
- Students wanting to understand the Quran and Islamic texts
- Students interested in classical Arabic prose and poetry
- University students studying Arabic linguistics/literature

---

## Module 1: Balāghah (البلاغة) - Arabic Rhetoric

### Overview

Balāghah is the science of eloquence, divided into three classical disciplines:
- **علم المعاني** (ʿIlm al-Maʿānī) - Meanings/Semantics
- **علم البيان** (ʿIlm al-Bayān) - Clarity/Figures of Speech
- **علم البديع** (ʿIlm al-Badīʿ) - Embellishment/Literary Devices

### Directory Structure

```
src/content/balagha/
├── manifest.json
├── vocabulary.json           # Rhetorical terminology
├── maani/                    # علم المعاني
│   ├── lessons/
│   │   ├── lesson-01.json   # الخبر والإنشاء (Declarative vs Performative)
│   │   ├── lesson-02.json   # أضرب الخبر (Types of Declarative)
│   │   ├── lesson-03.json   # خروج الخبر عن مقتضى الظاهر
│   │   ├── lesson-04.json   # أغراض الخبر (Purposes of Declarative)
│   │   ├── lesson-05.json   # الإنشاء الطلبي (Requestive Performatives)
│   │   ├── lesson-06.json   # الأمر والنهي (Command & Prohibition)
│   │   ├── lesson-07.json   # الاستفهام (Interrogation)
│   │   ├── lesson-08.json   # التمني والنداء (Wishing & Vocative)
│   │   ├── lesson-09.json   # القصر (Restriction/Exclusivity)
│   │   ├── lesson-10.json   # الوصل والفصل (Conjunction & Disjunction)
│   │   ├── lesson-11.json   # الإيجاز والإطناب (Concision & Prolixity)
│   │   └── lesson-12.json   # المساواة (Equivalence)
│   └── exercises.json
├── bayan/                    # علم البيان
│   ├── lessons/
│   │   ├── lesson-01.json   # التشبيه - Introduction (Simile)
│   │   ├── lesson-02.json   # أركان التشبيه (Components of Simile)
│   │   ├── lesson-03.json   # أنواع التشبيه (Types of Simile)
│   │   ├── lesson-04.json   # التشبيه البليغ والتمثيلي
│   │   ├── lesson-05.json   # الحقيقة والمجاز (Literal vs Figurative)
│   │   ├── lesson-06.json   # المجاز اللغوي (Linguistic Metaphor)
│   │   ├── lesson-07.json   # الاستعارة التصريحية (Explicit Metaphor)
│   │   ├── lesson-08.json   # الاستعارة المكنية (Implicit Metaphor)
│   │   ├── lesson-09.json   # الاستعارة التمثيلية (Extended Metaphor)
│   │   ├── lesson-10.json   # المجاز المرسل (Metonymy)
│   │   ├── lesson-11.json   # علاقات المجاز المرسل (Metonymic Relations)
│   │   ├── lesson-12.json   # الكناية (Allusion/Euphemism)
│   │   └── lesson-13.json   # أنواع الكناية (Types of Allusion)
│   └── exercises.json
├── badi/                     # علم البديع
│   ├── lessons/
│   │   ├── lesson-01.json   # المحسنات اللفظية - Introduction
│   │   ├── lesson-02.json   # الجناس (Paronomasia/Wordplay)
│   │   ├── lesson-03.json   # أنواع الجناس (Types of Wordplay)
│   │   ├── lesson-04.json   # السجع (Rhymed Prose)
│   │   ├── lesson-05.json   # الاقتباس والتضمين (Quotation)
│   │   ├── lesson-06.json   # المحسنات المعنوية - Introduction
│   │   ├── lesson-07.json   # الطباق (Antithesis)
│   │   ├── lesson-08.json   # المقابلة (Parallelism)
│   │   ├── lesson-09.json   # التورية (Double Entendre)
│   │   ├── lesson-10.json   # حسن التعليل (Elegant Causation)
│   │   ├── lesson-11.json   # المبالغة (Hyperbole)
│   │   └── lesson-12.json   # أسلوب الحكيم (Wise Response)
│   └── exercises.json
└── examples/
    ├── quran.json            # Quranic examples organized by device
    ├── hadith.json           # Prophetic traditions examples
    ├── poetry.json           # Classical poetry examples
    └── prose.json            # Classical prose examples
```

### Lesson JSON Schema

```json
{
  "id": "balagha-bayan-07",
  "branch": "bayan",
  "topic": "الاستعارة التصريحية",
  "topicEn": "Explicit Metaphor",
  "difficulty": "intermediate",
  "prerequisites": ["balagha-bayan-05", "balagha-bayan-06"],
  "definition": {
    "arabic": "هي ما صُرِّح فيها بلفظ المشبه به",
    "english": "A metaphor where the vehicle (comparand) is explicitly stated while the tenor (compared) is omitted"
  },
  "notes": [],
  "examples": [
    {
      "id": "ex-bayan-07-01",
      "source": "quran",
      "reference": "البقرة: 257",
      "arabic": "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ",
      "translation": "Allah is the ally of those who believe. He brings them out of darknesses into the light",
      "analysis": {
        "device": "استعارة تصريحية",
        "mushabbah": "الكفر",
        "mushabbahBih": "الظلمات",
        "wajhShabah": "عدم الهداية والضلال",
        "explanation": "استعار الظلمات للكفر والنور للإيمان بجامع عدم الاهتداء"
      }
    }
  ],
  "exercises": [
    {
      "type": "identify-device",
      "prompt": "حدد نوع البلاغة في الآية",
      "options": ["تشبيه", "استعارة تصريحية", "استعارة مكنية", "كناية"]
    },
    {
      "type": "analyze-components",
      "prompt": "ما المشبه والمشبه به في هذه الاستعارة؟"
    },
    {
      "type": "create-similar",
      "prompt": "أنشئ استعارة تصريحية مشابهة"
    }
  ]
}
```

### Exercise Types

| Type | Description |
|------|-------------|
| `identify-device` | Identify the rhetorical device used |
| `analyze-components` | Break down the components (tenor, vehicle, ground) |
| `explain-effect` | Explain the rhetorical effect/purpose |
| `find-examples` | Find similar devices in a given text |
| `create-similar` | Create your own example using the device |
| `compare-devices` | Compare two similar devices and explain difference |
| `correct-analysis` | Identify errors in a given analysis |

---

## Module 2: ʿArūḍ & Qāfiyah (العروض والقافية) - Poetry & Prosody

### Overview

Classical Arabic poetry follows strict metrical patterns. This module covers:
- **علم العروض** (ʿIlm al-ʿArūḍ) - Metrical science (the 16 meters)
- **علم القافية** (ʿIlm al-Qāfiyah) - Rhyme science
- **أنواع الشعر** - Poetic forms and genres

### Directory Structure

```
src/content/arud/
├── manifest.json
├── vocabulary.json              # Prosodic terminology
├── foundations/                 # أساسيات العروض
│   ├── lessons/
│   │   ├── lesson-01.json      # الكتابة العروضية (Prosodic Transcription)
│   │   ├── lesson-02.json      # الحروف المتحركة والساكنة
│   │   ├── lesson-03.json      # التفعيلات الأساسية (Basic Feet)
│   │   ├── lesson-04.json      # السبب والوتد والفاصلة
│   │   ├── lesson-05.json      # التقطيع العروضي (Scansion)
│   │   └── lesson-06.json      # الزحافات والعلل (Permitted Variations)
│   └── exercises.json
├── meters/                      # البحور الشعرية (The 16 Meters)
│   ├── lessons/
│   │   ├── lesson-01.json      # البحر الطويل (al-Ṭawīl)
│   │   ├── lesson-02.json      # البحر المديد (al-Madīd)
│   │   ├── lesson-03.json      # البحر البسيط (al-Basīṭ)
│   │   ├── lesson-04.json      # البحر الوافر (al-Wāfir)
│   │   ├── lesson-05.json      # البحر الكامل (al-Kāmil)
│   │   ├── lesson-06.json      # البحر الهزج (al-Hazaj)
│   │   ├── lesson-07.json      # البحر الرجز (al-Rajaz)
│   │   ├── lesson-08.json      # البحر الرمل (al-Ramal)
│   │   ├── lesson-09.json      # البحر السريع (al-Sarīʿ)
│   │   ├── lesson-10.json      # البحر المنسرح (al-Munsariḥ)
│   │   ├── lesson-11.json      # البحر الخفيف (al-Khafīf)
│   │   ├── lesson-12.json      # البحر المضارع (al-Muḍāriʿ)
│   │   ├── lesson-13.json      # البحر المقتضب (al-Muqtaḍab)
│   │   ├── lesson-14.json      # البحر المجتث (al-Mujtathth)
│   │   ├── lesson-15.json      # البحر المتقارب (al-Mutaqārib)
│   │   └── lesson-16.json      # البحر المتدارك (al-Mutadārik)
│   └── exercises.json
├── qafiyah/                     # علم القافية (Rhyme)
│   ├── lessons/
│   │   ├── lesson-01.json      # تعريف القافية (Definition)
│   │   ├── lesson-02.json      # حروف القافية (Letters of Rhyme)
│   │   ├── lesson-03.json      # الروي والوصل والخروج
│   │   ├── lesson-04.json      # أنواع القافية (Types)
│   │   ├── lesson-05.json      # عيوب القافية (Rhyme Defects)
│   │   └── lesson-06.json      # الإقواء والإكفاء والسناد
│   └── exercises.json
├── forms/                       # أشكال الشعر (Poetic Forms)
│   ├── lessons/
│   │   ├── lesson-01.json      # القصيدة (The Qaṣīdah)
│   │   ├── lesson-02.json      # أغراض الشعر (Themes: مدح، هجاء، رثاء، غزل)
│   │   ├── lesson-03.json      # المقطوعة (The Fragment)
│   │   ├── lesson-04.json      # الموشح (The Muwashshaḥ)
│   │   ├── lesson-05.json      # الزجل (The Zajal)
│   │   └── lesson-06.json      # الرجز والأراجيز (Didactic Verse)
│   └── exercises.json
├── anthology/                   # مختارات شعرية
│   ├── jahili.json             # Pre-Islamic poetry (المعلقات)
│   ├── islami.json             # Early Islamic poetry
│   ├── umawi.json              # Umayyad period
│   ├── abbasi.json             # Abbasid period
│   └── andalusi.json           # Andalusian poetry
└── tools/
    └── scansion-rules.json     # Rules for auto-scansion engine
```

### Meter Lesson Schema

```json
{
  "id": "arud-meters-01",
  "meter": "الطويل",
  "meterEn": "al-Ṭawīl (The Long)",
  "difficulty": "intermediate",
  "prevalence": "most-common",
  "pattern": {
    "tafailat": ["فَعُولُنْ", "مَفَاعِيلُنْ", "فَعُولُنْ", "مَفَاعِيلُنْ"],
    "symbolic": "//o/o //o/o/o //o/o //o/o/o",
    "perHemistich": 4,
    "totalFeet": 8
  },
  "mnemonic": {
    "arabic": "طَوِيلٌ لَهُ دُونَ البُحُورِ فَضَائِلُ | فَعُولُنْ مَفَاعِيلُنْ فَعُولُنْ مَفَاعِلُ",
    "explanation": "This line itself is in al-Ṭawīl meter and serves as a memory aid"
  },
  "variations": [
    {
      "name": "الطويل التام",
      "pattern": "فَعُولُنْ مَفَاعِيلُنْ فَعُولُنْ مَفَاعِيلُنْ",
      "notes": "Full form, all feet complete"
    }
  ],
  "examples": [
    {
      "id": "tawil-ex-01",
      "poet": "امرؤ القيس",
      "era": "jahili",
      "source": "المعلقات",
      "bayt": {
        "sadr": "قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ وَمَنْزِلِ",
        "ajuz": "بِسِقْطِ اللِّوَى بَيْنَ الدَّخُولِ فَحَوْمَلِ"
      },
      "scansion": {
        "sadr": {
          "written": "قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ وَمَنْزِلِ",
          "prosodic": "قِفَانَبْ | كِمِنْذِكْ | رَىحَبِي | بِنْوَمَنْزِلِي",
          "pattern": "//o/o | //o/o/o | //o/o | //o/o/o",
          "feet": ["فَعُولُنْ", "مَفَاعِيلُنْ", "فَعُولُ", "مَفَاعِلُنْ"]
        }
      },
      "translation": "Stop, let us weep over the memory of a beloved and her dwelling",
      "notes": "Opening of Imru' al-Qays's Muʿallaqah, the most famous Arabic poem"
    }
  ]
}
```

### Scansion Tool Data

```json
{
  "prosodicRules": {
    "alwaysWritten": [
      {"pattern": "ال التعريف الشمسية", "rule": "write shadda letter twice"},
      {"pattern": "التنوين", "rule": "write as nun saakin"},
      {"pattern": "المد", "rule": "write as two letters"}
    ],
    "alwaysOmitted": [
      {"pattern": "همزة الوصل", "rule": "omit if preceded by vowel"},
      {"pattern": "الألف في أنا", "rule": "omit before vowel"},
      {"pattern": "واو عمرو", "rule": "omit"}
    ]
  },
  "tafailat": {
    "فَعُولُنْ": {"pattern": "//o/o", "weight": "sabab-watad"},
    "مَفَاعِيلُنْ": {"pattern": "//o/o/o", "weight": "watad-sababan"},
    "فَاعِلَاتُنْ": {"pattern": "/o//o/o", "weight": "sabab-watad-sabab"},
    "مُسْتَفْعِلُنْ": {"pattern": "/o/o//o", "weight": "sababan-watad"},
    "فَاعِلُنْ": {"pattern": "/o//o", "weight": "sabab-watad"},
    "مُتَفَاعِلُنْ": {"pattern": "///o//o", "weight": "sabab-faasila"},
    "مَفَاعَلَتُنْ": {"pattern": "//o///o", "weight": "watad-faasila"},
    "مَفْعُولَاتُ": {"pattern": "/o/o/o/", "weight": "sababan-watad"}
  },
  "zihaafat": {
    "القبض": {"removes": "5th sakin", "example": "مَفَاعِيلُنْ → مَفَاعِلُنْ"},
    "الكف": {"removes": "7th sakin", "example": "مَفَاعِيلُنْ → مَفَاعِيلُ"},
    "الخبن": {"removes": "2nd sakin", "example": "فَاعِلُنْ → فَعِلُنْ"},
    "الطي": {"removes": "4th sakin", "example": "مُسْتَفْعِلُنْ → مُسْتَعِلُنْ"}
  }
}
```

### Anthology Entry Schema

```json
{
  "id": "muallaqat-imruulqays",
  "title": "معلقة امرئ القيس",
  "poet": {
    "name": "امرؤ القيس بن حُجر الكندي",
    "nameEn": "Imru' al-Qays ibn Hujr al-Kindi",
    "era": "jahili",
    "death": "540 CE (approx)",
    "bio": "Known as 'The Wandering King', considered the father of Arabic poetry"
  },
  "meter": "الطويل",
  "rhyme": "اللام المكسورة",
  "theme": "غزل، وصف، فخر",
  "lineCount": 81,
  "lines": [
    {
      "number": 1,
      "sadr": "قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ وَمَنْزِلِ",
      "ajuz": "بِسِقْطِ اللِّوَى بَيْنَ الدَّخُولِ فَحَوْمَلِ",
      "translation": "Stop, let us weep...",
      "vocabulary": ["قفا", "نبك", "سقط", "اللوى"],
      "rhetoric": ["أسلوب الأمر", "الإضافة"],
      "grammar": ["فعل أمر للمثنى", "مجرور بمن"]
    }
  ],
  "commentary": {
    "classical": ["شرح الزوزني", "شرح التبريزي"],
    "overview": "..."
  }
}
```

### Exercise Types

| Type | Description |
|------|-------------|
| `prosodic-transcription` | Convert normal text to prosodic writing |
| `identify-meter` | Identify the meter of a given line |
| `scansion` | Mark syllables and identify feet |
| `complete-hemistich` | Complete a line maintaining meter |
| `find-defects` | Identify metrical errors in a line |
| `match-tafila` | Match pattern to correct foot name |
| `identify-zihaf` | Identify the variation applied |
| `compose-meter` | Write original lines in a given meter |

---

## Module 3: Naḥw Qurʾānī (النحو القرآني) - Quranic Grammar

### Overview

Quranic Arabic has unique grammatical features. This module covers:
- **الإعراب القرآني** - Parsing Quranic verses
- **القراءات** - Variant readings and their grammatical implications
- **الأساليب القرآنية** - Unique Quranic constructions
- **إعراب الجمل** - Sentence-level parsing in context

### Directory Structure

```
src/content/quran-nahw/
├── manifest.json
├── vocabulary.json                # Quranic grammatical terminology
├── foundations/                   # أساسيات النحو القرآني
│   ├── lessons/
│   │   ├── lesson-01.json        # مقدمة في إعراب القرآن
│   │   ├── lesson-02.json        # الفرق بين النحو العام والقرآني
│   │   ├── lesson-03.json        # أثر القراءات في الإعراب
│   │   ├── lesson-04.json        # الوقف والابتداء وأثرهما
│   │   └── lesson-05.json        # مصادر إعراب القرآن الكريم
│   └── exercises.json
├── unique-constructions/          # الأساليب القرآنية الخاصة
│   ├── lessons/
│   │   ├── lesson-01.json        # الالتفات (Shift in Person/Number/Tense)
│   │   ├── lesson-02.json        # الحذف والتقدير (Ellipsis)
│   │   ├── lesson-03.json        # التقديم والتأخير (Fronting)
│   │   ├── lesson-04.json        # الفصل والوصل (Asyndeton/Polysyndeton)
│   │   ├── lesson-05.json        # إضمار الفعل (Implied Verbs)
│   │   ├── lesson-06.json        # الاستئناف (Resumption)
│   │   ├── lesson-07.json        # الاعتراض (Parenthetical)
│   │   ├── lesson-08.json        # العطف على المعنى (Semantic Conjunction)
│   │   ├── lesson-09.json        # الحمل على اللفظ والمعنى
│   │   ├── lesson-10.json        # التغليب (Predominance)
│   │   ├── lesson-11.json        # النفي والاستثناء القرآني
│   │   └── lesson-12.json        # الشرط في القرآن (Quranic Conditionals)
│   └── exercises.json
├── particles/                     # الحروف القرآنية
│   ├── lessons/
│   │   ├── lesson-01.json        # لام الابتداء ولام القسم
│   │   ├── lesson-02.json        # ما الموصولة والمصدرية والنافية
│   │   ├── lesson-03.json        # إنّ وأنّ: الفتح والكسر
│   │   ├── lesson-04.json        # لو ولولا ولوما
│   │   ├── lesson-05.json        # إذ وإذا وإذن
│   │   ├── lesson-06.json        # كي ولام التعليل
│   │   ├── lesson-07.json        # بل ولكن وأم
│   │   ├── lesson-08.json        # الفاء في القرآن (أنواعها)
│   │   ├── lesson-09.json        # الواو في القرآن (أنواعها)
│   │   └── lesson-10.json        # حتى: حرف جر وغاية ونصب
│   └── exercises.json
├── qiraat/                        # القراءات وأثرها النحوي
│   ├── lessons/
│   │   ├── lesson-01.json        # مقدمة في القراءات السبع
│   │   ├── lesson-02.json        # القراءات والإعراب: أمثلة
│   │   ├── lesson-03.json        # اختلاف الإعراب باختلاف القراءة
│   │   ├── lesson-04.json        # {مَلِكِ / مَالِكِ} يوم الدين
│   │   ├── lesson-05.json        # {يَخْدَعُونَ / يُخَادِعُونَ}
│   │   └── lesson-06.json        # قراءات مؤثرة في المعنى والإعراب
│   └── exercises.json
├── surah-studies/                 # دراسات نحوية في السور
│   ├── al-fatiha.json            # Complete i'rab of Al-Fatiha
│   ├── al-baqarah-selected.json  # Selected verses from Al-Baqarah
│   ├── yasin-selected.json       # Selected verses from Yasin
│   ├── al-kahf-selected.json     # Selected verses from Al-Kahf
│   ├── al-mulk.json              # Complete i'rab of Al-Mulk
│   └── juz-amma/                 # جزء عم كاملاً
│       ├── an-naba.json
│       ├── an-naziat.json
│       └── ... (all 37 surahs)
├── themes/                        # موضوعات نحوية قرآنية
│   ├── oaths.json                # القسم في القرآن
│   ├── conditions.json           # الشرط في القرآن
│   ├── questions.json            # الاستفهام في القرآن
│   ├── negation.json             # النفي في القرآن
│   ├── commands.json             # الأمر والنهي في القرآن
│   └── vocative.json             # النداء في القرآن
└── reference/
    ├── irab-symbols.json         # Parsing symbols and abbreviations
    └── grammatical-terms.json    # Full terminology reference
```

### Iltifāt Lesson Schema

```json
{
  "id": "quran-nahw-iltifat-01",
  "topic": "الالتفات",
  "topicEn": "Iltifāt (Grammatical Shifting)",
  "difficulty": "advanced",
  "definition": {
    "arabic": "هو الانتقال من أسلوب إلى آخر: من التكلم إلى الخطاب أو الغيبة، أو من المفرد إلى الجمع، أو من الماضي إلى المضارع",
    "english": "Shifting from one grammatical form to another: person, number, tense, or voice - for rhetorical effect"
  },
  "types": [
    {
      "name": "الالتفات في الضمير",
      "nameEn": "Person Shift",
      "subtypes": [
        "من الغيبة إلى الخطاب",
        "من الخطاب إلى الغيبة",
        "من التكلم إلى الغيبة",
        "من الغيبة إلى التكلم"
      ]
    },
    {
      "name": "الالتفات في العدد",
      "nameEn": "Number Shift",
      "subtypes": [
        "من المفرد إلى الجمع",
        "من الجمع إلى المفرد"
      ]
    },
    {
      "name": "الالتفات في الفعل",
      "nameEn": "Tense Shift",
      "subtypes": [
        "من الماضي إلى المضارع",
        "من المضارع إلى الماضي"
      ]
    }
  ],
  "examples": [
    {
      "id": "iltifat-01",
      "surah": "الفاتحة",
      "ayah": "5-6",
      "arabic": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      "shiftType": "من الغيبة إلى الخطاب",
      "analysis": {
        "before": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ - غيبة (talking about Allah)",
        "after": "إِيَّاكَ نَعْبُدُ - خطاب (talking to Allah directly)",
        "reason": "الانتقال من الثناء البعيد إلى المناجاة القريبة"
      },
      "translation": "You alone we worship, and You alone we ask for help.",
      "rhetoricalEffect": "Creates intimacy after praising Allah in third person"
    }
  ]
}
```

### Surah Study Schema (Complete I'rab)

```json
{
  "id": "surah-fatiha-irab",
  "surah": "الفاتحة",
  "surahNumber": 1,
  "ayahCount": 7,
  "overview": {
    "names": ["الفاتحة", "أم الكتاب", "السبع المثاني"],
    "mainThemes": ["الحمد", "العبادة", "الدعاء"],
    "grammaticalFeatures": ["الالتفات", "الإضافة", "الصفة", "البدل"]
  },
  "ayat": [
    {
      "number": 1,
      "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "translation": "In the name of Allah, the Most Gracious, the Most Merciful",
      "irab": {
        "full": [
          {
            "word": "بِسْمِ",
            "components": [
              {"part": "بِ", "irab": "حرف جر مبني على الكسر"},
              {"part": "اسْمِ", "irab": "اسم مجرور بالباء وعلامة جره الكسرة، وهو مضاف"}
            ]
          },
          {
            "word": "اللَّهِ",
            "irab": "لفظ الجلالة مضاف إليه مجرور وعلامة جره الكسرة"
          },
          {
            "word": "الرَّحْمَٰنِ",
            "irab": "صفة لله مجرورة وعلامة جرها الكسرة"
          },
          {
            "word": "الرَّحِيمِ",
            "irab": "صفة ثانية مجرورة وعلامة جرها الكسرة"
          }
        ],
        "sentenceType": "جار ومجرور متعلق بفعل محذوف تقديره: أبدأ أو أقرأ",
        "notes": [
          "حُذف الفعل للتعميم: أي باسم الله أفعل كل شيء"
        ]
      },
      "qiraat": [
        {
          "reading": "اسم",
          "reciters": ["الجمهور"],
          "note": "بحذف الألف وصلاً"
        }
      ],
      "rhetoricalNotes": [
        "بدأ بالجار والمجرور لإفادة الحصر: باسم الله لا بغيره"
      ]
    }
  ]
}
```

### Exercise Types

| Type | Description |
|------|-------------|
| `parse-word` | Parse a specific word in context |
| `parse-sentence` | Provide complete sentence parsing |
| `identify-shift` | Identify iltifāt type |
| `explain-case` | Explain why a word has its case |
| `identify-particle` | Identify particle type and function |
| `compare-qiraat` | Compare grammatical implications of readings |
| `find-ellipsis` | Identify what is implied/deleted |
| `complete-irab` | Complete a partial parsing |
| `identify-function` | Identify grammatical function |

---

## Module 4: Taḥlīl al-Nuṣūṣ (تحليل النصوص) - Classical Text Analysis

### Overview

This module teaches integrated analysis of authentic Classical Arabic texts:
- **الحديث النبوي** - Prophetic traditions
- **النثر الأدبي** - Classical prose
- **التفسير** - Exegetical texts
- **الفقه والأصول** - Legal texts
- **التاريخ** - Historical narratives
- **الفلسفة** - Philosophical texts

### Directory Structure

```
src/content/text-analysis/
├── manifest.json
├── vocabulary.json                 # Cross-genre terminology
├── methodology/                    # منهجية تحليل النصوص
│   ├── lessons/
│   │   ├── lesson-01.json         # مقدمة في تحليل النصوص
│   │   ├── lesson-02.json         # المستويات الأربعة للتحليل
│   │   ├── lesson-03.json         # السياق وأثره في الفهم
│   │   ├── lesson-04.json         # التحليل الصرفي المنهجي
│   │   ├── lesson-05.json         # التحليل النحوي المنهجي
│   │   ├── lesson-06.json         # التحليل البلاغي المنهجي
│   │   ├── lesson-07.json         # التحليل الدلالي (Semantic Analysis)
│   │   ├── lesson-08.json         # ربط التحليلات معاً
│   │   └── lesson-09.json         # الترجمة المبنية على التحليل
│   └── exercises.json
├── hadith/                         # الحديث النبوي
│   ├── introduction.json          # مقدمة في لغة الحديث
│   ├── nawawi-40/                 # الأربعون النووية (all 42)
│   │   ├── hadith-01.json         # إنما الأعمال بالنيات
│   │   ├── hadith-02.json         # حديث جبريل
│   │   └── ...
│   ├── bukhari-selected.json
│   └── thematic/
│       ├── iman.json
│       ├── akhlaq.json
│       └── muamalat.json
├── prose/                          # النثر الأدبي
│   ├── introduction.json
│   ├── khutab/                    # الخطب
│   │   ├── khutbat-hajj.json     # خطبة حجة الوداع
│   │   ├── abu-bakr-khilafa.json
│   │   ├── ali-shiqshiqiyya.json
│   │   └── ziyad-batra.json
│   ├── wasaya/                    # الوصايا
│   ├── rasail/                    # الرسائل
│   └── maqamat/                   # المقامات
├── tafsir/                         # نصوص التفسير
│   ├── introduction.json
│   ├── tabari-samples.json
│   ├── zamakhshari-samples.json
│   └── razi-samples.json
├── fiqh/                           # النصوص الفقهية
│   ├── introduction.json
│   ├── usul/                      # أصول الفقه
│   │   ├── shafii-risala.json
│   │   └── ghazali-mustasfa.json
│   └── furu/                      # فروع الفقه
├── history/                        # النصوص التاريخية
│   ├── introduction.json
│   ├── tabari-tarikh.json
│   ├── ibn-khaldun-muqaddima.json
│   └── ibn-athir.json
├── philosophy/                     # النصوص الفلسفية
│   ├── introduction.json
│   ├── kindi.json
│   ├── farabi.json
│   ├── ibn-sina.json
│   └── ibn-rushd.json
└── integrated-analysis/
    ├── comparative.json
    └── genre-features.json
```

### Hadith Analysis Schema

```json
{
  "id": "nawawi-01",
  "collection": "الأربعون النووية",
  "number": 1,
  "source": {
    "primary": "صحيح البخاري ومسلم",
    "narrator": "عمر بن الخطاب رضي الله عنه"
  },
  "text": {
    "arabic": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى...",
    "translation": "Actions are but by intentions, and every person shall have only that which they intended..."
  },
  "difficulty": "intermediate",
  "analysis": {
    "morphological": {
      "keyWords": [
        {
          "word": "الأَعْمَالُ",
          "root": "ع م ل",
          "pattern": "أَفْعَال",
          "type": "جمع تكسير",
          "singular": "عَمَل"
        },
        {
          "word": "النِّيَّاتِ",
          "root": "ن و ي",
          "pattern": "فِعْلَات",
          "type": "جمع مؤنث سالم",
          "singular": "نِيَّة",
          "originalForm": "نِوْيَة",
          "note": "أصلها نِوْيَة، قُلبت الواو ياءً وأُدغمت"
        }
      ]
    },
    "grammatical": {
      "sentences": [
        {
          "text": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
          "type": "جملة اسمية مؤكدة بإنما",
          "irab": [
            {"word": "إِنَّمَا", "function": "أداة حصر"},
            {"word": "الأَعْمَالُ", "function": "مبتدأ مرفوع"},
            {"word": "بِالنِّيَّاتِ", "function": "جار ومجرور متعلق بخبر محذوف"}
          ],
          "note": "الخبر محذوف، والتقدير: الأعمال معتبرة بالنيات"
        }
      ]
    },
    "rhetorical": {
      "devices": [
        {
          "device": "الحصر بإنما",
          "location": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
          "effect": "حصر اعتبار الأعمال في النيات"
        },
        {
          "device": "المقابلة",
          "elements": ["هجرة لله ورسوله", "هجرة لدنيا أو امرأة"],
          "effect": "إبراز التناقض بين الإخلاص والرياء"
        }
      ]
    },
    "semantic": {
      "keyTerms": [
        {
          "term": "الأعمال",
          "scope": "عام يشمل أعمال القلوب والجوارح واللسان"
        },
        {
          "term": "النيات",
          "definition": "القصد والعزم على الفعل",
          "location": "محلها القلب"
        }
      ],
      "implications": [
        "وجوب النية في العبادات",
        "أن الأعمال تتفاضل بتفاضل النيات"
      ]
    }
  },
  "contextual": {
    "occasionOfStatement": "قيل: نزل رجل مهاجراً ليتزوج امرأة تُسمى أم قيس",
    "scholarlyCommentary": [
      {
        "scholar": "الإمام الشافعي",
        "quote": "هذا الحديث ثلث العلم"
      }
    ]
  }
}
```

### Genre Comparison Schema

```json
{
  "id": "genre-comparison",
  "title": "مقارنة خصائص الأنواع الأدبية",
  "genres": [
    {
      "name": "الحديث النبوي",
      "features": {
        "vocabulary": ["بساطة الألفاظ", "جوامع الكلم", "المصطلحات الشرعية"],
        "grammar": ["الجمل القصيرة", "التراكيب الواضحة", "قلة الحذف"],
        "rhetoric": ["التشبيه البليغ", "الإيجاز المعجز", "قلة التكلف"],
        "style": ["الوضوح", "الاتساق", "الحكمة"]
      },
      "challenges": ["فهم السياق", "معرفة المصطلحات"]
    },
    {
      "name": "النثر الأدبي (المقامات)",
      "features": {
        "vocabulary": ["الغريب والنادر", "المترادفات", "الألفاظ المسجوعة"],
        "grammar": ["التراكيب المعقدة", "الحذف والإضمار"],
        "rhetoric": ["السجع المتكلف", "الجناس", "الطباق"],
        "style": ["التصنع", "إظهار البراعة", "الفكاهة"]
      },
      "challenges": ["الغريب", "فك السجع", "فهم التلميحات"]
    },
    {
      "name": "النصوص الفقهية",
      "features": {
        "vocabulary": ["المصطلحات الفقهية", "الدقة", "التحديد"],
        "grammar": ["الشرط", "الاستثناء", "التفصيل"],
        "rhetoric": ["التقسيم", "التعليل", "الترتيب المنطقي"],
        "style": ["الوضوح", "الإحكام", "التجريد"]
      },
      "challenges": ["المصطلحات", "التفريعات", "الإحالات"]
    },
    {
      "name": "النصوص الفلسفية",
      "features": {
        "vocabulary": ["المصطلحات المنطقية", "التعريب", "المجردات"],
        "grammar": ["الجمل الطويلة", "التعقيد", "الربط المنطقي"],
        "rhetoric": ["القياس", "التمثيل", "البرهان"],
        "style": ["التجريد", "الدقة", "التسلسل"]
      },
      "challenges": ["المصطلحات اليونانية المعربة", "التجريد", "طول الجمل"]
    }
  ]
}
```

### Exercise Types

| Type | Description |
|------|-------------|
| `integrated-analysis` | Analyze text at all four levels |
| `genre-identification` | Identify the genre and its features |
| `compare-texts` | Compare two texts from different genres |
| `translate-analyze` | Translate with analysis-informed choices |
| `fill-analysis` | Complete a partial analysis |
| `identify-style` | Identify stylistic features unique to author/genre |
| `contextualize` | Explain how context affects meaning |
| `extract-principles` | Extract general principles from specific texts |
| `scholarly-commentary` | Engage with classical interpretations |
| `creative-application` | Apply the style/structure to create similar text |

---

## Implementation Summary

### Module Statistics

| Module | Lessons | Focus | Prerequisites |
|--------|---------|-------|---------------|
| **Balāghah** | ~37 | Rhetorical devices, eloquence | Book 2+ grammar |
| **ʿArūḍ** | ~28 + anthology | Meter, rhyme, poetic forms | Book 2+ grammar |
| **Quranic Grammar** | ~33 + surah studies | Unique Quranic constructions | Book 3 grammar |
| **Text Analysis** | ~9 methodology + texts | Integrated analysis | All above modules |

### Recommended Learning Path

```
Book 1-2 Grammar → Balāghah (Foundations) → ʿArūḍ (Foundations)
                          ↓                        ↓
Book 3 Grammar  →  Balāghah (Full)    →    ʿArūḍ (Full)
       ↓                   ↓                     ↓
Quranic Grammar  ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
       ↓
Text Analysis (integrates all)
```

### Content Totals (Estimated)

- **New Lessons:** ~107
- **New Surah Studies:** 37+ (Juz Amma) + selected verses
- **Anthology Poems:** 50+ major poems with full analysis
- **Hadith Analyses:** 42 (Nawawi) + selected from Bukhari
- **Prose Texts:** 15+ major sermons, letters, maqamat
- **Scholarly Texts:** 20+ samples from tafsir, fiqh, philosophy, history

### Technical Considerations

1. **Lazy Loading:** All content files should be dynamically imported
2. **Search Indexing:** Build search indices for rhetorical devices, grammatical terms
3. **Cross-References:** Link examples across modules (e.g., Quranic verse in Balāghah → full i'rab in Quranic Grammar)
4. **Audio Support:** Consider adding recitation for poetry and Quranic content
5. **Interactive Scansion:** Build scansion tool using `scansion-rules.json`

---

## Next Steps

1. [ ] Review and approve this design
2. [ ] Prioritize which module to implement first
3. [ ] Create content authoring guidelines
4. [ ] Set up directory structure
5. [ ] Begin content creation for highest-priority module
6. [ ] Build UI components for new exercise types
