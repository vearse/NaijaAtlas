/**
 * One-off alignment of power.json with NERC Q4 2025 grid-connected fleet (28 plants, 13,625 MW).
 * Run: node scripts/patch-economy-power-catalog.mjs
 */
import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "data/overlays/catalog/power.json");
const rows = JSON.parse(fs.readFileSync(file, "utf8"));

const NERC = {
  sourceUrl: "https://nerc.gov.ng/wp-content/uploads/2026/04/2025_Q4-Report.pdf",
  sourceAccessDate: "2026-04-29",
  lastVerified: "2026-04-29",
};

function patchPlant(id, patch) {
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`Missing plant ${id}`);
  rows[i] = { ...rows[i], ...patch, ...NERC };
}

for (const r of rows) {
  if (r.featureKind !== "power-plant") continue;
  if (!r.inventoryGroup) {
    r.inventoryGroup =
      r.gridConnected === false ? "regional-off-grid" : "grid-connected";
  }
  if (r.capacityMw === 0 && r.gridConnected === false) {
    r.inventoryGroup = "dam-non-power";
  }
}

patchPlant("plant-obudu", {
  inventoryGroup: "regional-off-grid",
  gridConnected: false,
  capacityMw: null,
  capacityUnverified: true,
  summary:
    "Small hydro scheme at Obudu Dam, Cross River State (installed capacity not verified in NERC reports).",
  description:
    "Obudu Dam on the Cross River system supports local supply and tourism on the Obudu Plateau. It is not listed among NERC’s grid-connected generators and is treated here as a regional off-grid scheme.",
  highlights: ["Obudu Plateau", "Regional off-grid scheme", "Capacity unverified"],
});

patchPlant("plant-ikere", {
  inventoryGroup: "regional-off-grid",
  gridConnected: false,
  capacityMw: null,
  capacityUnverified: true,
  summary:
    "Hydro scheme at Ikere Gorge, Oyo State (installed capacity not verified in NERC reports).",
  description:
    "Ikere Gorge Dam impounds the Ogun River for downstream regulation. It is not reported as a grid-connected plant in NERC quarterly capacity tables.",
  highlights: ["Ogun River gorge", "Regional off-grid scheme", "Capacity unverified"],
});

patchPlant("plant-challawa", {
  inventoryGroup: "regional-off-grid",
  gridConnected: false,
  capacityMw: null,
  capacityUnverified: true,
  summary:
    "Challawa Gorge dam, Kano State — irrigation and basin management (generation capacity unverified).",
});

patchPlant("plant-tiga", {
  inventoryGroup: "regional-off-grid",
  gridConnected: false,
  capacityMw: null,
  capacityUnverified: true,
  summary:
    "Tiga Dam, Kano State — irrigation scheme with a small hydro plant (capacity unverified).",
});

for (const id of ["plant-goronyo", "plant-bakolori", "plant-asejire"]) {
  patchPlant(id, {
    inventoryGroup: "dam-non-power",
    gridConnected: false,
    capacityMw: null,
    plantCategory: "regional-hydro",
  });
}

patchPlant("plant-afam", {
  capacityMw: 1556,
  summary: "1,556 MW gas complex at Okoloma-Afam, Oyigbo, Rivers State (NERC: Afam_1, Afam_2, Rivers_1).",
  nercUnits: [
    { id: "Afam_1", capacityMw: 726, plantCategory: "gas-ocgt" },
    { id: "Afam_2", capacityMw: 650, plantCategory: "gas-ccgt" },
    { id: "Rivers_1", capacityMw: 180, plantCategory: "gas-ocgt" },
  ],
  highlights: [
    "Three NERC-listed blocks on one site",
    "Afam VI (Afam_2) combined cycle",
    "Not the single largest plant — Egbin is larger",
  ],
});

patchPlant("plant-egbin", {
  highlights: [
    "Largest grid-connected plant in Nigeria (NERC: Egbin_1)",
    "Six 220 MW steam units",
    "Head of the Lagos 330 kV ring",
  ],
});

patchPlant("plant-olorunsogo", {
  plantCategory: "gas-ccgt",
  type: "Open-cycle and combined-cycle gas complex",
  nercUnits: [
    { id: "Olorunsogo_1", capacityMw: 335, plantCategory: "gas-ocgt" },
    { id: "Olorunsogo_2", capacityMw: 750, plantCategory: "gas-ccgt" },
  ],
});

patchPlant("plant-omotosho", {
  nercUnits: [
    { id: "Omotosho_1", capacityMw: 335, plantCategory: "gas-ocgt" },
    { id: "Omotosho_2", capacityMw: 500, plantCategory: "gas-ocgt" },
  ],
});

patchPlant("plant-geregu", {
  nercUnits: [
    { id: "Geregu_1", capacityMw: 435, plantCategory: "gas-ocgt" },
    { id: "Geregu_2", capacityMw: 435, plantCategory: "gas-ocgt" },
  ],
});

patchPlant("plant-sapele", {
  nercUnits: [
    { id: "Sapele Steam_1", capacityMw: 720, plantCategory: "steam" },
    { id: "Sapele_2", capacityMw: 500, plantCategory: "gas-ocgt" },
  ],
});

patchPlant("plant-ughelli", {
  name: "Ughelli Power Station (Delta GS)",
  nercUnits: [{ id: "Delta_1", capacityMw: 900, plantCategory: "gas-ocgt" }],
});

