"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StateLgaSvg as StateLgaSvgData } from "@/lib/server/stateLgaSvg";

/** Static LGA map of one state; clicking an LGA opens it on the Places map. */
export default function StateLgaSvg({
  data,
  stateId,
  stateName,
  className = "",
  selectedId = null,
  onSelect,
}: {
  data: StateLgaSvgData;
  stateId: string;
  stateName: string;
  className?: string;
  selectedId?: string | null;
  onSelect?: (lgaId: string) => void;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const activeId = selectedId ?? hover;
  const hovered = data.lgas.find((l) => l.id === activeId);

  return (
    <figure className={`relative bg-gradient-to-br from-emerald-50 via-white to-slate-50 ${className}`}>
      <svg
        viewBox={data.viewBox}
        className="h-full w-full p-4"
        role="img"
        aria-label={`${stateName}: ${data.lgas.length} local government areas`}
      >
        {data.lgas.map((l) => {
          const isActive = activeId === l.id;
          const isDim = activeId !== null && !isActive;
          return (
          <path
            key={l.id}
            d={l.d}
            fill={isActive ? "#043828" : l.fill}
            fillOpacity={isDim ? 0.45 : 0.88}
            stroke="#ffffff"
            strokeWidth={1.2}
            strokeLinejoin="round"
            className="cursor-pointer transition-[fill,fill-opacity] duration-150"
            onMouseEnter={() => setHover(l.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => {
              if (onSelect) onSelect(l.id);
              else router.push(`/places/map?states=${stateId}&lgas=1&lga=${l.id}`);
            }}
          >
            <title>{l.name}</title>
          </path>
          );
        })}
      </svg>
      <figcaption className="absolute left-3 bottom-3 rounded-lg bg-white/90 border border-border-subtle px-3 py-1.5 text-body-sm shadow-sm">
        <span className="font-bold text-text-primary">{hovered?.name ?? stateName}</span>
        <span className="text-text-muted">
          {hovered && onSelect ? " · selected" : hovered ? " · open on map" : ` · ${data.lgas.length} LGAs`}
        </span>
      </figcaption>
    </figure>
  );
}
