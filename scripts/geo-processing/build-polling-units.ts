import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { normalizeName, slugify, stateId } from "./constants";
import { ensureDir, projectRoot, writeJson } from "./shp-utils";

const JAY_DIR = projectRoot("data/locations/source/jaycodist");

/**
 * SALB / temikeezy LGA spellings → INEC LGA spellings (from the JayCodist
 * scrape). Needed because INEC uses its own spelling/parenthetical variants.
 */
const LGA_ALIASES: Record<string, string> = {
  "Abuja Municipal": "MUNICIPAL",
  Aiyedade: "AYEDAADE",
  Aiyedire: "AYEDIRE",
  "Ilesha East": "ILESA EAST",
  "Ilesha West": "ILESA WEST",
  Aleiro: "ALIERO",
  "Arewa-Dandi": "AREWA",
  Atigbo: "ATISBO",
  "Ogbomosho North": "OGBOMOSO NORTH",
  "Ogbomosho South": "OGBOMOSO SOUTH",
  Orelope: "OORELOPE",
  Bekwara: "BEKWARRA",
  "Calabar-Municipal": "CALABAR MUNICIPALITY",
  Biriniwa: "BIRNIWA",
  "Birni Kudu": "BIRNIN KUDU",
  "Kiri Kasamma": "KIRIKA SAMMA",
  Damban: "DAMBAM",
  Dambatta: "DANBATA",
  "Dawakin Kudu": "DAWAKI KUDU",
  "Dawakin Tofa": "DAWAKI TOFA",
  "Garum Mallam": "GARUN MALAM",
  Takali: "TAKAI",
  "Dange-Shnsi": "DANGE/SHUNI",
  Gawabawa: "GWADABAWA",
  "Sabon Birni": "S/BIRNI",
  Wamako: "WAMAKKO",
  Edati: "EDATTI",
  Muya: "MUNYA",
  Pailoro: "PAIKORO",
  "Efon-Alayee": "EFON",
  Gboyin: "GBONYIN",
  "Idosi-Osi": "IDO / OSI",
  Ilemeji: "ILEJEMEJE",
  "Esit Eket": "ESIT EKET (UQUO)",
  Ezinihitte: "EZINIHITTE MBAISE",
  "Ihitte/Uboma": "IHITTE/UBOMA (ISINWEKE)",
  Ikeduru: "IKEDURU (IHO)",
  "Isiala Mbano": "ISIALA MBANO (UMUELEMAI)",
  Isu: "ISU (UMUNDUGBA)",
  Mbaitoli: "MBAITOLI (NWAORIEUBI)",
  "Ngor-Okpala": "NGOR OKPALA (UMUNEKE)",
  Njaba: "NJABA (NNENASA)",
  Nwangele: "NWANGELE (ONU-NWANGELE AMAIGBO)",
  Obowo: "OBOWO (OTOKO)",
  Oguta: "OGUTA (OGUTA)",
  "Ohaji/Egbema": "OHAJI/EGBEMA (MMAHU-EGBEMA)",
  Okigwe: "OKIGWE (OKIGWE)",
  Orsu: "ORSU (AWO IDEMILI)",
  "Oru West": "ORU WEST (MGBIDI)",
  "Owerri North": "OWERRI NORTH (ORIE URATTA)",
  "Owerri West": "OWERRI WEST (UMUGUMA)",
  Unuimo: "ONUIMO (OKWE)",
  Ganaye: "GANYE",
  Gireri: "GIRE 1",
  Ihiala: "IHALA",
  "Ile-Oluji-Okeigbo": "ILEOLUJI/OKEIGBO",
  Isuikwato: "ISUIKWUATO",
  "Obi Nwa": "OBINGWA",
  "Osisioma Ngwa": "OSISIOMA",
  "Umu-Neochi": "UMU - NNEOCHI",
  Karasuwa: "KARASAWA",
  Tarmua: "TARMUWA",
  "Karin-Lamido": "KARIM-LAMIDO",
  Kogi: "KOGI . K. K.",
  "Mopa-Muro": "MOPA MORO",
  "Ogori/Mangongo": "OGORI MANGOGO",
  Olamabolo: "OLAMABORO",
  Maiduguri: "MAIDUGURI M. C.",
  Malumfashi: "MALUFASHI",
  Matazuu: "MATAZU",
  Markafi: "MAKARFI",
  "Zango-Kataf": "ZANGON KATAF",
  "Obia/Akpor": "OBIO/AKPOR",
  Omumma: "OMUMA",
  "Opobo/Nkoro": "OPOBO/NEKORO",
  "Ogun waterside": "OGUN WATER SIDE",
  Shagamu: "SAGAMU",
  Oturkpo: "OTUKPO",
  Pategi: "PATIGI",
  Shomgom: "SHONGOM",
  "Yamaltu/Deba": "YALMALTU/ DEBA",
  Shomolu: "SOMOLU",
  Uhunmwonde: "UHUNMWODE",
  Yenegoa: "YENAGOA",
};

