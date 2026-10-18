import L from 'leaflet';
import type { Condition, ResourceNode } from '../data/model';
import type { MultiPolygon } from '../geometry/types';
import {
  AREA_FILL_COLOR,
  AREA_STROKE_COLOR,
  conditionColor,
} from '../shared/colors';
import { formatWorldCoordinate } from '../shared/format';
import { capitalize, escapeHtml } from '../shared/text';
import { worldBounds, worldToLeaflet } from './projection';
import 'leaflet/dist/leaflet.css';

const MAP_MIN_ZOOM = -3;
const MAP_MAX_ZOOM = 2;
const NODE_RADIUS_PIXELS = 7;

export class WorldMap {
  private readonly map: L.Map;
  private readonly resultLayer = L.layerGroup();
  private readonly nodeLayer = L.layerGroup();
  private readonly circleLayer = L.layerGroup();
  private readonly bounds: L.LatLngBoundsExpression = worldBounds();
  private showCircles = false;

  constructor(
    element: HTMLElement,
    onCoordinate: (x: number, y: number) => void,
  ) {
    element.textContent = '';
    this.map = L.map(element, {
      crs: L.CRS.Simple,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      attributionControl: false,
      zoomControl: true,
    });
    L.imageOverlay(
      `${import.meta.env.BASE_URL}assets/Map-HQ.avif`,
      this.bounds,
      { alt: 'Satisfactory world map' },
    ).addTo(this.map);
    L.control.scale({ metric: true, imperial: false }).addTo(this.map);
    this.map.fitBounds(this.bounds);
    this.map.setMaxBounds(this.bounds);

    const reportCoordinate = (event: L.LeafletMouseEvent) =>
      onCoordinate(Math.round(event.latlng.lng), Math.round(-event.latlng.lat));
    this.map.on('mousemove', reportCoordinate);
    this.map.on('click', reportCoordinate);
  }

  reset(): void {
    this.map.fitBounds(this.bounds);
  }

  setCircleVisibility(visible: boolean): void {
    this.showCircles = visible;
    if (visible) this.circleLayer.addTo(this.map);
    else this.map.removeLayer(this.circleLayer);
  }

  clearResults(): void {
    this.resultLayer.clearLayers();
    this.nodeLayer.clearLayers();
    this.circleLayer.clearLayers();
  }

  destroy(): void {
    this.map.remove();
  }

  render(
    area: MultiPolygon,
    contributing: ResourceNode[],
    conditions: Condition[],
    contributions: ReadonlyMap<string, number[]>,
  ): void {
    this.clearResults();
    if (!area.length) return;

    for (const polygon of area) {
      const rings = polygon.map((ring) => ring.map(worldToLeaflet));
      L.polygon(rings, {
        color: AREA_STROKE_COLOR,
        weight: 2,
        fillColor: AREA_FILL_COLOR,
        fillOpacity: 0.3,
        interactive: false,
      }).addTo(this.resultLayer);
    }
    this.resultLayer.addTo(this.map);

    for (const node of contributing) {
      const conditionIndices = contributions.get(node.id) ?? [];
      const colors = conditionIndices.map(conditionColor);
      const marker = L.circleMarker([-node.y, node.x], {
        radius: NODE_RADIUS_PIXELS,
        weight: 2,
        color: colors[0] ?? AREA_STROKE_COLOR,
        fillColor: colors[0] ?? AREA_STROKE_COLOR,
        fillOpacity: 0.95,
      });
      marker.bindPopup(this.popupFor(node, conditionIndices, conditions));
      marker.addTo(this.nodeLayer);

      for (const conditionIndex of conditionIndices) {
        const condition = conditions[conditionIndex];
        if (!condition) continue;
        L.circle([-node.y, node.x], {
          radius: condition.distance,
          color: conditionColor(conditionIndex),
          weight: 1,
          dashArray: '4 4',
          fill: false,
          interactive: false,
        }).addTo(this.circleLayer);
      }
    }

    this.nodeLayer.addTo(this.map);
    if (this.showCircles) this.circleLayer.addTo(this.map);
  }

  private popupFor(
    node: ResourceNode,
    conditionIndices: number[],
    conditions: Condition[],
  ): string {
    const matches = conditionIndices
      .map((index) => {
        const condition = conditions[index];
        if (!condition) return '';
        return `<br>Condition ${index + 1}: ${escapeHtml(condition.resource)} · ${condition.purities.map(capitalize).join(', ')}`;
      })
      .join('');

    return [
      `<strong>${escapeHtml(node.resource)}</strong>`,
      `Purity: ${capitalize(node.purity)}`,
      `Coordinates: X ${formatWorldCoordinate(node.x)} m, Y ${formatWorldCoordinate(node.y)} m`,
      '',
      `Matches:${matches}`,
    ].join('<br>');
  }
}
