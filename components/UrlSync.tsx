"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { parseMapTypeParam } from "@/lib/map/mapType";
import { parseLensId } from "@/lib/lenses/lensHelper";

/** Sync map selection ↔ URL query params for shareable links */
export default function UrlSync() {
  const [ready, setReady] = useState(false);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const lgaVisibleStateIds = useMapStore((s) => s.lgaVisibleStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const activeRegionIds = useMapStore((s) => s.activeRegionIds);
  const activeRegionIdsKey = [...activeRegionIds].sort().join(",");
  const mapType = useMapStore((s) => s.mapType);
  const activeLens = useMapStore((s) => s.activeLens);
  const selectedSenatorialDistrictId = useMapStore(
    (s) => s.selectedSenatorialDistrictId
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const store = useMapStore.getState();

    const mapParam = params.get("map");
    store.setMapType(parseMapTypeParam(mapParam));

    const regionsParam =
      params.get("regions")?.split(",").filter(Boolean) ??
      (params.get("region") ? [params.get("region")!] : undefined);
    const states = params.get("states")?.split(",").filter(Boolean);
    const lga = params.get("lga");
    const showLgas = params.get("lgas") === "1";
    const sd = params.get("sd");

    if (regionsParam?.length) {
      store.setActiveRegions(regionsParam);
    } else if (states?.length) {
      if (store.mapType === "election" || showLgas) {
        store.showLgasForStates(states);
      } else {
        store.selectStates(states);
      }
    }

    if (lga) {
      store.setSelectedLga(lga);
      store.openMobileSheet();
    }

    if (sd) {
      store.setSelectedSenatorialDistrict(sd);
    }

    const lensParam = params.get("lens");
    if (lensParam) {
      store.setActiveLens(parseLensId(lensParam));
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const params = new URLSearchParams();
    if (activeRegionIds.size > 0) {
      params.set("regions", [...activeRegionIds].sort().join(","));
    } else if (selectedStateIds.size > 0) {
      params.set("states", [...selectedStateIds].sort().join(","));
      if (lgaVisibleStateIds.size > 0) params.set("lgas", "1");
    }
    if (selectedLgaId) params.set("lga", selectedLgaId);
    params.set("map", mapType);
    if (activeLens !== "learn") {
      params.set("lens", activeLens);
    }
    if (mapType === "election" && selectedSenatorialDistrictId) {
      params.set("sd", selectedSenatorialDistrictId);
    }

    const qs = params.toString();
    const next = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      window.history.replaceState(null, "", next);
    }
  }, [
    ready,
    selectedStateIds,
    lgaVisibleStateIds,
    selectedLgaId,
    activeRegionIdsKey,
    mapType,
    activeLens,
    selectedSenatorialDistrictId,
  ]);

  return null;
}
