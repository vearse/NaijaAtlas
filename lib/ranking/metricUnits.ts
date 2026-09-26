import { formatLegendNumber } from "@/lib/ranking/choroplethScale";

/**
 * Display unit for a ranking metric.
 *
 * `prefix` units are prepended (naira sign); `suffix` units are appended
 * (percent, per-1,000 rates). Source values are stored unitless, so the unit
 * is applied only at render time.
 */
export interface MetricUnit {
  kind: "prefix" | "suffix" | "none";
  token: string;
}

export const NAIRA: MetricUnit = { kind: "prefix", token: "₦" };
export const PERCENT: MetricUnit = { kind: "suffix", token: "%" };
export const PER_THOUSAND: MetricUnit = { kind: "suffix", token: " per 1,000" };
export const COUNT: MetricUnit = { kind: "none", token: "" };

/** Exact field keys → unit. Anything unlisted falls back to inference. */
const FIELD_UNITS: Record<string, MetricUnit> = {
  // Economy — naira amounts
  igr: NAIRA,
  igrPerCapita: NAIRA,
  faacAllocation: NAIRA,
  totalRevenue: NAIRA,
  vatAllocation: NAIRA,
  faacPerCapita: NAIRA,
  stateGdp: NAIRA,
  stateGdpPerCapita: NAIRA,
  debtStock: NAIRA,
  capitalExpenditure: NAIRA,
  recurrentExpenditure: NAIRA,

  // Economy — shares and rates
  igrShareOfRevenue: PERCENT,
  dependencyOnFaac: PERCENT,
  unemploymentRate: PERCENT,
  underemploymentRate: PERCENT,
  povertyRate: PERCENT,
  multidimensionalPoverty: PERCENT,

  // Social — coverage rates
  literacyRate: PERCENT,
  primaryEnrollment: PERCENT,
  secondaryEnrollment: PERCENT,
  electricityAccess: PERCENT,
  improvedWaterAccess: PERCENT,
  internetPenetration: PERCENT,
  mobilePenetration: PERCENT,
  outOfSchoolChildren: PERCENT,
  netAttendancePrimary: PERCENT,
  netAttendanceSecondary: PERCENT,
  sanitationAccess: PERCENT,
  stuntingPrevalence: PERCENT,
  contraceptivePrevalence: PERCENT,

  // Social — mortality per 1,000 live births
  infantMortality: PER_THOUSAND,
  under5Mortality: PER_THOUSAND,
  maternalMortality: PER_THOUSAND,
};

const NAIRA_KEY_PATTERN =
  /^(igr|faac|vat|stateGdp|debt|capital|recurrent|totalRevenue)/;
const PERCENT_KEY_PATTERN =
  /(Rate|Poverty|Prevalence|Penetration|Enrollment|Access|Attendance|ShareOf)/;

/** Best-effort unit for a field key, using the label as a secondary hint. */
export function unitForField(fieldKey: string, label?: string): MetricUnit {
  const exact = FIELD_UNITS[fieldKey];
  if (exact) return exact;
  if (label?.includes("(%)")) return PERCENT;
  if (NAIRA_KEY_PATTERN.test(fieldKey)) return NAIRA;
  if (fieldKey.includes("Mortality")) return PER_THOUSAND;
  if (PERCENT_KEY_PATTERN.test(fieldKey)) return PERCENT;
  return COUNT;
}

const LEADING_SYMBOL = /^\s*[₦$€£¥]\s*/;
const TRAILING_SYMBOL = /\s*(%|(?:per\s*1,?000)|per\s*capita)\s*$/i;

/** Source placeholders that must never receive a unit ("—", "-", "n/a", ""). */
const PLACEHOLDER = /^(?:[—–-]|n\/a|na|null)?$/i;

/** True when a raw source value carries no real measurement. */
export function isPlaceholder(text: string): boolean {
  return PLACEHOLDER.test(text.trim());
}

/**
 * Remove any unit already present in a source string, so applying a unit can
 * never double up ("₦4.2B%").
 */
export function stripUnit(text: string): string {
  return text.replace(LEADING_SYMBOL, "").replace(TRAILING_SYMBOL, "").trim();
}

/** Prepend or append `unit` to an already-formatted value string. */
export function withUnit(text: string, unit: MetricUnit): string {
  if (isPlaceholder(text)) return text.trim() || "—";
  const bare = stripUnit(text);
  if (!bare || unit.kind === "none") return bare;
  return unit.kind === "prefix" ? `${unit.token}${bare}` : `${bare}${unit.token}`;
}

/**
 * Compact a number (K/M/B/T) and attach the unit — used for legend steps so
 * the swatch labels read "₦4.2B" rather than a bare "4.2B".
 */
export function formatMetricNumber(value: number, unit: MetricUnit): string {
  return withUnit(formatLegendNumber(value), unit);
}
