"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import { useToastStore } from "@/lib/store/toastStore";
import { MAX_METRO_MAP_VIEWS } from "@/lib/map/metroMapViews";

const HINTS_DISMISSED_KEY = "naija-atlas-hints-dismissed";
const ATTENTION_INTERVAL_MS = 40000;
const ATTENTION_DURATION_MS = 3500;
const COLOR_CYCLE_MS = 4000;

/** Three accents; index 0 is the original neutral Tips bar. */
const TIP_ACCENT_STYLES = [
  "border-border-subtle/90 bg-surface-card/95 backdrop-blur text-text-secondary",
  "border-amber-200/90 bg-amber-50/95 text-amber-950",
  "border-sky-200/90 bg-sky-50/95 text-sky-950",
] as const;

type Props = {
  /** Matches the emerald status chip on section map breadcrumbs. */
  variant?: "bar" | "status";
};

export default function MapHints({ variant = "bar" }: Props) {
  const [panelHidden, setPanelHidden] = useState(true);
  const [accentIdx, setAccentIdx] = useState(0);
  const [attention, setAttention] = useState(false);
  const [hintPulse, setHintPulse] = useState(false);
  const prevHintRef = useRef<string>("");

  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const lgaVisibleStateIds = useMapStore((s) => s.lgaVisibleStateIds);
  const metroMapViews = useMapStore((s) => s.metroMapViews);
  const dragModeStateId = useMapStore((s) => s.dragModeStateId);
  const mapActionHint = useMapStore((s) => s.mapActionHint);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const activeOverlays = useMapStore((s) => s.activeOverlays);
  const selectedOverlay = useMapStore((s) => s.selectedOverlay);
  const activeLens = useMapStore((s) => s.activeLens);
  const mapType = useMapStore((s) => s.mapType);
  const overlayFeatureFocus = useMapStore((s) => s.overlayFeatureFocus);

  useEffect(() => {
    setPanelHidden(localStorage.getItem(HINTS_DISMISSED_KEY) === "1");
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAccentIdx((i) => (i + 1) % TIP_ACCENT_STYLES.length);
    }, COLOR_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeout: number | undefined;
    const interval = window.setInterval(() => {
      setAttention(true);
      timeout = window.setTimeout(() => setAttention(false), ATTENTION_DURATION_MS);
    }, ATTENTION_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  const hint = useMemo(() => {
    if (mapType === "election") {
      return "Election mode — select states to see senatorial districts; click an LGA for candidates";
    }

    if (mapType === "ranking") {
      return "Ranking mode — pick a metric in the panel; click a state to highlight it on the map and list";
    }

    if (overlayFeatureFocus) {
      return `Focus active — only ${overlayFeatureFocus.label} shown · Clear in the feature panel`;
    }

    if (activeLens !== "learn") {
      return `${activeLens === "tourist" ? "Tourist" : "Invest"} lens — map shows matching markers only; panel notes match this view`;
    }

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

    if (activeOverlays.has("landforms")) {
      return "Landforms layer — icons show savanna, basins, wetlands, forests & highlands. Click any icon for details";
    }

    if (activeOverlays.has("lakes")) {
      return "Lakes & ports layer — lakes, reservoirs, the coastline, seaports and terminals. Click any of them for details";
    }

    if (activeOverlays.has("waterways")) {
      return "Waterways layer — click the Niger, Benue and their tributaries for details";
    }

    if (activeOverlays.size > 0) {
      return "Click a highlighted feature for details · admin selection still works on empty areas";
    }

    if (metroMapViews.length > 0) {
      return `Metro on map (${metroMapViews.length}/${MAX_METRO_MAP_VIEWS}) — labeled + colored LGAs are in the metro; gray are not · add more from state Learn tab`;
    }

    if (lgaVisibleStateIds.size > 0) {
      return "LGA browse — each LGA has its own color · click an LGA to select it · click a border for its name";
    }

    if (selectedStateIds.size > 0) {
      return "Tap the map icon on a selected state to show LGAs · long-press a state on the map to drag";
    }

    if (activeRegionId) {
      return "Region highlighted — pick another in the Region menu or on the map · click a state to explore";
    }

    return "Click a state to select · double-click to show LGAs · Layers bottom-right";
  }, [
    activeLens,
    mapType,
    overlayFeatureFocus,
    mapActionHint,
    dragModeStateId,
    selectedOverlay,
    activeOverlays,
    lgaVisibleStateIds.size,
    metroMapViews.length,
    selectedStateIds.size,
    activeRegionId,
  ]);

  const mobileHint = useMemo(() => {
    if (activeLens !== "learn") {
      return `${activeLens === "tourist" ? "Tourist" : "Invest"} lens active`;
    }
    if (mapActionHint) return mapActionHint;
    if (dragModeStateId) return "Drag the state on the map";
    if (selectedOverlay) return "Overlay details in panel";
    if (activeOverlays.size > 0) return "Tap a highlighted feature for details";
    if (metroMapViews.length > 0) {
      return `Metro on map — ${metroMapViews.length} active`;
    }
    if (lgaVisibleStateIds.size > 0) return "Tap an LGA for its name";
    if (selectedStateIds.size > 0) return "Tap the map icon on a selected state to show LGAs";
    return "Tap a state to explore";
  }, [
    activeLens,
    mapType,
    overlayFeatureFocus,
    mapActionHint,
    dragModeStateId,
    selectedOverlay,
    activeOverlays.size,
    lgaVisibleStateIds.size,
    metroMapViews.length,
    selectedStateIds.size,
  ]);

  useEffect(() => {
    if (prevHintRef.current && prevHintRef.current !== hint) {
      setHintPulse(true);
      const t = window.setTimeout(() => setHintPulse(false), ATTENTION_DURATION_MS);
      prevHintRef.current = hint;
      return () => window.clearTimeout(t);
    }
    prevHintRef.current = hint;
  }, [hint]);

  useEffect(() => {
    if (!mapActionHint) return;
    const t = window.setTimeout(() => {
      useMapStore.getState().setMapActionHint(null);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [mapActionHint]);

  const pushToast = useToastStore((s) => s.pushToast);

  useEffect(() => {
    if (!mapActionHint) return;
    pushToast(mapActionHint, "tip");
  }, [mapActionHint, pushToast]);

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
    "w-full rounded-xl border shadow-sm text-sm min-h-[38px] lg:min-h-[42px] flex items-center gap-2 px-3 py-2 lg:py-2.5 transition-colors duration-500";

  const accentStyle = isTransient
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : TIP_ACCENT_STYLES[accentIdx];

  const motionClass =
    !isTransient && (attention || hintPulse)
      ? "animate-naija-attention ring-2 ring-amber-300/80"
      : "";

  if (variant === "status") {
    const text = isTransient ? hint : panelHidden ? "Map tips hidden · tap to show" : hint;
    const pillClass =
      "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-body-sm text-emerald-900 max-w-[min(100%,36rem)] min-w-0";

    if (panelHidden && !isTransient) {
      return (
        <button
          type="button"
          onClick={show}
          className={`${pillClass} hover:border-[#008751] transition-colors`}
          aria-label="Show map hints"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#008751]" aria-hidden />
          <span className="truncate">Show map tips</span>
        </button>
      );
    }

    return (
      <div key={hint} className={`${pillClass} ${motionClass}`}>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            isTransient ? "bg-emerald-500" : "bg-[#008751] animate-pulse"
          }`}
          aria-hidden
        />
        <p className="min-w-0 truncate hidden sm:block">{text}</p>
        <p className="min-w-0 truncate sm:hidden">{mobileHint}</p>
        {!isTransient && (
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 text-emerald-700/60 hover:text-emerald-900 px-0.5"
            aria-label="Dismiss hints"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  if (panelHidden && !isTransient) {
    return (
      <button
        type="button"
        onClick={show}
        className={`${barClass} border-border-subtle bg-surface-card/95 backdrop-blur text-text-muted hover:bg-slate-50 hover:text-slate-700 ${motionClass}`}
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
      key={hint}
      className={`${barClass} min-w-0 ${accentStyle} ${motionClass} animate-fade-in-soft`}
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
          className="shrink-0 text-slate-400 hover:text-text-secondary px-1"
          aria-label="Dismiss hints"
        >
          ✕
        </button>
      )}
    </div>
  );
}
