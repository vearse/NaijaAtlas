/**
 * Open an overlay catalog item on the map — same outcome as clicking the marker:
 * enable layer, fly to feature, show OverlayFeaturePanel with full catalog props.
 */
import citiesCatalog from "@/data/overlays/catalog/cities.json";
import tourCatalog from "@/data/overlays/catalog/tour.json";
import landformsCatalog from "@/data/overlays/catalog/landforms.json";
import resourcesCatalog from "@/data/overlays/catalog/resources.json";
import lakesCatalog from "@/data/overlays/catalog/lakes.json";
import type { Map as MaplibreMap } from "maplibre-gl";
import { useMapStore } from "@/lib/store/mapStore";
import { buildCityOverlayFeature } from "@/lib/map/cityCoordsLookup";
import { OVERLAY_REGISTRY } from "@/lib/map/overlayRegistry";
import type { SelectedOverlayFeature, OverlayLayerId } from "@/types/overlay";
import type { StateOverlayItem } from "@/lib/lenses/stateOverlayItems";

type CatalogRow = Record<string, unknown>;

function flattenCatalogRow(row: CatalogRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = Array.isArray(value) ? JSON.stringify(value) : value;
  }
  return out;
}

function findCatalogRow(item: StateOverlayItem): CatalogRow | null {
  const id = item.id;
  const pools: unknown[] = [
    citiesCatalog,
    tourCatalog,
    landformsCatalog,
    resourcesCatalog,
    lakesCatalog,
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    const row = pool.find(
      (r) => typeof r === "object" && r !== null && (r as CatalogRow).id === id
    );
    if (row) return row as CatalogRow;
  }
  return null;
}

function tourRowToProperties(row: CatalogRow): Record<string, unknown> {
  return {
    layerId: "cities",
    kind: "cities",
    isTour: true,
    id: row.id,
    name: row.name,
    category: row.category ?? "tour",
    stateName: row.stateName,
    stateId: row.stateId,
    lon: row.lon,
    lat: row.lat,
    nickname: row.nickname,
    founded: row.established,
    summary: row.summary,
    description: row.description,
    populationNote: row.visitorNote,
    significance: row.significance,
    climate: row.climate,
    landmarks: Array.isArray(row.landmarks)
      ? JSON.stringify(row.landmarks)
      : row.landmarks,
    highlights: Array.isArray(row.highlights)
      ? JSON.stringify(row.highlights)
      : row.highlights,
    wikiUrl: row.wikiUrl,
  };
}

function buildFeatureFromItem(item: StateOverlayItem): SelectedOverlayFeature {
  const layerId = item.layerId;

  if (item.section === "places") {
    const row = findCatalogRow(item);
    const props = row ? tourRowToProperties(row) : flattenCatalogRow({
      id: item.id,
      name: item.name,
      category: item.category,
      summary: item.summary,
      wikiUrl: item.wikiUrl,
      lon: item.lon,
      lat: item.lat,
      isTour: true,
      layerId: "cities",
      kind: "cities",
    });
    const geometry: GeoJSON.Point | null =
      item.lon != null && item.lat != null
        ? { type: "Point", coordinates: [item.lon, item.lat] }
        : null;
    return {
      id: item.id,
      layerId: "cities",
      name: item.name,
      properties: props,
      geometry,
    };
  }

  if (layerId === "cities") {
    const fromCity = buildCityOverlayFeature(item.name);
    if (fromCity && (fromCity.id === item.id || fromCity.name === item.name)) {
      return fromCity;
    }
  }

  const row = findCatalogRow(item);
  const props: Record<string, unknown> = row
    ? {
        layerId,
        kind: layerId,
        ...flattenCatalogRow(row),
      }
    : {
        layerId,
        kind: layerId,
        id: item.id,
        name: item.name,
        category: item.category,
        summary: item.summary,
        wikiUrl: item.wikiUrl,
        lon: item.lon,
        lat: item.lat,
      };

  if (layerId === "landforms" && row) {
    props.featureKind = row.featureKind ?? "point";
    props.landformType = row.landformType ?? item.category;
  }

  if (layerId === "resources" && row?.resourceType) {
    props.resourceType = row.resourceType;
  }

  const lon =
    typeof row?.lon === "number"
      ? row.lon
      : item.lon != null
        ? item.lon
        : null;
  const lat =
    typeof row?.lat === "number"
      ? row.lat
      : item.lat != null
        ? item.lat
        : null;

  const geometry: GeoJSON.Geometry | null =
    lon != null && lat != null
      ? { type: "Point", coordinates: [lon, lat] }
      : null;

  return {
    id: item.id,
    layerId,
    name: item.name,
    properties: props,
    geometry,
  };
}

function syncFromRenderedMap(
  map: MaplibreMap,
  layerId: OverlayLayerId,
  lon: number,
  lat: number,
  fallback: SelectedOverlayFeature
): SelectedOverlayFeature {
  const layers = OVERLAY_REGISTRY[layerId].interactiveLayerIds.filter((id) =>
    map.getLayer(id)
  );
  if (!layers.length) return fallback;

  const hits = map.queryRenderedFeatures(map.project([lon, lat]), { layers });
  if (!hits.length) return fallback;

  const hit = hits[0];
  const props = (hit.properties ?? {}) as Record<string, unknown>;
  const hitId = String(props.id ?? fallback.id);
  const hitName = String(props.name ?? fallback.name);

  return {
    id: hitId,
    layerId,
    name: hitName,
    properties: props,
    geometry: hit.geometry ?? fallback.geometry,
  };
}

export function openStateOverlayItemOnMap(item: StateOverlayItem): void {
  const store = useMapStore.getState();
  let layerId = item.layerId;
  if (item.section === "places") layerId = "cities";

  if (!store.activeOverlays.has(layerId)) {
    store.toggleOverlay(layerId);
  }

  const feature = buildFeatureFromItem(item);
  store.setSelectedOverlay(feature);

  const map = store.mapInstance;
  const coords =
    feature.geometry?.type === "Point"
      ? (feature.geometry.coordinates as [number, number])
      : item.lon != null && item.lat != null
        ? ([item.lon, item.lat] as [number, number])
        : null;

  if (!map || !coords) return;

  const zoomTarget = layerId === "landforms" ? 6.5 : 7.5;

  map.flyTo({
    center: coords,
    zoom: Math.max(map.getZoom() ?? 5, zoomTarget),
    speed: 0.9,
  });

  const enrich = () => {
    const live = useMapStore.getState().mapInstance;
    if (!live) return;
    const synced = syncFromRenderedMap(
      live,
      layerId,
      coords[0],
      coords[1],
      feature
    );
    if (synced.id !== feature.id || synced.properties !== feature.properties) {
      useMapStore.getState().setSelectedOverlay(synced);
    }
  };

  map.once("idle", enrich);
  window.setTimeout(enrich, 600);
}
