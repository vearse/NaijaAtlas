import { buildGeo } from "./build-geo";

buildGeo()
  .then((v) => {
    console.log("Geo build complete.", v.pass ? "PASSED" : "WITH WARNINGS");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
