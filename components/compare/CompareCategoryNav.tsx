"use client";

import type { CompareCategoryDef, ComparePeriodDef } from "@/types/compare";

interface CompareCategoryNavProps {
  categories: CompareCategoryDef[];
  activeCategoryId: string;
  activePeriod: string;
  onCategoryChange: (id: string) => void;
  onPeriodChange: (period: string) => void;
}

export default function CompareCategoryNav({
  categories,
  activeCategoryId,
  activePeriod,
  onCategoryChange,
  onPeriodChange,
}: CompareCategoryNavProps) {
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const periods: ComparePeriodDef[] = activeCategory?.periods ?? [];

  return (
    <div className="space-y-2.5">
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Compare categories"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 min-h-[32px] ${
                isActive
                  ? "bg-ng-green text-white shadow-sm scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {activeCategory?.temporal && periods.length > 0 && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="compare-period"
            className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0"
          >
            Period
          </label>
          <select
            id="compare-period"
            value={activePeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-ng-green/30"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
