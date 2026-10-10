"use client";

import { useMapStore } from "@/lib/store/mapStore";

export default function MapControls() {
  const reset = useMapStore((s) => s.reset);
  const mapCanvasView = useMapStore((s) => s.mapCanvasView);

  // Only meaningful while the interactive map canvas is showing.
  if (mapCanvasView !== "map") return null;

  const handleReset = () => {
    reset();
    // Map will fly back via parent effect when selection clears
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleReset}
        className="rounded-lg bg-surface-card/95 backdrop-blur px-4 py-2 text-sm font-medium text-slate-800 shadow-lg border border-border-subtle hover:bg-surface-card transition-all hover:shadow-xl active:scale-[0.98]"
        aria-label="Reset map to Nigeria view"
      >
        Reset map
      </button>
    </div>
  );
}
