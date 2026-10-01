import Link from "next/link";

const MODES = ["Drive", "Fly + Drive", "Walk"] as const;
type Mode = (typeof MODES)[number];

export type RouteStop = {
  label: string;
  icon: "takeoff" | "pin";
};

export type PlanARouteProps = {
  from: RouteStop;
  to: RouteStop;
  distance: string;
  duration: string;
  via: string;
  elevation: string;
  alert: string;
};

export default function PlanARouteCard({
  from,
  to,
  distance,
  duration,
  via,
  elevation,
  alert,
}: PlanARouteProps) {
  return (
    <section id="plan-a-route">
      <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <RouteField label="From" stop={from} />
            <RouteField label="To" stop={to} accent />
          </div>

          <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center">
            <div>
              <label className="mb-1.5 block font-label-caps text-label-caps uppercase text-text-muted">
                Transit Mode
              </label>
              <div className="inline-flex rounded-lg border border-border-subtle bg-surface-base p-1 font-label-md text-label-md">
                {MODES.map((mode, i) => (
                  <span
                    key={mode}
                    className={`cursor-pointer rounded px-3 py-1.5 transition-colors ${
                      i === 0
                        ? "bg-surface-card font-semibold text-primary shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/explore?map=minimal"
              className="mt-auto inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 font-label-md text-label-md text-white shadow-sm transition-all duration-150 hover:bg-primary sm:w-auto"
            >
              Get directions
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 font-body-sm text-body-sm">
          <div className="flex flex-wrap items-center gap-6">
            <Metric term="Distance" value={distance} />
            <Metric term="Est. Duration" value={duration} note={via} />
            <Metric term="Elevation" value={elevation} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-heritage-amber-tint px-3 py-1 font-label-caps text-label-caps text-heritage-amber">
            <span aria-hidden>!</span>
            {alert}
          </span>
        </div>
      </div>
    </section>
  );
}

function RouteField({
  label,
  stop,
  accent,
}: {
  label: string;
  stop: RouteStop;
  accent?: boolean;
}) {
  return (
    <div className="relative">
      <label className="mb-1.5 block font-label-caps text-label-caps uppercase text-text-muted">
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          className={`absolute left-3 text-[18px] ${accent ? "text-primary" : "text-text-muted"}`}
          aria-hidden
        >
          {stop.icon === "takeoff" ? "✈" : "●"}
        </span>
        <div
          className="w-full rounded-lg border border-border-subtle bg-surface-base py-2.5 pl-9 pr-3 font-body-sm text-body-sm text-text-primary"
          role="textbox"
          aria-readonly
          aria-label={`${label}: ${stop.label}`}
          tabIndex={0}
        >
          {stop.label}
        </div>
      </div>
    </div>
  );
}

function Metric({
  term,
  value,
  note,
}: {
  term: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-text-secondary">
      <span className="font-medium text-text-muted">{term}:</span>
      <span className="font-semibold text-text-primary">{value}</span>
      {note ? <span className="text-text-muted">({note})</span> : null}
    </div>
  );
}