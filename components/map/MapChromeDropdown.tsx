"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MapChromeOption<T extends string> {
  id: T;
  label: string;
  desc?: string;
  icon: ReactNode;
}

interface MapChromeDropdownProps<T extends string> {
  value: T;
  options: MapChromeOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Shown on md+ beside the icon */
  buttonLabel?: string;
  variant?: "neutral" | "accent";
  menuWidthClass?: string;
}

function ChevronDown({ open }: { open: boolean }) {
  return (
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

export default function MapChromeDropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  buttonLabel,
  variant = "neutral",
  menuWidthClass = "w-52",
}: MapChromeDropdownProps<T>) {
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

  const active = options.find((o) => o.id === value) ?? options[0];
  const iconWrap =
    variant === "accent"
      ? "bg-ng-green text-white"
      : "bg-slate-100 text-slate-600";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        title={active.desc ?? active.label}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg min-h-[30px] px-2 py-1 transition-colors hover:bg-white"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md ${iconWrap}`}
        >
          {active.icon}
        </span>
        {buttonLabel && (
          <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[5.5rem] truncate">
            {buttonLabel}
          </span>
        )}
        <ChevronDown open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={`absolute right-0 z-50 mt-2 ${menuWidthClass} overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl`}
        >
          {options.map((opt, idx) => {
            const on = value === opt.id;
            const rowAccent = variant === "accent" && on;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                title={opt.desc}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  rowAccent
                    ? "bg-ng-green text-white shadow-inner"
                    : on
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50",
                  idx === 0 ? "rounded-t-xl" : "",
                  idx === options.length - 1 ? "rounded-b-xl" : "",
                ].join(" ")}
              >
                <span className="w-5 flex items-center justify-center shrink-0">
                  {opt.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {opt.label}
                  </span>
                  {opt.desc && (
                    <span
                      className={`block text-[10px] leading-tight truncate ${
                        rowAccent ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {opt.desc}
                    </span>
                  )}
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
