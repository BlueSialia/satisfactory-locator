import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PURITIES } from '../../src/data/model';
import { normalizeResources } from '../../src/data/normalize';
import { WORLD_EXTENT } from '../../src/map/projection';

function rawFixture(entries: unknown[], resource = 'Iron Ore') {
  return {
    options: [
      {
        options: [
          {
            name: resource,
            options: entries,
          },
        ],
      },
    ],
  };
}

describe('normalizeResources', () => {
  it('uses entry purity, marker purity, or both as a fallback', () => {
    const { nodes, skippedMarkers } = normalizeResources(
      rawFixture([
        {
          name: 'Entry purity',
          purity: 'pure',
          markers: [{ pathName: 'entry', x: 100, y: 200 }],
        },
        {
          name: 'Marker purity',
          markers: [{ pathName: 'marker', x: 300, y: 400, purity: 'impure' }],
        },
        {
          name: 'Empty entry purity',
          purity: '',
          markers: [
            { pathName: 'empty-entry', x: 500, y: 600, purity: 'normal' },
          ],
        },
        {
          name: 'No purity',
          markers: [{ pathName: 'skip', x: 500, y: 600 }],
        },
        {
          name: 'No markers',
        },
      ]),
    );

    expect(nodes).toEqual([
      {
        id: 'entry',
        resource: 'Iron Ore',
        purity: 'pure',
        x: 1,
        y: 2,
      },
      {
        id: 'marker',
        resource: 'Iron Ore',
        purity: 'impure',
        x: 3,
        y: 4,
      },
      {
        id: 'empty-entry',
        resource: 'Iron Ore',
        purity: 'normal',
        x: 5,
        y: 6,
      },
    ]);
    expect(skippedMarkers).toBe(1);
  });

  it('supports every purity defined by the domain model', () => {
    for (const purity of PURITIES) {
      const { nodes } = normalizeResources(
        rawFixture([
          {
            name: `Entry-${purity}`,
            purity,
            markers: [{ pathName: purity, x: 1, y: 2 }],
          },
        ]),
      );

      expect(nodes[0].purity).toBe(purity);
    }
  });

  it('converts centimetres to metres and accepts numeric strings', () => {
    const { nodes } = normalizeResources(
      rawFixture([
        {
          name: 'String coordinates',
          purity: 'normal',
          markers: [{ pathName: 'strings', x: '1234', y: '-5678' }],
        },
      ]),
    );

    expect(nodes[0]).toMatchObject({ x: 12.34, y: -56.78 });
  });

  it('creates a fallback id when pathName is missing', () => {
    const { nodes } = normalizeResources(
      rawFixture([
        {
          name: 'Fallback',
          purity: 'pure',
          markers: [{ x: 100, y: 200 }],
        },
      ]),
    );

    expect(nodes[0].id).toBe('Fallback-100-200');
  });

  it('skips duplicate ids and invalid coordinates', () => {
    const { nodes, skippedMarkers } = normalizeResources(
      rawFixture([
        {
          name: 'Duplicates',
          purity: 'pure',
          markers: [
            { pathName: 'same', x: 1, y: 2 },
            { pathName: 'same', x: 3, y: 4 },
            { pathName: 'invalid', x: 'nope', y: 4 },
          ],
        },
      ]),
    );

    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('same');
    expect(skippedMarkers).toBe(2);
  });

  it('fails when the source contains no resource nodes', () => {
    expect(() =>
      normalizeResources(
        rawFixture([
          {
            name: 'Collectible',
            markers: [{ pathName: 'slug', x: 1, y: 2 }],
          },
        ]),
      ),
    ).toThrow('No resource nodes were found in the source data.');
  });

  it('rejects malformed source data', () => {
    expect(() => normalizeResources({})).toThrow();
  });

  it('normalizes the real upstream dataset within the calibrated map extent', () => {
    const raw = JSON.parse(
      readFileSync(
        new URL('../../src/data/resources.json', import.meta.url),
        'utf8',
      ),
    );
    const { nodes, skippedMarkers } = normalizeResources(raw);

    expect(nodes).toHaveLength(608);
    expect(skippedMarkers).toBeGreaterThan(0);
    expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length);
    expect(new Set(nodes.map((node) => node.purity))).toEqual(
      new Set(['impure', 'normal', 'pure']),
    );

    for (const node of nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(WORLD_EXTENT.minX);
      expect(node.x).toBeLessThanOrEqual(WORLD_EXTENT.maxX);
      expect(node.y).toBeGreaterThanOrEqual(WORLD_EXTENT.minY);
      expect(node.y).toBeLessThanOrEqual(WORLD_EXTENT.maxY);
    }
  });
});
