import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { PowerData } from "@/lib/server/loadPowerData";

/**
 * Hydropower and grid distribution. Scoped to what the dataset actually holds:
 * dams and stations on the lakes layer, plus the distribution companies. There
 * is no thermal generation inventory here, so the module does not claim one.
 */
export default function EnergyGrid({
  power,
  slugByStateId,
}: {
  power: PowerData;
  slugByStateId: Record<string, string>;
}) {
  const major = power.stations.filter((s) => s.plantCategory === "major-hydro");
  const regional = power.stations.filter((s) => s.plantCategory !== "major-hydro");
  const riverStates = power.stateIds;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {power.stations.length}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            Hydroelectric stations
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            {major.length} major · {regional.length} regional
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {power.totalCapacityMw.toLocaleString()}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            MW of rated capacity
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            Across {power.ratedStations} stations with a published figure
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {power.distributors.length}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            Grid distribution companies
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            DisCos and their licence areas
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {riverStates.length}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            States with hydro or a DisCo
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            The Niger basin carries the generation
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
          <NigeriaThumb
            source="states"
            highlight={riverStates}
            accent="#b45309"
            markers={power.stations
              .filter((s) => s.lon != null && s.lat != null)
              .map((s) => ({ lon: s.lon as number, lat: s.lat as number }))}
            className="h-56 w-full"
            title="Hydropower stations"
          />
          <Link
            href={sectionMapHref("economy/power")}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open power map
          </Link>
          <p className="mt-2 text-[11px] text-text-muted">
            Pins are station locations; the map also draws the distribution
            companies.
          </p>
        </div>

        <div>
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            Stations, largest first
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
            {power.stations.map((s) => (
              <li key={s.id} className="flex flex-wrap gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-body-md font-semibold text-text-primary">
                    {s.name}
                  </p>
                  <p className="mt-0.5 text-body-sm text-text-muted">
                    {s.type}
                    {s.riverName ? ` · ${s.riverName}` : ""}
                    {s.commissioned ? ` · ${s.commissioned}` : ""}
                  </p>
                  <p className="mt-1 text-body-sm text-text-secondary">{s.summary}</p>
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
            ))}
          </ul>

          <h3 className="mt-8 font-landing-display text-headline-sm text-text-primary">
            Distribution companies
          </h3>
          <p className="mt-1 text-body-sm text-text-muted">
            Licence areas, as documented in the dataset.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {power.distributors.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm"
              >
                <p className="text-body-md font-semibold text-text-primary">
                  {d.name}
                </p>
                <p className="mt-1 text-body-sm text-text-muted">
                  {d.states.length} state{d.states.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-body-sm text-text-secondary">
                  {d.states.slice(0, 5).join(", ")}
                  {d.states.length > 5 && ` +${d.states.length - 5} more`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-body-sm text-text-muted">
        Thermal generation, gas plants and national grid capacity are not in
        the repository, so this module stays inside what the lakes layer
        documents.
      </p>

      <SourceNote
        className="mt-4"
        source="Lakes &amp; power overlay · Federal Power Corporation records"
        updated="Repository dataset"
      />
    </div>
  );
}
