import { z } from 'zod';
// This module is also loaded directly by the Node build script. Keep local
// imports type-only so Node's ESM resolver does not need extension inference.
import type { Purity, ResourceNode } from './model';

const SOURCE_PURITIES = [
  'impure',
  'normal',
  'pure',
] as const satisfies readonly Purity[];

const RawMarkerSchema = z
  .object({
    x: z.union([z.string(), z.number()]),
    y: z.union([z.string(), z.number()]),
    z: z.union([z.string(), z.number()]).optional(),
    purity: z.string().optional(),
    pathName: z.string().optional(),
  })
  .passthrough();

const RawResourceEntrySchema = z.object({
  name: z.string().min(1),
  purity: z.string().optional(),
  markers: z.array(RawMarkerSchema).optional(),
});

const RawResourceGroupSchema = z.object({
  name: z.string().min(1),
  options: z.array(RawResourceEntrySchema),
});

const RawResourcesSchema = z.object({
  options: z.array(
    z.object({
      options: z.array(RawResourceGroupSchema),
    }),
  ),
});

const ResourceNodeSchema = z.object({
  id: z.string().min(1),
  resource: z.string().min(1),
  purity: z.enum(SOURCE_PURITIES),
  x: z.number().finite(),
  y: z.number().finite(),
});

export interface NormalizeResult {
  nodes: ResourceNode[];
  skippedMarkers: number;
}

function isPurity(value: unknown): value is Purity {
  return SOURCE_PURITIES.some((purity) => purity === value);
}

/**
 * Normalizes the upstream resource map into the compact node format used by
 * the application. Markers without a purity belong to non-resource groups
 * such as collectibles and are intentionally skipped.
 */
export function normalizeResources(raw: unknown): NormalizeResult {
  const source = RawResourcesSchema.parse(raw);
  const nodes: ResourceNode[] = [];
  const seen = new Set<string>();
  let skippedMarkers = 0;

  for (const tab of source.options) {
    for (const resourceGroup of tab.options) {
      for (const entry of resourceGroup.options) {
        for (const marker of entry.markers ?? []) {
          const purity = entry.purity || marker.purity;
          const x = Number(marker.x);
          const y = Number(marker.y);
          const id = marker.pathName?.trim() || `${entry.name}-${x}-${y}`;

          if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !isPurity(purity) ||
            seen.has(id)
          ) {
            skippedMarkers += 1;
            continue;
          }

          seen.add(id);
          nodes.push({
            id,
            resource: resourceGroup.name,
            purity,
            x: x / 100,
            y: y / 100,
          });
        }
      }
    }
  }

  if (nodes.length === 0) {
    throw new Error('No resource nodes were found in the source data.');
  }

  return { nodes: z.array(ResourceNodeSchema).parse(nodes), skippedMarkers };
}
