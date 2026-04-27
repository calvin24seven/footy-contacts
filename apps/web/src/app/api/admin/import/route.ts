import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// CSV column aliases → canonical contact field names
const COLUMN_MAP: Record<string, string> = {
  name: "name",
  full_name: "name",
  contact_name: "name",
  role: "role",
  job_title: "role",
  position: "role",
  organisation: "organisation",
  organization: "organisation",
  club: "organisation",
  company: "organisation",
  category: "category",
  type: "category",
  country: "country",
  city: "city",
  region: "region",
  level: "level",
  email: "email",
  email_address: "email",
  phone: "phone",
  phone_number: "phone",
  mobile: "phone",
  website: "website",
  linkedin_url: "linkedin_url",
  linkedin: "linkedin_url",
  x_url: "x_url",
  twitter: "x_url",
  instagram_url: "instagram_url",
  instagram: "instagram_url",
  source: "source",
  notes: "notes",
  tags: "tags",
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()

  // Auth check — must be admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parse file
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

  const rawHeaders = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z_]/g, "")
  )

  // Map headers to canonical names
  const headerMap: Array<string | null> = rawHeaders.map(
    (h) => COLUMN_MAP[h] ?? null
  )

  const nameIdx = headerMap.indexOf("name")
  if (nameIdx === -1) {
    return NextResponse.json(
      { error: 'CSV must have a "name" column' },
      { status: 400 }
    )
  }

  const dataLines = lines.slice(1)
  const totalRows = dataLines.length

  // Create import record
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
    return NextResponse.json(
      { error: "Failed to create import record" },
      { status: 500 }
    )
  }

  const importId = importRecord.id
  let successfulRows = 0
  let failedRows = 0
  const errors: Array<{ row: number; message: string }> = []

  // Process in batches of 500
  const BATCH_SIZE = 500
  for (let batchStart = 0; batchStart < dataLines.length; batchStart += BATCH_SIZE) {
    const batch = dataLines.slice(batchStart, batchStart + BATCH_SIZE)
    const contactInserts: Array<Record<string, unknown>> = []
    const rowInserts: Array<{
      csv_import_id: string
      row_number: number
      raw_data: Record<string, string>
      status: string
      error_message?: string
    }> = []

    for (let i = 0; i < batch.length; i++) {
      const rowNumber = batchStart + i + 1
      const values = parseCSVLine(batch[i])
      const raw: Record<string, string> = {}
      rawHeaders.forEach((h, idx) => {
        raw[h] = values[idx] ?? ""
      })

      const name = values[nameIdx]?.trim()
      if (!name) {
        failedRows++
        errors.push({ row: rowNumber, message: "Missing required field: name" })
        rowInserts.push({
          csv_import_id: importId,
          row_number: rowNumber,
          raw_data: raw,
          status: "error",
          error_message: "Missing required field: name",
        })
        continue
      }

      // Build contact object from mapped columns
      const contact: Record<string, unknown> = {
        visibility_status: "published",
        suppression_status: "active",
        source: "csv_import",
      }
      headerMap.forEach((canonical, idx) => {
        if (!canonical) return
        const val = values[idx]?.trim()
        if (!val) return
        if (canonical === "tags") {
          contact[canonical] = val.split("|").map((t) => t.trim())
        } else {
          contact[canonical] = val
        }
      })

      contactInserts.push(contact)
      rowInserts.push({
        csv_import_id: importId,
        row_number: rowNumber,
        raw_data: raw,
        status: "pending",
      })
    }

    if (contactInserts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: bulkErr } = await (supabase.from("contacts") as any).insert(contactInserts)

      if (bulkErr) {
        // If batch fails, mark all as failed
        failedRows += contactInserts.length
        rowInserts.forEach((r) => {
          if (r.status === "pending") {
            r.status = "error"
            r.error_message = bulkErr.message
            errors.push({ row: r.row_number, message: bulkErr.message })
          }
        })
      } else {
        successfulRows += contactInserts.length
        rowInserts.forEach((r) => {
          if (r.status === "pending") r.status = "success"
        })
      }
    }

    // Log rows
    await supabase.from("csv_import_rows").insert(rowInserts)
  }

  // Update import record
  await supabase
    .from("csv_imports")
    .update({
      status: failedRows === totalRows ? "failed" : "completed",
      successful_rows: successfulRows,
      failed_rows: failedRows,
      completed_at: new Date().toISOString(),
    })
    .eq("id", importId)

  return NextResponse.json({
    importId,
    totalRows,
    successfulRows,
    failedRows,
    errors: errors.slice(0, 50), // cap at 50 for response size
  })
}
