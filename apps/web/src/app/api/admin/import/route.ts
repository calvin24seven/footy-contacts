import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Apollo/LinkedIn CSV column aliases → canonical contact field names.
// Special keys prefixed with _ are handled in buildContact().
const COLUMN_MAP: Record<string, string> = {
  // Name
  name: "name",
  full_name: "name",
  contact_name: "name",
  first_name: "_first_name",
  last_name: "_last_name",

  // Role — prefer Title over Headline (both map; Title processed last so it wins)
  headline: "role",
  title: "role",
  job_title: "role",
  position: "role",

  // Organisation — cleaned_company_name preferred; company_name is fallback
  organisation: "organisation",
  organization: "organisation",
  club: "organisation",
  company: "organisation",
  cleaned_company_name: "organisation",
  company_name: "_org_fallback",

  // Location — use Lead fields (person's location), NOT company address
  country: "country",
  lead_country: "country",
  city: "city",
  lead_city: "city",
  region: "region",
  lead_state: "region",

  // Contact
  email: "email",
  email_address: "email",
  email_status: "_email_status",
  phone: "phone",
  phone_number: "phone",
  mobile: "phone",
  company_phone_number: "_phone_fallback",

  // Web / social
  website: "website",
  company_website_full: "_website_fallback",
  company_website_short: "_website_fallback",
  linkedin_url: "linkedin_url",
  linkedin_link: "linkedin_url",
  linkedin: "linkedin_url",
  x_url: "x_url",
  twitter: "x_url",
  company_twitter_link: "_x_fallback",
  instagram_url: "instagram_url",
  instagram: "instagram_url",

  // Content
  source: "source",
  notes: "notes",
  company_short_description: "_description",   // → notes (cleaned, truncated)
  company_keywords: "_keywords",               // → tags (JSON array, deduped)
  tags: "tags",

  // Ignored: company_seo_description (spam/foreign), company_technologies
  // (always duplicated), company_* address/revenue/funding fields, seniority
}

// ── Formatting helpers ─────────────────────────────────────────────────────

/**
 * Known football/sports acronyms that should stay uppercase.
 * Maps ALL-CAPS source → canonical display form (handles VFL→VfL etc).
 */
const ORG_ACRONYM_CANONICAL: Record<string, string> = {
  FC: "FC", SC: "SC", BC: "BC", AC: "AC", AFC: "AFC", CF: "CF", IF: "IF",
  BV: "BV", RB: "RB", PEC: "PEC", DC: "DC", QPR: "QPR", FK: "FK", SK: "SK",
  BK: "BK", IK: "IK", GK: "GK", NK: "NK", HK: "HK", AS: "AS", SS: "SS",
  US: "US", UD: "UD", SD: "SD", CD: "CD", AD: "AD", RCD: "RCD", CE: "CE",
  SV: "SV", VFL: "VfL", VFB: "VfB", TSG: "TSG", FSV: "FSV", BSC: "BSC",
  HSV: "HSV", MSV: "MSV", PSV: "PSV", LOSC: "LOSC", OGC: "OGC", RC: "RC",
  GD: "GD", GFC: "GFC", MFC: "MFC", WFC: "WFC", SAF: "SAF", KAA: "KAA",
  KRC: "KRC", KV: "KV", RSC: "RSC", RSCA: "RSCA",
}

/** Prepositions/articles that belong lowercase when they appear mid-name. */
const ORG_SMALL_WORDS = new Set([
  "de", "da", "di", "do", "del", "della", "delle", "degli",
  "van", "von", "und", "le", "la", "les", "et", "du", "y", "e",
  "of", "the", "and",
])

/**
 * Normalise organisation/club name capitalisation.
 * - ALL-CAPS words of 3+ chars → title-case unless a known acronym
 * - 2-char ALL-CAPS words → kept as-is (AC, SC, FC etc. handled via acronym map)
 * - Mixed-case words are left untouched (intentional formatting respected)
 * - Prepositions/articles mid-name → forced lowercase
 * - Collapses multiple spaces
 */
