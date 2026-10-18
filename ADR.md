# Architectural Decision Records

All Architectural Decisions and their rationale will be documented in this file.

The format is based on the [Y-Statement](https://adr.github.io/adr-templates/#y-statement).

---

## Runtime and data

### Static browser application with bundled community data

In the context of deploying a reliable locator to GitHub Pages,
facing the need for map and resource data without a backend or runtime secrets,
we decided for a Vite-built static application with bundled upstream data
to achieve deterministic client-side operation,
accepting that data updates require a new build.

### Vanilla TypeScript and direct DOM rendering

In the context of a small, single-screen planning tool,
facing the complexity and runtime cost of a UI framework,
we decided for vanilla TypeScript with explicit DOM rendering
to achieve a small bundle and a testable data layer,
accepting manual event wiring and state updates.

### Build-time resource data normalization

In the context of consuming a large third-party map export,
facing the need to validate and minimize data before it reaches the browser,
we decided for build-time Zod validation and normalization
to achieve fail-fast data errors and a smaller client bundle,
accepting that data refreshes require running the generator.

### Calibrated planar map projection

In the context of displaying Satisfactory's planar world coordinates,
facing the mismatch between game coordinates and geographic coordinates,
we decided for Leaflet's `CRS.Simple` with an explicit Y-axis inversion and calibrated world extent
to achieve aligned map imagery, overlays, and markers,
accepting that the map is non-geographic and must retain its calibrated extent.

## Geometry

### Polygon union and intersection

In the context of satisfying each resource condition by any matching node,
facing overlapping and disconnected acceptable regions,
we decided for 64-segment circle polygons unioned per condition and intersected with `polygon-clipping`
to achieve real multi-region geometry,
accepting a small circle approximation.

### Clipping-free contributing-node detection

In the context of highlighting nodes that overlap the final valid area,
facing numerical and performance risks when clipping every node disk against a complex multipolygon,
we decided for point-in-area and point-to-segment tests with bounding-box prefilters
to achieve predictable results,
accepting custom geometry code for this secondary calculation.

## Testing

### Real-data regression tests

In the context of validating the geometry engine against synthetic fixtures,
facing failures that only appear in the full upstream dataset,
we decided for representative searches over normalized real data
to achieve protection against clipping and performance regressions,
accepting a slower suite and assertions that must be updated when the data intentionally changes.

## Delivery

### Check-gated GitHub Pages deployment

In the context of publishing a static application from `main`,
facing the risk of deploying a commit that fails quality checks,
we decided for a deployment workflow that runs the full check suite before publishing the Pages artifact
to achieve a simple release path,
accepting that pull-request validation requires separate CI configuration.
