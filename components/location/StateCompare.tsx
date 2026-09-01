"use client";

import type { CompareBundle } from "@/types/compare";
import type { LgaLocation, StateContent, StateLocation } from "@/types/location";
import StateCompareView from "@/components/compare/StateCompareView";

interface StateCompareProps {
  states: StateLocation[];
  contents: StateContent[];
  lgas: LgaLocation[];
  compareBundle: CompareBundle;
  onExpand?: () => void;
}

export default function StateCompare({
  onExpand,
  ...props
}: StateCompareProps) {
  return (
    <StateCompareView
      {...props}
      bundle={props.compareBundle}
      onExpand={onExpand}
    />
  );
}
