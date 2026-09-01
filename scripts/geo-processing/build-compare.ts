/**
 * Generates complete data/compare JSON bundles from source CSVs + geo metrics.
 * Run: npm run build:compare
 */
import fs from "fs";
import path from "path";
import { STATE_CODES } from "./constants";
import {
  dashOr,
  groupBy,
  indexBy,
  nullOrNumber,
  personOrDash,
  readCsvFile,
} from "./compare/csv-utils";
import {
  buildGeographyRecords,
  loadStateLandAreas,
  populationRank,
  type LgaRecord,
  type StateRecord,
} from "./compare/geo-metrics";

const root = path.join(__dirname, "../..");
const out = (rel: string) => path.join(root, rel);
const sourcesDir = out("data/compare/sources");

const STATE_NAMES = Object.keys(STATE_CODES);

function stateId(name: string): string {
  return `NG-${STATE_CODES[name]}`;
}

const HOUSE_SEATS: Record<string, number> = {
  Abia: 8,
  Adamawa: 8,
  "Akwa Ibom": 10,
  Anambra: 11,
  Bauchi: 12,
  Bayelsa: 5,
  Benue: 11,
  Borno: 10,
  "Cross River": 8,
  Delta: 10,
  Ebonyi: 6,
  Edo: 9,
  Ekiti: 6,
  Enugu: 8,
  "Federal Capital Territory": 2,
  Gombe: 6,
  Imo: 10,
  Jigawa: 11,
  Kaduna: 16,
  Kano: 24,
  Katsina: 15,
  Kebbi: 8,
  Kogi: 9,
  Kwara: 6,
  Lagos: 24,
  Nasarawa: 5,
  Niger: 10,
  Ogun: 9,
  Ondo: 9,
  Osun: 9,
  Oyo: 14,
  Plateau: 8,
  Rivers: 13,
  Sokoto: 11,
  Taraba: 6,
  Yobe: 6,
  Zamfara: 7,
};

const DEFAULT_CAPITALS: Record<string, string> = {
  Abia: "Umuahia",
  Adamawa: "Yola",
  "Akwa Ibom": "Uyo",
  Anambra: "Awka",
  Bauchi: "Bauchi",
  Bayelsa: "Yenagoa",
  Benue: "Makurdi",
  Borno: "Maiduguri",
  "Cross River": "Calabar",
  Delta: "Asaba",
  Ebonyi: "Abakaliki",
  Edo: "Benin City",
  Ekiti: "Ado-Ekiti",
  Enugu: "Enugu",
  "Federal Capital Territory": "Abuja",
  Gombe: "Gombe",
  Imo: "Owerri",
  Jigawa: "Dutse",
  Kaduna: "Kaduna",
  Kano: "Kano",
  Katsina: "Katsina",
  Kebbi: "Birnin Kebbi",
  Kogi: "Lokoja",
  Kwara: "Ilorin",
  Lagos: "Ikeja",
  Nasarawa: "Lafia",
  Niger: "Minna",
  Ogun: "Abeokuta",
  Ondo: "Akure",
  Osun: "Osogbo",
  Oyo: "Ibadan",
  Plateau: "Jos",
  Rivers: "Port Harcourt",
  Sokoto: "Sokoto",
  Taraba: "Jalingo",
  Yobe: "Damaturu",
  Zamfara: "Gusau",
};

