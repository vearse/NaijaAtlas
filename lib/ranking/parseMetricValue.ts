/** Parse compare cell strings into numbers for ranking (— and empty → null). */
export function parseMetricValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s || s === "—" || s === "-" || s.toLowerCase() === "n/a") return null;
  const cleaned = s.replace(/,/g, "").replace(/%/g, "").replace(/₦/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatMetricDisplay(raw: unknown): string {
  if (raw === null || raw === undefined) return "—";
  const s = String(raw).trim();
  return s || "—";
}
