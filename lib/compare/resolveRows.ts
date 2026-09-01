import type { LgaLocation, StateLocation } from "@/types/location";
import type {
  CompareBundle,
  CompareCategoryDef,
  CompareCellValue,
  CompareDataBundle,
  CompareDataValue,
  CompareFieldDef,
  CompareHighlight,
  ComparePerson,
  CompareRow,
} from "@/types/compare";
import { getCategoryData } from "./compareUtils";

function isPerson(value: CompareDataValue): value is ComparePerson {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "name" in value
  );
}

function isPersonList(value: CompareDataValue): value is ComparePerson[] {
  return Array.isArray(value);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function emptyCell(): CompareCellValue {
  return { display: "—", numeric: null };
}

function computedValue(
  key: string,
  state: StateLocation,
  lgas: LgaLocation[]
): CompareDataValue {
  const wardTotal = lgas
    .filter((l) => l.parentId === state.id)
    .reduce((n, l) => n + l.wardCount, 0);

  switch (key) {
    case "region":
      return state.regionName;
    case "lgaCount":
      return state.lgaCount;
    case "wardTotal":
      return wardTotal;
    case "wardsPerLga":
      return state.lgaCount > 0 ? Math.round(wardTotal / state.lgaCount) : 0;
    default:
      return null;
  }
}

function resolveRawValue(
  field: CompareFieldDef,
  locationId: string,
  data: CompareDataBundle,
  state?: StateLocation,
  lgas?: LgaLocation[]
): CompareDataValue {
  if (field.source === "computed" && state && lgas) {
    return computedValue(field.key, state, lgas);
  }
  const row = data[locationId];
  if (!row) return null;
  return row[field.key] ?? null;
}

function toCell(
  value: CompareDataValue,
  field: CompareFieldDef
): CompareCellValue {
  if (value === null || value === undefined) return emptyCell();

  if (field.type === "person" && isPerson(value)) {
    const party = value.party ? ` (${value.party})` : "";
    return {
      display: `${value.name}${party}`,
      person: value,
      numeric: null,
    };
  }

  if (field.type === "personList" && isPersonList(value)) {
    if (value.length === 0) return emptyCell();
    return {
      display: value.map((p) => p.name).join(" · "),
      persons: value,
      numeric: null,
    };
  }

  if (field.type === "number" && typeof value === "number") {
    return { display: formatNumber(value), numeric: value };
  }

  if (typeof value === "string" || typeof value === "number") {
    const str = String(value);
    const numeric =
      field.type === "number" && typeof value === "number" ? value : null;
    return { display: str, numeric };
  }

  return emptyCell();
}

function parseNumericFromComputed(
  key: string,
  state: StateLocation,
  lgas: LgaLocation[]
): number | null {
  const raw = computedValue(key, state, lgas);
  if (typeof raw === "number") return raw;
  return null;
}

export function resolveStateCompareRows(
  bundle: CompareBundle,
  category: CompareCategoryDef,
  period: string,
  states: StateLocation[],
  lgas: LgaLocation[]
): CompareRow[] {
  const data = getCategoryData(bundle, "state", category.id, period);

  return category.fields.map((field) => {
    const values: CompareCellValue[] = states.map((state) => {
      const raw = resolveRawValue(field, state.id, data, state, lgas);
      const cell = toCell(raw, field);

      if (
        field.source === "computed" &&
        field.highlight &&
        field.highlight !== "none"
      ) {
        const num = parseNumericFromComputed(field.key, state, lgas);
        if (num !== null) cell.numeric = num;
      }

      return cell;
    });

    return {
      key: field.key,
      label: field.label,
      type: field.type,
      highlight: field.highlight ?? "none",
      values,
      footnote: field.footnote,
    };
  });
}

export function resolveCountryRows(
  bundle: CompareBundle,
  category: CompareCategoryDef,
  period: string,
  countryId = "NG"
): CompareRow[] {
  const data = getCategoryData(bundle, "country", category.id, period);
  const row = data[countryId] ?? {};

  return category.fields.map((field) => {
    const raw = row[field.key] ?? null;
    const cell = toCell(raw, field);
    return {
      key: field.key,
      label: field.label,
      type: field.type,
      highlight: field.highlight ?? "none",
      values: [cell],
      footnote: field.footnote,
    };
  });
}

export function highlightIndices(row: CompareRow): Set<number> {
  const nums = row.values
    .map((v, i) => (v.numeric != null ? { v: v.numeric, i } : null))
    .filter(Boolean) as { v: number; i: number }[];

  if (nums.length < 2 || row.highlight === "none") return new Set();

  const target =
    row.highlight === "min"
      ? Math.min(...nums.map((n) => n.v))
      : Math.max(...nums.map((n) => n.v));

  const min = Math.min(...nums.map((n) => n.v));
  const max = Math.max(...nums.map((n) => n.v));
  if (min === max) return new Set();

  return new Set(nums.filter((n) => n.v === target).map((n) => n.i));
}

export type { CompareHighlight };
