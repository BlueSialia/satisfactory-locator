import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResourceNode } from '../../src/data/model';
import {
  loadResourceNodes,
  parseResourceNodes,
  purities,
  resourceNames,
} from '../../src/data/resources';

const node: ResourceNode = {
  id: 'node-a',
  resource: 'Iron Ore',
  purity: 'pure',
  x: 100,
  y: -200,
};

function stubFetch(response: Response | Error): void {
  const fetchMock = vi.fn();
  if (response instanceof Error) {
    fetchMock.mockRejectedValue(response);
  } else {
    fetchMock.mockResolvedValue(response);
  }
  vi.stubGlobal('fetch', fetchMock);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseResourceNodes', () => {
  it('accepts a non-empty array of valid nodes', () => {
    expect(parseResourceNodes([node])).toEqual([node]);
  });

  it('rejects non-arrays, empty arrays, and malformed nodes', () => {
    expect(() => parseResourceNodes({})).toThrow(
      'Resource data is empty or has an invalid format.',
    );
    expect(() => parseResourceNodes([])).toThrow(
      'Resource data is empty or has an invalid format.',
    );

    expect(() => parseResourceNodes([null])).toThrow(
      'Resource data has an invalid format.',
    );
    expect(() => parseResourceNodes([42])).toThrow(
      'Resource data has an invalid format.',
    );

    const invalidNodes = [
      { ...node, id: undefined },
      { ...node, resource: undefined },
      { ...node, purity: 'unknown' },
      { ...node, x: '100' },
      { ...node, y: Number.NaN },
    ];
    for (const invalid of invalidNodes) {
      expect(() => parseResourceNodes([invalid])).toThrow(
        'Resource data has an invalid format.',
      );
    }
  });
});

describe('loadResourceNodes', () => {
  it('fetches and parses the generated asset', async () => {
    stubFetch(
      new Response(JSON.stringify([node]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(loadResourceNodes()).resolves.toEqual([node]);
  });

  it('reports non-successful responses', async () => {
    stubFetch(new Response('', { status: 500 }));

    await expect(loadResourceNodes()).rejects.toThrow(
      'Resource data request failed (500).',
    );
  });

  it('propagates invalid JSON responses', async () => {
    stubFetch(
      new Response('{', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(loadResourceNodes()).rejects.toThrow();
  });

  it('propagates network failures', async () => {
    stubFetch(new Error('offline'));

    await expect(loadResourceNodes()).rejects.toThrow('offline');
  });
});

describe('resourceNames', () => {
  it('returns sorted unique resource names', () => {
    expect(
      resourceNames([
        { ...node, id: 'a', resource: 'Coal' },
        { ...node, id: 'b', resource: 'Iron Ore' },
        { ...node, id: 'c', resource: 'Coal' },
        { ...node, id: 'd', resource: 'Bauxite' },
      ]),
    ).toEqual(['Bauxite', 'Coal', 'Iron Ore']);
  });

  it('returns an empty list for no nodes', () => {
    expect(resourceNames([])).toEqual([]);
  });
});

describe('purities', () => {
  it('lists every supported purity in display order', () => {
    expect(purities).toEqual(['impure', 'normal', 'pure']);
  });
});
