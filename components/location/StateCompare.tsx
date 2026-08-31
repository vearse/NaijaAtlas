import type { StateContent, StateLocation, LgaLocation } from "@/types/location";
import {
  estimateAreaKm2,
  formatAreaKm2,
  formatCoord,
} from "@/lib/map/metrics";
import ShowLgasButton from "@/components/map/ShowLgasButton";

interface StateCompareProps {
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
}

const CHIP_COLORS = [
  "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  "border-sky-200 bg-sky-50/80 text-sky-900",
  "border-violet-200 bg-violet-50/80 text-violet-900",
];

function highlightMax(values: number[]): Set<number> {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return new Set();
  return new Set(values.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0));
}

export default function StateCompare({
  states,
  contents,
  lgas,
}: StateCompareProps) {
  const areas = states.map((s) => estimateAreaKm2(s.bbox));
  const wardTotals = states.map((s) =>
    lgas.filter((l) => l.parentId === s.id).reduce((n, l) => n + l.wardCount, 0)
  );
  const wardsPerLga = states.map((s, i) =>
    s.lgaCount > 0 ? Math.round(wardTotals[i] / s.lgaCount) : 0
  );

  const rows: {
    label: string;
    values: (string | number)[];
    numeric?: number[];
  }[] = [
    { label: "Region", values: states.map((s) => s.regionName) },
    {
      label: "Land area (est.)",
      values: areas.map(formatAreaKm2),
      numeric: areas,
    },
    {
      label: "LGAs",
      values: states.map((s) => s.lgaCount),
      numeric: states.map((s) => s.lgaCount),
    },
    {
      label: "Total wards",
      values: wardTotals,
      numeric: wardTotals,
    },
    {
      label: "Wards / LGA (avg)",
      values: wardsPerLga,
      numeric: wardsPerLga,
    },
    {
      label: "Capital",
      values: states.map(
        (s) => contents.find((c) => c.id === s.id)?.capital ?? "—"
      ),
    },
    {
      label: "Center",
      values: states.map((s) => formatCoord(s.centroid)),
    },
    { label: "Code", values: states.map((s) => s.id) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ng-green">
          Compare {states.length} states
        </p>
        <h2 className="text-xl font-bold text-slate-900 mt-1 leading-snug">
          {states.map((s) => s.name).join(" · ")}
        </h2>
      </div>

      <div
        className={`grid gap-2 ${
          states.length === 2 ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {states.map((s, i) => (
          <div
            key={s.id}
            className={`rounded-xl border p-3 ${CHIP_COLORS[i] ?? CHIP_COLORS[0]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold leading-tight">{s.name}</p>
                <p className="text-[11px] opacity-70 mt-0.5">{s.regionName}</p>
                <p className="text-[11px] font-medium mt-1 opacity-80">
                  {formatAreaKm2(areas[i])}
                </p>
              </div>
              <ShowLgasButton
                stateId={s.id}
                stateName={s.name}
                compact
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <th className="text-left px-3 py-2 font-semibold">Metric</th>
              {states.map((s) => (
                <th key={s.id} className="text-right px-3 py-2 font-semibold">
                  {s.name.length > 8 ? s.name.slice(0, 7) + "…" : s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hi =
                row.numeric && row.numeric.length > 0
                  ? highlightMax(row.numeric)
                  : new Set<number>();
              return (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-500">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2 text-right font-medium ${
                        hi.has(i) ? "text-ng-green" : "text-slate-800"
                      }`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        {states.map((s, i) => {
          const c = contents.find((x) => x.id === s.id);
          if (!c) return null;
          return (
            <div
              key={s.id}
              className={`rounded-xl border p-3 ${CHIP_COLORS[i] ?? CHIP_COLORS[0]}`}
            >
              <p className="text-xs font-semibold opacity-70 mb-1">{s.name}</p>
              <p className="text-sm leading-relaxed opacity-90">{c.description}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400">
        Land area is estimated from bounding boxes. Boundaries © UN SALB.
      </p>
    </div>
  );
}
