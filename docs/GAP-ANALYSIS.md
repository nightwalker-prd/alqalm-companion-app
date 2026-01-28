# Madina Interactive - Gap Analysis

**Date:** 2026-01-26
**Status:** In Progress

---

## 🎨 UI/UX Gaps

### ✅ Being Addressed Now
- [x] No Settings Page
- [x] No Help/Tutorial System  
- [x] Feature Discoverability
- [x] Missing Breadcrumbs
- [x] No Search

### 🔜 To Address Later

#### High Priority
1. **No Audio Playback UI** - TTS service exists (`ttsService.ts`) but no visible "play pronunciation" buttons on vocabulary/exercises

2. **Knowledge Map Overwhelm** - Book 3 has 120 lessons; the map becomes unusable at that scale. Consider:
   - Collapsible book sections
   - Mini-map navigation
   - Search/filter within map

3. **No Account/Sync** - All progress is localStorage only; users lose everything if they switch devices or clear browser data. Options:
   - Convex backend integration
   - Export/import JSON
   - Google/Apple sign-in

4. **Bottom Nav Limitations** - 5 items but 20+ features; "Practice" needs a hub page or sub-navigation

5. **No Offline Clarity** - PWA exists but no indication of what's available offline

---

## 📚 Content Gaps

### Critical
1. **Limited Sentence Exercises** - Only **28 sentences** total for 3 books (~200 lessons). Should have 500+ for meaningful practice

2. **No Collocations for Books 2 & 3** - Only `book1/collocations.json` exists

3. **No Audio Files** - Zero pronunciation audio; learners need to hear proper Arabic

### High Priority
4. **Vocabulary Missing Context** - Words have only `arabic`, `english`, `root`. Missing:
   - Example sentences in context
   - Plural forms (جمع)
   - Verb conjugations (تصريف)
   - Related/derived words
   - Usage notes

5. **Quranic Content** - Goal "Quran fluency" exists in onboarding but no Quranic-specific:
   - High-frequency Quranic vocabulary
   - Verse examples
   - Tajweed notes
   - Surah-based reading passages

6. **Grammar Depth Varies** - Book 1 has detailed explanations with examples; audit Books 2-3 for same quality

### Medium Priority
7. **Root Families Coverage** - Audit if all roots from vocabulary have corresponding family data in `root-families.json`

8. **Reading Passages Distribution** - 667 passages exist but verify balanced coverage:
   - Beginner vs Intermediate vs Advanced ratio
   - Topic diversity
   - Length variety

---

## 🔧 Implementation Priorities

### Phase 1 (Current Sprint)
| Item | Status | Notes |
|------|--------|-------|
| Settings Page | 🔄 In Progress | Goals, reset, dark mode, TTS |
| Help/Tutorial | 🔄 In Progress | First-run tour, tooltips |
| Feature Discovery | 🔄 In Progress | Reorganize dashboard |
| Breadcrumbs | 🔄 In Progress | Navigation context |
| Search | 🔄 In Progress | Dashboard search |

### Phase 2 (Content)
| Item | Effort | Priority |
|------|--------|----------|
| Expand sentences to 200+ | 2-3 days | High |
| Book 2/3 collocations | 2 days | High |
| Vocabulary example sentences | 3-4 days | High |
| Audio pronunciations | TBD (need TTS API or recordings) | Medium |

### Phase 3 (Infrastructure)
| Item | Effort | Priority |
|------|--------|----------|
| User accounts & sync | 1 week | Medium |
| Offline improvements | 2-3 days | Medium |
| Knowledge map redesign | 3-4 days | Low |

---

## 📊 Content Statistics

| Book | Lessons | Words | Grammar Points | Exercises |
|------|---------|-------|----------------|-----------|
| 1 | 35 | 292 | 58 | 456 |
| 2 | 56 | ~400 | ~80 | ~600 |
| 3 | 120 | ~600 | ~200 | ~1000 |

- **Reading Passages:** 667
- **Sentence Exercises:** 28 (needs expansion)
- **Verb Patterns:** Forms I-X with 50+ examples each
- **Root Families:** 50 families

---

*Last updated: 2026-01-26*
