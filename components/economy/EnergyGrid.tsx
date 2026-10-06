"use client";

import { useState } from "react";
import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import StatTile from "@/components/hub/StatTile";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  POWER_FEATURE_KIND_LABELS,
  POWER_PLANT_CATEGORY_LABELS,
  isHydroCategory,
} from "@/types/overlay";
import type { PowerData } from "@/lib/server/loadPowerData";

type GridTab = "generation" | "distribution" | "transmission";

const TABS: { id: GridTab; label: string }[] = [
  { id: "generation", label: "Generation" },
  { id: "distribution", label: "Distribution" },
  { id: "transmission", label: "Transmission" },
];

export default function EnergyGrid({
  power,
  slugByStateId,
}: {
  power: PowerData;
  slugByStateId: Record<string, string>;
}) {
  const [tab, setTab] = useState<GridTab>("generation");

  const gridStations = [...power.gridStations].sort(
    (a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0)
  );
  const hydroGrid = gridStations.filter((s) => isHydroCategory(s.plantCategory));
  const gasGrid = gridStations.filter((s) => !isHydroCategory(s.plantCategory));
  const backboneNodes = power.gridNodes.filter((n) => n.voltageKv === 330);
  const corridorStates = power.gridCorridors.reduce<Set<string>>((acc, c) => {
    c.stateIds.forEach((id) => acc.add(id));
    return acc;
  }, new Set());

  const largest = gridStations[0];
  const secondLargest = gridStations[1];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="MW installed"
          value={power.totalCapacityMw.toLocaleString()}
          hint={`${power.nercPlantCount} NERC grid plants · ${power.ratedGridSiteCount} site rows rated`}
          highlighted
        />
        <StatTile
          label="Gas-fired share"
          value={`${power.gasSharePercent}%`}
          hint={`${gasGrid.length} gas sites · ${hydroGrid.length} hydro sites`}
        />
        <StatTile
          label="Distribution companies"
          value={String(power.distributors.length)}
          hint="36 states and the FCT covered"
        />
        <StatTile
          label="Transmission corridors"
          value={String(power.gridCorridors.length)}
          hint={`Schematic · not surveyed · ${backboneNodes.length} mapped 330 kV nodes`}
        />
      </div>

      <div
        className="mt-8 inline-flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-slate-100 p-1"
        role="tablist"
        aria-label="Power grid sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-label-md font-semibold transition-all duration-200 ${
              tab === t.id
                ? "bg-white text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "generation" && (
        <div className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
              <NigeriaThumb
                source="states"
                highlight={power.stateIds}
                accent="#ca8a04"
                markers={gridStations
                  .filter((s) => s.lon != null && s.lat != null)
                  .map((s) => ({ lon: s.lon as number, lat: s.lat as number }))}
                className="h-56 w-full"
                title="Grid-connected power stations"
              />
              <Link
                href={sectionMapHref("economy/power")}
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
              >
                Open power map
              </Link>
              <p className="mt-2 text-[11px] text-text-muted">
                Gold markers are the four major hydro stations on the national
                grid; other markers are gas and steam plants.
              </p>
            </div>

            <div>
              <h3 className="font-landing-display text-headline-sm text-text-primary">
                Generation mix
              </h3>
              <p className="mt-1 text-body-sm text-text-muted">
                Installed capacity of {power.nercPlantCount} grid-connected
                plants in the NERC Q4 2025 fleet ({power.totalCapacityMw.toLocaleString()}{" "}
                MW), by technology.
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {power.generationMix.map((group) => {
                  const meta = POWER_PLANT_CATEGORY_LABELS[group.category];
                  return (
                    <li
                      key={group.category}
                      className="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-body-md font-semibold text-text-primary">
                          {meta.label}
                        </p>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {group.sharePercent}%
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-headline-sm font-semibold text-text-primary">
                        {group.capacityMw.toLocaleString()}{" "}
                        <span className="text-[11px] font-normal text-text-muted">
                          MW
                        </span>
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${group.sharePercent}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-text-muted">
                        {group.stationCount} NERC unit
                        {group.stationCount === 1 ? "" : "s"}
                      </p>
                    </li>
                  );
                })}
              </ul>

              {largest && secondLargest && (
                <p className="mt-3 text-body-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    {largest.name}
                  </span>{" "}
                  at {(largest.capacityMw ?? 0).toLocaleString()} MW is the
                  largest site in the catalogue;{" "}
                  <span className="font-semibold text-text-primary">
                    {secondLargest.name}
                  </span>{" "}
                  follows at {(secondLargest.capacityMw ?? 0).toLocaleString()}{" "}
                  MW. NERC lists{" "}
                  <span className="font-semibold text-text-primary">
                    Egbin_1
                  </span>{" "}
                  (1,320 MW steam) as the single largest grid-connected plant.
                </p>
              )}
            </div>
          </div>

          <h3 className="mt-10 font-landing-display text-headline-sm text-text-primary">
            Stations, largest first
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
            {gridStations.map((s) => {
              const meta = POWER_PLANT_CATEGORY_LABELS[s.plantCategory];
              return (
                <li key={s.id} className="flex flex-wrap gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-body-md font-semibold text-text-primary">
                        {s.name}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.short}
                      </span>
                    </div>
                    <p className="mt-0.5 text-body-sm text-text-muted">
                      {s.operator}
                      {s.commissioned ? ` · ${s.commissioned}` : ""}
                    </p>
                    {s.units && (
                      <p className="mt-1 text-[11px] font-medium text-text-secondary">
                        Units: {s.units}
                      </p>
                    )}
                    <p className="mt-1 text-body-sm text-text-secondary">
                      {s.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.states.map((name) => (
                        <Link
                          key={name}
                          href={`/places/${slugByStateId[name] ?? name.toLowerCase()}`}
                          className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container hover:text-primary"
                        >
                          {name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="w-28 shrink-0 text-right">
                    {s.capacityMw != null && s.capacityMw > 0 ? (
                      <>
                        <p className="font-mono text-headline-sm font-semibold text-text-primary">
                          {s.capacityMw.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-text-muted">MW</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        No published
                        <br />
                        capacity
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {power.offGridHydro.length > 0 && (
            <>
              <h3 className="mt-10 font-landing-display text-headline-sm text-text-primary">
                Regional / off-grid hydro
              </h3>
              <p className="mt-1 text-body-sm text-text-muted">
                Not counted in the MW total above. Capacities marked unverified
                are excluded from totals.
              </p>
              <ul className="mt-3 space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-body-sm text-text-secondary">
                {power.offGridHydro.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold text-text-primary">
                      {s.name}
                    </span>
                    {" — "}
                    {s.summary}
                    {s.capacityUnverified && (
                      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                        Unverified
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {power.nonPowerDams.length > 0 && (
            <>
              <h3 className="mt-8 font-landing-display text-headline-sm text-text-primary">
                Dams (not generating power on the grid)
              </h3>
              <ul className="mt-2 space-y-1 text-body-sm text-text-muted">
                {power.nonPowerDams.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold text-text-secondary">
                      {s.name}
                    </span>
                    {" — "}
                    {s.summary}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-4 text-body-sm text-text-muted">
            The four major hydro stations carry{" "}
            {power.majorHydroCapacityMw.toLocaleString()} MW between them (Kainji,
            Jebba, Shiroro, Zungeru).
          </p>
        </div>
      )}

      {tab === "distribution" && (
        <div className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
              <NigeriaThumb
                source="states"
                highlight={[
                  ...new Set(power.distributors.flatMap((d) => d.stateIds)),
                ]}
                accent="#1d4ed8"
                markers={power.distributors
                  .filter((d) => d.lon != null && d.lat != null)
                  .map((d) => ({ lon: d.lon as number, lat: d.lat as number }))}
                className="h-56 w-full"
                title="DisCo head offices"
              />
              <Link
                href={sectionMapHref("economy/power")}
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
              >
                Open distribution map
              </Link>
            </div>

            <div>
              <h3 className="font-landing-display text-headline-sm text-text-primary">
                {power.distributors.length} distribution companies
              </h3>
              <p className="mt-1 text-body-sm text-text-muted">
                Licence areas cover all 36 states and the Federal Capital
                Territory. Some states are split between two DisCos.
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {power.distributors.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
                    style={{
                      borderLeft: `4px solid ${POWER_FEATURE_KIND_LABELS["power-distributor"].color}`,
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-body-md font-semibold text-text-primary">
                        {d.name}
                      </p>
                      <p className="shrink-0 font-mono text-[11px] text-text-muted">
                        {d.states.length} state
                        {d.states.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="mt-1 text-body-sm text-text-muted">
                      {d.operator}
                    </p>
                    <p className="mt-1.5 text-body-sm text-text-secondary">
                      {d.states.slice(0, 5).join(", ")}
                      {d.states.length > 5 && ` +${d.states.length - 5} more`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "transmission" && (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Mapped substations"
              value={String(power.gridNodes.length)}
              hint={`${backboneNodes.length} at 330 kV · schematic positions`}
            />
            <StatTile
              label="Documented corridors"
              value={String(power.gridCorridors.length)}
              hint="Schematic · not surveyed"
            />
            <StatTile
              label="Grid-connected capacity"
              value={`${power.totalCapacityMw.toLocaleString()} MW`}
              hint={`NERC Q4 2025 fleet (${power.nercPlantCount} plants)`}
            />
          </div>

          <h3 className="mt-10 font-landing-display text-headline-sm text-text-primary">
            Transmission corridors
          </h3>
          <p className="mt-1 text-body-sm text-text-muted">
            Routing is schematic, traced from TCN project descriptions rather
            than surveyed line geometry. Across {corridorStates.size} state
            {corridorStates.size === 1 ? "" : "s"}.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
            {power.gridCorridors.map((c) => {
              const meta = POWER_FEATURE_KIND_LABELS["grid-corridor"];
              return (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      {c.voltageKv} kV
                    </span>
                    <p className="text-body-md font-semibold text-text-primary">
                      {c.name}
                    </p>
                  </div>
                  <p className="mt-1 text-body-sm text-text-secondary">
                    {c.summary}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-8 text-body-sm text-text-muted">
        Capacities are installed ratings from NERC, not output. Solar, diesel,
        captive and mini-grid generation are outside this dataset.
      </p>

      <SourceNote
        className="mt-4"
        source={`${power.sources.nerc.label} · ${power.sources.tcn.label}`}
        updated={`Last verified ${power.sources.nerc.lastVerified}`}
      />
    </div>
  );
}
