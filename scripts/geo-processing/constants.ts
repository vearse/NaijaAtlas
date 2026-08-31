/** Geopolitical zone definitions */
export const REGIONS = [
  {
    id: "NG-NC",
    name: "North Central",
    color: "#6366f1",
    states: [
      "Benue",
      "Kogi",
      "Kwara",
      "Nasarawa",
      "Niger",
      "Plateau",
      "Federal Capital Territory",
    ],
  },
  {
    id: "NG-NE",
    name: "North East",
    color: "#8b5cf6",
    states: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  },
  {
    id: "NG-NW",
    name: "North West",
    color: "#a855f7",
    states: [
      "Jigawa",
      "Kaduna",
      "Kano",
      "Katsina",
      "Kebbi",
      "Sokoto",
      "Zamfara",
    ],
  },
  {
    id: "NG-SE",
    name: "South East",
    color: "#10b981",
    states: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  },
  {
    id: "NG-SS",
    name: "South South",
    color: "#06b6d4",
    states: [
      "Akwa Ibom",
      "Bayelsa",
      "Cross River",
      "Delta",
      "Edo",
      "Rivers",
    ],
  },
  {
    id: "NG-SW",
    name: "South West",
    color: "#f59e0b",
    states: ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"],
  },
] as const;

/** Two-letter state codes for internal IDs */
export const STATE_CODES: Record<string, string> = {
  Abia: "AB",
  Adamawa: "AD",
  "Akwa Ibom": "AK",
  Anambra: "AN",
  Bauchi: "BA",
  Bayelsa: "BY",
  Benue: "BE",
  Borno: "BO",
  "Cross River": "CR",
  Delta: "DE",
  Ebonyi: "EB",
  Edo: "ED",
  Ekiti: "EK",
  Enugu: "EN",
  "Federal Capital Territory": "FC",
  Gombe: "GO",
  Imo: "IM",
  Jigawa: "JI",
  Kaduna: "KD",
  Kano: "KN",
  Katsina: "KT",
  Kebbi: "KE",
  Kogi: "KO",
  Kwara: "KW",
  Lagos: "LA",
  Nasarawa: "NA",
  Niger: "NI",
  Ogun: "OG",
  Ondo: "ON",
  Osun: "OS",
  Oyo: "OY",
  Plateau: "PL",
  Rivers: "RI",
  Sokoto: "SO",
  Taraba: "TA",
  Yobe: "YO",
  Zamfara: "ZA",
};

export const NAME_ALIASES: Record<string, string> = {
  fct: "Federal Capital Territory",
  abuja: "Federal Capital Territory",
  "federal capital territory": "Federal Capital Territory",
  nassarawa: "Nasarawa",
};

export function normalizeName(name: string): string {
  let n = name.trim().toLowerCase().replace(/\s+/g, " ");
  n = n.replace(/\blga\b/g, "").replace(/\blocal government area\b/g, "").trim();
  // Fix common SALB data typos
  n = n.replace(/akwa lbom/g, "akwa ibom");
  if (NAME_ALIASES[n]) return NAME_ALIASES[n];
  for (const canonical of Object.keys(STATE_CODES)) {
    if (canonical.toLowerCase() === n) return canonical;
  }
  return name.trim();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getRegionForState(stateName: string): (typeof REGIONS)[number] | undefined {
  const normalized = normalizeName(stateName);
  return REGIONS.find((r) =>
    r.states.some((s) => normalizeName(s) === normalized)
  );
}

export function stateId(stateName: string): string {
  const normalized = normalizeName(stateName);
  const code = STATE_CODES[normalized];
  if (!code) throw new Error(`Unknown state: ${stateName}`);
  return `NG-${code}`;
}

export function lgaId(stateName: string, lgaName: string): string {
  return `${stateId(stateName)}-${slugify(lgaName).toUpperCase().slice(0, 20).replace(/-/g, "")}`;
}
