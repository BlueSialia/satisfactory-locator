import { describe, expect, it } from 'vitest';
import { formatWorldCoordinate } from '../../src/shared/format';

describe('formatWorldCoordinate', () => {
  it('rounds and formats with explicit thousands separators', () => {
    expect(formatWorldCoordinate(-324486)).toBe('-324,486');
    expect(formatWorldCoordinate(422790)).toBe('422,790');
  });

  it('rounds to the nearest metre', () => {
    expect(formatWorldCoordinate(1.4)).toBe('1');
    expect(formatWorldCoordinate(1.6)).toBe('2');
    expect(formatWorldCoordinate(-1.6)).toBe('-2');
  });

  it('does not render negative zero', () => {
    expect(formatWorldCoordinate(-0.4)).toBe('0');
  });
});
