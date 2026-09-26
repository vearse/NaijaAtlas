import type { RankingLegendStep } from "@/lib/ranking/types";

const RAMP = [
  "#ecfdf5",
  "#a7f3d0",
  "#34d399",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
];

export function buildChoroplethScale(
  values: number[],
  steps = 6
): { breaks: number[]; colors: string[] } {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { breaks: [], colors: [] };
  }
  const n = Math.min(steps, sorted.length, RAMP.length);
  const breaks: number[] = [];
  for (let i = 1; i < n; i++) {
    const idx = Math.floor((i * sorted.length) / n) - 1;
    breaks.push(sorted[Math.max(0, idx)]);
  }
  const colors = RAMP.slice(RAMP.length - n);
  return { breaks, colors };
}

export function colorForValue(
  value: number,
  breaks: number[],
  colors: string[]
): string {
  if (colors.length === 0) return "#e2e8f0";
  let idx = 0;
  for (let i = 0; i < breaks.length; i++) {
    if (value > breaks[i]) idx = i + 1;
  }
  return colors[Math.min(idx, colors.length - 1)];
}

export function legendFromScale(
  breaks: number[],
  colors: string[],
  format: (n: number) => string
): RankingLegendStep[] {
  if (colors.length === 0) return [];
  const steps: RankingLegendStep[] = [];
  for (let i = 0; i < colors.length; i++) {
    const lo = i === 0 ? breaks[0] : breaks[i - 1];
    const hi = i < breaks.length ? breaks[i] : null;
    const label =
      hi == null
        ? `> ${format(lo)}`
        : i === 0
          ? `≤ ${format(hi)}`
          : `${format(lo)} – ${format(hi)}`;
    steps.push({ color: colors[i], label });
  }
  return steps;
}

export function formatLegendNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}
