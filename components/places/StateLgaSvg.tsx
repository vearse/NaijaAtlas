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
}: {
  data: StateLgaSvgData;
  stateId: string;
  stateName: string;
  className?: string;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const hovered = data.lgas.find((l) => l.id === hover);

  return (
    <figure className={`relative bg-gradient-to-br from-emerald-50 via-white to-slate-50 ${className}`}>
      <svg
        viewBox={data.viewBox}
        className="h-full w-full p-4"
        role="img"
        aria-label={`${stateName}: ${data.lgas.length} local government areas`}
      >
        {data.lgas.map((l) => (
          <path
            key={l.id}
            d={l.d}
            fill={hover === l.id ? "#008751" : l.fill}
            fillOpacity={hover && hover !== l.id ? 0.55 : 0.85}
            stroke="#ffffff"
            strokeWidth={1.2}
            strokeLinejoin="round"
            className="cursor-pointer transition-[fill,fill-opacity] duration-150"
            onMouseEnter={() => setHover(l.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() =>
              router.push(`/places/map?states=${stateId}&lgas=1&lga=${l.id}`)
            }
          >
            <title>{l.name}</title>
          </path>
        ))}
      </svg>
      <figcaption className="absolute left-3 bottom-3 rounded-lg bg-white/90 border border-border-subtle px-3 py-1.5 text-body-sm shadow-sm">
        <span className="font-bold text-text-primary">{hovered?.name ?? stateName}</span>
        <span className="text-text-muted">
          {hovered ? " · open on map" : ` · ${data.lgas.length} LGAs`}
        </span>
      </figcaption>
    </figure>
  );
}
