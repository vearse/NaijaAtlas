import assert from "node:assert/strict";
import test from "node:test";
import type {
  PresidentialResultsBundle,
  RegisteredVotersBundle,
} from "@/types/politics";
import {
  aggregateNational,
  computeDefaultTurnout,
  computeStateOutcome,
  prefillSharesFrom2023,
  sumShares,
  validateShares,
} from "./calc";
import {
  isLockedSpeculationParty,
  LOCKED_COALITION_SHARE,
  SCENARIO_SHARE_TOTAL,
} from "./constants";
import { realisticScenarioShares, randomSpeculationShares } from "./random";
import { decodeScenario, encodeScenario } from "./codec";
import type {
  PresidentialResultsByYear,
  RegisteredVotersByYear,
  SpeculationScenario,
} from "./types";

function resultsBundle(
  year: number,
  rows: { stateId: string; votes: Record<string, number>; validVotes: number }[]
): PresidentialResultsBundle {
  return {
    election: {
      year,
      date: `${year}-02-25`,
      office: "president",
      declaredBy: "INEC",
      sourceUrl: "https://example.com",
    },
    candidates: [
      { party: "APC", name: "A", color: "#126638" },
      { party: "PDP", name: "B", color: "#C1272D" },
      { party: "LP", name: "C", color: "#2E5DAC" },
      { party: "NNPP", name: "D", color: "#D97706" },
    ],
    national: {
      validVotes: rows.reduce((sum, row) => sum + row.validVotes, 0),
      byParty: {
        APC: rows.reduce((sum, row) => sum + (row.votes.APC ?? 0), 0),
        PDP: rows.reduce((sum, row) => sum + (row.votes.PDP ?? 0), 0),
        LP: rows.reduce((sum, row) => sum + (row.votes.LP ?? 0), 0),
        NNPP: rows.reduce((sum, row) => sum + (row.votes.NNPP ?? 0), 0),
        others: rows.reduce((sum, row) => sum + (row.votes.others ?? 0), 0),
      },
      winner: "APC",
    },
    states: rows.map((row) => ({ ...row })),
  };
}

function registered(year: number, states: Record<string, number>): RegisteredVotersBundle {
  return {
    election: {
      year,
      source: "INEC",
      sourceUrl: "https://example.com",
      totalRegisteredVoters: Object.values(states).reduce((a, b) => a + b, 0),
    },
    states,
  };
}

const results2023 = resultsBundle(2023, [
  {
    stateId: "NG-AB",
    votes: { APC: 40, PDP: 30, LP: 20, NNPP: 10, others: 0 },
    validVotes: 100,
  },
  {
    stateId: "NG-AD",
    votes: { APC: 10, PDP: 40, LP: 40, NNPP: 10, others: 0 },
    validVotes: 100,
  },
]);

const resultsByYear: PresidentialResultsByYear = {
  2023: results2023,
  2019: resultsBundle(2019, [
    {
      stateId: "NG-AB",
      votes: { APC: 50, PDP: 50, others: 0 },
      validVotes: 200,
    },
  ]),
  2015: resultsBundle(2015, [
    {
      stateId: "NG-AB",
      votes: { APC: 60, PDP: 40, others: 0 },
      validVotes: 300,
    },
  ]),
};

const registeredByYear: RegisteredVotersByYear = {
  2023: registered(2023, { "NG-AB": 1000, "NG-AD": 1000 }),
  2019: registered(2019, { "NG-AB": 1000 }),
  2015: registered(2015, { "NG-AB": 1000 }),
};

const parties = ["APC", "PDP", "NDC", "NNPP", "APGA", "ADC"];

test("random party shares stay within 100%", () => {
  for (let i = 0; i < 20; i += 1) {
    const shares = randomSpeculationShares(parties);
    const validation = validateShares(shares);
    assert.equal(validation.ok, true);
    assert.ok(validation.sum <= 100);
  }
});

