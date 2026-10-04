export type StateLgaShape = { id: string; name: string; d: string; fill: string };
export type StateLgaSvg = { viewBox: string; lgas: StateLgaShape[] };

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

export type LgaFeatureCollection = {
  features: { properties: Record<string, string>; geometry: Geometry }[];
};

const WIDTH = 600;

/**
 * Projects a state's LGA FeatureCollection to SVG paths (equirectangular,
 * lat-corrected). Pure, so it runs on the server and in the browser.
 */
export function projectLgaSvg(geo: LgaFeatureCollection): StateLgaSvg | null {
  const polys = (g: Geometry): Ring[][] =>
    g.type === "Polygon" ? [g.coordinates] : g.coordinates;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of geo.features)
    for (const poly of polys(f.geometry))
      for (const [x, y] of poly[0]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (!Number.isFinite(minX)) return null;

  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const scale = WIDTH / ((maxX - minX) * k);
  const height = Math.round((maxY - minY) * scale);
  const pt = ([x, y]: number[]) =>
    `${Math.round((x - minX) * k * scale)},${Math.round((maxY - y) * scale)}`;

  const lgas = geo.features.map((f) => {
    const d = polys(f.geometry)
      .flatMap((poly) =>
        poly.map((ring) => {
          const pts: string[] = [];
          for (const c of ring) {
            const p = pt(c);
            if (pts[pts.length - 1] !== p) pts.push(p);
          }
          return `M${pts.join("L")}Z`;
        })
      )
      .join("");
    return {
      id: f.properties.id,
      name: f.properties.name,
      d,
      fill: f.properties.fillColor ?? "#7cb87c",
    };
  });

  return { viewBox: `-4 -4 ${WIDTH + 8} ${height + 8}`, lgas };
}
