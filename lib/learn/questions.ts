import type {
  QuizFactBase,
  QuizLgaFacts,
  QuizStateFacts,
  QuizZoneFacts,
} from "@/lib/learn/factBase";
import { pick, shuffle, type Rng } from "@/lib/learn/rng";

export type QuizTopic = "nigeria" | "state" | "lga";
export type QuizQuestionKind = "choice" | "map-state" | "map-lga";
export type QuizDifficulty = "easy" | "standard" | "hard";

export type QuizOption = { id: string; label: string; sub?: string };

export type QuizQuestion = {
  /** `generatorId:subjectId` — unique within a session. */
  key: string;
  generatorId: string;
  topic: QuizTopic;
  kind: QuizQuestionKind;
  prompt: string;
  /** Answer choices; empty for map questions where the map is the input. */
  options: QuizOption[];
  answerId: string;
  answerLabel: string;
  /** Clue revealed by the Hint helper. */
  hint: string;
  /** Fact card shown after answering. */
  explanation: string;
  learnMoreHref?: string;
  /** State outlined on the country map while the question is shown. */
  spotlightStateId?: string;
  /** State whose LGA map is the input for `map-lga` questions. */
  mapStateId?: string;
  /** Zone the Hint helper glows on map questions. */
  hintZoneId?: string;
};

export type QuizIndex = {
  fb: QuizFactBase;
  stateById: Map<string, QuizStateFacts>;
  zoneById: Map<string, QuizZoneFacts>;
  lgasByState: Map<string, QuizLgaFacts[]>;
  lgaNameCount: Map<string, number>;
};

type Ctx = { rng: Rng; difficulty: QuizDifficulty; ix: QuizIndex };

export type QuestionGenerator = {
  id: string;
  label: string;
  topic: QuizTopic;
  kind: QuizQuestionKind;
  /** Fact ids this generator can ask about. Grows automatically with the data. */
  subjects: (ix: QuizIndex) => string[];
  build: (subjectId: string, ctx: Ctx) => Omit<QuizQuestion, "key" | "generatorId" | "topic" | "kind"> | null;
};

/* ------------------------------------------------------------------ */
/* Index + shared helpers                                             */
/* ------------------------------------------------------------------ */

export function buildQuizIndex(fb: QuizFactBase): QuizIndex {
  const lgasByState = new Map<string, QuizLgaFacts[]>();
  const lgaNameCount = new Map<string, number>();
  for (const l of fb.lgas) {
    if (!lgasByState.has(l.stateId)) lgasByState.set(l.stateId, []);
    lgasByState.get(l.stateId)!.push(l);
    const k = l.name.toLowerCase();
    lgaNameCount.set(k, (lgaNameCount.get(k) ?? 0) + 1);
  }
  return {
    fb,
    stateById: new Map(fb.states.map((s) => [s.id, s])),
    zoneById: new Map(fb.zones.map((z) => [z.id, z])),
    lgasByState,
    lgaNameCount,
  };
}

const fmt = new Intl.NumberFormat("en-NG");

function stateLabel(s: QuizStateFacts): string {
  return s.id === "NG-FC" ? "FCT (Abuja)" : s.name;
}

function stateHref(s: QuizStateFacts): string {
  return `/places/${s.slug}`;
}

function lgaHref(l: QuizLgaFacts): string {
  return `/places/map?states=${l.stateId}&lgas=1&lga=${l.id}`;
}

function stateBlurb(s: QuizStateFacts): string {
  const parts = [`${stateLabel(s)} is in the ${s.zoneName} zone`];
  if (s.capital) parts.push(`its capital is ${s.capital}`);
  parts.push(`it has ${s.lgaCount} LGAs`);
  let out = parts.join(", ") + ".";
  if (s.nickname) out += ` Nickname: “${s.nickname}”.`;
  if (s.yearCreated) out += ` Created in ${s.yearCreated}.`;
  return out;
}

function lgaBlurb(l: QuizLgaFacts, s: QuizStateFacts | undefined): string {
  let out = `${l.name} is a Local Government Area in ${s ? stateLabel(s) : "Nigeria"}`;
  if (l.headquarters) out += `, headquartered at ${l.headquarters}`;
  out += ".";
  if (l.areaKm2) out += ` It covers about ${fmt.format(Math.round(l.areaKm2))} km².`;
  if (l.majorTowns.length) out += ` Towns include ${l.majorTowns.slice(0, 3).join(", ")}.`;
  return out;
}

/**
 * Picks `n` distinct distractors. On hard difficulty, "near" candidates
 * (same zone, neighbouring state…) are tried first so choices are tricky.
 */
