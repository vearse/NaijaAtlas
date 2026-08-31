---
name: explore-nigeria
description: Build and maintain the Explore Nigeria MapLibre app. Use when working on map layers, geographic data, state/LGA selection, regions, or Nigeria location hierarchy.
---

# Explore Nigeria — Agent Guide

All project code lives in **`ExploreNigeria/`**.

## Data sources (never swap)

- **Geometry:** UN SALB Nigeria (OSGoF) via HDX — stored in `data/geo/source/salb/`, served from `public/geo/`
- **Hierarchy + ward centroids:** [temikeezy/nigeria-geojson-data](https://github.com/temikeezy/nigeria-geojson-data) — `data/locations/source/temikeezy/`

## Map layer rules (mandatory)

1. **Country view:** ADM0 + regions + states + **state labels** — no LGA polygons
2. **Viewport:** `maxBounds` = West Africa (Nigeria + Benin, Niger, Chad, Cameroon)
3. **Init effect deps must be `[]`** — never pass unstable callbacks into map init
4. **Hover:** use MapLibre `feature-state` via `createHoverController` — not Zustand
5. **LGA layers:** hidden until state(s) selected; fade in/out transitions
6. **Region filter:** first click highlights region; second click selects all states

## Architecture

- Frontend only. No backend, DB, or runtime geo API calls.
- MapLibre ref-based instance in `NigeriaMap.tsx` — never re-init on React re-render
- Zustand store: `selectedStateIds`, `selectedLgaId`, `hoveredId`, `activeRegionId`
- Per-state LGA GeoJSON lazy loaded from `public/geo/lgas/{stateId}.geojson`

## ID conventions

- Country: `NG`
- State: `NG-{CODE}` (e.g. `NG-LA` = Lagos, `NG-FC` = FCT)
- LGA: `NG-{STATE_CODE}-{SLUG}` (e.g. `NG-LA-IKEJA`)
- Region: `NG-NC`, `NG-NE`, `NG-NW`, `NG-SE`, `NG-SS`, `NG-SW`

## UX standards

- `flyTo` / `fitBounds`: 1200–1800ms, easeInOut
- Layer opacity transitions on add/remove (300ms)
- Region-themed color palette
- Mobile: bottom sheet panel, 44px touch targets

## Build pipeline

Run `npm run build:geo` after changing source data. Never hand-edit files in `public/geo/`.
