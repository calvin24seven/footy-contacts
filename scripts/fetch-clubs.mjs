/**
 * Fetches all clubs for the 2025/26 season across target leagues via SportMonks v3 API.
 *
 * Setup:
 *   set SPORTMONKS_API_KEY=your_token_here   (PowerShell: $env:SPORTMONKS_API_KEY="...")
 *
 * Run:    node scripts/fetch-clubs.mjs
 * Output: scripts/clubs.csv
 *
 * Resumable — progress saved to scripts/fetch-clubs-checkpoint.json
 * Rate limit: ~1 req/sec (well under 3000/hour)
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.SPORTMONKS_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set $env:SPORTMONKS_API_KEY before running.');
  process.exit(1);
}
const BASE        = 'https://api.sportmonks.com/v3/football';
const DELAY_MS    = 1100; // ~54 req/min — safely under 3000/hour
const CHECKPOINT  = join(__dirname, 'fetch-clubs-checkpoint.json');
const OUTPUT      = join(__dirname, 'clubs.csv');

// ── Target leagues ───────────────────────────────────────────────────────────
const LEAGUES = [
  // England
  { country: 'England', name: 'Premier League',                          id: 8    },
  { country: 'England', name: 'Championship',                            id: 9    },
  { country: 'England', name: 'League One',                              id: 12   },
  { country: 'England', name: 'League Two',                              id: 14   },
  { country: 'England', name: 'National League',                         id: 17   },
  { country: 'England', name: 'Vanarama National League North',          id: 20   },
  { country: 'England', name: 'Vanarama National League South',          id: 1092 },
  { country: 'England', name: 'Premier League 2 Division One',           id: 1560 },
  { country: 'England', name: 'Premier League 2 Division Two',           id: 1351 },
  { country: 'England', name: 'Premier League U18',                      id: 42   },
  { country: 'England', name: 'Professional Development League',         id: 48   },
  { country: 'England', name: 'U18 Professional Development League',     id: 2768 },
  { country: 'England', name: 'WSL 1 Women',                             id: 45   },
  { country: 'England', name: 'WSL 2 Women',                             id: 44   },
  { country: 'England', name: "Women's National League - Premier North", id: 1971 },
  { country: 'England', name: "Women's National League - Premier South", id: 1972 },
  { country: 'England', name: "Women's National League Div One North",   id: 1969 },
  { country: 'England', name: "Women's National League Div One Midlands",id: 1970 },
  { country: 'England', name: "Women's National League Div One SE",      id: 1968 },
  { country: 'England', name: "Women's National League Div One SW",      id: 1967 },
  { country: 'England', name: 'Non League Premier: Isthmian',            id: 51   },
  { country: 'England', name: 'Non League Premier: Northern',            id: 68   },
  { country: 'England', name: 'Non League Premier: Southern Central',    id: 69   },
  { country: 'England', name: 'Non League Premier: Southern South',      id: 1805 },
  { country: 'England', name: 'Non League Div One: Isthmian North',      id: 53   },
  { country: 'England', name: 'Non League Div One: Isthmian SC',         id: 1949 },
  { country: 'England', name: 'Non League Div One: Isthmian SE',         id: 1950 },
  { country: 'England', name: 'Non League Div One: Northern East',       id: 2329 },
  { country: 'England', name: 'Non League Div One: Northern Midlands',   id: 2330 },
  { country: 'England', name: 'Non League Div One: Northern West',       id: 2331 },
  { country: 'England', name: 'Non League Div One: Southern Central',    id: 54   },
  { country: 'England', name: 'Non League Div One: Southern South',      id: 2332 },
  // Scotland
  { country: 'Scotland', name: 'Premiership',                  id: 501  },
  { country: 'Scotland', name: 'Championship',                 id: 504  },
  { country: 'Scotland', name: 'League One',                   id: 516  },
  { country: 'Scotland', name: 'League Two',                   id: 519  },
  { country: 'Scotland', name: 'Highland League',              id: 2463 },
  { country: 'Scotland', name: 'Football League',              id: 1547 },
  { country: 'Scotland', name: 'SWPL 1',                       id: 2398 },
  { country: 'Scotland', name: 'SWPL 2',                       id: 2399 },
  { country: 'Scotland', name: "Women's Championship",         id: 2400 },
  { country: 'Scotland', name: 'Reserve League',               id: 1643 },
  // Wales
  { country: 'Wales', name: 'Premier League',                  id: 624  },
  { country: 'Wales', name: 'FAW Championship',                id: 1738 },
  { country: 'Wales', name: 'FAW Championship - South',        id: 3499 },
  { country: 'Wales', name: "Welsh Premier Women's League",    id: 2868 },
  // Republic of Ireland
  { country: 'Ireland', name: 'Premier Division',              id: 360  },
  { country: 'Ireland', name: 'First Division',                id: 363  },
  { country: 'Ireland', name: "Women's National League",       id: 1945 },
  { country: 'Ireland', name: 'U19 National League',           id: 2670 },
  { country: 'Ireland', name: 'U20 National League',           id: 3335 },
  // Northern Ireland
  { country: 'Northern Ireland', name: 'Premiership',                    id: 438  },
  { country: 'Northern Ireland', name: 'Championship',                   id: 441  },
  { country: 'Northern Ireland', name: 'Premiership Development League', id: 1609 },
  // USA
  { country: 'USA', name: 'MLS',              id: 779  },
  { country: 'USA', name: 'USL Championship', id: 791  },
  { country: 'USA', name: 'USL League One',   id: 1607 },
  { country: 'USA', name: 'USL League Two',   id: 794  },
  { country: 'USA', name: 'NISA',             id: 1803 },
  { country: 'USA', name: 'NPSL',             id: 1804 },
  { country: 'USA', name: 'NWSL',             id: 2328 },
  { country: 'USA', name: 'USL W League',     id: 2606 },
  { country: 'USA', name: 'USL Super League', id: 3385 },
  { country: 'USA', name: 'MLS Next Pro',     id: 2669 },
  { country: 'USA', name: 'WPSL',             id: 2312 },
  // Canada
  { country: 'Canada', name: 'Canadian Premier League', id: 1689 },
  { country: 'Canada', name: 'League 1 Ontario',        id: 1900 },
  { country: 'Canada', name: 'League 1 BC',             id: 2608 },
  { country: 'Canada', name: 'Northern Super League',   id: 3464 },
  // Portugal
  { country: 'Portugal', name: 'Primeira Liga',       id: 462  },
  { country: 'Portugal', name: 'Segunda Liga',        id: 465  },
  { country: 'Portugal', name: 'Liga 3',              id: 2348 },
  { country: 'Portugal', name: '2. Division Group A', id: 1228 },
  { country: 'Portugal', name: '2. Division Group B', id: 1229 },
  { country: 'Portugal', name: 'Liga Revelacao U23',  id: 1599 },
  { country: 'Portugal', name: 'Juniores U19',        id: 2394 },
  { country: 'Portugal', name: 'Juniores U17',        id: 2726 },
  { country: 'Portugal', name: '1st Division Women',  id: 2415 },
  // Spain
  { country: 'Spain', name: 'La Liga',                        id: 564  },
  { country: 'Spain', name: 'La Liga 2',                      id: 567  },
  { country: 'Spain', name: 'Primera RFEF Group 1',           id: 2333 },
  { country: 'Spain', name: 'Primera RFEF Group 2',           id: 2334 },
  { country: 'Spain', name: 'Segunda RFEF Group 1',           id: 2336 },
  { country: 'Spain', name: 'Segunda RFEF Group 2',           id: 2337 },
  { country: 'Spain', name: 'Segunda RFEF Group 3',           id: 2338 },
  { country: 'Spain', name: 'Segunda RFEF Group 4',           id: 2339 },
  { country: 'Spain', name: 'Segunda RFEF Group 5',           id: 2340 },
  { country: 'Spain', name: 'Primera Division Women',         id: 1568 },
  { country: 'Spain', name: 'Primera Federacion Femenina',    id: 2866 },
  { country: 'Spain', name: 'Segunda Division Femenina',      id: 2344 },
  { country: 'Spain', name: 'Division De Honor Juvenil Grp1', id: 2495 },
  { country: 'Spain', name: 'Division De Honor Juvenil Grp2', id: 2496 },
  // Netherlands
  { country: 'Netherlands', name: 'Eredivisie',      id: 72   },
  { country: 'Netherlands', name: 'Eerste Divisie',  id: 74   },
  { country: 'Netherlands', name: 'Tweede Divisie',  id: 77   },
  { country: 'Netherlands', name: 'Eredivisie Women',id: 80   },
  { country: 'Netherlands', name: 'U21 Divisie 1',   id: 2859 },
  { country: 'Netherlands', name: 'U18 Divisie 1',   id: 2831 },
  // Belgium
  { country: 'Belgium', name: 'Pro League',          id: 208  },
  { country: 'Belgium', name: 'First Division B',    id: 211  },
  { country: 'Belgium', name: 'First Amateur Div',   id: 1418 },
  { country: 'Belgium', name: 'Super League Women',  id: 1571 },
  { country: 'Belgium', name: '1st National Women',  id: 1572 },
  { country: 'Belgium', name: 'Reserve Pro League',  id: 1608 },
  // France
  { country: 'France', name: 'Ligue 1',                   id: 301  },
  { country: 'France', name: 'Ligue 2',                   id: 304  },
  { country: 'France', name: 'National',                   id: 313  },
  { country: 'France', name: 'CFA Group A',                id: 1177 },
  { country: 'France', name: 'CFA Group B',                id: 1178 },
  { country: 'France', name: 'Division 1 Women',           id: 1575 },
  { country: 'France', name: 'Championnat National U19',   id: 2787 },
  { country: 'France', name: 'Championnat National U17',   id: 2850 },
  // Germany
  { country: 'Germany', name: 'Bundesliga',        id: 82   },
  { country: 'Germany', name: '2. Bundesliga',     id: 85   },
  { country: 'Germany', name: '3. Liga',           id: 88   },
  { country: 'Germany', name: 'Regionalliga Nord', id: 91   },
  { country: 'Germany', name: 'Regionalliga West', id: 106  },
  { country: 'Germany', name: 'Regionalliga Südwest',id: 103},
  { country: 'Germany', name: 'U17 Bundesliga',    id: 2771 },
  { country: 'Germany', name: 'Junioren Bundesliga',id: 1422},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(path) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_token=${API_KEY}`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (res.status === 404) return { data: null };
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

/** Returns the best season id for 2025/26 or 2026 from a league's seasons list */
function pickSeason(seasons) {
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const TARGETS = ['2025/2026', '2026', '2025/26', '2026/27'];
  for (const target of TARGETS) {
    const match = seasons.find((s) => s.name === target);
    if (match) return match;
  }
  // Fallback: latest season by id
  return seasons.sort((a, b) => b.id - a.id)[0];
}

