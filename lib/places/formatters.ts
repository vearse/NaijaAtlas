/**
 * Client-safe value formatters shared by the landing page, the Places hub and
 * the state profiles. Kept free of any `fs` import so it can be bundled into
 * client components.
 */

export type CompactFormat = "naira" | "compact" | "count" | "int" | "percent";

/** Compact population label, e.g. `21M` or `1.4M`. */
export function formatPopulation(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/** Naira with a scale suffix, e.g. `₦1.26T`. */
export function formatNaira(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 1e12) return `₦${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `₦${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `₦${(value / 1e6).toFixed(0)}M`;
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

/** Thousands-separated whole number, e.g. `75,950`. */
export function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return Math.round(value).toLocaleString("en-NG");
}

/** Renders a comparison-matrix cell for the chosen metric format. */
export function formatCompareValue(
  value: number | null,
  format: CompactFormat
): string {
  if (value === null) return "—";
  switch (format) {
    case "naira":
      return formatNaira(value) ?? "—";
    case "compact":
      return formatPopulation(value) ?? "—";
    case "percent":
      return `${value.toFixed(1)}%`;
    case "int":
    case "count":
    default:
      return formatNumber(value);
  }
}

/** Signed percentage of `value` relative to `baseline`. */
export function formatVsMedian(
  value: number | null,
  baseline: number | null
): { text: string; tone: "up" | "down" | "flat" } {
  if (value === null || !baseline) return { text: "—", tone: "flat" };
  const delta = ((value - baseline) / baseline) * 100;
  if (Math.abs(delta) < 0.5) return { text: "at the median", tone: "flat" };
  const rounded = Math.round(Math.abs(delta));
  return delta > 0
    ? { text: `+${rounded}% vs median`, tone: "up" }
    : { text: `−${rounded}% vs median`, tone: "down" };
}
