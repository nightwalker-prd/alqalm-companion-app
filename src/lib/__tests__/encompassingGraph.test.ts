/**
 * Unit tests for the encompassing graph construction and analysis.
 */

import { describe, test, expect } from 'vitest';
import {
  buildEncompassingGraph,
  getExerciseEncompasses,
  buildExerciseEncompassing,
  analyzeCoOccurrence,
  coOccurrenceToEdges,
  getAllEncompassed,
  getEncompassingItems,
  calculateReach,
  findHighReachItems,
  createEmptyGraph,
  mergeGraphs,
  serializeGraph,
  deserializeGraph,
  type LessonForGraph,
} from '../encompassingGraph';

// ============================================================================
// Test Data
// ============================================================================

const createTestLessons = (): LessonForGraph[] => [
  {
    id: 'b1-l01',
    book: 1,
    lesson: 1,
    vocabulary: ['word1', 'word2', 'word3'],
    grammarPoints: ['grammar1'],
    exercises: [
      { id: 'b1-l01-ex01', itemIds: ['word1', 'word2'] },
      { id: 'b1-l01-ex02', itemIds: ['word3', 'grammar1'] },
    ],
  },
  {
    id: 'b1-l02',
    book: 1,
    lesson: 2,
    vocabulary: ['word4', 'word5'],
    grammarPoints: ['grammar2'],
    exercises: [
      { id: 'b1-l02-ex01', itemIds: ['word4', 'word5'] },
      { id: 'b1-l02-ex02', itemIds: ['word1', 'word4'] }, // word1 from previous lesson
    ],
  },
  {
    id: 'b1-l03',
    book: 1,
    lesson: 3,
    vocabulary: ['word6'],
    grammarPoints: [],
    exercises: [{ id: 'b1-l03-ex01', itemIds: ['word6'] }],
  },
  {
    id: 'b2-l01',
    book: 2,
    lesson: 1,
    vocabulary: ['word7', 'word8'],
    grammarPoints: ['grammar3'],
    exercises: [{ id: 'b2-l01-ex01', itemIds: ['word7', 'word8', 'grammar3'] }],
  },
];

// ============================================================================
// buildEncompassingGraph Tests
// ============================================================================

