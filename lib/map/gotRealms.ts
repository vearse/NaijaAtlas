import type { Map as MaplibreMap } from "maplibre-gl";

export const GOT_OFF = "__off__";

export interface GotRealm {
  id: string;
  gotName: string;
  nigeriaTerritory: string;
  interpretation: string;
  stateIds: string[];
  color: string;
}

/** Temporary easter-egg lens — interpretive mapping, not official zones. */
export const GOT_REALMS: GotRealm[] = [
  {
    id: "kings-landing",
    gotName: "King's Landing",
    nigeriaTerritory: "Abuja (FCT)",
    interpretation:
      "The seat of power; control of the federal government",
    stateIds: ["NG-FC"],
    color: "#b91c1c",
  },
  {
    id: "the-north",
    gotName: "The North / Winterfell",
    nigeriaTerritory: "North-West",
    interpretation:
      "Historical institutions, population and political influence",
    stateIds: [
      "NG-JI",
      "NG-KD",
      "NG-KN",
      "NG-KT",
      "NG-KE",
      "NG-SO",
      "NG-ZA",
    ],
    color: "#64748b",
  },
  {
    id: "westerlands",
    gotName: "The Westerlands",
    nigeriaTerritory: "South-West",
    interpretation:
      "Economic strength, commerce and political sophistication",
    stateIds: ["NG-EK", "NG-LA", "NG-OG", "NG-ON", "NG-OY", "NG-OS"],
    color: "#ca8a04",
  },
  {
    id: "the-vale",
    gotName: "The Vale",
    nigeriaTerritory: "Plateau / Adamawa Highlands",
    interpretation:
      "Geographical strongholds and distinctive regional identities",
    stateIds: ["NG-PL", "NG-AD"],
    color: "#38bdf8",
  },
  {
    id: "riverlands",
    gotName: "The Riverlands",
    nigeriaTerritory: "North-Central / Middle Belt",
    interpretation:
      "Strategic territory, agricultural importance and ethnic diversity",
    stateIds: ["NG-BE", "NG-KO", "NG-KW", "NG-NA", "NG-NI"],
    color: "#22c55e",
  },
  {
    id: "the-reach",
    gotName: "The Reach",
    nigeriaTerritory:
      "Akwa Ibom / Cross River and adjoining agricultural areas",
    interpretation: "Natural wealth, agriculture and economic potential",
    stateIds: ["NG-AK", "NG-CR"],
    color: "#a3e635",
  },
  {
    id: "dorne",
    gotName: "Dorne",
    nigeriaTerritory: "South-East",
    interpretation:
      "Regional identity, historical grievances and political autonomy",
    stateIds: ["NG-AB", "NG-AN", "NG-EB", "NG-EN", "NG-IM"],
    color: "#f97316",
  },
  {
    id: "iron-islands",
    gotName: "The Iron Islands",
    nigeriaTerritory: "Niger Delta (Bayelsa, Rivers, Delta)",
    interpretation: "Oil wealth, resource control and regional resistance",
    stateIds: ["NG-BY", "NG-RI", "NG-DE"],
    color: "#1e293b",
  },
  {
    id: "stormlands",
    gotName: "The Stormlands",
    nigeriaTerritory: "North-East",
    interpretation:
      "Security, strategic borders and military significance",
    stateIds: ["NG-BA", "NG-BO", "NG-GO", "NG-TA", "NG-YO"],
    color: "#6366f1",
  },
];

export function getGotRealm(id: string | null): GotRealm | null {
  if (!id || id === GOT_OFF) return null;
  return GOT_REALMS.find((realm) => realm.id === id) ?? null;
}

const REALM_BY_STATE_ID: Record<string, GotRealm> = {};
for (const realm of GOT_REALMS) {
  for (const stateId of realm.stateIds) {
    if (!REALM_BY_STATE_ID[stateId]) {
      REALM_BY_STATE_ID[stateId] = realm;
    }
  }
}

export function gotRealmForState(stateId: string): GotRealm | null {
  return REALM_BY_STATE_ID[stateId] ?? null;
}

function matchStateFills(
  fills: Record<string, string>,
  fallback: string
): unknown[] | string {
  const ids = Object.keys(fills);
  if (ids.length === 0) return fallback;
  const pairs: unknown[] = [];
  for (const id of ids) {
    pairs.push(id, fills[id]);
  }
  return ["match", ["get", "id"], ...pairs, fallback];
}

export function applyGotRealmPaint(
  map: MaplibreMap,
  activeRealmId: string | null
): boolean {
  const active = getGotRealm(activeRealmId);
  if (!active) return false;
  if (!map.getLayer("states-fill")) return false;

  const mappedIds = Object.keys(REALM_BY_STATE_ID);
  const focusIds = active.stateIds;

  const focusFills = Object.fromEntries(
    focusIds.map((id) => [id, REALM_BY_STATE_ID[id]?.color ?? active.color])
  );
  const backdropFills = Object.fromEntries(
    mappedIds
      .filter((id) => !focusIds.includes(id))
      .map((id) => [id, REALM_BY_STATE_ID[id].color])
  );

  map.setPaintProperty("states-fill", "fill-color", [
    "case",
    ["in", ["get", "id"], ["literal", [...focusIds]]],
    matchStateFills(focusFills, active.color),
    ["in", ["get", "id"], ["literal", mappedIds]],
    matchStateFills(backdropFills, "#cbd5e1"),
    "#e2e8f0",
  ]);

  map.setPaintProperty("states-fill", "fill-opacity", [
    "case",
    ["in", ["get", "id"], ["literal", [...focusIds]]],
    0.62,
    ["in", ["get", "id"], ["literal", mappedIds]],
    0.28,
    0.14,
  ]);

  if (map.getLayer("states-line")) {
    map.setPaintProperty("states-line", "line-color", [
      "case",
      ["in", ["get", "id"], ["literal", [...focusIds]]],
      "#0f172a",
      "#94a3b8",
    ]);
    map.setPaintProperty("states-line", "line-width", [
      "case",
      ["in", ["get", "id"], ["literal", [...focusIds]]],
      2.5,
      1,
    ]);
  }

  return true;
}
