# Madina Interactive — Feature Roadmap

Planned features discussed 2026-01-26. Ordered by dependency chain.

---

## 10. Export Progress (Quick Win — Start Here)
**Effort:** 1-2 hours | **Dependencies:** None

Gives users peace of mind and unblocks future sync features.

### Implementation
```
src/
  lib/
    exportService.ts        # Export/import logic
  components/
    settings/
      ExportProgress.tsx    # UI component
  pages/
    Settings.tsx            # New page (or add to Progress.tsx)
```

### Data to Export
- `localStorage` keys: mastery data, settings, streak info, FIRe state
- Bundle as JSON with version number + timestamp
- Import validates schema before overwriting

### UI
- Button in Progress page or new Settings page
- "Export Progress" → downloads `madina-backup-2026-01-26.json`
- "Import Progress" → file picker, confirm overwrite dialog

---

## 9. Dashboard Cleanup (Quick Win)
**Effort:** 2-3 hours | **Dependencies:** None

Current state: 12+ cards in a flat list. Needs hierarchy.

### Proposed Structure
```
┌─────────────────────────────────────────┐
│  Daily Goal + Strand Balance (keep)     │
├─────────────────────────────────────────┤
│  ⚡ QUICK PRACTICE (collapsed section)  │
│    • Start Practice (primary CTA)       │
│    • Speed Round                        │
│    • Word Cards                         │
├─────────────────────────────────────────┤
│  📚 DEEP WORK (collapsed section)       │
│    • I'rab Practice                     │
│    • Root Families / Explore            │
│    • Sentence Building (new)            │
│    • Wazn Trainer (new)                 │
├─────────────────────────────────────────┤
│  📖 READING (collapsed section)         │
│    • Narrow Reading                     │
│    • Speed Reading                      │
├─────────────────────────────────────────┤
│  🎯 SKILL BUILDING (collapsed section)  │
│    • Target Weaknesses                  │
│    • Free Recall                        │
│    • Typing Drills (new)                │
├─────────────────────────────────────────┤
│  Knowledge Map (keep at bottom)         │
│  Word of the Day (keep)                 │
└─────────────────────────────────────────┘
```

### Implementation
```
src/
  components/
    dashboard/
      ActivitySection.tsx   # Collapsible section component
      QuickPractice.tsx
      DeepWork.tsx
      ReadingSection.tsx
      SkillBuilding.tsx
```

### Behavior
- Sections remember expanded/collapsed state (localStorage)
- Primary CTA always visible
- Mobile: start collapsed except "Quick Practice"

---

## 7. Streak & Achievement System
**Effort:** 4-6 hours | **Dependencies:** #10 (export needs to include achievements)

### Data Model
```typescript
// src/lib/achievementService.ts

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalWordsLearned: number;
  totalExercisesCompleted: number;
  totalTimeMinutes: number;
  lessonsCompleted: number;
  perfectSessions: number;  // 100% accuracy
  booksCompleted: number;
  firstPracticeDate: string;
}

interface Achievement {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  icon: string;           // emoji or icon name
  unlockedAt?: string;    // ISO date when earned
  tier: 'bronze' | 'silver' | 'gold';
  category: 'streak' | 'mastery' | 'practice' | 'milestone';
}

// Example achievements
const ACHIEVEMENTS = [
  // Streaks
  { id: 'streak-3', title: 'Three-Peat', tier: 'bronze', threshold: 3 },
  { id: 'streak-7', title: 'Week Warrior', tier: 'bronze', threshold: 7 },
  { id: 'streak-30', title: 'Monthly Master', tier: 'silver', threshold: 30 },
  { id: 'streak-100', title: 'Century', tier: 'gold', threshold: 100 },
  
  // Mastery
  { id: 'words-50', title: 'Vocabulary Builder', tier: 'bronze', threshold: 50 },
  { id: 'words-250', title: 'Word Hoarder', tier: 'silver', threshold: 250 },
  { id: 'words-500', title: 'Lexicon Lord', tier: 'gold', threshold: 500 },
  
  // Practice
  { id: 'exercises-100', title: 'Century Club', tier: 'bronze', threshold: 100 },
  { id: 'perfect-10', title: 'Perfectionist', tier: 'silver', threshold: 10 },
  
  // Milestones
  { id: 'book1-complete', title: 'Book 1 Graduate', tier: 'silver' },
  { id: 'first-irab', title: 'Grammar Curious', tier: 'bronze' },
];
```

### UI Components
```
src/
  components/
    achievements/
      AchievementBadge.tsx      # Single badge display
      AchievementToast.tsx      # Popup when earned
      AchievementGrid.tsx       # Collection view
      StreakDisplay.tsx         # Flame + number
  pages/
    Achievements.tsx            # Full page view
```

### Integration Points
- Dashboard: Show streak prominently (top right or in header)
- Practice complete: Check for new achievements, show toast
- Progress page: Link to achievements
- Export: Include unlocked achievements

---

## 2. Wazn Trainer Integration
**Effort:** 3-4 hours | **Dependencies:** None (standalone wazn-trainer exists)

### Options

**Option A: Embed as Route (Recommended)**
- Copy `wazn-trainer/src/data/patterns.ts` → `madina-interactive/src/content/sarf/patterns.ts`
- Create `src/pages/WaznPractice.tsx` adapting the UI
- Use existing mastery system for tracking

