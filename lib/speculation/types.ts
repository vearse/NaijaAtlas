import type {
  PresidentialResultsBundle,
  RegisteredVotersBundle,
} from "@/types/politics";

export type PresidentialResultsByYear = Record<
  number,
  PresidentialResultsBundle
>;
export type RegisteredVotersByYear = Record<number, RegisteredVotersBundle>;

export type SpeculationShares = Record<string, number>;

export interface SpeculationStateInput {
  stateId: string;
  /** Turnout as a percentage, 1–100, stored to 0.1 precision. */
  turnout: number;
  /** Share of valid votes per selected party, stored to 0.1 precision. */
  shares: SpeculationShares;
}

export interface SpeculationScenario {
  /** Exactly five party abbreviations. */
  parties: string[];
  /** Only states the user has set are present. */
  states: Record<string, SpeculationStateInput>;
}

export interface StateOutcome {
  stateId: string;
  registeredVoters: number;
  turnout: number;
  totalVotes: number;
  sharesByParty: Record<string, number>;
  votesByParty: Record<string, number>;
  winner: string;
  runnerUp: string | null;
  winnerShare: number;
  runnerUpShare: number;
  marginPoints: number;
  /** True when the top two named parties poll exactly the same votes. */
  tie: boolean;
  tieParties: string[];
  /** Winner after applying the 2023 state result as tie-break. */
  tieBreakWinner: string | null;
}

export interface NationalActualBaseline {
  votesByParty: Record<string, number>;
  shareByParty: Record<string, number>;
  totalVotes: number;
  statesWonByParty: Record<string, string[]>;
}

export interface NationalAggregate {
  parties: string[];
  votesByParty: Record<string, number>;
  shareByParty: Record<string, number>;
  totalVotes: number;
  statesWonByParty: Record<string, string[]>;
  /** Outcomes for every state included in the projection. */
  outcomes: Record<string, StateOutcome>;
  /** Set states whose top two parties tied (map shows stripes). */
  tieStateIds: string[];
  setStateIds: string[];
  unsetStateIds: string[];
  leader: { party: string; share: number; marginPoints: number } | null;
  actual: NationalActualBaseline;
}
