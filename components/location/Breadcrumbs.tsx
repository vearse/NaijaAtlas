"use client";

import { useMapStore, primarySelectedStateId } from "@/lib/store/mapStore";
import type { StateLocation, LgaLocation } from "@/types/location";

interface BreadcrumbsProps {
  states: StateLocation[];
  lgas: LgaLocation[];
}

export default function Breadcrumbs({ states, lgas }: BreadcrumbsProps) {
  const {
    selectedStateIds,
    selectedStateOrder,
    selectedLgaId,
    reset,
    selectStates,
    setSelectedLga,
  } = useMapStore();

  const lga = selectedLgaId ? lgas.find((l) => l.id === selectedLgaId) : null;
  const primaryId = primarySelectedStateId(
    selectedStateIds,
    selectedStateOrder
  );
  const state = lga
    ? states.find((s) => s.id === lga.parentId)
    : primaryId
      ? states.find((s) => s.id === primaryId)
      : null;

  const crumbs: { label: string; onClick: () => void }[] = [
    { label: "Nigeria", onClick: reset },
  ];

  if (state) {
    crumbs.push({
      label: state.regionName,
      onClick: () => {
        reset();
      },
    });
    crumbs.push({
      label: state.name,
      onClick: () => {
        selectStates([state.id]);
        setSelectedLga(null);
      },
    });
  }

  if (lga) {
    crumbs.push({
      label: lga.name,
      onClick: () => setSelectedLga(lga.id),
    });
  } else if (selectedStateIds.size > 1 && state) {
    crumbs.push({
      label: `${selectedStateIds.size} on map`,
      onClick: () => setSelectedLga(null),
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300">/</span>}
          <button
            type="button"
            onClick={c.onClick}
            className={`hover:text-ng-green transition-colors ${
              i === crumbs.length - 1
                ? "font-semibold text-slate-900"
                : "text-slate-500"
            }`}
          >
            {c.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
