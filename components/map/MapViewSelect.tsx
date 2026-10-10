"use client";

import { useMapStore, type MapCanvasView } from "@/lib/store/mapStore";
import MapChromeDropdown from "@/components/map/MapChromeDropdown";

const OPTIONS: { id: MapCanvasView; label: string; desc: string }[] = [
  { id: "map", label: "Map", desc: "Interactive state map" },
  { id: "zones", label: "Zones", desc: "Six geopolitical zones at a glance" },
];

export default function MapViewSelect() {
  const mapCanvasView = useMapStore((s) => s.mapCanvasView);
  const setMapCanvasView = useMapStore((s) => s.setMapCanvasView);

  const options = OPTIONS.map((o) => ({
    id: o.id,
    label: o.label,
    desc: o.desc,
    icon: (
      <span className="text-[11px] font-bold" aria-hidden>
        {o.id === "map" ? "🗺" : "▦"}
      </span>
    ),
  }));

  const current = OPTIONS.find((o) => o.id === mapCanvasView) ?? OPTIONS[0];

  return (
    <MapChromeDropdown
      value={mapCanvasView}
      options={options}
      onChange={setMapCanvasView}
      ariaLabel="Map or zones view"
      buttonLabel={current.label}
      variant="neutral"
      menuWidthClass="w-52"
      menuAlign="left"
    />
  );
}