/** NPC / NBS population seeds (backfill CSVs override these). */
const SEED_POP: Record<string, Record<string, number>> = {
  "2006": {
    Abia: 2844000, Adamawa: 3178000, "Akwa Ibom": 3116000, Anambra: 4182000,
    Bauchi: 4583000, Bayelsa: 1704000, Benue: 4253000, Borno: 4188000,
    "Cross River": 2888000, Delta: 4012000, Ebonyi: 2173000, Edo: 3233000,
    Ekiti: 2398000, Enugu: 3273000, "Federal Capital Territory": 1402000,
    Gombe: 2448000, Imo: 3935000, Jigawa: 4349000, Kaduna: 6325000,
    Kano: 9327000, Katsina: 5868000, Kebbi: 3208000, Kogi: 3278000,
    Kwara: 2392000, Lagos: 9013000, Nasarawa: 1866000, Niger: 3950000,
    Ogun: 3725000, Ondo: 3446000, Osun: 3416000, Oyo: 5934000,
    Plateau: 3221000, Rivers: 5115000, Sokoto: 3706000, Taraba: 2592000,
    Yobe: 2221000, Zamfara: 3257000,
  },
  "2016": {},
  "2023": {
    Abia: 4100000, Adamawa: 5200000, "Akwa Ibom": 5500000, Anambra: 6400000,
    Bauchi: 8200000, Bayelsa: 2700000, Benue: 6200000, Borno: 6800000,
    "Cross River": 4300000, Delta: 6200000, Ebonyi: 3200000, Edo: 4900000,
    Ekiti: 3400000, Enugu: 4900000, "Federal Capital Territory": 3800000,
    Gombe: 4100000, Imo: 5900000, Jigawa: 7200000, Kaduna: 9800000,
    Kano: 16000000, Katsina: 9300000, Kebbi: 5200000, Kogi: 5100000,
    Kwara: 3900000, Lagos: 21000000, Nasarawa: 3200000, Niger: 6800000,
    Ogun: 6200000, Ondo: 5200000, Osun: 5200000, Oyo: 9400000,
    Plateau: 5200000, Rivers: 8200000, Sokoto: 6200000, Taraba: 3800000,
    Yobe: 3800000, Zamfara: 5800000,
  },
};

const SEED_IGR_2023: Record<string, { igr: string; igrPerCapita: string }> = {
  Lagos: { igr: "₦651.2B", igrPerCapita: "₦31,010" },
  Rivers: { igr: "₦195.4B", igrPerCapita: "₦23,829" },
  FCT: { igr: "₦124.4B", igrPerCapita: "₦32,737" },
  Delta: { igr: "₦85.3B", igrPerCapita: "₦13,758" },
  Ogun: { igr: "₦146.6B", igrPerCapita: "₦23,645" },
  Kaduna: { igr: "₦62.1B", igrPerCapita: "₦6,337" },
  Kano: { igr: "₦42.4B", igrPerCapita: "₦2,650" },
};

const SEED_GOVERNORS_2023: Record<
  string,
  {
    governor: string;
    party: string;
    imageUrl?: string;
    deputy?: string;
    deputyParty?: string;
    housePartySplit?: string;
  }
> = {
  Abia: {
    governor: "Alex Otti",
    party: "LP",
    deputy: "Ikechi Aaron",
    deputyParty: "LP",
    housePartySplit: "5 LP · 2 APC · 1 APGA",
  },
  Lagos: {
    governor: "Babajide Sanwo-Olu",
    party: "APC",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Babajide_Olawale_Sanwo-Olu.jpg/220px-Babajide_Olawale_Sanwo-Olu.jpg",
    deputy: "Kadri Obafemi Hamzat",
    deputyParty: "APC",
    housePartySplit: "24 APC",
  },
  Kano: {
    governor: "Abba Kabir Yusuf",
    party: "NNPP",
    deputy: "Aminu Abdussalam",
    deputyParty: "NNPP",
    housePartySplit: "16 NNPP · 8 APC",
  },
  Rivers: {
    governor: "Siminalayi Fubara",
    party: "PDP",
    deputy: "Ngozi Odu",
    deputyParty: "PDP",
    housePartySplit: "12 PDP · 1 APC",
  },
  "Federal Capital Territory": {
    governor: "Nyesom Wike",
    party: "PDP",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Nyesom_Wike_%28cropped%29.jpg/220px-Nyesom_Wike_%28cropped%29.jpg",
    deputy: "—",
    deputyParty: "Minister of FCT",
    housePartySplit: "2 seats",
  },
};

