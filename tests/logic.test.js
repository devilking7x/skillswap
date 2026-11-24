// Node tests for SkillSwap core logic (logic.js).
// Run: node --test tests/logic.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const LS = require("../logic.js");

const SAMPLES = [
  { id: "s1", name: "Asha", category: "Academics", teach: "Basic Excel", learn: "Spoken English", mode: "Online" },
  { id: "s2", name: "Rohan", category: "Language", teach: "Spoken English", learn: "Basic Excel", mode: "Online" },
  { id: "s3", name: "Meera", category: "Music", teach: "Guitar basics", learn: "Hindi songs", mode: "In person" },
  { id: "s4", name: "Kabir", category: "Coding", teach: "Python basics", learn: "Web design", mode: "Either" },
];

test("norm trims, lowercases and collapses spaces", () => {
  assert.equal(LS.norm("  Basic   Excel "), "basic excel");
  assert.equal(LS.norm(null), "");
});

test("skillMatches: exact, substring, case-insensitive; no false positives", () => {
  assert.equal(LS.skillMatches("Basic Excel", "excel"), true);
  assert.equal(LS.skillMatches("excel", "Basic Excel"), true);
  assert.equal(LS.skillMatches("Spoken English", "spoken english"), true);
  assert.equal(LS.skillMatches("Guitar", "Piano"), false);
  assert.equal(LS.skillMatches("", "Excel"), false);
  assert.equal(LS.skillMatches("Excel", ""), false);
});

test("validatePost accepts a complete post", () => {
  const errs = LS.validatePost({ name: "Raja", teach: "Excel", learn: "English", category: "Academics", mode: "Online", note: "hi" });
  assert.deepEqual(errs, []);
});

test("validatePost flags every missing field", () => {
  const errs = LS.validatePost({ name: "", teach: "", learn: "" });
  assert.equal(errs.length, 3);
});

test("validatePost rejects unknown category/mode and overlong fields", () => {
  const errs = LS.validatePost({
    name: "R", teach: "x".repeat(81), learn: "y", category: "Nope", mode: "Telepathy", note: "n".repeat(201),
  });
  assert.equal(errs.length, 4);
});

test("findMutualMatches: Asha <-> Rohan is mutual, others are not", () => {
  const mutual = LS.findMutualMatches(SAMPLES, SAMPLES[0]);
  assert.deepEqual(mutual.map((p) => p.id), ["s2"]);
  assert.deepEqual(LS.findMutualMatches(SAMPLES, SAMPLES[2]), []);
});

test("findTeachers finds one-way teachers and excludes self", () => {
  const t = LS.findTeachers(SAMPLES, "Spoken English", "s1");
  assert.deepEqual(t.map((p) => p.id), ["s2"]);
  assert.deepEqual(LS.findTeachers(SAMPLES, "Guitar basics", "s3"), []);
});

test("matchSummary splits mutual vs one-way", () => {
  const mine = { id: "me", name: "Me", teach: "Web design", learn: "Python basics" };
  const s = LS.matchSummary(SAMPLES, mine);
  assert.deepEqual(s.mutual.map((p) => p.id), ["s4"]);
  assert.deepEqual(s.oneWay, []);
  const mine2 = { id: "me2", name: "Me", teach: "Cooking", learn: "Guitar basics" };
  const s2 = LS.matchSummary(SAMPLES, mine2);
  assert.deepEqual(s2.mutual, []);
  assert.deepEqual(s2.oneWay.map((p) => p.id), ["s3"]);
});

test("filterPosts: search, category, mode, samples", () => {
  assert.equal(LS.filterPosts(SAMPLES, { query: "excel" }).length, 2);
  assert.equal(LS.filterPosts(SAMPLES, { query: "GUITAR" }).length, 1);
  assert.equal(LS.filterPosts(SAMPLES, { category: "Coding" }).length, 1);
  assert.equal(LS.filterPosts(SAMPLES, { mode: "In person" }).length, 2); // s3 + s4 ("Either")
  assert.equal(LS.filterPosts(SAMPLES, { query: "zzz" }).length, 0);
  const withSamples = SAMPLES.concat([{ id: "x", sample: true, teach: "a", learn: "b", category: "Other", mode: "Online" }]);
  assert.equal(LS.filterPosts(withSamples, { onlySamples: true }).length, 1);
  assert.equal(LS.filterPosts(withSamples, { onlySamples: false }).length, 4);
});

test("countByCategory counts each category", () => {
  const c = LS.countByCategory(SAMPLES);
  assert.equal(c["Academics"], 1);
  assert.equal(c["Coding"], 1);
  assert.equal(c["Cooking"], 0);
  assert.equal(Object.values(c).reduce((a, b) => a + b, 0), 4);
});

test("empty board behaves: no crashes, no matches", () => {
  assert.deepEqual(LS.findMutualMatches([], SAMPLES[0]), []);
  assert.deepEqual(LS.filterPosts([], { query: "x" }), []);
  assert.deepEqual(LS.matchSummary([], SAMPLES[0]), { mutual: [], oneWay: [] });
});
