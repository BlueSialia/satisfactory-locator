import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/geometry/polygons', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/geometry/polygons')>();
  return {
    ...actual,
    unionPolygons: () => {
      throw new Error('simulated clipping failure');
    },
  };
});

import type { ResourceNode } from '../../src/data/model';
import { calculateValidAreas } from '../../src/geometry/engine';

describe('calculateValidAreas geometry errors', () => {
  it('returns a geometry-error result instead of throwing', () => {
    const nodes: ResourceNode[] = [
      {
        id: 'a',
        resource: 'Coal',
        purity: 'pure',
        x: 0,
        y: 0,
      },
    ];

    const result = calculateValidAreas(
      [{ resource: 'Coal', purities: ['pure'], distance: 10 }],
      nodes,
    );

    expect(result).toEqual({
      kind: 'geometry-error',
      reason: 'simulated clipping failure',
    });
  });
});