const DEFAULT_GOVERNORS: Record<string, { name: string; party: string }> = {
  Adamawa: { name: "Ahmadu Fintiri", party: "PDP" },
  "Akwa Ibom": { name: "Umo Eno", party: "PDP" },
  Anambra: { name: "Charles Soludo", party: "APGA" },
  Bauchi: { name: "Bala Mohammed", party: "PDP" },
  Bayelsa: { name: "Douye Diri", party: "PDP" },
  Benue: { name: "Hyacinth Alia", party: "APC" },
  Borno: { name: "Babagana Zulum", party: "APC" },
  "Cross River": { name: "Bassey Otu", party: "PDP" },
  Delta: { name: "Sheriff Oborevwori", party: "PDP" },
  Ebonyi: { name: "Francis Nwifuru", party: "APC" },
  Edo: { name: "Monday Okpebholo", party: "APC" },
  Ekiti: { name: "Biodun Oyebanji", party: "APC" },
  Enugu: { name: "Peter Mbah", party: "PDP" },
  Gombe: { name: "Muhammad Inuwa Yahaya", party: "APC" },
  Imo: { name: "Hope Uzodinma", party: "APC" },
  Jigawa: { name: "Umar Namadi", party: "APC" },
  Kaduna: { name: "Uba Sani", party: "APC" },
  Katsina: { name: "Dikko Umar Radda", party: "APC" },
  Kebbi: { name: "Nasir Idris", party: "APC" },
  Kogi: { name: "Ahmed Ododo", party: "APC" },
  Kwara: { name: "AbdulRahman AbdulRazaq", party: "APC" },
  Nasarawa: { name: "Abdullahi Sule", party: "APC" },
  Niger: { name: "Mohammed Umar Bago", party: "APC" },
  Ogun: { name: "Dapo Abiodun", party: "APC" },
  Ondo: { name: "Lucky Aiyedatiwa", party: "APC" },
  Osun: { name: "Ademola Adeleke", party: "PDP" },
  Oyo: { name: "Seyi Makinde", party: "PDP" },
  Plateau: { name: "Caleb Mutfwang", party: "PDP" },
  Sokoto: { name: "Ahmad Aliyu", party: "APC" },
  Taraba: { name: "Agbu Kefas", party: "PDP" },
  Yobe: { name: "Mai Mala Buni", party: "APC" },
  Zamfara: { name: "Dauda Lawal", party: "PDP" },
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(rel: string, data: unknown) {
  const p = out(rel);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

type PersonField = {
  name: string;
  party: string | null;
  imageUrl: string | null;
  role: string | null;
};

function preservePersonImageUrls<T extends Record<string, unknown>>(
  built: T,
  relPath: string,
  personKeys: (keyof T)[]
): T {
  const existingPath = out(relPath);
  if (!fs.existsSync(existingPath)) return built;

  try {
    const existing = JSON.parse(
      fs.readFileSync(existingPath, "utf-8")
    ) as { NG?: Record<string, PersonField> };
    const row = existing.NG;
    if (!row) return built;

    for (const key of personKeys) {
      const builtPerson = built[key];
      const existingPerson = row[String(key)];
      if (
        builtPerson &&
        typeof builtPerson === "object" &&
        existingPerson?.imageUrl
      ) {
        (builtPerson as PersonField).imageUrl = existingPerson.imageUrl;
      }
    }
  } catch {
    /* keep built output */
  }

  return built;
}

function writeCsv(rel: string, lines: string[]) {
  const p = out(rel);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, lines.join("\n") + "\n");
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function ensureSourceTemplates(states: StateRecord[]) {
  ensureDir(sourcesDir);

  const generalPath = path.join(sourcesDir, "states-general.csv");
  if (!fs.existsSync(generalPath)) {
    const header =
      "stateName,capital,yearCreated,majorCities,languages,nickname";
    const rows = states.map((s) =>
      [
        csvEscape(s.name),
        csvEscape(DEFAULT_CAPITALS[s.name] ?? ""),
        "",
        "",
        "",
        "",
      ].join(",")
    );
    writeCsv("data/compare/sources/states-general.csv", [header, ...rows]);
  }

  for (const period of ["2006", "2016", "2023"]) {
    const p = path.join(sourcesDir, `states-demographics-${period}.csv`);
    if (!fs.existsSync(p)) {
      const header =
        "stateId,population,urbanPercent,genderRatio,growthRate,medianAge";
      const rows = states.map((s) =>
        [s.id, "", "", "", "", ""].join(",")
      );
      writeCsv(`data/compare/sources/states-demographics-${period}.csv`, [
        header,
        ...rows,
      ]);
    }
  }

  for (const term of ["2019-2023", "2023-2027"]) {
    const govPath = path.join(sourcesDir, `states-governance-${term}.csv`);
    if (!fs.existsSync(govPath)) {
      const header =
        "stateId,governorName,governorParty,governorImageUrl,deputyName,deputyParty,deputyImageUrl,housePartySplit,stateAssemblySeats,assemblySpeakerName,assemblySpeakerParty,assemblySpeakerImageUrl";
      const rows = states.map((s) =>
        [s.id, "", "", "", "", "", "", "", "", "", "", ""].join(",")
      );
      writeCsv(`data/compare/sources/states-governance-${term}.csv`, [
        header,
        ...rows,
      ]);
    }

    const senPath = path.join(sourcesDir, `states-senators-${term}.csv`);
    if (!fs.existsSync(senPath)) {
      const header = "stateId,district,name,party,imageUrl";
      writeCsv(`data/compare/sources/states-senators-${term}.csv`, [header]);
    }

    const housePath = path.join(sourcesDir, `states-house-${term}.csv`);
    if (!fs.existsSync(housePath)) {
      writeCsv(`data/compare/sources/states-house-${term}.csv`, [
        "stateId,constituency,name,party,imageUrl",
      ]);
    }
  }

  for (const period of ["2022", "2023", "2024"]) {
    const p = path.join(sourcesDir, `states-economy-${period}.csv`);
    if (!fs.existsSync(p)) {
      const header =
        "stateId,igr,igrPerCapita,faacAllocation,totalRevenue,unemploymentRate,povertyRate";
      const rows = states.map((s) =>
        [s.id, "", "", "", "", "", ""].join(",")
      );
      writeCsv(`data/compare/sources/states-economy-${period}.csv`, [
        header,
        ...rows,
      ]);
    }
  }

  const socialPath = path.join(sourcesDir, "states-social-2021.csv");
  if (!fs.existsSync(socialPath)) {
    const header =
      "stateId,literacyRate,primaryEnrollment,secondaryEnrollment,infantMortality,electricityAccess,improvedWaterAccess,internetPenetration";
    const rows = states.map((s) =>
      [s.id, "", "", "", "", "", "", ""].join(",")
    );
    writeCsv("data/compare/sources/states-social-2021.csv", [header, ...rows]);
  }

  for (const period of ["2022", "2023", "2024"]) {
    const p = path.join(sourcesDir, `country-economy-${period}.csv`);
    if (!fs.existsSync(p)) {
      writeCsv(`data/compare/sources/country-economy-${period}.csv`, [
        "countryId,gdpNominal,gdpPerCapita,inflationRate,nationalDebt,oilRevenueShare",
        "NG,,,,,",
      ]);
    }
  }

  for (const period of ["2006", "2016", "2023"]) {
    const p = path.join(sourcesDir, `country-demographics-${period}.csv`);
    if (!fs.existsSync(p)) {
      writeCsv(`data/compare/sources/country-demographics-${period}.csv`, [
        "countryId,population,populationRank,medianAge,urbanPercent,literacyRate,growthRate,genderRatio",
        "NG,,,,,,,",
      ]);
    }
  }

  for (const term of ["2019-2023", "2023-2027"]) {
    const p = path.join(sourcesDir, `country-governance-${term}.csv`);
    if (!fs.existsSync(p)) {
      writeCsv(`data/compare/sources/country-governance-${term}.csv`, [
        "countryId,presidentName,presidentParty,presidentImageUrl,vicePresidentName,vicePresidentParty,vicePresidentImageUrl,senatePresidentName,senatePresidentParty,speakerName,speakerParty,senateSeats,houseSeats",
        "NG,,,,,,,,,,,,",
      ]);
    }
  }
}

function loadStates(): StateRecord[] {
  return JSON.parse(
    fs.readFileSync(out("data/locations/states.json"), "utf-8")
  ) as StateRecord[];
}

function loadLgas(): LgaRecord[] {
  return JSON.parse(
    fs.readFileSync(out("data/locations/lgas.json"), "utf-8")
  ) as LgaRecord[];
}

function padSenators(
  senators: ReturnType<typeof personOrDash>[]
): ReturnType<typeof personOrDash>[] {
  const out = [...senators];
  while (out.length < 3) {
    out.push(personOrDash(null, null, null, null));
  }
  return out.slice(0, 3);
}

function buildGeneral(states: StateRecord[], landAreas: Map<string, number>) {
  const rows = readCsvFile(path.join(sourcesDir, "states-general.csv"));
  const byName = indexBy(rows, "stateName");

  const data: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    const row = byName.get(s.name) ?? {};
    data[s.id] = {
      capital: dashOr(row.capital || DEFAULT_CAPITALS[s.name]),
      yearCreated: dashOr(row.yearCreated),
      majorCities: dashOr(row.majorCities),
      languages: dashOr(row.languages),
      nickname: dashOr(row.nickname),
      landAreaKm2: landAreas.get(s.id) ?? null,
    };
  }
  writeJson("data/compare/states/general.json", data);
}

function buildGeography(
  states: StateRecord[],
  lgas: LgaRecord[],
  popByState: Map<string, number | null>
) {
  const ranks = populationRank(popByState);
  const geo = buildGeographyRecords(root, states, lgas, ranks);
  const slim: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    const g = geo[s.id]!;
    slim[s.id] = {
      hasCoastline: g.hasCoastline,
      hasIntlBorder: g.hasIntlBorder,
      borderingStates: g.borderingStates,
      distanceToAbujaKm: g.distanceToAbujaKm,
      largestLga: g.largestLga,
      smallestLga: g.smallestLga,
      nationalPopRank: g.nationalPopRank ?? null,
    };
  }
  writeJson("data/compare/states/geography.json", slim);
}

