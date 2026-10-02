"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { HubPlace } from "@/lib/server/loadTravelHubData";

export type PickOption = {
  value: string;
  label: string;
  /** Group heading, e.g. Cities or Destinations. */
  group: string;
  hint: string;
};

type Props = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: PickOption[];
  accent?: boolean;
  placeholder?: string;
  /** Rendered inside the field on the right, e.g. a "use my location" button. */
  action?: React.ReactNode;
  size?: "sm" | "md";
};

/**
 * Searchable place field for the route planner.
 *
 * Replaces the native `<select>` because 200+ mapped places are unusable in one,
 * and because the From field needs a free-text search plus "use my location".
 */
export default function PlacePicker({
  label,
  value,
  onChange,
  options,
  accent,
  placeholder = "Search cities or destinations",
  action,
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  const byValue = useMemo(
    () => new Map(options.map((o) => [o.value, o])),
    [options]
  );
  const selected = byValue.get(value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint.toLowerCase().includes(q) ||
        o.group.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const commit = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((i) =>
        e.key === "ArrowDown"
          ? Math.min(i + 1, matches.length - 1)
          : Math.max(i - 1, 0)
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = matches[highlight];
      if (pick) commit(pick.value);
      return;
    }
    if (e.key === "Tab") setOpen(false);
  };

  const pad = size === "sm" ? "py-1.5 text-body-sm" : "py-2.5 text-body-sm";

  return (
    <div className="min-w-0" ref={wrapRef}>
      <label
        htmlFor={`${listId}-input`}
        className="mb-1.5 block font-label-caps text-label-caps uppercase text-text-muted"
      >
        {label}
      </label>

      {/* `relative` anchors the results list to the field, not the whole fieldset. */}
      <div className="relative">
        <div
          className={`flex items-center rounded-lg border bg-surface-base transition-colors ${
            open
              ? "border-primary-container ring-4 ring-emerald-500/10"
              : "border-border-subtle"
          }`}
        >
          <span
            className={`pointer-events-none pl-3 text-[15px] ${accent ? "text-primary" : "text-text-muted"}`}
            aria-hidden
          >
            {accent ? "●" : "✈"}
          </span>

          <input
            id={`${listId}-input`}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={open ? query : (selected?.label ?? "")}
            placeholder={selected ? selected.label : placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className={`w-full min-w-0 bg-transparent px-2 ${pad} text-text-primary placeholder:text-slate-400 focus:outline-none`}
          />

          {action}

          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setQuery("");
              setHighlight(0);
            }}
            aria-label={open ? `Close ${label} list` : `Browse ${label} list`}
            className="shrink-0 px-2.5 text-text-muted transition-transform hover:text-text-primary"
          >
            <span
              className={`inline-block transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▾
            </span>
          </button>
        </div>

        {open ? (
          <div
            className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border-subtle bg-surface-card p-1 shadow-lg"
            role="listbox"
            aria-label={`${label} results`}
            id={listId}
          >
            {matches.length === 0 ? (
              <p className="px-3 py-4 text-body-sm text-text-muted">
                No place matches “{query}”.
              </p>
            ) : (
              Object.entries(
                matches.reduce<Record<string, PickOption[]>>((acc, o) => {
                  (acc[o.group] ??= []).push(o);
                  return acc;
                }, {})
              ).map(([group, groupOptions]) => (
                <div key={group}>
                  <p className="px-3 pb-1 pt-2 font-label-caps text-label-caps uppercase text-text-muted">
                    {group}
                  </p>
                  {groupOptions.map((o) => {
                    const index = matches.indexOf(o);
                    const isSelected = o.value === value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => commit(o.value)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-body-sm transition-colors ${
                          index === highlight
                            ? "bg-primary-tint-light text-text-primary"
                            : "text-text-secondary"
                        }`}
                      >
                        <span className="truncate font-medium">{o.label}</span>
                        <span className="shrink-0 text-[11px] text-text-muted">
                          {o.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}