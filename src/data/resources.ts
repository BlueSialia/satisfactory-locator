import { isPurity, PURITIES, type Purity, type ResourceNode } from './model';

export const purities: readonly Purity[] = PURITIES;

const DATA_TIMEOUT_MS = 10_000;

export async function loadResourceNodes(): Promise<ResourceNode[]> {
  const signal =
    typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(DATA_TIMEOUT_MS)
      : undefined;
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/resource-nodes.json`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Resource data request failed (${response.status}).`);
  }

  return parseResourceNodes(await response.json());
}

export function parseResourceNodes(data: unknown): ResourceNode[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Resource data is empty or has an invalid format.');
  }
  if (!data.every(isResourceNode)) {
    throw new Error('Resource data has an invalid format.');
  }

  return data;
}

export function resourceNames(nodes: ResourceNode[]): string[] {
  return [...new Set(nodes.map((node) => node.resource))].sort();
}

function isResourceNode(value: unknown): value is ResourceNode {
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;
  return (
    typeof node.id === 'string' &&
    typeof node.resource === 'string' &&
    isPurity(node.purity) &&
    typeof node.x === 'number' &&
    Number.isFinite(node.x) &&
    typeof node.y === 'number' &&
    Number.isFinite(node.y)
  );
}