function buildDemographics(
  states: StateRecord[],
  period: string,
  landAreas: Map<string, number>
) {
  const rows = readCsvFile(
    path.join(sourcesDir, `states-demographics-${period}.csv`)
  );
  const byId = indexBy(rows, "stateId");
  const seed = SEED_POP[period] ?? {};

  const data: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    const row = byId.get(s.id) ?? {};
    const pop =
      nullOrNumber(row.population) ?? seed[s.name] ?? null;
    const area = landAreas.get(s.id);
    const density =
      pop != null && area != null && area > 0
        ? Math.round(pop / area)
        : null;

    data[s.id] = {
      population: pop,
      populationDensity: density,
      urbanPercent: dashOr(row.urbanPercent),
      genderRatio: dashOr(row.genderRatio),
      growthRate: dashOr(row.growthRate),
      medianAge: dashOr(row.medianAge),
    };
  }
  writeJson(`data/compare/states/demographics/${period}.json`, data);
}

function buildGovernance(states: StateRecord[], term: string) {
  const govRows = readCsvFile(
    path.join(sourcesDir, `states-governance-${term}.csv`)
  );
  const senRows = readCsvFile(
    path.join(sourcesDir, `states-senators-${term}.csv`)
  );
  const houseRows = readCsvFile(
    path.join(sourcesDir, `states-house-${term}.csv`)
  );

  const govById = indexBy(govRows, "stateId");
  const senByState = groupBy(senRows, "stateId");
  const houseByState = groupBy(houseRows, "stateId");

  const data: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    const row = govById.get(s.id) ?? {};
    const seed =
      term === "2023-2027" ? SEED_GOVERNORS_2023[s.name] : undefined;
    const fallback =
      term === "2023-2027" ? DEFAULT_GOVERNORS[s.name] : undefined;

    const governor = personOrDash(
      row.governorName || seed?.governor || fallback?.name,
      row.governorParty || seed?.party || fallback?.party,
      row.governorImageUrl || seed?.imageUrl,
      s.name === "Federal Capital Territory" ? "Minister of FCT" : "Governor"
    );

    const deputyGovernor = personOrDash(
      row.deputyName || seed?.deputy,
      row.deputyParty || seed?.deputyParty,
      row.deputyImageUrl,
      "Deputy Governor"
    );

    const senatorsRaw = (senByState.get(s.id) ?? []).map((r) =>
      personOrDash(r.name, r.party, r.imageUrl, r.district || null)
    );
    const senators = padSenators(senatorsRaw);

    const houseMembers = (houseByState.get(s.id) ?? []).map((r) =>
      personOrDash(r.name, r.party, r.imageUrl, r.constituency || null)
    );

    data[s.id] = {
      governor,
      deputyGovernor,
      senators,
      houseSeats: HOUSE_SEATS[s.name] ?? null,
      housePartySplit: dashOr(row.housePartySplit || seed?.housePartySplit),
      houseMembers,
      stateAssemblySeats: nullOrNumber(row.stateAssemblySeats),
      assemblySpeaker: personOrDash(
        row.assemblySpeakerName,
        row.assemblySpeakerParty,
        row.assemblySpeakerImageUrl,
        "Assembly Speaker"
      ),
    };
  }

  writeJson(`data/compare/states/governance/${term}.json`, data);
}

