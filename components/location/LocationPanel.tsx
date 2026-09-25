"use client";

import { useState, useEffect } from "react";
import {
  useMapStore,
  MAX_COMPARE_STATES,
  canCompareStates,
  primarySelectedStateId,
} from "@/lib/store/mapStore";
import Breadcrumbs from "./Breadcrumbs";
import StateDetails from "./StateDetails";
import LgaDetails from "./LgaDetails";
import StateCompare from "./StateCompare";
import RegionDetails from "./RegionDetails";
import NigeriaOverview from "./NigeriaOverview";
import MobileBottomSheet from "./MobileBottomSheet";
import DesktopCompareModal from "@/components/compare/DesktopCompareModal";
import OverlayFeaturePanel from "@/components/map/OverlayFeaturePanel";
import OverlayLayerGuidePanel from "@/components/map/OverlayLayerGuidePanel";
import MetroMapPanel from "@/components/location/MetroMapPanel";
import DirectionsPanel from "@/components/directions/DirectionsPanel";
import FadeIn from "@/components/ui/FadeIn";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type {
  StateLocation,
  LgaLocation,
  RegionLocation,
  StateContent,
  LgaContent,
  WardsByLga,
  MetroGroup,
  StateNotesMap,
  CountryNotesMap,
  PeopleNotesMap,
  LgaGeneral,
} from "@/types/location";
import type { CompareBundle } from "@/types/compare";
import { OVERLAY_LAYER_LABELS } from "@/types/overlay";
import { resolveStateContent } from "@/lib/location/stateContent";

interface LocationPanelProps {
  states: StateLocation[];
  lgas: LgaLocation[];
  regions: RegionLocation[];
  stateContent: StateContent[];
  lgaContent: LgaContent[];
  wardsByLga: WardsByLga;
  compareBundle: CompareBundle;
  metroGroups: MetroGroup[];
  stateNotes: StateNotesMap;
  countryNotes: CountryNotesMap;
  peopleNotes: PeopleNotesMap;
  lgaGeneral: Record<string, LgaGeneral>;
}

