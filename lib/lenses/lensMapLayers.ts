import type { LensId } from "@/lib/lenses/lensHelper";
import type { OverlayLayerId } from "@/types/overlay";

/** Default overlay layers turned on when the user switches focus lens. */
export function defaultOverlaysForLens(lens: LensId): Set<OverlayLayerId> {
  switch (lens) {
    case "tourist":
      return new Set<OverlayLayerId>(["cities", "landforms", "lakes"]);
    case "invest":
      return new Set<OverlayLayerId>(["resources", "landforms", "cities"]);
    case "learn":
    default:
      return new Set<OverlayLayerId>(["cities"]);
  }
}
