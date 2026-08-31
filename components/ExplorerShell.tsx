"use client";

import dynamic from "next/dynamic";
import LocationSearch from "@/components/search/LocationSearch";
import RegionFilter from "@/components/map/RegionFilter";
import SelectedStatesBar from "@/components/map/SelectedStatesBar";
import MapControls from "@/components/map/MapControls";
import LocationPanel from "@/components/location/LocationPanel";
import UrlSync from "@/components/UrlSync";
import { useMapStore } from "@/lib/store/mapStore";
import type {
  StateLocation,
  LgaLocation,
  RegionLocation,
  StateContent,
  LgaContent,
  WardsByLga,
} from "@/types/location";

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
}

export default function ExplorerShell({
  states,
  lgas,
  regions,
  stateContent,
  lgaContent,
  wardsByLga,
}: ExplorerShellProps) {
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const mobileSheet = useMapStore((s) => s.mobileSheet);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#eef2f6]">
      <UrlSync />
      <header className="shrink-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-[1600px] mx-auto px-3 lg:px-6 py-2.5 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl bg-ng-green text-lg lg:text-xl shadow-sm">
                🇳🇬
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-none">
                  Explore Nigeria
                </h1>
                <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5 hidden sm:block">
                  36 states · 774 LGAs · 6 regions
                </p>
              </div>
            </div>
            <LocationSearch />
          </div>
          <div className="mt-2 lg:mt-4 space-y-1.5 lg:space-y-2">
            <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Geopolitical regions
            </p>
            <RegionFilter regions={regions} />
            <SelectedStatesBar states={states} />
          </div>
        </div>
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
        />
      </main>
    </div>
  );
}