function distractors<T>(
  ctx: Ctx,
  pool: T[],
  key: (t: T) => string,
  exclude: string[],
  n = 3,
  near?: (t: T) => boolean
): T[] {
  const seen = new Set(exclude.map((e) => e.toLowerCase()));
  const take = (items: T[], out: T[]) => {
    for (const t of shuffle(ctx.rng, items)) {
      if (out.length >= n) break;
      const k = key(t).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
  };
  const out: T[] = [];
  if (near && ctx.difficulty !== "easy") {
    take(pool.filter(near), out);
    if (ctx.difficulty === "standard") out.splice(Math.ceil(n / 2));
    out.forEach((t) => seen.add(key(t).toLowerCase()));
  }
  take(pool, out);
  return out;
}

function textOptions(ctx: Ctx, answer: string, wrong: string[], sub?: (v: string) => string | undefined): QuizOption[] {
  return shuffle(ctx.rng, [answer, ...wrong]).map((v) => ({ id: v, label: v, sub: sub?.(v) }));
}

function stateOptions(ctx: Ctx, answer: QuizStateFacts, wrong: QuizStateFacts[], showZone = true): QuizOption[] {
  return shuffle(ctx.rng, [answer, ...wrong]).map((s) => ({
    id: s.id,
    label: stateLabel(s),
    sub: showZone ? s.zoneName : undefined,
  }));
}

function numberOptions(ctx: Ctx, answer: number, spread: number, min = 1): QuizOption[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 60) {
    const delta = Math.max(1, Math.round((ctx.rng() * 2 - 1) * spread));
    const v = answer + delta;
    if (v >= min) set.add(v);
  }
  return shuffle(ctx.rng, [...set]).map((v) => ({ id: String(v), label: fmt.format(v) }));
}

const isNear = (a: QuizStateFacts) => (b: QuizStateFacts) =>
  b.zoneId === a.zoneId || a.borderingStateIds.includes(b.id);

function realStates(ix: QuizIndex) {
  return ix.fb.states;
}

/* ------------------------------------------------------------------ */
/* Generators                                                         */
/* ------------------------------------------------------------------ */

const NIGERIA: QuestionGenerator[] = [
  {
    id: "ng-capital",
    label: "National capital",
    topic: "nigeria",
    kind: "choice",
    subjects: (ix) => (ix.fb.country.capital ? ["NG"] : []),
    build: (_id, ctx) => {
      const cap = ctx.ix.fb.country.capital!;
      const wrong = distractors(
        ctx,
        [...ctx.ix.fb.states.flatMap((s) => s.majorCities.slice(0, 1)), ...ctx.ix.fb.states.map((s) => s.capital ?? "")].filter(Boolean),
        (v) => v,
        [cap]
      );
      return {
        prompt: "What is the capital city of Nigeria?",
        options: textOptions(ctx, cap, wrong),
        answerId: cap,
        answerLabel: cap,
        hint: "It replaced Lagos as the capital in 1991 and sits in the centre of the country.",
        explanation: `${cap} has been Nigeria's capital since 1991, inside the Federal Capital Territory.`,
        learnMoreHref: "/places/fct",
      };
    },
  },
  {
    id: "ng-independence",
    label: "Independence",
    topic: "nigeria",
    kind: "choice",
    subjects: (ix) => (ix.fb.country.independence?.match(/\d{4}/) ? ["NG"] : []),
    build: (_id, ctx) => {
      const indep = ctx.ix.fb.country.independence!;
      const y = Number(indep.match(/\d{4}/)![0]);
      const options = numberOptions(ctx, y, 6, 1900).map((o) => ({ ...o, label: o.id }));
      return {
        prompt: "In what year did Nigeria gain independence?",
        options,
        answerId: String(y),
        answerLabel: String(y),
        hint: `It was on ${indep.replace(/\s*\d{4}/, "")}.`,
        explanation: `Nigeria became independent on ${indep}.`,
      };
    },
  },
  {
    id: "ng-state-count",
    label: "How many states",
    topic: "nigeria",
    kind: "choice",
    subjects: (ix) => (ix.fb.states.length ? ["NG"] : []),
    build: (_id, ctx) => {
      const n = ctx.ix.fb.states.filter((s) => s.id !== "NG-FC").length;
      return {
        prompt: "How many states make up Nigeria (not counting the FCT)?",
        options: numberOptions(ctx, n, 6),
        answerId: String(n),
        answerLabel: String(n),
        hint: "Add the FCT and you get one more than this number.",
        explanation: `Nigeria has ${n} states plus the Federal Capital Territory, grouped into ${ctx.ix.fb.zones.length} geopolitical zones.`,
      };
    },
  },
  {
    id: "ng-lga-count",
    label: "How many LGAs",
    topic: "nigeria",
    kind: "choice",
    subjects: (ix) => (ix.fb.country.lgaTotal ? ["NG"] : []),
    build: (_id, ctx) => {
      const n = ctx.ix.fb.country.lgaTotal;
      return {
        prompt: "How many Local Government Areas does Nigeria have?",
        options: numberOptions(ctx, n, 60, 100),
        answerId: String(n),
        answerLabel: String(n),
        hint: "It's between 700 and 800.",
        explanation: `Nigeria is divided into ${n} LGAs across its states and the FCT.`,
      };
    },
  },
  {
    id: "zone-state-count",
    label: "States per zone",
    topic: "nigeria",
    kind: "choice",
    subjects: (ix) => ix.fb.zones.map((z) => z.id),
    build: (id, ctx) => {
      const z = ctx.ix.zoneById.get(id);
      if (!z) return null;
      const n = z.stateIds.length;
      const names = z.stateIds.map((sid) => ctx.ix.stateById.get(sid)?.name).filter(Boolean);
      return {
        prompt: `How many states (including FCT where applicable) are in the ${z.name} zone?`,
        options: numberOptions(ctx, n, 3, 2),
        answerId: String(n),
        answerLabel: String(n),
        hint: `${names[0]} is one of them.`,
        explanation: `${z.name}: ${names.join(", ")}.`,
      };
    },
  },
  {
    id: "ng-extremes",
    label: "Biggest & smallest",
    topic: "nigeria",
    kind: "choice",
    subjects: (ix) => {
      const out: string[] = [];
      if (ix.fb.states.filter((s) => s.landAreaKm2).length >= 4) out.push("area-max", "area-min");
      if (ix.fb.states.filter((s) => s.population).length >= 4) out.push("pop-max", "pop-min");
      return out;
    },
    build: (id, ctx) => {
      const byArea = id.startsWith("area");
      const max = id.endsWith("max");
      const val = (s: QuizStateFacts) => (byArea ? s.landAreaKm2 : s.population) ?? null;
      const ranked = ctx.ix.fb.states.filter((s) => val(s) !== null).sort((a, b) => val(b)! - val(a)!);
      const answer = max ? ranked[0] : ranked[ranked.length - 1];
      const wrong = distractors(ctx, ranked, (s) => s.id, [answer.id], 3, (s) => {
        const i = ranked.indexOf(s);
        return max ? i < 8 : i > ranked.length - 9;
      });
      const what = byArea ? "land area" : "population";
      const v = val(answer)!;
      return {
        prompt: `Which state has the ${max ? "largest" : "smallest"} ${what} in Nigeria?`,
        options: stateOptions(ctx, answer, wrong),
        answerId: answer.id,
        answerLabel: stateLabel(answer),
        hint: `It's in the ${answer.zoneName} zone.`,
        explanation: `${stateLabel(answer)} — ${byArea ? `${fmt.format(v)} km²` : `about ${fmt.format(v)} people`}. ${stateBlurb(answer)}`,
        learnMoreHref: stateHref(answer),
        spotlightStateId: answer.id,
      };
    },
  },
];