function buildEconomy(states: StateRecord[], period: string) {
  const rows = readCsvFile(
    path.join(sourcesDir, `states-economy-${period}.csv`)
  );
  const byId = indexBy(rows, "stateId");

  const data: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    const row = byId.get(s.id) ?? {};
    const key = s.name === "Federal Capital Territory" ? "FCT" : s.name;
    const seed = period === "2023" ? SEED_IGR_2023[key] : undefined;

    const igr = dashOr(row.igr || seed?.igr);
    const igrPerCapita = dashOr(row.igrPerCapita || seed?.igrPerCapita);
    const totalRevenue = dashOr(row.totalRevenue);
    const igrShare =
      igr !== "—" && totalRevenue !== "—" ? "—" : "—";

    data[s.id] = {
      igr,
      igrPerCapita,
      faacAllocation: dashOr(row.faacAllocation),
      totalRevenue,
      igrShareOfRevenue: igrShare,
      unemploymentRate: dashOr(row.unemploymentRate),
      povertyRate: dashOr(row.povertyRate),
    };
  }
  writeJson(`data/compare/states/economy/${period}.json`, data);
}

function buildSocial(states: StateRecord[]) {
  const rows = readCsvFile(path.join(sourcesDir, "states-social-2021.csv"));
  const byId = indexBy(rows, "stateId");

  const data: Record<string, Record<string, unknown>> = {};
  for (const s of states) {
    const row = byId.get(s.id) ?? {};
    data[s.id] = {
      literacyRate: dashOr(row.literacyRate),
      primaryEnrollment: dashOr(row.primaryEnrollment),
      secondaryEnrollment: dashOr(row.secondaryEnrollment),
      infantMortality: dashOr(row.infantMortality),
      electricityAccess: dashOr(row.electricityAccess),
      improvedWaterAccess: dashOr(row.improvedWaterAccess),
      internetPenetration: dashOr(row.internetPenetration),
    };
  }
  writeJson("data/compare/states/social/2021.json", data);
}

