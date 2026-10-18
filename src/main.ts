import { createLocatorApp } from './app/controller';
import type { ResourceNode } from './data/model';
import { loadResourceNodes } from './data/resources';
import { WorldMap } from './map/world-map';
import { formatWorldCoordinate } from './shared/format';
import { type AppElements, renderAppShell } from './ui/app-shell';
import './style.css';

async function bootstrap(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing application root.');

  const elements = renderAppShell(app);
  elements.retry.addEventListener('click', () => window.location.reload());

  let resourceNodes: ResourceNode[];
  try {
    resourceNodes = await loadResourceNodes();
  } catch (error) {
    showStartupError(
      elements,
      `Unable to load resource data: ${errorMessage(error)}`,
      'The map is unavailable until resource data loads.',
    );
    return;
  }

  try {
    const map = new WorldMap(elements.map, (x, y) => {
      elements.coordinates.textContent = `X ${formatWorldCoordinate(x)} m · Y ${formatWorldCoordinate(y)} m`;
    });
    window.addEventListener('pagehide', () => map.destroy(), { once: true });
    createLocatorApp(elements, resourceNodes, map);
  } catch (error) {
    showStartupError(
      elements,
      `Unable to initialize the application: ${errorMessage(error)}`,
      'The application could not be initialized.',
    );
  }
}

function showStartupError(
  elements: AppElements,
  statusMessage: string,
  mapMessage: string,
): void {
  elements.sourceNote.textContent = 'Application unavailable';
  elements.status.textContent = statusMessage;
  elements.retry.hidden = false;
  elements.add.disabled = true;
  elements.apply.disabled = true;
  elements.clear.disabled = true;
  elements.reset.disabled = true;
  elements.circles.disabled = true;
  elements.map.textContent = mapMessage;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.';
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
});