// Replace combined Ihovbor with NERC split: Ihovbor_1 + Ihovbor_2 (Azura)
const ihIdx = rows.findIndex((r) => r.id === "plant-ihovbor");
if (ihIdx < 0) throw new Error("plant-ihovbor missing");
const ihOld = rows[ihIdx];
rows.splice(ihIdx, 1, {
  id: "plant-ihovbor-nipp",
  name: "Ihovbor NIPP (Benin I)",
  featureKind: "power-plant",
  plantCategory: "gas-ocgt",
  inventoryGroup: "grid-connected",
  type: "Gas turbine power station (NIPP)",
  summary: "500 MW open-cycle NIPP block at Ihovbor, Benin City, Edo State (NERC: Ihovbor_1).",
  description:
    "National Integrated Power Project open-cycle block at Ihovbor, reported separately from the Azura-Edo IPP on the same corridor. Fed from the Escravos–Lagos pipeline system.",
  capacityMw: 500,
  units: "500 MW NIPP block (Ihovbor_1)",
  commissioned: "2012-2013",
  operator: "Benin Generation Company Ltd",
  statesCrossed: ["Edo"],
  lon: ihOld.lon,
  lat: ihOld.lat,
  highlights: ["NERC Ihovbor_1", "NIPP open-cycle block", "Benin North grid node"],
  gridConnected: true,
  gridConnectedNote: "Grid-connected generating station.",
  nercUnits: [{ id: "Ihovbor_1", capacityMw: 500, plantCategory: "gas-ocgt" }],
  ...NERC,
  gemUrl: "https://www.gem.wiki/Ihovbor_power_station",
});

rows.splice(ihIdx + 1, 0, {
  id: "plant-azura-edo",
  name: "Azura-Edo IPP",
  featureKind: "power-plant",
  plantCategory: "gas-ccgt",
  inventoryGroup: "grid-connected",
  type: "Independent power project (combined cycle)",
  summary: "461 MW combined-cycle IPP at Ihovbor, Benin City, Edo State (NERC: Ihovbor_2).",
  description:
    "Azura-Edo Power Plant is a grid-connected independent power project on the Ihovbor site, listed in NERC reports as Ihovbor_2 with 461 MW installed capacity.",
  capacityMw: 461,
  units: "461 MW combined cycle (Ihovbor_2)",
  commissioned: "2018",
  operator: "Azura-Edo Power Plant Ltd",
  statesCrossed: ["Edo"],
  lon: 5.69,
  lat: 6.41,
  highlights: ["461 MW IPP", "NERC Ihovbor_2", "Escravos–Lagos gas supply"],
  gridConnected: true,
  gridConnectedNote: "Grid-connected generating station.",
  nercUnits: [{ id: "Ihovbor_2", capacityMw: 461, plantCategory: "gas-ccgt" }],
  ...NERC,
  wikiUrl: "https://en.wikipedia.org/wiki/Azura-Edo_Power_Plant",
});

if (!rows.some((r) => r.id === "plant-ikeja-hydro")) {
  const jebba = rows.find((r) => r.id === "plant-jebba");
  rows.splice(
    rows.findIndex((r) => r.id === "plant-jebba") + 1,
    0,
    {
      id: "plant-ikeja-hydro",
      name: "Ikeja Hydroelectric Station",
      featureKind: "power-plant",
      plantCategory: "regional-hydro",
      inventoryGroup: "grid-connected",
      type: "Small hydroelectric station",
      summary: "110 MW hydro plant on the Kainji cascade (NERC: Ikeja_1).",
      description:
        "Listed in NERC’s grid-connected fleet as Ikeja_1 with 110 MW installed capacity, associated with the Kainji–Jebba cascade development.",
      capacityMw: 110,
      commissioned: "1990s",
      operator: "Mainstream Energy Solutions Ltd",
      riverName: "Niger River",
      statesCrossed: ["Niger"],
      lon: jebba?.lon ?? 4.79,
      lat: jebba?.lat ?? 9.14,
      highlights: ["110 MW (NERC Ikeja_1)", "Kainji cascade", "Grid-connected hydro"],
      gridConnected: true,
      gridConnectedNote: "Feeds the national grid.",
      nercUnits: [{ id: "Ikeja_1", capacityMw: 110, plantCategory: "regional-hydro" }],
      ...NERC,
    }
  );
}

if (!rows.some((r) => r.id === "plant-igbafo")) {
  rows.push({
    id: "plant-igbafo",
    name: "Igbafo Power Station",
    featureKind: "power-plant",
    plantCategory: "gas-ocgt",
    inventoryGroup: "grid-connected",
    type: "Gas turbine power station",
    summary: "45 MW grid-connected gas plant (NERC: Igbafo_1).",
    description:
      "Small thermal plant listed in NERC quarterly reports as Igbafo_1 with 45 MW installed capacity.",
    capacityMw: 45,
    units: "45 MW open cycle",
    operator: "Private operator (NERC market operator reports)",
    statesCrossed: ["Ogun"],
    lon: 3.35,
    lat: 6.85,
    highlights: ["45 MW (NERC Igbafo_1)", "Grid-connected thermal"],
    gridConnected: true,
    gridConnectedNote: "Grid-connected generating station.",
    nercUnits: [{ id: "Igbafo_1", capacityMw: 45, plantCategory: "gas-ocgt" }],
    ...NERC,
  });
}

for (const r of rows) {
  if (r.featureKind === "power-plant" && r.inventoryGroup === "grid-connected") {
    if (!r.sourceUrl) Object.assign(r, NERC);
  }
}

fs.writeFileSync(file, JSON.stringify(rows, null, 2) + "\n");
console.log("Patched", file);
