import type { Condition, ResourceNode } from '../data/model';
import { hasConditionErrors, validateCondition } from '../data/model';
import {
  boundsForNodes,
  circle,
  diskOverlapsMultiPolygon,
  disksOverlap,
  EPSILON_AREA,
  intersectBounds,
  intersectMultiPolygons,
  multiPolygonArea,
  unionPolygons,
} from './polygons';
import type { Bounds, MultiPolygon, Polygon } from './types';

export type SearchResult =
  | SuccessfulSearchResult
  | NoMatchingNodesResult
  | NoOverlapResult
  | InvalidSearchResult
  | GeometryErrorResult;

export interface SuccessfulSearchResult {
  kind: 'success';
  area: MultiPolygon;
  matching: ResourceNode[][];
  contributing: ResourceNode[];
  contributions: ReadonlyMap<string, number[]>;
}

interface NoMatchingNodesResult {
  kind: 'no-matching-nodes';
  conditionIndex: number;
}

interface NoOverlapResult {
  kind: 'no-overlap';
}

interface InvalidSearchResult {
  kind: 'invalid-input';
  reason: string;
}

interface GeometryErrorResult {
  kind: 'geometry-error';
  reason: string;
}

type CircleFactory = (node: ResourceNode, radius: number) => Polygon;

function nodeKey(node: ResourceNode): string {
  return `${node.resource}\u0000${node.purity}`;
}

function indexNodes(nodes: ResourceNode[]): Map<string, ResourceNode[]> {
  const index = new Map<string, ResourceNode[]>();
  for (const node of nodes) {
    const key = nodeKey(node);
    const bucket = index.get(key);
    if (bucket) bucket.push(node);
    else index.set(key, [node]);
  }
  return index;
}

function matchingNodes(
  condition: Condition,
  index: Map<string, ResourceNode[]>,
): ResourceNode[] {
  const result: ResourceNode[] = [];
  const seen = new Set<string>();

  for (const purity of condition.purities) {
    for (const node of index.get(`${condition.resource}\u0000${purity}`) ??
      []) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      result.push(node);
    }
  }

  return result;
}

function pruneOnce(
  candidates: ResourceNode[][],
  conditions: Condition[],
): ResourceNode[][] {
  return candidates.map((nodes, conditionIndex) =>
    nodes.filter((node) =>
      conditions.every(
        (condition, otherIndex) =>
          conditionIndex === otherIndex ||
          candidates[otherIndex].some((other) =>
            disksOverlap(
              node,
              conditions[conditionIndex].distance,
              other,
              condition.distance,
            ),
          ),
      ),
    ),
  );
}

function pruneCandidates(
  matching: ResourceNode[][],
  conditions: Condition[],
): ResourceNode[][] {
  let candidates = matching.map((nodes) => [...nodes]);

  while (candidates.every((nodes) => nodes.length > 0)) {
    const pruned = pruneOnce(candidates, conditions);
    const changed = pruned.some(
      (nodes, index) => nodes.length !== candidates[index].length,
    );
    if (!changed) break;
    candidates = pruned;
  }

  return candidates;
}

function acceptableRegions(
  candidates: ResourceNode[][],
  conditions: Condition[],
  getCircle: CircleFactory,
): MultiPolygon[] {
  return candidates.map((nodes, index) =>
    unionPolygons(
      nodes.map((node) => getCircle(node, conditions[index].distance)),
    ),
  );
}

function intersectAcceptableRegions(
  candidates: ResourceNode[][],
  conditions: Condition[],
  getCircle: CircleFactory,
): MultiPolygon {
  const regions = acceptableRegions(candidates, conditions, getCircle);
  let area = regions[0] ?? [];

  for (let index = 1; index < regions.length && area.length > 0; index += 1) {
    area = intersectMultiPolygons(area, regions[index]);
  }

  return area;
}

function findContributingNodes(
  candidates: ResourceNode[][],
  conditions: Condition[],
  area: MultiPolygon,
): Pick<SuccessfulSearchResult, 'contributing' | 'contributions'> {
  const contributions = new Map<string, number[]>();
  const contributing: ResourceNode[] = [];
  const seen = new Set<string>();

  candidates.forEach((nodes, conditionIndex) => {
    const distance = conditions[conditionIndex].distance;

    for (const node of nodes) {
      if (!diskOverlapsMultiPolygon(node, distance, area)) continue;

      const indices = contributions.get(node.id);
      if (indices) {
        if (!indices.includes(conditionIndex)) indices.push(conditionIndex);
      } else {
        contributions.set(node.id, [conditionIndex]);
      }

      if (!seen.has(node.id)) {
        seen.add(node.id);
        contributing.push(node);
      }
    }
  });

  return { contributing, contributions };
}

function invalidResult(reason: string): InvalidSearchResult {
  return { kind: 'invalid-input', reason };
}

function geometryErrorResult(error: unknown): GeometryErrorResult {
  return {
    kind: 'geometry-error',
    reason: error instanceof Error ? error.message : 'Unknown geometry error.',
  };
}

export function calculateValidAreas(
  conditions: Condition[],
  nodes: ResourceNode[],
): SearchResult {
  if (conditions.length === 0) {
    return invalidResult('At least one condition is required.');
  }

  const invalidCondition = conditions.findIndex((condition) =>
    hasConditionErrors(validateCondition(condition)),
  );
  if (invalidCondition >= 0) {
    return invalidResult(`Condition ${invalidCondition + 1} is invalid.`);
  }

  const nodeIndex = indexNodes(nodes);
  const matching = conditions.map((condition) =>
    matchingNodes(condition, nodeIndex),
  );
  const unmatchedCondition = matching.findIndex((list) => list.length === 0);
  if (unmatchedCondition >= 0) {
    return { kind: 'no-matching-nodes', conditionIndex: unmatchedCondition };
  }

  let possibleBounds: Bounds | null = null;
  for (
    let conditionIndex = 0;
    conditionIndex < matching.length;
    conditionIndex += 1
  ) {
    const conditionBounds = boundsForNodes(
      matching[conditionIndex],
      conditions[conditionIndex].distance,
    );
    if (!conditionBounds) return { kind: 'no-overlap' };

    possibleBounds = possibleBounds
      ? intersectBounds(possibleBounds, conditionBounds)
      : conditionBounds;
    if (!possibleBounds) return { kind: 'no-overlap' };
  }

  const candidates = pruneCandidates(matching, conditions);
  if (candidates.some((list) => list.length === 0)) {
    return { kind: 'no-overlap' };
  }

  const circleCache = new Map<string, Polygon>();
  const getCircle: CircleFactory = (node, radius) => {
    const key = `${node.id}:${radius}`;
    const cached = circleCache.get(key);
    if (cached) return cached;

    const value = circle(node, radius);
    circleCache.set(key, value);
    return value;
  };

  let area: MultiPolygon;
  try {
    area = intersectAcceptableRegions(candidates, conditions, getCircle);
  } catch (error) {
    return geometryErrorResult(error);
  }

  if (!area.length || multiPolygonArea(area) <= EPSILON_AREA) {
    return { kind: 'no-overlap' };
  }

  const { contributing, contributions } =
    conditions.length === 1
      ? {
          contributing: candidates[0] ?? [],
          contributions: new Map(
            (candidates[0] ?? []).map((node) => [node.id, [0]]),
          ),
        }
      : findContributingNodes(candidates, conditions, area);

  return { kind: 'success', area, matching, contributing, contributions };
}
