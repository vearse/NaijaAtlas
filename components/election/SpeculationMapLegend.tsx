"use client";

import { useSpeculationStore } from "@/lib/store/speculationStore";
import {
  colorForParty,
  OTHERS_COLOR,
  OTHERS_LABEL,
} from "@/lib/speculation/constants";
import { isSpeculationLineupActive } from "@/lib/speculation/parties";

export default function SpeculationMapLegend() {
  const parties = useSpeculationStore((s) => s.parties);
  const states = useSpeculationStore((s) => s.states);
  const use2023 = useSpeculationStore((s) => s.use2023ForUnset);

  if (!isSpeculationLineupActive(parties)) return null;
  const setCount = Object.keys(states).length;

  return (
    <div className="absolute bottom-6 right-3 z-10 max-w-[260px] rounded-xl border border-border-subtle/90 bg-surface-card/95 px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {parties.map((party) => (
          <span
            key={party}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: colorForParty(party) }}
              aria-hidden
            />
            {party}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
          <span
            className="h-2.5 w-2.5 rounded-sm bg-slate-300"
            style={{ backgroundColor: OTHERS_COLOR }}
            aria-hidden
          />
          {OTHERS_LABEL}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] text-text-muted">
        {setCount}/37 states set ·{" "}
        {use2023 ? "2023 fills unset" : "unset left blank"}
      </p>
    </div>
  );
}
