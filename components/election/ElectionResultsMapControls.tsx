"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { PresidentialResultsBundle } from "@/types/politics";

type Props = {
  availableYears: number[];
  resultsByYear: Record<number, PresidentialResultsBundle>;
};

export default function ElectionResultsMapControls({
  availableYears,
  resultsByYear,
}: Props) {
  const year = useMapStore((s) => s.electionResultsYear);
  const office = useMapStore((s) => s.electionResultsOffice);
  const setYear = useMapStore((s) => s.setElectionResultsYear);
  const setOffice = useMapStore((s) => s.setElectionResultsOffice);

  const hasResults = year != null && resultsByYear[year];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-card/95 px-2 py-1.5 shadow-sm backdrop-blur-sm">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
        Year
        <select
          value={year ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              setYear(null);
              setOffice(null);
              return;
            }
            setYear(Number(v));
            setOffice("president");
          }}
          className="rounded-lg border border-border-subtle bg-white px-2 py-1 text-xs font-medium text-text-primary"
        >
          <option value="">2027 · districts</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y} · results</option>
          ))}
        </select>
      </label>
      {hasResults && (
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
          Office
          <select
            value={office ?? "president"}
            onChange={() => setOffice("president")}
            className="rounded-lg border border-border-subtle bg-white px-2 py-1 text-xs font-medium text-text-primary"
          >
            <option value="president">President</option>
          </select>
        </label>
      )}
    </div>
  );
}
