"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";

const HINTS_DISMISSED_KEY = "naija-atlas-hints-dismissed";

export default function MapHints() {
  const [panelHidden, setPanelHidden] = useState(true);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const lgaVisibleStateIds = useMapStore((s) => s.lgaVisibleStateIds);
  const dragModeStateId = useMapStore((s) => s.dragModeStateId);
  const mapActionHint = useMapStore((s) => s.mapActionHint);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const activeOverlays = useMapStore((s) => s.activeOverlays);
  const selectedOverlay = useMapStore((s) => s.selectedOverlay);

  useEffect(() => {
    setPanelHidden(localStorage.getItem(HINTS_DISMISSED_KEY) === "1");
  }, []);

  const hint = useMemo(() => {
    if (mapActionHint) return mapActionHint;

    if (dragModeStateId) {
      return "Drag mode — pull the highlighted state on the map";
    }

    if (selectedOverlay) {
      return "Overlay selected — close the panel or click empty map areas for admin selection";
    }

    if (activeOverlays.has("cities")) {
      return "Cities layer — coloured icons by type (capital, port, historic…). Click a city for the panel";
    }

    if (activeOverlays.has("rivers")) {
      return "Rivers layer active — click Niger, Benue, and other rivers for details";
    }

    if (activeOverlays.size > 0) {
      return "Click a highlighted feature for details · admin selection still works on empty areas";
    }

    if (lgaVisibleStateIds.size > 0) {
      return "Click an LGA to select it · click a border for its name";
    }

    if (selectedStateIds.size > 0) {
      return "Show LGAs from the panel · right-click (or long-press) a state to drag";
    }

    if (activeRegionId) {
      return "Click the region again to select all its states";
    }

    return "Click a state to select · double-click to show LGAs · Layers bottom-right";
  }, [
    mapActionHint,
    dragModeStateId,
    selectedOverlay,
    activeOverlays,
    lgaVisibleStateIds.size,
    selectedStateIds.size,
    activeRegionId,
  ]);

  const mobileHint = useMemo(() => {
    if (mapActionHint) return mapActionHint;
    if (dragModeStateId) return "Drag the state on the map";
    if (selectedOverlay) return "Overlay details in panel";
    if (activeOverlays.size > 0) return "Tap a highlighted feature for details";
    if (lgaVisibleStateIds.size > 0) return "Tap an LGA for its name";
    if (selectedStateIds.size > 0) return "Long-press state to drag";
    return "Tap a state to explore";
  }, [
    mapActionHint,
    dragModeStateId,
    selectedOverlay,
    activeOverlays.size,
    lgaVisibleStateIds.size,
    selectedStateIds.size,
  ]);

  useEffect(() => {
    if (!mapActionHint) return;
    const t = window.setTimeout(() => {
      useMapStore.getState().setMapActionHint(null);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [mapActionHint]);

  const dismiss = () => {
    localStorage.setItem(HINTS_DISMISSED_KEY, "1");
    setPanelHidden(true);
  };

  const show = () => {
    localStorage.removeItem(HINTS_DISMISSED_KEY);
    setPanelHidden(false);
  };

  const isTransient = Boolean(mapActionHint || dragModeStateId);

  const barClass =
    "w-full rounded-xl border shadow-sm text-sm min-h-[42px] flex items-center gap-2 px-3 py-2.5";

  if (panelHidden && !isTransient) {
    return (
      <button
        type="button"
        onClick={show}
        className={`${barClass} border-slate-200 bg-white/95 backdrop-blur text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors`}
        aria-label="Show map hints"
        title="Show hints"
      >
        <span className="text-slate-400" aria-hidden>
          💡
        </span>
        <span className="font-medium">Tips</span>
      </button>
    );
  }

  return (
    <div
      className={`${barClass} min-w-0 ${
        isTransient
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-slate-200 bg-white/95 backdrop-blur text-slate-600"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
          isTransient ? "bg-emerald-500" : "bg-ng-green animate-pulse"
        }`}
        aria-hidden
      />
      <p className="min-w-0 flex-1 leading-snug hidden lg:block">{hint}</p>
      <p className="min-w-0 flex-1 leading-snug lg:hidden">{mobileHint}</p>
      {!isTransient && (
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-slate-400 hover:text-slate-600 px-1"
          aria-label="Dismiss hints"
        >
          ✕
        </button>
      )}
    </div>
  );
}
