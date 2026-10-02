import {
  NIGERIA_REGION_PATHS,
  NIGERIA_STATE_PATHS,
  NIGERIA_VIEW_BOX,
  type HubThumbPath,
} from "@/data/geo/hubThumbs";

const PATHS: Record<"regions" | "states", HubThumbPath[]> = {
  regions: NIGERIA_REGION_PATHS,
  states: NIGERIA_STATE_PATHS,
};

/** Nigeria's bounding box, matching the projection used to build the paths. */
const MIN_LON = 2.5;
const MAX_LON = 14.85;
const MIN_LAT = 3.9;
const MAX_LAT = 14.05;

function project(lon: number, lat: number): [number, number] {
  const width = 200;
  const height = 200;
  const lonSpan = MAX_LON - MIN_LON;
  const latSpan = MAX_LAT - MIN_LAT;
  const scale = Math.min(width / lonSpan, height / latSpan);
  const offsetX = (width - lonSpan * scale) / 2;
  const offsetY = (height - latSpan * scale) / 2;
  return [
    offsetX + (lon - MIN_LON) * scale,
    height - offsetY - (lat - MIN_LAT) * scale,
  ];
}

type Props = {
  /** Feature set to draw. */
  source: "regions" | "states";
  className?: string;
  /** Feature keys drawn in the accent colour; everything else stays muted. */
  highlight?: string[];
  /** Accent used for highlighted features. */
  accent?: string;
  /** Overlay pin markers. */
  markers?: { lon: number; lat: number }[];
  /** Explicit per-key fill, for real choropleth previews (keyed by feature id). */
  fillByKey?: Record<string, string>;
  title?: string;
};

/**
 * Static Nigeria thumbnail for hub pages. Path data is precomputed by
 * `npm run build:thumbs` so nothing reads the filesystem or ships the raw
 * GeoJSON — hub pages never load MapLibre.
 */
export default function NigeriaThumb({
  source,
  className = "",
  highlight = [],
  accent = "#008751",
  markers = [],
  fillByKey,
  title,
}: Props) {
  const paths = PATHS[source];
  const highlighted = new Set(highlight);

  return (
    <svg
      viewBox={NIGERIA_VIEW_BOX}
      className={className}
      role="img"
      aria-label={title ?? "Map of Nigeria"}
      preserveAspectRatio="xMidYMid meet"
    >
      <g stroke="#ffffff" strokeWidth={source === "regions" ? 0.6 : 0.25}>
        {paths.map((p) => {
          const fill = fillByKey?.[p.key];
          const on = fill ? true : highlighted.size === 0 || highlighted.has(p.key);
          return (
            <path
              key={p.key}
              d={p.d}
              fill={fill ?? (on ? accent : "#cbd5e1")}
              fillOpacity={fill ? 0.92 : on ? 0.9 : 0.45}
            />
          );
        })}
      </g>
      {markers.map((m, i) => {
        const [x, y] = project(m.lon, m.lat);
        return (
          <g key={`${m.lon}-${m.lat}-${i}`}>
            <circle cx={x} cy={y} r={4.5} fill="#ffffff" />
            <circle cx={x} cy={y} r={3} fill={accent} />
          </g>
        );
      })}
    </svg>
  );
}
