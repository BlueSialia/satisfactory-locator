import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeResources } from '../src/data/normalize.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectRoot, 'src/data/resources.json');
const outputPath = resolve(projectRoot, 'public/data/resource-nodes.json');

const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
const { nodes, skippedMarkers } = normalizeResources(raw);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(nodes)}\n`);

console.log(
  `Generated ${nodes.length} resource nodes at ${outputPath} (${skippedMarkers} non-resource or invalid markers skipped).`,
);
