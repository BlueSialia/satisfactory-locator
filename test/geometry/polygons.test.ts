import { describe, expect, it } from 'vitest';
import {
  boundsForMultiPolygon,
  boundsForNodes,
  boundsForPolygon,
  boundsOverlap,
  CIRCLE_SEGMENTS,
  circle,
  diskOverlapsPolygon,
  distanceToRing,
  distanceToSegment,
  intersectBounds,
  intersectMultiPolygons,
  mergeBounds,
  multiPolygonArea,
  pointInMultiPolygon,
  pointInPolygon,
  pointInRing,
  polygonArea,
  unionPolygons,
} from '../../src/geometry/polygons';
import type { Polygon, Ring } from '../../src/geometry/types';

function square(size: number, offsetX = 0, offsetY = 0): Ring {
  return [
    [offsetX, offsetY],
    [offsetX + size, offsetY],
    [offsetX + size, offsetY + size],
    [offsetX, offsetY + size],
  ];
}

function squarePolygon(size: number, offsetX = 0, offsetY = 0): Polygon {
  return [square(size, offsetX, offsetY)];
}

describe('polygonArea', () => {
  it('computes the area of open and closed rings', () => {
    expect(polygonArea(square(2))).toBe(4);
    expect(polygonArea([...square(2), [0, 0]])).toBe(4);
  });

  it('returns zero for degenerate rings', () => {
    expect(polygonArea([])).toBe(0);
    expect(polygonArea([[0, 0]])).toBe(0);
  });
});

describe('multiPolygonArea', () => {
  it('subtracts holes from outer rings', () => {
    expect(multiPolygonArea([[square(10), square(2, 4, 4)]])).toBe(96);
  });

  it('sums disconnected polygons', () => {
    expect(multiPolygonArea([squarePolygon(2), squarePolygon(3, 10, 10)])).toBe(
      13,
    );
  });

  it('returns zero for an empty multipolygon', () => {
    expect(multiPolygonArea([])).toBe(0);
  });
});

describe('circle', () => {
  it('returns a closed ring of the configured resolution', () => {
    const ring = circle({ x: 0, y: 0 }, 10)[0];

    expect(ring).toHaveLength(CIRCLE_SEGMENTS + 1);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(polygonArea(ring)).toBeGreaterThan(300);
    expect(polygonArea(ring)).toBeLessThan(320);
  });
});

describe('point containment', () => {
  const withHole: Polygon = [square(10), square(2, 4, 4)];

  it('handles a simple ring', () => {
    expect(pointInRing([1, 1], square(10))).toBe(true);
    expect(pointInRing([11, 1], square(10))).toBe(false);
    expect(pointInRing([1, 1], [])).toBe(false);
  });

  it('handles holes and disconnected polygons', () => {
    expect(pointInPolygon([1, 1], withHole)).toBe(true);
    expect(pointInPolygon([5, 5], withHole)).toBe(false);
    expect(pointInPolygon([9, 9], withHole)).toBe(true);
    expect(
      pointInMultiPolygon([12, 12], [withHole, squarePolygon(2, 11, 11)]),
    ).toBe(true);
    expect(pointInMultiPolygon([20, 20], [withHole])).toBe(false);
  });
});