test("realistic splits put most votes on scenario parties", () => {
  const lineup = ["AAC", "ADC", "APC", "APM", "NDC", "PDP"];
  for (let i = 0; i < 30; i += 1) {
    const shares = realisticScenarioShares(lineup);
    const validation = validateShares(shares);
    assert.equal(validation.ok, true);
    const total = sumShares(shares);
    assert.ok(
      total >= SCENARIO_SHARE_TOTAL,
      `expected at least ${SCENARIO_SHARE_TOTAL}%, got ${total}%`
    );
    const lockedTotal = lineup
      .filter(isLockedSpeculationParty)
      .reduce((sum, party) => sum + (shares[party] ?? 0), 0);
    assert.ok(
      lockedTotal >= LOCKED_COALITION_SHARE,
      `expected locked at least ${LOCKED_COALITION_SHARE}%, got ${lockedTotal}%`
    );
  }
});

test("NDC inherits LP vote totals from 2023", () => {
  const ndcParties = ["APC", "PDP", "NDC", "NNPP", "APGA", "ADC"];
  const row = {
    stateId: "NG-AB",
    votes: { APC: 30, PDP: 20, LP: 40, NNPP: 5, others: 5 },
    validVotes: 100,
  } as const;
  const shares = prefillSharesFrom2023(
    { ...row, name: "Abia", percentOnly: false },
    ndcParties
  );
  assert.equal(shares.NDC, 40);
});

test("turnout default averages the two most recent elections", () => {
  // 2023: 100/1000 = 10%; 2019: 200/1000 = 20%; average = 15%.
  assert.equal(computeDefaultTurnout("NG-AB", resultsByYear, registeredByYear), 15);
});

test("turnout default returns null without registered-voter history", () => {
  assert.equal(
    computeDefaultTurnout("NG-ZA", resultsByYear, registeredByYear),
    null
  );
});