function buildCountryDemographics(period: string) {
  const rows = readCsvFile(
    path.join(sourcesDir, `country-demographics-${period}.csv`)
  );
  const row = rows.find((r) => r.countryId === "NG") ?? rows[0] ?? {};

  const defaults: Record<string, Record<string, unknown>> = {
    "2006": {
      population: 140431790,
      populationRank: "6th globally (2006)",
      medianAge: "—",
      urbanPercent: "—",
      literacyRate: "—",
      growthRate: "—",
      genderRatio: "—",
    },
    "2016": {
      population: null,
      populationRank: "—",
      medianAge: "—",
      urbanPercent: "—",
      literacyRate: "—",
      growthRate: "—",
      genderRatio: "—",
    },
    "2023": {
      population: 223800000,
      populationRank: "6th globally (est.)",
      medianAge: dashOr(row.medianAge) !== "—" ? row.medianAge : "18.1 years",
      urbanPercent: dashOr(row.urbanPercent) !== "—" ? row.urbanPercent : "~53%",
      literacyRate: dashOr(row.literacyRate) !== "—" ? row.literacyRate : "~77%",
      growthRate: dashOr(row.growthRate),
      genderRatio: dashOr(row.genderRatio),
    },
  };

  const base = defaults[period] ?? {
    population: nullOrNumber(row.population),
    populationRank: dashOr(row.populationRank),
    medianAge: dashOr(row.medianAge),
    urbanPercent: dashOr(row.urbanPercent),
    literacyRate: dashOr(row.literacyRate),
    growthRate: dashOr(row.growthRate),
    genderRatio: dashOr(row.genderRatio),
  };

  writeJson(`data/compare/country/demographics/${period}.json`, { NG: base });
}

