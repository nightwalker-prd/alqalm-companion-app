# AGENTS.md - Coding Agent Guidelines

This document provides guidelines for AI coding agents working on the Madina Interactive project, an Arabic language learning application built with React, TypeScript, Vite, and Convex.

## Build, Lint, and Test Commands

### Development
```bash
npm run dev           # Start Vite dev server
npm run build         # TypeScript check + Vite build
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Testing (Vitest)
```bash
npm test                                        # Watch mode
npm run test:run                                # Single run (CI mode)
npx vitest run src/lib/__tests__/arabic.test.ts # Run a single test file
npx vitest run -t "removeTashkeel"              # Run tests matching pattern
npx vitest src/lib/__tests__/arabic.test.ts     # Watch mode for one file
```

## Project Structure

```
src/
├── types/          # TypeScript type definitions
├── lib/            # Pure utility functions (arabic.ts, mastery.ts, interleave.ts)
│   └── __tests__/  # Unit tests for lib functions
├── hooks/          # Custom React hooks (usePracticeSession, etc.)
│   └── __tests__/  # Hook tests
├── components/
│   ├── ui/         # Reusable UI components (Button, Card, etc.)
│   ├── layout/     # Layout components (Header, BottomNav, PageContainer)
│   ├── exercise/   # Exercise-specific components
│   └── map/        # Knowledge map visualization
├── pages/          # Route-level page components
├── content/        # Lesson JSON data (book2/, book3/)
└── assets/         # Static assets
```

## Code Style Guidelines

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No unused locals or parameters (`noUnusedLocals`, `noUnusedParameters`)
- Use `type` imports: `import type { Foo } from './types'`
- Use discriminated unions for type-safe variants (see `src/types/exercise.ts`)

### Naming Conventions
- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`arabic.ts`)
- **Components**: PascalCase (`Button`, `PracticeSession`)
- **Hooks**: camelCase with `use` prefix (`usePracticeSession`)
- **Functions**: camelCase (`fisherYatesShuffle`, `normalizeArabic`)
- **Types/Interfaces**: PascalCase (`Exercise`, `ButtonProps`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level (`WEAK_THRESHOLD`)

### Imports
Order imports as follows:
1. React and React-related (`react`, `react-dom`, `react-router-dom`)
2. External libraries
3. Internal absolute paths
4. Relative paths (types, then utilities, then components)

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { Exercise } from '../types/exercise';
import { fisherYatesShuffle } from '../lib/interleave';
```

### React Components
- Functional components with TypeScript; props interface above component
- Use `forwardRef` for UI components needing ref forwarding
- Export both named and default; set `displayName` for forwardRef components
- Component directories use `index.ts` barrel exports

### Styling
- Use Tailwind CSS utility classes
- Use CSS custom properties for theming: `var(--color-primary)`
- Arabic text uses RTL-specific classes: `.arabic`, `.arabic-xl`, `.rtl-block`

### Custom Hooks
- Return objects with clear interfaces
- Use `useMemo` and `useCallback` for memoization
- Document return type with an interface

## Testing Guidelines

- Place tests in `__tests__` directories adjacent to source
- Use `.test.ts` or `.test.tsx` extension
- Import from vitest: `import { describe, test, expect } from 'vitest'`
- Use descriptive test names that explain the behavior
- Group related tests with `describe` blocks

```typescript
import { describe, test, expect } from 'vitest';
import { removeTashkeel } from '../arabic';

describe('removeTashkeel', () => {
  test('removes fatha', () => {
    expect(removeTashkeel('...')).toBe('...');
  });
});
```

## Critical Requirements

### Fisher-Yates Shuffle Algorithm
**ALWAYS use Fisher-Yates shuffle for any array shuffling.** This is a hard requirement.

```typescript
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### When Presenting Options
When giving the user options, always include the pros and cons of each option.

## Domain-Specific Knowledge

### Arabic Text Handling
- **Tashkeel**: Diacritical marks (fatha, kasra, damma, sukun, shadda, tanween)
- Use `removeTashkeel()` to strip diacritics for comparison
- Use `normalizeArabic()` for answer comparison (removes tashkeel + normalizes whitespace)
- Use `compareAnswers()` to check user input against expected answers

### Mastery System
- Strength: 0-100 scale
- Correct answer: +10 strength
- Incorrect answer: -20 strength
- Levels: new (0), learning (1-39), mastered (80+), decaying (after 3 days)

### Exercise Types
- `fill-blank`: Fill in the blank
- `translate-to-arabic`: English to Arabic translation
- `word-to-meaning`: Arabic word to English meaning
- `meaning-to-word`: English meaning to Arabic word
- `construct-sentence`: Arrange words into sentence
- `grammar-apply`: Apply grammar rules

## Error Handling

- Use early returns for guard clauses
- Return empty arrays/null for edge cases rather than throwing
- Validate inputs at function boundaries

## ESLint Configuration

The project uses ESLint flat config with:
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` for hooks rules
- `eslint-plugin-react-refresh` for Vite HMR

Run `npm run lint` to check for issues.
