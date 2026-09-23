"use client";

import { useEffect, useRef, useState } from "react";
import { useMapStore, type MapTypeId } from "@/lib/store/mapStore";

const OPTIONS: Array<{
  id: MapTypeId;
  label: string;
  desc: string;
}> = [
  {
    id: "minimal",
    label: "Minimal",
    desc: "Clean blue canvas focused on state & LGA shapes",
  },
  {
    id: "osm",
    label: "Street Map",
    desc: "Real-world streets, buildings, and terrain from OSM",
  },
  {
    id: "election",
    label: "Election",
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

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 shrink-0"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function MapTypeToggle() {
  const mapType = useMapStore((s) => s.mapType);
  const setMapType = useMapStore((s) => s.setMapType);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const active = OPTIONS.find((o) => o.id === mapType) ?? OPTIONS[0];
  const ActiveIcon =
    active.id === "minimal"
      ? MinimalIcon
      : active.id === "osm"
        ? StreetIcon
        : ElectionIcon;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Select map type"
        title={active.desc}
        className={[
          "inline-flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg",
          "min-h-[30px] px-2 py-1 transition-colors hover:bg-white",
        ].join(" ")}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ng-green text-white">
          <ActiveIcon active />
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Map type options"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl"
        >
          {OPTIONS.map((opt, idx) => {
            const on = mapType === opt.id;
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
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  setMapType(opt.id);
                  setOpen(false);
                }}
                title={opt.desc}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  on
                    ? "bg-ng-green text-white shadow-inner"
                    : "text-slate-700 hover:bg-slate-50",
                  idx === 0 ? "rounded-t-xl" : "",
                  idx === OPTIONS.length - 1 ? "rounded-b-xl" : "",
                ].join(" ")}
              >
                <span className="w-5 flex items-center justify-center">
                  <Icon active={on} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {opt.label}
                  </span>
                  <span
                    className={`block text-[10px] leading-tight truncate ${
                      on ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {opt.desc}
                  </span>
                </span>
                {on && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}