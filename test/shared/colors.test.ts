import { describe, expect, it } from 'vitest';
import {
  AREA_FILL_COLOR,
  AREA_STROKE_COLOR,
  conditionColor,
} from '../../src/shared/colors';

describe('conditionColor', () => {
  it('returns an HSL color', () => {
    expect(conditionColor(0)).toBe('hsl(0.00 70% 60%)');
    expect(conditionColor(1)).toMatch(/^hsl\(\d+\.\d{2} 70% 60%\)$/);
  });

  it('keeps colors deterministic and distinct for different indices', () => {
    expect(conditionColor(3)).toBe(conditionColor(3));
    expect(conditionColor(0)).not.toBe(conditionColor(6));
  });
});

describe('area colors', () => {
  it('exports the colors used by the map and legend', () => {
    expect(AREA_FILL_COLOR).toBe('#38bdf8');
    expect(AREA_STROKE_COLOR).toBe('#f8fafc');
  });
});
