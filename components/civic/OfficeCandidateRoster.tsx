"use client";

import { useCallback, useMemo, useState } from "react";
import EmptyState from "@/components/hub/EmptyState";
import PartyIcon from "@/components/election/PartyIcon";
import { DossierDrawer } from "@/components/civic/CandidateRoster";
import { colorForSenatorialIndex } from "@/lib/politics/senatorialColors";
import type {
  HubCandidate,
  HubRepsRace,
  HubSenateRace,
} from "@/lib/server/loadCivicHubData";

const PAGE_SIZE = 9;

const selectClass =
  "h-10 rounded-lg border border-border-subtle bg-surface-card px-3 text-xs font-semibold text-slate-800 focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-emerald-500/10";

/** Non-presidential races only — the presidential ticket lives in the main roster. */
export type OfficeRace =
  | { kind: "senate"; race: HubSenateRace }
  | { kind: "reps"; race: HubRepsRace };

/** Senate races are keyed by district; House races hang off their district. */
function districtKey(row: OfficeRace): string {
  return row.kind === "senate" ? row.race.id : row.race.districtId;
}

function districtLabel(row: OfficeRace): string {
  return row.kind === "reps" ? row.race.districtName || row.race.name : row.race.name;
}

/**
 * The candidate roster app, scoped to one state and one non-presidential office.
 *
 * This is the same tool the national roster uses — search, district filter, race
 * cards and the shared dossier drawer — trimmed to the races that belong to the
 * state the reader picked in “Who represents me?”.
 */
export default function OfficeCandidateRoster({
  races,
  senateRaces,
  repsRaces,
  districtColorIndex,
  stateName,
  officeLabel,
  emptyHint,
}: {
  races: OfficeRace[];
  senateRaces: HubSenateRace[];
  repsRaces: HubRepsRace[];
  districtColorIndex: Record<string, number>;
  stateName: string;
  officeLabel: string;
  emptyHint: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [districtId, setDistrictId] = useState("all");
  const [page, setPage] = useState(0);
  const [hoverDistrictId, setHoverDistrictId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    kind: OfficeRace["kind"];
    raceId: string;
  } | null>(null);

  const districts = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of races) {
      const key = districtKey(row);
      if (!map.has(key)) map.set(key, districtLabel(row));
    }
    return [...map.entries()];
  }, [races]);

  const matchCandidate = useCallback(
    (c: HubCandidate): boolean => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) || c.party.toLowerCase().includes(q)
      );
    },
    [query]
  );

  const visible = useMemo(() => {
    const out: OfficeRace[] = [];
    for (const row of races) {
      if (districtId !== "all" && districtKey(row) !== districtId) continue;
      const candidates = row.race.candidates.filter(matchCandidate);
      if (candidates.length === 0) continue;
      out.push(
        row.kind === "senate"
          ? { kind: "senate", race: { ...row.race, candidates } }
          : { kind: "reps", race: { ...row.race, candidates } }
      );
    }
    return out;
  }, [districtId, matchCandidate, races]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageSlice = visible.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label-caps text-primary">Contest · {officeLabel}</p>
          <p className="mt-0.5 text-body-sm text-text-secondary">
            {races.length === 0
              ? `No ${officeLabel.toLowerCase()} races published for ${stateName}`
              : `${visible.length} of ${races.length} race${
                  races.length === 1 ? "" : "s"
                } in ${stateName}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {districts.length > 1 && (
            <select
              aria-label="Senatorial district"
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setPage(0);
                setSelected(null);
              }}
              className={selectClass}
            >
              <option value="all">All districts in {stateName}</option>
              {districts.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          )}
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
                setSelected(null);
              }}
              placeholder="Search candidate…"
              className={`${selectClass} w-40 pl-8 sm:w-48`}
            />
            <span
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              aria-hidden
            >
              ⌕
            </span>
          </div>
        </div>
      </div>

      {races.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No candidates in this snapshot" badge="INEC roster">
            {emptyHint}
          </EmptyState>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No candidate matches that search">
            Try another name or clear the district filter.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pageSlice.map((row) => {
              const key = `${row.kind}-${row.race.id}`;
              const district = districtKey(row);
              const candidates = row.race.candidates;
              const isSelected =
                selected?.kind === row.kind && selected.raceId === row.race.id;
              const highlighted = hoverDistrictId === district;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelected(
                      isSelected ? null : { kind: row.kind, raceId: row.race.id }
                    )
                  }
                  onMouseEnter={() => setHoverDistrictId(district)}
                  onMouseLeave={() => setHoverDistrictId(null)}
                  onFocus={() => setHoverDistrictId(district)}
                  onBlur={() => setHoverDistrictId(null)}
                  className={`flex flex-col rounded-xl border p-3 text-left shadow-sm transition-colors ${
                    isSelected
                      ? "border-primary-container bg-surface-card ring-2 ring-emerald-500/20"
                      : `border-border-subtle ${
                          highlighted ? "bg-emerald-50/60" : "bg-surface-card"
                        } hover:border-primary-container/40`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: colorForSenatorialIndex(
                            districtColorIndex[district] ?? 0
                          ),
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">
                          {row.race.name}
                        </p>
                        <p className="truncate text-[11px] text-text-muted">
                          {row.kind === "reps"
                            ? `${districtLabel(row)} Senatorial District`
                            : "Senatorial district"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary">
                      {candidates.length} candidate
                      {candidates.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {row.race.lgaNames.length > 0 && (
                    <p className="mt-2 line-clamp-1 text-[11px] text-text-secondary">
                      <span className="font-semibold text-text-muted">
                        {row.race.lgaNames.length} LGA
                        {row.race.lgaNames.length === 1 ? "" : "s"}:
                      </span>{" "}
                      {row.race.lgaNames.slice(0, 3).join(", ")}
                      {row.race.lgaNames.length > 3
                        ? ` +${row.race.lgaNames.length - 3}`
                        : ""}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex -space-x-1.5">
                      {candidates.slice(0, 6).map((c) => (
                        <PartyIcon
                          key={`${c.name}-${c.party}`}
                          icon={c.partyIcon}
                          abbreviation={c.party}
                          size="sm"
                          className="!h-7 !w-7 !rounded-full ring-2 ring-white"
                        />
                      ))}
                      {candidates.length > 6 && (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-text-secondary ring-2 ring-white">
                          +{candidates.length - 6}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-primary">
                      {isSelected ? "Close roster" : "View roster →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-border-subtle px-4 py-2 text-label-md disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[11px] tabular-nums text-text-muted">
                Page {pageSafe + 1} of {pageCount}
              </span>
              <button
                type="button"
                disabled={pageSafe >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-border-subtle px-4 py-2 text-label-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <DossierDrawer
          selected={selected}
          senateRaces={senateRaces}
          repsRaces={repsRaces}
          presidential={[]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}