const STATE: QuestionGenerator[] = [
  {
    id: "state-capital",
    label: "State capitals",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.capital).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const pool = ctx.ix.fb.states.filter((o) => o.capital);
      const wrong = distractors(ctx, pool, (o) => o.capital!, [s.capital!], 3, isNear(s)).map((o) => o.capital!);
      return {
        prompt: `What is the capital of ${stateLabel(s)}?`,
        options: textOptions(ctx, s.capital!, wrong),
        answerId: s.capital!,
        answerLabel: s.capital!,
        hint: `It starts with “${s.capital!.slice(0, 2)}…”.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "capital-state",
    label: "Capital → state",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.capital && s.capital !== s.name).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const wrong = distractors(ctx, ctx.ix.fb.states, (o) => o.id, [s.id], 3, isNear(s));
      return {
        prompt: `${s.capital} is the capital of which state?`,
        options: stateOptions(ctx, s, wrong, false),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `It's in the ${s.zoneName} zone.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-zone",
    label: "Geopolitical zones",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const wrong = distractors(ctx, ctx.ix.fb.zones, (z) => z.id, [s.zoneId], 3, (z) =>
        z.name.split(" ")[0] === s.zoneName.split(" ")[0]
      );
      const zones = shuffle(ctx.rng, [ctx.ix.zoneById.get(s.zoneId)!, ...wrong]);
      return {
        prompt: `Which geopolitical zone is ${stateLabel(s)} in?`,
        options: zones.map((z) => ({ id: z.id, label: z.name })),
        answerId: s.zoneId,
        answerLabel: s.zoneName,
        hint: s.borderingStateIds.length
          ? `It borders ${s.borderingStateIds.slice(0, 2).map((b) => ctx.ix.stateById.get(b)?.name).join(" and ")}.`
          : `Its capital is ${s.capital ?? "—"}.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "state-nickname",
    label: "State slogans",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.nickname).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const wrong = distractors(ctx, ctx.ix.fb.states, (o) => o.id, [s.id], 3, isNear(s));
      return {
        prompt: `Which state is known as “${s.nickname}”?`,
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: s.capital ? `Its capital is ${s.capital}.` : `It's in the ${s.zoneName} zone.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-created",
    label: "Year created",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.yearCreated).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const years = [...new Set(ctx.ix.fb.states.map((o) => o.yearCreated).filter((y): y is number => !!y))];
      const ans = String(s.yearCreated);
      const wrong = distractors(ctx, years.map(String), (v) => v, [ans]);
      if (wrong.length < 3) return null;
      const peers = ctx.ix.fb.states.filter((o) => o.yearCreated === s.yearCreated && o.id !== s.id).map((o) => o.name);
      return {
        prompt: `In what year was ${stateLabel(s)} created?`,
        options: textOptions(ctx, ans, wrong),
        answerId: ans,
        answerLabel: ans,
        hint: peers.length ? `${peers[0]} was created the same year.` : "It was created on its own, not in a batch.",
        explanation: `${stateLabel(s)} was created in ${ans}${peers.length ? ` alongside ${peers.slice(0, 4).join(", ")}` : ""}.`,
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "state-border",
    label: "Neighbours",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.borderingStateIds.length).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const answer = ctx.ix.stateById.get(pick(ctx.rng, s.borderingStateIds));
      if (!answer) return null;
      const pool = ctx.ix.fb.states.filter((o) => o.id !== s.id && !s.borderingStateIds.includes(o.id));
      const wrong = distractors(ctx, pool, (o) => o.id, [answer.id], 3, (o) => o.zoneId === s.zoneId);
      const all = s.borderingStateIds.map((b) => ctx.ix.stateById.get(b)?.name).filter(Boolean);
      return {
        prompt: `Which of these states shares a border with ${stateLabel(s)}?`,
        options: stateOptions(ctx, answer, wrong),
        answerId: answer.id,
        answerLabel: stateLabel(answer),
        hint: `${stateLabel(s)} has ${all.length} neighbouring state${all.length === 1 ? "" : "s"}.`,
        explanation: `${stateLabel(s)} borders ${all.join(", ")}.`,
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "state-coast",
    label: "Coastal states",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.hasCoastline).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const pool = ctx.ix.fb.states.filter((o) => o.hasCoastline === false);
      const wrong = distractors(ctx, pool, (o) => o.id, [s.id], 3, (o) => o.zoneId.startsWith("NG-S"));
      const coastal = ctx.ix.fb.states.filter((o) => o.hasCoastline).map((o) => o.name);
      return {
        prompt: "Which of these states has an Atlantic coastline?",
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: "Think south — along the Bight of Benin and Bight of Bonny.",
        explanation: `${coastal.length} states touch the sea: ${coastal.join(", ")}.`,
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-intl-border",
    label: "Frontier states",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.hasIntlBorder).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const pool = ctx.ix.fb.states.filter((o) => o.hasIntlBorder === false);
      const wrong = distractors(ctx, pool, (o) => o.id, [s.id], 3, (o) => o.zoneId === s.zoneId);
      return {
        prompt: "Which of these states shares a border with another country?",
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: "Nigeria's neighbours are Benin, Niger, Chad and Cameroon.",
        explanation: `${stateLabel(s)} sits on Nigeria's international frontier. ${stateBlurb(s)}`,
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "state-lga-count",
    label: "LGAs per state",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.lgaCount > 0).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      return {
        prompt: `How many LGAs does ${stateLabel(s)} have?`,
        options: numberOptions(ctx, s.lgaCount, Math.max(3, Math.round(s.lgaCount * 0.3))),
        answerId: String(s.lgaCount),
        answerLabel: String(s.lgaCount),
        hint: s.lgaCount >= 25 ? "It's one of the states with 25 or more." : "It has fewer than 25.",
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "state-largest-lga",
    label: "Largest LGA",
    topic: "state",
    kind: "choice",
    subjects: (ix) =>
      realStates(ix)
        .filter((s) => s.largestLga && (ix.lgasByState.get(s.id)?.length ?? 0) >= 4)
        .map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const wrong = distractors(ctx, ctx.ix.lgasByState.get(s.id) ?? [], (l) => l.name, [s.largestLga!]).map((l) => l.name);
      if (wrong.length < 3) return null;
      return {
        prompt: `Which is the largest LGA by land area in ${stateLabel(s)}?`,
        options: textOptions(ctx, s.largestLga!, wrong),
        answerId: s.largestLga!,
        answerLabel: s.largestLga!,
        hint: s.smallestLga ? `It's definitely not ${s.smallestLga} — that's the smallest.` : "Rural LGAs tend to be the biggest.",
        explanation: `${s.largestLga} is the largest LGA in ${stateLabel(s)}${s.smallestLga ? `; ${s.smallestLga} is the smallest` : ""}.`,
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-city",
    label: "Cities & towns",
    topic: "state",
    kind: "choice",
    subjects: (ix) => {
      const owners = new Map<string, string[]>();
      for (const s of ix.fb.states)
        for (const c of s.majorCities) {
          const k = c.toLowerCase();
          owners.set(k, [...(owners.get(k) ?? []), s.id]);
        }
      return ix.fb.states.flatMap((s) =>
        s.majorCities
          .filter((c) => c !== s.capital && owners.get(c.toLowerCase())?.length === 1)
          .map((c) => `${s.id}|${c}`)
      );
    },
    build: (id, ctx) => {
      const [sid, city] = id.split("|");
      const s = ctx.ix.stateById.get(sid)!;
      const wrong = distractors(ctx, ctx.ix.fb.states, (o) => o.id, [s.id], 3, isNear(s));
      return {
        prompt: `${city} is a major city in which state?`,
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: s.capital ? `The state capital is ${s.capital}.` : `It's in the ${s.zoneName}.`,
        explanation: `${city} is one of ${stateLabel(s)}'s major cities, alongside ${s.majorCities.filter((c) => c !== city).join(", ")}.`,
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-language",
    label: "Languages",
    topic: "state",
    kind: "choice",
    subjects: (ix) => {
      const owners = new Map<string, number>();
      for (const s of ix.fb.states) for (const l of s.languages) owners.set(l, (owners.get(l) ?? 0) + 1);
      return ix.fb.states.flatMap((s) => s.languages.filter((l) => owners.get(l) === 1).map((l) => `${s.id}|${l}`));
    },
    build: (id, ctx) => {
      const [sid, lang] = id.split("|");
      const s = ctx.ix.stateById.get(sid)!;
      const wrong = distractors(ctx, ctx.ix.fb.states, (o) => o.id, [s.id], 3, isNear(s));
      return {
        prompt: `${lang} is a language closely associated with which state?`,
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `It's in the ${s.zoneName} zone.`,
        explanation: `Languages of ${stateLabel(s)}: ${s.languages.join(", ")}.`,
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "state-population-rank",
    label: "Population face-off",
    topic: "state",
    kind: "choice",
    subjects: (ix) => {
      const ranked = ix.fb.states.filter((s) => s.population).sort((a, b) => b.population! - a.population!);
      return ranked.slice(0, Math.max(0, ranked.length - 3)).map((s) => s.id);
    },
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const pool = ctx.ix.fb.states.filter((o) => o.population && o.population < s.population!);
      const wrong = distractors(ctx, pool, (o) => o.id, [s.id], 3, (o) => o.population! > s.population! * 0.6);
      if (wrong.length < 3) return null;
      const opts = [s, ...wrong];
      return {
        prompt: "Which of these states has the largest population?",
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `The winner has over ${fmt.format(Math.floor(s.population! / 1_000_000))} million people.`,
        explanation: opts
          .sort((a, b) => b.population! - a.population!)
          .map((o) => `${o.name}: ~${(o.population! / 1_000_000).toFixed(1)}M`)
          .join(" · "),
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-area-rank",
    label: "Size face-off",
    topic: "state",
    kind: "choice",
    subjects: (ix) => {
      const ranked = ix.fb.states.filter((s) => s.landAreaKm2).sort((a, b) => b.landAreaKm2! - a.landAreaKm2!);
      return ranked.slice(0, Math.max(0, ranked.length - 3)).map((s) => s.id);
    },
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const pool = ctx.ix.fb.states.filter((o) => o.landAreaKm2 && o.landAreaKm2 < s.landAreaKm2!);
      const wrong = distractors(ctx, pool, (o) => o.id, [s.id], 3, (o) => o.landAreaKm2! > s.landAreaKm2! * 0.6);
      if (wrong.length < 3) return null;
      const opts = [s, ...wrong];
      return {
        prompt: "Which of these states covers the most land?",
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `It's in the ${s.zoneName} zone.`,
        explanation: opts
          .sort((a, b) => b.landAreaKm2! - a.landAreaKm2!)
          .map((o) => `${o.name}: ${fmt.format(o.landAreaKm2!)} km²`)
          .join(" · "),
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "state-governor",
    label: "Governors",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).filter((s) => s.governor).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const pool = ctx.ix.fb.states.filter((o) => o.governor);
      const wrong = distractors(ctx, pool, (o) => o.governor!, [s.governor!], 3, isNear(s));
      const label = s.id === "NG-FC" ? "FCT Minister" : "governor";
      return {
        prompt: `Who is the current ${label} of ${stateLabel(s)}?`,
        options: shuffle(ctx.rng, [s, ...wrong]).map((o) => ({ id: o.governor!, label: o.governor!, sub: o.governorParty ?? undefined })),
        answerId: s.governor!,
        answerLabel: s.governor!,
        hint: s.governorParty ? `Elected on the ${s.governorParty} platform.` : `Leads the ${s.zoneName} state.`,
        explanation: `${s.governor}${s.governorParty ? ` (${s.governorParty})` : ""} leads ${stateLabel(s)} for the 2023–2027 term.`,
        learnMoreHref: stateHref(s),
      };
    },
  },
  {
    id: "map-name-state",
    label: "Name the highlighted state",
    topic: "state",
    kind: "choice",
    subjects: (ix) => realStates(ix).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      const wrong = distractors(ctx, ctx.ix.fb.states, (o) => o.id, [s.id], 3, isNear(s));
      return {
        prompt: "Which state is highlighted on the map?",
        options: stateOptions(ctx, s, wrong, false),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: s.capital ? `Its capital is ${s.capital}.` : `It's in the ${s.zoneName}.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        spotlightStateId: s.id,
        hintZoneId: s.zoneId,
      };
    },
  },
  {
    id: "map-find-state",
    label: "Find the state",
    topic: "state",
    kind: "map-state",
    subjects: (ix) => realStates(ix).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      return {
        prompt: `Tap ${stateLabel(s)} on the map`,
        options: [],
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `It's in the glowing ${s.zoneName} zone${s.capital ? ` — capital ${s.capital}` : ""}.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        hintZoneId: s.zoneId,
      };
    },
  },
  {
    id: "map-find-capital",
    label: "Find by capital",
    topic: "state",
    kind: "map-state",
    subjects: (ix) => realStates(ix).filter((s) => s.capital && s.capital !== s.name).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      return {
        prompt: `Tap the state whose capital is ${s.capital}`,
        options: [],
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `It's in the glowing ${s.zoneName} zone.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        hintZoneId: s.zoneId,
      };
    },
  },
  {
    id: "map-find-nickname",
    label: "Find by slogan",
    topic: "state",
    kind: "map-state",
    subjects: (ix) => realStates(ix).filter((s) => s.nickname).map((s) => s.id),
    build: (id, ctx) => {
      const s = ctx.ix.stateById.get(id)!;
      return {
        prompt: `Tap the state known as “${s.nickname}”`,
        options: [],
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: `It's in the glowing ${s.zoneName} zone${s.capital ? ` — capital ${s.capital}` : ""}.`,
        explanation: stateBlurb(s),
        learnMoreHref: stateHref(s),
        hintZoneId: s.zoneId,
      };
    },
  },
];

function uniqueLgaName(ix: QuizIndex, l: QuizLgaFacts) {
  return (ix.lgaNameCount.get(l.name.toLowerCase()) ?? 0) === 1;
}

const LGA: QuestionGenerator[] = [
  {
    id: "lga-state",
    label: "LGA → state",
    topic: "lga",
    kind: "choice",
    subjects: (ix) => ix.fb.lgas.filter((l) => ix.stateById.has(l.stateId) && uniqueLgaName(ix, l)).map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId)!;
      const wrong = distractors(ctx, ctx.ix.fb.states, (o) => o.id, [s.id], 3, isNear(s));
      return {
        prompt: `${l.name} LGA is in which state?`,
        options: stateOptions(ctx, s, wrong),
        answerId: s.id,
        answerLabel: stateLabel(s),
        hint: l.headquarters && l.headquarters !== l.name ? `Its headquarters is ${l.headquarters}.` : `It's in the ${s.zoneName} zone.`,
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "lga-hq",
    label: "LGA headquarters",
    topic: "lga",
    kind: "choice",
    subjects: (ix) =>
      ix.fb.lgas
        .filter((l) => l.headquarters && l.headquarters.toLowerCase() !== l.name.toLowerCase())
        .filter((l) => (ix.lgasByState.get(l.stateId)?.filter((o) => o.headquarters).length ?? 0) >= 4)
        .map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId);
      const pool = (ctx.ix.lgasByState.get(l.stateId) ?? []).filter((o) => o.headquarters);
      const wrong = distractors(ctx, pool, (o) => o.headquarters!, [l.headquarters!]).map((o) => o.headquarters!);
      if (wrong.length < 3) return null;
      return {
        prompt: `Where is the headquarters of ${l.name} LGA${s ? `, ${stateLabel(s)}` : ""}?`,
        options: textOptions(ctx, l.headquarters!, wrong),
        answerId: l.headquarters!,
        answerLabel: l.headquarters!,
        hint: `It starts with “${l.headquarters!.slice(0, 2)}…”.`,
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
      };
    },
  },
  {
    id: "lga-in-state",
    label: "Spot the LGA",
    topic: "lga",
    kind: "choice",
    subjects: (ix) => ix.fb.lgas.filter((l) => uniqueLgaName(ix, l)).map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId);
      if (!s) return null;
      const pool = ctx.ix.fb.lgas.filter((o) => o.stateId !== s.id && uniqueLgaName(ctx.ix, o));
      const wrong = distractors(ctx, pool, (o) => o.name, [l.name], 3, (o) => s.borderingStateIds.includes(o.stateId));
      return {
        prompt: `Which of these is an LGA in ${stateLabel(s)}?`,
        options: shuffle(ctx.rng, [l, ...wrong]).map((o) => ({ id: o.id, label: o.name })),
        answerId: l.id,
        answerLabel: l.name,
        hint: l.headquarters ? `Its headquarters is ${l.headquarters}.` : `${stateLabel(s)} has ${s.lgaCount} LGAs.`,
        explanation: wrong
          .map((o) => `${o.name} is in ${ctx.ix.stateById.get(o.stateId)?.name}`)
          .concat(lgaBlurb(l, s))
          .join(". "),
        learnMoreHref: lgaHref(l),
        spotlightStateId: s.id,
      };
    },
  },
  {
    id: "lga-town",
    label: "Town → LGA",
    topic: "lga",
    kind: "choice",
    subjects: (ix) =>
      ix.fb.lgas.flatMap((l) => {
        const peers = ix.lgasByState.get(l.stateId) ?? [];
        if (peers.length < 4) return [];
        return l.majorTowns
          .filter((t) => t.toLowerCase() !== l.name.toLowerCase())
          .filter((t) => peers.filter((p) => p.majorTowns.includes(t) || p.name.toLowerCase().includes(t.toLowerCase())).length === 1)
          .map((t) => `${l.id}|${t}`);
      }),
    build: (id, ctx) => {
      const [lid, town] = id.split("|");
      const l = ctx.ix.fb.lgas.find((x) => x.id === lid)!;
      const s = ctx.ix.stateById.get(l.stateId);
      const wrong = distractors(ctx, ctx.ix.lgasByState.get(l.stateId) ?? [], (o) => o.name, [l.name]);
      return {
        prompt: `${town} is in which LGA of ${s ? stateLabel(s) : "Nigeria"}?`,
        options: shuffle(ctx.rng, [l, ...wrong]).map((o) => ({ id: o.id, label: o.name })),
        answerId: l.id,
        answerLabel: l.name,
        hint: l.headquarters ? `The LGA is headquartered at ${l.headquarters}.` : `It's one of ${s?.lgaCount ?? "the"} LGAs.`,
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
      };
    },
  },
  {
    id: "lga-area-rank",
    label: "LGA size face-off",
    topic: "lga",
    kind: "choice",
    subjects: (ix) =>
      ix.fb.lgas
        .filter((l) => l.areaKm2 && (ix.lgasByState.get(l.stateId) ?? []).filter((o) => o.areaKm2 && o.areaKm2 < l.areaKm2!).length >= 3)
        .map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId);
      const pool = (ctx.ix.lgasByState.get(l.stateId) ?? []).filter((o) => o.areaKm2 && o.areaKm2 < l.areaKm2!);
      const wrong = distractors(ctx, pool, (o) => o.id, [l.id], 3, (o) => o.areaKm2! > l.areaKm2! * 0.5);
      const opts = [l, ...wrong];
      return {
        prompt: `Which of these ${s ? stateLabel(s) : ""} LGAs is the largest by area?`,
        options: shuffle(ctx.rng, opts).map((o) => ({ id: o.id, label: o.name })),
        answerId: l.id,
        answerLabel: l.name,
        hint: `The winner is over ${fmt.format(Math.floor(l.areaKm2! / 100) * 100)} km².`,
        explanation: opts
          .sort((a, b) => b.areaKm2! - a.areaKm2!)
          .map((o) => `${o.name}: ${fmt.format(Math.round(o.areaKm2!))} km²`)
          .join(" · "),
        learnMoreHref: lgaHref(l),
      };
    },
  },
  {
    id: "lga-nickname",
    label: "LGA nicknames",
    topic: "lga",
    kind: "choice",
    subjects: (ix) => ix.fb.lgas.filter((l) => l.nickname && (ix.lgasByState.get(l.stateId)?.length ?? 0) >= 4).map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId);
      const wrong = distractors(ctx, ctx.ix.lgasByState.get(l.stateId) ?? [], (o) => o.name, [l.name]);
      return {
        prompt: `Which ${s ? stateLabel(s) : ""} LGA is known as “${l.nickname}”?`,
        options: shuffle(ctx.rng, [l, ...wrong]).map((o) => ({ id: o.id, label: o.name })),
        answerId: l.id,
        answerLabel: l.name,
        hint: l.headquarters ? `Headquartered at ${l.headquarters}.` : "Think local pride.",
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
      };
    },
  },
  {
    id: "lga-landmark",
    label: "Landmarks",
    topic: "lga",
    kind: "choice",
    subjects: (ix) =>
      ix.fb.lgas.flatMap((l) => ((ix.lgasByState.get(l.stateId)?.length ?? 0) >= 4 ? l.landmarks.map((m) => `${l.id}|${m}`) : [])),
    build: (id, ctx) => {
      const [lid, mark] = id.split("|");
      const l = ctx.ix.fb.lgas.find((x) => x.id === lid)!;
      const s = ctx.ix.stateById.get(l.stateId);
      const wrong = distractors(ctx, ctx.ix.lgasByState.get(l.stateId) ?? [], (o) => o.name, [l.name]);
      return {
        prompt: `${mark} is found in which LGA${s ? ` of ${stateLabel(s)}` : ""}?`,
        options: shuffle(ctx.rng, [l, ...wrong]).map((o) => ({ id: o.id, label: o.name })),
        answerId: l.id,
        answerLabel: l.name,
        hint: l.headquarters ? `The LGA HQ is ${l.headquarters}.` : "Check the state's LGA map.",
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
      };
    },
  },
  {
    id: "lga-created",
    label: "LGA creation year",
    topic: "lga",
    kind: "choice",
    subjects: (ix) => ix.fb.lgas.filter((l) => l.yearCreated).map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId);
      return {
        prompt: `In what year was ${l.name} LGA created?`,
        options: numberOptions(ctx, l.yearCreated!, 8, 1900).map((o) => ({ ...o, label: o.id })),
        answerId: String(l.yearCreated),
        answerLabel: String(l.yearCreated),
        hint: l.yearCreated! >= 1990 ? "After 1990." : "Before 1990.",
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
      };
    },
  },
  {
    id: "map-find-lga",
    label: "Find the LGA",
    topic: "lga",
    kind: "map-lga",
    subjects: (ix) => ix.fb.lgas.filter((l) => ix.stateById.has(l.stateId)).map((l) => l.id),
    build: (id, ctx) => {
      const l = ctx.ix.fb.lgas.find((x) => x.id === id)!;
      const s = ctx.ix.stateById.get(l.stateId)!;
      return {
        prompt: `Tap ${l.name} on the ${stateLabel(s)} map`,
        options: [],
        answerId: l.id,
        answerLabel: l.name,
        hint: l.headquarters ? `Its headquarters is ${l.headquarters}${l.areaKm2 ? `; about ${fmt.format(Math.round(l.areaKm2))} km²` : ""}.` : "Look closely at the smaller shapes.",
        explanation: lgaBlurb(l, s),
        learnMoreHref: lgaHref(l),
        mapStateId: s.id,
      };
    },
  },
];

