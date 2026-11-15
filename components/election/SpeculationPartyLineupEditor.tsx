"use client";

import type { ParliamentaryParty } from "@/types/politics";
import {
  LOCKED_SPECULATION_PARTIES,
  MAX_SPECULATION_PARTIES,
  MIN_SPECULATION_PARTIES,
} from "@/lib/speculation/constants";
import {
  canRemovePartyFromLineup,
  isValidSpeculationLineup,
} from "@/lib/speculation/parties";

interface SpeculationPartyLineupEditorProps {
  picked: string[];
  directory: ParliamentaryParty[];
  onChange: (next: string[]) => void;
}

export default function SpeculationPartyLineupEditor({
  picked,
  directory,
  onChange,
}: SpeculationPartyLineupEditorProps) {
  const valid = isValidSpeculationLineup(picked);
  const duplicate = new Set(picked).size !== picked.length;
  const canAdd = picked.length < MAX_SPECULATION_PARTIES;
  const unused = directory
    .map((party) => party.abbreviation)
    .filter((abbrev) => !picked.includes(abbrev));

  const replaceAt = (index: number, value: string) => {
    const party = picked[index];
    if (
      party &&
      (LOCKED_SPECULATION_PARTIES as readonly string[]).includes(party)
    ) {
      return;
    }
    const next = [...picked];
    next[index] = value;
    onChange(next.filter(Boolean));
  };

  const remove = (party: string) => {
    if (!canRemovePartyFromLineup(party, picked)) return;
    onChange(picked.filter((item) => item !== party));
  };

  const add = (value: string) => {
    if (!value || picked.includes(value)) return;
    if (picked.length >= MAX_SPECULATION_PARTIES) return;
    onChange([...picked, value]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        {MIN_SPECULATION_PARTIES}–{MAX_SPECULATION_PARTIES} parties.{" "}
        <span className="font-semibold text-text-secondary">
          APC, NDC, and ADC
        </span>{" "}
        stay in the scenario.
      </p>
      <ul className="space-y-2">
        {picked.map((party, index) => {
          const locked = (
            LOCKED_SPECULATION_PARTIES as readonly string[]
          ).includes(party);
          const removable = canRemovePartyFromLineup(party, picked);
          return (
            <li key={`${party}-${index}`} className="flex items-center gap-2">
              {locked ? (
                <span className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-semibold text-text-primary">
                  {party}
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Fixed
                  </span>
                </span>
              ) : (
                <select
                  value={party}
                  onChange={(event) => replaceAt(index, event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm font-medium text-text-primary"
                  aria-label={`Party ${index + 1}`}
                >
                  {directory.map((entry) => (
                    <option
                      key={entry.abbreviation}
                      value={entry.abbreviation}
                      disabled={
                        picked.includes(entry.abbreviation) &&
                        entry.abbreviation !== party
                      }
                    >
                      {entry.abbreviation} · {entry.name}
                    </option>
                  ))}
                </select>
              )}
              {removable && (
                <button
                  type="button"
                  onClick={() => remove(party)}
                  className="shrink-0 rounded-lg border border-border-subtle px-2 py-2 text-xs font-semibold text-text-muted hover:bg-red-50 hover:text-red-700"
                  aria-label={`Remove ${party}`}
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {canAdd && (
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            onChange={(event) => {
              const value = event.target.value;
              if (value) add(value);
              event.target.value = "";
            }}
            className="min-w-0 flex-1 rounded-xl border border-dashed border-border-subtle bg-white px-3 py-2 text-sm text-text-primary"
            aria-label="Add party"
          >
            <option value="">Add party…</option>
            {unused.map((abbrev) => {
              const meta = directory.find((p) => p.abbreviation === abbrev);
              return (
                <option key={abbrev} value={abbrev}>
                  {abbrev}
                  {meta ? ` · ${meta.name}` : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}
      {!valid && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          {duplicate
            ? "Each party can only appear once."
            : picked.length < MIN_SPECULATION_PARTIES
              ? `Pick at least ${MIN_SPECULATION_PARTIES} parties.`
              : "Include APC, NDC, and ADC."}
        </p>
      )}
    </div>
  );
}