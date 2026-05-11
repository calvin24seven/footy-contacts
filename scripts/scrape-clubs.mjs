/**
 * Scrapes club lists for 120 target leagues from Wikipedia.
 * No API key needed. Uses Wikipedia search API + cheerio HTML parsing.
 *
 * Run:    node scripts/scrape-clubs.mjs
 * Output: scripts/clubs.csv  (country, league, club_name, wikipedia_url)
 *
 * Resumable — checkpoint saved to scripts/scrape-clubs-checkpoint.json
 * Rate:    ~1 req/sec (within Wikipedia's polite crawling guidelines)
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const CHECKPOINT = join(__dirname, 'scrape-clubs-checkpoint.json');
const OUTPUT     = join(__dirname, 'clubs.csv');
const DELAY_MS   = 2000;

const HEADERS = {
  'User-Agent': 'footy-contacts-research/1.0 (internal tool; not for redistribution)',
  'Accept-Language': 'en',
};

// ── Target leagues ─────────────────────────────────────────────────────────
const LEAGUES = [
  // England
  { country: 'England', name: 'Premier League',                           wiki: '2025–26 Premier League' },
  { country: 'England', name: 'Championship',                             wiki: '2025–26 EFL Championship' },
  { country: 'England', name: 'League One',                               wiki: '2025–26 EFL League One' },
  { country: 'England', name: 'League Two',                               wiki: '2025–26 EFL League Two' },
  { country: 'England', name: 'National League',                          wiki: '2025–26 National League (English football)' },
  { country: 'England', name: 'Vanarama National League North',           wiki: '2025–26 National League North' },
  { country: 'England', name: 'Vanarama National League South',           wiki: '2025–26 National League South' },
  { country: 'England', name: 'Premier League 2 Division One',            wiki: "2025–26 Premier League 2" },
  { country: 'England', name: 'Premier League 2 Division Two',            wiki: "2025–26 Premier League 2 Division Two" },
  { country: 'England', name: 'Premier League U18',                       wiki: '2025–26 Premier League International Cup' },
  { country: 'England', name: 'Professional Development League',          wiki: 'Professional Development League' },
  { country: 'England', name: 'U18 Professional Development League',      wiki: 'Under-18 Professional Development League' },
  { country: 'England', name: "Women's Super League",                     wiki: '2025–26 Women\'s Super League' },
  { country: 'England', name: "Women's Championship",                     wiki: '2025–26 FA Women\'s Championship' },
  { country: 'England', name: "Women's National League Premier North",    wiki: "FA Women's National League" },
  { country: 'England', name: "Women's National League Premier South",    wiki: "FA Women's National League" },
  { country: 'England', name: "Women's National League Div One North",    wiki: "FA Women's National League Division One North" },
  { country: 'England', name: "Women's National League Div One Midlands", wiki: "FA Women's National League Division One Midlands" },
  { country: 'England', name: "Women's National League Div One SE",       wiki: "FA Women's National League Division One South East" },
  { country: 'England', name: "Women's National League Div One SW",       wiki: "FA Women's National League Division One South West" },
  { country: 'England', name: 'Non League Premier: Isthmian',             wiki: '2025–26 Isthmian League Premier Division' },
  { country: 'England', name: 'Non League Premier: Northern',             wiki: '2025–26 Northern Premier League Premier Division' },
  { country: 'England', name: 'Non League Premier: Southern Central',     wiki: '2025–26 Southern Football League Premier Division Central' },
  { country: 'England', name: 'Non League Premier: Southern South',       wiki: '2025–26 Southern Football League Premier Division South' },
  { country: 'England', name: 'Non League Div One: Isthmian North',       wiki: '2025–26 Isthmian League Division One North' },
  { country: 'England', name: 'Non League Div One: Isthmian SC',          wiki: '2025–26 Isthmian League Division One South Central' },
  { country: 'England', name: 'Non League Div One: Isthmian SE',          wiki: '2025–26 Isthmian League Division One South East' },
  { country: 'England', name: 'Non League Div One: Northern East',        wiki: '2025–26 Northern Premier League Division One East' },
  { country: 'England', name: 'Non League Div One: Northern Midlands',    wiki: '2025–26 Northern Premier League Division One Midlands' },
  { country: 'England', name: 'Non League Div One: Northern West',        wiki: '2025–26 Northern Premier League Division One West' },
  { country: 'England', name: 'Non League Div One: Southern Central',     wiki: '2025–26 Southern Football League Division One Central' },
  { country: 'England', name: 'Non League Div One: Southern South',       wiki: '2025–26 Southern Football League Division One South' },
  // Scotland
  { country: 'Scotland', name: 'Premiership',         wiki: '2025–26 Scottish Premiership' },
  { country: 'Scotland', name: 'Championship',        wiki: '2025–26 Scottish Championship' },
  { country: 'Scotland', name: 'League One',          wiki: '2025–26 Scottish League One' },
  { country: 'Scotland', name: 'League Two',          wiki: '2025–26 Scottish League Two' },
  { country: 'Scotland', name: 'Highland League',     wiki: 'Scottish Highland Football League' },
  { country: 'Scotland', name: 'Football League',     wiki: 'Scottish Football League' },
  { country: 'Scotland', name: 'SWPL 1',              wiki: 'Scottish Women\'s Premier League' },
  { country: 'Scotland', name: 'SWPL 2',              wiki: 'Scottish Women\'s Premier League' },
  { country: 'Scotland', name: "Women's Championship",wiki: "Scottish Women's Championship" },
  { country: 'Scotland', name: 'Reserve League',      wiki: 'Scottish Reserve League' },
  // Wales
  { country: 'Wales', name: 'Premier League',                wiki: '2025–26 Cymru Premier' },
  { country: 'Wales', name: 'FAW Championship',              wiki: 'Cymru North' },
  { country: 'Wales', name: 'FAW Championship - South',      wiki: 'Cymru South' },
  { country: 'Wales', name: "Welsh Premier Women's League",  wiki: "Welsh Women's Premier League" },
  // Republic of Ireland
  { country: 'Ireland', name: 'Premier Division',     wiki: '2025 League of Ireland Premier Division' },
  { country: 'Ireland', name: 'First Division',       wiki: '2025 League of Ireland First Division' },
  { country: 'Ireland', name: "Women's National League", wiki: "2025 Women's National League (Ireland)" },
  { country: 'Ireland', name: 'U19 National League',  wiki: 'League of Ireland Under-19 League' },
  { country: 'Ireland', name: 'U20 National League',  wiki: 'League of Ireland Under-20 League' },
  // Northern Ireland
  { country: 'Northern Ireland', name: 'Premiership',                    wiki: '2025–26 NIFL Premiership' },
  { country: 'Northern Ireland', name: 'Championship',                   wiki: '2025–26 NIFL Championship' },
  { country: 'Northern Ireland', name: 'Premiership Development League', wiki: 'NIFL Premiership Development League' },
  // USA
  { country: 'USA', name: 'MLS',              wiki: '2025 MLS season' },
  { country: 'USA', name: 'USL Championship', wiki: '2025 USL Championship season' },
  { country: 'USA', name: 'USL League One',   wiki: '2025 USL League One season' },
  { country: 'USA', name: 'USL League Two',   wiki: '2025 USL League Two season' },
  { country: 'USA', name: 'NISA',             wiki: 'National Independent Soccer Association' },
  { country: 'USA', name: 'NPSL',             wiki: 'National Premier Soccer League' },
  { country: 'USA', name: 'NWSL',             wiki: '2025 NWSL season' },
  { country: 'USA', name: 'USL W League',     wiki: '2025 USL W League season' },
  { country: 'USA', name: 'USL Super League', wiki: '2024–25 USL Super League season' },
  { country: 'USA', name: 'MLS Next Pro',     wiki: '2025 MLS Next Pro season' },
  { country: 'USA', name: 'WPSL',             wiki: "Women's Premier Soccer League" },
  // Canada
  { country: 'Canada', name: 'Canadian Premier League', wiki: '2025 Canadian Premier League season' },
  { country: 'Canada', name: 'League 1 Ontario',        wiki: 'League1 Ontario' },
  { country: 'Canada', name: 'League 1 BC',             wiki: 'League1 BC' },
  { country: 'Canada', name: 'Northern Super League',   wiki: 'Northern Super League' },
  // Portugal
  { country: 'Portugal', name: 'Primeira Liga',       wiki: '2025–26 Primeira Liga' },
  { country: 'Portugal', name: 'Segunda Liga',        wiki: '2025–26 Liga Portugal 2' },
  { country: 'Portugal', name: 'Liga 3',              wiki: '2025–26 Liga 3 (Portugal)' },
  { country: 'Portugal', name: '2. Division Group A', wiki: 'Campeonato de Portugal' },
  { country: 'Portugal', name: '2. Division Group B', wiki: 'Campeonato de Portugal' },
  { country: 'Portugal', name: 'Liga Revelacao U23',  wiki: 'Liga Revelação' },
  { country: 'Portugal', name: 'Juniores U19',        wiki: 'Campeonato Nacional de Juniores' },
  { country: 'Portugal', name: 'Juniores U17',        wiki: 'Campeonato Nacional de Iniciados' },
  { country: 'Portugal', name: '1st Division Women',  wiki: "Liga BPI" },
  // Spain
  { country: 'Spain', name: 'La Liga',                        wiki: '2025–26 La Liga' },
  { country: 'Spain', name: 'La Liga 2',                      wiki: '2025–26 Segunda División' },
  { country: 'Spain', name: 'Primera RFEF Group 1',           wiki: '2025–26 Primera Federación' },
  { country: 'Spain', name: 'Primera RFEF Group 2',           wiki: '2025–26 Primera Federación' },
  { country: 'Spain', name: 'Segunda RFEF Group 1',           wiki: '2025–26 Segunda Federación' },
  { country: 'Spain', name: 'Segunda RFEF Group 2',           wiki: '2025–26 Segunda Federación' },
  { country: 'Spain', name: 'Segunda RFEF Group 3',           wiki: '2025–26 Segunda Federación' },
  { country: 'Spain', name: 'Segunda RFEF Group 4',           wiki: '2025–26 Segunda Federación' },
  { country: 'Spain', name: 'Segunda RFEF Group 5',           wiki: '2025–26 Segunda Federación' },
  { country: 'Spain', name: 'Primera Division Women',         wiki: '2025–26 Liga F' },
  { country: 'Spain', name: 'Primera Federacion Femenina',    wiki: "2025–26 Primera Federación Femenina" },
  { country: 'Spain', name: 'Segunda Division Femenina',      wiki: "Segunda División Femenina" },
  { country: 'Spain', name: 'Division De Honor Juvenil Grp1', wiki: 'División de Honor Juvenil' },
  { country: 'Spain', name: 'Division De Honor Juvenil Grp2', wiki: 'División de Honor Juvenil' },
  // Netherlands
  { country: 'Netherlands', name: 'Eredivisie',       wiki: '2025–26 Eredivisie' },
  { country: 'Netherlands', name: 'Eerste Divisie',   wiki: '2025–26 Eerste Divisie' },
  { country: 'Netherlands', name: 'Tweede Divisie',   wiki: '2025–26 Tweede Divisie' },
  { country: 'Netherlands', name: 'Eredivisie Women', wiki: '2025–26 Eredivisie Women' },
  { country: 'Netherlands', name: 'U21 Divisie 1',    wiki: 'Beloften Eredivisie' },
  { country: 'Netherlands', name: 'U18 Divisie 1',    wiki: 'Netherlands under-18 football' },
  // Belgium
  { country: 'Belgium', name: 'Pro League',          wiki: '2025–26 Belgian Pro League' },
  { country: 'Belgium', name: 'First Division B',    wiki: '2025–26 Challenger Pro League' },
  { country: 'Belgium', name: 'First Amateur Div',   wiki: '2025–26 Belgian First Amateur Division' },
  { country: 'Belgium', name: 'Super League Women',  wiki: '2025–26 Belgian Super League (women)' },
  { country: 'Belgium', name: '1st National Women',  wiki: '2025–26 Belgian First National Women' },
  { country: 'Belgium', name: 'Reserve Pro League',  wiki: 'Belgian Reserve Pro League' },
  // France
  { country: 'France', name: 'Ligue 1',                 wiki: '2025–26 Ligue 1' },
  { country: 'France', name: 'Ligue 2',                 wiki: '2025–26 Ligue 2' },
  { country: 'France', name: 'National',                wiki: '2025–26 Championnat National' },
  { country: 'France', name: 'CFA Group A',             wiki: 'Championnat National 2' },
  { country: 'France', name: 'CFA Group B',             wiki: 'Championnat National 2' },
  { country: 'France', name: 'Division 1 Women',        wiki: 'Division 1 Féminine' },
  { country: 'France', name: 'Championnat National U19',wiki: 'Championnat National U19' },
  { country: 'France', name: 'Championnat National U17',wiki: 'Championnat National U17' },
  // Germany
  { country: 'Germany', name: 'Bundesliga',         wiki: '2025–26 Bundesliga' },
  { country: 'Germany', name: '2. Bundesliga',      wiki: '2025–26 2. Bundesliga' },
  { country: 'Germany', name: '3. Liga',            wiki: '2025–26 3. Liga' },
  { country: 'Germany', name: 'Regionalliga Nord',  wiki: 'Regionalliga Nord' },
  { country: 'Germany', name: 'Regionalliga West',  wiki: 'Regionalliga West' },
  { country: 'Germany', name: 'Regionalliga Südwest',wiki: 'Regionalliga Südwest' },
  { country: 'Germany', name: 'U17 Bundesliga',     wiki: 'B-Junioren Bundesliga' },
  { country: 'Germany', name: 'Junioren Bundesliga',wiki: 'A-Junioren-Bundesliga (Germany)' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchWikiTitle(query) {
  // Use Wikipedia search to find the best matching page title
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&formatversion=2`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  const json = await res.json();
  const hits = json?.query?.search ?? [];
  return hits[0]?.title ?? null;
}

async function fetchWikiPage(title, retries = 3) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&formatversion=2&redirects=1`;
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) await sleep(3000 * attempt); // backoff: 3s, 6s
    let res;
    try {
      res = await fetch(url, { headers: HEADERS });
    } catch {
      continue;
    }
    if (res.status === 429) { await sleep(5000); continue; }
    if (!res.ok) return { html: null, resolvedTitle: null };
    let json;
    try { json = await res.json(); } catch { continue; } // rate-limit plain-text response
    if (json?.error?.code === 'missingtitle') return { html: null, resolvedTitle: null };
    if (!json?.parse) continue; // unexpected response, retry
    return { html: json.parse.text ?? null, resolvedTitle: json.parse.title ?? title };
  }
  return { html: null, resolvedTitle: null };
}

function extractTeams(html, leagueName) {
  const $ = cheerio.load(html);
  const results = new Set();

  // Strategy 1: wikitables where first col header = Club/Team/Name
  $('table.wikitable').each((_, table) => {
    const headers = $(table).find('tr').first().find('th');
    let clubColIdx = -1;
    headers.each((i, th) => {
      const text = $(th).text().trim().toLowerCase();
      if (['club', 'team', 'name', 'clubs', 'teams'].includes(text)) {
        clubColIdx = i;
        return false; // break
      }
    });

    if (clubColIdx === -1) {
      // Try second row (some tables have merged header rows)
      const secondRow = $(table).find('tr').eq(1).find('th');
      secondRow.each((i, th) => {
        const text = $(th).text().trim().toLowerCase();
        if (['club', 'team', 'name', 'clubs', 'teams'].includes(text)) {
          clubColIdx = i;
          return false;
        }
      });
    }

    if (clubColIdx === -1 && headers.length > 0) {
      // Fallback: assume first column is the team column if table has links to football clubs
      clubColIdx = 0;
    }

    if (clubColIdx === -1) return;

    $(table).find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length === 0) return;
      const cell = $(cells[clubColIdx]);
      // Prefer the linked text (more reliable than cell text which may include notes)
      const link = cell.find('a').first();
      const name = (link.length ? link.text() : cell.text()).trim().replace(/\s+/g, ' ');
      if (name && name.length > 1 && !/^\d/.test(name) && !name.toLowerCase().includes('reserved')) {
        results.add(name);
      }
    });
  });

  // Strategy 2: If no table found, try unordered/ordered lists in a "Clubs" or "Teams" section
  if (results.size === 0) {
    let inSection = false;
    $('h2, h3, ul, ol').each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      if (tag === 'h2' || tag === 'h3') {
        const text = $(el).text().toLowerCase();
        inSection = ['clubs', 'teams', 'participating clubs', 'member clubs'].some((k) => text.includes(k));
      } else if (inSection && (tag === 'ul' || tag === 'ol')) {
        $(el).find('li').each((_, li) => {
          const link = $(li).find('a').first();
          const name = (link.length ? link.text() : $(li).text()).trim().replace(/\s+/g, ' ');
          if (name && name.length > 1) results.add(name);
        });
      }
    });
  }

  return [...results];
}

// ── Load checkpoint ──────────────────────────────────────────────────────────
let checkpoint = existsSync(CHECKPOINT) ? JSON.parse(readFileSync(CHECKPOINT, 'utf8')) : {};

const rows = [];
const todo = [];

for (const league of LEAGUES) {
  const key   = `${league.country}::${league.name}`;
  const saved = checkpoint[key];
  if (saved?.done) {
    for (const club of (saved.clubs ?? [])) {
      rows.push({ country: league.country, league: league.name, club, source: saved.source });
    }
  } else {
    todo.push(league);
  }
}

console.log(`Resuming: ${LEAGUES.length - todo.length} done, ${todo.length} remaining\n`);

// ── Fetch remaining ───────────────────────────────────────────────────────────
let i = 0;
for (const league of todo) {
  i++;
  const key = `${league.country}::${league.name}`;
  process.stdout.write(`[${i}/${todo.length}] ${league.country} — ${league.name} ... `);

  try {
    const { html, resolvedTitle } = await fetchWikiPage(league.wiki);
    await sleep(DELAY_MS);

    if (!html) {
      console.log('page not found');
      checkpoint[key] = { done: true, clubs: [], source: league.wiki };
      writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
      continue;
    }

    const clubs = extractTeams(html, league.name);
    console.log(`${clubs.length} clubs  (${resolvedTitle})`);

    checkpoint[key] = { done: true, clubs, source: resolvedTitle };
    writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));

    for (const club of clubs) {
      rows.push({ country: league.country, league: league.name, club, source: resolvedTitle });
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    checkpoint[key] = { done: false, error: err.message };
    writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
  }
}

// ── Write CSV ─────────────────────────────────────────────────────────────────
const esc    = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const lines  = [
  'country,league,club_name,source',
  ...rows.map((r) => [r.country, r.league, r.club, r.source].map(esc).join(',')),
];

writeFileSync(OUTPUT, lines.join('\n'), 'utf8');
console.log(`\nDone. ${rows.length} clubs written to ${OUTPUT}`);

// Summary of leagues with 0 clubs found
const missing = LEAGUES.filter((l) => {
  const key = `${l.country}::${l.name}`;
  return (checkpoint[key]?.clubs?.length ?? 0) === 0;
});
if (missing.length) {
  console.log(`\n⚠  ${missing.length} leagues with 0 clubs (may need manual review):`);
  missing.forEach((l) => console.log(`   - ${l.country}: ${l.name}  (tried: ${l.wiki})`));
}