export const QUESTION_GENERATORS: QuestionGenerator[] = [...NIGERIA, ...STATE, ...LGA];

const GENERATOR_BY_ID = new Map(QUESTION_GENERATORS.map((g) => [g.id, g]));

/* ------------------------------------------------------------------ */
/* Session builder                                                    */
/* ------------------------------------------------------------------ */

export type QuestionFilter = {
  generatorIds?: string[];
  topics?: QuizTopic[];
  kinds?: QuizQuestionKind[];
  /** Restrict state / LGA questions to one state. */
  stateId?: string | null;
};

function selectGenerators(filter: QuestionFilter): QuestionGenerator[] {
  return QUESTION_GENERATORS.filter(
    (g) =>
      (!filter.generatorIds || filter.generatorIds.includes(g.id)) &&
      (!filter.topics || filter.topics.includes(g.topic)) &&
      (!filter.kinds || filter.kinds.includes(g.kind))
  );
}

function subjectsFor(g: QuestionGenerator, ix: QuizIndex, stateId?: string | null): string[] {
  const all = g.subjects(ix);
  if (!stateId) return all;
  if (g.topic === "nigeria") return [];
  return all.filter((s) => s.split("|")[0] === stateId || s.startsWith(`${stateId}-`));
}

/** How many distinct questions the current data can produce for a filter. */
export function countQuestions(ix: QuizIndex, filter: QuestionFilter = {}): number {
  return selectGenerators(filter).reduce((n, g) => n + subjectsFor(g, ix, filter.stateId).length, 0);
}

