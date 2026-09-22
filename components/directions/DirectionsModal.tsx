"use client";

import VisitDirectionsControl from "@/components/directions/VisitDirectionsControl";
import { useMapStore } from "@/lib/store/mapStore";

export default function DirectionsModal() {
  const feature = useMapStore((s) => s.directionsModalFeature);
  const closeDirectionsModal = useMapStore((s) => s.closeDirectionsModal);
  const openDirectionsPanel = useMapStore((s) => s.openDirectionsPanel);

  if (!feature) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="directions-modal-title"
    >
      <button
        type="button"
        aria-label="Close directions"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={() => closeDirectionsModal()}
      />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#eef2f6] shadow-xl border border-slate-200/80 mx-0 sm:mx-auto">
        <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 py-3 rounded-t-2xl sm:rounded-t-2xl">
          <div className="min-w-0">
            <p
              id="directions-modal-title"
              className="text-sm font-bold text-slate-900 truncate"
            >
              Directions
            </p>
            <p className="text-xs text-slate-500 truncate">{feature.name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openDirectionsPanel(feature)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-ng-green transition-colors"
              aria-label="Focus in location panel"
              title="Show directions in the location panel"
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
                  d="M3.5 4A1.5 1.5 0 015 2.5h3a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm.75 11a.75.75 0 01.75-.75h3a.75.75 0 010 1.5H5A.75.75 0 014.25 15zM13.5 2.5A1.5 1.5 0 0115 4v3a1 1 0 102 0V4a3 3 0 00-3-3h-3a1 1 0 000 2h2.5zM15 12.25a.75.75 0 01.75.75v3a.75.75 0 01-.75.75H12a.75.75 0 010-1.5h2.25V13a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => closeDirectionsModal()}
              className="shrink-0 h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-4">
          <VisitDirectionsControl
            feature={{
              name: feature.name,
              lonLat: feature.lonLat,
              kind:
                feature.kind === "custom"
                  ? "overlay"
                  : feature.kind === "overlay"
                    ? "overlay"
                    : feature.kind,
            }}
            restoreMapTypeOnClose
          />
          <p className="text-[10px] text-slate-400 mt-3 text-center">
            Starting navigation switches the map to Street (OSM) view.
          </p>
        </div>
      </div>
    </div>
  );
}
