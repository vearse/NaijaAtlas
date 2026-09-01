"use client";

import { useMemo, useState } from "react";
import type { CompareBundle } from "@/types/compare";
import {
  defaultPeriodForCategory,
  getCategories,
} from "@/lib/compare/compareUtils";
import { resolveCountryRows } from "@/lib/compare/resolveRows";
import CompareCategoryNav from "./CompareCategoryNav";
import CompareMetricsTable from "./CompareMetricsTable";
import FadeIn from "@/components/ui/FadeIn";

interface CountryProfileProps {
  bundle: CompareBundle;
}

export default function CountryProfile({ bundle }: CountryProfileProps) {
  const categories = getCategories(bundle, "country");
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
        ? resolveCountryRows(bundle, activeCategory, activePeriod)
        : [],
    [bundle, activeCategory, activePeriod]
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

  return (
    <div className="space-y-4">
      <CompareCategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        activePeriod={activePeriod}
        onCategoryChange={handleCategoryChange}
        onPeriodChange={(p) =>
          setPeriods((prev) => ({ ...prev, [activeCategoryId]: p }))
        }
      />

      <FadeIn animationKey={`${activeCategoryId}-${activePeriod}`}>
        <CompareMetricsTable rows={rows} columns={["Nigeria"]} layout="profile" />

        {activeCategory?.sourceNote && (
          <p className="text-[10px] text-slate-400 leading-relaxed mt-4">
            {activeCategory.sourceNote}
          </p>
        )}
      </FadeIn>
    </div>
  );
}
