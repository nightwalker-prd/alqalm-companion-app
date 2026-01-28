import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RootFamilyExercise } from '../RootFamilyExercise';
import type { RootFamilyExerciseData } from '../RootFamilyExercise';
import type { SarfWord, RootFamily } from '../../../types/morphology';

// ============================================================================
// Mock Data Factories
// ============================================================================

let mockIdCounter = 1;

function createMockSarfWord(overrides: Partial<SarfWord> = {}): SarfWord {
  const id = mockIdCounter++;
  return {
    id,
    word: 'كَتَبَ',
    transliteration: 'kataba',
    category: 'verb',
    root: 'ك ت ب',
    pattern: 'فَعَلَ',
    patternTranslit: "fa'ala",
    meaning: 'he wrote',
    difficulty: 'beginner',
    ...overrides,
  };
}

function createMockRootFamily(overrides: Partial<RootFamily> = {}): RootFamily {
  const defaultWords = [
    createMockSarfWord({ word: 'كَتَبَ', category: 'verb', verbForm: 'I', meaning: 'he wrote' }),
    createMockSarfWord({ word: 'كِتَابَة', category: 'masdar', meaning: 'writing' }),
    createMockSarfWord({ word: 'كَاتِب', category: 'active-participle', meaning: 'writer' }),
  ];

  return {
    root: 'ك ت ب',
    rootLetters: ['ك', 'ت', 'ب'],
    coreMeaning: 'to write',
    rootType: 'saleem',
    words: overrides.words || defaultWords,
    categoryCounts: { verb: 1, masdar: 1, 'active-participle': 1 },
    verbForms: ['I'],
    minDifficulty: 'beginner',
    ...overrides,
  };
}

function createMatchMeaningsExercise(
  overrides: Partial<RootFamilyExerciseData> = {}
): RootFamilyExerciseData {
  const family = createMockRootFamily();
  const targetWord = family.words[0];

  return {
    id: 'test-match-meanings-1',
    type: 'match-meanings',
    family,
    targetWord,
    options: ['he wrote', 'he read', 'he went', 'he sat'],
    answer: 'he wrote',
    ...overrides,
  };
}

function createIdentifyRootExercise(
  overrides: Partial<RootFamilyExerciseData> = {}
): RootFamilyExerciseData {
  const family = createMockRootFamily();
  const targetWord = family.words[0];

  return {
    id: 'test-identify-root-1',
    type: 'identify-root',
    family,
    targetWord,
    options: ['ك ت ب', 'ق ر أ', 'ذ ه ب', 'ج ل س'],
    answer: 'ك ت ب',
    ...overrides,
  };
}

function createFamilyBuilderExercise(
  overrides: Partial<RootFamilyExerciseData> = {}
): RootFamilyExerciseData {
  const family = createMockRootFamily();
  const correctWords = family.words.slice(0, 2);
  const distractorWords = [
    createMockSarfWord({ id: 100, word: 'قَرَأَ', meaning: 'he read', root: 'ق ر أ' }),
    createMockSarfWord({ id: 101, word: 'ذَهَبَ', meaning: 'he went', root: 'ذ ه ب' }),
  ];

  return {
    id: 'test-family-builder-1',
    type: 'family-builder',
    family,
    correctWords,
    distractorWords,
    answer: correctWords.map(w => String(w.id)).join(','),
    ...overrides,
  };
}

// Reset counter before each test
beforeEach(() => {
  mockIdCounter = 1;
  vi.clearAllMocks();
});

// ============================================================================
// Rendering Tests
// ============================================================================

