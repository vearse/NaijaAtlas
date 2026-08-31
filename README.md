# Explore Nigeria

Interactive one-page map of Nigeria — states, LGAs, and geopolitical regions.

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
npm run dev
```

## Data

- **Boundaries:** [UN SALB Nigeria](https://salb.un.org/en/data/nga) (OSGoF)
- **Hierarchy:** [temikeezy/nigeria-geojson-data](https://github.com/temikeezy/nigeria-geojson-data)

## Map UX

- Country view: states + regions only (no LGAs)
- Click state(s) to reveal LGAs (multi-select supported)
- Click LGA for details panel