**Option B: Link Out**
- Deploy wazn-trainer separately
- Add link from dashboard
- No shared progress (not ideal)

### Implementation (Option A)
```
src/
  content/
    sarf/
      patterns.ts             # Verb pattern data (from wazn-trainer)
  pages/
    WaznPractice.tsx          # Main practice page
  lib/
    waznService.ts            # Track wazn mastery per pattern
  hooks/
    useWaznPractice.ts        # Session management
```

### Mastery Integration
- Track each pattern (Form I-X) independently
- Feed into FIRe system like vocabulary
- Show pattern mastery in Progress page

---

## 4. Quick Tap Dictionary
**Effort:** 4-5 hours | **Dependencies:** Vocabulary data structure

### Implementation
```
src/
  components/
    reading/
      TappableWord.tsx        # Wrapper for Arabic words
      WordPopover.tsx         # Popup with definition
  hooks/
    useDictionary.ts          # Lookup service
  lib/
    dictionaryService.ts      # Word → definition/root/irab
```

### Data Source
- Primary: Existing vocabulary from lessons (already have Arabic + English + root)
- Fallback: Show "not in vocabulary" for unknown words
- Future: Could add external dictionary API

### Behavior
1. Wrap Arabic text in `<TappableWord>` components
2. Tap → show popover with:
   - English meaning
   - Root (linked to root explorer)
   - Part of speech
   - I'rab (if in sentence context)
3. Option to add to personal word list

### Integration
- Reading passages
- Practice exercises (show definition after answer)
- Anywhere Arabic text appears

---

## 3. Sentence Building
**Effort:** 6-8 hours | **Dependencies:** #4 (uses dictionary for hints)

### Concept
Given an English sentence → arrange Arabic word tiles in correct order.

Tests:
- Word order (فعل + فاعل + مفعول به vs English SVO)
- Agreement (gender, number)
- I'rab understanding (correct case endings)

### Data Model
```typescript
// src/content/sentences/types.ts

interface SentenceExercise {
  id: string;
  lessonId: string;
  english: string;
  correctArabic: string[];      // Ordered tokens
  distractors?: string[];       // Wrong options to include
  grammarPoints: string[];      // What this tests
  difficulty: 1 | 2 | 3;
}

// Example
{
  id: 'b1-l05-s01',
  lessonId: 'b1-l05',
  english: 'The student went to the mosque.',
  correctArabic: ['ذَهَبَ', 'الطَّالِبُ', 'إِلَى', 'المَسْجِدِ'],
  distractors: ['الطَّالِبَ', 'المَسْجِدُ'],  // Wrong case endings
  grammarPoints: ['verb-subject-order', 'marfoo-subject', 'majroor-preposition'],
  difficulty: 1
}
```

### UI
```
src/
  pages/
    SentenceBuilding.tsx
  components/
    sentence/
      WordTile.tsx            # Draggable word
      SentenceDropZone.tsx    # Where tiles go
      SentenceResult.tsx      # Feedback with grammar explanation
  lib/
    sentenceService.ts        # Validation, scoring
  hooks/
    useSentenceSession.ts
```

### Content Generation
- Start with 5-10 sentences per lesson (Books 1-2)
- Could semi-automate: take existing vocab + templates
- Manual review needed for quality

---

## 8. Typing Drills
**Effort:** 5-6 hours | **Dependencies:** None

### Concept
Practice Arabic keyboard input. Levels:
1. **Letter drills** — See letter, type it
2. **Word drills** — See Arabic word, type it (no English)
3. **Dictation** — Hear word (TTS), type it
4. **Translation typing** — See English, type Arabic

### Implementation
```
src/
  pages/
    TypingPractice.tsx
  components/
    typing/
      ArabicKeyboard.tsx      # On-screen keyboard (optional, shows layout)
      TypingInput.tsx         # Handles Arabic input
      TypingResult.tsx        # Accuracy, WPM stats
  lib/
    typingService.ts          # Validation, stats tracking
    arabicNormalize.ts        # Handle tashkeel variations
  hooks/
    useTypingSession.ts
```

### Arabic Input Handling
- Accept with or without tashkeel (configurable)
- Normalize hamza variants (أ إ آ ء)
- Show on-screen keyboard for users without Arabic input

### Metrics
- Characters per minute
- Accuracy %
- Common mistakes (confusion pairs)

---

## Implementation Order

```
Week 1:
  Day 1-2: #10 Export Progress + #9 Dashboard Cleanup
  Day 3-4: #7 Streak/Achievements (data model + basic UI)
  Day 5:   #7 Achievement toasts + integration

Week 2:
  Day 1-2: #2 Wazn Trainer integration
  Day 3-4: #4 Quick Tap Dictionary
  Day 5:   Polish + bug fixes

Week 3:
  Day 1-3: #3 Sentence Building (core mechanics)
  Day 4-5: #3 Sentence content + polish

Week 4:
  Day 1-3: #8 Typing Drills
  Day 4-5: Full integration testing, edge cases
```

---

## Notes

- All new features should integrate with existing FIRe spaced repetition
- All progress should be included in export
- Mobile-first — test on phone throughout
- Keep bundle size in mind — lazy load new pages
