"use client";

import { useCallback } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  matchesActiveLens,
  type LensId,
  type LensInput,
} from "@/lib/lenses/lensHelper";

export function useLensFilter() {
  const activeLens = useMapStore((s) => s.activeLens);

  const matches = useCallback(
    (input: LensInput) => matchesActiveLens(input, activeLens),
    [activeLens]
  );

  return { activeLens, matches, isLearn: activeLens === "learn" } satisfies {
    activeLens: LensId;
    matches: (input: LensInput) => boolean;
    isLearn: boolean;
  };
}
