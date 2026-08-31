"use client";

import { useMapStore, MAX_COMPARE_STATES } from "@/lib/store/mapStore";
import Breadcrumbs from "./Breadcrumbs";
import StateDetails from "./StateDetails";
import LgaDetails from "./LgaDetails";
import StateCompare from "./StateCompare";
import RegionDetails from "./RegionDetails";
import NigeriaOverview from "./NigeriaOverview";
import MobileBottomSheet from "./MobileBottomSheet";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type {
  StateLocation,
  LgaLocation,
  RegionLocation,
  StateContent,
  LgaContent,
  WardsByLga,
} from "@/types/location";

interface LocationPanelProps {
  states: StateLocation[];
  lgas: LgaLocation[];
  regions: RegionLocation[];
  stateContent: StateContent[];
  lgaContent: LgaContent[];
  wardsByLga: WardsByLga;
}

export default function LocationPanel({
  states,
  lgas,
  regions,
  stateContent,
  lgaContent,
  wardsByLga,
}: LocationPanelProps) {
  const isMobile = useIsMobile();
  const { selectedStateIds, selectedLgaId, activeRegionId, setSelectedLga, mobileSheet } =
    useMapStore();

  const lgaLoc = selectedLgaId
    ? lgas.find((l) => l.id === selectedLgaId)
    : null;
  const lgaC = selectedLgaId
    ? lgaContent.find((c) => c.id === selectedLgaId)
    : null;

  const selectedStates = states.filter((s) => selectedStateIds.has(s.id));
  const singleState =
    !lgaLoc && selectedStates.length === 1 ? selectedStates[0] : null;
  const stateC = singleState
    ? stateContent.find((c) => c.id === singleState.id)
    : null;

  const activeRegion = activeRegionId
    ? regions.find((r) => r.id === activeRegionId)
    : null;

  const hasMapSelection =
    selectedStateIds.size > 0 || selectedLgaId !== null;
  const showOverview = !hasMapSelection && !activeRegionId;
  const showRegion = activeRegion && !hasMapSelection;
  const showCompare =
    !lgaC && selectedStates.length >= 2 && selectedStates.length <= MAX_COMPARE_STATES;

  const wards = selectedLgaId ? wardsByLga[selectedLgaId] ?? [] : [];

  const sheetTitle = lgaLoc
    ? lgaLoc.name
    : singleState
      ? singleState.name
      : showCompare
        ? `${selectedStates.length} states`
        : activeRegion
          ? activeRegion.name
          : "Explore Nigeria";

  const sheetSubtitle = lgaLoc
    ? `${lgaLoc.stateName} · LGA`
    : singleState
      ? `${singleState.regionName} · State`
      : showCompare
        ? "Compare view"
        : activeRegion
          ? `${activeRegion.stateIds.length} states`
          : undefined;

  const inner = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 lg:block hidden">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {hasMapSelection ? "Location" : activeRegionId ? "Region" : "Overview"}
        </p>
        <Breadcrumbs states={states} lgas={lgas} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isMobile && hasMapSelection && (
          <div className="mb-3 lg:hidden">
            <Breadcrumbs states={states} lgas={lgas} />
          </div>
        )}

        {showOverview && <NigeriaOverview states={states} />}

        {showRegion && activeRegion && (
          <RegionDetails
            region={activeRegion}
            states={states}
            stateContent={stateContent}
          />
        )}

        {lgaC && lgaLoc && (
          <LgaDetails
            content={lgaC}
            location={lgaLoc}
            regionName={
              regions.find((r) => r.id === lgaLoc.regionId)?.name
            }
            wards={wards}
          />
        )}

        {!lgaC && stateC && singleState && (
          <StateDetails
            content={stateC}
            location={singleState}
            lgas={lgas}
            selectedLgaId={selectedLgaId}
            onSelectLga={setSelectedLga}
          />
        )}

        {showCompare && !stateC && (
          <StateCompare
            states={selectedStates}
            contents={stateContent}
            lgas={lgas}
          />
        )}

        {!lgaC && !stateC && !showCompare && selectedStates.length > MAX_COMPARE_STATES && (
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
      </div>
      <footer className="p-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed bg-slate-50/50 hidden lg:block">
        Boundaries © UN SALB / OSGoF · Hierarchy © temikeezy · Map © OpenStreetMap
      </footer>
    </div>
  );

  const hasSheetContent = hasMapSelection || !!activeRegionId;

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
    </aside>
  );
}
