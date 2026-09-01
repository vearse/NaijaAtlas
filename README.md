# NaijaAtlas

Interactive map of Nigeria — states, LGAs, and geopolitical regions.

## Stack

- Next.js 15 + TypeScript + Tailwind
- MapLibre GL JS
- D3.js (charts)
- Static GeoJSON from UN SALB + temikeezy hierarchy

## Setup

```bash
cd ExploreNigeria
npm install
npm run download:geo   # fetch SALB + temikeezy source data
npm run build:geo      # process boundaries → public/geo/
npm run build:compare  # generate compare JSON from source CSVs
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://naijaatlas.com`) for SEO canonical links.

## Map data

- **Boundaries:** [UN SALB Nigeria](https://salb.un.org/en/data/nga) (OSGoF)
- **Hierarchy:** [temikeezy/nigeria-geojson-data](https://github.com/temikeezy/nigeria-geojson-data)

## Compare data (states & country profile)

Compare categories (General, Geography, Demographics, Governance, Economy, Social) are driven by:

- **Schema:** `data/compare/manifest.json` — fields, categories, periods
- **Source CSVs:** `data/compare/sources/` — edit these to backfill data
- **Output JSON:** `data/compare/states/` and `data/compare/country/` — generated; do not hand-edit

### Adding or editing compare data

1. Edit the relevant CSV under `data/compare/sources/` (see `data/content/sources.json` for file names and upstream sources).
2. Run `npm run build:compare` to regenerate JSON bundles.
3. Run `node scripts/verify-compare.mjs` to confirm every state has every required field.

Use `—` or leave cells empty for unknown values. **Never remove columns** — the manifest defines the full schema.

### Source CSV templates

| File pattern | Contents |
|--------------|----------|
| `states-general.csv` | capital, yearCreated, majorCities, languages, nickname |
| `states-demographics-{period}.csv` | population, urbanPercent, genderRatio, growthRate, medianAge |
| `states-governance-{term}.csv` | governor, deputy, housePartySplit, assembly speaker |
| `states-senators-{term}.csv` | senator rows (3 per state; district, name, party, imageUrl) |
| `states-house-{term}.csv` | optional named reps (constituency, name, party, imageUrl) |
| `states-economy-{period}.csv` | IGR, FAAC, unemployment, poverty |
| `states-social-2021.csv` | literacy, enrollment, mortality, utilities |
| `country-demographics-{period}.csv` | national population & demographics |
| `country-governance-{term}.csv` | president, VP, NASS leadership |
| `country-economy-{period}.csv` | GDP, inflation, debt |

Geography metrics (coastline, borders, distance to Abuja, LGA extremes, pop rank) are **computed** in `build-compare.ts` from geo assets — no CSV required.

### Data sourcing notes

| Dataset | Source |
|---------|--------|
| Population / demographics | [NPC](https://www.nationalpopulation.gov.ng/), [NBS](https://www.nigerianstat.gov.ng/) |
| IGR / FAAC / poverty / unemployment | NBS, [BudgIT](https://yourbudgit.com/) |
| Governors, senators, reps | [INEC](https://www.inecnigeria.org/), [NASS](https://nass.gov.ng/) |
| Social indicators | NBS, [NDHS](https://ng.ndhs.gov.ng/) |
| Land area, borders, distance | UN SALB + internal geo pipeline |

### Build & deploy

```bash
npm run build:compare   # regenerate compare JSON from CSVs + geo
npm run build           # prebuild runs verify-geo + verify-compare
```

## Map UX

- Country view: states + regions only (no LGAs)
- Click state(s) to reveal LGAs (multi-select up to 3 for compare)
- Click LGA for details panel
