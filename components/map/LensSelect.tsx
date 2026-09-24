"use client";

import { useMapStore } from "@/lib/store/mapStore";
import {
  LENS_IDS,
  LENS_LABELS,
  type LensId,
} from "@/lib/lenses/lensHelper";
import MapChromeDropdown from "@/components/map/MapChromeDropdown";

const LENS_DESC: Record<LensId, string> = {
  learn: "Notes, geography, and general exploration",
  tourist: "Cities, scenery, lakes, and places to visit",
  invest: "Resources, industry, and economy-focused layers",
};

function LensIcon({ lens }: { lens: LensId }) {
  const cls = "w-3.5 h-3.5";
  if (lens === "tourist") {
    return (
      <svg viewBox="0 0 16 16" className={cls} fill="none" aria-hidden>
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (lens === "invest") {
    return (
      <svg viewBox="0 0 16 16" className={cls} fill="none" aria-hidden>
        <path
          d="M2 12l4-5 3 3 5-7"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={cls} fill="currentColor" aria-hidden>
      <path d="M3 2h10v2H3V2zm0 4h7v2H3V6zm0 4h10v2H3v-2z" opacity="0.9" />
    </svg>
  );
}

export default function LensSelect() {
  const activeLens = useMapStore((s) => s.activeLens);
  const setActiveLens = useMapStore((s) => s.setActiveLens);

  const options = LENS_IDS.map((id) => ({
    id,
    label: LENS_LABELS[id],
    desc: LENS_DESC[id],
    icon: <LensIcon lens={id} />,
  }));

  return (
    <MapChromeDropdown
      value={activeLens}
      options={options}
      onChange={setActiveLens}
      ariaLabel="Select focus lens"
      buttonLabel={LENS_LABELS[activeLens]}
      variant="neutral"
      menuWidthClass="w-56"
      menuAlign="left"
    />
  );
}