describe('RootFamilyExercise - Rendering', () => {
  test('renders root letters display correctly', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Should show root letters
    expect(screen.getByText('ك')).toBeInTheDocument();
    expect(screen.getByText('ت')).toBeInTheDocument();
    expect(screen.getByText('ب')).toBeInTheDocument();
  });

  test('renders "Root Family" badge', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Root Family')).toBeInTheDocument();
  });

  test('renders core meaning', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('to write')).toBeInTheDocument();
  });

  test('renders Check Answer button', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /check answer/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Match-Meanings Exercise Tests
// ============================================================================

describe('RootFamilyExercise - Match Meanings', () => {
  test('renders target word and meaning options', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Target word should be displayed
    expect(screen.getByText('كَتَبَ')).toBeInTheDocument();
    
    // All options should be displayed
    expect(screen.getByText('he wrote')).toBeInTheDocument();
    expect(screen.getByText('he read')).toBeInTheDocument();
    expect(screen.getByText('he went')).toBeInTheDocument();
    expect(screen.getByText('he sat')).toBeInTheDocument();
  });

  test('renders category badge for target word', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Verb')).toBeInTheDocument();
  });

  test('allows selecting an option', () => {
    const exercise = createMatchMeaningsExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    const option = screen.getByText('he wrote');
    fireEvent.click(option);

    // Button should be clickable and the option should be highlighted
    // (we can't easily test styling, but clicking shouldn't throw)
    expect(option).toBeInTheDocument();
  });

  test('calls onComplete with correct=true for correct answer', async () => {
    const onComplete = vi.fn();
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
      />
    );

    // Select correct answer
    fireEvent.click(screen.getByText('he wrote'));
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    expect(onComplete).toHaveBeenCalledWith(
      true,
      'he wrote',
      expect.objectContaining({
        responseTimeMs: expect.any(Number),
      })
    );
  });

  test('calls onComplete with correct=false for incorrect answer', async () => {
    const onComplete = vi.fn();
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
      />
    );

    // Select wrong answer
    fireEvent.click(screen.getByText('he read'));
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    expect(onComplete).toHaveBeenCalledWith(
      false,
      'he read',
      expect.objectContaining({
        responseTimeMs: expect.any(Number),
      })
    );
  });

  test('shows feedback after submission', async () => {
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
        showFeedback={true}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Feedback should be shown (component shows "Words from this root family:" after submission)
    await waitFor(() => {
      expect(screen.getByText(/words from this root family/i)).toBeInTheDocument();
    });
  });

  test('disables options after submission', async () => {
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Options should be disabled
    const options = screen.getAllByRole('button').filter(
      btn => btn.textContent && ['he wrote', 'he read', 'he went', 'he sat'].includes(btn.textContent)
    );
    
    options.forEach(option => {
      expect(option).toBeDisabled();
    });
  });
});

// ============================================================================
// Identify-Root Exercise Tests
// ============================================================================

describe('RootFamilyExercise - Identify Root', () => {
  test('renders target word with meaning', () => {
    const exercise = createIdentifyRootExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Target word should be displayed
    expect(screen.getByText('كَتَبَ')).toBeInTheDocument();
    // Meaning should be displayed
    expect(screen.getByText('he wrote')).toBeInTheDocument();
  });

  test('renders 4 root options', () => {
    const exercise = createIdentifyRootExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // All root options should be displayed
    expect(screen.getByText('ك ت ب')).toBeInTheDocument();
    expect(screen.getByText('ق ر أ')).toBeInTheDocument();
    expect(screen.getByText('ذ ه ب')).toBeInTheDocument();
    expect(screen.getByText('ج ل س')).toBeInTheDocument();
  });

  test('asks the correct question', () => {
    const exercise = createIdentifyRootExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText(/what is the root of this word/i)).toBeInTheDocument();
  });

  test('calls onComplete with correct result', async () => {
    const onComplete = vi.fn();
    const exercise = createIdentifyRootExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
      />
    );

    // Select correct root
    fireEvent.click(screen.getByText('ك ت ب'));
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    expect(onComplete).toHaveBeenCalledWith(
      true,
      'ك ت ب',
      expect.objectContaining({
        responseTimeMs: expect.any(Number),
      })
    );
  });
});

// ============================================================================
// Family-Builder Exercise Tests
// ============================================================================

describe('RootFamilyExercise - Family Builder', () => {
  test('renders instruction text', () => {
    const exercise = createFamilyBuilderExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText(/select all words that come from this root/i)).toBeInTheDocument();
  });

  test('renders all words (correct and distractors)', () => {
    const exercise = createFamilyBuilderExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Correct words
    expect(screen.getByText('كَتَبَ')).toBeInTheDocument();
    expect(screen.getByText('كِتَابَة')).toBeInTheDocument();
    
    // Distractor words
    expect(screen.getByText('قَرَأَ')).toBeInTheDocument();
    expect(screen.getByText('ذَهَبَ')).toBeInTheDocument();
  });

  test('allows multiple selection', () => {
    const exercise = createFamilyBuilderExercise();
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Click on two words - find buttons containing the Arabic text
    const buttons = screen.getAllByRole('button');
    const word1Button = buttons.find(b => b.textContent?.includes('كَتَبَ'));
    const word2Button = buttons.find(b => b.textContent?.includes('كِتَابَة'));

    if (word1Button) fireEvent.click(word1Button);
    if (word2Button) fireEvent.click(word2Button);

    // Both should be clickable without error
    expect(word1Button).toBeInTheDocument();
    expect(word2Button).toBeInTheDocument();
  });

  test('calls onComplete with correct=true when all correct words selected', async () => {
    const onComplete = vi.fn();
    const exercise = createFamilyBuilderExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
      />
    );

    // Find and click the correct word buttons
    const buttons = screen.getAllByRole('button');
    const correctWordButtons = buttons.filter(b => 
      b.textContent?.includes('كَتَبَ') || b.textContent?.includes('كِتَابَة')
    );

    // Select only the correct words (not including the Check Answer button)
    correctWordButtons.forEach(btn => {
      if (!btn.textContent?.includes('Check Answer')) {
        fireEvent.click(btn);
      }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    expect(onComplete).toHaveBeenCalledWith(
      true,
      expect.any(String),
      expect.objectContaining({
        responseTimeMs: expect.any(Number),
      })
    );
  });

  test('calls onComplete with correct=false when wrong words selected', async () => {
    const onComplete = vi.fn();
    const exercise = createFamilyBuilderExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
      />
    );

    // Find and click a distractor word button
    const buttons = screen.getAllByRole('button');
    const distractorButton = buttons.find(b => b.textContent?.includes('قَرَأَ'));
    
    if (distractorButton) fireEvent.click(distractorButton);

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    expect(onComplete).toHaveBeenCalledWith(
      false,
      expect.any(String),
      expect.objectContaining({
        responseTimeMs: expect.any(Number),
      })
    );
  });
});

