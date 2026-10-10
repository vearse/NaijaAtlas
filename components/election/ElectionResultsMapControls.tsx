"use client";

import { useMapStore } from "@/lib/store/mapStore";

type Props = {
  availableYears: number[];
};

export function useElectionModeSwitch(availableYears: number[]) {
  const setYear = useMapStore((s) => s.setElectionResultsYear);
  const setOffice = useMapStore((s) => s.setElectionResultsOffice);

  const showResults = (year = availableYears[0]) => {
    if (year == null) return;
    useMapStore.getState().selectStates([]);
    setYear(year);
    setOffice("president");
  };
  const showCurrent = () => setYear(null);

  return { showResults, showCurrent };
}

export default function ElectionResultsMapControls({ availableYears }: Props) {
  const year = useMapStore((s) => s.electionResultsYear);
  const { showResults, showCurrent } = useElectionModeSwitch(availableYears);
  const inResults = year != null;

  const tab = (active: boolean) =>
    `rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
      active
        ? "bg-primary-container text-white shadow-sm"
        : "text-text-secondary hover:bg-slate-100"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-card/95 px-1.5 py-1.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-1" role="tablist" aria-label="Election view">
        <button
          type="button"
          role="tab"
          aria-selected={!inResults}
          onClick={showCurrent}
          className={tab(!inResults)}
        >
          2027 · Candidates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inResults}
          onClick={() => !inResults && showResults()}
          disabled={availableYears.length === 0}
          className={tab(inResults)}
        >
          Past results
        </button>
      </div>
      {inResults && (
        <label className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold text-text-muted">
          Year
          <select
            value={year ?? ""}
            onChange={(e) => showResults(Number(e.target.value))}
            className="rounded-lg border border-border-subtle bg-white px-2 py-1 text-xs font-medium text-text-primary"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y} · President
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
