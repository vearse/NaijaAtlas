const SCALE = [
  { threshold: 1e12, label: "Trillion" },
  { threshold: 1e9, label: "Billion" },
  { threshold: 1e6, label: "Million" },
  { threshold: 1e3, label: "Thousand" },
] as const;

function trimMantissa(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Compact human-readable numbers for rankings (e.g. 17_000_000 → "17 Million").
 */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  for (const { threshold, label } of SCALE) {
    if (abs >= threshold) {
      return `${sign}${trimMantissa(abs / threshold)} ${label}`;
    }
  }
  if (Number.isInteger(value)) return String(value);
  return trimMantissa(value);
}
