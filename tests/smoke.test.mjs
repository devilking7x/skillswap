// Playwright smoke test for SkillSwap.
// Serves the app locally (no network needed) and drives it in Chromium.
// Run: node tests/smoke.test.mjs   (requires playwright; uses installed Chromium)
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(root, "..");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

const server = http.createServer((req, res) => {
  const p = path.join(appDir, req.url === "/" ? "index.html" : decodeURIComponent(req.url));
  if (!p.startsWith(appDir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404); res.end("not found"); return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "text/plain" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

try {
  await page.goto(base, { waitUntil: "networkidle" });

  // 1. Page loads, sample board renders (6 sample posts).
  await page.waitForSelector(".card");
  let cards = await page.$$(".card");
  assert.equal(cards.length, 6, "expected 6 sample cards on first load");

  // 2. Search filter narrows the board.
  await page.fill("#q", "guitar");
  await page.waitForTimeout(100);
  cards = await page.$$(".card");
  assert.equal(cards.length, 1, "search 'guitar' should show 1 card");

  // 3. Clear search; post a new swap that mutually matches a sample (Rohan).
  await page.fill("#q", "");
  await page.fill("#f-name", "Test Raja");
  await page.fill("#f-teach", "Basic Excel");
  await page.fill("#f-learn", "Spoken English");
  await page.click('button[type="submit"]');
  await page.waitForSelector(".match-results:not([hidden])");
  const matchText = await page.textContent("#match-results");
  assert.match(matchText, /Mutual match/, "new post should find a mutual match (Rohan)");
  assert.match(matchText, /Rohan/, "mutual match should name Rohan");

  // 4. New post appears on the board and persists across reload.
  cards = await page.$$(".card");
  assert.equal(cards.length, 7, "board should show 7 cards after posting");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".card");
  cards = await page.$$(".card");
  assert.equal(cards.length, 7, "post should persist after reload (localStorage)");

  // 5. Remove sample posts -> only the user's post remains.
  await page.click("#btn-clear-samples");
  await page.waitForTimeout(100);
  cards = await page.$$(".card");
  assert.equal(cards.length, 1, "after removing samples only 1 (mine) should remain");

  // 6. Validation: empty form shows errors, adds nothing.
  await page.click("#btn-samples"); // restore samples for a clean check
  await page.fill("#f-name", "");
  await page.fill("#f-teach", "");
  await page.fill("#f-learn", "");
  await page.click('button[type="submit"]');
  const errVisible = await page.isVisible("#form-errors");
  assert.equal(errVisible, true, "validation errors should show on empty submit");

  // 7. No JS errors at any point.
  assert.deepEqual(errors, [], "no page errors: " + errors.join(" | "));

  console.log("SMOKE OK: 7 checks passed (load, search, post+mutual match, persistence, sample toggle, validation, no JS errors)");
} finally {
  await browser.close();
  server.close();
}
