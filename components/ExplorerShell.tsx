"use client";

import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import LocationSearch from "@/components/search/LocationSearch";
import SearchSpotlight from "@/components/search/SearchSpotlight";
import PoweredByIseOwo from "@/components/PoweredByIseOwo";
import LensSelect from "@/components/map/LensSelect";
import RegionSelect from "@/components/map/RegionSelect";
import SelectedStatesBar from "@/components/map/SelectedStatesBar";
import MapControls from "@/components/map/MapControls";
import MapHints from "@/components/map/MapHints";
import MapBottomToolbar from "@/components/map/MapBottomToolbar";
import MapTypeToggle from "@/components/map/MapTypeToggle";
import CompareMenu from "@/components/compare/CompareMenu";
import LocationPanel from "@/components/location/LocationPanel";
import CompareModal from "@/components/compare/CompareModal";
import MobileInfoModal from "@/components/compare/MobileInfoModal";

import DirectionsModal from "@/components/directions/DirectionsModal";
import UrlSync from "@/components/UrlSync";
import {
  useMapStore,
  canCompareStates,
} from "@/lib/store/mapStore";
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
import type { PoliticsBundle, PollingUnitCountsBundle } from "@/types/politics";
import { buildCapitalLgaIdMap } from "@/lib/map/capitalLga";
import ElectionPanel from "@/components/election/ElectionPanel";
import ElectionMapLegend from "@/components/election/ElectionMapLegend";
import RankingPanel from "@/components/ranking/RankingPanel";
import RankingMapLegend from "@/components/ranking/RankingMapLegend";
import MapCornerSlot from "@/components/map/MapCornerSlot";
import ToastStack from "@/components/ui/ToastStack";
import SectionMapHeader from "@/components/workspace/SectionMapHeader";
import RankingsWorkspaceChrome from "@/components/workspace/RankingsWorkspaceChrome";
import RankingsMapCallouts from "@/components/workspace/RankingsMapCallouts";
import WorkspaceMapFooter from "@/components/workspace/WorkspaceMapFooter";
import {
  SECTION_PRESETS,
  type SectionWorkspaceMode,
} from "@/lib/map/sectionPresets";

const NigeriaMap = dynamic(() => import("@/components/map/NigeriaMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl bg-gradient-to-br from-slate-100 to-emerald-50 animate-pulse flex flex-col items-center justify-center gap-3 text-slate-400">
      <div className="text-3xl">🇳🇬</div>
      <p className="text-sm font-medium">Loading map…</p>
    </div>
  ),
});

export type { SectionWorkspaceMode };

interface ExplorerShellProps {
  sectionWorkspace?: SectionWorkspaceMode;
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
  politics: PoliticsBundle;
  pollingCounts: PollingUnitCountsBundle;
}

