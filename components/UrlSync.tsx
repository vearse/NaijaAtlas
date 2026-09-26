"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { parseMapTypeParam } from "@/lib/map/mapType";
import { parseLensId } from "@/lib/lenses/lensHelper";
import type { RankingCategoryId } from "@/lib/ranking/types";
import {
  encodeFocusParam,
  parseFocusParam,
} from "@/lib/map/overlayFocus";

/** Sync map selection ↔ URL query params for shareable links */
export default function UrlSync() {
  const [ready, setReady] = useState(false);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const lgaVisibleStateIds = useMapStore((s) => s.lgaVisibleStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const mapType = useMapStore((s) => s.mapType);
  const activeLens = useMapStore((s) => s.activeLens);
  const selectedSenatorialDistrictId = useMapStore(
    (s) => s.selectedSenatorialDistrictId
  );
  const rankingCategory = useMapStore((s) => s.rankingCategory);
  const rankingFieldKey = useMapStore((s) => s.rankingFieldKey);
  const rankingPeriod = useMapStore((s) => s.rankingPeriod);
  const overlayFeatureFocus = useMapStore((s) => s.overlayFeatureFocus);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const store = useMapStore.getState();

    const mapParam = params.get("map");
    store.setMapType(parseMapTypeParam(mapParam));

    const regionParam =
      params.get("region") ?? params.get("regions")?.split(",")[0];
    const states = params.get("states")?.split(",").filter(Boolean);
    const lga = params.get("lga");
    const showLgas = params.get("lgas") === "1";
    const sd = params.get("sd");

    if (regionParam) {
      store.setActiveRegion(regionParam);
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

    if (store.mapType === "ranking") {
      const rankCat = params.get("rankCat");
      const rankField = params.get("rankField");
      const rankPeriod = params.get("rankPeriod");
      if (rankCat && rankField) {
        store.setRankingMetric(
          rankCat as RankingCategoryId,
          rankField
        );
      }
      if (rankPeriod) store.setRankingPeriod(rankPeriod);
    }

    const focusParam = params.get("focus");
    if (
      focusParam &&
      store.mapType !== "election" &&
      store.mapType !== "ranking"
    ) {
      const spec = parseFocusParam(focusParam);
      if (spec) store.setOverlayFeatureFocus(spec);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const params = new URLSearchParams();
    if (activeRegionId) {
      params.set("regions", activeRegionId);
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
    if (mapType === "ranking") {
      params.set("rankCat", rankingCategory);
      params.set("rankField", rankingFieldKey);
      params.set("rankPeriod", rankingPeriod);
    }
    if (
      overlayFeatureFocus &&
      mapType !== "election" &&
      mapType !== "ranking"
    ) {
      params.set("focus", encodeFocusParam(overlayFeatureFocus));
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
    activeRegionId,
    mapType,
    activeLens,
    selectedSenatorialDistrictId,
    rankingCategory,
    rankingFieldKey,
    rankingPeriod,
    overlayFeatureFocus,
  ]);

  return null;
}