describe('buildEncompassingGraph', () => {
  test('creates edges for lesson encompassing items', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons);

    // b1-l01 should encompass its vocabulary and grammar
    const b1l01Edges = graph.encompasses['b1-l01'];
    expect(b1l01Edges).toBeDefined();

    const encompassedTargets = b1l01Edges.map((e) => e.target);
    expect(encompassedTargets).toContain('word1');
    expect(encompassedTargets).toContain('word2');
    expect(encompassedTargets).toContain('word3');
    expect(encompassedTargets).toContain('grammar1');
  });

  test('creates edges for lesson-to-lesson encompassing', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons);

    // b1-l02 should encompass b1-l01
    const b1l02Edges = graph.encompasses['b1-l02'];
    expect(b1l02Edges).toBeDefined();

    const encompassedLessons = b1l02Edges
      .filter((e) => e.target.startsWith('b1-l0'))
      .map((e) => e.target);
    expect(encompassedLessons).toContain('b1-l01');
  });

  test('later lessons encompass earlier lessons with decaying weight', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      adjacentLessonWeight: 0.5,
    });

    // b1-l03 should encompass b1-l02 (distance 1) and b1-l01 (distance 2)
    const b1l03Edges = graph.encompasses['b1-l03'];
    expect(b1l03Edges).toBeDefined();

    const b1l02Edge = b1l03Edges.find((e) => e.target === 'b1-l02');
    const b1l01Edge = b1l03Edges.find((e) => e.target === 'b1-l01');

    expect(b1l02Edge).toBeDefined();
    expect(b1l01Edge).toBeDefined();

    // Distance 1 should have higher weight than distance 2
    expect(b1l02Edge!.weight).toBeGreaterThan(b1l01Edge!.weight);
    expect(b1l02Edge!.weight).toBe(0.5); // baseWeight / 1
    expect(b1l01Edge!.weight).toBe(0.25); // baseWeight / 2
  });

  test('creates cross-book encompassing', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      crossBookWeight: 0.2,
    });

    // b2-l01 should encompass all book 1 lessons
    const b2l01Edges = graph.encompasses['b2-l01'];
    expect(b2l01Edges).toBeDefined();

    const book1LessonsEncompassed = b2l01Edges.filter((e) =>
      e.target.startsWith('b1-l')
    );
    expect(book1LessonsEncompassed.length).toBe(3); // All 3 book 1 lessons

    // All should have the crossBookWeight
    for (const edge of book1LessonsEncompassed) {
      expect(edge.weight).toBe(0.2);
    }
  });

  test('creates item-to-item encompassing within lessons', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      sameLesonItemWeight: 0.3,
    });

    // word1 should encompass word2 and word3 (same lesson)
    const word1Edges = graph.encompasses['word1'];
    expect(word1Edges).toBeDefined();

    const word2Edge = word1Edges.find((e) => e.target === 'word2');
    const word3Edge = word1Edges.find((e) => e.target === 'word3');

    expect(word2Edge).toBeDefined();
    expect(word3Edge).toBeDefined();
    expect(word2Edge!.weight).toBe(0.3);
  });

  test('respects minWeight option', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      adjacentLessonWeight: 0.1,
      minWeight: 0.15,
    });

    // b1-l03 -> b1-l01 would have weight 0.05 (0.1 / 2), which is below minWeight
    const b1l03Edges = graph.encompasses['b1-l03'] ?? [];
    const b1l01Edge = b1l03Edges.find((e) => e.target === 'b1-l01');

    expect(b1l01Edge).toBeUndefined();
  });

  test('applies manual overrides', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      manualOverrides: [{ from: 'word1', to: 'grammar3', weight: 0.9 }],
    });

    const word1Edges = graph.encompasses['word1'];
    const grammar3Edge = word1Edges.find((e) => e.target === 'grammar3');

    expect(grammar3Edge).toBeDefined();
    expect(grammar3Edge!.weight).toBe(0.9);
  });

  test('disables lesson encompassing when option is false', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      includeLessonEncompassing: false,
    });

    // b1-l02 should NOT encompass b1-l01
    const b1l02Edges = graph.encompasses['b1-l02'] ?? [];
    const b1l01Edge = b1l02Edges.find((e) => e.target === 'b1-l01');

    expect(b1l01Edge).toBeUndefined();
  });

  test('creates encompassedBy reverse lookup', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons);

    // word1 should be encompassed by b1-l01
    const word1EncompassedBy = graph.encompassedBy['word1'];
    expect(word1EncompassedBy).toBeDefined();

    const b1l01Edge = word1EncompassedBy.find((e) => e.target === 'b1-l01');
    expect(b1l01Edge).toBeDefined();
  });
});

// ============================================================================
// Exercise Encompassing Tests
// ============================================================================

describe('getExerciseEncompasses', () => {
  test('returns all itemIds with weight 1.0', () => {
    const exercise = { itemIds: ['word1', 'word2', 'grammar1'] };
    const result = getExerciseEncompasses(exercise);

    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ target: 'word1', weight: 1.0 });
    expect(result).toContainEqual({ target: 'word2', weight: 1.0 });
    expect(result).toContainEqual({ target: 'grammar1', weight: 1.0 });
  });

  test('handles empty itemIds', () => {
    const exercise = { itemIds: [] };
    const result = getExerciseEncompasses(exercise);

    expect(result).toHaveLength(0);
  });
});

describe('buildExerciseEncompassing', () => {
  test('builds map of exercise ID to encompassed items', () => {
    const exercises = [
      { id: 'ex1', itemIds: ['word1', 'word2'] },
      { id: 'ex2', itemIds: ['word3'] },
    ];

    const result = buildExerciseEncompassing(exercises);

    expect(result.size).toBe(2);
    expect(result.get('ex1')).toEqual([
      { target: 'word1', weight: 1.0 },
      { target: 'word2', weight: 1.0 },
    ]);
    expect(result.get('ex2')).toEqual([{ target: 'word3', weight: 1.0 }]);
  });
});