function lgaAlias(name: string): string {
  return LGA_ALIASES[name] ?? name;
}

interface RawPollingUnit {
  id?: string;
  name?: string;
  registration_area_id?: string;
  precise_location?: string | null;
  abbreviation?: string;
  state?: string;
  lga?: string;
  ward?: string;
  units?: string;
  delimitation?: string;
  remark?: string;
}

interface RawWard {
  id: string;
  name: string;
  pollingUnits?: RawPollingUnit[];
}

interface RawLga {
  id: string;
  name: string;
  wards?: RawWard[];
}

interface RawStateFile {
  state?: { code?: string; name?: string; lgas?: RawLga[] };
  metadata?: { scrapedAt?: string; stateCode?: string };
}

interface JaySummary {
  metadata?: {
    scrapedAt?: string;
    totalStates?: number;
    totalLGAs?: number;
    totalWards?: number;
    totalPollingUnits?: number;
  };
  states?: { fileName?: string }[];
}

export type PuStatus = "EXISTING" | "NEW";

interface CompiledPu {
  id: string;
  name: string;
  abbreviation: string;
  registrationAreaId: string;
  delimitation: string;
  status: PuStatus;
}

interface CompiledWard {
  id: string;
  name: string;
  pollingUnitCount: number;
  pollingUnits: CompiledPu[];
}

interface CompiledLga {
  id: string;
  name: string;
  pollingUnitCount: number;
  wards: CompiledWard[];
}

interface CompiledState {
  id: string;
  name: string;
  code: string;
  pollingUnitCount: number;
  lgas: CompiledLga[];
}

interface PuIndexEntry {
  id: string;
  delimitation: string;
  name: string;
  abbreviation: string;
  registrationAreaId: string;
  status: PuStatus;
  stateId: string;
  stateName: string;
  lgaId: string;
  lgaName: string;
  wardId: string;
  wardName: string;
}

