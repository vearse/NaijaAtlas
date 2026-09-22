"use client";

import { useMapStore, type MapTypeId } from "@/lib/store/mapStore";

const OPTIONS: Array<{
  id: MapTypeId;
  label: string;
  short: string;
  desc: string;
}> = [
  {
    id: "minimal",
    label: "Minimal",
    short: "Minimal",
    desc: "Clean blue canvas focused on state & LGA shapes",
  },
  {
    id: "osm",
    label: "Street Map",
    short: "OSM",
    desc: "Real-world streets, buildings, and terrain from OSM",
  },
  {
    id: "election",
    label: "Election",
    short: "Election",
    desc: "Senatorial districts, polling units, and 2027 candidates",
  },
];

function MinimalIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-slate-500"}`}
    >
      <rect x="1" y="2" width="5" height="4" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="7" y="2" width="7" height="5" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="2" y="8" width="6" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="9" y="9" width="4.5" height="4" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function StreetIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-slate-500"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="8" y1="1" x2="8" y2="15" />
      <line x1="1" y1="8" x2="15" y2="8" />
      <line x1="3" y1="3" x2="5" y2="5" />
      <line x1="13" y1="3" x2="11" y2="5" />
      <line x1="3" y1="13" x2="5" y2="11" />
      <line x1="13" y1="13" x2="11" y2="11" />
    </svg>
  );
}

function ElectionIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-slate-500"}`}
    >
      <rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function MapTypeToggle() {
  const mapType = useMapStore((s) => s.mapType);
  const setMapType = useMapStore((s) => s.setMapType);

  const activeBase =
    "bg-ng-green text-white shadow-inner ring-1 ring-ng-green/80";
  const inactiveBase =
    "text-slate-600 hover:bg-slate-100 hover:text-slate-800 ring-1 ring-transparent";

  return (
    <div role="group" aria-label="Map type selector">
      <div className="inline-flex rounded-xl bg-white/90 backdrop-blur-md p-0.5 sm:p-1 shadow-lg border border-slate-200/80 text-xs font-semibold">
        {OPTIONS.map((opt, idx) => {
          const on = mapType === opt.id;
          const isFirst = idx === 0;
          const isLast = idx === OPTIONS.length - 1;
          const Icon =
            opt.id === "minimal"
              ? MinimalIcon
              : opt.id === "osm"
                ? StreetIcon
                : ElectionIcon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMapType(opt.id)}
              aria-pressed={on}
              title={opt.desc}
              className={[
                "relative inline-flex items-center justify-center gap-1.5",
                "min-h-[30px] px-1.5 sm:px-3.5 py-1",
                "transition-all select-none",
                on ? activeBase : inactiveBase,
                isFirst ? "rounded-l-lg" : "",
                isLast ? "rounded-r-lg" : "",
                !isFirst ? "sm:ml-0.5 ml-px" : "",
              ].join(" ")}
            >
              <Icon active={on} />
            </button>
          );
        })}
      </div>
    </div>
  );
}