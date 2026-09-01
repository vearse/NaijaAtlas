"use client";

import { useMapStore } from "@/lib/store/mapStore";

export default function MapControls() {
  const reset = useMapStore((s) => s.reset);

  const handleReset = () => {
    reset();
    // Map will fly back via parent effect when selection clears
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleReset}
        className="rounded-lg bg-white/95 backdrop-blur px-4 py-2 text-sm font-medium text-slate-800 shadow-lg border border-slate-200 hover:bg-white transition-all hover:shadow-xl active:scale-[0.98]"
        aria-label="Reset map to Nigeria view"
      >
        Reset map
      </button>
    </div>
  );
}
