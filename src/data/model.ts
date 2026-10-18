export const PURITIES = ['impure', 'normal', 'pure'] as const;

export type Purity = (typeof PURITIES)[number];

export const MAX_DISTANCE_METRES = 10_000;

export interface ResourceNode {
  id: string;
  resource: string;
  purity: Purity;
  x: number;
  y: number;
}

export interface Condition {
  resource: string;
  purities: Purity[];
  distance: number;
}

export type ConditionErrors = Partial<
  Record<'resource' | 'purities' | 'distance', string>
>;

export function isPurity(value: unknown): value is Purity {
  return value === 'impure' || value === 'normal' || value === 'pure';
}

export function validateCondition(condition: Condition): ConditionErrors {
  const errors: ConditionErrors = {};

  if (!condition.resource) {
    errors.resource = 'Choose a resource.';
  }
  if (condition.purities.length === 0 || !condition.purities.every(isPurity)) {
    errors.purities = 'Select at least one purity.';
  }
  if (!Number.isFinite(condition.distance) || condition.distance <= 0) {
    errors.distance = 'Distance must be a finite number greater than 0.';
  } else if (condition.distance > MAX_DISTANCE_METRES) {
    errors.distance = `Distance must be at most ${MAX_DISTANCE_METRES.toLocaleString('en-US')} metres.`;
  }

  return errors;
}

export function hasConditionErrors(errors: ConditionErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function firstConditionError(errors: ConditionErrors): string | null {
  return errors.resource ?? errors.purities ?? errors.distance ?? null;
}
