import type { Condition, ResourceNode } from '../data/model';
import {
  firstConditionError,
  hasConditionErrors,
  validateCondition,
} from '../data/model';
import { purities, resourceNames } from '../data/resources';
import { calculateValidAreas, type SearchResult } from '../geometry/engine';
import type { WorldMap } from '../map/world-map';
import { capitalize } from '../shared/text';
import type { AppElements } from '../ui/app-shell';
import {
  type ConditionChange,
  type Draft,
  renderConditions,
} from '../ui/conditions-view';
import { renderLegend } from '../ui/legend-view';

const DEFAULT_DISTANCE_METRES = 200;

export function createLocatorApp(
  elements: AppElements,
  resourceNodes: ResourceNode[],
  map: WorldMap,
): void {
  const resources = resourceNames(resourceNodes);
  elements.sourceNote.textContent = `${resourceNodes.length} nodes · static, client-side data`;

  let nextId = 1;
  let revision = 0;
  let drafts: Draft[] = [];
  let applied: Condition[] = [];

  function setStatus(message: string): void {
    elements.status.textContent = message;
  }

  function markStale(): void {
    if (applied.length) {
      setStatus('Filters changed — apply them to update the map.');
    }
  }

  function renderConditionList(): void {
    renderConditions(
      elements.conditions,
      drafts,
      resources,
      purities,
      validateCondition,
      {
        onRemove: removeCondition,
        onChange: updateCondition,
      },
    );
  }

  function renderCurrentLegend(): void {
    renderLegend(elements.legend, applied);
  }

  function addCondition(): void {
    drafts = [
      ...drafts,
      {
        id: nextId,
        resource: resources[0] ?? '',
        purities: [...purities],
        distance: DEFAULT_DISTANCE_METRES,
      },
    ];
    nextId += 1;
    revision += 1;
    markStale();
    renderConditionList();
  }

  function removeCondition(id: number): void {
    drafts = drafts.filter((draft) => draft.id !== id);
    revision += 1;
    markStale();
    renderConditionList();
  }

  function updateCondition(change: ConditionChange): void {
    drafts = drafts.map((draft) => {
      if (draft.id !== change.id) return draft;

      switch (change.field) {
        case 'resource':
          return { ...draft, resource: change.value };
        case 'distance':
          return { ...draft, distance: change.value };
        case 'purity': {
          const selected = new Set(draft.purities);
          if (change.checked) selected.add(change.purity);
          else selected.delete(change.purity);
          return {
            ...draft,
            purities: purities.filter((purity) => selected.has(purity)),
          };
        }
        default:
          return draft;
      }
    });

    const updated = drafts.find((draft) => draft.id === change.id);
    if (!updated) return;

    revision += 1;
    markStale();
    updateConditionValidation(updated);
  }

  function updateConditionValidation(draft: Draft): void {
    const card = elements.conditions.querySelector<HTMLElement>(
      `[data-id="${draft.id}"]`,
    );
    if (!card) return;

    const errors = validateCondition(draft);
    card.classList.toggle('invalid', hasConditionErrors(errors));
    setControlInvalid(
      card.querySelector('[data-field="resource"]'),
      errors.resource,
    );
    setControlInvalid(card.querySelector('.purity-group'), errors.purities);
    setControlInvalid(
      card.querySelector('[data-field="distance"]'),
      errors.distance,
    );

    const error = card.querySelector<HTMLElement>('.error');
    if (error) error.textContent = firstConditionError(errors) ?? '';
  }

  function applyFilters(): void {
    if (!drafts.length) {
      setStatus('Add at least one condition before applying filters.');
      return;
    }

    const hasErrors = drafts.some((draft) =>
      hasConditionErrors(validateCondition(draft)),
    );
    if (hasErrors) {
      renderConditionList();
      setStatus('Fix the highlighted conditions before applying filters.');
      return;
    }

    const conditions: Condition[] = drafts.map(
      ({ id: _id, ...condition }) => condition,
    );
    const revisionAtStart = revision;
    setStatus('Evaluating resource regions…');
    elements.apply.disabled = true;

    requestAnimationFrame(() => {
      try {
        const result = calculateValidAreas(conditions, resourceNodes);
        if (revision !== revisionAtStart) {
          setStatus('Filters changed — apply them again.');
          return;
        }
        applyResult(result, conditions);
      } catch (error) {
        console.error(error);
        setStatus(
          'Unable to calculate valid areas. Try reducing the distances or the number of conditions.',
        );
      } finally {
        elements.apply.disabled = false;
      }
    });
  }

  function applyResult(result: SearchResult, conditions: Condition[]): void {
    switch (result.kind) {
      case 'success':
        map.render(
          result.area,
          result.contributing,
          conditions,
          result.contributions,
        );
        applied = conditions;
        renderCurrentLegend();
        setStatus(
          `${result.area.length} valid area${result.area.length === 1 ? '' : 's'} found.`,
        );
        return;
      case 'no-matching-nodes': {
        map.clearResults();
        applied = conditions;
        renderCurrentLegend();
        const condition = conditions[result.conditionIndex];
        const selectedPurities = condition.purities.map(capitalize).join(', ');
        setStatus(
          `No ${condition.resource} nodes match the selected purities (${selectedPurities}).`,
        );
        return;
      }
      case 'no-overlap':
        map.clearResults();
        applied = conditions;
        renderCurrentLegend();
        setStatus(`No location satisfies all ${conditions.length} conditions.`);
        return;
      case 'geometry-error':
        console.error(result.reason);
        map.clearResults();
        applied = conditions;
        renderCurrentLegend();
        setStatus(
          'Unable to calculate valid areas. Try reducing the distances or the number of conditions.',
        );
        return;
      case 'invalid-input':
        setStatus(result.reason);
        return;
    }
  }

  function clearAll(): void {
    drafts = [];
    applied = [];
    revision += 1;
    map.clearResults();
    renderCurrentLegend();
    setStatus('Add conditions to search for valid areas.');
    renderConditionList();
  }

  elements.add.addEventListener('click', addCondition);
  elements.apply.addEventListener('click', applyFilters);
  elements.clear.addEventListener('click', clearAll);
  elements.reset.addEventListener('click', () => map.reset());
  elements.circles.addEventListener('change', () =>
    map.setCircleVisibility(elements.circles.checked),
  );

  elements.add.disabled = false;
  elements.apply.disabled = false;
  elements.clear.disabled = false;
  elements.reset.disabled = false;
  elements.circles.disabled = false;

  renderCurrentLegend();
  renderConditionList();
}

function setControlInvalid(
  control: Element | null,
  message: string | undefined,
): void {
  control?.setAttribute('aria-invalid', String(Boolean(message)));
}
