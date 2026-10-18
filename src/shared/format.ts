const worldCoordinateFormatter = new Intl.NumberFormat('en-US');

export function formatWorldCoordinate(value: number): string {
  const rounded = Math.round(value);
  return worldCoordinateFormatter.format(rounded === 0 ? 0 : rounded);
}
