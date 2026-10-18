import type { Condition, ConditionErrors, Purity } from '../data/model';
import {
  firstConditionError,
  hasConditionErrors,
  isPurity,
  MAX_DISTANCE_METRES,
} from '../data/model';
import { conditionColor } from '../shared/colors';
import { capitalize, escapeHtml } from '../shared/text';

export type Draft = Condition & { id: number };

export type ConditionChange =
  | { id: number; field: 'resource'; value: string }
  | { id: number; field: 'distance'; value: number }
  | { id: number; field: 'purity'; purity: Purity; checked: boolean };

export interface ConditionViewHandlers {
  onRemove(id: number): void;
  onChange(change: ConditionChange): void;
}

export function renderConditions(
  container: HTMLDivElement,
  drafts: Draft[],
  resources: string[],
  purities: readonly Purity[],
  getErrors: (draft: Draft) => ConditionErrors,
  handlers: ConditionViewHandlers,
): void {
  container.innerHTML = drafts.length
    ? drafts
        .map((draft, index) =>
          renderCondition(draft, index, resources, purities, getErrors(draft)),
        )
        .join('')
    : '<p class="empty">No conditions yet. Add a resource requirement to begin.</p>';

  container
    .querySelectorAll<HTMLButtonElement>('[data-remove]')
    .forEach((button) => {
      button.addEventListener('click', () =>
        handlers.onRemove(Number(button.dataset.remove)),
      );
    });

  container
    .querySelectorAll<HTMLSelectElement | HTMLInputElement>('[data-field]')
    .forEach((input) => {
      input.addEventListener('input', () => {
        const card = input.closest<HTMLElement>('.condition');
        const id = Number(card?.dataset.id);
        const field = input.dataset.field;
        if (!Number.isInteger(id) || !field) return;

        if (field === 'purity' && input instanceof HTMLInputElement) {
          const purity = input.dataset.purity;
          if (!purity || !isPurity(purity)) return;
          handlers.onChange({
            id,
            field: 'purity',
            purity,
            checked: input.checked,
          });
          return;
        }

        if (field === 'resource') {
          handlers.onChange({ id, field: 'resource', value: input.value });
          return;
        }

        if (field === 'distance') {
          handlers.onChange({
            id,
            field: 'distance',
            value: Number(input.value),
          });
        }
      });
    });
}

function renderCondition(
  draft: Draft,
  index: number,
  resources: string[],
  purities: readonly Purity[],
  errors: ConditionErrors,
): string {
  const errorId = `condition-error-${draft.id}`;
  const errorMessage = firstConditionError(errors);
  const invalid = hasConditionErrors(errors);

  const resourceOptions = renderResourceOptions(resources, draft.resource);
  const purityOptions = renderPurityOptions(purities, draft.purities, index);

  return `<article class="condition${invalid ? ' invalid' : ''}" data-id="${draft.id}">
    <div class="condition-number" style="--condition-color:${conditionColor(index)}">${index + 1}</div>
    <label>
      Resource
      <select
        data-field="resource"
        aria-label="Condition ${index + 1} resource"
        aria-invalid="${Boolean(errors.resource)}"
        aria-describedby="${errorId}"
      >${resourceOptions}</select>
    </label>
    <fieldset
      class="purity-group"
      aria-invalid="${Boolean(errors.purities)}"
      aria-describedby="${errorId}"
    >
      <legend>Purity</legend>
      <div class="purity-options">${purityOptions}</div>
    </fieldset>
    <label>
      Maximum distance <span class="unit">metres</span>
      <input
        data-field="distance"
        aria-label="Condition ${index + 1} maximum distance"
        aria-invalid="${Boolean(errors.distance)}"
        aria-describedby="${errorId}"
        type="number"
        min="0.1"
        max="${MAX_DISTANCE_METRES}"
        step="any"
        value="${Number.isFinite(draft.distance) ? draft.distance : ''}"
      >
    </label>
    <button
      class="remove"
      type="button"
      data-remove="${draft.id}"
      aria-label="Remove condition ${index + 1}"
    >Remove</button>
    <p class="error" id="${errorId}" role="alert">${errorMessage ? escapeHtml(errorMessage) : ''}</p>
  </article>`;
}

function renderResourceOptions(
  resources: string[],
  selectedResource: string,
): string {
  return resources
    .map((resource) => {
      const selected = resource === selectedResource ? ' selected' : '';
      return `<option value="${escapeHtml(resource)}"${selected}>${escapeHtml(resource)}</option>`;
    })
    .join('');
}

function renderPurityOptions(
  purities: readonly Purity[],
  selectedPurities: Purity[],
  conditionIndex: number,
): string {
  return purities
    .map((purity) => {
      const checked = selectedPurities.includes(purity) ? ' checked' : '';
      const label = capitalize(purity);
      return `<label><input type="checkbox" data-field="purity" data-purity="${purity}" aria-label="Condition ${conditionIndex + 1} ${label} purity"${checked}>${label}</label>`;
    })
    .join('');
}
