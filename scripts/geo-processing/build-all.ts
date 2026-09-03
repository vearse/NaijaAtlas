import { buildGeo } from "./build-geo";
import { buildOverlays } from "./build-overlays";

buildGeo()
  .then(async (v) => {
    await buildOverlays();
    console.log("Geo build complete.", v.pass ? "PASSED" : "WITH WARNINGS");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
