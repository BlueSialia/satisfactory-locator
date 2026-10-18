import { describe, expect, it } from 'vitest';
import {
  type Condition,
  firstConditionError,
  hasConditionErrors,
  MAX_DISTANCE_METRES,
  type Purity,
  validateCondition,
} from '../../src/data/model';

const condition = (overrides: Partial<Condition> = {}): Condition => ({
  resource: 'Iron Ore',
  purities: ['pure'],
  distance: 200,
  ...overrides,
});

describe('validateCondition', () => {
  it('accepts a valid condition', () => {
    const errors = validateCondition(condition());

    expect(errors).toEqual({});
    expect(hasConditionErrors(errors)).toBe(false);
    expect(firstConditionError(errors)).toBeNull();
  });

  it('requires a resource', () => {
    expect(validateCondition(condition({ resource: '' }))).toEqual({
      resource: 'Choose a resource.',
    });
  });

  it('requires at least one purity', () => {
    expect(validateCondition(condition({ purities: [] }))).toEqual({
      purities: 'Select at least one purity.',
    });
  });

  it('rejects purity values that are not supported at runtime', () => {
    const purities = ['invalid'] as unknown as Purity[];

    expect(validateCondition(condition({ purities }))).toEqual({
      purities: 'Select at least one purity.',
    });
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('rejects a distance of %s', (distance) => {
    expect(validateCondition(condition({ distance }))).toEqual({
      distance: 'Distance must be a finite number greater than 0.',
    });
  });

  it('rejects distances beyond the map extent', () => {
    expect(
      validateCondition(condition({ distance: MAX_DISTANCE_METRES + 1 })),
    ).toEqual({
      distance: `Distance must be at most ${MAX_DISTANCE_METRES.toLocaleString('en-US')} metres.`,
    });
  });

  it('accepts the maximum distance and small positive distances', () => {
    expect(
      validateCondition(condition({ distance: MAX_DISTANCE_METRES })),
    ).toEqual({});
    expect(validateCondition(condition({ distance: 0.1 }))).toEqual({});
  });

  it('reports the resource error first when several fields are invalid', () => {
    const errors = validateCondition(
      condition({ resource: '', purities: [], distance: 0 }),
    );

    expect(hasConditionErrors(errors)).toBe(true);
    expect(firstConditionError(errors)).toBe('Choose a resource.');
  });
});
