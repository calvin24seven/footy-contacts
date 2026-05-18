/**
 * import-leagues.mjs
 *
 * Reads scripts/clubs.csv and populates:
 *   1. leagues              — one row per distinct (name, country) competition
 *   2. organisation_leagues — season-scoped club→league assignments
 *
 * Then calls apply_season_to_organisations() to push league+level into the
 * organisations.league / organisations.level denormalised columns.
 *
 * Usage:
 *   node scripts/import-leagues.mjs
 *   node scripts/import-leagues.mjs --dry-run
 *   node scripts/import-leagues.mjs --season 2026-27
 *
 * Env vars (from apps/web/.env.local or .env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js"
import { createReadStream } from "fs"
import { parse } from "csv-parse"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { parseArgs } from "util"

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = join(__dirname, "clubs.csv")

// Month names and scraping artefacts to filter out
const JUNK_PATTERN = /^(january|february|march|april|may|june|july|august|september|october|november|december|\[\d+\])$/i
// Compound entries scraped as "Club A / Club B" – skip them
const SLASH_PATTERN = /\//

// ── Country mappings ──────────────────────────────────────────────────────────
// Maps CSV country names → organisations.country (contact-sourced geographic names)
const ORG_COUNTRY_MAP = {
  England:         "United Kingdom",
  Scotland:        "United Kingdom",
  Wales:           "United Kingdom",
  "Northern Ireland": "United Kingdom",
  USA:             "United States",
  Ireland:         "Ireland",
  Germany:         "Germany",
  France:          "France",
  Spain:           "Spain",
  Italy:           "Italy",
  Netherlands:     "Netherlands",
  Portugal:        "Portugal",
  Belgium:         "Belgium",
  Canada:          "Canada",
}

function toOrgCountry(csvCountry) {
  return ORG_COUNTRY_MAP[csvCountry] ?? csvCountry
}

// ── League level mapping ──────────────────────────────────────────────────────
// level 1 = top flight, 2 = second tier, …, null = youth / women's / cup
const LEAGUE_LEVELS = {
  // England
  "England::Premier League":                     1,
  "England::Championship":                       2,
  "England::League One":                         3,
  "England::League Two":                         4,
  "England::Vanarama National League":           5,
  "England::Vanarama National League North":     6,
  "England::Vanarama National League South":     6,
  "England::Women's Super League":               null,
  "England::Women's Championship":               null,
  "England::Women's National League Premier North": null,
  "England::Women's National League Premier South": null,
  "England::Women's National League Div One North": null,
  "England::U18 Professional Development League": null,

  // Scotland
  "Scotland::Premiership":                       1,
  "Scotland::Championship":                      2,
  "Scotland::League One":                        3,
  "Scotland::League Two":                        4,
  "Scotland::Highland League":                   5,
  "Scotland::SWPL 1":                            null,
  "Scotland::SWPL 2":                            null,

  // Germany
  "Germany::Bundesliga":                         1,
  "Germany::2. Bundesliga":                      2,
  "Germany::3. Liga":                            3,
  "Germany::Regionalliga Nord":                  4,
  "Germany::Regionalliga Südwest":               4,
  "Germany::Regionalliga West":                  4,
  "Germany::U17 Bundesliga":                     null,

  // Spain
  "Spain::La Liga":                              1,
  "Spain::La Liga 2":                            2,
  "Spain::Primera RFEF Group 1":                 3,
  "Spain::Primera RFEF Group 2":                 3,
  "Spain::Segunda RFEF Group 1":                 4,
  "Spain::Segunda RFEF Group 2":                 4,
  "Spain::Segunda RFEF Group 3":                 4,
  "Spain::Segunda RFEF Group 4":                 4,
  "Spain::Segunda RFEF Group 5":                 4,
  "Spain::Primera Division Women":               null,

  // France
  "France::Ligue 1":                             1,
  "France::Ligue 2":                             2,
  "France::National":                            3,
  "France::CFA Group A":                         4,
  "France::CFA Group B":                         4,
  "France::Championnat National U17":            null,
  "France::Championnat National U19":            null,
  "France::Division 1 Women":                    null,

  // Netherlands
  "Netherlands::Eredivisie":                     1,
  "Netherlands::Eerste Divisie":                 2,
  "Netherlands::Tweede Divisie":                 3,
  "Netherlands::U21 Divisie 1":                  null,

  // Portugal
  "Portugal::Primeira Liga":                     1,
  "Portugal::Segunda Liga":                      2,
  "Portugal::Liga 3":                            3,
  "Portugal::Juniores U17":                      null,
  "Portugal::Juniores U19":                      null,
  "Portugal::1st Division Women":                null,

  // Ireland
  "Ireland::Premier Division":                   1,
  "Ireland::First Division":                     2,

  // Northern Ireland
  "Northern Ireland::Premiership":               1,
  "Northern Ireland::Championship":              2,
  "Northern Ireland::Premiership Development League": null,

  // Belgium
  "Belgium::Pro League":                         1,
  "Belgium::First Division B":                   2,

  // Canada
  "Canada::Canadian Premier League":             1,
  "Canada::Northern Super League":               null,
  "Canada::League 1 BC":                         3,

  // USA
  "USA::MLS":                                    1,
  "USA::USL Championship":                       2,
  "USA::MLS Next Pro":                           2,
  "USA::USL League One":                         3,
  "USA::NISA":                                   3,
  "USA::USL League Two":                         4,
  "USA::NPSL":                                   4,
  "USA::NWSL":                                   null,
  "USA::USL Super League":                       null,
  "USA::USL W League":                           null,
  "USA::WPSL":                                   null,

  // Wales
  "Wales::Premier League":                       1,
  "Wales::FAW Championship":                     2,
  "Wales::FAW Championship - South":             3,
}

function leagueLevel(country, leagueName) {
  const key = `${country}::${leagueName}`
  return key in LEAGUE_LEVELS ? LEAGUE_LEVELS[key] : null
}

// ── Gender detection ──────────────────────────────────────────────────────────
function leagueGender(leagueName) {
  const lower = leagueName.toLowerCase()
  if (
    lower.includes("women") ||
    lower.includes("wsl") ||
    lower.includes("nwsl") ||
    lower.includes("wpsl") ||
    lower.includes("swpl") ||
    lower.includes("feminin") ||
    lower.includes("femenin")
  ) return "women"
  return "men"
}

// ── Club name aliases ─────────────────────────────────────────────────────────
// Maps normalised CSV club name → normalised DB name, for cases where there
// is NO substring relationship (e.g. "Lille" → "LOSC").
// Keyed by the output of normalise(csvClubName).
const CLUB_ALIASES = {
  // France — official names differ from common/short names
  "lille":                      "losc",
  "rennes":                     "stade rennais fc",
  "bordeaux":                   "fc girondins de bordeaux",
  // Germany — common names differ from official registered names
  "hamburger sv":               "hsv",
  "borussia monchengladbach":   "borussia vfl 1900 monchengladbach",
  // England — nicknames used instead of full names
  "wolverhampton wanderers":    "wolves",
  "queens park rangers":        "qpr fc",
  // Spain — common short names
  "atletico madrid":            "club atletico de madrid",
  "atletico de madrid":         "club atletico de madrid",
  // Netherlands
  "den haag":                   "ado den haag",
}


function toSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function leagueSlug(country, leagueName) {
  return `${toSlug(leagueName)}-${toSlug(country)}`
}

// ── Name normalisation for club matching ──────────────────────────────────────
function normalise(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// ── CSV parsing ───────────────────────────────────────────────────────────────
async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on("data", (row) => rows.push(row))
      .on("end",  () => resolve(rows))
      .on("error", reject)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { values: args } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      season:    { type: "string",  default: "2025-26" },
    },
    strict: false,
  })

  const DRY_RUN = args["dry-run"]
  const SEASON  = args.season

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars")
    console.error("   Load them from apps/web/.env.local or set them in your shell")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 1. Parse + clean CSV ───────────────────────────────────────────────────
  console.log(`\n📂 Reading ${CSV_PATH}`)
  const raw = await readCsv(CSV_PATH)
  console.log(`   ${raw.length} raw rows`)

  const rows = raw.filter((r) => {
    const name = (r.club_name ?? "").trim()
    if (!name) return false
    if (JUNK_PATTERN.test(name)) return false
    if (SLASH_PATTERN.test(name)) return false
    return true
  })
  console.log(`   ${rows.length} clean rows (${raw.length - rows.length} junk filtered)`)

  // ── 2. Build distinct leagues ──────────────────────────────────────────────
  const leagueMap = new Map() // "country::name" → {name, country, level, gender, slug}
  for (const r of rows) {
    const country = r.country.trim()
    const name    = r.league.trim()
    const key     = `${country}::${name}`
    if (!leagueMap.has(key)) {
      leagueMap.set(key, {
        name,
        country,
        level:  leagueLevel(country, name),
        gender: leagueGender(name),
        slug:   leagueSlug(country, name),
      })
    }
  }

  console.log(`\n🏆 ${leagueMap.size} distinct leagues to upsert:`)
  for (const [k, v] of leagueMap) {
    console.log(`   ${k.padEnd(50)} level=${String(v.level).padStart(4)}  gender=${v.gender}`)
  }

  if (!DRY_RUN) {
    const leagueRows = [...leagueMap.values()]
    const { error } = await supabase
      .from("leagues")
      .upsert(leagueRows, { onConflict: "name,country" })

    if (error) {
      console.error("❌ Failed to upsert leagues:", error.message)
      process.exit(1)
    }
    console.log("   ✅ Leagues upserted")
  }

  // ── 3. Fetch league id map from DB ─────────────────────────────────────────
  let leagueIdMap = new Map() // "country::name" → uuid
  if (!DRY_RUN) {
    const { data: dbLeagues, error } = await supabase
      .from("leagues")
      .select("id, name, country")
    if (error || !dbLeagues) {
      console.error("❌ Failed to fetch leagues from DB:", error?.message)
      process.exit(1)
    }
    for (const l of dbLeagues) {
      leagueIdMap.set(`${l.country}::${l.name}`, l.id)
    }
  }

  // ── 4. Bulk-fetch all organisations (avoids N+1 queries) ──────────────────
  console.log(`\n🔍 Fetching all organisations for matching…`)

  const allOrgCountries = [...new Set(rows.map((r) => toOrgCountry(r.country.trim())))]
  const { data: allOrgs, error: orgsError } = await supabase
    .from("organisations")
    .select("id, name, normalised_name, slug, country")
    .in("country", allOrgCountries)

  if (orgsError || !allOrgs) {
    console.error("❌ Failed to fetch organisations:", orgsError?.message)
    process.exit(1)
  }
  console.log(`   Loaded ${allOrgs.length} organisations for ${allOrgCountries.length} countries`)

  // Build lookup maps by country → list of orgs.
  // Re-apply JS normalise() to DB's normalised_name so accent stripping is consistent.
  // (DB normalised_name is just lowercased; our JS normalise() also strips diacritics.)
  /** @type {Map<string, Array<{id:string, name:string, normalised_name:string, slug:string}>>} */
  const orgsByCountry = new Map()
  for (const org of allOrgs) {
    if (!orgsByCountry.has(org.country)) orgsByCountry.set(org.country, [])
    orgsByCountry.get(org.country).push({
      ...org,
      normalised_name: normalise(org.normalised_name ?? org.name),
    })
  }

  // ── 5. Match clubs in-memory ───────────────────────────────────────────────
  console.log(`\n🔍 Matching ${rows.length} clubs to organisations…`)

  const assignments = []
  const unmatched   = []

  for (const r of rows) {
    const csvCountry  = r.country.trim()
    const leagueName  = r.league.trim()
    const clubName    = r.club_name.trim()
    const orgCountry  = toOrgCountry(csvCountry)
    const normClub    = normalise(clubName)
    const candidates  = orgsByCountry.get(orgCountry) ?? []

    let org = null

    // Alias lookup: map known common names → official DB normalised_name
    const aliasedNorm = CLUB_ALIASES[normClub] ?? normClub

    // Pass 1: exact normalised_name match (try both raw and aliased)
    org = candidates.find((o) => o.normalised_name === normClub || o.normalised_name === aliasedNorm) ?? null

    // Pass 2: CSV name is contained in org's normalised_name (e.g. "Arsenal" in "arsenal fc")
    // Require the CSV name to be at least 30% of the org name length to avoid false positives
    // (e.g. "Celtic" [6 chars] must not match "Farsley Celtic Football Club" [28 chars])
    if (!org) {
      org = candidates.find((o) => {
        const n = o.normalised_name ?? ""
        const ratio = n.length > 0 ? normClub.length / n.length : 0
        if (ratio >= 0.3 && n.includes(normClub)) return true
        const aRatio = n.length > 0 ? aliasedNorm.length / n.length : 0
        if (aRatio >= 0.3 && n.includes(aliasedNorm)) return true
        return false
      }) ?? null
    }

    // Pass 3: org's normalised_name is contained in CSV name (e.g. "fc barcelona" in "fc barcelona b")
    if (!org) {
      org = candidates.find((o) => o.normalised_name && normClub.includes(o.normalised_name)) ?? null
    }

    // Pass 4: first-word match on longer names (e.g. "manchester" matches "Manchester City Football Club")
    if (!org) {
      const firstWord = normClub.split(" ")[0]
      if (firstWord.length > 4) {
        const firstWordMatches = candidates.filter((o) => o.normalised_name?.startsWith(firstWord))
        if (firstWordMatches.length === 1) org = firstWordMatches[0]
      }
    }

    if (!org) {
      unmatched.push({ csvCountry, leagueName, clubName, orgCountry })
      continue
    }

    const leagueKey = `${csvCountry}::${leagueName}`
    const leagueId  = leagueIdMap.get(leagueKey)

    assignments.push({
      organisation_id: org.id,
      league_id:       leagueId ?? null,
      season:          SEASON,
      _debug: { csvCountry, leagueName, clubName, orgName: org.name, orgSlug: org.slug },
    })
  }

  console.log(`   ✅ ${assignments.length} matched`)
  console.log(`   ⚠️  ${unmatched.length} unmatched`)

  if (unmatched.length > 0) {
    console.log("\n   Unmatched clubs:")
    for (const u of unmatched) {
      console.log(`     [${u.csvCountry} / ${u.leagueName}] "${u.clubName}" (looking in country="${u.orgCountry}")`)
    }
  }

  // ── 6. Insert organisation_leagues ────────────────────────────────────────
  if (!DRY_RUN) {
    // Clear existing assignments for this season so stale/wrong rows are removed
    const { error: deleteError } = await supabase
      .from("organisation_leagues")
      .delete()
      .eq("season", SEASON)
    if (deleteError) {
      console.error("❌ Failed to clear old assignments:", deleteError.message)
      process.exit(1)
    }
    console.log(`\n🗑  Cleared existing organisation_leagues for season ${SEASON}`)

    // Deduplicate: same org can appear in multiple CSV rows (e.g. Spanish groups).
    // Keep the first assignment per org (CSV is ordered highest-tier first).
    const seenOrgs = new Set()
    const validAssignments = assignments
      .filter((a) => a.league_id !== null)
      .filter((a) => {
        if (seenOrgs.has(a.organisation_id)) return false
        seenOrgs.add(a.organisation_id)
        return true
      })
      .map(({ organisation_id, league_id, season }) => ({ organisation_id, league_id, season }))

    if (validAssignments.length > 0) {
      // Batch insert in chunks to avoid payload size limits
      const CHUNK = 100
      let inserted = 0
      for (let i = 0; i < validAssignments.length; i += CHUNK) {
        const chunk = validAssignments.slice(i, i + CHUNK)
        const { error } = await supabase
          .from("organisation_leagues")
          .upsert(chunk, { onConflict: "organisation_id,season" })
        if (error) {
          console.error(`❌ Batch ${i / CHUNK + 1} failed:`, error.message)
        } else {
          inserted += chunk.length
        }
      }
      console.log(`\n📋 ${inserted} organisation_leagues rows upserted`)
    }

    // ── 7. Sync organisations.league + organisations.level ─────────────────
    console.log(`\n🔄 Calling apply_season_to_organisations('${SEASON}')…`)
    const { data: updated, error: syncError } = await supabase.rpc(
      "apply_season_to_organisations",
      { p_season: SEASON },
    )
    if (syncError) {
      console.error("❌ Sync failed:", syncError.message)
    } else {
      console.log(`   ✅ ${updated} organisations updated`)
    }
  } else {
    console.log("\n⏭️  Dry run — no DB writes performed")
  }

  // ── 8. Summary ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════")
  console.log(`  Season:     ${SEASON}`)
  console.log(`  Leagues:    ${leagueMap.size}`)
  console.log(`  Matched:    ${assignments.length}`)
  console.log(`  Unmatched:  ${unmatched.length}`)
  console.log(`  Dry run:    ${DRY_RUN}`)
  console.log("═══════════════════════════════════════════════════════\n")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
