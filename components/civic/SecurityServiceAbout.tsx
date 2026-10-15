"use client";

import { useState } from "react";
import type {
  RankEquivalence,
  SecurityService,
  SecurityServicesData,
} from "@/lib/server/loadSecurityServices";

function formatVerified(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function RankLadder({
  title,
  ranks,
  accent,
}: {
  title: string;
  ranks: string[];
  accent: string;
}) {
  if (ranks.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-4">
      <p className="text-label-caps uppercase tracking-wide" style={{ color: accent }}>
        {title}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">Highest first</p>
      <ol className="mt-3 space-y-1.5">
        {ranks.map((rank, i) => (
          <li key={rank} className="flex items-center gap-2 text-body-sm text-text-secondary">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white tabular-nums"
              style={{ backgroundColor: accent, opacity: 1 - i * 0.045 }}
              aria-hidden
            >
              {i + 1}
            </span>
            {rank}
          </li>
        ))}
      </ol>
    </div>
  );
}

function EquivalenceTable({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: RankEquivalence[];
  accent: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="text-label-caps uppercase text-text-muted">{title}</p>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-border-subtle bg-white">
        <table className="w-full min-w-[30rem] border-collapse text-left text-body-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-slate-50 text-label-caps uppercase text-text-muted">
              <th scope="col" className="px-3 py-2 font-semibold">Army</th>
              <th scope="col" className="px-3 py-2 font-semibold">Navy</th>
              <th scope="col" className="px-3 py-2 font-semibold">Air Force</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.army}-${i}`} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="px-3 py-2 font-semibold text-text-primary" style={{ borderLeft: `3px solid ${accent}` }}>
                  {row.army}
                </th>
                <td className="px-3 py-2 text-text-secondary">{row.navy}</td>
                <td className="px-3 py-2 text-text-secondary">{row.airforce}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Tab = "overview" | "ranks" | "training";

/**
 * "About this service" — the reference panel that sits above the formation
 * list. One panel per selected service (Army, Navy, Air Force) with its role,
 * headquarters, rank ladders and training institutions. Ranks are text only;
 * no official insignia are reproduced.
 */
export default function SecurityServiceAbout({
  service,
  data,
  accent,
  icon,
}: {
  service: SecurityService;
  data: SecurityServicesData;
  accent: string;
  icon: string;
}) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const verified = formatVerified(data.lastVerified);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "ranks", label: "Ranks" },
    { id: "training", label: "Training" },
  ];

  return (
    <section
      className="mt-6 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm"
      style={{ borderTop: `4px solid ${accent}` }}
      aria-label={`About the ${service.name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${accent}1a` }} aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-label-caps uppercase text-text-muted">About this service</p>
            <h3 className="truncate font-landing-display text-headline-sm font-bold text-text-primary">
              {service.name}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 text-label-md font-semibold text-text-secondary hover:bg-slate-50"
        >
          {open ? "Hide" : "Show details"}
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>⌃</span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-border-subtle px-4 pb-4 pt-3 sm:px-5">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={`${service.name} details`}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-3.5 py-1.5 text-label-md font-semibold transition-colors ${
                  tab === t.id
                    ? "border-transparent text-white"
                    : "border-border-subtle bg-white text-text-secondary hover:bg-slate-50"
                }`}
                style={tab === t.id ? { backgroundColor: accent } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4" role="tabpanel">
            {tab === "overview" ? (
              <div className="space-y-4">
                <p className="text-body-md text-text-secondary">{service.description}</p>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border-subtle bg-white p-3">
                    <dt className="text-label-caps uppercase text-text-muted">Role</dt>
                    <dd className="mt-1 text-body-sm font-semibold text-text-primary">{service.role}</dd>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-white p-3">
                    <dt className="text-label-caps uppercase text-text-muted">Established</dt>
                    <dd className="mt-1 text-body-sm font-semibold text-text-primary">{service.established}</dd>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-white p-3">
                    <dt className="text-label-caps uppercase text-text-muted">Headquarters</dt>
                    <dd className="mt-1 text-body-sm font-semibold text-text-primary">{service.hq}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {tab === "ranks" ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <RankLadder title="Commissioned officers" ranks={service.officerRanks} accent={accent} />
                  <RankLadder title="Other ranks" ranks={service.enlistedRanks} accent={accent} />
                </div>
                <p className="text-[11px] text-text-muted">
                  Ranks are listed as text only. Insignia are not reproduced here.
                </p>
                <div className="space-y-5">
                  <EquivalenceTable title="Tri-service equivalence · officers" rows={data.officerEquivalence} accent={accent} />
                  <EquivalenceTable title="Tri-service equivalence · other ranks" rows={data.enlistedEquivalence} accent={accent} />
                </div>
              </div>
            ) : null}

            {tab === "training" ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {service.training.map((t) => (
                  <li key={t.name} className="rounded-xl border border-border-subtle bg-white p-3">
                    <p className="text-body-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="mt-1 text-body-sm text-text-secondary">{t.note}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-body-sm text-text-muted">
            <span className="font-semibold text-text-secondary">Sources: </span>
            {service.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 ? " · " : ""}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  {s.label}
                </a>
              </span>
            ))}
            {verified ? <span className="ml-1">· Last verified {verified}</span> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
