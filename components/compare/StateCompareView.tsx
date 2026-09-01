"use client";

import { useMemo, useState } from "react";
import type { CompareBundle } from "@/types/compare";
import {
  defaultPeriodForCategory,
  getCategories,
} from "@/lib/compare/compareUtils";
import { resolveStateCompareRows } from "@/lib/compare/resolveRows";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import { formatStateLandArea } from "@/lib/compare/landArea";
import ShowLgasButton from "@/components/map/ShowLgasButton";
import CompareCategoryNav from "./CompareCategoryNav";
import CompareMetricsTable from "./CompareMetricsTable";
import CompareExpandButton from "./CompareExpandButton";
import FadeIn from "@/components/ui/FadeIn";

const CHIP_COLORS = [
  "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  "border-sky-200 bg-sky-50/80 text-sky-900",
  "border-violet-200 bg-violet-50/80 text-violet-900",
];

interface StateCompareViewProps {
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
  bundle: CompareBundle;
  compact?: boolean;
  hideHeader?: boolean;
  onExpand?: () => void;
}

export default function StateCompareView({
  states,
  contents,
  lgas,
  bundle,
  compact = false,
  hideHeader = false,
  onExpand,
}: StateCompareViewProps) {
  const categories = getCategories(bundle, "state");
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? "general"
  );
  const [periods, setPeriods] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const cat of categories) {
      init[cat.id] = defaultPeriodForCategory(cat);
    }
    return init;
  });

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0];
  const activePeriod =
    periods[activeCategoryId] ?? defaultPeriodForCategory(activeCategory);

  const rows = useMemo(
    () =>
      activeCategory
        ? resolveStateCompareRows(
            bundle,
            activeCategory,
            activePeriod,
            states,
            lgas
          )
        : [],
    [bundle, activeCategory, activePeriod, states, lgas]
  );

  const handleCategoryChange = (id: string) => {
    setActiveCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat && !periods[id]) {
      setPeriods((prev) => ({
        ...prev,
        [id]: defaultPeriodForCategory(cat),
      }));
    }
  };

  const areas = states.map((s) =>
    formatStateLandArea(bundle, s.id)
  );

  return (
    <div className={`space-y-5 ${compact ? "pb-4" : ""}`}>
      {!hideHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-ng-green">
              Compare {states.length} states
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-1 leading-snug">
              {states.map((s) => s.name).join(" · ")}
            </h2>
          </div>
          {onExpand && <CompareExpandButton onClick={onExpand} />}
        </div>
      )}

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
              <div className="min-w-0">
                <p className="font-bold leading-tight truncate">{s.name}</p>
                <p className="text-[11px] opacity-70 mt-0.5">{s.regionName}</p>
                <p className="text-[11px] font-medium mt-1 opacity-80">
                  {areas[i]}
                </p>
              </div>
              <ShowLgasButton stateId={s.id} stateName={s.name} compact />
            </div>
          </div>
        ))}
      </div>

      <CompareCategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        activePeriod={activePeriod}
        onCategoryChange={handleCategoryChange}
        onPeriodChange={(p) =>
          setPeriods((prev) => ({ ...prev, [activeCategoryId]: p }))
        }
      />

      <FadeIn
        animationKey={`${activeCategoryId}-${activePeriod}`}
        className="space-y-5"
      >
        <CompareMetricsTable
          rows={rows}
          columns={states.map((s) => s.name)}
          layout="compare"
        />

        {activeCategory?.sourceNote && (
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {activeCategory.sourceNote}
          </p>
        )}
      </FadeIn>

      {!compact && (
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
                <p className="text-sm leading-relaxed opacity-90">
                  {c.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
