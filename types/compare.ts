/** Person with optional party and portrait */
export interface ComparePerson {
  name: string;
  party?: string | null;
  imageUrl?: string | null;
  role?: string | null;
}

/** Field types supported by the compare table renderer */
export type CompareFieldType =
  | "text"
  | "number"
  | "person"
  | "personList"
  | "partySplit";

export type CompareHighlight = "max" | "min" | "none";

export interface CompareFieldDef {
  key: string;
  label: string;
  type: CompareFieldType;
  /** "computed" = derived from map data; "data" = from JSON bundle */
  source: "computed" | "data";
  highlight?: CompareHighlight;
  footnote?: string;
}

export interface ComparePeriodDef {
  id: string;
  label: string;
}

export interface CompareCategoryDef {
  id: string;
  label: string;
  temporal: boolean;
  defaultPeriod?: string;
  periods?: ComparePeriodDef[];
  /** Path template for temporal categories, e.g. "demographics/{period}.json" */
  dataPath?: string;
  /** Static data file when temporal is false */
  dataFile?: string;
  fields: CompareFieldDef[];
  sourceNote?: string;
}

export interface CompareManifest {
  stateCategories: CompareCategoryDef[];
  countryCategories: CompareCategoryDef[];
}

/** Per-location values in category data files */
export type CompareDataValue =
  | string
  | number
  | null
  | ComparePerson
  | ComparePerson[];

export type CompareLocationData = Record<string, CompareDataValue>;

export type CompareDataBundle = Record<string, CompareLocationData>;

export interface CompareBundle {
  manifest: CompareManifest;
  /** Static + loaded period files keyed by category id → period id → data */
  stateData: Record<string, Record<string, CompareDataBundle>>;
  countryData: Record<string, Record<string, CompareDataBundle>>;
}

/** Resolved row for rendering */
export interface CompareCellValue {
  display: string;
  person?: ComparePerson | null;
  persons?: ComparePerson[];
  numeric?: number | null;
}

export interface CompareRow {
  key: string;
  label: string;
  type: CompareFieldType;
  highlight: CompareHighlight;
  values: CompareCellValue[];
  footnote?: string;
}
