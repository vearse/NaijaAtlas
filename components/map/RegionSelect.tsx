"use client";

import { useMapStore } from "@/lib/store/mapStore";
import type { RegionLocation } from "@/types/location";
import MapChromeDropdown from "@/components/map/MapChromeDropdown";

const REGION_SHORT: Record<string, string> = {
  "North Central": "NC",
  "North East": "NE",
  "North West": "NW",
  "South East": "SE",
  "South South": "SS",
  "South West": "SW",
};

const ALL_NIGERIA = "__all__";

function RegionGridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1" opacity="0.55" />
      <rect x="9" y="1" width="6" height="6" rx="1" opacity="0.75" />
      <rect x="1" y="9" width="6" height="6" rx="1" opacity="0.75" />
      <rect x="9" y="9" width="6" height="6" rx="1" opacity="0.55" />
    </svg>
  );
}

function RegionDotIcon({ color }: { color: string }) {
  return (
    <span
      className="h-3.5 w-3.5 rounded-full ring-1 ring-slate-200/80 shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

interface RegionSelectProps {
  regions: RegionLocation[];
}

export default function RegionSelect({ regions }: RegionSelectProps) {
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const setActiveRegion = useMapStore((s) => s.setActiveRegion);
  const selectStates = useMapStore((s) => s.selectStates);

  const value = activeRegionId ?? ALL_NIGERIA;
  const activeRegion = regions.find((r) => r.id === activeRegionId);

  const buttonLabel = activeRegion
    ? REGION_SHORT[activeRegion.name] ?? activeRegion.name
    : "All";

  const options = [
    {
      id: ALL_NIGERIA,
      label: "All Nigeria",
      desc: "No regional highlight on the map",
      icon: <RegionGridIcon />,
    },
    ...regions.map((r) => ({
      id: r.id,
      label: r.name,
      desc: `${r.stateIds.length} states · click again in menu to load LGAs`,
      icon: <RegionDotIcon color={r.color} />,
    })),
  ];

  return (
    <MapChromeDropdown
      value={value}
      options={options}
      onChange={(id) => {
        if (id === ALL_NIGERIA) {
          setActiveRegion(null);
          return;
        }
        if (activeRegionId === id) {
          const region = regions.find((r) => r.id === id);
          if (region) selectStates(region.stateIds);
        } else {
          setActiveRegion(id);
        }
      }}
      ariaLabel="Select geopolitical region"
      buttonLabel={buttonLabel}
      variant="neutral"
      menuWidthClass="w-60"
    />
  );
}