// ============================================================================
// Co-occurrence Analysis Tests
// ============================================================================

describe('analyzeCoOccurrence', () => {
  test('counts item pairs across exercises', () => {
    const exercises = [
      { itemIds: ['a', 'b', 'c'] },
      { itemIds: ['a', 'b'] },
      { itemIds: ['b', 'c'] },
    ];

    const result = analyzeCoOccurrence(exercises);

    // a-b appears in exercise 1 and 2 = 2
    expect(result.get('a::b')).toBe(2);

    // a-c appears only in exercise 1 = 1
    expect(result.get('a::c')).toBe(1);

    // b-c appears in exercise 1 and 3 = 2
    expect(result.get('b::c')).toBe(2);
  });

  test('creates canonical keys (sorted)', () => {
    const exercises = [{ itemIds: ['zebra', 'alpha'] }];

    const result = analyzeCoOccurrence(exercises);

    // Should be sorted alphabetically
    expect(result.has('alpha::zebra')).toBe(true);
    expect(result.has('zebra::alpha')).toBe(false);
  });
});

describe('coOccurrenceToEdges', () => {
  test('converts counts to weighted edges', () => {
    const coOccurrence = new Map([
      ['a::b', 10],
      ['b::c', 5],
      ['a::c', 1],
    ]);

    const edges = coOccurrenceToEdges(coOccurrence, 10, 0.1);

    // a-b: 10/10 = 1.0
    expect(edges).toContainEqual({ from: 'a', to: 'b', weight: 1.0 });
    expect(edges).toContainEqual({ from: 'b', to: 'a', weight: 1.0 });

    // b-c: 5/10 = 0.5
    expect(edges).toContainEqual({ from: 'b', to: 'c', weight: 0.5 });
    expect(edges).toContainEqual({ from: 'c', to: 'b', weight: 0.5 });

    // a-c: 1/10 = 0.1 (at threshold)
    expect(edges).toContainEqual({ from: 'a', to: 'c', weight: 0.1 });
  });

  test('filters out edges below minWeight', () => {
    const coOccurrence = new Map([
      ['a::b', 10],
      ['a::c', 1],
    ]);

    const edges = coOccurrenceToEdges(coOccurrence, 10, 0.2);

    // a-c: 1/10 = 0.1, below minWeight of 0.2
    const acEdges = edges.filter(
      (e) =>
        (e.from === 'a' && e.to === 'c') || (e.from === 'c' && e.to === 'a')
    );
    expect(acEdges).toHaveLength(0);
  });
});

// ============================================================================
// Graph Analysis Tests
// ============================================================================

describe('getAllEncompassed', () => {
  test('returns directly encompassed items', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons);

    // With high minWeight, only direct strong connections
    const encompassed = getAllEncompassed('b1-l01', graph, 0.9);

    // Should include vocabulary and grammar with weight 1.0
    expect(encompassed.has('word1')).toBe(true);
    expect(encompassed.has('word2')).toBe(true);
    expect(encompassed.has('word3')).toBe(true);
    expect(encompassed.has('grammar1')).toBe(true);
  });

  test('follows transitive encompassing with lower threshold', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons, {
      adjacentLessonWeight: 0.6,
    });

    // b1-l02 encompasses b1-l01 with weight 0.6
    // With threshold 0.5, should find items from b1-l01 transitively
    const encompassed = getAllEncompassed('b1-l02', graph, 0.5);

    expect(encompassed.has('b1-l01')).toBe(true);
  });

  test('returns empty set for non-existent item', () => {
    const graph = createEmptyGraph();
    const encompassed = getAllEncompassed('nonexistent', graph);

    expect(encompassed.size).toBe(0);
  });
});

