import type { Condition } from '../data/model';
import { conditionColor } from '../shared/colors';
import { escapeHtml } from '../shared/text';

function conditionLegendItem(condition: Condition, index: number): string {
  return `<span><i class="swatch" style="background:${conditionColor(index)}"></i>Condition ${index + 1}: ${escapeHtml(condition.resource)}</span>`;
}

export function renderLegend(
  container: HTMLDivElement,
  conditions: Condition[],
): void {
  const items = conditions.map(conditionLegendItem).join('');
  container.innerHTML = [
    '<strong>Legend</strong>',
    '<span><i class="swatch valid"></i>Valid area</span>',
    items,
    '<span class="legend-note">Node colors identify condition order</span>',
  ].join('');
}