function buildCountryGovernance(term: string) {
  const rows = readCsvFile(
    path.join(sourcesDir, `country-governance-${term}.csv`)
  );
  const row = rows.find((r) => r.countryId === "NG") ?? rows[0] ?? {};

  const seed2023 =
    term === "2023-2027"
      ? {
          president: personOrDash(
            "Bola Ahmed Tinubu",
            "APC",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bola_Tinubu_portrait.jpg/960px-Bola_Tinubu_portrait.jpg"
          ),
          vicePresident: personOrDash(
            "Kashim Shettima",
            "APC",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Kashim_Shettima_office_portrait.jpg/500px-Kashim_Shettima_office_portrait.jpg"
          ),
          senatePresident: personOrDash(
            "Godswill Akpabio",
            "APC",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Godswill_Obot_Akpabio_%282012%29_%28cropped%29.jpg/500px-Godswill_Obot_Akpabio_%282012%29_%28cropped%29.jpg"
          ),
          speaker: personOrDash(
            "Tajudeen Abbas",
            "APC",
            "https://pbs.twimg.com/media/F3bBi1UXwAA45PX?format=jpg&name=medium"
          ),
          senateSeats: 109,
          houseSeats: 360,
        }
      : {
          president: personOrDash(row.presidentName, row.presidentParty, row.presidentImageUrl),
          vicePresident: personOrDash(
            row.vicePresidentName,
            row.vicePresidentParty,
            row.vicePresidentImageUrl
          ),
          senatePresident: personOrDash(
            row.senatePresidentName,
            row.senatePresidentParty
          ),
          speaker: personOrDash(row.speakerName, row.speakerParty),
          senateSeats: nullOrNumber(row.senateSeats) ?? 109,
          houseSeats: nullOrNumber(row.houseSeats) ?? 360,
        };

  if (term === "2023-2027" && row.presidentName?.trim()) {
    seed2023.president = personOrDash(
      row.presidentName,
      row.presidentParty,
      row.presidentImageUrl
    );
  }

  const rel = `data/compare/country/governance/${term}.json`;
  const merged = preservePersonImageUrls(seed2023, rel, [
    "president",
    "vicePresident",
    "senatePresident",
    "speaker",
  ]);
  writeJson(rel, { NG: merged });
}

function buildCountryEconomy(period: string) {
  const rows = readCsvFile(
    path.join(sourcesDir, `country-economy-${period}.csv`)
  );
  const row = rows.find((r) => r.countryId === "NG") ?? rows[0] ?? {};

  writeJson(`data/compare/country/economy/${period}.json`, {
    NG: {
      gdpNominal: dashOr(row.gdpNominal),
      gdpPerCapita: dashOr(row.gdpPerCapita),
      inflationRate: dashOr(row.inflationRate),
      nationalDebt: dashOr(row.nationalDebt),
      oilRevenueShare: dashOr(row.oilRevenueShare),
    },
  });
}

function main() {
  const states = loadStates();
  const lgas = loadLgas();

  ensureSourceTemplates(states);

  const landAreas = loadStateLandAreas(root, states);

  buildGeneral(states, landAreas);

  const pop2023 = new Map<string, number | null>();
  for (const s of states) {
    const rows = readCsvFile(
      path.join(sourcesDir, "states-demographics-2023.csv")
    );
    const row = indexBy(rows, "stateId").get(s.id);
    pop2023.set(
      s.id,
      nullOrNumber(row?.population) ?? SEED_POP["2023"]?.[s.name] ?? null
    );
  }
  buildGeography(states, lgas, pop2023);

  for (const period of ["2006", "2016", "2023"]) {
    buildDemographics(states, period, landAreas);
    buildCountryDemographics(period);
  }

  for (const term of ["2019-2023", "2023-2027"]) {
    buildGovernance(states, term);
    buildCountryGovernance(term);
  }

  for (const period of ["2022", "2023", "2024"]) {
    buildEconomy(states, period);
    buildCountryEconomy(period);
  }

  buildSocial(states);

  writeJson("data/compare/country/general.json", {
    NG: {
      officialName: "Federal Republic of Nigeria",
      capital: "Abuja",
      governmentType: "Federal presidential republic",
      independence: "1 October 1960",
      currency: "Nigerian naira (₦)",
      languages: "English (official) · Hausa · Yoruba · Igbo · 500+ others",
      timezone: "UTC+1 (WAT)",
      callingCode: "+234",
    },
  });

  console.log(`✓ Compare bundles written (${states.length} states)`);
}

main();
