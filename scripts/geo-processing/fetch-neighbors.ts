import fs from "fs";
import path from "path";
import https from "https";

const ROOT = path.resolve(__dirname, "../..");
const NEIGHBORS = [
  { code: "BEN", name: "Benin" },
  { code: "NER", name: "Niger" },
  { code: "TCD", name: "Chad" },
  { code: "CMR", name: "Cameroon" },
];

function fetchJson(url: string): Promise<GeoJSON.FeatureCollection> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (loc) {
            fetchJson(loc).then(resolve).catch(reject);
            return;
          }
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const features: GeoJSON.Feature[] = [];
  for (const n of NEIGHBORS) {
    const url = `https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/${n.code}/ADM0/geoBoundaries-${n.code}-ADM0_simplified.geojson`;
    console.log(`Fetching ${n.name}...`);
    try {
      const fc = await fetchJson(url);
      for (const f of fc.features) {
        features.push({
          ...f,
          properties: { name: n.name, code: n.code },
        });
      }
    } catch (e) {
      console.warn(`Failed ${n.name}:`, e);
    }
  }

  const out = path.join(ROOT, "public/geo/neighbors.geojson");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify({ type: "FeatureCollection", features })
  );
  console.log(`Wrote ${features.length} neighbor features`);
}

main().catch(console.error);
