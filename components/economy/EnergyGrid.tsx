import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import StatTile from "@/components/hub/StatTile";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import {
  POWER_FEATURE_KIND_LABELS,
  POWER_PLANT_CATEGORY_LABELS,
  type PowerPlantCategory,
} from "@/types/overlay";
import type { PowerData } from "@/lib/server/loadPowerData";

const PLANT_CATEGORY_ORDER: PowerPlantCategory[] = [
  "gas-ocgt",
  "gas-ccgt",
  "steam",
  "hydro",
];

/**
 * Generation, distribution and the transmission backbone.
 *
 * Installed capacities follow NERC's reported fleet, and the mix is presented as
 * such: this is a gas-dominated grid with a small hydro tail. Nothing here is
 * solar, diesel or captive generation, so the module does not claim to be a
 * full national energy balance.
 */
export default function EnergyGrid({
  power,
  slugByStateId,
}: {
  power: PowerData;
  slugByStateId: Record<string, string>;
}) {
  const ratedStations = power.stations.filter(
    (s) => s.capacityMw != null && s.capacityMw > 0
  ).length;
  const hydroStations = power.stations.filter(
    (s) => s.plantCategory === "hydro"
  );
  const gasStations = power.stations.filter(
    (s) => s.plantCategory !== "hydro"
  );
  const backboneNodes = power.gridNodes.filter((n) => n.voltageKv === 330);
  const corridorStates = power.gridCorridors.reduce<Set<string>>(
    (acc, c) => {
      c.stateIds.forEach((id) => acc.add(id));
      return acc;
    },
    new Set()
  );

  const byCategory = PLANT_CATEGORY_ORDER.map((category) => {
    const stations = power.stations.filter(
      (s) => s.plantCategory === category
    );
    return {
      category,
      stations,
      capacityMw: stations.reduce((sum, s) => sum + (s.capacityMw ?? 0), 0),
    };
  }).filter((group) => group.stations.length > 0);

  const largestStation = power.stations[0];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="MW installed"
          value={power.totalCapacityMw.toLocaleString()}
          hint={`${ratedStations} of ${power.generationCount} major stations rated`}
          highlighted
        />
        <StatTile
          label="Gas-fired share"
          value={`${power.gasSharePercent}%`}
          hint={`${gasStations.length} gas vs ${hydroStations.length} hydro stations`}
        />
        <StatTile
          label="Distribution companies"
          value={String(power.distributors.length)}
          hint="DisCos covering all 36 states and the FCT"
        />
        <StatTile
          label="Transmission corridors"
          value={String(power.gridCorridors.length)}
          hint={`${backboneNodes.length} major 330 kV substations mapped`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
          <NigeriaThumb
            source="states"
            highlight={power.stateIds}
            accent="#b45309"
            markers={[
              ...power.stations
                .filter((s) => s.lon != null && s.lat != null)
                .map((s) => ({ lon: s.lon as number, lat: s.lat as number })),
              ...power.distributors
                .filter((d) => d.lon != null && d.lat != null)
                .map((d) => ({ lon: d.lon as number, lat: d.lat as number })),
            ]}
            className="h-56 w-full"
            title="Stations and DisCo offices"
          />
          <Link
            href={sectionMapHref("economy/power")}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open power map
          </Link>
          <p className="mt-2 text-[11px] text-text-muted">
            Generation, distribution and transmission are drawn as separate
            layers — focus the map on any one of them.
          </p>
        </div>

        <div>
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            Generation mix
          </h3>
          <p className="mt-1 text-body-sm text-text-muted">
            Installed capacity of the {power.generationCount} major stations in
            the catalogue, by technology.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {byCategory.map((group) => {
              const meta = POWER_PLANT_CATEGORY_LABELS[group.category];
              const share =
                power.totalCapacityMw > 0
                  ? Math.round((group.capacityMw / power.totalCapacityMw) * 100)
                  : 0;
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
                      {share}%
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
                        width: `${share}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-text-muted">
                    {group.stations.length} station
                    {group.stations.length === 1 ? "" : "s"}
                  </p>
                </li>
              );
            })}
          </ul>

          {largestStation && (
            <p className="mt-3 text-body-sm text-text-secondary">
              <span className="font-semibold text-text-primary">
                {largestStation.name}
              </span>{" "}
              at {(largestStation.capacityMw ?? 0).toLocaleString()} MW is the
              single largest station on the grid — Nigeria&apos;s largest plant by
              a wide margin.
            </p>
          )}
        </div>
      </div>

      <h3 className="mt-10 font-landing-display text-headline-sm text-text-primary">
        Stations, largest first
      </h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
        {power.stations.map((s) => {
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
                    {meta.label}
                  </span>
                </div>
                <p className="mt-0.5 text-body-sm text-text-muted">
                  {s.operator}
                  {s.commissioned ? ` · ${s.commissioned}` : ""}
                </p>
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

      <h3 className="mt-10 font-landing-display text-headline-sm text-text-primary">
        Distribution companies
      </h3>
      <p className="mt-1 text-body-sm text-text-muted">
        Each DisCo is shown at its head office; licence areas follow the
        operational areas published by NERC.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {power.distributors.map((d) => (
          <li
            key={d.id}
            className="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
            style={{ borderLeft: `4px solid ${POWER_FEATURE_KIND_LABELS["power-distributor"].color}` }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-body-md font-semibold text-text-primary">
                {d.name}
              </p>
              <p className="shrink-0 font-mono text-[11px] text-text-muted">
                {d.states.length} state{d.states.length === 1 ? "" : "s"}
              </p>
            </div>
            <p className="mt-1 text-body-sm text-text-muted">{d.operator}</p>
            <p className="mt-1.5 text-body-sm text-text-secondary">
              {d.states.slice(0, 5).join(", ")}
              {d.states.length > 5 && ` +${d.states.length - 5} more`}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="mt-10 font-landing-display text-headline-sm text-text-primary">
        Transmission backbone
      </h3>
      <p className="mt-1 text-body-sm text-text-muted">
        {power.gridNodes.length} major substations and{" "}
        {power.gridCorridors.length} documented corridors across{" "}
        {corridorStates.size} state{corridorStates.size === 1 ? "" : "s"}.
        Routing is schematic, traced from TCN project descriptions.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
        {power.gridCorridors.slice(0, 12).map((c) => {
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
              <p className="mt-1 text-body-sm text-text-secondary">{c.summary}</p>
            </li>
          );
        })}
      </ul>
      {power.gridCorridors.length > 12 && (
        <p className="mt-3 text-body-sm text-text-muted">
          Showing 12 of {power.gridCorridors.length} corridors — open the map for
          the full network.
        </p>
      )}

      <p className="mt-8 text-body-sm text-text-muted">
        Capacities are installed ratings, not output. Solar, diesel, captive and
        mini-grid generation are outside this dataset, and substation positions
        and corridor alignments are schematic rather than surveyed.
      </p>

      <SourceNote
        className="mt-4"
        source="NERC quarterly reports on installed capacity · TCN transmission project descriptions"
        updated="Repository dataset"
      />
    </div>
  );
}