const n = (s: string) =>
  normalizeName(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function lgaIdFrom(stateName: string, lgaName: string): string {
  return `${stateId(stateName)}-${slugify(lgaName).toUpperCase()}`;
}

function wardIdFrom(lgaId: string, wardName: string): string {
  return `${lgaId}-${slugify(wardName).toUpperCase()}`;
}

function isValidPu(p: RawPollingUnit | undefined): boolean {
  if (!p) return false;
  return typeof p.id === "string" || typeof p.name === "string";
}

function readSummary(): JaySummary | null {
  const p = path.join(JAY_DIR, "summary.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as JaySummary;
}

function loadState(name: string): CompiledState | null {
  const p = path.join(JAY_DIR, name);
  if (!fs.existsSync(p)) return null;
  const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as RawStateFile;
  const state = raw.state ?? {};
  const rawName = String(state.name ?? "");
  if (!rawName) return null;
  const stateName = normalizeName(rawName);
  const code = String(state.code ?? raw.metadata?.stateCode ?? "");
  const sid = stateId(stateName);
  const compiledLgas: CompiledLga[] = [];
  let statePu = 0;

  for (const lgaRaw of state.lgas ?? []) {
    const lgaName = String(lgaRaw.name ?? "");
    const lgaId = lgaIdFrom(stateName, lgaName);
    const compiledWards: CompiledWard[] = [];
    let lgaPu = 0;

    for (const wardRaw of lgaRaw.wards ?? []) {
      const wardName = String(wardRaw.name ?? "");
      const wardId = wardIdFrom(lgaId, wardName);
      const pus: CompiledPu[] = [];
      let wardPu = 0;

      for (const rawPu of wardRaw.pollingUnits ?? []) {
        if (!isValidPu(rawPu)) continue;
        const delimitation = String(rawPu.delimitation ?? "");
        const id = delimitation
          ? `pu-${delimitation.replace(/\//g, "-")}`
          : `pu-${sid.toLowerCase()}-${slugify(lgaName)}-${slugify(wardName)}-${wardPu + 1}`;
        const pu: CompiledPu = {
          id,
          name: String(rawPu.name ?? ""),
          abbreviation: String(rawPu.abbreviation ?? ""),
          registrationAreaId: String(rawPu.registration_area_id ?? ""),
          delimitation,
          status: /new/i.test(String(rawPu.remark ?? "")) ? "NEW" : "EXISTING",
        };
        pus.push(pu);
        wardPu++;
        lgaPu++;
        statePu++;
      }

      compiledWards.push({
        id: wardId,
        name: wardName,
        pollingUnitCount: wardPu,
        pollingUnits: pus,
      });
    }

    compiledLgas.push({
      id: lgaId,
      name: lgaName,
      pollingUnitCount: lgaPu,
      wards: compiledWards,
    });
  }

  return {
    id: sid,
    name: stateName,
    code,
    pollingUnitCount: statePu,
    lgas: compiledLgas,
  };
}

interface EnrichmentStats {
  states: { matched: number; total: number };
  lgas: { matched: number; total: number };
  wards: { matched: number; total: number };
  unmatchedLgas: string[];
}

function enrichCounts(
  states: CompiledState[]
): {
  stateCount: Map<string, number>;
  lgaCount: Map<string, number>;
  wardCount: Map<string, number>;
} {
  const stateCount = new Map<string, number>();
  const lgaCount = new Map<string, number>();
  const wardCount = new Map<string, number>();

  for (const s of states) {
    stateCount.set(n(s.name), s.pollingUnitCount);
    for (const l of s.lgas) {
      lgaCount.set(`${n(s.name)}::${n(l.name)}`, l.pollingUnitCount);
      for (const w of l.wards) {
        wardCount.set(`${n(s.name)}::${n(l.name)}::${n(w.name)}`, w.pollingUnitCount);
      }
    }
  }
  return { stateCount, lgaCount, wardCount };
}

function patchCounts<T extends Record<string, unknown>>(
  rows: T[],
  keyOf: (row: T) => string,
  counts: Map<string, number>,
  missed: string[] = [],
  labelOf?: (row: T) => string
): { matched: number; total: number } {
  let matched = 0;
  for (const row of rows) {
    const c = counts.get(keyOf(row));
    if (c !== undefined) {
      (row as T & { pollingUnitCount: number }).pollingUnitCount = c;
      matched++;
    } else if (missed) {
      missed.push(labelOf ? labelOf(row) : String(row.name ?? row.id ?? ""));
    }
  }
  return { matched, total: rows.length };
}

export async function buildPollingUnits(): Promise<{
  stateCount: number;
  lgaCount: number;
  wardCount: number;
  pollingUnitCount: number;
}> {
  const summary = readSummary();
  const files = (summary?.states ?? [])
    .map((s) => s.fileName)
    .filter((f): f is string => Boolean(f));

  const states: CompiledState[] = [];
  for (const f of files) {
    const s = loadState(f);
    if (s) states.push(s);
  }
  states.sort((a, b) => a.name.localeCompare(b.name));

  let totalWards = 0;
  let totalLgas = 0;
  let totalPu = 0;
  const index: PuIndexEntry[] = [];

  for (const s of states) {
    totalPu += s.pollingUnitCount;
    for (const l of s.lgas) {
      totalLgas++;
      for (const w of l.wards) {
        totalWards++;
        for (const pu of w.pollingUnits) {
          index.push({
            id: pu.id,
            delimitation: pu.delimitation,
            name: pu.name,
            abbreviation: pu.abbreviation,
            registrationAreaId: pu.registrationAreaId,
            status: pu.status,
            stateId: s.id,
            stateName: s.name,
            lgaId: l.id,
            lgaName: l.name,
            wardId: w.id,
            wardName: w.name,
          });
        }
      }
    }
  }
  index.sort((a, b) => {
    if (a.delimitation && b.delimitation) return a.delimitation.localeCompare(b.delimitation);
    if (a.delimitation) return -1;
    if (b.delimitation) return 1;
    return a.name.localeCompare(b.name);
  });

  const sumMeta = summary?.metadata ?? {};
  const metadata = {
    source: {
      name: "JayCodist/inec-polling-units-scraper",
      url: "https://github.com/JayCodist/inec-polling-units-scraper",
      license: "MIT",
    },
    scrapedAt: sumMeta.scrapedAt ?? null,
    totals: {
      states: states.length,
      lgas: totalLgas,
      wards: totalWards,
      pollingUnits: totalPu,
    },
  };

  const countsNested = states.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    pollingUnitCount: s.pollingUnitCount,
    lgas: s.lgas.map((l) => ({
      id: l.id,
      name: l.name,
      pollingUnitCount: l.pollingUnitCount,
      wards: l.wards.map((w) => ({
        id: w.id,
        name: w.name,
        pollingUnitCount: w.pollingUnitCount,
      })),
    })),
  }));

  ensureDir(projectRoot("data/locations"));
  writeJson(projectRoot("data/locations/polling-units.json"), {
    metadata,
    states,
  });
  writeJson(projectRoot("data/locations/polling-unit-counts.json"), {
    metadata,
    states: countsNested,
  });
  writeJson(projectRoot("data/locations/polling-unit-index.json"), {
    metadata,
    pollingUnits: index,
  });

  const delimitationIndex: Record<string, { stateId: string; puId: string }> =
    {};
  const byState: Record<string, typeof index> = {};
  for (const row of index) {
    if (row.delimitation) {
      delimitationIndex[row.delimitation] = {
        stateId: row.stateId,
        puId: row.id,
      };
    }
    if (!byState[row.stateId]) byState[row.stateId] = [];
    byState[row.stateId].push(row);
  }

  const publicPuDir = projectRoot("public/data/polling-units/by-state");
  ensureDir(publicPuDir);
  for (const [stateId, rows] of Object.entries(byState)) {
    const shard = rows.map((pu) => ({
      id: pu.id,
      delimitation: pu.delimitation,
      name: pu.name,
      abbreviation: pu.abbreviation,
      wardId: pu.wardId,
      wardName: pu.wardName,
      lgaId: pu.lgaId,
      lgaName: pu.lgaName,
      status: pu.status,
    }));
    writeJson(path.join(publicPuDir, `${stateId}.json`), shard);
  }
  ensureDir(projectRoot("public/data/polling-units"));
  writeJson(
    projectRoot("public/data/polling-units/delimitation-index.json"),
    delimitationIndex
  );

  const { stateCount, lgaCount, wardCount } = enrichCounts(states);

  const locationsDir = projectRoot("data/locations");
  const unmatchedLgas: string[] = [];

  const sStates = JSON.parse(
    fs.readFileSync(path.join(locationsDir, "states.json"), "utf-8")
  ) as Record<string, unknown>[];
  const sLgas = JSON.parse(
    fs.readFileSync(path.join(locationsDir, "lgas.json"), "utf-8")
  ) as Record<string, unknown>[];
  const sWards = JSON.parse(
    fs.readFileSync(path.join(locationsDir, "wards.json"), "utf-8")
  ) as Record<string, unknown>[];

  const unmatchedWards: string[] = [];

  const eStates = patchCounts(sStates, (r) => n(String(r.name)), stateCount);
  const eLgas = patchCounts(
    sLgas,
    (r) =>
      `${n(String(r.stateName))}::${n(lgaAlias(String(r.name)))}`,
    lgaCount,
    unmatchedLgas
  );
  const eWards = patchCounts(
    sWards,
    (r) =>
      `${n(String(r.stateName))}::${n(lgaAlias(String(r.lgaName)))}::${n(
        String(r.ward)
      )}`,
    wardCount,
    unmatchedWards,
    (r) => `${String(r.stateName)} | ${String(r.lgaName)} | ${String(r.ward)}`
  );

  writeJson(path.join(locationsDir, "states.json"), sStates);
  writeJson(path.join(locationsDir, "lgas.json"), sLgas);
  writeJson(path.join(locationsDir, "wards.json"), sWards);

  const contentStates = JSON.parse(
    fs.readFileSync(projectRoot("data/content/states.json"), "utf-8")
  ) as Record<string, unknown>[];
  const contentLgas = JSON.parse(
    fs.readFileSync(projectRoot("data/content/lgas.json"), "utf-8")
  ) as Record<string, unknown>[];

  const ecStates = patchCounts(contentStates, (r) => n(String(r.name)), stateCount);
  const ecLgas = patchCounts(
    contentLgas,
    (r) =>
      `${n(String(r.stateName))}::${n(lgaAlias(String(r.name)))}`,
    lgaCount,
    unmatchedLgas
  );

  writeJson(projectRoot("data/content/states.json"), contentStates);
  writeJson(projectRoot("data/content/lgas.json"), contentLgas);

  const sourcesPath = projectRoot("data/content/sources.json");
  const sources = JSON.parse(fs.readFileSync(sourcesPath, "utf-8")) as Record<
    string,
    unknown
  >;
  sources.pollingUnits = {
    name: "INEC polling units (JayCodist/inec-polling-units-scraper)",
    url: "https://github.com/JayCodist/inec-polling-units-scraper",
    license: "MIT",
    scrapedAt: sumMeta.scrapedAt ?? null,
  };
  writeJson(sourcesPath, sources);

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    totals: metadata.totals,
    expectedStates: sumMeta.totalStates,
    expectedLgas: sumMeta.totalLGAs,
    expectedWards: sumMeta.totalWards,
    expectedPollingUnits: sumMeta.totalPollingUnits,
    note: "Upstream totalPollingUnits counts stray empty objects in the scraped data; compiled totals exclude them.",
    enrichment: {
      states: eStates,
      lgas: eLgas,
      wards: eWards,
      contentStates: ecStates,
      contentLgas: ecLgas,
      sampleUnmatchedLgas: unmatchedLgas.slice(0, 30),
      sampleUnmatchedWards: unmatchedWards.slice(0, 30),
    },
    pass:
      states.length === (sumMeta.totalStates ?? states.length) &&
      totalLgas === (sumMeta.totalLGAs ?? totalLgas) &&
      totalWards === (sumMeta.totalWards ?? totalWards),
  };
  ensureDir(projectRoot("scripts/geo-processing/reports"));
  writeJson(
    projectRoot("scripts/geo-processing/reports/polling-units-report.json"),
    report
  );

  const mismatched = totalPu !== (sumMeta.totalPollingUnits ?? totalPu);
  console.log(
    `Polling units built: ${totalPu.toLocaleString()} PUs, ${totalLgas} LGAs, ${totalWards} wards` +
      ` (states matched ${eStates.matched}/${eStates.total}, LGAs ${eLgas.matched}/${eLgas.total}, wards ${eWards.matched}/${eWards.total})`
  );
  if (mismatched) {
    console.warn(
      `Polling-unit total ${totalPu} differs from upstream summary ${sumMeta.totalPollingUnits}`
    );
  }

  return {
    stateCount: states.length,
    lgaCount: totalLgas,
    wardCount: totalWards,
    pollingUnitCount: totalPu,
  };
}

const isMain =
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  buildPollingUnits()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}