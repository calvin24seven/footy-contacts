/**
 * Scrapes https://www.sportmonks.com/football-api/coverage/ into a CSV.
 * Output: scripts/leagues.csv  (country, league_name, league_id)
 *
 * Run:  node scripts/scrape-leagues.mjs
 *
 * Steps:
 *  1. Load page (networkidle)
 *  2. Click every "Show all" button to expand all leagues
 *  3. Parse innerText → CSV
 *
 * Text format observed:
 *   ALL CAPS LINE        → category/country header
 *   "League Name #1234"  → league entry
 *   "-"                  → coverage column separator (skip)
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, 'leagues.csv');
const URL    = 'https://www.sportmonks.com/football-api/coverage/';

// ── 1. Fetch + expand ────────────────────────────────────────────────────────
console.log('Launching headless browser...');
const browser = await chromium.launch({ headless: true });
let rawText;

try {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (compatible; league-data-tool/1.0)' });

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 40_000 });
  await page.waitForTimeout(1500);

  // Dismiss cookie banner if present
  try {
    const cookieBtn = page.locator('button, a').filter({ hasText: /allow all|accept all/i }).first();
    if (await cookieBtn.isVisible({ timeout: 3000 })) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
  } catch { /* no cookie banner */ }

  // Click every "Show all" span (class="button button--red") to expand hidden-tables
  const showAllSpans = page.locator('span.button--red');
  const count = await showAllSpans.count();
  console.log(`Found ${count} "Show all" span(s), clicking...`);
  for (let i = 0; i < count; i++) {
    try {
      await showAllSpans.nth(i).scrollIntoViewIfNeeded();
      await showAllSpans.nth(i).click({ timeout: 3000 });
      await page.waitForTimeout(300);
    } catch { /* stale or not clickable */ }
  }

  // Wait for hidden-tables divs to render their content
  if (count > 0) {
    await page.waitForFunction(
      () => document.querySelectorAll('.hidden-tables').length > 0,
      { timeout: 10_000 }
    ).catch(() => console.warn('hidden-tables not found after clicking'));
    await page.waitForTimeout(1500);
  }

  // Debug: log how much content loaded
  const bodyLen = await page.evaluate(() => document.body.innerText.length);
  console.log(`Page innerText length: ${bodyLen} chars`);

  rawText = await page.evaluate(() => {
    // The hidden content sits in .hidden-tables divs whose CSS class hides them.
    // Removing the class exposes them to innerText.
    document.querySelectorAll('.hidden-tables').forEach(el => el.classList.remove('hidden-tables'));
    return document.body.innerText;
  });
} finally {
  await browser.close();
}

// ── 2. Parse text ────────────────────────────────────────────────────────────
const START_MARKER = /^TOP LEAGUES$/;
const END_MARKER   = /^Show all$/i;
const IS_CATEGORY  = /^[A-Z][A-Z\s\d&/()'-]{2,}$/;
const IS_LEAGUE    = /^(.+?)\s+#(\d+)$/;

const rows = [];
let inData   = false;
let category = '';

for (const raw_line of rawText.split(/\r?\n/)) {
  const line = raw_line.trim();

  if (!inData) {
    if (START_MARKER.test(line)) inData = true;
    else continue;
  }

  // End-of-data footer
  if (/^CREATE THE FUTURE/i.test(line)) break;

  if (!line || line === '-') continue;

  const leagueMatch = line.match(IS_LEAGUE);
  if (leagueMatch) {
    rows.push({ country: category, league_name: leagueMatch[1].trim(), league_id: leagueMatch[2] });
    continue;
  }

  if (IS_CATEGORY.test(line) && !END_MARKER.test(line)) {
    category = line;
  }
}

if (rows.length === 0) {
  console.error('No leagues parsed — check structure manually.');
  process.exit(1);
}

// ── 3. Write CSV ─────────────────────────────────────────────────────────────
const escape   = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csvLines = [
  'country,league_name,league_id',
  ...rows.map((r) => `${escape(r.country)},${escape(r.league_name)},${escape(r.league_id)}`),
];

writeFileSync(OUTPUT, csvLines.join('\n'), 'utf8');
console.log(`Done. ${rows.length} leagues written to ${OUTPUT}`);
