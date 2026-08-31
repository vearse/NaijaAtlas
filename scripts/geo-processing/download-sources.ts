import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const ROOT = path.resolve(__dirname, "../..");

const SALB_FILES = [
  {
    name: "nigeria_polbnda_admin_0_unsalb.zip",
    url: "https://data.humdata.org/dataset/707aae55-ae4a-49dd-bb30-73f9fb55e569/resource/e1b2a9b5-a68d-4e67-bc61-da9983741956/download/nigeria_polbnda_admin_0_unsalb.zip",
  },
  {
    name: "nigeria_polbnda_admin_1_unsalb.zip",
    url: "https://data.humdata.org/dataset/707aae55-ae4a-49dd-bb30-73f9fb55e569/resource/89fd13e1-367c-4a2d-ac2c-2b123d1c7b73/download/nigeria_polbnda_admin_1_unsalb.zip",
  },
  {
    name: "nigeria_polbnda_admin_2_unsalb.zip",
    url: "https://data.humdata.org/dataset/707aae55-ae4a-49dd-bb30-73f9fb55e569/resource/06ad393a-fff4-4442-82a7-32122b458553/download/nigeria_polbnda_admin_2_unsalb.zip",
  },
];

const TEMIKEEZY_FILES = [
  "states.json",
  "lgas.json",
  "wards.json",
  "lgas-with-wards.json",
  "full.json",
];

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = url.startsWith("https") ? https.get : http.get;

    const request = get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close();
        fs.unlinkSync(dest);
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });
    request.on("error", reject);
  });
}

async function main() {
  const salbDir = path.join(ROOT, "data/geo/source/salb");
  const temiDir = path.join(ROOT, "data/locations/source/temikeezy");
  fs.mkdirSync(salbDir, { recursive: true });
  fs.mkdirSync(temiDir, { recursive: true });

  console.log("Downloading UN SALB shapefiles from HDX...");
  for (const f of SALB_FILES) {
    const dest = path.join(salbDir, f.name);
    if (fs.existsSync(dest)) {
      console.log(`  skip ${f.name} (exists)`);
      continue;
    }
    console.log(`  downloading ${f.name}...`);
    await download(f.url, dest);
  }

  console.log("Downloading temikeezy JSON...");
  for (const f of TEMIKEEZY_FILES) {
    const dest = path.join(temiDir, f);
    if (fs.existsSync(dest)) {
      console.log(`  skip ${f} (exists)`);
      continue;
    }
    const url = `https://raw.githubusercontent.com/temikeezy/nigeria-geojson-data/main/data/${f}`;
    console.log(`  downloading ${f}...`);
    await download(url, dest);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
