export const AREA_FILL_COLOR = '#38bdf8';
export const AREA_STROKE_COLOR = '#f8fafc';

export function conditionColor(index: number): string {
  const hue = (index * 137.508) % 360;
  return `hsl(${hue.toFixed(2)} 70% 60%)`;
}
