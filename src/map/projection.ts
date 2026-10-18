import type L from 'leaflet';
import type { Point } from '../geometry/types';

/** Calibrated against Map-HQ.avif and the upstream world-map coordinate frame. */
export const WORLD_EXTENT = {
  minX: -3_246,
  maxX: 4_253,
  minY: -3_750,
  maxY: 3_750,
} as const;

export function worldToLeaflet(point: Point): L.LatLngExpression {
  const [x, y] = point;
  return [y === 0 ? 0 : -y, x];
}

export function worldBounds(): L.LatLngBoundsExpression {
  return [
    [-WORLD_EXTENT.maxY, WORLD_EXTENT.minX],
    [-WORLD_EXTENT.minY, WORLD_EXTENT.maxX],
  ];
}
