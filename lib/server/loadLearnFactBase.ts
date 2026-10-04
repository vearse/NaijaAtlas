import fs from "fs";
import path from "path";
import { loadStateFacts } from "@/lib/server/stateFacts";
import type {
  QuizFactBase,
  QuizLgaFacts,
  QuizStateFacts,
} from "@/lib/learn/factBase";

function loadJson<T>(root: string, rel: string, fallback: T): T {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" || t === "—" ? null : t;
}

function year(v: unknown): number | null {
  const m = String(v ?? "").match(/\b(1[89]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : null;
}

function yesNo(v: unknown): boolean | null {
  const t = text(v)?.toLowerCase();
  return t === "yes" ? true : t === "no" ? false : null;
}

function list(v: unknown, sep: RegExp): string[] {
  if (Array.isArray(v)) return v.map(text).filter((x): x is string => !!x);
  const t = text(v);
  return t ? t.split(sep).map((s) => s.trim()).filter(Boolean) : [];
}

type StateRow = { id: string; slug: string; name: string; regionId: string; regionName: string; lgaCount: number };
type RegionRow = { id: string; name: string; color: string; stateIds: string[] };
type LgaRow = { id: string; name: string; parentId: string; wardCount?: number; areaKm2?: number | null };
type GeneralRow = Record<string, unknown>;
type LgaGeneralRow = Record<string, unknown>;
type GovernanceRow = { governor?: { name?: string; party?: string } };

/** Builds the quiz fact base from the same registries the hubs read. */
export function loadLearnFactBase(root = process.cwd()): QuizFactBase {
  const states = loadJson<StateRow[]>(root, "data/locations/states.json", []);
  const regions = loadJson<RegionRow[]>(root, "data/locations/regions.json", []);
  const lgaRows = loadJson<LgaRow[]>(root, "data/locations/lgas.json", []);
  const general = loadJson<Record<string, GeneralRow>>(root, "data/compare/states/general.json", {});
  const geography = loadJson<Record<string, GeneralRow>>(root, "data/compare/states/geography.json", {});
  const governance = loadJson<Record<string, GovernanceRow>>(
    root,
    "data/compare/states/governance/2023-2027.json",
    {}
  );
  const lgaGeneral = loadJson<Record<string, LgaGeneralRow>>(root, "data/compare/lgas/general.json", {});
  const country = loadJson<Record<string, GeneralRow>>(root, "data/compare/country/general.json", {}).NG ?? {};
  const facts = loadStateFacts(root);

  const idByName = new Map(states.map((s) => [s.name.toLowerCase(), s.id]));
  idByName.set("nasarawa", "NG-NA");
  idByName.set("fct", "NG-FC");
  idByName.set("abuja", "NG-FC");

  const quizStates: QuizStateFacts[] = states.map((s) => {
    const g = general[s.id] ?? {};
    const geo = geography[s.id] ?? {};
    const gov = governance[s.id]?.governor;
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      zoneId: s.regionId,
      zoneName: s.regionName,
      capital: text(g.capital) ?? facts[s.id]?.capital ?? null,
      nickname: text(g.nickname),
      yearCreated: year(g.yearCreated),
      majorCities: list(g.majorCities, /;/),
      languages: list(g.languages, /;/),
      landAreaKm2: facts[s.id]?.landAreaKm2 ?? null,
      population: facts[s.id]?.population ?? null,
      lgaCount: s.lgaCount,
      borderingStateIds: list(geo.borderingStates, /·|;|,/)
        .map((n) => idByName.get(n.toLowerCase()))
        .filter((x): x is string => !!x),
      hasCoastline: yesNo(geo.hasCoastline),
      hasIntlBorder: yesNo(geo.hasIntlBorder),
      largestLga: text(geo.largestLga),
      smallestLga: text(geo.smallestLga),
      governor: text(gov?.name),
      governorParty: text(gov?.party),
    };
  });

  const lgas: QuizLgaFacts[] = lgaRows.map((l) => {
    const g = lgaGeneral[l.id] ?? {};
    return {
      id: l.id,
      name: l.name,
      stateId: l.parentId,
      headquarters: text(g.headquarters),
      yearCreated: year(g.yearCreated),
      nickname: text(g.nickname),
      majorTowns: list(g.majorTowns, /;/),
      landmarks: list(g.landmarks, /;/),
      areaKm2: typeof l.areaKm2 === "number" && l.areaKm2 > 0 ? l.areaKm2 : null,
      wardCount: typeof l.wardCount === "number" && l.wardCount > 0 ? l.wardCount : null,
    };
  });

  return {
    country: {
      officialName: text(country.officialName),
      capital: text(country.capital),
      independence: text(country.independence),
      currency: text(country.currency),
      timezone: text(country.timezone),
      callingCode: text(country.callingCode),
      lgaTotal: Math.max(Object.keys(lgaGeneral).length, lgas.length),
    },
    zones: regions.map((r) => ({ id: r.id, name: r.name, color: r.color, stateIds: r.stateIds })),
    states: quizStates,
    lgas,
  };
}
