"use client";

import {
  useMapStore,
  canCompareStates,
  MAX_COMPARE_STATES,
  type CompareViewId,
} from "@/lib/store/mapStore";
import MapChromeDropdown from "@/components/map/MapChromeDropdown";

function CompareIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4h4v8H3V4zm6 0h4v8H9V4z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CompareMenuId = CompareViewId | "closed";

export default function CompareMenu() {
  const mapType = useMapStore((s) => s.mapType);
  const selectedStateIds = useMapStore((s) => s.selectedStateIds);
  const selectedLgaId = useMapStore((s) => s.selectedLgaId);
  const compareView = useMapStore((s) => s.compareView);
  const openCompareView = useMapStore((s) => s.openCompareView);
  const closeCompareView = useMapStore((s) => s.closeCompareView);

  if (mapType === "election" || mapType === "ranking") return null;

  const stateEligible = canCompareStates({
    mapType,
    selectedStateIds,
    selectedLgaId,
  });

  const showBar =
    stateEligible || compareView === "state";

  if (!showBar) return null;

  const value: CompareMenuId = compareView === "state" ? "state" : "closed";

  const options = [
    {
      id: "state" as CompareMenuId,
      label: "Compare states",
      desc: stateEligible
        ? `${selectedStateIds.size} state${selectedStateIds.size === 1 ? "" : "s"} ready`
        : `Pick 2–${MAX_COMPARE_STATES} states`,
      icon: <CompareIcon />,
      disabled: !stateEligible,
    },
    {
      id: "metro" as CompareMenuId,
      label: "Compare metros",
      desc: "Coming soon",
      icon: <CompareIcon />,
      disabled: true,
    },
    {
      id: "lga" as CompareMenuId,
      label: "Compare LGAs",
      desc: "Coming soon",
      icon: <CompareIcon />,
      disabled: true,
    },
  ];

  return (
    <MapChromeDropdown
      value={value}
      options={options}
      onChange={(id) => {
        if (id === "state") {
          if (compareView === "state") closeCompareView();
          else openCompareView("state");
        }
      }}
      ariaLabel="Compare locations"
      buttonLabel={compareView === "state" ? "Comparing" : "Compare"}
      variant={compareView === "state" ? "accent" : "neutral"}
      menuWidthClass="w-56"
      menuAlign="left"
    />
  );
}
