export interface AppElements {
  app: HTMLDivElement;
  conditions: HTMLDivElement;
  status: HTMLSpanElement;
  legend: HTMLDivElement;
  map: HTMLDivElement;
  coordinates: HTMLSpanElement;
  circles: HTMLInputElement;
  add: HTMLButtonElement;
  apply: HTMLButtonElement;
  clear: HTMLButtonElement;
  reset: HTMLButtonElement;
  retry: HTMLButtonElement;
  sourceNote: HTMLDivElement;
}

export function renderAppShell(app: HTMLDivElement): AppElements {
  app.innerHTML = `
    <section class="shell">
      <header>
        <div>
          <p class="eyebrow">Satisfactory world planning tool</p>
          <h1>Satisfactory Locator</h1>
          <p class="intro">
            Find factory locations within range of every resource condition you
            need. Calculations use real node coordinates in metres.
          </p>
        </div>
        <div class="source">
          <div id="source-note" class="source-note">Loading resource data…</div>
          <button id="retry" class="secondary small" type="button" hidden>
            Retry
          </button>
        </div>
      </header>

      <section class="builder" aria-labelledby="builder-title">
        <div class="section-heading">
          <div>
            <h2 id="builder-title">Resource conditions</h2>
            <p>Each condition must be satisfied by at least one matching node.</p>
          </div>
          <button id="add" class="secondary" type="button" disabled>
            + Add condition
          </button>
        </div>
        <div id="conditions" class="conditions"></div>
        <div class="actions">
          <button id="apply" class="primary" type="button" disabled>
            Apply filters
          </button>
          <button id="clear" class="secondary" type="button" disabled>
            Clear all
          </button>
          <span id="status" class="status" role="status" aria-live="polite">
            Add conditions to search for valid areas.
          </span>
        </div>
      </section>

      <section class="map-section" aria-labelledby="map-title">
        <div class="map-toolbar">
          <div>
            <strong id="map-title">World map</strong>
            <span id="coords">Move over map for coordinates</span>
          </div>
          <div class="map-actions">
            <label class="check">
              <input id="circles" type="checkbox" disabled>
              Show search radii
            </label>
            <button
              id="reset"
              class="secondary small"
              type="button"
              disabled
            >
              Reset view
            </button>
          </div>
        </div>
        <div
          id="map"
          class="map"
          role="region"
          aria-label="Interactive Satisfactory world map"
        >
          Loading world map…
        </div>
        <div id="legend" class="legend" aria-label="Map legend"></div>
      </section>

      <footer class="site-footer">
        <span>
          Data and map background:
          <a
            href="https://github.com/Tjark-Kuehl/satisfactorymap"
            target="_blank"
            rel="noreferrer"
          >Tjark-Kuehl/satisfactorymap</a>.
        </span>
        <span>
          Satisfactory is a trademark of Coffee Stain Studios. This project is
          not affiliated with Coffee Stain Studios.
        </span>
      </footer>
    </section>`;

  return {
    app,
    conditions: getElement<HTMLDivElement>(app, '#conditions'),
    status: getElement<HTMLSpanElement>(app, '#status'),
    legend: getElement<HTMLDivElement>(app, '#legend'),
    map: getElement<HTMLDivElement>(app, '#map'),
    coordinates: getElement<HTMLSpanElement>(app, '#coords'),
    circles: getElement<HTMLInputElement>(app, '#circles'),
    add: getElement<HTMLButtonElement>(app, '#add'),
    apply: getElement<HTMLButtonElement>(app, '#apply'),
    clear: getElement<HTMLButtonElement>(app, '#clear'),
    reset: getElement<HTMLButtonElement>(app, '#reset'),
    retry: getElement<HTMLButtonElement>(app, '#retry'),
    sourceNote: getElement<HTMLDivElement>(app, '#source-note'),
  };
}

function getElement<T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element)
    throw new Error(`Missing required application element: ${selector}`);
  return element;
}
