import type { OverlayLayerId } from "@/types/overlay";

export interface OverlayFocusSpec {
  layerId: OverlayLayerId;
  matchKey: string;
  matchValue: string;
  label: string;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/** Pick the tightest meaningful focus key for a layer. */
export function focusFromFeature(
  layerId: OverlayLayerId,
  properties: Record<string, unknown>
): OverlayFocusSpec | null {
  const pick = (
    matchKey: string,
    value: string | null,
    label: string
  ): OverlayFocusSpec | null => {
    if (!value) return null;
    return { layerId, matchKey, matchValue: value, label };
  };

  switch (layerId) {
    case "waterways": {
      const waterwayClass = str(properties.waterwayClass);
      if (waterwayClass)
        return pick("waterwayClass", waterwayClass, `Rivers: ${waterwayClass}`);
      const featureKind = str(properties.featureKind);
      if (featureKind)
        return pick("featureKind", featureKind, `Water: ${featureKind}`);
      const type = str(properties.type);
      return type ? pick("type", type, type) : null;
    }
    case "resources": {
      const resourceType = str(properties.resourceType);
      if (resourceType) return pick("resourceType", resourceType, resourceType);
      const type = str(properties.type);
      return type ? pick("type", type, type) : null;
    }
    case "cities": {
      const category = str(properties.category);
      return category ? pick("category", category, category) : null;
    }
    case "landforms": {
      const landformType = str(properties.landformType);
      if (landformType) return pick("landformType", landformType, landformType);
      const category = str(properties.category);
      return category ? pick("category", category, category) : null;
    }
    case "lakes": {
      const featureKind = str(properties.featureKind);
      if (featureKind) return pick("featureKind", featureKind, featureKind);
      const plantCategory = str(properties.plantCategory);
      return plantCategory
        ? pick("plantCategory", plantCategory, plantCategory)
        : null;
    }
    default:
      return null;
  }
}

export function featureMatchesFocus(
  properties: Record<string, unknown>,
  spec: OverlayFocusSpec
): boolean {
  if (spec.layerId !== (properties.layerId as OverlayLayerId)) {
    const layerId = str(properties.layerId);
    if (layerId && layerId !== spec.layerId) return false;
  }
  const raw = properties[spec.matchKey];
  if (raw === undefined || raw === null) return false;
  return String(raw).trim() === spec.matchValue;
}

export function encodeFocusParam(spec: OverlayFocusSpec): string {
  return `${spec.layerId}:${spec.matchKey}=${encodeURIComponent(spec.matchValue)}`;
}

export function parseFocusParam(raw: string | null): OverlayFocusSpec | null {
  if (!raw) return null;
  const colon = raw.indexOf(":");
  const eq = raw.indexOf("=");
  if (colon < 1 || eq < colon + 1) return null;
  const layerId = raw.slice(0, colon) as OverlayLayerId;
  const matchKey = raw.slice(colon + 1, eq);
  const matchValue = decodeURIComponent(raw.slice(eq + 1));
  return {
    layerId,
    matchKey,
    matchValue,
    label: matchValue,
  };
}