// ── Load checkpoint ───────────────────────────────────────────────────────────
let checkpoint = existsSync(CHECKPOINT) ? JSON.parse(readFileSync(CHECKPOINT, 'utf8')) : {};
// checkpoint shape: { [leagueId]: { done: true, seasonId, seasonName, teams: [{id,name,short_code}] } | { done: false, error } }

const rows   = []; // accumulated club rows from checkpoint
const todo   = []; // leagues still to process

for (const league of LEAGUES) {
  const saved = checkpoint[league.id];
  if (saved?.done && saved.teams) {
    for (const t of saved.teams) {
      rows.push({ ...league, season_id: saved.seasonId, season_name: saved.seasonName, club_id: t.id, club_name: t.name, short_code: t.short_code ?? '' });
    }
  } else {
    todo.push(league);
  }
}

console.log(`Resuming: ${LEAGUES.length - todo.length} done, ${todo.length} remaining`);

// ── Fetch remaining ───────────────────────────────────────────────────────────
let i = 0;
for (const league of todo) {
  i++;
  process.stdout.write(`[${i}/${todo.length}] ${league.country} — ${league.name} (id:${league.id}) ... `);

  try {
    // 1. Get league with seasons included
    const leagueRes = await apiGet(`/leagues/${league.id}?include=seasons`);
    const season = pickSeason(leagueRes.data?.seasons ?? []);

    if (!season) {
      console.log('no seasons found, skipping');
      checkpoint[league.id] = { done: true, seasonId: null, seasonName: null, teams: [] };
      writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
      await sleep(DELAY_MS);
      continue;
    }

    await sleep(DELAY_MS);

    // 2. Get teams for that season (paginated)
    let teams = [];
    let page = 1;
    while (true) {
      const teamsRes = await apiGet(`/teams/seasons/${season.id}?per_page=50&page=${page}`);
      const data = Array.isArray(teamsRes.data) ? teamsRes.data : [];
      teams.push(...data);
      const pagination = teamsRes.pagination;
      if (!pagination?.has_more) break;
      page++;
      await sleep(DELAY_MS);
    }

    console.log(`season "${season.name}" (${season.id}), ${teams.length} clubs`);

    const teamsSummary = teams.map((t) => ({ id: t.id, name: t.name, short_code: t.short_code ?? '' }));
    checkpoint[league.id] = { done: true, seasonId: season.id, seasonName: season.name, teams: teamsSummary };
    writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));

    for (const t of teamsSummary) {
      rows.push({ ...league, season_id: season.id, season_name: season.name, club_id: t.id, club_name: t.name, short_code: t.short_code });
    }

    await sleep(DELAY_MS);
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log('rate limited — waiting 60s...');
      await sleep(60_000);
      todo.push(league); // retry at end
    } else {
      console.log(`ERROR: ${err.message}`);
      checkpoint[league.id] = { done: false, error: err.message };
      writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
    }
  }
}

// ── Write CSV ─────────────────────────────────────────────────────────────────
const esc    = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const header = 'country,league_name,league_id,season_name,season_id,club_name,club_id,short_code';
const lines  = [
  header,
  ...rows.map((r) =>
    [r.country, r.name, r.id, r.season_name, r.season_id, r.club_name, r.club_id, r.short_code]
      .map(esc).join(',')
  ),
];

writeFileSync(OUTPUT, lines.join('\n'), 'utf8');
console.log(`\nDone. ${rows.length} clubs written to ${OUTPUT}`);
