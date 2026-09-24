/**
 * Generates party SVG icons and enriches politics candidate JSON with icon paths.
 * Run: node scripts/politics/sync-party-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");

const partiesPath = path.join(root, "data/politics/parties.json");
const partiesDoc = JSON.parse(fs.readFileSync(partiesPath, "utf-8"));
const partyMap = partiesDoc.parties;

const BRAND_COLORS = {
  APC: "#008751",
  PDP: "#d32f2f",
  LP: "#e11d48",
  NNPP: "#2563eb",
  APGA: "#7c3aed",
  ADC: "#0d9488",
  SDP: "#f59e0b",
  PRP: "#dc2626",
  AAC: "#be123c",
  YPP: "#4f46e5",
  NDC: "#059669",
  NRM: "#0891b2",
  NDP: "#9333ea",
  APM: "#ca8a04",
  ADP: "#0369a1",
  APP: "#65a30d",
  AA: "#c2410c",
  BP: "#475569",
  DLA: "#0f766e",
  ZLP: "#db2777",
  Accord: "#16a34a",
  A: "#64748b",
  YP: "#8b5cf6",
};

function colorFor(code) {
  if (BRAND_COLORS[code]) return BRAND_COLORS[code];
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 55% 42%)`;
}

function partySvg(code) {
  const fill = colorFor(code);
  const label =
    code.length <= 4 ? code : code.slice(0, 4);
  const fontSize = label.length >= 4 ? 11 : label.length === 3 ? 13 : 15;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="${code} party">
  <rect width="64" height="64" rx="14" fill="${fill}"/>
  <text x="32" y="38" text-anchor="middle" fill="#ffffff" font-family="system-ui,Arial,sans-serif" font-size="${fontSize}" font-weight="700">${label}</text>
</svg>
`;
}

function iconForPartyCode(code) {
  const entry = partyMap[code];
  if (entry?.icon) return entry.icon;
  const safe = code.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `/politics/parties/${safe}.svg`;
}

const iconDir = path.join(root, "public/politics/parties");
fs.mkdirSync(iconDir, { recursive: true });

for (const code of Object.keys(partyMap)) {
  const safe = code.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outPath = path.join(iconDir, `${safe}.svg`);
  fs.writeFileSync(outPath, partySvg(code));
}

function enrichPresidential(filePath) {
  const doc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  for (const ticket of doc.candidates ?? []) {
    const abbr = ticket.party?.abbreviation;
    if (!abbr) continue;
    const meta = partyMap[abbr];
    ticket.party.icon = meta?.icon ?? iconForPartyCode(abbr);
    if (meta?.name && !ticket.party.name) {
      ticket.party.name = meta.name;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
}

function enrichSenate(filePath) {
  const races = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  for (const race of races) {
    for (const c of race.candidates ?? []) {
      c.party_icon = iconForPartyCode(c.party);
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(races, null, 2) + "\n");
}

function enrichReps(filePath) {
  const races = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  for (const race of races) {
    for (const c of race.candidates ?? []) {
      c.party_icon = iconForPartyCode(c.party);
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(races, null, 2) + "\n");
}

enrichPresidential(
  path.join(root, "data/politics/candidate/2027/presidential_candidates.json")
);
enrichSenate(
  path.join(root, "data/politics/candidate/2027/seneate/senate.json")
);
enrichReps(
  path.join(root, "data/politics/candidate/2027/representative/reps.json")
);

console.log(
  `✓ Party icons: ${Object.keys(partyMap).length} SVGs in public/politics/parties/; enriched presidential, senate, reps JSON`
);
