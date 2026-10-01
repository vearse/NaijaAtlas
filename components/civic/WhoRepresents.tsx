"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { HubOfficeholder, HubStateOffice } from "@/lib/server/loadCivicHubData";

type OfficeKey = "president" | "governor" | "senator" | "reps";

const OFFICE_ORDER: { key: OfficeKey; label: string; blurb: string }[] = [
  {
    key: "president",
    label: "President",
    blurb: "Head of state and the federal executive.",
  },
  {
    key: "governor",
    label: "Governor",
    blurb: "Runs the state executive alongside the state assembly.",
  },
  {
    key: "senator",
    label: "Senator",
    blurb: "Represents your senatorial district in the upper chamber.",
  },
  {
    key: "reps",
    label: "Member, House of Reps",
    blurb: "Represents your federal constituency in the lower chamber.",
  },
];

function Avatar({ person }: { person: HubOfficeholder }) {
  if (person.imageUrl) {
    return (
      <Image
        src={person.imageUrl}
        alt=""
        width={64}
        height={64}
        className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
        unoptimized
      />
    );
  }
  const initials = person.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-headline-sm font-bold text-primary ring-1 ring-emerald-100">
      {initials || "—"}
    </span>
  );
}

function OfficeRow({
  person,
  office,
  district,
  extra,
}: {
  person: HubOfficeholder;
  office: string;
  district?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border-subtle bg-slate-50 p-4">
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-text-primary">
          {person.name}
        </p>
        <p className="text-body-sm text-text-secondary">{person.role ?? office}</p>
        {district && (
          <p className="mt-0.5 text-body-sm text-text-muted">{district}</p>
        )}
        <span className="mt-2 inline-flex rounded-full border border-border-subtle bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
          {person.party}
        </span>
      </div>
      {extra}
    </div>
  );
}

export default function WhoRepresents({
  offices,
  states,
  president,
}: {
  offices: HubStateOffice[];
  states: { id: string; name: string; slug: string; regionName: string }[];
  president: { name: string; party: string } | null;
}) {
  const [stateId, setStateId] = useState(
    states.find((s) => s.id === "NG-LA")?.id ?? states[0]?.id ?? ""
  );
  const [open, setOpen] = useState<OfficeKey | null>("senator");

  const office = useMemo(
    () => offices.find((o) => o.stateId === stateId) ?? null,
    [offices, stateId]
  );
  const state = states.find((s) => s.id === stateId);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">
            State
          </span>
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="mt-2 h-11 rounded-xl border border-border-subtle bg-surface-card px-3 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {state && (
          <p className="pb-3 text-body-sm text-text-muted">
            {state.regionName} · {office?.houseSeats ?? "—"} House seats ·{" "}
            {office?.stateAssemblySeats ?? "—"} assembly seats
          </p>
        )}
      </div>

      <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
        {OFFICE_ORDER.map((row) => {
          const expanded = open === row.key;
          return (
            <div key={row.key}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : row.key)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="text-body-md font-semibold text-text-primary">
                    {row.label}
                  </p>
                  <p className="text-body-sm text-text-muted">
                    {row.blurb}
                  </p>
                </div>
                <span
                  className="shrink-0 text-slate-400"
                  aria-hidden
                >
                  {expanded ? "−" : "+"}
                </span>
              </button>

              {expanded && (
                <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-5">
                  {row.key === "president" &&
                    (president ? (
                      <OfficeRow
                        person={{
                          ...president,
                          imageUrl: null,
                          role: "President of the Federal Republic of Nigeria",
                        }}
                        office="President"
                      />
                    ) : (
                      <p className="text-body-sm text-text-secondary">
                        Officeholder not in the current assembly dataset.
                      </p>
                    ))}

                  {row.key === "governor" &&
                    (office?.governor ? (
                      <div className="space-y-3">
                        <OfficeRow
                          person={office.governor}
                          office="Governor"
                          extra={
                            office.deputyGovernor ? (
                              <p className="text-body-sm text-text-secondary">
                                Deputy: {office.deputyGovernor.name}
                              </p>
                            ) : null
                          }
                        />
                        {office.assemblySpeaker && (
                          <OfficeRow
                            person={office.assemblySpeaker}
                            office="Speaker, State Assembly"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-body-sm text-text-secondary">
                        No governor recorded for this state.
                      </p>
                    ))}

                  {row.key === "senator" &&
                    (office?.senators.length ? (
                      <div className="space-y-3">
                        {office.senators.map((s) => (
                          <OfficeRow
                            key={`${s.name}-${s.role}`}
                            person={s}
                            office="Senator"
                            district={s.role ?? undefined}
                            extra={
                              <Link
                                href={sectionMapHref("civic/elections", {
                                  stateIds: [stateId],
                                })}
                                className="text-label-md font-semibold text-primary hover:underline"
                              >
                                Open on map
                              </Link>
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-text-secondary">
                        Senators not recorded for this state.
                      </p>
                    ))}

                  {row.key === "reps" &&
                    (office?.houseMembers.length ? (
                      <div className="space-y-3">
                        {office.housePartySplit && (
                          <p className="text-body-sm text-text-secondary">
                            {office.houseSeats} seats · {office.housePartySplit}
                          </p>
                        )}
                        {office.houseMembers.map((m) => (
                          <OfficeRow
                            key={`${m.name}-${m.role}`}
                            person={m}
                            office="Member, House of Reps"
                            district={m.role ?? undefined}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-text-secondary">
                        House members not recorded for this state.
                      </p>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state && (
        <Link
          href={`/places/${state.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline"
        >
          Open the full {state.name} profile
          <span aria-hidden>→</span>
        </Link>
      )}

      <SourceNote
        className="mt-6"
        source="INEC · NASS 10th Assembly"
        updated="2023–2027 term"
      />
    </div>
  );
}
