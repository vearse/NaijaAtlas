"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { parseMapTypeParam } from "@/lib/map/mapType";
import { parseLensId } from "@/lib/lenses/lensHelper";
import type { RankingCategoryId } from "@/lib/ranking/types";
import type { MapTypeId } from "@/lib/store/mapStore";
import {
  encodeFocusParam,
  parseFocusParam,
} from "@/lib/map/overlayFocus";
import { findPlaceByRef } from "@/lib/map/placeByRef";
import { OVERLAY_LAYER_IDS, type OverlayLayerId } from "@/types/overlay";

type UrlSyncProps = {
  /** Used when `?map=` is absent (section map routes). */
  defaultMapType?: MapTypeId;
};

/** Sync map selection ↔ URL query params for shareable links */
export default function UrlSync({ defaultMapType }: UrlSyncProps = {}) {
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
  const revealedOptInGroups = useMapStore((s) => s.revealedOptInGroups);
  const directionsFrom = useMapStore((s) => s.directions.from);
  const directionsTo = useMapStore((s) => s.directions.to);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const store = useMapStore.getState();

    const mapParam = params.get("map");
    store.setMapType(
      parseMapTypeParam(mapParam ?? defaultMapType ?? null)
    );

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

    // Hub CTAs hand off to a layer the lens preset may not include (ports live
    // in `waterways`, security formations too), so `layers=` wins over `lens=`.
    const layerParam = params.get("layers")?.split(",").filter(Boolean);
    if (layerParam?.length) {
      store.clearAllOverlays();
      for (const id of layerParam) {
        if (OVERLAY_LAYER_IDS.includes(id as OverlayLayerId)) {
          store.toggleOverlay(id as OverlayLayerId);
        }
      }
    } else if (focusParam) {
      const spec = parseFocusParam(focusParam);
      if (spec && store.mapType !== "election" && store.mapType !== "ranking") {
        store.clearAllOverlays();
        store.toggleOverlay(spec.layerId);
      }
    }

    // Opt-in groups (proposed ports, new Army divisions) ship hidden.
    const reveal = params.get("reveal")?.split(",").filter(Boolean);
    if (reveal?.length) {
      for (const group of reveal) store.setOptInGroup(group, true);
    }

    const dirFrom = params.get("dirFrom");
    const dirTo = params.get("dirTo");
    if (dirFrom && dirTo) {
      const from = findPlaceByRef(dirFrom);
      const to = findPlaceByRef(dirTo);
      if (from && to) {
        store.setDirectionsFrom(from);
        store.setDirectionsTo(to);
        store.toggleDirections(true);
      }
    }

    setReady(true);
  }, [defaultMapType]);

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
    // Preserve hub hand-off params so the deep link stays shareable.
    const revealed = [...revealedOptInGroups];
    if (revealed.length) params.set("reveal", revealed.sort().join(","));
    if (directionsFrom && directionsTo) {
      params.set("dirFrom", directionsFrom.name);
      params.set("dirTo", directionsTo.name);
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
    revealedOptInGroups,
    directionsFrom,
    directionsTo,
  ]);

  return null;
}
