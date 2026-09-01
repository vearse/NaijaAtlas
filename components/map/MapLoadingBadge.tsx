"use client";

interface MapLoadingBadgeProps {
  label: string;
}

export default function MapLoadingBadge({ label }: MapLoadingBadgeProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-4 py-2 text-xs font-medium text-slate-700 shadow-lg border border-slate-200/80 animate-fade-in">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-ng-green border-t-transparent animate-spin" />
        {label}
      </div>
    </div>
  );
}