describe('getEncompassingItems', () => {
  test('returns items that encompass the given item', () => {
    const lessons = createTestLessons();
    const graph = buildEncompassingGraph(lessons);

    // word1 is encompassed by b1-l01
    const encompassing = getEncompassingItems('word1', graph);

    const lessonEdge = encompassing.find((e) => e.target === 'b1-l01');
    expect(lessonEdge).toBeDefined();
    expect(lessonEdge!.weight).toBe(1.0);
  });

  test('returns empty array for item with no parents', () => {
    const graph = createEmptyGraph();
    const encompassing = getEncompassingItems('orphan', graph);

    expect(encompassing).toHaveLength(0);
  });
});

describe('calculateReach', () => {
  test('calculates number of encompassed items', () => {
    const lessons = [
      {
        id: 'lesson1',
        book: 1,
        lesson: 1,
        vocabulary: ['a', 'b', 'c'],
        grammarPoints: [],
        exercises: [],
      },
    ];
    const graph = buildEncompassingGraph(lessons);

    // lesson1 encompasses a, b, c (3 items)
    const reach = calculateReach('lesson1', graph);
    expect(reach).toBe(3);
  });
});

describe('findHighReachItems', () => {
  test('returns items sorted by reach', () => {
    const lessons = [
      {
        id: 'lesson1',
        book: 1,
        lesson: 1,
        vocabulary: ['a', 'b', 'c'],
        grammarPoints: [],
        exercises: [],
      },
      {
        id: 'lesson2',
        book: 1,
        lesson: 2,
        vocabulary: ['d'],
        grammarPoints: [],
        exercises: [],
      },
    ];
    const graph = buildEncompassingGraph(lessons, {
      includeLessonEncompassing: false,
    });

    // lesson1 has reach 3, lesson2 has reach 1
    const highReach = findHighReachItems(['lesson1', 'lesson2'], graph, 2);

    expect(highReach[0]).toBe('lesson1');
    expect(highReach[1]).toBe('lesson2');
  });

  test('limits results to topN', () => {
    const itemIds = ['a', 'b', 'c', 'd', 'e'];
    const graph = createEmptyGraph();

    const highReach = findHighReachItems(itemIds, graph, 2);

    expect(highReach).toHaveLength(2);
  });
});

// ============================================================================
// Graph Utilities Tests
// ============================================================================

describe('createEmptyGraph', () => {
  test('creates graph with empty encompasses and encompassedBy', () => {
    const graph = createEmptyGraph();

    expect(graph.encompasses).toEqual({});
    expect(graph.encompassedBy).toEqual({});
  });
});

describe('serializeGraph and deserializeGraph', () => {
  test('round-trips graph through JSON', () => {
    const lessons = createTestLessons();
    const original = buildEncompassingGraph(lessons);

    const json = serializeGraph(original);
    const restored = deserializeGraph(json);

    expect(restored).toEqual(original);
  });
});

describe('mergeGraphs', () => {
  test('combines edges from multiple graphs', () => {
    const graph1 = buildEncompassingGraph([
      {
        id: 'l1',
        book: 1,
        lesson: 1,
        vocabulary: ['a'],
        grammarPoints: [],
        exercises: [],
      },
    ]);

    const graph2 = buildEncompassingGraph([
      {
        id: 'l2',
        book: 1,
        lesson: 1,
        vocabulary: ['b'],
        grammarPoints: [],
        exercises: [],
      },
    ]);

    const merged = mergeGraphs(graph1, graph2);

    expect(merged.encompasses['l1']).toBeDefined();
    expect(merged.encompasses['l2']).toBeDefined();
  });

  test('keeps higher weight when edges conflict', () => {
    // Create graphs with overlapping edges but different weights
    const graph1 = {
      encompasses: { a: [{ target: 'b', weight: 0.3 }] },
      encompassedBy: { b: [{ target: 'a', weight: 0.3 }] },
    };

    const graph2 = {
      encompasses: { a: [{ target: 'b', weight: 0.7 }] },
      encompassedBy: { b: [{ target: 'a', weight: 0.7 }] },
    };

    const merged = mergeGraphs(graph1, graph2);

    const aEdges = merged.encompasses['a'];
    const bEdge = aEdges.find((e) => e.target === 'b');

    expect(bEdge!.weight).toBe(0.7); // Higher weight kept
  });
});
