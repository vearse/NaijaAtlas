"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import EmptyState from "@/components/hub/EmptyState";
import {
  findPollingUnit,
  getPollingLgas,
  getPollingWards,
  getPollingStates,
  type FindPollingUnitResult,
  type PollingUnitMatch,
} from "@/app/(marketing)/civic/actions";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  formatDelimitationDisplay,
  formatDelimitationInput,
} from "@/lib/politics/delimitation";

type Mode = "address" | "code" | "ward";

const TABS: { id: Mode; label: string }[] = [
  { id: "address", label: "By address" },
  { id: "code", label: "By PU code" },
  { id: "ward", label: "By ward" },
];

type StateOption = { id: string; name: string; pollingUnitCount: number };
type LgaOption = { id: string; name: string; pollingUnitCount: number };
type WardOption = { id: string; name: string; pollingUnitCount: number };

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const fieldClass =
  "h-11 w-full rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10";
const labelClass = "text-label-caps tracking-wider text-text-muted";

function ResultCard({ match }: { match: PollingUnitMatch }) {
  const { hit, district, constituencies } = match;
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
          <div className="relative h-40 overflow-hidden rounded-xl border border-border-subtle bg-slate-50">
            <NigeriaThumb
              source="states"
              highlight={[hit.stateId]}
              className="h-full w-full"
              title={`${hit.stateName} highlighted`}
            />
            <span className="absolute bottom-2 left-2 rounded-full border border-border-subtle bg-surface-card/90 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              {hit.stateName} State
            </span>
          </div>

          <p className="mt-4 text-label-caps text-primary">
            Ward {titleCase(hit.wardName)}
          </p>
          <h3 className="mt-1 font-landing-display text-headline-sm text-text-primary">
            {hit.wardName === titleCase(hit.wardName)
              ? hit.wardName
              : titleCase(hit.wardName)}
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            {titleCase(hit.lgaName)} LGA · {hit.stateName} State
          </p>

          {district && (
            <p className="mt-1 text-body-sm text-text-secondary">
              {district.name} Senatorial District
              {constituencies.length > 0 && (
                <> · {constituencies[0].name} Federal Constituency</>
              )}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className={labelClass}>Polling units</dt>
              <dd className="mt-1 text-headline-sm font-semibold tabular-nums text-text-primary">
                {hit.wardPollingUnits.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className={labelClass}>Wards in LGA</dt>
              <dd className="mt-1 text-headline-sm font-semibold tabular-nums text-text-primary">
                {hit.lgaWardCount.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className={labelClass}>State units</dt>
              <dd className="mt-1 text-body-md font-semibold tabular-nums text-text-primary">
                {hit.statePollingUnits.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className={labelClass}>LGA units</dt>
              <dd className="mt-1 text-body-md font-semibold tabular-nums text-text-primary">
                {hit.lgaPollingUnits.toLocaleString()}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={sectionMapHref("civic/elections", {
                stateIds: [hit.stateId],
              })}
              className="inline-flex h-11 items-center rounded-xl border border-primary-container px-4 text-label-md text-primary hover:bg-emerald-50"
            >
              View on election map
            </Link>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/places/${hit.stateSlug}`;
                void navigator.clipboard?.writeText(url);
              }}
              className="inline-flex h-11 items-center rounded-xl border border-border-subtle px-4 text-label-md text-text-secondary hover:bg-slate-50"
            >
              Copy link
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className={labelClass}>Your district</p>
          <h4 className="mt-1 text-headline-sm font-semibold text-text-primary">
            {district ? `${district.name} Senate` : "Constituency pending"}
          </h4>

          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-border-subtle">
            {district && (
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-body-sm text-text-secondary">Senate</span>
                <span className="text-body-sm font-semibold text-text-primary">
                  {district.name}
                </span>
              </li>
            )}
            {constituencies.slice(0, 4).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-body-sm text-text-secondary">
                  Federal constituency
                </span>
                <span className="text-body-sm font-semibold text-text-primary">
                  {c.name}
                </span>
              </li>
            ))}
            {district && (
              <li className="px-4 py-3">
                <span className={labelClass}>LGAs in district</span>
                <p className="mt-1 text-body-sm text-text-secondary">
                  {district.lgaNames.slice(0, 8).join(" · ")}
                </p>
              </li>
            )}
          </ul>

          <Link
            href={sectionMapHref("civic/elections", {
              senatorialDistrictId: district?.id,
              stateIds: [hit.stateId],
            })}
            className="mt-4 inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline"
          >
            See this district on the election map
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PollingUnitFinder({
  stateCount,
  pollingUnitTotal,
}: {
  stateCount: number;
  pollingUnitTotal: number;
}) {
  const [mode, setMode] = useState<Mode>("code");
  const [states, setStates] = useState<StateOption[]>([]);
  const [stateId, setStateId] = useState("NG-LA");
  const [lgas, setLgas] = useState<LgaOption[]>([]);
  const [lgaId, setLgaId] = useState("");
  const [wards, setWards] = useState<WardOption[]>([]);
  const [wardId, setWardId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FindPollingUnitResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void getPollingStates().then((rows) => {
      setStates(rows);
      if (rows.length && !rows.some((r) => r.id === stateId)) {
        setStateId(rows[0].id);
      }
    });
    // State list is static for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void getPollingLgas(stateId).then((rows) => {
      setLgas(rows);
      setLgaId(rows[0]?.id ?? "");
    });
  }, [stateId]);

  useEffect(() => {
    if (!lgaId) {
      setWards([]);
      return;
    }
    void getPollingWards(lgaId).then((rows) => {
      setWards(rows);
      setWardId(rows[0]?.id ?? "");
    });
  }, [lgaId]);

  const run = useCallback(
    (input: Parameters<typeof findPollingUnit>[0]) => {
      startTransition(async () => {
        setResult(await findPollingUnit(input));
      });
    },
    []
  );

  function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    run({ mode: "text", query, stateId });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    run({ mode: "delimitation", query });
  }

  const stateName =
    states.find((s) => s.id === stateId)?.name ?? stateId.replace("NG-", "");

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
      <div className="border-b border-border-subtle bg-slate-50 p-2">
        <div
          className="flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Polling unit lookup mode"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => {
                setMode(tab.id);
                setResult(null);
              }}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-label-md transition-colors ${
                mode === tab.id
                  ? "bg-surface-card text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:bg-surface-card/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-6">
        {mode === "code" && (
          <form onSubmit={submitCode} className="max-w-2xl">
            <label className={labelClass} htmlFor="pu-code">
              Polling unit (PU) code
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="pu-code"
                value={query}
                onChange={(e) => setQuery(formatDelimitationInput(e.target.value))}
                inputMode="numeric"
                placeholder="24-01-02-005"
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary-container px-6 text-label-md text-white hover:bg-[#006d40] disabled:opacity-60"
              >
                {pending ? "Locating…" : "Locate my unit"}
              </button>
            </div>
            <p className="mt-2 text-body-sm text-text-muted">
              Code format: state–LGA–ward–unit, as printed on your PVC or the
              INEC delimitation register. {formatDelimitationDisplay("01/01/01/005")} ={" "}
              {formatDelimitationDisplay("24/01/02/005")}.
            </p>
          </form>
        )}

        {mode === "address" && (
          <form onSubmit={submitAddress} className="max-w-3xl">
            <label className={labelClass} htmlFor="pu-address">
              Street, landmark, school or ward name
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select
                aria-label="State"
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className={fieldClass}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                id="pu-address"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="King&apos;s College, or Marina"
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-container px-6 text-label-md text-white hover:bg-[#006d40] disabled:opacity-60"
              >
                {pending ? "Searching…" : "Find polling unit"}
              </button>
            </div>
            <p className="mt-2 text-body-sm text-text-muted">
              We match ward, LGA and state names in {stateName} — we do not
              geocode street addresses yet.
            </p>
          </form>
        )}

        {mode === "ward" && (
          <div className="max-w-3xl">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={labelClass}>State</span>
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className={`${fieldClass} mt-2`}
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.pollingUnitCount.toLocaleString()} PUs)
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>LGA</span>
                <select
                  value={lgaId}
                  onChange={(e) => setLgaId(e.target.value)}
                  className={`${fieldClass} mt-2`}
                >
                  {lgas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {titleCase(l.name)} ({l.pollingUnitCount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Ward</span>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className={`${fieldClass} mt-2`}
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {titleCase(w.name)} ({w.pollingUnitCount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              disabled={!wardId || pending}
              onClick={() => wardId && run({ mode: "ward", wardId })}
              className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary-container px-6 text-label-md text-white hover:bg-[#006d40] disabled:opacity-60"
            >
              {pending ? "Locating…" : "Show polling unit"}
            </button>
          </div>
        )}
      </div>

      {result?.note && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900">
          {result.note}
        </p>
      )}

      {result && !result.primary && !result.note && (
        <EmptyState title="No match for that lookup" badge="No result">
          Try the PU code tab with the code printed on your voter card, or pick
          the ward directly.
        </EmptyState>
      )}

      {result?.primary && (
        <div className="mt-6">
          <ResultCard match={result.primary} />
          {result.alternatives.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-card p-5">
              <p className={labelClass}>Other matches</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {result.alternatives.map((alt) => (
                  <li key={alt.hit.wardId}>
                    <button
                      type="button"
                      onClick={() =>
                        setResult({ ...result, primary: alt, alternatives: [] })
                      }
                      className="w-full rounded-xl border border-border-subtle px-4 py-3 text-left text-body-sm text-slate-700 hover:border-primary-container/50 hover:bg-emerald-50/50"
                    >
                      <span className="font-semibold text-text-primary">
                        {titleCase(alt.hit.wardName)}
                      </span>
                      <span className="block text-text-muted">
                        {titleCase(alt.hit.lgaName)} · {alt.hit.stateName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <SourceNote
        className="mt-6"
        source="INEC delimitation register"
        updated="Sep 2025"
      />
      <p className="mt-1 text-body-sm text-slate-400">
        {pollingUnitTotal.toLocaleString()} polling units across {stateCount}{" "}
        states and the FCT.
      </p>
    </div>
  );
}
