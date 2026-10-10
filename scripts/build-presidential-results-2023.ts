/**
 * One-off generator: INEC-declared 2023 presidential results by state (Wikipedia/INEC table).
 * Run: npx tsx scripts/build-presidential-results-2023.ts
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");

/** [stateId, APC, PDP, LP, NNPP, others, validVotes] */
const ROWS: [string, number, number, number, number, number, number][] = [
  ["NG-AB", 8914, 22676, 327095, 1239, 10113, 370037],
  ["NG-AD", 182881, 417611, 105648, 8006, 16994, 731140],
  ["NG-AK", 160620, 214012, 132683, 7796, 39978, 555089],
  ["NG-AN", 5111, 9036, 584621, 1967, 13126, 613861],
  ["NG-BA", 316694, 426607, 27373, 72103, 10739, 853516],
  ["NG-BY", 42572, 68818, 49975, 540, 3420, 165325],
  ["NG-BE", 310468, 130081, 308372, 4740, 16414, 770075],
  ["NG-BO", 252282, 190921, 7205, 4626, 10253, 465287],
  ["NG-CR", 130520, 95425, 179917, 1644, 9462, 416968],
  ["NG-DE", 90183, 161600, 341866, 3122, 18570, 615341],
  ["NG-EB", 42402, 13503, 259738, 1661, 8047, 325351],
  ["NG-ED", 144471, 89585, 331163, 2743, 13304, 581266],
  ["NG-EK", 201494, 89554, 11397, 264, 5462, 308171],
  ["NG-EN", 4772, 15749, 428640, 1808, 5455, 456424],
  ["NG-FC", 90902, 74194, 281717, 4517, 8741, 460071],
  ["NG-GO", 146977, 317123, 26160, 10520, 9263, 510043],
  ["NG-IM", 66171, 30004, 352904, 1536, 8646, 459261],
  ["NG-JI", 421390, 386587, 1889, 98234, 12431, 920531],
  ["NG-KD", 399293, 554360, 294494, 92969, 19037, 1360153],
  ["NG-KN", 517341, 131716, 28513, 997279, 27156, 1702005],
  ["NG-KT", 482283, 489045, 6376, 69386, 11583, 1058673],
  ["NG-KE", 248088, 285175, 10682, 5038, 10539, 559522],
  ["NG-KO", 240751, 145104, 56217, 4238, 10480, 456790],
  ["NG-KW", 263572, 136909, 31186, 3141, 35163, 469971],
  ["NG-LA", 572606, 75750, 582454, 8442, 32199, 1271451],
  ["NG-NA", 172922, 147093, 191361, 12715, 16475, 540566],
  ["NG-NI", 375183, 284898, 80452, 21836, 16299, 778668],
  ["NG-OG", 341554, 123831, 85829, 2200, 26710, 580124],
  ["NG-ON", 369924, 115463, 44405, 930, 20286, 551008],
  ["NG-OS", 343945, 354366, 23283, 713, 10896, 733203],
  ["NG-OY", 449884, 182977, 99110, 4095, 73419, 809485],
  ["NG-PL", 307195, 243808, 466272, 8869, 62026, 1088170],
  ["NG-RI", 231591, 88468, 175071, 1322, 27199, 523651],
  ["NG-SO", 285444, 288679, 6568, 1300, 4824, 586815],
  ["NG-TA", 135165, 189017, 146315, 12818, 16043, 499358],
  ["NG-YO", 151459, 198567, 2406, 18270, 7695, 378397],
  ["NG-ZA", 298396, 193978, 1660, 4044, 4845, 502923],
];

const parties = ["APC", "PDP", "LP", "NNPP"] as const;
type Party = (typeof parties)[number];

function sumParty(p: Party) {
  return ROWS.reduce((n, r) => n + r[parties.indexOf(p) + 1], 0);
}

/** INEC national collation totals (state sums can differ slightly from rounding/corrections). */
const national = {
  validVotes: 24_025_940,
  byParty: {
    APC: 8_794_726,
    PDP: 6_984_520,
    LP: 6_101_533,
    NNPP: 1_496_687,
    others: 648_474,
  },
  winner: "APC" as const,
};

const out = {
  election: {
    year: 2023,
    date: "2023-02-25",
    office: "president",
    declaredBy: "INEC",
    sourceUrl:
      "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election",
  },
  candidates: [
    {
      party: "APC",
      name: "Bola Ahmed Tinubu",
      runningMate: "Kashim Shettima",
      color: "#126638",
    },
    {
      party: "PDP",
      name: "Atiku Abubakar",
      runningMate: "Ifeanyi Okowa",
      color: "#C1272D",
    },
    {
      party: "LP",
      name: "Peter Obi",
      runningMate: "Yusuf Datti Baba-Ahmed",
      color: "#2E5DAC",
    },
    {
      party: "NNPP",
      name: "Rabiu Kwankwaso",
      runningMate: "Isaac Idahosa",
      color: "#D97706",
    },
  ],
  national,
  states: ROWS.map(([stateId, apc, pdp, lp, nnpp, others, validVotes]) => ({
    stateId,
    votes: { APC: apc, PDP: pdp, LP: lp, NNPP: nnpp, others },
    validVotes,
  })),
};

const dest = path.join(
  ROOT,
  "data/politics/results/2023/presidential_results.json"
);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
console.log("Wrote", dest);
console.log("National APC", national.byParty.APC, "PDP", national.byParty.PDP);