describe('distance helpers', () => {
  it('measures the distance to a segment, including endpoints', () => {
    expect(distanceToSegment([0, 0], [-1, -1], [-1, 1])).toBe(1);
    expect(distanceToSegment([2, 0], [0, 0], [1, 0])).toBe(1);
    expect(distanceToSegment([0, 0], [1, 1], [1, 1])).toBeCloseTo(Math.SQRT2);
  });

  it('measures the distance to the nearest ring segment', () => {
    expect(distanceToRing([5, 5], square(10))).toBe(5);
    expect(distanceToRing([5, 5], [])).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('diskOverlapsPolygon', () => {
  const withHole: Polygon = [square(10), square(2, 4, 4)];

  it('detects centers inside the area', () => {
    expect(diskOverlapsPolygon({ x: 1, y: 1 }, 0.1, squarePolygon(10))).toBe(
      true,
    );
  });

  it('detects circles that reach the boundary from outside', () => {
    expect(diskOverlapsPolygon({ x: 12, y: 5 }, 2, squarePolygon(10))).toBe(
      true,
    );
    expect(diskOverlapsPolygon({ x: 12, y: 5 }, 1.9, squarePolygon(10))).toBe(
      false,
    );
  });

  it('treats holes as empty space', () => {
    expect(diskOverlapsPolygon({ x: 5, y: 5 }, 0.5, withHole)).toBe(false);
    expect(diskOverlapsPolygon({ x: 5, y: 5 }, 1.5, withHole)).toBe(true);
  });

  it('rejects distant circles', () => {
    expect(diskOverlapsPolygon({ x: 100, y: 100 }, 1, squarePolygon(10))).toBe(
      false,
    );
  });
});

describe('bounds helpers', () => {
  it('merges and intersects bounds', () => {
    const a = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    const b = { minX: 5, maxX: 15, minY: 5, maxY: 15 };

    expect(mergeBounds(a, b)).toEqual({
      minX: 0,
      maxX: 15,
      minY: 0,
      maxY: 15,
    });
    expect(intersectBounds(a, b)).toEqual({
      minX: 5,
      maxX: 10,
      minY: 5,
      maxY: 10,
    });
    expect(
      intersectBounds(a, { minX: 20, maxX: 30, minY: 20, maxY: 30 }),
    ).toBeNull();
    expect(boundsOverlap(a, b)).toBe(true);
    expect(boundsOverlap(a, { minX: 20, maxX: 30, minY: 20, maxY: 30 })).toBe(
      false,
    );
  });

  it('builds bounds for multipolygons', () => {
    expect(
      boundsForMultiPolygon([squarePolygon(2), squarePolygon(3, 10, 10)]),
    ).toEqual({ minX: 0, maxX: 13, minY: 0, maxY: 13 });
    expect(boundsForMultiPolygon([])).toBeNull();
  });

  it('builds bounds for polygons and node collections', () => {
    expect(boundsForPolygon(squarePolygon(10))).toEqual({
      minX: 0,
      maxX: 10,
      minY: 0,
      maxY: 10,
    });
    expect(boundsForPolygon([])).toBeNull();
    expect(boundsForNodes([], 5)).toBeNull();
    expect(
      boundsForNodes(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        2,
      ),
    ).toEqual({ minX: -2, maxX: 12, minY: -2, maxY: 12 });
  });
});

describe('polygon clipping wrappers', () => {
  it('unions overlapping and disjoint polygons', () => {
    const overlapping = unionPolygons([
      squarePolygon(10),
      squarePolygon(10, 5, 5),
    ]);
    expect(overlapping).toHaveLength(1);
    expect(multiPolygonArea(overlapping)).toBeCloseTo(175, 6);

    const disjoint = unionPolygons([
      squarePolygon(10),
      squarePolygon(10, 20, 20),
    ]);
    expect(disjoint).toHaveLength(2);
    expect(multiPolygonArea(disjoint)).toBe(200);
  });

  it('handles empty and single polygon inputs', () => {
    expect(unionPolygons([])).toEqual([]);
    expect(unionPolygons([squarePolygon(2)])).toEqual([squarePolygon(2)]);
  });

  it('intersects overlapping and disjoint multipolygons', () => {
    const intersection = intersectMultiPolygons(
      [squarePolygon(10)],
      [squarePolygon(10, 5, 5)],
    );
    expect(multiPolygonArea(intersection)).toBe(25);

    expect(
      intersectMultiPolygons([squarePolygon(10)], [squarePolygon(10, 20, 20)]),
    ).toEqual([]);
  });
});
