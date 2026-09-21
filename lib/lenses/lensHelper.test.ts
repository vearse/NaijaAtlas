import assert from "node:assert/strict";
import {
  lensesFor,
  matchesActiveLens,
  lensInputFromWikiNote,
  lensInputFromGeoProperties,
} from "./lensHelper";

const festivalNote = lensInputFromWikiNote({
  title: "Argungu",
  note: "Fishing festival",
  category: "festival",
  type: "festival",
  url: "https://example.com",
});

assert.deepEqual(lensesFor(festivalNote), ["learn", "tourist"]);
assert.equal(matchesActiveLens(festivalNote, "learn"), true);
assert.equal(matchesActiveLens(festivalNote, "tourist"), true);
assert.equal(matchesActiveLens(festivalNote, "invest"), false);

const economyNote = lensInputFromWikiNote({
  title: "Palm oil",
  note: "Export crop",
  category: "economy",
  url: "https://example.com",
});

assert.ok(lensesFor(economyNote).includes("invest"));

const lagosCity = lensInputFromGeoProperties("cities", {
  id: "city-lagos",
  name: "Lagos",
  category: "mega-city",
});

const lagosLenses = lensesFor(lagosCity);
assert.ok(lagosLenses.includes("learn"));
assert.ok(lagosLenses.includes("tourist"));
assert.ok(lagosLenses.includes("invest"));

const crude = lensInputFromGeoProperties("resources", {
  id: "resource-crude-oil-0",
  name: "Crude Oil",
  resourceType: "crude-oil",
});

assert.deepEqual(lensesFor(crude), ["learn", "invest"]);

console.log("lensHelper.test.ts: all assertions passed");
