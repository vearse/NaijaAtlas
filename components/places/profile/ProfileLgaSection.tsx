"use client";

import Link from "next/link";
import type { LgaLocation } from "@/types/location";
import { formatNumber } from "@/lib/places/formatters";
import {
  IconArrow,
  IconChevronRight,
  IconMap,
  IconSearch,
} from "@/components/landing/icons";

/**
 * Local government areas: the searchable list from the existing profile, plus the
 * design's active-selection dossier for whichever LGA is selected. Selecting a
 * row fills the panel instead of navigating, so the map link stays explicit.
 */
export default function ProfileLgaSection({
  lgas,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  stateId,
  stateName,
}: {
  lgas: LgaLocation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  query: string;
  onQueryChange: (value: string) => void;
  stateId: string;
  stateName: string;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q ? lgas.filter((l) => l.name.toLowerCase().includes(q)) : lgas;
  const selected = lgas.find((l) => l.id === selectedId) ?? null;
  const capital = lgas.find((l) => l.name === stateName);

  return (
    <section id="lgas" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-label-caps uppercase text-text-muted">
            Sub-national administrative units
          </p>
          <h2 className="mt-1 font-landing-display text-headline-xl text-text-primary">
            Local government areas ({lgas.length})
          </h2>
        </div>
        <p className="text-body-sm text-text-muted">
          {formatNumber(lgas.length)} constitutional tier-3 units
        </p>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex max-w-md items-center gap-3 rounded-2xl border border-border-subtle bg-surface-card px-4 py-2.5 focus-within:border-primary-container focus-within:ring-4 focus-within:ring-emerald-100">
            <IconSearch className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Filter LGAs…"
              aria-label={`Filter ${stateName} local government areas`}
              className="flex-1 bg-transparent text-body-md text-text-primary placeholder:text-slate-400 outline-none"
            />
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {filtered.map((lga) => {
              const active = selectedId === lga.id;
              const isCapital = capital?.id === lga.id;
              return (
                <li key={lga.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(active ? null : lga.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-body-sm font-semibold transition-colors ${
                      active
                        ? "border-primary-container bg-primary-tint-light text-primary"
                        : "border-border-subtle bg-surface-card text-text-primary hover:border-primary-container/50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{lga.name}</span>
                      <span className="block text-[11px] font-normal text-text-muted">
                        {lga.wardCount} wards
                        {lga.areaKm2 ? ` · ${formatNumber(lga.areaKm2)} km²` : ""}
                      </span>
                    </span>
                    {isCapital ? (
                      <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                        Capital
                      </span>
                    ) : (
                      <IconChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {filtered.length === 0 ? (
            <p className="mt-4 text-body-sm text-text-muted">
              No LGA matches “{query}”.
            </p>
          ) : null}
        </div>

        {/* Active selection dossier */}
        <aside className="lg:col-span-5">
          <div
            className={`rounded-2xl border p-5 ${
              selected
                ? "border-primary-container/40 bg-surface-card"
                : "border-dashed border-border-subtle bg-slate-50"
            }`}
          >
            <p className="text-label-caps uppercase text-text-muted">
              Active selection
            </p>
            {selected ? (
              <>
                <h3 className="mt-2 font-landing-display text-headline-md text-text-primary">
                  {selected.name} LGA
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <Cell term="LGA ID" value={selected.id} />
                  <Cell term="Electoral wards" value={formatNumber(selected.wardCount)} />
                  <Cell
                    term="Land area"
                    value={selected.areaKm2 ? `${formatNumber(selected.areaKm2)} km²` : "Not published"}
                  />
                  <Cell
                    term="Centroid"
                    value={`${selected.centroid[1].toFixed(3)}°N · ${Math.abs(
                      selected.centroid[0]
                    ).toFixed(3)}°E`}
                  />
                </dl>
                <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-text-muted">
                  Ward and area figures come from the INEC delimitation register and
                  the location gazetteer.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/explore?map=minimal&states=${stateId}&lgas=1&lga=${selected.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-label-md font-bold text-white transition-colors hover:bg-primary"
                  >
                    <IconMap className="h-4 w-4" />
                    Open on Places map
                  </Link>
                  <Link
                    href={`/civic/polling-units?states=${stateId}&lga=${selected.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:bg-slate-50"
                  >
                    Polling units
                    <IconArrow className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-2 text-body-sm text-text-secondary">
                Select an LGA on the left to see its wards, land area and map links.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Cell({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-text-muted">{term}</dt>
      <dd className="truncate text-body-sm font-semibold tabular-nums text-text-primary">
        {value}
      </dd>
    </div>
  );
}