import { describe, expect, it } from 'vitest';
import type { Condition, Purity, ResourceNode } from '../../src/data/model';
import {
  calculateValidAreas,
  type SearchResult,
  type SuccessfulSearchResult,
} from '../../src/geometry/engine';
import { multiPolygonArea } from '../../src/geometry/polygons';

const node = (
  id: string,
  resource: string,
  purity: Purity,
  x: number,
  y: number,
): ResourceNode => ({ id, resource, purity, x, y });

const condition = (
  resource: string,
  purities: Purity[] | Purity | 'any',
  distance: number,
): Condition => ({
  resource,
  purities:
    purities === 'any'
      ? ['impure', 'normal', 'pure']
      : Array.isArray(purities)
        ? purities
        : [purities],
  distance,
});

function expectSuccess(result: SearchResult): SuccessfulSearchResult {
  expect(result.kind).toBe('success');
  if (result.kind !== 'success') {
    throw new Error('Expected a successful search result.');
  }
  return result;
}

describe('calculateValidAreas', () => {
  it('unions all matching nodes for one condition', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'any', 10)],
        [node('a', 'Coal', 'pure', 0, 0), node('b', 'Coal', 'impure', 100, 0)],
      ),
    );

    expect(result.area).toHaveLength(2);
    expect(result.contributing).toHaveLength(2);
    expect(result.contributions.get('a')).toEqual([0]);
    expect(result.contributions.get('b')).toEqual([0]);
  });

  it('marks every matching node as contributing for a single condition', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'any', 1)],
        [
          node('a', 'Coal', 'pure', 0, 0),
          node('b', 'Coal', 'pure', 10_000, 10_000),
        ],
      ),
    );

    expect(result.contributing.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('intersects independent acceptable regions', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'pure', 20), condition('Iron', 'normal', 20)],
        [node('a', 'Coal', 'pure', 0, 0), node('b', 'Iron', 'normal', 20, 0)],
      ),
    );

    expect(result.area).toHaveLength(1);
    expect(multiPolygonArea(result.area)).toBeGreaterThan(0);
    expect(result.contributions.get('a')).toEqual([0]);
    expect(result.contributions.get('b')).toEqual([1]);
  });

  it('returns no-overlap when conditions do not overlap', () => {
    const result = calculateValidAreas(
      [condition('Coal', 'any', 5), condition('Iron', 'any', 5)],
      [node('a', 'Coal', 'pure', 0, 0), node('b', 'Iron', 'normal', 20, 0)],
    );

    expect(result.kind).toBe('no-overlap');
  });

  it('prunes nodes that cannot overlap another condition', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'any', 10), condition('Iron', 'any', 10)],
        [
          node('coal-near', 'Coal', 'pure', 0, 0),
          node('coal-far', 'Coal', 'pure', 100, 100),
          node('iron', 'Iron', 'normal', 0, 0),
        ],
      ),
    );

    expect(result.matching[0]).toHaveLength(2);
    expect(result.contributing.map((item) => item.id)).toEqual([
      'coal-near',
      'iron',
    ]);
    expect(result.contributions.has('coal-far')).toBe(false);
  });

  it('filters resource and purity and supports repeated resource conditions', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'pure', 10), condition('Coal', 'impure', 10)],
        [
          node('a', 'Coal', 'pure', 0, 0),
          node('b', 'Coal', 'impure', 0, 0),
          node('c', 'Iron', 'pure', 0, 0),
        ],
      ),
    );

    expect(result.area).toHaveLength(1);
    expect(result.matching[0][0].purity).toBe('pure');
    expect(result.matching[1][0].purity).toBe('impure');
  });

  it('includes boundary points within the polygon approximation tolerance', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'pure', 10)],
        [node('a', 'Coal', 'pure', 0, 0)],
      ),
    );
    const edge = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'pure', 10)],
        [node('a', 'Coal', 'pure', 10, 0)],
      ),
    );

    expect(multiPolygonArea(result.area)).toBeGreaterThan(300);
    expect(edge.area).toHaveLength(1);
  });

  it('preserves disconnected intersections', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'any', 5), condition('Iron', 'any', 5)],
        [
          node('c1', 'Coal', 'pure', 0, 0),
          node('c2', 'Coal', 'pure', 100, 0),
          node('i1', 'Iron', 'normal', 0, 0),
          node('i2', 'Iron', 'normal', 100, 0),
        ],
      ),
    );

    expect(result.area).toHaveLength(2);
  });

  it('intersects all four condition regions, not only the first three', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [
          condition('Coal', 'pure', 6),
          condition('Iron', 'pure', 6),
          condition('Copper Ore', 'pure', 6),
          condition('Limestone', 'pure', 6),
        ],
        [
          node('coal', 'Coal', 'pure', 0, 0),
          node('iron', 'Iron', 'pure', 8, 0),
          node('copper', 'Copper Ore', 'pure', 0, 8),
          node('limestone', 'Limestone', 'pure', 8, 8),
        ],
      ),
    );

    expect(result.area).toHaveLength(1);
    expect(multiPolygonArea(result.area)).toBeGreaterThan(0);
  });

  it('shows every matching node whose circle overlaps the final valid area', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'any', 10), condition('Iron', 'any', 10)],
        [
          node('near', 'Coal', 'pure', 0, 0),
          node('overlap', 'Coal', 'pure', 1, 0),
          node('far', 'Coal', 'pure', 100, 0),
          node('iron', 'Iron', 'normal', 0, 0),
        ],
      ),
    );

    expect(result.contributing.map((item) => item.id)).toEqual([
      'near',
      'overlap',
      'iron',
    ]);
  });

  it('lists every condition a shared node contributes to', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [condition('Coal', 'any', 10), condition('Coal', 'any', 10)],
        [node('a', 'Coal', 'pure', 0, 0)],
      ),
    );

    expect(result.contributing.map((item) => item.id)).toEqual(['a']);
    expect(result.contributions.get('a')).toEqual([0, 1]);
  });

  it('returns no-overlap when pruning removes every candidate', () => {
    const result = calculateValidAreas(
      [condition('Coal', 'any', 10), condition('Iron', 'any', 10)],
      [
        node('coal', 'Coal', 'pure', 0, 0),
        node('iron', 'Iron', 'normal', 15, 15),
      ],
    );

    expect(result.kind).toBe('no-overlap');
  });

  it('returns no-overlap when pairwise-overlapping conditions have no common area', () => {
    const result = calculateValidAreas(
      [
        condition('Coal', 'any', 5.1),
        condition('Iron', 'any', 5.1),
        condition('Copper Ore', 'any', 5.1),
      ],
      [
        node('coal', 'Coal', 'pure', 0, 0),
        node('iron', 'Iron', 'normal', 10, 0),
        node('copper', 'Copper Ore', 'pure', 5, 8.660254),
      ],
    );

    expect(result.kind).toBe('no-overlap');
  });

  it('returns no-matching-nodes with the first unmatched condition index', () => {
    const result = calculateValidAreas(
      [condition('Coal', 'any', 10), condition('Quartz', 'any', 10)],
      [node('a', 'Coal', 'pure', 0, 0)],
    );

    expect(result.kind).toBe('no-matching-nodes');
    if (result.kind === 'no-matching-nodes') {
      expect(result.conditionIndex).toBe(1);
    }
  });

  it('rejects empty, invalid, and out-of-range input', () => {
    const nodes = [node('a', 'Coal', 'pure', 0, 0)];

    expect(calculateValidAreas([], nodes).kind).toBe('invalid-input');
    expect(calculateValidAreas([condition('Coal', [], 10)], nodes).kind).toBe(
      'invalid-input',
    );
    expect(calculateValidAreas([condition('Coal', 'any', 0)], nodes).kind).toBe(
      'invalid-input',
    );
    expect(
      calculateValidAreas([condition('Coal', 'any', 10_001)], nodes).kind,
    ).toBe('invalid-input');
  });
});
