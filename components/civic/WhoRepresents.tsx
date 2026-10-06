"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import StateSenatorialDistrictMap from "@/components/civic/StateSenatorialDistrictMap";
import { colorForSenatorialIndex } from "@/lib/politics/senatorialColors";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type {
  CivicSenatorialLookups,
  HubOfficeholder,
  HubRepsRace,
  HubSenateRace,
  HubStateOffice,
} from "@/lib/server/loadCivicHubData";

function districtKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/senatorial district|district|senate/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesDistrict(role: string | null | undefined, districtName: string) {
  if (!role) return false;
  const key = districtKey(districtName);
  return key.length > 0 && districtKey(role).includes(key);
}

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
  active = false,
  accent,
}: {
  person: HubOfficeholder;
  office: string;
  district?: string;
  extra?: React.ReactNode;
  active?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-xl border bg-surface-card p-4 transition-all ${
        active
          ? "border-primary-container shadow-[0_0_0_3px_rgba(0,135,81,0.12)]"
          : "border-border-subtle"
      }`}
      style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}
    >
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
  senateRaces,
  repsRaces,
  senatorialLookups,
}: {
  offices: HubStateOffice[];
  states: { id: string; name: string; slug: string; regionName: string }[];
  president: { name: string; party: string } | null;
  senateRaces: HubSenateRace[];
  repsRaces: HubRepsRace[];
  senatorialLookups: CivicSenatorialLookups;
}) {
  const [stateId, setStateId] = useState(
    states.find((s) => s.id === "NG-LA")?.id ?? states[0]?.id ?? ""
  );
  const [open, setOpen] = useState<OfficeKey | null>("senator");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [hoverDistrictId, setHoverDistrictId] = useState<string | null>(null);

  const office = useMemo(
    () => offices.find((o) => o.stateId === stateId) ?? null,
    [offices, stateId]
  );
  const state = states.find((s) => s.id === stateId);

  const districts = useMemo(
    () => senateRaces.filter((r) => r.stateId === stateId),
    [senateRaces, stateId]
  );
  const district = districts.find((d) => d.id === districtId) ?? null;
  const constituencyCount = (id: string) =>
    repsRaces.filter((r) => r.districtId === id).length;
  const districtColor = (id: string) =>
    colorForSenatorialIndex(senatorialLookups.districtColorIndex[id] ?? 0);

  const selectDistrict = (id: string) => {
    const next = districtId === id ? null : id;
    setDistrictId(next);
    if (next) setOpen("senator");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-label-caps tracking-wider text-text-muted">
            State
          </span>
          <select
            value={stateId}
            onChange={(e) => {
              setStateId(e.target.value);
              setDistrictId(null);
            }}
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

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-32">
          <StateSenatorialDistrictMap
            stateId={stateId}
            stateName={state?.name ?? stateId}
            lookups={senatorialLookups}
            highlightDistrictId={hoverDistrictId ?? districtId}
            onSelectDistrict={selectDistrict}
            className="aspect-square w-full"
          />
          {districts.length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-card p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {districts.length} senatorial districts · tap map or list
              </p>
              <ul className="space-y-1">
                {districts.map((d) => {
                  const active = districtId === d.id;
                  const seats = constituencyCount(d.id);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => selectDistrict(d.id)}
                        onMouseEnter={() => setHoverDistrictId(d.id)}
                        onMouseLeave={() => setHoverDistrictId(null)}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                          active
                            ? "bg-emerald-50 font-bold text-primary"
                            : "text-text-secondary hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: districtColor(d.id) }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{d.name}</span>
                        {seats > 0 && (
                          <span className="shrink-0 tabular-nums text-text-muted">
                            {seats} Reps
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {district && (
                <p className="mt-2 border-t border-border-subtle pt-2 text-[11px] leading-relaxed text-text-muted">
                  {district.lgaNames.length} LGAs:{" "}
                  {district.lgaNames.slice(0, 8).join(", ")}
                  {district.lgaNames.length > 8
                    ? ` +${district.lgaNames.length - 8} more`
                    : ""}
                </p>
              )}
            </div>
          )}
        </aside>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
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
                        {office.senators.map((s) => {
                          const match = districts.find((d) =>
                            matchesDistrict(s.role, d.name)
                          );
                          return (
                          <OfficeRow
                            key={`${s.name}-${s.role}`}
                            person={s}
                            office="Senator"
                            district={s.role ?? undefined}
                            active={!!district && match?.id === district.id}
                            accent={match ? districtColor(match.id) : undefined}
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
                          );
                        })}
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

                  {row.key !== "president" && (
                    <Link
                      href="#candidates"
                      className="inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline"
                    >
                      See declared candidates in the roster
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
