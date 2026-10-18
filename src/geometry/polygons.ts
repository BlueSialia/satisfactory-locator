import polygonClipping from 'polygon-clipping';
import type {
  Bounds,
  MultiPolygon,
  Point,
  PointLike,
  Polygon,
  Ring,
} from './types';

export const CIRCLE_SEGMENTS = 64;
export const EPSILON_AREA = 0.01;

export function circle(center: PointLike, radius: number): Polygon {
  const ring: Ring = [];
  for (let index = 0; index < CIRCLE_SEGMENTS; index += 1) {
    const angle = (index / CIRCLE_SEGMENTS) * Math.PI * 2;
    ring.push([
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius,
    ]);
  }
  ring.push(ring[0]);
  return [ring];
}

export function polygonArea(ring: Ring): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

export function multiPolygonArea(multi: MultiPolygon): number {
  return multi.reduce((total, polygon) => {
    const [outer, ...holes] = polygon;
    if (!outer) return total;
    return (
      total +
      polygonArea(outer) -
      holes.reduce((holeTotal, hole) => holeTotal + polygonArea(hole), 0)
    );
  }, 0);
}

export function unionPolygons(polygons: readonly Polygon[]): MultiPolygon {
  if (polygons.length === 0) return [];
  if (polygons.length === 1) return [polygons[0]];

  const [first, ...rest] = polygons;
  return polygonClipping.union(first, ...rest);
}

export function intersectMultiPolygons(
  a: MultiPolygon,
  b: MultiPolygon,
): MultiPolygon {
  return polygonClipping.intersection(a, b);
}

function boundsForCircle(center: PointLike, radius: number): Bounds {
  return {
    minX: center.x - radius,
    maxX: center.x + radius,
    minY: center.y - radius,
    maxY: center.y + radius,
  };
}

export function mergeBounds(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function intersectBounds(a: Bounds, b: Bounds): Bounds | null {
  const result = {
    minX: Math.max(a.minX, b.minX),
    maxX: Math.min(a.maxX, b.maxX),
    minY: Math.max(a.minY, b.minY),
    maxY: Math.min(a.maxY, b.maxY),
  };
  return result.minX <= result.maxX && result.minY <= result.maxY
    ? result
    : null;
}

export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  );
}

export function boundsForNodes(
  nodes: readonly PointLike[],
  radius: number,
): Bounds | null {
  return nodes.reduce<Bounds | null>((bounds, node) => {
    const nodeBounds = boundsForCircle(node, radius);
    return bounds ? mergeBounds(bounds, nodeBounds) : nodeBounds;
  }, null);
}

export function boundsForPolygon(polygon: Polygon): Bounds | null {
  let bounds: Bounds | null = null;

  for (const ring of polygon) {
    for (const [x, y] of ring) {
      const pointBounds = { minX: x, maxX: x, minY: y, maxY: y };
      bounds = bounds ? mergeBounds(bounds, pointBounds) : pointBounds;
    }
  }

  return bounds;
}

export function boundsForMultiPolygon(multi: MultiPolygon): Bounds | null {
  return multi.reduce<Bounds | null>((bounds, polygon) => {
    const polygonBounds = boundsForPolygon(polygon);
    if (!polygonBounds) return bounds;
    return bounds ? mergeBounds(bounds, polygonBounds) : polygonBounds;
  }, null);
}

export function disksOverlap(
  a: PointLike,
  radiusA: number,
  b: PointLike,
  radiusB: number,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = radiusA + radiusB;
  return dx * dx + dy * dy <= radius * radius;
}

export function pointInRing(point: Point, ring: Ring): boolean {
  if (ring.length < 3) return false;

  let inside = false;

  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index, index += 1
  ) {
    const [x, y] = ring[index];
    const [previousX, previousY] = ring[previous];
    const crosses =
      y > point[1] !== previousY > point[1] &&
      point[0] < ((previousX - x) * (point[1] - y)) / (previousY - y) + x;
    if (crosses) inside = !inside;
  }

  return inside;
}

export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  const [outer, ...holes] = polygon;
  if (!outer || !pointInRing(point, outer)) return false;
  return !holes.some((hole) => pointInRing(point, hole));
}

export function pointInMultiPolygon(
  point: Point,
  multi: MultiPolygon,
): boolean {
  return multi.some((polygon) => pointInPolygon(point, polygon));
}

export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const [pointX, pointY] = point;
  const [aX, aY] = a;
  const [bX, bY] = b;
  const deltaX = bX - aX;
  const deltaY = bY - aY;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    return Math.hypot(pointX - aX, pointY - aY);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((pointX - aX) * deltaX + (pointY - aY) * deltaY) / lengthSquared,
    ),
  );
  return Math.hypot(
    pointX - (aX + projection * deltaX),
    pointY - (aY + projection * deltaY),
  );
}

export function distanceToRing(point: Point, ring: Ring): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < ring.length; index += 1) {
    minimum = Math.min(
      minimum,
      distanceToSegment(point, ring[index], ring[(index + 1) % ring.length]),
    );
  }
  return minimum;
}

export function diskOverlapsPolygon(
  center: PointLike,
  radius: number,
  polygon: Polygon,
): boolean {
  const point: Point = [center.x, center.y];
  if (pointInPolygon(point, polygon)) return true;

  const polygonBounds = boundsForPolygon(polygon);
  if (!polygonBounds) return false;
  if (!boundsOverlap(boundsForCircle(center, radius), polygonBounds)) {
    return false;
  }

  return polygon.some((ring) => distanceToRing(point, ring) <= radius);
}

export function diskOverlapsMultiPolygon(
  center: PointLike,
  radius: number,
  multi: MultiPolygon,
): boolean {
  return multi.some((polygon) => diskOverlapsPolygon(center, radius, polygon));
}