export default function LocationPanel({
  states,
  lgas,
  regions,
  stateContent,
  lgaContent,
  wardsByLga,
  compareBundle,
  metroGroups,
  stateNotes,
  countryNotes,
  peopleNotes,
  lgaGeneral,
}: LocationPanelProps) {
  const isMobile = useIsMobile();
  const [desktopCompareOpen, setDesktopCompareOpen] = useState(false);
  const {
    selectedStateIds,
    selectedStateOrder,
    selectedLgaId,
    activeRegionId,
    setSelectedLga,
    mobileSheet,
    selectedOverlay,
    overlayGuideLayer,
    directionsPanelTarget,
    metroMapViews,
    activeMetroPanelId,
    compareView,
    mapType,
  } = useMapStore();

  const toggleLgaSelection = (id: string) => {
    const store = useMapStore.getState();
    store.setSelectedLga(store.selectedLgaId === id ? null : id);
  };

  const lgaLoc = selectedLgaId
    ? lgas.find((l) => l.id === selectedLgaId)
    : null;
  const lgaC = selectedLgaId
    ? lgaContent.find((c) => c.id === selectedLgaId)
    : null;

  const selectedStates = states.filter((s) => selectedStateIds.has(s.id));
  const primaryStateId = primarySelectedStateId(
    selectedStateIds,
    selectedStateOrder
  );
  const panelState =
    !selectedLgaId && primaryStateId
      ? states.find((s) => s.id === primaryStateId) ?? null
      : null;
  const panelStateContent = panelState
    ? resolveStateContent(panelState, stateContent)
    : null;

  const hasMapSelection =
    selectedStateIds.size > 0 || selectedLgaId !== null;
  const showOverlay = selectedOverlay !== null;
  const guideLayer = overlayGuideLayer;
  const showDirectionsPanel = directionsPanelTarget !== null;
  const showOverlayGuide = guideLayer !== null && !showOverlay && !showDirectionsPanel;
  const showMetroMap =
    metroMapViews.length > 0 &&
    !hasMapSelection &&
    !showOverlay &&
    !showDirectionsPanel &&
    !showOverlayGuide &&
    !activeRegionId;

  const activeRegion = activeRegionId
    ? regions.find((r) => r.id === activeRegionId) ?? null
    : null;
  const showOverview =
    !hasMapSelection &&
    !activeRegionId &&
    !showOverlay &&
    !showOverlayGuide &&
    !showMetroMap &&
    !showDirectionsPanel;
  const showRegion =
    activeRegion &&
    !hasMapSelection &&
    !showOverlay &&
    !showDirectionsPanel &&
    !showMetroMap;
  const compareStatesEligible = canCompareStates({
    mapType,
    selectedStateIds,
    selectedLgaId,
  });
  const showStateCompare =
    compareView === "state" &&
    compareStatesEligible &&
    !showOverlay &&
    !showDirectionsPanel &&
    !lgaC;

  const panelContentKey =
    directionsPanelTarget?.name ??
    selectedOverlay?.id ??
    guideLayer ??
    (showMetroMap ? `metro-${activeMetroPanelId ?? metroMapViews[0]?.id}` : null) ??
    lgaLoc?.id ??
    panelState?.id ??
    (showStateCompare
      ? `compare-${selectedStates.map((s) => s.id).sort().join(",")}`
      : null) ??
    activeRegion?.id ??
    (showOverview ? "overview" : "empty");

  useEffect(() => {
    if (!showStateCompare) setDesktopCompareOpen(false);
  }, [showStateCompare]);

  const wards = selectedLgaId ? wardsByLga[selectedLgaId] ?? [] : [];

  const activeMetro =
    metroMapViews.find((v) => v.id === (activeMetroPanelId ?? metroMapViews[0]?.id)) ??
    metroMapViews[0];

  const sheetTitle = showDirectionsPanel
    ? directionsPanelTarget?.name ?? "Directions"
    : selectedOverlay
    ? selectedOverlay.name
    : showMetroMap
      ? activeMetro?.label ?? "Metro areas"
    : guideLayer
      ? OVERLAY_LAYER_LABELS[guideLayer].label
    : lgaLoc
    ? lgaLoc.name
    : showStateCompare
      ? "Compare states"
      : panelState
      ? panelState.name
      : activeRegion
          ? activeRegion.name
          : "NaijaAtlas";

  const sheetSubtitle = showDirectionsPanel
    ? "Directions · location panel"
    : selectedOverlay
    ? `${OVERLAY_LAYER_LABELS[selectedOverlay.layerId].label} · Map feature`
    : showMetroMap
      ? metroMapViews.length > 1
        ? `${metroMapViews.length} metros on map`
        : "Metro · LGAs highlighted on map"
    : guideLayer
      ? "Layer guide · tap features on the map"
    : lgaLoc
    ? `${lgaLoc.stateName} · LGA`
    : showStateCompare
      ? `${selectedStates.length} states · side-by-side metrics`
      : panelState
      ? `${panelState.regionName} · State${
          selectedStates.length > 1
            ? ` · ${selectedStates.length} on map`
            : ""
        }`
      : activeRegion
          ? `${activeRegion.stateIds.length} states`
          : undefined;

  const inner = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 lg:block hidden">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {showDirectionsPanel
            ? "Directions"
            : showOverlay
              ? "Map feature"
            : showOverlayGuide
              ? "Layer guide"
            : showStateCompare
              ? "Compare"
            : showMetroMap
              ? "Metro"
            : hasMapSelection
              ? "Location"
              : activeRegionId
                ? "Region"
                : "Overview"}
        </p>
        {!showOverlay && !showDirectionsPanel && <Breadcrumbs states={states} lgas={lgas} />}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isMobile && hasMapSelection && !showOverlay && !showDirectionsPanel && (
          <div className="mb-3 lg:hidden">
            <Breadcrumbs states={states} lgas={lgas} />
          </div>
        )}

        <FadeIn animationKey={panelContentKey}>
          {showDirectionsPanel && <DirectionsPanel />}

          {showOverlay && selectedOverlay && !showDirectionsPanel && (
            <OverlayFeaturePanel feature={selectedOverlay} states={states} />
          )}

          {showOverlayGuide && guideLayer && !showDirectionsPanel && (
            <OverlayLayerGuidePanel layerId={guideLayer} />
          )}

          {showMetroMap && !showDirectionsPanel && (
            <MetroMapPanel metroGroups={metroGroups} lgas={lgas} />
          )}

          {showOverview && !showDirectionsPanel && (
            <NigeriaOverview
              states={states}
              lgas={lgas}
              compareBundle={compareBundle}
              countryNotes={countryNotes}
              peopleNotes={peopleNotes}
            />
          )}

          {showRegion && activeRegion && !showDirectionsPanel && (
            <RegionDetails
              region={activeRegion}
              states={states}
              stateContent={stateContent}
            />
          )}

          {lgaC && lgaLoc && !showOverlay && !showDirectionsPanel && (
            <LgaDetails
              content={lgaC}
              location={lgaLoc}
              regionName={
                regions.find((r) => r.id === lgaLoc.regionId)?.name
              }
              wards={wards}
              general={selectedLgaId ? lgaGeneral[selectedLgaId] : undefined}
              metroGroups={metroGroups}
              lgas={lgas}
            />
          )}

          {!lgaC && panelState && panelStateContent && !showOverlay && !showDirectionsPanel && !showStateCompare && (
            <StateDetails
              content={panelStateContent}
              location={panelState}
              lgas={lgas}
              compareBundle={compareBundle}
              selectedLgaId={selectedLgaId}
              onSelectLga={toggleLgaSelection}
              metroGroups={metroGroups}
              stateNotesMap={stateNotes}
            />
          )}

          {showStateCompare && !isMobile && (
            <StateCompare
              states={selectedStates}
              contents={stateContent}
              lgas={lgas}
              compareBundle={compareBundle}
              onExpand={() => setDesktopCompareOpen(true)}
            />
          )}

          {!lgaC &&
            !panelState &&
            !showStateCompare &&
            !showDirectionsPanel &&
            selectedStates.length > MAX_COMPARE_STATES && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedStates.length} states selected
              </h3>
              <p className="text-sm text-slate-600">
                Exploring LGAs for all selected states on the map. Click an LGA
                for ward details.
              </p>
              <ul className="space-y-2">
                {selectedStates.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.regionName} · {s.lgaCount} LGAs
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </FadeIn>
      </div>
      <footer className="p-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed bg-slate-50/50 hidden lg:block">
        Boundaries © UN SALB / OSGoF · Hierarchy © temikeezy · Polling units © INEC via JayCodist · Map © OpenStreetMap
      </footer>
    </div>
  );

  const hasSheetContent = hasMapSelection || !!activeRegionId || showOverlay || showOverlayGuide || showDirectionsPanel;

  if (isMobile) {
    if (mobileSheet === "hidden" && hasSheetContent) {
      return (
        <button
          type="button"
          onClick={() => useMapStore.getState().peekMobileSheet()}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 lg:hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-lg border border-slate-200/80 flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-ng-green" />
          {sheetTitle}
        </button>
      );
    }

    if (mobileSheet === "hidden" && !hasSheetContent) return null;

    return (
      <MobileBottomSheet
        title={sheetTitle}
        subtitle={sheetSubtitle}
        hasContent={hasSheetContent}
      >
        {inner}
      </MobileBottomSheet>
    );
  }

  return (
    <aside className="w-full lg:w-[400px] xl:w-[440px] shrink-0 bg-white border-l border-slate-200/80 flex flex-col h-full shadow-xl lg:shadow-none">
      {inner}
      {!isMobile && showStateCompare && (
        <DesktopCompareModal
          open={desktopCompareOpen}
          onClose={() => setDesktopCompareOpen(false)}
          states={selectedStates}
          contents={stateContent}
          lgas={lgas}
          compareBundle={compareBundle}
        />
      )}
    </aside>
  );
}