// ============================================================================
// Confidence Rating Tests
// ============================================================================

describe('RootFamilyExercise - Confidence Rating', () => {
  test('shows confidence rating when enableConfidence=true', async () => {
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
        enableConfidence={true}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Confidence rating should appear with "How confident are you" text
    await waitFor(() => {
      expect(screen.getByText(/how confident are you/i)).toBeInTheDocument();
    });
  });

  test('passes confidence to onComplete after selection', async () => {
    const onComplete = vi.fn();
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
        enableConfidence={true}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Wait for confidence rating to appear and select one
    await waitFor(() => {
      expect(screen.getByText(/how confident are you/i)).toBeInTheDocument();
    });

    // Click on a confidence level (using the actual label "Very sure")
    const verySureButton = screen.getByText(/very sure/i);
    fireEvent.click(verySureButton);

    // Wait for callback with confidence included
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        true,
        'he wrote',
        expect.objectContaining({
          confidence: 3, // ConfidenceLevel 3 = "Very sure"
          responseTimeMs: expect.any(Number),
        })
      );
    });
  });

  test('does not show confidence rating when enableConfidence=false', () => {
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
        enableConfidence={false}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Confidence rating should NOT appear
    expect(screen.queryByText(/how confident are you/i)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Related Words Display Tests
// ============================================================================

describe('RootFamilyExercise - Related Words', () => {
  test('shows related words from family after submission', async () => {
    const family = createMockRootFamily({
      words: [
        createMockSarfWord({ word: 'كَتَبَ', meaning: 'he wrote' }),
        createMockSarfWord({ word: 'كِتَاب', meaning: 'book' }),
        createMockSarfWord({ word: 'مَكْتَب', meaning: 'office' }),
      ],
    });
    
    const exercise = createMatchMeaningsExercise({ family });
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Related words should be shown
    await waitFor(() => {
      expect(screen.getByText(/words from this root family/i)).toBeInTheDocument();
    });

    // Individual words should be visible
    expect(screen.getByText('كِتَاب')).toBeInTheDocument();
    expect(screen.getByText('(book)')).toBeInTheDocument();
  });

  test('shows "+N more" indicator for families with many words', async () => {
    const manyWords = Array.from({ length: 10 }, (_, i) => 
      createMockSarfWord({ 
        id: i + 1,
        word: `word${i}`, 
        meaning: `meaning${i}` 
      })
    );
    
    const family = createMockRootFamily({ words: manyWords });
    const exercise = createMatchMeaningsExercise({ 
      family,
      targetWord: manyWords[0],
    });
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Should show "+N more" for words beyond the first 6
    await waitFor(() => {
      expect(screen.getByText(/\+4 more/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('RootFamilyExercise - Edge Cases', () => {
  test('Check Answer button is disabled until option selected', () => {
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', { name: /check answer/i });
    expect(submitButton).toBeDisabled();

    // Select an option
    fireEvent.click(screen.getByText('he wrote'));

    // Now it should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  test('Check Answer button is disabled until words selected for family-builder', () => {
    const exercise = createFamilyBuilderExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', { name: /check answer/i });
    expect(submitButton).toBeDisabled();

    // Select a word
    const buttons = screen.getAllByRole('button');
    const wordButton = buttons.find(b => b.textContent?.includes('كَتَبَ'));
    if (wordButton) fireEvent.click(wordButton);

    // Now it should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  test('prevents double submission', async () => {
    const onComplete = vi.fn();
    const exercise = createMatchMeaningsExercise();
    
    render(
      <RootFamilyExercise
        exercise={exercise}
        onComplete={onComplete}
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('he wrote'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));

    // Try to submit again (button should be hidden after submission)
    const submitButton = screen.queryByRole('button', { name: /check answer/i });
    expect(submitButton).not.toBeInTheDocument();

    // onComplete should only be called once
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
