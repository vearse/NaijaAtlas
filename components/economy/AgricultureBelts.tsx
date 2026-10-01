import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import type { HubBelt } from "@/lib/server/loadEconomyHubData";

/** Agricultural belts, taken from the ecology entries that carry crop data. */
export default function AgricultureBelts({
  belts,
  slugByStateId,
}: {
  belts: HubBelt[];
  slugByStateId: Record<string, string>;
}) {
  return (
    <div>
      <p className="max-w-2xl text-body-md text-text-secondary">
        {belts.length} agro-ecological zones, with the crops each one actually
        grows and the states they span.
      </p>

      <ul className="mt-6 space-y-4">
        {belts.map((b) => (
          <li
            key={b.id}
            className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-landing-display text-headline-sm text-text-primary">
                {b.name}
              </h3>
              <span className="text-body-sm text-text-muted">
                {b.states.length} state{b.states.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-body-sm text-text-secondary">{b.summary}</p>

            {b.crops.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {b.crops.slice(0, 6).map((c) => (
                  <li
                    key={c}
                    className="rounded-xl border border-border-subtle bg-slate-50 px-3 py-2 text-body-sm text-slate-700"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}

            {b.agriculture && (
              <p className="mt-3 text-body-sm text-text-secondary">{b.agriculture}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {b.states.map((name) => (
                <Link
                  key={name}
                  href={`/places/${slugByStateId[name] ?? name.toLowerCase()}`}
                  className="rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container hover:text-primary"
                >
                  {name}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <SourceNote
        className="mt-6"
        source="Ecology &amp; landform catalogue"
        updated="Repository dataset"
      />
    </div>
  );
}
