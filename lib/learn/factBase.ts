/**
 * Compact, client-safe snapshot of the atlas used to generate quiz questions.
 * Every optional field is nullable/empty when the source has no value yet —
 * generators skip facts that are missing, so filling a field in `data/`
 * automatically unlocks the questions that depend on it.
 */

export type QuizCountryFacts = {
  officialName: string | null;
  capital: string | null;
  independence: string | null;
  currency: string | null;
  timezone: string | null;
  callingCode: string | null;
  /** Official LGA total from the LGA registry (may exceed mapped LGAs). */
  lgaTotal: number;
};

export type QuizZoneFacts = {
  id: string;
  name: string;
  color: string;
  stateIds: string[];
};

export type QuizStateFacts = {
  id: string;
  slug: string;
  name: string;
  zoneId: string;
  zoneName: string;
  capital: string | null;
  nickname: string | null;
  yearCreated: number | null;
  majorCities: string[];
  languages: string[];
  landAreaKm2: number | null;
  population: number | null;
  lgaCount: number;
  borderingStateIds: string[];
  hasCoastline: boolean | null;
  hasIntlBorder: boolean | null;
  largestLga: string | null;
  smallestLga: string | null;
  governor: string | null;
  governorParty: string | null;
};

export type QuizLgaFacts = {
  id: string;
  name: string;
  stateId: string;
  headquarters: string | null;
  yearCreated: number | null;
  nickname: string | null;
  majorTowns: string[];
  landmarks: string[];
  areaKm2: number | null;
  wardCount: number | null;
};

export type QuizFactBase = {
  country: QuizCountryFacts;
  zones: QuizZoneFacts[];
  states: QuizStateFacts[];
  lgas: QuizLgaFacts[];
};