function normaliseOrganisation(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ")
  return words
    .map((word, i) => {
      if (!word) return word
      const upper = word.toUpperCase()
      const lower = word.toLowerCase()

      // All-caps word
      if (word === upper && /[A-Z]/.test(word)) {
        // Known acronym → use canonical form
        if (ORG_ACRONYM_CANONICAL[upper]) return ORG_ACRONYM_CANONICAL[upper]
        // Short (≤2 chars) unknown acronym → leave as-is
        if (word.length <= 2) return word
        // Mid-name small word → lowercase
        if (i > 0 && ORG_SMALL_WORDS.has(lower)) return lower
        // Regular word in all-caps → title-case
        return word[0] + word.slice(1).toLowerCase()
      }

      // Mixed-case word: only fix prepositions/articles that were capitalised mid-name
      if (i > 0 && ORG_SMALL_WORDS.has(lower) && word[0] === word[0].toUpperCase()) {
        return lower
      }

      return word
    })
    .join(" ")
}

/**
 * Normalise a person's full name.
 * - ALL-CAPS → title-case with Mc/Mac/O' prefix awareness
 * - all-lowercase → title-case
 * - Already mixed-case → left untouched
 * - Collapses extra whitespace
 */
function normaliseName(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim()
  const upper = trimmed.toUpperCase()
  const lower = trimmed.toLowerCase()
  // If already mixed-case, don't touch it
  if (trimmed !== upper && trimmed !== lower) return trimmed

  // Apply title case with prefix handling
  return trimmed
    .split(" ")
    .map((word) => {
      if (!word) return word
      // Handle Mc/Mac prefixes: "mcdonald" → "McDonald"
      const mcMatch = word.toLowerCase().match(/^(mc|mac)(.+)/)
      if (mcMatch) {
        return mcMatch[1][0].toUpperCase() + mcMatch[1].slice(1).toLowerCase() +
          mcMatch[2][0].toUpperCase() + mcMatch[2].slice(1).toLowerCase()
      }
      // Handle O' prefix: "o'brien" → "O'Brien"
      const oMatch = word.toLowerCase().match(/^(o')(.+)/)
      if (oMatch) {
        return "O'" + oMatch[2][0].toUpperCase() + oMatch[2].slice(1).toLowerCase()
      }
      return word[0].toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

/**
 * Known country name aliases → canonical English name.
 * Handles variant spellings produced by different data sources.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  "tuerkiye": "Turkey",
  "türkiye": "Turkey",
  "uk": "United Kingdom",
  "great britain": "United Kingdom",
  "england": "United Kingdom",
  "usa": "United States",
  "united states of america": "United States",
  "u.s.a.": "United States",
  "u.s.": "United States",
  "korea, republic of": "South Korea",
  "republic of ireland": "Ireland",
  "côte d'ivoire": "Cote d'Ivoire",
  "ivory coast": "Cote d'Ivoire",
}

function normaliseCountry(text: string): string {
  const canonical = COUNTRY_ALIASES[text.toLowerCase().trim()]
  return canonical ?? text.trim()
}

/**
 * Strip telephone extension suffixes — these indicate a company switchboard,
 * not a direct line, and the extension is useless without an internal directory.
 * "+44 800 169 1863 ext 6300" → "+44 800 169 1863"
 */
function normalisePhone(text: string): string {
  return text.replace(/\s*(ext\.?|x)\s*\d+$/i, "").trim()
}

// ── Role translation ────────────────────────────────────────────────────────

/** Non-English job title translations (common in European football data). */
const ROLE_TRANSLATIONS: Record<string, string> = {
  // Italian
  "operaio": "Operational Staff",
  "impiegato": "Administrative Staff",
  "responsabile": "Manager",
  "direttore sportivo": "Sporting Director",
  "allenatore": "Coach",
  "preparatore atletico": "Fitness Coach",
  "addetto stampa": "Press Officer",
  "fisioterapista": "Physiotherapist",
  "medico sportivo": "Sports Doctor",
  "osservatore": "Scout",
  "calciatore": "Footballer",
  "calciatore professionista": "Professional Footballer",
  "portiere": "Goalkeeper",
  "difensore": "Defender",
  "centrocampista": "Midfielder",
  "attaccante": "Forward",
  // Spanish
  "responsable": "Manager",
  "directeur": "Director",
  "entrenador": "Coach",
  "preparador físico": "Fitness Coach",
  "director deportivo": "Sporting Director",
  "director general": "General Director",
  "director técnico": "Technical Director",
  "secretario": "Secretary",
  "presidente": "President",
  "vicepresidente": "Vice President",
  "fisioterapeuta": "Physiotherapist",
  "jugador de fútbol": "Footballer",
  "nutricionista": "Nutritionist",
  "preparador fisico": "Fitness Coach",
  "coach de fútbol": "Football Coach",
  // French
  "directeur général": "General Director",
  "directeur sportif": "Sporting Director",
  "entraîneur": "Coach",
  "préparateur physique": "Fitness Coach",
  "joueur de football": "Footballer",
  "coach de football": "Football Coach",
  // German
  "geschäftsführer": "Managing Director",
  "trainer": "Coach",
  "cheftrainer": "Head Coach",
  "sportdirektor": "Sporting Director",
  "physiotherapeut": "Physiotherapist",
  // Dutch
  "voetballer": "Footballer",
  "professioneel voetballer": "Professional Footballer",
}

function cleanRole(role: string): string {
  const lower = role.toLowerCase().trim()
  // Exact match
  if (ROLE_TRANSLATIONS[lower]) return ROLE_TRANSLATIONS[lower]
  // Prefix match (e.g. "directeur sportif adjoint")
  for (const [key, val] of Object.entries(ROLE_TRANSLATIONS)) {
    if (lower.startsWith(key + " ")) return val + role.slice(key.length)
  }
  // Apply title-case if the role is all-caps or all-lowercase after translation
  const upper = role.toUpperCase()
  const lowerRole = role.toLowerCase()
  if (role === upper || role === lowerRole) {
    return role
      .split(" ")
      .map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)
      .join(" ")
  }
  return role
}

// Returns true if the string is mostly ASCII (English-language heuristic)
function isEnglishLike(text: string): boolean {
  if (!text || text.length === 0) return false
  const ascii = (text.match(/[\x20-\x7E]/g) ?? []).length
  return ascii / text.length > 0.8
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** Split CSV text into records, ignoring newlines inside quoted fields. */
function splitCSVRecords(text: string): string[] {
  const records: string[] = []
  const t = text.trimEnd()
  let start = 0
  let inQ = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (ch === '"') {
      if (inQ && t[i + 1] === '"') i++
      else inQ = !inQ
    } else if (!inQ && ch === '\n') {
      const rec = t.slice(start, i).replace(/\r$/, '')
      if (rec.trim()) records.push(rec)
      start = i + 1
    }
  }
  const last = t.slice(start).trimEnd()
  if (last.trim()) records.push(last)
  return records
}

function buildContact(
  headerMap: Array<string | null>,
  rawHeaders: string[],
  values: string[]
): Record<string, unknown> {
  const contact: Record<string, unknown> = {
    visibility_status: "hidden",
    import_status: "draft",
    suppression_status: "active",
    source: "csv_import",
    verified_status: "unverified",
  }

  let firstName = ""
  let lastName = ""
  let orgFallback = ""
  let websiteFallback = ""
  let xFallback = ""
  let phoneFallback = ""

  headerMap.forEach((canonical, idx) => {
    if (!canonical) return
    const val = values[idx]?.trim() ?? ""
    if (!val) return

    switch (canonical) {
      case "_first_name": firstName = val; break
      case "_last_name": lastName = val; break
      case "_org_fallback": orgFallback = val; break
      case "_website_fallback": if (!websiteFallback) websiteFallback = val; break
      case "_x_fallback": if (!xFallback) xFallback = val; break
      case "_phone_fallback": if (!phoneFallback) phoneFallback = val; break
      case "_description": {
        if (!contact.notes && isEnglishLike(val)) {
          // Take first 500 chars; stop at a sentence boundary if possible
          let snippet = val.slice(0, 500)
          const lastDot = snippet.lastIndexOf(".")
          if (lastDot > 200) snippet = snippet.slice(0, lastDot + 1)
          contact.notes = snippet.trim()
        }
        break
      }
      case "_keywords": {
        try {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed)) {
            // Deduplicate (Apollo sometimes triplicates entries)
            const deduped = [...new Set((parsed as string[]).map((k) => k.toLowerCase().trim()))]
            if (!contact.tags) contact.tags = deduped
          }
        } catch { /* malformed JSON — skip */ }
        break
      }
      case "tags": {
        if (!contact.tags) contact.tags = val.split("|").map((t) => t.trim())
        break
      }
      case "email": {
        // Skip placeholder values from Apollo
        const lower = val.toLowerCase()
        if (lower !== "unavailable" && lower !== "n/a" && lower !== "none") {
          // Basic syntax guard — reject malformed addresses before Reoon submission
          if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lower)) {
            contact.email = lower
          }
        }
        break
      }
      default: {
        if (!canonical.startsWith("_")) {
          // Don't overwrite a field already set by a higher-priority column
          if (!contact[canonical]) contact[canonical] = val
        }
      }
    }
  })

  // Resolve name
  if (!contact.name && (firstName || lastName)) {
    contact.name = [firstName, lastName].filter(Boolean).join(" ")
  }

  // Fallbacks for optional fields
  if (!contact.organisation && orgFallback) contact.organisation = orgFallback
  if (!contact.website && websiteFallback) contact.website = websiteFallback
  if (!contact.x_url && xFallback) contact.x_url = xFallback
  if (!contact.phone && phoneFallback) contact.phone = phoneFallback

  // Normalise linkedin_url: lowercase, strip trailing slash
  if (typeof contact.linkedin_url === "string") {
    const cleaned = contact.linkedin_url.toLowerCase().replace(/\/$/, "").trim()
    contact.linkedin_url = cleaned || null
  }

  // ── Field normalisation ────────────────────────────────────────────────

  // Person name: normalise casing (ALL-CAPS / all-lower → title case)
  if (typeof contact.name === "string") {
    contact.name = normaliseName(contact.name)
  }

  // Organisation: fix errant all-caps words, lowercase prepositions mid-name
  if (typeof contact.organisation === "string") {
    contact.organisation = normaliseOrganisation(contact.organisation)
  }

  // Country: resolve known aliases ("Tuerkiye" → "Turkey" etc.)
  if (typeof contact.country === "string") {
    contact.country = normaliseCountry(contact.country)
  }

  // Phone: strip "ext XXXX" company switchboard suffixes
  if (typeof contact.phone === "string") {
    contact.phone = normalisePhone(contact.phone)
  }

  // Translate non-English job titles, then normalise casing
  if (typeof contact.role === "string") {
    contact.role = cleanRole(contact.role)
  }

  // ── Data confidence ────────────────────────────────────────────────────

  // LinkedIn-obfuscated names ("Dominic M.", "Lea F.") — last name is a single
  // initial with a dot, meaning the profile was privacy-protected at scrape time.
  // Flag with a reduced confidence score so these can be filtered/reviewed.
  if (
    typeof contact.name === "string" &&
    /\b[A-Z]\.$/.test(contact.name.trim())
  ) {
    contact.data_confidence_score = 30
  }

  // ── Compute has_* contact-method flags ────────────────────────────────
  contact.has_email = typeof contact.email === "string"
  contact.has_phone = typeof contact.phone === "string"
  contact.has_linkedin = typeof contact.linkedin_url === "string"

  // Contacts without an email have nothing to verify — publish immediately
  if (!contact.email) {
    contact.import_status = "imported"
    contact.visibility_status = "published"
  }

  return contact
}

