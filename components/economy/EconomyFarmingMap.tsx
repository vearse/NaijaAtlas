import {
  NIGERIA_STATE_PATHS,
  NIGERIA_VIEW_BOX,
} from "@/data/geo/hubThumbs";

type Props = {
  /** Full-coverage fill colour per state id, e.g. a state's dominant belt. */
  fillByStateId?: Record<string, string>;
  /** Partial-coverage fill per state id, drawn faded. */
  partialFillByStateId?: Record<string, string>;
  /** States drawn with a strong outline to show the active selection. */
  outlineStateIds?: string[];
  /** Fallback fill for states with no entry in the fill maps. */
  baseFill?: string;
  /** Outline colour for the highlighted states. */
  accent?: string;
  className?: string;
  title?: string;
};

/**
 * Static, client-light choropleth thumbnail for the Economy page. Reads the
 * precomputed state path data so the hub never loads MapLibre. Unlike the
 * shared `NigeriaThumb`, it supports an explicit per-state fill plus a
 * separate outline layer, so all belts can show their own colour at once
 * while the active belt or crop is outlined on top.
 */
export default function EconomyFarmingMap({
  fillByStateId = {},
  partialFillByStateId = {},
  outlineStateIds = [],
  baseFill = "#e2e8f0",
  accent = "#0f172a",
  className = "",
  title,
}: Props) {
  const outline = new Set(outlineStateIds);
  const outlined = NIGERIA_STATE_PATHS.filter((p) => outline.has(p.key));

  return (
    <svg
      viewBox={NIGERIA_VIEW_BOX}
      className={className}
      role="img"
      aria-label={title ?? "Map of Nigeria"}
      preserveAspectRatio="xMidYMid meet"
    >
      <g stroke="#ffffff" strokeWidth={0.35}>
        {NIGERIA_STATE_PATHS.map((p) => {
          const full = fillByStateId[p.key];
          const partial = partialFillByStateId[p.key];
          return (
            <path
              key={p.key}
              d={p.d}
              fill={full ?? partial ?? baseFill}
              fillOpacity={full ? 0.92 : partial ? 0.4 : 0.9}
            />
          );
        })}
      </g>
      <g
        stroke={accent}
        strokeWidth={1.3}
        strokeLinejoin="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      >
        {outlined.map((p) => (
          <path key={`outline-${p.key}`} d={p.d} />
        ))}
      </g>
    </svg>
  );
}