test("share validation computes the Others remainder", () => {
  const valid = validateShares({
    APC: 40,
    PDP: 30,
    LP: 20,
    NNPP: 5,
    APGA: 2,
    ADC: 0,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.sum, 97);
  assert.equal(valid.others, 3);

  const invalid = validateShares({
    APC: 60,
    PDP: 30,
    LP: 20,
    NNPP: 0,
    APGA: 0,
    ADC: 0,
  });
  assert.equal(invalid.ok, false);
  assert.match(invalid.error ?? "", /add up to 110%/);
});

test("state winner uses plurality among the named parties", () => {
  const outcome = computeStateOutcome({
    stateId: "NG-AB",
    registeredVoters: 1000,
    turnout: 50,
    shares: { APC: 40, PDP: 35, NDC: 15, NNPP: 5, APGA: 0, ADC: 0 },
    parties,
  });
  assert.equal(outcome.totalVotes, 500);
  assert.equal(outcome.votesByParty.APC, 200);
  assert.equal(outcome.votesByParty.others, 25);
  assert.equal(outcome.winner, "APC");
  assert.equal(outcome.marginPoints, 5);
  assert.equal(outcome.tie, false);
});

test("exact ties are flagged and broken by the 2023 state result", () => {
  const outcome = computeStateOutcome({
    stateId: "NG-AD",
    registeredVoters: 1000,
    turnout: 100,
    shares: { APC: 40, PDP: 40, NDC: 10, NNPP: 10, APGA: 0, ADC: 0 },
    parties,
    actual2023: results2023.states[1],
  });
  assert.equal(outcome.tie, true);
  assert.deepEqual(outcome.tieParties, ["APC", "PDP"]);
  // 2023 AD: PDP 40 vs APC 10, so PDP wins the tie-break.
  assert.equal(outcome.tieBreakWinner, "PDP");
  assert.equal(outcome.winner, "PDP");
});

test("2023 prefill assigns the remainder to Others", () => {
  const shares = prefillSharesFrom2023(results2023.states[0], parties);
  assert.deepEqual(shares, {
    APC: 40,
    PDP: 30,
    NDC: 20,
    NNPP: 10,
    APGA: 0,
    ADC: 0,
  });
  const others = Number((100 - Object.values(shares).reduce((a, b) => a + b, 0)).toFixed(1));
  assert.equal(others, 0);
});

test("national aggregation can use 2023 for unset states or leave them out", () => {
  const scenario: SpeculationScenario = {
    parties,
    states: {
      "NG-AB": {
        stateId: "NG-AB",
        turnout: 50,
        shares: { APC: 50, PDP: 25, NDC: 25, NNPP: 0, APGA: 0, ADC: 0 },
      },
    },
  };
  const with2023 = aggregateNational({
    scenario,
    results2023,
    registeredVotersByYear: registeredByYear,
    use2023ForUnset: true,
  });
  // Set AB: 500 votes (250 APC, 125 PDP, 125 LP). Unset AD adds 2023: 10 APC,
  // 40 PDP, 40 LP, 10 NNPP.
  assert.equal(with2023.totalVotes, 600);
  assert.equal(with2023.votesByParty.APC, 260);
  assert.equal(with2023.votesByParty.PDP, 165);
  assert.equal(with2023.votesByParty.NDC, 165);
  assert.equal(with2023.votesByParty.NNPP, 10);
  assert.deepEqual(with2023.statesWonByParty.APC, ["NG-AB"]);
  assert.deepEqual(with2023.statesWonByParty.PDP, ["NG-AD"]);

  const without2023 = aggregateNational({
    scenario,
    results2023,
    registeredVotersByYear: registeredByYear,
    use2023ForUnset: false,
  });
  assert.equal(without2023.totalVotes, 500);
  assert.equal(without2023.votesByParty.APC, 250);
  assert.deepEqual(without2023.unsetStateIds, ["NG-AD"]);
});

test("2023 fallback re-projects shares on the latest register", () => {
  const results = {
    ...resultsByYear,
    2019: resultsBundle(2019, [
      {
        stateId: "NG-AB",
        votes: { APC: 100, PDP: 100, others: 0 },
        validVotes: 200,
      },
      {
        stateId: "NG-AD",
        votes: { APC: 100, PDP: 200, LP: 200, others: 0 },
        validVotes: 500,
      },
    ]),
  };
  const registeredVoters = {
    ...registeredByYear,
    2019: registered(2019, { "NG-AB": 1000, "NG-AD": 1000 }),
  };
  const aggregate = aggregateNational({
    scenario: { parties, states: {} },
    results2023,
    resultsByYear: results,
    registeredVotersByYear: registeredVoters,
    use2023ForUnset: true,
  });
  // AB default turnout = (10% + 20%) / 2 = 15% → 150 votes.
  // AD default turnout = (10% + 50%) / 2 = 30% → 300 votes.
  assert.equal(aggregate.totalVotes, 450);
  assert.equal(aggregate.outcomes["NG-AD"].totalVotes, 300);
  assert.equal(aggregate.votesByParty.PDP, 45 + 120);
});

test("URL encode/decode round-trips the scenario", () => {
  const scenario: SpeculationScenario = {
    parties,
    states: {
      "NG-AB": {
        stateId: "NG-AB",
        turnout: 43.2,
        shares: {
          APC: 41.1,
          PDP: 30.2,
          NDC: 18.3,
          NNPP: 5.4,
          APGA: 2.5,
          ADC: 0,
        },
      },
      "NG-AD": {
        stateId: "NG-AD",
        turnout: 31.5,
        shares: { APC: 10, PDP: 40, NDC: 40, NNPP: 10, APGA: 0, ADC: 0 },
      },
    },
  };
  const encoded = encodeScenario(scenario, false);
  assert.doesNotMatch(encoded, /[+/=]/);
  const decoded = decodeScenario(encoded, parties);
  assert.ok(decoded);
  assert.deepEqual(decoded?.scenario, scenario);
  assert.equal(decoded?.use2023ForUnset, false);
});
