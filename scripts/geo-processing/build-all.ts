import { buildGeo } from "./build-geo";
import { buildPollingUnits } from "./build-polling-units";
import { buildOverlays } from "./build-overlays";

buildGeo()
  .then(async (v) => {
    const pu = await buildPollingUnits();
    await buildOverlays();
    console.log(
      "Geo build complete.",
      v.pass ? "PASSED" : "WITH WARNINGS",
      `· polling units: ${pu.pollingUnitCount.toLocaleString()}`
    );
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
