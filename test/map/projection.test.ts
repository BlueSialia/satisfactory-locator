import { describe, expect, it } from 'vitest';
import {
  WORLD_EXTENT,
  worldBounds,
  worldToLeaflet,
} from '../../src/map/projection';

describe('world projection', () => {
  it('uses the calibrated map extent', () => {
    expect(WORLD_EXTENT).toEqual({
      minX: -3_246,
      maxX: 4_253,
      minY: -3_750,
      maxY: 3_750,
    });
  });

  it('inverts the Y axis for Leaflet', () => {
    expect(worldToLeaflet([100, -200])).toEqual([200, 100]);
    expect(worldToLeaflet([0, 0])).toEqual([0, 0]);
  });

  it('returns the bounds in Leaflet order', () => {
    expect(worldBounds()).toEqual([
      [-3_750, -3_246],
      [3_750, 4_253],
    ]);
  });
});