/**
 * Draws `count` unique questions. Generators are picked round-robin from a
 * shuffled deck so a session mixes question styles instead of repeating one.
 */
export function buildQuizSession(
  ix: QuizIndex,
  filter: QuestionFilter,
  count: number,
  rng: Rng,
  difficulty: QuizDifficulty = "standard"
): QuizQuestion[] {
  const gens = selectGenerators(filter)
    .map((g) => ({ g, subjects: shuffle(rng, subjectsFor(g, ix, filter.stateId)) }))
    .filter((x) => x.subjects.length > 0);
  const out: QuizQuestion[] = [];
  const ctx: Ctx = { rng, difficulty, ix };
  let deck = shuffle(rng, gens);
  let stalls = 0;
  while (out.length < count && gens.some((x) => x.subjects.length) && stalls < 500) {
    if (!deck.length) deck = shuffle(rng, gens.filter((x) => x.subjects.length));
    const entry = deck.pop()!;
    const subject = entry.subjects.pop();
    if (!subject) continue;
    const built = entry.g.build(subject, ctx);
    if (!built || (entry.g.kind === "choice" && built.options.length < 4)) {
      stalls++;
      continue;
    }
    out.push({
      ...built,
      key: `${entry.g.id}:${subject}`,
      generatorId: entry.g.id,
      topic: entry.g.topic,
      kind: entry.g.kind,
    });
  }
  return out;
}

export function generatorLabel(id: string): string {
  return GENERATOR_BY_ID.get(id)?.label ?? id;
}
