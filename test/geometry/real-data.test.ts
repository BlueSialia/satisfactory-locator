import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Condition, Purity, ResourceNode } from '../../src/data/model';
import { PURITIES } from '../../src/data/model';
import { normalizeResources } from '../../src/data/normalize';
import {
  calculateValidAreas,
  type SearchResult,
  type SuccessfulSearchResult,
} from '../../src/geometry/engine';

const raw = JSON.parse(
  readFileSync(
    new URL('../../src/data/resources.json', import.meta.url),
    'utf8',
  ),
);
const { nodes }: { nodes: ResourceNode[] } = normalizeResources(raw);

const condition = (resource: string, distance: number): Condition => ({
  resource,
  purities: [...PURITIES] as Purity[],
  distance,
});

function expectSuccess(result: SearchResult): SuccessfulSearchResult {
  expect(result.kind).toBe('success');
  if (result.kind !== 'success') {
    throw new Error(`Expected success, received ${result.kind}.`);
  }
  return result;
}

describe('real resource data', () => {
  it('handles a single condition with a small radius', () => {
    const result = expectSuccess(
      calculateValidAreas([condition('Iron Ore', 10)], nodes),
    );

    expect(result.contributing).toHaveLength(127);
    expect(result.contributions.size).toBe(127);
    expect(result.area).toHaveLength(127);
  });

  it('handles broad searches that previously triggered clipping errors', () => {
    const threeResources = expectSuccess(
      calculateValidAreas(
        [
          condition('Water', 1_000),
          condition('Crude Oil', 1_000),
          condition('Nitrogen Gas', 1_000),
        ],
        nodes,
      ),
    );
    expect(threeResources.contributing.length).toBeGreaterThan(0);

    const sixResources = expectSuccess(
      calculateValidAreas(
        [
          condition('Water', 1_000),
          condition('Crude Oil', 1_000),
          condition('Nitrogen Gas', 1_000),
          condition('Coal', 1_000),
          condition('Iron Ore', 1_000),
          condition('Copper Ore', 1_000),
        ],
        nodes,
      ),
    );
    expect(sixResources.contributing.length).toBeGreaterThan(0);
  });

  it('assigns at least one condition to every contributing node', () => {
    const result = expectSuccess(
      calculateValidAreas(
        [
          condition('Iron Ore', 500),
          condition('Coal', 500),
          condition('Copper Ore', 500),
          condition('Limestone', 500),
        ],
        nodes,
      ),
    );

    for (const node of result.contributing) {
      expect(result.contributions.get(node.id)?.length).toBeGreaterThan(0);
    }
  });
});