// Fields updated on existing contacts when import_mode=update
const UPDATABLE_FIELDS = [
  "role", "organisation", "city", "country", "region",
  "phone", "linkedin_url", "x_url", "instagram_url", "website",
  "email", "level", "category",
]

type ExistingContact = {
  id: string
  name?: string | null
  email: string | null
  linkedin_url: string | null
  role: string | null
  organisation: string | null
}

type MatchType = "new" | "suppressed" | "email_match" | "linkedin_match" | "name_org_match"

interface ContactEntry {
  contact: Record<string, unknown>
  rowNumber: number
  rawData: Record<string, string>
  matchType: MatchType
  matchReason: string
  existingContact?: ExistingContact
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file")
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // import_mode: 'skip' (default) = ignore duplicates; 'update' = update mutable fields on match
  const importMode = formData.get("import_mode") === "update" ? "update" : "skip"

  // Chunked-upload fields
  const importIdParam = formData.get("import_id") as string | null
  const totalRowsParam = formData.get("total_rows") as string | null
  const isLastChunk = formData.get("is_last_chunk") !== "false" // default true for single-chunk uploads
  const accSuccessful = parseInt((formData.get("acc_successful") as string) ?? "0", 10) || 0
  const accUpdated    = parseInt((formData.get("acc_updated")    as string) ?? "0", 10) || 0
  const accFailed     = parseInt((formData.get("acc_failed")     as string) ?? "0", 10) || 0
  const accDuplicates = parseInt((formData.get("acc_duplicates") as string) ?? "0", 10) || 0
  const accSuppressed = parseInt((formData.get("acc_suppressed") as string) ?? "0", 10) || 0

