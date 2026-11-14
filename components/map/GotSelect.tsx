"use client";

import { useEffect, useRef, useState } from "react";
import {
  GOT_OFF,
  GOT_REALMS,
  getGotRealm,
} from "@/lib/map/gotRealms";
import { useMapStore } from "@/lib/store/mapStore";

function CrownIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 14h14v2H3v-2Zm1.2-8.5 2.3 3.8 2.5-5.5 2.5 5.5 2.3-3.8L14 12H6l-1.8-6.5Z" />
    </svg>
  );
}

export default function GotSelect() {
  const gotRealmId = useMapStore((s) => s.gotRealmId);
  const setGotRealmId = useMapStore((s) => s.setGotRealmId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const value = gotRealmId ?? GOT_OFF;
  const active = getGotRealm(gotRealmId);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="GOT interpretive realms"
        title="GOT ↔ Nigeria lens"
        className="inline-flex items-center gap-1.5 rounded-xl bg-surface-card/90 backdrop-blur-md border border-violet-200/80 shadow-lg min-h-[30px] px-2 py-1 transition-colors hover:bg-violet-50"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-900 text-amber-200">
          <CrownIcon />
        </span>
        <span className="inline text-[11px] sm:text-xs font-bold tracking-wide text-violet-950">
          GOT
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 text-violet-400 transition-transform ${
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
          role="dialog"
          aria-label="Game of Thrones realm mapping"
          className="absolute z-50 mt-2 right-0 w-[11.5rem] sm:w-52 overflow-hidden rounded-xl border border-violet-200/80 bg-surface-card shadow-xl"
        >
          <div className="border-b border-violet-100 bg-violet-950 px-2.5 py-2 text-white">
            <p className="text-[9px] font-bold uppercase tracking-widest text-violet-200">
              Temporary
            </p>
            <p className="text-xs font-semibold leading-tight">
              GOT ↔ Nigeria
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setGotRealmId(null);
              setOpen(false);
            }}
            className={`w-full px-2.5 py-1.5 text-left text-[10px] font-semibold border-b border-border-subtle ${
              value === GOT_OFF
                ? "bg-slate-100 text-text-primary"
                : "text-text-secondary hover:bg-slate-50"
            }`}
          >
            Off
          </button>
          <ul
            className="max-h-[min(52vh,320px)] overflow-y-auto"
            aria-label="Realms"
          >
            {GOT_REALMS.map((realm) => {
              const selected = value === realm.id;
              return (
                <li key={realm.id} className="border-t border-slate-100 first:border-t-0">
                  <button
                    type="button"
                    title={realm.interpretation}
                    onClick={() => {
                      setGotRealmId(realm.id);
                      setOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 text-left transition-colors ${
                      selected
                        ? "bg-violet-100/90 ring-1 ring-inset ring-violet-300"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-start gap-1.5">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-sm"
                        style={{ backgroundColor: realm.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold leading-snug text-text-primary">
                          {realm.gotName}
                        </span>
                        <span className="block text-[10px] leading-snug text-text-secondary">
                          {realm.nigeriaTerritory}
                        </span>
                        <span className="mt-0.5 block text-[9px] leading-snug text-text-muted line-clamp-2">
                          {realm.interpretation}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {active && (
            <p className="border-t border-violet-100 bg-violet-50/80 px-2.5 py-1.5 text-[9px] leading-snug text-violet-950">
              <span className="font-semibold">{active.gotName}</span> · no hover
              labels
            </p>
          )}
        </div>
      )}
    </div>
  );
}
