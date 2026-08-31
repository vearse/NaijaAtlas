"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";

/** Sync map selection ↔ URL query params for shareable links */
export default function UrlSync() {
  const [ready, setReady] = useState(false);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const lgaVisibleStateIds = useMapStore((s) => s.lgaVisibleStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const activeRegionId = useMapStore((s) => s.activeRegionId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const store = useMapStore.getState();

    const region = params.get("region");
    const states = params.get("states")?.split(",").filter(Boolean);
    const lga = params.get("lga");
    const showLgas = params.get("lgas") === "1";

    if (region) {
      store.setActiveRegion(region);
    } else if (states?.length) {
      if (showLgas) store.showLgasForStates(states);
      else store.selectStates(states);
    }

    if (lga) {
      store.setSelectedLga(lga);
      store.openMobileSheet();
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const params = new URLSearchParams();
    if (activeRegionId) {
      params.set("region", activeRegionId);
    } else if (selectedStateIds.size > 0) {
      params.set("states", [...selectedStateIds].sort().join(","));
      if (lgaVisibleStateIds.size > 0) params.set("lgas", "1");
    }
    if (selectedLgaId) params.set("lga", selectedLgaId);

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
    activeRegionId,
  ]);

  return null;
}