  const text = await (file as File).text()
  const lines = splitCSVRecords(text)
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 })
  }

  // Normalize headers: lowercase, replace spaces/hyphens with underscores, strip non-alphanum
  const rawHeaders = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[\s\-]+/g, "_").replace(/[^a-z_]/g, "")
  )

  const headerMap: Array<string | null> = rawHeaders.map((h) => COLUMN_MAP[h] ?? null)

  // Need at least one of: name, full_name, first_name, last_name
  const hasNameField = headerMap.some(
    (c) => c === "name" || c === "_first_name" || c === "_last_name"
  )
  if (!hasNameField) {
    return NextResponse.json(
      { error: 'CSV must have a name column (e.g. "Full Name", "First Name"/"Last Name")' },
      { status: 400 }
    )
  }

  const dataLines = lines.slice(1).filter((l) => l.trim())
  const totalRows = dataLines.length

  // Reuse an existing import record (chunked upload) or create a new one
  let importId: string
  if (importIdParam) {
    importId = importIdParam
  } else {
    const reportedTotal = totalRowsParam ? (parseInt(totalRowsParam, 10) || totalRows) : totalRows
    const { data: importRecord, error: importErr } = await supabase
      .from("csv_imports")
      .insert({
        admin_user_id: user.id,
        filename: (file as File).name,
        status: "processing",
        total_rows: reportedTotal,
        import_mode: importMode,
      })
      .select("id")
      .single()

    if (importErr || !importRecord) {
      return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
    }
    importId = importRecord.id
  }
  let successfulRows = 0
  let updatedRows = 0
  let failedRows = 0
  let duplicatesSkipped = 0
  let suppressedRows = 0
  const errors: Array<{ row: number; message: string }> = []

  const BATCH_SIZE = 2000
  for (let batchStart = 0; batchStart < dataLines.length; batchStart += BATCH_SIZE) {
    const batch = dataLines.slice(batchStart, batchStart + BATCH_SIZE)
    const entries: ContactEntry[] = []
    const rowInserts: Array<{
      csv_import_id: string; row_number: number; raw_data: Record<string, string>;
      status: string; error_message?: string; contact_id?: string | null
    }> = []

    // ── Build contacts from CSV rows ──────────────────────────────────────────
    for (let i = 0; i < batch.length; i++) {
      const rowNumber = batchStart + i + 1
      const values = parseCSVLine(batch[i])
      const raw: Record<string, string> = {}
      rawHeaders.forEach((h, idx) => { raw[h] = values[idx] ?? "" })

      const contact = buildContact(headerMap, rawHeaders, values)
      const name = contact.name as string | undefined

      if (!name?.trim()) {
        failedRows++
        errors.push({ row: rowNumber, message: "Missing required field: name" })
        rowInserts.push({
          csv_import_id: importId, row_number: rowNumber, raw_data: raw,
          status: "error", error_message: "Missing required field: name",
        })
        continue
      }

      entries.push({ contact, rowNumber, rawData: raw, matchType: "new", matchReason: "" })
    }

    if (entries.length === 0) {
      if (rowInserts.length > 0) await supabase.from("csv_import_rows").insert(rowInserts)
      continue
    }

    // ── Signal 1: Email suppression blacklist ─────────────────────────────────
    const allEmails = entries
      .map(e => (e.contact.email as string | undefined)?.toLowerCase())
      .filter((e): e is string => !!e)

    let suppressedEmailSet = new Set<string>()
    if (allEmails.length > 0) {
      const { data: suppressed } = await supabase
        .from("email_suppressions")
        .select("email")
        .in("email", allEmails)
      suppressedEmailSet = new Set((suppressed ?? []).map(s => s.email.toLowerCase()))
    }

    // ── Signal 2: Existing contacts by email ─────────────────────────────────
    const nonSuppressedEmails = allEmails.filter(e => !suppressedEmailSet.has(e))
    const emailToExisting = new Map<string, ExistingContact>()
    if (nonSuppressedEmails.length > 0) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id, email, linkedin_url, role, organisation")
        .in("email", nonSuppressedEmails)
      for (const c of existing ?? []) {
        if (c.email) emailToExisting.set(c.email.toLowerCase(), c as ExistingContact)
      }
    }

    // ── Signal 3: Existing contacts by LinkedIn URL ───────────────────────────
    // Only for entries not already matched by email
    const linkedinUrls = entries
      .filter(e => {
        const email = (e.contact.email as string | undefined)?.toLowerCase()
        return e.contact.linkedin_url && (!email || !emailToExisting.has(email))
      })
      .map(e => (e.contact.linkedin_url as string).toLowerCase())
      .filter((v, i, a) => v && a.indexOf(v) === i)

    const linkedinToExisting = new Map<string, ExistingContact>()
    if (linkedinUrls.length > 0) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id, email, linkedin_url, role, organisation")
        .in("linkedin_url", linkedinUrls)
      for (const c of existing ?? []) {
        if (c.linkedin_url) linkedinToExisting.set(c.linkedin_url.toLowerCase(), c as ExistingContact)
      }
    }

    // ── Classify each entry (email → linkedin → name+org → new) ──────────────
    for (const entry of entries) {
      const email = (entry.contact.email as string | undefined)?.toLowerCase()
      const linkedin = (entry.contact.linkedin_url as string | undefined)?.toLowerCase()

      if (email && suppressedEmailSet.has(email)) {
        entry.matchType = "suppressed"
        entry.matchReason = `Suppressed email: ${email}`
      } else if (email && emailToExisting.has(email)) {
        entry.matchType = "email_match"
        entry.matchReason = `Duplicate email: ${email}`
        entry.existingContact = emailToExisting.get(email)
      } else if (linkedin && linkedinToExisting.has(linkedin)) {
        entry.matchType = "linkedin_match"
        entry.matchReason = `Duplicate LinkedIn: ${linkedin}`
        entry.existingContact = linkedinToExisting.get(linkedin)
      }
      // name+org match handled below (requires individual queries)
    }

    // ── Signal 4: Name + organisation — batched OR lookup ───────────────────────
    // Replaces N sequential round-trips with ceil(uniqueNames/100) queries.
    // Fetch by name in bulk, then match organisation in memory.
    const nameOrgEntries = entries.filter(e => {
      if (e.matchType !== "new") return false
      const n = (e.contact.name as string | undefined)?.trim()
      const o = (e.contact.organisation as string | undefined)?.trim()
      return !!(n && o)
    })
    if (nameOrgEntries.length > 0) {
      // Names containing PostgREST OR-filter breaking chars are skipped (very rare in contact data)
      const safeForFilter = (s: string) => !/[(),]/.test(s)
      const uniqueNames = [
        ...new Set(nameOrgEntries.map(e => (e.contact.name as string).trim()).filter(safeForFilter))
      ]
      const nameToContacts = new Map<string, ExistingContact[]>()
      const NAME_OR_BATCH = 100
      for (let ni = 0; ni < uniqueNames.length; ni += NAME_OR_BATCH) {
        const nameBatch = uniqueNames.slice(ni, ni + NAME_OR_BATCH)
        const orFilter = nameBatch.map(n => `name.ilike.${n}`).join(",")
        const { data: candidates } = await supabase
          .from("contacts")
          .select("id, name, email, linkedin_url, role, organisation")
          .or(orFilter)
        for (const c of (candidates ?? [])) {
          const key = (c.name as string | null)?.toLowerCase()
          if (!key) continue
          if (!nameToContacts.has(key)) nameToContacts.set(key, [])
          nameToContacts.get(key)!.push(c as ExistingContact)
        }
      }
      for (const entry of nameOrgEntries) {
        const name = (entry.contact.name as string).trim()
        const org = (entry.contact.organisation as string).trim()
        const candidates = nameToContacts.get(name.toLowerCase()) ?? []
        const match = candidates.find(c => c.organisation?.toLowerCase() === org.toLowerCase())
        if (match) {
          entry.matchType = "name_org_match"
          entry.matchReason = `Duplicate name+org: ${name} @ ${org}`
          entry.existingContact = match
        }
      }
    }

    // ── Separate: new inserts vs duplicates/suppressions ─────────────────────
    const toInsert: ContactEntry[] = []
    const toUpdate: ContactEntry[] = []

    for (const entry of entries) {
      if (entry.matchType === "suppressed") {
        suppressedRows++
        rowInserts.push({
          csv_import_id: importId, row_number: entry.rowNumber, raw_data: entry.rawData,
          status: "suppressed", error_message: entry.matchReason,
        })
      } else if (entry.matchType === "new") {
        toInsert.push(entry)
        rowInserts.push({
          csv_import_id: importId, row_number: entry.rowNumber, raw_data: entry.rawData,
          status: "pending",
        })
      } else if (importMode === "update" && entry.existingContact) {
        toUpdate.push(entry)
        rowInserts.push({
          csv_import_id: importId, row_number: entry.rowNumber, raw_data: entry.rawData,
          status: "pending", contact_id: entry.existingContact.id,
        })
      } else {
        duplicatesSkipped++
        rowInserts.push({
          csv_import_id: importId, row_number: entry.rowNumber, raw_data: entry.rawData,
          status: "duplicate", error_message: entry.matchReason,
        })
      }
    }

    // ── Bulk insert new contacts ──────────────────────────────────────────────
    if (toInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: bulkErr } = await (supabase.from("contacts") as any)
        .insert(toInsert.map(e => e.contact))
        .select("id")
      if (bulkErr) {
        failedRows += toInsert.length
        for (const entry of toInsert) {
          const rowInsert = rowInserts.find(r => r.row_number === entry.rowNumber && r.status === "pending")
          if (rowInsert) { rowInsert.status = "error"; rowInsert.error_message = bulkErr.message }
          errors.push({ row: entry.rowNumber, message: bulkErr.message })
        }
      } else {
        successfulRows += toInsert.length
        const ids: Array<{ id: string }> = inserted ?? []
        toInsert.forEach((entry, i) => {
          const rowInsert = rowInserts.find(r => r.row_number === entry.rowNumber && r.status === "pending")
          if (rowInsert) { rowInsert.status = "success"; rowInsert.contact_id = ids[i]?.id ?? null }
        })
      }
    }

    // ── Update existing contacts (import_mode=update) ─────────────────────────
    if (toUpdate.length > 0) {
      // Build a row-number → rowInsert map to avoid O(n²) .find() inside parallel callbacks
      const rowInsertByRow = new Map(rowInserts.map(r => [r.row_number, r]))

      // Batch all role-history inserts into a single DB call
      const historyInserts: Array<Record<string, unknown>> = []
      for (const entry of toUpdate) {
        const existing = entry.existingContact!
        const newRole = entry.contact.role as string | undefined
        const newOrg = entry.contact.organisation as string | undefined
        if ((newRole && newRole !== existing.role) || (newOrg && newOrg !== existing.organisation)) {
          historyInserts.push({
            contact_id: existing.id,
            role: existing.role,
            organisation: existing.organisation,
            source: "csv_import",
            import_id: importId,
          })
        }
      }
      if (historyInserts.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("contact_role_history") as any).insert(historyInserts)
      }

      // Parallel updates — JS is single-threaded so counter mutations at await boundaries are safe
      await Promise.all(toUpdate.map(async (entry) => {
        const existing = entry.existingContact!
        const rowInsert = rowInsertByRow.get(entry.rowNumber)
        const updatePayload: Record<string, unknown> = {}
        for (const field of UPDATABLE_FIELDS) {
          const val = entry.contact[field]
          if (val !== undefined && val !== null && val !== "") updatePayload[field] = val
        }
        if (Object.keys(updatePayload).length === 0) {
          updatedRows++
          if (rowInsert) rowInsert.status = "updated"
          return
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (supabase.from("contacts") as any)
          .update(updatePayload)
          .eq("id", existing.id)
        if (updateErr) {
          failedRows++
          if (rowInsert) { rowInsert.status = "error"; rowInsert.error_message = updateErr.message }
          errors.push({ row: entry.rowNumber, message: updateErr.message })
        } else {
          updatedRows++
          if (rowInsert) rowInsert.status = "updated"
        }
      }))
    }

    await supabase.from("csv_import_rows").insert(rowInserts)
  }

  if (isLastChunk) {
    await supabase.from("csv_imports").update({
      status: "completed",
      successful_rows: successfulRows + accSuccessful,
      updated_rows: updatedRows + accUpdated,
      failed_rows: failedRows + accFailed,
      suppressed_rows: suppressedRows + accSuppressed,
      completed_at: new Date().toISOString(),
    }).eq("id", importId)
  }

  return NextResponse.json({
    importId,
    chunkSuccessful: successfulRows,
    chunkUpdated: updatedRows,
    chunkFailed: failedRows,
    chunkDuplicatesSkipped: duplicatesSkipped,
    chunkSuppressed: suppressedRows,
    errors: errors.slice(0, 50),
  })
}
