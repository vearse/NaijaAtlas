"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import LocationSearch from "@/components/search/LocationSearch";
import PoweredByIseOwo from "@/components/PoweredByIseOwo";
import RegionFilter from "@/components/map/RegionFilter";
import SelectedStatesBar from "@/components/map/SelectedStatesBar";
import MapControls from "@/components/map/MapControls";
import LocationPanel from "@/components/location/LocationPanel";
import MobileCompareModal from "@/components/compare/MobileCompareModal";
import MobileInfoModal from "@/components/compare/MobileInfoModal";
import UrlSync from "@/components/UrlSync";
import { useMapStore, MAX_COMPARE_STATES } from "@/lib/store/mapStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type {
  StateLocation,
  LgaLocation,
  RegionLocation,
  StateContent,
  LgaContent,
  WardsByLga,
} from "@/types/location";
import type { CompareBundle } from "@/types/compare";

const NigeriaMap = dynamic(() => import("@/components/map/NigeriaMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl bg-gradient-to-br from-slate-100 to-emerald-50 animate-pulse flex flex-col items-center justify-center gap-3 text-slate-400">
      <div className="text-3xl">🇳🇬</div>
      <p className="text-sm font-medium">Loading map…</p>
    </div>
  ),
});

interface ExplorerShellProps {
  states: StateLocation[];
  lgas: LgaLocation[];
  regions: RegionLocation[];
  stateContent: StateContent[];
  lgaContent: LgaContent[];
  wardsByLga: WardsByLga;
  compareBundle: CompareBundle;
}

export default function ExplorerShell({
  states,
  lgas,
  regions,
  stateContent,
  lgaContent,
  wardsByLga,
  compareBundle,
}: ExplorerShellProps) {
  const isMobile = useIsMobile();
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const mobileSheet = useMapStore((s) => s.mobileSheet);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);

  const closeMobileSheet = useMapStore((s) => s.closeMobileSheet);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const selectedStates = states.filter((s) => selectedStateIds.has(s.id));
  const singleStateSelected =
    !selectedLgaId && selectedStateIds.size === 1;
  const showCompare =
    !selectedLgaId &&
    selectedStates.length >= 2 &&
    selectedStates.length <= MAX_COMPARE_STATES;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#eef2f6]">
      <UrlSync />
      <header className="shrink-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm relative">
        <div className="max-w-[1600px] mx-auto px-3 lg:px-6 py-2.5 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl bg-ng-green text-lg lg:text-xl shadow-sm">
                🇳🇬
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-none">
                  NaijaAtlas
                </h1>
                <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5 hidden sm:block">
                  36 states · 774 LGAs · 6 regions
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch lg:items-end gap-1.5 w-full lg:w-auto lg:max-w-md">
              <LocationSearch />
              <div className="flex justify-end">
                <PoweredByIseOwo />
              </div>
            </div>
          </div>
          <div className="mt-2 lg:mt-4 space-y-1.5 lg:space-y-2">
            <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Geopolitical regions
            </p>
            <RegionFilter regions={regions} />
            <SelectedStatesBar states={states} />
          </div>
        </div>

        {isMobile && showCompare && (
          <button
            type="button"
            onClick={() => setCompareModalOpen(true)}
            className="absolute top-2.5 right-3 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-ng-green text-white px-3 py-2 text-xs font-semibold shadow-md min-h-[36px]"
            aria-label="Open state comparison"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M6 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1z" />
            </svg>
            Compare
          </button>
        )}

        {isMobile && singleStateSelected && mobileSheet === "open" && (
          <button
            type="button"
            onClick={() => closeMobileSheet()}
            className="absolute top-2.5 right-3 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-white text-slate-800 border border-slate-200 px-3 py-2 text-xs font-semibold shadow-sm min-h-[36px]"
            aria-label="Return to map view"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-ng-green"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            View map
          </button>
        )}

        {isMobile &&
          singleStateSelected &&
          mobileSheet !== "open" && (
            <button
              type="button"
              onClick={() => openMobileSheet()}
              className="absolute top-2.5 right-3 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-ng-green text-white px-3 py-2 text-xs font-semibold shadow-md min-h-[36px]"
              aria-label="View state details"
            >
              Details
            </button>
          )}

        {isMobile &&
          !showCompare &&
          !singleStateSelected &&
          selectedStateIds.size === 0 &&
          !activeRegionId && (
            <button
              type="button"
              onClick={() => setInfoModalOpen(true)}
              className="absolute top-2.5 right-3 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-white text-slate-800 border border-slate-200 px-3 py-2 text-xs font-semibold shadow-sm min-h-[36px]"
              aria-label="Open Nigeria overview"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-ng-green"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Info
            </button>
          )}
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 max-w-[1600px] mx-auto w-full">
        <div className="flex-1 relative p-2 lg:p-5 min-h-0 flex flex-col">
          <div className="relative flex-1 min-h-0">
            <NigeriaMap states={states} regions={regions} lgas={lgas} />
            <MapControls />
            {selectedStateIds.size === 0 &&
              !activeRegionId &&
              mobileSheet !== "open" && (
                <div className="pointer-events-none absolute bottom-14 lg:bottom-8 left-1/2 -translate-x-1/2 z-10 max-w-[90%]">
                  <div className="rounded-full bg-white/95 backdrop-blur-md px-4 lg:px-5 py-2 text-xs lg:text-sm text-slate-600 shadow-lg border border-slate-200/80 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-ng-green animate-pulse shrink-0" />
                    <span className="hidden sm:inline">
                      Click a state to select · double-click or use the panel button to show LGAs
                    </span>
                    <span className="sm:hidden">Tap a state to explore</span>
                  </div>
                </div>
              )}
          </div>
        </div>
        <LocationPanel
          states={states}
          lgas={lgas}
          regions={regions}
          stateContent={stateContent}
          lgaContent={lgaContent}
          wardsByLga={wardsByLga}
          compareBundle={compareBundle}
        />
      </main>

      {isMobile && showCompare && (
        <MobileCompareModal
          open={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          states={selectedStates}
          contents={stateContent}
          lgas={lgas}
          compareBundle={compareBundle}
        />
      )}

      {isMobile && (
        <MobileInfoModal
          open={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          states={states}
          compareBundle={compareBundle}
        />
      )}
    </div>
  );
}