export default function ExplorerShell({
  sectionWorkspace,
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
  politics,
  pollingCounts,
}: ExplorerShellProps) {
  const isMobile = useIsMobile();
  const mapType = useMapStore((s) => s.mapType);
  const preset = sectionWorkspace ? SECTION_PRESETS[sectionWorkspace] : null;

  // Runs before UrlSync's effect, so `layers=` / `focus=` in the URL still win.
  useLayoutEffect(() => {
    if (!preset) {
      useMapStore.setState({ lgaUi: true, sectionMap: false });
      return;
    }
    const store = useMapStore.getState();
    if (preset.id === "rankings") store.setMapType("ranking");
    else if (preset.id === "elections") store.setMapType("election");
    else if (store.mapType === "election" || store.mapType === "ranking") {
      store.setMapType("minimal");
    }
    store.setActiveLens(preset.lens);
    useMapStore.setState({
      sectionMap: true,
      lgaUi: !!preset.lgaAndCompare || preset.id === "elections",
      activeOverlays: new Set(preset.defaultLayers),
      lensOverlaysCustomized: false,
    });
    for (const group of preset.reveal ?? []) store.setOptInGroup(group, true);
  }, [preset]);
  const isElectionMode =
    mapType === "election" || sectionWorkspace === "elections";
  const isRankingMode =
    mapType === "ranking" || sectionWorkspace === "rankings";
  const isSpecialMapMode = isElectionMode || isRankingMode;
  const defaultMapType =
    sectionWorkspace === "rankings"
      ? "ranking"
      : sectionWorkspace === "elections"
        ? "election"
        : undefined;
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const mobileSheet = useMapStore((s) => s.mobileSheet);
  const openMobileSheet = useMapStore((s) => s.openMobileSheet);

  const closeMobileSheet = useMapStore((s) => s.closeMobileSheet);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [searchSpotlightOpen, setSearchSpotlightOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // The bottom-right map slot rotates between these cards every 15s.
  //
  // Eligibility is mode-based and decided here so it applies on the very first
  // render. Separately, each card reports whether it actually rendered content
  // so an empty legend is skipped rather than rotating to a blank frame. The
  // content flags start optimistic (true) and reset to true whenever the card
  // becomes eligible again — if they started false, a card that is hidden by
  // its parent could never mount, never report, and would be stuck hidden.
  const rankingEligible = isRankingMode;
  const [rankingHasContent, setRankingHasContent] = useState(true);

  useEffect(() => {
    setRankingHasContent(true);
  }, [rankingEligible]);

  const cornerCards = useMemo(
    () => [
      {
        key: "ranking-legend",
        visible: rankingEligible && rankingHasContent,
        node: (
          <RankingMapLegend
            compareBundle={compareBundle}
            states={states}
            onVisibleChange={setRankingHasContent}
          />
        ),
      },
    ],
    [compareBundle, states, rankingEligible, rankingHasContent]
  );

  const capitalLgaByState = useMemo(
    () => buildCapitalLgaIdMap(lgas, compareBundle),
    [lgas, compareBundle]
  );

  const selectedStates = states.filter((s) => selectedStateIds.has(s.id));
  const compareView = useMapStore((s) => s.compareView);
  const closeCompareView = useMapStore((s) => s.closeCompareView);
  const compareStatesEligible = canCompareStates({
    mapType,
    selectedStateIds,
    selectedLgaId,
  });
  const showStateCompare = compareView === "state" && compareStatesEligible;
  const statePanelOpen =
    !selectedLgaId && selectedStateIds.size >= 1 && !showStateCompare;
  const lgaSelected = selectedLgaId !== null;

  useEffect(() => {
    if (isMobile && showStateCompare) setCompareModalOpen(true);
  }, [isMobile, showStateCompare]);

  return (
    <div
      className={`flex flex-col bg-surface-canvas ${
        sectionWorkspace ? "min-h-screen" : "h-[100dvh]"
      }`}
    >
      <UrlSync defaultMapType={defaultMapType} />
      {preset && <SectionMapHeader preset={preset} />}
      {!preset && (
      <header className="shrink-0 z-20 border-b border-border-subtle/80 bg-surface-card/90 backdrop-blur-xl shadow-sm relative">
        <div className="max-w-[1600px] mx-auto px-3 lg:px-6 py-2 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 justify-between">
            <div className="flex flex-col items-start gap-1.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl bg-ng-green text-lg lg:text-xl shadow-sm">
                  🇳🇬
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-text-primary tracking-tight leading-none">
                    NaijaAtlas
                  </h1>
                  <p className="text-[11px] lg:text-xs text-text-muted mt-0.5 hidden sm:block">
                    {isElectionMode
                      ? "2027 elections · PU locator · Senate districts"
                      : isRankingMode
                        ? "State rankings · Economy & Social indicators"
                        : "36 states · 774 LGAs · 6 regions"}
                  </p>
                </div>
              </div>
              <PoweredByIseOwo />
            </div>
            <div className="hidden lg:flex flex-col items-stretch gap-1.5 lg:flex-1 lg:max-w-md">
              {!isSpecialMapMode && <LocationSearch lgas={lgas} />}
              <MapHints />
            </div>
          </div>
          <div className="mt-2 lg:mt-4 space-y-1.5 lg:space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap w-full">
              <div className="flex items-center gap-2 flex-wrap">
                {!isSpecialMapMode && (
                  <>
                    <LensSelect />
                    <RegionSelect regions={regions} />
                    <CompareMenu />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <MapTypeToggle />
              </div>
            </div>
            <SelectedStatesBar states={states} />
          </div>
        </div>

        {isMobile && showStateCompare && (
          <button
            type="button"
            onClick={() => setCompareModalOpen(true)}
            className="absolute top-2.5 right-14 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-ng-green text-white px-3 py-2 text-xs font-semibold shadow-md min-h-[36px]"
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

        {isMobile && isElectionMode && (
          <button
            type="button"
            onClick={() => openMobileSheet()}
            className="absolute top-2.5 right-14 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-ng-green text-white px-3 py-2 text-xs font-semibold shadow-md min-h-[36px]"
            aria-label="Open election panel"
          >
            Election
          </button>
        )}

        {isMobile && isRankingMode && (
          <button
            type="button"
            onClick={() => openMobileSheet()}
            className="absolute top-2.5 right-14 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-ng-green text-white px-3 py-2 text-xs font-semibold shadow-md min-h-[36px]"
            aria-label="Open ranking panel"
          >
            Rankings
          </button>
        )}

        {isMobile &&
          !isSpecialMapMode &&
          (statePanelOpen || lgaSelected) &&
          mobileSheet === "open" && (
          <button
            type="button"
            onClick={() => closeMobileSheet()}
            className="absolute top-2.5 right-14 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-surface-card text-slate-800 border border-border-subtle px-3 py-2 text-xs font-semibold shadow-sm min-h-[36px]"
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

        {isMobile && (
          <button
            type="button"
            onClick={() => setSearchSpotlightOpen(true)}
            className="absolute top-2.5 right-3 z-30 lg:hidden flex h-[36px] w-[36px] items-center justify-center rounded-full bg-ng-green text-white shadow-md"
            aria-label="Open search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {isMobile &&
          statePanelOpen &&
          mobileSheet !== "open" && (
            <button
              type="button"
              onClick={() => openMobileSheet()}
              className="absolute top-2.5 right-14 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-ng-green text-white px-3 py-2 text-xs font-semibold shadow-md min-h-[36px]"
              aria-label="View state details"
            >
              Details
            </button>
          )}

        {isMobile &&
          !isSpecialMapMode &&
          !showStateCompare &&
          !compareStatesEligible &&
          !statePanelOpen &&
          selectedStateIds.size === 0 &&
          !activeRegionId && (
            <button
              type="button"
              onClick={() => setInfoModalOpen(true)}
              className="absolute top-2.5 right-14 z-30 lg:hidden flex items-center gap-1.5 rounded-full bg-surface-card text-slate-800 border border-border-subtle px-3 py-2 text-xs font-semibold shadow-sm min-h-[36px]"
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
      )}

      <main
        className={`flex flex-col lg:flex-row min-h-0 mx-auto w-full ${
          preset
            ? "flex-none max-w-[1680px] h-[calc(100dvh-6.5rem)] overflow-hidden lg:gap-5 lg:p-5 [--panel-w:min(560px,42vw)] [--panel-wx:620px]"
            : "flex-1 max-w-[1600px]"
        }`}
      >
        <div className={`flex-1 relative min-h-0 flex flex-col ${preset ? "p-2 lg:p-0" : "p-2 lg:p-5"}`}>
          <div
            className={`relative flex-1 min-h-0 ${
              preset ? "rounded-2xl overflow-hidden border border-slate-200 bg-[#dbe5ee]" : ""
            }`}
          >
            <NigeriaMap
              states={states}
              regions={regions}
              lgas={lgas}
              capitalLgaByState={capitalLgaByState}
              politicsLookups={politics.lookups}
              compareBundle={compareBundle}
            />
            {preset?.lgaAndCompare && (
              <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
                <RegionSelect regions={regions} />
                <CompareMenu />
              </div>
            )}
            {!isSpecialMapMode && (!preset || preset.layers.length > 0) && (
              <MapBottomToolbar
                layers={preset?.layers}
                basemapToggle={preset ? !!preset.basemapToggle : false}
              />
            )}
            <ElectionMapLegend lookups={politics.lookups} />
            {sectionWorkspace === "rankings" && (
              <RankingsMapCallouts
                compareBundle={compareBundle}
                states={states}
              />
            )}
            <MapCornerSlot cards={cornerCards} />
            <MapControls />
          </div>
        </div>
        {isElectionMode ? (
          <ElectionPanel
            politics={politics}
            pollingCounts={pollingCounts}
            lgas={lgas}
          />
        ) : isRankingMode ? (
          sectionWorkspace === "rankings" ? (
            <RankingsWorkspaceChrome
              compareBundle={compareBundle}
              states={states}
              regions={regions}
            />
          ) : (
            <RankingPanel
              compareBundle={compareBundle}
              states={states}
              regions={regions}
            />
          )
        ) : (
          <LocationPanel
            states={states}
            lgas={lgas}
            regions={regions}
            stateContent={stateContent}
            lgaContent={lgaContent}
            wardsByLga={wardsByLga}
            compareBundle={compareBundle}
            metroGroups={metroGroups}
            stateNotes={stateNotes}
            countryNotes={countryNotes}
            peopleNotes={peopleNotes}
            lgaGeneral={lgaGeneral}
            presidential={politics.presidential}
          />
        )}
      </main>

      {isMobile && showStateCompare && (
        <CompareModal
          open={compareModalOpen}
          onClose={() => {
            setCompareModalOpen(false);
            closeCompareView();
          }}
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
          lgas={lgas}
          compareBundle={compareBundle}
          countryNotes={countryNotes}
          peopleNotes={peopleNotes}
          presidential={politics.presidential}
        />
      )}


      <SearchSpotlight
        open={searchSpotlightOpen}
        onClose={() => setSearchSpotlightOpen(false)}
        lgas={lgas}
      />

      <DirectionsModal />
      <ToastStack />
      {sectionWorkspace && <WorkspaceMapFooter />}
    </div>
  );
}
