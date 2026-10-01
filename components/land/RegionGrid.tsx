import Link from "next/link";
import { StatePillLink } from "@/components/hub/StatePillLink";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { LandHubData } from "@/lib/server/loadLandHubData";

/** The six geopolitical zones, one card each, with their member states. */
export default function RegionGrid({
  regions,
  slugByStateId,
}: {
  regions: LandHubData["regions"];
  slugByStateId: Record<string, string>;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((r) => (
          <div
            key={r.id}
            className="flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-landing-display text-headline-sm text-text-primary">
                {r.name}
              </h3>
              <span className="rounded-full border border-border-subtle bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-text-muted">
                {r.shortCode}
              </span>
            </div>
            <p className="mt-1 text-body-sm text-text-muted">
              {r.states.length} state{r.states.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-3 flex-1 space-y-1">
              {r.states.map((name) => (
                <li key={name}>
                  <StatePillLink
                    name={name}
                    slug={slugByStateId[name]}
                    className="block"
                    arrow
                    linkClassName="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-body-sm text-text-secondary hover:bg-emerald-50 hover:text-primary"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <NigeriaThumb
                source="regions"
                highlight={[r.id]}
                className="h-20 w-full"
                title={r.name}
              />
            </div>
          </div>
        ))}
      </div>

      <Link
        href={sectionMapHref("land/zones")}
        className="mt-6 inline-flex h-11 items-center rounded-xl border border-primary-container px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
      >
        Open the zones map
      </Link>

      <SourceNote
        className="mt-6"
        source="Nigerian administrative zones"
        updated="Repository dataset"
      />
    </div>
  );
}
