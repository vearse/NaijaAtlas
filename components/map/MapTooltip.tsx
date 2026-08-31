"use client";

interface MapTooltipProps {
  name: string | null;
  level: string | null;
  x: number;
  y: number;
}

export default function MapTooltip({ name, level, x, y }: MapTooltipProps) {
  if (!name) return null;

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full animate-in fade-in duration-150"
      style={{ left: x, top: y - 14 }}
    >
      <div className="rounded-xl bg-slate-900/95 text-white px-4 py-2 shadow-2xl backdrop-blur-md border border-white/15 min-w-[120px] text-center">
        <div className="font-semibold text-sm leading-tight">{name}</div>
        {level && (
          <div className="text-[10px] uppercase tracking-widest text-emerald-300/90 mt-0.5">
            {level}
          </div>
        )}
      </div>
      <div className="mx-auto w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900/95" />
    </div>
  );
}
