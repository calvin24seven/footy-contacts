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

// Basic non-English job title translations (common in European football data)
const ROLE_TRANSLATIONS: Record<string, string> = {
  "operaio": "Operational Staff",
  "impiegato": "Administrative Staff",
  "responsable": "Manager",
  "responsabile": "Manager",
  "directeur": "Director",
  "directeur général": "General Director",
  "directeur sportif": "Sporting Director",
  "entraîneur": "Coach",
  "entrenador": "Coach",
  "preparador físico": "Fitness Coach",
  "director deportivo": "Sporting Director",
  "director general": "General Director",
  "secretario": "Secretary",
  "presidente": "President",
  "vicepresidente": "Vice President",
  "geschäftsführer": "Managing Director",
  "trainer": "Coach",
  "cheftrainer": "Head Coach",
  "sportdirektor": "Sporting Director",
  "direttore sportivo": "Sporting Director",
  "allenatore": "Coach",
  "preparatore atletico": "Fitness Coach",
  "addetto stampa": "Press Officer",
}

function cleanRole(role: string): string {
  const lower = role.toLowerCase().trim()
  if (ROLE_TRANSLATIONS[lower]) return ROLE_TRANSLATIONS[lower]
  for (const [key, val] of Object.entries(ROLE_TRANSLATIONS)) {
    if (lower.startsWith(key + " ")) return val + role.slice(key.length)
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

function buildContact(
  headerMap: Array<string | null>,
  rawHeaders: string[],
  values: string[]
): Record<string, unknown> {
  const contact: Record<string, unknown> = {
    visibility_status: "published",
    suppression_status: "active",
    source: "csv_import",
  }

  let firstName = ""
  let lastName = ""
  let orgFallback = ""
  let websiteFallback = ""
  let xFallback = ""
  let phoneFallback = ""
  let emailStatus = ""

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
      case "_email_status": emailStatus = val.toLowerCase(); break
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
          contact.email = val.toLowerCase()
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

  // Email status → verified_status; if unavailable, clear email
  if (emailStatus === "verified") {
    contact.verified_status = "verified"
  } else if (emailStatus === "unavailable" || emailStatus === "catch_all" || emailStatus === "invalid") {
    contact.email = null
    contact.verified_status = "unverified"
  }

  // Translate non-English job titles
  if (typeof contact.role === "string") {
    contact.role = cleanRole(contact.role)
  }

  return contact
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

  const text = await (file as File).text()
  const lines = text.trim().split(/\r?\n/)
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

  const { data: importRecord, error: importErr } = await supabase
    .from("csv_imports")
    .insert({
      admin_user_id: user.id,
      filename: (file as File).name,
      status: "processing",
      total_rows: totalRows,
    })
    .select("id")
    .single()

  if (importErr || !importRecord) {
    return NextResponse.json({ error: "Failed to create import record" }, { status: 500 })
  }

  const importId = importRecord.id
  let successfulRows = 0
  let failedRows = 0
  let duplicatesSkipped = 0
  const errors: Array<{ row: number; message: string }> = []

  const BATCH_SIZE = 500
  for (let batchStart = 0; batchStart < dataLines.length; batchStart += BATCH_SIZE) {
    const batch = dataLines.slice(batchStart, batchStart + BATCH_SIZE)
    const contactInserts: Array<Record<string, unknown>> = []
    const rowInserts: Array<{
      csv_import_id: string; row_number: number; raw_data: Record<string, string>;
      status: string; error_message?: string
    }> = []

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

      contactInserts.push(contact)
      rowInserts.push({ csv_import_id: importId, row_number: rowNumber, raw_data: raw, status: "pending" })
    }

    if (contactInserts.length > 0) {
      // Duplicate detection: check emails that already exist in contacts
      const emailsToCheck = contactInserts
        .map((c) => c.email as string | undefined)
        .filter((e): e is string => !!e)

      let existingEmails = new Set<string>()
      if (emailsToCheck.length > 0) {
        const { data: existing } = await supabase
          .from("contacts")
          .select("email")
          .in("email", emailsToCheck)
        existingEmails = new Set((existing ?? []).map((c) => (c.email as string).toLowerCase()))
      }

      const uniqueInserts: Array<Record<string, unknown>> = []
      const pendingRowInserts = rowInserts.filter((r) => r.status === "pending")
      let dupeIdx = 0

      for (const contact of contactInserts) {
        const email = (contact.email as string | undefined)?.toLowerCase()
        if (email && existingEmails.has(email)) {
          // Mark this row as duplicate
          const rowInsert = pendingRowInserts[dupeIdx]
          if (rowInsert) {
            rowInsert.status = "duplicate"
            rowInsert.error_message = `Duplicate email: ${email}`
          }
          failedRows++
          errors.push({ row: batchStart + dupeIdx + 1, message: `Duplicate email: ${email}` })
          duplicatesSkipped++
        } else {
          uniqueInserts.push(contact)
        }
        dupeIdx++
      }

      if (uniqueInserts.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: bulkErr } = await (supabase.from("contacts") as any).insert(uniqueInserts)
        if (bulkErr) {
          failedRows += uniqueInserts.length
          rowInserts.forEach((r) => {
            if (r.status === "pending") {
              r.status = "error"
              r.error_message = bulkErr.message
              errors.push({ row: r.row_number, message: bulkErr.message })
            }
          })
        } else {
          successfulRows += uniqueInserts.length
          rowInserts.forEach((r) => { if (r.status === "pending") r.status = "success" })
        }
      } else {
        // All were duplicates — mark any remaining pending as duplicate
        rowInserts.forEach((r) => { if (r.status === "pending") r.status = "duplicate" })
      }
    }

    await supabase.from("csv_import_rows").insert(rowInserts)
  }

  await supabase.from("csv_imports").update({
    status: failedRows === totalRows ? "failed" : "completed",
    successful_rows: successfulRows,
    failed_rows: failedRows,
    completed_at: new Date().toISOString(),
  }).eq("id", importId)

  return NextResponse.json({ importId, totalRows, successfulRows, failedRows, duplicatesSkipped, errors: errors.slice(0, 50) })
}
