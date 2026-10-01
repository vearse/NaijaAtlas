"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Fuse from "fuse.js";
import SourceNote from "@/components/hub/SourceNote";
import {
  findPollingUnit,
  getPollingWards,
  type FindPollingUnitResult,
  type PollingUnitMatch,
} from "@/app/(marketing)/civic/actions";
import {
  formatDelimitationDisplay,
  formatDelimitationInput,
} from "@/lib/politics/delimitation";

type Mode = "code" | "lga";

const TABS: { id: Mode; label: string }[] = [
  { id: "code", label: "PU code" },
  { id: "lga", label: "Browse LGA" },
];

type LgaSearchRow = {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
};

type WardOption = { id: string; name: string; pollingUnitCount: number };

const fieldClass =
  "h-11 w-full rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10";
const labelClass = "text-label-caps tracking-wider text-text-muted";

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  stateCount: number;
  pollingUnitTotal: number;
  lgaRows: LgaSearchRow[];
  onResultChange: (result: FindPollingUnitResult | null) => void;
};

export default function PollingUnitFinder({
  stateCount,
  pollingUnitTotal,
  lgaRows,
  onResultChange,
}: Props) {
  const [mode, setMode] = useState<Mode>("code");
  const [query, setQuery] = useState("");
  const [lgaQuery, setLgaQuery] = useState("");
  const [selectedLgaId, setSelectedLgaId] = useState("");
  const [showLgaSuggestions, setShowLgaSuggestions] = useState(false);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [wardId, setWardId] = useState("");
  const [pending, startTransition] = useTransition();

  const fuse = useMemo(
    () =>
      new Fuse(lgaRows, {
        keys: ["name", "stateName"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [lgaRows]
  );

  const lgaSuggestions = useMemo(() => {
    const q = lgaQuery.trim();
    if (q.length < 2) return [];
    return fuse.search(q, { limit: 8 }).map((r) => r.item);
  }, [fuse, lgaQuery]);

  const selectedLga = useMemo(
    () => lgaRows.find((l) => l.id === selectedLgaId),
    [lgaRows, selectedLgaId]
  );

  useEffect(() => {
    if (!selectedLgaId) {
      setWards([]);
      setWardId("");
      return;
    }
    void getPollingWards(selectedLgaId).then((rows) => {
      setWards(rows);
      setWardId(rows[0]?.id ?? "");
    });
  }, [selectedLgaId]);

  const run = useCallback(
    (input: Parameters<typeof findPollingUnit>[0]) => {
      startTransition(async () => {
        const next = await findPollingUnit(input);
        onResultChange(next);
      });
    },
    [onResultChange]
  );

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    run({ mode: "delimitation", query });
  }

  const pickLga = (lga: LgaSearchRow) => {
    setSelectedLgaId(lga.id);
    setLgaQuery(`${titleCase(lga.name)}, ${lga.stateName}`);
    setShowLgaSuggestions(false);
    onResultChange(null);
  };

  return (
    <div className="space-y-4 rounded-xl border border-border-subtle bg-surface-card p-6 shadow-sm">
      <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => {
              setMode(tab.id);
              onResultChange(null);
            }}
            className={`rounded-md px-4 py-1.5 text-label-md transition-colors ${
              mode === tab.id
                ? "bg-surface-card font-semibold text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "code" && (
        <form onSubmit={submitCode} className="space-y-2">
          <label className={labelClass} htmlFor="pu-code">
            Polling unit (PU) code
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="pu-code"
              value={query}
              onChange={(e) => setQuery(formatDelimitationInput(e.target.value))}
              inputMode="numeric"
              placeholder="24-08-03-014"
              className={`${fieldClass} font-mono text-sm`}
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-primary-container px-6 text-label-md font-semibold text-white shadow-sm hover:bg-[#006d40] disabled:opacity-60"
            >
              {pending ? "Locating…" : "Locate my unit"}
            </button>
          </div>
          <p className="text-body-sm text-text-muted">
            PU code format: state–LGA–ward–unit (PVC or delimitation register).{" "}
            Example {formatDelimitationDisplay("24/08/03/014")}.
          </p>
          <p className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-2.5 py-2 text-[11px] leading-snug text-sky-900">
            We only need your polling unit code — your VIN is never required.
            Keep your voter ID secure and never share it with anyone.
          </p>
        </form>
      )}

      {mode === "lga" && (
        <div className="space-y-4">
          <div className="relative space-y-2">
            <label className={labelClass} htmlFor="lga-search">
              Local government area
            </label>
            <input
              id="lga-search"
              type="search"
              value={lgaQuery}
              onChange={(e) => {
                setLgaQuery(e.target.value);
                setShowLgaSuggestions(true);
                if (!e.target.value.trim()) {
                  setSelectedLgaId("");
                  onResultChange(null);
                }
              }}
              onFocus={() => setShowLgaSuggestions(true)}
              placeholder="Search LGA, e.g. Lagos Island"
              className={fieldClass}
              autoComplete="off"
            />
            {showLgaSuggestions && lgaSuggestions.length > 0 && (
              <ul
                className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border-subtle bg-surface-card py-1 shadow-lg"
                role="listbox"
              >
                {lgaSuggestions.map((lga) => (
                  <li key={lga.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-body-sm hover:bg-emerald-50"
                      onClick={() => pickLga(lga)}
                    >
                      <span className="font-semibold text-text-primary">
                        {titleCase(lga.name)}
                      </span>
                      <span className="block text-text-muted">
                        {lga.stateName} State
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedLga && (
            <label className="block">
              <span className={labelClass}>Ward</span>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className={`${fieldClass} mt-2`}
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {titleCase(w.name)} ({w.pollingUnitCount.toLocaleString()}{" "}
                    PUs)
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            disabled={!wardId || pending}
            onClick={() => wardId && run({ mode: "ward", wardId })}
            className="inline-flex h-11 items-center rounded-lg bg-primary-container px-6 text-label-md font-semibold text-white hover:bg-[#006d40] disabled:opacity-60"
          >
            {pending ? "Locating…" : "Show polling area"}
          </button>
          <p className="text-body-sm text-text-muted">
            Pick the ward that matches your registration — we map your senatorial
            district and federal constituency from INEC delimitation.
          </p>
        </div>
      )}

      <SourceNote source="INEC delimitation register" updated="Sep 2025" />
      <p className="text-body-sm text-slate-400">
        {pollingUnitTotal.toLocaleString()} polling units across {stateCount}{" "}
        states and the FCT.
      </p>
    </div>
  );
}

export type { FindPollingUnitResult, PollingUnitMatch };
