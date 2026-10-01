import Link from "next/link";
import { StatePillLinkList } from "@/components/hub/StatePillLink";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubPort } from "@/lib/server/loadEconomyHubData";

/**
 * Active and proposed port complexes. Proposed terminals are opt-in overlay
 * groups on the map, so the card reveals them rather than silently showing a
 * planned facility as if it were operating.
 */
export default function PortsDirectory({
  ports,
  slugByStateId,
}: {
  ports: HubPort[];
  slugByStateId: Record<string, string>;
}) {
  const active = ports.filter((p) => p.status === "active");
  const proposed = ports.filter((p) => p.status === "proposed");
  const allStates = [...new Set(ports.flatMap((p) => p.stateIds))];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {active.length}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            Operating port complexes
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            Seaports handling container, bulk and general cargo
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {proposed.length}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            Proposed deep-water hubs
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            Greenfield concessions, not yet in service
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-landing-display text-headline-lg text-text-primary">
            {allStates.length}
          </p>
          <p className="mt-1 text-body-md font-semibold text-slate-800">
            Coastal states involved
          </p>
          <p className="mt-0.5 text-body-sm text-text-muted">
            Active and proposed terminals combined
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border-subtle bg-slate-50 p-4">
          <NigeriaThumb
            source="states"
            highlight={allStates}
            accent="#1d4ed8"
            className="h-56 w-full"
            title="Port states"
          />
          <Link
            href={sectionMapHref("economy/ports")}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary-container text-label-md font-semibold text-primary hover:bg-emerald-50"
          >
            Open ports map
          </Link>
          <p className="mt-2 text-[11px] text-text-muted">
            The map reveals the proposed group only when you ask for it.
          </p>
        </div>

        <div>
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            Operating
          </h3>
          <ul className="mt-3 space-y-3">
            {active.map((p) => (
              <PortCard key={p.id} port={p} slugByStateId={slugByStateId} />
            ))}
          </ul>

          <h3 className="mt-8 font-landing-display text-headline-sm text-text-primary">
            Proposed
          </h3>
          <p className="mt-1 text-body-sm text-text-muted">
            Promoted or conceded, but not yet handling cargo.
          </p>
          <ul className="mt-3 space-y-3">
            {proposed.map((p) => (
              <PortCard key={p.id} port={p} slugByStateId={slugByStateId} />
            ))}
          </ul>
        </div>
      </div>

      <SourceNote
        className="mt-6"
        source="Nigerian Ports Authority · concession lists"
        updated="Repository dataset"
      />
    </div>
  );
}

function PortCard({
  port,
  slugByStateId,
}: {
  port: HubPort;
  slugByStateId: Record<string, string>;
}) {
  return (
    <li className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-landing-display text-headline-sm text-text-primary">
          {port.name}
        </h4>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            port.status === "active"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {port.status === "active" ? "Operating" : "Proposed"}
        </span>
      </div>
      <p className="mt-1 text-body-sm text-text-muted">{port.type}</p>
      <p className="mt-2 text-body-sm text-text-secondary">{port.summary}</p>
      {port.cargoNote && (
        <p className="mt-2 text-body-sm text-text-secondary">
          <span className="font-semibold text-slate-800">Cargo: </span>
          {port.cargoNote}
        </p>
      )}
      {port.significance && (
        <p className="mt-2 text-body-sm text-text-secondary">
          <span className="font-semibold text-slate-800">Why it matters: </span>
          {port.significance}
        </p>
      )}
      <StatePillLinkList states={port.states} slugByStateId={slugByStateId} />
    </li>
  );
}
